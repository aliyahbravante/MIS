import React from 'react';
import './sidebar.css';
import cnaLogo from '../assets/cnalogo.png';

const Sidebar = ({ activeStep }) => {
  return (
    <div className="sidebar-gradient">
      <div className="sidebar">
      <img src={cnaLogo} alt="Logo" className="logo-img-s" />
        <h2 className="sidebar-subtitle">NORTHILLS COLLEGE OF ASIA</h2>
        <h1 className="sidebar-title">ADMISSION</h1>
        <ul className="steps">

          <li className={`step-item ${activeStep >= 1 ? 'active' : ''}`}>
            <span className="step-number">
              {activeStep > 1 ? '✔' : '1'}
            </span>
            <span className="sub">Personal Information</span>
            <div className={`step-line ${activeStep >= 2 ? 'completed' : ''}`}></div>
          </li>

          <li className={`step-item ${activeStep >= 2 ? 'active' : ''}`}>
            <span className="step-number">
              {activeStep > 2 ? '✔' : '2'}
            </span>
            <span className="sub">Enrollment Data</span>
            <div className={`step-line ${activeStep >= 3 ? 'completed' : ''}`}></div>
          </li>
          <li className={`step-item ${activeStep >= 3 ? 'active' : ''}`}>
            <span className="step-number">
              {activeStep > 3 ? '✔' : '3'}
            </span>
            <span className="sub">Family Background</span>
            <div className={`step-line ${activeStep >= 4 ? 'completed' : ''}`}></div>
          </li>

          <li className={`step-item ${activeStep >= 4 ? 'active' : ''}`}>
            <span className="step-number">
              {activeStep > 4 ? '✔' : '4'}
            </span>
            <span className="sub">Requirements</span>
            <div className={`step-line ${activeStep >= 5 ? 'completed' : ''}`}></div>
          </li>

          <li className={`step-item ${activeStep >= 5 ? 'active' : ''}`}>
            <span className="step-number">
              {activeStep > 5 ? '✔' : '5'} 
            </span>
            <span className="sub">Complete</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Sidebar;
