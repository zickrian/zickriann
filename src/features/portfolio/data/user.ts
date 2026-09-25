import type { User } from "@/features/portfolio/types/user"

export const USER: User = {
  firstName: "Firdaus",
  lastName: "Khotibul Zickrian",
  displayName: "Firdaus Khotibul Zickrian",
  username: "zickrian",
  gender: "male",
  pronouns: "he/him",

  bio: "I'm Firdaus Khotibul Zickrian, an AI Engineer based in Indonesia building practical machine learning systems, data workflows, and modern full-stack web applications that turn ideas into impactful products.",
  bioId:
    "Saya Firdaus Khotibul Zickrian, seorang AI Engineer yang berbasis di Indonesia, membangun sistem machine learning yang praktis, alur kerja data, dan aplikasi web full-stack modern yang mengubah ide menjadi produk yang berdampak.",

  flipSentences: [
    "AI / ML Engineer",
    "AI & Data Scientist",
    "Full Stack Developer",
    "Data Analyst",
  ],
  flipSentencesId: [
    "AI / ML Engineer",
    "AI & Data Scientist",
    "Pengembang Full Stack",
    "Analis Data",
  ],

  address: "Indonesia",
  email: "ZmlyZGF1c2tob3RpYnVsemlja3JpYW5AZ21haWwuY29t", // base64 of firdauskhotibulzickrian@gmail.com
  phone: "+62 851-5548-7647",
  website: "https://www.zickrian.dev",

  jobTitle: "AI & Machine Learning Engineer",
  seoTitle: "Firdaus Khotibul Zickrian | AI & Machine Learning Engineer",
  seoDescription:
    "I'm Firdaus Khotibul Zickrian, an AI and machine learning engineer from Indonesia. I build practical software, data products, and machine learning systems.",

  jobs: [
    {
      title: "AI Engineer Intern",
      company: "PT Custompedia Creative Group",
      website: "https://www.instagram.com/custompedia/",
      experienceId: "custompedia",
    },
  ],

  about: `I'm an AI Engineer based in Indonesia, specializing in building practical machine learning systems, data workflows, and modern full-stack web applications. I focus on developing reliable, end-to-end solutions that turn complex ideas into intuitive products designed for real-world impact.`,
  aboutId: `Saya seorang AI Engineer yang berbasis di Indonesia, dengan spesialisasi dalam membangun sistem machine learning yang praktis, alur kerja data, dan aplikasi web full-stack modern. Saya fokus mengembangkan solusi end-to-end yang andal, yang mengubah ide-ide kompleks menjadi produk intuitif yang dirancang untuk memberikan dampak nyata.`,

  avatar: "/image/profile.webp",
  ogImage: "/image/og.png",
  sameAs: [
    "https://www.zickrian.dev",
    "https://github.com/zickrian",
    "https://linkedin.com/in/firdauskhotibulzickrian/",
    "https://medium.com/@zickriann",
    "https://huggingface.co/zickrian",
    "https://www.pinterest.com/espejodaniel50/",
  ],
  timeZone: "Asia/Jakarta",

  keywords: [
    "Firdaus Khotibul Zickrian",
    "zickrian",
    "Firdaus Khotibul Zickrian portfolio",
    "zickrian portfolio",
    "AI engineer Indonesia",
    "machine learning engineer Indonesia",
    "AI and machine learning",
    "full stack developer",
    "data products",
    "MLOps",
    "computer vision",
    "AI portfolio",
    "machine learning portfolio",
  ],

  // Full ISO 8601 datetimes: Schema.org dateCreated/dateModified expect a
  // time component, and date-only values trip up structured-data validators.
  dateCreated: "2023-11-01T00:00:00Z",
  dateModified: "2026-07-20T00:00:00Z",
}
