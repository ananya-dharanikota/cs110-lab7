require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const app = express();

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET || 'chatroom-secret',
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB error:', err));

const User = require('./models/User');
const Room = require('./models/Room');
const Message = require('./models/Message');

// ─── Passport ────────────────────────────────────────────────────────────────

passport.use(new LocalStrategy(async (username, password, done) => {
  const user = await User.findOne({ username, password });
  if (!user) return done(null, false);
  return done(null, user);
}));

passport.serializeUser((user, done) => done(null, user.id));

passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id);
  done(null, user);
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Generates a random 6-character alphanumeric room ID.
 * @returns {string} 6-char uppercase ID
 */
function generateRoomId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

/**
 * Express middleware that rejects unauthenticated requests.
 */
function checkAuth(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.status(401).json({ success: false, message: 'Not authenticated' });
}

// ─── Auth Routes ─────────────────────────────────────────────────────────────

app.post('/signup', async (req, res) => {
  try {
    const existing = await User.findOne({ username: req.body.username });
    if (existing) return res.status(400).json({ success: false, message: 'Username already taken' });
    const user = await User.create({ username: req.body.username, password: req.body.password });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user) => {
    if (err) return next(err);
    if (!user) return res.status(401).json({ success: false, message: 'Invalid username or password' });
    req.logIn(user, (err) => {
      if (err) return next(err);
      res.json({ success: true, username: user.username });
    });
  })(req, res, next);
});

app.post('/logout', (req, res) => {
  req.logout(() => res.json({ success: true }));
});

app.get('/me', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ loggedIn: true, username: req.user.username });
  } else {
    res.json({ loggedIn: false });
  }
});

// ─── Room Routes ─────────────────────────────────────────────────────────────

app.get('/rooms', checkAuth, async (req, res) => {
  const rooms = await Room.find().sort({ createdAt: -1 });
  res.json(rooms);
});

app.post('/create-room', checkAuth, async (req, res) => {
  const room = await Room.create({
    roomId: generateRoomId(),
    name: req.body.name || ''
  });
  res.json(room);
});

app.get('/rooms/:roomId', checkAuth, async (req, res) => {
  const room = await Room.findOne({ roomId: req.params.roomId });
  if (!room) return res.status(404).json({ success: false, message: 'Room not found' });
  res.json(room);
});

// ─── Message Routes ───────────────────────────────────────────────────────────

app.get('/messages/:roomId', checkAuth, async (req, res) => {
  const messages = await Message.find({ roomId: req.params.roomId }).sort({ createdAt: 1 });
  res.json(messages);
});

app.post('/send-message', checkAuth, async (req, res) => {
  const message = await Message.create({
    roomId: req.body.roomId,
    username: req.user.username,
    text: req.body.text,
    replies: []
  });
  res.json(message);
});

/**
 * Edit a message — only the original author may edit.
 */
app.patch('/messages/:messageId', checkAuth, async (req, res) => {
  const message = await Message.findById(req.params.messageId);
  if (!message) return res.status(404).json({ success: false, message: 'Message not found' });
  if (message.username !== req.user.username) {
    return res.status(403).json({ success: false, message: 'Not your message' });
  }
  message.text = req.body.text;
  await message.save();
  res.json(message);
});

/**
 * Delete a message — only the original author may delete.
 */
app.delete('/messages/:messageId', checkAuth, async (req, res) => {
  const message = await Message.findById(req.params.messageId);
  if (!message) return res.status(404).json({ success: false, message: 'Message not found' });
  if (message.username !== req.user.username) {
    return res.status(403).json({ success: false, message: 'Not your message' });
  }
  await message.deleteOne();
  res.json({ success: true });
});

/**
 * Thumb up or down a top-level message.
 * Body: { vote: 'up' | 'down' }
 */
app.post('/messages/:messageId/vote', checkAuth, async (req, res) => {
  const message = await Message.findById(req.params.messageId);
  if (!message) return res.status(404).json({ success: false });
  if (req.body.vote === 'up') message.thumbsUp += 1;
  else if (req.body.vote === 'down') message.thumbsDown += 1;
  await message.save();
  res.json(message);
});

// ─── Reply Routes ─────────────────────────────────────────────────────────────

app.post('/reply/:messageId', checkAuth, async (req, res) => {
  const message = await Message.findById(req.params.messageId);
  if (!message) return res.status(404).json({ success: false });
  message.replies.push({ username: req.user.username, text: req.body.text });
  await message.save();
  res.json(message);
});

/**
 * Thumb up or down a reply.
 * Body: { vote: 'up' | 'down' }
 */
app.post('/reply/:messageId/:replyId/vote', checkAuth, async (req, res) => {
  const message = await Message.findById(req.params.messageId);
  if (!message) return res.status(404).json({ success: false });
  const reply = message.replies.id(req.params.replyId);
  if (!reply) return res.status(404).json({ success: false });
  if (req.body.vote === 'up') reply.thumbsUp += 1;
  else if (req.body.vote === 'down') reply.thumbsDown += 1;
  await message.save();
  res.json(message);
});

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(8080, () => console.log('Server running on port 8080'));
