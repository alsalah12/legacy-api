import React from 'react';
import './SummaryCard.css';

// A single stat card shown in the performance summary row.
// trend is 'positive', 'negative', or 'neutral' and controls the value colour.
function SummaryCard({ label, value, detail, trend }) {
  return (
    <article className={`summary-stat${trend === 'positive' ? ' positive' : ''}`}>
      <p className="summary-label">{label}</p>
      <strong className="summary-value">{value}</strong>
      {detail && <p className="summary-detail">{detail}</p>}
    </article>
  );
}

export default SummaryCard;
