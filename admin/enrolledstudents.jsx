import React, { useEffect, useState } from 'react';
import './enrolledstudents.css';
import { FaEye, FaFilePdf, FaFileExcel } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

const EnrolledStudents = () => {
  const navigate = useNavigate();
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [exportType, setExportType] = useState(null);

  // API base URL
  const API_BASE_URL = 'http://ncamisshs.com/backend/fetch_enrolled.php';
  const AUDIT_LOG_URL = 'http://ncamisshs.com/backend/audit_log.php';
  const UPDATE_STATUS_URL = 'http://ncamisshs.com/backend/update_student_status.php';

  // Function to log audit
  const logAudit = async (action, details) => {
    try {
      const response = await fetch(AUDIT_LOG_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user: 'Admin',
          action: action,
          details: details
        })
      });

      const result = await response.json();
      if (!result.success) {
        console.error('Failed to log audit:', result.message);
      }
    } catch (error) {
      console.error('Error logging audit:', error);
    }
  };

  // Fetch enrolled students from the server
  const fetchEnrolledStudents = async () => {
    try {
      setLoading(true);
      console.log("Fetching enrolled students from:", API_BASE_URL);
      
      const response = await fetch(API_BASE_URL);
      console.log("Response status:", response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Data received:", data);
      
      if (data && data.success && Array.isArray(data.applicants)) {
        console.log("Setting applicants:", data.applicants);
        setApplicants(data.applicants);
      } else {
        console.error("Unexpected data format:", data);
        throw new Error(data.message || 'Failed to fetch enrolled students');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching enrolled students:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load enrolled students on component mount
  useEffect(() => {
    fetchEnrolledStudents();
  }, []);
  
  const viewApplicant = async (applicantData) => {
    await logAudit('VIEW', `Viewed Enrolled Student Detail: ${applicantData.name || 'Unknown Student'} (ID: ${applicantData.student_id})`);
    
    navigate('/profile-enrolled-students', { state: { student_id: applicantData.student_id } });
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleGradeFilterChange = (e) => {
    setGradeFilter(e.target.value);
  };

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
  };

  // Handle status change for individual student
  const handleStatusChange = async (studentId, newStatus, studentName) => {
    try {
      const response = await fetch(UPDATE_STATUS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          student_id: studentId,
          status: newStatus
        })
      });

      const result = await response.json();
      
      if (result.success) {
        // Update local state
        setApplicants(prevApplicants =>
          prevApplicants.map(applicant =>
            applicant.student_id === studentId
              ? { ...applicant, status: newStatus }
              : applicant
          )
        );

        // Log audit
        await logAudit('UPDATE', `Updated student status: ${studentName} (ID: ${studentId}) to ${newStatus}`);
      } else {
        console.error('Failed to update status:', result.message);
        alert('Failed to update status. Please try again.');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error updating status. Please try again.');
    }
  };

  // Enhanced filter function with status filter
  const filteredApplicants = applicants.filter((applicant) => {
    const searchLower = searchQuery.trim().toLowerCase();
    
    // Search filter
    let matchesSearch = true;
    if (searchLower) {
      const nameMatch = (applicant.name || '').toLowerCase().includes(searchLower);
      const emailMatch = (applicant.email || '').toLowerCase().includes(searchLower);
      const gradeLevelMatch = (applicant.gradeLevel || '').toLowerCase().includes(searchLower);
      const sectionMatch = (applicant.section || '').toLowerCase().includes(searchLower);
      
      matchesSearch = nameMatch || emailMatch || gradeLevelMatch || sectionMatch;
    }
    
    // Grade filter
    const matchesGrade = gradeFilter === 'all' || applicant.gradeLevel === gradeFilter;
    
    // Status filter
    const studentStatus = (applicant.status || 'enrolled').toLowerCase();
    const matchesStatus = statusFilter === 'all' || studentStatus === statusFilter.toLowerCase();
    
    return matchesSearch && matchesGrade && matchesStatus;
  });

  // Function to get export description based on current filters
  const getExportDescription = () => {
    let description = "";
    
    if (statusFilter !== "all") {
      description += `${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} Students`;
    } else if (gradeFilter !== "all") {
      description += `${gradeFilter} Students`;
    } else {
      description += "All Enrolled Students";
    }
    
    if (searchQuery.trim()) {
      description += ` (Search: "${searchQuery.trim()}")`;
    }
    
    return description;
  };

  // Function to trigger confirmation modal
  const confirmExport = (type) => {
    setExportType(type);
    setShowConfirmModal(true);
  };

  // Function to export to PDF
  const exportToPDF = async () => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.setTextColor(0, 100, 0);
    
    // Set title based on status filter
    let title = "Student List";
    if (statusFilter !== "all") {
      title = `${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} Students List`;
    }
    doc.text(title, 14, 20);
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.text(`Total Students: ${filteredApplicants.length}`, 14, 30);
    
    const tableColumn = ["No.", "Name", "Email", "Grade Level", "Section", "Status"];
    const tableRows = [];

    filteredApplicants.forEach((applicant, index) => {
      const studentData = [
        index + 1,
        applicant.name,
        applicant.email,
        applicant.gradeLevel,
        applicant.section,
        (applicant.status || 'enrolled').charAt(0).toUpperCase() + (applicant.status || 'enrolled').slice(1)
      ];
      tableRows.push(studentData);
    });

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 35,
      styles: { 
        fontSize: 10,
        cellPadding: 3,
        overflow: 'linebreak'
      },
      headStyles: {
        fillColor: [0, 100, 0],
        textColor: [255, 255, 255]
      }
    });

    // Set filename based on status filter
    let filename = "student_list.pdf";
    if (statusFilter !== "all") {
      filename = `${statusFilter.toLowerCase()}_students.pdf`;
    }
    doc.save(filename);
    
    const exportDesc = getExportDescription();
    await logAudit('EXPORT', `Exported ${statusFilter !== "all" ? statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1) + " Students List" : "Student List"} to PDF: ${exportDesc} - ${filteredApplicants.length} students`);
  };

  // Function to export to Excel
  const exportToExcel = async () => {
    const worksheet = XLSX.utils.json_to_sheet(
      filteredApplicants.map((applicant, index) => ({
        "No.": index + 1,
        "Name": applicant.name,
        "Email": applicant.email,
        "Grade Level": applicant.gradeLevel,
        "Section": applicant.section,
        "Status": (applicant.status || 'enrolled').charAt(0).toUpperCase() + (applicant.status || 'enrolled').slice(1)
      }))
    );
    
    const workbook = XLSX.utils.book_new();
    // Set sheet name based on status filter
    let sheetName = "Student List";
    if (statusFilter !== "all") {
      sheetName = `${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} Students`;
    }
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    // Set filename based on status filter
    let filename = "student_list.xlsx";
    if (statusFilter !== "all") {
      filename = `${statusFilter.toLowerCase()}_students.xlsx`;
    }
    XLSX.writeFile(workbook, filename);
    
    const exportDesc = getExportDescription();
    await logAudit('EXPORT', `Exported ${statusFilter !== "all" ? statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1) + " Students List" : "Student List"} to Excel: ${exportDesc} - ${filteredApplicants.length} students`);
  };

  // Handle export based on confirmation
  const handleExportConfirmed = () => {
    if (exportType === 'pdf') {
      exportToPDF();
    } else if (exportType === 'excel') {
      exportToExcel();
    }
    setShowConfirmModal(false);
  };

  return (
    <div className="enrolled-students-container-es">
      <div className="enrolled-students-header-es">
        <h2 className="enrolled-students-title-es">STUDENTS LIST</h2>
        <p className="enrolled-students-total-label-es">Total: <span className="enrolled-students-total-count-es">{filteredApplicants.length}</span></p>
      </div>
      <div className="top-controls-enrolledstudents">
        <div className="search-bar-enrolledstudents">
          <input
            type="text"
            placeholder="Search by name, email, grade level, or section..."
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>
        <div className="export-buttons">
          <select
            className="enrolled-students-filter-es"
            value={statusFilter}
            onChange={handleStatusFilterChange}
          >
            <option value="all">All Status</option>
            <option value="enrolled">Enrolled</option>
            <option value="drop">Drop</option>
            <option value="graduate">Graduate</option>
            <option value="transfer">Transfer</option>
          </select>
          <select
            className="enrolled-students-filter-es"
            value={gradeFilter}
            onChange={handleGradeFilterChange}
          >
            <option value="all">All Grades</option>
            <option value="Grade 11">Grade 11</option>
            <option value="Grade 12">Grade 12</option>
          </select>
          <button 
            className="enrolled-students-pdf-button-es"
            onClick={() => confirmExport('pdf')}
          >
            <FaFilePdf className="export-icon" /> PDF
          </button>
          <button 
            className="enrolled-students-excel-button-es"
            onClick={() => confirmExport('excel')}
          >
            <FaFileExcel className="export-icon" /> Excel
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-indicator">Loading enrolled students...</div>
      ) : error ? (
        <div className="error-message">Error: {error}</div>
      ) : (
        <div className="enrolled-students-table-container">
          <table className="enrolled-students-table">
            <thead>
              <tr>
                <th>NO.</th>
                <th>NAME</th>
                <th>EMAIL</th>
                <th>GRADE LEVEL</th>
                <th>SECTION</th>
                <th>STATUS</th>
                <th>VIEW</th>
              </tr>
            </thead>  
            <tbody>
              {filteredApplicants.length > 0 ? (
                filteredApplicants.map((applicant, index) => (
                  <tr key={applicant.student_id || index}>
                    <td>{index + 1}</td>
                    <td>{applicant.name || 'N/A'}</td>
                    <td>{applicant.email || 'N/A'}</td>
                    <td>{applicant.gradeLevel || 'N/A'}</td>
                    <td>{applicant.section || 'N/A'}</td>
                    <td>
                      {applicant.status === 'graduate' || applicant.status === 'graduated' ? (
                        <span className="enrolled-students-status-text-es">GRADUATE</span>
                      ) : (
                        <select
                          className="enrolled-students-status-dropdown-es"
                          value={(applicant.status || 'enrolled').toLowerCase()}
                          onChange={(e) => handleStatusChange(applicant.student_id, e.target.value, applicant.name)}
                        >
                          <option value="enrolled">Enrolled</option>
                          <option value="drop">Drop</option>
                          <option value="transfer">Transfer</option>
                        </select>
                      )}
                    </td>
                    <td>
                      <FaEye
                        className="enrolled-students-view-icon"
                        onClick={() => viewApplicant(applicant)}
                        style={{ cursor: 'pointer', color: '#006400' }}
                      />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center' }}>No enrolled students found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="confirmation-modal-es">
          <div className="modal-content-es">
            <h3>Confirm Export</h3>
            <p>Are you sure you want to export the data to {exportType === 'pdf' ? 'PDF' : 'Excel'}?</p>
            <div className="modal-buttons-es">
              <button className="confirm-button-es" onClick={handleExportConfirmed}>Yes</button>
              <button className="cancel-button-es" onClick={() => setShowConfirmModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnrolledStudents;