const express = require('express');
const router = express.Router();
const FeaturesService = require('../services/FeaturesService');

/**
 * @route GET /api/features
 * @description Get all features from the backlog
 */
router.get('/', async (req, res) => {
  try {
    const features = await FeaturesService.getAllFeatures();
    res.json({ success: true, data: features });
  } catch (error) {
    console.error('Error fetching features:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch features' });
  }
});

/**
 * @route GET /api/features/search
 * @description Search features by query string
 */
router.get('/search', async (req, res) => {
  const { q } = req.query;
  
  if (!q || typeof q !== 'string') {
    return res.status(400).json({ 
      success: false, 
      error: 'Search query (q) is required' 
    });
  }
  
  try {
    const features = await FeaturesService.searchFeatures(q);
    res.json({ success: true, data: features });
  } catch (error) {
    console.error('Error searching features:', error);
    res.status(500).json({ success: false, error: 'Failed to search features' });
  }
});

/**
 * @route GET /api/features/:id
 * @description Get a single feature by ID
 */
router.get('/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  
  if (isNaN(id)) {
    return res.status(400).json({ 
      success: false, 
      error: 'Invalid feature ID' 
    });
  }
  
  try {
    const feature = await FeaturesService.getFeatureById(id);
    
    if (!feature) {
      return res.status(404).json({ 
        success: false, 
        error: 'Feature not found' 
      });
    }
    
    res.json({ success: true, data: feature });
  } catch (error) {
    console.error('Error fetching feature:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch feature' });
  }
});

module.exports = router;
