const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(__dirname));

app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/checkout', (_req, res) => {
  res.sendFile(path.join(__dirname, 'checkout.html'));
});

app.get('/tracking', (_req, res) => {
  res.sendFile(path.join(__dirname, 'tracking.html'));
});

app.get('/review', (_req, res) => {
  res.sendFile(path.join(__dirname, 'review.html'));
});

app.get('/ongoing', (_req, res) => {
  res.sendFile(path.join(__dirname, 'ongoing.html'));
});

app.listen(PORT, () => {
  console.log(`HCI site running at http://localhost:${PORT}`);
});
