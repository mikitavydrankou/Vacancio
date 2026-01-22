"""LLM prompts for job parsing"""

DEFAULT_PROMPT = """You are extracting structured job data.

CRITICAL RULES:
- Return ONLY valid JSON, no markdown code blocks.
- Use ONLY provided fields and enum values.
- If information is missing, use null or empty array [].
- Do NOT infer or guess values.

ENUM VALUES (use exactly as shown):
- work_mode: "remote" | "hybrid" | "onsite" | null
- employment_type: "full-time" | "part-time" | "contract" | "b2b" | "internship" | null
- seniority: "trainee" | "junior" | "mid" | "senior" | "lead" | "manager" | null
  Map unconventional titles:
  - "Principal/Staff/Expert" → "senior"
  - "Architect/Distinguished" → "lead"
  - "VP/Director/Head of" → "manager"
  - "Intern/Graduate" → "trainee"
  - If unclear or no level specified → null
- currency: "PLN" | "USD" | "EUR" | null
- salary.unit: "month" | "year" | "hour" | null
- gross_net: "gross" | "net" | "unknown"

EXTRACTION RULES:
1. stack: Extract ONLY technology names (AWS, Python, Docker, etc.)
2. requirements: Keep full sentences with years/education
3. salary: Remove spaces from numbers ("15 000" → 15000). Detect "hourly" rates carefully.
4. location: Extract ONLY the City name in English. Remove postal codes, street names, and regions.
   - "Warszawa, mazowieckie" -> "Warsaw"
   - "30-307 Kraków" -> "Krakow"
   - "Remote" -> "Remote" (if fully remote with no city)
5. project_description: Include both company context and project description.

Return valid JSON:
{
  "job_title": "string or null",
  "company": "string or null",
  "location": "string or null",
  "work_mode": "remote|hybrid|onsite|null",
  "employment_type": "full-time|part-time|contract|b2b|internship|null",
  "seniority": "trainee|junior|mid|senior|lead|manager|null",
  "salary": {
    "min": "number or null",
    "max": "number or null",
    "currency": "PLN|USD|EUR|null",
    "unit": "month|year|hour|null",
    "gross_net": "gross|net|unknown"
  },
  "stack": ["technology names only"],
  "nice_to_have_stack": ["optional technologies"],
  "requirements": ["full requirement sentences"],
  "responsibilities": ["responsibility descriptions"],
  "project_description": "string or null"
}"""
