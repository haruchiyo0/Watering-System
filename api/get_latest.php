<?php
require_once 'config.php';

$conn = getDBConnection();

$sql = "SELECT * FROM sensor_data ORDER BY id DESC LIMIT 1";
$result = $conn->query($sql);

if ($result->num_rows > 0) {
    $row = $result->fetch_assoc();
    echo json_encode([
        'success' => true,
        'data' => [
            'id' => $row['id'],
            'kelembapan' => intval($row['kelembapan']),
            'status' => $row['status'],
            'waktu' => $row['waktu'],
            'pump_duration' => getPumpDuration($row['status'])
        ]
    ]);
} else {
    echo json_encode([
        'success' => false,
        'message' => 'Tidak ada data'
    ]);
}

$conn->close();
?>