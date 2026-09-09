import { SITE_INFO } from "@/config/site"
import { USER } from "@/features/portfolio/data/user"
import { decodeEmail } from "@/utils/string"

export const dynamic = "force-static"
export const revalidate = false

function buildLlmsTxt(): string {
  const email = decodeEmail(USER.email)
  const baseUrl = SITE_INFO.url

  return `# Firdaus Khotibul Zickrian

> Firdaus Khotibul Zickrian is an AI & Machine Learning Engineer and Computer Science scholar at Universitas Dian Nuswantoro (GPA 3.88/4.00) based in Indonesia. He specializes in practical machine learning systems, business process automation, ERP integrations, predictive analytics, and modern full-stack web applications.

## Core Projects & Systems
- [LeadsUp](${baseUrl}/projects/leadsup): Predictive banking lead-scoring intelligence platform built with Scikit-learn, REST API, and data pipeline (presented to Accenture).
- [Narratio AI](${baseUrl}/projects/naratioai): AI business consultant deck generator combining web scraping, sentiment analysis, semantic embeddings, and LLM orchestration.
- [Custora AI](${baseUrl}/projects/custora): Customer intelligence platform with churn prediction and sentiment analysis deployed on Azure ML (Best Capstone Project, Top 5 of 120+ teams).
- [Base Realms](${baseUrl}/projects/base-realms): Onchain 16-bit RPG battle game on Base network with QRIS onboarding (Coinbase Hackathon Indonesia 2025 Top 5 National Finalist).
- [Production MLOps System](${baseUrl}/projects/machine-learning-system): End-to-end ML lifecycle with MLflow, DagsHub, CI/CD automated retraining, Prometheus, Grafana, and Docker).
- [Polsek Rembang](${baseUrl}/projects/polsekrembang): Public police administration and LangChain RAG AI assistant service platform.
- [Campus Lost & Found System](${baseUrl}/projects/lostandfound): Geolocation-integrated web platform evaluated with Mean Opinion Score (MOS), published in JUTISI journal.

## Professional Experience & Career Roles
- [PT Custompedia Creative Group](${baseUrl}/#experience): ERP & AI Engineer Intern (Reduced production error rate from 88% to 2% via async processing and Cloudflare R2).
- [Pijak by Dicoding & IBM](${baseUrl}/#experience): AI Engineer Cohort & Team Lead (Graduated with Distinction, top 10% of 670+ participants).
- [Asah by Dicoding & Accenture](${baseUrl}/#experience): Machine Learning Lead (Selected top participants from 2,000 nationwide).
- [Blockvizo Research](${baseUrl}/#experience): Research & Data Analyst (Analyzed 50,000+ blockchain records; 85% accuracy ML models; generated Rp50M+ profit).
- [Universitas Dian Nuswantoro](${baseUrl}/#experience): Computer Science Laboratory Assistant (Mentored 140+ students in programming & database logic).

## Research Publications
- [JUTISI Journal (2026)](https://ojs.stmik-banjarbaru.ac.id/index.php/jutisi/article/view/3476/1658): "Implementasi Sistem Lost and Found Kampus Berbasis Web Terintegrasi Geolocation dan Evaluasi MOS".

## Core Technical Stack
- **AI & Machine Learning**: Python, PyTorch, TensorFlow, Scikit-learn, Hugging Face, OpenCV, LangChain, Groq API, Azure ML.
- **Web & Full-Stack**: TypeScript, React, Next.js, Tailwind CSS, Node.js, Fastify, Express.
- **Databases & DevOps**: PostgreSQL, Supabase, Redis, Docker, Cloudflare R2, MLflow, Git.

## Site Navigation & Resources
- [Home](${baseUrl}/): Main portfolio, profile summary, experiences, and technical overview.
- [All Projects](${baseUrl}/projects): Comprehensive archive of AI/ML, data, and web engineering projects.
- [Technical Blog](${baseUrl}/blog): Technical articles on Machine Learning, AI engineering, and software development.
- [Visual Gallery](${baseUrl}/gallery): Visual documentation of hackathons, research activities, and project milestones.

## Contact & Profiles
- [Portfolio Website](${baseUrl}): ${baseUrl}
- [GitHub](https://github.com/zickrian): @zickrian
- [LinkedIn](https://linkedin.com/in/firdauskhotibulzickrian/): Firdaus Khotibul Zickrian
- [Medium](https://medium.com/@zickriann): @zickriann
- [Hugging Face](https://huggingface.co/zickrian): @zickrian
- [Email](mailto:${email}): ${email}

## Optional
- [Full Comprehensive Knowledge Base](${baseUrl}/llms-full.txt): Complete, unabridged dossiers including case study architectures, technical workflows, complete certification credentials, and quantified impact.
`
}

export function GET(): Response {
  return new Response(buildLlmsTxt(), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  })
}
