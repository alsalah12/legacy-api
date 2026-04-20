// React is needed because this component returns JSX.
import React from "react";
// NavLink lets the sidebar know which route is currently active.
import { NavLink, useLocation } from "react-router-dom";
import { usePortfolioData } from "../services/holdingsData";
// Shared sidebar styles used across all authenticated pages.
import "./AppSidebar.css";

// One shared source of truth for the left navigation.
const sidebarItems = [
  { label: "Dashboard", path: "/dashboard", icon: "⌂" },
  { label: "Holdings", path: "/holdings", icon: "◫" },
  { label: "Buy & Sell", path: "/buy-sell", icon: "⇄" },
  { label: "Transaction History", path: "/transactions", icon: "≣" },
];

// AppSidebar renders the same enterprise navigation on every page.
export default function AppSidebar() {
  const location = useLocation();
  const {
    users,
    activeUser,
    activeUserId,
    setActiveUserId,
    portfoliosForActiveUser,
    activePortfolioId,
    setActivePortfolioId,
  } = usePortfolioData();

  // Sidebar starts from saved preference if present.
  const [collapsed, setCollapsed] = React.useState(() => {
    return localStorage.getItem("sidebarCollapsed") === "true";
  });

  // Keep layout class and persisted state in sync with current collapse mode.
  React.useEffect(() => {
    document.body.classList.toggle("sidebar-collapsed", collapsed);
    localStorage.setItem("sidebarCollapsed", String(collapsed));

    // Cleanup when component unmounts.
    return () => {
      document.body.classList.remove("sidebar-collapsed");
    };
  }, [collapsed]);

  // Listen for toggle events sent by the top bar menu button.
  React.useEffect(() => {
    const handleToggle = () => {
      setCollapsed((previous) => !previous);
    };

    window.addEventListener("app-toggle-sidebar", handleToggle);

    return () => {
      window.removeEventListener("app-toggle-sidebar", handleToggle);
    };
  }, []);

  // Compact timestamp shown in the sidebar footer.
  const sidebarUpdatedText = new Date().toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  const holdingsCategory = new URLSearchParams(location.search).get("category") || "stocks";

  return (
    <aside className={`app-sidebar ${collapsed ? "collapsed" : ""}`}>
      {/* Reusable nav links. NavLink adds the active class automatically. */}
      <nav className="app-sidebar-nav" aria-label="Primary navigation">
        {sidebarItems.map((item) => {
          const isHoldingsItem = item.path === "/holdings";

          return (
            <div key={item.path} className="app-sidebar-item-group">
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `app-sidebar-link ${isActive ? "active" : ""}`
                }
                title={item.label}
              >
                {/* Icons stay visible in collapsed mode so navigation remains usable. */}
                <span className="app-sidebar-link-icon" aria-hidden="true">{item.icon}</span>
                <span className="app-sidebar-link-label">{item.label}</span>
              </NavLink>

              {/* Holdings gets a lightweight secondary navigation without changing routes. */}
              {isHoldingsItem && location.pathname === "/holdings" && !collapsed && (
                <div className="app-sidebar-subnav" aria-label="Holdings categories">
                  {[
                    { label: "Stocks", value: "stocks" },
                    { label: "Bonds", value: "bonds" },
                    { label: "Crypto", value: "crypto" },
                  ].map((category) => (
                    <NavLink
                      key={category.value}
                      to={`/holdings?category=${category.value}`}
                      className={`app-sidebar-sublink ${holdingsCategory === category.value ? "active" : ""}`}
                    >
                      <span className="app-sidebar-sublink-dot" aria-hidden="true">•</span>
                      <span className="app-sidebar-sublink-label">{category.label}</span>
                    </NavLink>
                  ))}
                </div>
              )}

              {/* In collapsed mode we intentionally hide the holdings sub-items to keep the rail uncluttered. */}
              {isHoldingsItem && location.pathname === "/holdings" && collapsed && (
                <div className="app-sidebar-subnav-collapsed" aria-hidden="true">
                  {[
                    { value: "stocks" },
                    { value: "bonds" },
                    { value: "crypto" },
                  ].map((category) => (
                    <span
                      key={category.value}
                      className={`app-sidebar-subnav-indicator ${holdingsCategory === category.value ? "active" : ""}`}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Anchored profile area near sidebar bottom center.
          This keeps identity/context controls separate from navigation links. */}
      <div className={`app-sidebar-profile ${collapsed ? "collapsed" : ""}`}>
        <div className="app-sidebar-profile-avatar" aria-hidden="true">
          {(activeUser?.name || "U").charAt(0).toUpperCase()}
        </div>
        {!collapsed && (
          <>
            <div className="app-sidebar-profile-name">{activeUser?.name || "User"}</div>
            <div className="app-sidebar-profile-email">{activeUser?.email || "No email"}</div>

            <div className="app-sidebar-profile-controls">
              <select
                className="app-sidebar-profile-select"
                value={activeUserId}
                onChange={(event) => setActiveUserId(event.target.value)}
                aria-label="Select user"
              >
                {users.map((user) => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </select>

              <select
                className="app-sidebar-profile-select"
                value={activePortfolioId}
                onChange={(event) => setActivePortfolioId(event.target.value)}
                aria-label="Select portfolio"
              >
                {portfoliosForActiveUser.map((portfolioItem, index) => (
                  <option key={portfolioItem.id || index} value={portfolioItem.id || ""}>
                    Portfolio {portfolioItem.id || index + 1}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}
      </div>

      {/* Footer timestamp fixed to bottom center of sidebar. */}
      <div className="app-sidebar-updated">Last updated: {sidebarUpdatedText}</div>
    </aside>
  );
}
