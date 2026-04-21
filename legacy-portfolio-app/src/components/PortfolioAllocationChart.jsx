import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { formatCurrency } from "../services/holdingsData";
import "./PortfolioAllocationChart.css";

const TOOLTIP_GAP = 16;
const VIEWPORT_PADDING = 12;
const PREMIUM_ALLOCATION_PALETTE = [
  "#7C3AED", // purple
  "#0F766E", // teal
  "#2563EB", // cobalt blue
  "#DB2777", // magenta
  "#312E81", // indigo
  "#059669", // emerald
];

function toPercent(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "0.00%";
  return `${numeric.toFixed(2)}%`;
}

function normalizeTicker(value) {
  return String(value ?? "").trim().toUpperCase();
}

function getSymbolHash(value) {
  const normalized = normalizeTicker(value);
  if (!normalized) return 0;

  let hash = 0;
  for (let index = 0; index < normalized.length; index += 1) {
    hash = (hash * 31 + normalized.charCodeAt(index)) >>> 0;
  }

  return hash;
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
  const [hoveredKey, setHoveredKey] = useState("");
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const tooltipRef = useRef(null);
  const tooltipFrameRef = useRef(null);
  const lastPointerRef = useRef({ x: 0, y: 0 });

  const displayAllocations = useMemo(() => {
    const symbols = Array.from(new Set(allocations.map((item) => normalizeTicker(item.symbol || item.key)).filter(Boolean))).sort();
    const paletteUsage = new Set();
    const colorBySymbol = new Map();

    symbols.forEach((symbol) => {
      const baseIndex = getSymbolHash(symbol) % PREMIUM_ALLOCATION_PALETTE.length;
      let resolvedIndex = baseIndex;

      if (symbols.length <= PREMIUM_ALLOCATION_PALETTE.length) {
        while (paletteUsage.has(resolvedIndex)) {
          resolvedIndex = (resolvedIndex + 1) % PREMIUM_ALLOCATION_PALETTE.length;
        }
        paletteUsage.add(resolvedIndex);
      }

      colorBySymbol.set(symbol, PREMIUM_ALLOCATION_PALETTE[resolvedIndex]);
    });

    return allocations.map((item, index) => ({
      ...item,
      color:
        colorBySymbol.get(normalizeTicker(item.symbol || item.key)) ||
        PREMIUM_ALLOCATION_PALETTE[index % PREMIUM_ALLOCATION_PALETTE.length],
    }));
  }, [allocations]);

  const allocationByKey = useMemo(() => {
    const map = new Map();
    displayAllocations.forEach((item) => map.set(item.key, item));
    return map;
  }, [displayAllocations]);

  const hoveredItem = hoveredKey ? allocationByKey.get(hoveredKey) : null;

  const getClampedTooltipPosition = useCallback((clientX, clientY) => {
    const tooltipWidth = tooltipRef.current?.offsetWidth || 228;
    const tooltipHeight = tooltipRef.current?.offsetHeight || 144;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const left = Math.max(
      VIEWPORT_PADDING,
      Math.min(viewportWidth - tooltipWidth - VIEWPORT_PADDING, clientX - tooltipWidth / 2)
    );

    const topPlacement = clientY - tooltipHeight - TOOLTIP_GAP;
    const bottomPlacement = clientY + TOOLTIP_GAP;
    const canPlaceAbove = topPlacement >= VIEWPORT_PADDING;
    const canPlaceBelow = bottomPlacement + tooltipHeight <= viewportHeight - VIEWPORT_PADDING;

    const top = canPlaceAbove || !canPlaceBelow
      ? Math.max(VIEWPORT_PADDING, Math.min(viewportHeight - tooltipHeight - VIEWPORT_PADDING, topPlacement))
      : bottomPlacement;

    return { x: left, y: top };
  }, []);

  const scheduleTooltipPosition = useCallback((clientX, clientY) => {
    lastPointerRef.current = { x: clientX, y: clientY };

    if (tooltipFrameRef.current) {
      cancelAnimationFrame(tooltipFrameRef.current);
    }

    tooltipFrameRef.current = requestAnimationFrame(() => {
      tooltipFrameRef.current = null;
      setTooltipPosition(getClampedTooltipPosition(clientX, clientY));
    });
  }, [getClampedTooltipPosition]);

  const handleHoverStart = (event, key) => {
    setHoveredKey(key);
    scheduleTooltipPosition(event.clientX, event.clientY);
  };

  const handleHoverMove = (event) => {
    if (!hoveredKey) return;
    scheduleTooltipPosition(event.clientX, event.clientY);
  };

  const handleHoverEnd = () => {
    setHoveredKey("");
  };

  useLayoutEffect(() => {
    if (!hoveredItem) return;

    const { x, y } = lastPointerRef.current;
    setTooltipPosition(getClampedTooltipPosition(x, y));
  }, [getClampedTooltipPosition, hoveredItem]);

  useEffect(() => {
    return () => {
      if (tooltipFrameRef.current) {
        cancelAnimationFrame(tooltipFrameRef.current);
      }
    };
  }, []);

  const donutSegments = useMemo(() => {
    const center = 120;
    const radius = 90;
    const circumference = 2 * Math.PI * radius;
    let cumulative = 0;

    return displayAllocations.map((item) => {
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
  }, [displayAllocations]);

  return (
    <article className="portfolio-allocation-card">
      <div className="portfolio-allocation-header">
        <div>
          <h2>{title}</h2>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
      </div>

      {displayAllocations.length > 0 ? (
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
                    style={{ opacity: hoveredKey && hoveredKey !== segment.key ? 0.74 : 1 }}
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

          <div className="portfolio-allocation-legend">
            {displayAllocations.map((item) => (
              <button
                key={item.key}
                type="button"
                className={`portfolio-allocation-legend-row ${hoveredKey === item.key ? "active" : ""}`}
                onMouseEnter={(event) => handleHoverStart(event, item.key)}
                onMouseMove={handleHoverMove}
                onMouseLeave={handleHoverEnd}
                aria-label={`${item.symbol} ${toPercent(item.percent)}`}
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

      {hoveredItem && typeof document !== "undefined" && createPortal(
        <div
          ref={tooltipRef}
          className="portfolio-allocation-tooltip"
          style={{ left: tooltipPosition.x, top: tooltipPosition.y }}
          role="status"
          aria-live="polite"
        >
          <div className="portfolio-allocation-tooltip-row">
            <strong>{hoveredItem.symbol}</strong>
          </div>
          <div className="portfolio-allocation-tooltip-company">{hoveredItem.name}</div>
          <div className="portfolio-allocation-tooltip-row">
            <span>Allocation</span>
            <strong>{toPercent(hoveredItem.percent)}</strong>
          </div>
          <div className="portfolio-allocation-tooltip-row">
            <span>Value</span>
            <strong>{formatCurrency(hoveredItem.value)}</strong>
          </div>
          {Number.isFinite(Number(hoveredItem.quantity)) && (
            <div className="portfolio-allocation-tooltip-row">
              <span>Quantity</span>
              <strong>{Number(hoveredItem.quantity).toLocaleString("en-US")}</strong>
            </div>
          )}
        </div>,
        document.body
      )}
    </article>
  );
}
