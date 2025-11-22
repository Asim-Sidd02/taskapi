const mongoose = require('mongoose');

const NoteSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },


  title: { type: String, trim: true, default: '' },


  content: { type: String, trim: true, default: '' },

  pinned: { type: Boolean, default: false },

  tags: { type: [String], default: [] },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

NoteSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

NoteSchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate();
  if (update) {
    update.updatedAt = Date.now();
    this.setUpdate(update);
  }
  next();
});

module.exports = mongoose.model('Note', NoteSchema);
