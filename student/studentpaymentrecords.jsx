import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";
import "jspdf-autotable";
import { FaFilePdf, FaFileExcel, FaCreditCard, FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import "./studentpaymentrecords.css";

const StudentPaymentRecords = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const studentId = location.state?.student_id || new URLSearchParams(location.search).get('student_id');

  const [paymentRecords, setPaymentRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isPDFModalOpen, setIsPDFModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isPaymentSuccessModalOpen, setIsPaymentSuccessModalOpen] = useState(false);
  const [isPaymentFailedModalOpen, setIsPaymentFailedModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentReference, setPaymentReference] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const tableRef = useRef(null);

  // API base URL
  const API_BASE_URL = "https://ncamisshs.com/backend";

  // Track references currently being verified to prevent duplicate calls
  const verifyingRefs = useRef(new Set());
  
  // Function to verify payment status with Paymongo
  const verifyPaymentStatus = async (reference) => {
    if (!reference || isVerifying) return;
    
    // Check if this reference is already being verified
    if (verifyingRefs.current.has(reference)) {
      console.log('Reference already being verified, skipping duplicate call:', reference);
      return;
    }
    
    // Check if this reference was already successfully processed
    const processedRefs = JSON.parse(localStorage.getItem('processedPaymentRefs') || '[]');
    if (processedRefs.includes(reference)) {
      console.log('Reference already processed successfully, skipping verification:', reference);
      // Just fetch records without verification
      fetchPaymentRecords();
      return;
    }
    
    try {
      setIsVerifying(true);
      verifyingRefs.current.add(reference); // Mark as currently verifying
      console.log('Verifying payment status for reference:', reference);
      
      // Set payment reference before verification
      setPaymentReference(reference);
      
      const response = await fetch(`${API_BASE_URL}/student_payment_api.php?action=verify_payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          student_id: studentId,
          reference: reference,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Payment verification response from Paymongo:', data);
      
      if (data.success) {
        if (data.status === "payment_processed" || data.status === "already_processed") {
          // Payment verified as successful in Paymongo
          console.log('Payment verified as PAID by Paymongo, status:', data.status);
          
          // Mark this reference as successfully processed to prevent re-verification
          if (!processedRefs.includes(reference)) {
            processedRefs.push(reference);
            localStorage.setItem('processedPaymentRefs', JSON.stringify(processedRefs));
          }
          
          // Always show success modal when payment is verified (whether new or already processed)
          setIsPaymentSuccessModalOpen(true);
          setPaymentReference(reference); // Set reference for modal display
          localStorage.setItem('paymentStatus', 'Paid');
          
          // Clear pending payment data after confirmed as paid
          localStorage.removeItem('paymentInProgress');
          localStorage.removeItem('lastPaymentReference'); // Clear to prevent re-verification
          
          fetchPaymentRecords(); // Refresh records to show new payment
        } else if (data.status === "not_paid") {
          // Payment is not confirmed as paid by Paymongo
          console.log('Payment verified as NOT PAID by Paymongo');
          setIsPaymentFailedModalOpen(true);
          localStorage.setItem('paymentStatus', 'Unpaid');
          
          // Add this line to fetch records even when payment fails
          fetchPaymentRecords();
        }
      } else {
        // API error - but might still be processed by webhook, so fetch records
        console.error('Verification API error:', data.message);
        setError(`Payment verification error: ${data.message}. Please refresh to see updated records.`);
        
        // Still fetch records in case webhook processed it
        fetchPaymentRecords();
      }
    } catch (error) {
      console.error("Payment verification error:", error);
      
      // If it's a transaction error, the payment might still be processing
      // Fetch records to check if payment was recorded
      if (error.message && error.message.includes('transaction')) {
        setError('Payment is being processed. Please wait a moment and refresh to see updated records.');
      } else {
        setError(`Payment verification error: ${error.message}. Please refresh to check payment status.`);
      }
      
      // Fetch records even on exception - webhook might have processed it
      fetchPaymentRecords();
    } finally {
      setIsVerifying(false);
      verifyingRefs.current.delete(reference); // Remove from verifying set
    }
  };

  // Effect to check URL parameters and pending payments on load
  useEffect(() => {
    if (!studentId) {
      setError("Student ID is missing. Please ensure you're accessing this page correctly.");
      setLoading(false);
      return;
    }

    setLoading(true);
    
    // Check URL for payment parameters
    const params = new URLSearchParams(location.search);
    const status = params.get('status');
    const reference = params.get('reference');
    const errorMsg = params.get('message');
    
    // Log payment information
    console.log('===== Payment Information =====');
    console.log('Student ID:', studentId);
    console.log('Payment Status in URL:', status || 'No status in URL');
    console.log('Paymongo Reference Number in URL:', reference || 'No reference in URL');
    
    // Check for any payment reference (from URL or localStorage)
    const paymentRef = reference || localStorage.getItem('lastPaymentReference');
    
    if (paymentRef) {
      // Check if this reference was already successfully processed
      const processedRefs = JSON.parse(localStorage.getItem('processedPaymentRefs') || '[]');
      const isAlreadyProcessed = processedRefs.includes(paymentRef);
      
      // If status=success in URL, this is a fresh return from payment
      // Always verify to show success modal
      const isReturningFromPayment = status === 'success' && reference;
      
      // If returning from payment (has reference in URL), always verify to show modal
      // Only skip if it's from localStorage (not fresh return from payment)
      if (isAlreadyProcessed && !reference && !isReturningFromPayment) {
        console.log('Reference already processed (from localStorage), skipping verification:', paymentRef);
        // Clear any references in localStorage
        localStorage.removeItem('lastPaymentReference');
        localStorage.removeItem('paymentStatus');
        localStorage.removeItem('paymentInProgress');
        // Just fetch records without verification
        fetchPaymentRecords();
        return;
      }
      
      // If reference is in URL (user just returned from payment), verify even if already processed
      // This ensures the success modal is shown
      if (isReturningFromPayment || (isAlreadyProcessed && reference)) {
        console.log('User returned from payment with reference, verifying to show modal:', paymentRef);
      }
      
      // Check if this reference has been dismissed before
      const dismissedRefs = JSON.parse(localStorage.getItem('dismissedPaymentRefs') || '[]');
      const wasAlreadyDismissed = dismissedRefs.includes(paymentRef);
      
      if (wasAlreadyDismissed) {
        console.log('Reference was previously dismissed, not showing payment modal');
        // Clear any references in localStorage to prevent showing modal again
        localStorage.removeItem('lastPaymentReference');
        localStorage.removeItem('paymentStatus');
        localStorage.removeItem('paymentInProgress');
        // Just fetch records without verification
        fetchPaymentRecords();
      } else {
        // Store reference in localStorage for persistence only if not dismissed
        localStorage.setItem('lastPaymentReference', paymentRef);
        console.log('Found payment reference, verifying with Paymongo:', paymentRef);
        
        // ALWAYS verify with Paymongo - never assume status
        verifyPaymentStatus(paymentRef);
      }
    } else {
      // No payment reference, just fetch records
      console.log('No payment reference found. Fetching payment records.');
      fetchPaymentRecords();
    }
    
    // If there's an error message, display it
    if (errorMsg) {
      setError(`Payment error: ${errorMsg}`);
    }
    
    // Clean up URL parameters to avoid reprocessing on refresh
    // but keep the student_id
    if ((status || reference) && navigate) {
      const newUrl = `${location.pathname}?student_id=${studentId}`;
      window.history.replaceState({}, '', newUrl);
    }
    
  }, [studentId, location, navigate]);

  // Add a special useEffect for focus events (when user returns to the page)
  useEffect(() => {
    // Function to handle when user returns to the page
    const handlePageFocus = () => {
      const pendingRef = localStorage.getItem('lastPaymentReference');
      const paymentInProgress = localStorage.getItem('paymentInProgress');
      
      if (pendingRef && paymentInProgress === 'true') {
        // First check if this reference was already successfully processed
        const processedRefs = JSON.parse(localStorage.getItem('processedPaymentRefs') || '[]');
        if (processedRefs.includes(pendingRef)) {
          console.log('Reference already processed successfully, skipping verification on focus:', pendingRef);
          // Clear any references in localStorage
          localStorage.removeItem('lastPaymentReference');
          localStorage.removeItem('paymentStatus');
          localStorage.removeItem('paymentInProgress');
          // Just fetch records without verification
          fetchPaymentRecords();
          return;
        }
        
        // Check if this reference has been dismissed before
        const dismissedRefs = JSON.parse(localStorage.getItem('dismissedPaymentRefs') || '[]');
        const wasAlreadyDismissed = dismissedRefs.includes(pendingRef);
        
        if (wasAlreadyDismissed) {
          console.log('Reference was previously dismissed, not verifying on page focus');
          // Clear any references in localStorage to prevent showing modal again
          localStorage.removeItem('lastPaymentReference');
          localStorage.removeItem('paymentStatus');
          localStorage.removeItem('paymentInProgress');
          // Just fetch records without verification
          fetchPaymentRecords();
        } else {
          console.log('Page received focus. Found pending payment, verifying status:', pendingRef);
          // Always verify with Paymongo when returning to the page
          verifyPaymentStatus(pendingRef);
        }
      }
    };
    
    // Add event listeners for page visibility and focus
    window.addEventListener('focus', handlePageFocus);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        handlePageFocus();
      }
    });
    
    // Cleanup event listeners on unmount
    return () => {
      window.removeEventListener('focus', handlePageFocus);
      document.removeEventListener('visibilitychange', handlePageFocus);
    };
  }, [studentId]);

  // Add a special useEffect for logging Paymongo reference
  useEffect(() => {
    // This useEffect will run on every render to ensure we always log the Paymongo reference
    const paymongoRef = localStorage.getItem('lastPaymentReference');
    if (paymongoRef) {
      // This status is just for console display/debugging purposes
      // In the database, we use PAYEE/NON PAYEE for the status column
      const status = localStorage.getItem('paymentStatus') || 'Unknown';
      console.log('===== Current Paymongo Payment =====');
      console.log('Reference:', paymongoRef);
      console.log('Payment Status (from localStorage):', status);
      console.log('Note: Actual status is verified with Paymongo API');
      
      // Check if this reference has been dismissed before
      const dismissedRefs = JSON.parse(localStorage.getItem('dismissedPaymentRefs') || '[]');
      const wasAlreadyDismissed = dismissedRefs.includes(paymongoRef);
      
      // Only show payment failed modal if there's a failed payment status AND it hasn't been dismissed
      if (status === 'Unpaid' && !isPaymentFailedModalOpen && !isPaymentSuccessModalOpen && !wasAlreadyDismissed) {
        setPaymentReference(paymongoRef);
        setIsPaymentFailedModalOpen(true);
      }
    }
  }, [isPaymentFailedModalOpen, isPaymentSuccessModalOpen]);

  // Add a new useEffect to check for failed payments on initial load
  useEffect(() => {
    // Check if there's a failed payment that needs to be shown
    const paymentStatus = localStorage.getItem('paymentStatus');
    const paymentRef = localStorage.getItem('lastPaymentReference');
    
    if (paymentStatus === 'Unpaid' && paymentRef && !loading) {
      // Check if this reference has been dismissed before
      const dismissedRefs = JSON.parse(localStorage.getItem('dismissedPaymentRefs') || '[]');
      const wasAlreadyDismissed = dismissedRefs.includes(paymentRef);
      
      if (!wasAlreadyDismissed) {
        console.log('Found failed payment on dashboard load, showing failure modal');
        setPaymentReference(paymentRef);
        setIsPaymentFailedModalOpen(true);
      } else {
        console.log('Found failed payment but it was already dismissed, not showing modal');
      }
    }
  }, [loading]);

  const fetchPaymentRecords = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/student_payment_api.php?action=fetch_records&student_id=${studentId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();

      if (data.success) {
        // Make sure the records are properly sorted by receipt_number
        const sortedRecords = (data.payment_records || []).sort((a, b) => 
          parseInt(b.receipt_number) - parseInt(a.receipt_number)
        );
        
        setPaymentRecords(sortedRecords);
        setError("");
        
        // After fetching records, check if there's a pending reference that might be in the records
        const pendingRef = localStorage.getItem('lastPaymentReference');
        if (pendingRef) {
          // Check if the payment is already in our records
          const paymentExists = sortedRecords.some(record => 
            record.payment && record.payment.includes(pendingRef)
          );
          
          if (paymentExists) {
            console.log('Payment reference found in records, clearing pending status');
            // Clear pending payment data since it's already in our records
            localStorage.removeItem('lastPaymentReference');
            localStorage.removeItem('paymentInProgress');
            localStorage.setItem('paymentStatus', 'Paid');
          }
        }
      } else {
        setError(data.message || "Failed to fetch payment records.");
      }
    } catch (error) {
      console.error("Error fetching payment records:", error);
      setError(`An error occurred while fetching the payment records: ${error.message}`);
    } finally {
      // Ensure loading is always set to false at the end
      setLoading(false);
    }
  };

  // Generate PDF in landscape mode with green headers
  const generatePDF = () => {
    if (!sortedPaymentRecords || sortedPaymentRecords.length === 0) {
      return; // No records to export
    }

    // Create PDF in landscape orientation
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });
    
    // Set PDF title with green color
    doc.setTextColor(0, 100, 0); // RGB for dark green
    doc.setFontSize(18);
    doc.text("Payment Records", 14, 22);
    
    // Reset text color for the rest of the document
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    
    // Add student ID
    doc.text(`Student ID: ${studentId}`, 14, 30);
    
    // Define the table structure
    const tableColumn = [
      "Name", "Strand", "Grade", "Section", "Mode", 
      "Status", "Transaction", "Date", "Total Fee", "Amount Paid", 
      "Balance", "Remarks", "Receipt No."
    ];
    
    // Convert the data for the PDF table - use the database balance directly
    const tableRows = [];
    sortedPaymentRecords.forEach((record) => {
      tableRows.push([
        record.name,
        record.strand,
        record.grade_level,
        record.section,
        record.mode_of_payment,
        record.status,
        record.payment,
        record.date,
        parseFloat(record.total_fee).toLocaleString(),
        parseFloat(record.amount_paid).toLocaleString(),
        parseFloat(record.balance).toLocaleString(), // Use the balance from the database
        record.remarks,
        record.receipt_number
      ]);
    });
    
    // Create the table with green header color
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 35,
      theme: 'grid',
      styles: {
        fontSize: 7,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [0, 100, 0], // Dark green header
        textColor: [255, 255, 255],
        fontSize: 8,
      },
      columnStyles: {
        8: { halign: 'right' }, // Total Fee
        9: { halign: 'right' }, // Amount Paid
        10: { halign: 'right' }, // Balance
      },
    });
    
    // Add the latest balance at the bottom - use database value
    if (sortedPaymentRecords.length > 0) {
      const latestRecord = sortedPaymentRecords[0];
      doc.setFontSize(12);
      doc.text(`Current Balance: ${parseFloat(latestRecord.balance).toLocaleString()}`, 14, doc.lastAutoTable.finalY + 15);
    }

    doc.save("payment_records.pdf");
    setIsPDFModalOpen(false);
  };

  const handleExportExcel = () => {
    if (!sortedPaymentRecords || sortedPaymentRecords.length === 0) {
      return; // No records to export
    }

    const exportData = sortedPaymentRecords.map((record) => {
      return {
        "Name": record.name,
        "Strand": record.strand,
        "Grade Level": record.grade_level,
        "Section": record.section,
        "Mode of Payment": record.mode_of_payment,
        "Status": record.status,
        "Transaction": record.payment,
        "Date": record.date,
        "Total Fee": parseFloat(record.total_fee),
        "Amount Paid": parseFloat(record.amount_paid),
        "Balance": parseFloat(record.balance), // Use database balance
        "Remarks": record.remarks,
        "Receipt No.": record.receipt_number
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Payment Records");

    // Format currency columns
    ["J", "K", "L"].forEach(col => {
      const range = XLSX.utils.decode_range(worksheet['!ref']);
      for (let row = range.s.r + 1; row <= range.e.r; row++) {
        const cell = worksheet[`${col}${row + 1}`];
        if (cell && cell.t === 'n') {
          cell.z = '"₱"#,##0.00';
        }
      }
    });

    XLSX.writeFile(workbook, "payment_records.xlsx");
    setIsExportModalOpen(false);
  };

  // Handle payment processing with improved error handling and direct return to app
  const handlePayment = async () => {
    if (!hasRecords || !latestPayment) {
      return; // No records or no latest payment
    }

    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      alert("Please enter a valid payment amount");
      return;
    }
    
    // Get the current balance based on whether it's first payment or not
    const currentBalance = hasRecords ? parseFloat(latestPayment.balance) : 5000; // Default total fee for first payment
    
    if (parseFloat(paymentAmount) > currentBalance) {
      alert("Payment amount cannot exceed current balance");
      setPaymentAmount(currentBalance.toString());
      return;
    }
    
    setIsProcessing(true);
    
    // Log payment attempt
    console.log('===== Payment Attempt =====');
    console.log('Student ID:', studentId);
    console.log('Amount:', parseFloat(paymentAmount));
    console.log('Student Name:', latestPayment.name);
    console.log('Current Balance:', currentBalance);
    console.log('Is First Payment:', !hasRecords);
    
    try {
      // Call API to create a payment and get Paymongo link
      const response = await fetch(`${API_BASE_URL}/student_payment_api.php?action=create_payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          student_id: studentId,
          name: latestPayment.name,
          strand: latestPayment.strand,
          grade_level: latestPayment.grade_level,
          section: latestPayment.section,
          amount: Math.round(parseFloat(paymentAmount) * 100), // Convert to centavos for Paymongo
          is_first_payment: !hasRecords, // Add flag to indicate if this is first payment
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Log successful payment link creation with Paymongo reference
        console.log('===== Payment Link Created =====');
        console.log('Paymongo Reference:', data.reference);
        console.log('Checkout URL:', data.checkout_url);
        console.log('Redirect URL after payment:', data.redirect_url);
        
        // Store the Paymongo reference in localStorage for verification later if needed
        localStorage.setItem('lastPaymentReference', data.reference);
        localStorage.setItem('lastPaymentAmount', paymentAmount);
        localStorage.setItem('lastPaymentStudentId', studentId);
        localStorage.setItem('paymentInProgress', 'true');
        // Don't set a status yet - we'll get actual status from Paymongo
        localStorage.removeItem('paymentStatus');
        
        // Redirect to Paymongo checkout URL
        window.location.href = data.checkout_url;
      } else {
        throw new Error(data.message || 'Failed to create payment link');
      }
    } catch (error) {
      console.error("Payment processing error:", error);
      alert(`Payment processing failed: ${error.message}`);
      setIsProcessing(false);
    }
  };

  const handleAmountChange = (e) => {
    if (!hasRecords || !latestPayment) return;

    const value = e.target.value;
    const currentBalance = parseFloat(latestPayment.balance);
    
    if (value === "" || isNaN(parseFloat(value))) {
      setPaymentAmount("");
    } else if (parseFloat(value) <= 0) {
      setPaymentAmount("");
    } else if (parseFloat(value) > currentBalance) {
      setPaymentAmount(currentBalance.toString());
    } else {
      setPaymentAmount(value);
    }
  };

  const closeSuccessModal = () => {
    setIsPaymentSuccessModalOpen(false);
    // Refresh payment records to show the new payment
    fetchPaymentRecords();
  };

  const closeFailedModal = () => {
    setIsPaymentFailedModalOpen(false);
    
    // Also close the payment modal that might be open in the background
    setIsPaymentModalOpen(false);
    setPaymentAmount('');
    
    // Make sure to fetch records when closing failed modal
    fetchPaymentRecords();
    
    // Get the reference before clearing it
    const reference = localStorage.getItem('lastPaymentReference');
    
    // Clear ALL payment data to prevent the modal from showing again
    localStorage.removeItem('paymentInProgress');
    localStorage.removeItem('paymentStatus');
    localStorage.removeItem('lastPaymentReference'); // Completely remove the reference
    localStorage.removeItem('lastPaymentAmount');
    
    // Store the reference in a separate list of dismissed references
    if (reference) {
      const dismissedRefs = JSON.parse(localStorage.getItem('dismissedPaymentRefs') || '[]');
      dismissedRefs.push(reference);
      localStorage.setItem('dismissedPaymentRefs', JSON.stringify(dismissedRefs));
    }
  };

  const retryPayment = () => {
    setIsPaymentFailedModalOpen(false);
    setIsPaymentModalOpen(true);
    
    // Remove this reference from dismissed references if it exists
    const reference = localStorage.getItem('lastPaymentReference');
    if (reference) {
      const dismissedRefs = JSON.parse(localStorage.getItem('dismissedPaymentRefs') || '[]');
      const updatedRefs = dismissedRefs.filter(ref => ref !== reference);
      localStorage.setItem('dismissedPaymentRefs', JSON.stringify(updatedRefs));
    }
    
    // Ensure payment records are loaded
    fetchPaymentRecords();
  };

  const openExportModal = () => setIsExportModalOpen(true);
  const closeExportModal = () => setIsExportModalOpen(false);
  const openPDFModal = () => setIsPDFModalOpen(true);
  const closePDFModal = () => setIsPDFModalOpen(false);

  // Payment Modal Close Handler with confirmation
  const closePaymentModal = () => {
    // If user is trying to close while processing, do nothing
    if (isProcessing) return;
    
    // If user entered an amount, ask for confirmation
    if (paymentAmount && parseFloat(paymentAmount) > 0) {
      if (window.confirm('Are you sure you want to cancel this payment?')) {
        setIsPaymentModalOpen(false);
        setPaymentAmount('');
      }
    } else {
      // No amount entered, just close
      setIsPaymentModalOpen(false);
      setPaymentAmount('');
    }
  };

  if (loading) {
    return <div className="loading-container-spay">Loading payment records...</div>;
  }

  if (error) {
    return (
      <div className="error-container-spay">
        <h3>Error</h3>
        <p>{error}</p>
        <p>Student ID: {studentId || "Not found"}</p>
      </div>
    );
  }

  // Sort payment records by receipt number (descending)
  const sortedPaymentRecords = [...paymentRecords].sort((a, b) => 
    parseInt(b.receipt_number) - parseInt(a.receipt_number)
  );

  // Check if we have records and get the latest payment record
  const hasRecords = sortedPaymentRecords.length > 0;
  const latestPayment = hasRecords ? sortedPaymentRecords[0] : null;
  
  // Only define these values if we have records - fully dynamic approach
  const hasBalance = hasRecords && latestPayment && parseFloat(latestPayment.balance) > 0;

  return (
    <div className="payment-records-container-spay">
      <div className="top-controls-payment-records-spay">
        <h2 className="payment-records-title-spay">Payment Records</h2>
        <div className="buttons-group-payment-records-spay">
          <button 
            className="pdf-button-payment-records-spay" 
            onClick={openPDFModal}
            disabled={!hasRecords}
          >
            <FaFilePdf style={{ marginRight: '5px' }} /> PDF
          </button>
          <button 
            className="xls-button-payment-records-spay" 
            onClick={openExportModal}
            disabled={!hasRecords}
          >
            <FaFileExcel style={{ marginRight: '5px' }} /> Excel
          </button>
          <button 
            className="pay-button-payment-records-spay" 
            onClick={() => setIsPaymentModalOpen(true)}
            disabled={!hasBalance}
          >
            <FaCreditCard style={{ marginRight: '5px' }} /> Pay Online
          </button>
        </div>
      </div>

      {!hasRecords ? (
        <p className="no-records-message-spay">No payment records found for this student (ID: {studentId}).</p>
      ) : (
        <div className="payment-records-table-container" ref={tableRef}>
          <table className="payment-records-table-spay">
            <thead>
              <tr>
                <th>NAME</th>
                <th>STRAND</th>
                <th>GRADE LEVEL</th>
                <th>SECTION</th>
                <th>MODE OF PAYMENT</th>
                <th>STATUS</th>
                <th>TRANSACTION</th>
                <th>DATE</th>
                <th>TOTAL FEE</th>
                <th>AMOUNT PAID</th>
                <th>BALANCE</th>
                <th>REMARKS</th>
                <th>RECEIPT NO.</th>
              </tr>
            </thead>
            <tbody>
              {sortedPaymentRecords.map((record, index) => (
                <tr key={index}>
                  <td>{record.name}</td>
                  <td>{record.strand}</td>
                  <td>{record.grade_level}</td>
                  <td>{record.section}</td>
                  <td>{record.mode_of_payment}</td>
                  <td>{record.status}</td>
                  <td>{record.payment}</td>
                  <td>{record.date}</td>
                  <td className="amount-column">₱{parseFloat(record.total_fee).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className="amount-column">₱{parseFloat(record.amount_paid).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className="amount-column">₱{parseFloat(record.balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td>{record.remarks}</td>
                  <td>{record.receipt_number}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {hasRecords && (
        <div className="balance-summary-spay">
          <span>Balance:</span>
          <input
            type="text"
            className="balance-input-spay"
            value={`₱${parseFloat(latestPayment.balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            readOnly
          />
        </div>
      )}

      {/* Excel Export Confirmation Modal */}
      {isExportModalOpen && (
        <div className="modal-confirmation-spay">
          <div className="modal-content-spay">
            <h3>Confirmation</h3>
            <p>Are you sure you want to export to Excel?</p>
            <div className="button-group-spay">
              <button className="confirm-button-spay" onClick={handleExportExcel}>
                Yes, Export
              </button>
              <button className="cancel-button-spay" onClick={closeExportModal}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PDF Export Confirmation Modal */}
      {isPDFModalOpen && (
        <div className="modal-confirmation-spay">
          <div className="modal-content-spay">
            <h3>Confirmation</h3>
            <p>Are you sure you want to export to PDF?</p>
            <div className="button-group-spay">
              <button className="confirm-button-spay" onClick={generatePDF}>
                Yes, Export
              </button>
              <button className="cancel-button-spay" onClick={closePDFModal}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal - only rendered if we have records and balance */}
      {isPaymentModalOpen && hasBalance && latestPayment && (
        <div className="modal-confirmation-spay payment-modal">
          <div className="modal-content-spay payment-content">
            <h3>Online Payment</h3>
            
            <div className="payment-info">
              <p><strong>Student:</strong> {latestPayment.name}</p>
              <p><strong>ID:</strong> {studentId}</p>
              <p><strong>Current Balance:</strong> ₱{parseFloat(latestPayment.balance).toLocaleString()}</p>
            </div>
            
            <div className="payment-amount-container">
              <label>Amount to Pay (₱):</label>
              <input
                type="number"
                value={paymentAmount}
                onChange={handleAmountChange}
                placeholder="Enter amount"
                min="1"
                max={parseFloat(latestPayment.balance)}
                disabled={isProcessing}
              />
              
              <div className="amount-shortcuts">
                <button 
                  onClick={() => setPaymentAmount(parseFloat(latestPayment.balance).toString())}
                  disabled={isProcessing}
                  type="button"
                >
                  Pay Full Balance
                </button>
                {parseFloat(latestPayment.balance) > 1000 && (
                  <button 
                    onClick={() => setPaymentAmount("1000")}
                    disabled={isProcessing}
                    type="button"
                  >
                    Pay ₱1,000
                  </button>
                )}
              </div>
            </div>
            
            <p className="payment-note">
              You'll be redirected to a secure payment page after clicking "Proceed".<br/>
              <strong>Important:</strong> After successful payment, please return to this application
              by closing the payment window or using the Back button.
            </p>
            
            <div className="button-group-spay">
              <button 
                className="confirm-button-spay" 
                onClick={handlePayment}
                disabled={isProcessing || !paymentAmount}
              >
                {isProcessing ? "Processing..." : "Proceed to Payment"}
              </button>
              <button 
                className="cancel-button-spay" 
                onClick={closePaymentModal}
                disabled={isProcessing}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Success Modal */}
      {isPaymentSuccessModalOpen && (
        <div className="modal-confirmation-spay payment-result-modal">
          <div className="modal-content-spay payment-result success">
            <div className="result-icon success-icon">
              <FaCheckCircle />
            </div>
            <h3>Payment Successful!</h3>
            <p>Your payment has been processed successfully.</p>
            <p>A receipt has been generated for your records.</p>
            {paymentReference && (
              <p><small>Payment Reference: <strong>{paymentReference}</strong></small></p>
            )}
            <div className="button-group-spay">
              <button 
                className="confirm-button-spay" 
                onClick={closeSuccessModal}
              >
                View Payment Records
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Failed Modal */}
      {isPaymentFailedModalOpen && (
        <div className="modal-confirmation-spay payment-result-modal">
          <div className="modal-content-spay payment-result failed">
            <div className="result-icon failed-icon">
              <FaTimesCircle />
            </div>
            <h3>Payment Failed</h3>
            <p>Your payment could not be processed.</p>
            <p>This might be due to insufficient funds, connectivity issues, or payment method restrictions.</p>
            <p><small>You can create a new payment transaction by clicking the "Pay Online" button again.</small></p>
            {paymentReference && (
              <p><small>Payment Reference: <strong>{paymentReference}</strong></small></p>
            )}
            <div className="button-group-spay">
              <button 
                className="cancel-button-spay" 
                onClick={closeFailedModal}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentPaymentRecords;