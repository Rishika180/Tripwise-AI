const { generateItinerary } = require('../services/geminiService');
const express = require('express');
const axios = require('axios');
const Destination = require('../models/Destination');
const { scoreDestination } = require('../services/scoringEngine');
const { getWeatherForLocation } = require('../services/weatherService');
const { getTransportOptions } = require('../services/transportService');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All recommendation routes require authentication
router.use(protect);

// Geocode a city name to lat/lng using OpenStreetMap Nominatim (free, no key)
const geocodeCity = async (cityName) => {
  try {
    const response = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: { q: cityName, format: 'json', limit: 1 },
      headers: { 'User-Agent': 'TripWiseAI/1.0' }
    });
    if (response.data.length === 0) return null;
    return {
      lat: parseFloat(response.data[0].lat),
      lng: parseFloat(response.data[0].lon),
      displayName: response.data[0].display_name
    };
  } catch (error) {
    return null;
  }
};

// POST /api/recommendations
router.post('/', async (req, res) => {
  try {
    const { cityName, userLat, userLng, days, budget, preferences, travelMode } = req.body;

    // Validate required fields
    if (!days || !budget) {
      return res.status(400).json({ success: false, message: 'days and budget are required' });
    }

    // Resolve user coordinates
    let resolvedLat = userLat;
    let resolvedLng = userLng;

    if (!resolvedLat || !resolvedLng) {
      if (!cityName) {
        return res.status(400).json({ success: false, message: 'Provide either coordinates or cityName' });
      }
      const geo = await geocodeCity(cityName);
      if (!geo) {
        return res.status(400).json({ success: false, message: `Could not find coordinates for: ${cityName}` });
      }
      resolvedLat = geo.lat;
      resolvedLng = geo.lng;
    }

    const userConstraints = {
      userLat: resolvedLat,
      userLng: resolvedLng,
      days: parseInt(days),
      budget: parseInt(budget),
      preferences: preferences || [],
      travelMode: travelMode || 'any'
    };

    // Fetch all destinations
    const destinations = await Destination.find({});

    // Score all destinations (fetch weather + transport in parallel)
    const scoringPromises = destinations.map(async (dest) => {
      const destLat = dest.location.coordinates[1];
      const destLng = dest.location.coordinates[0];

      // Fetch weather and transport data in parallel
      const [weatherData, transportData] = await Promise.all([
        getWeatherForLocation(destLat, destLng, dest.name),
        getTransportOptions(resolvedLat, resolvedLng, destLat, destLng)
      ]);

      return scoreDestination(dest, userConstraints, weatherData, transportData);
    });

    const scoredResults = await Promise.all(scoringPromises);

    // Sort by finalScore descending, take top 10
    const topResults = scoredResults
      .filter(r => r.finalScore > 0)
      .sort((a, b) => b.finalScore - a.finalScore)
      .slice(0, 10);

      // Generate AI itinerary for top result only (cost optimization)
    if (topResults.length > 0) {
      console.log(`Generating itinerary for: ${topResults[0].destination.name}`);
      const aiResult = await generateItinerary(
        topResults[0].destination,
        userConstraints,
        topResults[0].weatherData,
        topResults[0].scores
      );
      topResults[0].aiItinerary = aiResult.itinerary;
    }

    res.json({
      success: true,
      userLocation: { lat: resolvedLat, lng: resolvedLng, cityName },
      totalScored: scoredResults.length,
      recommendations: topResults
    });

  } catch (error) {
    console.error('Recommendation error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/recommendations/itinerary
// On-demand itinerary generation for a single destination
// Called when user clicks a destination to view full details
router.post('/itinerary', async (req, res) => {
  try {
    const { destinationName, days, budget, preferences, travelMode } = req.body;

    if (!destinationName || !days || !budget) {
      return res.status(400).json({ success: false, message: 'destinationName, days, and budget are required' });
    }

    // Look up destination in DB
    const destination = await Destination.findOne({ name: destinationName });
    if (!destination) {
      return res.status(404).json({ success: false, message: `Destination not found: ${destinationName}` });
    }

    // Fetch current weather for this destination
    const destLat = destination.location.coordinates[1];
    const destLng = destination.location.coordinates[0];
    const weatherData = await getWeatherForLocation(destLat, destLng, destination.name);

    const userConstraints = {
      days: parseInt(days),
      budget: parseInt(budget),
      preferences: preferences || [],
      travelMode: travelMode || 'any'
    };

    console.log(`On-demand itinerary for: ${destinationName}`);
    const aiResult = await generateItinerary(destination, userConstraints, weatherData);

    if (!aiResult.success) {
      return res.status(500).json({ success: false, message: 'AI itinerary generation failed', error: aiResult.error });
    }

    res.json({
      success: true,
      destinationName,
      itinerary: aiResult.itinerary
    });

  } catch (error) {
    console.error('Itinerary generation error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;