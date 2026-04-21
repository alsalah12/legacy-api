# Dashboard Layout Structure — Visual Guide

## Final Desktop Layout (1280px+)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          APP TOP BAR (78px fixed)                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│ ┌─ DASHBOARD TOP ROW ─────────────────────────────────────────────────┐ │
│ │                                                                      │ │
│ │ Greeting                          │  KPI Card  │  KPI Card  │  KPI │ │
│ │ "Good evening, [name]"            │  Total     │   Today's  │ Total│ │
│ │ (left-aligned, plain text)        │  Value     │   Gain     │ Gain │ │
│ │                                   │  $XX,XXX   │  $X,XXX    │$X,XXX│ │
│ │                                   │  Holdings  │  (U/L)%    │ (U/L)% │
│ │                                   │  + cash    │  change    │ ret  │ │
│ │                                                                      │ │
│ └─ MAIN GRID (2-Column) ─────────────────────────────────────────────┘ │
│                                                                           │
│ ┌────────────────────────────────────┐  ┌─ RIGHT COLUMN (32%) ──────┐ │
│ │  LEFT COLUMN (68%)                 │  │                           │ │
│ │                                    │  │ ┌─────────────────────┐  │ │
│ │ ┌───────────────────────────────┐  │  │ │ Top Equity          │  │ │
│ │ │ Portfolio Performance (~60%) │  │  │ │ Performers          │  │ │
│ │ │                              │  │  │ │                      │  │ │
│ │ │ [1D][1W][1M][3M][6M][1Y][All]│  │  │ │ #1 NVDA  +5.2%  ▲  │  │ │
│ │ │        [Refresh prices]      │  │  │ │ #2 AAPL  +2.1%  ▲  │  │ │
│ │ │                              │  │  │ │ #3 MSFT  +1.8%  ▲  │  │ │
│ │ │  [CHART AREA - SVG Line]     │  │  │ │ #4 GOOGL -0.3%  ▼  │  │ │
│ │ │                              │  │  │ │ #5 META  -1.2%  ▼  │  │ │
│ │ │                              │  │  │ │                      │  │ │
│ │ │                              │  │  │ └─────────────────────┘  │ │
│ │ │  Holdings      Invested Cash │  │  │                           │ │
│ │ │  Market Value  Value   Value │  │  │ ┌─────────────────────┐  │ │
│ │ │  $X,XXX        $XX,XXX $X,XXX│  │  │ │ Market News         │  │ │
│ │ │                              │  │  │ │ 🔴 Live             │  │ │
│ │ └───────────────────────────────┘  │  │                      │  │ │
│ │                                    │  │ Macro                │  │ │
│ │ ┌───────────────────────────────┐  │  │ Fed signals potential│  │ │
│ │ │ Holdings Overview (~40%)       │  │  │ rate pause as...    │  │ │
│ │ │                                │  │  │ Reuters · 12 min ago │  │ │
│ │ │ [View all link]                │  │  │                      │  │ │
│ │ │                                │  │  │ ● ● ● ● ●           │  │ │
│ │ │ Name    Symbol Qty  Price Value│  │  │                      │  │ │
│ │ │ Apple    AAPL  100 $180 $18,000│  │  │                      │  │ │
│ │ │ Microsoft MSFT  50 $380 $19,000│  │  │                      │  │ │
│ │ │ NVIDIA   NVDA  200 $850 $170,00│  │  │                      │  │ │
│ │ │ Alphabet GOOGL  75 $140 $10,500│  │  │                      │  │ │
│ │ │                                │  │  │                      │  │ │
│ │ └───────────────────────────────┘  │  │ └─────────────────────┘  │ │
│ └────────────────────────────────────┘  └─────────────────────────────┘ │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘

```

---

## Key Layout Properties

### Top Row
```
display: grid
grid-template-columns: minmax(240px, 1.15fr) minmax(0, 1.85fr)
                       [greeting]          [kpi-cards]
gap: 12px
align-items: center
```

### Main Grid
```
display: grid
grid-template-columns: minmax(0, 2.2fr) minmax(320px, 1fr)
                       [left-column]     [right-column]
gap: 12px
flex: 1 (takes remaining height after top-row)
```

### Left Column (Chart + Holdings)
```
display: grid
grid-template-rows: minmax(0, 1.45fr) minmax(200px, 0.82fr)
                    [chart]            [holdings]
gap: 12px
```

### Right Column (Performers + News)
```
display: grid
grid-template-rows: minmax(0, 0.92fr) minmax(0, 1.08fr)
                    [performers]       [news]
gap: 12px
```

---

## Height Distribution Example (1280x800 laptop)

```
Viewport: 1280x800
Top navbar: 78px (fixed)
Available for dashboard: 800 - 78 = 722px

Top row greeting + KPI: ~90px
Main grid available: 722 - 90 = 632px

Left column:
  - Chart: 632px × 1.45 / 2.27 ≈ 404px
  - Holdings: 632px × 0.82 / 2.27 ≈ 228px

Right column (total): 632px
  - Performers: 632px × 0.92 / 2.0 ≈ 290px
  - News: 632px × 1.08 / 2.0 ≈ 342px
```

All sections fit within viewport → **NO PAGE SCROLL** ✓

---

## CSS Grid + Flex Hierarchy

```
.db-page (viewport container)
└─ .app-page-main (height: 100vh - navbar)
   └─ .dashboard-shell (grid: 2 rows)
      ├─ .dashboard-top-row (grid: 2 cols)
      │  ├─ .dashboard-greeting (flex: justify-start)
      │  └─ .dashboard-kpi-row (grid: 3 cols equal)
      │     ├─ .db-kpi-card
      │     ├─ .db-kpi-card
      │     └─ .db-kpi-card
      │
      └─ .dashboard-main-grid (grid: 2 cols)
         ├─ .dashboard-left-column (grid: 2 rows)
         │  ├─ .db-perf-card (chart)
         │  │  ├─ .db-card-header (flex: space-between)
         │  │  └─ .db-chart-area (grid: 1fr + legend)
         │  │
         │  └─ .db-holdings-card (table)
         │     ├─ .db-card-header
         │     └─ .db-table-wrap (overflow: auto)
         │
         └─ .dashboard-right-column (grid: 2 rows)
            ├─ .db-performers-card
            │  ├─ .db-card-header
            │  └─ .db-performers-list (flex: column)
            │
            └─ .db-news-card (RotatingNewsCard)
               ├─ .db-card-header
               └─ .db-news-body (transitions opacity)
```

---

## Metric Data Flow

All components read from a **single shared `portfolioSummary` object**:

```javascript
// Source of truth in holdingsData.js
portfolioSummary = buildPortfolioSummary({
  holdings,           // Array of {symbol, quantityOwned, currentBidPrice, totalValue, profitLossPercent, ...}
  historyBySymbol,    // {AAPL: [...prices], MSFT: [...prices], ...}
  totals              // {holdingsMarketValue, holdingsInvested, holdingsProfit, availableFunds, ...}
})

// Result:
{
  totalValue: $XXX,XXX        // Used by KPI card, holdings row sum
  totalGainValue: $XX,XXX     // Used by KPI card, holdings P/L
  totalGainPercent: X.XX%     // Used by KPI card
  todayGainValue: $X,XXX      // Used by KPI card (or "Unavailable")
  todayGainPercent: X.XX%     // Used by KPI card
  todayGainAvailable: true    // Shows "Unavailable" if false
}
```

Every component reads from this object:
- ✓ Dashboard KPI cards render `portfolioSummary.*`
- ✓ Holdings table cells render from `holdings[]` (same live prices)
- ✓ Top Performers sorts by `holding.profitLossPercent` (same calculation)
- ✓ No duplicate calculations, no inconsistent values

---

## Responsive Behavior

### Tablet (900px-1280px)
- Top row becomes 1 column (greeting above KPI cards)
- Main grid becomes 1 column
- Page allows scrolling

### Mobile (<640px)
- Single column everywhere
- KPI cards stack vertically
- Holdings table may need horizontal scroll (internal)
- Charts sized appropriately

---

## Color Scheme

```
Accent Purple:    #5548c8 (borders, active states)
Positive Green:   #1a7a4a (gains)
Negative Red:     #b91c1c (losses)
Text Strong:      #0d1117 (headings)
Text Main:        #1a2230 (body)
Text Muted:       #9399a6 (labels)
Border Color:     #dce0e8 (edges)
Panel Background: #ffffff (cards)
Page Background:  #f1f2f6 (light lavender)
```

---

## Animation & Transitions

- KPI cards: box-shadow hover effect (0.2s ease)
- Period tabs: background color transition (0.15s ease)
- News card: fade out/fade in on story change (0.28s ease)
- Tables: row hover background (gentle highlight)

---

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

All layouts tested with:
- ✓ CSS Grid (2-column layout)
- ✓ Flexbox (alignment)
- ✓ CSS Variables (theming)
- ✓ calc() functions (height calculations)
- ✓ CSS Transitions (animations)
