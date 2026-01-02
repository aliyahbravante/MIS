import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import * as XLSX from "xlsx"; // Library for exporting to Excel
import { FaFilePdf, FaFileExcel } from 'react-icons/fa';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import "./subjectenrolledstudents.css";

const SubjectEnrolledStudents = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Retrieve subject_id, faculty_id, and other details from location state
  const { subject_id, faculty_id, description, grade_level, strand, section } = location.state || {};

  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]); // For search filtering
  const [loading, setLoading] = useState(true);
  const [criticalError, setCriticalError] = useState(null); // Only for critical errors
  const [isExportModalOpen, setIsExportModalOpen] = useState(false); // Modal for export confirmation
  const [searchQuery, setSearchQuery] = useState(""); // For search input
  const [exportType, setExportType] = useState(null); // To track which export type was selected

  useEffect(() => {
    // Ensure all required parameters are present
    if (!subject_id || !grade_level || !strand || !section) {
      console.error("Missing required parameters:", { subject_id, grade_level, strand, section });
      setCriticalError("Missing required parameters. Please go back and try again.");
      setLoading(false);
      return;
    }

    // Fetch students based on subject_id (only APPROVED students)
    const fetchStudents = async () => {
      try {
        const baseUrl = "http://ncamisshs.com/backend";
        const apiUrl = `${baseUrl}/studentlist.php?subject_id=${subject_id}&grade_level=${grade_level}&strand_track=${strand}&section=${section}`;
        console.log("Fetching approved students from:", apiUrl);
        
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
          console.warn(`Could not fetch students. Status: ${response.status}`);
          console.log("Setting students to empty array - no students available");
          setEnrolledStudents([]);
          setFilteredStudents([]);
          return;
        }
        
        const data = await response.json();
        console.log("Students response:", data);

        if (data.success && data.students && data.students.length > 0) {
          console.log("Approved students found:", data.students.length, "students");
          setEnrolledStudents(data.students);
          setFilteredStudents(data.students); // Initialize filtered list
        } else {
          console.warn("No approved students found:", data.message || "No students returned");
          console.log("Setting students to empty array - no approved students enrolled in this subject");
          setEnrolledStudents([]);
          setFilteredStudents([]);
        }
      } catch (err) {
        console.error("Error fetching students:", err);
        console.log("Setting students to empty array due to error");
        setEnrolledStudents([]);
        setFilteredStudents([]);
        // Don't set critical error for API issues - just continue with empty array
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [subject_id, grade_level, strand, section]);

  const handleSearchChange = (event) => {
    const query = event.target.value.toLowerCase();
    setSearchQuery(query);

    // Filter students based on search query
    const filtered = enrolledStudents.filter((student) =>
      `${student.first_name} ${student.last_name}`.toLowerCase().includes(query) ||
      student.grade_level.toLowerCase().includes(query) ||
      student.strand_track.toLowerCase().includes(query) ||
      student.section.toLowerCase().includes(query)
    );

    setFilteredStudents(filtered);
  };

  const handleExportToExcel = () => {
    if (filteredStudents.length === 0) {
      alert("No students available to export.");
      return;
    }

    const exportData = filteredStudents.map((student, index) => ({
      "No.": index + 1,
      "First Name": student.first_name,
      "Last Name": student.last_name,
      "Grade Level": student.grade_level,
      "Strand": student.strand_track,
      "Section": student.section,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Enrolled Students");

    // Save the file
    XLSX.writeFile(workbook, `Enrolled_Students_${description}_${section}.xlsx`);

    setIsExportModalOpen(false); // Close the export confirmation modal
  };

  const handleExportToPDF = () => {
    if (filteredStudents.length === 0) {
      alert("No students available to export.");
      return;
    }

    const doc = new jsPDF();
    
    // Add title with color
    doc.setFontSize(18);
    doc.setTextColor(0, 100, 0); // Dark green color (RGB)
    doc.text(`Enrolled Students in ${description} (${section})`, 14, 20);
    
    // Reset text color for the rest of the content
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.text(`Total Approved Students: ${filteredStudents.length}`, 14, 30);
    
    const tableColumn = ["No.", "First Name", "Last Name", "Grade Level", "Strand", "Section"];
    const tableRows = [];

    filteredStudents.forEach((student, index) => {
      const studentData = [
        index + 1,
        student.first_name,
        student.last_name,
        student.grade_level,
        student.strand_track,
        student.section
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

    doc.save(`Enrolled_Students_${description}_${section}.pdf`);
    
    setIsExportModalOpen(false); // Close the export confirmation modal
  };

  const openExportModal = (type) => {
    if (filteredStudents.length === 0) {
      alert("No students available to export.");
      return;
    }
    setExportType(type);
    setIsExportModalOpen(true);
  };
  
  const closeExportModal = () => setIsExportModalOpen(false);

  const handleExportConfirmed = () => {
    if (exportType === 'pdf') {
      handleExportToPDF();
    } else if (exportType === 'excel') {
      handleExportToExcel();
    }
    setIsExportModalOpen(false);
  };

  if (loading) {
    return (
      <div className="ss-enrolled-students-container">
        <div className="loading-container">
          <p>Loading approved students...</p>
        </div>
      </div>
    );
  }

  // Only show critical error for missing parameters
  if (criticalError) {
    return (
      <div className="ss-enrolled-students-container">
        <div className="critical-error-container">
          <h3>Unable to Load Students</h3>
          <p>{criticalError}</p>
          <button
            type="button"
            className="back-button"
            onClick={() =>
              navigate("/subject-schedule", {
                state: { faculty_id },
              })
            }
          >
            Back to Subject Schedule
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="ss-enrolled-students-container">
      <div className="back-subject-schedule">
        <button
          type="button"
          className="subject-schedule-breadcrumb-button"
          onClick={() =>
            navigate("/subject-schedule", {
              state: { faculty_id }, // Pass faculty_id back to SubjectSchedule
            })
          }
        >
          Subjects Schedule /
        </button>
      </div>
      <div className="header-sses">
        <h2 className="application-title-sses">
          Enrolled Students in {description} ({section})
        </h2>
          <p className="total-label-sses">Total:
          <span className="total-count-sses">{filteredStudents.length}</span>
        </p>
      </div>

      <div className="top-controls-enrolledstudents-ss">
        <div className="search-bar-sses">
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={handleSearchChange}
          />
          <div className="export-buttons-sses">
            <button 
              className="pdf-button-sses" 
              onClick={() => openExportModal('pdf')}
              disabled={filteredStudents.length === 0}
            >
              <FaFilePdf className="export-icon" /> PDF
            </button>
            <button 
              className="excel-button-sses" 
              onClick={() => openExportModal('excel')}
              disabled={filteredStudents.length === 0}
            >
              <FaFileExcel className="export-icon" /> Excel
            </button>
          </div>
        </div>
      </div>

      {filteredStudents.length === 0 ? (
        <div className="no-data-container">
          {enrolledStudents.length === 0 ? (
            <div className="no-students-message">
              <h3>No Approved Students Enrolled</h3>
              <p>There are currently no approved students enrolled in this subject section.</p>
              <p className="help-text">Only students with "APPROVE" status are displayed here. Students with Drop, Transfer, or Graduated status are excluded.</p>
            </div>
          ) : (
            <div className="no-search-results-message">
              <h3>No Students Found</h3>
              <p>No students match your search criteria. Try adjusting your search term.</p>
            </div>
          )}
        </div>
      ) : (
        <table className="application-table-sses">
          <thead>
            <tr>
              <th>NO.</th>
              <th>FIRST NAME</th>
              <th>LAST NAME</th>
              <th>GRADE LEVEL</th>
              <th>STRAND</th>
              <th>SECTION</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map((student, index) => (
              <tr key={student.student_id}>
                <td>{index + 1}</td>
                <td>{student.first_name}</td>
                <td>{student.last_name}</td>
                <td>{student.grade_level}</td>
                <td>{student.strand_track}</td>
                <td>{student.section}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {isExportModalOpen && (
        <div className="modal-schedule-ses">
          <div className="modal-content-ses">
            <h3>Confirmation</h3>
            <p>Are you sure you want to export the enrolled students to {exportType === 'pdf' ? 'PDF' : 'Excel'}?</p>
            <div className="button-group-ses">
              <button className="save-button-ses" onClick={handleExportConfirmed}>
                 Export
              </button>
              <button className="cancel-button-ses" onClick={closeExportModal}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubjectEnrolledStudents;