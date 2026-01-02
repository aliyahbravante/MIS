import React, { useState, useEffect, useRef } from "react";
import "./auditlogs.css";
import { FaFilePdf } from "react-icons/fa";
import jsPDF from "jspdf";
import "jspdf-autotable";

const AuditLogs = () => {
  const [auditLogs, setAuditLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [dateRange, setDateRange] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const tableRef = useRef(null);

  // Fetch audit logs from PHP backend
  const fetchAuditLogs = async () => {
    setLoading(true);
    setError("");
    
    try {
      const response = await fetch("http://ncamisshs.com/backend/audit_log.php");
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Transform the data to match the expected format
        const transformedLogs = data.audit_logs.map(log => ({
          id: log.audit_id,
          timestamp: log.date_time,
          user: log.user,
          action: log.action,
          details: log.details
        }));
        
        setAuditLogs(transformedLogs);
        setFilteredLogs(transformedLogs);
      } else {
        throw new Error(data.message || "Failed to fetch audit logs");
      }
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      setError(`Failed to fetch audit logs: ${error.message}`);
      // Set empty array as fallback
      setAuditLogs([]);
      setFilteredLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  // Apply filters when filters or search term changes
  useEffect(() => {
    let filtered = auditLogs;
    
    // Apply action filter (only if not "all")
    if (actionFilter !== "all") {
      filtered = filtered.filter(log => log.action.toLowerCase() === actionFilter.toLowerCase());
    }
    
    // Apply search filter - search across all fields (only if search term exists)
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(log => 
        log.user.toLowerCase().includes(searchLower) ||
        log.action.toLowerCase().includes(searchLower) ||
        log.details.toLowerCase().includes(searchLower) ||
        log.timestamp.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply date range filter - search by specific date (only if date is selected)
    if (dateRange) {
      const targetDate = new Date(dateRange);
      filtered = filtered.filter(log => {
        const logDate = new Date(log.timestamp.split(' ')[0]);
        return logDate.toDateString() === targetDate.toDateString();
      });
    }
    
    setFilteredLogs(filtered);
  }, [auditLogs, actionFilter, searchTerm, dateRange]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleActionFilterChange = (e) => {
    setActionFilter(e.target.value);
  };

  const handleDateRangeChange = (e) => {
    setDateRange(e.target.value);
  };

  const exportToPdf = () => {
    const doc = new jsPDF();
    
    // Set PDF title with green color
    doc.setTextColor(0, 100, 0);
    doc.setFontSize(18);
    doc.text("Audit Logs Report", 14, 22);
    
    // Add generation date
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    const currentDate = new Date().toLocaleString('en-PH', { timeZone: 'Asia/Manila' });
    doc.text(`Generated on: ${currentDate}`, 14, 30);
    
    // Add filters info if any are applied
    let filtersText = "";
    if (actionFilter !== "all") filtersText += `Action: ${actionFilter.toUpperCase()} `;
    if (searchTerm) filtersText += `Search: "${searchTerm}" `;
    if (dateRange) filtersText += `Date: ${dateRange} `;
    
    if (filtersText) {
      doc.text(`Filters Applied: ${filtersText}`, 14, 36);
    }
    
    // Define the table structure
    const tableColumn = ["Timestamp", "User", "Action", "Details"];
    
    // Convert the data for the PDF table
    const tableRows = [];
    filteredLogs.forEach(log => {
      const logData = [
        log.timestamp,
        log.user,
        log.action,
        log.details
      ];
      tableRows.push(logData);
    });

    // Create the table with green header color
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: filtersText ? 42 : 36,
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [0, 100, 0],
        textColor: [255, 255, 255],
        fontSize: 8,
      },
      columnStyles: {
        0: { cellWidth: 35 }, // Timestamp
        1: { cellWidth: 35 }, // User
        2: { cellWidth: 25 }, // Action
        3: { cellWidth: 95 }, // Details
      }
    });

    // Generate filename with current date
    const filename = `audit_logs_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
  };

  return (
    <div className="auditlogs-container-al">
      <div className="header-auditlogs-al">
        <h2 className="auditlogs-title-al">AUDIT LOGS</h2>
      </div>
              {error && (
          <div className="error-message-al" style={{ color: 'red', marginTop: '10px' }}>
            {error}
          </div>
        )}
      <div className="top-controls-subjects-sub">
        <div className="search-and-add-subjects-sub">
          <input
            type="text"
            className="search-input-subjects-sub"
            placeholder="Search by user, action, details, or timestamp..."
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>
        <div className="export-buttons">
          <select
            className="auditlogs-filter-al"
            value={actionFilter}
            onChange={handleActionFilterChange}
          >
            <option value="all">All Actions</option>
            <option value="export">EXPORT</option>
            <option value="generate">GENERATE</option>
            <option value="view">VIEW</option>
            <option value="create">CREATE</option>
            <option value="update">UPDATE</option>
            <option value="delete">DELETE</option>
          </select>
          
          <input
            type="date"
            className="auditlogs-date-filter-al"
            value={dateRange}
            onChange={handleDateRangeChange}
            title="Filter by specific date"
          />
          
          <button 
            className="auditlogs-pdf-button-al" 
            onClick={exportToPdf}
            disabled={filteredLogs.length === 0}
          >
            <FaFilePdf style={{ marginRight: '5px' }} /> PDF
          </button>
        </div>
        </div>
      
      <div className="auditlogs-summary-al">
        <p>
          Showing {filteredLogs.length} of {auditLogs.length} audit logs
          {(searchTerm || actionFilter !== "all" || dateRange) && " (filtered)"}
        </p>
      </div>
      
      <div className="auditlogs-table-container-al" ref={tableRef}>
        {loading ? (
          <div className="loading-al" style={{ textAlign: 'center', padding: '20px' }}>
            Loading audit logs...
          </div>
        ) : (
          <table className="auditlogs-table-al">
            <thead>
              <tr>
                <th>TIMESTAMP</th>
                <th>USER</th>
                <th>ACTION</th>
                <th>DETAILS</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr key={log.id}>
                  <td>{log.timestamp}</td>
                  <td>{log.user}</td>
                  <td>
                    <span className={`action-badge-al action-${log.action.toLowerCase()}-al`}>
                      {log.action}
                    </span>
                  </td>
                  <td>{log.details}</td>
                </tr>
              ))}
              {filteredLogs.length === 0 && !loading && (
                <tr>
                  <td colSpan="4" className="no-data-al">
                    {error ? "Error loading data" : "No audit logs found"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AuditLogs;