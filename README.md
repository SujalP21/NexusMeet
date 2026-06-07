# NexusMeet

![NexusMeet Cover](https://via.placeholder.com/1200x400/007FFF/FFFFFF?text=NexusMeet+-+Real-Time+Video+Conferencing)

A modern, full-stack video conferencing web application featuring peer-to-peer WebRTC video rooms, real-time chat, and secure user authentication.

## ✨ Features

- **User Authentication:** Secure registration and login using JWT (JSON Web Tokens) and bcrypt password hashing.
- **Instant Meetings:** Join or create meetings instantly via a shared room URL or unique meeting code.
- **Real-Time Video & Audio:** Peer-to-peer streaming powered by WebRTC for low-latency communication.
- **Media Controls:** Easily toggle microphone and camera on or off during a call.
- **Screen Sharing:** Share your screen with other participants in real-time.
- **In-Room Chat:** Integrated real-time text chat using Socket.IO.
- **Meeting History:** Dashboard displaying past meetings for logged-in users.

## 🛠️ Tech Stack

### Frontend
- **Framework:** React (Create React App)
- **Styling & UI:** Material-UI (MUI), Custom CSS Modules
- **Real-Time:** Socket.IO Client
- **WebRTC:** Native Browser WebRTC API

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Real-Time:** Socket.IO Server
- **Database:** MongoDB (via Mongoose)
- **Security:** bcrypt, crypto (Token Generation)

## 📁 Project Structure

```
.
├── frontend/   # React client application
└── backend/    # Express + Socket.IO server API
```

## 🚀 Getting Started

Follow these steps to set up the project locally on your machine.

### Prerequisites

- Node.js (v18 or higher recommended)
- npm (comes with Node.js)
- MongoDB (Local instance or MongoDB Atlas cluster)

### 1. Backend Setup

Navigate to the backend directory, install dependencies, and configure environment variables.

```bash
cd backend
npm install
```

Create a `.env` file in the `backend` folder:
```env
# backend/.env
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>/<database>?retryWrites=true&w=majority
PORT=8000
```

Start the backend development server:
```bash
npm run dev
```
*The backend server should now be running on `http://localhost:8000`.*

### 2. Frontend Setup

In a new terminal window, navigate to the frontend directory and install dependencies.

```bash
cd frontend
npm install
```

**Configure API Target:**
The frontend points to the backend URL defined in `frontend/src/environment.js`. For local development, ensure `IS_PROD` is set to `false` to point to `http://localhost:8000`.

Start the frontend development server:
```bash
npm start
```
*The React application will open automatically in your browser at `http://localhost:3000`.*

## 🔌 API Endpoints & Socket Events

### REST API (`/api/v1/users`)
- `POST /login` - Authenticate and retrieve a session token.
- `POST /register` - Create a new user account.
- `POST /add_to_activity` - Record a new meeting in the user's history.
- `GET /get_all_activity?token=...` - Fetch all past meetings for a user.

### Socket.IO Events
- `join-call` - Triggered when a user enters a room URL.
- `user-joined` / `user-left` - Broadcasted when participants enter or leave.
- `signal` - Exchanges WebRTC SDP offers/answers and ICE candidates.
- `chat-message` - Handles real-time text chat in the room.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the issues page.

## 📝 License

This project is open-source and available under the [ISC License](LICENSE).
