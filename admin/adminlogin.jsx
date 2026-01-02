import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash, FaArrowLeft } from 'react-icons/fa';
import './adminlogin.css';
import cnaLogo from '../assets/cnalogo.png';

const AdminLogin = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = () => {
    if (username === 'admin' && password === 'admin143') {
      navigate('/dashboard');
    } else {
      alert('Invalid username or password');
    }
  };

  const handleBackToFrontpage = () => {
    navigate('/');
  };

  return (
    <div className="admin-container-admin">
      <div className="background-image-admin">
           <button className="back-button-upper-left" onClick={handleBackToFrontpage}>
                  <FaArrowLeft className="back-icon-upper" />
                  Back
                </button>
        <div className="login-box-admin">
          <img src={cnaLogo} alt="Logo" className="logo-img-al-admin" />
          <h2 className="system-title-admin">Northills College of Asia</h2>

          <div className="login-form-admin">
            <hr className="separator-admin" />

            <h2 className="sign-in-title-admin">ADMINISTRATOR</h2>

            <input
              type="text"
              placeholder="Username"
              className="input-field-admin"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />

            <div className="password-container-admin">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                className="password-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="view-icon-button-admin"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEye /> : <FaEyeSlash />}
              </button>
            </div>

            <button className="login-button-admin" onClick={handleLogin}>LOGIN</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
