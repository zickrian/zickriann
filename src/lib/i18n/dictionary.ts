import type { Language } from "@/hooks/use-language-preference"

/**
 * Static UI copy for every locale the site supports. Content that lives in
 * data files (bio, project descriptions, etc.) is localized separately via
 * the `xxxId` sibling fields and `localize()` in `./localize.ts` — this file
 * only covers chrome: nav, labels, empty states, and the like.
 */
const dictionary = {
  en: {
    nav: {
      home: "Home",
      projects: "Projects",
      blog: "Blog",
      gallery: "Gallery",
      chat: "Chat",
      settings: "Settings",
    },
    settings: {
      language: "Language",
      english: "English",
      indonesian: "Indonesia",
      theme: "Theme",
      light: "Light",
      system: "System",
      dark: "Dark",
      sound: "Sound",
      soundOn: "Sound on",
      soundOff: "Sound off",
    },
    skipToContent: "Skip to content",
    greeting: {
      morning: "Good morning",
      afternoon: "Good afternoon",
      evening: "Good evening",
    },
    about: {
      kicker: "About",
      callout: "Start here - a quick read on the person behind the projects.",
    },
    overview: {
      sr: "Overview",
      location: "Location",
      phone: "Phone",
      personalWebsite: "Personal website",
      pronouns: "Pronouns",
      localTime: "Local time",
    },
    social: {
      sr: "Social Links",
    },
    github: {
      sr: "GitHub Contributions",
    },
    experiences: {
      title: "Experience",
      callout:
        "A few chapters of building, learning, and turning technical curiosity into useful systems.",
      employmentType: "Employment Type",
      employmentPeriod: "Employment Period",
      duration: "Duration",
      present: "Present",
    },
    projects: {
      title: "Projects",
      viewAll: "View all",
      callout:
        "Ideas become real when the model, interface, and product decisions move together.",
    },
    techStack: {
      title: "Stack",
    },
    awards: {
      title: "Awards",
      callout:
        "Proof that thoughtful teamwork, strong execution, and a little persistence get noticed.",
      prize: "Prize",
      awardedIn: "Awarded in",
      receivedInGrade: "Received in Grade",
      openReferenceAttachment: "Open Reference Attachment",
    },
    publications: {
      title: "Publications",
      journal: "Journal",
      published: "Published",
    },
    certifications: {
      title: "Certifications",
      issuedBy: "Issued by",
      issuedOn: "Issued on",
    },
    collapsibleList: {
      showMore: "Show more",
      showLess: "Show less",
    },
    projectDetail: {
      backToProjects: "Projects",
      liveDemo: "Live Demo",
      sourceCode: "Source Code",
      ownership: "Ownership",
      role: "Role",
      team: "Team",
      myRole: "My Role",
      features: "Features",
      impact: "Impact",
      stack: "Stack",
      notes: "Notes",
    },
    footer: {
      contact: "Contact",
      index: "Index",
      home: "Home",
    },
    notFound: {
      message:
        "Looks like this page doesn’t exist (yet). Just like a blank space in a conversation, there’s nothing to respond to. Go back to",
      home: "home",
      suffix: "and rejoin the conversation.",
    },
    blog: {
      loadErrorTitle: "Couldn't load posts right now",
      loadErrorVisit: "Visit",
      loadErrorMedium: "Medium",
      loadErrorSuffix: "to read the latest articles.",
    },
    chat: {
      inputPlaceholder: "How can I help you?",
      sendMessage: "Send message",
      closeChat: "Close chat",
      chatMode: "Chat",
      emailMode: "Email",
      confirmEmail: "Confirm Email",
      from: "From:",
      subject: "Subject:",
      cancel: "Cancel",
      saveChanges: "Save Changes",
      editEmail: "Edit Email",
      sendEmail: "Send Email",
      sending: "Sending...",
      sendEmailToZickrian: "Send Email to Zickrian",
      yourName: "Your name",
      yourEmail: "Your email",
      writeMessageHere: "Write your message here...",
      continue: "Continue",
      budgetTitle: "BUDGET",
      budgetLimitReached: "BUDGET LIMIT REACHED.\nPLEASE STOP SPENDING.",
      budgetClose:
        "YOU'RE GETTING CLOSE TO YOUR LIMIT\nCONSIDER SLOWING DOWN SPENDING",
      budgetHealthy: "YOUR BUDGET IS LOOKING HEALTHY.\nKEEP IT UP.",
      invalidEmail: "Invalid email format.",
      loadingMessages: [
        "Fetching portfolio data...",
        "Selecting the most relevant context...",
        "Analyzing your question...",
        "Composing a clear answer...",
      ],
      formattingMessages: [
        "Analyzing the submitted form data...",
        "Extracting core intent and key information...",
        "Restructuring into a professional email...",
        "Polishing the final message...",
      ],
      sendingMessages: [
        "Validating final email payload...",
        "Dispatching secure request to the email service...",
        "Awaiting delivery confirmation...",
        "Finalizing transmission...",
      ],
      emailPreviewReady:
        "Here is a preview of your formatted email. Please review and confirm before sending 👇",
      sendingLimitReached: (limit: number, wait: string) =>
        `⏳ **Sending limit reached.**\n\nYou've already sent ${limit} emails in the last hour. Try again in **${wait}**.`,
      emailSentSuccess: (name: string, email: string, remaining: number) =>
        `✅ **Email sent successfully!**\n\nThe message from **${name}** has been sent to Zickrian. You will receive a confirmation at **${email}**.\n\nThanks for reaching out! 🙌${remaining > 0 ? `\n\n🚀 *Remaining email quota: **${remaining}x** in this hour.*` : ""}`,
    },
  },
  id: {
    nav: {
      home: "Beranda",
      projects: "Proyek",
      blog: "Blog",
      gallery: "Galeri",
      chat: "Chat",
      settings: "Pengaturan",
    },
    settings: {
      language: "Bahasa",
      english: "English",
      indonesian: "Indonesia",
      theme: "Tema",
      light: "Terang",
      system: "Sistem",
      dark: "Gelap",
      sound: "Suara",
      soundOn: "Suara aktif",
      soundOff: "Suara nonaktif",
    },
    skipToContent: "Langsung ke konten",
    greeting: {
      morning: "Selamat pagi",
      afternoon: "Selamat siang",
      evening: "Selamat malam",
    },
    about: {
      kicker: "Tentang",
      callout:
        "Mulai di sini - sekilas cerita tentang orang di balik proyek-proyek ini.",
    },
    overview: {
      sr: "Ringkasan",
      location: "Lokasi",
      phone: "Telepon",
      personalWebsite: "Situs pribadi",
      pronouns: "Kata ganti",
      localTime: "Waktu setempat",
    },
    social: {
      sr: "Tautan Sosial",
    },
    github: {
      sr: "Kontribusi GitHub",
    },
    experiences: {
      title: "Pengalaman",
      callout:
        "Beberapa babak membangun, belajar, dan mengubah rasa ingin tahu teknis menjadi sistem yang berguna.",
      employmentType: "Jenis Pekerjaan",
      employmentPeriod: "Periode Kerja",
      duration: "Durasi",
      present: "Sekarang",
    },
    projects: {
      title: "Proyek",
      viewAll: "Lihat semua",
      callout:
        "Ide menjadi nyata ketika keputusan model, antarmuka, dan produk bergerak bersama.",
    },
    techStack: {
      title: "Teknologi",
    },
    awards: {
      title: "Penghargaan",
      callout:
        "Bukti bahwa kerja sama tim yang matang, eksekusi yang kuat, dan sedikit ketekunan akan diperhatikan.",
      prize: "Penghargaan",
      awardedIn: "Diraih pada",
      receivedInGrade: "Tingkat Penghargaan",
      openReferenceAttachment: "Buka Lampiran Referensi",
    },
    publications: {
      title: "Publikasi",
      journal: "Jurnal",
      published: "Diterbitkan",
    },
    certifications: {
      title: "Sertifikasi",
      issuedBy: "Diterbitkan oleh",
      issuedOn: "Diterbitkan pada",
    },
    collapsibleList: {
      showMore: "Tampilkan lebih banyak",
      showLess: "Tampilkan lebih sedikit",
    },
    projectDetail: {
      backToProjects: "Proyek",
      liveDemo: "Demo Langsung",
      sourceCode: "Kode Sumber",
      ownership: "Kepemilikan",
      role: "Peran",
      team: "Tim",
      myRole: "Peran Saya",
      features: "Fitur",
      impact: "Dampak",
      stack: "Teknologi",
      notes: "Catatan",
    },
    footer: {
      contact: "Kontak",
      index: "Indeks",
      home: "Beranda",
    },
    notFound: {
      message:
        "Sepertinya halaman ini belum ada (belum dibuat). Layaknya jeda hening dalam percakapan, tidak ada yang dapat direspons. Kembali ke",
      home: "beranda",
      suffix: "dan bergabung kembali ke percakapan.",
    },
    blog: {
      loadErrorTitle: "Gagal memuat tulisan saat ini",
      loadErrorVisit: "Kunjungi",
      loadErrorMedium: "Medium",
      loadErrorSuffix: "untuk membaca artikel terbaru.",
    },
    chat: {
      inputPlaceholder: "Ada yang bisa dibantu?",
      sendMessage: "Kirim pesan",
      closeChat: "Tutup chat",
      chatMode: "Chat",
      emailMode: "Email",
      confirmEmail: "Konfirmasi Email",
      from: "Dari:",
      subject: "Subjek:",
      cancel: "Batal",
      saveChanges: "Simpan Perubahan",
      editEmail: "Ubah Email",
      sendEmail: "Kirim Email",
      sending: "Mengirim...",
      sendEmailToZickrian: "Kirim Email ke Zickrian",
      yourName: "Nama kamu",
      yourEmail: "Email kamu",
      writeMessageHere: "Tulis pesanmu di sini...",
      continue: "Lanjutkan",
      budgetTitle: "BUDGET",
      budgetLimitReached: "BATAS BUDGET TERCAPAI.\nMOHON HENTIKAN PENGGUNAAN.",
      budgetClose:
        "BUDGET KAMU HAMPIR HABIS\nPERTIMBANGKAN UNTUK MENGURANGI PENGGUNAAN",
      budgetHealthy: "BUDGET KAMU MASIH SEHAT.\nLANJUTKAN.",
      invalidEmail: "Format email tidak valid.",
      loadingMessages: [
        "Mengambil data portofolio...",
        "Memilih konteks yang paling relevan...",
        "Menganalisis pertanyaanmu...",
        "Menyusun jawaban yang jelas...",
      ],
      formattingMessages: [
        "Menganalisis data formulir yang dikirim...",
        "Mengekstrak inti maksud dan informasi penting...",
        "Menyusun ulang menjadi email profesional...",
        "Menyempurnakan pesan akhir...",
      ],
      sendingMessages: [
        "Memvalidasi payload email akhir...",
        "Mengirim permintaan aman ke layanan email...",
        "Menunggu konfirmasi pengiriman...",
        "Menyelesaikan transmisi...",
      ],
      emailPreviewReady:
        "Ini pratinjau email yang sudah diformat. Silakan tinjau dan konfirmasi sebelum dikirim 👇",
      sendingLimitReached: (limit: number, wait: string) =>
        `⏳ **Batas pengiriman tercapai.**\n\nKamu sudah mengirim ${limit} email dalam satu jam terakhir. Coba lagi dalam **${wait}**.`,
      emailSentSuccess: (name: string, email: string, remaining: number) =>
        `✅ **Email berhasil terkirim!**\n\nPesan dari **${name}** telah dikirim ke Zickrian. Kamu akan menerima konfirmasi di **${email}**.\n\nTerima kasih sudah menghubungi! 🙌${remaining > 0 ? `\n\n🚀 *Sisa kuota email: **${remaining}x** dalam satu jam ini.*` : ""}`,
    },
  },
} as const satisfies Record<Language, unknown>

export function getDictionary(language: Language) {
  return dictionary[language]
}

export type Dictionary = (typeof dictionary)[Language]
