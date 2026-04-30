import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "./Holdings.css";
import "./components/QuantumOptimizer.css";
import AppSidebar from "./components/AppSidebar";
import AppTopBar from "./components/AppTopBar";
import AppContentLayout from "./components/AppContentLayout";
import PageHeader from "./components/PageHeader";
import PortfolioAllocationChart from "./components/PortfolioAllocationChart";
import QuantumOptimizerCard from "./components/QuantumOptimizerCard";
import OptimizationResultsPanel from "./components/OptimizationResultsPanel";
import { formatCurrency, formatPercent, usePortfolioData } from "./services/holdingsData";
import { runQuantumOptimization } from "./services/quantumService";

export default function Holdings() {
  const PAGE_SIZE = 10;
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const {
    holdings,
    totals,
    ensureLivePrices,
    portfolioSummary,
    allocationBreakdown,
  } = usePortfolioData();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [optimizerForm, setOptimizerForm] = useState({
    riskTolerance: "medium",
    targetObjective: "balanced",
    maxHoldings: 5,
    cashAvailable: 0,
  });
  const [optimizerExpanded, setOptimizerExpanded] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState(null);
  const [optimizationLoading, setOptimizationLoading] = useState(false);
  const [optimizationError, setOptimizationError] = useState("");
  const selectedCategory = (searchParams.get("category") || "stocks").toLowerCase();

  useEffect(() => {
    ensureLivePrices(undefined, { includeBackendFallback: true });
  }, [ensureLivePrices]);

  useEffect(() => {
    setOptimizerForm((previous) => {
      if (previous.cashAvailable === totals.availableFunds) {
        return previous;
      }

      return {
        ...previous,
        cashAvailable: totals.availableFunds,
      };
    });
  }, [totals.availableFunds]);

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

  const handleOptimizerInputChange = (event) => {
    const { name, value } = event.target;
    setOptimizerForm((previous) => ({
      ...previous,
      [name]: name === "maxHoldings" || name === "cashAvailable" ? Number(value) : value,
    }));
  };

  const handleRunOptimization = async (event) => {
    event.preventDefault();
    setOptimizationLoading(true);
    setOptimizationError("");

    try {
      const response = await runQuantumOptimization({
        riskTolerance: optimizerForm.riskTolerance,
        targetObjective: optimizerForm.targetObjective,
        maxHoldings: Math.max(1, Number(optimizerForm.maxHoldings) || 1),
        cashAvailable: Math.max(0, Number(optimizerForm.cashAvailable) || 0),
      });
      setOptimizationResult(response);
    } catch (error) {
      const apiMessage = error?.response?.data?.message;
      setOptimizationError(apiMessage || "Optimization failed. Please try again.");
      setOptimizationResult(null);
    } finally {
      setOptimizationLoading(false);
    }
  };

  const focusOptimizer = () => {
    setOptimizerExpanded(true);
  };

  return (
    <div className="holdings-page">
      <AppTopBar />
      <AppSidebar />

      <AppContentLayout shellClassName="holdings-shell">
          <PageHeader
            title="Holdings"
            actions={(
              <>
                <button
                  type="button"
                  className="holdings-add-stock-btn"
                  onClick={() => navigate("/buy-sell")}
                >
                  Add Stocks
                </button>

                <button type="button" className="holdings-quantum-btn" onClick={focusOptimizer}>
                  Open Quantum Optimizer
                </button>
              </>
            )}
          />

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
                  <h2 className="app-section-title">Feature coming soon</h2>
                </div>
              </article>
            ) : (
              <>
                {/* Left column (≈68%): primary holdings table container. */}
                <article className="table-card">
                  <div className="table-header">
                    <h2 className="app-section-title">Your Holdings</h2>
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
                    subtitle=""
                    allocations={allocationBreakdown}
                    totalValue={totals.holdingsMarketValue}
                    showCenter={false}
                    emptyMessage="No holdings available for allocation yet."
                  />
                </aside>
              </>
            )}
          </section>

          {!showingPlaceholder && optimizerExpanded && (
            <div className="holdings-optimizer-modal-backdrop" onClick={() => setOptimizerExpanded(false)}>
              <section
                className="holdings-optimizer-modal"
                role="dialog"
                aria-modal="true"
                aria-label="Quantum Optimizer"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="holdings-optimizer-modal-header">
                  <h2 className="app-section-title">Quantum Optimizer</h2>
                  <button
                    type="button"
                    className="holdings-optimizer-modal-close"
                    onClick={() => setOptimizerExpanded(false)}
                    aria-label="Close Quantum Optimizer"
                  >
                    ×
                  </button>
                </div>

                <section className="quantum-section">
                  <QuantumOptimizerCard
                    formValues={optimizerForm}
                    onChange={handleOptimizerInputChange}
                    onSubmit={handleRunOptimization}
                    loading={optimizationLoading}
                  />

                  <OptimizationResultsPanel
                    loading={optimizationLoading}
                    error={optimizationError}
                    result={optimizationResult}
                  />
                </section>
              </section>
            </div>
          )}
      </AppContentLayout>
    </div>
  );
}
