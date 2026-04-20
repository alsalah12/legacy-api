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
    <article className="card db-news-card">
      <div className="db-card-header">
        <h2 className="db-card-title">Market News</h2>
        <span className="db-news-live">&#9679; Live</span>
      </div>

      <div className={`db-news-body${fading ? " db-news-fading" : ""}`}>
        <span className="db-news-category">{story.category}</span>
        <p className="db-news-headline">{story.headline}</p>
        <div className="db-news-meta">
          <span className="db-news-source">{story.source}</span>
          <span className="db-news-time">{story.time}</span>
        </div>
      </div>

      <div className="db-news-dots">
        {stories.map((_, i) => (
          <button
            key={i}
            type="button"
            className={`db-news-dot${i === index ? " active" : ""}`}
            onClick={() => navigateTo(i)}
            aria-label={`View story ${i + 1}`}
          />
        ))}
      </div>
    </article>
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

  const summaryStats = useMemo(
    () => [
      { label: "Total Value", value: formatCurrency(portfolioSummary.totalValue), sub: "Holdings + available cash" },
      {
        label: "Today’s Gain",
        value: formatCurrency(portfolioSummary.todayGainValue),
        sub: portfolioSummary.todayGainAvailable ? formatPercent(portfolioSummary.todayGainPercent) : "Awaiting market history",
        positive: portfolioSummary.todayGainValue > 0,
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
        className: "db-lc-stocks",
      },
      {
        label: "Invested",
        value: totals.holdingsInvested,
        className: "db-lc-bonds",
      },
      {
        label: "Cash",
        value: totals.availableFunds,
        className: "db-lc-cash",
      },
    ],
    [performanceSeries, totals.availableFunds, totals.holdingsInvested, totals.holdingsMarketValue]
  );

  const formattedLiveRefresh = lastLiveRefreshAt
    ? new Date(lastLiveRefreshAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "Not refreshed yet";

  const greetingText = getTimeBasedGreeting();
  const displayName = activeUser?.name?.trim() || "User";

  return (
    <div className="db-page">
      <AppTopBar />
      <AppSidebar />

      {/* Dashboard content is intentionally ordered as:
          1) KPI summary row, 2) hero performance chart, 3) supporting insights row, 4) holdings preview.
          This removes the previous stacked/competing card hierarchy and keeps one clear visual flow. */}
      <main className="db-main app-page-main">
        {/* Top row: greeting hero on the left, three KPI cards on the right — single above-fold band. */}
        <div className="db-top-row">
          {/* Hero greeting — clean static text, no controls, no dropdowns. */}
          <div className="db-welcome">
            <p className="db-welcome-kicker">Portfolio Overview</p>
            <h1 className="db-welcome-title">{greetingText}, {displayName}</h1>
            <p className={`db-welcome-sub ${totals.holdingsProfit >= 0 ? "db-benchmark-positive" : "db-benchmark-negative"}`}>
              Your portfolio is {totals.holdingsProfit >= 0 ? "outperforming" : "underperforming"} benchmark
              &nbsp;&mdash;&nbsp;{totals.holdingsProfit >= 0 ? "+" : ""}{formatCurrency(totals.holdingsProfit)} total return.
            </p>
            <button
              type="button"
              className="db-refresh-btn"
              onClick={async () => {
                await ensureLivePrices(undefined, { forceRefresh: true, includeBackendFallback: true });
                await refreshPerformanceHistory();
              }}
              title={`Last refreshed ${formattedLiveRefresh}`}
            >
              ↻ Refresh prices
            </button>
          </div>

          <div className="db-summary-row">
            {summaryStats.map((stat) => (
              <div className="card db-kpi-card" key={stat.label}>
                <span className="db-kpi-label">{stat.label}</span>
                <span className={`db-kpi-value${stat.positive === false ? " db-negative" : stat.positive ? " db-positive" : ""}`}>
                  {stat.value}
                </span>
                <span className="db-kpi-sub">{stat.sub}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Hero portfolio performance section: primary focus area of the page. */}
        <section className="db-hero-section">
          <article className="card db-perf-card db-perf-card-hero">
            <div className="db-card-header">
              <div>
                <h2 className="db-card-title">Portfolio Performance</h2>
                <p className="db-card-meta">Live prices last refreshed at {formattedLiveRefresh}</p>
              </div>
              <div className="db-period-tabs" role="group" aria-label="Chart time period">
                {performanceRangeOptions.map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={`db-period-btn${p === performanceRange ? " active" : ""}`}
                    onClick={() => setPerformanceRange(p)}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="db-chart-area">
              <div className="db-chart-panel">
                {chartGeometry ? (
                  <svg
                    viewBox={`0 0 ${chartGeometry.width} ${chartGeometry.height}`}
                    className="db-chart-svg"
                    aria-label={`Portfolio performance for ${performanceRange}`}
                    role="img"
                  >
                    <defs>
                      <linearGradient id="dbPortfolioGradient" x1="0" y1="0" x2="0" y2="1">
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

                    <polygon points={chartGeometry.areaPoints} fill="url(#dbPortfolioGradient)" />

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
                        className="db-chart-axis-label"
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
                        className="db-chart-axis-label"
                      >
                        {tick.label}
                      </text>
                    ))}
                  </svg>
                ) : (
                  <div className="db-chart-empty">
                    Historical chart data needs at least two data points. Try a wider range or refresh prices.
                  </div>
                )}
              </div>

              <div className="db-chart-legend db-chart-legend-side">
                {chartLegend.map((series) => (
                  <div className="db-legend-stat" key={series.label}>
                    <span className={`db-legend-chip ${series.className}`}>{series.label}</span>
                    <strong>{formatCurrency(series.value)}</strong>
                  </div>
                ))}
              </div>
            </div>

            <div className="db-asset-row">
              <div className="db-asset-cell">
                <span className="db-asset-label">Holdings market value</span>
                <span className="db-asset-value">{formatCurrency(totals.holdingsMarketValue)}</span>
              </div>
              <div className="db-asset-cell">
                <span className="db-asset-label">Available cash</span>
                <span className="db-asset-value">{formatCurrency(totals.availableFunds)}</span>
              </div>
              <div className="db-asset-cell">
                <span className="db-asset-label">Net return</span>
                <span className={`db-asset-value ${totals.holdingsProfit >= 0 ? "db-positive" : "db-negative"}`}>
                  {formatCurrency(totals.holdingsProfit)}
                </span>
              </div>
            </div>
          </article>
        </section>

        {/* Supporting insight row sits below hero chart and does not compete with it. */}
        <section className="db-grid-secondary">
          <article className="card db-performers-card">
            <div className="db-card-header">
              <div>
                <h2 className="db-card-title">Top Equity Performers</h2>
                <p className="db-card-meta">Sorted from shared holdings performance</p>
              </div>
            </div>

            <div className="db-performers-list">
              {performers.map((performer) => (
                <div className="db-performer-row" key={performer.symbol}>
                  <span className="db-performer-rank">#{performer.rank}</span>
                  <div className="db-performer-info">
                    <span className="db-performer-symbol">{performer.symbol}</span>
                    <span className="db-performer-name">{performer.name}</span>
                  </div>
                  <div className="db-performer-metric">
                    <span className={`db-performer-perf${performer.positive ? " db-positive" : " db-negative"}`}>{performer.perf}</span>
                    <span className="db-performer-profit">{formatCurrency(performer.profitLossValue)}</span>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <RotatingNewsCard stories={NEWS_STORIES} />
        </section>

        {/* Holdings preview is a clean, full-width supporting section beneath insights. */}
        <section className="db-holdings-section">
          <section className="card db-holdings-card">
            <div className="db-card-header">
              <h2 className="db-card-title">Holdings Overview</h2>
              <a href="/holdings" className="db-view-all">View all</a>
            </div>

            <div className="db-table-wrap">
              <table className="db-table">
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
                      <td className="db-company-cell">{holding.name}</td>
                      <td><strong>{holding.symbol}</strong></td>
                      <td className="db-cell-center">{holding.quantityOwned}</td>
                      <td className="db-cell-center">{formatCurrency(holding.currentBidPrice)}</td>
                      <td className="db-cell-center">{formatCurrency(holding.totalValue)}</td>
                      <td className={`db-cell-center ${holding.profitLossPercent > 0 ? "db-positive" : holding.profitLossPercent < 0 ? "db-negative" : ""}`}>
                        {formatPercent(holding.profitLossPercent)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </section>
      </main>
    </div>
  );
}
