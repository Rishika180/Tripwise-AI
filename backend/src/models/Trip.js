const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
  // Which user saved this trip
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Destination info (snapshot at save time)
  destinationName: { type: String, required: true },
  destinationState: { type: String },
  destinationCoordinates: {
    type: [Number] // [lng, lat]
  },

  // User's constraints when they searched
  days: { type: Number, required: true },
  budget: { type: Number, required: true },
  travelMode: { type: String, default: 'any' },
  preferences: [{ type: String }],

  // Scoring data
  finalScore: { type: Number },
  distanceKm: { type: Number },
  estimatedTotalCost: { type: Number },
  scores: { type: mongoose.Schema.Types.Mixed },

  // Transport data
  transportData: { type: mongoose.Schema.Types.Mixed },

  // Weather at save time
  weatherData: { type: mongoose.Schema.Types.Mixed },

  // AI itinerary (full JSON)
  itinerary: { type: mongoose.Schema.Types.Mixed },

  // Attractions list
  attractions: [{ type: String }]

}, { timestamps: true });

// Index for fast user-specific queries
tripSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Trip', tripSchema);
