// React hooks handle the lightweight filter and pagination state for this page.
import React, { useMemo, useState } from "react";
// Page-specific styles intentionally mirror the Transaction History screen.
import "./BuySell.css";
import AppSidebar from "./components/AppSidebar";
import AppTopBar from "./components/AppTopBar";
import { formatCurrency, formatPercent, usePortfolioData } from "./services/holdingsData";

// Small page size keeps the table compact and consistent with the reference page density.
const PAGE_SIZE = 4;

// Buy & Sell page reuses the same shell and visual rhythm as Transaction History.
export default function BuySell() {
  const {
    holdings: stocksToUse,
    totals,
    loading,
    fallbackMessage,
    livePriceWarning,
    actionMessage,
    actionError,
    ensureLivePrices,
    buyStock,
    sellStock,
  } = usePortfolioData();
  const [sectorFilter, setSectorFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  React.useEffect(() => {
    ensureLivePrices(undefined, { includeBackendFallback: true });
  }, [ensureLivePrices]);

  // Generate the sector dropdown options from the available stock list.
  const sectorOptions = useMemo(() => {
    return [
      "ALL",
      ...new Set(stocksToUse.map((stock) => stock.sector)),
    ];
  }, [stocksToUse]);

  // Filter the stock data based on search text and selected sector.
  const filteredStocks = useMemo(() => {
    let results = [...stocksToUse];

    if (sectorFilter !== "ALL") {
      results = results.filter((stock) => stock.sector === sectorFilter);
    }

    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();
      results = results.filter(
        (stock) =>
          stock.symbol.toLowerCase().includes(query) ||
          stock.name.toLowerCase().includes(query) ||
          stock.sector.toLowerCase().includes(query)
      );
    }

    return results;
  }, [sectorFilter, searchTerm, stocksToUse]);

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
        {/* Keep the heading compact so the table remains the visual focus. */}
        <header className="topbar">
          <div>
            <h1>Buy &amp; Sell Stocks</h1>
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
              onClick={() => ensureLivePrices(undefined, { forceRefresh: true, includeBackendFallback: true })}
            >
              Refresh live prices
            </button>
          </div>

          {/* Keep a single alert region directly under the available stocks controls. */}
          {(fallbackMessage || livePriceWarning || actionError || actionMessage || loading) && (
            <div className="status-stack" aria-live="polite">
              {fallbackMessage && <p className="subtitle status-pill">{fallbackMessage}</p>}
              {livePriceWarning && <p className="subtitle status-pill status-pill-warning">{livePriceWarning}</p>}
              {actionError && <p className="subtitle status-pill status-pill-error">{actionError}</p>}
              {!actionError && actionMessage && <p className="subtitle status-pill status-pill-success">{actionMessage}</p>}
              {loading && <p className="subtitle status-pill">Loading stocks...</p>}
            </div>
          )}

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
                  <tr key={stock.id || `${stock.symbol}-${index}`}>
                    <td>{(currentPage - 1) * PAGE_SIZE + index + 1}</td>
                    <td>
                      <div className="stock-cell">
                        <strong>{stock.symbol}</strong>
                        <span>{stock.name}</span>
                      </div>
                    </td>
                    <td>{formatCurrency(stock.currentBidPrice)}</td>
                    <td>
                      <span className={stock.profitLossPercent > 0 ? "positive-text" : stock.profitLossPercent < 0 ? "negative-text" : ""}>
                        {formatPercent(stock.profitLossPercent)}
                      </span>
                    </td>
                    <td>{stock.quantityOwned}</td>
                    <td>{stock.sector}</td>
                    <td>
                      <div className="action-group">
                        <button
                          type="button"
                          className="action-button buy-button"
                          onClick={async () => {
                            const rawQty = window.prompt(`Buy quantity for ${stock.symbol}:`);
                            if (rawQty === null) return;
                            await buyStock(stock.symbol, rawQty);
                          }}
                        >
                          Buy
                        </button>
                        <button
                          type="button"
                          className="action-button sell-button"
                          disabled={stock.quantityOwned === 0}
                          onClick={async () => {
                            const rawQty = window.prompt(`Sell quantity for ${stock.symbol}:`);
                            if (rawQty === null) return;
                            await sellStock(stock.symbol, rawQty);
                          }}
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
