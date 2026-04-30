import React from "react";
import "./PageHeader.css";

export default function PageHeader({ title, subtitle = "", titleAdornment = null, actions = null }) {
  return (
    <header className="app-page-header">
      <div className="app-page-header-main">
        <div className="app-page-title-row">
          <h1 className="app-page-title">{title}</h1>
          {titleAdornment ? <div className="app-page-title-adornment">{titleAdornment}</div> : null}
        </div>
        {subtitle ? <p className="app-page-subtitle">{subtitle}</p> : null}
      </div>

      {actions ? <div className="app-page-header-actions">{actions}</div> : null}
    </header>
  );
}
