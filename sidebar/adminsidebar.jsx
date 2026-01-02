import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { IoMenu, IoClose, IoLogOutOutline } from "react-icons/io5";
import { IoMdNotifications } from "react-icons/io";
import { TbLogs } from "react-icons/tb";
import {
  FaChartBar,
  FaUserGraduate,
  FaUserAlt,
  FaBook,
  FaBuilding,
  FaChalkboardTeacher,
  FaFileAlt,
  FaMoneyBillWave,
} from "react-icons/fa";
import "./adminsidebar.css";
import cnaLogo from '../assets/cnalogo.png';

const AdminSidebar = () => {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const menuRef = useRef(null);

  const isActive = (path) => location.pathname === path;

  // Check if we're on laptop size (> 1024px)
  const isLaptopSize = () => {
    return window.innerWidth > 1024;
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

  return (
    <div className="admin-sidebar-container">
      <nav className="navbar-side">
        {/* Menu Toggle Button for Mobile */}
        <div className="hamburger-menu-side" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <IoClose /> : <IoMenu />}
        </div>
        <div className="logo-container-side">
          <img src={cnaLogo} alt="Logo" className="logo-img-side" />
          <div className="divider-line-side"></div>
          <div className="logo-text-side">
            <h1>Northills</h1>
            <h2>College of Asia</h2>
          </div>
        </div>
      </nav>

      {/* Sidebar */}
      <div ref={menuRef} className={`admin-sidebar ${menuOpen ? "active" : ""} ${!isSidebarOpen && isLaptopSize() ? "sidebar-closed" : ""}`}>
        {/* Mobile/Tablet Logo Section - Only shows on smaller screens */}
        <div className="mobile-logo-section">
          <img src={cnaLogo} alt="NCA Logo" className="mobile-logo-img" />
        </div>

        {/* Desktop Logo Section - Only shows on larger screens */}
        <div className="logo-section-as">
          <button 
            className="logo-toggle-btn"
            onClick={() => isLaptopSize() && setIsSidebarOpen(!isSidebarOpen)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <img src={cnaLogo} alt="NCA Logo" className="logo-img-as" />
          </button>
          {isSidebarOpen && (
            <>
              <div className="divider-line-as"></div>
              <div className="logo-text-as">
                <h1>Northills</h1>
                <h2>College of Asia</h2>
              </div>
            </>
          )}
        </div>

        <div className="sidebar-menu-side">
          <div className="sidebar-section-1">
            {isSidebarOpen && <h3 className="section-title">ADMINISTRATOR</h3>}
            <ul>
              <li className={isActive("/dashboard") ? "active" : ""}>
                <Link to="/dashboard" className="menu-link" onClick={() => setMenuOpen(false)}>
                  <FaChartBar className="icon" /> {isSidebarOpen && <span>Dashboard</span>}
                </Link>
              </li>
              <li className={isActive("/applicants") ? "active" : ""}>
                <Link to="/applicants" className="menu-link" onClick={() => setMenuOpen(false)}>
                  <FaUserGraduate className="icon" /> {isSidebarOpen && <span>Applicants</span>}
                </Link>
              </li>
              <li className={isActive("/announcement") ? "active" : ""}>
                <Link to="/announcement" className="menu-link" onClick={() => setMenuOpen(false)}>
                  <IoMdNotifications className="icon" /> {isSidebarOpen && <span>Announcement</span>}
                </Link>
              </li>
            </ul>

            {isSidebarOpen && <h3 className="section-title">STUDENT SECTION</h3>}
            <ul>
              <li className={isActive("/enrolled-students") ? "active" : ""}>
                <Link to="/enrolled-students" className="menu-link" onClick={() => setMenuOpen(false)}>
                  <FaUserAlt className="icon" /> {isSidebarOpen && <span>Students List</span>}
                </Link>
              </li>
              <li className={isActive("/subjects") ? "active" : ""}>
                <Link to="/subjects" className="menu-link" onClick={() => setMenuOpen(false)}>
                  <FaBook className="icon" /> {isSidebarOpen && <span>Subjects/Schedule</span>}
                </Link>
              </li>
            </ul>

            {isSidebarOpen && <h3 className="section-title">DEPARTMENT SECTION</h3>}
            <ul>
              <li className={isActive("/strands") ? "active" : ""}>
                <Link to="/strands" className="menu-link" onClick={() => setMenuOpen(false)}>
                  <FaBuilding className="icon" /> {isSidebarOpen && <span>Strands</span>}
                </Link>
              </li>
              <li className={isActive("/faculty") ? "active" : ""}>
                <Link to="/faculty" className="menu-link" onClick={() => setMenuOpen(false)}>
                  <FaChalkboardTeacher className="icon" /> {isSidebarOpen && <span>Faculty</span>}
                </Link>
              </li>
              <li className={isActive("/student-report-lists") ? "active" : ""}>
                <Link to="/admin-report" className="menu-link" onClick={() => setMenuOpen(false)}>
                  <FaFileAlt className="icon" /> {isSidebarOpen && <span>Reports</span>}
                </Link>
              </li>
              <li className={isActive("/audit-logs") ? "active" : ""}>
                <Link to="/audit-logs" className="menu-link" onClick={() => setMenuOpen(false)}>
                  <TbLogs className="icon" /> {isSidebarOpen && <span>Audit Logs</span>}
                </Link>
              </li>
              <li className={isActive("/payment") ? "active" : ""}>
                <Link to="/payment" className="menu-link" onClick={() => setMenuOpen(false)}>
                  <FaMoneyBillWave className="icon" /> {isSidebarOpen && <span>Payment</span>}
                </Link>
              </li>
              <li>
                <Link to="/" className="menu-link" onClick={() => setMenuOpen(false)}>
                  <IoLogOutOutline className="icon" /> {isSidebarOpen && <span>Logout</span>}
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSidebar;