import { createApp } from './app.js';
import { connectDatabase } from './database.js';

const port = Number(process.env.PORT ?? 4000);
const app = createApp();

connectDatabase()
  .then((connected) => {
    console.log(connected ? 'MongoDB connected' : 'MongoDB not configured; persistence is disabled');
    app.listen(port, () => {
      console.log(`ERP Multigestión API listening on port ${port}`);
    });
  })
  .catch((error) => {
    console.error('MongoDB connection failed', error);
    process.exitCode = 1;
  });
