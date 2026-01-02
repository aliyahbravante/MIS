import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom"; // Import to access location state
import jsPDF from "jspdf"; // PDF library
import * as XLSX from "xlsx"; // Excel library
import "jspdf-autotable"; // Import autoTable plugin for jsPDF
import { FaFilePdf, FaFileExcel } from "react-icons/fa";
import '../student/studentenrolledsubject.css';

const PStudentEnrolledSubjects = () => {
  const location = useLocation(); // Get the current location state
  const studentId = location.state?.student_id; // Extract the student_id from the passed state

  const [enrolledSubjects, setEnrolledSubjects] = useState([]);
  const [studentName, setStudentName] = useState(`Student ${studentId || 'Unknown'}`);
  const [totalSubjects, setTotalSubjects] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isPDFModalOpen, setIsPDFModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // API base URL
  const API_BASE_URL = "https://ncamisshs.com/backend";

  // Function to fetch student details
  const fetchStudentDetails = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/student_details.php?student_id=${studentId}`);
      const data = await response.json();

      if (data.success && data.data.personalinfo) {
        const { first_name, last_name } = data.data.personalinfo;
        return `${first_name} ${last_name}`;
      } else {
        console.error('Failed to fetch student details:', data.message);
        return `Student ${studentId}`;
      }
    } catch (error) {
      console.error('Error fetching student details:', error);
      return `Student ${studentId}`;
    }
  };

  useEffect(() => {
    if (!studentId) {
      console.error("No student ID provided.");
      setError("No student ID provided. Please ensure you're properly logged in.");
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch student details first
        const name = await fetchStudentDetails();
        setStudentName(name);
        
        // Fetch enrolled subjects
        const response = await fetch(`${API_BASE_URL}/fetch_subjects.php?student_id=${studentId}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();

        if (data.success === false) {
          console.error("Backend Error:", data.message);
          // Don't set this as a critical error - just continue with empty subjects
          setEnrolledSubjects([]);
          setTotalSubjects(0);
          setError(null);
        } else if (Array.isArray(data)) {
          setEnrolledSubjects(data);
          setTotalSubjects(data.length);
          setError(null);
        } else {
          console.error("Unexpected response format:", data);
          // Don't set this as a critical error - just continue with empty subjects
          setEnrolledSubjects([]);
          setTotalSubjects(0);
          setError(null);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        // Don't set this as a critical error - just continue with empty subjects
        setEnrolledSubjects([]);
        setTotalSubjects(0);
        setError(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [studentId]);
  // Enhanced filter function
  const filteredSubjects = enrolledSubjects.filter((subject) => {
    const searchLower = searchQuery.trim().toLowerCase();
    
    if (!searchLower) {
      return true;
    }

    const descriptionMatch = (subject.description || '').toLowerCase().includes(searchLower);
    const teacherMatch = (subject.teacher || '').toLowerCase().includes(searchLower);
    const strandMatch = (subject.strand || '').toLowerCase().includes(searchLower);
    const sectionMatch = (subject.section || '').toLowerCase().includes(searchLower);
    
    return descriptionMatch || teacherMatch || strandMatch || sectionMatch;
  });

  // Generate PDF with jsPDF
  const generatePDF = () => {
    const doc = new jsPDF();
    
    // Set PDF title with green color
    doc.setTextColor(0, 100, 0); // RGB for dark green
    doc.setFontSize(18);
    doc.text("Enrolled Subjects", 14, 22);
    
    // Reset text color for the rest of the document
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text(`Student: ${studentName}`, 14, 30);
    doc.text(`Student ID: ${studentId}`, 14, 35);
    
    // Define the table structure
    const tableColumn = [
      "No.", "Description", "Schedule", "Teacher", "Grade", "Strand", "Section"
    ];
    
    // Convert the data for the PDF table
    const tableRows = [];
    filteredSubjects.forEach((subject, index) => {
      tableRows.push([
        index + 1,
        subject.description,
        subject.schedule,
        subject.teacher,
        subject.grade,
        subject.strand,
        subject.section
      ]);
    });
    
    // Create the table with green header color
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 40,
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [0, 100, 0], // Dark green header
        textColor: [255, 255, 255],
        fontSize: 8,
      },
    });

    doc.save("enrolled_subjects.pdf");
    setIsPDFModalOpen(false);
  };

  // Export to Excel
  const handleExportExcel = () => {
    const exportData = filteredSubjects.map((subject, index) => ({
      "No.": index + 1,
      "Description": subject.description,
      "Schedule": subject.schedule,
      "Teacher": subject.teacher,
      "Grade": subject.grade,
      "Strand": subject.strand,
      "Section": subject.section
    }));

    // Add student info at the top
    const worksheetData = [
      ["Student", studentName],
      ["Student ID", studentId],
      [],
      ["No.", "Description", "Schedule", "Teacher", "Grade", "Strand", "Section"],
      ...exportData.map(item => Object.values(item))
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Enrolled Subjects");

    XLSX.writeFile(workbook, "enrolled_subjects.xlsx");
    setIsExportModalOpen(false);
  };

  const openExportModal = () => {
    if (enrolledSubjects.length === 0) {
      alert("No subjects available to export.");
      return;
    }
    setIsExportModalOpen(true);
  };
  
  const closeExportModal = () => setIsExportModalOpen(false);
  
  const openPDFModal = () => {
    if (enrolledSubjects.length === 0) {
      alert("No subjects available to export.");
      return;
    }
    setIsPDFModalOpen(true);
  };
  
  const closePDFModal = () => setIsPDFModalOpen(false);

    const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    }
  if (loading) {
    return (
      <div className="subjects-container-sess">
        <div className="header-student-enrolled-subject-sess">
          <h2 className="subjects-title-sess">Enrolled Subjects</h2>
            <p className="total-label-student-enrolled-subject-sess">Total:
            <span className="total-count-student-enrolled-subject-sess">0</span></p>
        </div>
        <div className="loading-message">Loading subjects...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="subjects-container-ses">
        <div className="header-student-enrolled-subject-sess">
          <h2 className="subjects-title-sess">Enrolled Subjects</h2>
            <p className="total-label-student-enrolled-subject-sess">Total:
            <span className="total-count-student-enrolled-subject-sess">0</span></p>
          </div>
        
        <div className="error-message">Error: {error}</div>
      </div>
    );
  }

  const hasSubjects = enrolledSubjects.length > 0;

  return (
    <div className="subjects-container-ses">
      <div className="header-student-enrolled-subject-sess">
        <h2 className="subjects-title-sess">Enrolled Subjects</h2>
          <p className="total-label-student-enrolled-subject-sess">Total:
          <span className="total-count-student-enrolled-subject-sess">{totalSubjects}</span></p>
    
      </div>
      
      <div className="top-controls-student-enrolled-subject-ses">
        <div className="search-bar-student-enrolled-subject-ses">
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={handleSearchChange}
            disabled={!hasSubjects}
          />
          <div className="export-buttons-ses">
            <button 
              className="pdf-button-student-enrolled-subject-ses" 
              onClick={openPDFModal}
              disabled={!hasSubjects}
            >
              <FaFilePdf className="export-icon-ses" /> PDF
            </button>
            <button 
              className="xls-button-student-enrolled-subject-ses" 
              onClick={openExportModal}
              disabled={!hasSubjects}
            >
              <FaFileExcel className="export-icon-ses"/> Excel
            </button>
          </div>
        </div>
      </div>
      
      {!hasSubjects ? (
        <div className="no-data-container-ses">
          <div className="no-subjects-message-styled">
            <h3>No Subjects Enrolled</h3>
            <p>This student is not currently enrolled in any subjects. Subjects will appear here once enrollment is completed.</p>
          </div>
        </div>
      ) : (
        <div className="subjects-table-container-ss">
          <table className="subjects-table-ses">
            <thead>
              <tr>
                <th>NO.</th>
                <th>DESCRIPTION</th>
                <th>SCHEDULE</th>
                <th>TEACHER</th>
                <th>GRADE</th>
                <th>STRAND</th>
                <th>SECTION</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubjects.map((subject, index) => (
                <tr key={subject.subject_id}>
                  <td>{index + 1}</td>
                  <td>{subject.description}</td>
                  <td>{subject.schedule}</td>
                  <td>{subject.teacher}</td>
                  <td>{subject.grade}</td>
                  <td>{subject.strand}</td>
                  <td>{subject.section}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Export Confirmation Modal */}
      {isExportModalOpen && (
        <div className="modal-confirmation-ses">
          <div className="modal-content-ses">
            <h3>Confirmation</h3>
            <label>Are you sure you want to export to Excel?</label>
            <div className="modal-group-button-ses">
              <button className="confirm-button-ses" onClick={handleExportExcel}>
              Export
              </button>
              <button className="cancel-button-ses" onClick={closeExportModal}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PDF Export Confirmation Modal */}
      {isPDFModalOpen && (
        <div className="modal-confirmation-ses">
          <div className="modal-content-ses">
            <h3>Confirmation</h3>
            <label>Are you sure you want to export to PDF?</label>
            <div className="modal-group-button-ses">
              <button className="confirm-button-ses" onClick={generatePDF}>
              Export
              </button>
              <button className="cancel-button-ses" onClick={closePDFModal}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PStudentEnrolledSubjects;