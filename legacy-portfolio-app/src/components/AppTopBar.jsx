// React is needed because this component returns JSX.
import React from "react";
// Shared styles for the sticky top bar.
import "./AppTopBar.css";

// AppTopBar renders a compact sticky header used across app pages.
export default function AppTopBar() {
  // Toggle sidebar visibility (for fully hidden mode).
  const handleToggleSidebar = () => {
    window.dispatchEvent(new CustomEvent("app-toggle-sidebar"));
  };

  // Basic placeholder action for adding funds.
  const handleAddFunds = () => {
    window.alert("Add Funds action coming soon.");
  };

  return (
    <header className="app-topbar">
      {/* Left side product title. */}
      <div className="app-topbar-left">
        <button
          type="button"
          className="app-topbar-menu-btn"
          onClick={handleToggleSidebar}
          aria-label="Toggle sidebar"
        >
          ☰
        </button>

        <span className="app-topbar-title">Legacy Portfolio Manager</span>
      </div>

      {/* Right side key financial metrics (kept clean without profile picture). */}
      <div className="app-topbar-right">
        <div className="app-topbar-metric">
          <span className="app-topbar-label">Total Portfolio Worth</span>
          <strong className="app-topbar-value">$152,430.25</strong>
        </div>

        <div className="app-topbar-metric">
          <span className="app-topbar-label">Available Funds</span>
          <strong className="app-topbar-value">$12,450.00</strong>
        </div>

        <button
          type="button"
          className="app-topbar-add-funds-btn"
          onClick={handleAddFunds}
        >
          + Add Funds
        </button>
      </div>
    </header>
  );
}
