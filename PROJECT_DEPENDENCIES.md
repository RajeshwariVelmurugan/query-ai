# Project Dependencies

This document lists all the major dependencies required for both the Backend and Frontend components of the project.

## Backend (Python)
Located in `NLP-SQL-BACKEND/NLP-SQL-BACKEND/requirements.txt`.

- **FastAPI**: Main web framework.
- **Uvicorn**: ASGI server for running the FastAPI application.
- **SQLAlchemy**: ORM for database interactions.
- **PyMySQL**: MySQL driver for SQLAlchemy.
- **Psycopg2-binary**: PostgreSQL driver for SQLAlchemy.
- **PyMongo**: MongoDB driver.
- **Requests**: For HTTP calls to Ollama (LLM).
- **Redis**: For caching and session management.
- **Python-dotenv**: Loading environment variables from `.env`.
- **Cryptography**: For secure password hashing and encryption.
- **Pydantic**: Data validation and settings management.
- **Python-jose**: JWT token generation and verification.
- **Passlib**: Password hashing utilities.
- **Google-auth**: For Google OAuth integration.
- **Bcrypt**: Password hashing algorithm.
- **Email-validator**: Validating email addresses.

## Frontend (React + Vite)
Located in `NLP-SQL-FRONTEND/package.json`.

### Core
- **React**: Frontend UI library.
- **Vite**: Modern build tool and dev server.
- **React-Router**: Client-side routing.
- **Lucide-React**: Icon library.

### UI & Styling
- **Material UI (MUI)**: Core UI components.
- **Radix UI**: Primitive UI components for building accessible design systems.
- **Emotion**: CSS-in-JS styling.
- **Tailwind CSS**: Utility-first CSS framework.
- **Motion (Framer Motion)**: Animation library.
- **Next-themes**: Theme management (Dark/Light mode).

### Data Visualization
- **Plotly.js-dist-min**: Core Plotly visualization library.
- **React-Plotly.js**: React wrapper for Plotly.
- **Recharts**: Composable charting library.

### Utilities
- **Axios**: HTTP client (implied by API service).
- **Date-fns**: Date manipulation.
- **React-Hook-Form**: Form management and validation.
- **Sonner**: Toast notifications.
- **Clsx / Tailwind-Merge**: Utility classes management.
- **React-DND**: Drag and Drop functionality.

### Development Dependencies
- **TypeScript**: Static typing.
- **@types/plotly.js**: Type definitions for Plotly.
- **@types/react-plotly.js**: Type definitions for React-Plotly.
