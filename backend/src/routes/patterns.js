const express = require('express');
const router = express.Router();
const db = require('../db/patterns');

// Search/List patterns
router.get('/', async (req, res, next) => {
  try {
    const { q, tags } = req.query;
    // Parse tags if it's a comma-separated string
    const tagArray = tags ? tags.split(',').map(t => t.trim()) : undefined;
    
    const patterns = await db.searchPatterns({ query: q, tags: tagArray });
    res.json(patterns);
  } catch (err) {
    next(err);
  }
});

// Create
router.post('/', async (req, res, next) => {
  try {
    const { title, solution } = req.body;
    if (!title || !solution) {
      return res.status(400).json({ error: 'Title and Solution are required' });
    }
    const pattern = await db.createPattern(req.body);
    res.status(201).json(pattern);
  } catch (err) {
    next(err);
  }
});

// Get Detail
router.get('/:id', async (req, res, next) => {
  try {
    const pattern = await db.getPattern(req.params.id);
    if (!pattern) return res.status(404).json({ error: 'Pattern not found' });
    res.json(pattern);
  } catch (err) {
    next(err);
  }
});

// Update
router.put('/:id', async (req, res, next) => {
  try {
    const pattern = await db.updatePattern(req.params.id, req.body);
    if (!pattern) return res.status(404).json({ error: 'Pattern not found' });
    res.json(pattern);
  } catch (err) {
    next(err);
  }
});

// Delete
router.delete('/:id', async (req, res, next) => {
  try {
    const result = await db.deletePattern(req.params.id);
    if (!result) return res.status(404).json({ error: 'Pattern not found' });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
