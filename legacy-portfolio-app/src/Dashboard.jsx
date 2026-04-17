import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './Dashboard.css';

import Header from './components/Header';
import Sidebar from './components/Sidebar';
import SummaryCard from './components/SummaryCard';
import PerformanceChart from './components/PerformanceChart';
import HoldingsTable from './components/HoldingsTable';
import WatchlistPanel from './components/WatchlistPanel';
import NewsCarousel from './components/NewsCarousel';

const SUMMARY_DATA = [
  { label: 'Day Change',      value: '+£3,842.18',  detail: '+1.86%',             trend: 'positive' },
  { label: 'YTD Return',      value: '+£28,440.67', detail: '+12.48% since Jan',  trend: 'positive' },
  { label: 'Total Invested',  value: '£108,042.07', detail: 'Across 4 positions', trend: 'neutral'  },
  { label: 'Risk Level',      value: 'Moderate',    detail: 'Diversified',        trend: 'neutral'  },
];

const ALLOCATIONS = [
  { label: 'Technology',   fill: 'tech-fill',     pct: 26 },
  { label: 'Consumer',     fill: 'consumer-fill', pct: 20 },
  { label: 'Finance',      fill: 'finance-fill',  pct: 21 },
  { label: 'Healthcare',   fill: 'health-fill',   pct: 22 },
  { label: 'Cash & Other', fill: 'cash-fill',     pct: 11 },
];

const ACTIVITY = [
  { title: 'Bought 45 ULVR',    meta: 'Market order',  time: 'Today, 09:32'     },
  { title: 'Sold 200 SHEL',     meta: 'Limit order',   time: 'Yesterday, 14:11' },
  { title: 'Dividend received', meta: 'AstraZeneca',   time: '14 Apr'           },
  { title: 'Added funds',       meta: 'Bank transfer', time: '10 Apr'           },
];

function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();

  // Controls whether the left sidebar is collapsed or expanded
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Example summary data shown in the sticky top header and overview cards
  const portfolioSummary = {
    totalValue: "£128,452.76",
    availableBalance: "£14,820.00",
    dailyChange: "+£1,284.12",
    dailyChangePercent: "+1.01%",
    lastUpdated: "17 Apr 2026, 11:24 AM",
  };

  // Example holdings data for the main holdings table
  const holdings = [
    {
      symbol: "AAPL",
      company: "Apple Inc.",
      shares: 32,
      avgPrice: "£142.10",
      currentPrice: "£151.48",
      marketValue: "£4,847.36",
      change: "+6.60%",
      positive: true,
    },
    {
      symbol: "MSFT",
      company: "Microsoft Corp.",
      shares: 18,
      avgPrice: "£298.45",
      currentPrice: "£312.20",
      marketValue: "£5,619.60",
      change: "+4.61%",
      positive: true,
    },
    {
      symbol: "NVDA",
      company: "NVIDIA Corp.",
      shares: 14,
      avgPrice: "£724.30",
      currentPrice: "£702.90",
      marketValue: "£9,840.60",
      change: "-2.95%",
      positive: false,
    },
    {
      symbol: "V",
      company: "Visa Inc.",
      shares: 20,
      avgPrice: "£226.50",
      currentPrice: "£232.10",
      marketValue: "£4,642.00",
      change: "+2.47%",
      positive: true,
    },
  ];

  // Example watchlist data for the right-hand side panel
  const watchlistMovers = [
    { symbol: "TSLA", price: "£168.44", move: "+4.82%", positive: true },
    { symbol: "AMZN", price: "£142.18", move: "+2.14%", positive: true },
    { symbol: "META", price: "£391.60", move: "-1.43%", positive: false },
    { symbol: "NFLX", price: "£478.25", move: "+3.07%", positive: true },
    { symbol: "GOOGL", price: "£132.91", move: "-0.94%", positive: false },
  ];

  // Example news data for holdings-related stories
  const newsItems = [
    {
      source: "Financial Times",
      time: "2 hours ago",
      title: "Apple expands enterprise AI partnerships as cloud demand grows",
      summary:
        "Apple shares moved higher after reports of expanded AI-led enterprise collaboration and stronger institutional demand.",
    },
    {
      source: "Bloomberg",
      time: "4 hours ago",
      title: "Microsoft earnings outlook lifts sentiment across large-cap tech",
      summary:
        "Investors responded positively to cloud margin resilience and stronger forward guidance across core business units.",
    },
    {
      source: "Reuters",
      time: "6 hours ago",
      title: "NVIDIA faces short-term volatility as chip supply expectations reset",
      summary:
        "Analysts remain constructive on long-term growth, although near-term supply assumptions created some price pressure.",
    },
  ];

  // Sidebar navigation items
  const navItems = [
    { label: "Dashboard", path: "/dashboard" },
    { label: "Holdings Performance", path: null },
    { label: "Buy and Sell", path: null },
    { label: "Transaction History", path: "/transactions" },
    { label: "Settings", path: null },
    { label: "Sign Out", path: "/" },
  ];

  return (
    <div className="app-shell">
      {/* Sticky top utility header */}
      <header className="top-header">
        <div className="header-left">
          <div className="brand-logo">LEGACY</div>
        </div>

        <div className="header-right">
          <div className="header-metric">
            <span className="metric-label">Total Portfolio Value</span>
            <span className="metric-value">{portfolioSummary.totalValue}</span>
          </div>

          <div className="header-metric">
            <span className="metric-label">Available Balance</span>
            <span className="metric-value">
              {portfolioSummary.availableBalance}
            </span>
          </div>

          <button className="add-funds-button">Add Funds</button>

          <div className="header-updated">
            <span className="metric-label">Last Updated</span>
            <span className="updated-time">{portfolioSummary.lastUpdated}</span>
          </div>
        </div>
      </header>

      {/* Main dashboard layout */}
      <div className="dashboard-layout">
        {/* Left sidebar */}
        <aside
          className={`sidebar ${sidebarCollapsed ? "collapsed" : "expanded"}`}
        >
          <div className="sidebar-top">
            <button
              className="sidebar-toggle"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              aria-label="Toggle sidebar"
            >
              {sidebarCollapsed ? "☰" : "←"}
            </button>
          </div>

          <nav className="sidebar-nav">
            {navItems.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => item.path && navigate(item.path)}
                className={`sidebar-link ${location.pathname === item.path ? "active" : ""}`}
              >
                <span className="sidebar-icon">•</span>
                {!sidebarCollapsed && (
                  <span className="sidebar-text">{item.label}</span>
                )}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main content column */}
        <main className="main-content">
          {/* Top overview cards */}
          <section className="summary-grid">
            <article className="card summary-card">
              <p className="section-kicker">Portfolio Overview</p>
              <h2 className="section-title">Current Position</h2>
              <div className="summary-main-value">
                {portfolioSummary.totalValue}
              </div>
              <div className="summary-change positive">
                {portfolioSummary.dailyChange} ({portfolioSummary.dailyChangePercent}) today
              </div>
            </article>

            <article className="card summary-card">
              <p className="section-kicker">Cash Position</p>
              <h2 className="section-title">Available to Invest</h2>
              <div className="summary-main-value">
                {portfolioSummary.availableBalance}
              </div>
              <p className="supporting-text">
                Available balance for new trades, recurring investments, or
                withdrawals.
              </p>
            </article>

            <article className="card summary-card">
              <p className="section-kicker">Asset Allocation</p>
              <h2 className="section-title">Diversification Snapshot</h2>

              <div className="allocation-bars">
                <div className="allocation-row">
                  <span>Equities</span>
                  <div className="allocation-track">
                    <div className="allocation-fill equities"></div>
                  </div>
                  <span>68%</span>
                </div>

                <div className="allocation-row">
                  <span>ETFs</span>
                  <div className="allocation-track">
                    <div className="allocation-fill etfs"></div>
                  </div>
                  <span>19%</span>
                </div>

                <div className="allocation-row">
                  <span>Cash</span>
                  <div className="allocation-track">
                    <div className="allocation-fill cash"></div>
                  </div>
                  <span>13%</span>
                </div>
              </div>
            </article>
          </section>

          {/* Portfolio performance */}
          <section className="card performance-card">
            <div className="card-header">
              <div>
                <p className="section-kicker">Portfolio Performance</p>
                <h2 className="section-title">Value Trend</h2>
              </div>

              <div className="time-filter-group">
                <button className="time-filter active">1D</button>
                <button className="time-filter">1W</button>
                <button className="time-filter">1M</button>
                <button className="time-filter">1Y</button>
              </div>
            </div>

            {/* Beginner-friendly visual chart placeholder */}
            <div className="chart-placeholder">
              <div className="chart-grid-lines">
                <span></span>
                <span></span>
                <span></span>
                <span></span>
              </div>

              <div className="fake-chart-line">
                <div className="point p1"></div>
                <div className="point p2"></div>
                <div className="point p3"></div>
                <div className="point p4"></div>
                <div className="point p5"></div>
                <div className="point p6"></div>
                <div className="point p7"></div>
              </div>

              <div className="chart-x-axis">
                <span>09:00</span>
                <span>10:30</span>
                <span>12:00</span>
                <span>13:30</span>
                <span>15:00</span>
                <span>16:30</span>
                <span>Close</span>
              </div>
            </div>
          </section>

          {/* Holdings overview table */}
          <section className="card holdings-card">
            <div className="card-header">
              <div>
                <p className="section-kicker">Holdings Overview</p>
                <h2 className="section-title">Current Positions</h2>
              </div>

              <button className="secondary-button">View All Holdings</button>
            </div>

            <div className="table-wrapper">
              <table className="holdings-table">
                <thead>
                  <tr>
                    <th>Symbol</th>
                    <th>Company</th>
                    <th>Shares</th>
                    <th>Avg. Price</th>
                    <th>Current Price</th>
                    <th>Market Value</th>
                    <th>Change</th>
                  </tr>
                </thead>
                <tbody>
                  {holdings.map((holding) => (
                    <tr key={holding.symbol}>
                      <td className="ticker-cell">{holding.symbol}</td>
                      <td>{holding.company}</td>
                      <td>{holding.shares}</td>
                      <td>{holding.avgPrice}</td>
                      <td>{holding.currentPrice}</td>
                      <td>{holding.marketValue}</td>
                      <td
                        className={holding.positive ? "positive" : "negative"}
                      >
                        {holding.change}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </main>

        {/* Right side column */}
        <aside className="right-panel">
          <section className="card side-card">
            <div className="card-header side-header">
              <div>
                <p className="section-kicker">Watchlist Movers</p>
                <h2 className="section-title">Market Watch</h2>
              </div>
            </div>

            <div className="watchlist-list">
              {watchlistMovers.map((stock) => (
                <div className="watchlist-item" key={stock.symbol}>
                  <div>
                    <div className="watchlist-symbol">{stock.symbol}</div>
                    <div className="watchlist-price">{stock.price}</div>
                  </div>
                  <div className={stock.positive ? "positive" : "negative"}>
                    {stock.move}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="card side-card">
            <div className="card-header side-header">
              <div>
                <p className="section-kicker">Holdings News</p>
                <h2 className="section-title">Latest Stories</h2>
              </div>
            </div>

            {/* Manual carousel-style structure */}
            <div className="news-carousel">
              <div className="news-track">
                {newsItems.map((news, index) => (
                  <article className="news-card" key={index}>
                    <div className="news-meta">
                      <span>{news.source}</span>
                      <span>{news.time}</span>
                    </div>
                    <h3 className="news-title">{news.title}</h3>
                    <p className="news-summary">{news.summary}</p>
                    <button className="text-button">Read Story</button>
                  </article>
                ))}
              </div>
            </div>

            <div className="carousel-controls">
              <button className="carousel-button">←</button>
              <div className="carousel-dots">
                <span className="dot active"></span>
                <span className="dot"></span>
                <span className="dot"></span>
              </div>
              <button className="carousel-button">→</button>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

export default Dashboard;