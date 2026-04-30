import React from "react";
import "./AppTopBar.css";
import { formatCurrency, usePortfolioData } from "../services/holdingsData";
import legacyLogo from "../assets/legacy-logo.png";
export default function AppTopBar() {
  const {
    totals,
    addFunds,
    actionMessage,
    actionError,
    portfoliosForActiveUser,
    activePortfolioId,
    setActivePortfolioId,
  } = usePortfolioData();
  const [switcherOpen, setSwitcherOpen] = React.useState(false);
  const [isAddFundsOpen, setIsAddFundsOpen] = React.useState(false);
  const [fundAmount, setFundAmount] = React.useState("1000");
  const [isSubmittingFunds, setIsSubmittingFunds] = React.useState(false);
  const switcherRef = React.useRef(null);
  const addFundsInputRef = React.useRef(null);

  const getPortfolioLabel = React.useCallback((portfolioItem, index) => {
    const name = String(portfolioItem?.name || "").trim();
    if (name) return name;

    const rawId = String(portfolioItem?.id ?? "").trim().toLowerCase();
    if (!rawId || rawId === "local-portfolio") {
      return `Portfolio ${index + 1}`;
    }

    const numericId = Number(rawId);
    if (Number.isFinite(numericId) && numericId > 0) {
      return `Portfolio ${numericId}`;
    }

    return `Portfolio ${index + 1}`;
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
        setIsAddFundsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  React.useEffect(() => {
    if (!isAddFundsOpen) return;

    const timer = window.setTimeout(() => {
      addFundsInputRef.current?.focus();
      addFundsInputRef.current?.select();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [isAddFundsOpen]);

  // Toggle sidebar visibility (for fully hidden mode).
  const handleToggleSidebar = () => {
    window.dispatchEvent(new CustomEvent("app-toggle-sidebar"));
  };

  const openAddFundsModal = () => {
    setFundAmount("1000");
    setIsAddFundsOpen(true);
  };

  const closeAddFundsModal = () => {
    if (isSubmittingFunds) return;
    setIsAddFundsOpen(false);
  };

  const handleAddFundsSubmit = async (event) => {
    event.preventDefault();
    const normalizedAmount = String(fundAmount).trim().replace(/[$,\s]/g, "");

    setIsSubmittingFunds(true);
    const result = await addFunds(normalizedAmount);
    setIsSubmittingFunds(false);

    if (result?.ok) {
      setIsAddFundsOpen(false);
    }
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
      <div className="app-topbar-left">
        <button
          type="button"
          className="app-topbar-menu-btn"
          onClick={handleToggleSidebar}
          aria-label="Toggle sidebar"
        >
          ☰
        </button>

        <img src={legacyLogo} alt="LEGACY" className="app-topbar-logo" />
      </div>

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
          onClick={openAddFundsModal}
        >
          + Add Funds
        </button>

      </div>
      {isAddFundsOpen ? (
        <div className="app-topbar-modal-backdrop" onClick={closeAddFundsModal}>
          <div
            className="app-topbar-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-funds-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="app-topbar-modal-header">
              <div>
                <h2 id="add-funds-title">Add Funds</h2>
                <p>Increase available cash for the active portfolio.</p>
              </div>
              <button type="button" className="app-topbar-modal-close" onClick={closeAddFundsModal} aria-label="Close add funds dialog">
                ×
              </button>
            </div>

            <form className="app-topbar-modal-form" onSubmit={handleAddFundsSubmit}>
              <label className="app-topbar-modal-field">
                <span>Amount</span>
                <input
                  ref={addFundsInputRef}
                  type="text"
                  inputMode="decimal"
                  value={fundAmount}
                  onChange={(event) => setFundAmount(event.target.value)}
                  placeholder="1000"
                  disabled={isSubmittingFunds}
                />
              </label>

              {actionError ? <div className="app-topbar-modal-error">{actionError}</div> : null}

              <div className="app-topbar-modal-actions">
                <button type="button" className="app-topbar-modal-secondary" onClick={closeAddFundsModal} disabled={isSubmittingFunds}>
                  Cancel
                </button>
                <button type="submit" className="app-topbar-modal-primary" disabled={isSubmittingFunds}>
                  {isSubmittingFunds ? "Adding..." : "Add Funds"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
      {actionMessage ? <div className="app-topbar-message">{actionMessage}</div> : null}
      {actionError ? <div className="app-topbar-message app-topbar-message-error">{actionError}</div> : null}
    </header>
  );
}
