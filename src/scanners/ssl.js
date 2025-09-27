import tls from 'tls';
import { normalizeDomain } from '../utils/helpers.js';

const DEFAULT_SSL_PORT = process.env.SSL_PORT ? Number.parseInt(process.env.SSL_PORT, 10) : 443;

const fallback = {
  valid: false,
  issuer: null,
  expires: null,
};

const toIsoDate = (input) => {
  if (!input) return null;
  const parsed = new Date(input);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().split('T')[0];
};

export const scanSsl = async (domain) => {
  const host = normalizeDomain(domain);

  return await new Promise((resolve) => {
    const options = {
      host,
      port: DEFAULT_SSL_PORT,
      servername: host,
      rejectUnauthorized: false,
    };

    const socket = tls.connect(options, () => {
      try {
        const certificate = socket.getPeerCertificate(true);

        if (!certificate || !Object.keys(certificate).length) {
          resolve({ ...fallback, valid: false });
          return;
        }

        const issuer = certificate.issuer?.O
          || certificate.issuer?.organizationName
          || certificate.issuer?.CN
          || null;

        resolve({
          valid: socket.authorized,
          issuer,
          expires: toIsoDate(certificate.valid_to),
        });
      } catch (error) {
        resolve({ ...fallback });
      } finally {
        socket.end();
      }
    });

    const handleFailure = () => {
      try {
        socket.destroy();
      } catch (error) {
        // ignore destroy errors
      }
      resolve({ ...fallback });
    };

    socket.setTimeout(5000, handleFailure);
    socket.once('error', handleFailure);
  });
};
