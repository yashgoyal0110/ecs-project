const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
app.use(cors());
app.use(express.json());

const log = (level, msg, meta) => {
  const entry = { time: new Date().toISOString(), level, msg, ...meta };
  console.log(JSON.stringify(entry));
};

app.use((req, res, next) => {
  const start = Date.now();
  log('info', 'request', { method: req.method, path: req.path });
  res.on('finish', () => {
    log('info', 'response', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      durationMs: Date.now() - start,
    });
  });
  next();
});

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    price: { type: Number },
  },
  { timestamps: true }
);

const Product = mongoose.model('Product', productSchema);

app.get('/', (req, res) => {
  res.send('server is running on port 3000 suceessfully');
});

app.post('/products', async (req, res) => {
  const { name, price } = req.body;

  if (!name) {
    log('warn', 'missing name on add product');
    return res.status(400).json({ error: 'name is required' });
  }

  try {
    const existing = await Product.findOne({ name });
    if (existing) {
      log('warn', 'duplicate product name rejected', { name });
      return res.status(409).json({ error: 'product name must be unique' });
    }

    const count = await Product.countDocuments();
    if (count >= 20) {
      log('info', 'product cap reached, clearing collection', { previousSize: count });
      await Product.deleteMany({});
    }

    const product = await Product.create({ name, price });
    log('info', 'product added', { name, price });
    res.status(201).json({ name: product.name, price: product.price });
  } catch (err) {
    log('error', 'failed to add product', { error: err.message });
    res.status(500).json({ error: 'internal server error' });
  }
});

app.get('/products', async (req, res) => {
  try {
    const products = await Product.find({}, { _id: 0, name: 1, price: 1 }).sort({ createdAt: 1 });
    log('info', 'products listed', { size: products.length });
    res.json(products);
  } catch (err) {
    log('error', 'failed to list products', { error: err.message });
    res.status(500).json({ error: 'internal server error' });
  }
});

const PORT = process.env.PORT || 3000;
const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/products';

mongoose
  .connect(MONGO_URL)
  .then(() => {
    log('info', 'mongo connected', { url: MONGO_URL });
    app.listen(PORT, () => {
      log('info', 'server started', { port: PORT });
    });
  })
  .catch((err) => {
    log('error', 'mongo connection failed', { error: err.message });
    process.exit(1);
  });
