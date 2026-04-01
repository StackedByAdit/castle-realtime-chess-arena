# ♟️ Castle — Realtime Chess Arena

Castle is a full-stack MERN application that enables seamless real-time multiplayer chess with matchmaking, ELO-based ranking, and synchronized gameplay using WebSockets.

Built with a focus on system design, real-time communication, and scalable architecture.

---

## 🚀 Features

* ♟️ Realtime multiplayer gameplay (WebSockets)
* 🎯 Automatic matchmaking system
* ⏱️ Chess clock (timer-based gameplay)
* 📜 Move history with replay functionality
* 📊 ELO-based ranking system
* 🔐 Secure authentication (JWT)
* 🔄 Reconnection support (resume ongoing games)
* 🧠 Server-side move validation using chess.js

---

## 🏗️ Tech Stack

### Frontend

* React + TypeScript
* TailwindCSS
* react-chessboard

### Backend

* Node.js + Express
* WebSockets (Socket.io / ws)

### Database

* MongoDB (Mongoose)

### Engine

* chess.js

---

## 🧠 System Design

Castle uses a **server-authoritative architecture** to ensure fair gameplay and consistency.

* Persistent WebSocket connections for realtime updates
* Room-based game sessions for isolated matches
* Centralized game state on server
* Matchmaking queue for player pairing
* REST APIs for authentication and history

---

## 🔄 Realtime Game Flow

1. User logs in and joins matchmaking
2. Server pairs two players
3. A game room is created
4. Moves are transmitted via WebSocket
5. Server validates and broadcasts state updates
6. Timers are synchronized server-side
7. Game ends → ELO rating updated

---

## 📦 Installation

```bash
# Clone repository
git clone https://github.com/yourusername/castle-realtime-chess-arena.git

# Install dependencies
npm install

# Start backend
cd server
npm run dev

# Start frontend
cd client
npm run dev
```

---

## 🌐 Environment Variables

```env
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_secret_key
PORT=5000
```

---

## 📁 Project Structure

```
castle-realtime-chess-arena/
│
├── client/
│   ├── components/
│   ├── pages/
│   ├── hooks/
│   └── utils/
│
├── server/
│   ├── controllers/
│   ├── routes/
│   ├── websocket/          
│   │   ├── socketHandler.ts
│   │   ├── gameManager.ts
│   │   ├── matchmaking.ts
│   │
│   ├── models/
│   ├── services/
│   └── utils/
│
├── shared/              
│
├── README.md
└── package.json
```

---

## 📊 Future Enhancements

*  AI opponent (Stockfish integration)
*  Spectator mode
*  In-game chat
*  Advanced analytics & insights

---

## 📸 Demo


---

## 🧠 Key Learnings

* Designing real-time systems with WebSockets
* Handling concurrency and state synchronization
* Implementing matchmaking algorithms
* Building ranking systems (ELO)
* Structuring scalable full-stack applications

---

## 🌐 Live Demo

out soon

---

## 🧑‍💻 Author

Aditya Gupta

---
