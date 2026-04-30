import React from "react";
import { formatCurrency, formatPercent } from "../services/holdingsData";
import AllocationComparisonChart from "./AllocationComparisonChart";

function metricPercent(value) {
  const numeric = Number(value) || 0;
  const sign = numeric > 0 ? "+" : "";
  return `${sign}${numeric.toFixed(2)}%`;
}

export default function OptimizationResultsPanel({ loading, error, result }) {
  return (
    <article className="quantum-results-card" aria-live="polite">
      <div className="quantum-results-header">
        <h3>Optimization Results</h3>
      </div>

      {loading && <div className="quantum-status quantum-status-loading">Running optimization model...</div>}
      {!loading && error && <div className="quantum-status quantum-status-error">{error}</div>}


      {!loading && !error && result && (
        <div className="quantum-results-body">
          <section className="quantum-kpi-grid">
            <div className="quantum-kpi-cell">
              <span>Current Portfolio Value</span>
              <strong>{formatCurrency(result.currentPortfolioValue)}</strong>
            </div>
            <div className="quantum-kpi-cell">
              <span>Optimized Portfolio Value</span>
              <strong>{formatCurrency(result.optimizedPortfolioValue)}</strong>
            </div>
            <div className="quantum-kpi-cell">
              <span>Expected Return</span>
              <strong className={(Number(result.expectedReturn) || 0) >= 0 ? "positive-text" : "negative-text"}>
                {metricPercent(result.expectedReturn)}
              </strong>
            </div>
            <div className="quantum-kpi-cell">
              <span>Expected Risk</span>
              <strong>{metricPercent(result.expectedRisk)}</strong>
            </div>
            <div className="quantum-kpi-cell">
              <span>Sharpe Ratio</span>
              <strong>{(Number(result.sharpeRatio) || 0).toFixed(2)}</strong>
            </div>
          </section>

          <section className="quantum-comparison-panel">
            <div className="quantum-comparison-head">
              <h4>Current vs Optimized Allocation</h4>
              <div className="quantum-comparison-legend">
                <span><i className="legend-chip current" /> Current</span>
                <span><i className="legend-chip optimized" /> Optimized</span>
              </div>
            </div>

            <AllocationComparisonChart
              currentAllocations={result.currentAllocations}
              optimizedAllocations={result.optimizedAllocations}
            />
          </section>

          <section className="quantum-reco-panel">
            <h4>Recommendations</h4>
            <div className="quantum-reco-table-wrap">
              <table className="quantum-reco-table">
                <thead>
                  <tr>
                    <th>Symbol</th>
                    <th>Action</th>
                    <th>Current Wt.</th>
                    <th>Target Wt.</th>
                    <th>Exp. Return</th>
                    <th>Risk</th>
                    <th>Score</th>
                  </tr>
                </thead>
                <tbody>
                  {(result.recommendations || []).map((item) => (
                    <tr key={item.symbol}>
                      <td>
                        <strong>{item.symbol}</strong>
                        <div className="quantum-company">{item.companyName}</div>
                      </td>
                      <td>
                        <span className={`quantum-action-pill action-${String(item.action || "").toLowerCase()}`}>
                          {item.action}
                        </span>
                      </td>
                      <td>{formatPercent(item.currentWeight)}</td>
                      <td>{formatPercent(item.targetWeight)}</td>
                      <td className={(Number(item.expectedReturn) || 0) >= 0 ? "positive-text" : "negative-text"}>
                        {metricPercent(item.expectedReturn)}
                      </td>
                      <td>{metricPercent(item.riskScore)}</td>
                      <td>{(Number(item.score) || 0).toFixed(4)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </article>
  );
}
