import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { FaChartBar, FaUserAlt, FaFileAlt, FaMoneyBillWave, FaBook } from "react-icons/fa";
import { IoMenu, IoClose, IoLogOutOutline } from "react-icons/io5";
import "./parentsidebar.css";
import cnaLogo from '../assets/cnalogo.png';

const ParentSidebar = () => {
  const location = useLocation(); // Get the current path
  const studentId = location.state?.student_id; // Assume student_id is stored in the current route state
  const [menuOpen, setMenuOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const menuRef = useRef(null);
  
  // Function to check if the link is active
  const isActive = (path) => location.pathname === path;

  // Check if we're on laptop size (> 1024px)
  const isLaptopSize = () => {
    return window.innerWidth > 1024;
  };

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
    <div className="parent-sidebar-container">
            <nav className="navbar-side-ps">
              {/* Menu Toggle Button for Mobile */}
              <div className="hamburger-menu-side-ps" onClick={() => setMenuOpen(!menuOpen)}>
                {menuOpen ? <IoClose /> : <IoMenu />}
              </div>
              <div className="logo-container-side-ps">
                <img src={cnaLogo} alt="Logo" className="logo-img-side-ps" />
                <div className="divider-line-side-ps"></div>
                <div className="logo-text-side-ps">
                  <h1>Northills</h1>
                  <h2>College of Asia</h2>
                </div>
              </div>
            </nav>
      
      <div ref={menuRef} className={`parent-sidebar ${menuOpen ? "active" : ""} ${!isSidebarOpen && isLaptopSize() ? "sidebar-closed" : ""}`}>
                        <div className="mobile-logo-section">
                          <img src={cnaLogo} alt="NCA Logo" className="mobile-logo-img" />
                        </div>
      <div className="logo-section-ps">
        <button 
          className="logo-toggle-btn-ps"
          onClick={() => isLaptopSize() && setIsSidebarOpen(!isSidebarOpen)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          <img src={cnaLogo} alt="NCA Logo" className="logo-img-ps" />
        </button>
        {isSidebarOpen && (
          <>
            <div className="divider-line-ps"></div>
            <div className="logo-text-ps">
              <h1>Northills</h1>
              <h2>College of Asia</h2>
            </div>
          </>
        )}
      </div>
      
      <div className="sidebar-menu-ps">
      <div className="sidebar-section-1-ps">
        {isSidebarOpen && <h3 className="section-title-ps">PARENT</h3>}
        <ul>
          <li className={isActive("/parent-dashboard") ? "active" : ""}>
            <Link 
              to="/parent-dashboard" 
              className="menu-link-ps"
              state={{ student_id: studentId }}
              onClick={() => setMenuOpen(false)}
            >
              <FaChartBar className="icon-ps" /> {isSidebarOpen && <span>Dashboard</span>}
            </Link>
          </li>
          <li className={isActive("/p-student-profile") ? "active" : ""}>
            <Link 
              to="/p-student-profile" 
              className="menu-link-ps"
              state={{ student_id: studentId }}
              onClick={() => setMenuOpen(false)}
            >
              <FaUserAlt className="icon-ps" /> {isSidebarOpen && <span>Student Profile</span>}
            </Link>
          </li>
          <li className={isActive("/p-student-enrolled-subject") ? "active" : ""}>
            <Link 
              to="/p-student-enrolled-subject" 
              className="menu-link-ps"
              state={{ student_id: studentId }}
              onClick={() => setMenuOpen(false)}
            >
              <FaBook className="icon-ps" /> {isSidebarOpen && <span>Enrolled Subject</span>}
            </Link>
          </li>
          <li className={isActive("/p-student-grades") ? "active" : ""}>
            <Link 
              to="/p-student-grades" 
              className="menu-link-ps"
              state={{ student_id: studentId }}
              onClick={() => setMenuOpen(false)}
            >
              <FaFileAlt className="icon-ps" /> {isSidebarOpen && <span>Grades</span>}
            </Link>
          </li>
          <li className={isActive("/p-student-payment-records") ? "active" : ""}>
            <Link 
              to="/p-student-payment-records" 
              className="menu-link-ps"
              state={{ student_id: studentId }}
              onClick={() => setMenuOpen(false)}
            >
              <FaMoneyBillWave className="icon-ps" /> {isSidebarOpen && <span>Payment Records</span>}
            </Link>
          </li>
          <li>
            <Link 
              to="/" 
              className="menu-link-ps"
              state={{ student_id: studentId }}
              onClick={() => setMenuOpen(false)}
            >
              <IoLogOutOutline className="icon-ps" /> {isSidebarOpen && <span>Logout</span>}
            </Link>
          </li>
        </ul>
      </div>
      </div>
    </div>
    </div>
  );
};

export default ParentSidebar;
