import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Sidebar.css';

// Navigation items are stored as data objects so adding a new route
// later only requires adding one entry to this array.
const NAV_ITEMS = [
  { label: 'Dashboard', icon: '◈', path: '/dashboard' },
  { label: 'Holdings Performance', icon: '📈', path: '/dashboard' },
  { label: 'Buy and Sell', icon: '⇄', path: '/dashboard' },
  { label: 'Transaction History', icon: '🗒', path: '/transactions' },
  { label: 'Settings', icon: '⚙', path: '/dashboard' },
];

// collapsed  — boolean, whether the sidebar is in icon-only mode
// onToggle   — function to flip the collapsed state in the parent
// activeItem — string matching the label of the current active route
function Sidebar({ collapsed, onToggle, activeItem }) {
  const navigate = useNavigate();

  return (
    <aside className={`sidebar${collapsed ? ' collapsed' : ''}`}>
      {/* Toggle button sits at the top of the sidebar */}
      <div className="sidebar-top">
        <button
          type="button"
          className="sidebar-toggle"
          onClick={onToggle}
          aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
        >
          {collapsed ? '→' : '←'}
        </button>
      </div>

      <nav className="sidebar-nav" aria-label="Primary navigation">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.label}
            type="button"
            className={`nav-item${activeItem === item.label ? ' active' : ''}`}
            onClick={() => navigate(item.path)}
          >
            <span className="nav-icon">{item.icon}</span>
            {/* Hide text labels when collapsed, show only icons */}
            {!collapsed && <span className="nav-label">{item.label}</span>}
          </button>
        ))}

        {/* Sign Out sits visually separate at the bottom */}
        <button
          type="button"
          className="nav-item signout-item"
          onClick={() => navigate('/')}
        >
          <span className="nav-icon">⏻</span>
          {!collapsed && <span className="nav-label">Sign Out</span>}
        </button>
      </nav>
    </aside>
  );
}

export default Sidebar;
