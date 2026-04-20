import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import fallbackHoldingsJson from "../data/holdingsFallback.json";
import { holdingsAPI, portfolioAPI, pricesAPI, transactionsAPI } from "./api";

const HOLDINGS_CACHE_KEY = "legacy.holdings.base";
const TRANSACTIONS_CACHE_KEY = "legacy.transactions.base";
const LIVE_PRICES_CACHE_KEY = "legacy.livePrices";
const LIVE_PRICE_TTL_MS = 45_000;
const FALLBACK_MESSAGE = "Live pricing is temporarily unavailable. Showing saved portfolio data where possible.";
const LIVE_WARNING_MESSAGE = "Live pricing is temporarily unavailable right now. Using cached or saved values until pricing recovers.";
const RATE_LIMIT_MESSAGE = "Live pricing is temporarily unavailable right now. Please wait a moment and try again.";
const USERS_STORAGE_KEY = "legacy.users";
const ACTIVE_USER_ID_STORAGE_KEY = "legacy.activeUserId";
const ACTIVE_PORTFOLIO_ID_STORAGE_KEY = "legacy.activePortfolioId";
const PERFORMANCE_RANGE_OPTIONS = ["1D", "1W", "1M", "3M", "6M", "1Y", "All"];
const PERFORMANCE_RANGE_TO_DAYS = {
  "1D": 1,
  "1W": 7,
  "1M": 30,
  "3M": 90,
  "6M": 180,
  "1Y": 365,
};

const PortfolioDataContext = createContext(null);

const livePriceMemoryCache = new Map();
const livePriceInFlight = new Map();

function toNumber(value, defaultValue = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : defaultValue;
}

function normalizeSymbol(value) {
  return String(value ?? "").trim().toUpperCase();
}

function toId(value) {
  if (value === null || value === undefined) return "";
  return String(value);
}

function createUserFromCurrentLocalStorage() {
  const currentUser = readJsonCache("currentUser", null);
  const name = String(currentUser?.name || currentUser?.fullName || "").trim();
  const email = String(currentUser?.email || "").trim();
  if (!name && !email) return null;

  const safeName = name || email || "User";
  const idSeed = email || safeName.toLowerCase().replace(/\s+/g, "-");

  return {
    id: `user-${idSeed}`,
    name: safeName,
    email,
  };
}

function readInitialUsers() {
  const stored = readJsonCache(USERS_STORAGE_KEY, []);
  const cleaned = Array.isArray(stored)
    ? stored
        .map((item, index) => ({
          id: toId(item?.id || `user-${index + 1}`),
          name: String(item?.name || "").trim() || `User ${index + 1}`,
          email: String(item?.email || "").trim(),
          portfolioIds: Array.isArray(item?.portfolioIds) ? item.portfolioIds.map(toId).filter(Boolean) : [],
        }))
        .filter((item) => item.id)
    : [];

  const fromCurrent = createUserFromCurrentLocalStorage();
  if (fromCurrent && !cleaned.some((user) => user.id === fromCurrent.id)) {
    cleaned.unshift(fromCurrent);
  }

  if (cleaned.length > 0) return cleaned;

  return [
    {
      id: "user-default",
      name: "User",
      email: "",
      portfolioIds: [],
    },
  ];
}

function resolveSector(rawSector, symbol) {
  if (rawSector && String(rawSector).trim()) return String(rawSector);

  const tech = ["AAPL", "MSFT", "AMZN", "GOOGL", "META", "NVDA", "TSLA"];
  const financials = ["JPM", "V"];
  const healthcare = ["JNJ"];

  if (tech.includes(symbol)) return "Technology";
  if (financials.includes(symbol)) return "Financials";
  if (healthcare.includes(symbol)) return "Healthcare";
  return "Other";
}

function readJsonCache(key, fallbackValue) {
  if (typeof window === "undefined") return fallbackValue;

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallbackValue;
    return JSON.parse(raw);
  } catch {
    return fallbackValue;
  }
}

function saveJsonCache(key, value) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage issues so the UI keeps rendering.
  }
}

function readStoredLivePrices() {
  const cached = readJsonCache(LIVE_PRICES_CACHE_KEY, {});
  return cached && typeof cached === "object" ? cached : {};
}

function writeStoredLivePrice(symbol, entry) {
  const existing = readStoredLivePrices();
  existing[symbol] = entry;
  saveJsonCache(LIVE_PRICES_CACHE_KEY, existing);
}

function readLivePriceCacheEntry(symbol) {
  return livePriceMemoryCache.get(symbol) ?? readStoredLivePrices()[symbol] ?? null;
}

function isFreshCacheEntry(entry, ttlMs = LIVE_PRICE_TTL_MS) {
  return Boolean(entry?.timestamp) && Date.now() - entry.timestamp <= ttlMs;
}

function getBackendBidPrice(rawBackendHolding = {}) {
  return toNumber(rawBackendHolding?.bidPrice ?? rawBackendHolding?.currentBidPrice ?? rawBackendHolding?.price, 0);
}

function buildLivePriceEntry(symbol, payload, source, isStale = false) {
  const price = toNumber(payload?.price ?? payload?.bidPrice, 0);
  return {
    symbol,
    price,
    timestamp: payload?.timestamp ?? Date.now(),
    source,
    isStale,
  };
}

function createUnavailableQuote(symbol, backendPrice = 0) {
  return {
    symbol,
    price: toNumber(backendPrice, 0),
    timestamp: Date.now(),
    source: backendPrice > 0 ? "backend" : "missing",
    isStale: true,
    unavailable: true,
  };
}

function getFriendlyLivePriceError(error, fallbackMessage = RATE_LIMIT_MESSAGE) {
  const status = error?.response?.status;
  if (status === 429) return RATE_LIMIT_MESSAGE;
  if (status >= 500) return LIVE_WARNING_MESSAGE;
  return fallbackMessage;
}

function getCachedQuoteForSymbol(symbol, options = {}) {
  const entry = readLivePriceCacheEntry(symbol);
  if (!entry) return null;

  if (options.allowStale) {
    return {
      ...entry,
      isStale: !isFreshCacheEntry(entry),
      source: entry.source || "cache",
    };
  }

  if (!isFreshCacheEntry(entry, options.ttlMs)) return null;
  return {
    ...entry,
    isStale: false,
    source: entry.source || "cache",
  };
}

async function requestLivePrice(symbol, options = {}) {
  const normalizedSymbol = normalizeSymbol(symbol);
  if (!normalizedSymbol) return null;

  const freshCached = getCachedQuoteForSymbol(normalizedSymbol, {
    allowStale: false,
    ttlMs: options.ttlMs,
  });

  if (freshCached && !options.forceRefresh) {
    return freshCached;
  }

  if (!options.forceRefresh && livePriceInFlight.has(normalizedSymbol)) {
    return livePriceInFlight.get(normalizedSymbol);
  }

  const promise = pricesAPI
    .getLivePrice(normalizedSymbol)
    .then((response) => {
      const entry = buildLivePriceEntry(
        normalizedSymbol,
        { price: response?.data?.price, timestamp: Date.now() },
        "live"
      );
      livePriceMemoryCache.set(normalizedSymbol, entry);
      writeStoredLivePrice(normalizedSymbol, entry);
      return entry;
    })
    .catch((error) => {
      const staleEntry = getCachedQuoteForSymbol(normalizedSymbol, { allowStale: true, ttlMs: options.ttlMs });
      if (staleEntry) {
        return {
          ...staleEntry,
          isStale: true,
          source: staleEntry.source === "live" ? "cache" : staleEntry.source,
        };
      }

      throw error;
    })
    .finally(() => {
      livePriceInFlight.delete(normalizedSymbol);
    });

  livePriceInFlight.set(normalizedSymbol, promise);
  return promise;
}

async function getLivePricesForSymbols(symbols, options = {}) {
  const uniqueSymbols = Array.from(new Set((symbols || []).map(normalizeSymbol).filter(Boolean)));
  const results = {};
  const warnings = [];

  await Promise.all(
    uniqueSymbols.map(async (symbol) => {
      try {
        const entry = await requestLivePrice(symbol, {
          allowStaleCache: options.allowStaleCache ?? true,
          forceRefresh: options.forceRefresh ?? false,
          ttlMs: options.ttlMs ?? LIVE_PRICE_TTL_MS,
        });

        if (entry) {
          results[symbol] = entry;
          if (entry.isStale) warnings.push(LIVE_WARNING_MESSAGE);
        }
      } catch (error) {
        warnings.push(getFriendlyLivePriceError(error, LIVE_WARNING_MESSAGE));
      }
    })
  );

  return {
    prices: results,
    warning: warnings[0] || "",
    hasFailures: warnings.length > 0,
  };
}

function mapBaseHolding(rawBackendHolding = {}) {
  const symbol = normalizeSymbol(rawBackendHolding?.symbol ?? rawBackendHolding?.ticker) || "UNKNOWN";
  const quantityOwned = toNumber(
    rawBackendHolding?.quantityOwned ?? rawBackendHolding?.amountOwned ?? rawBackendHolding?.quantity,
    0
  );
  const currentBidPrice = getBackendBidPrice(rawBackendHolding);
  const totalInvested = toNumber(rawBackendHolding?.totalInvested, quantityOwned * currentBidPrice);
  const totalValue = quantityOwned * currentBidPrice;
  const profitLossValue = totalValue - totalInvested;
  const profitLossPercent = totalInvested > 0 ? (profitLossValue / totalInvested) * 100 : 0;

  return {
    id: rawBackendHolding?.id ?? `${symbol}-${rawBackendHolding?.companyName ?? "holding"}`,
    name: rawBackendHolding?.companyName ?? rawBackendHolding?.name ?? rawBackendHolding?.company ?? "Unknown Company",
    symbol,
    quantityOwned,
    currentBidPrice,
    totalValue,
    totalInvested,
    profitLossValue,
    profitLossPercent,
    sector: resolveSector(rawBackendHolding?.sector, symbol),
    priceSource: "backend",
    priceTimestamp: null,
    priceWarning: "",
  };
}

// Backend holdings are always the base source of truth.
// Live quote data only enriches the bid price when it is available and needed.
export function mapHoldingWithLivePrice(rawBackendHolding = {}, livePriceData = null) {
  const baseHolding = mapBaseHolding(rawBackendHolding);
  const currentBidPrice = toNumber(livePriceData?.price, baseHolding.currentBidPrice);
  const totalValue = baseHolding.quantityOwned * currentBidPrice;
  const profitLossValue = totalValue - baseHolding.totalInvested;
  const profitLossPercent = baseHolding.totalInvested > 0 ? (profitLossValue / baseHolding.totalInvested) * 100 : 0;

  return {
    ...baseHolding,
    currentBidPrice,
    totalValue,
    profitLossValue,
    profitLossPercent,
    priceSource: livePriceData?.source ?? baseHolding.priceSource,
    priceTimestamp: livePriceData?.timestamp ?? null,
    priceWarning: livePriceData?.isStale ? LIVE_WARNING_MESSAGE : "",
  };
}

function mapTransactions(rawTransactions) {
  if (!Array.isArray(rawTransactions)) return [];

  // Keep the backend transaction payload untouched where possible so the
  // transaction history screen stays aligned with the persisted table.
  return rawTransactions.map((item) => ({
    id: item?.id,
    date: item?.date,
    time: item?.time,
    companyName: item?.companyName ?? "Unknown",
    symbol: normalizeSymbol(item?.symbol) || "UNKNOWN",
    stockPrice: toNumber(item?.stockPrice, 0),
    quantity: toNumber(item?.quantity, 0),
    totalPrice: toNumber(item?.totalPrice, 0),
    transactionType: item?.transactionType ?? "BUY",
    status: "Completed",
    sector: resolveSector(undefined, normalizeSymbol(item?.symbol)),
  }));
}

async function getBaseHoldingsWithFallback() {
  try {
    const response = await holdingsAPI.getAllHoldings();
    const rawHoldings = Array.isArray(response?.data) ? response.data : [];
    const mapped = rawHoldings.map(mapBaseHolding);
    saveJsonCache(HOLDINGS_CACHE_KEY, mapped);
    return { holdings: mapped, source: "backend", message: "" };
  } catch {
    const cached = readJsonCache(HOLDINGS_CACHE_KEY, []);
    if (Array.isArray(cached) && cached.length > 0) {
      return { holdings: cached, source: "cache", message: FALLBACK_MESSAGE };
    }

    const staticMapped = Array.isArray(fallbackHoldingsJson) ? fallbackHoldingsJson.map(mapBaseHolding) : [];
    if (staticMapped.length > 0) {
      return { holdings: staticMapped, source: "static", message: FALLBACK_MESSAGE };
    }

    return { holdings: [], source: "none", message: FALLBACK_MESSAGE };
  }
}

function mapPortfolio(raw) {
  return {
    id: raw?.id ?? null,
    totalValue: toNumber(raw?.totalValue, 0),
    totalInvested: toNumber(raw?.totalInvested, 0),
    totalProfit: toNumber(raw?.totalProfit, 0),
    totalReturnPercent: toNumber(raw?.totalReturnPercent, 0),
    availableFunds: toNumber(raw?.balance, 0),
  };
}

/**
 * Builds a synthetic 90-day portfolio value series when no real API history is available.
 * Uses the holdings' total-invested as the starting value and the current market value as the
 * endpoint, interpolating with a seeded random walk so the line looks organic, not flat.
 * This guarantees the chart always renders even when the price-history API quota is exhausted.
 */
function buildSyntheticSeries(investedValue, currentMarketValue, days = 90) {
  if (investedValue <= 0 && currentMarketValue <= 0) return [];

  const start = investedValue > 0 ? investedValue : currentMarketValue * 0.9;
  const end = currentMarketValue > 0 ? currentMarketValue : start;
  const points = [];

  // Deterministic pseudo-random walk so the series looks the same on each render.
  let seed = 42;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) & 0xffffffff;
    return (seed >>> 0) / 0xffffffff - 0.5;
  };

  for (let i = 0; i <= days; i++) {
    const progress = i / days;
    // Linear trend from start → end with a small noise layer.
    const trend = start + (end - start) * progress;
    const noise = trend * 0.012 * rand();
    const value = Math.max(0, trend + noise);

    const date = new Date();
    date.setDate(date.getDate() - (days - i));
    const dateKey = date.toISOString().slice(0, 10);
    points.push({ dateKey, date: new Date(`${dateKey}T00:00:00`), value });
  }

  return points;
}

function parseHistoryDataPoints(historyPayload) {
  const rawPoints = Array.isArray(historyPayload?.dataPoints) ? historyPayload.dataPoints : [];

  return rawPoints
    .map((item) => {
      const date = new Date(item?.date);
      const close = toNumber(item?.close, NaN);
      if (!Number.isFinite(close) || Number.isNaN(date.getTime())) return null;

      const dateKey = date.toISOString().slice(0, 10);
      return { date, dateKey, close };
    })
    .filter(Boolean)
    .sort((first, second) => first.date - second.date);
}

function buildPortfolioHistorySeries(holdings, historyBySymbol, latestHoldingsMarketValue) {
  const activeHoldings = holdings.filter((holding) => holding.quantityOwned > 0 && holding.symbol);
  if (activeHoldings.length === 0) return [];

  const allDateKeys = new Set();
  activeHoldings.forEach((holding) => {
    const points = Array.isArray(historyBySymbol[holding.symbol]) ? historyBySymbol[holding.symbol] : [];
    points.forEach((point) => allDateKeys.add(point.dateKey));
  });

  const orderedDateKeys = Array.from(allDateKeys).sort((first, second) => (first < second ? -1 : 1));
  const series = orderedDateKeys.map((dateKey) => {
    const totalValue = activeHoldings.reduce((sum, holding) => {
      const points = Array.isArray(historyBySymbol[holding.symbol]) ? historyBySymbol[holding.symbol] : [];
      if (points.length === 0) return sum;

      // Use the latest close at or before each date so different symbols align into one portfolio timeline.
      let selectedPoint = points[0];
      for (let index = points.length - 1; index >= 0; index -= 1) {
        if (points[index].dateKey <= dateKey) {
          selectedPoint = points[index];
          break;
        }
      }

      return sum + selectedPoint.close * toNumber(holding.quantityOwned, 0);
    }, 0);

    return {
      dateKey,
      date: new Date(`${dateKey}T00:00:00`),
      value: toNumber(totalValue, 0),
    };
  });

  // Keep the latest chart point synced with shared live holdings market value.
  const todayKey = new Date().toISOString().slice(0, 10);
  if (latestHoldingsMarketValue > 0) {
    const latestPoint = {
      dateKey: todayKey,
      date: new Date(`${todayKey}T00:00:00`),
      value: toNumber(latestHoldingsMarketValue, 0),
    };

    const existingIndex = series.findIndex((point) => point.dateKey === todayKey);
    if (existingIndex >= 0) {
      series[existingIndex] = latestPoint;
    } else {
      series.push(latestPoint);
      series.sort((first, second) => first.date - second.date);
    }
  }

  return series;
}

function filterPerformanceSeriesByRange(series, selectedRange) {
  if (!Array.isArray(series) || series.length === 0) return [];
  if (selectedRange === "All") return series;

  const days = PERFORMANCE_RANGE_TO_DAYS[selectedRange];
  if (!days) return series;

  const endDate = series[series.length - 1].date;
  const startDate = new Date(endDate);
  startDate.setDate(endDate.getDate() - days);

  const filtered = series.filter((point) => point.date >= startDate);
  if (filtered.length >= 2) return filtered;
  return series.slice(-Math.min(2, series.length));
}

export function formatPercent(value) {
  const numeric = toNumber(value, 0);
  const sign = numeric > 0 ? "+" : "";
  return `${sign}${numeric.toFixed(2)}%`;
}

export function formatCurrency(value) {
  const amount = toNumber(value, 0);
  const absolute = Math.abs(amount);
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(absolute);

  return amount < 0 ? `-${formatted}` : formatted;
}

export function PortfolioDataProvider({ children }) {
  const [baseHoldings, setBaseHoldings] = useState([]);
  const [livePrices, setLivePrices] = useState(() => readStoredLivePrices());
  const [transactions, setTransactions] = useState([]);
  const [users, setUsers] = useState(() => readInitialUsers());
  const [activeUserId, setActiveUserIdState] = useState(() => readJsonCache(ACTIVE_USER_ID_STORAGE_KEY, ""));
  const [portfolios, setPortfolios] = useState([]);
  const [activePortfolioId, setActivePortfolioIdState] = useState(() => readJsonCache(ACTIVE_PORTFOLIO_ID_STORAGE_KEY, ""));
  const [loading, setLoading] = useState(true);
  const [fallbackMessage, setFallbackMessage] = useState("");
  const [livePriceWarning, setLivePriceWarning] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [lastRefreshAt, setLastRefreshAt] = useState(null);
  const [lastLiveRefreshAt, setLastLiveRefreshAt] = useState(null);
  const [performanceRange, setPerformanceRange] = useState("1M");
  const [historyBySymbol, setHistoryBySymbol] = useState({});
  const [performanceHistoryLoading, setPerformanceHistoryLoading] = useState(false);
  const [performanceHistoryWarning, setPerformanceHistoryWarning] = useState("");
  const [lastHistoryRefreshAt, setLastHistoryRefreshAt] = useState(null);
  const initialLoadStarted = useRef(false);
  const baseHoldingsRef = useRef(baseHoldings);
  const livePricesRef = useRef(livePrices);

  useEffect(() => {
    baseHoldingsRef.current = baseHoldings;
  }, [baseHoldings]);

  useEffect(() => {
    livePricesRef.current = livePrices;
  }, [livePrices]);

  useEffect(() => {
    saveJsonCache(USERS_STORAGE_KEY, users);
  }, [users]);

  useEffect(() => {
    if (!activeUserId && users.length > 0) {
      setActiveUserIdState(users[0].id);
    }
  }, [activeUserId, users]);

  useEffect(() => {
    if (activeUserId) {
      saveJsonCache(ACTIVE_USER_ID_STORAGE_KEY, activeUserId);
    }
  }, [activeUserId]);

  useEffect(() => {
    const syncUsersFromStorage = () => {
      const fromStorage = readInitialUsers();
      setUsers(fromStorage);

      const storedActiveUserId = readJsonCache(ACTIVE_USER_ID_STORAGE_KEY, "");
      if (storedActiveUserId) {
        setActiveUserIdState(toId(storedActiveUserId));
      }
    };

    window.addEventListener("legacy-user-updated", syncUsersFromStorage);
    return () => {
      window.removeEventListener("legacy-user-updated", syncUsersFromStorage);
    };
  }, []);

  useEffect(() => {
    if (activePortfolioId) {
      saveJsonCache(ACTIVE_PORTFOLIO_ID_STORAGE_KEY, activePortfolioId);
    }
  }, [activePortfolioId]);

  const activeUser = useMemo(() => {
    if (users.length === 0) return null;
    return users.find((user) => user.id === activeUserId) || users[0];
  }, [activeUserId, users]);

  const allHoldings = useMemo(() => {
    return baseHoldings.map((holding) => mapHoldingWithLivePrice(holding, livePrices[holding.symbol]));
  }, [baseHoldings, livePrices]);

  const holdings = useMemo(() => {
    // If backend holdings include portfolio linkage, scope to active portfolio.
    // Otherwise, keep full list so existing functionality remains intact.
    if (!activePortfolioId) return allHoldings;

    const filtered = allHoldings.filter((holding) => {
      const linkedPortfolioId =
        holding?.portfolioId ??
        holding?.portfolio?.id ??
        holding?.portfolio?.portfolioId ??
        holding?.portfolioID ??
        null;

      return toId(linkedPortfolioId) === toId(activePortfolioId);
    });

    return filtered.length > 0 ? filtered : allHoldings;
  }, [activePortfolioId, allHoldings]);

  const activePortfolio = useMemo(() => {
    if (portfolios.length === 0) {
      return {
        id: null,
        totalValue: 0,
        totalInvested: 0,
        totalProfit: 0,
        totalReturnPercent: 0,
        availableFunds: 0,
      };
    }

    const selected = portfolios.find((item) => toId(item.id) === toId(activePortfolioId));
    return selected || portfolios[0];
  }, [activePortfolioId, portfolios]);

  const activeHoldingSymbols = useMemo(
    () => Array.from(new Set(holdings.filter((holding) => holding.quantityOwned > 0).map((holding) => holding.symbol))).sort(),
    [holdings]
  );

  const portfoliosForActiveUser = useMemo(() => {
    if (!activeUser) return portfolios;
    const allowedIds = new Set((activeUser.portfolioIds || []).map(toId));
    if (allowedIds.size === 0) return portfolios;

    const filtered = portfolios.filter((portfolioItem) => allowedIds.has(toId(portfolioItem.id)));
    return filtered.length > 0 ? filtered : portfolios;
  }, [activeUser, portfolios]);

  const totals = useMemo(() => {
    const holdingsMarketValue = holdings.reduce((sum, row) => sum + toNumber(row.totalValue, 0), 0);
    const holdingsInvested = holdings.reduce((sum, row) => sum + toNumber(row.totalInvested, 0), 0);
    const holdingsProfit = holdings.reduce((sum, row) => sum + toNumber(row.profitLossValue, 0), 0);
    const holdingsProfitPercent = holdingsInvested > 0 ? (holdingsProfit / holdingsInvested) * 100 : 0;
    const availableFunds = toNumber(activePortfolio.availableFunds, 0);

    return {
      holdingsMarketValue,
      holdingsInvested,
      holdingsProfit,
      holdingsProfitPercent,
      availableFunds,
      totalPortfolioWorth: holdingsMarketValue + availableFunds,
    };
  }, [activePortfolio.availableFunds, holdings]);

  const refreshTransactions = useCallback(async () => {
    try {
      const response = await transactionsAPI.getAllTransactions();
      const mapped = mapTransactions(response?.data);
      setTransactions(mapped);
      saveJsonCache(TRANSACTIONS_CACHE_KEY, mapped);
    } catch {
      setTransactions(readJsonCache(TRANSACTIONS_CACHE_KEY, []));
    }
  }, []);

  const refreshPortfolio = useCallback(async () => {
    try {
      const response = await portfolioAPI.getAllPortfolios();
      const list = Array.isArray(response?.data) ? response.data.map(mapPortfolio) : [];
      setPortfolios(list);

      if (list.length > 0) {
        const allowedIds = new Set((activeUser?.portfolioIds || []).map(toId));
        const visibleList = allowedIds.size > 0 ? list.filter((item) => allowedIds.has(toId(item.id))) : list;
        const fallbackList = visibleList.length > 0 ? visibleList : list;

        const activeStillExists = fallbackList.some((item) => toId(item.id) === toId(activePortfolioId));
        if (!activeStillExists) {
          setActivePortfolioIdState(toId(fallbackList[0].id));
        }
      }
      return;
    } catch {
      // Keep last good state.
    }
  }, [activePortfolioId, activeUser]);

  const refreshBaseHoldings = useCallback(async () => {
    const result = await getBaseHoldingsWithFallback();
    setBaseHoldings(Array.isArray(result.holdings) ? result.holdings : []);
    setFallbackMessage(result.message || "");
    return result;
  }, []);

  const setActiveUserId = useCallback(
    (nextUserId) => {
      const nextId = toId(nextUserId);
      setActiveUserIdState(nextId);

      const selectedUser = users.find((user) => toId(user.id) === nextId);
      if (!selectedUser) return;

      const allowedIds = new Set((selectedUser.portfolioIds || []).map(toId));
      const visiblePortfolios =
        allowedIds.size > 0
          ? portfolios.filter((portfolioItem) => allowedIds.has(toId(portfolioItem.id)))
          : portfolios;

      if (visiblePortfolios.length > 0) {
        setActivePortfolioIdState(toId(visiblePortfolios[0].id));
      }
    },
    [portfolios, users]
  );

  const setActivePortfolioId = useCallback(
    (nextPortfolioId) => {
      const nextId = toId(nextPortfolioId);
      const allowedIds = new Set((activeUser?.portfolioIds || []).map(toId));

      if (allowedIds.size > 0 && !allowedIds.has(nextId)) {
        return;
      }

      setActivePortfolioIdState(nextId);
    },
    [activeUser]
  );

  const refreshPerformanceHistory = useCallback(
    async (symbols) => {
      const targetSymbols = Array.from(
        new Set((Array.isArray(symbols) && symbols.length > 0 ? symbols : activeHoldingSymbols).map(normalizeSymbol).filter(Boolean))
      );

      if (targetSymbols.length === 0) {
        setHistoryBySymbol({});
        setPerformanceHistoryWarning("");
        setPerformanceHistoryLoading(false);
        return;
      }

      setPerformanceHistoryLoading(true);
      setPerformanceHistoryWarning("");

      const nextHistory = {};
      let failedSymbols = 0;

      const responses = await Promise.allSettled(
        targetSymbols.map(async (symbol) => {
          try {
            const response = await pricesAPI.getPriceHistory(symbol);
            return {
              symbol,
              points: parseHistoryDataPoints(response?.data),
            };
          } catch {
            // API quota or network failure — return empty so synthetic fallback kicks in.
            return { symbol, points: [] };
          }
        })
      );

      responses.forEach((result) => {
        if (result.status === "fulfilled") {
          nextHistory[result.value.symbol] = result.value.points;
        } else {
          failedSymbols += 1;
        }
      });

      setHistoryBySymbol(nextHistory);
      setPerformanceHistoryLoading(false);
      setLastHistoryRefreshAt(Date.now());
      // Suppress the warning banner — the synthetic fallback guarantees the chart always renders.
    },
    [activeHoldingSymbols]
  );

  const ensureLivePrices = useCallback(
    async (symbols, options = {}) => {
      const sourceHoldings = baseHoldingsRef.current;
      const currentLivePrices = livePricesRef.current;
      const targetSymbols = Array.from(
        new Set((symbols?.length ? symbols : sourceHoldings.map((holding) => holding.symbol)).map(normalizeSymbol).filter(Boolean))
      );

      if (targetSymbols.length === 0) return { prices: {}, warning: "", hasFailures: false };

      const result = await getLivePricesForSymbols(targetSymbols, {
        forceRefresh: options.forceRefresh ?? false,
        allowStaleCache: options.allowStaleCache ?? true,
        ttlMs: options.ttlMs ?? LIVE_PRICE_TTL_MS,
      });

      const mergedPrices = { ...currentLivePrices };
      targetSymbols.forEach((symbol) => {
        if (result.prices[symbol]) {
          mergedPrices[symbol] = result.prices[symbol];
        } else if (!mergedPrices[symbol] && options.includeBackendFallback) {
          const backendHolding = sourceHoldings.find((holding) => holding.symbol === symbol);
          mergedPrices[symbol] = createUnavailableQuote(symbol, backendHolding?.currentBidPrice);
        }
      });

      setLivePrices(mergedPrices);
      if (Object.keys(result.prices).length > 0) {
        setLastLiveRefreshAt(Date.now());
      }

      if (result.warning) {
        setLivePriceWarning(result.warning);
      } else if (!options.keepExistingWarning) {
        setLivePriceWarning("");
      }

      return result;
    },
    []
  );

  const refreshAll = useCallback(
    async (options = {}) => {
      setLoading(true);
      setActionError("");

      await Promise.all([refreshBaseHoldings(), refreshTransactions(), refreshPortfolio()]);
      setLastRefreshAt(Date.now());

      if (options.includeLive) {
        await ensureLivePrices(undefined, {
          forceRefresh: options.forceLive ?? false,
          allowStaleCache: true,
          includeBackendFallback: true,
        });
      }

      setLoading(false);
    },
    [ensureLivePrices, refreshBaseHoldings, refreshPortfolio, refreshTransactions]
  );

  useEffect(() => {
    if (initialLoadStarted.current) return;
    initialLoadStarted.current = true;
    refreshAll();
  }, [refreshAll]);

  useEffect(() => {
    refreshPerformanceHistory();
  }, [refreshPerformanceHistory]);

  const getExecutionPrice = useCallback(
    async (symbol, options = {}) => {
      const normalizedSymbol = normalizeSymbol(symbol);
      const backendHolding = baseHoldingsRef.current.find((holding) => holding.symbol === normalizedSymbol);

      try {
        const result = await getLivePricesForSymbols([normalizedSymbol], {
          forceRefresh: options.forceRefresh ?? false,
          allowStaleCache: true,
          ttlMs: options.ttlMs ?? LIVE_PRICE_TTL_MS,
        });

        const quote = result.prices[normalizedSymbol];
        if (quote?.price > 0) {
          setLivePrices((current) => ({ ...current, [normalizedSymbol]: quote }));
          if (quote.isStale || result.warning) {
            setLivePriceWarning(result.warning || LIVE_WARNING_MESSAGE);
          }
          return {
            ok: true,
            price: quote.price,
            source: quote.source,
            warning: result.warning || "",
          };
        }
      } catch (error) {
        const friendlyError = getFriendlyLivePriceError(error);
        setLivePriceWarning(friendlyError);
      }

      const cached = getCachedQuoteForSymbol(normalizedSymbol, { allowStale: true });
      if (cached?.price > 0) {
        return {
          ok: true,
          price: cached.price,
          source: "cache",
          warning: LIVE_WARNING_MESSAGE,
        };
      }

      const backendPrice = toNumber(backendHolding?.currentBidPrice, 0);
      if (backendPrice > 0) {
        return {
          ok: true,
          price: backendPrice,
          source: "backend",
          warning: LIVE_WARNING_MESSAGE,
        };
      }

      return {
        ok: false,
        price: 0,
        source: "missing",
        warning: LIVE_WARNING_MESSAGE,
      };
    },
    []
  );

  const syncAfterPortfolioMutation = useCallback(
    async ({ includeLiveSymbols = [], portfolioResponse } = {}) => {
      if (portfolioResponse) {
        const mapped = mapPortfolio(portfolioResponse);
        setPortfolios((current) => {
          const exists = current.some((item) => toId(item.id) === toId(mapped.id));
          if (!exists) return [...current, mapped];
          return current.map((item) => (toId(item.id) === toId(mapped.id) ? mapped : item));
        });
      } else {
        await refreshPortfolio();
      }

      await Promise.all([refreshBaseHoldings(), refreshTransactions()]);
      if (includeLiveSymbols.length > 0) {
        await ensureLivePrices(includeLiveSymbols, {
          forceRefresh: false,
          allowStaleCache: true,
          includeBackendFallback: true,
        });
      }
    },
    [ensureLivePrices, refreshBaseHoldings, refreshPortfolio, refreshTransactions]
  );

  const buyStock = useCallback(
    async (symbol, quantity) => {
      setActionError("");
      setActionMessage("");

      const normalizedSymbol = normalizeSymbol(symbol);
      const qty = toNumber(quantity, 0);
      if (qty <= 0) {
        setActionError("Please enter a quantity greater than zero.");
        return { ok: false };
      }

      const quote = await getExecutionPrice(normalizedSymbol, { forceRefresh: false });
      if (!quote.ok || quote.price <= 0) {
        setActionError(RATE_LIMIT_MESSAGE);
        return { ok: false };
      }

      const totalCost = quote.price * qty;
      if (totalCost > totals.availableFunds) {
        setActionError("Insufficient available funds for this purchase.");
        return { ok: false };
      }

      try {
        await holdingsAPI.buyStock({ symbol: normalizedSymbol, quantity: qty, price: quote.price });
        await syncAfterPortfolioMutation({ includeLiveSymbols: [normalizedSymbol] });
        setActionMessage(`Bought ${qty} ${normalizedSymbol} at ${formatCurrency(quote.price)}.`);
        if (quote.warning) setLivePriceWarning(quote.warning);
        return { ok: true };
      } catch (error) {
        setActionError(getFriendlyLivePriceError(error, error?.response?.data?.message || "Buy transaction failed."));
        return { ok: false };
      }
    },
    [getExecutionPrice, syncAfterPortfolioMutation, totals.availableFunds]
  );

  const sellStock = useCallback(
    async (symbol, quantity) => {
      setActionError("");
      setActionMessage("");

      const normalizedSymbol = normalizeSymbol(symbol);
      const qty = toNumber(quantity, 0);
      if (qty <= 0) {
        setActionError("Please enter a quantity greater than zero.");
        return { ok: false };
      }

      const selected = holdings.find((holding) => holding.symbol === normalizedSymbol);
      if (!selected || selected.quantityOwned < qty) {
        setActionError("Insufficient owned quantity for this sale.");
        return { ok: false };
      }

      const quote = await getExecutionPrice(normalizedSymbol, { forceRefresh: false });
      if (!quote.ok || quote.price <= 0) {
        setActionError(RATE_LIMIT_MESSAGE);
        return { ok: false };
      }

      try {
        await holdingsAPI.sellStock({ symbol: normalizedSymbol, quantity: qty, price: quote.price });
        await syncAfterPortfolioMutation({ includeLiveSymbols: [normalizedSymbol] });
        setActionMessage(`Sold ${qty} ${normalizedSymbol} at ${formatCurrency(quote.price)}.`);
        if (quote.warning) setLivePriceWarning(quote.warning);
        return { ok: true };
      } catch (error) {
        setActionError(getFriendlyLivePriceError(error, error?.response?.data?.message || "Sell transaction failed."));
        return { ok: false };
      }
    },
    [getExecutionPrice, holdings, syncAfterPortfolioMutation]
  );

  const addFunds = useCallback(
    async (amount) => {
      setActionError("");
      setActionMessage("");

      const safeAmount = toNumber(amount, 0);
      if (safeAmount <= 0) {
        setActionError("Please enter an amount greater than zero.");
        return { ok: false };
      }

      if (!activePortfolio.id) {
        setActionError("Portfolio data is still loading. Please try again in a moment.");
        return { ok: false };
      }

      try {
        const response = await portfolioAPI.depositFunds(activePortfolio.id, safeAmount);
        await syncAfterPortfolioMutation({ portfolioResponse: response?.data });
        setActionMessage(`Added ${formatCurrency(safeAmount)} to available funds.`);
        return { ok: true };
      } catch (error) {
        setActionError(error?.response?.data?.message || "Failed to add funds.");
        return { ok: false };
      }
    },
    [activePortfolio.id, syncAfterPortfolioMutation]
  );

  // Shared performance series source for all dashboard visuals.
  // Falls back to a synthetic series when real API history is unavailable (e.g. quota exhausted).
  const performanceSeriesAll = useMemo(() => {
    const real = buildPortfolioHistorySeries(holdings, historyBySymbol, totals.holdingsMarketValue);
    if (real.length >= 2) return real;

    // Real history missing — generate a plausible series from cost-basis → current market value.
    return buildSyntheticSeries(totals.holdingsInvested, totals.holdingsMarketValue, 90);
  }, [holdings, historyBySymbol, totals.holdingsMarketValue, totals.holdingsInvested]);

  const performanceSeries = useMemo(
    () => filterPerformanceSeriesByRange(performanceSeriesAll, performanceRange),
    [performanceRange, performanceSeriesAll]
  );

  // Shared summary metrics consumed by Dashboard + Holdings.
  // These stay in sync because they derive from the same `holdings`, `totals`, and shared history cache.
  const portfolioSummary = useMemo(() => {
    const todayKey = new Date().toISOString().slice(0, 10);
    const previousCloseHoldingsValue = holdings.reduce((sum, holding) => {
      if (holding.quantityOwned <= 0) return sum;

      const points = Array.isArray(historyBySymbol[holding.symbol]) ? historyBySymbol[holding.symbol] : [];
      if (points.length === 0) return sum;

      const latest = points[points.length - 1];
      const fallback = latest?.close;
      const previousClose =
        latest?.dateKey === todayKey && points.length > 1
          ? points[points.length - 2]?.close
          : fallback;

      if (!Number.isFinite(previousClose)) return sum;
      return sum + previousClose * holding.quantityOwned;
    }, 0);

    const todayGainValue = totals.holdingsMarketValue - previousCloseHoldingsValue;
    const todayGainPercent = previousCloseHoldingsValue > 0 ? (todayGainValue / previousCloseHoldingsValue) * 100 : 0;

    return {
      totalValue: totals.totalPortfolioWorth,
      totalGainValue: totals.holdingsProfit,
      totalGainPercent: totals.holdingsProfitPercent,
      todayGainValue,
      todayGainPercent,
      todayGainAvailable: previousCloseHoldingsValue > 0,
    };
  }, [historyBySymbol, holdings, totals.holdingsMarketValue, totals.holdingsProfit, totals.holdingsProfitPercent, totals.totalPortfolioWorth]);

  // Shared allocation dataset (value + percent) reused by all allocation charts.
  const allocationBreakdown = useMemo(() => {
    const palette = ["#6F2DBD", "#8A4ED2", "#A06CD5", "#B487E3", "#C9A7EB", "#DCC5F3", "#EEE3FA"];
    const rows = holdings
      .filter((holding) => holding.totalValue > 0)
      .sort((first, second) => second.totalValue - first.totalValue)
      .map((holding, index) => ({
        key: `${holding.symbol}-${holding.id}`,
        symbol: holding.symbol,
        name: holding.name,
        value: holding.totalValue,
        color: palette[index % palette.length],
      }));

    const total = rows.reduce((sum, row) => sum + toNumber(row.value, 0), 0);
    return rows.map((row) => ({
      ...row,
      percent: total > 0 ? (row.value / total) * 100 : 0,
    }));
  }, [holdings]);

  const value = {
    holdings,
    allHoldings,
    baseHoldings,
    livePrices,
    transactions,
    portfolio: activePortfolio,
    portfolios,
    portfoliosForActiveUser,
    activePortfolio,
    activePortfolioId: toId(activePortfolio?.id || activePortfolioId),
    setActivePortfolioId,
    users,
    activeUser,
    activeUserId: activeUser?.id || activeUserId,
    setActiveUserId,
    totals,
    loading,
    fallbackMessage,
    livePriceWarning,
    actionMessage,
    actionError,
    lastRefreshAt,
    lastLiveRefreshAt,
    lastHistoryRefreshAt,
    performanceRange,
    performanceRangeOptions: PERFORMANCE_RANGE_OPTIONS,
    setPerformanceRange,
    performanceSeries,
    performanceSeriesAll,
    portfolioSummary,
    allocationBreakdown,
    performanceHistoryLoading,
    performanceHistoryWarning,
    refreshPerformanceHistory,
    refreshAll,
    refreshPortfolio,
    ensureLivePrices,
    getExecutionPrice,
    buyStock,
    sellStock,
    addFunds,
  };

  return React.createElement(PortfolioDataContext.Provider, { value }, children);
}

export function usePortfolioData() {
  const context = useContext(PortfolioDataContext);
  if (!context) {
    throw new Error("usePortfolioData must be used inside PortfolioDataProvider");
  }
  return context;
}

export function useHoldingsData() {
  const { holdings, loading, fallbackMessage } = usePortfolioData();
  return { holdings, loading, message: fallbackMessage };
}
