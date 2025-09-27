#!/usr/bin/env node
import 'dotenv/config';
import { startServer } from '../src/server.js';

const args = process.argv.slice(2);
const command = args[0];

const printUsage = () => {
  console.log('Usage: mcp start [--port <number>]');
};

const parsePort = () => {
  const portFlagIndex = args.indexOf('--port');
  if (portFlagIndex !== -1) {
    const value = args[portFlagIndex + 1];
    if (!value) {
      throw new Error('Missing value for --port');
    }
    const parsed = Number.parseInt(value, 10);
    if (!Number.isFinite(parsed)) {
      throw new Error('Port must be a number');
    }
    return parsed;
  }

  const inlineFlag = args.find((argument) => argument.startsWith('--port='));
  if (inlineFlag) {
    const [, value] = inlineFlag.split('=');
    const parsed = Number.parseInt(value, 10);
    if (!Number.isFinite(parsed)) {
      throw new Error('Port must be a number');
    }
    return parsed;
  }

  return undefined;
};

const main = async () => {
  if (command !== 'start') {
    printUsage();
    process.exit(command ? 1 : 0);
    return;
  }

  let port;
  try {
    port = parsePort();
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }

  try {
    const server = await startServer({ port });
    const address = server.address();
    const listeningPort = typeof address === 'object' && address ? address.port : port;
    console.log(`MCP server listening on port ${listeningPort}`);

    const shutdown = () => {
      console.log('\nShutting down MCP server...');
      server.close(() => {
        process.exit(0);
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (error) {
    console.error(`Failed to start MCP server: ${error.message}`);
    process.exit(1);
  }
};

main();
