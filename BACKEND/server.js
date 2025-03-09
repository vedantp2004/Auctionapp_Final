const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());
app.use(cors());

const SECRET_KEY = 'my_super_secret_123!';

mongoose.connect('mongodb://127.0.0.1:27017/auctionDB');

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});
const User = mongoose.model('User', userSchema);

// Auction Item Schema
const auctionItemSchema = new mongoose.Schema({
  itemName: String,
  description: String,
  currentBid: Number,
  highestBidder: String,
  closingTime: Date,
  isClosed: { type: Boolean, default: false },
  winner: String,
});
const AuctionItem = mongoose.model('AuctionItem', auctionItemSchema);

// Middleware to verify token
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Unauthorized' });

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid Token' });
    req.user = user;
    next();
  });
};

// Signup Route
app.post('/signup', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password required' });
    }
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Signin Route
app.post('/signin', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (user && await bcrypt.compare(password, user.password)) {
    const token = jwt.sign({ userId: user._id, username }, SECRET_KEY, { expiresIn: '1h' });
    res.json({ message: 'Signin successful', token });
  } else {
    res.status(400).json({ message: 'Invalid credentials' });
  }
});

// Create Auction Item
app.post('/auction', authenticate, async (req, res) => {
  try {
    const { itemName, description, startingBid, closingTime } = req.body;
    const newItem = new AuctionItem({
      itemName,
      description,
      currentBid: startingBid,
      highestBidder: '',
      closingTime,
      isClosed: false,
    });
    await newItem.save();
    res.status(201).json({ message: 'Auction item created', item: newItem });
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Get all auction items
app.get('/auctions', async (req, res) => {
  try {
    const auctions = await AuctionItem.find();
    res.json(auctions);
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Get a single auction item by ID
app.get('/auctions/:id', async (req, res) => {
  try {
    const auctionItem = await AuctionItem.findById(req.params.id);
    if (!auctionItem) return res.status(404).json({ message: 'Auction not found' });
    res.json(auctionItem);
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Bidding on an item
app.post('/bid/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { bid } = req.body;
    const username = req.user.username;
    const item = await AuctionItem.findById(id);
    if (!item) return res.status(404).json({ message: 'Auction not found' });
    if (item.isClosed) return res.status(400).json({ message: 'Auction is closed' });
    if (bid <= item.currentBid) return res.status(400).json({ message: 'Bid too low' });
    item.currentBid = bid;
    item.highestBidder = username;
    await item.save();
    res.json({ message: 'Bid placed successfully', highestBidder: item.highestBidder, item });
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Auction Closing Check
const closeAuctions = async () => {
  const now = new Date();
  const auctionsToClose = await AuctionItem.find({ isClosed: false, closingTime: { $lte: now } });
  for (let auction of auctionsToClose) {
    auction.isClosed = true;
    auction.winner = auction.highestBidder || 'No Winner';
    await auction.save();
  }
  console.log('Closed auctions:', auctionsToClose.length);
};
setInterval(closeAuctions, 60000); // Check every minute

app.delete('/auctions/name/:itemName', async (req, res) => {
  try {
    const itemName = decodeURIComponent(req.params.itemName).trim(); // ✅ Handle spaces & special characters
    console.log(`🔎 Searching for auction with itemName: "${itemName}"`);

    const auctionItem = await AuctionItem.findOne({ itemName: { $regex: `^${itemName}$`, $options: "i" } }); // ✅ Case-insensitive search

    if (!auctionItem) {
      console.log(`❌ No auction found for "${itemName}"`);
      return res.status(404).json({ message: `Auction item '${itemName}' not found` });
    }

    await AuctionItem.deleteOne({ _id: auctionItem._id }); // ✅ Use _id to ensure correct deletion
    res.json({ message: `Auction item '${itemName}' deleted successfully` });
  } catch (error) {
    console.error("❌ Delete Auction Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Start the server
app.listen(5001, () => {
  console.log('Server is running on port 5001');
});