// React is needed because this component returns JSX.
import React from "react";
// NavLink lets the sidebar know which route is currently active.
import { NavLink } from "react-router-dom";
// Shared sidebar styles used across all authenticated pages.
import "./AppSidebar.css";

// One shared source of truth for the left navigation.
const sidebarItems = [
  { label: "Dashboard", path: "/dashboard" },
  { label: "Holdings", path: "/holdings" },
  { label: "Buy & Sell", path: "/buy-sell" },
  { label: "Transaction History", path: "/transactions" },
];

// AppSidebar renders the same enterprise navigation on every page.
export default function AppSidebar() {
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

  return (
    <aside className={`app-sidebar ${collapsed ? "collapsed" : ""}`}>
      {/* Reusable nav links. NavLink adds the active class automatically. */}
      <nav className="app-sidebar-nav" aria-label="Primary navigation">
        {sidebarItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `app-sidebar-link ${isActive ? "active" : ""}`
            }
            title={item.label}
          >
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer timestamp fixed to bottom center of sidebar. */}
      <div className="app-sidebar-updated">Last updated: {sidebarUpdatedText}</div>
    </aside>
  );
}
