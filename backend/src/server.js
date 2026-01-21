const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Servir les images statiques depuis le dossier frontend/public
app.use('/images', express.static(path.join(__dirname, '../../frontend/public')));

app.use((req, res, next) => {
  console.log("➡️", req.method, req.url);
  next();
});

app.get('/api/health', (req, res) => res.json({ status: 'OK', app: 'EOL ICT Matrix API' }));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/products', require('./routes/products'));
console.log("LOADING quotes router =>", require.resolve("./routes/quotes"));
app.use('/api/quotes', require('./routes/quotes'));
app.use('/api/matrix', require('./routes/matrix'));
app.use('/api/notifications', require('./routes/notifications'));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🚀 API running: http://localhost:${PORT}`));
