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
    portfoliosForActiveUser,
    activePortfolioId,
    setActivePortfolioId,
  } = usePortfolioData();
  const [switcherOpen, setSwitcherOpen] = React.useState(false);
  const switcherRef = React.useRef(null);

  const getPortfolioLabel = React.useCallback((portfolioItem, index) => {
    const name = String(portfolioItem?.name || "").trim();
    if (name) return name;
    const identifier = portfolioItem?.id ?? index + 1;
    return `Portfolio ${identifier}`;
  }, []);

  const activePortfolioLabel = React.useMemo(() => {
    if (!Array.isArray(portfoliosForActiveUser) || portfoliosForActiveUser.length === 0) {
      return "Portfolio";
    }

    const activeIndex = portfoliosForActiveUser.findIndex(
      (portfolioItem) => String(portfolioItem?.id ?? "") === String(activePortfolioId ?? "")
    );
    const fallbackIndex = activeIndex >= 0 ? activeIndex : 0;
    return getPortfolioLabel(portfoliosForActiveUser[fallbackIndex], fallbackIndex);
  }, [activePortfolioId, getPortfolioLabel, portfoliosForActiveUser]);

  React.useEffect(() => {
    const handlePointerDown = (event) => {
      if (!switcherRef.current?.contains(event.target)) {
        setSwitcherOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setSwitcherOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  // Toggle sidebar visibility (for fully hidden mode).
  const handleToggleSidebar = () => {
    window.dispatchEvent(new CustomEvent("app-toggle-sidebar"));
  };

  const handleAddFunds = async () => {
    const raw = window.prompt("Enter amount to add:");
    if (raw === null) return;
    await addFunds(raw);
  };

  const handleCreatePortfolio = () => {
    setSwitcherOpen(false);
    window.dispatchEvent(new CustomEvent("app-create-portfolio"));
  };

  const handleManagePortfolios = () => {
    setSwitcherOpen(false);
    window.dispatchEvent(new CustomEvent("app-manage-portfolios"));
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
        <div className="app-topbar-portfolio-switcher" ref={switcherRef}>
          <button
            type="button"
            className="app-topbar-portfolio-btn"
            aria-haspopup="menu"
            aria-expanded={switcherOpen}
            onClick={() => setSwitcherOpen((previous) => !previous)}
            title="Switch portfolio"
          >
            <span className="app-topbar-portfolio-btn-label">{activePortfolioLabel}</span>
            <span className={`app-topbar-portfolio-chevron ${switcherOpen ? "open" : ""}`} aria-hidden="true">▾</span>
          </button>

          {switcherOpen && (
            <div className="app-topbar-portfolio-menu" role="menu" aria-label="Portfolio switcher">
              <div className="app-topbar-portfolio-menu-list">
                {(portfoliosForActiveUser || []).map((portfolioItem, index) => {
                  const optionValue = String(portfolioItem?.id ?? "");
                  const isActive = optionValue === String(activePortfolioId ?? "");
                  return (
                    <button
                      key={`${optionValue || "portfolio"}-${index}`}
                      type="button"
                      role="menuitemradio"
                      aria-checked={isActive}
                      className={`app-topbar-portfolio-menu-item ${isActive ? "active" : ""}`}
                      onClick={() => {
                        setActivePortfolioId(optionValue);
                        setSwitcherOpen(false);
                      }}
                    >
                      <span>{getPortfolioLabel(portfolioItem, index)}</span>
                      {isActive && <span className="app-topbar-portfolio-active-mark">✓</span>}
                    </button>
                  );
                })}
              </div>

              <div className="app-topbar-portfolio-menu-actions">
                <button type="button" className="app-topbar-portfolio-action" onClick={handleCreatePortfolio}>
                  Create Portfolio
                </button>
                <button type="button" className="app-topbar-portfolio-action" onClick={handleManagePortfolios}>
                  Manage Portfolios
                </button>
              </div>
            </div>
          )}
        </div>

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
      {actionMessage && <div className="app-topbar-message">{actionMessage}</div>}
    </header>
  );
}
