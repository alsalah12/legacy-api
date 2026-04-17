import React from "react";
import { Link, useNavigate } from "react-router-dom";
import "./UserSignUp.css";

function UserSignUp() {
  const navigate = useNavigate();

  const handleSubmit = (event) => {
    event.preventDefault();
    navigate("/dashboard");
  };

  return (
    <div className="signup-page">
      <div className="signup-card">
        <h1>Legacy Portfolio</h1>
        <p className="signup-subtitle">Create your account to continue</p>

        <form className="signup-form" onSubmit={handleSubmit}>
          <label>
            Full name
            <input type="text" placeholder="Enter your full name" />
          </label>

          <label>
            Email
            <input type="email" placeholder="you@example.com" />
          </label>

          <label>
            Password
            <input type="password" placeholder="Create a password" />
          </label>

          <button type="submit">Sign up</button>
        </form>

        <p className="signup-footnote">
          Already have an account? <Link to="/dashboard">Go to dashboard</Link>
        </p>
      </div>
    </div>
  );
}

export default UserSignUp;