const express = require('express');
const Trip = require('../models/Trip');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All trip routes require authentication
router.use(protect);

// POST /api/trips — Save a trip
router.post('/', async (req, res) => {
  try {
    const {
      destinationName, destinationState, destinationCoordinates,
      days, budget, travelMode, preferences,
      finalScore, distanceKm, estimatedTotalCost, scores,
      transportData, weatherData, itinerary, attractions
    } = req.body;

    if (!destinationName || !days || !budget) {
      return res.status(400).json({ success: false, message: 'destinationName, days, and budget are required' });
    }

    // Check if user already saved this destination with same constraints
    const existing = await Trip.findOne({
      user: req.user._id,
      destinationName,
      days,
      budget
    });

    if (existing) {
      return res.status(409).json({ success: false, message: 'Trip already saved', trip: existing });
    }

    const trip = await Trip.create({
      user: req.user._id,
      destinationName, destinationState, destinationCoordinates,
      days, budget, travelMode, preferences,
      finalScore, distanceKm, estimatedTotalCost, scores,
      transportData, weatherData, itinerary, attractions
    });

    res.status(201).json({ success: true, trip });
  } catch (error) {
    console.error('Save trip error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/trips — List user's saved trips
router.get('/', async (req, res) => {
  try {
    const trips = await Trip.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .select('-itinerary'); // Exclude heavy itinerary data in list view

    res.json({ success: true, count: trips.length, trips });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/trips/:id — Get single trip with full details
router.get('/:id', async (req, res) => {
  try {
    const trip = await Trip.findOne({ _id: req.params.id, user: req.user._id });
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }
    res.json({ success: true, trip });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/trips/:id — Delete a saved trip
router.delete('/:id', async (req, res) => {
  try {
    const trip = await Trip.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }
    res.json({ success: true, message: 'Trip deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
