<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

$servername = "localhost";
$username = "u572625467_group_v";
$password = "Northills_12345";
$dbname = "u572625467_northillscoa";

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database connection failed."]);
    exit();
}

$student_id = isset($_GET['student_id']) ? intval($_GET['student_id']) : null;

if (!$student_id) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Missing student_id parameter"]);
    exit();
}

// Get the student's current grade level from enrollmentdata
$gradeQuery = "SELECT grade_level FROM enrollmentdata WHERE student_id = ? ORDER BY enrollment_id DESC LIMIT 1";
$gradeStmt = $conn->prepare($gradeQuery);
$gradeStmt->bind_param("i", $student_id);
$gradeStmt->execute();
$gradeResult = $gradeStmt->get_result();

if ($gradeResult->num_rows === 0) {
    echo json_encode(["success" => false, "message" => "Student grade level not found", "grades" => []]);
    $gradeStmt->close();
    $conn->close();
    exit();
}

$gradeRow = $gradeResult->fetch_assoc();
$currentGradeLevel = $gradeRow['grade_level'];
$gradeStmt->close();

// Fetch grades ONLY for the student's current grade level
$query = "SELECT grade_id, subject_id, student_id, first_quarter, second_quarter, final_grade, semester, remarks, student_grade_level
          FROM grades 
          WHERE student_id = ? AND student_grade_level = ?";
$stmt = $conn->prepare($query);
$stmt->bind_param("is", $student_id, $currentGradeLevel);
$stmt->execute();
$result = $stmt->get_result();

$grades = [];
if ($result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        $grades[] = $row;
    }
}

echo json_encode([
    "success" => true, 
    "grades" => $grades,
    "current_grade_level" => $currentGradeLevel
]);

$stmt->close();
$conn->close();
?>