<?php
require_once 'config.php';

$conn = getDBConnection();

// Ambil parameter limit (default 10)
$limit = isset($_GET['limit']) ? intval($_GET['limit']) : 10;

$sql = "SELECT * FROM sensor_data ORDER BY id DESC LIMIT ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $limit);
$stmt->execute();
$result = $stmt->get_result();

$data = [];
while ($row = $result->fetch_assoc()) {
    $data[] = [
        'id' => $row['id'],
        'kelembapan' => intval($row['kelembapan']),
        'status' => $row['status'],
        'waktu' => $row['waktu']
    ];
}

echo json_encode([
    'success' => true,
    'count' => count($data),
    'data' => $data
]);

$stmt->close();
$conn->close();
?>