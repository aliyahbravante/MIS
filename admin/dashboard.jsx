import React, { useEffect, useState } from "react";
import "./dashboard.css";
import { FaBars } from "react-icons/fa";
import { Bar } from "react-chartjs-2";
import "chart.js/auto";

const Dashboard = () => {
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  const [dashboardData, setDashboardData] = useState({
    Drop: 0,
    pendingApplicants: 0,
    enrolledStudents: 0,
    subjects: 0,
    strands: 0,
    availableSlots: 0,
    faculties: 0,
    maleStudents: 0,
    femaleStudents: 0,
    enrollmentData: [] // Initialize as empty array
  });
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);

    // Use a direct URL to your hosted PHP file
    const apiUrl = "http://ncamisshs.com/backend/admin_dashboard.php";
    
    // Debug logging
    console.log("Fetching from:", apiUrl);
    
    fetch(apiUrl)
      .then((response) => {
        console.log("Response status:", response.status);
        return response.json();
      })
      .then((data) => {
        console.log("Data received:", data);
        setDashboardData(data);
      })
      .catch((error) => console.error("Error fetching data:", error));

    return () => clearInterval(timer);
  }, []);

  const dataEnrolled = {
    labels: dashboardData.enrollmentData ? 
            dashboardData.enrollmentData.map((entry) => entry.school_year) : [],
    datasets: [
      {
        label: "Enrolled",
        backgroundColor: "#006400",
        data: dashboardData.enrollmentData ? 
              dashboardData.enrollmentData.map((entry) => entry.count) : [],
      },
    ],
  };

  const dataGender = {
    labels: ["Female", "Male"],
    datasets: [
      {
        label: "Total Students by Gender",
        backgroundColor: ["#5ab75a", "#00642f"], // Different colors for better visualization
        data: [
          parseInt(dashboardData.femaleStudents) || 0, 
          parseInt(dashboardData.maleStudents) || 0
        ],
      },
    ],
  };

  const stats = [
     { title: "No. of Drops", value: dashboardData.Drop },
    { title: "No. of Applicants", value: dashboardData.pendingApplicants },
    { title: "Available Slots", value: dashboardData.availableSlots },
    { title: "Female Students", value: dashboardData.femaleStudents },
    { title: "Male Students", value: dashboardData.maleStudents },
    { title: "Enrolled Students", value: dashboardData.enrolledStudents },
  ];

  return (
    <div className="dashboard-container-dh">
      <div className="dashboard-header-dh">
        <h1 className="dash-title-d">DASHBOARD</h1>
        <h2 className="dash-time-d">{currentTime}</h2>
      </div>

      {/* Stats cards */}
      <div className="stats-container-dh">
        {stats.map((stat, index) => (
          <div key={index} className="stat-card-dh">
            <div className="stat-icon-dh">
              <FaBars />
            </div>
            <div className="stat-info-dh">
              <h3 className="stattitle-dh">{stat.title}</h3>
              <h2 className="statvalue-dh">{stat.value}</h2>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="charts-container-dh">
        <div className="chart-dh">
          <h3>Total Number of Enrolled</h3>
          <Bar data={dataEnrolled} options={{ 
            responsive: true,
            plugins: {
              legend: {
                position: 'top',
              },
              title: {
                display: true,
                text: 'Enrollment by Year'
              }
            }
          }} />
        </div>
        <div className="chart-dh">
          <h3>Total Number of Students by Gender</h3>
          <Bar data={dataGender} options={{ 
            responsive: true,
            plugins: {
              legend: {
                position: 'top',
              },
              title: {
                display: true,
                text: 'Gender Distribution'
              }
            }
          }} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;