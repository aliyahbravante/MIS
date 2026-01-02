import React, { useState, useEffect } from "react";
import './announcement.css';
import { FaEdit, FaTrash, FaEye, FaPaperclip, FaDownload, FaEyeSlash, FaSms } from "react-icons/fa";

const Announcement = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add"); // 'add', 'view', 'edit'
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [isAttachmentModalOpen, setIsAttachmentModalOpen] = useState(false);
  const [currentAttachment, setCurrentAttachment] = useState(null);
  const [smsStatus, setSmsStatus] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    date: '',
    author: '',
    role: '',
    category: '',
    content: '',
    attachment: null,
    attachment_name: '',
  });

  // API base URL
  const API_BASE_URL = 'http://ncamisshs.com/backend/announcement.php';
  const AUDIT_LOG_URL = 'http://ncamisshs.com/backend/audit_log.php';

  // Function to log audit
  const logAudit = async (action, details) => {
    try {
      console.log("Logging audit:", { action, details });
      
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
      } else {
        console.log('Audit logged successfully:', result);
      }
    } catch (error) {
      console.error('Error logging audit:', error);
    }
  };

  // Format date to the required format yyyy-mm-dd HH:mm
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Format date for display
  const formatDateForDisplay = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  };

  // Fetch announcements from the server
  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      console.log("Fetching announcements from:", API_BASE_URL);
      
      const response = await fetch(API_BASE_URL);
      console.log("Response status:", response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Data received:", data);
      
      if (data.success) {
        setAnnouncements(Array.isArray(data.data) ? data.data : []);
      } else {
        throw new Error(data.message || 'Failed to fetch announcements');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching announcements:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load announcements on component mount
  useEffect(() => {
    fetchAnnouncements();
  }, []);

  // Clear SMS status after 5 seconds
  useEffect(() => {
    if (smsStatus) {
      const timer = setTimeout(() => {
        setSmsStatus(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [smsStatus]);

  const openModal = async (mode, announcement = null) => {
    setModalMode(mode);
    if (announcement) {
      // Log view action
      if (mode === 'view') {
        await logAudit('VIEW', `Viewed Announcement: "${announcement.title}" by ${announcement.author} (${announcement.category})`);
      }
      
      setFormData({
        announcement_id: announcement.announcement_id,
        title: announcement.title || '',
        date: formatDateForInput(announcement.date),
        author: announcement.author || '',
        role: announcement.role || '',
        category: announcement.category || '',
        content: announcement.content || '',
        attachment: null,
        attachment_name: announcement.attachment_name || '',
      });
    } else {
      setFormData({
        title: '',
        date: formatDateForInput(new Date()),
        author: '',
        role: '',
        category: '',
        content: '',
        attachment: null,
        attachment_name: '',
      });
    }
    setSelectedAnnouncement(announcement);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedAnnouncement(null);
  };

  const openDeleteModal = (announcement) => {
    setSelectedAnnouncement(announcement);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedAnnouncement(null);
  };

  const openSaveModal = (e) => {
    e.preventDefault();
    setIsSaveModalOpen(true);
  };

  const closeSaveModal = () => {
    setIsSaveModalOpen(false);
  };

  const openAttachmentModal = (announcement) => {
    setCurrentAttachment(announcement);
    setIsAttachmentModalOpen(true);
  };

  const closeAttachmentModal = () => {
    setIsAttachmentModalOpen(false);
    setCurrentAttachment(null);
  };

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "attachment") {
      setFormData({ 
        ...formData, 
        [name]: files[0],
        attachment_name: files[0] ? files[0].name : ''
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleDateRangeChange = (e) => {
    const { name, value } = e.target;
    setDateRange({ ...dateRange, [name]: value });
  };

  // Filter announcements based on search term and date range
  const filteredAnnouncements = announcements.filter(announcement => {
    const title = announcement.title?.toLowerCase() || '';
    const author = announcement.author?.toLowerCase() || '';
    const searchLower = searchTerm.toLowerCase();
    
    const matchesSearch = title.includes(searchLower) || author.includes(searchLower);
    
    let withinDateRange = true;
    if (dateRange.from && announcement.date) {
      const fromDate = new Date(dateRange.from);
      const announcementDate = new Date(announcement.date);
      withinDateRange = withinDateRange && announcementDate >= fromDate;
    }
    
    if (dateRange.to && announcement.date) {
      const toDate = new Date(dateRange.to);
      const announcementDate = new Date(announcement.date);
      withinDateRange = withinDateRange && announcementDate <= toDate;
    }
    
    return matchesSearch && withinDateRange;
  });

  const handleSubmit = async () => {
    try {
      // Create a FormData object for file upload
      const form = new FormData();
      
      for (const key in formData) {
        if (key === 'attachment' && formData[key]) {
          form.append(key, formData[key]);
        } else if (key !== 'attachment') {
          form.append(key, formData[key]);
        }
      }
      
      let method = 'POST';
      
      if (modalMode === 'edit') {
        form.append('_method', 'PUT');
      }
      
      console.log(`Submitting ${modalMode} request to ${API_BASE_URL}`);
      
      const response = await fetch(API_BASE_URL, {
        method: method,
        body: form,
      });
      
      console.log("Response status:", response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log("Submit result:", result);
      
      if (result.success) {
        // Log audit after successful database operation
        try {
          if (modalMode === 'edit') {
            // For updates, show what was updated
            const changes = [];
            if (selectedAnnouncement) {
              if (formData.title !== selectedAnnouncement.title) {
                changes.push(`Title: "${selectedAnnouncement.title}" → "${formData.title}"`);
              }
              if (formData.category !== selectedAnnouncement.category) {
                changes.push(`Category: ${selectedAnnouncement.category} → ${formData.category}`);
              }
              if (formData.author !== selectedAnnouncement.author) {
                changes.push(`Author: ${selectedAnnouncement.author} → ${formData.author}`);
              }
              if (formData.content !== selectedAnnouncement.content) {
                changes.push(`Content updated`);
              }
              if (formData.attachment_name && formData.attachment_name !== selectedAnnouncement.attachment_name) {
                changes.push(`Attachment updated`);
              }
            }
            
            const changesText = changes.length > 0 ? ` (${changes.join(', ')})` : '';
            await logAudit('UPDATE', `Updated Announcement: "${formData.title}" by ${formData.author}${changesText}`);
          } else {
            // For new announcements
            const attachmentText = formData.attachment_name ? ' with attachment' : '';
            await logAudit('CREATE', `Added New Announcement: "${formData.title}" by ${formData.author} (${formData.category})${attachmentText}`);
          }
        } catch (auditError) {
          console.error('Audit logging failed:', auditError);
        }
        
        // Set SMS status based on response
        if (result.sms_status === "sent") {
          setSmsStatus({ type: "success", message: "Announcement saved and SMS notifications sent to guardians." });
        } else {
          setSmsStatus({ type: "warning", message: "Announcement saved but SMS notifications could not be sent." });
        }
        
        fetchAnnouncements(); // Refresh the announcements list
        closeModal();
        closeSaveModal();
      } else {
        throw new Error(result.message || 'Operation failed');
      }
    } catch (err) {
      console.error('Error submitting form:', err);
      setSmsStatus({ type: "error", message: `Error: ${err.message}` });
      closeSaveModal();
    }
  };

  const handleDelete = async () => {
    try {
      if (!selectedAnnouncement || !selectedAnnouncement.announcement_id) {
        throw new Error("No announcement selected for deletion");
      }
      
      const form = new FormData();
      form.append('_method', 'DELETE');
      form.append('announcement_id', selectedAnnouncement.announcement_id);
      
      console.log(`Submitting delete request for announcement ID: ${selectedAnnouncement.announcement_id}`);
      
      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        body: form,
      });
      
      console.log("Delete response status:", response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log("Delete result:", result);
      
      if (result.success) {
        // Log audit after successful deletion
        try {
          const attachmentText = selectedAnnouncement.attachment_name ? ' (with attachment)' : '';
          await logAudit('DELETE', `Deleted Announcement: "${selectedAnnouncement.title}" by ${selectedAnnouncement.author} (${selectedAnnouncement.category})${attachmentText}`);
        } catch (auditError) {
          console.error('Audit logging failed:', auditError);
        }
        
        fetchAnnouncements(); // Refresh the announcements list
        closeDeleteModal();
      } else {
        throw new Error(result.message || 'Delete operation failed');
      }
    } catch (err) {
      console.error('Error deleting announcement:', err);
      alert(`Error: ${err.message}`);
    }
  };

  const viewAttachment = async (announcement) => {
    if (!announcement || !announcement.announcement_id) return;
    
    // Log attachment view
    await logAudit('VIEW', `Viewed Attachment: "${announcement.attachment_name}" from announcement "${announcement.title}"`);
    
    const url = `${API_BASE_URL}?attachment_id=${announcement.announcement_id}`;
    console.log("Opening attachment for viewing:", url);
    window.open(url, '_blank');
  };

  const downloadAttachment = async (announcement) => {
    if (!announcement || !announcement.announcement_id) return;
    
    // Log attachment download
    await logAudit('VIEW', `Downloaded Attachment: "${announcement.attachment_name}" from announcement "${announcement.title}"`);
    
    const url = `${API_BASE_URL}?attachment_id=${announcement.announcement_id}&download=true`;
    console.log("Downloading attachment:", url);
    window.open(url, '_blank');
  };

  return (
    <div className="container-announce">
      <h2 className="title-announce">ANNOUNCEMENT</h2>

      {/* SMS Status Notification */}
      {smsStatus && (
        <div className={`sms-status-notification ${smsStatus.type}`}>
          <FaSms style={{ marginRight: '8px' }} />
          {smsStatus.message}
        </div>
      )}

      {/* Filter Section */}
      <div className="filter-container-announce">
        <input 
          type="text" 
          placeholder="Search announcement..." 
          className="search-input-announce-1" 
          value={searchTerm}
          onChange={handleSearchChange}
        />
        <div className="date-filter-announce">
          <label>From:</label>
          <input 
            type="date"  
            className="date-input-announce" 
            name="from"
            value={dateRange.from}
            onChange={handleDateRangeChange}
          />
          <label>To:</label>
          <input 
            type="date" 
            className="date-input-announce" 
            name="to"
            value={dateRange.to}
            onChange={handleDateRangeChange}
          />
        </div>
        <button className="add-btn-announce" onClick={() => openModal('add')}>
          Add
        </button>
      </div>

      {/* Table Section */}
      {loading ? (
        <p>Loading announcements...</p>
      ) : error ? (
        <p>Error: {error}</p>
      ) : (
         <div className="announcement-table-container">
        <table className="announcement-table-announce">
          <thead>
            <tr>
              <th>TITLE</th>
              <th>DATE</th>
              <th>AUTHOR</th>
              <th>CATEGORY</th>
              <th>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {filteredAnnouncements.length > 0 ? (
              filteredAnnouncements.map((announcement) => (
                <tr key={announcement.announcement_id}>
                  <td>{announcement.title}</td>
                  <td>{formatDateForDisplay(announcement.date)}</td>
                  <td>{announcement.author}</td>
                  <td>{announcement.category}</td>
                  <td>
                    <div className="action-btn-announce">
                      <button className="view-btn-announce" onClick={() => openModal('view', announcement)}>
                        <FaEye /> View
                      </button>
                      <button className="edit-btn-announce" onClick={() => openModal('edit', announcement)}>
                        <FaEdit /> Edit
                      </button>
                      <button className="delete-btn-announce" onClick={() => openDeleteModal(announcement)}>
                        <FaTrash /> Delete
                      </button>
                      {announcement.attachment_name && (
                        <button 
                          className="attachment-btn-announce"
                          onClick={() => openAttachmentModal(announcement)}
                        >
                          <FaPaperclip /> Attachment
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center' }}>No announcements found</td>
              </tr>
            )}
          </tbody>
        </table>
          </div>
      )}

      {/* Add/Edit/View Modal */}
      {isModalOpen && (
        <div className="modal-announce">
          <div className="modal-content-announce">
            <h3>
              {modalMode === 'add' 
                ? 'Add Announcement' 
                : modalMode === 'edit' 
                  ? 'Edit Announcement' 
                  : 'View Announcement'}
            </h3>
            <div className="modal-form-announce">
              <div className="modal-form-group-announce">
                <form onSubmit={openSaveModal}>
                  <label>Title:</label>
                  <input 
                    type="text" 
                    name="title" 
                    value={formData.title} 
                    onChange={handleInputChange} 
                    disabled={modalMode === 'view'} 
                    required
                  />

                  <label>Date and Time:</label>
                  <input className="datetimeinput"
                    type="datetime-local" 
                    name="date" 
                    value={formData.date} 
                    onChange={handleInputChange} 
                    disabled={modalMode === 'view'} 
                    required
                  />

                  <label>Author:</label>
                  <input 
                    type="text" 
                    name="author" 
                    value={formData.author} 
                    onChange={handleInputChange} 
                    disabled={modalMode === 'view'} 
                    required
                  />

                  <label>Author Role:</label>
                  <select 
                    name="role" 
                    value={formData.role} 
                    onChange={handleInputChange} 
                    disabled={modalMode === 'view'}
                    required
                  >
                    <option value="">Select Role</option>
                    <option value="Principal">Principal</option>
                    <option value="Teacher">Teacher</option>
                    <option value="Admin">Admin</option>
                  </select>
                  
                  <label>Category:</label>
                  <select 
                    name="category" 
                    value={formData.category} 
                    onChange={handleInputChange} 
                    disabled={modalMode === 'view'}
                    required
                  >
                    <option value="">Select Category</option>
                    <option value="Important">Important</option>
                    <option value="Academic">Academic</option>
                    <option value="Event">Event</option>
                    <option value="Reminder">Reminder</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                  
                  <label>Content:</label>
                  <textarea 
                    name="content" 
                    value={formData.content} 
                    onChange={handleInputChange} 
                    disabled={modalMode === 'view'}
                    required
                  />
                  
                  <label>Attachment:</label>
                  {modalMode === 'view' ? (
                    formData.attachment_name ? (
                      <div className="view-attachment">
                        <a 
                          href={`${API_BASE_URL}?attachment_id=${formData.announcement_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {formData.attachment_name}
                        </a>
                      </div>
                    ) : (
                      <div className="no-attachment">
                        No File
                      </div>
                    )
                  ) : (
                    <div className="custom-file-upload-announce">
                      <label htmlFor="file-upload-announce" className="file-label-announce">
                        {formData.attachment ? formData.attachment.name : formData.attachment_name || "Choose File"}
                      </label>
                      <input
                        id="file-upload-announce"
                        type="file"
                        name="attachment"
                        onChange={handleInputChange}
                        disabled={modalMode === 'view'}
                      />
                    </div>
                  )}

                  <div className="modal-actions-announce-1">
                    {modalMode !== 'view' && (
                      <button type="submit" className="publish-btn-announce">
                        {modalMode === 'add' ? 'Add' : 'Update'}
                      </button>
                    )}
                    <button type="button" className="cancel-btn-announce" onClick={closeModal}>
                      {modalMode === 'view' ? 'Close' : 'Cancel'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Save Confirmation Modal */}
      {isSaveModalOpen && (
        <div className="modal-announce-1">
          <div className="modal-content-announce-1">
            <h3>Confirmation</h3>
            <p>Are you sure you want to {modalMode === 'add' ? 'add' : 'update'} this announcement?</p>
            <p className="sms-notification-info">
              <FaSms style={{ marginRight: '5px' }} />
              SMS notifications will be sent to all guardians
            </p>
            <div className="modal-actions-announce-1">
              <button className="publish-btn-announce" onClick={handleSubmit}>
                Yes
              </button>
              <button className="cancel-btn-announce" onClick={closeSaveModal}>
                No
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="modal-announce-1">
          <div className="modal-content-announce-1">
            <h3>Confirmation</h3>
            <p>Are you sure you want to delete this announcement?</p>
            <div className="modal-actions-announce-1">
              <button className="publish-btn-announce" onClick={handleDelete}>
                Yes
              </button>
              <button className="cancel-btn-announce" onClick={closeDeleteModal}>
                No
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Attachment Options Modal */}
      {isAttachmentModalOpen && currentAttachment && (
        <div className="modal-announce-1">
          <div className="modal-content-announce-1">
            <h3>Attachment Options</h3>
            <p>Choose an option for "{currentAttachment.attachment_name}"</p>
            <div className="modal-actions-announce-1">
              <button className="view-btn-announce attachment-action-btn" onClick={() => viewAttachment(currentAttachment)}>
                <FaEye /> View
              </button>
              <button className="edit-btn-announce attachment-action-btn" onClick={() => downloadAttachment(currentAttachment)}>
                <FaDownload /> Download
              </button>
              <button className="cancel-btn-announce" onClick={closeAttachmentModal}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Announcement;