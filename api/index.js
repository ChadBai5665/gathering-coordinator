import app from '../packages/server/dist/app.js';

export default async function handler(req, res) {
  try {
    return app(req, res);
  } catch (error) {
    res.status(500).json({
      error: error.message,
      stack: error.stack
    });
  }
}
