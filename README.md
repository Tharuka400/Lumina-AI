# ✨ Lumina AI — Bilingual Multimodal Academic Assistant

**Lumina AI** is a full-stack, bilingual (Sinhala & English) AI-powered academic assistant built with **React**, **FastAPI**, and **Google Gemini 2.0**. It helps students across multiple disciplines (Science, IT, Commerce, Law, Medicine, and Arts) automate study note creation, lecture transcription, and academic research.

> **Project Status:** 🚧 *Active Development — Core multimodal features and UI completed; currently preparing for cloud deployment.*

---

## 📸 Preview

| 3D Desk Lamp Sign-In | Account Registration UI |
| :---: | :---: |
| ![Sign In](screenshots/login-signin.png) | ![Sign Up](screenshots/login-signup.png) |

| Bilingual AI Study Chatbot | Lecture to PPTX & Study Notes |
| :---: | :---: |
| ![Dashboard Chat](screenshots/dashboard-chat.png) | ![Dashboard PPTX](screenshots/dashboard-pptx.png) |

---

## 🚀 Key Features

* **Interactive 3D Desk Lamp Auth UI:** Custom SVG articulated desk lamp with pull-cord physics, dynamic ambient room lighting themes, diagonal slide transitions, and SHA-256 secured **SQLite** authentication.
* **Bilingual Academic Research Chatbot:** Context-aware multi-turn AI chat supporting Sinhala and English with real-time **Web Speech API** voice-to-text input.
* **Lecture Audio/Video to PPTX & Notes:** Uploads lecture recordings to **Gemini 2.0 Multimodal API** to extract full transcripts, structured exam notes, and downloadable `.pptx` presentations (`python-pptx`).
* **Academic PDF Summarizer:** Parses study handouts and textbooks (`pypdf`) into structured, exam-ready summaries.
* **Terminology-Preserving Translator:** Translates English academic notes into clear Sinhala while retaining vital technical and scientific terms.

---

## 🛠️ Tech Stack

* **Frontend:** React.js (Vite), Axios, CSS3 (Glassmorphism & Custom Animations), Web Speech API
* **Backend:** Python, FastAPI, Uvicorn, SQLite3
* **AI & Document Processing:** Google GenAI SDK (`gemini-2.0-flash-lite`), `python-pptx`, `pypdf`

---

## 🚀 Installation & Setup Guide

Follow these steps to run the project locally on your machine:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Tharuka400/Lumina-AI
   cd Lumina-AI
   ```

2. **Backend Setup (FastAPI):**
   ```bash
   cd backend
   python -m venv venv
   venv\Scripts\activate
   pip install fastapi uvicorn google-genai python-pptx pypdf python-multipart python-dotenv
   ```
   *Create a `.env` file inside the `backend` folder and add your Gemini API key:*
   ```env
   GEMINI_API_KEY=your_google_gemini_api_key_here
   ```
   *Start the backend server:*
   ```bash
   uvicorn main:app --reload --port 8000
   ```

3. **Frontend Setup (React + Vite):**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   *Open `http://localhost:5173` in your browser to launch the application.*