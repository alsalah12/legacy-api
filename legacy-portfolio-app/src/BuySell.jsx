// React hooks handle the lightweight filter and pagination state for this page.
import React, { useMemo, useState } from "react";
// Page-specific styles intentionally mirror the Transaction History screen.
import "./BuySell.css";
import AppSidebar from "./components/AppSidebar";
import AppTopBar from "./components/AppTopBar";

// Static placeholder stock data.
// This shape is easy to replace later with API data from a backend service.
const mockStocks = [
  {
    id: 1,
    ticker: "AAPL",
    company: "Apple Inc.",
    bidPrice: 189.35,
    performance: 2.4,
    owned: 120,
    sector: "Technology",
  },
  {
    id: 2,
    ticker: "MSFT",
    company: "Microsoft Corp.",
    bidPrice: 421.9,
    performance: 3.1,
    owned: 80,
    sector: "Technology",
  },
  {
    id: 3,
    ticker: "JPM",
    company: "JPMorgan Chase",
    bidPrice: 198.45,
    performance: -0.8,
    owned: 24,
    sector: "Financials",
  },
  {
    id: 4,
    ticker: "XOM",
    company: "Exxon Mobil",
    bidPrice: 116.72,
    performance: 1.2,
    owned: 0,
    sector: "Energy",
  },
  {
    id: 5,
    ticker: "NVDA",
    company: "NVIDIA",
    bidPrice: 906.55,
    performance: 4.9,
    owned: 16,
    sector: "Technology",
  },
  {
    id: 6,
    ticker: "PFE",
    company: "Pfizer",
    bidPrice: 27.14,
    performance: -1.1,
    owned: 44,
    sector: "Healthcare",
  },
  {
    id: 7,
    ticker: "KO",
    company: "Coca-Cola",
    bidPrice: 63.08,
    performance: 0.7,
    owned: 0,
    sector: "Consumer Staples",
  },
  {
    id: 8,
    ticker: "BA",
    company: "Boeing",
    bidPrice: 181.32,
    performance: -2.3,
    owned: 10,
    sector: "Industrials",
  },
];

// Small page size keeps the table compact and consistent with the reference page density.
const PAGE_SIZE = 4;

// Shared currency formatting helper.
function formatCurrency(value) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

// Small helper to render positive and negative performance values consistently.
function formatPerformance(value) {
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${value.toFixed(1)}%`;
}

// Buy & Sell page reuses the same shell and visual rhythm as Transaction History.
export default function BuySell() {
  // Filter state for the controls row.
  const [sectorFilter, setSectorFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [refreshTick, setRefreshTick] = useState(0);

  // Generate the sector dropdown options from the available stock list.
  const sectorOptions = useMemo(() => {
    return [
      "ALL",
      ...new Set(mockStocks.map((stock) => stock.sector)),
    ];
  }, []);

  // Filter the stock data based on search text and selected sector.
  const filteredStocks = useMemo(() => {
    let results = [...mockStocks];

    if (sectorFilter !== "ALL") {
      results = results.filter((stock) => stock.sector === sectorFilter);
    }

    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();
      results = results.filter(
        (stock) =>
          stock.ticker.toLowerCase().includes(query) ||
          stock.company.toLowerCase().includes(query) ||
          stock.sector.toLowerCase().includes(query)
      );
    }

    // refreshTick is included so the component can later re-request data.
    // For now it simply re-runs the memo with the current placeholder dataset.
    void refreshTick;

    return results;
  }, [sectorFilter, searchTerm, refreshTick]);

  // Total page count is derived from the filtered dataset.
  const totalPages = Math.max(1, Math.ceil(filteredStocks.length / PAGE_SIZE));

  // Clamp the current page whenever filters reduce the available results.
  React.useEffect(() => {
    setCurrentPage((previousPage) => Math.min(previousPage, totalPages));
  }, [totalPages]);

  // Slice the visible rows for the current page.
  const paginatedStocks = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return filteredStocks.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredStocks, currentPage]);

  // Footer text follows the same compact, utility-style language as the reference page.
  const rangeStart = filteredStocks.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(currentPage * PAGE_SIZE, filteredStocks.length);

  return (
    <div className="buy-sell-page">
      {/* Shared authenticated-page top navigation. */}
      <AppTopBar />

      {/* Shared sidebar keeps navigation identical to the reference screen. */}
      <AppSidebar />

      {/* Main content uses the same page shell pattern as Transaction History. */}
      <main className="main-content app-page-main">
        {/* Page heading follows the same hierarchy and spacing rhythm as the reference. */}
        <header className="topbar">
          <div>
            <h1>Buy &amp; Sell Stocks</h1>
            <p className="subtitle">Review available stocks and place buy or sell actions from one compact table.</p>
          </div>
        </header>

        {/* One main content card contains controls, table, and pagination. */}
        <section className="stocks-card">
          <div className="table-header">
            <h2>Available Stocks</h2>
            <span>{filteredStocks.length} results</span>
          </div>

          {/* Controls row mirrors the density and form sizing of Transaction History. */}
          <div className="controls-row">
            <select
              value={sectorFilter}
              onChange={(event) => setSectorFilter(event.target.value)}
              className="select-input"
            >
              {sectorOptions.map((sector) => (
                <option key={sector} value={sector}>
                  {sector === "ALL" ? "All Sectors" : sector}
                </option>
              ))}
            </select>

            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by ticker, company, or sector"
              className="search-input"
            />

            <button
              type="button"
              className="refresh-button"
              onClick={() => setRefreshTick((value) => value + 1)}
            >
              Refresh
            </button>
          </div>

          {/* Table wrapper preserves the same approach used on Transaction History. */}
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Stock</th>
                  <th>Bid Price</th>
                  <th>Performance</th>
                  <th>Owned</th>
                  <th>Sector</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {/* Rows are easy to replace later with API-fed stock data. */}
                {paginatedStocks.map((stock, index) => (
                  <tr key={stock.id}>
                    <td>{(currentPage - 1) * PAGE_SIZE + index + 1}</td>
                    <td>
                      <div className="stock-cell">
                        <strong>{stock.ticker}</strong>
                        <span>{stock.company}</span>
                      </div>
                    </td>
                    <td>{formatCurrency(stock.bidPrice)}</td>
                    <td>
                      <span className={stock.performance >= 0 ? "positive-text" : "negative-text"}>
                        {formatPerformance(stock.performance)}
                      </span>
                    </td>
                    <td>{stock.owned}</td>
                    <td>{stock.sector}</td>
                    <td>
                      <div className="action-group">
                        <button type="button" className="action-button buy-button">
                          Buy
                        </button>
                        <button
                          type="button"
                          className="action-button sell-button"
                          disabled={stock.owned === 0}
                        >
                          Sell
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {/* Empty state keeps the same compact message style as the reference page. */}
                {paginatedStocks.length === 0 && (
                  <tr>
                    <td colSpan="7" className="empty-state">
                      No stocks match your current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Footer actions mirror internal-product pagination patterns. */}
          <div className="table-footer">
            <span className="table-count">
              {rangeStart}–{rangeEnd} of {filteredStocks.length}
            </span>

            <div className="pagination-controls">
              <button
                type="button"
                className="pagination-button"
                onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <span className="page-indicator">
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                className="pagination-button"
                onClick={() => setCurrentPage((page) => Math.min(page + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
