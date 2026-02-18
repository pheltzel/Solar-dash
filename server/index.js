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
      eg4: !!(process.env.EG4_USERNAME || process.env.EG4_EMAIL),
    },
  });
});

app.use('/api/ecobee', ecobeeRouter);
app.use('/api/emporia', emporiaRouter);
app.use('/api/eg4', eg4Router);

app.listen(PORT, () => {
  console.log(`\nSolar-dash API server running on http://localhost:${PORT}`);
  console.log('─────────────────────────────────────────');
  console.log('Configured services:');

  const ecobeeKey = process.env.ECOBEE_API_KEY;
  if (ecobeeKey) {
    // Warn if it looks like they put an email instead of an API key
    if (ecobeeKey.includes('@')) {
      console.log('  Ecobee:  ⚠️  ECOBEE_API_KEY looks like an email — it should be the API key from ecobee.com/developers/');
    } else {
      console.log(`  Ecobee:  ✓ API key set (${ecobeeKey.slice(0, 6)}...)`);
    }
  } else {
    console.log('  Ecobee:  ✗ NOT CONFIGURED');
  }
  console.log(`  Emporia: ${process.env.EMPORIA_EMAIL ? '✓ ' + process.env.EMPORIA_EMAIL : '✗ NOT CONFIGURED'}`);
  const eg4User = process.env.EG4_USERNAME || process.env.EG4_EMAIL;
  console.log(`  EG4:     ${eg4User ? '✓ ' + eg4User : '✗ NOT CONFIGURED (set EG4_USERNAME or EG4_EMAIL)'}`);
  console.log('─────────────────────────────────────────\n');
});
