// Dashboard.jsx
// Enterprise portfolio management dashboard.
// Layout: welcome strip → KPI row → main grid (chart + performers) → lower grid (holdings + news)
import React, { useState, useEffect, useRef } from "react";
import "./Dashboard.css";
import AppSidebar from "./components/AppSidebar";
import AppTopBar from "./components/AppTopBar";

// ── Portfolio summary KPIs ─────────────────────────────────────────────────
const SUMMARY_STATS = [
  { label: "Total Portfolio Value", value: "$152,431.25", sub: "Updated just now" },
  { label: "Available Funds",       value: "$12,450.00",  sub: "Cash & equivalents" },
  { label: "Today's Gain / Loss",   value: "+$1,284.60",  sub: "+0.85% today",     positive: true },
  { label: "Total Return",          value: "+$18,431.25", sub: "+13.76% all time", positive: true },
];

// ── Asset class breakdown ─────────────────────────────────────────────────
const ASSET_STATS = [
  { label: "Stocks", value: "$96,200.40", dotClass: "db-dot-stocks" },
  { label: "Bonds",  value: "$28,920.10", dotClass: "db-dot-bonds"  },
  { label: "Crypto", value: "$14,859.75", dotClass: "db-dot-crypto" },
  { label: "Cash",   value: "$12,450.00", dotClass: "db-dot-cash"   },
];

// ── Top equity performers ─────────────────────────────────────────────────
const TOP_PERFORMERS = [
  { rank: 1, symbol: "MSFT", name: "Microsoft Corp.",    perf: "+7.8%", positive: true  },
  { rank: 2, symbol: "AAPL", name: "Apple Inc.",         perf: "+5.4%", positive: true  },
  { rank: 3, symbol: "VTI",  name: "Vanguard Total ETF", perf: "+3.2%", positive: true  },
  { rank: 4, symbol: "NVDA", name: "NVIDIA Corp.",       perf: "+2.1%", positive: true  },
  { rank: 5, symbol: "TSLA", name: "Tesla, Inc.",        perf: "-1.8%", positive: false },
];

// ── Holdings preview (top 4 positions) ───────────────────────────────────
const HOLDINGS_PREVIEW = [
  { symbol: "AAPL", company: "Apple Inc.",               shares: 120, price: "$189.35", value: "$22,722.00", pl: "+$3,496.80", positive: true  },
  { symbol: "MSFT", company: "Microsoft Corp.",          shares: 80,  price: "$421.90", value: "$33,752.00", pl: "+$5,312.00", positive: true  },
  { symbol: "VTI",  company: "Vanguard Total Stock ETF", shares: 95,  price: "$273.10", value: "$25,944.50", pl: "+$2,308.50", positive: true  },
  { symbol: "TSLA", company: "Tesla, Inc.",              shares: 35,  price: "$172.65", value: "$6,042.75",  pl: "-$610.75",   positive: false },
];

// ── Rotating news stories ─────────────────────────────────────────────────
// Each story has a category badge, headline, source name, and relative time.
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

// ── Rotating News Card Component ─────────────────────────────────────────
// Shows one story at a time. Auto-advances every 5 seconds.
// Fade transition: fades out → swaps content → fades in.
// indexRef keeps the interval callback in sync with current index without staleness.
function RotatingNewsCard({ stories }) {
  const [index, setIndex]   = useState(0);
  const [fading, setFading] = useState(false);
  const indexRef            = useRef(0);

  // Navigate to a story by index with a smooth fade transition.
  function navigateTo(nextIdx) {
    setFading(true);
    setTimeout(() => {
      indexRef.current = nextIdx;
      setIndex(nextIdx);
      setFading(false);
    }, 280);
  }

  // Auto-advance: fires every 5 seconds, cleaned up on unmount.
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
      {/* Header: title + live indicator */}
      <div className="db-card-header">
        <h2 className="db-card-title">Market News</h2>
        <span className="db-news-live">&#9679; Live</span>
      </div>

      {/* Story body — opacity toggles produce the fade effect */}
      <div className={`db-news-body${fading ? " db-news-fading" : ""}`}>
        <span className="db-news-category">{story.category}</span>
        <p className="db-news-headline">{story.headline}</p>
        <div className="db-news-meta">
          <span className="db-news-source">{story.source}</span>
          <span className="db-news-time">{story.time}</span>
        </div>
      </div>

      {/* Dot indicators — one per story, active dot is purple */}
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

// ── Main Dashboard Export ─────────────────────────────────────────────────
// Dummy data for old names — kept so nothing below this line is removed accidentally.
const holdings = [
  {
    symbol: "AAPL",
    company: "Apple Inc.",
    shares: 120,
    currentPrice: "$189.35",
    costBasis: "$160.20",
    marketValue: "$22,722.00",
    pl: "+$3,496.80",
    positive: true,
  },
  {
    symbol: "MSFT",
    company: "Microsoft Corp.",
    shares: 80,
    currentPrice: "$421.90",
    costBasis: "$355.50",
    marketValue: "$33,752.00",
    pl: "+$5,312.00",
    positive: true,
  },
  {
    symbol: "VTI",
    company: "Vanguard Total Stock ETF",
    shares: 95,
    currentPrice: "$273.10",
    costBasis: "$248.80",
    marketValue: "$25,944.50",
    pl: "+$2,308.50",
    positive: true,
  },
  {
    symbol: "TSLA",
    company: "Tesla, Inc.",
    shares: 35,
    currentPrice: "$172.65",
    costBasis: "$190.10",
    marketValue: "$6,042.75",
    pl: "-$610.75",
    positive: false,
  },
];

// Leaderboard data for top stock performance in the portfolio.
const leaderboard = [
  { rank: 1, symbol: "MSFT", performance: "+7.8%", positive: true },
  { rank: 2, symbol: "AAPL", performance: "+5.4%", positive: true },
  { rank: 3, symbol: "VTI", performance: "+3.2%", positive: true },
];

// Compact market headlines for the square news card.
const marketNews = [
  { id: 1, headline: "Tech stocks rise as rates outlook improves", time: "10m ago" },
  { id: 2, headline: "Energy sector mixed after inventory report", time: "34m ago" },
  { id: 3, headline: "S&P 500 edges higher in midday trading", time: "1h ago" },
];

export default function Dashboard({ userName = "Steve" }) {
  return (
    <div className="db-page">
      <AppTopBar />
      <AppSidebar />

      {/* Main content — app-page-main handles sidebar + topbar offset */}
      <main className="db-main app-page-main">

        {/* Welcome strip — plain text, no card, no border */}
        <div className="db-welcome">
          <h1 className="db-welcome-title">Good morning, {userName}</h1>
          <p className="db-welcome-sub">
            Monday, 20 April 2026&ensp;&middot;&ensp;Portfolio is performing above benchmark.
          </p>
        </div>

        {/* KPI Summary Row */}
        <div className="db-summary-row">
          {SUMMARY_STATS.map((stat) => (
            <div className="card db-kpi-card" key={stat.label}>
              <span className="db-kpi-label">{stat.label}</span>
              <span className={`db-kpi-value${stat.positive ? " db-positive" : ""}`}>
                {stat.value}
              </span>
              <span className="db-kpi-sub">{stat.sub}</span>
            </div>
          ))}
        </div>

        {/* Main grid: Performance chart left, Top Performers right */}
        <div className="db-grid-main">
          <article className="card db-perf-card">
            <div className="db-card-header">
              <h2 className="db-card-title">Portfolio Performance</h2>
              <div className="db-period-tabs" role="group" aria-label="Chart time period">
                {["1M", "3M", "6M", "1Y", "All"].map((p) => (
                  <button key={p} type="button" className={`db-period-btn${p === "1Y" ? " active" : ""}`}>
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="db-chart-area">
              <svg viewBox="0 0 560 120" className="db-chart-svg" aria-label="Asset class performance" role="img">
                <line x1="0" y1="20"  x2="560" y2="20"  stroke="#eaedf3" strokeWidth="1" />
                <line x1="0" y1="60"  x2="560" y2="60"  stroke="#eaedf3" strokeWidth="1" />
                <line x1="0" y1="100" x2="560" y2="100" stroke="#eaedf3" strokeWidth="1" />
                <polyline points="0,98 70,84 140,72 210,58 280,44 350,32 430,20 560,10"
                  fill="none" stroke="#5548c8" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />
                <polyline points="0,102 70,96 140,90 210,84 280,76 350,70 430,64 560,58"
                  fill="none" stroke="#9b91e8" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
                <polyline points="0,106 70,112 140,94 210,102 280,80 350,88 430,64 560,48"
                  fill="none" stroke="#2ea87a" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
                <polyline points="0,108 70,107 140,106 210,105 280,104 350,103 430,102 560,101"
                  fill="none" stroke="#a0a8b8" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round"
                  strokeDasharray="4 3" />
              </svg>
              <div className="db-chart-legend">
                <span className="db-legend-chip db-lc-stocks">Stocks</span>
                <span className="db-legend-chip db-lc-bonds">Bonds</span>
                <span className="db-legend-chip db-lc-crypto">Crypto</span>
                <span className="db-legend-chip db-lc-cash">Cash</span>
              </div>
            </div>

            <div className="db-asset-row">
              {ASSET_STATS.map((a) => (
                <div className="db-asset-cell" key={a.label}>
                  <span className={`db-asset-dot ${a.dotClass}`} />
                  <span className="db-asset-label">{a.label}</span>
                  <span className="db-asset-value">{a.value}</span>
                </div>
              ))}
            </div>
          </article>

          <article className="card db-performers-card">
            <h2 className="db-card-title">Top Equity Performers</h2>
            <div className="db-performers-list">
              {TOP_PERFORMERS.map((p) => (
                <div className="db-performer-row" key={p.symbol}>
                  <span className="db-performer-rank">#{p.rank}</span>
                  <div className="db-performer-info">
                    <span className="db-performer-symbol">{p.symbol}</span>
                    <span className="db-performer-name">{p.name}</span>
                  </div>
                  <span className={`db-performer-perf${p.positive ? " db-positive" : " db-negative"}`}>
                    {p.positive ? "▲" : "▼"}&thinsp;{p.perf}
                  </span>
                </div>
              ))}
            </div>
          </article>
        </div>

        {/* Lower grid: Holdings preview left, Rotating news right */}
        <div className="db-grid-lower">
          <section className="card db-holdings-card">
            <div className="db-card-header">
              <h2 className="db-card-title">Holdings Overview</h2>
              <a href="/holdings" className="db-view-all">View all →</a>
            </div>
            <div className="db-table-wrap">
              <table className="db-table">
                <thead>
                  <tr>
                    <th>Symbol</th>
                    <th>Company</th>
                    <th>Shares</th>
                    <th>Price</th>
                    <th>Market Value</th>
                    <th>P / L</th>
                  </tr>
                </thead>
                <tbody>
                  {HOLDINGS_PREVIEW.map((h) => (
                    <tr key={h.symbol}>
                      <td><strong>{h.symbol}</strong></td>
                      <td className="db-company-cell">{h.company}</td>
                      <td>{h.shares}</td>
                      <td>{h.price}</td>
                      <td>{h.value}</td>
                      <td className={h.positive ? "db-positive" : "db-negative"}>{h.pl}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <RotatingNewsCard stories={NEWS_STORIES} />
        </div>

      </main>
    </div>
  );
}