import { AWARDS } from "@/features/portfolio/data/awards"
import { CERTIFICATIONS } from "@/features/portfolio/data/certifications"
import { EXPERIENCES } from "@/features/portfolio/data/experiences"
import { PROJECTS } from "@/features/portfolio/data/projects"
import { PUBLICATIONS } from "@/features/portfolio/data/publications"
import { SOCIAL_LINKS } from "@/features/portfolio/data/social-links"
import { TECH_STACK } from "@/features/portfolio/data/tech-stack"
import { USER } from "@/features/portfolio/data/user"

type GitHubContributionStatus = {
  available: boolean
  contributionDays: number
}
type PortfolioDocumentType =
  | "profile"
  | "project"
  | "project-stack"
  | "project-impact"
  | "experience"
  | "experience-skills"
  | "skills"
  | "certification"
  | "award"
  | "publication"
  | "contact"
  | "github"

type PortfolioDocument = {
  id: string
  type: PortfolioDocumentType
  title: string
  summary: string
  details: string[]
  keywords: string[]
  url?: string
  priority: number
  year?: string
}

type RankedDocument = PortfolioDocument & {
  score: number
  reason: string
}

// Baseline types always included regardless of query
const BASELINE_TYPES = new Set<PortfolioDocumentType>(["profile", "contact"])

// Where the FULL list of each type actually lives on the site, used to tell
// the model where to send the user when the retrieved context only shows a
// subset. Projects have a dedicated page; the rest live in homepage sections.
const SECTION_LINKS: Partial<
  Record<PortfolioDocumentType, { total: number; url: string; noun: string }>
> = {
  project: {
    total: PROJECTS.length,
    url: `${USER.website}/projects`,
    noun: "project",
  },
  experience: {
    total: EXPERIENCES.reduce((sum, exp) => sum + exp.positions.length, 0),
    url: `${USER.website}/#experience`,
    noun: "role",
  },
  award: {
    total: AWARDS.length,
    url: `${USER.website}/#awards`,
    noun: "award",
  },
  certification: {
    total: CERTIFICATIONS.length,
    url: `${USER.website}/#certs`,
    noun: "certification",
  },
  publication: {
    total: PUBLICATIONS.length,
    url: `${USER.website}/#publications`,
    noun: "publication",
  },
}

// Hard request budget. The fixed wrappers are intentionally included in the
// remaining 200-character buffer below.
const MAX_CONTEXT_CHARS = 4200
const PRIMARY_SLOT_BUDGET = 2000
const DIVERSITY_SLOT_BUDGET = 900
// Minimum score for a doc to enter the diversity slot - prevents irrelevant noise
const DIVERSITY_MIN_SCORE = 15
// Lower threshold for broad "semua" queries - we want more docs, not fewer
const DIVERSITY_MIN_SCORE_BROAD = 10

// ─── Module-level IDF Cache ────────────────────────────────────────────────
// The static portfolio corpus (without per-request github data) never changes
// between requests in the same server instance. Computing IDF once and caching
// it eliminates ~10–20ms of CPU waste on every chat request.
let _cachedStaticIdf: Map<string, number> | null = null

function getStaticIdf(): Map<string, number> {
  if (!_cachedStaticIdf) {
    const staticCorpus = createPortfolioCorpus(
      { available: false, contributionDays: 0 },
      undefined
    )
    _cachedStaticIdf = computeIdf(staticCorpus)
  }
  return _cachedStaticIdf
}

function decodeBase64(value: string) {
  try {
    return Buffer.from(value, "base64").toString("utf8")
  } catch {
    return undefined
  }
}

function compactText(value: string | undefined, maxLength = 1500) {
  if (!value) return undefined

  const normalized = value
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .join("\n")
    .trim()

  if (normalized.length <= maxLength) return normalized

  return `${normalized.slice(0, maxLength - 1).trim()}...`
}

function formatPeriod(period: { start: string; end?: string }) {
  return `${period.start} - ${period.end || "Present"}`
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
}

const STOPWORDS = new Set([
  // Indonesian
  "dimana",
  "yang",
  "dan",
  "aku",
  "saya",
  "kamu",
  "itu",
  "ini",
  "di",
  "ke",
  "dari",
  "untuk",
  "buat",
  "apa",
  "aja",
  "saja",
  "pernah",
  "bantu",
  "bikin",
  "lo",
  "gue",
  "lu",
  "sama",
  "juga",
  "sudah",
  "sudah",
  "punya",
  "ada",
  "belum",
  "bisa",
  "mau",
  "minta",
  "tolong",
  "coba",
  "tahu",
  "tau",
  // English
  "the",
  "a",
  "an",
  "and",
  "or",
  "but",
  "in",
  "on",
  "at",
  "to",
  "for",
  "of",
  "with",
  "is",
  "where",
  "do",
  "does",
  "did",
  "have",
  "has",
  "had",
  "be",
  "been",
  "being",
  "by",
  "about",
  "can",
  "will",
  "would",
  "could",
  "should",
  "may",
  "might",
  "let",
  "me",
  "my",
  "your",
  "his",
  "her",
])

function tokenize(value: string) {
  return Array.from(
    new Set(
      normalize(value)
        .replace(/[^a-z0-9+#./-]+/g, " ")
        .split(/\s+/)
        .filter((token) => token.length >= 2 && !STOPWORDS.has(token))
    )
  )
}

function joinLines(values: Array<string | undefined | false>) {
  return values.filter((value): value is string => Boolean(value))
}

// ─── Synonym / Query Expansion ─────────────────────────────────────────────

function getQueryExpansions(query: string) {
  const normalized = normalize(query)
  const expansions = new Set<string>()

  const add = (...values: string[]) => {
    for (const value of values) expansions.add(value)
  }

  if (
    /\b(projek|project|portfolio|karya|aplikasi|app|case study|website|web|bikin|buat|jualan|online shop|toko|ecommerce|e-commerce|buatin|ngerjain|develop)\b/.test(
      normalized
    )
  ) {
    add(
      "project",
      "projects",
      "features",
      "impact",
      "role",
      "skills",
      "contribution"
    )
  }

  if (
    /\b(pengalaman|experience|kerja|work|role|posisi|job|startup|perusahaan|kantor|organisasi|magang|intern|cohort|assistant|kerjaan)\b/.test(
      normalized
    )
  ) {
    add(
      "experience",
      "role",
      "company",
      "skills",
      "leadership",
      "cohort",
      "intern"
    )
  }

  if (
    /\b(skill|stack|tech|teknologi|tools|alat|kemampuan|bisa|pakai|pake|gunain|punya)\b/.test(
      normalized
    )
  ) {
    add("skills", "technology", "tools", "stack")
  }

  if (
    /\b(ai|ml|machine learning|data|llm|rag|analytics|analyst|kecerdasan buatan|model|prediksi|klasifikasi|segmentasi|neural|deep learning)\b/.test(
      normalized
    )
  ) {
    add(
      "ai",
      "machine",
      "learning",
      "data",
      "analytics",
      "llm",
      "rag",
      "python",
      "deep"
    )
  }

  if (
    /\b(kontak|contact|email|phone|telepon|linkedin|github|social|sosial|hubungi|reach|dm|pesan)\b/.test(
      normalized
    )
  ) {
    add("contact", "email", "phone", "social", "github", "linkedin")
  }

  if (
    /\b(cocok|fit|relevant|relevan|interview|recruiter|hire|hiring|pas|qualified|layak|sesuai)\b/.test(
      normalized
    )
  ) {
    add("fit", "role", "impact", "contribution", "experience", "project")
  }

  if (
    /\b(lomba|hackathon|juara|award|kompetisi|prestasi|basehackathon|menang|winner|champion)\b/.test(
      normalized
    )
  ) {
    add(
      "award",
      "achievement",
      "prestasi",
      "juara",
      "lomba",
      "hackathon",
      "competition"
    )
  }

  if (
    /\b(kuliah|kampus|sekolah|belajar|lulus|pendidikan|education|university|college|degree|sma|smk|sarjana|mahasiswa|jurusan|studi|akademik|ipk)\b/.test(
      normalized
    )
  ) {
    add(
      "education",
      "university",
      "universitas",
      "sekolah",
      "kuliah",
      "kampus",
      "degree",
      "pendidikan",
      "sma",
      "sarjana"
    )
  }

  if (
    /\b(sertifikat|certification|certificate|cert|kursus|course|lisensi|license)\b/.test(
      normalized
    )
  ) {
    add("certification", "certificate", "sertifikat", "credential")
  }

  if (
    /\b(publikasi|publication|paper|jurnal|journal|tulisan|artikel|riset|research)\b/.test(
      normalized
    )
  ) {
    add("publication", "paper", "journal", "publikasi")
  }

  if (
    /\b(blockchain|web3|onchain|crypto|nft|solidity|smart contract|defi|dapp)\b/.test(
      normalized
    )
  ) {
    add("blockchain", "web3", "solidity", "crypto", "base", "onchain")
  }

  if (
    /\b(frontend|backend|fullstack|full stack|ui|ux|interface|design|tampilan)\b/.test(
      normalized
    )
  ) {
    add("frontend", "backend", "fullstack", "react", "next", "typescript")
  }

  return Array.from(expansions)
}

// ─── Query Intent Detection ────────────────────────────────────────────────

function getQueryIntent(query: string) {
  const normalized = normalize(query)

  return {
    wantsAll:
      /\b(all|semua|list|daftar|ringkas semua|overview|summary|semuanya|keseluruhannya)\b/.test(
        normalized
      ),
    wantsDetailed:
      /\b(detail|details|lengkap|komprehensif|deep|rinci|rincian|full|total|ceritain|cerita)\b/.test(
        normalized
      ),
    wantsContact:
      /\b(kontak|contact|email|phone|telepon|whatsapp|linkedin|social|sosial|hubungi|reach|dm)\b/.test(
        normalized
      ),
    wantsProfile:
      /\b(tell me about yourself|about yourself|perkenalan|kenalin|siapa|profile|profil|about|diri kamu|dirimu)\b/.test(
        normalized
      ),
    wantsProjects:
      /\b(project|projects|projek|portfolio|karya|aplikasi|app|case study|website|web|buatin|ngerjain)\b/.test(
        normalized
      ),
    wantsExperience:
      /\b(experience|pengalaman|kerja|work|job|role|posisi|cohort|assistant|startup|perusahaan|magang|intern|kerjaan|pernah kerja|pernah gabung|pernah bekerja)\b/.test(
        normalized
      ),
    wantsSkills:
      /\b(skill|skills|stack|tech|teknologi|tools|alat|kemampuan|pake|pakai|gunain|punya)\b/.test(
        normalized
      ),
    wantsCareerFit:
      /\b(cocok|fit|relevant|relevan|interview|recruiter|hire|hiring|role|posisi|qualified|layak)\b/.test(
        normalized
      ),
    wantsAward:
      /\b(lomba|hackathon|juara|award|kompetisi|prestasi|basehackathon|menang|winner|contest|competition|finalis|finalist|pernah lomba|pernah hackathon|pernah ikut|pernah ikutan|ikut lomba|ikut hackathon|ikut kompetisi|lomba apa|hackathon apa)\b/.test(
        normalized
      ),
    wantsEducation:
      /\b(kuliah|kampus|sekolah|belajar|lulus|pendidikan|education|university|college|degree|sma|smk|sarjana|mahasiswa|jurusan|ipk)\b/.test(
        normalized
      ),
    wantsCertification:
      /\b(sertifikat|certification|certificate|cert|kursus|course)\b/.test(
        normalized
      ),
    wantsPublication:
      /\b(publikasi|publication|paper|jurnal|journal|tulisan|artikel|riset)\b/.test(
        normalized
      ),
    wantsStack:
      /\b(stack|tools|teknologi|pakai|pake|gunain|tech|framework|library|bahasa)\b/.test(
        normalized
      ),
    wantsImpact:
      /\b(impact|hasil|result|achievement|pencapaian|dampak|kontribusi|contribution)\b/.test(
        normalized
      ),
    wantsCurrentFocus:
      /\b(sibuk|kesibukan|sekarang lagi|lagi ngapain|lagi apa|fokus sekarang|saat ini|aktivitas|ngerjain apa|now|currently|current focus|what are you doing|what.*doing now|what.*working on|lagi ngapain|lagi kerja)\b/.test(
        normalized
      ),
  }
}

export function hasPortfolioIntent(query: string) {
  const intent = getQueryIntent(query)
  return [
    intent.wantsContact,
    intent.wantsProfile,
    intent.wantsProjects,
    intent.wantsExperience,
    intent.wantsSkills,
    intent.wantsCareerFit,
    intent.wantsAward,
    intent.wantsEducation,
    intent.wantsCertification,
    intent.wantsPublication,
    intent.wantsStack,
    intent.wantsImpact,
    intent.wantsCurrentFocus,
  ].some(Boolean)
}

// ─── IDF Computation ────────────────────────────────────────────────────────

function computeIdf(corpus: PortfolioDocument[]): Map<string, number> {
  const N = corpus.length
  const df = new Map<string, number>()

  for (const doc of corpus) {
    const text = [
      doc.id,
      doc.type,
      doc.title,
      doc.summary,
      ...doc.details,
      ...doc.keywords,
    ].join(" ")
    const tokens = new Set(tokenize(text))
    for (const token of tokens) {
      df.set(token, (df.get(token) ?? 0) + 1)
    }
  }

  const idf = new Map<string, number>()
  for (const [token, count] of df) {
    idf.set(token, Math.log((N + 1) / (count + 1)) + 1)
  }

  return idf
}

// ─── Document Builders ─────────────────────────────────────────────────────

function createProfileDocument(
  intent?: ReturnType<typeof getQueryIntent>
): PortfolioDocument {
  const email = decodeBase64(USER.email)

  // Only include the dense `about` biography when the query is profile/introduction
  // focused. For specific queries (stack, project, sibuk apa, etc.) it adds noise.
  const isProfileFocused =
    !intent ||
    intent.wantsProfile ||
    intent.wantsCurrentFocus ||
    (!intent.wantsProjects &&
      !intent.wantsExperience &&
      !intent.wantsSkills &&
      !intent.wantsStack &&
      !intent.wantsAward &&
      !intent.wantsCertification &&
      !intent.wantsPublication)

  return {
    id: "profile",
    type: "profile",
    title: USER.displayName,
    summary: USER.bio,
    details: joinLines([
      isProfileFocused ? compactText(USER.about, 900) : undefined,
      `Current focus: ${USER.flipSentences.map((item) => item.trim()).join(", ")}.`,
      `Current public roles: ${USER.jobs
        .map((job) => `${job.title} at ${job.company}`)
        .join("; ")}.`,
      `Location: ${USER.address}.`,
      `Website: ${USER.website}.`,
      email ? `Email: ${email}.` : undefined,
      USER.phone ? `Phone: ${USER.phone}.` : undefined,
    ]),
    keywords: [
      USER.displayName,
      USER.username,
      USER.jobTitle,
      USER.bio,
      ...USER.flipSentences,
      ...USER.keywords,
    ],
    url: USER.website,
    priority: 18,
  }
}

function createProjectDocuments(): PortfolioDocument[] {
  const chunks: PortfolioDocument[] = []

  for (const project of PROJECTS) {
    const basePriority =
      project.year === new Date().getFullYear().toString() ? 16 : 13
    const commonKeywords = [
      project.id,
      project.title,
      project.category,
      project.year,
      project.collaboration.role,
      project.collaboration.team,
      project.collaboration.ownership,
    ]

    // Chunk 1: Overview - who, what, when
    chunks.push({
      id: `project:${project.id}`,
      type: "project",
      title: project.title,
      summary: `${project.tagline} Period: ${formatPeriod(project.period)}. Ownership: ${project.collaboration.ownership}. Role: ${project.collaboration.role}.`,
      details: joinLines([
        `Category: ${project.category}. Year: ${project.year}.`,
        `Team: ${project.collaboration.team}.`,
        project.badge ? `Badge: ${project.badge}.` : undefined,
        compactText(project.description, 700),
        `Links: primary ${project.link}; live ${project.links.live || "not available"}; repo ${project.links.repo || "not available"}.`,
      ]),
      keywords: [
        ...commonKeywords,
        project.badge || "",
        project.collaboration.ownership,
      ],
      url: project.link,
      priority: basePriority,
      year: project.year,
    })

    // Chunk 2: Stack - tech, skills, tools only
    chunks.push({
      id: `project:${project.id}:stack`,
      type: "project-stack",
      title: `${project.title} - Tech Stack`,
      summary: `Technologies and tools used in ${project.title}.`,
      details: joinLines([
        `Stack: ${project.skills.join(", ")}.`,
        project.coverSkills?.length
          ? `Highlights: ${project.coverSkills.join(", ")}.`
          : undefined,
      ]),
      keywords: [
        ...commonKeywords,
        ...project.skills,
        ...(project.coverSkills || []),
      ],
      url: project.link,
      priority: basePriority - 1,
      year: project.year,
    })

    // Chunk 3: Impact - features, contributions, results
    chunks.push({
      id: `project:${project.id}:impact`,
      type: "project-impact",
      title: `${project.title} - Contributions & Impact`,
      summary: `Contributions and impact for ${project.title}.`,
      details: joinLines([
        `Features: ${project.features.join(" ")}`,
        `Contributions: ${project.collaboration.contributions.join(" ")}`,
        `Impact: ${project.impact.join(" ")}`,
        project.notes ? `Notes: ${project.notes}.` : undefined,
      ]),
      keywords: [
        ...commonKeywords,
        "impact",
        "contribution",
        "features",
        "result",
        "achievement",
      ],
      url: project.link,
      priority: basePriority - 1,
      year: project.year,
    })
  }

  return chunks
}

function createExperienceDocuments(): PortfolioDocument[] {
  const chunks: PortfolioDocument[] = []

  const educationKeywords = [
    "pendidikan",
    "education",
    "kuliah",
    "kampus",
    "sekolah",
    "university",
    "degree",
    "sarjana",
    "sma",
    "mahasiswa",
    "jurusan",
    "akademik",
    "ipk",
    "studi",
  ]

  for (const experience of EXPERIENCES) {
    for (const position of experience.positions) {
      const isCurrentOrRecent =
        experience.isCurrentEmployer ||
        !position.employmentPeriod.end ||
        parseInt(position.employmentPeriod.end) > new Date().getFullYear()
      const basePriority = isCurrentOrRecent ? 15 : 12
      const isEducation = experience.id === "education"
      const commonKeywords = [
        experience.id,
        position.id,
        experience.companyName,
        position.title,
        position.employmentType || "",
        ...(isEducation ? educationKeywords : []),
      ]

      // Chunk 1: Experience overview + description
      chunks.push({
        id: `experience:${experience.id}:${position.id}`,
        type: "experience",
        title: `${position.title} - ${experience.companyName}`,
        summary: `${position.title} at ${experience.companyName}. Period: ${formatPeriod(position.employmentPeriod)}. Type: ${position.employmentType || "Not specified"}.`,
        details: joinLines([
          compactText(position.description, 900),
          experience.companyWebsite
            ? `Company website: ${experience.companyWebsite}.`
            : undefined,
          experience.isCurrentEmployer
            ? "Marked as current employer."
            : undefined,
        ]),
        keywords: commonKeywords,
        url: experience.companyWebsite,
        priority: basePriority,
      })

      // Chunk 2: Skills for this role (only if skills exist)
      if (position.skills?.length) {
        chunks.push({
          id: `experience:${experience.id}:${position.id}:skills`,
          type: "experience-skills",
          title: `${position.title} - ${experience.companyName} - Skills`,
          summary: `Skills used as ${position.title} at ${experience.companyName}.`,
          details: [`Skills: ${position.skills.join(", ")}.`],
          keywords: [
            ...commonKeywords,
            ...(position.skills || []),
            "skills",
            "kemampuan",
            "tools",
          ],
          url: experience.companyWebsite,
          priority: basePriority - 1,
        })
      }
    }
  }

  return chunks
}

function createSkillsDocument(): PortfolioDocument {
  const grouped = TECH_STACK.reduce<Record<string, string[]>>(
    (groups, tech) => {
      for (const category of tech.categories) {
        groups[category] ??= []
        groups[category].push(tech.title)
      }
      return groups
    },
    {}
  )
  const projectSkills = Array.from(
    new Set(PROJECTS.flatMap((project) => project.skills))
  ).sort()
  const experienceSkills = Array.from(
    new Set(
      EXPERIENCES.flatMap((experience) =>
        experience.positions.flatMap((position) => position.skills || [])
      )
    )
  ).sort()

  return {
    id: "skills",
    type: "skills",
    title: "Skills and Technology Stack",
    summary:
      "Combined technology stack from the portfolio, project skills, and experience skills.",
    details: [
      `Tech stack by category: ${Object.entries(grouped)
        .map(([category, values]) => `${category}: ${values.join(", ")}`)
        .join("; ")}.`,
      `Project skills: ${projectSkills.join(", ")}.`,
      `Experience skills: ${experienceSkills.join(", ")}.`,
    ],
    keywords: [
      "skills",
      "tech stack",
      "technology",
      "kemampuan",
      "tools",
      "stack",
      ...TECH_STACK.map((tech) => tech.title),
      ...projectSkills,
      ...experienceSkills,
    ],
    priority: 14,
  }
}

function createOtherDocuments(
  github: GitHubContributionStatus
): PortfolioDocument[] {
  const email = decodeBase64(USER.email)

  return [
    ...CERTIFICATIONS.map((certification) => ({
      id: `certification:${certification.title}`,
      type: "certification" as const,
      title: certification.title,
      summary: `${certification.title} from ${certification.issuer}, issued ${certification.issueDate}.`,
      details: joinLines([
        certification.credentialID
          ? `Credential ID: ${certification.credentialID}.`
          : undefined,
        certification.credentialURL
          ? `Verification URL: ${certification.credentialURL}.`
          : undefined,
      ]),
      keywords: [
        "certification",
        "certificate",
        "sertifikat",
        "credential",
        "lisensi",
        certification.title,
        certification.issuer,
      ],
      url: certification.credentialURL,
      priority: 9,
    })),
    ...AWARDS.map((award) => ({
      id: `award:${award.id}`,
      type: "award" as const,
      title: `${award.prize} - ${award.title}`,
      summary: `${award.prize} for ${award.title}, ${award.date}, ${award.grade}.`,
      details: joinLines([
        compactText(award.description, 600),
        award.referenceLink ? `Reference: ${award.referenceLink}.` : undefined,
      ]),
      keywords: [
        "award",
        "achievement",
        "prestasi",
        "juara",
        "menang",
        "winner",
        "lomba",
        "kompetisi",
        "hackathon",
        award.prize,
        award.title,
      ],
      url: award.referenceLink,
      priority: 15,
    })),
    ...PUBLICATIONS.map((publication) => ({
      id: `publication:${publication.id}`,
      type: "publication" as const,
      title: publication.title,
      summary: `${publication.title}, ${publication.journal}, ${publication.date}.`,
      details: joinLines([
        compactText(publication.description, 700),
        publication.url ? `URL: ${publication.url}.` : undefined,
      ]),
      keywords: [
        "publication",
        "paper",
        "journal",
        "publikasi",
        "riset",
        "research",
        "artikel",
        publication.title,
        publication.journal,
      ],
      url: publication.url,
      priority: 9,
    })),
    {
      id: "contact",
      type: "contact",
      title: "Contact and Social Links",
      summary: "Public contact and social links available in the portfolio.",
      details: joinLines([
        email ? `Email: ${email}.` : undefined,
        USER.phone ? `Phone: ${USER.phone}.` : undefined,
        `Website: ${USER.website}.`,
        `Social links: ${SOCIAL_LINKS.map((link) =>
          [link.title, link.subtitle, link.href].filter(Boolean).join(" - ")
        ).join("; ")}.`,
      ]),
      keywords: [
        "contact",
        "email",
        "phone",
        "social",
        "linkedin",
        "github",
        "medium",
        "instagram",
        "hubungi",
        "reach",
        "dm",
        ...SOCIAL_LINKS.map((link) => link.title),
      ],
      url: USER.website,
      priority: 16,
    },
    {
      id: "github",
      type: "github",
      title: "GitHub",
      summary: github.available
        ? `GitHub contribution data is available with ${github.contributionDays} active contribution days tracked.`
        : "GitHub contribution data could not be loaded for this request.",
      details: joinLines([
        `GitHub username: ${USER.username}.`,
        `GitHub profile URL: https://github.com/${USER.username}.`,
        github.available
          ? `Active on GitHub with ${github.contributionDays} contribution days tracked - reflects consistent coding and project activity.`
          : "GitHub activity data temporarily unavailable; check the profile directly for up-to-date contribution history.",
        `Explore open-source projects, repositories, and commit history at: https://github.com/${USER.username}.`,
      ]),
      keywords: [
        "github",
        "contribution",
        "commit",
        "repo",
        "open source",
        "open-source",
        USER.username,
      ],
      url: `https://github.com/${USER.username}`,
      priority: 10,
    },
  ]
}

function createPortfolioCorpus(
  github: GitHubContributionStatus,
  intent?: ReturnType<typeof getQueryIntent>
) {
  return [
    createProfileDocument(intent),
    ...createProjectDocuments(),
    ...createExperienceDocuments(),
    createSkillsDocument(),
    ...createOtherDocuments(github),
  ]
}

// ─── Scoring ───────────────────────────────────────────────────────────────

function scoreDocument(
  document: PortfolioDocument,
  query: string,
  queryTokens: string[],
  queryExpansions: string[],
  idf: Map<string, number>
): RankedDocument {
  const searchableText = normalize(
    [
      document.id,
      document.type,
      document.title,
      document.summary,
      ...document.details,
      ...document.keywords,
    ].join(" ")
  )
  const titleNorm = normalize(document.title)
  const idNorm = normalize(document.id)
  let score = document.priority
  const reasons: string[] = []

  // IDF-weighted token scoring
  for (const token of queryTokens) {
    const weight = idf.get(token) ?? 1

    if (titleNorm.includes(token)) {
      score += 14 * weight
      reasons.push(`title:${token}`)
    } else if (idNorm.includes(token)) {
      score += 10 * weight
      reasons.push(`id:${token}`)
    } else if (searchableText.includes(token)) {
      score += 3 * weight
    }
  }

  // Expansion terms (flat, lower weight)
  for (const expansion of queryExpansions) {
    if (searchableText.includes(normalize(expansion))) score += 2
  }

  // Keyword exact match in query - highest signal
  for (const keyword of document.keywords) {
    const normalizedKeyword = normalize(keyword)
    if (normalizedKeyword && normalize(query).includes(normalizedKeyword)) {
      const weight = idf.get(normalizedKeyword) ?? 1
      score += 18 * weight
      reasons.push(`keyword:${keyword}`)
    }
  }

  return {
    ...document,
    score,
    reason: reasons.slice(0, 4).join(", ") || "semantic keyword match",
  }
}

function boostByIntent(
  document: RankedDocument,
  query: string
): RankedDocument {
  const intent = getQueryIntent(query)
  let boost = 0

  if (intent.wantsContact && document.type === "contact") boost += 80
  if (intent.wantsProfile && document.type === "profile") boost += 60
  if (intent.wantsAward && document.type === "award") boost += 75
  // When user asks about hackathon/awards, actively suppress experience and project docs
  // so they don't flood the context and crowd out the actual award entries.
  if (
    intent.wantsAward &&
    [
      "experience",
      "experience-skills",
      "project",
      "project-stack",
      "project-impact",
    ].includes(document.type)
  )
    boost -= 40
  if (intent.wantsEducation && document.id.startsWith("experience:education"))
    boost += 65
  if (intent.wantsCertification && document.type === "certification")
    boost += 40
  if (intent.wantsPublication && document.type === "publication") boost += 40

  if (intent.wantsProjects) {
    if (document.type === "project") boost += 28
    if (document.type === "project-stack") boost += 15
    if (document.type === "project-impact") boost += 20
  }

  if (intent.wantsExperience) {
    if (document.type === "experience") boost += 35
    if (document.type === "experience-skills") boost += 20
  }

  if (intent.wantsSkills || intent.wantsStack) {
    if (document.type === "skills") boost += 50
    if (document.type === "project-stack") boost += 30
    if (document.type === "experience-skills") boost += 25
  }

  if (intent.wantsImpact) {
    if (document.type === "project-impact") boost += 35
    if (document.type === "award") boost += 20
  }

  if (intent.wantsCareerFit) {
    if (
      ["project", "project-impact", "experience", "skills"].includes(
        document.type
      )
    ) {
      boost += 18
    }
  }

  if (intent.wantsCurrentFocus) {
    // Current focus → heavily favor profile (has flipSentences + current jobs)
    if (document.type === "profile") boost += 90
    // Boost experience docs that are still active (period has no end = "Present")
    else if (
      document.type === "experience" &&
      document.summary.includes("Present")
    )
      boost += 25
    // Penalize non-current docs to keep context focused
    else if (
      [
        "project",
        "project-stack",
        "project-impact",
        "certification",
        "award",
        "publication",
      ].includes(document.type)
    )
      boost -= 30
  }

  if (intent.wantsAll) {
    if (intent.wantsExperience && document.type === "experience") boost += 15
    else if (intent.wantsAward && document.type === "award") boost += 15
    else if (intent.wantsCertification && document.type === "certification")
      boost += 15
    else if (intent.wantsPublication && document.type === "publication")
      boost += 15
    else if (intent.wantsProjects && document.type === "project") boost += 15
    else if (
      !intent.wantsExperience &&
      !intent.wantsAward &&
      !intent.wantsEducation &&
      !intent.wantsCertification &&
      !intent.wantsPublication &&
      document.type === "project"
    ) {
      boost += 10
    }
  }

  return { ...document, score: document.score + boost }
}

function rankDocuments(
  corpus: PortfolioDocument[],
  query: string,
  idf: Map<string, number>
) {
  const queryTokens = tokenize(query)
  const queryExpansions = getQueryExpansions(query)

  return corpus
    .map((document) =>
      boostByIntent(
        scoreDocument(document, query, queryTokens, queryExpansions, idf),
        query
      )
    )
    .sort((a, b) => b.score - a.score)
}

// ─── Formatting ────────────────────────────────────────────────────────────

// Returns true for detail lines that carry meaningful value.
// Strips lines where the value portion (after ": ") is empty, whitespace,
// or only a known placeholder so the LLM never surfaces empty fields.
const EMPTY_VALUE_RE = /^[\s.]*$|^not available[\s.]*$/i

function hasContent(line: string): boolean {
  const colonIdx = line.indexOf(": ")
  const value = colonIdx !== -1 ? line.slice(colonIdx + 2).trim() : line.trim()
  return !EMPTY_VALUE_RE.test(value)
}

function formatDocument(document: RankedDocument, detailLimit = 5) {
  const details = document.details.filter(hasContent).slice(0, detailLimit)

  // Scope marker for non-baseline chunks - gives LLM strong attribution signal
  const needsScope =
    document.type !== "profile" &&
    document.type !== "contact" &&
    document.type !== "skills" &&
    document.type !== "github"
  const scopeLine = needsScope
    ? `[SCOPE: ${document.id} - facts below belong ONLY to this source]`
    : ""

  return [
    scopeLine,
    `### ${document.title}`,
    `Type: ${document.type}. Source ID: ${document.id}.`,
    `Summary: ${document.summary}`,
    details.length ? `Details:\n- ${details.join("\n- ")}` : "",
    document.url ? `URL: ${document.url}` : "",
  ]
    .filter(Boolean)
    .join("\n")
}

// ─── Slot-based Context Assembly ───────────────────────────────────────────

/**
 * Assemble context using three budget slots to prevent a single document type
 * from monopolizing the context window.
 *
 * - baseline_slot : profile + contact (always included)
 * - primary_slot  : top docs matching the primary intent type (50% of budget)
 *                   - same-project sub-chunks are deduplicated: at most one
 *                     stack/impact chunk is admitted per project per slot.
 * - diversity_slot: top doc from a *different* type than primary (30% of budget)
 *                   - min-score is relaxed for broad "semua" queries.
 */
function assembleContext(
  ranked: RankedDocument[],
  baselineRanked: RankedDocument[],
  intent: ReturnType<typeof getQueryIntent>,
  detailLimit: number
): { selected: RankedDocument[]; contextParts: string[] } {
  const selected: RankedDocument[] = []
  let primaryBudget = PRIMARY_SLOT_BUDGET
  let diversityBudget = DIVERSITY_SLOT_BUDGET

  // Determine primary intent type(s) for slot separation
  const primaryTypes = new Set<PortfolioDocumentType>()
  if (intent.wantsProjects) {
    primaryTypes.add("project")
    primaryTypes.add("project-stack")
    primaryTypes.add("project-impact")
  }
  if (intent.wantsExperience) {
    primaryTypes.add("experience")
    primaryTypes.add("experience-skills")
  }
  if (intent.wantsSkills || intent.wantsStack) {
    primaryTypes.add("skills")
    primaryTypes.add("project-stack")
    primaryTypes.add("experience-skills")
  }
  if (intent.wantsAward) primaryTypes.add("award")
  if (intent.wantsCertification) primaryTypes.add("certification")
  if (intent.wantsPublication) primaryTypes.add("publication")

  const hasPrimaryIntent = primaryTypes.size > 0

  // Track which project IDs already have a sub-chunk (stack/impact) in the
  // primary slot to prevent one project from monopolising the entire budget.
  const admittedSubchunkProjectIds = new Set<string>()

  // Fill primary slot
  for (const doc of ranked) {
    const formatted = formatDocument(doc, detailLimit)
    const len = formatted.length + 2

    // Sub-chunk deduplication: only one stack/impact chunk per project per slot
    if (doc.type === "project-stack" || doc.type === "project-impact") {
      const projectId = doc.id.split(":").slice(0, 2).join(":")
      if (admittedSubchunkProjectIds.has(projectId)) continue
      if (
        (hasPrimaryIntent && primaryTypes.has(doc.type)) ||
        !hasPrimaryIntent
      ) {
        if (primaryBudget - len >= 0) {
          primaryBudget -= len
          selected.push(doc)
          admittedSubchunkProjectIds.add(projectId)
        }
      }
      continue
    }

    if (hasPrimaryIntent && primaryTypes.has(doc.type)) {
      if (primaryBudget - len >= 0) {
        primaryBudget -= len
        selected.push(doc)
        // Register the project overview so its sub-chunks are tracked too
        if (doc.type === "project") {
          admittedSubchunkProjectIds.add(doc.id)
        }
      }
    } else if (!hasPrimaryIntent) {
      // No strong intent - fill primary slot with top docs
      if (primaryBudget - len >= 0) {
        primaryBudget -= len
        selected.push(doc)
        if (doc.type === "project") {
          admittedSubchunkProjectIds.add(doc.id)
        }
      }
    }
  }

  // Fill diversity slot - top doc from a type NOT already in selected
  // Enforce minimum score: do not add irrelevant docs just for "diversity"
  const selectedIds = new Set(selected.map((d) => d.id))
  const selectedTypes = new Set(selected.map((d) => d.type))

  // Types to exclude from diversity when intent is currentFocus (keep context tight)
  const diversityExcludeTypes = new Set<PortfolioDocumentType>(
    intent.wantsCurrentFocus
      ? [
          "project",
          "project-stack",
          "project-impact",
          "certification",
          "award",
          "publication",
          "skills",
        ]
      : []
  )

  // Broad queries want coverage - lower the bar so more doc types can surface
  const effectiveDiversityMinScore = intent.wantsAll
    ? DIVERSITY_MIN_SCORE_BROAD
    : DIVERSITY_MIN_SCORE

  for (const doc of ranked) {
    if (selectedIds.has(doc.id)) continue
    if (selectedTypes.has(doc.type)) continue
    if (diversityExcludeTypes.has(doc.type)) continue
    // Skip docs below minimum relevance score - they add noise, not value
    if (doc.score < effectiveDiversityMinScore) continue
    const formatted = formatDocument(doc, detailLimit)
    const len = formatted.length + 2

    if (diversityBudget - len >= 0) {
      diversityBudget -= len
      selected.push(doc)
      selectedIds.add(doc.id)
      selectedTypes.add(doc.type)
    }
  }

  const contextParts = [
    ...baselineRanked.map((doc) => formatDocument(doc, detailLimit)),
    ...selected.map((doc) => formatDocument(doc, detailLimit)),
  ]

  return { selected, contextParts }
}

// ─── Coverage Notes ─────────────────────────────────────────────────────────
// When the user's query is about a list-type section (projects, experience,
// awards, certifications, publications) but the retrieval budget only fit a
// subset, tell the model exactly how many exist in total and where the full
// list lives - otherwise the model has no way to know it's showing a partial
// list and presents it as if it were complete.

// A project/experience overview chunk and its stack/impact/skills sub-chunks
// share one entity - both can independently make it into `selected`, and the
// model will mention the entity's name whichever chunk it came from. Count
// distinct entities (by base id), not raw chunk count, or "N shown" undercounts
// and the "remaining" math the model is told to trust comes out wrong.
const ENTITY_GROUPS: Partial<
  Record<
    PortfolioDocumentType,
    { types: PortfolioDocumentType[]; baseId: (id: string) => string }
  >
> = {
  project: {
    types: ["project", "project-stack", "project-impact"],
    baseId: (id) => id.replace(/:(stack|impact)$/, ""),
  },
  experience: {
    types: ["experience", "experience-skills"],
    baseId: (id) => id.replace(/:skills$/, ""),
  },
  award: { types: ["award"], baseId: (id) => id },
  certification: { types: ["certification"], baseId: (id) => id },
  publication: { types: ["publication"], baseId: (id) => id },
}

function buildCoverageNotes(
  intent: ReturnType<typeof getQueryIntent>,
  selected: RankedDocument[]
): string {
  const checks: Array<[boolean, PortfolioDocumentType]> = [
    [intent.wantsProjects, "project"],
    [intent.wantsExperience, "experience"],
    [intent.wantsAward, "award"],
    [intent.wantsCertification, "certification"],
    [intent.wantsPublication, "publication"],
  ]

  const notes: string[] = []

  for (const [active, type] of checks) {
    const link = SECTION_LINKS[type]
    const group = ENTITY_GROUPS[type]
    if (!link || !group) continue

    const shown = new Set(
      selected
        .filter((doc) => group.types.includes(doc.type))
        .map((doc) => group.baseId(doc.id))
    ).size
    const remaining = link.total - shown

    // Fires on explicit intent, or as a fallback when the retrieval ranked
    // 2+ distinct entities of this type into context anyway (e.g. a typo like
    // "projeck" that the intent regex misses but the ranker still surfaces
    // real project docs for) - otherwise the model narrates a list with no
    // idea it's partial and no correct link to hand out.
    if ((active || shown >= 2) && shown > 0 && remaining > 0) {
      notes.push(
        `${shown} ${link.noun}${shown === 1 ? "" : "s"} shown above, ${remaining} more not shown (do not recompute this number). If the user asked broadly, say ${remaining} more ${link.noun}${remaining === 1 ? "" : "s"} exist and share this link to see all of them: ${link.url}`
      )
    }
  }

  if (notes.length === 0) return ""

  return [
    "[COVERAGE NOTES - use naturally, do not quote verbatim]",
    ...notes,
  ].join("\n")
}

// ─── Public API ────────────────────────────────────────────────────────────

export function buildPortfolioChatContext({
  github,
  query,
}: {
  github: GitHubContributionStatus
  query: string
}) {
  const intent = getQueryIntent(query)
  const corpus = createPortfolioCorpus(github, intent)

  // Use module-level cached IDF (computed once per server instance).
  // The static corpus is structurally identical across requests - only the
  // github doc changes at runtime, and its tokens don't meaningfully shift IDF.
  const idf = getStaticIdf()

  const ranked = rankDocuments(corpus, query, idf)

  const baseline = corpus.filter((document) =>
    BASELINE_TYPES.has(document.type)
  )
  const baselineIds = new Set(baseline.map((document) => document.id))
  const baselineRanked = baseline.map((document) => ({
    ...document,
    score: document.priority,
    reason: "baseline",
  }))

  // detailLimit controls how many detail lines per document are emitted.
  // Rule: more context requested → more lines. wantsAll+wantsDetailed is the
  // most expansive case and must have the highest limit.
  const detailLimit = intent.wantsAll
    ? intent.wantsDetailed
      ? 8 // all + detailed = maximum coverage
      : 6 // all only = medium (breadth over depth)
    : intent.wantsDetailed
      ? 7 // detailed only = high depth on fewer docs
      : 5 // default

  const candidates = ranked.filter((document) => !baselineIds.has(document.id))

  const { selected, contextParts } = assembleContext(
    candidates,
    baselineRanked,
    intent,
    detailLimit
  )

  // Placed right after the intro line (not appended at the end) so it
  // always survives the character-budget truncation below.
  const coverageNotes = buildCoverageNotes(intent, selected)

  const context = [
    "PORTFOLIO_CONTEXT_START",
    "Profile baseline and contact data are always included. Retrieved evidence below is ranked for the current user question.",
    coverageNotes,
    contextParts.join("\n\n"),
    "PORTFOLIO_CONTEXT_END",
  ]
    .filter(Boolean)
    .join("\n\n")

  const contextEndMarker = "\nPORTFOLIO_CONTEXT_END"
  const boundedContext =
    context.length <= MAX_CONTEXT_CHARS
      ? context
      : `${context.slice(0, MAX_CONTEXT_CHARS - contextEndMarker.length)}${contextEndMarker}`

  return {
    context: boundedContext,
    retrieved: selected.map((document) => ({
      id: document.id,
      type: document.type,
      title: document.title,
      score: Math.round(document.score),
      reason: document.reason,
    })),
  }
}
