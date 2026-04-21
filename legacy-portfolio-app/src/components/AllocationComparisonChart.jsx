import React, { useMemo } from "react";
import { formatPercent } from "../services/holdingsData";

export default function AllocationComparisonChart({ currentAllocations = [], optimizedAllocations = [] }) {
  const rows = useMemo(() => {
    const optimizedBySymbol = new Map(
      optimizedAllocations.map((item) => [item.symbol, item])
    );

    return currentAllocations
      .map((current) => {
        const optimized = optimizedBySymbol.get(current.symbol);
        return {
          symbol: current.symbol,
          companyName: current.companyName,
          currentWeight: Number(current.weight) || 0,
          optimizedWeight: Number(optimized?.weight) || 0,
        };
      })
      .sort((a, b) => b.optimizedWeight - a.optimizedWeight);
  }, [currentAllocations, optimizedAllocations]);

  if (rows.length === 0) {
    return (
      <div className="quantum-empty-chart">
        Allocation comparison will appear after optimization.
      </div>
    );
  }

  return (
    <div className="quantum-allocation-comparison" aria-label="Current vs optimized allocation comparison">
      {rows.map((row) => (
        <div className="quantum-alloc-row" key={row.symbol}>
          <div className="quantum-alloc-label">
            <strong>{row.symbol}</strong>
            <span>{row.companyName}</span>
          </div>

          <div className="quantum-alloc-bars">
            <div className="quantum-alloc-track">
              <span className="quantum-alloc-bar current" style={{ width: `${Math.max(0, Math.min(100, row.currentWeight))}%` }} />
            </div>
            <div className="quantum-alloc-track">
              <span className="quantum-alloc-bar optimized" style={{ width: `${Math.max(0, Math.min(100, row.optimizedWeight))}%` }} />
            </div>
          </div>

          <div className="quantum-alloc-values">
            <span>{formatPercent(row.currentWeight)}</span>
            <span>{formatPercent(row.optimizedWeight)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
