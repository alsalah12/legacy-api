import React from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import UserSignUp from "./UserSignUp";
import Dashboard from "./Dashboard";
import TransactionHistoryPage from "./TransactionHistoryPage";
import BuySell from "./BuySell";
import Holdings from "./Holdings";
import ComingSoonPage from "./ComingSoonPage";

// Keeps the browser tab title in sync with the current route.
function RouteTitleManager() {
  const location = useLocation();

  React.useEffect(() => {
    const titleByPath = {
      "/": "User Sign Up | Legacy",
      "/dashboard": "Portfolio Dashboard | Legacy",
      "/holdings": "Holdings | Legacy",
      "/buy-sell": "Buy & Sell | Legacy",
      "/transactions": "Transaction History | Legacy",
    };
    document.title = titleByPath[location.pathname] || "Legacy Portfolio Manager";
  }, [location.pathname]);

  return null;
}

function App() {
  return (
    <>
      <RouteTitleManager />

      <Routes>
        <Route path="/" element={<UserSignUp />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/holdings" element={<Holdings />} />
        <Route path="/buy-sell" element={<BuySell />} />
        <Route path="/transactions" element={<TransactionHistoryPage />} />
      </Routes>
    </>
  );
}

export default App;