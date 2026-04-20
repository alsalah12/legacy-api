import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import "./Holdings.css";
import AppSidebar from "./components/AppSidebar";
import AppTopBar from "./components/AppTopBar";
import PortfolioAllocationChart from "./components/PortfolioAllocationChart";
import { formatCurrency, formatPercent, usePortfolioData } from "./services/holdingsData";

export default function Holdings() {
  const PAGE_SIZE = 10;
  const [searchParams, setSearchParams] = useSearchParams();

  const {
    holdings,
    loading,
    fallbackMessage,
    livePriceWarning,
    totals,
    ensureLivePrices,
    portfolioSummary,
    allocationBreakdown,
  } = usePortfolioData();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const selectedCategory = (searchParams.get("category") || "stocks").toLowerCase();

  useEffect(() => {
    ensureLivePrices(undefined, { includeBackendFallback: true });
  }, [ensureLivePrices]);

  const filteredHoldings = useMemo(() => {
    if (!searchTerm.trim()) return holdings;
    const query = searchTerm.toLowerCase();
    return holdings.filter(
      (holding) =>
        holding.name.toLowerCase().includes(query) ||
        holding.symbol.toLowerCase().includes(query) ||
        holding.sector.toLowerCase().includes(query)
    );
  }, [holdings, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredHoldings.length / PAGE_SIZE));

  useEffect(() => {
    setCurrentPage((previous) => Math.min(previous, totalPages));
  }, [totalPages]);

  const paginatedRows = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return filteredHoldings.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredHoldings, currentPage]);

  const rangeStart = filteredHoldings.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(currentPage * PAGE_SIZE, filteredHoldings.length);
  const showingPlaceholder = selectedCategory !== "stocks";

  return (
    <div className="holdings-page">
      <AppTopBar />
      <AppSidebar />

      <main className="main-content app-page-main">
        <div className="holdings-shell">
          <header className="topbar">
            <h1>Holdings</h1>

            {/* Premium feature-action button requested for optimisation workflow entry point. */}
            <button type="button" className="holdings-quantum-btn">
              Quantum Portfolio Optimisation
            </button>
          </header>

          {/* This mirrors the sidebar category list inside the page content for clearer handoff on smaller screens. */}
          <div className="holdings-subnav" aria-label="Holdings categories">
            {[
              { label: "Stocks", value: "stocks" },
              { label: "Bonds", value: "bonds" },
              { label: "Crypto", value: "crypto" },
            ].map((category) => (
              <button
                key={category.value}
                type="button"
                className={`holdings-subnav-btn ${selectedCategory === category.value ? "active" : ""}`}
                onClick={() => setSearchParams({ category: category.value })}
              >
                {category.label}
              </button>
            ))}
          </div>

          {(loading || fallbackMessage || livePriceWarning) && (
            <div className="status-stack" aria-live="polite">
              {loading && <p className="subtitle status-pill">Loading holdings...</p>}
              {fallbackMessage && <p className="subtitle status-pill">{fallbackMessage}</p>}
              {livePriceWarning && <p className="subtitle status-pill status-pill-warning">{livePriceWarning}</p>}
            </div>
          )}

          {!showingPlaceholder && (
            <div className="table-actions" aria-label="Holdings search controls">
              <input
                type="text"
                className="action-input"
                placeholder="Search by name, symbol, or sector"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
          )}

          {!showingPlaceholder && (
            <section className="summary-grid">
              <article className="metric-card">
                <span className="metric-label">Total Value</span>
                <strong className="metric-value">{formatCurrency(portfolioSummary.totalValue)}</strong>
                <span className="metric-sub">Holdings + available cash</span>
              </article>
              <article className="metric-card">
                <span className="metric-label">Today’s Gain</span>
                <strong className={`metric-value ${portfolioSummary.todayGainValue > 0 ? "positive-text" : portfolioSummary.todayGainValue < 0 ? "negative-text" : ""}`}>
                  {formatCurrency(portfolioSummary.todayGainValue)}
                </strong>
                <span className="metric-sub">
                  {portfolioSummary.todayGainAvailable ? formatPercent(portfolioSummary.todayGainPercent) : "Awaiting market history"}
                </span>
              </article>
              <article className="metric-card">
                <span className="metric-label">Total Gain</span>
                <strong className={`metric-value ${portfolioSummary.totalGainValue > 0 ? "positive-text" : portfolioSummary.totalGainValue < 0 ? "negative-text" : ""}`}>
                  {formatCurrency(portfolioSummary.totalGainValue)}
                </strong>
                <span className="metric-sub">{formatPercent(portfolioSummary.totalGainPercent)}</span>
              </article>
            </section>
          )}

          <section className={`content-grid ${showingPlaceholder ? "single-column" : "two-column"}`}>
            {showingPlaceholder ? (
              <article className="table-card holdings-placeholder-card">
                {/* Bonds and crypto are intentionally stubbed until backend-backed data exists. */}
                <div className="holdings-placeholder">
                  <span className="holdings-placeholder-eyebrow">{selectedCategory}</span>
                  <h2>Feature coming soon</h2>
                  <p>
                    {selectedCategory === "bonds"
                      ? "Bond holdings are not wired into the backend yet."
                      : "Crypto holdings are not wired into the backend yet."}
                  </p>
                </div>
              </article>
            ) : (
              <>
                {/* Left column (≈68%): primary holdings table container. */}
                <article className="table-card">
                  <div className="table-header">
                    <h2>Your Holdings</h2>
                    <div className="table-header-actions">
                      <span>{filteredHoldings.length} positions</span>
                    </div>
                  </div>

                  <div className="table-wrapper">
                    <table>
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Symbol</th>
                          <th>Quantity Owned</th>
                          <th>Current Live Bid Price</th>
                          <th>Total Value</th>
                          <th>Total Invested</th>
                          <th>Profit / Loss</th>
                          <th>Profit / Loss %</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedRows.map((holding) => {
                          const isPositive = holding.profitLossValue > 0;
                          const isNegative = holding.profitLossValue < 0;

                          return (
                            <tr key={holding.id}>
                              <td>{holding.name}</td>
                              <td><strong>{holding.symbol}</strong></td>
                              <td className="number-cell">{holding.quantityOwned}</td>
                              <td>{formatCurrency(holding.currentBidPrice)}</td>
                              <td className="value-cell">{formatCurrency(holding.totalValue)}</td>
                              <td className="value-cell">{formatCurrency(holding.totalInvested)}</td>
                              <td className={`number-cell ${isPositive ? "positive-text" : isNegative ? "negative-text" : ""}`}>
                                {formatCurrency(holding.profitLossValue)}
                              </td>
                              <td className={`number-cell ${isPositive ? "positive-text" : isNegative ? "negative-text" : ""}`}>
                                {formatPercent(holding.profitLossPercent)}
                              </td>
                            </tr>
                          );
                        })}

                        {paginatedRows.length === 0 && (
                          <tr>
                            <td colSpan="8" className="empty-state">
                              No holdings data available.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="table-footer">
                    <span className="table-range">
                      {rangeStart}–{rangeEnd} of {filteredHoldings.length}
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

                {/* Right column (≈32%): allocation chart remains on Holdings page only. */}
                <aside className="holdings-allocation-section">
                  <PortfolioAllocationChart
                    title="Portfolio Allocation"
                    subtitle="Live allocation by holding value"
                    allocations={allocationBreakdown}
                    totalValue={totals.holdingsMarketValue}
                    centerLabel="Holdings Value"
                    emptyMessage="No holdings available for allocation yet."
                  />
                </aside>
              </>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
