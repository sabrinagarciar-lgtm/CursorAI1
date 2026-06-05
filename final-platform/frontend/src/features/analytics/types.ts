export type Region = 'NA' | 'EU' | 'APAC' | 'LATAM';

export type Segment = 'Enterprise' | 'SMB' | 'Self-serve';

export type ThemePreference = 'system' | 'light' | 'dark';

export interface TransactionRow {
  id: string;
  date: string;
  region: Region;
  segment: Segment;
  product: string;
  revenue: number;
  orders: number;
}

export interface DashboardFilters {
  region: Region | 'all';
  segment: Segment | 'all';
  search: string;
  /** Inclusive YYYY-MM-DD */
  dateFrom: string;
  /** Inclusive YYYY-MM-DD */
  dateTo: string;
}

export interface KpiSnapshot {
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  revenueDeltaPct: number | null;
}

export interface RegionShare {
  region: Region;
  revenue: number;
}

export interface DailyPoint {
  date: string;
  revenue: number;
}

/** Client-side sort for the transactions table (Exercise 4). */
export type TableSortOption =
  | 'date-desc'
  | 'date-asc'
  | 'revenue-desc'
  | 'revenue-asc'
  | 'product-asc';
