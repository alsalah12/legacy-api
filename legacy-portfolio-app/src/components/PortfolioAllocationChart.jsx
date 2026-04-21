import React, { useMemo, useRef, useState } from "react";
import { formatCurrency } from "../services/holdingsData";
import "./PortfolioAllocationChart.css";

function toPercent(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "0.00%";
  return `${numeric.toFixed(2)}%`;
}

export default function PortfolioAllocationChart({
  title = "Portfolio Allocation",
  subtitle = "",
  allocations = [],
  totalValue = 0,
  centerLabel = "Total Value",
  showCenter = true,
  emptyMessage = "No holdings available for allocation.",
}) {
  const tooltipHostRef = useRef(null);
  const [hoveredKey, setHoveredKey] = useState("");
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  const allocationByKey = useMemo(() => {
    const map = new Map();
    allocations.forEach((item) => map.set(item.key, item));
    return map;
  }, [allocations]);

  const hoveredItem = hoveredKey ? allocationByKey.get(hoveredKey) : null;

  const updateTooltipPosition = (event) => {
    const hostRect = tooltipHostRef.current?.getBoundingClientRect();
    if (!hostRect) return;

    const x = Math.max(8, Math.min(hostRect.width - 8, event.clientX - hostRect.left + 12));
    const y = Math.max(8, Math.min(hostRect.height - 8, event.clientY - hostRect.top + 12));
    setTooltipPosition({ x, y });
  };

  const handleHoverStart = (event, key) => {
    setHoveredKey(key);
    updateTooltipPosition(event);
  };

  const handleHoverMove = (event) => {
    if (!hoveredKey) return;
    updateTooltipPosition(event);
  };

  const handleHoverEnd = () => {
    setHoveredKey("");
  };

  // Donut segments are derived from shared allocation data so chart + legend always match.
  const donutSegments = useMemo(() => {
    const center = 120;
    const radius = 90;
    const circumference = 2 * Math.PI * radius;
    let cumulative = 0;

    return allocations.map((item) => {
      const safePercent = Math.max(0, Number(item.percent) || 0);
      const segmentLength = (safePercent / 100) * circumference;
      const segment = {
        ...item,
        center,
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
    <article className="portfolio-allocation-card" ref={tooltipHostRef}>
      <div className="portfolio-allocation-header">
        <div>
          <h2>{title}</h2>
          {subtitle ? <p>{subtitle}</p> : null}
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
                  r={donutSegments[0]?.radius || 90}
                />
                {donutSegments.map((segment) => (
                  <circle
                    key={segment.key}
                    className="portfolio-allocation-segment"
                    cx={segment.center}
                    cy={segment.center}
                    r={segment.radius}
                    stroke={segment.color}
                    strokeDasharray={segment.strokeDasharray}
                    strokeDashoffset={segment.strokeDashoffset}
                    transform="rotate(-90 120 120)"
                    onMouseEnter={(event) => handleHoverStart(event, segment.key)}
                    onMouseMove={handleHoverMove}
                    onMouseLeave={handleHoverEnd}
                  />
                ))}
              </svg>

              {showCenter ? (
                <div className="portfolio-allocation-center">
                  <span>{centerLabel}</span>
                  <strong>{formatCurrency(totalValue)}</strong>
                </div>
              ) : null}
            </div>
          </div>

          {/* Legend uses the same shared data that powers the donut chart. */}
          <div className="portfolio-allocation-legend">
            {allocations.map((item) => (
              <button
                key={item.key}
                type="button"
                className={`portfolio-allocation-legend-row ${hoveredKey === item.key ? "active" : ""}`}
                onMouseEnter={(event) => handleHoverStart(event, item.key)}
                onMouseMove={handleHoverMove}
                onMouseLeave={handleHoverEnd}
              >
                <div className="portfolio-allocation-legend-left">
                  <span className="portfolio-allocation-dot" style={{ backgroundColor: item.color }} />
                  <strong>{item.symbol}</strong>
                </div>
                <div className="portfolio-allocation-legend-right">
                  <span>{toPercent(item.percent)}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="portfolio-allocation-empty">{emptyMessage}</div>
      )}

      {hoveredItem && (
        <div
          className="portfolio-allocation-tooltip"
          style={{ left: tooltipPosition.x, top: tooltipPosition.y }}
          role="status"
          aria-live="polite"
        >
          <div className="portfolio-allocation-tooltip-row">
            <strong>{hoveredItem.symbol}</strong>
            <span>{toPercent(hoveredItem.percent)}</span>
          </div>
          <div className="portfolio-allocation-tooltip-company">{hoveredItem.name}</div>
          <div className="portfolio-allocation-tooltip-row">
            <span>Value</span>
            <strong>{formatCurrency(hoveredItem.value)}</strong>
          </div>
          {Number.isFinite(Number(hoveredItem.quantity)) && (
            <div className="portfolio-allocation-tooltip-row">
              <span>Quantity</span>
              <strong>{Number(hoveredItem.quantity)}</strong>
            </div>
          )}
        </div>
      )}
    </article>
  );
}
