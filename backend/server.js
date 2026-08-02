import "dotenv/config";
import app from "./app.js";
import { connectToDatabase, disconnectFromDatabase } from './config/database.js';
import { env } from './config/env.js';

let server;
let isShuttingDown = false;

const shutdown = async (signal, exitCode = 0) => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(`${signal} received. Closing services...`);

  const forceExitTimer = setTimeout(() => process.exit(1), 10_000);
  forceExitTimer.unref();

  if (server) {
    await new Promise((resolve) => server.close(resolve));
    console.log('HTTP server closed.');
  }

  await disconnectFromDatabase();
  clearTimeout(forceExitTimer);
  process.exit(exitCode);
};

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection:', reason);
  void shutdown('unhandledRejection', 1);
});
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  process.exit(1);
});

const startServer = async () => {
  try {
    await connectToDatabase();
    server = app.listen(env.PORT, () => {
      console.log(`IndigoMart API listening on port ${env.PORT} (${env.NODE_ENV})`);
    });
  } catch (error) {
    console.error('Application startup failed:', error.message);
    await disconnectFromDatabase();
    process.exit(1);
  }
};

await startServer();
