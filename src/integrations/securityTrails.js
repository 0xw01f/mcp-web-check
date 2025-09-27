import axios from 'axios';

const DEFAULT_ENDPOINT = 'https://api.securitytrails.com/v1/domain';

export const fetchSecurityTrailsWarnings = async (domain) => {
  const apiKey = process.env.SECURITYTRAILS_API_KEY;
  if (!apiKey) {
    return [];
  }

  const endpoint = process.env.SECURITYTRAILS_ENDPOINT || DEFAULT_ENDPOINT;

  try {
    const response = await axios.get(`${endpoint}/${domain}`, {
      headers: {
        APIKEY: apiKey,
      },
      timeout: process.env.EXTERNAL_API_TIMEOUT_MS
        ? Number.parseInt(process.env.EXTERNAL_API_TIMEOUT_MS, 10)
        : 10000,
    });

    const data = response.data || {};
    const warnings = [];

    if (Array.isArray(data.security_categories) && data.security_categories.length > 0) {
      warnings.push(`SecurityTrails categories: ${data.security_categories.join(', ')}.`);
    }

    if (data.current_dns?.soa?.status && data.current_dns.soa.status !== 'active') {
      warnings.push(`SecurityTrails SOA status: ${data.current_dns.soa.status}.`);
    }

    if (data.risk_score && Number.isFinite(Number.parseFloat(data.risk_score))) {
      warnings.push(`SecurityTrails risk score: ${data.risk_score}.`);
    }

    return warnings;
  } catch (error) {
    throw new Error(`SecurityTrails lookup failed: ${error.message}`);
  }
};
