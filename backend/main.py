import os
import shutil
import time
import sqlite3
import hashlib
from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from google import genai
from pypdf import PdfReader
from pptx import Presentation

# ============================================================
# ENVIRONMENT VARIABLES & AI CLIENT SETUP
# ============================================================
load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    print("WARNING: GEMINI_API_KEY was not found in .env file.")

client = genai.Client(api_key=GEMINI_API_KEY)


# ============================================================
# FASTAPI APPLICATION SETUP
# ============================================================
app = FastAPI(
    title="Lumina AI - Universal Bilingual Academic Agent API",
    description="Universal AI academic assistant for students of all disciplines (Science, IT, Commerce, Law, Medical, Arts)",
    version="3.0.0"
)


# ============================================================
# CORS MIDDLEWARE
# ============================================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# DIRECTORIES SETUP
# ============================================================
os.makedirs("temp", exist_ok=True)

app.mount(
    "/download",
    StaticFiles(directory="temp"),
    name="download"
)


# ============================================================
# SQLITE DATABASE SETUP (PERMANENT USER STORAGE)
# ============================================================
DB_PATH = "users.db"

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    # Insert a default admin user if not already present
    cursor.execute("SELECT id FROM users WHERE username = ?", ("admin",))
    if not cursor.fetchone():
        cursor.execute(
            "INSERT INTO users (username, password_hash) VALUES (?, ?)",
            ("admin", hash_password("1234"))
        )
    conn.commit()
    conn.close()

# Initialize database on startup
init_db()


# ============================================================
# PYDANTIC SCHEMAS
# ============================================================
class TranslationRequest(BaseModel):
    text: str


class AuthRequest(BaseModel):
    username: str
    password: str
    mode: str = "signin"  # signin or signup


class ChatMessage(BaseModel):
    role: str  # "user" or "model"
    text: str


class ChatRequest(BaseModel):
    message: str
    history: list[ChatMessage] = []
    language: str = "sinhala"


# ============================================================
# BASE & AUTH ENDPOINTS
# ============================================================
@app.get("/")
async def root():
    return {
        "success": True,
        "message": "Lumina AI (Bilingual Academic Agent) API is running.",
        "docs": "/docs"
    }


@app.get("/api/health")
async def health_check():
    return {
        "success": True,
        "message": "Backend is online.",
        "gemini_configured": bool(GEMINI_API_KEY)
    }


@app.post("/api/auth")
async def authenticate_user(request: AuthRequest):
    username = request.username.strip().lower()
    password = request.password.strip()

    if not username or not password:
        raise HTTPException(status_code=400, detail="Username and password are required.")

    if len(password) < 4:
        raise HTTPException(status_code=400, detail="Password must be at least 4 characters long.")

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    try:
        if request.mode == "signup":
            cursor.execute("SELECT id FROM users WHERE username = ?", (username,))
            if cursor.fetchone():
                raise HTTPException(status_code=400, detail="Username already exists. Please choose another.")

            cursor.execute(
                "INSERT INTO users (username, password_hash) VALUES (?, ?)",
                (username, hash_password(password))
            )
            conn.commit()
            return {
                "success": True,
                "username": username,
                "message": "Account created successfully!"
            }

        # Sign In
        cursor.execute("SELECT password_hash FROM users WHERE username = ?", (username,))
        row = cursor.fetchone()

        if not row or row[0] != hash_password(password):
            raise HTTPException(status_code=401, detail="Invalid username or password.")

        return {
            "success": True,
            "username": username,
            "message": "Login successful!"
        }
    finally:
        conn.close()


@app.get("/api/users")
async def get_all_users():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT id, username, created_at FROM users")
        rows = cursor.fetchall()
        users = [{"id": r[0], "username": r[1], "created_at": r[2]} for r in rows]
        return {"success": True, "total": len(users), "users": users}
    finally:
        conn.close()


@app.delete("/api/users/{username}")
async def delete_user(username: str):
    target_user = username.strip().lower()
    if target_user == "admin":
        raise HTTPException(status_code=400, detail="Default admin account cannot be deleted.")

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM users WHERE username = ?", (target_user,))
        conn.commit()
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="User not found.")
        return {"success": True, "message": f"User '{target_user}' deleted successfully."}
    finally:
        conn.close()


# ============================================================
# HELPER FUNCTIONS (POWERPOINT GENERATION)
# ============================================================
def create_pptx_from_text(summary_text: str, output_path: str):
    prs = Presentation()

    # Title Slide
    title_slide_layout = prs.slide_layouts[0]
    slide = prs.slides.add_slide(title_slide_layout)

    title = slide.shapes.title
    subtitle = slide.placeholders[1]

    title.text = "Academic Lecture Summary"
    subtitle.text = "Generated by Lumina AI Agent"

    # Content Slides
    bullet_slide_layout = prs.slide_layouts[1]
    paragraphs = summary_text.split("\n")

    current_slide = None
    text_frame = None

    for paragraph in paragraphs:
        p = paragraph.strip()

        if not p:
            continue

        if (
            p.startswith("#")
            or p.startswith("1.")
            or p.startswith("2.")
            or p.startswith("3.")
            or p.startswith("4.")
            or p.startswith("5.")
            or p.startswith("6.")
            or p.startswith("7.")
        ):
            current_slide = prs.slides.add_slide(bullet_slide_layout)
            title_shape = current_slide.shapes.title
            title_shape.text = p.replace("#", "").strip()

            body_shape = current_slide.placeholders[1]
            text_frame = body_shape.text_frame
            text_frame.clear()

        elif text_frame is not None:
            paragraph_obj = text_frame.add_paragraph()
            paragraph_obj.text = p
            paragraph_obj.level = 0

    prs.save(output_path)


# ============================================================
# 1. PROCESS LECTURE (GEMINI MULTIMODAL -> TRANSCRIPT -> SUMMARY -> PPTX)
# ============================================================
@app.post("/api/process-lecture")
async def process_lecture(
    file: UploadFile = File(...),
    language: str = Form("sinhala")
):
    os.makedirs("temp", exist_ok=True)
    safe_filename = os.path.basename(file.filename)
    media_path = os.path.join("temp", safe_filename)

    base_name = os.path.splitext(safe_filename)[0]
    pptx_filename = f"presentation_{base_name}.pptx"
    pptx_path = os.path.join("temp", pptx_filename)

    uploaded_gemini_file = None

    try:
        with open(media_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        print(f"Uploading {safe_filename} to Gemini...")
        uploaded_gemini_file = client.files.upload(file=media_path)

        while uploaded_gemini_file.state.name == "PROCESSING":
            time.sleep(2)
            uploaded_gemini_file = client.files.get(name=uploaded_gemini_file.name)

        if uploaded_gemini_file.state.name == "FAILED":
            raise Exception("Gemini failed to process the uploaded media file.")

        output_language = "Sinhala" if language.lower() == "sinhala" else "English"

        prompt = f"""
You are a highly capable academic assistant.

Review this academic lecture and fulfill two tasks:

TASK 1: Extract and provide an accurate, high-quality transcript of everything spoken in the lecture.
TASK 2: Create a rich, comprehensive and structured study note on the subject in {output_language}.

Format your response strictly with these two markers:
===TRANSCRIPT===
(Put the full transcript here)

===STUDY_NOTE===
Provide a rich, highly academic response covering:
1. Overview & Executive Summary
2. Core Principles & Core Theories
3. Key Scientific, Mathematical, Technical or Conceptual definitions
4. Essential formulas, sections, regulations, or timeline events discussed
5. Landmark cases, scientific experiments, or case studies where applicable
6. Practical, computational or real-world examples
7. Actionable exam take-aways & review bullet points

Ensure language is clear and suited for university or advanced study. Retain important standard international and English terms in brackets or inline where they assist the student (e.g. DNA, photosynthesis, double-entry, database index, actus reus, momentum, etc.).
"""

        print("Analyzing lecture with Gemini AI...")
        response = client.models.generate_content(
            model="gemini-2.0-flash-lite",
            contents=[uploaded_gemini_file, prompt]
        )

        full_text = response.text or ""

        if "===STUDY_NOTE===" in full_text:
            parts = full_text.split("===STUDY_NOTE===")
            transcript_part = parts[0].replace("===TRANSCRIPT===", "").strip()
            summary_part = parts[1].strip()
        else:
            transcript_part = "Transcript directly extracted within study note."
            summary_part = full_text.strip()

        create_pptx_from_text(summary_part, pptx_path)

        if os.path.exists(media_path):
            os.remove(media_path)
        if uploaded_gemini_file:
            client.files.delete(name=uploaded_gemini_file.name)

        return {
            "success": True,
            "transcript": transcript_part,
            "summary": summary_part,
            "pptx_download_url": f"/download/{pptx_filename}"
        }

    except Exception as e:
        if os.path.exists(media_path):
            os.remove(media_path)
        if uploaded_gemini_file:
            try:
                client.files.delete(name=uploaded_gemini_file.name)
            except Exception:
                pass

        print("Lecture processing error:", str(e))
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
# 2. PDF SUMMARIZER
# ============================================================
@app.post("/api/summarize-pdf")
async def summarize_pdf(
    file: UploadFile = File(...),
    language: str = Form("sinhala")
):
    try:
        reader = PdfReader(file.file)
        pdf_text = ""

        for page in reader.pages:
            extracted = page.extract_text()
            if extracted:
                pdf_text += extracted + "\n"

        if not pdf_text.strip():
            raise Exception("Could not extract text from this PDF.")

        output_language = "Sinhala" if language.lower() == "sinhala" else "English"

        prompt = f"""
You are a highly capable academic assistant.

Summarize the following academic PDF document in {output_language} by creating structured, exam-ready notes.

Ensure it includes:
1. Executive Summary
2. Key Core Theories & Concepts
3. Crucial Facts, equations, formulas or sections
4. Essential terminologies & their meanings
5. Scientific experiments, case studies, or precedents
6. Structural breakdowns of technical, numeric or qualitative frameworks
7. Final academic conclusions & review take-aways

Legal Document:
{pdf_text}
"""

        response = client.models.generate_content(
            model="gemini-2.0-flash-lite",
            contents=prompt
        )

        summary = response.text

        return {
            "success": True,
            "summary": summary
        }

    except Exception as e:
        print("PDF summarization error:", str(e))
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
# 3. ENGLISH -> SINHALA LEGAL NOTE TRANSLATOR
# ============================================================
@app.post("/api/translate-english-note")
async def translate_note(request: TranslationRequest):
    try:
        if not request.text.strip():
            raise HTTPException(
                status_code=400,
                detail="English text cannot be empty."
            )

        prompt = f"""
You are an expert bilingual academic translator.

Translate and summarize the following English academic or scientific note
into professional, easy-to-understand Sinhala.

Requirements:
- Retain vital international, scientific, and technical terminology.
- Provide clear Sinhala explanations for difficult conceptual terms.
- Retain all data, equations, arguments, and key informative points.
- Preserve precise academic meaning.
- Make it structured and extremely useful for studies.

Sample technical or subject terms to retain or gloss:
Data structures, calculus, photosynthesis, inflation, mens rea, pathology, database indexing, supply and demand.

English Note:
{request.text}
"""

        print("Translating English note...")

        response = client.models.generate_content(
            model="gemini-2.0-flash-lite",
            contents=prompt
        )

        sinhala_note = response.text

        return {
            "success": True,
            "sinhala_note": sinhala_note
        }

    except HTTPException:
        raise

    except Exception as e:
        print("Translation error:", str(e))
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
# 4. BILINGUAL ACADEMIC RESEARCH CHATBOT
# ============================================================
@app.post("/api/chat")
async def academic_chat(request: ChatRequest):
    try:
        if not request.message.strip():
            raise HTTPException(status_code=400, detail="Message cannot be empty.")

        preferred_lang = "Sinhala (while preserving key international/English/scientific terms in brackets or inline)" if request.language.lower() == "sinhala" else "English"

        conversation_context = ""
        for msg in request.history[-10:]:
            speaker = "Student" if msg.role == "user" else "AI Assistant"
            conversation_context += f"{speaker}: {msg.text}\n"

        prompt = f"""
You are Lumina AI, an expert, multi-disciplinary Bilingual Academic Assistant helping a student explore Science, IT, Commerce, Engineering, Arts, Medical, Law, or any general study area.

Guidelines:
- Respond primarily in {preferred_lang}.
- Be highly accurate, structured, pedagogical, and easy to understand.
- Provide equations, real-world examples, or specific case models where they help.
- Retain critical technical, English, and scientific terms inline or in brackets where appropriate.

Previous Conversation:
{conversation_context}

Student's New Question:
{request.message}
"""

        response = client.models.generate_content(
            model="gemini-2.0-flash-lite",
            contents=prompt
        )

        return {
            "success": True,
            "reply": response.text
        }

    except HTTPException:
        raise

    except Exception as e:
        print("Chat error:", str(e))
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
# RUN SERVER
# ============================================================
if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=True
    )