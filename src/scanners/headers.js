import axios from 'axios';
import { normalizeDomain } from '../utils/helpers.js';

const HEADER_MAP = {
  server: 'Server',
  'x-powered-by': 'X-Powered-By',
  'strict-transport-security': 'Strict-Transport-Security',
  'content-security-policy': 'Content-Security-Policy',
  'x-frame-options': 'X-Frame-Options',
  'x-content-type-options': 'X-Content-Type-Options',
  'referrer-policy': 'Referrer-Policy',
};

const requestOptions = {
  timeout: process.env.HTTP_TIMEOUT_MS ? Number.parseInt(process.env.HTTP_TIMEOUT_MS, 10) : 12000,
  maxRedirects: 5,
  validateStatus: (status) => status < 600,
};

const fetchWithProtocol = async (hostname, protocol) => {
  const url = `${protocol}://${hostname}`;
  const response = await axios.get(url, requestOptions);
  return response.headers || {};
};

export const scanHeaders = async (domain) => {
  const hostname = normalizeDomain(domain);

  let headers = {};
  try {
    headers = await fetchWithProtocol(hostname, 'https');
  } catch (error) {
    try {
      headers = await fetchWithProtocol(hostname, 'http');
    } catch (fallbackError) {
      return {};
    }
  }

  return Object.entries(HEADER_MAP).reduce((acc, [key, label]) => {
    if (headers[key]) {
      acc[label] = headers[key];
    }
    return acc;
  }, {});
};
