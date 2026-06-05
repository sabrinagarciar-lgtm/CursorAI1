import type {
  DailyPoint,
  DashboardFilters,
  KpiSnapshot,
  Region,
  RegionShare,
  Segment,
  TransactionRow,
} from './types';

/** Deterministic “random” 0–1 from a string key (stable mock KPIs). */
function hash01(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 2 ** 32;
}

const REGIONS: Region[] = ['NA', 'EU', 'APAC', 'LATAM'];
const SEGMENTS: Segment[] = ['Enterprise', 'SMB', 'Self-serve'];
const PRODUCTS = [
  'Analytics Suite',
  'Data Pipeline',
  'API Gateway',
  'Stream Connect',
  'ML Workbench',
  'Security Hub',
  'Warehouse Sync',
  'Edge Cache',
] as const;

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDays(d: Date, n: number): Date {
  const next = new Date(d);
  next.setDate(next.getDate() + n);
  return next;
}

function daysBetweenInclusive(from: string, to: string): number {
  const a = new Date(`${from}T12:00:00`);
  const b = new Date(`${to}T12:00:00`);
  return Math.round((b.getTime() - a.getTime()) / 86400000) + 1;
}

function parseYmd(s: string): Date {
  return new Date(`${s}T12:00:00`);
}

export function defaultDashboardFilters(): DashboardFilters {
  const to = new Date();
  const from = addDays(to, -29);
  return {
    region: 'all',
    segment: 'all',
    search: '',
    dateFrom: isoDate(from),
    dateTo: isoDate(to),
  };
}

export function buildMockTransactions(): TransactionRow[] {
  const end = new Date();
  const start = addDays(end, -400);
  const rows: TransactionRow[] = [];

  for (let i = 0; i < 180; i += 1) {
    const dayOffset = Math.floor((i * 17) % 397);
    const day = addDays(start, dayOffset);
    const id = `txn-${isoDate(day)}-${i}`;
    const region = REGIONS[i % REGIONS.length];
    const segment = SEGMENTS[i % SEGMENTS.length];
    const product = PRODUCTS[i % PRODUCTS.length];
    const r0 = hash01(id);
    const revenue = Math.round((8000 + r0 * 42000) * (segment === 'Enterprise' ? 1.35 : segment === 'SMB' ? 1.05 : 0.85));
    const orders = Math.max(1, Math.round(2 + r0 * 18));
    rows.push({
      id,
      date: isoDate(day),
      region,
      segment,
      product,
      revenue,
      orders,
    });
  }

  return rows.sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
}

export const MOCK_TRANSACTIONS: TransactionRow[] = buildMockTransactions();

function matchesFilters(row: TransactionRow, f: DashboardFilters): boolean {
  if (f.region !== 'all' && row.region !== f.region) {
    return false;
  }
  if (f.segment !== 'all' && row.segment !== f.segment) {
    return false;
  }
  if (f.search.trim()) {
    const q = f.search.trim().toLowerCase();
    if (!row.product.toLowerCase().includes(q) && !row.id.toLowerCase().includes(q)) {
      return false;
    }
  }
  if (row.date < f.dateFrom || row.date > f.dateTo) {
    return false;
  }
  return true;
}

export function filterTransactions(rows: TransactionRow[], f: DashboardFilters): TransactionRow[] {
  return rows.filter(r => matchesFilters(r, f));
}

function sum<T>(arr: T[], pick: (t: T) => number): number {
  return arr.reduce((acc, t) => acc + pick(t), 0);
}

export function computeKpis(
  rows: TransactionRow[],
  filters: DashboardFilters
): { current: KpiSnapshot; previous: KpiSnapshot } {
  const duration = Math.max(1, daysBetweenInclusive(filters.dateFrom, filters.dateTo));
  const prevTo = addDays(parseYmd(filters.dateFrom), -1);
  const prevFrom = addDays(prevTo, -(duration - 1));

  const prevFilters: DashboardFilters = {
    ...filters,
    dateFrom: isoDate(prevFrom),
    dateTo: isoDate(prevTo),
  };

  const curRows = rows.filter(r => matchesFilters(r, filters));
  const prevRows = rows.filter(r => matchesFilters(r, prevFilters));

  const curRev = sum(curRows, r => r.revenue);
  const curOrders = sum(curRows, r => r.orders);
  const prevRev = sum(prevRows, r => r.revenue);
  const prevOrders = sum(prevRows, r => r.orders);

  const cur: KpiSnapshot = {
    totalRevenue: curRev,
    totalOrders: curOrders,
    avgOrderValue: curOrders > 0 ? curRev / curOrders : 0,
    revenueDeltaPct: prevRev > 0 ? ((curRev - prevRev) / prevRev) * 100 : null,
  };

  const prev: KpiSnapshot = {
    totalRevenue: prevRev,
    totalOrders: prevOrders,
    avgOrderValue: prevOrders > 0 ? prevRev / prevOrders : 0,
    revenueDeltaPct: null,
  };

  return { current: cur, previous: prev };
}

export function revenueByRegion(rows: TransactionRow[]): RegionShare[] {
  const map = new Map<Region, number>();
  for (const r of REGIONS) {
    map.set(r, 0);
  }
  for (const row of rows) {
    map.set(row.region, (map.get(row.region) ?? 0) + row.revenue);
  }
  return REGIONS.map(region => ({ region, revenue: map.get(region) ?? 0 }));
}

export function dailyRevenueSeries(rows: TransactionRow[]): DailyPoint[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    map.set(row.date, (map.get(row.date) ?? 0) + row.revenue);
  }
  return [...map.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, revenue]) => ({ date, revenue }));
}

export function formatCurrency(n: number): string {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: n >= 1000 ? 0 : 2,
  }).format(n);
}

export function formatCompactInt(n: number): string {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(n);
}
