import React, { useState, useEffect, useRef } from "react";
import "./strands.css";
import { FaEdit, FaTrash, FaFilePdf, FaFileExcel } from "react-icons/fa";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";

const Strands = () => {
  const [strands, setStrands] = useState([]);
  const [filteredStrands, setFilteredStrands] = useState([]);  // State for filtered strands
  const [searchTerm, setSearchTerm] = useState("");  // State for search input
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false); // New state for delete modal
  const [strandToDelete, setStrandToDelete] = useState(null); // Store strand to delete
  const [exportType, setExportType] = useState(""); // "pdf" or "excel"
  const [gradeFilter, setGradeFilter] = useState("all"); // Default to show all grades
  const tableRef = useRef(null);
  
  const [currentStrand, setCurrentStrand] = useState({
    strand_id: "",
    strand: "",
    description: "",
    section: "",
    start: "",
    end: "",
    curriculum: "New", // Default to "New"
    grade: "", // Grade property
    slots: "", // Added slots property
  });
  const [originalStrand, setOriginalStrand] = useState({}); // Store original data for update comparison
  const [formErrors, setFormErrors] = useState({});

  // Function to log audit actions
  const logAuditAction = async (action, details) => {
    try {
      // Get current user - you might want to replace this with actual user session data
      const currentUser = "Admin"; // Replace with actual logged-in user
      
      await fetch("http://ncamisshs.com/backend/audit_log.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user: currentUser,
          action: action,
          details: details
        }),
      });
    } catch (error) {
      console.error("Error logging audit action:", error);
    }
  };

  useEffect(() => {
    // Updated to use ncamisshs.com domain
    const baseUrl = "http://ncamisshs.com/backend";

    const fetchStrands = async () => {
      try {
        const response = await fetch(`${baseUrl}/strands.php`);
        const data = await response.json();
        setStrands(data);
        setFilteredStrands(data); // Initially, all strands are displayed
      } catch (error) {
        console.error("Error fetching strands:", error);
      }
    };

    fetchStrands();
  }, []);

  // Apply filters when grade filter or search term changes
  useEffect(() => {
    let filtered = strands;
    
    // Apply grade filter
    if (gradeFilter !== "all") {
      const gradeValue = parseInt(gradeFilter);
      filtered = filtered.filter(strand => parseInt(strand.grade) === gradeValue);
    }
    
    // Apply search filter with trimmed search term
    if (searchTerm) {
      const searchLower = searchTerm.trim().toLowerCase();
      filtered = filtered.filter((strand) => {
        return (
          (strand.strand && strand.strand.toLowerCase().includes(searchLower)) ||
          (strand.description && strand.description.toLowerCase().includes(searchLower)) ||
          (strand.section && strand.section.toLowerCase().includes(searchLower)) ||
          (strand.grade && strand.grade.toString().toLowerCase().includes(searchLower)) ||
          (strand.slots && strand.slots.toString().toLowerCase().includes(searchLower)) ||
          (strand.start && strand.start.toLowerCase().includes(searchLower)) ||
          (strand.end && strand.end.toLowerCase().includes(searchLower)) ||
          (strand.curriculum && strand.curriculum.toLowerCase().includes(searchLower))
        );
      });
    }
    
    setFilteredStrands(filtered);
  }, [strands, gradeFilter, searchTerm]);

  // Function to handle search term change
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
  };

  // Function to handle grade filter change
  const handleGradeFilterChange = (e) => {
    setGradeFilter(e.target.value);
  };

  const handleAddClick = () => {
    setCurrentStrand({
      strand_id: "",
      strand: "",
      description: "",
      section: "",
      start: "",
      end: "",
      curriculum: "New", // Default to "New"
      grade: "", // Reset grade
      slots: "", // Reset slots
    });
    setOriginalStrand({});
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleEditClick = (strand) => {
    setCurrentStrand(strand);
    setOriginalStrand({ ...strand }); // Store original for comparison
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Updated handleDeleteClick to show modal instead of window.confirm
  const handleDeleteClick = (id) => {
    const strand = strands.find(str => str.strand_id === id);
    setStrandToDelete(strand);
    setIsDeleteModalOpen(true);
  };

  // New function to handle confirmed deletion
  const handleConfirmDelete = async () => {
    if (!strandToDelete) return;

    try {
      // Updated to use ncamisshs.com domain
      const response = await fetch("http://ncamisshs.com/backend/strands.php", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ strand_id: strandToDelete.strand_id }),
      });

      const data = await response.json();
      if (data.success) {
        // Log audit action for deletion
        const auditDetails = `Deleted a strand: ${strandToDelete.strand} (Grade ${strandToDelete.grade} - ${strandToDelete.section})`;
        await logAuditAction("DELETE", auditDetails);

        setStrands(strands.filter((strand) => strand.strand_id !== strandToDelete.strand_id));
        setFilteredStrands(filteredStrands.filter((strand) => strand.strand_id !== strandToDelete.strand_id));
        alert("Strand deleted successfully.");
      } else {
        alert("Error deleting strand");
      }
    } catch (error) {
      console.error("Error deleting strand:", error);
      alert("Failed to delete the strand.");
    }
    
    // Close the modal and reset
    setIsDeleteModalOpen(false);
    setStrandToDelete(null);
  };

  // New function to handle delete cancellation
  const handleCancelDelete = () => {
    setIsDeleteModalOpen(false);
    setStrandToDelete(null);
  };

  const handleSave = () => {
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setIsConfirmModalOpen(true);
  };

  const handleConfirmSave = async () => {
    // Updated to use ncamisshs.com domain
    const baseUrl = "http://ncamisshs.com/backend/strands.php";
    
    if (currentStrand.strand_id) {
      // UPDATE operation
      const response = await fetch(baseUrl, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(currentStrand),
      });

      const data = await response.json();
      if (data.success) {
        // Log audit action for update
        const changes = [];
        if (originalStrand.strand !== currentStrand.strand) {
          changes.push(`Strand Name: ${originalStrand.strand} → ${currentStrand.strand}`);
        }
        if (originalStrand.description !== currentStrand.description) {
          changes.push(`Description: ${originalStrand.description} → ${currentStrand.description}`);
        }
        if (originalStrand.section !== currentStrand.section) {
          changes.push(`Section: ${originalStrand.section} → ${currentStrand.section}`);
        }
        if (originalStrand.grade !== currentStrand.grade) {
          changes.push(`Grade: ${originalStrand.grade} → ${currentStrand.grade}`);
        }
        if (originalStrand.slots !== currentStrand.slots) {
          changes.push(`Slots: ${originalStrand.slots} → ${currentStrand.slots}`);
        }
        if (originalStrand.start !== currentStrand.start) {
          changes.push(`Start Date: ${originalStrand.start} → ${currentStrand.start}`);
        }
        if (originalStrand.end !== currentStrand.end) {
          changes.push(`End Date: ${originalStrand.end} → ${currentStrand.end}`);
        }
        if (originalStrand.curriculum !== currentStrand.curriculum) {
          changes.push(`Curriculum: ${originalStrand.curriculum} → ${currentStrand.curriculum}`);
        }

        const auditDetails = `Updated a strand: ${currentStrand.strand} (Grade ${currentStrand.grade} - ${currentStrand.section}). Changes: ${changes.join(', ')}`;
        await logAuditAction("UPDATE", auditDetails);

        setStrands(
          strands.map((strand) =>
            strand.strand_id === currentStrand.strand_id ? currentStrand : strand
          )
        );
        setFilteredStrands(
          filteredStrands.map((strand) =>
            strand.strand_id === currentStrand.strand_id ? currentStrand : strand
          )
        );
        alert("Strand updated successfully.");
      } else {
        alert("Error updating strand");
      }
    } else {
      // CREATE operation
      const response = await fetch(baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(currentStrand),
      });

      const data = await response.json();
      if (data.success) {
        // Log audit action for creation
        const auditDetails = `Added new strand: ${currentStrand.strand} (Grade ${currentStrand.grade} - ${currentStrand.section})`;
        await logAuditAction("CREATE", auditDetails);

        // Refresh strands to get the new data with proper ID from the server
        const refreshResponse = await fetch(baseUrl);
        const refreshData = await refreshResponse.json();
        setStrands(refreshData);
        setFilteredStrands(refreshData);
        alert("Strand added successfully.");
      } else {
        alert("Error adding strand");
      }
    }
    setIsModalOpen(false);
    setIsConfirmModalOpen(false);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setIsConfirmModalOpen(false);
    setIsPdfModalOpen(false);
    setIsExportModalOpen(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentStrand({ ...currentStrand, [name]: value });
  };

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setCurrentStrand({ ...currentStrand, [name]: value });
  };

  const validateForm = () => {
    const errors = {};
    if (!currentStrand.strand) errors.strand = "Strand name is required";
    if (!currentStrand.description) errors.description = "Description is required";
    if (!currentStrand.section) errors.section = "Section is required";
    if (!currentStrand.start) errors.start = "Start date is required";
    if (!currentStrand.end) errors.end = "End date is required";
    if (!currentStrand.curriculum) errors.curriculum = "Curriculum is required";
    if (!currentStrand.grade) errors.grade = "Grade is required"; // Validate grade
    if (!currentStrand.slots) errors.slots = "Slots is required"; // Validate slots
    else if (isNaN(currentStrand.slots) || parseInt(currentStrand.slots) <= 0) {
      errors.slots = "Slots must be a positive number";
    }
    return errors;
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

  // Function to get export description based on current filters
  const getExportDescription = () => {
    let description = "";
    
    if (gradeFilter !== "all") {
      description += `Grade ${gradeFilter} Strands`;
    } else {
      description += "All Strands";
    }
    
    if (searchTerm.trim()) {
      description += ` (Search: "${searchTerm.trim()}")`;
    }
    
    return description;
  };

  // Function to export to PDF
  const exportToPdf = async () => {
    const doc = new jsPDF();
    
    // Set PDF title with green color
    doc.setTextColor(0, 100, 0); // RGB for dark green
    doc.setFontSize(18);
    doc.text("Strands List", 14, 22);
    
    // Reset text color for the rest of the document
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    
    // Define the table structure with slots column
    const tableColumn = ["Strands", "Description", "Section", "Grade", "Slots", "Start", "End", "Curriculum"];
    
    // Convert the data for the PDF table
    const tableRows = [];
    filteredStrands.forEach(strand => {
      const strandData = [
        strand.strand,
        strand.description,
        strand.section,
        strand.grade,
        strand.slots,
        strand.start,
        strand.end,
        strand.curriculum
      ];
      tableRows.push(strandData);
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
    });

    doc.save("strands.pdf");
    
    // Log audit action for PDF export
    const exportDesc = getExportDescription();
    const auditDetails = `Exported a List of Strands to PDF: ${exportDesc}`;
    await logAuditAction("EXPORT", auditDetails);
    
    setIsExportModalOpen(false);
  };

  // Function to export to Excel
  const exportToExcel = async () => {
    // Prepare data for Excel export
    const worksheet = XLSX.utils.json_to_sheet(
      filteredStrands.map(strand => ({
        STRAND: strand.strand,
        DESCRIPTION: strand.description,
        SECTION: strand.section,
        "GRADE LEVEL": strand.grade,
        SLOTS: strand.slots,
        "START DATE": strand.start,
        "END DATE": strand.end,
        CURRICULUM: strand.curriculum
      }))
    );

    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Strands");

    // Generate Excel file and save
    XLSX.writeFile(workbook, "strands.xlsx");
    
    // Log audit action for Excel export
    const exportDesc = getExportDescription();
    const auditDetails = `Exported a List of Strands to Excel: ${exportDesc}`;
    await logAuditAction("EXPORT", auditDetails);
    
    setIsExportModalOpen(false);
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

  return (
    <div className="strands-container-str">
      <div className="strands-header-str">
        <h2 className="strands-title-str">STRANDS</h2>
      </div>
      <div className="top-controls-strands-str">
        <div className="search-and-add-strands-str">
          <input
            type="text"
            className="search-input-strands-str"
            placeholder="Search by strand, description, section, grade, slots, dates, or curriculum..."
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>
        <div className="export-buttons">
        <select
            className="strands-filter-str"
            value={gradeFilter}
            onChange={handleGradeFilterChange}
          >
            <option value="all">All Grades</option>
            <option value="11">Grade 11</option>
            <option value="12">Grade 12</option>
          </select>
          <button className="strands-pdf-button-str" onClick={handlePdfClick}>
            <FaFilePdf style={{ marginRight: '5px' }} /> PDF
          </button>
          <button className="strands-excel-button-str" onClick={handleExcelClick}>
            <FaFileExcel style={{ marginRight: '5px' }} /> Excel
          </button>
            <button className="add-button-strands-str" onClick={handleAddClick}>
            Add
          </button>
          </div>
      </div>
      <div className="strands-table-container-str" ref={tableRef}>
        <table className="strands-table-str">
          <thead>
            <tr>
              <th>STRANDS</th>
              <th>DESCRIPTION</th>
              <th>SECTION</th>
              <th>GRADE</th>
              <th>SLOTS</th>
              <th>START</th>
              <th>END</th>
              <th>CURRICULUM</th>
              <th>EDIT</th>
              <th>DELETE</th>
            </tr>
          </thead>
          <tbody>
            {filteredStrands.map((strand) => (
              <tr key={strand.strand_id}>
                <td>{strand.strand}</td>
                <td>{strand.description}</td>
                <td>{strand.section}</td>
                <td>{strand.grade}</td>
                <td>{strand.slots}</td>
                <td>{strand.start}</td>
                <td>{strand.end}</td>
                <td>{strand.curriculum}</td>
                <td>
                  <FaEdit
                    className="strands-edit-icon-str"
                    onClick={() => handleEditClick(strand)}
                    style={{ cursor: "pointer", color: "#006400" }}
                  />
                </td>
                <td>
                  <FaTrash
                    className="strands-delete-icon-str"
                    onClick={() => handleDeleteClick(strand.strand_id)}
                    style={{ cursor: "pointer", color: "#B22222" }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="strands-modal-stra">
          <div className="strands-modal-content-stra">
            <h3 className="strands-modal-title-stra">
              {currentStrand.strand_id ? "EDIT STRAND" : "ADD STRAND"}
            </h3>
            <div className="strands-modal-form-stra">
              <div className="strands-form-group-stra">
                <label>
                  Strand Name
                  <input
                    type="text"
                    name="strand"
                    value={currentStrand.strand}
                    onChange={handleInputChange}
                    style={formErrors.strand ? { borderColor: "red" } : {}}
                  />
                  {formErrors.strand && <span>{formErrors.strand}</span>}
                </label>
                <label>
                  Description
                  <input
                    type="text"
                    name="description"
                    value={currentStrand.description}
                    onChange={handleInputChange}
                    style={formErrors.description ? { borderColor: "red" } : {}}
                  />
                  {formErrors.description && <span>{formErrors.description}</span>}
                </label>
                <label>
                  Grade
                  <select
                    name="grade"
                    value={currentStrand.grade}
                    onChange={handleInputChange}
                    style={formErrors.grade ? { borderColor: "red" } : {}}
                  >
                    <option value="">Select Grade</option>
                    <option value="11">11</option>
                    <option value="12">12</option>
                  </select>
                  {formErrors.grade && <span>{formErrors.grade}</span>}
                </label>
                <label>
                  Section
                  <input
                    type="text"
                    name="section"
                    value={currentStrand.section}
                    onChange={handleInputChange}
                    style={formErrors.section ? { borderColor: "red" } : {}}
                  />
                  {formErrors.section && <span>{formErrors.section}</span>}
                </label>
                <label>
                  Slots
                  <input
                    type="number"
                    name="slots"
                    value={currentStrand.slots}
                    onChange={handleInputChange}
                    min="1"
                    style={formErrors.slots ? { borderColor: "red" } : {}}
                  />
                  {formErrors.slots && <span>{formErrors.slots}</span>}
                </label>
                <label>
                  Start Date
                  <input
                  className="strands-drop-sel"
                    type="date"
                    name="start"
                    value={currentStrand.start}
                    onChange={handleDateChange}
                    style={formErrors.start ? { borderColor: "red" } : {}}
                  />
                  {formErrors.start && <span>{formErrors.start}</span>}
                </label>
                <label>
                  End Date
                  <input
                  className="strands-drop-sel"
                    type="date"
                    name="end"
                    value={currentStrand.end}
                    onChange={handleDateChange}
                    style={formErrors.end ? { borderColor: "red" } : {}}
                  />
                  {formErrors.end && <span>{formErrors.end}</span>}
                </label>
                <label>
                  Curriculum
                  <input
                    type="text"
                    name="curriculum"
                    value={currentStrand.curriculum}
                    onChange={handleInputChange}
                    style={formErrors.curriculum ? { borderColor: "red" } : {}}
                  />
                  {formErrors.curriculum && <span>{formErrors.curriculum}</span>}
                </label>
              </div>
            </div>
            <div className="strands-modal-buttons-stra">
              <button className="strands-save-button-stra" onClick={handleSave}>
                Save
              </button>
              <button className="strands-cancel-button-stra" onClick={handleCancel}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {isConfirmModalOpen && (
        <div className="strands-modal-stra">
          <div className="strands-export-modal-content-stra">
            <h3 className="strands-modal-title-stra">Save Confirmation</h3>
            <p className="strands-export-message-stra">
              Are you sure you want to save these changes?
            </p>
            <div className="strands-modal-buttons-stra">
              <button className="strands-save-button-stra" onClick={handleConfirmSave}>
                Confirm
              </button>
              <button className="strands-cancel-button-stra" onClick={handleCancel}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="strands-modal-stra">
          <div className="strands-export-modal-content-stra">
            <h3 className="strands-modal-title-stra">Delete Confirmation</h3>
            <p className="strands-export-message-stra">
              Are you sure you want to delete the strand "{strandToDelete?.strand}"?
            </p>
            <div className="strands-modal-buttons-stra">
              <button className="strands-save-button-stra" onClick={handleConfirmDelete}>
                Delete
              </button>
              <button className="strands-cancel-button-stra" onClick={handleCancelDelete}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Export Confirmation Modal */}
      {isExportModalOpen && (
        <div className="strands-modal-stra">
          <div className="strands-export-modal-content-stra">
            <h3 className="strands-modal-title-stra">Export Confirmation</h3>
            <p className="strands-export-message-stra">
              Are you sure you want to export the current strands list to {exportType === "pdf" ? "PDF" : "Excel"}?
            </p>
            <div className="strands-modal-buttons-stra">
              <button className="strands-save-button-stra" onClick={handleConfirmExport}>
                Export
              </button>
              <button className="strands-cancel-button-stra" onClick={handleCloseExportModal}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Strands;