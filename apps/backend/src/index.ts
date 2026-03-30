import express from 'express';
import cors from 'cors';
import pino from 'pino';

const logger = pino({
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
    },
  },
});

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/projects', (req, res) => {
  res.json({ projects: [] });
});

app.listen(PORT, () => {
  logger.info(`Backend server running on port ${PORT}`);
});
