const mongoose = require('mongoose');

const ReplySchema = new mongoose.Schema({
  username: String,
  text: String,
  thumbsUp: { type: Number, default: 0 },
  thumbsDown: { type: Number, default: 0 },
}, { timestamps: true });

const MessageSchema = new mongoose.Schema({
  roomId: { type: String, required: true },
  username: { type: String, required: true },
  text: { type: String, required: true },
  thumbsUp: { type: Number, default: 0 },
  thumbsDown: { type: Number, default: 0 },
  replies: [ReplySchema],
}, { timestamps: true });

module.exports = mongoose.model('Message', MessageSchema);
