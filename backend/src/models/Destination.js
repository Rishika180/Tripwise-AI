const mongoose = require('mongoose');

const destinationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  state: { type: String, required: true },
  description: { type: String },

  // GeoJSON format — required for MongoDB geospatial queries
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true,
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude] — NOTE: longitude first in GeoJSON
      required: true
    }
  },

  // Travel cost estimates (in INR)
  estimatedCostPerDay: { type: Number, required: true },
  transportCostFromNearestCity: { type: Number, default: 0 },

  // Duration
  minDays: { type: Number, default: 1 },
  recommendedDays: { type: Number, default: 2 },

  // Tags for preference matching
  tags: [{ type: String }], // e.g. ['nature', 'hills', 'trekking', 'beach']

  // Best seasons: array of month numbers (1=Jan, 12=Dec)
  bestMonths: [{ type: Number }],

  // Nearest major city (for distance calculation)
  nearestCity: { type: String },
  nearestCityCoordinates: {
    lat: { type: Number },
    lng: { type: Number }
  },

  // Popularity (1-10 scale, pre-seeded)
  popularityScore: { type: Number, default: 5, min: 1, max: 10 },

  // Transport options available
  transportOptions: {
    train: { type: Boolean, default: false },
    bus: { type: Boolean, default: false },
    flight: { type: Boolean, default: false },
    cab: { type: Boolean, default: true }
  },

  // Key attractions
  attractions: [{ type: String }],

  // Image URL (for UI)
  imageUrl: { type: String, default: '' }

}, { timestamps: true });

// Geospatial index — enables $near queries
destinationSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Destination', destinationSchema);