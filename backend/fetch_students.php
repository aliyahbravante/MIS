<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

$servername = "localhost";
$username = "u572625467_group_v";  // Your Hostinger database username
$password = "Northills_12345";   // Replace with your actual password
$dbname = "u572625467_northilscoa";  // Your Hostinger database name

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database connection failed."]);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Get the grade_level parameter and extract the numeric part
    $grade_level_raw = isset($_GET['grade_level']) ? $_GET['grade_level'] : '11';
    $grade_level = intval($grade_level_raw); // Convert to an integer (expects raw input as '11' or '12')

    // Query to match only the numeric part of the grade_level column
    $sql = "SELECT f.student_id, p.first_name, p.last_name, p.email, e.strand_track, e.grade_level, e.section 
            FROM finalstep f
            JOIN personalinfo p ON f.student_id = p.student_id
            JOIN enrollmentdata e ON f.student_id = e.student_id
            WHERE f.status = 'APPROVE' AND CAST(SUBSTRING_INDEX(e.grade_level, ' ', -1) AS UNSIGNED) = ?";

    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $grade_level);
    $stmt->execute();
    $result = $stmt->get_result();

    $students = [];

    while ($row = $result->fetch_assoc()) {
        $students[] = $row;
    }

    echo json_encode(["success" => true, "students" => $students]);
} else {
    echo json_encode(["success" => false, "message" => "Invalid request method."]);
}

$conn->close();
?>
