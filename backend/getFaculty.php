<?php
// Set headers for CORS and JSON response
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

// Database connection details
$servername = "localhost";
$username = "u572625467_group_v";  // Your Hostinger database username
$password = "Northills_12345";   // Replace with your actual password
$dbname = "u572625467_northillscoa";  // Your Hostinger database name

$conn = new mysqli($servername, $username, $password, $dbname);

// Check database connection
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database connection failed: " . $conn->connect_error]);
    exit();
}

// Get faculty_id from the query parameters
$faculty_id = isset($_GET['faculty_id']) ? intval($_GET['faculty_id']) : 0;

if ($faculty_id == 0) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Faculty ID is required."]);
    exit();
}

// Fetch the faculty details (first name and last name) from the database
$stmt = $conn->prepare("SELECT first_name, last_name FROM facultyinfo WHERE faculty_id = ?");
$stmt->bind_param("i", $faculty_id);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    $row = $result->fetch_assoc();
    http_response_code(200);
    echo json_encode([
        "success" => true,
        "facultyName" => $row['first_name'] . ' ' . $row['last_name']
    ]);
} else {
    http_response_code(404);
    echo json_encode(["success" => false, "message" => "Faculty ID not found."]);
}

// Close the database connection
$stmt->close();
$conn->close();
?>