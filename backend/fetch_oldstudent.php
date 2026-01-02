<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

// Database connection setup
$servername = "localhost";
$username = "u572625467_group_v";  // Your Hostinger database username
$password = "Northills_12345";   // Your password
$dbname = "u572625467_northillscoa";  // Your Hostinger database name

$conn = new mysqli($servername, $username, $password, $dbname);

// Check the database connection
if ($conn->connect_error) {
    error_log("Database connection failed: " . $conn->connect_error);
    echo json_encode(["success" => false, "message" => "Database connection failed."]);
    exit();
}

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Fetch student by email or student_id
    $email = isset($_GET['email']) ? $_GET['email'] : '';
    $student_id = isset($_GET['student_id']) ? $_GET['student_id'] : '';
    
    if (empty($email) && empty($student_id)) {
        echo json_encode(array("success" => false, "message" => "Email or Student ID is required"));
        exit;
    }
    
    // Prepare query based on available parameter
    if (!empty($email)) {
        $sql = "SELECT * FROM enrolled_students WHERE email = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("s", $email);
    } else {
        $sql = "SELECT * FROM enrolled_students WHERE student_id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $student_id);
    }
    
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        $student = $result->fetch_assoc();
        echo json_encode(array(
            "success" => true, 
            "student" => $student,
            "message" => "Student found"
        ));
    } else {
        echo json_encode(array(
            "success" => false, 
            "message" => "Student not found"
        ));
    }
    
    $stmt->close();
    
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Update student information
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Validate required fields
    $required_fields = ['student_id', 'name', 'email', 'contactNumber', 'gradeLevel', 'section', 'strand'];
    foreach ($required_fields as $field) {
        if (!isset($input[$field]) || empty(trim($input[$field]))) {
            echo json_encode(array("success" => false, "message" => "Field '$field' is required"));
            exit;
        }
    }
    
    $student_id = $input['student_id'];
    $name = trim($input['name']);
    $email = trim($input['email']);
    $contactNumber = trim($input['contactNumber']);
    $gradeLevel = trim($input['gradeLevel']);
    $section = trim($input['section']);
    $strand = trim($input['strand']);
    
    // Validate email format
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo json_encode(array("success" => false, "message" => "Invalid email format"));
        exit;
    }
    
    // Validate contact number (Philippine format)
    if (!preg_match('/^09\d{9}$/', $contactNumber)) {
        echo json_encode(array("success" => false, "message" => "Invalid contact number format. Use format: 09XXXXXXXXX"));
        exit;
    }
    
    // Check if student exists
    $check_sql = "SELECT student_id FROM enrolled_students WHERE student_id = ?";
    $check_stmt = $conn->prepare($check_sql);
    $check_stmt->bind_param("i", $student_id);
    $check_stmt->execute();
    $check_result = $check_stmt->get_result();
    
    if ($check_result->num_rows === 0) {
        echo json_encode(array("success" => false, "message" => "Student not found"));
        exit;
    }
    $check_stmt->close();
    
    // Update student information
    $update_sql = "UPDATE enrolled_students SET 
                   name = ?, 
                   email = ?, 
                   contactNumber = ?, 
                   gradeLevel = ?, 
                   section = ?, 
                   strand = ?,
                   updated_at = CURRENT_TIMESTAMP 
                   WHERE student_id = ?";
                   
    $update_stmt = $conn->prepare($update_sql);
    $update_stmt->bind_param("ssssssi", $name, $email, $contactNumber, $gradeLevel, $section, $strand, $student_id);
    
    if ($update_stmt->execute()) {
        // Get updated student data
        $fetch_sql = "SELECT * FROM enrolled_students WHERE student_id = ?";
        $fetch_stmt = $conn->prepare($fetch_sql);
        $fetch_stmt->bind_param("i", $student_id);
        $fetch_stmt->execute();
        $fetch_result = $fetch_stmt->get_result();
        $updated_student = $fetch_result->fetch_assoc();
        $fetch_stmt->close();
        
        echo json_encode(array(
            "success" => true, 
            "message" => "Student information updated successfully",
            "student" => $updated_student
        ));
    } else {
        echo json_encode(array("success" => false, "message" => "Error updating student information: " . $conn->error));
    }
    
    $update_stmt->close();
    
} else {
    echo json_encode(array("success" => false, "message" => "Method not allowed"));
}

$conn->close();
?>