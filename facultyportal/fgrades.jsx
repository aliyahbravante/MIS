import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import * as XLSX from "xlsx";
import { FaFilePdf, FaFileExcel } from 'react-icons/fa';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import "./fgrades.css";

const FGrades = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    faculty_id,
    subject_id,
    description,
    semester,
    section,
    strand,
    grade_level,
  } = location.state || {};

  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [grades, setGrades] = useState({});
  const [loading, setLoading] = useState(true);
  const [criticalError, setCriticalError] = useState(null);
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [updateMode, setUpdateMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [exportType, setExportType] = useState(null);

  // Fetch students - now includes all statuses
  useEffect(() => {
    if (!subject_id || !section || !strand || !grade_level) {
      console.error("Missing required parameters:", { subject_id, section, strand, grade_level });
      setCriticalError("Missing required parameters. Please go back and try again.");
      setLoading(false);
      return;
    }

    const fetchStudents = async () => {
      try {
        const baseUrl = "http://ncamisshs.com/backend";
        const apiUrl = `${baseUrl}/studentgradelist.php?subject_id=${subject_id}&section=${section}&strand_track=${strand}&grade_level=${grade_level}`;
        console.log("Fetching students from:", apiUrl);
        
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
          console.warn(`Could not fetch students. Status: ${response.status}`);
          setStudents([]);
          setFilteredStudents([]);
          setLoading(false);
          return;
        }
        
        const data = await response.json();
        console.log("Students response:", data);

        if (data.success && data.students && data.students.length > 0) {
          console.log("Students found:", data.students.length, "students");
          console.log("Student statuses:", data.students.map(s => ({ id: s.student_id, status: s.status })));
          setStudents(data.students);
          setFilteredStudents(data.students);
        } else {
          console.warn("No students found:", data.message || "No students returned");
          setStudents([]);
          setFilteredStudents([]);
        }
      } catch (err) {
        console.error("Error fetching students:", err);
        setStudents([]);
        setFilteredStudents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [subject_id, section, strand, grade_level]);

  // Fetch grades
  useEffect(() => {
    if (!subject_id) return;

    const fetchGrades = async () => {
      try {
        const baseUrl = "http://ncamisshs.com/backend";
        const apiUrl = `${baseUrl}/fetch_grades.php?subject_id=${subject_id}`;
        console.log("Fetching grades from:", apiUrl);
        
        const response = await fetch(apiUrl);
        const data = await response.json();
        console.log("Grades response:", data);

        if (data.success && data.grades && data.grades.length > 0) {
          console.log("Existing grades found:", data.grades.length, "grade records");
          const gradesMap = {};
          data.grades.forEach((grade) => {
            gradesMap[grade.student_id] = {
              first_quarter: grade.first_quarter,
              second_quarter: grade.second_quarter,
              final_grade: grade.final_grade,
              remarks: grade.remarks,
              student_grade_level: grade.student_grade_level,
            };
          });
          setGrades(gradesMap);
          setUpdateMode(true);
        } else {
          console.log("No existing grades found");
          setGrades({});
          setUpdateMode(false);
        }
      } catch (err) {
        console.error("Error fetching grades:", err);
        setGrades({});
        setUpdateMode(false);
      }
    };

    fetchGrades();
  }, [subject_id]);

  const handleSearchChange = (event) => {
    const query = event.target.value.toLowerCase();
    setSearchQuery(query);

    const filtered = students.filter((student) =>
      `${student.first_name} ${student.last_name}`.toLowerCase().includes(query) ||
      student.grade_level.toLowerCase().includes(query) ||
      student.strand_track.toLowerCase().includes(query) ||
      student.section.toLowerCase().includes(query)
    );

    setFilteredStudents(filtered);
  };

  const handleGradeChange = (student_id, field, value) => {
    const updatedGrades = {
      ...grades,
      [student_id]: {
        ...grades[student_id],
        [field]: value,
      },
    };

    if (field === "first_quarter" || field === "second_quarter") {
      const firstQuarter = parseFloat(updatedGrades[student_id]?.first_quarter || 0);
      const secondQuarter = parseFloat(updatedGrades[student_id]?.second_quarter || 0);

      if (firstQuarter && secondQuarter) {
        const finalGrade = ((firstQuarter + secondQuarter) / 2).toFixed(2);
        const remarks = finalGrade >= 75 ? "PASSED" : "FAILED";
        updatedGrades[student_id].final_grade = finalGrade;
        updatedGrades[student_id].remarks = remarks;
      } else {
        updatedGrades[student_id].final_grade = null;
        updatedGrades[student_id].remarks = null;
      }
    }

    setGrades(updatedGrades);
  };

  const handleSaveGrades = () => {
    if (filteredStudents.length === 0) {
      alert("No students available to save grades for.");
      return;
    }

    const gradesData = filteredStudents.map((student) => {
      const grade = grades[student.student_id] || {};
      const status = student.status?.toUpperCase();
      
      const isInactive = status === 'DROP' || status === 'DROPPED' || 
                         status === 'TRANSFER' || status === 'TRANSFERRED';
      
      // Check if student has passed all subjects (for Grade 12)
      const hasPassed = grade.remarks === 'PASSED';
      const isGrade12 = student.grade_level === 'Grade 12';
      
      return {
        student_id: student.student_id,
        student_grade_level: student.grade_level,
        first_quarter: isInactive ? null : (grade.first_quarter || null),
        second_quarter: isInactive ? null : (grade.second_quarter || null),
        final_grade: isInactive ? null : (grade.second_quarter ? grade.final_grade : null),
        remarks: isInactive ? status : (grade.second_quarter ? grade.remarks : null),
      };
    });

    console.log("Saving grades:", gradesData);

    const baseUrl = "http://ncamisshs.com/backend";
    fetch(`${baseUrl}/save_grades.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ subject_id, grades: gradesData }),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("Save grades response:", data);
        if (data.success) {
          setIsSuccessModalOpen(true);
        } else {
          alert("Failed to save grades: " + (data.message || "Unknown error"));
        }
      })
      .catch((err) => {
        console.error("Error saving grades:", err);
        alert("An error occurred while saving grades.");
      });

    setIsConfirmationModalOpen(false);
  };

  const handleExportToPDF = () => {
    if (filteredStudents.length === 0) {
      alert("No students available to export.");
      return;
    }

    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.setTextColor(0, 100, 0);
    doc.text(`Grades for ${description} - ${section} (${strand})`, 14, 20);
    
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Grade Level: ${grade_level}`, 14, 30);
    doc.text(`Semester: ${semester}`, 14, 36);
    doc.text(`Total Students: ${filteredStudents.length}`, 14, 42);
    
    const tableColumn = ["No.", "First Name", "Last Name", "1st Quarter", "2nd Quarter", "Final Grade", "Remarks"];
    const tableRows = [];

    filteredStudents.forEach((student, index) => {
      const grade = grades[student.student_id] || {};
      const status = student.status?.toUpperCase();
      const isInactive = status === 'DROP' || status === 'DROPPED' || 
                         status === 'TRANSFER' || status === 'TRANSFERRED';
      
      let remarksText = '';
      if (status === 'DROP' || status === 'DROPPED') {
        remarksText = 'DROPPED';
      } else if (status === 'TRANSFER' || status === 'TRANSFERRED') {
        remarksText = 'TRANSFERRED';
      } else if (status === 'GRADUATED' || status === 'GRADUATE') {
        remarksText = grade.remarks || 'GRADUATED';
      } else {
        remarksText = grade.remarks || '';
      }
      
      const studentData = [
        index + 1,
        student.first_name,
        student.last_name,
        isInactive ? "N/A" : (grade.first_quarter || ""),
        isInactive ? "N/A" : (grade.second_quarter || ""),
        isInactive ? "N/A" : (grade.final_grade || ""),
        remarksText
      ];
      tableRows.push(studentData);
    });

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 48,
      styles: { 
        fontSize: 9,
        cellPadding: 2,
        overflow: 'linebreak'
      },
      headStyles: {
        fillColor: [0, 100, 0],
        textColor: [255, 255, 255]
      }
    });

    doc.save(`Grades_${description}_${section}.pdf`);
    setIsExportModalOpen(false);
  };

  const handleExportToExcel = () => {
    if (filteredStudents.length === 0) {
      alert("No students available to export.");
      return;
    }

    const exportData = filteredStudents.map((student, index) => {
      const grade = grades[student.student_id] || {};
      const status = student.status?.toUpperCase();
      const isInactive = status === 'DROP' || status === 'DROPPED' || 
                         status === 'TRANSFER' || status === 'TRANSFERRED';
      
      let remarksText = '';
      if (status === 'DROP' || status === 'DROPPED') {
        remarksText = 'DROPPED';
      } else if (status === 'TRANSFER' || status === 'TRANSFERRED') {
        remarksText = 'TRANSFERRED';
      } else if (status === 'GRADUATED' || status === 'GRADUATE') {
        remarksText = grade.remarks || 'GRADUATED';
      } else {
        remarksText = grade.remarks || '';
      }
      
      return {
        "No.": index + 1,
        "First Name": student.first_name,
        "Last Name": student.last_name,
        "Grade Level": student.grade_level,
        "1st Quarter": isInactive ? "N/A" : (grade.first_quarter || ""),
        "2nd Quarter": isInactive ? "N/A" : (grade.second_quarter || ""),
        "Final Grade": isInactive ? "N/A" : (grade.final_grade || ""),
        "Remarks": remarksText,
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Grades");

    XLSX.writeFile(workbook, `Grades_${description}_${section}.xlsx`);
    setIsExportModalOpen(false);
  };

  const openConfirmationModal = () => {
    if (filteredStudents.length === 0) {
      alert("No students available to save grades for.");
      return;
    }
    setIsConfirmationModalOpen(true);
  };

  const closeConfirmationModal = () => setIsConfirmationModalOpen(false);
  
  const openExportModal = (type) => {
    if (filteredStudents.length === 0) {
      alert("No students available to export.");
      return;
    }
    setExportType(type);
    setIsExportModalOpen(true);
  };
  
  const closeExportModal = () => setIsExportModalOpen(false);
  const closeSuccessModal = () => {
    setIsSuccessModalOpen(false);
    // After user clicks OK, refresh the page to show updated statuses
    window.location.reload();
  };

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
      <div className="grades-container">
        <div className="loading-container">
          <p>Loading students...</p>
        </div>
      </div>
    );
  }

  if (criticalError) {
    return (
      <div className="grades-container">
        <div className="critical-error-container">
          <h3>Unable to Load Grades</h3>
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
    <div className="grades-container">
      <div className="back-grades">
        <button
          type="button"
          className="grade-breadcrumb-button"
          onClick={() =>
            navigate("/subject-schedule", {
              state: { faculty_id },
            })
          }
        >
          Subjects Schedule /
        </button>
      </div>

      <div className="grade-header">
        <h2 className="grade-title">
          Grades for {description} - {section} ({strand})
        </h2>
        <div className="grade-details">
          <p>
            <strong>Grade Level:</strong> {grade_level} <br />
            <strong>Semester:</strong> {semester}
          </p>
        </div>
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
              className="pdf-button-grade"
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
          {students.length === 0 ? (
            <div className="no-students-message">
              <h3>No Students Available</h3>
              <p>There are currently no students enrolled in this subject section.</p>
              <p className="help-text">If you believe this is an error, please contact the administrator for assistance.</p>
            </div>
          ) : (
            <div className="no-search-results-message">
              <h3>No Students Found</h3>
              <p>No students match your search criteria. Try adjusting your search term.</p>
            </div>
          )}
        </div>
      ) : (
        <>
        <div className="grades-table-container-f">
          <table className="grades-table">
            <thead>
              <tr>
                <th>No.</th>
                <th>First Name</th>
                <th>Last Name</th>
                <th>Grade Level</th>
                <th>1st Quarter</th>
                <th>2nd Quarter</th>
                <th>Final Grade</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student, index) => {
                const grade = grades[student.student_id] || {};
                const status = student.status?.toUpperCase();
                
                let rowClass = '';
                if (status === 'DROP' || status === 'DROPPED') {
                  rowClass = 'status-dropped';
                } else if (status === 'TRANSFER' || status === 'TRANSFERRED') {
                  rowClass = 'status-transferred';
                } else if (status === 'GRADUATED' || status === 'GRADUATE') {
                  rowClass = 'status-graduated';
                } else if (student.grade_level === 'Grade 12' && grade.remarks === 'PASSED') {
                  rowClass = 'status-potential-graduate';
                }
                
                const isInactive = status === 'DROP' || status === 'DROPPED' || 
                                   status === 'TRANSFER' || status === 'TRANSFERRED';
                
                let remarksDisplay = '';
                let remarksClass = '';
                if (status === 'DROP' || status === 'DROPPED') {
                  remarksDisplay = 'DROPPED';
                  remarksClass = 'remarks-dropped';
                } else if (status === 'TRANSFER' || status === 'TRANSFERRED') {
                  remarksDisplay = 'TRANSFERRED';
                  remarksClass = 'remarks-transferred';
                } else if (status === 'GRADUATED' || status === 'GRADUATE') {
                  remarksDisplay = grade.remarks || 'GRADUATED';
                  remarksClass = 'remarks-graduated';
                } else {
                  remarksDisplay = grade.remarks || '';
                }
                
                return (
                  <tr key={student.student_id} className={rowClass}>
                    <td>{index + 1}</td>
                    <td>{student.first_name}</td>
                    <td>{student.last_name}</td>
                    <td>{student.grade_level}</td>
                    <td className={isInactive ? 'grade-na' : ''}>
                      {isInactive ? (
                        'N/A'
                      ) : (
                        <input
                          type="number"
                          value={grade.first_quarter || ""}
                          onChange={(e) =>
                            handleGradeChange(student.student_id, "first_quarter", e.target.value)
                          }
                          placeholder="Enter 1st Quarter Grade"
                        />
                      )}
                    </td>
                    <td className={isInactive ? 'grade-na' : ''}>
                      {isInactive ? (
                        'N/A'
                      ) : (
                        <input
                          type="number"
                          value={grade.second_quarter || ""}
                          onChange={(e) =>
                            handleGradeChange(student.student_id, "second_quarter", e.target.value)
                          }
                          placeholder="Enter 2nd Quarter Grade"
                        />
                      )}
                    </td>
                    <td className={isInactive ? 'grade-na' : ''}>
                      {isInactive ? 'N/A' : (grade.final_grade || "")}
                    </td>
                    <td className={remarksClass}>
                      {remarksDisplay}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
          <div className="button-group">
            <button className="save-grades-button" onClick={openConfirmationModal}>
              {updateMode ? "Update Grades" : "Save Grades"}
            </button>
          </div>
        </>
      )}

      {isConfirmationModalOpen && (
        <div className="modal-grades">
          <div className="modal-content-grade">
          <h3>Confirmation</h3>
            <p>
              {updateMode
                ? "Are you sure you want to update the grades?"
                : "Are you sure you want to save the grades?"}
            </p>
            <div className="button-group-grade">
              <button onClick={handleSaveGrades} className="save-button-grade">
                Yes, {updateMode ? "Update" : "Save"}
              </button>
              <button onClick={closeConfirmationModal} className="discard-button-grade">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {isExportModalOpen && (
        <div className="modal-grades">
          <div className="modal-content-grade">
          <h3>Confirmation</h3>
            <p>Are you sure you want to export the grades to {exportType === 'pdf' ? 'PDF' : 'Excel'}?</p>
            <div className="button-group-grade">
              <button onClick={handleExportConfirmed} className="save-button-grade">
                Export
              </button>
              <button onClick={closeExportModal} className="discard-button-grade">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {isSuccessModalOpen && (
        <div className="modal-grades">
          <div className="modal-content-grade">
          <h3>Confirmation</h3>
            <p>Grades saved successfully!</p>
            <div className="button-group-grade">
              <button onClick={closeSuccessModal} className="save-button-grade">
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FGrades;