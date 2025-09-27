import { scanSsl } from './scanners/ssl.js';
import { scanHeaders } from './scanners/headers.js';
import { scanDns } from './scanners/dns.js';
import { scanTechStack } from './scanners/techStack.js';
import { scanOpenPorts } from './scanners/ports.js';
import { scanPerformance } from './scanners/performance.js';
import { collectSecurityWarnings } from './scanners/security.js';
import { fetchShodanWarnings } from './integrations/shodan.js';
import { fetchSecurityTrailsWarnings } from './integrations/securityTrails.js';
import { fetchWhoisWarnings } from './integrations/whois.js';
import { normalizeDomain, appendWarning } from './utils/helpers.js';

const sslFallback = { valid: false, issuer: null, expires: null };
const dnsFallback = { A: [], MX: [], TXT: [] };
const performanceFallback = { loadTimeMs: null, score: null };

const safeInvoke = async (fn, fallbackValue, warnings, warningLabel) => {
  try {
    const value = await fn();
    return value ?? fallbackValue;
  } catch (error) {
    appendWarning(warnings, `${warningLabel}: ${error.message}`);
    return fallbackValue;
  }
};

export const scanDomain = async ({ domain }) => {
  if (!domain) {
    throw new Error('scanDomain requires a domain property');
  }

  const warnings = [];
  const hostname = normalizeDomain(domain);

  const ssl = await safeInvoke(() => scanSsl(hostname), sslFallback, warnings, 'SSL check failed');

  const [headers, dns, techStack, openPorts] = await Promise.all([
    safeInvoke(() => scanHeaders(hostname), {}, warnings, 'Header scan failed'),
    safeInvoke(() => scanDns(hostname), dnsFallback, warnings, 'DNS lookup failed'),
    safeInvoke(() => scanTechStack(hostname), [], warnings, 'Technology scan failed'),
    safeInvoke(() => scanOpenPorts(hostname), [], warnings, 'Port scan failed'),
  ]);

  const performance = await safeInvoke(
    () => scanPerformance(hostname),
    performanceFallback,
    warnings,
    'Performance check failed',
  );

  const primaryIp = dns?.A?.[0] || null;

  const [shodanWarnings, securityTrailsWarnings, whoisWarnings] = await Promise.all([
    safeInvoke(
      () => fetchShodanWarnings(primaryIp),
      [],
      warnings,
      'Shodan integration failed',
    ),
    safeInvoke(
      () => fetchSecurityTrailsWarnings(hostname),
      [],
      warnings,
      'SecurityTrails integration failed',
    ),
    safeInvoke(
      () => fetchWhoisWarnings(hostname),
      [],
      warnings,
      'WHOIS integration failed',
    ),
  ]);

  const securityWarnings = collectSecurityWarnings({
    ssl,
    headers,
    openPorts,
    shodanFindings: shodanWarnings,
    securityTrailsFindings: securityTrailsWarnings,
    whoisFindings: whoisWarnings,
    executionWarnings: warnings,
  });

  return {
    domain: hostname,
    ssl,
    headers,
    dns,
    techStack,
    openPorts,
    securityWarnings,
    performance,
  };
};

export default scanDomain;
