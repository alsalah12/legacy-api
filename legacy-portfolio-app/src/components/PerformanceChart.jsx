// React is needed because this component returns JSX.
import React from 'react';
// Import the CSS that draws the placeholder chart.
import './PerformanceChart.css';

// Static chart placeholder built with CSS shapes only.
// When the team is ready, replace the chart-area contents with a real
// charting library such as Recharts or Chart.js.
function PerformanceChart() {
  // Labels for the horizontal and vertical axes.
  const xLabels = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'];
  const yLabels = ['£140k', '£130k', '£120k', '£110k', '£100k'];

  return (
    <div className="chart-card">
      {/* Y-axis value labels */}
      <div className="chart-y-axis">
        {yLabels.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>

      {/* Chart drawing area */}
      <div className="chart-area">
        {/* Horizontal grid lines */}
        <div className="chart-grid-line" />
        <div className="chart-grid-line" />
        <div className="chart-grid-line" />
        <div className="chart-grid-line" />

        {/* Three performance lines representing different portfolios */}
        <div className="chart-line chart-line-primary" />
        <div className="chart-line chart-line-secondary" />
        <div className="chart-line chart-line-tertiary" />

        {/* X-axis month labels */}
        <div className="chart-x-axis">
          {xLabels.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default PerformanceChart;
