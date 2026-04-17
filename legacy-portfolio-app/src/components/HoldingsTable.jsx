import React from 'react';
import './HoldingsTable.css';

// Static holdings data. Later replace with props or a fetch() call
// to GET /api/stocks from the Spring Boot backend.
const HOLDINGS = [
  {
    symbol: 'AZN',
    company: 'AstraZeneca',
    sector: 'Healthcare',
    quantity: 245,
    avgCost: '£96.20',
    price: '£102.52',
    marketValue: '£25,117.40',
    performance: '+4.12%',
    positive: true,
  },
  {
    symbol: 'SHEL',
    company: 'Shell plc',
    sector: 'Energy',
    quantity: 390,
    avgCost: '£25.84',
    price: '£26.16',
    marketValue: '£20,044.05',
    performance: '+1.22%',
    positive: true,
  },
  {
    symbol: 'BARC',
    company: 'Barclays',
    sector: 'Finance',
    quantity: 4200,
    avgCost: '£1.71',
    price: '£1.70',
    marketValue: '£16,196.40',
    performance: '-0.64%',
    positive: false,
  },
  {
    symbol: 'VOD',
    company: 'Vodafone Group',
    sector: 'Telecom',
    quantity: 8100,
    avgCost: '£0.68',
    price: '£0.67',
    marketValue: '£13,025.70',
    performance: '-1.14%',
    positive: false,
  },
];

function HoldingsTable() {
  return (
    <div className="table-wrapper">
      <table className="holdings-table">
        <thead>
          <tr>
            <th>Asset</th>
            <th>Sector</th>
            <th>Qty</th>
            <th>Avg Cost</th>
            <th>Current Price</th>
            <th>Market Value</th>
            <th>Return</th>
          </tr>
        </thead>
        <tbody>
          {HOLDINGS.map((holding) => (
            <tr key={holding.symbol}>
              <td>
                {/* Symbol and company name grouped together */}
                <span className="table-symbol">{holding.symbol}</span>
                <br />
                <span style={{ fontSize: '0.85rem', color: '#6b7890' }}>
                  {holding.company}
                </span>
              </td>
              <td>{holding.sector}</td>
              <td>{holding.quantity.toLocaleString()}</td>
              <td>{holding.avgCost}</td>
              <td>{holding.price}</td>
              <td>{holding.marketValue}</td>
              <td>
                {/* Green for positive, red for negative */}
                <span className={holding.positive ? 'text-positive' : 'text-negative'}>
                  {holding.performance}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default HoldingsTable;
