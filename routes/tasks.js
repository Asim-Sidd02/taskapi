const express = require('express');
const { body, validationResult } = require('express-validator');
const Task = require('../models/Task');

const router = express.Router();


router.get('/', async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});


router.post('/',
  body('title').isString().notEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ message: 'Invalid input', errors: errors.array() });

    try {
      const { title, description } = req.body;
      const task = new Task({ userId: req.user.id, title, description });
      await task.save();
      res.status(201).json(task);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  });


router.put('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const updates = {};
    if (req.body.title !== undefined) updates.title = req.body.title;
    if (req.body.description !== undefined) updates.description = req.body.description;
    if (req.body.done !== undefined) updates.done = req.body.done;

    const task = await Task.findOneAndUpdate({ _id: id, userId: req.user.id }, updates, { new: true });
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});


router.delete('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const task = await Task.findOneAndDelete({ _id: id, userId: req.user.id });
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
