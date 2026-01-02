<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
header("Content-Type: application/json");

// Handle OPTIONS request
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

$servername = "localhost";
$username = "u572625467_group_v";
$password = "Northills_12345";
$dbname = "u572625467_northillscoa";

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    error_log("Database connection failed: " . $conn->connect_error);
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database connection failed"]);
    exit();
}

// Fetching the student_id
$student_id = isset($_GET['student_id']) ? intval($_GET['student_id']) : null;

if (!$student_id) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Missing student_id parameter"]);
    exit();
}

try {
    // Get the student's current grade level from enrollmentdata table
    $grade_query = "SELECT grade_level FROM enrollmentdata WHERE student_id = ? ORDER BY enrollment_id DESC LIMIT 1";
    $grade_stmt = $conn->prepare($grade_query);
    
    if ($grade_stmt === false) {
        throw new Exception("Grade query preparation failed: " . $conn->error);
    }

    $grade_stmt->bind_param("i", $student_id);
    
    if (!$grade_stmt->execute()) {
        throw new Exception("Grade query execution failed: " . $grade_stmt->error);
    }
    
    $grade_result = $grade_stmt->get_result();
    $current_grade_level = null;
    
    if ($grade_result->num_rows > 0) {
        $grade_row = $grade_result->fetch_assoc();
        $current_grade_level = $grade_row['grade_level'];
    }
    
    $grade_stmt->close();

    // If no enrollment data found, return empty array
    if (!$current_grade_level) {
        echo json_encode([
            "success" => true, 
            "payment_records" => [],
            "current_grade_level" => null,
            "message" => "No enrollment data found for student"
        ]);
        $conn->close();
        exit();
    }

    // Extract the numeric part from grade_level (e.g., "Grade 11" -> "11")
    preg_match('/\d+/', $current_grade_level, $matches);
    $grade_number = isset($matches[0]) ? $matches[0] : null;

    if (!$grade_number) {
        echo json_encode([
            "success" => true, 
            "payment_records" => [],
            "current_grade_level" => $current_grade_level,
            "message" => "Invalid grade level format"
        ]);
        $conn->close();
        exit();
    }

    // Fetch payment records with COLLATE to fix collation mismatch
    // This will match: "11", "Grade 11", "grade 11", "GRADE 11", etc.
    $query = "SELECT * FROM payments 
              WHERE student_id = ? 
              AND (
                  grade_level COLLATE utf8mb4_general_ci = ? 
                  OR grade_level COLLATE utf8mb4_general_ci = ? 
                  OR LOWER(grade_level COLLATE utf8mb4_general_ci) = LOWER(?)
                  OR LOWER(grade_level COLLATE utf8mb4_general_ci) = CONCAT('grade ', ?)
              )
              ORDER BY payment_id DESC";
    
    $stmt = $conn->prepare($query);
    
    if ($stmt === false) {
        throw new Exception("Payment query preparation failed: " . $conn->error);
    }

    $grade_with_prefix = "Grade " . $grade_number;
    $stmt->bind_param("issss", $student_id, $grade_number, $current_grade_level, $grade_with_prefix, $grade_number);
    
    if (!$stmt->execute()) {
        throw new Exception("Payment query execution failed: " . $stmt->error);
    }
    
    $result = $stmt->get_result();
    $payment_records = [];
    
    if ($result->num_rows > 0) {
        while ($row = $result->fetch_assoc()) {
            $payment_records[] = $row;
        }
    }

    $stmt->close();
    $conn->close();

    echo json_encode([
        "success" => true, 
        "payment_records" => $payment_records,
        "current_grade_level" => $current_grade_level,
        "message" => "Successfully fetched payment records"
    ]);

} catch (Exception $e) {
    error_log("Error in fetch_payment_records.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        "success" => false, 
        "message" => "Server error: " . $e->getMessage()
    ]);
    
    if (isset($stmt)) {
        $stmt->close();
    }
    if (isset($conn)) {
        $conn->close();
    }
}
?>