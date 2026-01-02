<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

// Database credentials
$servername = "localhost";
$username = "u572625467_group_v";  // Your Hostinger database username
$password = "Northills_12345";   // Replace with your actual password
$dbname = "u572625467_northillscoa";  // Your Hostinger database name

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    echo json_encode(["success" => false, "message" => "Connection failed: " . $conn->connect_error]);
    exit();
}

$query = "SELECT strand FROM strands"; // Adjust the field name as per your database
$result = $conn->query($query);

if ($result->num_rows > 0) {
    $strands = [];
    while ($row = $result->fetch_assoc()) {
        $strands[] = $row;
    }
    echo json_encode(["success" => true, "strands" => $strands]);
} else {
    echo json_encode(["success" => false, "message" => "No strands found."]);
}

$conn->close();
?>
