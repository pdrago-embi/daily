import { Router, type Request, type Response } from "express";
import axios, { type AxiosInstance } from "axios";

const router = Router();

interface CacheEntry {
  data: unknown;
  expiry: number;
}

const cache = new Map<string, CacheEntry>();

const CACHE_TTL_MS = 5 * 60 * 1000;

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiry) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCache(key: string, data: unknown): void {
  cache.set(key, { data, expiry: Date.now() + CACHE_TTL_MS });
}

function createCacheKey(prefix: string, params: URLSearchParams): string {
  return `${prefix}:${params.toString()}`;
}

function createClient(): AxiosInstance {
  const baseURL = process.env.API_BASE_URL?.replace(/\/$/, "");
  const token = process.env.API_TOKEN;
  if (!baseURL || !token) {
    throw new Error("API_BASE_URL and API_TOKEN must be set in .env");
  }
  return axios.create({
    baseURL,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    timeout: 60_000,
  });
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setUTCDate(x.getUTCDate() + n);
  return x;
}

/** YYYY-MM-DD in UTC */
function todayUtc(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function parseUtcYmd(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

/** Inclusive day count between two YYYY-MM-DD dates (UTC). */
function daysInclusive(start: string, end: string): number {
  const s = parseUtcYmd(start).getTime();
  const e = parseUtcYmd(end).getTime();
  return Math.round((e - s) / 86_400_000) + 1;
}

/** Monday (UTC) of the ISO week containing `ymd`. */
function startOfWeekMonday(ymd: string): string {
  const d = parseUtcYmd(ymd);
  const dow = d.getUTCDay();
  const daysFromMonday = (dow + 6) % 7;
  return formatDate(addDays(d, -daysFromMonday));
}

function shortMd(ymd: string): string {
  const [, mo, da] = ymd.split("-");
  return `${mo}/${da}`;
}

function capitalizeEs(s: string): string {
  if (!s) return s;
  return s.charAt(0).toLocaleUpperCase("es") + s.slice(1);
}

/** Previous calendar month + current month (up to yesterday), local time. */
function summaryMonthWindows(): {
  prevMonthStart: string;
  prevMonthEnd: string;
  currentMonthStart: string;
  currentMonthEnd: string;
  currentMonthDaysElapsed: number;
  daysInMonth: number;
  hasCurrentMonthData: boolean;
} {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1=enero, ..., 12=diciembre
  const currentDay = now.getDate();

  // Mes actual (el mes calendario actual)
  const currentMonthStart = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;
  const lastDay = new Date(currentYear, currentMonth, 0).getDate();
  const currentMonthEnd = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  // Mes anterior
  let pm = currentMonth - 1;
  let py = currentYear;
  if (pm < 0) {
    pm = 12;
    py -= 1;
  }
  const prevMonthStart = `${py}-${String(pm).padStart(2, '0')}-01`;
  const prevMonthEndDay = new Date(py, pm, 0).getDate();
  const prevMonthEnd = `${py}-${String(pm).padStart(2, '0')}-${String(prevMonthEndDay).padStart(2, '0')}`;

  // Si hoy es día 1, no hay datos del mes actual aún (solo datos de ayer que son del mes anterior)
  const hasCurrentMonthData = currentDay > 1;
  
  // Los días con datos del mes actual son: (hoy - 1), pero máximo (días del mes - 1) si estamos a fin de mes
  // Si hoy es día 1, no hay datos = 0
  // Si hoy es día 2, hay 1 día de datos (ayer)
  // Si hoy es día 15, hay 14 días de datos
  const currentMonthDaysElapsed = hasCurrentMonthData ? currentDay - 1 : 0;

  return {
    prevMonthStart,
    prevMonthEnd,
    currentMonthStart,
    currentMonthEnd,
    currentMonthDaysElapsed,
    daysInMonth: lastDay,
    hasCurrentMonthData,
  };
}

const monthsEs = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
];

function monthTitleEs(ymd: string): string {
  const [y, m] = ymd.split("-").map(Number);
  const mes = monthsEs[m - 1];
  return `${mes.charAt(0).toLocaleUpperCase("es") + mes.slice(1)} de ${y}`;
}

function isSashaPublisherName(name: string | undefined): boolean {
  return (name ?? "").trim().toUpperCase().startsWith("SB");
}

function isGamNetworkName(name: string | undefined): boolean {
  return (name ?? "").trim().toUpperCase() === "GAM";
}

interface VariationPeriodWindows {
  currentStart: string;
  currentEnd: string;
  previousStart: string;
  previousEnd: string;
  periodCurrentLabel: string;
  periodPreviousLabel: string;
}

function todayLocal(): Date {
  return new Date();
}

function variationPeriodWindows(period: "day" | "week" | "month"): VariationPeriodWindows {
  const now = new Date();
  const localYear = now.getFullYear();
  const localMonth = now.getMonth() + 1;
  const localDay = now.getDate();

  const todayLocal = new Date(localYear, localMonth - 1, localDay);
  const yesterdayLocal = new Date(localYear, localMonth - 1, localDay - 1);
  const dayBeforeLocal = new Date(localYear, localMonth - 1, localDay - 2);

  const yesterday = formatDate(yesterdayLocal);
  const dayBefore = formatDate(dayBeforeLocal);

  if (period === "day") {
    return {
      currentStart: yesterday,
      currentEnd: yesterday,
      previousStart: dayBefore,
      previousEnd: dayBefore,
      periodCurrentLabel: `Ayer (${shortMd(yesterday)})`,
      periodPreviousLabel: `Anteayer (${shortMd(dayBefore)})`,
    };
  }

  if (period === "week") {
    const currentStart = startOfWeekMonday(yesterday);
    const currentEnd = yesterday;
    const previousEnd = formatDate(addDays(parseUtcYmd(currentStart), -1));
    const previousStart = formatDate(addDays(parseUtcYmd(previousEnd), -6));
    return {
      currentStart,
      currentEnd,
      previousStart,
      previousEnd,
      periodCurrentLabel: `Semana actual (${shortMd(currentStart)}–${shortMd(currentEnd)})`,
      periodPreviousLabel: `Semana ant. (${shortMd(previousStart)}–${shortMd(previousEnd)})`,
    };
  }

  const [y, m] = yesterday.split("-").map(Number);
  const currentStart = formatDate(new Date(Date.UTC(y, m - 1, 1)));
  const currentEnd = yesterday;
  let py = y;
  let pm = m - 1;
  if (pm < 1) {
    pm = 12;
    py -= 1;
  }
  const previousStart = formatDate(new Date(Date.UTC(py, pm - 1, 1)));
  const previousEnd = formatDate(new Date(Date.UTC(py, pm, 0)));

  return {
    currentStart,
    currentEnd,
    previousStart,
    previousEnd,
    periodCurrentLabel: `${monthTitleEs(currentStart)}`,
    periodPreviousLabel: `${monthTitleEs(previousStart)}`,
  };
}

interface AggregatedRow {
  date?: string;
  publisher_id?: number;
  publisher_name?: string;
  network_id?: number;
  network_name?: string;
  gam_network_id?: number;
  gam_network_name?: string;
  total_revenue?: number;
  total_cost?: number;
  total_profit?: number;
  total_impressions?: number;
  total_ad_requests?: number;
}

interface MetricsRow {
  date?: string;
  publisher_id?: number;
  publisher_name?: string;
  ad_unit_id?: number;
  ad_unit_name?: string;
  network_id?: number;
  network_name?: string;
  gam_network_id?: number;
  gam_network_name?: string;
  ad_requests?: number;
  impressions?: number;
  revenue?: number;
  cost?: number;
  profit?: number;
}

interface MetricsListResponse {
  data: MetricsRow[];
  pagination?: {
    currentPage: number;
    pageSize: number;
    totalRecords: number;
    totalPages: number;
  };
}

function appendTenantParams(params: URLSearchParams): void {
  const tid = process.env.TENANT_ID;
  if (tid) params.set("tenant_id", tid);
}

export interface TrendPoint {
  date: string;
  revenue: number;
  cost: number;
  profit: number;
}

export interface VariationRow {
  id: string;
  name: string;
  /** Present for ad-unit rows when grouped with publisher */
  publisherName?: string;
  revenueCurrent: number;
  revenuePrevious: number;
  delta: number;
  deltaPct: number | null;
  impressionsCurrent?: number;
  impressionsPrevious?: number;
  impressionsDelta?: number;
  impressionsDeltaPct?: number | null;
  adRequestsCurrent?: number;
  adRequestsPrevious?: number;
  adRequestsDelta?: number;
  adRequestsDeltaPct?: number | null;
}

async function fetchAggregatedByPublisher(
  client: AxiosInstance,
  startDate: string,
  endDate: string
): Promise<AggregatedRow[]> {
  const params = new URLSearchParams();
  appendTenantParams(params);
  params.set("groupBy", "publisher");
  params.set("startDate", startDate);
  params.set("endDate", endDate);
  const cacheKey = createCacheKey("agg-pub", params);
  const cached = getCached<{ data: AggregatedRow[] }>(cacheKey);
  if (cached) return cached.data ?? [];
  const { data } = await client.get<{ data: AggregatedRow[] }>(
    `/api/metrics/aggregated?${params.toString()}`
  );
  setCache(cacheKey, data);
  return data.data ?? [];
}

async function fetchAggregatedByNetwork(
  client: AxiosInstance,
  startDate: string,
  endDate: string
): Promise<AggregatedRow[]> {
  const params = new URLSearchParams();
  appendTenantParams(params);
  params.set("groupBy", "network");
  params.set("startDate", startDate);
  params.set("endDate", endDate);
  const cacheKey = createCacheKey("agg-net", params);
  const cached = getCached<{ data: AggregatedRow[] }>(cacheKey);
  if (cached) return cached.data ?? [];
  const { data } = await client.get<{ data: AggregatedRow[] }>(
    `/api/metrics/aggregated?${params.toString()}`
  );
  setCache(cacheKey, data);
  return data.data ?? [];
}

async function fetchAggregatedByGamNetwork(
  client: AxiosInstance,
  startDate: string,
  endDate: string
): Promise<AggregatedRow[]> {
  const params = new URLSearchParams();
  appendTenantParams(params);
  params.set("groupBy", "gam_network");
  params.set("startDate", startDate);
  params.set("endDate", endDate);
  const cacheKey = createCacheKey("agg-gam", params);
  const cached = getCached<{ data: AggregatedRow[] }>(cacheKey);
  if (cached) return cached.data ?? [];
  const { data } = await client.get<{ data: AggregatedRow[] }>(
    `/api/metrics/aggregated?${params.toString()}`
  );
  setCache(cacheKey, data);
  return data.data ?? [];
}

/** Coerce any API value to a finite number (counts and monetary fields). */
function toNum(v: unknown): number {
  const n = Number(v);
  return isFinite(n) ? n : 0;
}

function isEmbiPublisherName(name: string | undefined): boolean {
  return (name ?? "").trim().toUpperCase().startsWith("EM");
}

router.get("/summary", async (req: Request, res: Response) => {
  try {
    const scopeRaw = String(req.query.scope ?? "general").toLowerCase();
    if (!["general", "sasha", "embi"].includes(scopeRaw)) {
      res.status(400).json({ error: "Invalid scope (use general, sasha, embi)" });
      return;
    }
    const scope = scopeRaw as "general" | "sasha" | "embi";

    const w = summaryMonthWindows();
    const client = createClient();

    // Query previous month always
    const prevPromise = fetchMetricsGrouped(client, w.prevMonthStart, w.prevMonthEnd, ["publisher"]);
    
    // Query current month only if there's data (not day 1)
    const curPromise = w.hasCurrentMonthData
      ? fetchMetricsGrouped(client, w.currentMonthStart, w.currentMonthEnd, ["publisher"])
      : Promise.resolve([]);

    const [prevRows, curRows] = await Promise.all([prevPromise, curPromise]);

    type PubSnap = {
      publisher_id: number;
      publisher_name: string;
      adRequests: number;
      impressions: number;
      revenue: number;
      cost: number;
      profit: number;
    };

    const prevById = new Map<number, PubSnap>();
    for (const row of prevRows) {
      const pid = row.publisher_id;
      if (pid == null) continue;
      const name = row.publisher_name ?? `Publisher ${pid}`;
      if (scope === "sasha" && !isSashaPublisherName(name)) continue;
      if (scope === "embi" && !isEmbiPublisherName(name)) continue;
      prevById.set(pid, {
        publisher_id: pid,
        publisher_name: name,
        adRequests: toNum(row.ad_requests),
        impressions: toNum(row.impressions),
        revenue: toNum(row.revenue),
        cost: toNum(row.cost),
        profit: toNum(row.profit),
      });
    }

    const curById = new Map<number, PubSnap>();
    for (const row of curRows) {
      const pid = row.publisher_id;
      if (pid == null) continue;
      const name = row.publisher_name ?? `Publisher ${pid}`;
      if (scope === "sasha" && !isSashaPublisherName(name)) continue;
      if (scope === "embi" && !isEmbiPublisherName(name)) continue;
      curById.set(pid, {
        publisher_id: pid,
        publisher_name: name,
        adRequests: toNum(row.ad_requests),
        impressions: toNum(row.impressions),
        revenue: toNum(row.revenue),
        cost: toNum(row.cost),
        profit: toNum(row.profit),
      });
    }

    let adRequestsPrev = 0;
    let impressionsPrev = 0;
    let revenuePrev = 0;
    let costPrev = 0;
    let profitPrev = 0;
    let adRequestsCur = 0;
    let impressionsCur = 0;
    let revenueCur = 0;
    let costCur = 0;
    let profitCur = 0;

    for (const [, p] of prevById) {
      adRequestsPrev += p.adRequests;
      impressionsPrev += p.impressions;
      revenuePrev += p.revenue;
      costPrev += p.cost;
      profitPrev += p.profit;
    }
    for (const [, c] of curById) {
      adRequestsCur += c.adRequests;
      impressionsCur += c.impressions;
      revenueCur += c.revenue;
      costCur += c.cost;
      profitCur += c.profit;
    }

    const publisherCountCurrent = [...curById.values()].filter(
      (c) => c.impressions >= 1000
    ).length;
    let publisherCountPrev = 0;
    for (const p of prevById.values()) {
      if (p.impressions >= 1000) publisherCountPrev += 1;
    }

    const de = w.currentMonthDaysElapsed;
    const dim = w.daysInMonth;
    const hasData = w.hasCurrentMonthData;
    const project = (cur: number): number => (hasData && de > 0) ? (cur / de) * dim : 0;

    res.json({
      scope,
      prevMonthLabel: monthTitleEs(w.prevMonthStart),
      currentMonthLabel: monthTitleEs(w.currentMonthStart),
      daysElapsed: de,
      daysInMonth: dim,
      hasCurrentMonthData: hasData,
      metrics: {
        adRequests: {
          prev: adRequestsPrev,
          current: hasData ? adRequestsCur : 0,
          projected: project(adRequestsCur),
        },
        impressions: {
          prev: impressionsPrev,
          current: hasData ? impressionsCur : 0,
          projected: project(impressionsCur),
        },
        revenue: {
          prev: revenuePrev,
          current: hasData ? revenueCur : 0,
          projected: project(revenueCur),
        },
        cost: {
          prev: costPrev,
          current: hasData ? costCur : 0,
          projected: project(costCur),
        },
        profit: {
          prev: profitPrev,
          current: hasData ? profitCur : 0,
          projected: project(profitCur),
        },
        publisherCount: {
          prev: publisherCountPrev,
          current: hasData ? publisherCountCurrent : 0,
          projected: null,
        },
      },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    const status =
      axios.isAxiosError(e) && e.response?.status ? e.response.status : 500;
    res.status(status).json({ error: msg });
  }
});

router.get("/summary/by-prefix/:prefix", async (req: Request, res: Response) => {
  try {
    const prefix = (String(req.params.prefix ?? "")).toUpperCase().trim();
    if (!prefix || prefix.length < 2) {
      res.status(400).json({ error: "Prefix is required (min 2 chars)" });
      return;
    }

    const w = summaryMonthWindows();
    const client = createClient();

    const prevPromise = fetchMetricsGrouped(client, w.prevMonthStart, w.prevMonthEnd, ["publisher"]);
    const curPromise = w.hasCurrentMonthData
      ? fetchMetricsGrouped(client, w.currentMonthStart, w.currentMonthEnd, ["publisher"])
      : Promise.resolve([]);

    const [prevRows, curRows] = await Promise.all([prevPromise, curPromise]);

    type PubSnap = {
      publisher_id: number;
      publisher_name: string;
      adRequests: number;
      impressions: number;
      revenue: number;
      cost: number;
      profit: number;
    };

    const prevById = new Map<number, PubSnap>();
    for (const row of prevRows) {
      const pid = row.publisher_id;
      if (pid == null) continue;
      const name = row.publisher_name ?? `Publisher ${pid}`;
      if (!(name.trim().toUpperCase().startsWith(prefix))) continue;
      prevById.set(pid, {
        publisher_id: pid,
        publisher_name: name,
        adRequests: toNum(row.ad_requests),
        impressions: toNum(row.impressions),
        revenue: toNum(row.revenue),
        cost: toNum(row.cost),
        profit: toNum(row.profit),
      });
    }

    const curById = new Map<number, PubSnap>();
    for (const row of curRows) {
      const pid = row.publisher_id;
      if (pid == null) continue;
      const name = row.publisher_name ?? `Publisher ${pid}`;
      if (!(name.trim().toUpperCase().startsWith(prefix))) continue;
      curById.set(pid, {
        publisher_id: pid,
        publisher_name: name,
        adRequests: toNum(row.ad_requests),
        impressions: toNum(row.impressions),
        revenue: toNum(row.revenue),
        cost: toNum(row.cost),
        profit: toNum(row.profit),
      });
    }

    let adRequestsPrev = 0;
    let impressionsPrev = 0;
    let revenuePrev = 0;
    let costPrev = 0;
    let profitPrev = 0;
    let adRequestsCur = 0;
    let impressionsCur = 0;
    let revenueCur = 0;
    let costCur = 0;
    let profitCur = 0;

    for (const [, p] of prevById) {
      adRequestsPrev += p.adRequests;
      impressionsPrev += p.impressions;
      revenuePrev += p.revenue;
      costPrev += p.cost;
      profitPrev += p.profit;
    }
    for (const [, c] of curById) {
      adRequestsCur += c.adRequests;
      impressionsCur += c.impressions;
      revenueCur += c.revenue;
      costCur += c.cost;
      profitCur += c.profit;
    }

    const publisherCountCurrent = [...curById.values()].filter((c) => c.impressions >= 1000).length;
    let publisherCountPrev = 0;
    for (const p of prevById.values()) {
      if (p.impressions >= 1000) publisherCountPrev += 1;
    }

    const de = w.currentMonthDaysElapsed;
    const dim = w.daysInMonth;
    const hasData = w.hasCurrentMonthData;
    const project = (cur: number): number => (hasData && de > 0) ? (cur / de) * dim : 0;

    res.json({
      scope: 'custom' as const,
      prevMonthLabel: monthTitleEs(w.prevMonthStart),
      currentMonthLabel: monthTitleEs(w.currentMonthStart),
      daysElapsed: de,
      daysInMonth: dim,
      hasCurrentMonthData: hasData,
      metrics: {
        adRequests: { prev: adRequestsPrev, current: hasData ? adRequestsCur : 0, projected: project(adRequestsCur) },
        impressions: { prev: impressionsPrev, current: hasData ? impressionsCur : 0, projected: project(impressionsCur) },
        revenue: { prev: revenuePrev, current: hasData ? revenueCur : 0, projected: project(revenueCur) },
        cost: { prev: costPrev, current: hasData ? costCur : 0, projected: project(costCur) },
        profit: { prev: profitPrev, current: hasData ? profitCur : 0, projected: project(profitCur) },
        publisherCount: { prev: publisherCountPrev, current: hasData ? publisherCountCurrent : 0, projected: null },
      },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    const status = axios.isAxiosError(e) && e.response?.status ? e.response.status : 500;
    res.status(status).json({ error: msg });
  }
});

router.get("/trend/sasha", async (_req: Request, res: Response) => {
  try {
    const client = createClient();
    const end = addDays(todayLocal(), -1);
    const start = addDays(end, -29);
    const prefix = "SB";

    const discoverEnd = formatDate(end);
    const discoverStart = formatDate(addDays(end, -364));
    const discoverRows = await fetchMetricsGrouped(
      client,
      discoverStart,
      discoverEnd,
      ["publisher"]
    );

    const sashaIds = new Set<number>();
    for (const row of discoverRows) {
      const name = row.publisher_name ?? "";
      if (!name.trim().toUpperCase().startsWith(prefix.toUpperCase())) continue;
      if (row.publisher_id != null) sashaIds.add(row.publisher_id);
    }

    if (sashaIds.size === 0) {
      res.json({ data: [] as TrendPoint[] });
      return;
    }

    const params = new URLSearchParams();
    appendTenantParams(params);
    params.set("groupBy", "date");
    params.set("startDate", formatDate(start));
    params.set("endDate", formatDate(end));
    params.set("publisherIds", [...sashaIds].join(","));

    const { data } = await client.get<{ data: AggregatedRow[] }>(
      `/api/metrics/aggregated?${params.toString()}`
    );

    const byDate = new Map<string, TrendPoint>();
    for (const row of data.data ?? []) {
      if (!row.date) continue;
      byDate.set(row.date, {
        date: row.date,
        revenue: row.total_revenue ?? 0,
        cost: row.total_cost ?? 0,
        profit: row.total_profit ?? 0,
      });
    }

    const series: TrendPoint[] = [];
    for (let i = 0; i < 30; i++) {
      const d = formatDate(addDays(start, i));
      series.push(
        byDate.get(d) ?? {
          date: d,
          revenue: 0,
          cost: 0,
          profit: 0,
        }
      );
    }

    res.json({ data: series });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    const status =
      axios.isAxiosError(e) && e.response?.status ? e.response.status : 500;
    res.status(status).json({ error: msg });
  }
});

router.get("/trend/embi", async (_req: Request, res: Response) => {
  try {
    const client = createClient();
    const end = addDays(todayLocal(), -1);
    const start = addDays(end, -29);
    const prefix = "EM";

    const discoverEnd = formatDate(end);
    const discoverStart = formatDate(addDays(end, -364));
    const discoverRows = await fetchMetricsGrouped(
      client,
      discoverStart,
      discoverEnd,
      ["publisher"]
    );

    const embiIds = new Set<number>();
    for (const row of discoverRows) {
      const name = row.publisher_name ?? "";
      if (!name.trim().toUpperCase().startsWith(prefix.toUpperCase())) continue;
      if (row.publisher_id != null) embiIds.add(row.publisher_id);
    }

    if (embiIds.size === 0) {
      res.json({ data: [] as TrendPoint[] });
      return;
    }

    const params = new URLSearchParams();
    appendTenantParams(params);
    params.set("groupBy", "date");
    params.set("startDate", formatDate(start));
    params.set("endDate", formatDate(end));
    params.set("publisherIds", [...embiIds].join(","));

    const { data } = await client.get<{ data: AggregatedRow[] }>(
      `/api/metrics/aggregated?${params.toString()}`
    );

    const byDate = new Map<string, TrendPoint>();
    for (const row of data.data ?? []) {
      if (!row.date) continue;
      byDate.set(row.date, {
        date: row.date,
        revenue: row.total_revenue ?? 0,
        cost: row.total_cost ?? 0,
        profit: row.total_profit ?? 0,
      });
    }

    const series: TrendPoint[] = [];
    for (let i = 0; i < 30; i++) {
      const d = formatDate(addDays(start, i));
      series.push(
        byDate.get(d) ?? {
          date: d,
          revenue: 0,
          cost: 0,
          profit: 0,
        }
      );
    }

    res.json({ data: series });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    const status =
      axios.isAxiosError(e) && e.response?.status ? e.response.status : 500;
    res.status(status).json({ error: msg });
  }
});

router.get("/trend/by-prefix/:prefix", async (req: Request, res: Response) => {
  try {
    const prefix = (String(req.params.prefix ?? "")).toUpperCase().trim();
    if (!prefix || prefix.length < 2) {
      res.status(400).json({ error: "Prefix is required (min 2 chars)" });
      return;
    }

    const client = createClient();
    const end = addDays(todayLocal(), -1);
    const start = addDays(end, -29);

    const discoverEnd = formatDate(end);
    const discoverStart = formatDate(addDays(end, -364));
    const discoverRows = await fetchMetricsGrouped(
      client,
      discoverStart,
      discoverEnd,
      ["publisher"]
    );

    const prefixIds = new Set<number>();
    for (const row of discoverRows) {
      const name = row.publisher_name ?? "";
      if (!name.trim().toUpperCase().startsWith(prefix)) continue;
      if (row.publisher_id != null) prefixIds.add(row.publisher_id);
    }

    if (prefixIds.size === 0) {
      res.json({ data: [] as TrendPoint[] });
      return;
    }

    const params = new URLSearchParams();
    appendTenantParams(params);
    params.set("groupBy", "date");
    params.set("startDate", formatDate(start));
    params.set("endDate", formatDate(end));
    params.set("publisherIds", [...prefixIds].join(","));

    const { data } = await client.get<{ data: AggregatedRow[] }>(
      `/api/metrics/aggregated?${params.toString()}`
    );

    const byDate = new Map<string, TrendPoint>();
    for (const row of data.data ?? []) {
      if (!row.date) continue;
      byDate.set(row.date, {
        date: row.date,
        revenue: row.total_revenue ?? 0,
        cost: row.total_cost ?? 0,
        profit: row.total_profit ?? 0,
      });
    }

    const series: TrendPoint[] = [];
    for (let i = 0; i < 30; i++) {
      const d = formatDate(addDays(start, i));
      series.push(
        byDate.get(d) ?? {
          date: d,
          revenue: 0,
          cost: 0,
          profit: 0,
        }
      );
    }

    res.json({ data: series });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    const status =
      axios.isAxiosError(e) && e.response?.status ? e.response.status : 500;
    res.status(status).json({ error: msg });
  }
});

router.get("/trend", async (_req: Request, res: Response) => {
  try {
    const client = createClient();
    const end = addDays(todayLocal(), -1);
    const start = addDays(end, -29);
    const params = new URLSearchParams();
    appendTenantParams(params);
    params.set("groupBy", "date");
    params.set("startDate", formatDate(start));
    params.set("endDate", formatDate(end));

    const { data } = await client.get<{ data: AggregatedRow[] }>(
      `/api/metrics/aggregated?${params.toString()}`
    );

    const byDate = new Map<string, TrendPoint>();
    for (const row of data.data ?? []) {
      if (!row.date) continue;
      byDate.set(row.date, {
        date: row.date,
        revenue: row.total_revenue ?? 0,
        cost: row.total_cost ?? 0,
        profit: row.total_profit ?? 0,
      });
    }

    const series: TrendPoint[] = [];
    for (let i = 0; i < 30; i++) {
      const d = formatDate(addDays(start, i));
      series.push(
        byDate.get(d) ?? {
          date: d,
          revenue: 0,
          cost: 0,
          profit: 0,
        }
      );
    }

    res.json({ data: series });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    const status =
      axios.isAxiosError(e) && e.response?.status ? e.response.status : 500;
    res.status(status).json({ error: msg });
  }
});

function buildPeriodVariations(
  rows: MetricsRow[],
  currentStart: string,
  currentEnd: string,
  previousStart: string,
  previousEnd: string,
  mode: "total" | "avg",
  metric: "revenue" | "impressions" | "ad_requests" = "revenue"
): VariationRow[] {
  type Entry = {
    name: string;
    publisherName?: string;
    revCurrent: number;
    revPrevious: number;
    impCurrent: number;
    impPrevious: number;
    adrCurrent: number;
    adrPrevious: number;
  };
  const map = new Map<string, Entry>();

  for (const row of rows) {
    const date = row.date;
    if (!date) continue;
    const inCurrent = date >= currentStart && date <= currentEnd;
    const inPrevious = date >= previousStart && date <= previousEnd;
    if (!inCurrent && !inPrevious) continue;

    const id = row.publisher_id;
    if (id == null) continue;
    const rowKey = String(id);
    const name = row.publisher_name ?? `Publisher ${id}`;
    const publisherName: string | undefined = undefined;

    let entry = map.get(rowKey);
    if (!entry) {
      entry = { name, publisherName, revCurrent: 0, revPrevious: 0, impCurrent: 0, impPrevious: 0, adrCurrent: 0, adrPrevious: 0 };
      map.set(rowKey, entry);
    } else if (publisherName && !entry.publisherName) {
      entry.publisherName = publisherName;
    }
    const rev = row.revenue ?? 0;
    const imp = row.impressions ?? 0;
    const adr = row.ad_requests ?? 0;
    if (inCurrent) {
      entry.revCurrent += rev;
      entry.impCurrent += imp;
      entry.adrCurrent += adr;
    }
    if (inPrevious) {
      entry.revPrevious += rev;
      entry.impPrevious += imp;
      entry.adrPrevious += adr;
    }
  }

  const daysCurrent = daysInclusive(currentStart, currentEnd);
  const daysPrevious = daysInclusive(previousStart, previousEnd);

  const out: VariationRow[] = [];
  for (const [id, v] of map) {
    let revenueCurrent = v.revCurrent;
    let revenuePrevious = v.revPrevious;
    let impressionsCurrent = v.impCurrent;
    let impressionsPrevious = v.impPrevious;
    let adRequestsCurrent = v.adrCurrent;
    let adRequestsPrevious = v.adrPrevious;
    if (mode === "avg") {
      revenueCurrent = daysCurrent > 0 ? v.revCurrent / daysCurrent : 0;
      revenuePrevious = daysPrevious > 0 ? v.revPrevious / daysPrevious : 0;
      impressionsCurrent = daysCurrent > 0 ? v.impCurrent / daysCurrent : 0;
      impressionsPrevious = daysPrevious > 0 ? v.impPrevious / daysPrevious : 0;
      adRequestsCurrent = daysCurrent > 0 ? v.adrCurrent / daysCurrent : 0;
      adRequestsPrevious = daysPrevious > 0 ? v.adrPrevious / daysPrevious : 0;
    }
    
    const delta = metric === "revenue" ? revenueCurrent - revenuePrevious : metric === "impressions" ? impressionsCurrent - impressionsPrevious : adRequestsCurrent - adRequestsPrevious;
    const prev = metric === "revenue" ? revenuePrevious : metric === "impressions" ? impressionsPrevious : adRequestsPrevious;
    const deltaPct = prev !== 0 ? (delta / prev) * 100 : null;
    
    out.push({
      id,
      name: v.name,
      publisherName: v.publisherName,
      revenueCurrent,
      revenuePrevious,
      delta,
      deltaPct,
      impressionsCurrent: metric === "impressions" ? impressionsCurrent : undefined,
      impressionsPrevious: metric === "impressions" ? impressionsPrevious : undefined,
      impressionsDelta: metric === "impressions" ? delta : undefined,
      impressionsDeltaPct: metric === "impressions" ? deltaPct : undefined,
      adRequestsCurrent: metric === "ad_requests" ? adRequestsCurrent : undefined,
      adRequestsPrevious: metric === "ad_requests" ? adRequestsPrevious : undefined,
      adRequestsDelta: metric === "ad_requests" ? delta : undefined,
      adRequestsDeltaPct: metric === "ad_requests" ? deltaPct : undefined,
    });
  }

  out.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
  return out.slice(0, 10);
}

function buildPeriodVariationsForAdUnit(
  rows: MetricsRow[],
  currentStart: string,
  currentEnd: string,
  previousStart: string,
  previousEnd: string,
  mode: "total" | "avg",
  metric: "revenue" | "impressions" | "ad_requests" = "revenue"
): VariationRow[] {
  type Entry = {
    name: string;
    publisherName?: string;
    revCurrent: number;
    revPrevious: number;
    impCurrent: number;
    impPrevious: number;
    adrCurrent: number;
    adrPrevious: number;
  };
  const map = new Map<string, Entry>();

  for (const row of rows) {
    const date = row.date;
    if (!date) continue;
    const inCurrent = date >= currentStart && date <= currentEnd;
    const inPrevious = date >= previousStart && date <= previousEnd;
    if (!inCurrent && !inPrevious) continue;

    const au = row.ad_unit_id;
    if (au == null) continue;
    const pub = row.publisher_id ?? 0;
    const rowKey = `${au}-${pub}`;
    const name = row.ad_unit_name ?? `Ad unit ${au}`;
    const publisherName = row.publisher_name;

    let entry = map.get(rowKey);
    if (!entry) {
      entry = { name, publisherName, revCurrent: 0, revPrevious: 0, impCurrent: 0, impPrevious: 0, adrCurrent: 0, adrPrevious: 0 };
      map.set(rowKey, entry);
    } else if (publisherName && !entry.publisherName) {
      entry.publisherName = publisherName;
    }
    const rev = row.revenue ?? 0;
    const imp = row.impressions ?? 0;
    const adr = row.ad_requests ?? 0;
    if (inCurrent) { entry.revCurrent += rev; entry.impCurrent += imp; entry.adrCurrent += adr; }
    if (inPrevious) { entry.revPrevious += rev; entry.impPrevious += imp; entry.adrPrevious += adr; }
  }

  const daysCurrent = daysInclusive(currentStart, currentEnd);
  const daysPrevious = daysInclusive(previousStart, previousEnd);

  const out: VariationRow[] = [];
  for (const [id, v] of map) {
    let revenueCurrent = v.revCurrent;
    let revenuePrevious = v.revPrevious;
    let impressionsCurrent = v.impCurrent;
    let impressionsPrevious = v.impPrevious;
    let adRequestsCurrent = v.adrCurrent;
    let adRequestsPrevious = v.adrPrevious;
    if (mode === "avg") {
      revenueCurrent = daysCurrent > 0 ? v.revCurrent / daysCurrent : 0;
      revenuePrevious = daysPrevious > 0 ? v.revPrevious / daysPrevious : 0;
      impressionsCurrent = daysCurrent > 0 ? v.impCurrent / daysCurrent : 0;
      impressionsPrevious = daysPrevious > 0 ? v.impPrevious / daysPrevious : 0;
      adRequestsCurrent = daysCurrent > 0 ? v.adrCurrent / daysCurrent : 0;
      adRequestsPrevious = daysPrevious > 0 ? v.adrPrevious / daysPrevious : 0;
    }
    
    const delta = metric === "revenue" ? revenueCurrent - revenuePrevious : metric === "impressions" ? impressionsCurrent - impressionsPrevious : adRequestsCurrent - adRequestsPrevious;
    const prev = metric === "revenue" ? revenuePrevious : metric === "impressions" ? impressionsPrevious : adRequestsPrevious;
    const deltaPct = prev !== 0 ? (delta / prev) * 100 : null;
    
    out.push({
      id,
      name: v.name,
      publisherName: v.publisherName,
      revenueCurrent,
      revenuePrevious,
      delta,
      deltaPct,
      impressionsCurrent: metric === "impressions" ? impressionsCurrent : undefined,
      impressionsPrevious: metric === "impressions" ? impressionsPrevious : undefined,
      impressionsDelta: metric === "impressions" ? delta : undefined,
      impressionsDeltaPct: metric === "impressions" ? deltaPct : undefined,
      adRequestsCurrent: metric === "ad_requests" ? adRequestsCurrent : undefined,
      adRequestsPrevious: metric === "ad_requests" ? adRequestsPrevious : undefined,
      adRequestsDelta: metric === "ad_requests" ? delta : undefined,
      adRequestsDeltaPct: metric === "ad_requests" ? deltaPct : undefined,
    });
  }

  out.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
  return out.slice(0, 10);
}

function revenueByPublisherName(rows: AggregatedRow[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const r of rows) {
    const n = (r.publisher_name ?? "").trim();
    if (!n) continue;
    const rev = r.total_revenue ?? 0;
    map.set(n, (map.get(n) ?? 0) + rev);
  }
  return map;
}

function mergePublisherSnapshots(
  currentRows: MetricsRow[],
  previousRows: MetricsRow[],
  currentStart: string,
  currentEnd: string,
  previousStart: string,
  previousEnd: string,
  mode: "total" | "avg",
  metric: "revenue" | "impressions" | "ad_requests" = "revenue"
): VariationRow[] {
  type Entry = { name: string; rev: number; imp: number; adr: number };
  const cur = new Map<string, Entry>();
  const prev = new Map<string, Entry>();

  for (const r of currentRows) {
    const n = (r.publisher_name ?? "").trim();
    if (!n) continue;
    const rev = toNum(r.revenue);
    const imp = toNum(r.impressions);
    const adr = toNum(r.ad_requests);
    const e = cur.get(n) || { name: n, rev: 0, imp: 0, adr: 0 };
    e.rev += rev; e.imp += imp; e.adr += adr;
    cur.set(n, e);
  }
  for (const r of previousRows) {
    const n = (r.publisher_name ?? "").trim();
    if (!n) continue;
    const rev = toNum(r.revenue);
    const imp = toNum(r.impressions);
    const adr = toNum(r.ad_requests);
    const e = prev.get(n) || { name: n, rev: 0, imp: 0, adr: 0 };
    e.rev += rev; e.imp += imp; e.adr += adr;
    prev.set(n, e);
  }

  const names = new Set<string>([...cur.keys(), ...prev.keys()]);
  const daysCur = daysInclusive(currentStart, currentEnd);
  const daysPrev = daysInclusive(previousStart, previousEnd);

  const out: VariationRow[] = [];
  for (const name of names) {
    const c = cur.get(name);
    const p = prev.get(name);
    let revenueCurrent = c?.rev ?? 0;
    let revenuePrevious = p?.rev ?? 0;
    let impressionsCurrent = c?.imp ?? 0;
    let impressionsPrevious = p?.imp ?? 0;
    let adRequestsCurrent = c?.adr ?? 0;
    let adRequestsPrevious = p?.adr ?? 0;
    if (mode === "avg") {
      revenueCurrent = daysCur > 0 ? revenueCurrent / daysCur : 0;
      revenuePrevious = daysPrev > 0 ? revenuePrevious / daysPrev : 0;
      impressionsCurrent = daysCur > 0 ? impressionsCurrent / daysCur : 0;
      impressionsPrevious = daysPrev > 0 ? impressionsPrevious / daysPrev : 0;
      adRequestsCurrent = daysCur > 0 ? adRequestsCurrent / daysCur : 0;
      adRequestsPrevious = daysPrev > 0 ? adRequestsPrevious / daysPrev : 0;
    }
    const delta = metric === "revenue" ? revenueCurrent - revenuePrevious : metric === "impressions" ? impressionsCurrent - impressionsPrevious : adRequestsCurrent - adRequestsPrevious;
    const prevVal = metric === "revenue" ? revenuePrevious : metric === "impressions" ? impressionsPrevious : adRequestsPrevious;
    const deltaPct = prevVal !== 0 ? (delta / prevVal) * 100 : null;
    out.push({
      id: `publisher:${name}`,
      name,
      revenueCurrent,
      revenuePrevious,
      delta,
      deltaPct,
      impressionsCurrent: metric === "impressions" ? impressionsCurrent : undefined,
      impressionsPrevious: metric === "impressions" ? impressionsPrevious : undefined,
      impressionsDelta: metric === "impressions" ? delta : undefined,
      impressionsDeltaPct: metric === "impressions" ? deltaPct : undefined,
      adRequestsCurrent: metric === "ad_requests" ? adRequestsCurrent : undefined,
      adRequestsPrevious: metric === "ad_requests" ? adRequestsPrevious : undefined,
      adRequestsDelta: metric === "ad_requests" ? delta : undefined,
      adRequestsDeltaPct: metric === "ad_requests" ? deltaPct : undefined,
    });
  }
  out.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
  return out.slice(0, 10);
}

function sumRevenueByAdUnitKey(
  rows: MetricsRow[]
): Map<string, { name: string; publisherName?: string; rev: number }> {
  const map = new Map<string, { name: string; publisherName?: string; rev: number }>();
  for (const r of rows) {
    if (r.ad_unit_id == null) continue;
    const k = `${r.ad_unit_id}-${r.publisher_id ?? 0}`;
    const rev = r.revenue ?? 0;
    let e = map.get(k);
    if (!e) {
      e = {
        name: r.ad_unit_name ?? `Ad unit ${r.ad_unit_id}`,
        publisherName: r.publisher_name,
        rev: 0,
      };
      map.set(k, e);
    }
    e.rev += rev;
    if (r.publisher_name) e.publisherName = r.publisher_name;
  }
  return map;
}

function mergeAdUnitSnapshots(
  currentRows: MetricsRow[],
  previousRows: MetricsRow[],
  currentStart: string,
  currentEnd: string,
  previousStart: string,
  previousEnd: string,
  mode: "total" | "avg",
  metric: "revenue" | "impressions" | "ad_requests" = "revenue"
): VariationRow[] {
  type Entry = { name: string; publisherName?: string; rev: number; imp: number; adr: number };
  const cur = new Map<string, Entry>();
  const prev = new Map<string, Entry>();

  for (const r of currentRows) {
    if (r.ad_unit_id == null) continue;
    const k = `${r.ad_unit_id}-${r.publisher_id ?? 0}`;
    const rev = r.revenue ?? 0;
    const imp = r.impressions ?? 0;
    const adr = r.ad_requests ?? 0;
    const e = cur.get(k) || { name: r.ad_unit_name ?? `Ad unit ${r.ad_unit_id}`, publisherName: r.publisher_name, rev: 0, imp: 0, adr: 0 };
    e.rev += rev; e.imp += imp; e.adr += adr;
    if (r.publisher_name) e.publisherName = r.publisher_name;
    cur.set(k, e);
  }
  for (const r of previousRows) {
    if (r.ad_unit_id == null) continue;
    const k = `${r.ad_unit_id}-${r.publisher_id ?? 0}`;
    const rev = r.revenue ?? 0;
    const imp = r.impressions ?? 0;
    const adr = r.ad_requests ?? 0;
    const e = prev.get(k) || { name: r.ad_unit_name ?? `Ad unit ${r.ad_unit_id}`, publisherName: r.publisher_name, rev: 0, imp: 0, adr: 0 };
    e.rev += rev; e.imp += imp; e.adr += adr;
    if (r.publisher_name) e.publisherName = r.publisher_name;
    prev.set(k, e);
  }

  const keys = new Set<string>([...cur.keys(), ...prev.keys()]);
  const daysCur = daysInclusive(currentStart, currentEnd);
  const daysPrev = daysInclusive(previousStart, previousEnd);

  const out: VariationRow[] = [];
  for (const k of keys) {
    const c = cur.get(k);
    const p = prev.get(k);
    let revenueCurrent = c?.rev ?? 0;
    let revenuePrevious = p?.rev ?? 0;
    let impressionsCurrent = c?.imp ?? 0;
    let impressionsPrevious = p?.imp ?? 0;
    let adRequestsCurrent = c?.adr ?? 0;
    let adRequestsPrevious = p?.adr ?? 0;
    if (mode === "avg") {
      revenueCurrent = daysCur > 0 ? revenueCurrent / daysCur : 0;
      revenuePrevious = daysPrev > 0 ? revenuePrevious / daysPrev : 0;
      impressionsCurrent = daysCur > 0 ? impressionsCurrent / daysCur : 0;
      impressionsPrevious = daysPrev > 0 ? impressionsPrevious / daysPrev : 0;
      adRequestsCurrent = daysCur > 0 ? adRequestsCurrent / daysCur : 0;
      adRequestsPrevious = daysPrev > 0 ? adRequestsPrevious / daysPrev : 0;
    }
    const delta = metric === "revenue" ? revenueCurrent - revenuePrevious : metric === "impressions" ? impressionsCurrent - impressionsPrevious : adRequestsCurrent - adRequestsPrevious;
    const prevVal = metric === "revenue" ? revenuePrevious : metric === "impressions" ? impressionsPrevious : adRequestsPrevious;
    const deltaPct = prevVal !== 0 ? (delta / prevVal) * 100 : null;
    out.push({
      id: k,
      name: c?.name ?? p?.name ?? k,
      publisherName: c?.publisherName ?? p?.publisherName,
      revenueCurrent,
      revenuePrevious,
      delta,
      deltaPct,
      impressionsCurrent: metric === "impressions" ? impressionsCurrent : undefined,
      impressionsPrevious: metric === "impressions" ? impressionsPrevious : undefined,
      impressionsDelta: metric === "impressions" ? delta : undefined,
      impressionsDeltaPct: metric === "impressions" ? deltaPct : undefined,
      adRequestsCurrent: metric === "ad_requests" ? adRequestsCurrent : undefined,
      adRequestsPrevious: metric === "ad_requests" ? adRequestsPrevious : undefined,
      adRequestsDelta: metric === "ad_requests" ? delta : undefined,
      adRequestsDeltaPct: metric === "ad_requests" ? deltaPct : undefined,
    });
  }
  out.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
  return out.slice(0, 10);
}

function revenueByNetworkName(rows: AggregatedRow[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const r of rows) {
    const n = (r.network_name ?? "").trim();
    if (n && !isGamNetworkName(n)) {
      const rev = r.total_revenue ?? 0;
      map.set(n, (map.get(n) ?? 0) + rev);
    }
    const gn = (r.gam_network_name ?? "").trim();
    if (gn) {
      const gamName = `GAM · ${gn}`;
      const rev = r.total_revenue ?? 0;
      map.set(gamName, (map.get(gamName) ?? 0) + rev);
    }
  }
  return map;
}

function mergeNetworkSnapshots(
  currentRows: AggregatedRow[],
  previousRows: AggregatedRow[],
  gamCurrentRows: AggregatedRow[],
  gamPreviousRows: AggregatedRow[],
  currentStart: string,
  currentEnd: string,
  previousStart: string,
  previousEnd: string,
  mode: "total" | "avg",
  metric: "revenue" | "impressions" | "ad_requests" = "revenue"
): VariationRow[] {
  type Entry = { rev: number; imp: number; adr: number };
  const cur = new Map<string, Entry>();
  const prev = new Map<string, Entry>();

  function process(rows: AggregatedRow[], target: Map<string, Entry>) {
    for (const r of rows) {
      // Regular networks
      const n = (r.network_name ?? "").trim();
      if (n && !isGamNetworkName(n)) {
        const rev = toNum(r.total_revenue);
        const imp = toNum(r.total_impressions);
        const adr = toNum(r.total_ad_requests);
        const e = target.get(n) || { rev: 0, imp: 0, adr: 0 };
        e.rev += rev; e.imp += imp; e.adr += adr;
        target.set(n, e);
      }
      // GAM networks
      const gn = (r.gam_network_name ?? "").trim();
      if (gn) {
        const gamName = `GAM · ${gn}`;
        const rev = toNum(r.total_revenue);
        const imp = toNum(r.total_impressions);
        const adr = toNum(r.total_ad_requests);
        const e = target.get(gamName) || { rev: 0, imp: 0, adr: 0 };
        e.rev += rev; e.imp += imp; e.adr += adr;
        target.set(gamName, e);
      }
    }
  }

  process(currentRows, cur);
  process(previousRows, prev);

  // GAM networks
  const gamCur = new Map<string, Entry>();
  const gamPrev = new Map<string, Entry>();
  process(gamCurrentRows, gamCur);
  process(gamPreviousRows, gamPrev);

  for (const [name, v] of gamCur) {
    const e = cur.get(name) || { rev: 0, imp: 0, adr: 0 };
    e.rev += v.rev; e.imp += v.imp; e.adr += v.adr;
    cur.set(name, e);
  }
  for (const [name, v] of gamPrev) {
    const e = prev.get(name) || { rev: 0, imp: 0, adr: 0 };
    e.rev += v.rev; e.imp += v.imp; e.adr += v.adr;
    prev.set(name, e);
  }

  const names = new Set<string>([...cur.keys(), ...prev.keys()]);
  const daysCur = daysInclusive(currentStart, currentEnd);
  const daysPrev = daysInclusive(previousStart, previousEnd);

  const out: VariationRow[] = [];
  for (const name of names) {
    const c = cur.get(name);
    const p = prev.get(name);
    let revenueCurrent = c?.rev ?? 0;
    let revenuePrevious = p?.rev ?? 0;
    let impressionsCurrent = c?.imp ?? 0;
    let impressionsPrevious = p?.imp ?? 0;
    let adRequestsCurrent = c?.adr ?? 0;
    let adRequestsPrevious = p?.adr ?? 0;
    if (mode === "avg") {
      revenueCurrent = daysCur > 0 ? revenueCurrent / daysCur : 0;
      revenuePrevious = daysPrev > 0 ? revenuePrevious / daysPrev : 0;
      impressionsCurrent = daysCur > 0 ? impressionsCurrent / daysCur : 0;
      impressionsPrevious = daysPrev > 0 ? impressionsPrevious / daysPrev : 0;
      adRequestsCurrent = daysCur > 0 ? adRequestsCurrent / daysCur : 0;
      adRequestsPrevious = daysPrev > 0 ? adRequestsPrevious / daysPrev : 0;
    }
    const delta = metric === "revenue" ? revenueCurrent - revenuePrevious : metric === "impressions" ? impressionsCurrent - impressionsPrevious : adRequestsCurrent - adRequestsPrevious;
    const prevVal = metric === "revenue" ? revenuePrevious : metric === "impressions" ? impressionsPrevious : adRequestsPrevious;
    const deltaPct = prevVal !== 0 ? (delta / prevVal) * 100 : null;
    out.push({
      id: `network:${name}`,
      name,
      revenueCurrent,
      revenuePrevious,
      delta,
      deltaPct,
      impressionsCurrent: metric === "impressions" ? impressionsCurrent : undefined,
      impressionsPrevious: metric === "impressions" ? impressionsPrevious : undefined,
      impressionsDelta: metric === "impressions" ? delta : undefined,
      impressionsDeltaPct: metric === "impressions" ? deltaPct : undefined,
      adRequestsCurrent: metric === "ad_requests" ? adRequestsCurrent : undefined,
      adRequestsPrevious: metric === "ad_requests" ? adRequestsPrevious : undefined,
      adRequestsDelta: metric === "ad_requests" ? delta : undefined,
      adRequestsDeltaPct: metric === "ad_requests" ? deltaPct : undefined,
    });
  }
  out.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
  return out.slice(0, 10);
}

function buildPeriodVariationsForNetwork(
  rows: MetricsRow[],
  gamRows: MetricsRow[],
  currentStart: string,
  currentEnd: string,
  previousStart: string,
  previousEnd: string,
  mode: "total" | "avg",
  metric: "revenue" | "impressions" | "ad_requests" = "revenue"
): VariationRow[] {
  type Entry = { name: string; revCurrent: number; revPrevious: number; impCurrent: number; impPrevious: number; adrCurrent: number; adrPrevious: number };
  const map = new Map<string, Entry>();

  function ingest(row: MetricsRow, inCurrent: boolean, inPrevious: boolean, kind: "net" | "gam") {
    if (kind === "net") {
      if (isGamNetworkName(row.network_name)) return;
      const nid = row.network_id;
      const nname = row.network_name;
      if (nid == null && !(nname && nname.trim())) return;
      const rowKey = nid != null ? String(nid) : nname!.trim();
      const name = nname?.trim() || `Network ${nid}`;

      let entry = map.get(rowKey);
      if (!entry) {
        entry = { name, revCurrent: 0, revPrevious: 0, impCurrent: 0, impPrevious: 0, adrCurrent: 0, adrPrevious: 0 };
        map.set(rowKey, entry);
      }
      const rev = toNum(row.revenue);
      const imp = toNum(row.impressions);
      const adr = toNum(row.ad_requests);
      if (inCurrent) { entry.revCurrent += rev; entry.impCurrent += imp; entry.adrCurrent += adr; }
      if (inPrevious) { entry.revPrevious += rev; entry.impPrevious += imp; entry.adrPrevious += adr; }
      return;
    }
    if (row.gam_network_id == null && !(row.gam_network_name && row.gam_network_name.trim())) return;
    const gKey = row.gam_network_id ?? row.gam_network_name!.trim();
    const rowKey = `gam:${gKey}`;
    const gn = row.gam_network_name?.trim() || `GAM ${row.gam_network_id}`;
    const name = `GAM · ${gn}`;

    let entry = map.get(rowKey);
    if (!entry) {
      entry = { name, revCurrent: 0, revPrevious: 0, impCurrent: 0, impPrevious: 0, adrCurrent: 0, adrPrevious: 0 };
      map.set(rowKey, entry);
    }
    const rev = toNum(row.revenue);
    const imp = toNum(row.impressions);
    const adr = toNum(row.ad_requests);
    if (inCurrent) { entry.revCurrent += rev; entry.impCurrent += imp; entry.adrCurrent += adr; }
    if (inPrevious) { entry.revPrevious += rev; entry.impPrevious += imp; entry.adrPrevious += adr; }
  }

  for (const row of rows) {
    const date = row.date;
    if (!date) continue;
    const inCurrent = date >= currentStart && date <= currentEnd;
    const inPrevious = date >= previousStart && date <= previousEnd;
    if (!inCurrent && !inPrevious) continue;
    ingest(row, inCurrent, inPrevious, "net");
  }
  for (const row of gamRows) {
    const date = row.date;
    if (!date) continue;
    const inCurrent = date >= currentStart && date <= currentEnd;
    const inPrevious = date >= previousStart && date <= previousEnd;
    if (!inCurrent && !inPrevious) continue;
    ingest(row, inCurrent, inPrevious, "gam");
  }

  const daysCurrent = daysInclusive(currentStart, currentEnd);
  const daysPrevious = daysInclusive(previousStart, previousEnd);

  const out: VariationRow[] = [];
  for (const [id, v] of map) {
    let revenueCurrent = v.revCurrent;
    let revenuePrevious = v.revPrevious;
    let impressionsCurrent = v.impCurrent;
    let impressionsPrevious = v.impPrevious;
    let adRequestsCurrent = v.adrCurrent;
    let adRequestsPrevious = v.adrPrevious;
    if (mode === "avg") {
      revenueCurrent = daysCurrent > 0 ? v.revCurrent / daysCurrent : 0;
      revenuePrevious = daysPrevious > 0 ? v.revPrevious / daysPrevious : 0;
      impressionsCurrent = daysCurrent > 0 ? v.impCurrent / daysCurrent : 0;
      impressionsPrevious = daysPrevious > 0 ? v.impPrevious / daysPrevious : 0;
      adRequestsCurrent = daysCurrent > 0 ? v.adrCurrent / daysCurrent : 0;
      adRequestsPrevious = daysPrevious > 0 ? v.adrPrevious / daysPrevious : 0;
    }
    const delta = metric === "revenue" ? revenueCurrent - revenuePrevious : metric === "impressions" ? impressionsCurrent - impressionsPrevious : adRequestsCurrent - adRequestsPrevious;
    const prevVal = metric === "revenue" ? revenuePrevious : metric === "impressions" ? impressionsPrevious : adRequestsPrevious;
    const deltaPct = prevVal !== 0 ? (delta / prevVal) * 100 : null;
    out.push({
      id,
      name: v.name,
      revenueCurrent,
      revenuePrevious,
      delta,
      deltaPct,
      impressionsCurrent: metric === "impressions" ? impressionsCurrent : undefined,
      impressionsPrevious: metric === "impressions" ? impressionsPrevious : undefined,
      impressionsDelta: metric === "impressions" ? delta : undefined,
      impressionsDeltaPct: metric === "impressions" ? deltaPct : undefined,
      adRequestsCurrent: metric === "ad_requests" ? adRequestsCurrent : undefined,
      adRequestsPrevious: metric === "ad_requests" ? adRequestsPrevious : undefined,
      adRequestsDelta: metric === "ad_requests" ? delta : undefined,
      adRequestsDeltaPct: metric === "ad_requests" ? deltaPct : undefined,
    });
  }

  out.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
  return out.slice(0, 10);
}

function sumRevenueByNetworkPublisherKeys(
  netRows: MetricsRow[],
  gamRows: MetricsRow[]
): Map<string, { name: string; publisherName?: string; rev: number }> {
  const map = new Map<string, { name: string; publisherName?: string; rev: number }>();

  for (const r of netRows) {
    if (isGamNetworkName(r.network_name)) continue;
    if (r.publisher_id == null) continue;
    const pub = r.publisher_id;
    if (r.network_id == null && !(r.network_name && r.network_name.trim())) continue;
    const k = `net:${r.network_id ?? r.network_name?.trim()}:${pub}`;
    const name = r.network_name?.trim() || `Network ${r.network_id}`;
    const rev = r.revenue ?? 0;
    let e = map.get(k);
    if (!e) {
      e = { name, publisherName: r.publisher_name, rev: 0 };
      map.set(k, e);
    }
    e.rev += rev;
    if (r.publisher_name) e.publisherName = r.publisher_name;
  }

  for (const r of gamRows) {
    if (r.publisher_id == null) continue;
    const pub = r.publisher_id;
    if (r.gam_network_id == null && !(r.gam_network_name && r.gam_network_name.trim()))
      continue;
    const gKey = r.gam_network_id ?? r.gam_network_name!.trim();
    const k = `gam:${gKey}:${pub}`;
    const gn = r.gam_network_name?.trim() || `GAM ${r.gam_network_id}`;
    const name = `GAM · ${gn}`;
    const rev = r.revenue ?? 0;
    let e = map.get(k);
    if (!e) {
      e = { name, publisherName: r.publisher_name, rev: 0 };
      map.set(k, e);
    }
    e.rev += rev;
    if (r.publisher_name) e.publisherName = r.publisher_name;
  }

  return map;
}

function mergeNetworkByPublisherSnapshots(
  currentNetPub: MetricsRow[],
  previousNetPub: MetricsRow[],
  currentGamPub: MetricsRow[],
  previousGamPub: MetricsRow[],
  currentStart: string,
  currentEnd: string,
  previousStart: string,
  previousEnd: string,
  mode: "total" | "avg",
  metric: "revenue" | "impressions" | "ad_requests" = "revenue"
): VariationRow[] {
  type Entry = { name: string; publisherName?: string; rev: number; imp: number; adr: number };
  const cur = new Map<string, Entry>();
  const prev = new Map<string, Entry>();

  function process(rows: MetricsRow[], target: Map<string, Entry>) {
    for (const r of rows) {
      if (r.publisher_id == null) continue;
      const pid = r.publisher_id;
      const pubName = r.publisher_name;

      // Regular networks
      if (r.network_id != null || (r.network_name && r.network_name.trim())) {
        const netName = r.network_name?.trim() || `Network ${r.network_id}`;
        if (!isGamNetworkName(netName)) {
          const k = `net:${r.network_id ?? netName}:${pid}`;
          const rev = toNum(r.revenue);
          const imp = toNum(r.impressions);
          const adr = toNum(r.ad_requests);
          const e = target.get(k) || { name: netName, publisherName: pubName, rev: 0, imp: 0, adr: 0 };
          e.rev += rev; e.imp += imp; e.adr += adr;
          if (pubName) e.publisherName = pubName;
          target.set(k, e);
        }
      }

      // GAM networks
      if (r.gam_network_id != null || (r.gam_network_name && r.gam_network_name.trim())) {
        const gn = r.gam_network_name?.trim() || `GAM ${r.gam_network_id}`;
        const k = `gam:${r.gam_network_id ?? gn}:${pid}`;
        const name = `GAM · ${gn}`;
        const rev = toNum(r.revenue);
        const imp = toNum(r.impressions);
        const adr = toNum(r.ad_requests);
        const e = target.get(k) || { name, publisherName: pubName, rev: 0, imp: 0, adr: 0 };
        e.rev += rev; e.imp += imp; e.adr += adr;
        if (pubName) e.publisherName = pubName;
        target.set(k, e);
      }
    }
  }

  process(currentNetPub, cur);
  process(previousNetPub, prev);
  process(currentGamPub, cur);
  process(previousGamPub, prev);

  const keys = new Set<string>([...cur.keys(), ...prev.keys()]);
  const daysCur = daysInclusive(currentStart, currentEnd);
  const daysPrev = daysInclusive(previousStart, previousEnd);

  const out: VariationRow[] = [];
  for (const k of keys) {
    const c = cur.get(k);
    const p = prev.get(k);
    let revenueCurrent = c?.rev ?? 0;
    let revenuePrevious = p?.rev ?? 0;
    let impressionsCurrent = c?.imp ?? 0;
    let impressionsPrevious = p?.imp ?? 0;
    let adRequestsCurrent = c?.adr ?? 0;
    let adRequestsPrevious = p?.adr ?? 0;
    if (mode === "avg") {
      revenueCurrent = daysCur > 0 ? revenueCurrent / daysCur : 0;
      revenuePrevious = daysPrev > 0 ? revenuePrevious / daysPrev : 0;
      impressionsCurrent = daysCur > 0 ? impressionsCurrent / daysCur : 0;
      impressionsPrevious = daysPrev > 0 ? impressionsPrevious / daysPrev : 0;
      adRequestsCurrent = daysCur > 0 ? adRequestsCurrent / daysCur : 0;
      adRequestsPrevious = daysPrev > 0 ? adRequestsPrevious / daysPrev : 0;
    }
    const delta = metric === "revenue" ? revenueCurrent - revenuePrevious : metric === "impressions" ? impressionsCurrent - impressionsPrevious : adRequestsCurrent - adRequestsPrevious;
    const prevVal = metric === "revenue" ? revenuePrevious : metric === "impressions" ? impressionsPrevious : adRequestsPrevious;
    const deltaPct = prevVal !== 0 ? (delta / prevVal) * 100 : null;
    out.push({
      id: k,
      name: c?.name ?? p?.name ?? k,
      publisherName: c?.publisherName ?? p?.publisherName,
      revenueCurrent,
      revenuePrevious,
      delta,
      deltaPct,
      impressionsCurrent: metric === "impressions" ? impressionsCurrent : undefined,
      impressionsPrevious: metric === "impressions" ? impressionsPrevious : undefined,
      impressionsDelta: metric === "impressions" ? delta : undefined,
      impressionsDeltaPct: metric === "impressions" ? deltaPct : undefined,
      adRequestsCurrent: metric === "ad_requests" ? adRequestsCurrent : undefined,
      adRequestsPrevious: metric === "ad_requests" ? adRequestsPrevious : undefined,
      adRequestsDelta: metric === "ad_requests" ? delta : undefined,
      adRequestsDeltaPct: metric === "ad_requests" ? deltaPct : undefined,
    });
  }
  out.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
  return out.slice(0, 10);
}

function buildPeriodVariationsNetworksByPublisher(
  netRows: MetricsRow[],
  gamRows: MetricsRow[],
  currentStart: string,
  currentEnd: string,
  previousStart: string,
  previousEnd: string,
  mode: "total" | "avg",
  metric: "revenue" | "impressions" | "ad_requests" = "revenue"
): VariationRow[] {
  type Entry = {
    name: string;
    publisherName?: string;
    revCurrent: number;
    revPrevious: number;
    impCurrent: number;
    impPrevious: number;
    adrCurrent: number;
    adrPrevious: number;
  };
  const map = new Map<string, Entry>();

  function ingest(
    row: MetricsRow,
    inCurrent: boolean,
    inPrevious: boolean,
    kind: "net" | "gam"
  ) {
    if (kind === "net") {
      if (isGamNetworkName(row.network_name)) return;
      if (row.publisher_id == null) return;
      if (row.network_id == null && !(row.network_name && row.network_name.trim())) return;
      const k = `net:${row.network_id ?? row.network_name?.trim()}:${row.publisher_id}`;
      const name = row.network_name?.trim() || `Network ${row.network_id}`;
      let entry = map.get(k);
      if (!entry) {
        entry = { name, publisherName: row.publisher_name, revCurrent: 0, revPrevious: 0, impCurrent: 0, impPrevious: 0, adrCurrent: 0, adrPrevious: 0 };
        map.set(k, entry);
      } else if (row.publisher_name && !entry.publisherName) {
        entry.publisherName = row.publisher_name;
      }
      const rev = toNum(row.revenue);
      const imp = toNum(row.impressions);
      const adr = toNum(row.ad_requests);
      if (inCurrent) { entry.revCurrent += rev; entry.impCurrent += imp; entry.adrCurrent += adr; }
      if (inPrevious) { entry.revPrevious += rev; entry.impPrevious += imp; entry.adrPrevious += adr; }
      return;
    }
    if (row.publisher_id == null) return;
    if (row.gam_network_id == null && !(row.gam_network_name && row.gam_network_name.trim()))
      return;
    const gKey = row.gam_network_id ?? row.gam_network_name!.trim();
    const k = `gam:${gKey}:${row.publisher_id}`;
    const gn = row.gam_network_name?.trim() || `GAM ${row.gam_network_id}`;
    const name = `GAM · ${gn}`;
    let entry = map.get(k);
    if (!entry) {
      entry = { name, publisherName: row.publisher_name, revCurrent: 0, revPrevious: 0, impCurrent: 0, impPrevious: 0, adrCurrent: 0, adrPrevious: 0 };
      map.set(k, entry);
    } else if (row.publisher_name && !entry.publisherName) {
      entry.publisherName = row.publisher_name;
    }
    const rev = toNum(row.revenue);
    const imp = toNum(row.impressions);
    const adr = toNum(row.ad_requests);
    if (inCurrent) { entry.revCurrent += rev; entry.impCurrent += imp; entry.adrCurrent += adr; }
    if (inPrevious) { entry.revPrevious += rev; entry.impPrevious += imp; entry.adrPrevious += adr; }
  }

  for (const row of netRows) {
    const date = row.date;
    if (!date) continue;
    const inCurrent = date >= currentStart && date <= currentEnd;
    const inPrevious = date >= previousStart && date <= previousEnd;
    if (!inCurrent && !inPrevious) continue;
    ingest(row, inCurrent, inPrevious, "net");
  }
  for (const row of gamRows) {
    const date = row.date;
    if (!date) continue;
    const inCurrent = date >= currentStart && date <= currentEnd;
    const inPrevious = date >= previousStart && date <= previousEnd;
    if (!inCurrent && !inPrevious) continue;
    ingest(row, inCurrent, inPrevious, "gam");
  }

  const daysCurrent = daysInclusive(currentStart, currentEnd);
  const daysPrevious = daysInclusive(previousStart, previousEnd);

  const out: VariationRow[] = [];
  for (const [id, v] of map) {
    let revenueCurrent = v.revCurrent;
    let revenuePrevious = v.revPrevious;
    let impressionsCurrent = v.impCurrent;
    let impressionsPrevious = v.impPrevious;
    let adRequestsCurrent = v.adrCurrent;
    let adRequestsPrevious = v.adrPrevious;
    if (mode === "avg") {
      revenueCurrent = daysCurrent > 0 ? v.revCurrent / daysCurrent : 0;
      revenuePrevious = daysPrevious > 0 ? v.revPrevious / daysPrevious : 0;
      impressionsCurrent = daysCurrent > 0 ? v.impCurrent / daysCurrent : 0;
      impressionsPrevious = daysPrevious > 0 ? v.impPrevious / daysPrevious : 0;
      adRequestsCurrent = daysCurrent > 0 ? v.adrCurrent / daysCurrent : 0;
      adRequestsPrevious = daysPrevious > 0 ? v.adrPrevious / daysPrevious : 0;
    }
    const delta = metric === "revenue" ? revenueCurrent - revenuePrevious : metric === "impressions" ? impressionsCurrent - impressionsPrevious : adRequestsCurrent - adRequestsPrevious;
    const prevVal = metric === "revenue" ? revenuePrevious : metric === "impressions" ? impressionsPrevious : adRequestsPrevious;
    const deltaPct = prevVal !== 0 ? (delta / prevVal) * 100 : null;
    out.push({
      id,
      name: v.name,
      publisherName: v.publisherName,
      revenueCurrent,
      revenuePrevious,
      delta,
      deltaPct,
      impressionsCurrent: metric === "impressions" ? impressionsCurrent : undefined,
      impressionsPrevious: metric === "impressions" ? impressionsPrevious : undefined,
      impressionsDelta: metric === "impressions" ? delta : undefined,
      impressionsDeltaPct: metric === "impressions" ? deltaPct : undefined,
      adRequestsCurrent: metric === "ad_requests" ? adRequestsCurrent : undefined,
      adRequestsPrevious: metric === "ad_requests" ? adRequestsPrevious : undefined,
      adRequestsDelta: metric === "ad_requests" ? delta : undefined,
      adRequestsDeltaPct: metric === "ad_requests" ? deltaPct : undefined,
    });
  }

  out.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
  return out.slice(0, 10);
}

router.get("/variations", async (req: Request, res: Response) => {
  try {
    const periodRaw = String(req.query.period ?? "day").toLowerCase();
    const aggregateRaw = String(req.query.aggregate ?? "total").toLowerCase();
    const metricRaw = String(req.query.metric ?? "revenue").toLowerCase();

    if (!["day", "week", "month"].includes(periodRaw)) {
      res.status(400).json({ error: "Invalid period (use day, week, month)" });
      return;
    }
    if (!["total", "avg"].includes(aggregateRaw)) {
      res.status(400).json({ error: "Invalid aggregate (use total, avg)" });
      return;
    }
    if (!["revenue", "impressions", "ad_requests"].includes(metricRaw)) {
      res.status(400).json({ error: "Invalid metric (use revenue, impressions, ad_requests)" });
      return;
    }

    const period = periodRaw as "day" | "week" | "month";
    const aggregate = aggregateRaw as "total" | "avg";
    const metric = metricRaw as "revenue" | "impressions" | "ad_requests";

    const windows = variationPeriodWindows(period);
    const client = createClient();

    let publishers: VariationRow[];
    let adUnits: VariationRow[];
    let networks: VariationRow[];
    let networksByPublisher: VariationRow[];

    if (period === "day") {
      const fetchStart = windows.previousStart;
      const fetchEnd = windows.currentEnd;
      const [pubRows, adUnitRows, netDateRows, netPubDayRows, gamPubDayRows] =
        await Promise.all([
          fetchMetricsGrouped(client, fetchStart, fetchEnd, [
            "publisher",
            "date",
          ]),
          fetchMetricsGrouped(client, fetchStart, fetchEnd, [
            "ad_unit",
            "publisher",
            "date",
          ]),
          fetchMetricsGrouped(client, fetchStart, fetchEnd, [
            "network",
            "date",
          ]),
          fetchMetricsGrouped(client, fetchStart, fetchEnd, [
            "network",
            "publisher",
            "date",
          ]),
          fetchMetricsGrouped(client, fetchStart, fetchEnd, [
            "gam_network",
            "publisher",
            "date",
          ]),
        ]);
      publishers = buildPeriodVariations(
        pubRows,
        windows.currentStart,
        windows.currentEnd,
        windows.previousStart,
        windows.previousEnd,
        aggregate,
        metric
      );
      adUnits = buildPeriodVariationsForAdUnit(
        adUnitRows,
        windows.currentStart,
        windows.currentEnd,
        windows.previousStart,
        windows.previousEnd,
        aggregate,
        metric
      );
      networks = buildPeriodVariationsForNetwork(
        netDateRows,
        gamPubDayRows,
        windows.currentStart,
        windows.currentEnd,
        windows.previousStart,
        windows.previousEnd,
        aggregate,
        metric
      );
      networksByPublisher = buildPeriodVariationsNetworksByPublisher(
        netPubDayRows,
        gamPubDayRows,
        windows.currentStart,
        windows.currentEnd,
        windows.previousStart,
        windows.previousEnd,
        aggregate,
        metric
      );
    } else {
      const [
        pubCur,
        pubPrev,
        netCurAgg,
        netPrevAgg,
        gamCurAgg,
        gamPrevAgg,
        netCurPub,
        netPrevPub,
        gamCurPub,
        gamPrevPub,
        adCur,
        adPrev,
      ] = await Promise.all([
        fetchMetricsGrouped(client, windows.currentStart, windows.currentEnd, [
          "publisher",
        ]),
        fetchMetricsGrouped(client, windows.previousStart, windows.previousEnd, [
          "publisher",
        ]),
        fetchAggregatedByNetwork(
          client,
          windows.currentStart,
          windows.currentEnd
        ),
        fetchAggregatedByNetwork(
          client,
          windows.previousStart,
          windows.previousEnd
        ),
        fetchAggregatedByGamNetwork(
          client,
          windows.currentStart,
          windows.currentEnd
        ),
        fetchAggregatedByGamNetwork(
          client,
          windows.previousStart,
          windows.previousEnd
        ),
        fetchMetricsGrouped(client, windows.currentStart, windows.currentEnd, [
          "network",
          "publisher",
        ]),
        fetchMetricsGrouped(
          client,
          windows.previousStart,
          windows.previousEnd,
          ["network", "publisher"]
        ),
        fetchMetricsGrouped(client, windows.currentStart, windows.currentEnd, [
          "gam_network",
          "publisher",
        ]),
        fetchMetricsGrouped(
          client,
          windows.previousStart,
          windows.previousEnd,
          ["gam_network", "publisher"]
        ),
        fetchMetricsGrouped(client, windows.currentStart, windows.currentEnd, [
          "ad_unit",
          "publisher",
        ]),
        fetchMetricsGrouped(
          client,
          windows.previousStart,
          windows.previousEnd,
          ["ad_unit", "publisher"]
        ),
      ]);
      publishers = mergePublisherSnapshots(
        pubCur,
        pubPrev,
        windows.currentStart,
        windows.currentEnd,
        windows.previousStart,
        windows.previousEnd,
        aggregate,
        metric
      );
      adUnits = mergeAdUnitSnapshots(
        adCur,
        adPrev,
        windows.currentStart,
        windows.currentEnd,
        windows.previousStart,
        windows.previousEnd,
        aggregate,
        metric
      );
      networks = mergeNetworkSnapshots(
        netCurAgg,
        netPrevAgg,
        gamCurAgg,
        gamPrevAgg,
        windows.currentStart,
        windows.currentEnd,
        windows.previousStart,
        windows.previousEnd,
        aggregate,
        metric
      );
      networksByPublisher = mergeNetworkByPublisherSnapshots(
        netCurPub,
        netPrevPub,
        gamCurPub,
        gamPrevPub,
        windows.currentStart,
        windows.currentEnd,
        windows.previousStart,
        windows.previousEnd,
        aggregate,
        metric
      );
    }

    res.json({
      period,
      aggregate,
      metric,
      periodCurrentLabel: windows.periodCurrentLabel,
      periodPreviousLabel: windows.periodPreviousLabel,
      publishers,
      adUnits,
      networks,
      networksByPublisher,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    const status =
      axios.isAxiosError(e) && e.response?.status ? e.response.status : 500;
    res.status(status).json({ error: msg });
  }
});

async function fetchMetricsGrouped(
  client: AxiosInstance,
  startDate: string,
  endDate: string,
  dimensions: string[]
): Promise<MetricsRow[]> {
  const rows: MetricsRow[] = [];
  let page = 1;
  const limit = 100;
  let totalPages = 1;

  do {
    const params = new URLSearchParams();
    appendTenantParams(params);
    params.set("startDate", startDate);
    params.set("endDate", endDate);
    for (const d of dimensions) params.append("groupBy", d);
    params.set("page", String(page));
    params.set("limit", String(limit));

    const cacheKey = createCacheKey("metrics", params);
    const cached = getCached<MetricsListResponse>(cacheKey);

    if (cached) {
      rows.push(...(cached.data ?? []));
      totalPages = cached.pagination?.totalPages ?? 1;
    } else {
      const { data } = await client.get<MetricsListResponse>(
        `/api/metrics?${params.toString()}`
      );
      setCache(cacheKey, data);
      rows.push(...(data.data ?? []));
      totalPages = data.pagination?.totalPages ?? 1;
    }
    page += 1;
  } while (page <= totalPages);

  return rows;
}

router.get("/sasha-publishers", async (_req: Request, res: Response) => {
  try {
    const client = createClient();
    const end = addDays(todayLocal(), -1);
    const start = addDays(end, -29);
    const prefix = "SB";

    const now = new Date();
    const currentDay = now.getDate();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const hasCurrentMonthData = currentDay > 1;
    const dim = lastDay;
    const de = hasCurrentMonthData ? currentDay - 1 : 0;
    
    const monthStart = formatDate(new Date(now.getFullYear(), now.getMonth(), 1));
    const monthEnd = formatDate(new Date(now.getFullYear(), now.getMonth(), currentDay - 1));
    
    const isFirstDayOfMonth = currentDay === 1;
    const dataStart = isFirstDayOfMonth 
      ? formatDate(new Date(now.getFullYear(), now.getMonth() - 1, 1))
      : monthStart;
    const dataEnd = isFirstDayOfMonth
      ? formatDate(new Date(now.getFullYear(), now.getMonth(), 0))
      : monthEnd;
    
    const dataDaysElapsed = isFirstDayOfMonth
      ? lastDay
      : de;
    
    const displayMonthLabel = isFirstDayOfMonth
      ? monthTitleEs(dataStart)
      : monthTitleEs(monthStart);
    const displayDateRange = isFirstDayOfMonth
      ? `${dataStart} al ${dataEnd}`
      : `${monthStart} al ${monthEnd}`;
    
    const project = (cur: number): number => (dataDaysElapsed > 0) ? (cur / dataDaysElapsed) * dim : 0;

    const discoverEnd = formatDate(end);
    const discoverStart = formatDate(addDays(end, -364));
    const discoverRows = await fetchMetricsGrouped(
      client,
      discoverStart,
      discoverEnd,
      ["publisher"]
    );

    const sashaNames = new Set<string>();
    for (const row of discoverRows) {
      const name = row.publisher_name ?? "";
      if (name.trim().toUpperCase().startsWith(prefix.toUpperCase())) {
        sashaNames.add(name);
      }
    }

    if (sashaNames.size === 0) {
      res.json({
        currentMonthLabel: displayMonthLabel,
        dateRange: displayDateRange,
        daysElapsed: dataDaysElapsed,
        daysInMonth: dim,
        hasCurrentMonthData,
        totals: {
          adRequests: 0,
          impressions: 0,
          revenue: 0,
          cost: 0,
          profit: 0,
          projectedAdRequests: 0,
          projectedImpressions: 0,
          projectedRevenue: 0,
          projectedCost: 0,
          projectedProfit: 0,
        },
        publishers: [],
      });
      return;
    }

    const params = new URLSearchParams();
    appendTenantParams(params);
    params.set("groupBy", "publisher");
    params.set("startDate", dataStart);
    params.set("endDate", dataEnd);

    const { data } = await client.get<{ data: AggregatedRow[] }>(
      `/api/metrics/aggregated?${params.toString()}`
    );

    type PubSnap = {
      publisher_id: number;
      publisher_name: string;
      adRequests: number;
      impressions: number;
      revenue: number;
      cost: number;
      profit: number;
    };

    const curById = new Map<string, PubSnap>();
    for (const row of data.data ?? []) {
      const name = row.publisher_name;
      if (!name) continue;
      if (!sashaNames.has(name)) continue;
      
      curById.set(name, {
        publisher_id: 0,
        publisher_name: name,
        adRequests: toNum((row as any).total_ad_requests),
        impressions: toNum((row as any).total_impressions),
        revenue: toNum(row.total_revenue),
        cost: toNum(row.total_cost),
        profit: toNum(row.total_profit),
      });
    }

    let totalAdRequests = 0;
    let totalImpressions = 0;
    let totalRevenue = 0;
    let totalCost = 0;
    let totalProfit = 0;

    for (const [, c] of curById) {
      totalAdRequests += c.adRequests;
      totalImpressions += c.impressions;
      totalRevenue += c.revenue;
      totalCost += c.cost;
      totalProfit += c.profit;
    }

    const publishers = [...curById.values()].sort((a, b) => b.revenue - a.revenue);

    const dailyParams = new URLSearchParams();
    appendTenantParams(dailyParams);
    dailyParams.set("groupBy", "date");
    dailyParams.set("startDate", dataStart);
    dailyParams.set("endDate", dataEnd);

    const { data: dailyData } = await client.get<{ data: AggregatedRow[] }>(
      `/api/metrics/aggregated?${dailyParams.toString()}`
    );

    const sashaDailyTotals = new Map<string, { adRequests: number; impressions: number; revenue: number; cost: number; profit: number }>();
    
    for (const row of dailyData.data ?? []) {
      const date = row.date;
      if (!date) continue;
      
      const dateKey = date.split('T')[0];
      
      const existing = sashaDailyTotals.get(dateKey) || { adRequests: 0, impressions: 0, revenue: 0, cost: 0, profit: 0 };
      sashaDailyTotals.set(dateKey, {
        adRequests: existing.adRequests + toNum((row as any).total_ad_requests),
        impressions: existing.impressions + toNum((row as any).total_impressions),
        revenue: existing.revenue + toNum(row.total_revenue),
        cost: existing.cost + toNum(row.total_cost),
        profit: existing.profit + toNum(row.total_profit),
      });
    }

    const daily: { date: string; adRequests: number; impressions: number; revenue: number; cost: number; profit: number }[] = [];
    let currentDate = new Date(dataStart);
    const endDate = new Date(dataEnd);
    while (currentDate <= endDate) {
      const dateStr = formatDate(currentDate);
      const dayData = sashaDailyTotals.get(dateStr) || { adRequests: 0, impressions: 0, revenue: 0, cost: 0, profit: 0 };
      daily.push({
        date: dateStr,
        ...dayData,
      });
      currentDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
    }

    res.json({
      currentMonthLabel: displayMonthLabel,
      dateRange: displayDateRange,
      daysElapsed: dataDaysElapsed,
      daysInMonth: dim,
      hasCurrentMonthData,
      totals: {
        adRequests: totalAdRequests,
        impressions: totalImpressions,
        revenue: totalRevenue,
        cost: totalCost,
        profit: totalProfit,
        projectedAdRequests: project(totalAdRequests),
        projectedImpressions: project(totalImpressions),
        projectedRevenue: project(totalRevenue),
        projectedCost: project(totalCost),
        projectedProfit: project(totalProfit),
      },
      publishers: publishers.map(p => ({
        publisher_id: p.publisher_id,
        publisher_name: p.publisher_name,
        adRequests: p.adRequests,
        impressions: p.impressions,
        revenue: p.revenue,
        cost: p.cost,
        profit: p.profit,
      })),
      daily,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    const status =
      axios.isAxiosError(e) && e.response?.status ? e.response.status : 500;
    res.status(status).json({ error: msg });
  }
});

router.get("/embi-publishers", async (_req: Request, res: Response) => {
  try {
    const client = createClient();
    const end = addDays(todayLocal(), -1);
    const start = addDays(end, -29);
    const prefix = "EM";

    const now = new Date();
    const currentDay = now.getDate();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const hasCurrentMonthData = currentDay > 1;
    const dim = lastDay;
    const de = hasCurrentMonthData ? currentDay - 1 : 0;
    
    const monthStart = formatDate(new Date(now.getFullYear(), now.getMonth(), 1));
    const monthEnd = formatDate(new Date(now.getFullYear(), now.getMonth(), currentDay - 1));
    
    const isFirstDayOfMonth = currentDay === 1;
    const dataStart = isFirstDayOfMonth 
      ? formatDate(new Date(now.getFullYear(), now.getMonth() - 1, 1))
      : monthStart;
    const dataEnd = isFirstDayOfMonth
      ? formatDate(new Date(now.getFullYear(), now.getMonth(), 0))
      : monthEnd;
    
    const dataDaysElapsed = isFirstDayOfMonth
      ? lastDay
      : de;
    
    const displayMonthLabel = isFirstDayOfMonth
      ? monthTitleEs(dataStart)
      : monthTitleEs(monthStart);
    const displayDateRange = isFirstDayOfMonth
      ? `${dataStart} al ${dataEnd}`
      : `${monthStart} al ${monthEnd}`;
    
    const project = (cur: number): number => (dataDaysElapsed > 0) ? (cur / dataDaysElapsed) * dim : 0;

    const discoverEnd = formatDate(end);
    const discoverStart = formatDate(addDays(end, -364));
    const discoverRows = await fetchMetricsGrouped(
      client,
      discoverStart,
      discoverEnd,
      ["publisher"]
    );

    const embiNames = new Set<string>();
    for (const row of discoverRows) {
      const name = row.publisher_name ?? "";
      if (name.trim().toUpperCase().startsWith(prefix.toUpperCase())) {
        embiNames.add(name);
      }
    }

    console.log(`[EMBI] embiNames Set:`, JSON.stringify([...embiNames]));
    console.log(`[EMBI] Found ${embiNames.size} EM publishers`);

    if (embiNames.size === 0) {
      res.json({
        currentMonthLabel: displayMonthLabel,
        dateRange: displayDateRange,
        daysElapsed: dataDaysElapsed,
        daysInMonth: dim,
        hasCurrentMonthData,
        totals: {
          adRequests: 0,
          impressions: 0,
          revenue: 0,
          cost: 0,
          profit: 0,
          projectedAdRequests: 0,
          projectedImpressions: 0,
          projectedRevenue: 0,
          projectedCost: 0,
          projectedProfit: 0,
        },
        publishers: [],
        daily: [],
      });
      return;
    }

    const params = new URLSearchParams();
    appendTenantParams(params);
    params.set("groupBy", "publisher");
    params.set("startDate", dataStart);
    params.set("endDate", dataEnd);

    const { data } = await client.get<{ data: AggregatedRow[] }>(
      `/api/metrics/aggregated?${params.toString()}`
    );

    type PubSnap = {
      publisher_id: number;
      publisher_name: string;
      adRequests: number;
      impressions: number;
      revenue: number;
      cost: number;
      profit: number;
    };

    const curById = new Map<string, PubSnap>();
    for (const row of data.data ?? []) {
      const name = row.publisher_name;
      if (!name) continue;
      if (!embiNames.has(name)) continue;
      
      curById.set(name, {
        publisher_id: 0,
        publisher_name: name,
        adRequests: toNum((row as any).total_ad_requests),
        impressions: toNum((row as any).total_impressions),
        revenue: toNum(row.total_revenue),
        cost: toNum(row.total_cost),
        profit: toNum(row.total_profit),
      });
    }

    let totalAdRequests = 0;
    let totalImpressions = 0;
    let totalRevenue = 0;
    let totalCost = 0;
    let totalProfit = 0;

    for (const [, c] of curById) {
      totalAdRequests += c.adRequests;
      totalImpressions += c.impressions;
      totalRevenue += c.revenue;
      totalCost += c.cost;
      totalProfit += c.profit;
    }

    const publishers = [...curById.values()].sort((a, b) => b.revenue - a.revenue);

    const dailyRows = await fetchMetricsGrouped(
      client,
      dataStart,
      dataEnd,
      ["publisher", "date"]
    );

    const embiDailyTotals = new Map<string, { adRequests: number; impressions: number; revenue: number; cost: number; profit: number }>();
    
    for (const row of dailyRows) {
      const name = row.publisher_name;
      if (!name) continue;
      if (!embiNames.has(name)) continue;
      
      const date = row.date;
      if (!date) continue;
      
      const dateKey = date.split('T')[0];
      
      const existing = embiDailyTotals.get(dateKey) || { adRequests: 0, impressions: 0, revenue: 0, cost: 0, profit: 0 };
      embiDailyTotals.set(dateKey, {
        adRequests: existing.adRequests + toNum(row.ad_requests),
        impressions: existing.impressions + toNum(row.impressions),
        revenue: existing.revenue + toNum(row.revenue ?? 0),
        cost: existing.cost + toNum(row.cost ?? 0),
        profit: existing.profit + toNum(row.profit ?? 0),
      });
    }

    const daily: { date: string; adRequests: number; impressions: number; revenue: number; cost: number; profit: number }[] = [];
    let currentDate = new Date(dataStart);
    const endDate = new Date(dataEnd);
    while (currentDate <= endDate) {
      const dateStr = formatDate(currentDate);
      const dayData = embiDailyTotals.get(dateStr) || { adRequests: 0, impressions: 0, revenue: 0, cost: 0, profit: 0 };
      daily.push({
        date: dateStr,
        ...dayData,
      });
      currentDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
    }

    res.json({
      currentMonthLabel: displayMonthLabel,
      dateRange: displayDateRange,
      daysElapsed: dataDaysElapsed,
      daysInMonth: dim,
      hasCurrentMonthData,
      totals: {
        adRequests: totalAdRequests,
        impressions: totalImpressions,
        revenue: totalRevenue,
        cost: totalCost,
        profit: totalProfit,
        projectedAdRequests: project(totalAdRequests),
        projectedImpressions: project(totalImpressions),
        projectedRevenue: project(totalRevenue),
        projectedCost: project(totalCost),
        projectedProfit: project(totalProfit),
      },
      publishers: publishers.map(p => ({
        publisher_id: p.publisher_id,
        publisher_name: p.publisher_name,
        adRequests: p.adRequests,
        impressions: p.impressions,
        revenue: p.revenue,
        cost: p.cost,
        profit: p.profit,
      })),
      daily,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    const status =
      axios.isAxiosError(e) && e.response?.status ? e.response.status : 500;
    res.status(status).json({ error: msg });
  }
});

router.get("/media-buyer/:prefix", async (req: Request, res: Response) => {
  try {
    const prefix = (String(req.params.prefix ?? "")).toUpperCase().trim();
    if (!prefix || prefix.length < 2) {
      res.status(400).json({ error: "Prefix is required (min 2 chars)" });
      return;
    }

    const client = createClient();
    const end = addDays(todayLocal(), -1);
    const start = addDays(end, -29);

    const now = new Date();
    const currentDay = now.getDate();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const hasCurrentMonthData = currentDay > 1;
    const dim = lastDay;
    const de = hasCurrentMonthData ? currentDay - 1 : 0;
    
    const monthStart = formatDate(new Date(now.getFullYear(), now.getMonth(), 1));
    const monthEnd = formatDate(new Date(now.getFullYear(), now.getMonth(), currentDay - 1));
    
    const isFirstDayOfMonth = currentDay === 1;
    const dataStart = isFirstDayOfMonth 
      ? formatDate(new Date(now.getFullYear(), now.getMonth() - 1, 1))
      : monthStart;
    const dataEnd = isFirstDayOfMonth
      ? formatDate(new Date(now.getFullYear(), now.getMonth(), 0))
      : monthEnd;
    
    const dataDaysElapsed = isFirstDayOfMonth
      ? lastDay
      : de;
    
    const displayMonthLabel = isFirstDayOfMonth
      ? monthTitleEs(dataStart)
      : monthTitleEs(monthStart);
    const displayDateRange = isFirstDayOfMonth
      ? `${dataStart} al ${dataEnd}`
      : `${monthStart} al ${monthEnd}`;
    
    const project = (cur: number): number => (dataDaysElapsed > 0) ? (cur / dataDaysElapsed) * dim : 0;

    const discoverEnd = formatDate(end);
    const discoverStart = formatDate(addDays(end, -364));
    const discoverRows = await fetchMetricsGrouped(
      client,
      discoverStart,
      discoverEnd,
      ["publisher"]
    );

    const prefixNames = new Set<string>();
    for (const row of discoverRows) {
      const name = row.publisher_name ?? "";
      if (name.trim().toUpperCase().startsWith(prefix)) {
        prefixNames.add(name);
      }
    }

    if (prefixNames.size === 0) {
      res.json({
        currentMonthLabel: displayMonthLabel,
        dateRange: displayDateRange,
        daysElapsed: dataDaysElapsed,
        daysInMonth: dim,
        hasCurrentMonthData,
        totals: {
          adRequests: 0,
          impressions: 0,
          revenue: 0,
          cost: 0,
          profit: 0,
          projectedAdRequests: 0,
          projectedImpressions: 0,
          projectedRevenue: 0,
          projectedCost: 0,
          projectedProfit: 0,
        },
        publishers: [],
        daily: [],
      });
      return;
    }

    const params = new URLSearchParams();
    appendTenantParams(params);
    params.set("groupBy", "publisher");
    params.set("startDate", dataStart);
    params.set("endDate", dataEnd);

    const { data } = await client.get<{ data: AggregatedRow[] }>(
      `/api/metrics/aggregated?${params.toString()}`
    );

    type PubSnap = {
      publisher_id: number;
      publisher_name: string;
      adRequests: number;
      impressions: number;
      revenue: number;
      cost: number;
      profit: number;
    };

    const curById = new Map<string, PubSnap>();
    for (const row of data.data ?? []) {
      const name = row.publisher_name;
      if (!name) continue;
      if (!prefixNames.has(name)) continue;
      
      curById.set(name, {
        publisher_id: 0,
        publisher_name: name,
        adRequests: toNum((row as any).total_ad_requests),
        impressions: toNum((row as any).total_impressions),
        revenue: toNum(row.total_revenue),
        cost: toNum(row.total_cost),
        profit: toNum(row.total_profit),
      });
    }

    let totalAdRequests = 0;
    let totalImpressions = 0;
    let totalRevenue = 0;
    let totalCost = 0;
    let totalProfit = 0;

    for (const [, c] of curById) {
      totalAdRequests += c.adRequests;
      totalImpressions += c.impressions;
      totalRevenue += c.revenue;
      totalCost += c.cost;
      totalProfit += c.profit;
    }

    const publishers = [...curById.values()].sort((a, b) => b.revenue - a.revenue);

    const dailyRows = await fetchMetricsGrouped(
      client,
      dataStart,
      dataEnd,
      ["publisher", "date"]
    );

    const dailyTotals = new Map<string, { adRequests: number; impressions: number; revenue: number; cost: number; profit: number }>();
    
    for (const row of dailyRows) {
      const name = row.publisher_name;
      if (!name) continue;
      if (!prefixNames.has(name)) continue;
      
      const date = row.date;
      if (!date) continue;
      
      const dateKey = date.split('T')[0];
      
      const existing = dailyTotals.get(dateKey) || { adRequests: 0, impressions: 0, revenue: 0, cost: 0, profit: 0 };
      dailyTotals.set(dateKey, {
        adRequests: existing.adRequests + toNum(row.ad_requests),
        impressions: existing.impressions + toNum(row.impressions),
        revenue: existing.revenue + toNum(row.revenue ?? 0),
        cost: existing.cost + toNum(row.cost ?? 0),
        profit: existing.profit + toNum(row.profit ?? 0),
      });
    }

    const daily: { date: string; adRequests: number; impressions: number; revenue: number; cost: number; profit: number }[] = [];
    let currentDate = new Date(dataStart);
    const endDate = new Date(dataEnd);
    while (currentDate <= endDate) {
      const dateStr = formatDate(currentDate);
      const dayData = dailyTotals.get(dateStr) || { adRequests: 0, impressions: 0, revenue: 0, cost: 0, profit: 0 };
      daily.push({
        date: dateStr,
        ...dayData,
      });
      currentDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
    }

    res.json({
      currentMonthLabel: displayMonthLabel,
      dateRange: displayDateRange,
      daysElapsed: dataDaysElapsed,
      daysInMonth: dim,
      hasCurrentMonthData,
      totals: {
        adRequests: totalAdRequests,
        impressions: totalImpressions,
        revenue: totalRevenue,
        cost: totalCost,
        profit: totalProfit,
        projectedAdRequests: project(totalAdRequests),
        projectedImpressions: project(totalImpressions),
        projectedRevenue: project(totalRevenue),
        projectedCost: project(totalCost),
        projectedProfit: project(totalProfit),
      },
      publishers: publishers.map(p => ({
        publisher_id: p.publisher_id,
        publisher_name: p.publisher_name,
        adRequests: p.adRequests,
        impressions: p.impressions,
        revenue: p.revenue,
        cost: p.cost,
        profit: p.profit,
      })),
      daily,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    const status =
      axios.isAxiosError(e) && e.response?.status ? e.response.status : 500;
    res.status(status).json({ error: msg });
  }
});

type TopTenPeriod = 'yesterday' | '7days' | '30days';
type TopTenMetric = 'revenue' | 'impressions' | 'ad_requests';

router.get("/top-ten", async (req: Request, res: Response) => {
  try {
    const periodRaw = String(req.query.period ?? '7days').toLowerCase();
    const validPeriods: TopTenPeriod[] = ['yesterday', '7days', '30days'];
    if (!validPeriods.includes(periodRaw as TopTenPeriod)) {
      res.status(400).json({ error: "Invalid period (use yesterday, 7days, or 30days)" });
      return;
    }
    const period = periodRaw as TopTenPeriod;

    const metricRaw = String(req.query.metric ?? 'revenue').toLowerCase();
    const validMetrics: TopTenMetric[] = ['revenue', 'impressions', 'ad_requests'];
    if (!validMetrics.includes(metricRaw as TopTenMetric)) {
      res.status(400).json({ error: "Invalid metric (use revenue, impressions, or ad_requests)" });
      return;
    }
    const metric = metricRaw as TopTenMetric;

    const scopeRaw = String(req.query.scope ?? 'general').toLowerCase();
    const scopeLabel = scopeRaw === 'general' ? 'General' 
      : scopeRaw === 'sasha' ? 'Sasha Balbi' 
      : scopeRaw === 'embi' ? 'Embi Media' 
      : scopeRaw;

    const client = createClient();
    const end = addDays(todayLocal(), -1);
    let start: Date;
    let periodLabel: string;

    if (period === 'yesterday') {
      start = end;
      periodLabel = 'Ayer';
    } else if (period === '7days') {
      start = addDays(end, -6);
      periodLabel = 'Últimos 7 días';
    } else {
      start = addDays(end, -29);
      periodLabel = 'Últimos 30 días';
    }

    const startStr = formatDate(start);
    const endStr = formatDate(end);

    const [pubRows, adRows, netRows, gamRows, netPubRows, gamPubRows] = await Promise.all([
      fetchMetricsGrouped(client, startStr, endStr, ['publisher']),
      fetchMetricsGrouped(client, startStr, endStr, ['ad_unit', 'publisher']),
      fetchMetricsGrouped(client, startStr, endStr, ['network']),
      fetchMetricsGrouped(client, startStr, endStr, ['gam_network']),
      fetchMetricsGrouped(client, startStr, endStr, ['network', 'publisher']),
      fetchMetricsGrouped(client, startStr, endStr, ['gam_network', 'publisher']),
    ]);

    const getValue = (r: MetricsRow): number => {
      if (metric === 'impressions') return toNum(r.impressions);
      if (metric === 'ad_requests') return toNum(r.ad_requests);
      return toNum(r.revenue);
    };

    const shouldFilterPublisher = (name: string | undefined): boolean => {
      if (scopeRaw === 'general') return false;
      if (scopeRaw === 'sasha') return !isSashaPublisherName(name);
      if (scopeRaw === 'embi') return !isEmbiPublisherName(name);
      return !name?.trim().toUpperCase().startsWith(scopeRaw.toUpperCase());
    };

    const topPublishers: { name: string; value: number }[] = [];
    const pubMap = new Map<string, number>();
    for (const r of pubRows) {
      const name = r.publisher_name?.trim() || `Publisher ${r.publisher_id}`;
      if (shouldFilterPublisher(name)) continue;
      pubMap.set(name, (pubMap.get(name) ?? 0) + getValue(r));
    }
    topPublishers.push(...[...pubMap.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10));

    const topAdUnits: { name: string; publisherName: string | undefined; value: number }[] = [];
    const adMap = new Map<string, { adUnitName: string; publisherName: string | undefined; value: number }>();
    for (const r of adRows) {
      const name = r.publisher_name?.trim() || `Publisher ${r.publisher_id}`;
      if (shouldFilterPublisher(name)) continue;
      const key = `${r.ad_unit_id}-${r.publisher_id ?? 0}`;
      const adUnitName = r.ad_unit_name?.trim() || `Ad unit ${r.ad_unit_id}`;
      const publisherName = r.publisher_name?.trim();
      const entry = adMap.get(key) || { adUnitName, publisherName, value: 0 };
      entry.value += getValue(r);
      entry.publisherName = publisherName;
      adMap.set(key, entry);
    }
    topAdUnits.push(...[...adMap.entries()]
      .map(([, v]) => ({ 
        name: v.adUnitName, 
        publisherName: v.publisherName, 
        value: v.value 
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10));

    const netMap = new Map<string, number>();
    if (scopeRaw === 'general') {
      for (const r of netRows) {
        const name = r.network_name?.trim();
        if (!name || isGamNetworkName(name)) continue;
        netMap.set(name, (netMap.get(name) ?? 0) + getValue(r));
      }
    } else {
      for (const r of netPubRows) {
        const pubName = r.publisher_name?.trim();
        if (shouldFilterPublisher(pubName)) continue;
        const name = r.network_name?.trim();
        if (!name || isGamNetworkName(name)) continue;
        netMap.set(name, (netMap.get(name) ?? 0) + getValue(r));
      }
    }
    const topNetworks: { name: string; value: number }[] = [...netMap.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    const gamMap = new Map<string, number>();
    if (scopeRaw === 'general') {
      for (const r of gamRows) {
        const name = r.gam_network_name?.trim();
        if (!name) continue;
        gamMap.set(name, (gamMap.get(name) ?? 0) + getValue(r));
      }
    } else {
      for (const r of gamPubRows) {
        const pubName = r.publisher_name?.trim();
        if (shouldFilterPublisher(pubName)) continue;
        const name = r.gam_network_name?.trim();
        if (!name) continue;
        gamMap.set(name, (gamMap.get(name) ?? 0) + getValue(r));
      }
    }

    const topGamNetworks: { name: string; value: number }[] = [...gamMap.entries()]
      .map(([name, value]) => ({ name: `GAM · ${name}`, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    const allNetworks = [...topNetworks, ...topGamNetworks]
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    res.json({
      scope: scopeRaw,
      scopeLabel,
      period,
      metric,
      periodLabel,
      dateRange: `${startStr} → ${endStr}`,
      topPublishers,
      topAdUnits,
      topNetworks: allNetworks,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    const status = axios.isAxiosError(e) && e.response?.status ? e.response.status : 500;
    res.status(status).json({ error: msg });
  }
});

router.get("/dropped-ad-units", async (req: Request, res: Response) => {
  try {
    const scopeRaw = String(req.query.scope ?? 'general').toLowerCase();
    const scopeLabel = scopeRaw === 'general' ? 'General' 
      : scopeRaw === 'sasha' ? 'Sasha Balbi' 
      : scopeRaw === 'embi' ? 'Embi Media' 
      : scopeRaw;

    const client = createClient();
    const end = addDays(todayLocal(), -1);
    const startRecent = addDays(end, -7);
    const startPast = addDays(end, -30);

    const recentStr = formatDate(startRecent);
    const pastStr = formatDate(startPast);
    const endStr = formatDate(end);
    const pastEndStr = formatDate(addDays(end, -8));

    const recentRows = await fetchMetricsGrouped(client, recentStr, endStr, ['ad_unit', 'publisher']);
    const pastRows = await fetchMetricsGrouped(client, pastStr, pastEndStr, ['ad_unit', 'publisher']);
    const dailyRows = await fetchMetricsGrouped(client, pastStr, endStr, ['ad_unit', 'publisher', 'date']);

    const shouldFilterPublisher = (name: string | undefined): boolean => {
      if (scopeRaw === 'general') return false;
      if (scopeRaw === 'sasha') return !isSashaPublisherName(name);
      if (scopeRaw === 'embi') return !isEmbiPublisherName(name);
      return !name?.trim().toUpperCase().startsWith(scopeRaw.toUpperCase());
    };

    interface AdUnitStats {
      adUnitName: string;
      publisherName: string;
      totalAr: number;
      daysWithAr: number;
      lastDate: string;
    }

    const lastGoodDates = new Map<string, string>();
    for (const r of dailyRows) {
      const pubName = r.publisher_name?.trim();
      if (shouldFilterPublisher(pubName)) continue;
      const key = `${r.ad_unit_id}-${r.publisher_id ?? 0}`;
      const ar = toNum(r.ad_requests);
      const date = r.date ?? '';
      if (ar > 0) {
        const existing = lastGoodDates.get(key);
        if (!existing || date > existing) {
          lastGoodDates.set(key, date);
        }
      }
    }

    const pastAdUnits = new Map<string, AdUnitStats>();
    for (const r of pastRows) {
      const pubName = r.publisher_name?.trim();
      if (shouldFilterPublisher(pubName)) continue;
      const key = `${r.ad_unit_id}-${r.publisher_id ?? 0}`;
      const ar = toNum(r.ad_requests);
      const existing = pastAdUnits.get(key);
      if (!existing) {
        pastAdUnits.set(key, {
          adUnitName: r.ad_unit_name?.trim() || `Ad unit ${r.ad_unit_id}`,
          publisherName: pubName || `Publisher ${r.publisher_id}`,
          totalAr: ar,
          daysWithAr: ar > 0 ? 1 : 0,
          lastDate: '',
        });
      } else {
        existing.totalAr += ar;
        if (ar > 0) existing.daysWithAr += 1;
      }
    }

    const recentAdUnits = new Map<string, AdUnitStats>();
    for (const r of recentRows) {
      const pubName = r.publisher_name?.trim();
      if (shouldFilterPublisher(pubName)) continue;
      const key = `${r.ad_unit_id}-${r.publisher_id ?? 0}`;
      const ar = toNum(r.ad_requests);
      const existing = recentAdUnits.get(key);
      if (!existing) {
        recentAdUnits.set(key, {
          adUnitName: r.ad_unit_name?.trim() || `Ad unit ${r.ad_unit_id}`,
          publisherName: pubName || `Publisher ${r.publisher_id}`,
          totalAr: ar,
          daysWithAr: ar > 0 ? 1 : 0,
          lastDate: '',
        });
      } else {
        existing.totalAr += ar;
        if (ar > 0) existing.daysWithAr += 1;
      }
    }

    const dropped: { name: string; publisherName: string; pastAvgDailyAr: number; recentAvgDailyAr: number; dropPct: number; lastGoodDate: string }[] = [];
    
    for (const [key, past] of pastAdUnits) {
      const pastAvg = past.daysWithAr > 0 ? past.totalAr / past.daysWithAr : 0;
      if (pastAvg < 1000) continue;

      const recent = recentAdUnits.get(key);
      const recentAvg = recent && recent.daysWithAr > 0 ? recent.totalAr / recent.daysWithAr : 0;

      if (recentAvg > 0 && recentAvg >= pastAvg * 0.05) continue;
      
      const dropPct = pastAvg > 0 ? ((pastAvg - recentAvg) / pastAvg) * 100 : 100;
      if (dropPct < 50 && recentAvg > 0) continue;

      const lastGoodDate = lastGoodDates.get(key) || '—';
      
      dropped.push({
        name: past.adUnitName,
        publisherName: past.publisherName,
        pastAvgDailyAr: Math.round(pastAvg),
        recentAvgDailyAr: Math.round(recentAvg),
        dropPct: Math.round(dropPct),
        lastGoodDate,
      });
    }

    dropped.sort((a, b) => b.dropPct - a.dropPct);

    res.json({
      scope: scopeRaw,
      scopeLabel,
      pastPeriodLabel: `${pastStr} → ${pastEndStr}`,
      recentPeriodLabel: `${recentStr} → ${endStr}`,
      dropped: dropped.slice(0, 50),
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    const status = axios.isAxiosError(e) && e.response?.status ? e.response.status : 500;
    res.status(status).json({ error: msg });
  }
});

router.get("/dropped-publishers", async (req: Request, res: Response) => {
  try {
    const scopeRaw = String(req.query.scope ?? 'general').toLowerCase();
    const scopeLabel = scopeRaw === 'general' ? 'General' 
      : scopeRaw === 'sasha' ? 'Sasha Balbi' 
      : scopeRaw === 'embi' ? 'Embi Media' 
      : scopeRaw;

    const client = createClient();
    const end = addDays(todayLocal(), -1);
    const startRecent = addDays(end, -7);
    const startPast = addDays(end, -30);

    const recentStr = formatDate(startRecent);
    const pastStr = formatDate(startPast);
    const endStr = formatDate(end);
    const pastEndStr = formatDate(addDays(end, -8));

    const recentRows = await fetchMetricsGrouped(client, recentStr, endStr, ['publisher']);
    const pastRows = await fetchMetricsGrouped(client, pastStr, pastEndStr, ['publisher']);
    const dailyRows = await fetchMetricsGrouped(client, pastStr, endStr, ['publisher', 'date']);

    const shouldFilterPublisher = (name: string | undefined): boolean => {
      if (scopeRaw === 'general') return false;
      if (scopeRaw === 'sasha') return !isSashaPublisherName(name);
      if (scopeRaw === 'embi') return !isEmbiPublisherName(name);
      return !name?.trim().toUpperCase().startsWith(scopeRaw.toUpperCase());
    };

    interface PublisherStats {
      publisherName: string;
      totalAr: number;
      daysWithAr: number;
      lastDate: string;
    }

    const lastGoodDates = new Map<string, string>();
    for (const r of dailyRows) {
      const pubName = r.publisher_name?.trim();
      if (shouldFilterPublisher(pubName)) continue;
      const key = String(r.publisher_id ?? pubName);
      const ar = toNum(r.ad_requests);
      const date = r.date ?? '';
      if (ar > 0) {
        const existing = lastGoodDates.get(key);
        if (!existing || date > existing) {
          lastGoodDates.set(key, date);
        }
      }
    }

    const pastPublishers = new Map<string, PublisherStats>();
    for (const r of pastRows) {
      const pubName = r.publisher_name?.trim();
      if (shouldFilterPublisher(pubName)) continue;
      const key = String(r.publisher_id);
      const ar = toNum(r.ad_requests);
      const existing = pastPublishers.get(key);
      if (!existing) {
        pastPublishers.set(key, {
          publisherName: pubName || `Publisher ${r.publisher_id}`,
          totalAr: ar,
          daysWithAr: ar > 0 ? 1 : 0,
          lastDate: '',
        });
      } else {
        existing.totalAr += ar;
        if (ar > 0) existing.daysWithAr += 1;
      }
    }

    const recentPublishers = new Map<string, PublisherStats>();
    for (const r of recentRows) {
      const pubName = r.publisher_name?.trim();
      if (shouldFilterPublisher(pubName)) continue;
      const key = String(r.publisher_id);
      const ar = toNum(r.ad_requests);
      const existing = recentPublishers.get(key);
      if (!existing) {
        recentPublishers.set(key, {
          publisherName: pubName || `Publisher ${r.publisher_id}`,
          totalAr: ar,
          daysWithAr: ar > 0 ? 1 : 0,
          lastDate: '',
        });
      } else {
        existing.totalAr += ar;
        if (ar > 0) existing.daysWithAr += 1;
      }
    }

    const dropped: { name: string; pastAvgDailyAr: number; recentAvgDailyAr: number; dropPct: number; lastGoodDate: string }[] = [];
    
    for (const [key, past] of pastPublishers) {
      const pastAvg = past.daysWithAr > 0 ? past.totalAr / past.daysWithAr : 0;
      if (pastAvg < 1000) continue;

      const recent = recentPublishers.get(key);
      const recentAvg = recent && recent.daysWithAr > 0 ? recent.totalAr / recent.daysWithAr : 0;

      if (recentAvg > 0 && recentAvg >= pastAvg * 0.05) continue;
      
      const dropPct = pastAvg > 0 ? ((pastAvg - recentAvg) / pastAvg) * 100 : 100;
      if (dropPct < 50 && recentAvg > 0) continue;

      const lastGoodDate = lastGoodDates.get(key) || '—';
      
      dropped.push({
        name: past.publisherName,
        pastAvgDailyAr: Math.round(pastAvg),
        recentAvgDailyAr: Math.round(recentAvg),
        dropPct: Math.round(dropPct),
        lastGoodDate,
      });
    }

    dropped.sort((a, b) => b.dropPct - a.dropPct);

    res.json({
      scope: scopeRaw,
      scopeLabel,
      pastPeriodLabel: `${pastStr} → ${pastEndStr}`,
      recentPeriodLabel: `${recentStr} → ${endStr}`,
      dropped: dropped.slice(0, 50),
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    const status = axios.isAxiosError(e) && e.response?.status ? e.response.status : 500;
    res.status(status).json({ error: msg });
  }
});

router.get("/alerts/daily-drop", async (req: Request, res: Response) => {
  try {
    const client = createClient();
    const now = todayLocal();
    const end = addDays(now, -1);
    const endStr = formatDate(end);

    const isMonday = now.getDay() === 1;

    let currentStart: string;
    let currentEnd: string;
    let previousStart: string;
    let previousEnd: string;
    let comparisonLabel: string;
    let isMondayComparison: boolean;

    if (isMonday) {
      const saturday = formatDate(addDays(end, -1));
      const sunday = endStr;
      const thursday = formatDate(addDays(end, -4));
      const friday = formatDate(addDays(end, -3));
      currentStart = saturday;
      currentEnd = sunday;
      previousStart = thursday;
      previousEnd = friday;
      comparisonLabel = `${shortMd(thursday)}-${shortMd(friday)} vs ${shortMd(saturday)}-${shortMd(sunday)}`;
      isMondayComparison = true;
    } else {
      const dayBeforeEnd = formatDate(addDays(end, -1));
      currentStart = endStr;
      currentEnd = endStr;
      previousStart = dayBeforeEnd;
      previousEnd = dayBeforeEnd;
      comparisonLabel = `${shortMd(dayBeforeEnd)} vs ${shortMd(endStr)}`;
      isMondayComparison = false;
    }

    const currentRows = await fetchMetricsGrouped(client, currentStart, currentEnd, ['ad_unit', 'publisher', 'date']);
    const previousRows = await fetchMetricsGrouped(client, previousStart, previousEnd, ['ad_unit', 'publisher', 'date']);

    const dailyMetrics: { date: string; revenue: number; cost: number; profit: number }[] = [];
    if (isMonday) {
      const fri = formatDate(addDays(end, -2));
      const sat = formatDate(addDays(end, -1));
      const sun = endStr;
      const dateRange = isMonday ? `${previousStart}/${previousEnd}` : currentStart;
      const [friRows, satRows, sunRows] = await Promise.all([
        fetchMetricsGrouped(client, fri, fri, ['date']),
        fetchMetricsGrouped(client, sat, sat, ['date']),
        fetchMetricsGrouped(client, sun, sun, ['date']),
      ]);
      const sumRows = (rows: MetricsRow[]) => {
        let rev = 0, cost = 0, imp = 0;
        for (const r of rows) { rev += toNum(r.revenue); cost += toNum(r.cost); }
        return { revenue: rev, cost, profit: rev - cost };
      };
      dailyMetrics.push(
        { date: fri, ...sumRows(friRows) },
        { date: sat, ...sumRows(satRows) },
        { date: sun, ...sumRows(sunRows) },
      );
    } else {
      const yesterdayRows = await fetchMetricsGrouped(client, currentStart, currentEnd, ['date']);
      let revenue = 0, cost = 0;
      for (const r of yesterdayRows) { revenue += toNum(r.revenue); cost += toNum(r.cost); }
      dailyMetrics.push({ date: currentStart, revenue, cost, profit: revenue - cost });
    }

    const previousAdUnits = new Map<string, { name: string; publisherName: string; totalAr: number; days: number }>();
    for (const r of previousRows) {
      const ar = toNum(r.ad_requests);
      if (ar < 5000) continue;
      const key = `${r.ad_unit_id}-${r.publisher_id ?? 0}`;
      const existing = previousAdUnits.get(key);
      if (!existing) {
        previousAdUnits.set(key, {
          name: r.ad_unit_name?.trim() || `Ad unit ${r.ad_unit_id}`,
          publisherName: r.publisher_name?.trim() || `Publisher ${r.publisher_id}`,
          totalAr: ar,
          days: 1,
        });
      } else {
        existing.totalAr += ar;
        existing.days += 1;
      }
    }

    const previousPublishers = new Map<string, { name: string; totalAr: number; days: number }>();
    for (const r of previousRows) {
      const ar = toNum(r.ad_requests);
      if (ar < 5000) continue;
      const key = String(r.publisher_id);
      const existing = previousPublishers.get(key);
      if (!existing) {
        previousPublishers.set(key, {
          name: r.publisher_name?.trim() || `Publisher ${r.publisher_id}`,
          totalAr: ar,
          days: 1,
        });
      } else {
        existing.totalAr += ar;
        existing.days += 1;
      }
    }

    const currentAdUnits = new Map<string, { name: string; publisherName: string; totalAr: number; days: number }>();
    for (const r of currentRows) {
      const ar = toNum(r.ad_requests);
      if (ar < 5000) continue;
      const key = `${r.ad_unit_id}-${r.publisher_id ?? 0}`;
      const existing = currentAdUnits.get(key);
      if (!existing) {
        currentAdUnits.set(key, {
          name: r.ad_unit_name?.trim() || `Ad unit ${r.ad_unit_id}`,
          publisherName: r.publisher_name?.trim() || `Publisher ${r.publisher_id}`,
          totalAr: ar,
          days: 1,
        });
      } else {
        existing.totalAr += ar;
        existing.days += 1;
      }
    }

    const currentPublishers = new Map<string, { name: string; totalAr: number; days: number }>();
    for (const r of currentRows) {
      const ar = toNum(r.ad_requests);
      if (ar < 5000) continue;
      const key = String(r.publisher_id);
      const existing = currentPublishers.get(key);
      if (!existing) {
        currentPublishers.set(key, {
          name: r.publisher_name?.trim() || `Publisher ${r.publisher_id}`,
          totalAr: ar,
          days: 1,
        });
      } else {
        existing.totalAr += ar;
        existing.days += 1;
      }
    }

    const droppedAdUnits: { name: string; publisherName: string; previousAr: number; currentAr: number; dropPct: number }[] = [];
    for (const [key, prev] of previousAdUnits) {
      const prevAvg = prev.totalAr / prev.days;
      const curr = currentAdUnits.get(key);
      const currAvg = curr ? curr.totalAr / curr.days : 0;
      if (currAvg < prevAvg * 0.05) {
        const dropPct = prevAvg > 0 ? Math.round(((prevAvg - currAvg) / prevAvg) * 100) : 100;
        droppedAdUnits.push({
          name: prev.name,
          publisherName: prev.publisherName,
          previousAr: Math.round(prevAvg),
          currentAr: Math.round(currAvg),
          dropPct,
        });
      }
    }

    const droppedPublishers: { name: string; previousAr: number; currentAr: number; dropPct: number }[] = [];
    for (const [key, prev] of previousPublishers) {
      const prevAvg = prev.totalAr / prev.days;
      const curr = currentPublishers.get(key);
      const currAvg = curr ? curr.totalAr / curr.days : 0;
      if (currAvg < prevAvg * 0.05) {
        const dropPct = prevAvg > 0 ? Math.round(((prevAvg - currAvg) / prevAvg) * 100) : 100;
        droppedPublishers.push({
          name: prev.name,
          previousAr: Math.round(prevAvg),
          currentAr: Math.round(currAvg),
          dropPct,
        });
      }
    }

    droppedAdUnits.sort((a, b) => b.dropPct - a.dropPct);
    droppedPublishers.sort((a, b) => b.dropPct - a.dropPct);

    const recoveredAdUnits: { name: string; publisherName: string; previousAr: number; currentAr: number; increasePct: number }[] = [];
    for (const [key, curr] of currentAdUnits) {
      const currAvg = curr.totalAr / curr.days;
      const prev = previousAdUnits.get(key);
      const prevAvg = prev ? prev.totalAr / prev.days : 0;
      if (prevAvg < 500 && currAvg >= 5000) {
        const increasePct = prevAvg > 0 ? Math.round(((currAvg - prevAvg) / prevAvg) * 100) : 100;
        recoveredAdUnits.push({
          name: curr.name,
          publisherName: curr.publisherName,
          previousAr: Math.round(prevAvg),
          currentAr: Math.round(currAvg),
          increasePct,
        });
      }
    }

    const recoveredPublishers: { name: string; previousAr: number; currentAr: number; increasePct: number }[] = [];
    for (const [key, curr] of currentPublishers) {
      const currAvg = curr.totalAr / curr.days;
      const prev = previousPublishers.get(key);
      const prevAvg = prev ? prev.totalAr / prev.days : 0;
      if (prevAvg < 500 && currAvg >= 5000) {
        const increasePct = prevAvg > 0 ? Math.round(((currAvg - prevAvg) / prevAvg) * 100) : 100;
        recoveredPublishers.push({
          name: curr.name,
          previousAr: Math.round(prevAvg),
          currentAr: Math.round(currAvg),
          increasePct,
        });
      }
    }

    recoveredAdUnits.sort((a, b) => b.increasePct - a.increasePct);
    recoveredPublishers.sort((a, b) => b.increasePct - a.increasePct);

    res.json({
      comparisonLabel,
      isMondayComparison,
      dailyMetrics,
      droppedAdUnits,
      droppedPublishers,
      recoveredAdUnits,
      recoveredPublishers,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    const status = axios.isAxiosError(e) && e.response?.status ? e.response.status : 500;
    res.status(status).json({ error: msg });
  }
});

export default router;
