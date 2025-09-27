import axios from 'axios';
import { performance } from 'perf_hooks';
import { normalizeDomain } from '../utils/helpers.js';

const fallback = {
  loadTimeMs: null,
  score: null,
};

const computeScore = (loadTimeMs) => {
  if (typeof loadTimeMs !== 'number' || Number.isNaN(loadTimeMs)) return null;
  const clamped = Math.max(0, Math.min(4000, loadTimeMs));
  return Math.max(10, 100 - Math.round(clamped / 40));
};

export const scanPerformance = async (domain) => {
  const hostname = normalizeDomain(domain);
  const url = `https://${hostname}`;

  try {
    const start = performance.now();
    await axios.get(url, {
      timeout: process.env.HTTP_TIMEOUT_MS ? Number.parseInt(process.env.HTTP_TIMEOUT_MS, 10) : 12000,
      maxRedirects: 5,
      validateStatus: (status) => status < 600,
    });
    const end = performance.now();
    const loadTimeMs = Math.round(end - start);
    return {
      loadTimeMs,
      score: computeScore(loadTimeMs),
    };
  } catch (error) {
    return { ...fallback };
  }
};
