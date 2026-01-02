import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './schedule.css';
import { FaTrash, FaEdit, FaEye, FaCalendarAlt } from 'react-icons/fa';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const Schedule = () => {
  const [schedule, setSchedule] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentSchedule, setCurrentSchedule] = useState({
    schedule_id: '',
    date: '',
    time: '',
    slots: '',
    originalDate: '',
    originalTime: '',
    originalSlots: ''
  });
  const [selectedDate, setSelectedDate] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [actionType, setActionType] = useState('');
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [manualDateInput, setManualDateInput] = useState('');
  const navigate = useNavigate();

  // API URLs
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

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
        const baseUrl = "http://ncamisshs.com/backend";
        const response = await fetch(`${baseUrl}/schedule.php`);
        
        if (!response.ok) {
            throw new Error(`Failed to fetch schedule: ${response.statusText}`);
        }

        const data = await response.json();
        setSchedule(data);
    } catch (error) {
        console.error("Error fetching schedule:", error);
    }
  };

  // Format date from MM/DD/YY to MM-DD-YYYY
  const formatDateForDB = (dateStr) => {
    if (!dateStr) return '';
    
    // If it's already in MM-DD-YYYY format, return as is
    if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
      return dateStr;
    }
    
    // Parse the date string into a Date object
    const parts = dateStr.split('/');
    if (parts.length !== 3) return '';
    
    let month = parts[0];
    let day = parts[1];
    let year = parts[2];
    
    // Add leading zeros if needed
    month = month.padStart(2, '0');
    day = day.padStart(2, '0');
    
    // Convert 2-digit year to 4-digit year
    if (year.length === 2) {
      const currentYear = new Date().getFullYear();
      const century = Math.floor(currentYear / 100) * 100;
      year = century + parseInt(year, 10);
    }
    
    // Format as MM-DD-YYYY
    return `${month}-${day}-${year}`;
  };

  // Format date from Date object to MM-DD-YYYY
  const formatDateFromDateObject = (date) => {
    if (!date) return '';
    
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    
    return `${month}-${day}-${year}`;
  };

  // Parse MM-DD-YYYY to a Date object
  const parseDBDateToObject = (dateStr) => {
    if (!dateStr) return null;
    
    // Check if date is in MM-DD-YYYY format
    const dbFormatMatch = dateStr.match(/^(\d{2})-(\d{2})-(\d{4})$/);
    if (dbFormatMatch) {
      const [_, month, day, year] = dbFormatMatch;
      return new Date(year, month - 1, day);
    }
    
    // Check if date is in MM/DD/YY format
    const oldFormatMatch = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{2})$/);
    if (oldFormatMatch) {
      const [_, month, day, shortYear] = oldFormatMatch;
      const currentYear = new Date().getFullYear();
      const century = Math.floor(currentYear / 100) * 100;
      const fullYear = century + parseInt(shortYear, 10);
      return new Date(fullYear, month - 1, day);
    }
    
    return null;
  };

  const handleAddClick = () => {
    setCurrentSchedule({ date: '', time: '', slots: '', originalDate: '', originalTime: '', originalSlots: '' });
    setSelectedDate(null);
    setIsEditMode(false);
    setIsModalOpen(true);
    setActionType('add');
  };

  const handleEditClick = (item) => {
    // Convert the date format for editing
    const dateObj = parseDBDateToObject(item.date);
    
    setCurrentSchedule({
      ...item,
      originalDate: item.date,
      originalTime: item.time,
      originalSlots: item.slots
    });
    setSelectedDate(dateObj);
    setIsEditMode(true);
    setIsModalOpen(true);
    setActionType('edit');
  };

  const handleDeleteClick = (id) => {
    setCurrentSchedule({ schedule_id: id });
    setActionType('delete');
    setIsConfirmationModalOpen(true);
  };

  const viewStudents = async (schedule_id, date, time) => {
    // Get the actual schedule item to access the slots
    const scheduleItem = schedule.find(item => item.schedule_id === schedule_id);
    const slots = scheduleItem ? scheduleItem.slots : 'Unknown';
    
    // Log the view action
    const formattedDate = formatDateForDisplay(date);
    await logAudit('VIEW', `Viewed Schedule: ${formattedDate} ${time} (${slots} slots)`);
    
    // Pass data using navigate state
    navigate('/view-schedule', { state: { schedule_id, date, time } });
  };
  
  const validateDate = (date) => {
    if (!date) return false;
    
    // For Date object validation
    if (date instanceof Date) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Check if the date is in the future or today
      return date >= today;
    }
    
    // For string date validation
    const dateObj = parseDBDateToObject(date);
    if (!dateObj) return false;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return dateObj >= today;
  };

  const handleSave = async () => {
    // Validate the date
    if (!validateDate(selectedDate)) {
      setAlertMessage('Please select a valid date in the present or future.');
      setIsAlertModalOpen(true);
      return;
    }

    if (actionType === 'add' && currentSchedule.slots === '0') {
      setAlertMessage('Slots cannot be 0 when adding a new schedule.');
      setIsAlertModalOpen(true);
      return;
    }

    const formattedDate = formatDateFromDateObject(selectedDate);
    
    // Check if the schedule already exists
    const existingSchedule = schedule.find(
      (item) =>
        item.date === formattedDate &&
        item.time === currentSchedule.time &&
        item.schedule_id !== currentSchedule.schedule_id
    );

    if (existingSchedule) {
      setAlertMessage('The date and time already exist.');
      setIsAlertModalOpen(true);
      return;
    }

    // Check if there are changes when editing
    if (
      isEditMode &&
      formattedDate === currentSchedule.originalDate &&
      currentSchedule.time === currentSchedule.originalTime &&
      currentSchedule.slots === currentSchedule.originalSlots
    ) {
      setAlertMessage('No changes applied.');
      setIsAlertModalOpen(true);
      return;
    }

    // Update the date in the currentSchedule before saving
    setCurrentSchedule(prev => ({
      ...prev,
      date: formattedDate
    }));
    
    // Delay the confirmation to ensure state is updated
    setTimeout(() => {
      setIsConfirmationModalOpen(true);
    }, 0);
  };

  const handleConfirmAction = async () => {
    const baseUrl = "http://ncamisshs.com/backend";
    
    if (actionType === 'add' || actionType === 'edit') {
      // Ensure we're sending the formatted date
      const scheduleData = {
        ...currentSchedule,
        date: formatDateFromDateObject(selectedDate)
      };
      
      const method = isEditMode ? 'PUT' : 'POST';
      const response = await fetch(`${baseUrl}/schedule.php`, {
        method: method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(scheduleData),
      });
      const data = await response.json();
      
      if (data.success) {
        // Log audit after successful database operation
        try {
          const displayDate = formatDateForDisplay(scheduleData.date);
          
          if (isEditMode) {
            // For updates, show what changed
            const changes = [];
            if (scheduleData.date !== currentSchedule.originalDate) {
              const oldDisplayDate = formatDateForDisplay(currentSchedule.originalDate);
              changes.push(`Date: ${oldDisplayDate} → ${displayDate}`);
            }
            if (scheduleData.time !== currentSchedule.originalTime) {
              changes.push(`Time: ${currentSchedule.originalTime} → ${scheduleData.time}`);
            }
            if (scheduleData.slots !== currentSchedule.originalSlots) {
              changes.push(`Slots: ${currentSchedule.originalSlots} → ${scheduleData.slots}`);
            }
            
            const changesText = changes.length > 0 ? ` (${changes.join(', ')})` : '';
            await logAudit('UPDATE', `Updated Schedule: ${displayDate} ${scheduleData.time}${changesText}`);
          } else {
            // For new schedules
            await logAudit('CREATE', `Added New Schedule: ${displayDate} ${scheduleData.time} (${scheduleData.slots} slots)`);
          }
        } catch (auditError) {
          console.error('Audit logging failed:', auditError);
        }
        
        fetchSchedules();
        setIsModalOpen(false);
      } else {
        alert('Failed to save schedule');
      }
    } else if (actionType === 'delete') {
      // Get schedule details before deleting for audit log
      const scheduleToDelete = schedule.find(item => item.schedule_id === currentSchedule.schedule_id);
      
      const response = await fetch(`${baseUrl}/schedule.php`, {
        method: 'DELETE',
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ schedule_id: currentSchedule.schedule_id }),
      });
      const data = await response.json();
      
      if (data.success) {
        // Log audit after successful deletion
        try {
          if (scheduleToDelete) {
            const displayDate = formatDateForDisplay(scheduleToDelete.date);
            await logAudit('DELETE', `Deleted Schedule: ${displayDate} ${scheduleToDelete.time} (${scheduleToDelete.slots} slots)`);
          }
        } catch (auditError) {
          console.error('Audit logging failed:', auditError);
        }
        
        fetchSchedules();
      } else {
        alert('Failed to delete schedule');
      }
    }
    setIsConfirmationModalOpen(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentSchedule({ ...currentSchedule, [name]: value });
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    setIsCalendarOpen(false);
    if (date) {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      setManualDateInput(`${day} / ${month} / ${year}`);
    } else {
      setManualDateInput('');
    }
  };

  const handleManualDateChange = (e) => {
    let value = e.target.value.replace(/\D/g, ''); // Remove non-digits
    // Format as DD / MM / YYYY
    if (value.length > 0) {
      if (value.length <= 2) {
        value = value;
      } else if (value.length <= 4) {
        value = value.slice(0, 2) + ' / ' + value.slice(2);
      } else {
        value = value.slice(0, 2) + ' / ' + value.slice(2, 4) + ' / ' + value.slice(4, 8);
      }
    }
    setManualDateInput(value);
    // Parse the date if we have a complete date
    if (value.length === 14) { // 'dd / mm / yyyy' is 14 chars
      const [day, month, year] = value.split(' / ');
      const date = new Date(year, month - 1, day);
      // Validate if it's a valid date
      if (date.getMonth() + 1 === parseInt(month) && 
          date.getDate() === parseInt(day) && 
          date.getFullYear() === parseInt(year)) {
        setSelectedDate(date);
      }
    } else {
      setSelectedDate(null);
    }
  };

  const handleCalendarToggle = () => {
    setIsCalendarOpen(!isCalendarOpen);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setCurrentSchedule({ date: '', time: '', slots: '', originalDate: '', originalTime: '', originalSlots: '' });
    setSelectedDate(null);
  };

  const handleCancelConfirmation = () => {
    setIsConfirmationModalOpen(false);
  };

  const handleCloseAlertModal = () => {
    setIsAlertModalOpen(false);
  };

  // Format date for display in the form
  const getFormattedDateDisplay = () => {
    return manualDateInput;
  };

  // Format date for display in the table
  const formatDateForDisplay = (dbDate) => {
    if (!dbDate) return '';
    
    // If it's in MM-DD-YYYY format, convert to MM/DD/YYYY
    const match = dbDate.match(/^(\d{2})-(\d{2})-(\d{4})$/);
    if (match) {
      const [_, month, day, year] = match;
      return `${month}/${day}/${year}`;
    }
    
    return dbDate; // Return as is if not in expected format
  };

  return (
    <div className="schedule-container-sd">
      <div className="schedule-header-sd">
        <button
          type="button"
          className="schedule-breadcrumb-sd"
          onClick={() => navigate('/applicants')}
        >
          Applicants List /
        </button>
      </div>
      <div className="top-controls-sd">
      <h2 className="schedule-title-sd">SUBMISSION DATES</h2>
      <button className="add-button-sd" onClick={handleAddClick}>
        + Add
      </button>
      </div>
      <div className="schedule-table-container-sd">
      <table className="schedule-table-sd">
        <thead>
          <tr>
            <th>DATE</th>
            <th>TIME</th>
            <th>SLOTS</th>
            <th>VIEW</th>
            <th>EDIT</th>
            <th>DELETE</th>
          </tr>
        </thead>
        <tbody>
          {schedule.map((item) => (
            <tr key={item.schedule_id}>
              <td>{formatDateForDisplay(item.date)}</td>
              <td>{item.time}</td>
              <td>{item.slots}</td>
              <td>
                <FaEye 
                  className="view-icon-sd" 
                  onClick={() => viewStudents(item.schedule_id, item.date, item.time)} 
                />
              </td>
              <td>
                <FaEdit className="edit-icon-sd" onClick={() => handleEditClick(item)} />
              </td>
              <td>
                <FaTrash className="delete-icon-sd" onClick={() => handleDeleteClick(item.schedule_id)} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>

      {/* Modal for Add/Edit */}
      {isModalOpen && (
        <div className="modal-sched">
          <div className="modal-content-sched">
            <h3>{isEditMode ? 'Edit Schedule' : 'Add New Schedule'}</h3>
            <label>
              Available Submission Date
              <div className="date-picker-container">
                <input
                  type="text"
                  value={getFormattedDateDisplay()}
                  onChange={handleManualDateChange}
                  placeholder="dd / mm / yyyy"
                  className="date-input"
                  maxLength="20"
                />
                
                <button type="button" onClick={handleCalendarToggle} className="calendar-button">
                  <FaCalendarAlt />
                </button>
                {isCalendarOpen && (
                  <div className="calendar-dropdown">
                    <DatePicker
                      selected={selectedDate}
                      onChange={handleDateChange}
                      minDate={new Date()}
                      inline
                    />
                  </div>
                )}
              </div>
            </label>
            <label>
              Time
              <select
                name="time"
                value={currentSchedule.time}
                onChange={handleInputChange}
              >
                <option value="" disabled>
                  Select Time
                </option>
                <option value="MORNING">MORNING</option>
                <option value="AFTERNOON">AFTERNOON</option>
              </select>
            </label>
            <label>
              Slots
              <input
                type="number"
                name="slots"
                value={currentSchedule.slots}
                onChange={handleInputChange}
                placeholder="Enter number of slots"
                min="1"
              />
            </label>
            <div className="modal-buttons-schedule">
              <button className="save-button-schedule" onClick={handleSave}>
                Save
              </button>
              <button className="cancel-button-schedule" onClick={handleCancel}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {isConfirmationModalOpen && (
        <div className="modal-confirmation-sd">
          <div className="modal-content-sd">
            <h3>Confirmation</h3>
            <p>
              {actionType === 'delete'
                ? 'Are you sure you want to delete this schedule?'
                : `Are you sure you want to ${actionType} this schedule?`}
            </p>
            <div className="confirmation-buttons-sd">
              <button className="confirm-button-sd" onClick={handleConfirmAction}>
                Confirm
              </button>
              <button className="cancel-button-sd" onClick={handleCancelConfirmation}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alert Modal */}
      {isAlertModalOpen && (
        <div className="alert-modal-sd">
          <div className="alert-content-sd">
            <h3>Alert</h3>
            <p>{alertMessage}</p>
            <button className="close-alert-sd" onClick={handleCloseAlertModal}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Schedule;