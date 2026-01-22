from typing import Optional
from .models import JobPosting
import logging
import re

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
    "Kibana", "Logstash",
    "Nginx", "Apache", "HAProxy", "Traefik",
    "Kafka", "RabbitMQ", "NATS",
    "TCP", "UDP", "DNS", "HTTP", "HTTPS", "SSL", "TLS", "VPN",
    "Linux", "Unix", "Windows", "Git", "SVN",
}

LOCATION_MAPPINGS = {
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
    loc = re.sub(r'\b\d{2}-\d{3}\b', '', loc).strip()
    
    loc_lower = loc.lower()
    for pl, en in LOCATION_MAPPINGS.items():
        if pl in loc_lower:
            return en
    
    return loc


def auto_fix_job_posting(job: JobPosting) -> JobPosting:
    job.stack = list(dict.fromkeys([s.strip() for s in job.stack if s and s.strip()]))
    job.nice_to_have_stack = list(dict.fromkeys([s.strip() for s in job.nice_to_have_stack if s and s.strip()]))
    job.responsibilities = [s.strip() for s in job.responsibilities if s and s.strip()]
    job.requirements = [s.strip() for s in job.requirements if s and s.strip()]
    return job
