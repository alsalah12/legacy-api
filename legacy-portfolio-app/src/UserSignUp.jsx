import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./UserSignUp.css";
import { usersAPI } from "./services/api";
import legacyLogo from "./assets/legacy-logo.png";

function UserSignUp() {
  const navigate = useNavigate();

  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  // This runs when the form is submitted.
  const handleSubmit = async (event) => {
    // Prevent the browser from doing a normal full-page form post.
    event.preventDefault();
    
    // Validate form
    if (!formData.fullName.trim() || !formData.email.trim() || !formData.password.trim()) {
      setError('All fields are required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Call the API to create a new user
      const response = await usersAPI.createUser({
        name: formData.fullName,
        email: formData.email,
        password: formData.password,
      });

      console.log('User created successfully:', response.data);
      
      // Store user info and navigate to dashboard
      localStorage.setItem('currentUser', JSON.stringify({
        name: formData.fullName,
        email: formData.email,
      }));

      // Keep shared multi-user model in sync so dashboard greeting/profile updates immediately.
      const existingUsers = JSON.parse(localStorage.getItem('legacy.users') || '[]');
      const newUser = {
        id: `user-${(formData.email || formData.fullName).toLowerCase().replace(/\s+/g, '-')}`,
        name: formData.fullName,
        email: formData.email,
        portfolioIds: [],
      };
      const mergedUsers = Array.isArray(existingUsers)
        ? [newUser, ...existingUsers.filter((user) => user?.id !== newUser.id)]
        : [newUser];
      localStorage.setItem('legacy.users', JSON.stringify(mergedUsers));
      localStorage.setItem('legacy.activeUserId', newUser.id);
      window.dispatchEvent(new CustomEvent('legacy-user-updated'));

      navigate("/dashboard");
    } catch (err) {
      console.error('Signup error:', err);
      setError(err.response?.data?.message || 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-page">
      <aside className="signup-brand-panel" aria-hidden="true">
        <div className="signup-brand-glow" />
        <div className="signup-brand-content">
          <img src={legacyLogo} alt="LEGACY" className="signup-brand-logo" />
          <p className="signup-brand-tagline">Build wealth with clarity.</p>
        </div>
      </aside>

      <section className="signup-form-panel">
        <div className="signup-card">
          <h1>Create your account</h1>
          <p className="signup-subtitle">Start managing your portfolio with LEGACY</p>

          <form className="signup-form" onSubmit={handleSubmit}>
            <label>
              Full name
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                placeholder="Enter your full name"
              />
            </label>

            <label>
              Email
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="you@example.com"
              />
            </label>

            <label>
              Password
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Create a password"
              />
            </label>

            {error ? <p className="signup-error">{error}</p> : null}

            <button type="submit" disabled={loading}>
              {loading ? "Creating account..." : "Sign up"}
            </button>
          </form>

          <p className="signup-footnote">
            Already have an account? <Link to="/dashboard">Go to dashboard</Link>
          </p>
        </div>
      </section>
      </div>
  );
}

export default UserSignUp;