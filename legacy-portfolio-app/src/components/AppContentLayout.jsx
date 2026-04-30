import React from "react";
import "./AppContentLayout.css";

export default function AppContentLayout({ children, shellClassName = "", shellStyle }) {
  return (
    <main className="main-content app-page-main app-content-layout">
      <div className={`app-content-shell ${shellClassName}`.trim()} style={shellStyle}>
        {children}
      </div>
    </main>
  );
}
