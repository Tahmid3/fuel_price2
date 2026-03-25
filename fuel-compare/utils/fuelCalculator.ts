// /utils/fuelCalculator.ts
// Core calculation logic for fuel price comparison

export type CouponMultiplier = 1 | 3 | 5 | 7;
export type FuelType = "e5" | "e10" | "diesel";

export interface PaybackParams {
  liters: number;
  pricePerLiter: number;
  couponMultiplier: CouponMultiplier;
  turboEnabled: boolean;
  pointValueCents?: number; // default: 1 cent per point
}

export interface CircleKParams {
  pricePerLiter: number;
  brand: string;
}

export interface StationResult {
  stationId: string;
  brand: string;
  name: string;
  address: string;
  distance: number;
  listedPrice: number;
  paybackEffectivePrice: number | null;
  circleKEffectivePrice: number | null;
  bestPrice: number;
  bestOption: "listed" | "payback" | "circlek";
  isOverallCheapest: boolean;
  breakEvenDelta: number | null; // cents more expensive Aral can be and still win with Payback
}

// Circle K discount table (€ per liter)
export const CIRCLE_K_DISCOUNTS: Record<string, number> = {
  totalenergies: 0.03,
  total: 0.03,
  aral: 0.02,
  avia: 0.02,
  eni: 0.02,
  agip: 0.02,
  westfalen: 0.02,
};

export const SUPPORTED_BRANDS = [
  "aral",
  "totalenergies",
  "total",
  "shell",
  "avia",
  "eni",
  "agip",
  "westfalen",
];

/**
 * Calculate effective price after Payback rewards
 */
export function calculatePaybackPrice(params: PaybackParams): {
  effectivePrice: number;
  totalPoints: number;
  cashback: number;
  basePoints: number;
  couponPoints: number;
  turboPoints: number;
} {
  const { liters, pricePerLiter, couponMultiplier, turboEnabled, pointValueCents = 1 } = params;

  const basePoints = Math.floor(liters / 2);
  const couponPoints = basePoints * couponMultiplier;
  const turboPoints = turboEnabled ? basePoints : 0;
  const totalPoints = couponPoints + turboPoints;

  const pointValueEuros = pointValueCents / 100;
  const cashback = totalPoints * pointValueEuros;

  const totalCost = liters * pricePerLiter;
  const effectivePrice = (totalCost - cashback) / liters;

  return {
    effectivePrice,
    totalPoints,
    cashback,
    basePoints,
    couponPoints,
    turboPoints,
  };
}

/**
 * Calculate effective price after Circle K card discount
 */
export function calculateCircleKPrice(params: CircleKParams): number | null {
  const brandKey = params.brand.toLowerCase().replace(/[^a-z]/g, "");
  const discount = CIRCLE_K_DISCOUNTS[brandKey];

  if (discount === undefined) return null;

  return params.pricePerLiter - discount;
}

/**
 * Find the best option among all prices for a single station
 */
export function findBestOption(
  listedPrice: number,
  paybackPrice: number | null,
  circleKPrice: number | null
): { bestPrice: number; bestOption: "listed" | "payback" | "circlek" } {
  let bestPrice = listedPrice;
  let bestOption: "listed" | "payback" | "circlek" = "listed";

  if (paybackPrice !== null && paybackPrice < bestPrice) {
    bestPrice = paybackPrice;
    bestOption = "payback";
  }

  if (circleKPrice !== null && circleKPrice < bestPrice) {
    bestPrice = circleKPrice;
    bestOption = "circlek";
  }

  return { bestPrice, bestOption };
}

/**
 * Calculate break-even delta: how much more expensive Aral can be and still
 * be cheaper after Payback vs. a competitor's listed price
 */
export function calculateBreakEven(
  competitorPrice: number,
  aralListedPrice: number,
  liters: number,
  couponMultiplier: CouponMultiplier,
  turboEnabled: boolean,
  pointValueCents: number = 1
): number {
  const aralPayback = calculatePaybackPrice({
    liters,
    pricePerLiter: aralListedPrice,
    couponMultiplier,
    turboEnabled,
    pointValueCents,
  });

  // delta = competitorPrice - aralEffective (positive means Aral is cheaper)
  return (competitorPrice - aralPayback.effectivePrice) * 100; // in cents
}

/**
 * Normalize brand name to a consistent key
 */
export function normalizeBrand(brand: string): string {
  return brand.toLowerCase().replace(/[^a-z]/g, "");
}

/**
 * Check if a brand is supported
 */
export function isSupportedBrand(brand: string): boolean {
  const normalized = normalizeBrand(brand);
  return SUPPORTED_BRANDS.some((b) => normalized.includes(b) || b.includes(normalized));
}

/**
 * Get the display name for a brand
 */
export function getBrandDisplayName(brand: string): string {
  const normalized = normalizeBrand(brand);
  const map: Record<string, string> = {
    aral: "Aral",
    totalenergies: "TotalEnergies",
    total: "TotalEnergies",
    shell: "Shell",
    avia: "AVIA",
    eni: "ENI",
    agip: "ENI",
    westfalen: "Westfalen",
  };

  for (const [key, display] of Object.entries(map)) {
    if (normalized.includes(key)) return display;
  }

  return brand;
}

/**
 * Get brand color for UI
 */
export function getBrandColor(brand: string): string {
  const normalized = normalizeBrand(brand);
  if (normalized.includes("aral")) return "#009FE3";
  if (normalized.includes("total")) return "#D22630";
  if (normalized.includes("shell")) return "#FFD700";
  if (normalized.includes("avia")) return "#E30613";
  if (normalized.includes("eni") || normalized.includes("agip")) return "#FFD700";
  if (normalized.includes("westfalen")) return "#004A9B";
  return "#6B7280";
}
