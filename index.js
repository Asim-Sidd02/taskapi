require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');
const path = require('path');

const app = express();
function safeRequire(relPath) {
  try {
    const full = path.resolve(__dirname, relPath);
    // require.resolve will throw if not found
    require.resolve(full);
    return require(full);
  } catch (err) {
    console.error(`safeRequire: failed to load ${relPath}:`, err.message || err);
    return undefined;
  }
}

// Basic middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Connect DB
connectDB();

// Load modules safely (only once)
let authRoutes = safeRequire('./routes/auth');
let taskRoutes = safeRequire('./routes/tasks');
let notesRoutes = safeRequire('./routes/notes');
let authMiddleware = safeRequire('./middleware/auth');
let errorHandler = safeRequire('./middleware/errorHandler');

// Fallbacks / validation
if (!authRoutes) {
  console.warn('Warning: authRoutes not found - /auth will be unavailable');
}
if (!taskRoutes) {
  console.warn('Warning: taskRoutes not found - /tasks will be unavailable');
}
if (!notesRoutes) {
  console.warn('Warning: notesRoutes not found - /notes will be unavailable');
}
if (!authMiddleware) {
  console.warn('Warning: authMiddleware not found - routes will be mounted without protection');
}
if (!errorHandler || !errorHandler.errorHandler) {
  console.warn('Warning: errorHandler not found or exported incorrectly. Using default fallback.');
  // Provide a simple fallback error handler
  errorHandler = {
    errorHandler: (err, req, res, next) => {
      console.error('Unhandled error:', err);
      res.status(500).json({ message: 'Server error' });
    }
  };
}

// Mount routes. Use consistent prefixes used by frontend.
// NOTE: adjust prefixes to match your client (remove/add /api).
if (authRoutes) app.use('/auth', authRoutes);
if (taskRoutes) {
  if (authMiddleware && typeof authMiddleware === 'function') {
    app.use('/tasks', authMiddleware, taskRoutes);
  } else {
    // mount without auth if middleware missing (not recommended for production)
    app.use('/tasks', taskRoutes);
  }
}
if (notesRoutes) {
  if (authMiddleware && typeof authMiddleware === 'function') {
    app.use('/notes', authMiddleware, notesRoutes);
  } else {
    app.use('/notes', notesRoutes);
  }
}

// Error handler (ensure it's the last middleware)
app.use(errorHandler.errorHandler || errorHandler);

// Health root (optional)
app.get('/', (req, res) => {
  res.status(200).json({ message: 'API is running' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
