<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, GET, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Enable error logging
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Custom log function for SMS activities
function sms_log($message) {
    $log_file = dirname(__FILE__) . '/sms_log.txt';
    $date = date('Y-m-d H:i:s');
    $log_message = "[{$date}] {$message}" . PHP_EOL;
    
    // Log to file
    file_put_contents($log_file, $log_message, FILE_APPEND);
    
    // Also log to PHP error log for server logs
    error_log("SMS: {$message}");
}

// Handle OPTIONS preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200); // Respond OK to preflight
    exit();
}

// Database credentials
$servername = "localhost";
$username = "u572625467_group_v";  // Your Hostinger database username
$password = "Northills_12345";   // Replace with your actual password
$dbname = "u572625467_northillscoa";  // Your Hostinger database name

// Connect to the database
$conn = new mysqli($servername, $username, $password, $dbname);

// Check database connection
if ($conn->connect_error) {
    sms_log("Database connection failed: " . $conn->connect_error);
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database connection failed: " . $conn->connect_error]);
    exit();
}

// Function to format date
function formatDate($date) {
    if (empty($date)) return null;
    $timestamp = strtotime($date);
    return date('Y-m-d H:i', $timestamp);
}

// Function to format Philippine phone numbers for Semaphore
function formatPhoneNumber($number) {
    // Remove any whitespace, dashes, or other non-numeric characters except the plus sign
    $number = preg_replace('/[^0-9+]/', '', trim($number));
    
    sms_log("Formatting phone number: {$number}");
    
    // If the number starts with 09, convert to international format
    if (substr($number, 0, 2) === '09') {
        $formatted = '+63' . substr($number, 1);
        sms_log("Converted 09xx format to international: {$formatted}");
        return $formatted;
    }
    
    // If the number starts with +639, it's already in international format
    if (substr($number, 0, 4) === '+639') {
        sms_log("Number already in international format: {$number}");
        return $number;
    }
    
    // If the number starts with 639 (no plus), add the plus
    if (substr($number, 0, 3) === '639') {
        $formatted = '+' . $number;
        sms_log("Added plus to 639xx number: {$formatted}");
        return $formatted;
    }
    
    // If it doesn't match any expected format, log and return the original
    sms_log("Warning: Phone number '{$number}' doesn't match expected PH format");
    return $number;
}

// Function to send SMS to guardians of approved students
function sendSmsToGuardians($conn, $announcement) {
    // Start logging
    sms_log("=============== SENDING ANNOUNCEMENT SMS ===============");
    sms_log("Starting to send SMS for announcement: " . $announcement['title']);
    
    // Semaphore API key
    $apiKey = "5572edda2b842b8d34c8ac287ead3f55"; 
    
    // First, get all approved student_ids from enrolledstudent table
    sms_log("Querying database for approved students");
    $approvedStudentsStmt = $conn->prepare("SELECT student_id FROM enrolledstudent WHERE status = 'Approved'");
    
    if (!$approvedStudentsStmt) {
        sms_log("SQL preparation error when getting approved students: " . $conn->error);
        return false;
    }
    
    $approvedStudentsStmt->execute();
    $approvedStudentsResult = $approvedStudentsStmt->get_result();
    
    $approvedStudentCount = $approvedStudentsResult->num_rows;
    sms_log("Found {$approvedStudentCount} approved students");
    
    if ($approvedStudentCount > 0) {
        // Create an array of approved student IDs
        $approvedStudentIds = [];
        while ($row = $approvedStudentsResult->fetch_assoc()) {
            $approvedStudentIds[] = $row['student_id'];
        }
        $approvedStudentsStmt->close();
        
        // Create a placeholder string for the IN clause
        $placeholders = str_repeat('?,', count($approvedStudentIds) - 1) . '?';
        
        // Get phone numbers of guardians whose students are approved
        sms_log("Querying for guardian phone numbers of approved students");
        $query = "SELECT DISTINCT g.guardian_phoneNum FROM guardian g 
                 WHERE g.student_id IN ($placeholders)";
        
        $stmt = $conn->prepare($query);
        
        if (!$stmt) {
            sms_log("SQL preparation error when getting guardian phones: " . $conn->error);
            return false;
        }
        
        // Bind the student IDs to the query
        $types = str_repeat('i', count($approvedStudentIds)); // 'i' for integer type
        $stmt->bind_param($types, ...$approvedStudentIds);
        
        $stmt->execute();
        $result = $stmt->get_result();
        
        $guardianCount = $result->num_rows;
        sms_log("Found {$guardianCount} guardians of approved students");
        
        if ($guardianCount > 0) {
            $phoneNumbers = [];
            while ($row = $result->fetch_assoc()) {
                // Make sure the phone number is valid
                $phoneNum = trim($row['guardian_phoneNum']);
                sms_log("Processing guardian number: {$phoneNum}");
                
                if (!empty($phoneNum)) {
                    $formattedNumber = formatPhoneNumber($phoneNum);
                    $phoneNumbers[] = $formattedNumber;
                    sms_log("Added formatted number: {$formattedNumber}");
                } else {
                    sms_log("Skipping empty phone number");
                }
            }
            
            // Log the number of valid phone numbers found
            $validNumbersCount = count($phoneNumbers);
            sms_log("Found {$validNumbersCount} valid guardian phone numbers for approved students");
            
            // If we have phone numbers, send the SMS
            if (!empty($phoneNumbers)) {
                // Format message with full announcement details
                $message = "ANNOUNCEMENT\n\nTitle: {$announcement['title']}\n";
                
                // Add date if provided
                if (!empty($announcement['date'])) {
                    $message .= "Date: {$announcement['date']}\n";
                }
                
                // Add author if provided
                if (!empty($announcement['author'])) {
                    $message .= "By: {$announcement['author']}";
                    
                    // Add role if provided
                    if (!empty($announcement['role'])) {
                        $message .= " ({$announcement['role']})";
                    }
                    $message .= "\n";
                }
                
                // Add category if provided
                if (!empty($announcement['category'])) {
                    $message .= "Category: {$announcement['category']}\n";
                }
                
                // Add content summary if provided
                if (!empty($announcement['content'])) {
                    $contentSummary = substr($announcement['content'], 0, 50);
                    if (strlen($announcement['content']) > 50) {
                        $contentSummary .= "...";
                    }
                    $message .= "\n{$contentSummary}";
                }
                
                // Trim message if too long (Semaphore has a character limit)
                $originalLength = strlen($message);
                if ($originalLength > 300) {
                    $message = substr($message, 0, 297) . "...";
                    sms_log("Message truncated from {$originalLength} to 300 characters");
                }
                
                // Log the message content
                sms_log("Message content: " . str_replace("\n", "\\n", $message));
                
                // Process numbers in smaller batches to avoid API limits
                $batchSize = 100; // Adjust as needed
                $batches = array_chunk($phoneNumbers, $batchSize);
                
                $allSuccess = true;
                $batchNumber = 1;
                
                foreach ($batches as $batch) {
                    // Convert phone numbers array to comma-separated string
                    $numbersString = implode(",", $batch);
                    sms_log("Sending batch #{$batchNumber} to: " . $numbersString);
                    
                    // Initialize cURL
                    $ch = curl_init();
                    
                    // Setup parameters
                    $parameters = array(
                        'apikey' => $apiKey,
                        'number' => $numbersString,
                        'message' => $message,
                        'sendername' => 'NORTHILLS'  // Using default sender name
                    );
                    
                    // Log the parameters
                    sms_log("API parameters: " . json_encode($parameters));
                    
                    // Set cURL options
                    curl_setopt($ch, CURLOPT_URL, 'https://api.semaphore.co/api/v4/messages');
                    curl_setopt($ch, CURLOPT_POST, 1);
                    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($parameters));
                    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                    
                    // For detailed debugging
                    curl_setopt($ch, CURLOPT_VERBOSE, true);
                    $verbose = fopen('php://temp', 'w+');
                    curl_setopt($ch, CURLOPT_STDERR, $verbose);
                    
                    // Set timeout values
                    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10); // Timeout for the connection phase
                    curl_setopt($ch, CURLOPT_TIMEOUT, 30);        // Timeout for the whole operation
                    
                    // Execute the cURL request
                    sms_log("Executing cURL request to Semaphore API");
                    $output = curl_exec($ch);
                    
                    // Get verbose information
                    rewind($verbose);
                    $verboseLog = stream_get_contents($verbose);
                    sms_log("cURL verbose log: " . $verboseLog);
                    
                    // Check for cURL errors
                    if(curl_errno($ch)) {
                        $errorCode = curl_errno($ch);
                        $errorMessage = curl_error($ch);
                        sms_log("cURL Error #{$errorCode}: {$errorMessage}");
                        $allSuccess = false;
                    } else {
                        // Get HTTP status code
                        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
                        sms_log("HTTP response code: {$httpCode}");
                        
                        // Log the complete raw response
                        sms_log("Raw API response: " . $output);
                        
                        // Try to decode the JSON response
                        $decodedResponse = json_decode($output, true);
                        if (json_last_error() === JSON_ERROR_NONE) {
                            sms_log("Decoded API response: " . json_encode($decodedResponse));
                            
                            // Check if there's an error in the response
                            if (isset($decodedResponse['error'])) {
                                sms_log("API error: " . $decodedResponse['error']);
                                $allSuccess = false;
                            }
                        } else {
                            sms_log("JSON decode error: " . json_last_error_msg());
                            $allSuccess = false;
                        }
                    }
                    
                    // Close cURL
                    curl_close($ch);
                    $batchNumber++;
                    
                    // Small delay between batches
                    if (count($batches) > 1) {
                        sleep(1);
                    }
                }
                
                // End log entry
                sms_log("SMS sending completed. Overall success: " . ($allSuccess ? "Yes" : "No"));
                
                return $allSuccess ? $decodedResponse : false;
            } else {
                sms_log("No valid phone numbers to send SMS to");
            }
        } else {
            sms_log("No guardians found for approved students");
        }
    } else {
        sms_log("No approved students found in the enrolledstudent table");
    }
    
    $stmt->close();
    sms_log("=============== SMS PROCESS COMPLETED ===============");
    return null;
}

// Check if this is an attachment request
if (isset($_GET['attachment_id']) && !empty($_GET['attachment_id'])) {
    $announcement_id = intval($_GET['attachment_id']);
    
    $stmt = $conn->prepare("SELECT attachment, attachment_name, attachment_type FROM announcements WHERE announcement_id = ?");
    $stmt->bind_param("i", $announcement_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        $row = $result->fetch_assoc();
        
        if ($row['attachment']) {
            // Set appropriate headers for the file
            header("Content-Type: " . $row['attachment_type']);
            
            // Check if download is requested
            if (isset($_GET['download']) && $_GET['download'] == 'true') {
                header("Content-Disposition: attachment; filename=\"" . $row['attachment_name'] . "\"");
            } else {
                header("Content-Disposition: inline; filename=\"" . $row['attachment_name'] . "\"");
            }
            
            // Output the file content
            echo $row['attachment'];
            exit;
        } else {
            http_response_code(404);
            echo json_encode(["success" => false, "message" => "No attachment found for this announcement"]);
        }
    } else {
        http_response_code(404);
        echo json_encode(["success" => false, "message" => "Announcement not found"]);
    }
    
    $stmt->close();
    exit;
}

// GET request - Fetch all announcements or a single announcement
else if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $announcement_id = isset($_GET['id']) ? intval($_GET['id']) : null;
    
    if ($announcement_id) {
        // Fetch a single announcement
        $stmt = $conn->prepare("SELECT announcement_id, title, date, author, role, category, content, attachment_name, attachment_type, created_at, updated_at FROM announcements WHERE announcement_id = ?");
        $stmt->bind_param("i", $announcement_id);
    } else {
        // Fetch all announcements
        $stmt = $conn->prepare("SELECT announcement_id, title, date, author, role, category, content, attachment_name, created_at, updated_at FROM announcements ORDER BY date DESC");
    }
    
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($announcement_id) {
        if ($result->num_rows > 0) {
            $row = $result->fetch_assoc();
            echo json_encode(["success" => true, "data" => $row]);
        } else {
            http_response_code(404);
            echo json_encode(["success" => false, "message" => "Announcement not found"]);
        }
    } else {
        $announcements = [];
        while ($row = $result->fetch_assoc()) {
            $announcements[] = $row;
        }
        echo json_encode(["success" => true, "data" => $announcements]);
    }
    
    $stmt->close();
}

// POST request - Create a new announcement
else if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Check if this is a method override for PUT or DELETE
    if (isset($_POST['_method'])) {
        $method = strtoupper($_POST['_method']);
        
        if ($method === 'PUT') {
            // Handle as PUT request
            $announcement_id = intval($_POST['announcement_id']);
            
            if (!$announcement_id) {
                http_response_code(400);
                echo json_encode(["success" => false, "message" => "Announcement ID is required"]);
                exit();
            }
            
            $title = $_POST['title'] ?? '';
            $date = formatDate($_POST['date'] ?? '');
            $author = $_POST['author'] ?? '';
            $role = $_POST['role'] ?? '';
            $category = $_POST['category'] ?? '';
            $content = $_POST['content'] ?? '';
            
            // Handle file upload
            $attachment = null;
            $attachment_name = null;
            $attachment_type = null;
            $update_attachment = false;
            
            if (isset($_FILES['attachment']) && $_FILES['attachment']['error'] == 0) {
                $attachment = file_get_contents($_FILES['attachment']['tmp_name']);
                $attachment_name = $_FILES['attachment']['name'];
                $attachment_type = $_FILES['attachment']['type'];
                $update_attachment = true;
            }
            
            // Update announcement with or without attachment
            if ($update_attachment) {
                $stmt = $conn->prepare("UPDATE announcements SET title = ?, date = ?, author = ?, role = ?, category = ?, content = ?, attachment = ?, attachment_name = ?, attachment_type = ?, updated_at = NOW() WHERE announcement_id = ?");
                $stmt->bind_param("sssssssssi", $title, $date, $author, $role, $category, $content, $attachment, $attachment_name, $attachment_type, $announcement_id);
            } else {
                $stmt = $conn->prepare("UPDATE announcements SET title = ?, date = ?, author = ?, role = ?, category = ?, content = ?, updated_at = NOW() WHERE announcement_id = ?");
                $stmt->bind_param("ssssssi", $title, $date, $author, $role, $category, $content, $announcement_id);
            }
            
            if ($stmt->execute()) {
                // Log the successful update
                sms_log("Announcement ID {$announcement_id} updated successfully");
                
                // Send SMS notifications for the updated announcement
                $announcement = [
                    'title' => $title,
                    'date' => $date,
                    'author' => $author,
                    'role' => $role,
                    'category' => $category,
                    'content' => $content
                ];
                
                $smsResult = sendSmsToGuardians($conn, $announcement);
                $smsStatus = ($smsResult !== false && $smsResult !== null) ? "sent" : "not sent";
                
                sms_log("SMS status for updated announcement: {$smsStatus}");
                
                echo json_encode([
                    "success" => true, 
                    "message" => "Announcement updated successfully",
                    "sms_status" => $smsStatus
                ]);
            } else {
                sms_log("Failed to update announcement: " . $stmt->error);
                http_response_code(500);
                echo json_encode(["success" => false, "message" => "Failed to update announcement: " . $stmt->error]);
            }
            
            $stmt->close();
            exit();
        }
        else if ($method === 'DELETE') {
            // Handle as DELETE request
            $announcement_id = intval($_POST['announcement_id']);
            
            if (!$announcement_id) {
                http_response_code(400);
                echo json_encode(["success" => false, "message" => "Announcement ID is required"]);
                exit();
            }
            
            $stmt = $conn->prepare("DELETE FROM announcements WHERE announcement_id = ?");
            $stmt->bind_param("i", $announcement_id);
            
            if ($stmt->execute()) {
                echo json_encode(["success" => true, "message" => "Announcement deleted successfully"]);
            } else {
                http_response_code(500);
                echo json_encode(["success" => false, "message" => "Failed to delete announcement: " . $stmt->error]);
            }
            
            $stmt->close();
            exit();
        }
    }
    
    // Regular POST - Create a new announcement
    $title = $_POST['title'] ?? '';
    $date = formatDate($_POST['date'] ?? '');
    $author = $_POST['author'] ?? '';
    $role = $_POST['role'] ?? '';
    $category = $_POST['category'] ?? '';
    $content = $_POST['content'] ?? '';
    
    // Handle file upload
    $attachment = null;
    $attachment_name = null;
    $attachment_type = null;
    
    if (isset($_FILES['attachment']) && $_FILES['attachment']['error'] == 0) {
        $attachment = file_get_contents($_FILES['attachment']['tmp_name']);
        $attachment_name = $_FILES['attachment']['name'];
        $attachment_type = $_FILES['attachment']['type'];
    }
    
    // Insert announcement into database
    $stmt = $conn->prepare("INSERT INTO announcements (title, date, author, role, category, content, attachment, attachment_name, attachment_type, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())");
    $stmt->bind_param("sssssssss", $title, $date, $author, $role, $category, $content, $attachment, $attachment_name, $attachment_type);
    
    if ($stmt->execute()) {
        $announcement_id = $conn->insert_id;
        sms_log("New announcement created with ID: {$announcement_id}");
        
        // Send SMS notifications for the new announcement
        $announcement = [
            'title' => $title,
            'date' => $date,
            'author' => $author,
            'role' => $role,
            'category' => $category,
            'content' => $content
        ];
        
        $smsResult = sendSmsToGuardians($conn, $announcement);
        $smsStatus = ($smsResult !== false && $smsResult !== null) ? "sent" : "not sent";
        
        sms_log("SMS status for new announcement: {$smsStatus}");
        
        echo json_encode([
            "success" => true, 
            "message" => "Announcement created successfully", 
            "id" => $announcement_id,
            "sms_status" => $smsStatus
        ]);
    } else {
        sms_log("Failed to create announcement: " . $stmt->error);
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Failed to create announcement: " . $stmt->error]);
    }
    
    $stmt->close();
}

// Handle invalid HTTP methods
else {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Invalid request method"]);
}

// Close the database connection
$conn->close();
?>