<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Handle OPTIONS preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200); // Respond OK to preflight
    exit();
}

// Database credentials
$servername = "localhost";
$username = "u572625467_group_v";  // Your Hostinger database username
$password = "Northills_12345";   // Replace with your actual password
$dbname = "u572625467_northillscoa";  // Your Hostinger database name

// Connect to the database
$conn = new mysqli($servername, $username, $password, $dbname);

// Check database connection
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database connection failed: " . $conn->connect_error]);
    exit();
}

// Handle search parameters if provided
$search = isset($_GET['search']) ? $_GET['search'] : '';
$field = isset($_GET['field']) ? $_GET['field'] : '';
$municipality = isset($_GET['municipality']) ? $_GET['municipality'] : '';
$province = isset($_GET['province']) ? $_GET['province'] : '';

// Base query to get location data
$query = "SELECT DISTINCT barangay, municipality, province FROM location";

// Build WHERE clause based on parameters
$whereConditions = [];

if (!empty($search) && !empty($field)) {
    if ($field === 'barangay' || $field === 'municipality' || $field === 'province') {
        $search = $conn->real_escape_string($search);
        $whereConditions[] = "$field LIKE '%$search%'";
    }
}

if (!empty($municipality)) {
    $municipality = $conn->real_escape_string($municipality);
    $whereConditions[] = "municipality = '$municipality'";
}

if (!empty($province)) {
    $province = $conn->real_escape_string($province);
    $whereConditions[] = "province = '$province'";
}

// Add WHERE clause if conditions exist
if (!empty($whereConditions)) {
    $query .= " WHERE " . implode(" AND ", $whereConditions);
}

$query .= " ORDER BY province, municipality, barangay";

// Execute query
$result = $conn->query($query);

if ($result) {
    $locations = [];
    while ($row = $result->fetch_assoc()) {
        $locations[] = $row;
    }
    
    echo json_encode(["success" => true, "locations" => $locations]);
} else {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Error fetching locations: " . $conn->error]);
}

// Close the database connection
$conn->close();
?>