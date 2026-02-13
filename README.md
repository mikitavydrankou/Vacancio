# Vacancio

Track and manage your resume conversion rate with automated job parsing and analytics LOCALLY.

## Core Features

- AI-Powered Parsing: Extract stack, category, and job details from raw text without manual data entry.
- Conversion Tracking: Monitor your success rate across different resume versions.
- Advanced Sorting: Filter and organize applications by resume, tech stack, category, or status.
- Data Analytics: Visualize application trends and identify missing information in your profile.

## Tech Stack

- Frontend: Next.js, Tailwind CSS, Shadcn UI
- Backend: FastAPI (Python), SQLAlchemy
- Database: SQLite
- AI: OpenRouter (GPT-4o-mini)
- Infrastructure: Docker

## Getting Started

### Prerequisites

- Docker and Docker Compose
- OpenRouter API Key

Ubuntu:

1. export env vars:
```bash
   export OPENROUTER_API_KEY=sk-or-v1-xxxxx
```
2. Run the application:
```bash
   docker compose -f docker-compose.yml up -d
```


### Dev installation

1. Clone the environment template:
   ```bash
   cp .env.example .env
   ```

2. Configure OpenRouter:
   Edit `.env` and provide your `OPENROUTER_API_KEY`.

3. Launch the application:
   ```bash
   docker compose -f compose.dev.yml up -d
   ```

4. Access the web interface:
   Open `http://localhost:3000` in your browser.

## Updates

To update to the latest version without losing data:

1. Pull the latest image:
   ```bash
   docker compose pull
   ```

2. Restart the application:
   ```bash
   docker compose -f docker-compose.yml up -d
   ```

Your database and uploads are safely stored in the `./data` folder and persist across updates.


