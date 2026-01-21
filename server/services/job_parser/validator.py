from typing import Dict, List, Optional, Any
from .models import JobPosting, WorkMode, EmploymentType, Currency, SalaryUnit, GrossNet
import logging

logger = logging.getLogger(__name__)


KNOWN_TECHNOLOGIES = {
    "AWS", "Azure", "GCP", "Google Cloud", "DigitalOcean", "Heroku",
    "EKS", "ECS", "EC2", "S3", "Lambda", "CloudWatch", "IAM",
    "Azure VM", "Azure Networking", "Azure Storage",
    
    "Docker", "Kubernetes", "Helm", "Rancher", "OpenShift",
    
    "Terraform", "Ansible", "Puppet", "Chef", "CloudFormation",
    
    "CI/CD", "Jenkins", "GitLab CI", "GitHub Actions", "CircleCI", "Travis CI",
    "ArgoCD", "Flux",
    
    "Python", "Go", "Java", "JavaScript", "TypeScript", "Bash", "PowerShell",
    "C++", "C#", "Ruby", "PHP", "Rust", "Scala",
    
    "PostgreSQL", "MySQL", "MongoDB", "Redis", "Elasticsearch", "Cassandra",
    "DynamoDB", "Oracle", "SQL Server",
    
    "Prometheus", "Grafana", "Datadog", "New Relic", "Splunk", "ELK",
    "CloudWatch", "Kibana", "Logstash",
    
    "Nginx", "Apache", "HAProxy", "Traefik",
    
    "Kafka", "RabbitMQ", "Redis", "NATS",
    
    "TCP", "UDP", "DNS", "HTTP", "HTTPS", "SSL", "TLS", "VPN",
    
    "Linux", "Unix", "Windows", "Git", "SVN",
}


def normalize_technology(tech: str) -> Optional[str]:
    tech_clean = tech.strip()
    
    if tech_clean in KNOWN_TECHNOLOGIES:
        return tech_clean
    
    for known_tech in KNOWN_TECHNOLOGIES:
        if tech_clean.lower() == known_tech.lower():
            return known_tech
    
    tech_upper = tech_clean.upper()
    if tech_upper in KNOWN_TECHNOLOGIES:
        return tech_upper
    
    if len(tech_clean) > 1:
        return tech_clean
    
    return None


def normalize_location(location: Optional[str]) -> Optional[str]:
    if not location:
        return None
        
    loc = location.strip()
    
    # Remove postal codes (e.g. 30-307)
    import re
    loc = re.sub(r'\b\d{2}-\d{3}\b', '', loc).strip()
    
    # Common mappings
    mappings = {
        "warszawa": "Warsaw",
        "kraków": "Krakow",
        "wrocław": "Wroclaw",
        "poznań": "Poznan",
        "gdańsk": "Gdansk",
        "łódź": "Lodz",
        "białystok": "Bialystok",
        "katowice": "Katowice",
        "lublin": "Lublin",
        "rzeszów": "Rzeszow",
        "szczecin": "Szczecin",
        "bydgoszcz": "Bydgoszcz",
        "gdynia": "Gdynia",
    }
    
    # Simple check if city is in string regardless of other text (if we want to be aggressive)
    loc_lower = loc.lower()
    for pl, en in mappings.items():
        if pl in loc_lower:
            return en
            
    # Remove trailing numbers or generic text if simple
    
    return loc

def validate_and_clean_job_posting(data: Dict[str, Any]) -> JobPosting:
    if data.get("work_mode"):
        try:
            data["work_mode"] = data["work_mode"].lower()
        except: pass
    
    if data.get("location"):
        data["location"] = normalize_location(data["location"])
    
    if data.get("employment_type"):
        try:
            data["employment_type"] = data["employment_type"].lower().replace("_", "-")
        except: pass
    
    if data.get("salary"):
        salary = data["salary"]
        if salary.get("currency"):
            salary["currency"] = salary["currency"].upper()
        if salary.get("unit"):
            try:
                salary["unit"] = salary["unit"].lower()
            except: pass
        if salary.get("gross_net"):
            try:
                salary["gross_net"] = salary["gross_net"].lower()
            except: pass
    
    if "stack" in data:
        stack_cleaned = []
        for tech in data["stack"]:
            normalized = normalize_technology(tech)
            if normalized and normalized not in stack_cleaned:
                stack_cleaned.append(normalized)
        data["stack"] = stack_cleaned
        logger.info(f"Cleaned stack: {len(data['stack'])} technologies")
    
    if "nice_to_have_stack" in data:
        nice_stack_cleaned = []
        for tech in data["nice_to_have_stack"]:
            normalized = normalize_technology(tech)
            if normalized and normalized not in nice_stack_cleaned:
                nice_stack_cleaned.append(normalized)
        data["nice_to_have_stack"] = nice_stack_cleaned
        logger.info(f"Cleaned nice_to_have_stack: {len(data['nice_to_have_stack'])} technologies")
    
    try:
        job_posting = JobPosting(**data)
        logger.info(f"Successfully validated job posting: {job_posting.job_title}")
        return job_posting
    except Exception as e:
        logger.error(f"Validation failed: {e}")
        logger.error(f"Data: {data}")
        # Explicitly swallow validation errors to avoid crashing background task? 
        # No, 'raise' is better so we can catch it upstream. 
        # But for 'Seniority', if AI returns invalid value, maybe we should be lenient.
        raise

def add_technology_to_whitelist(tech: str):
    KNOWN_TECHNOLOGIES.add(tech.strip())
    logger.info(f"Added to whitelist: {tech}")


class ValidationResult:
    def __init__(self):
        self.is_valid = True
        self.warnings: List[str] = []
        self.errors: List[str] = []
        self.missing_fields: List[str] = []
    
    def add_warning(self, message: str):
        self.warnings.append(message)
    
    def add_error(self, message: str):
        self.errors.append(message)
        self.is_valid = False
    
    def add_missing_field(self, field: str):
        self.missing_fields.append(field)
        self.add_warning(f"Field '{field}' is not filled")
    
    def get_report(self) -> Dict:
        return {
            "is_valid": self.is_valid,
            "warnings": self.warnings,
            "errors": self.errors,
            "missing_fields": self.missing_fields
        }


def validate_job_posting(job: JobPosting, strict: bool = False) -> ValidationResult:
    result = ValidationResult()
    
    critical_fields = {
        "job_title": job.job_title,
        "company": job.company,
    }
    
    for field_name, field_value in critical_fields.items():
        if not field_value or (isinstance(field_value, str) and not field_value.strip()):
            if strict:
                result.add_error(f"Critical field '{field_name}' is not filled")
            else:
                result.add_missing_field(field_name)
    
    important_fields = {
        "location": job.location,
        "employment_type": job.employment_type,
        "stack": job.stack,
        "requirements": job.requirements,
    }
    
    for field_name, field_value in important_fields.items():
        if not field_value or (isinstance(field_value, list) and len(field_value) == 0):
            result.add_missing_field(field_name)
    
    if job.stack:
        long_skills = [skill for skill in job.stack if len(skill.split()) > 5]
        if long_skills:
            result.add_warning(
                f"stack contains long strings (possibly requirements): {long_skills[:3]}"
            )
    
    if job.requirements:
        short_reqs = [req for req in job.requirements if len(req.split()) < 3]
        if short_reqs:
            result.add_warning(
                f"requirements contains short strings (possibly skills): {short_reqs[:3]}"
            )
    
    if job.salary:
        if job.salary.min and job.salary.max:
            if job.salary.min > job.salary.max:
                result.add_error(f"Minimum salary ({job.salary.min}) is greater than maximum ({job.salary.max})")
        
        if (job.salary.min or job.salary.max) and not job.salary.currency:
            result.add_warning("Salary is specified but currency is not")
    
    if job.stack and job.nice_to_have_stack:
        duplicates = set(job.stack) & set(job.nice_to_have_stack)
        if duplicates:
            result.add_warning(f"Duplicate skills in stack and nice_to_have_stack: {list(duplicates)}")
    
    return result


def auto_fix_job_posting(job: JobPosting) -> JobPosting:
    # Remove empty strings and duplicates
    job.stack = list(dict.fromkeys([s.strip() for s in job.stack if s and s.strip()]))
    job.nice_to_have_stack = list(dict.fromkeys([s.strip() for s in job.nice_to_have_stack if s and s.strip()]))
    job.responsibilities = [s.strip() for s in job.responsibilities if s and s.strip()]
    job.requirements = [s.strip() for s in job.requirements if s and s.strip()]
    
    return job
