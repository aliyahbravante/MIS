<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Error reporting for debugging
error_reporting(0); // Turn off error reporting in production
ini_set('display_errors', 0); // Don't display errors in the response

$servername = "localhost";
$username = "u572625467_group_v";
$password = "Northills_12345";
$dbname = "u572625467_northillscoa";

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database connection failed."]);
    exit();
}

// Get JSON data
$json = file_get_contents('php://input');
$data = json_decode($json);

// Check if email and password are provided
if (!isset($data->email) || !isset($data->password)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Email and password are required."]);
    exit();
}

$email = $conn->real_escape_string($data->email);
$password = $data->password;

// Check credentials
$stmt = $conn->prepare("SELECT faculty_id, email FROM faculty WHERE email = ?");
if (!$stmt) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database query failed: " . $conn->error]);
    exit();
}

$stmt->bind_param("s", $email);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 1) {
    $row = $result->fetch_assoc();
    
    // In a real application, you should verify hashed passwords
    // For testing purposes, accepting "facultypass" as a universal password
    if ($password === "facultypass") {
        http_response_code(200);
        echo json_encode([
            "success" => true,
            "message" => "Login successful.",
            "faculty_id" => $row['faculty_id']
        ]);
    } else {
        http_response_code(401);
        echo json_encode(["success" => false, "message" => "Invalid email or password."]);
    }
} else {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "Invalid email or password."]);
}

$stmt->close();
$conn->close();
?>