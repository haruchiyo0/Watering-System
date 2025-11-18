import React, { useState, useEffect } from 'react';
import { Droplets, Power, Activity, Clock, Database, Wifi, AlertCircle } from 'lucide-react';

export default function SmartWateringDashboard() {
  const [currentData, setCurrentData] = useState({
    id: 0,
    kelembapan: 0,
    suhu: 0,
    status: 'normal',
    waktu: '-'
  });
  
  const [history, setHistory] = useState([]);
  const [pumpStatus, setPumpStatus] = useState(false);
  const [pumpDuration, setPumpDuration] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [manualMode, setManualMode] = useState(false);
  
  // ========== KONFIGURASI API ==========
  // GANTI dengan URL server Anda jika berbeda
  const API_BASE_URL = 'http://localhost/watering/api/';
  
  // ========== MODE DUMMY DATA ==========
  const USE_DUMMY_DATA = true; // Set FALSE jika mau pakai API real
  
  // ========== FETCH DATA DARI API ==========
  const fetchLatestData = async () => {
    // JIKA MODE DUMMY, gunakan data simulasi
    if (USE_DUMMY_DATA) {
      // Simulasi data random
      const randomKelembapan = Math.floor(Math.random() * 100);
      const randomSuhu = 20 + Math.floor(Math.random() * 20); // 20-40°C
      
      let status = 'normal';
      if (randomKelembapan < 40) status = 'kering';
      else if (randomKelembapan >= 70) status = 'basah';
      
      setCurrentData({
        id: Math.floor(Math.random() * 1000),
        kelembapan: randomKelembapan,
        suhu: randomSuhu,
        status: status,
        waktu: new Date().toLocaleString('id-ID')
      });
      
      // Simulasi pump status
      if (!manualMode) {
        if (status === 'kering') {
          setPumpStatus(true);
          setPumpDuration(10);
        } else if (status === 'normal') {
          setPumpStatus(true);
          setPumpDuration(5);
        } else {
          setPumpStatus(false);
          setPumpDuration(0);
        }
      }
      
      setConnectionStatus('connected');
      return;
    }
    
    // KODE API ASLI (dijalankan jika USE_DUMMY_DATA = false)
    try {
      const response = await fetch(API_BASE_URL + 'get_latest.php');
      const result = await response.json();
      
      if (result.success) {
        const data = result.data;
        
        setCurrentData({
          id: data.id,
          kelembapan: data.kelembapan,
          suhu: data.suhu || 28, // Default 28°C jika tidak ada data suhu
          status: data.status,
          waktu: data.waktu
        });
        
        // Update pump status otomatis (jika bukan mode manual)
        if (!manualMode) {
          if (data.pump_duration > 0) {
            setPumpStatus(true);
            setPumpDuration(data.pump_duration);
          } else {
            setPumpStatus(false);
            setPumpDuration(0);
          }
        }
        
        setConnectionStatus('connected');
      } else {
        console.log('No data available:', result.message);
        setConnectionStatus('disconnected');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setConnectionStatus('disconnected');
    }
  };
  
  // Fetch history data
  const fetchHistory = async () => {
    // JIKA MODE DUMMY, gunakan data simulasi
    if (USE_DUMMY_DATA) {
      // Generate 10 data dummy
      const dummyHistory = Array.from({ length: 10 }, (_, i) => {
        const kelembapan = Math.floor(Math.random() * 100);
        const suhu = 20 + Math.floor(Math.random() * 20); // 20-40°C
        let status = 'normal';
        if (kelembapan < 40) status = 'kering';
        else if (kelembapan >= 70) status = 'basah';
        
        const date = new Date();
        date.setMinutes(date.getMinutes() - (i * 5)); // Setiap 5 menit
        
        return {
          id: 10 - i,
          kelembapan: kelembapan,
          suhu: suhu,
          status: status,
          waktu: date.toLocaleString('id-ID')
        };
      });
      
      setHistory(dummyHistory);
      return;
    }
    
    // KODE API ASLI (dijalankan jika USE_DUMMY_DATA = false)
    try {
      const response = await fetch(API_BASE_URL + 'get_history.php?limit=10');
      const result = await response.json();
      
      if (result.success && result.data.length > 0) {
        setHistory(result.data);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };
  
  // Kontrol pompa manual
  const togglePumpManual = async (action) => {
    if (!manualMode) {
      alert('Aktifkan Mode Manual terlebih dahulu!');
      return;
    }
    
    // JIKA MODE DUMMY, langsung update state
    if (USE_DUMMY_DATA) {
      setPumpStatus(action === 'on');
      setPumpDuration(action === 'on' ? 'Manual' : 0);
      return;
    }
    
    // KODE API ASLI (dijalankan jika USE_DUMMY_DATA = false)
    try {
      const response = await fetch(API_BASE_URL + 'control_pump.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: action, manual: true })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setPumpStatus(action === 'on');
        setPumpDuration(action === 'on' ? 'Manual' : 0);
      } else {
        alert('Error: ' + result.message);
      }
    } catch (error) {
      console.error('Error controlling pump:', error);
      alert('Error mengirim perintah ke server');
    }
  };
  
  // ========== LIFECYCLE ==========
  useEffect(() => {
    // Load data pertama kali
    fetchLatestData();
    fetchHistory();
    
    // Auto refresh data setiap 5 detik
    const interval = setInterval(() => {
      fetchLatestData();
    }, 5000);
    
    // Auto refresh history setiap 30 detik
    const historyInterval = setInterval(() => {
      fetchHistory();
    }, 30000);
    
    return () => {
      clearInterval(interval);
      clearInterval(historyInterval);
    };
  }, [manualMode]); // Re-run jika manualMode berubah
  
  // ========== HELPER FUNCTIONS ==========
  
  // Fungsi untuk membuat gauge SVG
  const GaugeMeter = ({ value, max, label, unit, color, icon: Icon }) => {
    const percentage = (value / max) * 100;
    const angle = (percentage / 100) * 180; // 180 derajat untuk setengah lingkaran
    const rotation = angle - 90; // Mulai dari -90 derajat (kiri)
    
    return (
      <div className="flex flex-col items-center">
        <div className="relative w-48 h-24">
          {/* Background Arc */}
          <svg viewBox="0 0 200 100" className="w-full h-full">
            {/* Background track */}
            <path
              d="M 20 90 A 80 80 0 0 1 180 90"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="12"
              strokeLinecap="round"
            />
            {/* Colored arc */}
            <path
              d="M 20 90 A 80 80 0 0 1 180 90"
              fill="none"
              stroke={color}
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={`${(angle / 180) * 251.2} 251.2`}
              className="transition-all duration-700"
            />
            {/* Center circle */}
            <circle cx="100" cy="90" r="8" fill={color} />
            {/* Needle */}
            <line
              x1="100"
              y1="90"
              x2="100"
              y2="20"
              stroke={color}
              strokeWidth="3"
              strokeLinecap="round"
              transform={`rotate(${rotation} 100 90)`}
              className="transition-all duration-700"
            />
          </svg>
          {/* Value display */}
          <div className="absolute inset-0 flex items-end justify-center pb-2">
            <div className="text-center">
              <div className={`text-3xl font-bold ${color === '#ef4444' ? 'text-red-600' : color === '#3b82f6' ? 'text-blue-600' : 'text-orange-600'}`}>
                {value}{unit}
              </div>
            </div>
          </div>
        </div>
        {/* Label */}
        <div className="flex items-center gap-2 mt-2">
          {Icon && <Icon size={18} className="text-gray-600" />}
          <span className="text-sm font-semibold text-gray-700">{label}</span>
        </div>
      </div>
    );
  };
  
  const getStatusColor = (status) => {
    switch(status) {
      case 'kering': return 'bg-red-500';
      case 'normal': return 'bg-yellow-500';
      case 'basah': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };
  
  const getStatusTextColor = (status) => {
    switch(status) {
      case 'kering': return 'text-red-600';
      case 'normal': return 'text-yellow-600';
      case 'basah': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };
  
  const getStatusLabel = (status) => {
    switch(status) {
      case 'kering': return 'KERING - Perlu Penyiraman';
      case 'normal': return 'NORMAL - Kelembapan Cukup';
      case 'basah': return 'BASAH - Tidak Perlu Penyiraman';
      default: return 'UNKNOWN';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-teal-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-4 md:p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-3">
                <Droplets className="text-blue-600" size={36} />
                Smart Watering System
              </h1>
              <p className="text-gray-600 mt-1 text-sm md:text-base">Dashboard Monitoring & Kontrol Pompa</p>
            </div>
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${
                connectionStatus === 'connected' ? 'bg-green-100' : 
                connectionStatus === 'connecting' ? 'bg-yellow-100' : 'bg-red-100'
              }`}>
                <Wifi className={
                  connectionStatus === 'connected' ? 'text-green-600' : 
                  connectionStatus === 'connecting' ? 'text-yellow-600' : 'text-red-600'
                } size={20} />
                <span className={`text-sm font-semibold ${
                  connectionStatus === 'connected' ? 'text-green-700' : 
                  connectionStatus === 'connecting' ? 'text-yellow-700' : 'text-red-700'
                }`}>
                  {USE_DUMMY_DATA ? 'Demo Mode' : (
                    connectionStatus === 'connected' ? 'Online' : 
                    connectionStatus === 'connecting' ? 'Connecting...' : 'Offline'
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Gauge Meters - Kelembapan dan Suhu */}
          <div className="lg:col-span-3 bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Monitoring Real-time</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Gauge Kelembapan Tanah */}
              <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl">
                <GaugeMeter 
                  value={currentData.kelembapan} 
                  max={100} 
                  label="Kelembapan Tanah" 
                  unit="%" 
                  color="#3b82f6"
                  icon={Droplets}
                />
                <div className="mt-4 text-center">
                  <span className={`inline-flex px-4 py-2 text-sm font-semibold rounded-full ${
                    currentData.status === 'kering' ? 'bg-red-100 text-red-700' :
                    currentData.status === 'normal' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {currentData.status.toUpperCase()}
                  </span>
                </div>
              </div>
              
              {/* Gauge Suhu */}
              <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-orange-50 to-red-50 rounded-xl">
                <GaugeMeter 
                  value={currentData.suhu} 
                  max={50} 
                  label="Suhu Greenhouse" 
                  unit="°C" 
                  color="#f97316"
                  icon={Activity}
                />
                <div className="mt-4 text-center">
                  <span className={`inline-flex px-4 py-2 text-sm font-semibold rounded-full ${
                    currentData.suhu < 25 ? 'bg-blue-100 text-blue-700' :
                    currentData.suhu < 32 ? 'bg-green-100 text-green-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {currentData.suhu < 25 ? 'SEJUK' : currentData.suhu < 32 ? 'NORMAL' : 'PANAS'}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Status Kelembapan Tanah */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">Status Kelembapan Tanah</h2>
              <Database className="text-blue-600" size={24} />
            </div>
            
            <div className="grid grid-cols-3 gap-4 mb-6">
              {/* LED Indikator Kering */}
              <div className="flex flex-col items-center">
                <div className={`w-16 h-16 rounded-full mb-3 transition-all duration-300 ${
                  currentData.status === 'kering' ? 'bg-red-500 shadow-lg shadow-red-500/50 animate-pulse' : 'bg-gray-300'
                }`}></div>
                <span className="text-sm font-semibold text-gray-700">KERING</span>
                <span className="text-xs text-gray-500">&lt; 40%</span>
              </div>
              
              {/* LED Indikator Normal */}
              <div className="flex flex-col items-center">
                <div className={`w-16 h-16 rounded-full mb-3 transition-all duration-300 ${
                  currentData.status === 'normal' ? 'bg-yellow-500 shadow-lg shadow-yellow-500/50 animate-pulse' : 'bg-gray-300'
                }`}></div>
                <span className="text-sm font-semibold text-gray-700">NORMAL</span>
                <span className="text-xs text-gray-500">40% - 69%</span>
              </div>
              
              {/* LED Indikator Basah */}
              <div className="flex flex-col items-center">
                <div className={`w-16 h-16 rounded-full mb-3 transition-all duration-300 ${
                  currentData.status === 'basah' ? 'bg-blue-500 shadow-lg shadow-blue-500/50 animate-pulse' : 'bg-gray-300'
                }`}></div>
                <span className="text-sm font-semibold text-gray-700">BASAH</span>
                <span className="text-xs text-gray-500">≥ 70%</span>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-blue-50 to-teal-50 rounded-xl p-6 mb-4">
              <div className="text-center">
                <div className="text-6xl font-bold text-blue-600 mb-2">
                  {currentData.kelembapan}%
                </div>
                <div className={`text-lg font-semibold uppercase ${getStatusTextColor(currentData.status)}`}>
                  {getStatusLabel(currentData.status)}
                </div>
              </div>
              
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div 
                    className={`h-4 rounded-full transition-all duration-500 ${getStatusColor(currentData.status)}`}
                    style={{ width: `${currentData.kelembapan}%` }}
                  ></div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
              <Clock size={16} />
              <span>Terakhir diperbarui: {currentData.waktu}</span>
            </div>
          </div>
          
          {/* Status Pompa Air */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">Pompa Air</h2>
              <Power className={pumpStatus ? 'text-green-600' : 'text-gray-400'} size={24} />
            </div>
            
            <div className="text-center mb-6">
              <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full mb-4 transition-all duration-300 ${
                pumpStatus ? 'bg-green-100 shadow-lg shadow-green-500/30' : 'bg-gray-100'
              }`}>
                <Power className={pumpStatus ? 'text-green-600' : 'text-gray-400'} size={48} />
              </div>
              <div>
                <p className={`text-2xl font-bold mb-1 ${pumpStatus ? 'text-green-600' : 'text-gray-600'}`}>
                  {pumpStatus ? 'AKTIF' : 'MATI'}
                </p>
                {pumpStatus && pumpDuration && (
                  <p className="text-sm text-gray-600">
                    Durasi: {typeof pumpDuration === 'number' ? `${pumpDuration} detik` : pumpDuration}
                  </p>
                )}
              </div>
            </div>
            
            {/* Info Durasi Otomatis */}
            <div className="bg-blue-50 rounded-xl p-4 mb-4">
              <p className="text-sm font-semibold text-blue-900 mb-2">Durasi Otomatis:</p>
              <div className="space-y-1 text-xs text-blue-800">
                <div className="flex justify-between">
                  <span>• Kondisi Kering:</span>
                  <span className="font-semibold">10 detik</span>
                </div>
                <div className="flex justify-between">
                  <span>• Kondisi Normal:</span>
                  <span className="font-semibold">5 detik</span>
                </div>
                <div className="flex justify-between">
                  <span>• Kondisi Basah:</span>
                  <span className="font-semibold">Tidak menyala</span>
                </div>
              </div>
            </div>
            
            {/* Mode Kontrol */}
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-semibold text-gray-700">Mode Manual</span>
                <button
                  onClick={() => setManualMode(!manualMode)}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                    manualMode ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                    manualMode ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
              
              {manualMode && (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => togglePumpManual('on')}
                    disabled={pumpStatus}
                    className={`py-2 px-4 rounded-lg font-semibold text-sm transition-all ${
                      pumpStatus 
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-green-500 hover:bg-green-600 text-white'
                    }`}
                  >
                    NYALAKAN
                  </button>
                  <button
                    onClick={() => togglePumpManual('off')}
                    disabled={!pumpStatus}
                    className={`py-2 px-4 rounded-lg font-semibold text-sm transition-all ${
                      !pumpStatus 
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-red-500 hover:bg-red-600 text-white'
                    }`}
                  >
                    MATIKAN
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Chart Kelembapan dan Suhu */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800">Grafik Monitoring Real-time</h2>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-1 bg-blue-500 rounded"></div>
                <span className="text-sm text-gray-600">Kelembapan (%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-1 bg-orange-500 rounded"></div>
                <span className="text-sm text-gray-600">Suhu (°C)</span>
              </div>
            </div>
          </div>
          
          <div className="relative h-80">
            {/* Background Grid */}
            <div className="absolute inset-0 flex flex-col justify-between">
              {[100, 80, 60, 40, 20, 0].map((val) => (
                <div key={val} className="flex items-center">
                  <span className="text-xs text-gray-400 w-10 text-right">{val}</span>
                  <div className="flex-1 border-t border-gray-200 ml-2"></div>
                </div>
              ))}
            </div>
            
            {/* SVG Chart */}
            <svg className="absolute inset-0 w-full h-full" style={{ paddingLeft: '48px', paddingRight: '16px' }}>
              {/* Area fill untuk kelembapan */}
              <defs>
                <linearGradient id="kelembapanGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.15" />
                </linearGradient>
                <linearGradient id="suhuGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#f97316" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#f97316" stopOpacity="0.15" />
                </linearGradient>
              </defs>
              
              {/* Area Kelembapan */}
              <polygon
                fill="url(#kelembapanGradient)"
                points={
                  history.slice(0, 10).reverse().map((item, index) => {
                    const x = (index / 9) * 100;
                    const y = 100 - item.kelembapan;
                    return `${x}%,${y}%`;
                  }).join(' ') + ` 100%,100% 0%,100%`
                }
              />
              
              {/* Line Kelembapan */}
              <polyline
                fill="none"
                stroke="#3b82f6"
                strokeWidth="4"
                strokeOpacity="0.9"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={history.slice(0, 10).reverse().map((item, index) => {
                  const x = (index / 9) * 100;
                  const y = 100 - item.kelembapan;
                  return `${x}%,${y}%`;
                }).join(' ')}
                className="drop-shadow-lg"
              />
              
              {/* Area Suhu (scaled to 0-100) */}
              <polygon
                fill="url(#suhuGradient)"
                points={
                  history.slice(0, 10).reverse().map((item, index) => {
                    const x = (index / 9) * 100;
                    const y = 100 - ((item.suhu / 50) * 100); // Scale 0-50°C to 0-100%
                    return `${x}%,${y}%`;
                  }).join(' ') + ` 100%,100% 0%,100%`
                }
              />
              
              {/* Line Suhu */}
              <polyline
                fill="none"
                stroke="#f97316"
                strokeWidth="4"
                strokeOpacity="0.9"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={history.slice(0, 10).reverse().map((item, index) => {
                  const x = (index / 9) * 100;
                  const y = 100 - ((item.suhu / 50) * 100);
                  return `${x}%,${y}%`;
                }).join(' ')}
                className="drop-shadow-lg"
              />
              
              {/* Data points Kelembapan */}
              {history.slice(0, 10).reverse().map((item, index) => {
                const x = (index / 9) * 100;
                const y = 100 - item.kelembapan;
                
                return (
                  <g key={`kelembapan-${index}`}>
                    <circle
                      cx={`${x}%`}
                      cy={`${y}%`}
                      r="5"
                      fill="#3b82f6"
                      stroke="white"
                      strokeWidth="2"
                      className="cursor-pointer hover:r-7 transition-all drop-shadow-md"
                    />
                  </g>
                );
              })}
              
              {/* Data points Suhu */}
              {history.slice(0, 10).reverse().map((item, index) => {
                const x = (index / 9) * 100;
                const y = 100 - ((item.suhu / 50) * 100);
                
                return (
                  <g key={`suhu-${index}`}>
                    <circle
                      cx={`${x}%`}
                      cy={`${y}%`}
                      r="5"
                      fill="#f97316"
                      stroke="white"
                      strokeWidth="2"
                      className="cursor-pointer hover:r-7 transition-all drop-shadow-md"
                    />
                  </g>
                );
              })}
              
              {/* Tooltip boxes on hover */}
              {history.slice(0, 10).reverse().map((item, index) => {
                const x = (index / 9) * 100;
                const yKelembapan = 100 - item.kelembapan;
                const ySuhu = 100 - ((item.suhu / 50) * 100);
                
                return (
                  <g key={`tooltip-${index}`} className="opacity-0 hover:opacity-100 transition-opacity">
                    {/* Tooltip Kelembapan */}
                    <rect
                      x={`${x}%`}
                      y={`${yKelembapan - 12}%`}
                      width="60"
                      height="24"
                      rx="4"
                      fill="#3b82f6"
                      transform="translate(-30, -20)"
                    />
                    <text
                      x={`${x}%`}
                      y={`${yKelembapan - 6}%`}
                      textAnchor="middle"
                      className="text-xs font-bold fill-white"
                      transform="translate(0, -20)"
                    >
                      {item.kelembapan}%
                    </text>
                    
                    {/* Tooltip Suhu */}
                    <rect
                      x={`${x}%`}
                      y={`${ySuhu - 12}%`}
                      width="60"
                      height="24"
                      rx="4"
                      fill="#f97316"
                      transform="translate(-30, -50)"
                    />
                    <text
                      x={`${x}%`}
                      y={`${ySuhu - 6}%`}
                      textAnchor="middle"
                      className="text-xs font-bold fill-white"
                      transform="translate(0, -50)"
                    >
                      {item.suhu}°C
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
          
          {/* Waktu Real-time */}
          <div className="flex justify-between text-xs text-gray-600 mt-4 px-12">
            {history.slice(0, 10).reverse().map((item, index) => {
              // Extract time from datetime string
              const timeOnly = item.waktu.split(' ')[1] || item.waktu.split(',')[1]?.trim() || '';
              return (
                <div key={index} className="flex flex-col items-center">
                  <span className="font-semibold text-gray-800">{timeOnly.substring(0, 5)}</span>
                  <span className="text-gray-400 text-xs mt-1">{item.waktu.split(' ')[0]?.substring(0, 5) || ''}</span>
                </div>
              );
            })}
          </div>
          
          {/* Info Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-200">
            <div className="text-center">
              <div className="text-sm text-gray-600">Kelembapan Saat Ini</div>
              <div className="text-2xl font-bold text-blue-600">{currentData.kelembapan}%</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600">Suhu Saat Ini</div>
              <div className="text-2xl font-bold text-orange-600">{currentData.suhu}°C</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600">Rata-rata Kelembapan</div>
              <div className="text-2xl font-bold text-blue-600">
                {Math.round(history.reduce((sum, item) => sum + item.kelembapan, 0) / history.length || 0)}%
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600">Rata-rata Suhu</div>
              <div className="text-2xl font-bold text-orange-600">
                {Math.round(history.reduce((sum, item) => sum + item.suhu, 0) / history.length || 0)}°C
              </div>
            </div>
          </div>
        </div>
        
        {/* Riwayat Data */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">Riwayat Data Sensor</h2>
            <button 
              onClick={fetchHistory}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              Refresh
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Kelembapan</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Suhu</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Waktu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {history.length > 0 ? (
                  history.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm text-gray-600">#{item.id}</td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-semibold text-gray-800">{item.kelembapan}%</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-semibold text-orange-600">{item.suhu}°C</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                          item.status === 'kering' ? 'bg-red-100 text-red-700' :
                          item.status === 'normal' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {item.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{item.waktu}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                      {connectionStatus === 'connected' ? 'Belum ada data' : 'Menghubungkan ke server...'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Info Panel */}
        <div className="mt-6 bg-gradient-to-r from-blue-50 to-teal-50 border-2 border-blue-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-blue-600 mt-1 flex-shrink-0" size={24} />
            <div>
              <h3 className="font-bold text-blue-900 mb-2">Informasi Sistem</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                {USE_DUMMY_DATA && (
                  <li className="font-bold text-orange-700">• 🎮 MODE DEMO - Menggunakan data simulasi</li>
                )}
                <li>• Data sensor diperbarui setiap 5 detik {USE_DUMMY_DATA ? '(simulasi)' : 'dari database MySQL'}</li>
                <li>• Sistem menggunakan ESP8266 untuk membaca sensor kelembapan tanah</li>
                <li>• LED indikator menunjukkan kondisi: Merah (Kering), Kuning (Normal), Biru (Basah)</li>
                <li>• Pompa air menyala otomatis sesuai kondisi: 10s (Kering), 5s (Normal), 0s (Basah)</li>
                <li>• Mode manual memungkinkan kontrol pompa secara langsung</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}