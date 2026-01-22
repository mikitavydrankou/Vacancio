"""AI parsing using OpenRouter"""
import os
import json
import logging
import requests
from urllib.parse import urlparse

from ..models import JobPosting
from ..validator import auto_fix_job_posting
from .prompts import DEFAULT_PROMPT

logger = logging.getLogger(__name__)

SOURCE_MAPPINGS = {
    "indeed": ["indeed"],
    "nofluffjobs": ["nofluffjobs", "nofluff"],
    "pracuj": ["pracuj.pl"],
    "justjoin": ["justjoin.it"],
    "linkedin": ["linkedin"],
}


def parse_with_ai(
    text: str,
    model: str = "openai/gpt-4o-mini",
    custom_prompt: str = None,
    source_url: str = None
) -> JobPosting:
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        raise ValueError("OPENROUTER_API_KEY not set")
    
    prompt = custom_prompt or DEFAULT_PROMPT
    full_prompt = f"{prompt}\n\nJob text:\n{text}"
    
    logger.info(f"🤖 Parsing with {model}")
    
    try:
        response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            },
            json={
                "model": model,
                "messages": [{"role": "user", "content": full_prompt}]
            },
            timeout=60
        )
    except requests.exceptions.Timeout:
        logger.error("❌ OpenRouter request timed out after 60s")
        raise
    except requests.exceptions.RequestException as e:
        logger.error(f"❌ OpenRouter request failed: {e}")
        raise
    
    try:
        response.raise_for_status()
    except requests.exceptions.HTTPError as e:
        logger.error(f"❌ OpenRouter HTTP error: {e}")
        raise ValueError(f"API request failed: {e}")
    
    try:
        response_data = response.json()
        content = response_data["choices"][0]["message"]["content"]
    except (KeyError, json.JSONDecodeError) as e:
        logger.error(f"❌ Invalid API response format: {e}")
        raise ValueError(f"Invalid API response: {e}")
    
    try:
        json_str = _extract_json(content)
        data = json.loads(json_str)
    except json.JSONDecodeError as e:
        logger.error(f"❌ Failed to parse JSON from LLM response: {e}")
        raise ValueError(f"Invalid JSON in LLM response: {e}")
    
    try:
        data = _normalize_enums(data)
        
        if source_url:
            data["source"] = _extract_source(source_url)
        
        job = JobPosting(**data)
        job = auto_fix_job_posting(job)
    except Exception as e:
        logger.error(f"❌ Validation error: {e}")
        raise ValueError(f"Job posting validation failed: {e}")
    
    logger.info(f"✅ Parsed: {job.job_title} @ {job.company}")
    return job


def _extract_source(url: str) -> str:
    domain = urlparse(url).netloc.lower()
    
    for source_name, keywords in SOURCE_MAPPINGS.items():
        if any(kw in domain for kw in keywords):
            return source_name
    
    return domain.replace("www.", "").split(".")[0]


def _extract_json(text: str) -> str:
    if "```json" in text:
        return text.split("```json")[1].split("```")[0].strip()
    elif "```" in text:
        return text.split("```")[1].split("```")[0].strip()
    return text.strip()


def _normalize_enums(data: dict) -> dict:
    if data.get("work_mode"):
        wm = data["work_mode"].lower().replace("-", "").replace("_", "")
        data["work_mode"] = wm
    
    if data.get("employment_type"):
        et = data["employment_type"].lower()
        employment_map = {
            "full": "full-time",
            "part": "part-time",
            "b2b": "b2b",
            "intern": "internship",
            "contract": "contract"
        }
        for key, value in employment_map.items():
            if key in et:
                data["employment_type"] = value
                break
    
    if data.get("salary"):
        salary = data["salary"]
        if salary.get("currency"):
            salary["currency"] = salary["currency"].upper()
        if salary.get("unit"):
            unit = salary["unit"].lower()
            unit_map = {"month": "month", "year": "year", "hour": "hour"}
            for key, value in unit_map.items():
                if key in unit:
                    salary["unit"] = value
                    break
        if salary.get("gross_net"):
            salary["gross_net"] = salary["gross_net"].lower()
    
    return data
