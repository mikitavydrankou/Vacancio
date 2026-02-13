# API Routers Documentation

FastAPI route handlers for the Vacancio job application tracking system. This document provides comprehensive documentation for all API endpoints, including request/response schemas, query parameters, and usage examples.

## Table of Contents
- [Applications Router](#applications-router)
- [Profiles Router](#profiles-router)
- [Resumes Router](#resumes-router)
- [Common Concepts](#common-concepts)

---

## Applications Router
**File:** `applications.py`  
**Base Path:** `/applications`

Manages job applications with AI-powered parsing capabilities. Applications are automatically processed in the background to extract structured information from raw job postings.

### Endpoints

#### `GET /applications`
List all applications with optional filtering.

**Query Parameters:**
- `profile_id` (str, optional): Filter by profile
- `resume_version` (int, optional): Filter by resume version
- `skip` (int, default=0): Pagination offset
- `limit` (int, default=100): Max results to return

**Response:** `List[JobApplication]`

**Example:**
```http
GET /applications?profile_id=abc123&skip=0&limit=20
```

---

#### `POST /applications`
Create a new job application. Triggers background AI parsing to extract structured data from `raw_data`.

**Request Body:** `JobApplicationCreate`
```json
{
  "profile_id": "string",
  "resume_id": "string",
  "resume_version": 0,
  "url": "string",
  "company": "Parsing...",
  "position": "Parsing...",
  "raw_data": "string (job posting HTML/text)",
  "status": "parsing"
}
```

**Response:** `JobApplication`

**Notes:**
- Background task processes `raw_data` using AI to extract company, position, requirements, tech stack, etc.
- Initial status is `parsing`, updated to `no_response` after successful parsing or `failed` on error
- The `process_application_background()` function handles all AI parsing logic

---

#### `GET /applications/{app_id}`
Retrieve a single application by ID.

**Path Parameters:**
- `app_id` (str): Application UUID

**Response:** `JobApplication`

**Error Responses:**
- `404`: Application not found

---

#### `PUT /applications/{app_id}`
Update an existing application.

**Path Parameters:**
- `app_id` (str): Application UUID

**Request Body:** `JobApplicationUpdate`
```json
{
  "company": "string (optional)",
  "position": "string (optional)",
  "location": "string (optional)",
  "salary": "string (optional)",
  "tech_stack": ["string"],
  "nice_to_have_stack": ["string"],
  "responsibilities": ["string"],
  "requirements": ["string"],
  "work_mode": "string (optional)",
  "employment_type": "string (optional)",
  "seniority": "junior|mid|senior|lead|principal",
  "description": "string (optional)",
  "status": "parsing|no_response|responded|interviewing|rejected|accepted|failed",
  "is_favorite": false,
  "is_archived": false,
  "responded_at": "datetime (optional)",
  "interview_date": "datetime (optional)",
  "rejected_at": "datetime (optional)"
}
```

**Response:** `JobApplication`

**Error Responses:**
- `404`: Application not found

---

#### `DELETE /applications/{app_id}`
Delete an application permanently.

**Path Parameters:**
- `app_id` (str): Application UUID

**Response:**
```json
{"ok": true}
```

**Error Responses:**
- `404`: Application not found

---

#### `POST /applications/{app_id}/reparse`
Re-trigger AI parsing for an application using its existing `raw_data`.

**Path Parameters:**
- `app_id` (str): Application UUID

**Response:** `JobApplication` (with status updated to `parsing`)

**Error Responses:**
- `404`: Application not found
- `400`: No raw data available for re-parsing

**Use Case:** When AI parsing fails or produces incorrect results, fix the parser and re-run extraction

---

#### `GET /applications/export/json`
Export all applications as JSON for backup or LLM training data.

**Query Parameters:** None

**Response:** JSON file download with application data in LLM-friendly format

**Output Schema:**
```json
[
  {
    "company": "string",
    "position": "string",
    "location": "string",
    "salary": "string",
    "tech_stack": ["string"],
    "nice_to_have_stack": ["string"],
    "responsibilities": ["string"],
    "requirements": ["string"],
    "work_mode": "string",
    "employment_type": "string",
    "seniority": "string",
    "description": "string",
    "source": "string",
    "url": "string"
  }
]
```

---

#### `POST /applications/import/json`
Bulk import applications from a JSON file.

**Request:** Multipart form data with file upload

**Response:**
```json
{
  "status": "imported",
  "count": 42,
  "details": {
    "success_count": 40,
    "error_count": 2,
    "errors": []
  }
}
```

**Error Responses:**
- `400`: Invalid JSON format or structure

---

## Profiles Router
**File:** `profiles.py`  
**Base Path:** `/profiles`

Manages user profiles. Each profile represents a job seeker and contains associated resumes and applications.

### Endpoints

#### `GET /profiles`
List all profiles.

**Query Parameters:**
- `skip` (int, default=0): Pagination offset
- `limit` (int, default=100): Max results to return

**Response:** `List[Profile]`

---

#### `POST /profiles`
Create a new profile.

**Request Body:** `ProfileCreate`
```json
{
  "name": "string"
}
```

**Response:** `Profile`

**Error Responses:**
- `400`: Profile with that name already exists

---

#### `DELETE /profiles/{profile_id}`
Delete a profile and all associated resumes and applications (CASCADE).

**Path Parameters:**
- `profile_id` (str): Profile UUID

**Response:**
```json
{"ok": true}
```

**Error Responses:**
- `404`: Profile not found

**Warning:** This is a destructive operation that permanently deletes all related data.

---

## Resumes Router
**File:** `resumes.py`  
**Base Path:** `/resumes`

Handles resume file uploads and versioning. Each profile can have multiple resume versions.

### Endpoints

#### `GET /resumes`
List all resumes with optional filtering.

**Query Parameters:**
- `profile_id` (str, optional): Filter by profile
- `skip` (int, default=0): Pagination offset
- `limit` (int, default=100): Max results to return

**Response:** `List[Resume]`

---

#### `POST /resumes`
Upload a new resume file. Auto-increments version number for the profile.

**Request:** Multipart form data
- `profile_id` (str): Profile UUID
- `file` (file): Resume file (typically PDF)

**Response:** `Resume`
```json
{
  "id": "string",
  "profile_id": "string",
  "name": "string",
  "version": 1,
  "file_path": "/uploads/profile_v1_resume.pdf",
  "uploaded_at": "2026-02-13T10:00:00"
}
```

**Notes:**
- Version is automatically calculated as `max_version + 1`
- Filename is sanitized and stored in `UPLOAD_DIR` with format: `{profile_id}_v{version}_{filename}`

---

## Common Concepts

### Application Status Enum
- `parsing`: AI is currently extracting data
- `no_response`: Application submitted, awaiting response
- `responded`: Employer has responded
- `interviewing`: Interview scheduled or in progress
- `rejected`: Application rejected
- `accepted`: Offer accepted
- `failed`: AI parsing failed

### Seniority Enum
- `junior`
- `mid`
- `senior`
- `lead`
- `principal`

### Background Processing
Applications use FastAPI's `BackgroundTasks` for async AI parsing:
1. Application created with minimal data and `parsing` status
2. `process_application_background()` called with `app_id`
3. AI extracts structured data from `raw_data` field
4. Application updated with extracted info and status set to `no_response`
5. On error, status set to `failed` with error message in description

### Error Handling
All endpoints follow standard HTTP status codes:
- `200`: Success
- `400`: Bad request (validation error, duplicate, etc.)
- `404`: Resource not found
- `500`: Internal server error (logged)