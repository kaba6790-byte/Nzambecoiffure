require('dotenv').config();
const express   = require('express');
const cors      = require('cors');
const helmet    = require('helmet');
const morgan    = require('morgan');
const path      = require('path');
const connectDB = require('./config/db');

const app = express();

connectDB();

app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(cors({ origin: process.env.ALLOWED_ORIGIN || '*', credentials: true }));

if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'));

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false }));

// Fichiers statiques avec cache
const staticOpts = { maxAge: '7d', etag: true, lastModified: true };
const noCache    = { maxAge: 0,    etag: true, lastModified: true };

app.use(express.static(path.join(__dirname, 'public'), staticOpts));
app.use('/admin', express.static(path.join(__dirname, 'admin'), noCache));

// Routes API
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/auth',         require('./routes/auth'));
app.use('/api/admin',        require('./routes/admin'));

// Fallback admin
app.get('/admin', (_req, res) => res.sendFile(path.join(__dirname, 'admin', 'index.html')));
app.get('/admin/*', (req, res) => {
  const f = path.join(__dirname, 'admin', req.params[0]);
  res.sendFile(f, err => { if (err) res.sendFile(path.join(__dirname, 'admin', 'index.html')); });
});

// Fallback frontend
app.get('*', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ message: err.message || 'Erreur serveur' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🌟 Nzambe Coiffure démarré sur le port ${PORT} [${process.env.NODE_ENV || 'development'}]`));
