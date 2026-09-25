import { SITE_INFO } from "@/config/site"
import { AWARDS } from "@/features/portfolio/data/awards"
import { CERTIFICATIONS } from "@/features/portfolio/data/certifications"
import { EXPERIENCES } from "@/features/portfolio/data/experiences"
import { PROJECTS } from "@/features/portfolio/data/projects"
import { PUBLICATIONS } from "@/features/portfolio/data/publications"
import { TECH_STACK } from "@/features/portfolio/data/tech-stack"
import { USER } from "@/features/portfolio/data/user"
import { decodeEmail } from "@/utils/string"

export interface WebMCPToolDefinition {
  name: string
  description: string
  inputSchema: {
    type: "object"
    properties: Record<
      string,
      {
        type: string
        description?: string
        enum?: string[]
        items?: { type: string }
      }
    >
    required?: string[]
    additionalProperties?: boolean
  }
  readOnlyHint?: boolean
  untrustedContentHint?: boolean
  execute: (params: Record<string, unknown>) => Promise<unknown> | unknown
}

export function getPortfolioWebMCPTools(): WebMCPToolDefinition[] {
  const email = decodeEmail(USER.email)
  const baseUrl = SITE_INFO.url

  const techCategories = Array.from(
    new Set(TECH_STACK.flatMap((item) => item.categories))
  )
  const techSummary = techCategories.map((cat) => ({
    category: cat,
    skills: TECH_STACK.filter((item) => item.categories.includes(cat)).map((i) => i.title),
  }))

  return [
    {
      name: "search_projects",
      description:
        "Search Firdaus Khotibul Zickrian's portfolio projects by keyword, technology, or category.",
      inputSchema: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Keyword to search across project title, tagline, or technologies (e.g., 'machine learning', 'leadsup', 'solidity').",
          },
          category: {
            type: "string",
            description: "Filter by project category.",
            enum: ["all", "ai", "ml", "web", "web3", "data"],
          },
          limit: {
            type: "number",
            description: "Maximum number of projects to return (default: 10).",
          },
        },
        additionalProperties: false,
      },
      readOnlyHint: true,
      execute: async (params: Record<string, unknown>) => {
        const query = typeof params.query === "string" ? params.query : undefined
        const category = typeof params.category === "string" ? params.category : undefined
        const limit = typeof params.limit === "number" ? params.limit : 10

        let results = PROJECTS

        if (category && category !== "all") {
          const lowerCat = category.toLowerCase()
          results = results.filter((p) => p.category.toLowerCase().includes(lowerCat))
        }

        if (query) {
          const q = query.toLowerCase()
          results = results.filter(
            (p) =>
              p.title.toLowerCase().includes(q) ||
              p.tagline.toLowerCase().includes(q) ||
              (p.description && p.description.toLowerCase().includes(q)) ||
              p.skills.some((t) => t.toLowerCase().includes(q)) ||
              (p.coverSkills && p.coverSkills.some((s) => s.toLowerCase().includes(q)))
          )
        }

        const formatted = results.slice(0, limit).map((p) => ({
          id: p.id,
          title: p.title,
          category: p.category,
          period: `${p.period.start}${p.period.end ? ` – ${p.period.end}` : " – Present"}`,
          tagline: p.tagline,
          role: p.collaboration.role,
          ownership: p.collaboration.ownership,
          skills: p.skills,
          coverSkills: p.coverSkills ?? [],
          url: `${baseUrl}/projects/${p.id}`,
          liveUrl: p.links.live ?? null,
          repoUrl: p.links.repo ?? null,
        }))

        return {
          totalCount: results.length,
          returnedCount: formatted.length,
          projects: formatted,
        }
      },
    },
    {
      name: "get_project_details",
      description:
        "Retrieve comprehensive architecture, features, highlights, and contributions for a specific project by slug or ID.",
      inputSchema: {
        type: "object",
        properties: {
          slug: {
            type: "string",
            description: "Project slug or ID (e.g., 'leadsup', 'naratioai', 'custora', 'base-realms', 'machine-learning-system', 'polsekrembang', 'lostandfound').",
          },
        },
        required: ["slug"],
        additionalProperties: false,
      },
      readOnlyHint: true,
      execute: async (params: Record<string, unknown>) => {
        const slug = typeof params.slug === "string" ? params.slug : ""
        const normalized = slug.trim().toLowerCase()
        const project = PROJECTS.find(
          (p) => p.id.toLowerCase() === normalized || p.title.toLowerCase().includes(normalized)
        )

        if (!project) {
          return {
            error: `Project with identifier '${slug}' was not found.`,
            availableProjectIds: PROJECTS.map((p) => p.id),
          }
        }

        return {
          id: project.id,
          title: project.title,
          category: project.category,
          period: `${project.period.start}${project.period.end ? ` – ${project.period.end}` : " – Present"}`,
          role: project.collaboration.role,
          ownership: project.collaboration.ownership,
          team: project.collaboration.team,
          tagline: project.tagline,
          description: project.description ?? null,
          features: project.features ?? [],
          impact: project.impact ?? [],
          contributions: project.collaboration.contributions ?? [],
          skills: project.skills,
          coverSkills: project.coverSkills ?? [],
          liveUrl: project.links.live ?? null,
          repoUrl: project.links.repo ?? null,
          url: `${baseUrl}/projects/${project.id}`,
        }
      },
    },
    {
      name: "get_profile_overview",
      description:
        "Retrieve Firdaus Khotibul Zickrian's professional bio, academic record (UDINUS GPA 3.88), core skillset, awards, publications, and contact channels.",
      inputSchema: {
        type: "object",
        properties: {
          includeCertifications: {
            type: "boolean",
            description: "Whether to include the full list of 30+ professional certifications (default: true).",
          },
          includeAwards: {
            type: "boolean",
            description: "Whether to include honors and hackathon awards (default: true).",
          },
        },
        additionalProperties: false,
      },
      readOnlyHint: true,
      execute: async (params: Record<string, unknown>) => {
        const includeCertifications =
          typeof params.includeCertifications === "boolean"
            ? params.includeCertifications
            : true
        const includeAwards =
          typeof params.includeAwards === "boolean" ? params.includeAwards : true

        return {
          name: USER.displayName,
          jobTitle: USER.jobTitle,
          location: USER.address,
          email,
          phone: USER.phone,
          website: baseUrl,
          socialProfiles: {
            github: "https://github.com/zickrian",
            linkedin: "https://linkedin.com/in/firdauskhotibulzickrian/",
            huggingface: "https://huggingface.co/zickrian",
            medium: "https://medium.com/@zickriann",
          },
          education: {
            institution: "Universitas Dian Nuswantoro (UDINUS)",
            degree: "Bachelor of Computer Science (S.Kom)",
            period: "2023 – Present (Expected Graduation: October 2027)",
            gpa: "3.88 / 4.00",
            creditsCompleted: "129 of 144 credits",
            focusAreas: ["Machine Learning", "Data Analytics", "Predictive Analytics", "AI Systems"],
          },
          bio: USER.bio,
          techStackSummary: techSummary,
          awards: includeAwards
            ? AWARDS.map((a) => ({
                title: a.title,
                prize: a.prize,
                grade: a.grade,
                date: a.date,
                details: a.description ?? null,
              }))
            : undefined,
          publications: PUBLICATIONS.map((pub) => ({
            title: pub.title,
            journal: pub.journal,
            date: pub.date,
            url: pub.url,
            summary: pub.description,
          })),
          certificationsCount: CERTIFICATIONS.length,
          certifications: includeCertifications
            ? CERTIFICATIONS.slice(0, 15).map((c) => ({
                title: c.title,
                issuer: c.issuer,
                date: c.issueDate,
                credentialID: c.credentialID || null,
              }))
            : undefined,
        }
      },
    },
    {
      name: "get_experiences",
      description:
        "Retrieve chronological career history, internships (e.g. PT Custompedia Creative Group), leadership roles, and laboratory assistant positions.",
      inputSchema: {
        type: "object",
        properties: {
          currentOnly: {
            type: "boolean",
            description: "If true, returns only current active positions.",
          },
        },
        additionalProperties: false,
      },
      readOnlyHint: true,
      execute: async (params: Record<string, unknown>) => {
        const currentOnly =
          typeof params.currentOnly === "boolean" ? params.currentOnly : false

        let list = EXPERIENCES
        if (currentOnly) {
          list = list.filter((e) => e.isCurrentEmployer)
        }

        return list.map((exp) => ({
          companyName: exp.companyName,
          companyWebsite: exp.companyWebsite ?? null,
          isCurrentEmployer: exp.isCurrentEmployer ?? false,
          positions: exp.positions.map((pos) => ({
            title: pos.title,
            period: `${pos.employmentPeriod.start} – ${pos.employmentPeriod.end ?? "Present"}`,
            type: pos.employmentType,
            description: pos.description,
            skills: pos.skills ?? [],
          })),
        }))
      },
    },
    {
      name: "send_contact_message",
      description:
        "Send an inquiry, collaboration proposal, or message directly to Firdaus Khotibul Zickrian via the verified portfolio mailer.",
      inputSchema: {
        type: "object",
        properties: {
          senderName: {
            type: "string",
            description: "Full name of the person sending the message.",
          },
          senderEmail: {
            type: "string",
            description: "Valid email address to receive replies.",
          },
          subject: {
            type: "string",
            description: "Subject or topic of the message.",
          },
          message: {
            type: "string",
            description: "Detailed message body or inquiry.",
          },
        },
        required: ["senderName", "senderEmail", "subject", "message"],
        additionalProperties: false,
      },
      readOnlyHint: false,
      execute: async (params: Record<string, unknown>) => {
        const senderName = typeof params.senderName === "string" ? params.senderName : ""
        const senderEmail = typeof params.senderEmail === "string" ? params.senderEmail : ""
        const subject = typeof params.subject === "string" ? params.subject : ""
        const message = typeof params.message === "string" ? params.message : ""

        try {
          const res = await fetch("/api/contact", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ senderName, senderEmail, subject, message }),
          })

          const data = (await res.json()) as { error?: string }
          if (!res.ok) {
            return {
              ok: false,
              error: data.error || "Failed to send message.",
            }
          }

          return {
            ok: true,
            message: "Your message has been successfully sent to Firdaus Khotibul Zickrian.",
          }
        } catch (err: unknown) {
          const errMsg = err instanceof Error ? err.message : "Network error while sending contact message."
          return {
            ok: false,
            error: errMsg,
          }
        }
      },
    },
  ]
}

/**
 * Registers WebMCP tools with the browser agent context if available.
 * Implements progressive enhancement with zero overhead on non-WebMCP browsers.
 */
export async function registerWebMCPTools(): Promise<void> {
  if (typeof window === "undefined") return

  const tools = getPortfolioWebMCPTools()

  try {
    // Check document.modelContext or navigator.modelContext
    const docModelContext = (document as unknown as { modelContext?: { registerTool?: (t: WebMCPToolDefinition) => Promise<void>; provideContext?: (c: { tools: WebMCPToolDefinition[] }) => Promise<void> } }).modelContext
    const navModelContext = (navigator as unknown as { modelContext?: { registerTool?: (t: WebMCPToolDefinition) => Promise<void>; provideContext?: (c: { tools: WebMCPToolDefinition[] }) => Promise<void> } }).modelContext

    const context = docModelContext || navModelContext

    if (context) {
      if (typeof context.provideContext === "function") {
        await context.provideContext({ tools })
      } else if (typeof context.registerTool === "function") {
        for (const tool of tools) {
          await context.registerTool(tool)
        }
      }
    }

    // Expose window.__webmcp_tools__ for testing interfaces / agent inspectors
    ;(window as unknown as { __webmcp_tools__?: WebMCPToolDefinition[] }).__webmcp_tools__ = tools
  } catch (err) {
    // Non-blocking: fail silently if WebMCP experimental API is in a transition state
    console.debug("[WebMCP] Registration note:", err)
  }
}
