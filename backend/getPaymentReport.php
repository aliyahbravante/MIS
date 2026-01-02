<?php
// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

// Database connection
$servername = "localhost";
$username = "u572625467_group_v";  // Your Hostinger database username
$password = "Northills_12345";   // Replace with your actual password
$dbname = "u572625467_northilscoa";  // Your Hostinger database name

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    echo json_encode(["success" => false, "message" => "Database connection failed: " . $conn->connect_error]);
    exit();
}

// Validate and retrieve the student_id from the request
if (isset($_GET['student_id']) && !empty($_GET['student_id'])) {
    $student_id = $conn->real_escape_string($_GET['student_id']); // Sanitize input

    // Fetch payments for the specific student_id
    $query = "SELECT * FROM payments WHERE student_id = '$student_id'";
    $result = $conn->query($query);

    if ($result && $result->num_rows > 0) {
        $payments = [];
        while ($row = $result->fetch_assoc()) {
            $payments[] = $row;
        }
        echo json_encode(["success" => true, "payments" => $payments]);
    } else {
        echo json_encode(["success" => false, "message" => "No payments found for the specified student_id."]);
    }
} else {
    echo json_encode(["success" => false, "message" => "Invalid or missing student_id."]);
}

// Close the database connection
$conn->close();
?>
