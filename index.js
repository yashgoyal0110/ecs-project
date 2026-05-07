const express = require('express');

const app = express();
app.use(express.json());

const log = (level, msg, meta) => {
  const entry = { time: new Date().toISOString(), level, msg, ...meta };
  console.log(JSON.stringify(entry));
};

app.get("/", (req, res) => {
  res.send("server is running on port 3000 suceessfully");
});


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

let products = [];

app.post('/products', (req, res) => {
  const { name, price } = req.body;

  if (!name) {
    log('warn', 'missing name on add product');
    return res.status(400).json({ error: 'name is required' });
  }

  if (products.some((p) => p.name === name)) {
    log('warn', 'duplicate product name rejected', { name });
    return res.status(409).json({ error: 'product name must be unique' });
  }

  if (products.length >= 20) {
    log('info', 'product cap reached, clearing array', { previousSize: products.length });
    products = [];
  }

  const product = { name, price };
  products.push(product);
  log('info', 'product added', { name, price, size: products.length });
  res.status(201).json(product);
});

app.get('/products', (req, res) => {
  log('info', 'products listed', { size: products.length });
  res.json(products);
});

const PORT = 3000;
app.listen(PORT, () => {
  log('info', 'server started', { port: PORT });
});
