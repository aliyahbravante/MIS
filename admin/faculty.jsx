import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./faculty.css";
import { FaEdit, FaTrash, FaFilePdf, FaFileExcel } from "react-icons/fa";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";

const Faculty = () => {
  const [facultyList, setFaculty] = useState([]);
  const [strandsList, setStrandsList] = useState([]); // State to store strands data
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false); // New state for delete modal
  const [facultyToDelete, setFacultyToDelete] = useState(null); // Store faculty to delete
  const [exportType, setExportType] = useState(""); // "pdf" or "excel"
  const tableRef = useRef(null);
  
  const [currentFaculty, setCurrentFaculty] = useState({
    facultyName: "",
    email: "",
    contactNum: "",
    strand: "", // Default to empty, will be populated from strandsList
    grade_level: "", // Added grade_level field
    facultyStatus: "Employed",
  });

  const [generalError, setGeneralError] = useState(""); // State for general error message

  // State to manage form validation errors
  const [formErrors, setFormErrors] = useState({
    facultyName: false,
    email: false,
    contactNum: false,
    strand: false,
    grade_level: false,
  });

  const [searchTerm, setSearchTerm] = useState(""); // State for the search term

  // API URLs
  const baseUrl = "http://ncamisshs.com/backend";
  const AUDIT_LOG_URL = 'http://ncamisshs.com/backend/audit_log.php';

  // Function to log audit
  const logAudit = async (action, details) => {
    try {
      const response = await fetch(AUDIT_LOG_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user: 'Admin', // You can make this dynamic based on logged-in user
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

  // Fetch faculty data and strands data from the backend
  useEffect(() => {
    // Fetch faculty data
    axios
      .get(`${baseUrl}/faculty.php?type=faculty`)
      .then((response) => {
        setFaculty(response.data);
      })
      .catch((error) => {
        console.error("There was an error fetching the faculty data!", error);
      });

    // Fetch strands data
    axios
      .get(`${baseUrl}/faculty.php?type=strands`)
      .then((response) => {
        // Filter out duplicates from strandsList
        const uniqueStrands = [...new Set(response.data)];
        setStrandsList(uniqueStrands); // Store fetched unique strands data
      })
      .catch((error) => {
        console.error("There was an error fetching the strands data!", error);
      });
  }, []);

  const handleEditClick = (faculty) => {
    setCurrentFaculty({...faculty, originalData: faculty}); // Store original data for comparison
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleAddClick = () => {
    setCurrentFaculty({
      facultyName: "",
      email: "",
      contactNum: "",
      strand: "", // Ensure it starts empty for a new entry
      grade_level: "", // Reset grade_level
      facultyStatus: "Employed",
    });
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  // Updated handleDeleteClick to show modal instead of window.confirm
  const handleDeleteClick = (id) => {
    const faculty = facultyList.find(f => f.faculty_id === id);
    setFacultyToDelete(faculty);
    setIsDeleteModalOpen(true);
  };

  // New function to handle confirmed deletion
  const handleConfirmDelete = async () => {
    if (!facultyToDelete) return;

    try {
      const response = await axios.delete(`${baseUrl}/faculty.php`, { 
        data: { faculty_id: facultyToDelete.faculty_id } 
      });

      if (response.data.success) {
        setFaculty(facultyList.filter((faculty) => faculty.faculty_id !== facultyToDelete.faculty_id));
        
        // Log audit for successful deletion
        await logAudit('DELETE', `Deleted faculty member: ${facultyToDelete.facultyName} (${facultyToDelete.strand} Department)`);
        
        alert("Faculty member deleted successfully.");
      } else {
        alert("Error deleting faculty: " + (response.data.message || "Unknown error"));
      }
    } catch (error) {
      console.error("There was an error deleting the faculty!", error);
      alert("Error deleting faculty: Network or server error");
    }
    
    // Close the modal and reset
    setIsDeleteModalOpen(false);
    setFacultyToDelete(null);
  };

  // New function to handle delete cancellation
  const handleCancelDelete = () => {
    setIsDeleteModalOpen(false);
    setFacultyToDelete(null);
  };

  const handleSave = async () => {
    // Validate facultyName (only letters and spaces)
    const isInvalidFacultyName = /[^a-zA-Z\s]/.test(currentFaculty.facultyName);
  
    // Validate email (must include @gmail.com but not be exactly @gmail.com)
    const emailRegex = /^[^\s@]+@gmail\.com$/;
    const isInvalidEmail = !emailRegex.test(currentFaculty.email) || currentFaculty.email.trim() === "@gmail.com";
  
    // Validate contact number (must start with 09 and have exactly 11 digits)
    const contactRegex = /^09\d{9}$/;
    const isInvalidContactNum = !contactRegex.test(currentFaculty.contactNum);
  
    let errors = {
      facultyName: currentFaculty.facultyName.trim() === "" || isInvalidFacultyName,
      email: currentFaculty.email.trim() === "" || isInvalidEmail,
      contactNum: currentFaculty.contactNum.trim() === "" || isInvalidContactNum,
      strand: currentFaculty.strand.trim() === "",
      grade_level: currentFaculty.grade_level.trim() === "",
    };
  
    setFormErrors(errors);
  
    // Display error messages if validation fails
    if (isInvalidFacultyName) {
      setGeneralError("Faculty Name must contain only letters and spaces.");
      return;
    }
  
    if (isInvalidEmail) {
      setGeneralError("Email must be a valid Gmail address (e.g., example@gmail.com).");
      return;
    }
  
    if (isInvalidContactNum) {
      setGeneralError("Contact Number must start with 09 and contain exactly 11 digits.");
      return;
    }
  
    // If any field is empty, prevent saving
    if (Object.values(errors).includes(true)) {
      setGeneralError("Please input all the fields.");
      return;
    }
  
    setGeneralError(""); // Clear general error message if all fields are valid
  
    const requestData = {
      facultyName: currentFaculty.facultyName,
      email: currentFaculty.email,
      contactNum: currentFaculty.contactNum,
      strand: currentFaculty.strand,
      grade_level: currentFaculty.grade_level,
      facultyStatus: currentFaculty.facultyStatus,
    };
    
    console.log("Sending data:", requestData);
  
    const facultyApiUrl = `${baseUrl}/faculty.php`;
    
    if (isEditMode) {
      requestData.faculty_id = currentFaculty.faculty_id;
      axios
        .put(facultyApiUrl, requestData)
        .then(async (response) => {
          if (response.data.success) {
            setFaculty(
              facultyList.map((faculty) =>
                faculty.faculty_id === currentFaculty.faculty_id ? currentFaculty : faculty
              )
            );
            setIsModalOpen(false);
            
            // Log audit for successful update only with change details
            const changes = [];
            const original = currentFaculty.originalData;
            
            if (original.facultyName !== currentFaculty.facultyName) {
              changes.push(`Name: ${original.facultyName} → ${currentFaculty.facultyName}`);
            }
            if (original.email !== currentFaculty.email) {
              changes.push(`Email: ${original.email} → ${currentFaculty.email}`);
            }
            if (original.contactNum !== currentFaculty.contactNum) {
              changes.push(`Contact: ${original.contactNum} → ${currentFaculty.contactNum}`);
            }
            if (original.strand !== currentFaculty.strand) {
              changes.push(`Department: ${original.strand} → ${currentFaculty.strand}`);
            }
            if (original.facultyStatus !== currentFaculty.facultyStatus) {
              changes.push(`Status: ${original.facultyStatus} → ${currentFaculty.facultyStatus}`);
            }
            
            const changeDetails = changes.length > 0 ? ` (${changes.join(', ')})` : '';
            await logAudit('UPDATE', `Updated faculty member: ${currentFaculty.facultyName} (${currentFaculty.strand} Department)${changeDetails}`);
          } else {
            alert("Error updating faculty: " + (response.data.message || "Unknown error"));
          }
        })
        .catch((error) => {
          console.error("There was an error updating the faculty!", error);
          alert("Error updating faculty: Network or server error");
        });
    } else {
      axios
        .post(facultyApiUrl, requestData)
        .then(async (response) => {
          if (response.data.success) {
            // Refresh faculty list after adding
            axios.get(`${facultyApiUrl}?type=faculty`)
              .then(async (refreshResponse) => {
                setFaculty(refreshResponse.data);
                setIsModalOpen(false);
                alert("Faculty added successfully!");
                
                // Log audit for successful addition only
                await logAudit('CREATE', `Added faculty member: ${currentFaculty.facultyName} (${currentFaculty.strand} Department) - ${currentFaculty.facultyStatus}`);
              })
              .catch((refreshError) => {
                console.error("Error refreshing faculty list:", refreshError);
                // Still close the modal
                setIsModalOpen(false);
                alert("Faculty added successfully, but list refresh failed.");
                
                // Log audit for successful addition even with refresh error
                logAudit('CREATE', `Added faculty member: ${currentFaculty.facultyName} (${currentFaculty.strand} Department) - ${currentFaculty.facultyStatus}`);
              });
          } else {
            alert(response.data.message || "Error adding faculty");
          }
        })
        .catch((error) => {
          console.error("There was an error adding the faculty!", error);
          alert("Error adding faculty: Network or server error");
        });
    }
  };
  
  const handleCancel = () => {
    setIsModalOpen(false);
    setIsExportModalOpen(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "facultyName") {
      // Allow only letters and spaces
      const sanitizedValue = value.replace(/[^a-zA-Z\s]/g, ""); // Remove invalid characters
      setCurrentFaculty({ ...currentFaculty, [name]: sanitizedValue });
    } else {
      setCurrentFaculty({ ...currentFaculty, [name]: value });
    }
  };
  
  // Filter facultyList based on the search term
  const filteredFaculty = facultyList.filter((faculty) =>
    faculty.facultyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faculty.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faculty.contactNum.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faculty.strand.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faculty.facultyStatus.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Function to get export description based on search term
  const getExportDescription = () => {
    if (!searchTerm.trim()) {
      return `Faculty List (${filteredFaculty.length} faculty members)`;
    }
    
    // Check if search term matches specific patterns
    const searchLower = searchTerm.toLowerCase().trim();
    
    // Check if searching for specific status
    if (searchLower === 'employed' || searchLower === 'retired') {
      const statusName = searchLower.charAt(0).toUpperCase() + searchLower.slice(1);
      return `${statusName} Faculties (${filteredFaculty.length} faculty members)`;
    }
    
    // Check if searching for department (contains common department keywords)
    const departmentKeywords = ['department', 'he', 'ict', 'abm', 'humss', 'stem', 'gas'];
    const isDepartmentSearch = departmentKeywords.some(keyword => 
      searchLower.includes(keyword) || 
      facultyList.some(f => f.strand.toLowerCase().includes(searchLower))
    );
    
    if (isDepartmentSearch) {
      // Try to find matching department
      const matchingFaculty = facultyList.find(f => 
        f.strand.toLowerCase().includes(searchLower)
      );
      if (matchingFaculty) {
        return `${matchingFaculty.strand} Department (${filteredFaculty.length} faculty members)`;
      }
    }
    
    // Check if searching for specific faculty member (by name)
    if (filteredFaculty.length === 1) {
      const faculty = filteredFaculty[0];
      return `Faculty Data: ${faculty.facultyName} (${faculty.strand} Department)`;
    }
    
    // Default case for other searches
    return `Faculty Search: "${searchTerm}" (${filteredFaculty.length} results)`;
  };

  // Function to handle PDF button click
  const handlePdfClick = () => {
    setExportType("pdf");
    setIsExportModalOpen(true);
  };

  // Function to handle Excel button click
  const handleExcelClick = () => {
    setExportType("excel");
    setIsExportModalOpen(true);
  };

  // Function to export to PDF
  const exportToPdf = async () => {
    const doc = new jsPDF();
    
    // Set PDF title with green color
    doc.setTextColor(0, 100, 0); // RGB for dark green
    doc.setFontSize(18);
    doc.text("Faculty List", 14, 22);
    
    // Reset text color for the rest of the document
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    
    // Define the table structure
    const tableColumn = ["Faculty Name", "Email", "Contact No.", "Department", "Status"];
    
    // Convert the data for the PDF table
    const tableRows = [];
    filteredFaculty.forEach(faculty => {
      const facultyData = [
        faculty.facultyName,
        faculty.email,
        faculty.contactNum,
        faculty.strand,
        faculty.facultyStatus
      ];
      tableRows.push(facultyData);
    });
    
    // Create the table with green header color
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 25,
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
      // Style for status column (last column)
      columnStyles: {
        4: {
          // Apply conditional text color to the 5th column (index 4)
          fontStyle: (data) => {
            return data === "Employed" ? "normal" : "italic";
          },
          textColor: (data) => {
            return data === "Employed" ? [0, 100, 0] : [200, 0, 0]; // Green for employed, red for retired
          }
        }
      },
    });

    doc.save("faculty.pdf");
    setIsExportModalOpen(false);
    
    // Log audit for PDF export with search context
    const exportDesc = getExportDescription();
    await logAudit('EXPORT', `Exported ${exportDesc} to PDF`);
  };

  // Function to export to Excel
  const exportToExcel = async () => {
    // Prepare data for Excel export
    const worksheet = XLSX.utils.json_to_sheet(
      filteredFaculty.map(faculty => ({
        "FACULTY NAME": faculty.facultyName,
        "EMAIL": faculty.email,
        "CONTACT NO.": faculty.contactNum,
        "DEPARTMENT": faculty.strand,
        "FACULTY STATUS": faculty.facultyStatus
      }))
    );

    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Faculty");

    // Generate Excel file and save
    XLSX.writeFile(workbook, "faculty.xlsx");
    setIsExportModalOpen(false);
    
    // Log audit for Excel export with search context
    const exportDesc = getExportDescription();
    await logAudit('EXPORT', `Exported ${exportDesc} to Excel`);
  };

  // Close the export confirmation modal
  const handleCloseExportModal = () => {
    setIsExportModalOpen(false);
  };

  // Process export based on selected type
  const handleConfirmExport = () => {
    if (exportType === "pdf") {
      exportToPdf();
    } else if (exportType === "excel") {
      exportToExcel();
    }
  };

  // Handle search term changes
  const handleSearchChange = (e) => {
    const newSearchTerm = e.target.value;
    setSearchTerm(newSearchTerm);
  };

  return (
    <div className="admin-faculty-container-fac">
      <div className="admin-faculty-header-fac">
        <h2 className="admin-faculty-title-fac">FACULTY</h2>
          <p className="total-label-ap">Total :
          <span className="total-count-ap">{facultyList.length}</span>
          </p>
      </div>

      <div className="admin-faculty-top-controls-fac">
        <div className="admin-faculty-search-bar-fac">
          <input
            type="text"
            placeholder="Search by name, email, contact, department, or status"
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>
            <div className="export-buttons">
          <button className="admin-faculty-pdf-button-fac" onClick={handlePdfClick}>
            <FaFilePdf style={{ marginRight: '5px' }} /> PDF
          </button>
          <button className="admin-faculty-excel-button-fac" onClick={handleExcelClick}>
            <FaFileExcel style={{ marginRight: '5px' }} /> Excel
          </button>
          <button className="admin-faculty-add-button-fac" onClick={handleAddClick}>
            Add
          </button>
          </div>
      </div>
      <div className="admin-faculty-table-container-fac" ref={tableRef}>
        <table className="admin-faculty-table-fac">
          <thead>
            <tr>
              <th>FACULTY NAME</th>
              <th>EMAIL</th>
              <th>CONTACT NO.</th>
              <th>DEPARTMENT</th>
              <th>GRADE LEVEL</th>
              <th>FACULTY STATUS</th>
              <th>EDIT</th>
              <th>DELETE</th>
            </tr>
          </thead>
          <tbody>
            {filteredFaculty.map((faculty) => (
              <tr key={faculty.faculty_id}>
                <td>{faculty.facultyName}</td>
                <td>{faculty.email}</td>
                <td>{faculty.contactNum}</td>
                <td>{faculty.strand}</td>
                <td>{faculty.grade_level}</td>
                <td
                  style={{
                    color:
                      faculty.facultyStatus === "Employed" ? "green" : "red",
                  }}
                >
                  {faculty.facultyStatus}
                </td>
                <td>
                  <FaEdit
                    className="admin-faculty-edit-icon-fac"
                    onClick={() => handleEditClick(faculty)}
                    style={{ cursor: "pointer", color: "#006400" }}
                  />
                </td>
                <td>
                  <FaTrash
                    className="admin-delete-icon-faculty-fac"
                    onClick={() => handleDeleteClick(faculty.faculty_id)}
                    style={{ cursor: "pointer", color: "#B22222" }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {isModalOpen && (
        <div className="admin-faculty-modal-fac">
          <div className="admin-faculty-modal-content-fac">
            <h3>{isEditMode ? "Edit Faculty" : "Add Faculty"}</h3>

            {/* General Error Message */}
            {generalError && (
              <p className="admin-faculty-general-error-message-fac">{generalError}</p>
            )}

            <label>
              Faculty Name
              <input
                type="text"
                name="facultyName"
                value={currentFaculty.facultyName}
                onChange={handleInputChange}
                placeholder="Enter faculty name"
                className={formErrors.facultyName ? "error" : ""}
              />
             
            </label>
            <label>
              Email
              <input
                type="email"
                name="email"
                value={currentFaculty.email}
                onChange={handleInputChange}
                placeholder="Enter email"
                className={formErrors.email ? "error" : ""}
              />
            </label>
            <label>
              Contact No.
              <input
                type="text"
                name="contactNum"
                value={currentFaculty.contactNum}
                onChange={(e) => {
                  let value = e.target.value;
                  // Allow only digits and limit to 11 characters
                  value = value.replace(/\D/g, ""); // Remove non-numeric characters
                  if (value.length > 11) {
                    value = value.slice(0, 11); // Limit to 11 digits
                  }
                  setCurrentFaculty({ ...currentFaculty, contactNum: value });
                }}
                placeholder="Enter contact number"
                className={formErrors.contactNum ? "error" : ""}
              />
            </label>

            <label>
              Strand
              <select
                name="strand"
                value={currentFaculty.strand}
                onChange={handleInputChange}
                className={formErrors.strand ? "error" : ""}
              >
                <option value="">Select a Strand</option>
                {strandsList.map((strand, index) => (
                  <option key={index} value={strand}>
                    {strand}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Grade Level
              <select
                name="grade_level"
                value={currentFaculty.grade_level}
                onChange={handleInputChange}
              >
                <option value="">Select Grade Level</option>
                <option value="11">Grade 11</option>
                <option value="12">Grade 12</option>
                <option value="11 & 12">Grade 11 & 12</option>
              </select>
            </label>
            <label>
              Faculty Status
              <select
                name="facultyStatus"
                value={currentFaculty.facultyStatus}
                onChange={handleInputChange}
              >
                <option value="Employed">Employed</option>
                <option value="Retired">Retired</option>
              </select>
            </label>

            <div className="admin-fac-btn-group">
              <button className="admin-faculty-save-button-fac" onClick={handleSave}>
                Save
              </button>
              <button className="admin-faculty-cancel-button-fac" onClick={handleCancel}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="admin-faculty-modal-fac">
          <div className="admin-faculty-modal-content-fac">
            <h3>Delete Confirmation</h3>
            <p className="admin-faculty-export-message-fac">
              Are you sure you want to delete the faculty member "{facultyToDelete?.facultyName}"?
            </p>
            <div className="admin-fac-btn-group">
              <button className="admin-faculty-save-button-fac" onClick={handleConfirmDelete}>
                Delete
              </button>
              <button className="admin-faculty-cancel-button-fac" onClick={handleCancelDelete}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Confirmation Modal */}
      {isExportModalOpen && (
        <div className="admin-faculty-modal-fac">
          <div className="admin-faculty-modal-content-fac">
            <h3>Export Confirmation</h3>
            <p className="admin-faculty-export-message-fac">
              Are you sure you want to export the current faculty list to {exportType === "pdf" ? "PDF" : "Excel"}?
            </p>
            <div className="admin-fac-btn-group">
              <button className="admin-faculty-save-button-fac" onClick={handleConfirmExport}>
                Export
              </button>
              <button className="admin-faculty-cancel-button-fac" onClick={handleCloseExportModal}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Faculty;