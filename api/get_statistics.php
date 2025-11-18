<?php
require_once 'config.php';

$conn = getDBConnection();

// Hitung statistik berdasarkan status
$sql = "SELECT 
    status,
    COUNT(*) as jumlah,
    AVG(kelembapan) as rata_rata_kelembapan,
    MIN(kelembapan) as min_kelembapan,
    MAX(kelembapan) as max_kelembapan
FROM sensor_data
GROUP BY status";

$result = $conn->query($sql);

$statistics = [];
while ($row = $result->fetch_assoc()) {
    $statistics[$row['status']] = [
        'jumlah' => intval($row['jumlah']),
        'rata_rata' => round(floatval($row['rata_rata_kelembapan']), 2),
        'min' => intval($row['min_kelembapan']),
        'max' => intval($row['max_kelembapan'])
    ];
}

// Total data
$sql_total = "SELECT COUNT(*) as total FROM sensor_data";
$result_total = $conn->query($sql_total);
$total = $result_total->fetch_assoc()['total'];

echo json_encode([
    'success' => true,
    'total_data' => intval($total),
    'statistics' => $statistics
]);

$conn->close();
?>