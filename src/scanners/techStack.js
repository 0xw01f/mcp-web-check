import Wappalyzer from 'wappalyzer';
import { normalizeDomain, uniq } from '../utils/helpers.js';

export const scanTechStack = async (domain) => {
  const hostname = normalizeDomain(domain);
  const url = `https://${hostname}`;

  let wappalyzer;
  const options = {
    debug: false,
    maxDepth: 3,
    maxUrls: 10,
    maxWait: 7000,
  };

  try {
    wappalyzer = new Wappalyzer(options);
    await wappalyzer.init();
    const site = await wappalyzer.open(url);
    const results = await site.analyze();
    const names = results?.technologies?.map((tech) => tech?.name).filter(Boolean) || [];
    return uniq(names);
  } catch (error) {
    return [];
  } finally {
    if (wappalyzer) {
      await wappalyzer.destroy();
    }
  }
};
