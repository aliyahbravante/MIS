import React, { useState, useEffect } from "react";
import "./payment.css";
import { FaEdit, FaTrash } from "react-icons/fa";
import * as XLSX from "xlsx"; // Import XLSX for Excel export

const Payments = () => {
  const [payments, setPayments] = useState([]); // Store fetched payments
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filteredPayments, setFilteredPayments] = useState([]); 
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [searchName, setSearchName] = useState("");
  const [isExcelConfirmationOpen, setIsExcelConfirmationOpen] = useState(false); // New state for Excel confirmation modal

  // Currency formatting function
  const formatCurrency = (amount) => {
    const number = parseFloat(amount) || 0;
    return `₱${number.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const [currentPayment, setCurrentPayment] = useState({
    student_id: "", // Include student_id in the state
    name: "",
    strand: "",
    gradeLevel: "",
    section: "",
    modeOfPayment: "", // Dropdown for "Cash" and "Voucher"
    status: "Payee",
    payment: "Tuition Fee",
    date: new Date().toISOString().split("T")[0],
    totalFee: 5000.00,
    amountPaid: 0.00,
    balance: 5000.00,
    remarks: "PARTIAL",
    receiptNumber: "",
    hasPaymentRecord: false, // Track if student has payment records loaded from database
    startingBalance: 5000.00, // Track the starting balance before any amountPaid is entered
  });

  // Get the base API URL that works both locally and in production
  const getApiBaseUrl = () => {
    return "http://ncamisshs.com/backend";
  };

  const fetchAllPayments = () => {
    const apiUrl = `${getApiBaseUrl()}/get_all_payments.php`;

    fetch(apiUrl)
      .then((response) => {
        if (!response.ok) {
          return response.text().then(text => {
            console.error("Server error response:", text);
            throw new Error(`HTTP error! Status: ${response.status}`);
          });
        }
        
        // Check if the response is JSON before parsing
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          return response.json();
        } else {
          return response.text().then(text => {
            console.error("Non-JSON response:", text);
            throw new Error("Invalid response format. Expected JSON, got: " + (text.substring(0, 100) + "..."));
          });
        }
      })
      .then((data) => {
        if (data.success) {
          setPayments(data.payments);
          setFilteredPayments(data.payments); 
        } else {
          console.error("Failed to fetch payments:", data.message);
        }
      })
      .catch((error) => console.error("Error fetching payments:", error));
  };

  const fetchReceiptNumber = () => {
    const apiUrl = `${getApiBaseUrl()}/get_receipt.php`;

    fetch(apiUrl)
      .then((response) => {
        if (!response.ok) {
          return response.text().then(text => {
            console.error("Server error response:", text);
            throw new Error(`HTTP error! Status: ${response.status}`);
          });
        }
        
        // Check if the response is JSON before parsing
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          return response.json();
        } else {
          return response.text().then(text => {
            console.error("Non-JSON response:", text);
            throw new Error("Invalid response format. Expected JSON, got: " + (text.substring(0, 100) + "..."));
          });
        }
      })
      .then((data) => {
        if (data.success) {
          setCurrentPayment((prev) => ({
            ...prev,
            receiptNumber: data.receiptNumber || "00001",
          }));
        } else {
          console.error("Failed to fetch receipt number:", data.message);
        }
      })
      .catch((error) => {
        console.error("Error fetching receipt number:", error);
      });
  };

  useEffect(() => {
    fetchAllPayments();
    fetchReceiptNumber();
  }, []);


  useEffect(() => {
    // Dynamically filter payments based on searchName
    const filtered = payments.filter((payment) =>
      payment.name.toLowerCase().includes(searchName.toLowerCase())
    );
    setFilteredPayments(filtered);
  }, [searchName, payments]);

  const handleSearchChange = (e) => {
    setSearchName(e.target.value); // Update search name
  };

  // Removed this useEffect as it was conflicting with handleInputChange
  // The balance calculation is now handled in handleInputChange using startingBalance
  // This useEffect was causing the balance to be recalculated from totalFee instead of startingBalance

  const handleAddClick = () => {
    setCurrentPayment({
      student_id: "", // Reset student_id
      name: "",
      strand: "",
      gradeLevel: "",
      section: "",
      modeOfPayment: "",
      status: "Payee",
      payment: "Tuition Fee",
      date: new Date().toISOString().split("T")[0],
      totalFee: 5000.00,
      amountPaid: 0.00,
      balance: 5000.00,
      remarks: "PARTIAL",
      receiptNumber: "",
      hasPaymentRecord: false, // Reset payment record flag
      startingBalance: 5000.00, // Reset starting balance
    });
    setIsModalOpen(true);
    setErrorMessage(""); // Clear errors
    fetchReceiptNumber(); // Fetch receipt number for new transaction
  };

  const exportToExcel = () => {
    if (window.confirm("Do you want to export the data to Excel?")) {
      const worksheet = XLSX.utils.json_to_sheet(filteredPayments);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Payments");
      XLSX.writeFile(workbook, "payments.xlsx");
    }
  };
  const handleInputChange = (e) => {
    const { name, value } = e.target;
  
    if (name === "modeOfPayment") {
      // Automatically set status based on mode of payment
      const newStatus = value === "Cash" ? "Payee" : "Nonpayee";
      
      if (newStatus === "Nonpayee") {
        // Set values to 0 for Nonpayee
        setCurrentPayment((prev) => ({
          ...prev,
          status: newStatus,
          amountPaid: 0.00,
          totalFee: 0.00,
          balance: 0.00,
          remarks: "FULLY PAID",
          [name]: value,
        }));
      } else {
        // For Cash/Payee: Preserve the current balance and totalFee, only reset amountPaid
        setCurrentPayment((prev) => {
          // If student has payment records loaded from database, use that balance
          // Otherwise, if no records exist, use default 5000
          let preservedBalance;
          let preservedTotalFee;
          
          if (prev.hasPaymentRecord) {
            // Student has payment records - use the loaded balance (even if 0, that means fully paid)
            preservedBalance = prev.balance !== null && prev.balance !== undefined ? prev.balance : 5000.00;
            preservedTotalFee = prev.totalFee !== null && prev.totalFee !== undefined ? prev.totalFee : 5000.00;
          } else {
            // No payment records for this grade level - use default 5000
            preservedBalance = 5000.00;
            preservedTotalFee = 5000.00;
          }
          
          const remarks = preservedBalance === 0 ? "FULLY PAID" : "PARTIAL";
          
          return {
            ...prev,
            status: newStatus,
            totalFee: preservedTotalFee,
            amountPaid: 0.00,
            balance: preservedBalance,
            startingBalance: preservedBalance, // Update starting balance when switching to Cash
            remarks: remarks,
            [name]: value,
          };
        });
      }
      return;
    }
  
    if (name === "amountPaid") {
      // Allow empty input and reset balance and remarks if empty
      if (value === "") {
        setCurrentPayment((prev) => ({
          ...prev,
          [name]: "", // Allow the field to be empty
          balance: prev.startingBalance, // Reset balance to starting balance
          remarks: prev.startingBalance === 0 ? "FULLY PAID" : "PARTIAL", // Default based on starting balance
        }));
        return;
      }
  
      // Prevent negative values
      if (parseFloat(value) < 0) {
        setErrorMessage("Amount Paid cannot be negative.");
        return;
      }
  
      // Get the starting balance (the balance before any amountPaid is entered)
      // startingBalance should be set when student is loaded or when switching to Cash mode
      let startingBalance = currentPayment.startingBalance;
      
      // If startingBalance is not explicitly set (undefined or null, but 0 is valid for fully paid)
      if (startingBalance === undefined || startingBalance === null) {
        // If we have a student loaded (has student_id), use the current balance as starting point
        // This handles cases where startingBalance wasn't set properly
        if (currentPayment.student_id) {
          // For loaded students, we should use the balance that was loaded from database
          // But if amountPaid is 0, the balance should equal startingBalance
          // So we can use the current balance if amountPaid is 0, otherwise calculate back
          if (currentPayment.amountPaid === 0 || currentPayment.amountPaid === "") {
            startingBalance = currentPayment.balance;
          } else {
            // Calculate back: startingBalance = currentBalance + amountPaid
            startingBalance = currentPayment.balance + parseFloat(currentPayment.amountPaid || 0);
          }
        } else {
          // No student loaded, use totalFee as default
          startingBalance = currentPayment.totalFee;
        }
      }
      
      const amountPaid = parseFloat(value) || 0;
  
      // Prevent amountPaid from exceeding starting balance
      if (amountPaid > startingBalance) {
        // Limit amountPaid to the starting balance if it exceeds
        setErrorMessage("Amount Paid cannot exceed Current Balance.");
        setCurrentPayment((prev) => {
          const startBal = prev.startingBalance || prev.balance;
          return {
            ...prev,
            [name]: startBal, // Set amountPaid to starting balance to prevent overpayment
            balance: 0, // Ensure balance is 0 if overpaid
            remarks: "FULLY PAID", // Set remarks to FULLY PAID
          };
        });
        return;
      }
  
      setErrorMessage(""); // Clear error if valid input
  
      // Calculate new balance by subtracting amountPaid from the STARTING balance
      const newBalance = startingBalance - amountPaid;
  
      setCurrentPayment((prev) => ({
        ...prev,
        [name]: value, // Keep the value as is for proper editing
        balance: newBalance >= 0 ? newBalance : 0, // Ensure balance doesn't go below 0
        remarks: newBalance === 0 ? "FULLY PAID" : "PARTIAL",
      }));
    } else {
      // Handle other input fields
      setCurrentPayment((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };
  
  // Automatically adjust remarks when balance changes
  useEffect(() => {
    if (currentPayment.balance === 0) {
      setCurrentPayment((prev) => ({
        ...prev,
        remarks: "FULLY PAID",
      }));
    } else if (currentPayment.balance > 0) {
      setCurrentPayment((prev) => ({
        ...prev,
        remarks: "PARTIAL",
      }));
    }
  }, [currentPayment.balance]);
  
  

  const handleNameBlur = () => {
    if (searchName.trim() !== "") {
      const apiUrl = `${getApiBaseUrl()}/payment.php?name=${searchName}`;
      
      fetch(apiUrl)
        .then((response) => {
          if (!response.ok) {
            return response.text().then(text => {
              console.error("Server error response:", text);
              throw new Error(`HTTP error! Status: ${response.status}`);
            });
          }
          
          // Check if the response is JSON before parsing
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            return response.json();
          } else {
            return response.text().then(text => {
              console.error("Non-JSON response:", text);
              throw new Error("Invalid response format. Expected JSON, got: " + (text.substring(0, 100) + "..."));
            });
          }
        })
        .then((data) => {
          if (data.success && data.applicants.length > 0) {
            const student = data.applicants[0];
            const gradeLevel = student.grade_level.match(/\d+/)?.[0] || "";

            // Check if student has payment records (latest_balance is not null means there are records)
            const hasPaymentRecord = student.latest_balance !== null && student.latest_balance !== undefined;
            
            // Use total_fee if available, otherwise use latest_balance or default to 5000
            const totalFee = student.total_fee !== undefined && student.total_fee !== null 
              ? student.total_fee 
              : (hasPaymentRecord ? student.latest_balance : 5000);
            
            // Use latest_balance as the current balance if records exist, otherwise default to 5000
            const currentBalance = hasPaymentRecord ? student.latest_balance : 5000;

            setCurrentPayment((prev) => ({
              ...prev,
              student_id: student.student_id, // Include student_id
              name: student.name,
              gradeLevel: gradeLevel,
              section: student.section,
              strand: student.strand,
              balance: currentBalance,
              totalFee: totalFee,
              amountPaid: 0.00, // Reset amount paid when loading new student
              hasPaymentRecord: hasPaymentRecord, // Track if payment records exist
              startingBalance: currentBalance, // Set starting balance to current balance
            }));
          }
        })
        .catch((error) => {
          console.error("Error fetching student data:", error);
        });
    }
  };
  
  const confirmExcelExport = () => {
    // Close the confirmation modal
    setIsExcelConfirmationOpen(false);

    // Perform Excel export with formatted numbers
    const exportData = filteredPayments.map((payment) => ({
      ...payment,
      total_fee: parseFloat(payment.total_fee).toFixed(2),
      amount_paid: parseFloat(payment.amount_paid).toFixed(2),
      balance: parseFloat(payment.balance).toFixed(2)
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Payments");
    XLSX.writeFile(workbook, "payments.xlsx");
  };

  const handleExportClick = () => {
    // Open the Excel confirmation modal
    setIsExcelConfirmationOpen(true);
  };

  const handleNameChange = (e) => {
    const name = e.target.value;
    setSearchName(name);
    setCurrentPayment((prev) => ({
      ...prev,
      name: name,
    }));
  };

  const handleSave = () => {
    // Check if the required fields are filled out
    if (!currentPayment.name || !currentPayment.modeOfPayment) {
      setErrorMessage("Please fill out all required fields.");
      return;
    }
  
    // Allow saving if balance is 0 and remarks are "FULLY PAID"
    if (currentPayment.balance === 0 && currentPayment.remarks === "FULLY PAID") {
      setErrorMessage(""); // Clear any previous errors
      setIsConfirmationOpen(true); // Open the confirmation modal
      return;
    }
  
    // Allow saving if status is "Nonpayee"
    if (currentPayment.status === "Nonpayee") {
      setErrorMessage(""); // Clear errors
      setIsConfirmationOpen(true); // Open confirmation modal
      return;
    }
  
    // Validate amountPaid if it's not fully paid
    if (currentPayment.amountPaid <= 0 && currentPayment.remarks !== "FULLY PAID") {
      setErrorMessage("Please ensure a valid amount is entered.");
      return;
    }
  
    // If all validations pass
    setErrorMessage(""); // Clear errors if validation passes
    setIsConfirmationOpen(true); // Open confirmation modal
  };
  
  
  const confirmSave = () => {
    console.log("Saving payment with data:", currentPayment); // Debug the payload
    
    const apiUrl = `${getApiBaseUrl()}/save_payment.php`;
  
    fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(currentPayment), // Ensure status is included in the payload
    })
      .then((response) => {
        if (!response.ok) {
          return response.text().then(text => {
            console.error("Server error response:", text);
            throw new Error(`HTTP error! Status: ${response.status}`);
          });
        }
        
        // Check if the response is JSON before parsing
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          return response.json();
        } else {
          return response.text().then(text => {
            console.error("Non-JSON response:", text);
            throw new Error("Invalid response format. Expected JSON, got: " + (text.substring(0, 100) + "..."));
          });
        }
      })
      .then((data) => {
        if (data.success) {
          fetchAllPayments(); // Refresh the payments list after saving
        } else {
          console.error("Error saving data:", data.message);
        }
      })
      .catch((error) => {
        console.error("Error saving payment:", error);
        setErrorMessage(`Failed to save: ${error.message}`);
      });
    setIsConfirmationOpen(false);
    setIsModalOpen(false);
  };
  

  return (
    <div className="payments-container">
      <div className="header-p">
        <h2 className="payments-title">PAYMENT</h2>
      </div>
  
      <div className="top-controls-pay">
      <div className="search-and-add-pay">
      <input
          className="search-input-pay"
          type="text"
          placeholder="Search by name..."
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)} // Update search dynamically
          />
        </div>
        <div className="export-buttons">
          <button className="excel-button-pay" onClick={handleExportClick}>
          Export
        </button>
        <button className="add-button-pay" onClick={handleAddClick}>
            Add
          </button>
      </div>
      </div>
  <div className="scroll-pay">
      <table className="payments-table">
        <thead>
          <tr>
            <th>NAME</th>
            <th>STRAND</th>
            <th>GRADE LEVEL</th>
            <th>SECTION</th>
            <th>MODE OF PAYMENT</th>
            <th>STATUS</th>
            <th>PAYMENT</th>
            <th>DATE</th>
            <th>TOTAL FEE</th>
            <th>AMOUNT PAID</th>
            <th>BALANCE</th>
            <th>REMARKS</th>
            <th>RECEIPT NO.</th>
          </tr>
        </thead>
        <tbody>
        {filteredPayments.map((payment) => (
            <tr key={payment.id}>
              <td>{payment.name}</td>
              <td>{payment.strand}</td>
              <td>{payment.grade_level}</td>
              <td>{payment.section}</td>
              <td>{payment.mode_of_payment}</td>
              <td>{payment.status}</td>
              <td>{payment.payment}</td>
              <td>{payment.date}</td>
              <td style={{ textAlign: 'right' }}>{formatCurrency(payment.total_fee)}</td>
              <td style={{ textAlign: 'right' }}>{formatCurrency(payment.amount_paid)}</td>
              <td style={{ textAlign: 'right' }}>{formatCurrency(payment.balance)}</td>
              <td>{payment.remarks}</td>
              <td>{payment.receipt_number}</td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
      {isModalOpen && (
        <div className="modal-payment">
          <div className="modal-content-payment">
            <h3 className="modal-title-pay">
              {currentPayment.id ? "EDIT TRANSACTION" : "ADD TRANSACTION"}
            </h3>
            {errorMessage && <p className="error-message">{errorMessage}</p>}
            <div className="form-container-pay">
              <div className="form-row-pay">
                <label>Name</label>
                <input
                  type="text"
                  name="name"
                  value={currentPayment.name}
                  onChange={handleNameChange}
                  onBlur={handleNameBlur}
                />
              </div>
              <div className="form-row-pay">
                <label>Strand</label>
                <input
                  type="text"
                  name="strand"
                  value={currentPayment.strand}
                  readOnly
                />
              </div>
              <div className="form-row-pay">
                <label>Grade Level</label>
                <input
                  type="number"
                  name="gradeLevel"
                  value={currentPayment.gradeLevel}
                  readOnly
                />
              </div>
              <div className="form-row-pay">
                <label>Section</label>
                <input
                  type="text"
                  name="section"
                  value={currentPayment.section}
                  readOnly
                />
              </div>
              <div className="form-row-pay">
                <label>Mode of Payment</label>
                <select
                  name="modeOfPayment"
                  value={currentPayment.modeOfPayment}
                  onChange={handleInputChange}
                >
                  <option value="">Select</option>
                  <option value="Cash">Cash</option>
                  <option value="Voucher">Voucher</option>
                </select>
              </div>
              <div className="form-row-pay">
                <label>Status</label>
                <input
                  type="text"
                  name="status"
                  value={currentPayment.status}
                  readOnly
                />
              </div>
              <div className="form-row-pay">
                <label>Payment</label>
                <input
                  type="text"
                  name="payment"
                  value={currentPayment.payment}
                  readOnly
                />
              </div>
              <div className="form-row-pay">
                <label>Date</label>
                <input
                  type="date"
                  name="date"
                  value={currentPayment.date}
                  readOnly
                />
              </div>
              <div className="form-row-pay">
                <label>Total Fee</label>
                <input
                  type="text"
                  name="totalFee"
                  value={formatCurrency(currentPayment.totalFee)}
                  readOnly
                  style={{ textAlign: 'right' }}
                />
              </div>
              <div className="form-row-pay">
                <label>Amount Paid</label>
                <input
                  type="number"
                  name="amountPaid"
                  value={currentPayment.amountPaid}
                  onChange={handleInputChange}
                  step="0.01"
                  style={{ textAlign: 'right' }}
                />
              </div>
              <div className="form-row-pay">
                <label>Balance</label>
                <input
                  type="text"
                  name="balance"
                  value={formatCurrency(currentPayment.balance)}
                  readOnly
                  style={{ textAlign: 'right' }}
                />
              </div>
              <div className="form-row-pay">
                <label>Remarks</label>
                <input
                  type="text"
                  name="remarks"
                  value={currentPayment.remarks}
                  readOnly
                />
              </div>
              <div className="form-row-pay">
                <label>Receipt</label>
                <input
                  type="text"
                  name="receiptNumber"
                  value={currentPayment.receiptNumber || ""}
                  readOnly
                />
              </div>
            </div>
            <div className="button-group-pay">
              <button className="confirm-button-pay" onClick={handleSave}>
                Save
              </button>
              <button
                className="cancel-button-pay"
                onClick={() => setIsModalOpen(false)}
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}
  
  {isConfirmationOpen && (
  <div className="confirmation-modal">
    <div className="confirmation-content">
      <h3 className="confirmation-title">Confirm Save</h3>
      <p className="confirmation-message">
        Are you sure you want to save this transaction?
      </p>
      <div className="confirmation-buttons">
        <button className="confirm-button-pay" onClick={confirmSave}>
          Yes
        </button>
        <button
          className="cancel-button-pay"
          onClick={() => setIsConfirmationOpen(false)}
        >
          No
        </button>
      </div>
    </div>
  </div>
)}
 {/* Excel Export Confirmation Modal */}
 {isExcelConfirmationOpen && (
      <div className="confirmation-modal">
        <div className="confirmation-content">
          <h3 className="confirmation-title">Confirm Export</h3>
          <p className="confirmation-message">
            Are you sure you want to export the data to Excel?
          </p>
          <div className="confirmation-buttons">
            <button className="confirm-button-pay" onClick={confirmExcelExport}>
              Yes
            </button>
            <button
              className="cancel-button-pay"
              onClick={() => setIsExcelConfirmationOpen(false)}
            >
              No
            </button>
          </div>
        </div>
        </div>
    )}
  </div>
);
}


export default Payments;