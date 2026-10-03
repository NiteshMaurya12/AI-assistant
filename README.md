# Aether AI — All-in-One Personal AI Assistant & Workspace

Aether AI is a production-grade, unified personal AI assistant workspace designed with modular architecture. It provides an intuitive central interface for multimodal communication (text and natural voice conversation), live web search grounding, document RAG, image understanding, code generation, deterministic math calculations, AI long-term memory, and task scheduling.

---

## 1. System Architecture

```text
                               ┌────────────────────────────────────────────────────────┐
                               │                    Aether AI Client                    │
                               │  - Chat Flow with Markdown & Syntax Highlighting       │
                               │  - Immersive Voice OS Overlay (Speech-to-Text & TTS)   │
                               │  - Document RAG Studio & Image Creation Studio         │
                               │  - Deterministic Math Keypad & Unit Converter          │
                               │  - Task / Reminder & Personal Memory Managers          │
                               └───────────────────────────┬────────────────────────────┘
                                                           │
                                                           │ HTTP / JSON (Port 3000)
                                                           ▼
                               ┌────────────────────────────────────────────────────────┐
                               │              Express / Node.js API Gateway             │
                               │         (Full FastAPI Python Spec in /backend)         │
                               └───────────────────────────┬────────────────────────────┘
                                                           │
                                   ┌───────────────────────┴───────────────────────┐
                                   ▼                                               ▼
               ┌───────────────────────────────────────┐       ┌───────────────────────────────────────┐
               │         AI Intent Orchestrator        │       │       Deterministic Tool Engines      │
               │  - Multimodal Vision Understanding    │       │  - IEEE 754 Math Precision Evaluator  │
               │  - Google Search Grounding with URLs  │       │  - Standard Ratio Unit Converter      │
               │  - RAG Semantic Passages Retrieval    │       │  - Descriptive Dataset Statistics     │
               │  - Gemini 3.8 Flash & Lite TTS SDK    │       │  - Task & Long-term Memory Store      │
               └───────────────────┬───────────────────┘       └───────────────────┬───────────────────┘
                                   │                                               │
                                   └───────────────────────┬───────────────────────┘
                                                           ▼
                               ┌────────────────────────────────────────────────────────┐
                               │            Storage & State Persistence Layer           │
                               │  - JSON Storage (Live Runtime)                         │
                               │  - PostgreSQL / SQLAlchemy Schema (backend/models.py)  │
                               └────────────────────────────────────────────────────────┘
```

---

## 2. Directory & File Structure

```
.
├── backend/                             # Python FastAPI Architecture & Reference
│   ├── config.py                        # Pydantic Settings & Env Config
│   ├── main.py                          # FastAPI Application Entry & Middleware
│   └── database/
│       └── models.py                    # SQLAlchemy Models (Users, Conversations, Messages, Memories, Tasks)
├── server/                              # Node.js / Express Full-Stack Server Layer
│   ├── ai.ts                            # Shared GoogleGenAI Client with 'aistudio-build' User-Agent
│   ├── storage.ts                       # In-memory & JSON file persistent store
│   ├── orchestrator.ts                  # Central AI Orchestrator & Deterministic Math Engine
│   └── routes/
│       ├── chat.ts                      # Conversational AI & Conversation Management
│       ├── voice.ts                     # Gemini 3.8 Flash Lite TTS & Audio Transcription
│       ├── search.ts                    # Google Search Grounding with Verified Citations
│       ├── document.ts                  # Document Chunking, Semantic RAG & Summarization
│       ├── code.ts                      # Code Generation, Debugging, Optimization & Sandbox
│       ├── image.ts                     # Multimodal Vision Analysis & Generative Studio
│       ├── calculator.ts                # Deterministic Math, Unit Converter & Statistics
│       ├── memory.ts                    # CRUD for AI Long-Term User Memories
│       ├── tasks.ts                     # CRUD for Tasks & Reminders
│       └── settings.ts                  # User Profile, Personas & Full Backup Export
├── src/                                 # React 19 + TypeScript + Tailwind CSS Frontend
│   ├── types/
│   │   └── index.ts                     # Complete TypeScript Type Definitions
│   ├── services/
│   │   └── api.ts                       # Modular API Client
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.tsx               # Header with Mode Pills, Tool Badges & Voice Trigger
│   │   │   └── Sidebar.tsx              # Collapsible Sidebar, History, Pinned Chats & Tools
│   │   ├── chat/
│   │   │   ├── ChatArea.tsx             # Message Stream & Intelligent Starter Cards
│   │   │   ├── MessageBubble.tsx        # Markdown, Code Runner, Sources & Audio Player
│   │   │   └── InputArea.tsx            # Multi-line Textarea, Tool Dropdown & Mic Button
│   │   ├── voice/
│   │   │   └── VoiceOverlay.tsx         # Full-Screen Immersive Voice HUD & Audio Visualizer
│   │   └── modals/
│   │       ├── MemoryModal.tsx          # Memory Management Modal
│   │       ├── TasksModal.tsx           # Tasks & Reminders Modal
│   │       ├── DocumentModal.tsx        # Document RAG Studio
│   │       ├── ImageStudioModal.tsx     # Image Creation Studio
│   │       ├── CalculatorModal.tsx      # Deterministic Math & Statistics Engine
│   │       └── SettingsModal.tsx        # Settings, Voice Persona & Workspace Backup
│   ├── App.tsx                          # Core Application Controller & State
│   ├── main.tsx                         # React Entry Point
│   └── index.css                        # Tailwind CSS Global Theme & Soundwaves
├── index.html                           # HTML Entry Point
├── metadata.json                        # AI Studio Metadata & Permissions
├── package.json                         # Node Dependencies & Scripts
├── requirements.txt                     # Python Dependencies
├── tsconfig.json                        # TypeScript Configuration
├── vite.config.ts                       # Vite Configuration
└── server.ts                            # Full-Stack Express Server Mounting Vite
```

---

## 3. Technology Explanation

1. **Frontend**:
   - **React 19 & TypeScript**: Component-driven reactive UI with strict type safety.
   - **Tailwind CSS v4**: Utility-first styling with zero-pill metadata discipline, dark neutral aesthetic, and fluid animations.
   - **Lucide Icons & Marked**: Clean iconography and GitHub Flavored Markdown rendering with code blocks.

2. **Backend**:
   - **Express with Vite Middleware**: Server running on port 3000 handling all API routes and streaming Vite frontend assets.
   - **FastAPI / Python Reference**: Production-grade models and endpoints in `backend/` for PostgreSQL and Python microservices.

3. **AI Models via `@google/genai`**:
   - `gemini-3.8-flash`: General reasoning, multimodal image understanding, code generation, and live Google Search grounding.
   - `gemini-3.8-flash-lite-tts`: Real-time text-to-speech with selectable prebuilt voices (`Kore`, `Puck`, `Fenrir`, `Zephyr`, `Charon`).
   - `gemini-3.5-transcribe`: High-accuracy speech-to-text audio transcription.

4. **Deterministic Calculation**:
   - IEEE 754 precision math evaluation without LLM hallucination for equations, percentages, square roots, trigonometry, and unit conversions.

---

## 4. Database Design (PostgreSQL / Relational Models)

Defined in `backend/database/models.py`:
- `User`: Primary user identity, hashed credentials, and foreign key relationships.
- `Conversation`: Unique session identifier, user ID, custom title, pinned status, timestamps.
- `Message`: Linked to conversation, user/assistant role, content, tool flags, source citations, audio URL.
- `Memory`: Stored preference, goal, context, or fact, enabled flag, created date.
- `Task`: Title, description, due date, priority (high, medium, low), completion boolean.
- `Document`: Ingested files, metadata, file size, and chunked passages for semantic RAG.

---

## 5. API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/chat` | AI query orchestration with tools, memory context & optional TTS |
| `GET` | `/api/chat/conversations` | List conversation histories |
| `POST` | `/api/voice/tts` | Text-to-Speech using `gemini-3.8-flash-lite-tts` |
| `POST` | `/api/voice/transcribe` | Audio transcription using `gemini-3.5-transcribe` |
| `POST` | `/api/search` | Live Google Search grounding with URL references |
| `POST` | `/api/document/upload` | Ingest and chunk text/PDF/CSV documents |
| `POST` | `/api/document/query` | RAG semantic Q&A across ingested passages |
| `POST` | `/api/code/assist` | Generate, explain, debug, optimize, or convert code |
| `POST` | `/api/image/generate` | Generative image studio with styles and aspect ratios |
| `POST` | `/api/calculator/evaluate`| Deterministic math and unit conversion evaluation |
| `GET` | `/api/memory` | Retrieve active user memories |
| `GET` | `/api/tasks` | Retrieve scheduled tasks and reminders |
| `GET` | `/api/settings/export` | Download full workspace backup JSON |

---

## 6. How to Run

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Or build for production
npm run build
npm start
```
