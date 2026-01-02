<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$servername = "localhost";
$username = "u572625467_group_v";  // Your Hostinger database username
$password = "Northills_12345";   // Replace with your actual password
$dbname = "u572625467_northillscoa";  // Your Hostinger database name

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    echo json_encode(["success" => false, "message" => "Database connection failed."]);
    exit();
}

$data = json_decode(file_get_contents("php://input"));

if (!$data || !isset($data->email)) {
    echo json_encode(["success" => false, "message" => "Incomplete data provided."]);
    exit();
}

$email = $conn->real_escape_string($data->email);

// Fetch student_id if the email exists in personalinfo
$stmt = $conn->prepare("SELECT student_id FROM personalinfo WHERE email = ?");
$stmt->bind_param("s", $email);
$stmt->execute();
$stmt->store_result();

if ($stmt->num_rows > 0) {
    $stmt->bind_result($student_id);
    $stmt->fetch();
    echo json_encode(["success" => true, "message" => "Email exists in personalinfo.", "student_id" => $student_id]);
} else {
    echo json_encode(["success" => false, "message" => "Email not found in personalinfo."]);
}

$stmt->close();
$conn->close();
?>
