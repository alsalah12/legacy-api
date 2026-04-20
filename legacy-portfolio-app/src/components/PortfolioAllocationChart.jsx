import React, { useMemo } from "react";
import { formatCurrency } from "../services/holdingsData";
import "./PortfolioAllocationChart.css";

function toPercent(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "0.0%";
  return `${numeric.toFixed(1)}%`;
}

export default function PortfolioAllocationChart({
  title = "Portfolio Allocation",
  subtitle = "Current allocation by holding value",
  allocations = [],
  totalValue = 0,
  centerLabel = "Total Value",
  emptyMessage = "No holdings available for allocation.",
}) {
  // Donut segments are derived from shared allocation data so chart + legend always match.
  const donutSegments = useMemo(() => {
    const radius = 88;
    const circumference = 2 * Math.PI * radius;
    let cumulative = 0;

    return allocations.map((item) => {
      const safePercent = Math.max(0, Number(item.percent) || 0);
      const segmentLength = (safePercent / 100) * circumference;
      const segment = {
        ...item,
        radius,
        circumference,
        strokeDasharray: `${segmentLength} ${Math.max(circumference - segmentLength, 0)}`,
        strokeDashoffset: -cumulative,
      };
      cumulative += segmentLength;
      return segment;
    });
  }, [allocations]);

  return (
    <article className="portfolio-allocation-card">
      <div className="portfolio-allocation-header">
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
      </div>

      {allocations.length > 0 ? (
        <div className="portfolio-allocation-body">
          <div className="portfolio-allocation-visual" aria-hidden="true">
            <div className="portfolio-allocation-donut-wrap">
              <svg viewBox="0 0 240 240" className="portfolio-allocation-donut-svg">
                <circle
                  className="portfolio-allocation-track"
                  cx="120"
                  cy="120"
                  r="88"
                />
                {donutSegments.map((segment) => (
                  <circle
                    key={segment.key}
                    className="portfolio-allocation-segment"
                    cx="120"
                    cy="120"
                    r={segment.radius}
                    stroke={segment.color}
                    strokeDasharray={segment.strokeDasharray}
                    strokeDashoffset={segment.strokeDashoffset}
                    transform="rotate(-90 120 120)"
                  />
                ))}
              </svg>

              <div className="portfolio-allocation-center">
                <span>{centerLabel}</span>
                <strong>{formatCurrency(totalValue)}</strong>
              </div>
            </div>
          </div>

          {/* Legend uses the same shared data that powers the donut chart. */}
          <div className="portfolio-allocation-legend">
            {allocations.map((item) => (
              <div key={item.key} className="portfolio-allocation-legend-row">
                <div className="portfolio-allocation-legend-left">
                  <span className="portfolio-allocation-dot" style={{ backgroundColor: item.color }} />
                  <div>
                    <strong>{item.symbol}</strong>
                    <span>{item.name}</span>
                  </div>
                </div>
                <div className="portfolio-allocation-legend-right">
                  <strong>{formatCurrency(item.value)}</strong>
                  <span>{toPercent(item.percent)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="portfolio-allocation-empty">{emptyMessage}</div>
      )}
    </article>
  );
}
