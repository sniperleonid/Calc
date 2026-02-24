import React, { useState, useEffect } from 'react';
import Map from './components/Map';
import Calculator from './components/Calculator';
import GunManager from './components/GunManager';
import BatteryPanel from './components/BatteryPanel';
import Tools from './components/Tools';
import './styles/main.css';

function App() {
  const [guns, setGuns] = useState([]);
  const [selectedGun, setSelectedGun] = useState(null);
  const [mapMode, setMapMode] = useState('normal'); // normal, measure, azimuth
  const [batteries, setBatteries] = useState([]);
  const [ws, setWs] = useState(null);

  // Инициализация WebSocket
  useEffect(() => {
    const websocket = new WebSocket('ws://localhost:3001');
    
    websocket.onopen = () => {
      console.log('✅ Connected to server');
    };

    websocket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      handleServerMessage(message);
    };

    websocket.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
    };

    setWs(websocket);

    return () => websocket.close();
  }, []);

  const handleServerMessage = (message) => {
    const { type, payload } = message;

    switch (type) {
      case 'GUN_UPDATE':
        updateGunPosition(payload);
        break;
      case 'TARGET_UPDATE':
        console.log('Target updated:', payload);
        break;
      case 'BALLISTICS_RESULT':
        console.log('Ballistics calculated:', payload);
        break;
      default:
        break;
    }
  };

  const updateGunPosition = (gunData) => {
    setGuns(prevGuns =>
      prevGuns.map(gun =>
        gun.id === gunData.id ? { ...gun, ...gunData } : gun
      )
    );
  };

  const handleGunPlaced = (gunData) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'GUN_POSITIONED',
        payload: gunData
      }));
    }
    setGuns([...guns, gunData]);
  };

  return (
    <div className="app">
      <header className="header">
        <h1>⚔️ Calc - Баллистический калькулятор</h1>
        <div className="header-tools">
          <button
            className={`tool-btn ${mapMode === 'measure' ? 'active' : ''}`}
            onClick={() => setMapMode('measure')}
            title="Линейка"
          >
            📏
          </button>
          <button
            className={`tool-btn ${mapMode === 'azimuth' ? 'active' : ''}`}
            onClick={() => setMapMode('azimuth')}
            title="Азимут"
          >
            🧭
          </button>
          <button
            className="tool-btn"
            title="Координаты"
          >
            📍
          </button>
        </div>
      </header>

      <main className="main-container">
        <div className="left-panel">
          <GunManager
            guns={guns}
            selectedGun={selectedGun}
            onSelectGun={setSelectedGun}
          />
          <BatteryPanel
            batteries={batteries}
            guns={guns}
          />
        </div>

        <div className="center-panel">
          <Map
            guns={guns}
            mapMode={mapMode}
            onGunPlaced={handleGunPlaced}
          />
        </div>

        <div className="right-panel">
          <Calculator
            selectedGun={selectedGun}
            ws={ws}
          />
        </div>
      </main>

      <footer className="footer">
        <span>Status: {ws?.readyState === 1 ? '✅ Connected' : '❌ Disconnected'}</span>
        <span>v1.0.0</span>
      </footer>
    </div>
  );
}

export default App;