const express = require('express');
const router = express.Router();
const HospitalDiscoveryService = require('../services/hospitalDiscoveryService');

// @route   GET /api/hospitals/nearby
// @desc    Find nearby 24/7 maternity and emergency hospitals using live GPS or default coords
router.get('/nearby', async (req, res) => {
  try {
    const lat = req.query.lat ? parseFloat(req.query.lat) : 37.7749;
    const lng = req.query.lng ? parseFloat(req.query.lng) : -122.4194;
    const radius = req.query.radius ? parseInt(req.query.radius) : 15000;

    const hospitals = await HospitalDiscoveryService.findNearbyHospitals(lat, lng, radius);

    res.json({
      success: true,
      userLocation: { lat, lng },
      count: hospitals.length,
      data: hospitals
    });
  } catch (error) {
    console.error('Hospital discovery error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
