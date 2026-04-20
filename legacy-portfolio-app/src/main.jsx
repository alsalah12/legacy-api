// React gives us the JSX syntax and component model used across the app.
import React from "react";
// ReactDOM is responsible for mounting our React app into the real browser DOM.
import ReactDOM from "react-dom/client";
// BrowserRouter enables client-side routing, so different URLs can show different pages.
import { BrowserRouter } from "react-router-dom";
// App is the top-level component that decides which page to render.
import App from "./App";
import { PortfolioDataProvider } from "./services/holdingsData";
// Global styles apply shared fonts, colours, and layout defaults.
import "./index.css";

// Find the HTML element with id="root", create a React rendering root there,
// and then render the whole application into it.
ReactDOM.createRoot(document.getElementById("root")).render(
  // StrictMode only runs in development and helps catch unsafe patterns early.
  <React.StrictMode>
    <PortfolioDataProvider>
      {/* BrowserRouter watches the browser URL and keeps React Router in sync. */}
      <BrowserRouter>
        {/* App contains the route definitions for the different screens. */}
        <App />
      </BrowserRouter>
    </PortfolioDataProvider>
  </React.StrictMode>
);
