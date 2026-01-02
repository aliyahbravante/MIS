<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    // Respond to preflight requests with success
    http_response_code(200);
    exit();
}

$servername = "localhost";
$username = "u572625467_group_v";  // Your Hostinger database username
$password = "Northills_12345";   // Replace with your actual password
$dbname = "u572625467_northillscoa";  // Your Hostinger database name

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database connection failed: " . $conn->connect_error]);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $faculty_id = isset($_GET['faculty_id']) ? intval($_GET['faculty_id']) : 0;

    if ($faculty_id === 0) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Invalid faculty ID."]);
        exit();
    }

    // Query to count the number of subjects handled by the faculty
    $stmt = $conn->prepare("SELECT COUNT(*) AS totalSubjects FROM subjects WHERE faculty_id = ?");
    $stmt->bind_param("i", $faculty_id);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 1) {
        $row = $result->fetch_assoc();
        http_response_code(200);
        echo json_encode([
            "success" => true,
            "totalSubjects" => $row['totalSubjects'] // Return the total number of subjects
        ]);
    } else {
        http_response_code(404);
        echo json_encode(["success" => false, "message" => "No subjects found for this faculty."]);
    }

    $stmt->close();
}

$conn->close();
?>