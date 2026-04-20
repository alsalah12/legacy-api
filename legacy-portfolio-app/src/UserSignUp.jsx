// React is needed because this file returns JSX.
import React, { useState } from "react";
// Link creates a clickable route link, and useNavigate lets us move routes in code.
import { Link, useNavigate } from "react-router-dom";
// Page-specific styles for the sign-up screen.
import "./UserSignUp.css";
import { usersAPI } from "./services/api";

// This component renders the first screen the user sees at "/".
function UserSignUp() {
  // navigate is a function from React Router that changes the current page.
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

      navigate("/dashboard");
    } catch (err) {
      console.error('Signup error:', err);
      setError(err.response?.data?.message || 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
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
          {/* Error message display */}
          {error && <div style={{color: '#d32f2f', marginBottom: '10px', fontSize: '14px'}}>{error}</div>}

          {/* Full name field. */}
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

          {/* Email field. */}
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

          {/* Password field. */}
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

          {/* Submit button triggers the form's onSubmit handler. */}
          <button type="submit" disabled={loading}>
            {loading ? 'Creating account...' : 'Sign up'}
          </button>
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