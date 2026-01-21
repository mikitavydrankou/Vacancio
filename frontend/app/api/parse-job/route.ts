import { type NextRequest, NextResponse } from "next/server"

interface ParsedJobData {
  company: string
  position: string
  location?: string
  salary?: string
  techStack: string[]
  responsibilities: string[]
  source: string
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 })
    }

    const hostname = new URL(url).hostname.toLowerCase()

    // Fetch the page HTML
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5,pl;q=0.3",
      },
    })

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch job page" }, { status: 500 })
    }

    const html = await response.text()
    let parsed: ParsedJobData

    // Parse based on source
    if (hostname.includes("nofluffjobs.com")) {
      parsed = parseNoFluffJobs(html)
    } else if (hostname.includes("justjoin.it")) {
      parsed = parseJustJoinIt(html)
    } else if (hostname.includes("pracuj.pl")) {
      parsed = parsePracuj(html)
    } else if (hostname.includes("indeed.")) {
      parsed = parseIndeed(html)
    } else if (hostname.includes("linkedin.com")) {
      parsed = parseLinkedIn(html)
    } else {
      parsed = parseGeneric(html)
    }

    return NextResponse.json(parsed)
  } catch (error) {
    console.error("Parse error:", error)
    return NextResponse.json({ error: "Failed to parse job listing" }, { status: 500 })
  }
}

function parseNoFluffJobs(html: string): ParsedJobData {
  const data: ParsedJobData = {
    company: "",
    position: "",
    techStack: [],
    responsibilities: [],
    source: "nofluffjobs",
  }

  // Position - usually in h1 or title
  const titleMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/i)
  if (titleMatch) {
    data.position = cleanText(titleMatch[1])
  }

  // Company name
  const companyMatch =
    html.match(/data-cy="company-name"[^>]*>([^<]+)</i) || html.match(/<a[^>]*href="\/company\/[^"]*"[^>]*>([^<]+)</i)
  if (companyMatch) {
    data.company = cleanText(companyMatch[1])
  }

  // Salary - NoFluffJobs shows salary ranges
  const salaryMatch = html.match(/(\d[\d\s]*(?:–|-)\s*\d[\d\s]*)\s*PLN/i)
  if (salaryMatch) {
    data.salary = salaryMatch[1].replace(/\s/g, "") + " PLN"
  }

  // Location
  const locationMatch =
    html.match(/data-cy="location"[^>]*>([^<]+)</i) ||
    html.match(/location[^>]*>([^<]*(?:Warsaw|Krakow|Wroclaw|Remote|Gdansk|Poznan)[^<]*)</i)
  if (locationMatch) {
    data.location = cleanText(locationMatch[1])
  }

  // Tech stack - look for technology tags
  const techMatches = html.matchAll(/data-cy="technology-[^"]*"[^>]*>([^<]+)</gi)
  for (const match of techMatches) {
    const tech = cleanText(match[1])
    if (tech && !data.techStack.includes(tech)) {
      data.techStack.push(tech)
    }
  }

  // Also try common tech patterns
  const commonTech = extractCommonTech(html)
  data.techStack = [...new Set([...data.techStack, ...commonTech])]

  return data
}

function parseJustJoinIt(html: string): ParsedJobData {
  const data: ParsedJobData = {
    company: "",
    position: "",
    techStack: [],
    responsibilities: [],
    source: "justjoin",
  }

  // Position from title or h1
  const titleMatch = html.match(/<title>([^|<]+)/i) || html.match(/<h1[^>]*>([^<]+)<\/h1>/i)
  if (titleMatch) {
    data.position = cleanText(titleMatch[1].split("|")[0].split("-")[0])
  }

  // Company
  const companyMatch = html.match(/company[^>]*name[^>]*>([^<]+)</i) || html.match(/"companyName"\s*:\s*"([^"]+)"/i)
  if (companyMatch) {
    data.company = cleanText(companyMatch[1])
  }

  // Salary
  const salaryMatch = html.match(/(\d[\d\s]*(?:–|-|to)\s*\d[\d\s]*)\s*(?:PLN|zł)/i)
  if (salaryMatch) {
    data.salary = salaryMatch[1].replace(/\s/g, "").replace("to", "-") + " PLN"
  }

  // Location
  const locationMatch = html.match(/"city"\s*:\s*"([^"]+)"/i)
  if (locationMatch) {
    data.location = cleanText(locationMatch[1])
  }

  // Tech from JSON-LD or common patterns
  const techMatches = html.matchAll(/"skill[s]?"\s*:\s*\[([^\]]+)\]/gi)
  for (const match of techMatches) {
    const skills = match[1].match(/"([^"]+)"/g)
    if (skills) {
      skills.forEach((s) => {
        const skill = s.replace(/"/g, "")
        if (skill && !data.techStack.includes(skill)) {
          data.techStack.push(skill)
        }
      })
    }
  }

  data.techStack = [...new Set([...data.techStack, ...extractCommonTech(html)])]

  return data
}

function parsePracuj(html: string): ParsedJobData {
  const data: ParsedJobData = {
    company: "",
    position: "",
    techStack: [],
    responsibilities: [],
    source: "pracuj",
  }

  // Position
  const titleMatch =
    html.match(/<h1[^>]*data-test="text-positionName"[^>]*>([^<]+)</i) || html.match(/<h1[^>]*>([^<]+)<\/h1>/i)
  if (titleMatch) {
    data.position = cleanText(titleMatch[1])
  }

  // Company
  const companyMatch =
    html.match(/data-test="text-employerName"[^>]*>([^<]+)</i) || html.match(/employer[^>]*>([^<]+)</i)
  if (companyMatch) {
    data.company = cleanText(companyMatch[1])
  }

  // Salary
  const salaryMatch =
    html.match(/data-test="text-earningAmount"[^>]*>([^<]+)</i) ||
    html.match(/(\d[\d\s]*(?:–|-)\s*\d[\d\s]*)\s*(?:PLN|zł)/i)
  if (salaryMatch) {
    data.salary = cleanText(salaryMatch[1])
  }

  // Location
  const locationMatch = html.match(/data-test="text-workplaceAddress"[^>]*>([^<]+)</i)
  if (locationMatch) {
    data.location = cleanText(locationMatch[1])
  }

  data.techStack = extractCommonTech(html)

  return data
}

function parseIndeed(html: string): ParsedJobData {
  const data: ParsedJobData = {
    company: "",
    position: "",
    techStack: [],
    responsibilities: [],
    source: "indeed",
  }

  // Position
  const titleMatch = html.match(/jobsearch-JobInfoHeader-title[^>]*>([^<]+)</i) || html.match(/<h1[^>]*>([^<]+)<\/h1>/i)
  if (titleMatch) {
    data.position = cleanText(titleMatch[1])
  }

  // Company
  const companyMatch = html.match(/data-company-name="([^"]+)"/i) || html.match(/companyName[^>]*>([^<]+)</i)
  if (companyMatch) {
    data.company = cleanText(companyMatch[1])
  }

  // Location
  const locationMatch = html.match(/data-job-loc[^>]*>([^<]+)</i) || html.match(/companyLocation[^>]*>([^<]+)</i)
  if (locationMatch) {
    data.location = cleanText(locationMatch[1])
  }

  data.techStack = extractCommonTech(html)

  return data
}

function parseLinkedIn(html: string): ParsedJobData {
  const data: ParsedJobData = {
    company: "",
    position: "",
    techStack: [],
    responsibilities: [],
    source: "linkedin",
  }

  // Position
  const titleMatch = html.match(/top-card-layout__title[^>]*>([^<]+)</i) || html.match(/<h1[^>]*>([^<]+)<\/h1>/i)
  if (titleMatch) {
    data.position = cleanText(titleMatch[1])
  }

  // Company
  const companyMatch = html.match(/topcard__org-name-link[^>]*>([^<]+)</i) || html.match(/company-name[^>]*>([^<]+)</i)
  if (companyMatch) {
    data.company = cleanText(companyMatch[1])
  }

  // Location
  const locationMatch = html.match(/topcard__flavor--bullet[^>]*>([^<]+)</i)
  if (locationMatch) {
    data.location = cleanText(locationMatch[1])
  }

  data.techStack = extractCommonTech(html)

  return data
}

function parseGeneric(html: string): ParsedJobData {
  const data: ParsedJobData = {
    company: "",
    position: "",
    techStack: [],
    responsibilities: [],
    source: "other",
  }

  // Try to get title from h1 or <title>
  const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i)
  const titleMatch = html.match(/<title>([^<]+)<\/title>/i)

  if (h1Match) {
    data.position = cleanText(h1Match[1])
  } else if (titleMatch) {
    data.position = cleanText(titleMatch[1].split("|")[0].split("-")[0])
  }

  data.techStack = extractCommonTech(html)

  return data
}

// Helper to extract common tech keywords
function extractCommonTech(html: string): string[] {
  const techKeywords = [
    "Kubernetes",
    "Docker",
    "AWS",
    "Azure",
    "GCP",
    "Terraform",
    "Ansible",
    "Jenkins",
    "GitLab",
    "GitHub Actions",
    "CI/CD",
    "Linux",
    "Python",
    "Go",
    "Golang",
    "Bash",
    "Shell",
    "JavaScript",
    "TypeScript",
    "Node.js",
    "React",
    "PostgreSQL",
    "MySQL",
    "MongoDB",
    "Redis",
    "Kafka",
    "RabbitMQ",
    "Prometheus",
    "Grafana",
    "ELK",
    "Elasticsearch",
    "Helm",
    "ArgoCD",
    "Vault",
    "Consul",
    "Nginx",
    "Java",
    "Spring",
    ".NET",
    "C#",
    "Ruby",
    "PHP",
    "Rust",
    "Scala",
  ]

  const found: string[] = []
  const lowerHtml = html.toLowerCase()

  for (const tech of techKeywords) {
    if (lowerHtml.includes(tech.toLowerCase())) {
      found.push(tech)
    }
  }

  return found.slice(0, 15) // Limit to avoid noise
}

function cleanText(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim()
}
