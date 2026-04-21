import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import fallbackHoldingsJson from "../data/holdingsFallback.json";
import {
  holdingsAPI,
  portfolioAPI,
  pricesAPI,
  stocksAPI,
  transactionsAPI,
} from "./api";

const CACHE_VERSION = "v5";
const CACHE_VERSION_KEY = "legacy.cacheVersion";

const HOLDINGS_CACHE_KEY = "legacy.holdings.base";
const STOCKS_CACHE_KEY = "legacy.stocks.base";
const TRANSACTIONS_CACHE_KEY = "legacy.transactions.base";
const PORTFOLIOS_CACHE_KEY = "legacy.portfolios.base";
const LIVE_PRICES_CACHE_KEY = "legacy.livePrices";
const USERS_STORAGE_KEY = "legacy.users";
const ACTIVE_USER_ID_STORAGE_KEY = "legacy.activeUserId";
const ACTIVE_PORTFOLIO_ID_STORAGE_KEY = "legacy.activePortfolioId";

const LOCAL_PORTFOLIO_ID = "local-portfolio";
const LIVE_PRICE_TTL_MS = 45_000;

const FALLBACK_MESSAGE =
  "Live data is temporarily unavailable. Showing saved holdings data.";
const LIVE_WARNING_MESSAGE =
  "Live pricing is temporarily unavailable right now. Using saved or cached values.";
const RATE_LIMIT_MESSAGE =
  "Live pricing is temporarily unavailable right now. Please wait a moment and try again.";

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

/**
 * HARD FALLBACK
 * This is the exact backend config seed table you gave me.
 * If backend fetch fails and JSON fallback is bad, this still renders.
 */
const HARD_FALLBACK_HOLDINGS = [
  createDemoHolding("Apple Inc.", "AAPL", 18, "150.00", "142.00"),
  createDemoHolding("Microsoft Corporation", "MSFT", 12, "300.00", "286.00"),
];

const HARD_FALLBACK_REFERENCE_STOCKS = [
  createReferenceStock("Apple Inc.", "AAPL", "150.00", "151.00", "5.50"),
  createReferenceStock("Microsoft Corporation", "MSFT", "300.00", "301.00", "3.20"),
  createReferenceStock("Amazon.com Inc.", "AMZN", "100.00", "101.00", "-2.10"),
  createReferenceStock("Alphabet Inc.", "GOOGL", "200.00", "202.00", "1.00"),
  createReferenceStock("Tesla Inc.", "TSLA", "400.00", "410.00", "4.00"),
  createReferenceStock("Meta Platforms Inc.", "META", "250.00", "255.00", "2.00"),
  createReferenceStock("NVIDIA Corporation", "NVDA", "350.00", "360.00", "3.00"),
  createReferenceStock("JPMorgan Chase & Co.", "JPM", "120.00", "122.00", "1.50"),
  createReferenceStock("Johnson & Johnson", "JNJ", "160.00", "161.00", "0.50"),
  createReferenceStock("Visa Inc.", "V", "220.00", "225.00", "2.30"),
];

const HARD_FALLBACK_PORTFOLIOS = [
  createFallbackPortfolio(HARD_FALLBACK_HOLDINGS, 12_500),
];

function createDemoHolding(name, symbol, quantityOwned, averageBuyPrice, currentBidPrice) {
  const quantity = toNumber(quantityOwned, 0);
  const avg = toNumber(averageBuyPrice, 0);
  const bid = toNumber(currentBidPrice, 0);
  const totalInvested = quantity * avg;
  const totalValue = quantity * bid;
  const profitLossValue = totalValue - totalInvested;
  const profitLossPercent = totalInvested > 0 ? (profitLossValue / totalInvested) * 100 : 0;

  return {
    id: `fallback-${symbol}`,
    companyName: name,
    name,
    symbol,
    quantityOwned: quantity,
    averageBuyPrice: avg,
    bidPrice: bid,
    currentBidPrice: bid,
    totalInvested,
    totalValue,
    profitLossValue,
    profitLossPercent,
    sector: resolveSector("", symbol),
    portfolioId: null,
    priceSource: "fallback",
    priceTimestamp: null,
  };
}

function createReferenceStock(name, symbol, bidPrice, askPrice, profitLossPercent) {
  const normalizedSymbol = normalizeSymbol(symbol);

  return {
    id: `reference-${normalizedSymbol}`,
    companyName: name,
    name,
    symbol: normalizedSymbol,
    sector: resolveSector("", normalizedSymbol),
    bidPrice: toNumber(bidPrice, 0),
    askPrice: toNumber(askPrice, 0),
    profitLossPercent: toNumber(profitLossPercent, 0),
    quantityOwned: 0,
  };
}

function createFallbackPortfolio(holdings, availableFunds) {
  const totals = (Array.isArray(holdings) ? holdings : []).reduce(
    (sum, holding) => ({
      totalValue: sum.totalValue + toNumber(holding?.totalValue, 0),
      totalInvested: sum.totalInvested + toNumber(holding?.totalInvested, 0),
    }),
    { totalValue: 0, totalInvested: 0 }
  );

  const totalProfit = totals.totalValue - totals.totalInvested;
  const totalReturnPercent =
    totals.totalInvested > 0 ? (totalProfit / totals.totalInvested) * 100 : 0;

  return {
    id: 1,
    totalValue: totals.totalValue,
    totalInvested: totals.totalInvested,
    totalProfit,
    totalReturnPercent,
    availableFunds: toNumber(availableFunds, 0),
  };
}

function migrateCache() {
  if (typeof window === "undefined") return;

  try {
    const storedVersion = window.localStorage.getItem(CACHE_VERSION_KEY);
    if (storedVersion === CACHE_VERSION) return;

    const keysToRemove = [];
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i);
      if (key && key.startsWith("legacy.")) keysToRemove.push(key);
    }

    keysToRemove.forEach((key) => window.localStorage.removeItem(key));
    window.localStorage.setItem(CACHE_VERSION_KEY, CACHE_VERSION);
  } catch {
    // ignore
  }
}

migrateCache();

function toNumber(value, defaultValue = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : defaultValue;
}

function toPositiveInteger(value) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 0;
}

function toId(value) {
  if (value === null || value === undefined) return "";
  return String(value);
}

function normalizeSymbol(value) {
  return String(value ?? "").trim().toUpperCase();
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
    // ignore
  }
}

function resolveSector(rawSector, symbol) {
  if (rawSector && String(rawSector).trim()) return String(rawSector).trim();

  const tech = ["AAPL", "MSFT", "AMZN", "GOOGL", "TSLA", "META", "NVDA"];
  const financials = ["JPM", "V"];
  const healthcare = ["JNJ"];

  if (tech.includes(symbol)) return "Technology";
  if (financials.includes(symbol)) return "Financials";
  if (healthcare.includes(symbol)) return "Healthcare";
  return "Other";
}

function getPortfolioId(rawHolding = {}) {
  const candidate =
    rawHolding?.portfolioId ??
    rawHolding?.portfolio?.id ??
    rawHolding?.portfolio?.portfolioId ??
    rawHolding?.portfolioID ??
    rawHolding?.portfolio_id ??
    null;

  const normalized = toId(candidate);
  return normalized || null;
}

function getBackendBidPrice(raw = {}) {
  return toNumber(raw?.bidPrice ?? raw?.currentBidPrice ?? raw?.price, 0);
}

function getBackendTotalValue(raw = {}) {
  return toNumber(raw?.totalValue ?? raw?.marketValue ?? raw?.positionValue, NaN);
}

function getBackendTotalInvested(raw = {}) {
  return toNumber(raw?.totalInvested ?? raw?.investedAmount ?? raw?.costBasis, NaN);
}

function getBackendProfitLossValue(raw = {}) {
  return toNumber(raw?.profitLossValue ?? raw?.profitLoss ?? raw?.gainLoss, NaN);
}

function getBackendProfitLossPercent(raw = {}) {
  return toNumber(
    raw?.profitLossPercent ?? raw?.profitPercentageChange ?? raw?.gainLossPercent,
    NaN
  );
}

function getAverageBuyPrice(raw = {}, quantityOwned = 0, fallbackPrice = 0) {
  const explicitAverage = toNumber(
    raw?.averageBuyPrice ?? raw?.avgBuyPrice ?? raw?.averagePrice ?? raw?.costBasisPrice,
    NaN
  );

  if (Number.isFinite(explicitAverage) && explicitAverage > 0) {
    return explicitAverage;
  }

  const invested = getBackendTotalInvested(raw);
  if (Number.isFinite(invested) && quantityOwned > 0) {
    return invested / quantityOwned;
  }

  return Math.max(0, toNumber(fallbackPrice, 0));
}

function buildLivePriceEntry(symbol, payload, source, isStale = false) {
  return {
    symbol,
    price: toNumber(payload?.price ?? payload?.bidPrice, 0),
    timestamp: payload?.timestamp ?? Date.now(),
    source,
    isStale,
  };
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

function getCachedQuoteForSymbol(symbol, options = {}) {
  const entry = readLivePriceCacheEntry(symbol);
  if (!entry) return null;

  if (options.allowStale) {
    return {
      ...entry,
      isStale: !isFreshCacheEntry(entry, options.ttlMs ?? LIVE_PRICE_TTL_MS),
      source: entry.source || "cache",
    };
  }

  if (!isFreshCacheEntry(entry, options.ttlMs ?? LIVE_PRICE_TTL_MS)) return null;

  return {
    ...entry,
    isStale: false,
    source: entry.source || "cache",
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

function getApiErrorMessage(error, fallbackMessage) {
  const status = error?.response?.status;
  const backendMessage = String(
    error?.response?.data?.message ?? error?.response?.data?.error ?? ""
  ).trim();

  if (backendMessage) return backendMessage;
  if (status === 429) return RATE_LIMIT_MESSAGE;
  if (status === 404) return "The selected stock or portfolio could not be found.";
  if (status === 409) return fallbackMessage;
  if (status >= 500) {
    return "We could not complete the transaction right now. Please try again.";
  }

  return fallbackMessage;
}

function toBackendPortfolioId(value) {
  const numericValue = Number(value);
  return Number.isInteger(numericValue) && numericValue > 0 ? numericValue : null;
}

function normalizeHolding(rawHolding = {}, livePriceData = null) {
  const symbol = normalizeSymbol(rawHolding?.symbol ?? rawHolding?.ticker);
  const name =
    rawHolding?.companyName ??
    rawHolding?.name ??
    rawHolding?.company ??
    symbol ??
    "Unknown Company";

  const quantityOwned = Math.max(
    0,
    toNumber(rawHolding?.quantityOwned ?? rawHolding?.amountOwned ?? rawHolding?.quantity, 0)
  );

  const storedPrice = Math.max(0, getBackendBidPrice(rawHolding));
  const currentBidPrice = Math.max(0, toNumber(livePriceData?.price, storedPrice));
  const averageBuyPrice = Math.max(0, getAverageBuyPrice(rawHolding, quantityOwned, storedPrice));

  const backendTotalInvested = getBackendTotalInvested(rawHolding);
  const backendTotalValue = getBackendTotalValue(rawHolding);
  const backendProfitLossValue = getBackendProfitLossValue(rawHolding);
  const backendProfitLossPercent = getBackendProfitLossPercent(rawHolding);

  const totalInvested = Number.isFinite(backendTotalInvested)
    ? Math.max(0, backendTotalInvested)
    : quantityOwned * averageBuyPrice;

  const totalValue = livePriceData
    ? quantityOwned * currentBidPrice
    : Number.isFinite(backendTotalValue)
      ? Math.max(0, backendTotalValue)
      : quantityOwned * currentBidPrice;

  const profitLossValue = livePriceData
    ? totalValue - totalInvested
    : Number.isFinite(backendProfitLossValue)
      ? backendProfitLossValue
      : totalValue - totalInvested;

  const profitLossPercent = livePriceData
    ? totalInvested > 0
      ? (profitLossValue / totalInvested) * 100
      : 0
    : Number.isFinite(backendProfitLossPercent)
      ? backendProfitLossPercent
      : totalInvested > 0
        ? (profitLossValue / totalInvested) * 100
        : 0;

  return {
    id: rawHolding?.id ?? `${symbol}-${name}`,
    name,
    companyName: name,
    symbol,
    portfolioId: getPortfolioId(rawHolding),
    quantityOwned,
    averageBuyPrice,
    currentBidPrice,
    bidPrice: currentBidPrice,
    totalValue,
    totalInvested,
    profitLossValue,
    profitLossPercent,
    sector: resolveSector(rawHolding?.sector, symbol),
    priceSource: livePriceData?.source ?? rawHolding?.priceSource ?? "backend",
    priceTimestamp: livePriceData?.timestamp ?? rawHolding?.priceTimestamp ?? null,
    priceWarning: livePriceData?.isStale ? LIVE_WARNING_MESSAGE : rawHolding?.priceWarning ?? "",
  };
}

export function mapHoldingWithLivePrice(rawHolding = {}, livePriceData = null) {
  return normalizeHolding(rawHolding, livePriceData);
}

function mapReferenceStock(rawStock = {}) {
  const symbol = normalizeSymbol(rawStock?.symbol ?? rawStock?.ticker);
  const bidPrice = Math.max(0, toNumber(rawStock?.bidPrice ?? rawStock?.currentBidPrice ?? rawStock?.price, 0));
  const askPrice = Math.max(0, toNumber(rawStock?.askPrice, bidPrice));
  const performance = toNumber(rawStock?.performance ?? rawStock?.profitLossPercent, 0);

  return {
    id: rawStock?.id ?? symbol,
    symbol,
    name: rawStock?.companyName ?? rawStock?.name ?? rawStock?.company ?? symbol,
    sector: resolveSector(rawStock?.sector, symbol),
    bidPrice,
    askPrice,
    profitLossPercent: performance,
    quantityOwned: Math.max(0, toNumber(rawStock?.quantityOwned, 0)),
  };
}

function mapTransactions(rawTransactions) {
  if (!Array.isArray(rawTransactions)) return [];

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

function mapPortfolio(raw) {
  return {
    id: raw?.id ?? null,
    totalValue: toNumber(raw?.totalValue, 0),
    totalInvested: toNumber(raw?.totalInvested, 0),
    totalProfit: toNumber(raw?.totalProfit, 0),
    totalReturnPercent: toNumber(raw?.totalReturnPercent, 0),
    availableFunds: toNumber(raw?.balance ?? raw?.availableFunds, 0),
  };
}

function readCachedPortfolios() {
  const cached = readJsonCache(PORTFOLIOS_CACHE_KEY, []);
  if (Array.isArray(cached) && cached.length > 0) {
    return cached.map(mapPortfolio);
  }

  return HARD_FALLBACK_PORTFOLIOS.map(mapPortfolio);
}

function createUserFromCurrentLocalStorage() {
  const currentUser = readJsonCache("currentUser", null);
  const name = String(currentUser?.name || currentUser?.fullName || "").trim();
  const email = String(currentUser?.email || "").trim();

  if (!name && !email) return null;

  const safeName = name || "Steve";
  const idSeed = email || safeName.toLowerCase().replace(/\s+/g, "-");

  return {
    id: `user-${idSeed}`,
    name: safeName,
    email,
    portfolioIds: [],
  };
}

function readInitialUsers() {
  const stored = readJsonCache(USERS_STORAGE_KEY, []);
  const cleaned = Array.isArray(stored)
    ? stored
        .map((item, index) => ({
          id: toId(item?.id || `user-${index + 1}`),
          name: String(item?.name || "").trim() || `Steve ${index + 1}`,
          email: String(item?.email || "").trim(),
          portfolioIds: Array.isArray(item?.portfolioIds)
            ? item.portfolioIds.map(toId).filter(Boolean)
            : [],
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
      name: "Steve",
      email: "",
      portfolioIds: [],
    },
  ];
}

function buildSyntheticSeries(investedValue, currentMarketValue, days = 90) {
  if (investedValue <= 0 && currentMarketValue <= 0) return [];

  const start = investedValue > 0 ? investedValue : currentMarketValue * 0.9;
  const end = currentMarketValue > 0 ? currentMarketValue : start;
  const points = [];

  let seed = 42;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) & 0xffffffff;
    return (seed >>> 0) / 0xffffffff - 0.5;
  };

  for (let i = 0; i <= days; i += 1) {
    const progress = i / days;
    const trend = start + (end - start) * progress;
    const noise = trend * 0.012 * rand();
    const value = Math.max(0, trend + noise);

    const date = new Date();
    date.setDate(date.getDate() - (days - i));
    const dateKey = date.toISOString().slice(0, 10);
    points.push({
      dateKey,
      date: new Date(`${dateKey}T00:00:00`),
      value,
    });
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

      return {
        date,
        dateKey: date.toISOString().slice(0, 10),
        close,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.date - b.date);
}

function buildPortfolioHistorySeries(holdings, historyBySymbol, latestHoldingsMarketValue) {
  const activeHoldings = holdings.filter((holding) => holding.quantityOwned > 0 && holding.symbol);
  if (activeHoldings.length === 0) return [];

  const allDateKeys = new Set();

  activeHoldings.forEach((holding) => {
    const points = Array.isArray(historyBySymbol[holding.symbol]) ? historyBySymbol[holding.symbol] : [];
    points.forEach((point) => allDateKeys.add(point.dateKey));
  });

  const orderedDateKeys = Array.from(allDateKeys).sort((a, b) => (a < b ? -1 : 1));

  const series = orderedDateKeys.map((dateKey) => {
    const totalValue = activeHoldings.reduce((sum, holding) => {
      const points = Array.isArray(historyBySymbol[holding.symbol]) ? historyBySymbol[holding.symbol] : [];
      if (points.length === 0) return sum;

      let selectedPoint = points[0];
      for (let i = points.length - 1; i >= 0; i -= 1) {
        if (points[i].dateKey <= dateKey) {
          selectedPoint = points[i];
          break;
        }
      }

      return sum + selectedPoint.close * toNumber(holding.quantityOwned, 0);
    }, 0);

    return {
      dateKey,
      date: new Date(`${dateKey}T00:00:00`),
      value: totalValue,
    };
  });

  const todayKey = new Date().toISOString().slice(0, 10);

  if (latestHoldingsMarketValue > 0) {
    const latestPoint = {
      dateKey: todayKey,
      date: new Date(`${todayKey}T00:00:00`),
      value: latestHoldingsMarketValue,
    };

    const existingIndex = series.findIndex((point) => point.dateKey === todayKey);
    if (existingIndex >= 0) {
      series[existingIndex] = latestPoint;
    } else {
      series.push(latestPoint);
      series.sort((a, b) => a.date - b.date);
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
  return filtered.length >= 2 ? filtered : series.slice(-Math.min(2, series.length));
}

function getPreviousClosePrice(holding, historyBySymbol, todayKey) {
  const points = Array.isArray(historyBySymbol[holding.symbol]) ? historyBySymbol[holding.symbol] : [];
  if (points.length === 0) return null;

  const latest = points[points.length - 1];
  const previousClose =
    latest?.dateKey === todayKey && points.length > 1
      ? points[points.length - 2]?.close
      : latest?.close;

  const numeric = toNumber(previousClose, NaN);
  return Number.isFinite(numeric) ? numeric : null;
}

function buildPortfolioComputedData({ holdings = [], availableCash = 0, historyBySymbol = {} }) {
  const holdingsMarketValue = holdings.reduce((sum, row) => sum + toNumber(row.totalValue, 0), 0);
  const holdingsInvested = holdings.reduce((sum, row) => sum + toNumber(row.totalInvested, 0), 0);
  const holdingsProfit = holdingsMarketValue - holdingsInvested;
  const holdingsProfitPercent = holdingsInvested > 0 ? (holdingsProfit / holdingsInvested) * 100 : 0;
  const safeAvailableCash = Math.max(0, toNumber(availableCash, 0));
  const totalPortfolioWorth = holdingsMarketValue + safeAvailableCash;

  const todayKey = new Date().toISOString().slice(0, 10);
  const activeHoldings = holdings.filter((holding) => holding.quantityOwned > 0 && holding.symbol);
  const hasCompletePreviousCloseData =
    activeHoldings.length > 0 &&
    activeHoldings.every((holding) =>
      Number.isFinite(getPreviousClosePrice(holding, historyBySymbol, todayKey))
    );

  let todayGainValue = 0;
  let todayGainPercent = 0;

  if (hasCompletePreviousCloseData) {
    const previousClosePortfolioValue = activeHoldings.reduce((sum, holding) => {
      const previousClose = getPreviousClosePrice(holding, historyBySymbol, todayKey);
      return sum + toNumber(previousClose, 0) * toNumber(holding.quantityOwned, 0);
    }, 0);

    todayGainValue = activeHoldings.reduce((sum, holding) => {
      const previousClose = getPreviousClosePrice(holding, historyBySymbol, todayKey);
      return (
        sum +
        (toNumber(holding.currentBidPrice, 0) - toNumber(previousClose, 0)) *
          toNumber(holding.quantityOwned, 0)
      );
    }, 0);

    todayGainPercent =
      previousClosePortfolioValue > 0
        ? (todayGainValue / previousClosePortfolioValue) * 100
        : 0;
  }

  const allocationBreakdown = holdings
    .filter((holding) => holding.totalValue > 0)
    .sort((a, b) => b.totalValue - a.totalValue)
    .map((holding) => ({
      key: `${holding.symbol}-${holding.id}`,
      symbol: holding.symbol,
      name: holding.name,
      quantity: holding.quantityOwned,
      value: toNumber(holding.totalValue, 0),
      percent: holdingsMarketValue > 0 ? (toNumber(holding.totalValue, 0) / holdingsMarketValue) * 100 : 0,
    }));

  return {
    totals: {
      holdingsMarketValue,
      holdingsInvested,
      holdingsProfit,
      holdingsProfitPercent,
      availableFunds: safeAvailableCash,
      totalPortfolioWorth,
    },
    portfolioSummary: {
      totalValue: totalPortfolioWorth,
      totalGainValue: holdingsProfit,
      totalGainPercent: holdingsProfitPercent,
      todayGainValue: hasCompletePreviousCloseData ? todayGainValue : 0,
      todayGainPercent: hasCompletePreviousCloseData ? todayGainPercent : 0,
      todayGainAvailable: hasCompletePreviousCloseData,
    },
    allocationBreakdown,
  };
}

async function requestLivePrice(symbol, options = {}) {
  const normalizedSymbol = normalizeSymbol(symbol);
  if (!normalizedSymbol) return null;

  const freshCached = getCachedQuoteForSymbol(normalizedSymbol, {
    allowStale: false,
    ttlMs: options.ttlMs ?? LIVE_PRICE_TTL_MS,
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
        {
          price: response?.data?.price,
          timestamp: Date.now(),
        },
        "live"
      );

      livePriceMemoryCache.set(normalizedSymbol, entry);
      writeStoredLivePrice(normalizedSymbol, entry);
      return entry;
    })
    .catch((error) => {
      const staleEntry = getCachedQuoteForSymbol(normalizedSymbol, {
        allowStale: true,
        ttlMs: options.ttlMs ?? LIVE_PRICE_TTL_MS,
      });

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

async function getBaseHoldingsWithFallback() {
  try {
    const response = await holdingsAPI.getAllHoldings();
    const rawHoldings = Array.isArray(response?.data) ? response.data : [];
    const mapped = rawHoldings.map((item) => normalizeHolding(item, null));

    if (mapped.length > 0) {
      saveJsonCache(HOLDINGS_CACHE_KEY, rawHoldings);
      return { holdings: mapped, source: "backend", message: "" };
    }
  } catch {
    // continue into fallbacks
  }

  const cached = readJsonCache(HOLDINGS_CACHE_KEY, []);
  if (Array.isArray(cached) && cached.length > 0) {
    return {
      holdings: cached.map((item) => normalizeHolding(item, null)),
      source: "cache",
      message: FALLBACK_MESSAGE,
    };
  }

  if (Array.isArray(fallbackHoldingsJson) && fallbackHoldingsJson.length > 0) {
    return {
      holdings: fallbackHoldingsJson.map((item) => normalizeHolding(item, null)),
      source: "json-fallback",
      message: FALLBACK_MESSAGE,
    };
  }

  return {
    holdings: HARD_FALLBACK_HOLDINGS.map((item) => normalizeHolding(item, null)),
    source: "hard-fallback",
    message: FALLBACK_MESSAGE,
  };
}

async function getReferenceStocksWithFallback() {
  try {
    const response = await stocksAPI.getAllStocks();
    const mapped = Array.isArray(response?.data)
      ? response.data.map(mapReferenceStock).filter((stock) => stock.symbol)
      : [];

    if (mapped.length > 0) {
      saveJsonCache(STOCKS_CACHE_KEY, mapped);
      return mapped;
    }
  } catch {
    // ignore
  }

  const cached = readJsonCache(STOCKS_CACHE_KEY, []);
  if (Array.isArray(cached) && cached.length > 0) {
    return cached.map(mapReferenceStock).filter((stock) => stock.symbol);
  }

  return HARD_FALLBACK_REFERENCE_STOCKS.map((stock) => mapReferenceStock(stock));
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
  const [referenceStocks, setReferenceStocks] = useState([]);
  const [livePrices, setLivePrices] = useState(() => {
    const stored = readStoredLivePrices();
    return Object.fromEntries(
      Object.entries(stored).filter(([, entry]) => isFreshCacheEntry(entry))
    );
  });

  const [transactions, setTransactions] = useState([]);
  const [users, setUsers] = useState(() => readInitialUsers());
  const [activeUserId, setActiveUserIdState] = useState(() =>
    readJsonCache(ACTIVE_USER_ID_STORAGE_KEY, "")
  );

  const [portfolios, setPortfolios] = useState(() => readCachedPortfolios());
  const [activePortfolioId, setActivePortfolioIdState] = useState(() =>
    readJsonCache(ACTIVE_PORTFOLIO_ID_STORAGE_KEY, "")
  );

  const [loading, setLoading] = useState(true);
  const [fallbackMessage, setFallbackMessage] = useState("");
  const [livePriceWarning, setLivePriceWarning] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [tradeMessage, setTradeMessage] = useState("");
  const [tradeError, setTradeError] = useState("");
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
    if (activePortfolioId && portfolios.length > 0) {
      saveJsonCache(ACTIVE_PORTFOLIO_ID_STORAGE_KEY, activePortfolioId);
    }
  }, [activePortfolioId, portfolios.length]);

  const activeUser = useMemo(() => {
    if (users.length === 0) return null;
    return users.find((user) => user.id === activeUserId) || users[0];
  }, [activeUserId, users]);

  const allHoldings = useMemo(() => {
    return baseHoldings.map((holding) =>
      mapHoldingWithLivePrice(holding, livePrices[holding.symbol])
    );
  }, [baseHoldings, livePrices]);

  const holdings = useMemo(() => {
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
        id: activePortfolioId || LOCAL_PORTFOLIO_ID,
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

  const activeHoldingSymbols = useMemo(() => {
    return Array.from(
      new Set(
        holdings
          .filter((holding) => holding.quantityOwned > 0)
          .map((holding) => holding.symbol)
      )
    ).sort();
  }, [holdings]);

  const availableStocks = useMemo(() => {
    const holdingsBySymbol = new Map(holdings.map((holding) => [holding.symbol, holding]));

    const fromReference = referenceStocks
      .map((stock) => {
        const symbol = normalizeSymbol(stock.symbol);
        const linkedHolding = holdingsBySymbol.get(symbol);
        const liveQuote = livePrices[symbol];
        const currentBidPrice = Math.max(0, toNumber(liveQuote?.price, stock.bidPrice));
        const quantityOwned = Math.max(0, toNumber(linkedHolding?.quantityOwned, stock.quantityOwned));

        return {
          id: stock.id,
          symbol,
          name: stock.name,
          sector: stock.sector,
          currentBidPrice,
          askPrice: stock.askPrice,
          quantityOwned,
          profitLossPercent: toNumber(stock.profitLossPercent, 0),
        };
      })
      .filter((stock) => stock.symbol);

    if (fromReference.length > 0) return fromReference;

    return holdings.map((holding) => ({
      id: holding.id,
      symbol: holding.symbol,
      name: holding.name,
      sector: holding.sector,
      currentBidPrice: holding.currentBidPrice,
      askPrice: holding.currentBidPrice,
      quantityOwned: holding.quantityOwned,
      profitLossPercent: holding.profitLossPercent,
    }));
  }, [holdings, livePrices, referenceStocks]);

  const portfoliosForActiveUser = useMemo(() => {
    if (!activeUser) return portfolios;
    const allowedIds = new Set((activeUser.portfolioIds || []).map(toId));
    if (allowedIds.size === 0) return portfolios;

    const filtered = portfolios.filter((portfolioItem) => allowedIds.has(toId(portfolioItem.id)));
    return filtered.length > 0 ? filtered : portfolios;
  }, [activeUser, portfolios]);

  const portfolioComputed = useMemo(() => {
    return buildPortfolioComputedData({
      holdings,
      availableCash: activePortfolio.availableFunds,
      historyBySymbol,
    });
  }, [activePortfolio.availableFunds, holdings, historyBySymbol]);

  const totals = portfolioComputed.totals;
  const portfolioSummary = portfolioComputed.portfolioSummary;
  const allocationBreakdown = portfolioComputed.allocationBreakdown;

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
      saveJsonCache(PORTFOLIOS_CACHE_KEY, list);

      if (list.length > 0) {
        const allowedIds = new Set((activeUser?.portfolioIds || []).map(toId));
        const visibleList = allowedIds.size > 0 ? list.filter((item) => allowedIds.has(toId(item.id))) : list;
        const fallbackList = visibleList.length > 0 ? visibleList : list;

        const activeStillExists = fallbackList.some((item) => toId(item.id) === toId(activePortfolioId));
        if (!activeStillExists) {
          setActivePortfolioIdState(toId(fallbackList[0].id));
        }
      }
    } catch {
      const cached = readCachedPortfolios();
      if (cached.length > 0) {
        setPortfolios(cached);
      }
    }
  }, [activePortfolioId, activeUser]);

  const refreshBaseHoldings = useCallback(async () => {
    const result = await getBaseHoldingsWithFallback();
    setBaseHoldings(Array.isArray(result.holdings) ? result.holdings : []);
    setFallbackMessage(result.message || "");
    return result;
  }, []);

  const refreshReferenceStocks = useCallback(async () => {
    const result = await getReferenceStocksWithFallback();
    setReferenceStocks(Array.isArray(result) ? result : []);
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

      if (allowedIds.size > 0 && !allowedIds.has(nextId)) return;
      setActivePortfolioIdState(nextId);
    },
    [activeUser]
  );

  const refreshPerformanceHistory = useCallback(
    async (symbols) => {
      const targetSymbols = Array.from(
        new Set(
          (Array.isArray(symbols) && symbols.length > 0 ? symbols : activeHoldingSymbols)
            .map(normalizeSymbol)
            .filter(Boolean)
        )
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

      const responses = await Promise.allSettled(
        targetSymbols.map(async (symbol) => {
          try {
            const response = await pricesAPI.getPriceHistory(symbol);
            return {
              symbol,
              points: parseHistoryDataPoints(response?.data),
            };
          } catch {
            return { symbol, points: [] };
          }
        })
      );

      responses.forEach((result) => {
        if (result.status === "fulfilled") {
          nextHistory[result.value.symbol] = result.value.points;
        }
      });

      setHistoryBySymbol(nextHistory);
      setPerformanceHistoryLoading(false);
      setLastHistoryRefreshAt(Date.now());
    },
    [activeHoldingSymbols]
  );

  const ensureLivePrices = useCallback(async (symbols, options = {}) => {
    const sourceHoldings = baseHoldingsRef.current;
    const currentLivePrices = livePricesRef.current;

    const targetSymbols = Array.from(
      new Set(
        (symbols?.length ? symbols : sourceHoldings.map((holding) => holding.symbol))
          .map(normalizeSymbol)
          .filter(Boolean)
      )
    );

    if (targetSymbols.length === 0) {
      return { prices: {}, warning: "", hasFailures: false };
    }

    const result = await getLivePricesForSymbols(targetSymbols, {
      forceRefresh: options.forceRefresh ?? false,
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
  }, []);

  const refreshAll = useCallback(
    async (options = {}) => {
      setLoading(true);
      setActionError("");
      setTradeError("");

      await Promise.all([refreshBaseHoldings(), refreshTransactions(), refreshPortfolio()]);
      await refreshReferenceStocks();

      setLastRefreshAt(Date.now());

      if (options.includeLive) {
        await ensureLivePrices(undefined, {
          forceRefresh: options.forceLive ?? false,
          includeBackendFallback: true,
        });
      }

      setLoading(false);
    },
    [ensureLivePrices, refreshBaseHoldings, refreshPortfolio, refreshReferenceStocks, refreshTransactions]
  );

  const clearTradeFeedback = useCallback(() => {
    setTradeMessage("");
    setTradeError("");
  }, []);

  useEffect(() => {
    if (initialLoadStarted.current) return;
    initialLoadStarted.current = true;
    refreshAll();
  }, [refreshAll]);

  useEffect(() => {
    refreshPerformanceHistory();
  }, [refreshPerformanceHistory]);

  const getExecutionPrice = useCallback(async (symbol, options = {}) => {
    const normalizedSymbol = normalizeSymbol(symbol);
    const backendHolding = baseHoldingsRef.current.find((holding) => holding.symbol === normalizedSymbol);

    try {
      const result = await getLivePricesForSymbols([normalizedSymbol], {
        forceRefresh: options.forceRefresh ?? false,
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
      setLivePriceWarning(getFriendlyLivePriceError(error));
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
  }, []);

  const syncAfterPortfolioMutation = useCallback(
    async ({ includeLiveSymbols = [], portfolioResponse } = {}) => {
      if (portfolioResponse) {
        const mapped = mapPortfolio(portfolioResponse);
        setPortfolios((current) => {
          const exists = current.some((item) => toId(item.id) === toId(mapped.id));
          const next = exists
            ? current.map((item) => (toId(item.id) === toId(mapped.id) ? mapped : item))
            : [...current, mapped];
          saveJsonCache(PORTFOLIOS_CACHE_KEY, next);
          return next;
        });
      }

      await Promise.all([refreshBaseHoldings(), refreshTransactions(), refreshPortfolio()]);

      if (includeLiveSymbols.length > 0) {
        await ensureLivePrices(includeLiveSymbols, {
          includeBackendFallback: true,
          forceRefresh: true,
        });
      }
    },
    [ensureLivePrices, refreshBaseHoldings, refreshPortfolio, refreshTransactions]
  );

  const buyStock = useCallback(
    async (symbol, quantity, options = {}) => {
      setTradeError("");
      setTradeMessage("");

      const normalizedSymbol = normalizeSymbol(symbol);
      const qty = toPositiveInteger(quantity);
      const providedExecutionPrice = toNumber(options.executionPrice, 0);
      const portfolioId = toBackendPortfolioId(activePortfolioId);

      if (qty <= 0) {
        setTradeError("Please enter a whole-share quantity greater than zero.");
        return { ok: false };
      }

      if (!portfolioId) {
        setTradeError("The active portfolio is unavailable. Refresh and try again.");
        return { ok: false };
      }

      const quote =
        providedExecutionPrice > 0
          ? { ok: true, price: providedExecutionPrice, source: "shared", warning: "" }
          : await getExecutionPrice(normalizedSymbol);

      if (!quote.ok || quote.price <= 0) {
        setTradeError(RATE_LIMIT_MESSAGE);
        return { ok: false };
      }

      const totalCost = quote.price * qty;
      if (totalCost > totals.availableFunds) {
        setTradeError("Insufficient available funds for this purchase.");
        return { ok: false };
      }

      try {
        await holdingsAPI.buyStock({
          symbol: normalizedSymbol,
          quantity: qty,
          price: quote.price,
          portfolioId,
        });

        await syncAfterPortfolioMutation({ includeLiveSymbols: [normalizedSymbol] });
        setTradeMessage(`Bought ${qty} ${normalizedSymbol} at ${formatCurrency(quote.price)}.`);
        if (quote.warning) setLivePriceWarning(quote.warning);
        return { ok: true };
      } catch (error) {
        console.error("Buy transaction failed", error);
        setTradeError(getApiErrorMessage(error, "Buy transaction failed."));
        return { ok: false };
      }
    },
    [activePortfolioId, getExecutionPrice, syncAfterPortfolioMutation, totals.availableFunds]
  );

  const sellStock = useCallback(
    async (symbol, quantity, options = {}) => {
      setTradeError("");
      setTradeMessage("");

      const normalizedSymbol = normalizeSymbol(symbol);
      const qty = toPositiveInteger(quantity);
      const providedExecutionPrice = toNumber(options.executionPrice, 0);
      const portfolioId = toBackendPortfolioId(activePortfolioId);

      if (qty <= 0) {
        setTradeError("Please enter a whole-share quantity greater than zero.");
        return { ok: false };
      }

      if (!portfolioId) {
        setTradeError("The active portfolio is unavailable. Refresh and try again.");
        return { ok: false };
      }

      const selected = holdings.find((holding) => holding.symbol === normalizedSymbol);
      if (!selected || selected.quantityOwned < qty) {
        setTradeError("Insufficient owned quantity for this sale.");
        return { ok: false };
      }

      const quote =
        providedExecutionPrice > 0
          ? { ok: true, price: providedExecutionPrice, source: "shared", warning: "" }
          : await getExecutionPrice(normalizedSymbol);

      if (!quote.ok || quote.price <= 0) {
        setTradeError(RATE_LIMIT_MESSAGE);
        return { ok: false };
      }

      try {
        await holdingsAPI.sellStock({
          symbol: normalizedSymbol,
          quantity: qty,
          price: quote.price,
          portfolioId,
        });

        await syncAfterPortfolioMutation({ includeLiveSymbols: [normalizedSymbol] });
        setTradeMessage(`Sold ${qty} ${normalizedSymbol} at ${formatCurrency(quote.price)}.`);
        if (quote.warning) setLivePriceWarning(quote.warning);
        return { ok: true };
      } catch (error) {
        console.error("Sell transaction failed", error);
        setTradeError(getApiErrorMessage(error, "Sell transaction failed."));
        return { ok: false };
      }
    },
    [activePortfolioId, getExecutionPrice, holdings, syncAfterPortfolioMutation]
  );

  const addFunds = useCallback(
    async (amount) => {
      setActionError("");
      setActionMessage("");

      const safeAmount = toNumber(amount, 0);
      const portfolioId = toBackendPortfolioId(activePortfolio.id);

      if (safeAmount <= 0) {
        setActionError("Please enter an amount greater than zero.");
        return { ok: false };
      }

      if (!portfolioId) {
        setActionError("The active portfolio is unavailable. Refresh and try again.");
        return { ok: false };
      }

      try {
        const response = await portfolioAPI.depositFunds(portfolioId, safeAmount);
        await syncAfterPortfolioMutation({ portfolioResponse: response?.data });
        setActionMessage(`Added ${formatCurrency(safeAmount)} to available funds.`);
        return { ok: true };
      } catch (error) {
        console.error("Add funds failed", error);
        setActionError(getApiErrorMessage(error, "Failed to add funds."));
        return { ok: false };
      }
    },
    [activePortfolio.id, syncAfterPortfolioMutation]
  );

  const performanceSeriesAll = useMemo(() => {
    const real = buildPortfolioHistorySeries(holdings, historyBySymbol, totals.holdingsMarketValue);
    if (real.length >= 2) return real;
    return buildSyntheticSeries(totals.holdingsInvested, totals.holdingsMarketValue, 90);
  }, [holdings, historyBySymbol, totals.holdingsMarketValue, totals.holdingsInvested]);

  const performanceSeries = useMemo(() => {
    return filterPerformanceSeriesByRange(performanceSeriesAll, performanceRange);
  }, [performanceRange, performanceSeriesAll]);

  const value = {
    holdings,
    allHoldings,
    baseHoldings,
    livePrices,
    transactions,
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
    availableStocks,
    loading,
    fallbackMessage,
    livePriceWarning,
    actionMessage,
    actionError,
    tradeMessage,
    tradeError,
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
    refreshReferenceStocks,
    ensureLivePrices,
    getExecutionPrice,
    clearTradeFeedback,
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