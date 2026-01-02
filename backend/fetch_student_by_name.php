<?php
// Disable displaying errors in the output
ini_set('display_errors', 0);
error_reporting(E_ALL);

// Log errors to a file instead
ini_set('log_errors', 1);
ini_set('error_log', 'student_fetch_error.log');

// Set CORS headers
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    // Database connection setup
    $servername = "localhost";
    $username = "u572625467_group_v"; 
    $password = "Northills_12345";
    $dbname = "u572625467_northillscoa";

    $conn = new mysqli($servername, $username, $password, $dbname);

    // Check the database connection
    if ($conn->connect_error) {
        throw new Exception("Database connection failed: " . $conn->connect_error);
    }

    // Get input data
    $data = json_decode(file_get_contents("php://input"), true);
    
    if (!$data || !isset($data['name']) || empty(trim($data['name']))) {
        throw new Exception("Student name is required.");
    }

    $studentName = trim($data['name']);
    
    // Split the name into parts to search for first_name and last_name
    $nameParts = explode(' ', $studentName);
    
    if (count($nameParts) < 2) {
        echo json_encode([
            "success" => false, 
            "message" => "Please enter complete name (first and last name)."
        ]);
        exit();
    }

    // Assume first part is first_name and last part is last_name
    $firstName = $nameParts[0];
    $lastName = end($nameParts);
    
    // If there are middle names, include them in the search
    $fullFirstName = implode(' ', array_slice($nameParts, 0, -1));
    
    error_log("Searching for student - First: $firstName, Last: $lastName, Full First: $fullFirstName");

    // Search for student in personalinfo table - looking for GRADE 11 students
    $studentQuery = "
        SELECT 
            p.student_id,
            p.first_name,
            p.last_name,
            p.email,
            p.contact_number,
            COALESCE(e.strand_track, 'N/A') AS strand_track,
            e.grade_level as current_grade_level
        FROM personalinfo p
        LEFT JOIN enrollmentdata e ON p.student_id = e.student_id
        WHERE (
            (LOWER(p.first_name) LIKE LOWER(?) AND LOWER(p.last_name) LIKE LOWER(?))
            OR
            (LOWER(CONCAT(p.first_name, ' ', p.last_name)) LIKE LOWER(?))
            OR
            (LOWER(CONCAT(p.last_name, ' ', p.first_name)) LIKE LOWER(?))
        )
        AND e.grade_level = 'Grade 11'
        LIMIT 1
    ";

    $stmt = $conn->prepare($studentQuery);
    
    if (!$stmt) {
        throw new Exception("Failed to prepare student query: " . $conn->error);
    }
    
    $searchFirstName = "%$firstName%";
    $searchLastName = "%$lastName%";
    $searchFullName = "%$studentName%";
    
    $stmt->bind_param("ssss", $searchFirstName, $searchLastName, $searchFullName, $searchFullName);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        echo json_encode([
            "success" => false, 
            "message" => "No Grade 11 student found with that name. Only Grade 11 students can enroll in Grade 12. Please check the spelling and try again."
        ]);
        $stmt->close();
        $conn->close();
        exit();
    }

    $studentData = $result->fetch_assoc();
    $strandTrack = $studentData['strand_track'];
    $studentId = $studentData['student_id'];
    
    error_log("Found Grade 11 student - ID: " . $studentId . ", Strand: $strandTrack");

    // Check if student is already enrolled in Grade 12
    $checkGrade12Query = "
        SELECT grade_level, section, strand_track 
        FROM enrollmentdata 
        WHERE student_id = ? AND grade_level = 'Grade 12'
    ";
    
    $checkStmt = $conn->prepare($checkGrade12Query);
    if (!$checkStmt) {
        throw new Exception("Failed to prepare Grade 12 check query: " . $conn->error);
    }
    
    $checkStmt->bind_param("i", $studentId);
    $checkStmt->execute();
    $grade12Result = $checkStmt->get_result();
    
    if ($grade12Result->num_rows > 0) {
        // Student is already enrolled in Grade 12
        $grade12Data = $grade12Result->fetch_assoc();
        
        echo json_encode([
            "success" => false,
            "message" => "Student is already enrolled in Grade 12",
            "already_enrolled" => true,
            "current_enrollment" => [
                "grade_level" => "Grade 12",
                "section" => $grade12Data['section'],
                "strand" => $grade12Data['strand_track']
            ],
            "student_data" => [
                "student_id" => $studentData['student_id'],
                "first_name" => $studentData['first_name'],
                "last_name" => $studentData['last_name'],
                "email" => $studentData['email'],
                "contact_number" => $studentData['contact_number'],
                "current_grade" => "Grade 11",
                "strand_track" => $strandTrack
            ]
        ]);
        
        $checkStmt->close();
        $stmt->close();
        $conn->close();
        exit();
    }
    
    $checkStmt->close();

    // Check if student has unpaid balance from Grade 11
    $balanceCheckQuery = "
        SELECT balance, total_fee, amount_paid 
        FROM payments 
        WHERE student_id = ? 
        AND (grade_level = 'Grade 11' OR grade_level = '11')
        ORDER BY payment_id DESC 
        LIMIT 1
    ";
    
    $balanceStmt = $conn->prepare($balanceCheckQuery);
    if (!$balanceStmt) {
        throw new Exception("Failed to prepare balance check query: " . $conn->error);
    }
    
    $balanceStmt->bind_param("i", $studentId);
    $balanceStmt->execute();
    $balanceResult = $balanceStmt->get_result();
    
    $hasUnpaidBalance = false;
    $currentBalance = 0;
    $totalFee = 0;
    
    if ($balanceResult->num_rows > 0) {
        $balanceData = $balanceResult->fetch_assoc();
        $currentBalance = floatval($balanceData['balance']);
        $totalFee = floatval($balanceData['total_fee']);
        
        // Check if there's an unpaid balance (balance > 0)
        if ($currentBalance > 0) {
            $hasUnpaidBalance = true;
        }
    } else {
        // No payment records found - check if there's a default total fee
        // If no payment record exists, we assume they need to pay first
        // You might want to adjust this logic based on your business rules
        // For now, we'll allow enrollment if no payment record exists
        $hasUnpaidBalance = false;
    }
    
    $balanceStmt->close();
    
    // If student has unpaid balance, prevent enrollment
    if ($hasUnpaidBalance) {
        $formattedBalance = "₱" . number_format($currentBalance, 2);
        echo json_encode([
            "success" => false,
            "message" => "Cannot enroll. You have an unpaid balance of " . $formattedBalance . " from Grade 11. Please pay your balance of " . $formattedBalance . " first or contact the administrator to resolve this before enrolling in Grade 12.",
            "has_balance" => true,
            "balance" => $currentBalance,
            "formatted_balance" => $formattedBalance,
            "total_fee" => $totalFee
        ]);
        $stmt->close();
        $conn->close();
        exit();
    }

    // Student is not enrolled in Grade 12 yet, so fetch available sections for Grade 12 based on their strand
    // UPDATED: Added "AND slots > 0" to only get sections with available slots
    $sectionsQuery = "
        SELECT section, slots 
        FROM strands 
        WHERE strand = ? AND grade = '12' AND slots > 0
        ORDER BY section
    ";
    
    $sectionsStmt = $conn->prepare($sectionsQuery);
    
    if (!$sectionsStmt) {
        throw new Exception("Failed to prepare sections query: " . $conn->error);
    }
    
    $sectionsStmt->bind_param("s", $strandTrack);
    $sectionsStmt->execute();
    $sectionsResult = $sectionsStmt->get_result();

    $sections = [];
    
    while ($row = $sectionsResult->fetch_assoc()) {
        $sections[] = [
            'section' => $row['section'],
            'slots' => intval($row['slots']),
            'display' => $row['section'] . ' (' . $row['slots'] . ' slots available)',
            'available' => intval($row['slots']) > 0
        ];
    }

    // If no sections found for the specific strand, get default Grade 12 sections with available slots
    if (empty($sections)) {
        // UPDATED: Added "AND slots > 0" to only get sections with available slots
        $defaultSectionsQuery = "
            SELECT DISTINCT section, slots 
            FROM strands 
            WHERE grade = '12' AND slots > 0
            ORDER BY section
        ";
        
        $defaultResult = $conn->query($defaultSectionsQuery);
        
        if ($defaultResult) {
            while ($row = $defaultResult->fetch_assoc()) {
                $sections[] = [
                    'section' => $row['section'],
                    'slots' => intval($row['slots']),
                    'display' => $row['section'] . ' (' . $row['slots'] . ' slots available)',
                    'available' => intval($row['slots']) > 0
                ];
            }
        }
    }

    // Since we're already filtering in the query, we don't need this filter anymore
    // But keeping it as extra safety measure
    $availableSections = array_filter($sections, function($section) {
        return $section['available'] && $section['slots'] > 0;
    });

    // Re-index the array
    $availableSections = array_values($availableSections);

    // Get strand description
    $strandDescQuery = "SELECT description FROM strands WHERE strand = ? LIMIT 1";
    $strandDescStmt = $conn->prepare($strandDescQuery);
    $strandDescription = "N/A";
    
    if ($strandDescStmt) {
        $strandDescStmt->bind_param("s", $strandTrack);
        $strandDescStmt->execute();
        $strandDescResult = $strandDescStmt->get_result();
        
        if ($strandDescResult->num_rows > 0) {
            $strandDescData = $strandDescResult->fetch_assoc();
            $strandDescription = $strandDescData['description'];
        }
        $strandDescStmt->close();
    }

    echo json_encode([
        "success" => true,
        "student_data" => [
            "student_id" => $studentData['student_id'],
            "first_name" => $studentData['first_name'],
            "last_name" => $studentData['last_name'],
            "email" => $studentData['email'],
            "contact_number" => $studentData['contact_number'],
            "strand_track" => $strandTrack,
            "strand_description" => $strandDescription,
            "current_grade" => "Grade 11",
            "target_grade" => "Grade 12"
        ],
        "available_sections" => $availableSections
    ]);
    
    $sectionsStmt->close();
    $stmt->close();
    
} catch (Exception $e) {
    // Log the error
    error_log("Error in fetch_student_by_name.php: " . $e->getMessage());
    
    // Return JSON error response
    echo json_encode([
        "success" => false, 
        "message" => "An error occurred while fetching student data: " . $e->getMessage()
    ]);
} finally {
    // Close database connection if it exists
    if (isset($conn)) {
        $conn->close();
    }
}
?>