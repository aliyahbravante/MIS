import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash, FaArrowLeft } from 'react-icons/fa';
import './facultylogin.css';
import cnaLogo from '../assets/cnalogo.png';

const FacultyLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleLogin = async () => {
    // Validate input
    if (!email || !password) {
      setError('Email and password are required');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Using the domain from your ProfileEnrolledStudents component
      const apiUrl = 'http://ncamisshs.com/backend/facultylogin.php';
      
      console.log("Attempting login at:", apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      
      // Check if the response is JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        // Not JSON, likely an HTML error page
        const text = await response.text();
        console.error("Server returned non-JSON response:", text);
        throw new Error("Server error: Returned non-JSON response. Please contact the administrator.");
      }
      
      const result = await response.json();
      
      if (result.success) {
        // Pass faculty_id to the next interface
        navigate('/faculty-dashboard', { state: { faculty_id: result.faculty_id } });
      } else {
        setError(result.message || 'Invalid credentials');
      }
    } catch (error) {
      console.error("Error during login:", error);
      setError('An error occurred during login. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };
  const handleBackToFrontpage = () => {
    navigate('/');
  };
  
  return (
    <div className="admin-container">
      <div className="background-image-faculty">
        <button className="back-button-upper-left" onClick={handleBackToFrontpage}>
                  <FaArrowLeft className="back-icon-upper" />
                  Back
                </button>
        <div className="login-box-faculty">
          <img src={cnaLogo} alt="Logo" className="logo-img-al-faculty" />
          <h2 className="system-title-faculty">Northills College of Asia</h2>
          <div className="login-form-faculty">
            <hr className="separator-faculty" />
            <h2 className="sign-in-title-faculty">FACULTY PORTAL</h2>
            <input
              type="email"
              placeholder="Email"
              className="input-field-faculty"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <div className="password-container-faculty"> 
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                className="password-input-faculty"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              <button
                type="button"
                className="view-icon-button-faculty"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEye /> : <FaEyeSlash />}
              </button>
            </div>
            {error && <div className="error-message">{error}</div>}
            <button 
              className="login-button-faculty" 
              onClick={handleLogin}
              disabled={loading}
            >
              {loading ? 'LOGGING IN...' : 'LOGIN'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacultyLogin;