require('dotenv').config();
const app = require('./src/app');

const PORT = process.env.PORT || 3000;

// Cleanup expired tokens periodically (every hour)
setInterval(async () => {
  try {
    const User = require('./src/models/user.model');
    const Task = require('./src/models/task.model');
    await User.cleanupExpiredTokens();
    await Task.cleanupExpiredIdempotencyKeys();
    console.log('✅ Cleanup completed');
  } catch (error) {
    console.error('❌ Cleanup error:', error);
  }
}, 60 * 60 * 1000); // 1 hour

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║   🚀 Mini Task API Server Running     ║
║                                        ║
║   Port: ${PORT}                        ║
║   Environment: ${process.env.NODE_ENV || 'development'}          ║
║                                        ║
║   Endpoints:                           ║
║   • POST   /api/v1/auth/register       ║
║   • POST   /api/v1/auth/login          ║
║   • GET    /api/v1/tasks               ║
║   • GET    /api/v2/tasks               ║
║                                        ║
║   phpMyAdmin: http://localhost:8080    ║
║                                        ║
╚════════════════════════════════════════╝
  `);
});