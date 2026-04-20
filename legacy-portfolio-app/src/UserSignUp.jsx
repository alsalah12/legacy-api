// React is needed because this file returns JSX.
import React from "react";
// Link creates a clickable route link, and useNavigate lets us move routes in code.
import { Link, useNavigate } from "react-router-dom";
// Page-specific styles for the sign-up screen.
import "./UserSignUp.css";

// This component renders the first screen the user sees at "/".
function UserSignUp() {
  // navigate is a function from React Router that changes the current page.
  const navigate = useNavigate();

  // This runs when the form is submitted.
  const handleSubmit = (event) => {
    // Prevent the browser from doing a normal full-page form post.
    event.preventDefault();
    // For now, we skip real authentication and send the user straight to the dashboard.
    navigate("/dashboard");
  };

  return (
    // Outer wrapper used to centre the card on the screen.
    <div className="signup-page">
      {/* Card container that holds the sign-up content. */}
      <div className="signup-card">
        {/* Main title for the page. */}
        <h1>Legacy Portfolio</h1>
        {/* Supporting text under the title. */}
        <p className="signup-subtitle">Create your account to continue</p>

        {/* Form wrapper; submitting it runs handleSubmit above. */}
        <form className="signup-form" onSubmit={handleSubmit}>
          {/* Full name field. */}
          <label>
            Full name
            <input type="text" placeholder="Enter your full name" />
          </label>

          {/* Email field. */}
          <label>
            Email
            <input type="email" placeholder="you@example.com" />
          </label>

          {/* Password field. */}
          <label>
            Password
            <input type="password" placeholder="Create a password" />
          </label>

          {/* Submit button triggers the form's onSubmit handler. */}
          <button type="submit">Sign up</button>
        </form>

        {/* Secondary shortcut link for users who want to skip to the dashboard. */}
        <p className="signup-footnote">
          Already have an account? <Link to="/dashboard">Go to dashboard</Link>
        </p>
      </div>
    </div>
  );
}

// Export this page so App.jsx can mount it for the "/" route.
export default UserSignUp;