# AI Parser

OpenRouter-based AI parsing for job postings.

## Files

### parser.py
Main AI parsing logic:
- Uses OpenRouter API (GPT-4o-mini by default)
- Extracts structured data from job text
- Handles source URL detection
- Automatic validation and fixing
- Fallback error handling

### prompts.py
AI prompt templates:
- System instructions for job parsing
- Output format specifications
- JSON schema definitions

## API Requirements
- Environment variable: `OPENROUTER_API_KEY`
- Default model: `openai/gpt-4o-mini`
- Timeout: 60 seconds

## Extracted Fields
- Company, position, location
- Salary range
- Tech stack (required & nice-to-have)
- Responsibilities & requirements
- Work mode, employment type, seniority
