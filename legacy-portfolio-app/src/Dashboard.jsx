import React, { useEffect, useMemo, useRef, useState } from "react";
import "./Dashboard.css";
import AppSidebar from "./components/AppSidebar";
import AppTopBar from "./components/AppTopBar";
import { formatCurrency, formatPercent, usePortfolioData } from "./services/holdingsData";
import { getTimeBasedGreeting } from "./utils/greeting";

const NEWS_STORIES = [
  {
    category: "Macro",
    headline: "Fed signals potential rate pause as inflation data softens for the second consecutive month",
    source: "Reuters",
    time: "12 min ago",
  },
  {
    category: "Technology",
    headline: "NVIDIA reports record quarterly revenue driven by AI infrastructure demand from global hyperscalers",
    source: "Bloomberg",
    time: "38 min ago",
  },
  {
    category: "Markets",
    headline: "S&P 500 closes above 5,400 for the first time this quarter on broad earnings surprises",
    source: "WSJ",
    time: "1 hr ago",
  },
  {
    category: "Energy",
    headline: "Oil prices stabilise near $84 per barrel as OPEC production cut compliance improves significantly",
    source: "FT",
    time: "2 hr ago",
  },
  {
    category: "Equities",
    headline: "Apple surges 3.4% after analysts raise price targets citing resilient services revenue growth",
    source: "CNBC",
    time: "3 hr ago",
  },
];

function formatChartDate(date) {
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function buildChartGeometry(series) {
  const width = 560;
  const height = 240;
  const padding = { top: 16, right: 18, bottom: 34, left: 56 };
  const values = series.map((point) => point.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const valueSpread = Math.max(maxValue - minValue, maxValue * 0.05, 1);
  const chartMin = Math.max(0, minValue - valueSpread * 0.25);
  const chartMax = maxValue + valueSpread * 0.15;
  const chartHeight = height - padding.top - padding.bottom;
  const chartWidth = width - padding.left - padding.right;

  const points = series.map((point, index) => {
    const x =
      series.length === 1
        ? padding.left
        : padding.left + (index / (series.length - 1)) * chartWidth;
    const yRatio = (point.value - chartMin) / Math.max(chartMax - chartMin, 1);
    const y = padding.top + (1 - yRatio) * chartHeight;

    return {
      ...point,
      x,
      y,
    };
  });

  const yTicks = Array.from({ length: 4 }, (_, index) => {
    const ratio = index / 3;
    const value = chartMax - ratio * (chartMax - chartMin);
    const y = padding.top + ratio * chartHeight;
    return { value, y };
  });

  const xTickCount = Math.min(6, points.length);
  const xTicks = Array.from({ length: xTickCount }, (_, index) => {
    const pointIndex = Math.round((index / Math.max(xTickCount - 1, 1)) * (points.length - 1));
    const point = points[pointIndex];
    return {
      x: point.x,
      label: formatChartDate(point.date),
      key: `${point.dateKey}-${index}`,
    };
  });

  const polylinePoints = points.map((point) => `${point.x},${point.y}`).join(" ");
  const areaPoints = points.length
    ? `${polylinePoints} ${points[points.length - 1].x},${height - padding.bottom} ${points[0].x},${height - padding.bottom}`
    : "";

  return {
    width,
    height,
    padding,
    points,
    polylinePoints,
    areaPoints,
    yTicks,
    xTicks,
  };
}

function RotatingNewsCard({ stories }) {
  const [index, setIndex] = useState(0);
  const [fading, setFading] = useState(false);
  const indexRef = useRef(0);

  function navigateTo(nextIdx) {
    setFading(true);
    setTimeout(() => {
      indexRef.current = nextIdx;
      setIndex(nextIdx);
      setFading(false);
    }, 280);
  }

  useEffect(() => {
    const interval = setInterval(() => {
      const next = (indexRef.current + 1) % stories.length;
      navigateTo(next);
    }, 5000);

    return () => clearInterval(interval);
  }, [stories.length]);

  const story = stories[index];

  return (
    <>
      <div className="table-header">
        <div>
          <h2>Market News</h2>
          <span className="performer-live">&#9679; Live</span>
        </div>
      </div>

      <div className={`news-body${fading ? " news-fading" : ""}`}>
        <span className="news-category">{story.category}</span>
        <p className="news-headline">{story.headline}</p>
        <div className="news-meta">
          <span className="news-source">{story.source}</span>
          <span className="news-time">{story.time}</span>
        </div>
      </div>

      <div className="news-dots">
        {stories.map((_, i) => (
          <button
            key={i}
            type="button"
            className={`news-dot${i === index ? " active" : ""}`}
            onClick={() => navigateTo(i)}
            aria-label={`View story ${i + 1}`}
          />
        ))}
      </div>
    </>
  );
}

export default function Dashboard() {
  const {
    holdings,
    totals,
    portfolioSummary,
    activeUser,
    ensureLivePrices,
    lastLiveRefreshAt,
    performanceRange,
    performanceRangeOptions,
    setPerformanceRange,
    performanceSeries,
    refreshPerformanceHistory,
  } = usePortfolioData();

  useEffect(() => {
    ensureLivePrices(undefined, { includeBackendFallback: true });
  }, [ensureLivePrices]);

  const holdingsToDisplay = holdings.slice(0, 4);

  const firstName = useMemo(() => {
    const rawName = String(activeUser?.name || "").trim();
    return rawName ? rawName.split(/\s+/)[0] : "";
  }, [activeUser?.name]);

  const greetingText = getTimeBasedGreeting();
  // FIXED: Removed "Welcome" from greeting
  // OLD: "Good evening, Welcome" or "Good evening, {firstName}, Welcome"
  // NEW: Only "Good evening, {firstName}"
  const greetingHeading = firstName ? `${greetingText}, ${firstName}` : greetingText;

  // Read all dashboard metrics from the shared portfolio summary selector so
  // Total Value / Today's Gain / Total Gain stay aligned with the holdings data.
  const summaryStats = useMemo(
    () => [
      {
        label: "Total Value",
        value: formatCurrency(portfolioSummary.totalValue),
        sub: "Holdings + available cash",
      },
      {
        label: "Today's Gain",
        value: portfolioSummary.todayGainAvailable ? formatCurrency(portfolioSummary.todayGainValue) : "Unavailable",
        sub: portfolioSummary.todayGainAvailable
          ? formatPercent(portfolioSummary.todayGainPercent)
          : "Previous close unavailable",
        positive: portfolioSummary.todayGainAvailable ? portfolioSummary.todayGainValue > 0 : null,
        unavailable: !portfolioSummary.todayGainAvailable,
      },
      {
        label: "Total Gain",
        value: formatCurrency(portfolioSummary.totalGainValue),
        sub: formatPercent(portfolioSummary.totalGainPercent),
        positive: portfolioSummary.totalGainValue > 0,
      },
    ],
    [portfolioSummary]
  );

  const performers = useMemo(() => {
    return [...holdings]
      .sort((first, second) => second.profitLossPercent - first.profitLossPercent)
      .slice(0, 5)
      .map((holding, index) => ({
        rank: index + 1,
        symbol: holding.symbol,
        name: holding.name,
        perf: formatPercent(holding.profitLossPercent),
        profitLossValue: holding.profitLossValue,
        positive: holding.profitLossPercent >= 0,
      }));
  }, [holdings]);

  const chartGeometry = useMemo(() => {
    if (performanceSeries.length < 2) return null;
    return buildChartGeometry(performanceSeries);
  }, [performanceSeries]);

  const chartLegend = useMemo(
    () => [
      {
        label: "Portfolio",
        value: performanceSeries[performanceSeries.length - 1]?.value ?? totals.holdingsMarketValue,
        className: "lc-stocks",
      },
      {
        label: "Invested",
        value: totals.holdingsInvested,
        className: "lc-bonds",
      },
      {
        label: "Cash",
        value: totals.availableFunds,
        className: "lc-cash",
      },
    ],
    [performanceSeries, totals.availableFunds, totals.holdingsInvested, totals.holdingsMarketValue]
  );

  const formattedLiveRefresh = lastLiveRefreshAt
    ? new Date(lastLiveRefreshAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "Not refreshed yet";

  return (
    <div className="dashboard-page">
      <AppTopBar />
      <AppSidebar />

      <main className="main-content app-page-main">
        <div className="dashboard-shell">
          {/* 
            DASHBOARD LAYOUT REFACTORED TO MATCH HOLDINGS PAGE STRUCTURE
            ═══════════════════════════════════════════════════════════════════
            
            This dashboard now reuses the same layout architecture as Holdings.jsx:
            - Same outer page container approach
            - Same main-content wrapper with height constraint
            - Same grid-based shell structure
            - Same 2-column content layout (1.95fr left / 0.9fr right)
            
            KEY CHANGES FROM PREVIOUS VERSION:
            1. REMOVED "Welcome" from greeting text
               Heading now shows: "Good evening, {firstName}"
               No "Welcome" word included
            2. Refactored to use Holdings topbar pattern
            3. Moved KPI metrics to summary-grid (same as Holdings)
            4. Left column uses Holdings-style card pattern
            5. Fixed viewport fit to work at 100% browser zoom
            6. Reduced padding/gaps to fit properly on standard screens
            
            LAYOUT STRUCTURE (same as Holdings):
            - topbar: heading only
            - summary-grid: 3 KPI cards
            - content-grid: 2-column layout
              - Left (1.95fr): chart + holdings table
              - Right (0.9fr): performers + news
            ═══════════════════════════════════════════════════════════════════
          */}

          {/* TOP HEADER: Greeting only (matches Holdings topbar) */}
          <header className="topbar">
            <h1>{greetingHeading}</h1>
          </header>

          {/* KPI METRICS ROW (mirrors Holdings summary-grid pattern) */}
          <section className="summary-grid">
            {summaryStats.map((stat) => (
              <article className="metric-card" key={stat.label}>
                <span className="metric-label">{stat.label}</span>
                <strong
                  className={[
                    "metric-value",
                    stat.unavailable ? "unavailable-text" : "",
                    stat.positive === false ? "negative-text" : "",
                    stat.positive === true ? "positive-text" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {stat.value}
                </strong>
                <span className="metric-sub">{stat.sub}</span>
              </article>
            ))}
          </section>

          {/* MAIN 2-COLUMN LAYOUT (mirrors Holdings content-grid) */}
          <section className="content-grid">
            {/* LEFT COLUMN (≈68%): Chart + Holdings Table */}
            <div className="dashboard-column-left">
              <article className="table-card chart-card">
                <div className="table-header">
                  <div>
                    <h2>Portfolio Performance</h2>
                    <p className="table-meta">Live prices refreshed at {formattedLiveRefresh}</p>
                  </div>

                  <div className="chart-actions">
                    <div className="period-tabs" role="group" aria-label="Chart time period">
                      {performanceRangeOptions.map((p) => (
                        <button
                          key={p}
                          type="button"
                          className={`period-btn${p === performanceRange ? " active" : ""}`}
                          onClick={() => setPerformanceRange(p)}
                        >
                          {p}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      className="refresh-btn"
                      onClick={async () => {
                        await ensureLivePrices(undefined, { forceRefresh: true, includeBackendFallback: true });
                        await refreshPerformanceHistory();
                      }}
                      title={`Last refreshed ${formattedLiveRefresh}`}
                    >
                      Refresh prices
                    </button>
                  </div>
                </div>

                <div className="chart-area">
                  <div className="chart-panel">
                    {chartGeometry ? (
                      <svg
                        viewBox={`0 0 ${chartGeometry.width} ${chartGeometry.height}`}
                        className="chart-svg"
                        aria-label={`Portfolio performance for ${performanceRange}`}
                        role="img"
                      >
                        <defs>
                          <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="rgba(85,72,200,0.26)" />
                            <stop offset="100%" stopColor="rgba(85,72,200,0)" />
                          </linearGradient>
                        </defs>

                        {chartGeometry.yTicks.map((tick) => (
                          <line
                            key={`grid-${tick.y}`}
                            x1={chartGeometry.padding.left}
                            y1={tick.y}
                            x2={chartGeometry.width - chartGeometry.padding.right}
                            y2={tick.y}
                            stroke="#ece8fb"
                            strokeWidth="1"
                          />
                        ))}

                        <polygon points={chartGeometry.areaPoints} fill="url(#portfolioGradient)" />

                        <polyline
                          points={chartGeometry.polylinePoints}
                          fill="none"
                          stroke="#5548c8"
                          strokeWidth="3.2"
                          strokeLinejoin="round"
                          strokeLinecap="round"
                        />

                        {chartGeometry.points.length > 0 && (
                          <circle
                            cx={chartGeometry.points[chartGeometry.points.length - 1].x}
                            cy={chartGeometry.points[chartGeometry.points.length - 1].y}
                            r="4.5"
                            fill="#5548c8"
                            stroke="#ffffff"
                            strokeWidth="2"
                          />
                        )}

                        {chartGeometry.yTicks.map((tick) => (
                          <text
                            key={`ylabel-${tick.y}`}
                            x={chartGeometry.padding.left - 10}
                            y={tick.y + 4}
                            textAnchor="end"
                            className="chart-axis-label"
                          >
                            {formatCurrency(tick.value)}
                          </text>
                        ))}

                        {chartGeometry.xTicks.map((tick) => (
                          <text
                            key={tick.key}
                            x={tick.x}
                            y={chartGeometry.height - 10}
                            textAnchor="middle"
                            className="chart-axis-label"
                          >
                            {tick.label}
                          </text>
                        ))}
                      </svg>
                    ) : (
                      <div className="chart-empty">
                        Historical chart data needs at least two data points. Try a wider range or refresh prices.
                      </div>
                    )}
                  </div>

                  <div className="chart-legend chart-legend-side">
                    {chartLegend.map((series) => (
                      <div className="legend-stat" key={series.label}>
                        <span className={`legend-chip ${series.className}`}>{series.label}</span>
                        <strong>{formatCurrency(series.value)}</strong>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="asset-row">
                  <div className="asset-cell">
                    <span className="asset-label">Holdings market value</span>
                    <span className="asset-value">{formatCurrency(totals.holdingsMarketValue)}</span>
                  </div>
                  <div className="asset-cell">
                    <span className="asset-label">Available cash</span>
                    <span className="asset-value">{formatCurrency(totals.availableFunds)}</span>
                  </div>
                  <div className="asset-cell">
                    <span className="asset-label">Net return</span>
                    <span className={`asset-value ${totals.holdingsProfit >= 0 ? "positive-text" : "negative-text"}`}>
                      {formatCurrency(totals.holdingsProfit)}
                    </span>
                  </div>
                </div>
              </article>

              <article className="table-card">
                <div className="table-header">
                  <h2>Holdings Overview</h2>
                  <a href="/holdings" className="table-view-all">
                    View all
                  </a>
                </div>

                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Symbol</th>
                        <th>Quantity</th>
                        <th>Bid Price</th>
                        <th>Total Value</th>
                        <th>P / L %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {holdingsToDisplay.map((holding) => (
                        <tr key={holding.id}>
                          <td>{holding.name}</td>
                          <td>
                            <strong>{holding.symbol}</strong>
                          </td>
                          <td className="number-cell">{holding.quantityOwned}</td>
                          <td className="number-cell">{formatCurrency(holding.currentBidPrice)}</td>
                          <td className="value-cell">{formatCurrency(holding.totalValue)}</td>
                          <td
                            className={`number-cell ${
                              holding.profitLossPercent > 0 ? "positive-text" : holding.profitLossPercent < 0 ? "negative-text" : ""
                            }`}
                          >
                            {formatPercent(holding.profitLossPercent)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </article>
            </div>

            {/* RIGHT COLUMN (≈32%): Performers + News */}
            <aside className="dashboard-column-right">
              <article className="table-card">
                <div className="table-header">
                  <div>
                    <h2>Top Equity Performers</h2>
                    <p className="table-meta">Sorted from shared holdings performance</p>
                  </div>
                </div>

                <div className="performers-list">
                  {performers.map((performer) => (
                    <div className="performer-row" key={performer.symbol}>
                      <span className="performer-rank">#{performer.rank}</span>
                      <div className="performer-info">
                        <span className="performer-symbol">{performer.symbol}</span>
                        <span className="performer-name">{performer.name}</span>
                      </div>
                      <div className="performer-metric">
                        <span className={`performer-perf${performer.positive ? " positive-text" : " negative-text"}`}>
                          {performer.perf}
                        </span>
                        <span className="performer-profit">{formatCurrency(performer.profitLossValue)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </article>

              <article className="table-card">
                <RotatingNewsCard stories={NEWS_STORIES} />
              </article>
            </aside>
          </section>
        </div>
      </main>
    </div>
  );
}
