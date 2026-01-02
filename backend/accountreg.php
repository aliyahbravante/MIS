<?php
// Enable error reporting for debugging but consider disabling in production
error_reporting(E_ALL);
ini_set('display_errors', 1);

// CORS headers to handle preflight requests
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Handle preflight request (OPTIONS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Database connection setup
$servername = "localhost";
$username = "u572625467_group_v";  // Updated Hostinger database username
$password = "Northills_12345";   // Updated database password
$dbname = "u572625467_northillscoa";  // Updated database name

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check the database connection
if ($conn->connect_error) {
    error_log("Database connection failed: " . $conn->connect_error);
    http_response_code(500);
    echo json_encode([
        "success" => false, 
        "message" => "Database connection failed. Please try again later."
    ]);
    exit();
}

// Read and decode JSON data from the request
$data = json_decode(file_get_contents("php://input"));

// Validate received data
if (!$data || !isset($data->first_name, $data->last_name, $data->email, $data->password)) {
    error_log("Incomplete data provided in request");
    http_response_code(400);
    echo json_encode([
        "success" => false, 
        "message" => "Incomplete data provided. Please fill in all required fields."
    ]);
    exit();
}

// Sanitize input data
$first_name = $conn->real_escape_string($data->first_name);
$last_name = $conn->real_escape_string($data->last_name);
$email = $conn->real_escape_string($data->email);

// Validate email format
if (!filter_var($email, FILTER_VALIDATE_EMAIL) || !preg_match('/@gmail\.com$/i', $email)) {
    http_response_code(400);
    echo json_encode([
        "success" => false, 
        "message" => "Invalid email format. Please use a valid Gmail address.",
        "error" => "invalid_email"
    ]);
    exit();
}

// Hash the password securely
$password = password_hash($data->password, PASSWORD_DEFAULT);

// Check if the email is already registered
$stmt = $conn->prepare("SELECT * FROM account_registration WHERE email = ?");
if (!$stmt) {
    error_log("Preparation failed for email check: " . $conn->error);
    http_response_code(500);
    echo json_encode([
        "success" => false, 
        "message" => "Database error. Please try again later."
    ]);
    exit();
}

$stmt->bind_param("s", $email);
$stmt->execute();
$emailCheckResult = $stmt->get_result();

if ($emailCheckResult->num_rows > 0) {
    error_log("Account already registered for email: " . $email);
    http_response_code(409); // Conflict status code
    echo json_encode([
        "success" => false, 
        "message" => "An account with this email already exists.",
        "error" => "email_exists"
    ]);
    $stmt->close();
    $conn->close();
    exit();
}
$stmt->close();

// Insert the new account
$stmt = $conn->prepare("INSERT INTO account_registration (first_name, last_name, email, password) VALUES (?, ?, ?, ?)");
if (!$stmt) {
    error_log("Preparation failed for insert statement: " . $conn->error);
    http_response_code(500);
    echo json_encode([
        "success" => false, 
        "message" => "Database error during registration. Please try again later."
    ]);
    exit();
}

$stmt->bind_param("ssss", $first_name, $last_name, $email, $password);

if ($stmt->execute()) {
    error_log("Registration successful for email: " . $email);
    http_response_code(201); // Created status code
    echo json_encode([
        "success" => true, 
        "message" => "Registration successful."
    ]);
} else {
    error_log("Error executing insert statement: " . $stmt->error);
    http_response_code(500);
    echo json_encode([
        "success" => false, 
        "message" => "Error occurred during registration. Please try again later."
    ]);
}

$stmt->close();
$conn->close();
?>