# VIRTUAL-LAB

A full-stack virtual physics laboratory platform for running interactive experiments, collaborative rooms, and real-time simulations directly in the browser.

---

## Overview

**VIRTUAL-LAB** is a modern web-based physics lab where students can explore simulations, perform experiments, access learning resources, and collaborate inside shared rooms.

The platform uses a React frontend with a real-time Node.js backend powered by Socket.io, JWT authentication, and MongoDB.


---

## Features

- Interactive physics simulations
- Real-time collaborative rooms
- Secure JWT authentication
- Resource library for study materials
- Live updates using Socket.io
- Modern UI built with React + Tailwind CSS

---

## Tech Stack

| Layer | Technologies |
|-------|--------------|
| **Frontend** | React 18, Vite, Tailwind CSS, Axios, Socket.io Client, Recharts, Matter.js |
| **Backend** | Node.js, Express, Socket.io, MongoDB, Mongoose |
| **Authentication** | JWT, bcryptjs |

---

# Installation

## Clone Repository

```bash
git clone https://github.com/ikhushaldurand/virtual-lab.git
cd virtual-lab
```

---

## Backend Setup

```bash
cd server
npm install
cp .env.example .env
```

Add required environment variables:

```env
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_secret_key
```

Start backend:

```bash
npm run dev
```

Backend runs on:

```txt
http://localhost:5000
```

---

## Frontend Setup

```bash
cd ../client
npm install
npm run dev
```

Frontend runs on:

```txt
http://localhost:5173
```

---

# Available Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm start` | Run backend server |

---

# Project Structure

```txt
virtual-lab/
├── client/
├── server/
└── README.md
```

---

# Future Scope

- More physics experiments
- Better real-time collaboration
- Automated testing & CI/CD
- Accessibility improvements

---

# Author

**Khushal Durand**  
Coding Club, IIT Guwahati

**Certification**  
<img width="932" height="658" alt="Khushal Durand VirtualLab" src="https://github.com/user-attachments/assets/1401d1cd-761d-4e80-9a59-35a945bab862" />


- Email: d.khushal@iitg.ac.in
- GitHub: https://github.com/ikhushaldurand
