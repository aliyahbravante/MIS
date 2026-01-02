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

    // Query to fetch grade, strand, and section for the given faculty_id from the subjects table
    $stmt = $conn->prepare("SELECT DISTINCT grade, strand, section
                            FROM subjects
                            WHERE faculty_id = ?");
    
    // Check if the prepare statement was successful
    if ($stmt === false) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Query preparation failed: " . $conn->error]);
        exit();
    }

    $stmt->bind_param("i", $faculty_id);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows > 0) {
        $enrolledStudentsCount = 0;

        // Iterate over each subject to count matching students
        while ($row = $result->fetch_assoc()) {
            $grade = $row['grade'];
            // Extract the first part of strand_track before " - " (e.g., "ABM" from "ABM - Accountancy")
            $strand = explode(" - ", $row['strand'])[0]; 
            $section = $row['section'];

            // Now we need to extract just the numeric grade from the grade_level in enrollmentdata (e.g., "Grade 11" -> 11)
            $countStmt = $conn->prepare("SELECT COUNT(DISTINCT ed.student_id) AS totalEnrolledStudents
                                        FROM enrollmentdata ed
                                        JOIN subjects s ON ed.grade_level LIKE CONCAT('%', s.grade) AND 
                                                           ed.strand_track LIKE CONCAT(s.strand, '%') AND 
                                                           ed.section = s.section
                                        WHERE s.faculty_id = ? AND s.grade = ? AND s.strand = ? AND s.section = ?");
            
            // Check if the second prepare statement was successful
            if ($countStmt === false) {
                http_response_code(500);
                echo json_encode(["success" => false, "message" => "Query preparation failed: " . $conn->error]);
                exit();
            }

            $countStmt->bind_param("isss", $faculty_id, $grade, $strand, $section);
            $countStmt->execute();
            $countResult = $countStmt->get_result();

            if ($countResult->num_rows > 0) {
                $countRow = $countResult->fetch_assoc();
                $enrolledStudentsCount += $countRow['totalEnrolledStudents'];
            }
            $countStmt->close();
        }

        http_response_code(200);
        echo json_encode([
            "success" => true,
            "totalEnrolledStudents" => $enrolledStudentsCount
        ]);
    } else {
        http_response_code(404);
        echo json_encode(["success" => false, "message" => "No matching subjects found for this faculty."]);
    }

    $stmt->close();
}

$conn->close();
?>