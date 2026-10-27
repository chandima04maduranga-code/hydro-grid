require('dotenv').config({ quiet: true });
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const { sanitizeBody, apiLimiter } = require('./middleware/security');

// Fail fast if required configuration is missing
const REQUIRED_ENV = ['MONGO_URI', 'JWT_SECRET'];
const missingEnv = REQUIRED_ENV.filter((key) => !process.env[key]);
if (missingEnv.length > 0) {
  console.error(`❌ Missing required environment variables: ${missingEnv.join(', ')}`);
  console.error('   Copy backend/.env.example to backend/.env and fill in the values.');
  process.exit(1);
}

// Optional DNS override for the MongoDB SRV lookup (e.g. DNS_SERVERS=8.8.8.8,1.1.1.1).
// Needed on machines where Node.js cannot use the system resolver.
if (process.env.DNS_SERVERS) {
  require('dns').setServers(process.env.DNS_SERVERS.split(',').map((server) => server.trim()));
}

const app = express();

// Security headers (also hides the "X-Powered-By: Express" header)
app.use(helmet());
// Only the Hydro_Grid frontend may call the API from a browser, with its session cookie
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());
app.use(sanitizeBody);
app.use('/api', apiLimiter);

// Define Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/companies', require('./routes/companies'));
app.use('/api/platform', require('./routes/platform'));
app.use('/api/users', require('./routes/users'));
app.use('/api/greenhouses', require('./routes/greenhouses'));
app.use('/api/plants', require('./routes/plants'));
app.use('/api/telemetry', require('./routes/telemetry'));

// Health check
app.get('/api/health', (req, res) => {
  const dbConnected = mongoose.connection.readyState === 1;
  res.json({ status: 'ok', database: dbConnected ? 'connected' : 'disconnected' });
});

// Unknown routes and malformed requests get a short JSON error, never a stack trace
app.use('/api', (req, res) => res.status(404).json({ code: 'NOT_FOUND', message: 'Not found' }));
app.use((err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  if (status >= 500) console.error('Unhandled error:', err.message);
  res.status(status).json(status >= 500
    ? { code: 'SERVER_ERROR', message: 'Something went wrong, please try again' }
    : { code: 'BAD_REQUEST', message: 'The request could not be read' });
});

// Connect to MongoDB first, then start accepting requests
const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('❌ MongoDB Connection Error:', err.message);
    process.exit(1);
  });
