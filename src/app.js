const express = require('express');
const cors = require('cors');
const { createRateLimiter, rateLimitHeaders } = require('./middleware/rateLimiter');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const taskRoutesV1 = require('./routes/task.routes.v1');
const taskRoutesV2 = require('./routes/task.routes.v2');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(rateLimitHeaders);
app.use(createRateLimiter());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/tasks', taskRoutesV1);
app.use('/api/v2/tasks', taskRoutesV2);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;