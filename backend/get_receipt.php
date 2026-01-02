<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

// Enable error reporting for debugging (optional for development only)
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Database connection
$servername = "localhost";
$username = "u572625467_group_v";  // Your Hostinger database username
$password = "Northills_12345";   // Replace with your actual password
$dbname = "u572625467_northillscoa";  // Your Hostinger database name

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    echo json_encode(["success" => false, "message" => "Database connection failed: " . $conn->connect_error]);
    exit();
}

// Fetch the latest receipt number
$query = "SELECT MAX(CAST(receipt_number AS UNSIGNED)) AS receiptNumber FROM payments";
$result = $conn->query($query);

if ($result && $row = $result->fetch_assoc()) {
    $latestReceipt = $row['receiptNumber'] ? str_pad((int)$row['receiptNumber'] + 1, 5, "0", STR_PAD_LEFT) : "00001";
    echo json_encode(["success" => true, "receiptNumber" => $latestReceipt]);
} else {
    echo json_encode(["success" => false, "message" => "Failed to fetch receipt number."]);
}

$conn->close();
?>
