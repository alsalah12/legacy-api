import React from "react";

export default function QuantumOptimizerCard({ formValues, onChange, onSubmit, loading }) {
  return (
    <article className="quantum-card" aria-label="Quantum Portfolio Optimizer">
      <div className="quantum-card-header">
        <h2>Quantum Portfolio Optimizer</h2>
      </div>

      <form className="quantum-form" onSubmit={onSubmit}>
        <label className="quantum-field">
          <span>Risk Tolerance</span>
          <select
            name="riskTolerance"
            value={formValues.riskTolerance}
            onChange={onChange}
            disabled={loading}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </label>

        <label className="quantum-field">
          <span>Target Objective</span>
          <select
            name="targetObjective"
            value={formValues.targetObjective}
            onChange={onChange}
            disabled={loading}
          >
            <option value="growth">Growth</option>
            <option value="balanced">Balanced</option>
            <option value="low-risk">Low-Risk</option>
          </select>
        </label>

        <label className="quantum-field">
          <span>Max Holdings</span>
          <input
            type="number"
            name="maxHoldings"
            min="1"
            step="1"
            value={formValues.maxHoldings}
            onChange={onChange}
            disabled={loading}
          />
        </label>

        <label className="quantum-field">
          <span>Cash Available</span>
          <input
            type="number"
            name="cashAvailable"
            min="0"
            step="0.01"
            value={formValues.cashAvailable}
            onChange={onChange}
            disabled={loading}
          />
        </label>

        <button type="submit" className="quantum-run-btn" disabled={loading}>
          {loading ? "Optimizing..." : "Run Optimization"}
        </button>
      </form>
    </article>
  );
}
