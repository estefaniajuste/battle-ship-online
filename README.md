## Battle Ship – Online Multiplayer Prototype

Elegant, minimalist Battleship-style online multiplayer game with real-time play using React, TypeScript, Node.js, Express, and Socket.io.

### Tech Stack
- **Frontend**: React + TypeScript + Vite + Tailwind CSS + React Context
- **Backend**: Node.js + Express + Socket.io
- **Real-time**: Socket.io (websocket-based)

### Project Structure
- `backend/` – Express + Socket.io server, room and matchmaking logic
- `frontend/` – React + TS client, UI, game flow, and socket integration

### Prerequisites
- Node.js 18+ and npm

### Installation
```bash
npm install
npm run install:all
```

### Development
Runs backend on port `4000` and frontend on port `5173`.

```bash
npm run dev
```

Then open `http://localhost:5173` in your browser.

### Root Scripts
- **`npm run dev`** – Start backend and frontend together (concurrently)
- **`npm run install:all`** – Install dependencies in both `backend` and `frontend`

### Game Features
- Online real-time multiplayer
- Private rooms (host + join via code)
- Automatic matchmaking (“Play Online”)
- Drag-and-drop ship placement with rotation
- Turn-based firing with hit/miss/sunk feedback
- Win/lose result screens with replay and main menu options

