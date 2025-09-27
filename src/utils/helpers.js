const DEFAULT_TIMEOUT_MS = process.env.SCAN_TIMEOUT_MS
  ? Number.parseInt(process.env.SCAN_TIMEOUT_MS, 10)
  : 45000;

export const withDefaultTimeout = (promise, timeoutMs = DEFAULT_TIMEOUT_MS) => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Operation timed out after ${timeoutMs} ms`));
    }, timeoutMs);

    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
};

export const normalizeDomain = (input) => {
  if (!input) {
    throw new Error('Domain is required');
  }

  const trimmed = input.trim().replace(/\/$/, '');
  try {
    const url = new URL(trimmed.includes('://') ? trimmed : `https://${trimmed}`);
    return url.hostname.toLowerCase();
  } catch (error) {
    throw new Error(`Invalid domain: ${input}`);
  }
};

export const buildHttpsUrl = (domain, path = '/') => {
  const normalized = normalizeDomain(domain);
  return `https://${normalized}${path.startsWith('/') ? path : `/${path}`}`;
};

export const uniq = (list) => {
  return Array.from(new Set(list.filter(Boolean)));
};

export const appendWarning = (warnings, message) => {
  if (message && !warnings.includes(message)) {
    warnings.push(message);
  }
};
