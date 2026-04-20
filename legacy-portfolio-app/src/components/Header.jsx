// React is needed because this component returns JSX.
import React from 'react';
// Import the styles for this reusable header component.
import './Header.css';

// Header receives account summary data as props so it can later
// be wired to real API data without changing the component structure.
function Header({ portfolioValue, availableBalance, lastUpdated }) {
  return (
    <header className="top-header">
      {/* Left: brand logo and name */}
      <div className="header-left">
        {/* CSS-only stacked bar logo - no image file needed */}
        <div className="brand-mark">
          <div className="brand-mark-layer layer-one" />
          <div className="brand-mark-layer layer-two" />
          <div className="brand-mark-layer layer-three" />
        </div>
        <span className="brand-text">LEGACY</span>
      </div>

      {/* Right: key account metrics and primary action */}
      <div className="header-right">
        <div className="header-metric">
          <span className="metric-label">Total Portfolio Value</span>
          <strong className="metric-value">{portfolioValue}</strong>
        </div>

        <div className="header-metric">
          <span className="metric-label">Available Balance</span>
          <strong className="metric-value">{availableBalance}</strong>
        </div>

        {/* Primary action - Add Funds */}
        <button type="button" className="add-funds-btn">
          Add Funds
        </button>

        <div className="header-metric header-updated">
          <span className="metric-label">Last Updated</span>
          <strong className="metric-value">{lastUpdated}</strong>
        </div>
      </div>
    </header>
  );
}

export default Header;
