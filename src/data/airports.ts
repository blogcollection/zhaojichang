import airportsData from './airports.json';

export interface PlanRow {
  [key: string]: string;
}

export interface PlanSection {
  section: string;
  rows: PlanRow[];
}

export interface Airport {
  id: number;
  slug: string;
  name: string;
  aliases: string;
  summary: string;
  url: string;
  officialUrl: string;
  telegramUrl: string;
  affiliateCode: string;
  currency: string;
  operatingInfo: string;
  lineArchitecture: string;
  protocols: string;
  nodeRegionsRaw: string;
  regions: string[];
  bandwidthOrSpeedClaims: string;
  deviceOrUsageLimits: string;
  clientSupport: string;
  platforms: string;
  paymentMethods: string;
  freeTrial: string;
  refundPolicy: string;
  discounts: string;
  unlockSupport: string;
  streamingServices: string[];
  aiServices: string[];
  clients: string[];
  lowestMonthlyPrice: number | null;
  lowestAnnualPrice: number | null;
  lowestOneTimePrice: number | null;
  plans: PlanSection[];
  testData: any;
  featureBullets: string[];
  purchaseAdvice: string;
  suitableFor: string[];
  notSuitableFor: string[];
  sourceFile: string;
  lastChecked: string;
  featuredOrder?: number;
}

const featuredOrderMap: Record<string, number> = {
  'invisibles': 1,      // 1. 隐形人
  'twilight': 2,        // 2. 暮光加速
  'flycat': 3,          // 3. 飞猫云
  'breezenet': 4,       // 4. 微风网络
  'wavenet': 5,         // 5. 浪网
  'laddercloud': 6,     // 6. 梯子云
  'lingdongcloud': 7,   // 7. 灵动云
  'flyv': 8,            // 8. flyv
};

export const airports: Airport[] = (airportsData as Airport[])
  .map((a) => ({
    ...a,
    featuredOrder: featuredOrderMap[a.slug],
  }))
  .sort((a, b) => {
    const orderA = a.featuredOrder ?? 999;
    const orderB = b.featuredOrder ?? 999;
    if (orderA !== orderB) {
      return orderA - orderB;
    }
    return 0;
  });

export function getAirports(): Airport[] {
  return airports;
}

export function getAirportBySlug(slug: string): Airport | undefined {
  return airports.find((a) => a.slug === slug);
}

// Data showcase (explicit catalog order, not ranking)
export function getCatalogOverviewAirports(limit = 8): Airport[] {
  return airports
    .filter((a) => typeof a.featuredOrder === 'number' && a.featuredOrder > 0)
    .sort((a, b) => (a.featuredOrder || 999) - (b.featuredOrder || 999))
    .slice(0, limit);
}

export function getFeaturedAirports(limit = 8): Airport[] {
  return getCatalogOverviewAirports(limit);
}

export function getCheapAirports(maxMonthlyPrice = 20): Airport[] {
  return airports.filter((a) => a.lowestMonthlyPrice !== null && a.lowestMonthlyPrice <= maxMonthlyPrice);
}

export function getMonthlyAirports(): Airport[] {
  return airports.filter((a) => a.lowestMonthlyPrice !== null && a.lowestMonthlyPrice > 0);
}

export function getAirportsByRegion(regionCn: string): Airport[] {
  return airports.filter((a) => 
    a.regions.includes(regionCn) || 
    a.nodeRegionsRaw.includes(regionCn) || 
    a.summary.includes(regionCn)
  );
}

/**
 * Strict AI service matching (e.g. 'ChatGPT', 'Claude', 'Gemini')
 */
export function getAirportsByAIService(serviceName: string): Airport[] {
  const s = serviceName.toLowerCase();
  return airports.filter((a) => 
    (a.aiServices && a.aiServices.some((item) => item.toLowerCase().includes(s))) ||
    a.summary.toLowerCase().includes(s)
  );
}

export function getAirportsByAI(): Airport[] {
  return getAirportsByAIService('chatgpt');
}

/**
 * Strict Streaming service matching (e.g. 'Netflix', 'Disney+', 'HBO', 'YouTube')
 */
export function getAirportsByStreamingService(serviceName: string): Airport[] {
  const s = serviceName.toLowerCase();
  return airports.filter((a) => 
    (a.streamingServices && a.streamingServices.some((item) => item.toLowerCase().includes(s))) ||
    a.summary.toLowerCase().includes(s)
  );
}

export function getAirportsByStreaming(): Airport[] {
  return getAirportsByStreamingService('netflix');
}

/**
 * Strict gaming match: only if raw service data explicitly indicates gaming / UDP / NAT support
 */
export function getAirportsForGaming(): Airport[] {
  return airports.filter((a) => {
    const rawText = `${a.summary} ${a.featureBullets.join(' ')} ${a.lineArchitecture}`.toLowerCase();
    return rawText.includes('游戏') || rawText.includes('gaming') || rawText.includes('udp') || rawText.includes('fullcone');
  });
}

export function getAirportsByClient(clientName: string): Airport[] {
  const cn = clientName.toLowerCase();
  return airports.filter((a) => 
    a.clients.some((c) => c.toLowerCase().includes(cn)) ||
    a.clientSupport.toLowerCase().includes(cn) ||
    a.summary.toLowerCase().includes(cn)
  );
}

export function getRelatedAirports(
  currentSlug: string,
  limit = 4,
  criteria?: { region?: string; ai?: boolean; streaming?: boolean; maxPrice?: number }
): Airport[] {
  const current = getAirportBySlug(currentSlug);
  const candidates = airports.filter((a) => a.slug !== currentSlug);

  return candidates
    .map((a) => {
      let score = 0;
      if (criteria?.region && (a.regions.includes(criteria.region) || a.nodeRegionsRaw.includes(criteria.region))) {
        score += 5;
      }
      if (criteria?.ai && a.aiServices.length > 0) {
        score += 4;
      }
      if (criteria?.streaming && a.streamingServices.length > 0) {
        score += 4;
      }
      if (criteria?.maxPrice && a.lowestMonthlyPrice && a.lowestMonthlyPrice <= criteria.maxPrice) {
        score += 3;
      }
      if (current) {
        if (a.lineArchitecture.includes('IPLC') && current.lineArchitecture.includes('IPLC')) score += 2;
        if (a.lineArchitecture.includes('IEPL') && current.lineArchitecture.includes('IEPL')) score += 2;
        const commonRegions = a.regions.filter((r) => current.regions.includes(r));
        score += commonRegions.length;
      }
      return { airport: a, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.airport);
}
