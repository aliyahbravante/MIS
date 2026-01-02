import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./subjectschedule.css";
import { FaFilePdf, FaFileExcel } from 'react-icons/fa';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

const SubjectSchedule = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const faculty_id = location.state?.faculty_id; // Retrieve faculty_id from location state

  const [subjectsschedule, setSubjectsSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [criticalError, setCriticalError] = useState(null); // Only for critical errors
  const [searchTerm, setSearchTerm] = useState(""); // State for the search term
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [exportType, setExportType] = useState(null);

  useEffect(() => {
    // Ensure faculty_id exists before making the API request
    if (!faculty_id) {
      console.error("Faculty ID is missing");
      setCriticalError("Faculty ID is missing. Please log in again.");
      setLoading(false);
      return;
    }

    const fetchSubjects = async () => {
      try {
        const apiUrl = `http://ncamisshs.com/backend/studentschedule.php?faculty_id=${faculty_id}`;
        console.log("Fetching subjects from:", apiUrl);
        
        const response = await fetch(apiUrl, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          console.warn(`Could not fetch subjects. Status: ${response.status}`);
          console.log("Setting subjects to empty array - no subjects available");
          setSubjectsSchedule([]);
          return;
        }

        const data = await response.json();
        console.log("Subjects response:", data);

        if (data.success && data.subjects && data.subjects.length > 0) {
          console.log("Subjects found:", data.subjects.length, "subjects");
          setSubjectsSchedule(data.subjects);
        } else {
          console.warn("No subjects found:", data.message || "No subjects returned");
          console.log("Setting subjects to empty array - no subjects available for this faculty");
          setSubjectsSchedule([]);
        }
      } catch (err) {
        console.error("Error fetching subjects:", err);
        console.log("Setting subjects to empty array due to error");
        setSubjectsSchedule([]);
        // Don't set critical error for API issues - just continue with empty array
      } finally {
        setLoading(false);
      }
    };

    fetchSubjects();
  }, [faculty_id]); // Re-fetch when faculty_id changes

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value); // Update search term on input change
  };

  const handleViewGrades = (subject) => {
    // Navigate to the Grades page and pass subject details along with subject_id and faculty_id as state
    navigate("/fgrades", {
      state: {
        faculty_id, // Pass the faculty_id
        subject_id: subject.subject_id, // Pass the subject_id
        description: subject.description,
        semester: subject.semester,
        grade_level: subject.grade,
        section: subject.section,
        strand: subject.strand,
      },
    });
  };

  // Filter the subjectsschedule based on the search term
  const filteredSubjectsSchedule = subjectsschedule.filter((subject) =>
    subject.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subject.codeNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subject.semester.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subject.teacher.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subject.schedule.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subject.grade.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subject.section.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subject.strand.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Function to trigger confirmation modal
  const confirmExport = (type) => {
    if (filteredSubjectsSchedule.length === 0) {
      alert("No data available to export.");
      return;
    }
    setExportType(type);
    setShowConfirmModal(true);
  };

  // Function to export to PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Add title with color
    doc.setFontSize(18);
    doc.setTextColor(0, 100, 0); // Dark green color (RGB)
    doc.text("Subject Schedule", 14, 20);
    
    // Reset text color for the rest of the content
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.text(`Total Subjects: ${filteredSubjectsSchedule.length}`, 14, 30);
    
    const tableColumn = ["Description", "Code No.", "Semester", "Faculty", "Schedule", "Grade Level", "Section", "Strand", "Units"];
    const tableRows = [];

    filteredSubjectsSchedule.forEach((subject) => {
      const subjectData = [
        subject.description,
        subject.codeNo,
        subject.semester,
        subject.teacher,
        subject.schedule,
        subject.grade,
        subject.section,
        subject.strand,
        subject.unit
      ];
      tableRows.push(subjectData);
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

    doc.save("subject_schedule.pdf");
  };

  // Function to export to Excel
  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      filteredSubjectsSchedule.map((subject) => ({
        "Description": subject.description,
        "Code No.": subject.codeNo,
        "Semester": subject.semester,
        "Faculty": subject.teacher,
        "Schedule": subject.schedule,
        "Grade Level": subject.grade,
        "Section": subject.section,
        "Strand": subject.strand,
        "Units": subject.unit
      }))
    );
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Subject Schedule");
    XLSX.writeFile(workbook, "subject_schedule.xlsx");
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

  if (loading) {
    return (
      <div className="loading-container">
        <p>Loading subjects...</p>
      </div>
    );
  }

  // Only show error for critical issues like missing faculty_id
  if (criticalError) {
    return (
      <div className="error-container">
        <p>{criticalError}</p>
        <button onClick={() => navigate('/faculty-dashboard', { state: { faculty_id } })}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="subject-schedule-container">
      <div className="header-subject-schedule">
        <h2 className="subject-schedule-title">Subject Schedule</h2>
          <p className="total-label-fpss">Total:
          <span className="total-count-fpss">{filteredSubjectsSchedule.length}</span></p>
      </div>
      <div className="top-controls-subject-schedule">
        <div className="search-and-add-subject-schedule">
          <input
            type="text"
            className="search-input-subject-schedule"
            placeholder="Search"
            value={searchTerm}
            onChange={handleSearchChange}
          />
          <div className="export-buttons">
            <button 
              className="pdf-subject-schedule"
              onClick={() => confirmExport('pdf')}
              disabled={filteredSubjectsSchedule.length === 0}
            >
              <FaFilePdf className="export-icon" /> PDF
            </button>
            <button 
              className="excel-subject-schedule"
              onClick={() => confirmExport('excel')}
              disabled={filteredSubjectsSchedule.length === 0}
            >
              <FaFileExcel className="export-icon" /> Excel
            </button>
          </div>
        </div>
      </div>

      {filteredSubjectsSchedule.length === 0 ? (
        <div className="no-data-container">
          {subjectsschedule.length === 0 ? (
            <div className="no-subjects-message">
              <h3>No Subjects Assigned</h3>
              <p>You currently have no subjects assigned to you. Please contact the administrator if you believe this is an error.</p>
            </div>
          ) : (
            <div className="no-search-results-message">
              <h3>No Results Found</h3>
              <p>No subjects match your search criteria. Try adjusting your search term.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="table-responsive">
          <table className="subject-schedule-table">
            <thead>
              <tr>
                <th>DESCRIPTION</th>
                <th>CODE NO.</th>
                <th>SEMESTER</th>
                <th>FACULTY</th>
                <th>SCHEDULE</th>
                <th>GRADE LEVEL</th>
                <th>SECTION</th>
                <th>STRAND</th>
                <th>UNITS</th>
                <th>STUDENTS</th>
                <th>GRADES</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubjectsSchedule.map((subject) => (
                <tr key={subject.subject_id}>
                  <td>{subject.description}</td>
                  <td>{subject.codeNo}</td>
                  <td>{subject.semester}</td>
                  <td>{subject.teacher}</td>
                  <td>{subject.schedule}</td>
                  <td>{subject.grade}</td>
                  <td>{subject.section}</td>
                  <td>{subject.strand}</td>
                  <td>{subject.unit}</td>
                  <td>
                    <button
                      className="students-subject-schedule"
                      onClick={() => navigate("/subject-enrolled-students", {
                        state: {
                          faculty_id,
                          subject_id: subject.subject_id,
                          description: subject.description,
                          semester: subject.semester,
                          teacher: subject.teacher,
                          schedule: subject.schedule,
                          grade_level: subject.grade,
                          section: subject.section,
                          strand: subject.strand,
                          unit: subject.unit,
                        },
                      })}
                    >
                      Students
                    </button>
                  </td>
                  <td>
                    <button
                      className="grades-subject-schedule"
                      onClick={() => handleViewGrades(subject)}
                    >
                      Grades
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="modal-overlay-fss">
          <div className="modal-content-fss">
            <h3>Confirm Export</h3>
            <p>Are you sure you want to export the data to {exportType === 'pdf' ? 'PDF' : 'Excel'}?</p>
            <div className="modal-action-fss">
              <button className="confirm-button-fss" onClick={handleExportConfirmed}>Yes, Export</button>
              <button className="cancel-button-fss" onClick={() => setShowConfirmModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubjectSchedule;