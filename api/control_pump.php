<?php
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['action'])) {
        echo json_encode([
            'success' => false,
            'message' => 'Action tidak ditemukan'
        ]);
        exit;
    }
    
    $action = $input['action']; // 'on' atau 'off'
    $manual = isset($input['manual']) ? $input['manual'] : false;
    
    // Simpan perintah kontrol (bisa disimpan di tabel terpisah atau file)
    // ESP8266 akan polling endpoint ini untuk mendapatkan perintah
    
    $control_data = [
        'pump_status' => $action === 'on' ? 1 : 0,
        'manual_mode' => $manual,
        'timestamp' => date('Y-m-d H:i:s')
    ];
    
    // Simpan ke file untuk dibaca ESP8266
    file_put_contents('pump_control.json', json_encode($control_data));
    
    echo json_encode([
        'success' => true,
        'message' => 'Perintah pompa berhasil dikirim',
        'data' => $control_data
    ]);
} else {
    echo json_encode([
        'success' => false,
        'message' => 'Method tidak diizinkan'
    ]);
}
?>