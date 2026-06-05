const axios = require('axios');
const NodeCache = require('node-cache');

// Cache transport data for 24 hours (86400 seconds)
// Road distances don't change — long TTL is safe
const transportCache = new NodeCache({ stdTTL: 86400 });

// ============================================================
// OSRM (Open Source Routing Machine)
// Free routing engine — gives real road distance + driving time
// Public demo server: router.project-osrm.org
// Returns: distance (meters), duration (seconds)
// ============================================================
const getRoadDistance = async (fromLat, fromLng, toLat, toLng) => {
  const cacheKey = `road_${fromLat.toFixed(2)}_${fromLng.toFixed(2)}_${toLat.toFixed(2)}_${toLng.toFixed(2)}`;

  const cached = transportCache.get(cacheKey);
  if (cached) {
    console.log(`Cache HIT: road distance ${cacheKey}`);
    return cached;
  }

  try {
    // OSRM uses lng,lat order (not lat,lng!)
    const url = `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=false`;

    const response = await axios.get(url, { timeout: 5000 });

    if (response.data.code !== 'Ok' || !response.data.routes.length) {
      return null;
    }

    const route = response.data.routes[0];
    const result = {
      roadDistanceKm: Math.round(route.distance / 1000),  // meters → km
      drivingTimeMinutes: Math.round(route.duration / 60)  // seconds → minutes
    };

    transportCache.set(cacheKey, result);
    console.log(`Cache MISS: fetched road distance — ${result.roadDistanceKm}km, ${result.drivingTimeMinutes}min`);
    return result;

  } catch (error) {
    console.error('OSRM fetch failed:', error.message);
    return null; // Graceful fallback — scoring will use Haversine
  }
};

// ============================================================
// INDIA-SPECIFIC FARE FORMULAS
//
// These are approximate rates based on 2024-25 Indian pricing:
//   Train (Sleeper): ~₹1.0/km  |  Train (3AC): ~₹2.2/km
//   Bus (State):     ~₹1.5/km  |  Bus (Volvo): ~₹2.8/km
//   Flight:          base ₹2500 + ~₹3.5/km (for distances > 400km)
//   Cab (sedan):     ~₹11/km   |  Cab (SUV):  ~₹14/km
//
// We return a range (min/max) for each mode so the UI can
// show "₹800 – ₹1,500" instead of a single number.
// ============================================================
const calculateFares = (distanceKm) => {
  const fares = {};

  // TRAIN — available for most distances, impractical under 50km
  if (distanceKm >= 50) {
    const sleeperRate = 1.0;
    const acRate = 2.2;
    fares.train = {
      available: true,
      minFare: Math.round(distanceKm * sleeperRate),
      maxFare: Math.round(distanceKm * acRate),
      estimatedTime: Math.round(distanceKm / 55 * 60), // avg 55 km/h for Indian trains
      label: 'Sleeper – 3AC'
    };
  } else {
    fares.train = { available: false, reason: 'Too short for train travel' };
  }

  // BUS — available for most distances, impractical over 1500km
  if (distanceKm >= 20 && distanceKm <= 1500) {
    const stateRate = 1.5;
    const volvoRate = 2.8;
    fares.bus = {
      available: true,
      minFare: Math.round(distanceKm * stateRate),
      maxFare: Math.round(distanceKm * volvoRate),
      estimatedTime: Math.round(distanceKm / 40 * 60), // avg 40 km/h for buses
      label: 'State Bus – Volvo'
    };
  } else {
    fares.bus = {
      available: false,
      reason: distanceKm < 20 ? 'Too short for bus' : 'Too far for bus travel'
    };
  }

  // FLIGHT — only practical for distances > 300km
  if (distanceKm >= 300) {
    const baseFare = 2500;
    const perKmRate = 3.5;
    const minFare = Math.round(baseFare + distanceKm * (perKmRate * 0.7));
    const maxFare = Math.round(baseFare + distanceKm * (perKmRate * 1.3));
    fares.flight = {
      available: true,
      minFare,
      maxFare,
      estimatedTime: Math.round(distanceKm / 700 * 60 + 90), // flight speed + 90 min airport time
      label: 'Economy'
    };
  } else {
    fares.flight = { available: false, reason: 'Too short for flight' };
  }

  // CAB — always available, but expensive for long distances
  const sedanRate = 11;
  const suvRate = 14;
  fares.cab = {
    available: true,
    minFare: Math.round(distanceKm * sedanRate),
    maxFare: Math.round(distanceKm * suvRate),
    estimatedTime: Math.round(distanceKm / 50 * 60), // avg 50 km/h by road
    label: 'Sedan – SUV'
  };

  return fares;
};

// ============================================================
// MASTER FUNCTION
// Gets road distance from OSRM, then calculates fares
// Returns: { roadDistanceKm, drivingTimeMinutes, fares }
// ============================================================
const getTransportOptions = async (fromLat, fromLng, toLat, toLng) => {
  const roadData = await getRoadDistance(fromLat, fromLng, toLat, toLng);

  if (!roadData) {
    // Fallback to straight-line estimate (multiply by 1.3 for road factor)
    const R = 6371;
    const dLat = (toLat - fromLat) * (Math.PI / 180);
    const dLng = (toLng - fromLng) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos(fromLat * Math.PI / 180) * Math.cos(toLat * Math.PI / 180) *
      Math.sin(dLng / 2) ** 2;
    const straightLine = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const estimatedRoad = Math.round(straightLine * 1.3); // road factor

    return {
      roadDistanceKm: estimatedRoad,
      drivingTimeMinutes: Math.round(estimatedRoad / 50 * 60),
      isEstimated: true, // Flag that this is not from OSRM
      fares: calculateFares(estimatedRoad)
    };
  }

  return {
    roadDistanceKm: roadData.roadDistanceKm,
    drivingTimeMinutes: roadData.drivingTimeMinutes,
    isEstimated: false,
    fares: calculateFares(roadData.roadDistanceKm)
  };
};

// Get the best fare for user's selected travel mode
const getBestFareForMode = (fares, travelMode, roadDistanceKm) => {
  if (travelMode === 'any' || !travelMode) {
    // Pick cheapest available mode
    const available = Object.entries(fares)
      .filter(([_, f]) => f.available)
      .map(([mode, f]) => ({ mode, fare: f.minFare }))
      .sort((a, b) => a.fare - b.fare);
    return available.length > 0 ? available[0].fare : roadDistanceKm * 2; // fallback
  }

  const modeData = fares[travelMode];
  if (modeData && modeData.available) {
    return Math.round((modeData.minFare + modeData.maxFare) / 2); // avg fare
  }

  // Mode not available — fallback to cheapest
  const available = Object.entries(fares)
    .filter(([_, f]) => f.available)
    .map(([mode, f]) => ({ mode, fare: f.minFare }))
    .sort((a, b) => a.fare - b.fare);
  return available.length > 0 ? available[0].fare : roadDistanceKm * 2;
};

module.exports = { getTransportOptions, getBestFareForMode, calculateFares };
