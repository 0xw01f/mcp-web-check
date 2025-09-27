import axios from 'axios';

const DEFAULT_ENDPOINT = 'https://www.whoisxmlapi.com/whoisserver/WhoisService';

export const fetchWhoisWarnings = async (domain) => {
  const apiKey = process.env.WHOIS_API_KEY;
  if (!apiKey) {
    return [];
  }

  const endpoint = process.env.WHOIS_API_ENDPOINT || DEFAULT_ENDPOINT;

  try {
    const response = await axios.get(endpoint, {
      params: {
        apiKey,
        domainName: domain,
        outputFormat: 'JSON',
      },
      timeout: process.env.EXTERNAL_API_TIMEOUT_MS
        ? Number.parseInt(process.env.EXTERNAL_API_TIMEOUT_MS, 10)
        : 10000,
    });

    const record = response.data?.WhoisRecord || {};
    const warnings = [];

    const expires = record.registryData?.expiresDate || record.expiresDate;
    if (expires) {
      const expiry = new Date(expires);
      if (!Number.isNaN(expiry.getTime())) {
        const now = new Date();
        const diffDays = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        if (diffDays < 30) {
          warnings.push(`WHOIS data shows domain expiring in ${Math.max(0, Math.round(diffDays))} days.`);
        }
      }
    }

    if (Array.isArray(record.statuses) && record.statuses.some((status) => status.toLowerCase().includes('hold'))) {
      warnings.push(`WHOIS status indicates domain hold: ${record.statuses.join(', ')}.`);
    }

    return warnings;
  } catch (error) {
    throw new Error(`WHOIS lookup failed: ${error.message}`);
  }
};
