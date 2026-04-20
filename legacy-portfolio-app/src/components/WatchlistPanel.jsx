// React is needed because this component returns JSX.
import React from 'react';
// Import the panel styles for the watchlist area.
import './WatchlistPanel.css';

// Static watchlist data. Later replace with a fetch() to GET /api/watchlist.
const MOVERS = [
  { symbol: 'HSBA', name: 'HSBC Holdings', price: '£6.84', move: '+2.18%', positive: true },
  { symbol: 'ULVR', name: 'Unilever', price: '£38.11', move: '+1.07%', positive: true },
  { symbol: 'LLOY', name: 'Lloyds Banking Group', price: '£0.57', move: '-1.31%', positive: false },
  { symbol: 'RIO', name: 'Rio Tinto', price: '£52.46', move: '-0.88%', positive: false },
];

function WatchlistPanel() {
  return (
    <section className="card side-card">
      <div className="side-card-header">
        <p className="card-title">Watchlist Movers</p>
        <p className="card-subtitle">Today&apos;s movement</p>
      </div>

      <div className="watchlist-list">
        {MOVERS.map((item) => (
          <article key={item.symbol} className="watchlist-item">
            <div className="watchlist-left">
              {/* Ticker badge */}
              <div className="ticker-badge">{item.symbol}</div>
              <div>
                <p className="watchlist-name">{item.name}</p>
                <p className="watchlist-price">{item.price}</p>
              </div>
            </div>

            {/* Move percentage on the right */}
            <span className={`watchlist-move ${item.positive ? 'text-positive' : 'text-negative'}`}>
              {item.move}
            </span>
          </article>
        ))}
      </div>
    </section>
  );
}

export default WatchlistPanel;
