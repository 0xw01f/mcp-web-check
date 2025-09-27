import { appendWarning } from '../utils/helpers.js';

const DAYS_BEFORE_EXPIRY_WARNING = process.env.CERT_EXPIRY_WARNING_DAYS
  ? Number.parseInt(process.env.CERT_EXPIRY_WARNING_DAYS, 10)
  : 30;

export const collectSecurityWarnings = ({
  ssl,
  headers,
  openPorts,
  shodanFindings = [],
  securityTrailsFindings = [],
  whoisFindings = [],
  executionWarnings = [],
}) => {
  const warnings = [...executionWarnings];

  if (!ssl?.valid) {
    appendWarning(warnings, 'TLS certificate validation failed or is not trusted.');
  }

  if (ssl?.expires) {
    const expiry = new Date(ssl.expires);
    if (!Number.isNaN(expiry.getTime())) {
      const now = new Date();
      const diffMs = expiry.getTime() - now.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      if (diffDays <= DAYS_BEFORE_EXPIRY_WARNING) {
        appendWarning(warnings, `TLS certificate expires in ${Math.max(0, Math.round(diffDays))} days.`);
      }
    }
  }

  const requiredHeaders = ['Strict-Transport-Security', 'Content-Security-Policy', 'X-Frame-Options'];
  requiredHeaders.forEach((header) => {
    if (!headers?.[header]) {
      appendWarning(warnings, `${header} header is missing.`);
    }
  });

  if (Array.isArray(openPorts) && openPorts.length > 0) {
    appendWarning(warnings, `Open ports detected: ${openPorts.join(', ')}.`);
  }

  shodanFindings.forEach((message) => appendWarning(warnings, message));
  securityTrailsFindings.forEach((message) => appendWarning(warnings, message));
  whoisFindings.forEach((message) => appendWarning(warnings, message));

  return warnings;
};
