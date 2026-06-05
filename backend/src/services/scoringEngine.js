const { getBestFareForMode } = require('./transportService');

// ============================================================
// HAVERSINE FORMULA (kept as fallback)
// Calculates straight-line distance between two GPS points
// ============================================================
const haversineDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
    Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// D1: Distance Score (weight: 20%)
// Now uses REAL road distance from OSRM (falls back to Haversine)
const calcDistanceScore = (distanceKm, days) => {
  const maxDistance = days * 600;
  if (distanceKm > maxDistance) return 0;
  return Math.max(0, 100 - (distanceKm / maxDistance) * 100);
};

// D2: Budget Score (weight: 25%)
// NOW uses real transport fare based on selected mode instead of static cost
const calcBudgetScore = (destination, budget, days, transportFare) => {
  const dailyCost = destination.estimatedCostPerDay * days;
  const totalCost = dailyCost + transportFare;
  if (totalCost > budget) return 0;
  const utilized = totalCost / budget;
  if (utilized >= 0.5 && utilized <= 0.9) return 100;
  if (utilized < 0.5) return 60 + (utilized * 40);
  return 100 - ((utilized - 0.9) * 200);
};

// D3: Duration Fit Score (weight: 15%)
const calcDurationScore = (destination, days) => {
  if (days < destination.minDays) return 0;
  if (days >= destination.recommendedDays) return 100;
  return Math.round((days / destination.recommendedDays) * 100);
};

// D4: Weather Score (weight: 15%)
const calcWeatherScore = (weatherData) => {
  if (!weatherData) return 60;
  const { temp, humidity, weatherMain } = weatherData;
  let score = 60;
  if (temp >= 15 && temp <= 28) score += 25;
  else if (temp >= 10 && temp <= 35) score += 10;
  else if (temp < 5 || temp > 42) score -= 20;

  const goodWeather = ['Clear', 'Clouds'];
  const badWeather = ['Thunderstorm', 'Tornado'];
  if (goodWeather.includes(weatherMain)) score += 15;
  else if (badWeather.includes(weatherMain)) score -= 25;
  else if (weatherMain === 'Rain') score -= 5;

  return Math.min(100, Math.max(0, score));
};

// D5: Seasonal Fit Score (weight: 10%)
const calcSeasonalScore = (destination) => {
  const currentMonth = new Date().getMonth() + 1;
  if (destination.bestMonths.includes(currentMonth)) return 100;
  const prev = currentMonth === 1 ? 12 : currentMonth - 1;
  const next = currentMonth === 12 ? 1 : currentMonth + 1;
  if (destination.bestMonths.includes(prev) || destination.bestMonths.includes(next)) return 65;
  return 20;
};

// D6: Popularity Score (weight: 5%)
const calcPopularityScore = (destination) => {
  return (destination.popularityScore / 10) * 100;
};

// D7: Preference Match Score (weight: 5%)
const calcPreferenceScore = (destination, preferences) => {
  if (!preferences || preferences.length === 0) return 70;
  const matches = preferences.filter(p => destination.tags.includes(p)).length;
  if (matches === 0) return 30;
  return Math.min(100, (matches / preferences.length) * 100 + 20);
};

// D8: Accessibility Score (weight: 5%)
// NOW checks if user's selected mode is actually available via fare data
const calcAccessibilityScore = (destination, travelMode, fares) => {
  if (!travelMode || travelMode === 'any') return 80;

  // Use real fare data to check availability
  if (fares && fares[travelMode]) {
    return fares[travelMode].available ? 100 : 25;
  }

  // Fallback to static transportOptions
  return destination.transportOptions[travelMode] ? 100 : 25;
};

// ============================================================
// MASTER SCORING FUNCTION
// Now accepts transportData from OSRM for real distances + fares
// ============================================================
const scoreDestination = (destination, userConstraints, weatherData, transportData) => {
  const { userLat, userLng, days, budget, preferences, travelMode } = userConstraints;

  // Use OSRM road distance if available, else Haversine
  const destLng = destination.location.coordinates[0];
  const destLat = destination.location.coordinates[1];

  let distanceKm;
  let fares = null;

  if (transportData) {
    distanceKm = transportData.roadDistanceKm;
    fares = transportData.fares;
  } else {
    distanceKm = Math.round(haversineDistance(userLat, userLng, destLat, destLng));
  }

  // Get transport fare for user's selected mode
  const transportFare = fares
    ? getBestFareForMode(fares, travelMode, distanceKm)
    : destination.transportCostFromNearestCity; // fallback to static

  const scores = {
    distance:      calcDistanceScore(distanceKm, days),
    budget:        calcBudgetScore(destination, budget, days, transportFare),
    duration:      calcDurationScore(destination, days),
    weather:       calcWeatherScore(weatherData),
    seasonal:      calcSeasonalScore(destination),
    popularity:    calcPopularityScore(destination),
    preference:    calcPreferenceScore(destination, preferences),
    accessibility: calcAccessibilityScore(destination, travelMode, fares)
  };

  // Weighted Sum Model (WSM)
  const finalScore = (
    scores.distance      * 0.20 +
    scores.budget        * 0.25 +
    scores.duration      * 0.15 +
    scores.weather       * 0.15 +
    scores.seasonal      * 0.10 +
    scores.popularity    * 0.05 +
    scores.preference    * 0.05 +
    scores.accessibility * 0.05
  );

  const estimatedTotalCost = (destination.estimatedCostPerDay * days) + transportFare;

  return {
    destination,
    scores,
    finalScore: Math.round(finalScore * 10) / 10,
    distanceKm,
    estimatedTotalCost,
    transportFare,
    transportData: transportData || null,
    weatherData: weatherData || null
  };
};

module.exports = { scoreDestination, haversineDistance };
