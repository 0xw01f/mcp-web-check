import axios from 'axios';

export const fetchShodanWarnings = async (ipAddress) => {
  const apiKey = process.env.SHODAN_API_KEY;
  if (!apiKey || !ipAddress) {
    return [];
  }

  try {
    const response = await axios.get(`https://api.shodan.io/shodan/host/${ipAddress}`, {
      params: { key: apiKey },
      timeout: process.env.EXTERNAL_API_TIMEOUT_MS
        ? Number.parseInt(process.env.EXTERNAL_API_TIMEOUT_MS, 10)
        : 10000,
    });

    const data = response.data || {};
    const warnings = [];

    if (Array.isArray(data.ports) && data.ports.length > 0) {
      warnings.push(`Shodan reports additional open ports: ${data.ports.join(', ')}.`);
    }

    const vulns = data.vulns ? Object.keys(data.vulns) : [];
    if (vulns.length > 0) {
      warnings.push(`Shodan vulnerability flags: ${vulns.join(', ')}.`);
    }

    if (Array.isArray(data.tags) && data.tags.length > 0) {
      warnings.push(`Shodan tags domain as: ${data.tags.join(', ')}.`);
    }

    return warnings;
  } catch (error) {
    throw new Error(`Shodan lookup failed: ${error.message}`);
  }
};
