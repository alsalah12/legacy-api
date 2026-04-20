// React is needed because this component returns JSX.
import React from "react";
// Shared styles for the sticky top bar.
import "./AppTopBar.css";
import { formatCurrency, usePortfolioData } from "../services/holdingsData";
// LEGACY horizontal brand logo — replaces the old "Portfolio Manager" text.
import legacyLogo from "../assets/legacy-logo.svg";

// AppTopBar renders a compact sticky header used across app pages.
export default function AppTopBar() {
  const {
    totals,
    addFunds,
    actionMessage,
    actionError,
  } = usePortfolioData();

  // Toggle sidebar visibility (for fully hidden mode).
  const handleToggleSidebar = () => {
    window.dispatchEvent(new CustomEvent("app-toggle-sidebar"));
  };

  const handleAddFunds = async () => {
    const raw = window.prompt("Enter amount to add:");
    if (raw === null) return;
    await addFunds(raw);
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

      {/* LEGACY horizontal logo — replaces old "Portfolio Manager" text.
           Sits left-aligned, vertically centred, scales with aspect-ratio preserved. */}
        <img
          src={legacyLogo}
          alt="LEGACY"
          className="app-topbar-logo"
        />
      </div>

      {/* Right side key financial metrics (kept clean without profile picture). */}
      <div className="app-topbar-right">
        <div className="app-topbar-metric">
          <span className="app-topbar-label">Total Portfolio Worth</span>
          <strong className="app-topbar-value">{formatCurrency(totals.totalPortfolioWorth)}</strong>
        </div>

        <div className="app-topbar-metric">
          <span className="app-topbar-label">Available Funds</span>
          <strong className="app-topbar-value">{formatCurrency(totals.availableFunds)}</strong>
        </div>

        <button
          type="button"
          className="app-topbar-add-funds-btn"
          onClick={handleAddFunds}
        >
          + Add Funds
        </button>

      </div>

      {actionError && <div className="app-topbar-message app-topbar-message-error">{actionError}</div>}
      {!actionError && actionMessage && <div className="app-topbar-message">{actionMessage}</div>}
    </header>
  );
}
