import net from 'net';
import { normalizeDomain } from '../utils/helpers.js';

const DEFAULT_PORTS = [
  21, 22, 25, 53, 80, 110, 143, 161, 389, 443,
  465, 587, 993, 995, 1433, 1521, 2083, 2087,
  3306, 3389, 5432, 5900, 6379, 8080, 8443,
];

const parsePortList = () => {
  if (!process.env.PORTS_TO_CHECK) return DEFAULT_PORTS;
  return process.env.PORTS_TO_CHECK
    .split(',')
    .map((value) => Number.parseInt(value.trim(), 10))
    .filter((value) => Number.isFinite(value) && value > 0 && value <= 65535);
};

const checkPort = (host, port) => {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    const timeout = process.env.PORT_CHECK_TIMEOUT_MS
      ? Number.parseInt(process.env.PORT_CHECK_TIMEOUT_MS, 10)
      : 1500;

    const cleanup = () => {
      try {
        socket.destroy();
      } catch (error) {
        // ignore cleanup errors
      }
    };

    socket.setTimeout(timeout);

    socket.once('connect', () => {
      cleanup();
      resolve(port);
    });

    socket.once('timeout', () => {
      cleanup();
      reject(new Error('timeout'));
    });

    socket.once('error', (error) => {
      cleanup();
      reject(error);
    });

    socket.connect(port, host);
  });
};

export const scanOpenPorts = async (domain) => {
  const host = normalizeDomain(domain);
  const ports = parsePortList();

  const results = await Promise.allSettled(ports.map((port) => checkPort(host, port)));
  return results
    .filter((result) => result.status === 'fulfilled')
    .map((result) => result.value)
    .sort((a, b) => a - b);
};
