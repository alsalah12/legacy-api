// React is needed because this component returns JSX.
import React from "react";
// Link provides simple in-app navigation back to dashboard.
import { Link } from "react-router-dom";
// Page-specific styles for placeholder screens.
import "./ComingSoonPage.css";
import AppSidebar from "./components/AppSidebar";
import AppTopBar from "./components/AppTopBar";

// Reusable placeholder page for routes that are not fully implemented yet.
export default function ComingSoonPage({ title, description }) {
  return (
    <div className="coming-soon-page">
      {/* Sticky top bar shared across authenticated pages. */}
      <AppTopBar />

      {/* Shared sidebar keeps the left navigation identical everywhere. */}
      <AppSidebar />

      <main className="coming-soon-main app-page-main">
        <section className="coming-soon-card">
          {/* Page title */}
          <h1>{title}</h1>

          {/* Supporting text */}
          <p>{description}</p>

          {/* Route shortcut back to the main dashboard */}
          <Link to="/dashboard" className="coming-soon-link">
            Return to Portfolio Dashboard
          </Link>
        </section>
      </main>
    </div>
  );
}
