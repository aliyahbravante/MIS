<?php
// Completely disable displaying errors in the output
ini_set('display_errors', 0);
error_reporting(E_ALL);

// Log errors to a file instead
ini_set('log_errors', 1);
ini_set('error_log', 'section_error.log');

// Set CORS headers
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Wrap everything in a try-catch to prevent PHP errors from being displayed
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

    // Validate and get the student_id from the request
    $student_id = isset($_GET['student_id']) ? $_GET['student_id'] : null;

    if (!$student_id) {
        throw new Exception("Invalid or missing student_id.");
    }

    // Log the incoming request
    error_log("Processing request for student_id: $student_id");

    // Fetch the strand_track and grade_level of the student
    $studentQuery = "SELECT strand_track, grade_level FROM enrollmentdata WHERE student_id = ?";
    $stmt = $conn->prepare($studentQuery);
    
    if (!$stmt) {
        throw new Exception("Failed to prepare student query: " . $conn->error);
    }
    
    $stmt->bind_param("i", $student_id);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        error_log("No enrollment data found for student_id: $student_id");
        echo json_encode(["success" => false, "message" => "No enrollment data found for the student_id."]);
        $stmt->close();
        $conn->close();
        exit();
    }

    $studentData = $result->fetch_assoc();
    $strandTrack = $studentData['strand_track'];
    $gradeLevel = $studentData['grade_level'];

    error_log("Student data - Strand: $strandTrack, Grade: $gradeLevel");

    // Extract the numeric part from grade_level (e.g., "Grade 11" -> "11")
    preg_match('/\d+/', $gradeLevel, $matches);
    $grade = $matches[0] ?? null;

    if (!$grade) {
        throw new Exception("Invalid grade_level format: $gradeLevel");
    }

    // Extract the prefix (e.g., ABM) from the strand_track
    $strandPrefix = strtok($strandTrack, " ");

    error_log("Extracted data - Grade: $grade, Strand Prefix: $strandPrefix");

    // Query to get sections with their slot information for the specific strand and grade
    $strandsQuery = "SELECT section, slots FROM strands WHERE strand = ? AND grade = ?";
    $stmt = $conn->prepare($strandsQuery);
    
    if (!$stmt) {
        throw new Exception("Failed to prepare strands query: " . $conn->error);
    }
    
    $stmt->bind_param("ss", $strandTrack, $grade);
    $stmt->execute();
    $result = $stmt->get_result();

    $sectionsWithSlots = [];
    $sections = []; // For backward compatibility
    
    while ($row = $result->fetch_assoc()) {
        $sections[] = $row['section']; // For backward compatibility
        $sectionsWithSlots[] = [
            'section' => $row['section'],
            'slots' => intval($row['slots']),
            'display' => $row['section'] . ' (' . $row['slots'] . ' slots available)',
            'available' => intval($row['slots']) > 0
        ];
    }

    // If no exact match found, try an alternative query
    if (empty($sectionsWithSlots)) {
        // Try a different approach - get all sections for that grade
        $altQuery = "SELECT section, slots FROM strands WHERE grade = ?";
        $stmt = $conn->prepare($altQuery);
        
        if ($stmt) {
            $stmt->bind_param("s", $grade);
            $stmt->execute();
            $result = $stmt->get_result();
            
            while ($row = $result->fetch_assoc()) {
                $sections[] = $row['section']; // For backward compatibility
                $sectionsWithSlots[] = [
                    'section' => $row['section'],
                    'slots' => intval($row['slots']),
                    'display' => $row['section'] . ' (' . $row['slots'] . ' slots available)',
                    'available' => intval($row['slots']) > 0
                ];
            }
        }
    }

    // If still empty, use defaults
    if (empty($sectionsWithSlots)) {
        // Fallback to provide default sections if none found in database
        $defaultSections = ["Section A", "Section B", "Section C"];
        foreach ($defaultSections as $section) {
            $sections[] = $section; // For backward compatibility
            $sectionsWithSlots[] = [
                'section' => $section,
                'slots' => 30, // Default slot count
                'display' => $section . ' (30 slots available)',
                'available' => true
            ];
        }
        error_log("No sections found, using default sections");
    }

    // Filter out sections with 0 slots for the main response
    $availableSections = array_filter($sectionsWithSlots, function($section) {
        return $section['available'];
    });

    // Re-index the array to ensure proper JSON encoding
    $availableSections = array_values($availableSections);

    echo json_encode([
        "success" => true, 
        "sections" => $sections, // For backward compatibility
        "sections_with_slots" => $availableSections, // New format with slot information
        "all_sections" => $sectionsWithSlots // All sections including those with 0 slots
    ]);
    
} catch (Exception $e) {
    // Log the error
    error_log("Error in fetch_strandSection.php: " . $e->getMessage());
    
    // Always return JSON, even for errors
    echo json_encode([
        "success" => false, 
        "message" => "An error occurred while fetching sections: " . $e->getMessage(),
        "sections" => [],
        "sections_with_slots" => [],
        "all_sections" => []
    ]);
} finally {
    // Close database connection if it exists
    if (isset($stmt)) {
        $stmt->close();
    }
    if (isset($conn)) {
        $conn->close();
    }
}
?>