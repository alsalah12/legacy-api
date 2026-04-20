// React keeps derived values predictable and easy to replace with API data later.
import React, { useEffect, useMemo, useState } from "react";
// Page styles mirror Transaction History spacing and card language.
import "./Holdings.css";
import AppSidebar from "./components/AppSidebar";
import AppTopBar from "./components/AppTopBar";

// Placeholder holdings rows (backend-ready structure).
const mockHoldings = [
  { id: 1, ticker: "AAPL", company: "Apple Inc.", shares: 120, averagePrice: 160.2, currentPrice: 189.35, assetClass: "Stocks" },
  { id: 2, ticker: "MSFT", company: "Microsoft Corp.", shares: 80, averagePrice: 355.5, currentPrice: 421.9, assetClass: "Stocks" },
  { id: 3, ticker: "BND", company: "Vanguard Total Bond ETF", shares: 140, averagePrice: 72.8, currentPrice: 74.15, assetClass: "Bonds" },
  { id: 4, ticker: "BTC", company: "Bitcoin", shares: 0.18, averagePrice: 61250, currentPrice: 68410, assetClass: "Crypto" },
  { id: 5, ticker: "VTI", company: "Vanguard Total Stock ETF", shares: 95, averagePrice: 248.8, currentPrice: 273.1, assetClass: "Stocks" },
];

// Allocation groups for donut + legend.
const allocationData = [
  { label: "Stocks", percentage: 63, colorClass: "allocation-stocks", stroke: "#cfdffc" },
  { label: "Bonds", percentage: 19, colorClass: "allocation-bonds", stroke: "#e4d3fb" },
  { label: "Crypto", percentage: 10, colorClass: "allocation-crypto", stroke: "#ccf3de" },
  { label: "Cash", percentage: 8, colorClass: "allocation-cash", stroke: "#dfe3ea" },
];

function formatCurrency(value) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: value >= 1000 ? 0 : 2,
    maximumFractionDigits: value >= 1000 ? 0 : 2,
  }).format(value);
}

function formatShares(value) {
  return Number.isInteger(value) ? value.toString() : value.toFixed(2);
}

export default function Holdings() {
  const COMPACT_PAGE_SIZE = 5;
  const FULL_PAGE_SIZE = 10;

  // Stateful holdings list so users can add and remove rows.
  const [holdingsRows, setHoldingsRows] = useState(mockHoldings);
  const [currentPage, setCurrentPage] = useState(1);
  const [isFullTableView, setIsFullTableView] = useState(false);

  // Simple controlled form for creating a new holding row.
  const [newHolding, setNewHolding] = useState({
    ticker: "",
    company: "",
    shares: "",
    averagePrice: "",
    currentPrice: "",
    assetClass: "Stocks",
  });

  const handleFieldChange = (field, value) => {
    setNewHolding((previous) => ({ ...previous, [field]: value }));
  };

  const handleAddStock = () => {
    const ticker = newHolding.ticker.trim().toUpperCase();
    const company = newHolding.company.trim();
    const shares = Number(newHolding.shares);
    const averagePrice = Number(newHolding.averagePrice);
    const currentPrice = Number(newHolding.currentPrice);

    if (!ticker || !company || shares <= 0 || averagePrice <= 0 || currentPrice <= 0) {
      window.alert("Please enter valid values for all stock fields.");
      return;
    }

    const newRow = {
      id: Date.now(),
      ticker,
      company,
      shares,
      averagePrice,
      currentPrice,
      assetClass: newHolding.assetClass,
    };

    setHoldingsRows((previous) => [newRow, ...previous]);
    setCurrentPage(1);

    setNewHolding({
      ticker: "",
      company: "",
      shares: "",
      averagePrice: "",
      currentPrice: "",
      assetClass: "Stocks",
    });
  };

  const handleDeleteStock = (id) => {
    const confirmed = window.confirm("Are you sure you want to delete this stock?");
    if (!confirmed) {
      return;
    }

    setHoldingsRows((previous) => previous.filter((row) => row.id !== id));
  };

  const handleToggleFullTableView = () => {
    setIsFullTableView((previous) => !previous);
    setCurrentPage(1);
  };

  // Build display rows and summary values from raw rows.
  const summary = useMemo(() => {
    const rows = holdingsRows.map((holding) => {
      const marketValue = holding.shares * holding.currentPrice;
      const costValue = holding.shares * holding.averagePrice;
      const gainLoss = marketValue - costValue;

      return { ...holding, marketValue, gainLoss };
    });

    const portfolioValue = rows.reduce((sum, row) => sum + row.marketValue, 0);
    const totalGain = rows.reduce((sum, row) => sum + row.gainLoss, 0);

    return {
      rows,
      portfolioValue,
      todaysGain: portfolioValue * 0.0064,
      totalGain,
      cashBalance: 12450,
      totalValue: portfolioValue,
    };
  }, [holdingsRows]);

  // Convert allocation percentages into SVG dash offsets for a clean non-gradient donut.
  const allocationSegments = useMemo(() => {
    const totalsByClass = summary.rows.reduce(
      (accumulator, row) => {
        const value = row.marketValue;

        if (row.assetClass === "Bonds") {
          accumulator.Bonds += value;
        } else if (row.assetClass === "Crypto") {
          accumulator.Crypto += value;
        } else {
          accumulator.Stocks += value;
        }

        return accumulator;
      },
      { Stocks: 0, Bonds: 0, Crypto: 0 }
    );

    const cashValue = summary.cashBalance;
    const grandTotal = totalsByClass.Stocks + totalsByClass.Bonds + totalsByClass.Crypto + cashValue;

    const dynamicAllocation = allocationData.map((item) => {
      const rawValue = item.label === "Cash" ? cashValue : totalsByClass[item.label] || 0;
      return {
        ...item,
        percentage: grandTotal > 0 ? Math.max(1, Math.round((rawValue / grandTotal) * 100)) : item.percentage,
      };
    });

    const adjustedTotal = dynamicAllocation.reduce((sum, item) => sum + item.percentage, 0);
    if (adjustedTotal !== 100) {
      dynamicAllocation[0].percentage += 100 - adjustedTotal;
    }

    let offset = 0;

    return dynamicAllocation.map((item) => {
      const segment = {
        ...item,
        dashArray: `${item.percentage} ${100 - item.percentage}`,
        dashOffset: `${-offset}`,
      };

      offset += item.percentage;
      return segment;
    });
  }, [summary.rows, summary.cashBalance]);

  const metrics = [
    { label: "Portfolio Value", value: formatCurrency(summary.portfolioValue), tone: "default" },
    { label: "Today’s Gain", value: `+${formatCurrency(summary.todaysGain)}`, tone: "positive" },
    {
      label: "Total Gain",
      value: `${summary.totalGain >= 0 ? "+" : ""}${formatCurrency(summary.totalGain)}`,
      tone: summary.totalGain >= 0 ? "positive" : "negative",
    },
    { label: "Cash Balance", value: formatCurrency(summary.cashBalance), tone: "default" },
  ];

  // Pagination keeps the compact screen clean when row count grows.
  const pageSize = isFullTableView ? FULL_PAGE_SIZE : COMPACT_PAGE_SIZE;
  const totalPages = Math.max(1, Math.ceil(summary.rows.length / pageSize));

  useEffect(() => {
    setCurrentPage((previous) => Math.min(previous, totalPages));
  }, [totalPages]);

  const paginatedRows = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return summary.rows.slice(startIndex, startIndex + pageSize);
  }, [summary.rows, currentPage, pageSize]);

  const rangeStart = summary.rows.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const rangeEnd = Math.min(currentPage * pageSize, summary.rows.length);

  return (
    <div className="holdings-page">
      <AppTopBar />
      <AppSidebar />

      <main className="main-content app-page-main">
        <div className={`holdings-shell ${isFullTableView ? "full-table-mode" : ""}`}>
          <header className="topbar">
            <h1>Holdings</h1>
          </header>

          {!isFullTableView && (
            <section className="summary-grid">
              {metrics.map((item) => (
                <article className="metric-card" key={item.label}>
                  <span className="metric-label">{item.label}</span>
                  <strong className={`metric-value ${item.tone !== "default" ? `${item.tone}-text` : ""}`}>
                    {item.value}
                  </strong>
                </article>
              ))}
            </section>
          )}

          <section className={`content-grid ${isFullTableView ? "single-column" : ""}`}>
            <article className="table-card">
              <div className="table-header">
                <h2>Your Holdings</h2>
                <div className="table-header-actions">
                  <span>{summary.rows.length} positions</span>
                  <button type="button" className="view-mode-btn" onClick={handleToggleFullTableView}>
                    {isFullTableView ? "Exit Full Page" : "View Full Page"}
                  </button>
                </div>
              </div>

              {/* Working controls for adding new stocks to the holdings table. */}
              <div className="table-actions" aria-label="Add stock controls">
                <input
                  type="text"
                  placeholder="Ticker"
                  value={newHolding.ticker}
                  onChange={(event) => handleFieldChange("ticker", event.target.value)}
                  className="action-input"
                />
                <input
                  type="text"
                  placeholder="Company"
                  value={newHolding.company}
                  onChange={(event) => handleFieldChange("company", event.target.value)}
                  className="action-input"
                />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Shares"
                  value={newHolding.shares}
                  onChange={(event) => handleFieldChange("shares", event.target.value)}
                  className="action-input"
                />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Avg"
                  value={newHolding.averagePrice}
                  onChange={(event) => handleFieldChange("averagePrice", event.target.value)}
                  className="action-input"
                />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Current"
                  value={newHolding.currentPrice}
                  onChange={(event) => handleFieldChange("currentPrice", event.target.value)}
                  className="action-input"
                />
                <select
                  value={newHolding.assetClass}
                  onChange={(event) => handleFieldChange("assetClass", event.target.value)}
                  className="action-select"
                >
                  <option value="Stocks">Stocks</option>
                  <option value="Bonds">Bonds</option>
                  <option value="Crypto">Crypto</option>
                </select>
                <button type="button" className="add-stock-btn" onClick={handleAddStock}>
                  Add Stock
                </button>
              </div>

              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Stock</th>
                      <th>Shares</th>
                      <th>Avg Price</th>
                      <th>Current Price</th>
                      <th>Gain / Loss</th>
                      <th>Value</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedRows.map((holding) => (
                      <tr key={holding.id}>
                        <td>
                          <div className="stock-cell">
                            <strong>{holding.ticker}</strong>
                            <span>{holding.company}</span>
                          </div>
                        </td>
                        <td className="number-cell">{formatShares(holding.shares)}</td>
                        <td className="number-cell">{formatCurrency(holding.averagePrice)}</td>
                        <td className="value-cell">{formatCurrency(holding.currentPrice)}</td>
                        <td className={`number-cell ${holding.gainLoss >= 0 ? "positive-text" : "negative-text"}`}>
                          {holding.gainLoss >= 0 ? "+" : ""}
                          {formatCurrency(holding.gainLoss)}
                        </td>
                        <td className="value-cell">{formatCurrency(holding.marketValue)}</td>
                        <td>
                          <button
                            type="button"
                            className="delete-stock-btn"
                            onClick={() => handleDeleteStock(holding.id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}

                    <tr className="total-row">
                      <td colSpan="5">Total</td>
                      <td className="value-cell">{formatCurrency(summary.totalValue)}</td>
                      <td />
                    </tr>

                    {paginatedRows.length === 0 && (
                      <tr>
                        <td colSpan="7" className="empty-state">
                          No holdings available.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="table-footer">
                <span className="table-range">
                  {rangeStart}–{rangeEnd} of {summary.rows.length}
                </span>

                <div className="pagination-controls">
                  <button
                    type="button"
                    className="pagination-btn"
                    onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </button>

                  <span className="pagination-page">Page {currentPage} of {totalPages}</span>

                  <button
                    type="button"
                    className="pagination-btn"
                    onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </button>
                </div>
              </div>
            </article>

            {!isFullTableView && (
              <aside className="allocation-card">
                <div className="allocation-header">
                  <h2>Allocation</h2>
                </div>

                <div className="allocation-body">
                  <div className="allocation-visual">
                    <div className="allocation-donut" aria-label="Portfolio allocation donut chart">
                      <svg viewBox="0 0 42 42" className="allocation-donut-svg" role="img">
                        <circle className="allocation-donut-track" cx="21" cy="21" r="15.9155" pathLength="100" />
                        <g transform="rotate(-90 21 21)">
                          {allocationSegments.map((segment) => (
                            <circle
                              key={segment.label}
                              className="allocation-donut-segment"
                              cx="21"
                              cy="21"
                              r="15.9155"
                              pathLength="100"
                              stroke={segment.stroke}
                              strokeDasharray={segment.dashArray}
                              strokeDashoffset={segment.dashOffset}
                            />
                          ))}
                        </g>
                      </svg>

                      <div className="allocation-hole">
                        <span className="allocation-center-label">Total</span>
                        <strong className="allocation-center-value">100%</strong>
                      </div>
                    </div>
                  </div>

                  <div className="allocation-legend">
                    {allocationSegments.map((item) => (
                      <div className="legend-row" key={item.label}>
                        <div className="legend-left">
                          <span className={`legend-dot ${item.colorClass}`} />
                          <span className="legend-label">{item.label}</span>
                        </div>
                        <strong className="legend-value">{item.percentage}%</strong>
                      </div>
                    ))}
                  </div>
                </div>
              </aside>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
