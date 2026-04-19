import React from "react";
import { Routes, Route } from "react-router-dom";
import UserSignUp from "./UserSignUp";
import Dashboard from "./Dashboard";
import TransactionHistoryPage from "./TransactionHistoryPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<UserSignUp />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/transactions" element={<TransactionHistoryPage />} />
    </Routes>
  );
}

export default App;