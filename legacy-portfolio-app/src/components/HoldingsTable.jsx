// React is needed because this component returns JSX.
import React from 'react';
// Import the table styles for the holdings list.
import './HoldingsTable.css';
import { formatPercent } from '../services/holdingsData';

function formatCurrency(value) {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function HoldingsTable({ holdings = [] }) {
  return (
    <div className="table-wrapper">
      {/* Table element groups the holdings into rows and columns. */}
      <table className="holdings-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Symbol</th>
            <th>Bid Price</th>
            <th>Performance % Change</th>
            <th>Amount Owned</th>
            <th>Sector</th>
          </tr>
        </thead>
        <tbody>
          {holdings.map((holding) => (
            <tr key={holding.id || holding.symbol}>
              <td>{holding.name}</td>
              <td><span className="table-symbol">{holding.symbol}</span></td>
              <td>{formatCurrency(holding.bidPrice)}</td>
              <td>
                <span className={holding.performancePercent > 0 ? 'text-positive' : holding.performancePercent < 0 ? 'text-negative' : ''}>
                  {formatPercent(holding.performancePercent)}
                </span>
              </td>
              <td>{holding.amountOwned}</td>
              <td>{holding.sector}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default HoldingsTable;
