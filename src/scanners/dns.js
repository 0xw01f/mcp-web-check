import { promises as dns } from 'dns';
import { normalizeDomain, uniq } from '../utils/helpers.js';

export const scanDns = async (domain) => {
  const hostname = normalizeDomain(domain);

  const result = {
    A: [],
    MX: [],
    TXT: [],
  };

  try {
    result.A = await dns.resolve4(hostname);
  } catch (error) {
    result.A = [];
  }

  try {
    const mxRecords = await dns.resolveMx(hostname);
    result.MX = uniq(mxRecords.map((record) => `${record.exchange}:${record.priority}`));
  } catch (error) {
    result.MX = [];
  }

  try {
    const txtRecords = await dns.resolveTxt(hostname);
    result.TXT = uniq(txtRecords.map((entry) => entry.join(' ').trim()));
  } catch (error) {
    result.TXT = [];
  }

  return result;
};
