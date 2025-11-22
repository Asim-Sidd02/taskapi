console.log('routes/notes.js loaded');

const express = require('express');
const { body, validationResult } = require('express-validator');
const Note = require('../models/Note');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const filter = { userId: req.user.id };

    if (req.query.pinned !== undefined) {
      const p = req.query.pinned === 'true' || req.query.pinned === '1';
      filter.pinned = p;
    }

    if (req.query.tag) {
      filter.tags = req.query.tag;
    }

    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const skip = Math.max(parseInt(req.query.skip) || 0, 0);

    const notes = await Note.find(filter)
      .sort({ pinned: -1, updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return res.json(notes);
  } catch (err) {
    console.error('Notes list error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});


router.post(
  '/',
  body('title').optional().isString(),
  body('content').optional().isString(),
  body('pinned').optional().isBoolean(),
  body('tags').optional().isArray(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ message: 'Invalid input', errors: errors.array() });

    try {
      const { title = '', content = '', pinned = false, tags = [] } = req.body;

      const note = new Note({
        userId: req.user.id,
        title,
        content,
        pinned: !!pinned,
        tags: Array.isArray(tags) ? tags.map(t => String(t)) : [],
      });

      await note.save();
      return res.status(201).json(note);
    } catch (err) {
      console.error('Create note error:', err);
      return res.status(500).json({ message: 'Server error' });
    }
  }
);

router.get('/:id', async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, userId: req.user.id }).lean();
    if (!note) return res.status(404).json({ message: 'Note not found' });
    return res.json(note);
  } catch (err) {
    console.error('Get note error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// PUT /:id - update note (partial allowed)
router.put(
  '/:id',
  body('title').optional().isString(),
  body('content').optional().isString(),
  body('pinned').optional().isBoolean(),
  body('tags').optional().isArray(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ message: 'Invalid input', errors: errors.array() });

    try {
      const updates = {};
      const allowed = ['title', 'content', 'pinned', 'tags'];

      for (const k of allowed) {
        if (req.body[k] !== undefined) {
          updates[k] = req.body[k];
        }
      }

      if (updates.tags && !Array.isArray(updates.tags)) updates.tags = [];

      const note = await Note.findOneAndUpdate(
        { _id: req.params.id, userId: req.user.id },
        updates,
        { new: true, runValidators: true, context: 'query' }
      ).lean();

      if (!note) return res.status(404).json({ message: 'Note not found' });
      return res.json(note);
    } catch (err) {
      console.error('Update note error:', err);
      return res.status(500).json({ message: 'Server error' });
    }
  }
);

router.delete('/:id', async (req, res) => {
  try {
    const note = await Note.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!note) return res.status(404).json({ message: 'Note not found' });
    return res.json({ message: 'Deleted' });
  } catch (err) {
    console.error('Delete note error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
