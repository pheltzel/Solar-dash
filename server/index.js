import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { ecobeeRouter } from './api/ecobee.js';
import { emporiaRouter } from './api/emporia.js';
import { eg4Router } from './api/eg4.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    services: {
      ecobee: !!process.env.ECOBEE_API_KEY,
      emporia: !!process.env.EMPORIA_EMAIL,
      eg4: !!process.env.EG4_EMAIL,
    },
  });
});

app.use('/api/ecobee', ecobeeRouter);
app.use('/api/emporia', emporiaRouter);
app.use('/api/eg4', eg4Router);

app.listen(PORT, () => {
  console.log(`Solar-dash API server running on http://localhost:${PORT}`);
  console.log('Configured services:');
  console.log(`  Ecobee:  ${process.env.ECOBEE_API_KEY ? 'API key set' : 'NOT CONFIGURED'}`);
  console.log(`  Emporia: ${process.env.EMPORIA_EMAIL ? 'Credentials set' : 'NOT CONFIGURED'}`);
  console.log(`  EG4:     ${process.env.EG4_EMAIL ? 'Credentials set' : 'NOT CONFIGURED'}`);
});
