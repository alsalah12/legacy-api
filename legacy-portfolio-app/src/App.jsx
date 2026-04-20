// React is required because this file returns JSX.
import React from "react";
// Routes and Route are the building blocks for page-to-component mapping.
import { Routes, Route, useLocation } from "react-router-dom";
// Import each page component that can be shown by a route.
import UserSignUp from "./UserSignUp";
import Dashboard from "./Dashboard";
import TransactionHistoryPage from "./TransactionHistoryPage";
import BuySell from "./BuySell";
import Holdings from "./Holdings";
import ComingSoonPage from "./ComingSoonPage";

// This helper component updates the browser tab title whenever the route changes.
function RouteTitleManager() {
  // location gives us the current URL path.
  const location = useLocation();

  React.useEffect(() => {
    // Map each route to the title text you want in the browser tab.
    const titleByPath = {
      "/": "User Sign Up | Legacy",
      "/dashboard": "Portfolio Dashboard | Legacy",
      "/holdings": "Holdings | Legacy",
      "/buy-sell": "Buy & Sell | Legacy",
      "/transactions": "Transaction History | Legacy",
    };

    // Fallback title if a new route is added later and not mapped yet.
    document.title = titleByPath[location.pathname] || "Legacy Portfolio Manager";
  }, [location.pathname]);

  // This component does not render UI. It only handles side effects.
  return null;
}

// App acts like the traffic controller for the frontend.
// It does not draw the full UI itself; instead, it chooses which page to show.
function App() {
  return (
    // Routes looks at the current URL and renders the first matching Route.
    <>
      {/* Keeps the browser tab title in sync with the current route. */}
      <RouteTitleManager />

      <Routes>
        {/* The root path shows the sign-up / landing page. */}
        <Route path="/" element={<UserSignUp />} />
        {/* The dashboard path shows the main portfolio overview screen. */}
        <Route path="/dashboard" element={<Dashboard />} />
        {/* The holdings path shows the portfolio holdings summary and allocation view. */}
        <Route path="/holdings" element={<Holdings />} />
        {/* The buy and sell path shows the stock trading table and actions. */}
        <Route path="/buy-sell" element={<BuySell />} />
        {/* The transactions path shows the history table and filters. */}
        <Route path="/transactions" element={<TransactionHistoryPage />} />
      </Routes>
    </>
  );
}

// Export App so main.jsx can render it.
export default App;