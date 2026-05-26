# 🏥 MedGuide AI — Healthcare Platform

> Full-stack AI-powered healthcare assistant with symptom analysis, nearby hospital detection, emergency mode, and medical report management.

---

## ⚡ Tech Stack

| Layer        | Technology                              |
|-------------|------------------------------------------|
| Frontend     | React 18 + Vite + Tailwind CSS + Framer Motion |
| Backend      | Node.js + Express.js                    |
| Database     | MongoDB Atlas (Free)                    |
| AI           | Google Gemini 1.5 Flash (Free)          |
| Maps         | OpenStreetMap + Overpass API (Free)     |
| File Storage | Cloudinary (Free)                       |
| Auth         | JWT + HttpOnly Cookies                  |
| Real-time    | Socket.io                               |
| Voice        | Web Speech API (browser built-in)       |

---

## 🚀 Quick Setup

### Step 1 — Clone / Extract project
```bash
cd medguide-ai
```

### Step 2 — Install all dependencies
```bash
# Install backend
cd server
npm install

# Install frontend
cd ../client
npm install
```

### Step 3 — Setup environment variables

**Backend** — create `server/.env`:
```env
PORT=5000
NODE_ENV=development

# MongoDB Atlas (get from mongodb.com/atlas)
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/medguide

# JWT (any random 32+ char string)
JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters

# Google Gemini AI (get from aistudio.google.com)
GEMINI_API_KEY=your_gemini_api_key_here

# Cloudinary (get from cloudinary.com)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Frontend URL
CLIENT_URL=http://localhost:5173
```

**Frontend** — create `client/.env`:
```env
VITE_API_URL=/api
VITE_SOCKET_URL=http://localhost:5000
```

### Step 4 — Start development servers

**Terminal 1 — Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 — Frontend:**
```bash
cd client
npm run dev
```

Open: **http://localhost:5173**

---

## 🔑 How to Get Free API Keys

### 1. MongoDB Atlas (Database)
1. Go to [mongodb.com/atlas](https://cloud.mongodb.com)
2. Create free account → New Project → Free M0 cluster
3. Create database user → Get connection string
4. Replace `MONGODB_URI` in server/.env

### 2. Google Gemini AI (AI Engine)
1. Go to [aistudio.google.com](https://aistudio.google.com)
2. Sign in with Google → Click "Get API Key"
3. Create API key → Copy it
4. Replace `GEMINI_API_KEY` in server/.env

### 3. Cloudinary (File Storage)
1. Go to [cloudinary.com](https://cloudinary.com) → Sign up free
2. Go to Dashboard → Copy Cloud Name, API Key, API Secret
3. Replace the CLOUDINARY_* values in server/.env

---

## 📁 Project Structure

```
medguide-ai/
├── client/                      # React frontend
│   ├── src/
│   │   ├── pages/
│   │   │   ├── HomePage.jsx         # Landing page
│   │   │   ├── LoginPage.jsx        # Auth pages
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── DashboardPage.jsx    # Main dashboard
│   │   │   ├── SymptomCheckerPage.jsx  # AI symptom analysis
│   │   │   ├── EmergencyPage.jsx    # Emergency mode
│   │   │   ├── NearbyHospitalsPage.jsx # Hospital finder
│   │   │   ├── LiveMapPage.jsx      # Interactive map
│   │   │   ├── ChatAssistantPage.jsx   # AI chatbot
│   │   │   ├── MedicalReportsPage.jsx  # Reports manager
│   │   │   ├── DoctorsPage.jsx      # Doctor finder
│   │   │   ├── ProfilePage.jsx      # User profile
│   │   │   └── AdminDashboardPage.jsx  # Admin panel
│   │   ├── components/
│   │   │   ├── layout/MainLayout.jsx   # Sidebar layout
│   │   │   └── emergency/FloatingEmergencyBtn.jsx
│   │   ├── context/AuthContext.jsx  # Auth state
│   │   ├── hooks/
│   │   │   ├── useUserLocation.js   # Geolocation
│   │   │   └── useSocket.js         # Socket.io
│   │   ├── services/api.js          # All API calls
│   │   └── utils/uuid.js
│   └── package.json
│
└── server/                      # Express backend
    └── src/
        ├── index.js                 # Entry point
        ├── config/
        │   ├── db.js                # MongoDB connection
        │   └── cloudinary.js        # Cloudinary setup
        ├── models/
        │   ├── User.js
        │   ├── Symptom.js
        │   ├── Report.js
        │   ├── Chat.js
        │   └── Doctor.js
        ├── controllers/
        │   ├── authController.js
        │   ├── symptomController.js
        │   ├── chatController.js
        │   ├── reportController.js
        │   ├── hospitalController.js
        │   ├── doctorController.js
        │   ├── userController.js
        │   └── adminController.js
        ├── routes/              # Express routers
        ├── middleware/
        │   ├── auth.js          # JWT middleware
        │   └── errorHandler.js
        ├── ai/gemini.js         # Gemini AI integration
        └── sockets/socketHandler.js
```

---

## 🌐 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register user |
| POST | /api/auth/login | Login |
| POST | /api/auth/logout | Logout |
| GET | /api/auth/me | Get current user |

### Symptoms
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/symptoms/analyze | AI symptom analysis |
| GET | /api/symptoms/history | Get history |
| DELETE | /api/symptoms/:id | Delete record |

### Hospitals
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/hospitals/nearby?lat=&lng= | Nearby places |
| GET | /api/hospitals/emergency?lat=&lng= | Emergency hospitals |

### Chat
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/chat/message | Send message to AI |
| GET | /api/chat/history | Chat history |

### Reports
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/reports | Upload report |
| GET | /api/reports | Get all reports |
| DELETE | /api/reports/:id | Delete report |

---

## 🚀 Deployment

Live Demo  -  https://med-guide-ai-two.vercel.app/

---

## ✨ Features

- ✅ AI Symptom Analysis (Gemini)
- ✅ Voice Input (Hindi + English)
- ✅ Nearby Hospitals (Overpass API)
- ✅ Emergency Mode with SOS
- ✅ Interactive Live Map (React Leaflet + OpenStreetMap)
- ✅ AI Chat Assistant
- ✅ Medical Reports Upload (Cloudinary)
- ✅ Health Dashboard
- ✅ Doctor Finder
- ✅ Real-time Updates (Socket.io)
- ✅ Offline Emergency Data (localStorage)
- ✅ Admin Panel
- ✅ JWT Authentication
- ✅ Dark Mode Glassmorphism UI
- ✅ Fully Responsive

---

## 📱 Pages

| Page | Route | Description |
|------|-------|-------------|
| Home | `/` | Landing page |
| Login | `/login` | Authentication |
| Register | `/register` | Sign up |
| Dashboard | `/dashboard` | Health overview |
| Symptom Checker | `/symptom-checker` | AI analysis |
| Nearby Hospitals | `/nearby-hospitals` | Find hospitals |
| Live Map | `/live-map` | Interactive map |
| AI Chat | `/chat` | Chat assistant |
| Reports | `/reports` | Medical files |
| Doctors | `/doctors` | Find doctors |
| Profile | `/profile` | User settings |
| Emergency | `/emergency` | Emergency mode |
| Admin | `/admin` | Admin panel |

---

**Built with ❤️ using 100% free technologies.**
