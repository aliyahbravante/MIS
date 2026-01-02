import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import "../student/studentgrades.css";
import { jsPDF } from "jspdf";
import * as XLSX from "xlsx";
import "jspdf-autotable";
import { FaFilePdf, FaFileExcel } from "react-icons/fa";

const PStudentGrades = () => {
  const location = useLocation();
  const studentId = location.state?.student_id;
  
  const [grades, setGrades] = useState({});
  const [allGrades, setAllGrades] = useState([]);
  const [studentName, setStudentName] = useState(`Student ${studentId || 'Unknown'}`);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportType, setExportType] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("both");
  const [selectedGradeLevel, setSelectedGradeLevel] = useState("all");
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [availableGradeLevels, setAvailableGradeLevels] = useState(["Grade 11", "Grade 12"]);

  const API_BASE_URL = "https://ncamisshs.com/backend";

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

  // Organize grades by grade level and semester
  const organizeGradesByLevel = (gradesData) => {
    const organized = {};
    
    gradesData.forEach(grade => {
      const level = grade.grade_level;
      if (!organized[level]) {
        organized[level] = {
          firstSem: [],
          secondSem: []
        };
      }
      
      if (grade.semester === "1ST") {
        organized[level].firstSem.push(grade);
      } else if (grade.semester === "2ND") {
        organized[level].secondSem.push(grade);
      }
    });
    
    return organized;
  };

  // Calculate averages for a specific grade level
  const calculateGradeLevelAverages = (firstSem, secondSem) => {
    const firstSemAverage = firstSem.length > 0
      ? (firstSem.reduce((acc, grade) => acc + parseFloat(grade.final_grade), 0) / firstSem.length).toFixed(2)
      : 0;

    const secondSemAverage = secondSem.length > 0
      ? (secondSem.reduce((acc, grade) => acc + parseFloat(grade.final_grade), 0) / secondSem.length).toFixed(2)
      : 0;

    const generalAverage = firstSem.length > 0 && secondSem.length > 0
      ? ((parseFloat(firstSemAverage) + parseFloat(secondSemAverage)) / 2).toFixed(2)
      : firstSem.length > 0
      ? firstSemAverage
      : secondSemAverage;

    return { firstSemAverage, secondSemAverage, generalAverage };
  };

  useEffect(() => {
    console.log("StudentGrades - Student ID from location.state:", studentId);
    
    if (!studentId) {
      console.error("Missing studentId:", studentId);
      setError("Student ID is missing. Please ensure you're accessing this page correctly.");
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        console.log(`Fetching data for student ID: ${studentId}`);
        
        const name = await fetchStudentDetails();
        setStudentName(name);
        
        const response = await fetch(`${API_BASE_URL}/fetch_StudentGrades.php?student_id=${studentId}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("Grades API response:", data);

        if (data.success && data.grades.length > 0) {
          const { grades: gradesData } = data;

          // Store all grades
          setAllGrades(gradesData);

          // Organize grades by level
          const organized = organizeGradesByLevel(gradesData);
          setGrades(organized);
          
          setError("");
        } else {
          console.log("No grades found for student:", data.message);
          setAllGrades([]);
          setGrades({});
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        console.log("Setting grades to empty due to error");
        setAllGrades([]);
        setGrades({});
        setAvailableGradeLevels([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [studentId]);

  // Handle grade level filter change
  const handleGradeLevelChange = (e) => {
    setSelectedGradeLevel(e.target.value);
  };

  // Get filtered grades based on selected grade level
  const getFilteredGrades = () => {
    if (selectedGradeLevel === "all") {
      return grades;
    }
    
    const filtered = {};
    if (grades[selectedGradeLevel]) {
      filtered[selectedGradeLevel] = grades[selectedGradeLevel];
    }
    return filtered;
  };

  const generatePDF = () => {
    const doc = new jsPDF();

    doc.setTextColor(0, 100, 0);
    doc.setFontSize(18);
    doc.text("Student Grades", 14, 22);
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text(`Student: ${studentName}`, 14, 30);
    doc.text(`Student ID: ${studentId}`, 14, 35);

    let currentY = 45;

    const gradeColumns = [
      "Subject", "Instructor", "1st Quarter", "2nd Quarter", "Final Grade", "Semester", "Remarks"
    ];

    const tableOptions = {
      theme: "grid",
      styles: {
        fontSize: 8,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [0, 100, 0],
        textColor: [255, 255, 255],
        fontSize: 8,
      }
    };

    const filteredGrades = getFilteredGrades();
    const gradeLevels = Object.keys(filteredGrades).sort();

    gradeLevels.forEach((level, levelIndex) => {
      const levelData = filteredGrades[level];
      
      if (levelIndex > 0) {
        doc.addPage();
        currentY = 20;
      }

      // Grade Level Header
      doc.setTextColor(0, 100, 0);
      doc.setFontSize(16);
      doc.text(`${level}`, 14, currentY);
      currentY += 10;

      // First Semester
      if (selectedSemester === "first" || selectedSemester === "both") {
        if (levelData.firstSem.length > 0) {
          doc.setTextColor(0, 100, 0);
          doc.setFontSize(14);
          doc.text("First Semester", 14, currentY);
          currentY += 8;

          const firstSemData = levelData.firstSem.map((grade) => [
            grade.subject_description,
            grade.subject_teacher,
            grade.first_quarter,
            grade.second_quarter,
            grade.final_grade,
            grade.semester,
            grade.remarks,
          ]);

          doc.setTextColor(0, 0, 0);
          doc.autoTable({
            ...tableOptions,
            startY: currentY,
            head: [gradeColumns],
            body: firstSemData,
          });

          currentY = doc.lastAutoTable.finalY + 10;
          const firstSemAvg = calculateGradeLevelAverages(levelData.firstSem, []).firstSemAverage;
          doc.text(`First Semester Average: ${firstSemAvg}`, 14, currentY);
          currentY += 10;
        }
      }

      // Second Semester
      if (selectedSemester === "second" || selectedSemester === "both") {
        if (levelData.secondSem.length > 0) {
          if (currentY > 200) {
            doc.addPage();
            currentY = 20;
          }

          doc.setTextColor(0, 100, 0);
          doc.setFontSize(14);
          doc.text("Second Semester", 14, currentY);
          currentY += 8;

          const secondSemData = levelData.secondSem.map((grade) => [
            grade.subject_description,
            grade.subject_teacher,
            grade.first_quarter,
            grade.second_quarter,
            grade.final_grade,
            grade.semester,
            grade.remarks,
          ]);

          doc.setTextColor(0, 0, 0);
          doc.autoTable({
            ...tableOptions,
            startY: currentY,
            head: [gradeColumns],
            body: secondSemData,
          });

          currentY = doc.lastAutoTable.finalY + 10;
          const secondSemAvg = calculateGradeLevelAverages([], levelData.secondSem).secondSemAverage;
          doc.text(`Second Semester Average: ${secondSemAvg}`, 14, currentY);
          currentY += 10;
        }
      }

      // General Average
      if (selectedSemester === "both" && levelData.firstSem.length > 0 && levelData.secondSem.length > 0) {
        const generalAvg = calculateGradeLevelAverages(levelData.firstSem, levelData.secondSem).generalAverage;
        doc.setTextColor(0, 100, 0);
        doc.setFontSize(12);
        doc.text(`General Average: ${generalAvg}`, 14, currentY);
        currentY += 10;
      }
    });

    let filename = "grades";
    if (selectedGradeLevel !== "all") {
      filename = `${selectedGradeLevel.replace(' ', '_').toLowerCase()}_grades`;
    }
    if (selectedSemester === "first") {
      filename += "_first_semester";
    } else if (selectedSemester === "second") {
      filename += "_second_semester";
    }

    doc.save(`${filename}.pdf`);
    setIsSuccessModalOpen(true);
    setIsConfirmationModalOpen(false);
  };

  const generateExcel = () => {
    const workbook = XLSX.utils.book_new();
    
    let worksheetData = [
      ["Student", studentName],
      ["Student ID", studentId],
      []
    ];

    const filteredGrades = getFilteredGrades();
    const gradeLevels = Object.keys(filteredGrades).sort();

    gradeLevels.forEach((level) => {
      const levelData = filteredGrades[level];
      
      worksheetData.push([level], []);

      if (selectedSemester === "first" || selectedSemester === "both") {
        if (levelData.firstSem.length > 0) {
          worksheetData.push(
            ["First Semester"],
            ["Subject", "Instructor", "1st Quarter", "2nd Quarter", "Final Grade", "Semester", "Remarks"]
          );
          
          levelData.firstSem.forEach(grade => {
            worksheetData.push([
              grade.subject_description,
              grade.subject_teacher,
              grade.first_quarter,
              grade.second_quarter,
              grade.final_grade,
              grade.semester,
              grade.remarks
            ]);
          });
          
          const firstSemAvg = calculateGradeLevelAverages(levelData.firstSem, []).firstSemAverage;
          worksheetData.push([], ["First Semester Average", firstSemAvg], []);
        }
      }

      if (selectedSemester === "second" || selectedSemester === "both") {
        if (levelData.secondSem.length > 0) {
          worksheetData.push(
            ["Second Semester"],
            ["Subject", "Instructor", "3rd Quarter", "4th Quarter", "Final Grade", "Semester", "Remarks"]
          );
          
          levelData.secondSem.forEach(grade => {
            worksheetData.push([
              grade.subject_description,
              grade.subject_teacher,
              grade.first_quarter,
              grade.second_quarter,
              grade.final_grade,
              grade.semester,
              grade.remarks
            ]);
          });
          
          const secondSemAvg = calculateGradeLevelAverages([], levelData.secondSem).secondSemAverage;
          worksheetData.push([], ["Second Semester Average", secondSemAvg], []);
        }
      }

      if (selectedSemester === "both" && levelData.firstSem.length > 0 && levelData.secondSem.length > 0) {
        const generalAvg = calculateGradeLevelAverages(levelData.firstSem, levelData.secondSem).generalAverage;
        worksheetData.push(["General Average", generalAvg], []);
      }
    });
    
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    
    let filename = "grades";
    if (selectedGradeLevel !== "all") {
      filename = `${selectedGradeLevel.replace(' ', '_').toLowerCase()}_grades`;
    }
    if (selectedSemester === "first") {
      filename += "_first_semester";
    } else if (selectedSemester === "second") {
      filename += "_second_semester";
    }
    
    XLSX.utils.book_append_sheet(workbook, worksheet, "Grades");
    XLSX.writeFile(workbook, `${filename}.xlsx`);

    setIsSuccessModalOpen(true);
    setIsConfirmationModalOpen(false);
  };

  const openExportModal = (type) => {
    if (Object.keys(grades).length === 0) {
      alert("No grades available to export.");
      return;
    }
    setExportType(type);
    setSelectedSemester("both");
    setIsConfirmationModalOpen(true);
  };

  const handleSemesterChange = (e) => {
    setSelectedSemester(e.target.value);
  };

  const handleConfirmExport = () => {
    if (exportType === "pdf") {
      generatePDF();
    } else if (exportType === "xls") {
      generateExcel();
    }
  };

  const handleCancelExport = () => {
    setIsConfirmationModalOpen(false);
  };

  const closeSuccessModal = () => {
    setIsSuccessModalOpen(false);
  };

  if (loading) {
    return (
      <div className="loading-container-sg">
        <p>Loading grades...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container-sg">
        <h3>Error</h3>
        <p>{error}</p>
        <p>Student ID: {studentId || "Not found"}</p>
      </div>
    );
  }

  const hasAnyGrades = Object.keys(grades).length > 0;
  const filteredGrades = getFilteredGrades();
  const hasDataForSelectedLevel = selectedGradeLevel === "all" 
    ? hasAnyGrades 
    : grades[selectedGradeLevel] && (grades[selectedGradeLevel].firstSem.length > 0 || grades[selectedGradeLevel].secondSem.length > 0);

  return (
    <div className="grades-container-sg">
      <div className="top-controls-student-grades-sg">
        <h2 className="grades-title-sg">Grades</h2>
        <div className="export-buttons">
          <select 
            value={selectedGradeLevel} 
            onChange={handleGradeLevelChange}
            className="grade-filter-dropdown-sg"
          >
            <option value="all">All Grades</option>
            {availableGradeLevels.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
          <button 
            className="pdf-button-student-grades-sg" 
            onClick={() => openExportModal("pdf")}
            disabled={!hasAnyGrades}
          >
            <FaFilePdf style={{ marginRight: '5px' }} /> PDF
          </button>
          <button 
            className="xls-button-student-grades-sg" 
            onClick={() => openExportModal("xls")}
            disabled={!hasAnyGrades}
          >
            <FaFileExcel style={{ marginRight: '5px' }} /> Excel
          </button>
        </div>
      </div>

      {!hasAnyGrades && selectedGradeLevel === "all" && (
        <div>
          {availableGradeLevels.map((level, levelIndex) => (
            <div key={level} className="grade-level-section-sg">
              {levelIndex > 0 && <hr className="grade-level-separator" />}
              
              <h2 className="grade-level-title-sg">{level}</h2>
              
              <div className="no-data-container">
                <div className="no-grades-message">
                  <h3>No Grades Available</h3>
                  <p>No grades have been recorded for {level} yet.</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedGradeLevel !== "all" && !hasDataForSelectedLevel && (
        <div className="no-data-container">
          <div className="no-grades-message">
            <h3>No Grades Available</h3>
            <p>No grades have been recorded for {selectedGradeLevel} yet.</p>
          </div>
        </div>
      )}

      {hasAnyGrades && selectedGradeLevel === "all" && availableGradeLevels.map((level, levelIndex) => {
        const levelData = grades[level] || { firstSem: [], secondSem: [] };
        const hasFirstSem = levelData.firstSem.length > 0;
        const hasSecondSem = levelData.secondSem.length > 0;

        return (
          <div key={level} className="grade-level-section-sg">
            {levelIndex > 0 && <hr className="grade-level-separator" />}
            
            <h2 className="grade-level-title-sg">{level}</h2>

            {!hasFirstSem && !hasSecondSem && (
              <div className="no-data-container">
                <div className="no-grades-message">
                  <h3>No Grades Available</h3>
                  <p>No grades have been recorded for {level} yet.</p>
                </div>
              </div>
            )}

            {hasFirstSem && (
              <div className="semester-section-sg">
                <h3>First Semester</h3>
                <div className="table-container-sg">
                  <table className="grades-table-sg">
                    <thead>
                      <tr>
                        <th>Description</th>
                        <th>Instructor</th>
                        <th>1st Quarter</th>
                        <th>2nd Quarter</th>
                        <th>Final Semester</th>
                        <th>Semester</th>
                        <th>Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {levelData.firstSem.map((grade, index) => (
                        <tr key={index}>
                          <td>{grade.subject_description}</td>
                          <td>{grade.subject_teacher}</td>
                          <td>{grade.first_quarter}</td>
                          <td>{grade.second_quarter}</td>
                          <td>{grade.final_grade}</td>
                          <td>{grade.semester}</td>
                          <td>{grade.remarks}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="semester-average-sg">
                  <span>Gen. Ave for the first semester:</span>
                  <input 
                    type="text" 
                    className="average-input-sg" 
                    value={calculateGradeLevelAverages(levelData.firstSem, []).firstSemAverage} 
                    readOnly 
                  />
                </div>
              </div>
            )}

            {hasFirstSem && hasSecondSem && <hr className="separator" />}

            {hasSecondSem && (
              <div className="semester-section-sg">
                <h3>Second Semester</h3>
                <div className="table-container-sg">
                  <table className="grades-table-sg">
                    <thead>
                      <tr>
                        <th>DESCRIPTION</th>
                        <th>INSTRUCTOR</th>
                        <th>3rd Quarter</th>
                        <th>4th Quarter</th>
                        <th>Final Semester</th>
                        <th>SEMESTER</th>
                        <th>REMARKS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {levelData.secondSem.map((grade, index) => (
                        <tr key={index}>
                          <td>{grade.subject_description}</td>
                          <td>{grade.subject_teacher}</td>
                          <td>{grade.first_quarter}</td>
                          <td>{grade.second_quarter}</td>
                          <td>{grade.final_grade}</td>
                          <td>{grade.semester}</td>
                          <td>{grade.remarks}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="semester-average-sg">
                  <span>Gen. Ave for the second semester:</span>
                  <input 
                    type="text" 
                    className="average-input-sg" 
                    value={calculateGradeLevelAverages([], levelData.secondSem).secondSemAverage} 
                    readOnly 
                  />
                </div>
              </div>
            )}

            {hasFirstSem && hasSecondSem && (
              <>
                <hr className="separator" />
                <div className="final-grades-sg">
                  <span>Final Grades:</span>
                  <input 
                    type="text" 
                    className="final-grades-input-sg" 
                    value={calculateGradeLevelAverages(levelData.firstSem, levelData.secondSem).generalAverage} 
                    readOnly 
                  />
                </div>
              </>
            )}
          </div>
        );
      })}

      {hasAnyGrades && selectedGradeLevel !== "all" && Object.keys(filteredGrades).sort().map((level, levelIndex) => {
        const levelData = filteredGrades[level];
        const hasFirstSem = levelData.firstSem.length > 0;
        const hasSecondSem = levelData.secondSem.length > 0;

        return (
          <div key={level} className="grade-level-section-sg">
            {levelIndex > 0 && <hr className="grade-level-separator" />}
            
            <h2 className="grade-level-title-sg">{level}</h2>

            {!hasFirstSem && !hasSecondSem && (
              <div className="no-data-container">
                <div className="no-grades-message">
                  <h3>No Grades Available</h3>
                  <p>No grades have been recorded for {level} yet.</p>
                </div>
              </div>
            )}

            {hasFirstSem && (
              <div className="semester-section-sg">
                <h3>First Semester</h3>
                <div className="table-container-sg">
                  <table className="grades-table-sg">
                    <thead>
                      <tr>
                        <th>Description</th>
                        <th>Instructor</th>
                        <th>1st Quarter</th>
                        <th>2nd Quarter</th>
                        <th>Final Semester</th>
                        <th>Semester</th>
                        <th>Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {levelData.firstSem.map((grade, index) => (
                        <tr key={index}>
                          <td>{grade.subject_description}</td>
                          <td>{grade.subject_teacher}</td>
                          <td>{grade.first_quarter}</td>
                          <td>{grade.second_quarter}</td>
                          <td>{grade.final_grade}</td>
                          <td>{grade.semester}</td>
                          <td>{grade.remarks}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="semester-average-sg">
                  <span>Gen. Ave for the first semester:</span>
                  <input 
                    type="text" 
                    className="average-input-sg" 
                    value={calculateGradeLevelAverages(levelData.firstSem, []).firstSemAverage} 
                    readOnly 
                  />
                </div>
              </div>
            )}

            {hasFirstSem && hasSecondSem && <hr className="separator" />}

            {hasSecondSem && (
              <div className="semester-section-sg">
                <h3>Second Semester</h3>
                <div className="table-container-sg">
                  <table className="grades-table-sg">
                    <thead>
                      <tr>
                        <th>DESCRIPTION</th>
                        <th>INSTRUCTOR</th>
                        <th>3rd Quarter</th>
                        <th>4th Quarter</th>
                        <th>Final Semester</th>
                        <th>SEMESTER</th>
                        <th>REMARKS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {levelData.secondSem.map((grade, index) => (
                        <tr key={index}>
                          <td>{grade.subject_description}</td>
                          <td>{grade.subject_teacher}</td>
                          <td>{grade.first_quarter}</td>
                          <td>{grade.second_quarter}</td>
                          <td>{grade.final_grade}</td>
                          <td>{grade.semester}</td>
                          <td>{grade.remarks}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="semester-average-sg">
                  <span>Gen. Ave for the second semester:</span>
                  <input 
                    type="text" 
                    className="average-input-sg" 
                    value={calculateGradeLevelAverages([], levelData.secondSem).secondSemAverage} 
                    readOnly 
                  />
                </div>
              </div>
            )}

            {hasFirstSem && hasSecondSem && (
              <>
                <hr className="separator" />
                <div className="final-grades-sg">
                  <span>Final Grades:</span>
                  <input 
                    type="text" 
                    className="final-grades-input-sg" 
                    value={calculateGradeLevelAverages(levelData.firstSem, levelData.secondSem).generalAverage} 
                    readOnly 
                  />
                </div>
              </>
            )}
          </div>
        );
      })}

      {isSuccessModalOpen && (
        <div className="modal-overlay-sg">
          <div className="modal-content-sg">
            <h3>Generated</h3>
            <p>{exportType.toUpperCase()} file successfully generated!</p>
            <div className="modal-buttons-sg">
              <button onClick={closeSuccessModal}>Close</button>
            </div>
          </div>
        </div>
      )}

      {isConfirmationModalOpen && (
        <div className="modal-overlay-sg">
          <div className="modal-content-sg">
            <h3>Export Confirmation</h3>
            <p>Select which semester grades to export:</p>
            
            <div className="semester-selection-sg">
              <select 
                value={selectedSemester} 
                onChange={handleSemesterChange}
                className="semester-dropdown-sg"
              >
                <option value="both">Both Semesters</option>
                <option value="first">First Semester Only</option>
                <option value="second">Second Semester Only</option>
              </select>
            </div>
            
            <p>Export as {exportType.toUpperCase()}?</p>
            
            <div className="modal-buttons-sg">
              <button className="modal-yes-button-sg" onClick={handleConfirmExport}>Export</button>
              <button className="modal-no-button-sg" onClick={handleCancelExport}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PStudentGrades;