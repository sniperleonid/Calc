const express = require('express');
const cors = require('express-cors');
const WebSocket = require('ws');
const http = require('http');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Middleware
app.use(express.json());
app.use(cors());

// Routes
app.use('/api/artillery', require('./routes/artillery'));
app.use('/api/ammunition', require('./routes/ammunition'));
app.use('/api/ballistics', require('./routes/ballistics'));
app.use('/api/map', require('./routes/map'));

// WebSocket handlers
wss.on('connection', (ws) => {
  console.log('🔌 Client connected');
  
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);
      handleWebSocketMessage(ws, message, wss);
    } catch (error) {
      console.error('❌ WebSocket error:', error);
    }
  });

  ws.on('close', () => {
    console.log('🔌 Client disconnected');
  });
});

// WebSocket message handler
function handleWebSocketMessage(ws, message, wss) {
  const { type, payload } = message;

  switch (type) {
    case 'GUN_POSITIONED':
      // Орудие установлено на карте
      broadcastToAll(wss, {
        type: 'GUN_UPDATE',
        payload
      });
      break;
    
    case 'TARGET_MARKED':
      // Цель обозначена на карте
      broadcastToAll(wss, {
        type: 'TARGET_UPDATE',
        payload
      });
      break;
    
    case 'BALLISTICS_CALCULATE':
      // Запрос расчёта баллистики
      calculateAndRespond(ws, payload);
      break;
    
    default:
      console.log('Unknown message type:', type);
  }
}

function broadcastToAll(wss, message) {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}

function calculateAndRespond(ws, payload) {
  // Отправить запрос в Python модуль баллистики
  // Затем отправить результат обратно
  ws.send(JSON.stringify({
    type: 'BALLISTICS_RESULT',
    payload: {
      azimuth: 180,
      elevation: 25.5,
      range: 5000,
      windCorrection: 2.3
    }
  }));
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 WebSocket ready on ws://localhost:${PORT}`);
});