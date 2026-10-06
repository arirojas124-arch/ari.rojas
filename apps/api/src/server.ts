import { createApp } from './app.js';
import { connectDatabase } from './database.js';

const port = Number(process.env.PORT ?? 4000);
const app = createApp();

async function start() {
  const connected = await connectDatabase();
  console.log(connected ? 'MongoDB connected' : 'MongoDB not configured; persistence is disabled');

  app.listen(port, () => {
    console.log(`ERP Multigestión API listening on port ${port}`);
  });
}

start().catch((error) => {
  console.error('MongoDB connection failed; API remains available for health checks', error);
  app.listen(port, () => {
    console.log(`ERP Multigestión API listening on port ${port}`);
  });
});
