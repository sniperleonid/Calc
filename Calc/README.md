# Calc - Баллистический калькулятор для Arma Reforger

Профессиональный инструмент для точной артиллерийской стрельбы в игре Arma Reforger с онлайн-картой командира и управлением батареями.

## Функциональность

✅ **Баллистический калькулятор**
- Расчёт азимута, угла возвышения, дальности
- Учёт ветра, гравитации, температуры
- Поддержка различных типов боеприпасов
- Сохранение баллистических таблиц

✅ **Управление орудиями**
- Создание профилей орудий
- Привязка боеприпасов к орудиям
- Управление 5 батареями по 5 орудий в каждой
- Сохранение и загрузка конфигураций

✅ **Интерактивная карта**
- Размещение орудий и целей
- Линейка, азимут, расстояние
- Отображение координат
- Real-time синхронизация

✅ **Мобильное управление**
- Web-приложение на телефон
- PWA для оффлайн-режима
- Управление батареей в полевых условиях

## Технологический стек

- **Backend**: Node.js + Express + WebSocket
- **Frontend**: React + Leaflet/Mapbox
- **Mobile**: React Native / PWA
- **Баллистика**: Python модуль
- **База данных**: PostgreSQL
- **DevOps**: Docker + Docker Compose

## Быстрый старт

### Требования
- Node.js 16+
- Python 3.8+
- PostgreSQL 12+
- Docker (опционально)

### Установка

\`\`\`bash
# Клонирование
git clone https://github.com/sniperleonid/Calc.git
cd Calc

# Установка зависимостей
npm install --prefix backend
npm install --prefix frontend
pip install -r ballistics-engine/requirements.txt

# Настройка окружения
cp .env.example .env
# Отредактируйте .env с вашими параметрами

# Запуск через Docker
docker-compose up
\`\`\`

### Или локально

\`\`\`bash
# Terminal 1 - Backend
cd backend
npm install
npm start

# Terminal 2 - Frontend
cd frontend
npm install
npm start

# Terminal 3 - Baллистика (опционально)
cd ballistics-engine
python ballistics_calculator.py
\`\`\`

Приложение будет доступно на `http://localhost:3000`

## Структура проекта
