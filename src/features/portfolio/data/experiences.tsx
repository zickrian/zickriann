import {
  AstroidIcon,
  BarChart3Icon,
  FlaskConicalIcon,
  GraduationCapIcon,
  NetworkIcon,
  SchoolIcon,
  UsersIcon,
} from "lucide-react"

import type { Experience } from "../types/experiences"

export const EXPERIENCES: Experience[] = [
  {
    id: "custompedia",
    companyName: "PT Custompedia Creative Group",
    companyLogo: "/logos/custompedia-logo.webp",
    companyWebsite: "https://www.instagram.com/custompedia/",
    positions: [
      {
        id: "custompedia-1",
        title: "AI Engineer Intern",
        employmentPeriod: {
          start: "07.2026",
        },
        employmentType: "Internship",
        icon: <AstroidIcon />,
        description: `- Developed an internal ERP with AI-powered modules for recruitment, EMS, scheduling, & workflow automation.
- Translated business requirements into functional specifications, workflows, and test scenarios to support ERP development.
- Conducted defect analysis and collaborated with developers to troubleshoot issues and ensure successful implementation of ERP functionalities.
- Reduced production error rates from 88% to 2%, significantly improving system reliability by optimizing asynchronous processing and Cloudflare R2 storage workflows.
- Coordinated with 20+ stakeholders across teams to integrate AI agents and automation workflows into internal business operations, ensuring successful adoption and implementation.`,
        descriptionId: `- Mengembangkan ERP internal dengan modul bertenaga AI untuk rekrutmen, EMS, penjadwalan, & otomatisasi alur kerja.
- Menerjemahkan kebutuhan bisnis menjadi spesifikasi fungsional, alur kerja, dan skenario pengujian untuk mendukung pengembangan ERP.
- Melakukan analisis defek dan berkolaborasi dengan developer untuk mengatasi kendala serta memastikan keberhasilan implementasi fungsionalitas ERP.
- Mengurangi tingkat error produksi dari 88% menjadi 2%, secara signifikan meningkatkan keandalan sistem dengan mengoptimalkan pemrosesan asinkron dan alur kerja penyimpanan Cloudflare R2.
- Berkoordinasi dengan 20+ pemangku kepentingan lintas tim untuk mengintegrasikan agen AI dan alur kerja otomatisasi ke dalam operasi bisnis internal, memastikan adopsi dan implementasi yang sukses.`,
      },
    ],
    isCurrentEmployer: true,
  },
  {
    id: "pijak-ibm",
    companyName: "Pijak by Dicoding & IBM",
    companyLogo: "/logos/pijak.webp",
    companyWebsite: "https://pijak.dicoding.com",
    positions: [
      {
        id: "pijak-ibm-1",
        title: "AI Engineer Cohort",
        employmentPeriod: {
          start: "01.2026",
          end: "07.2026",
        },
        employmentType: "Cohort",
        icon: <AstroidIcon />,
        description: `- Selected as one of ~600+ participants in a national AI upskilling program by Pijak in collaboration with IBM SkillsBuild, focused on Machine Learning, Deep Learning, and MLOps.
- Graduated with **Distinction**, ranking in the **top 10% out of 600+ participants** nationwide.
- Awarded **Best Capstone Project** as part of team PJK-GM015 - selected as **1 of only 5 winning teams out of 120+ capstone teams**.
- Led a 5-member AI team to build **Custora: Customer Intelligence for Retention Decisions**, an end-to-end AI system featuring churn prediction, sentiment analysis, analytics dashboard, and LLM-based retention recommendations.`,
        descriptionId: `- Terpilih sebagai salah satu dari ~600+ peserta dalam program peningkatan kompetensi AI nasional oleh Pijak bekerja sama dengan IBM SkillsBuild, yang berfokus pada Machine Learning, Deep Learning, dan MLOps.
- Lulus dengan predikat **Distinction**, menempati **10% teratas dari 600+ peserta** secara nasional.
- Meraih penghargaan **Best Capstone Project** sebagai bagian dari tim PJK-GM015 - terpilih sebagai **1 dari hanya 5 tim pemenang dari 120+ tim capstone**.
- Memimpin tim AI beranggotakan 5 orang untuk membangun **Custora: Customer Intelligence for Retention Decisions**, sebuah sistem AI end-to-end yang menghadirkan prediksi churn, analisis sentimen, dashboard analitik, dan rekomendasi retensi berbasis LLM.`,
        skills: [
          "Artificial Intelligence",
          "Machine Learning",
          "Deep Learning",
          "MLOps",
          "Team Leadership",
        ],
      },
    ],
    isCurrentEmployer: false,
  },
  {
    id: "dinus-lab-assistant",
    companyName: "Universitas Dian Nuswantoro",
    companyLogo: "/logos/udinus.webp",
    companyWebsite: "https://dinus.ac.id",
    positions: [
      {
        id: "dinus-lab-1",
        title: "Laboratory Assistant",
        employmentPeriod: {
          start: "08.2025",
          end: "07.2026",
        },
        employmentType: "Part-time",
        icon: <FlaskConicalIcon />,
        description: `- Supported 4+ weekly lab sessions for programming and software development courses, assisting students with coding exercises, debugging, and practical implementation.
- Mentored 140+ junior students in programming fundamentals, helping them strengthen problem-solving skills through guided hands-on practice.`,
        descriptionId: `- Mendukung 4+ sesi laboratorium mingguan untuk mata kuliah pemrograman dan pengembangan perangkat lunak, membantu mahasiswa dalam latihan coding, debugging, dan implementasi praktis.
- Membimbing 140+ mahasiswa junior dalam dasar-dasar pemrograman, membantu mereka memperkuat kemampuan problem-solving melalui praktik langsung yang terarah.`,
        skills: [
          "Teaching",
          "Mentorship",
          "Programming Fundamentals",
          "Debugging",
          "Software Development",
        ],
      },
    ],
    isCurrentEmployer: false,
  },
  {
    id: "asah-dicoding-accenture",
    companyName: "Asah by Dicoding & Accenture",
    companyLogo: "/logos/asah.webp",
    companyWebsite: "https://dicoding.com",
    positions: [
      {
        id: "asah-1",
        title: "Machine Learning",
        employmentPeriod: {
          start: "08.2025",
          end: "01.2026",
        },
        employmentType: "Cohort",
        icon: <NetworkIcon />,
        description: `- Selected among 2,000 participants nationwide for a highly selective program led by Dicoding in partnership with Accenture, aimed at accelerating digital talent development.
- Led a cross-functional team of 5 engineers to develop a machine learning-powered banking sales prediction portal that prioritizes high-conversion leads.
- Designed a predictive lead-scoring workflow to rank prospects by subscription probability, helping sales teams focus on high-value opportunities.
- Translated analytical results into product features, improving lead prioritization and reducing manual analysis efforts.`,
        descriptionId: `- Terpilih di antara 2.000 peserta secara nasional untuk program yang sangat selektif yang diselenggarakan oleh Dicoding bekerja sama dengan Accenture, bertujuan mempercepat pengembangan talenta digital.
- Memimpin tim lintas fungsi beranggotakan 5 engineer untuk mengembangkan portal prediksi penjualan perbankan berbasis machine learning yang memprioritaskan leads dengan konversi tinggi.
- Merancang alur kerja predictive lead-scoring untuk mengurutkan prospek berdasarkan probabilitas berlangganan, membantu tim sales fokus pada peluang bernilai tinggi.
- Menerjemahkan hasil analitik menjadi fitur produk, meningkatkan prioritas leads dan mengurangi upaya analisis manual.`,
        skills: [
          "Machine Learning",
          "Predictive Modeling",
          "Team Leadership",
          "Communication",
        ],
      },
    ],
  },
  {
    id: "blockvizo",
    companyName: "Blockvizo Research",
    companyLogo: "/logos/blockvizo.svg",
    positions: [
      {
        id: "blockvizo-1",
        title: "Research and Data Analyst",
        employmentPeriod: {
          start: "06.2024",
          end: "07.2025",
        },
        employmentType: "Part-time",
        icon: <BarChart3Icon />,
        description: `- Analyzed 50,000+ blockchain transaction records to identify behavioral patterns and predictive signals related to user activity, generating over Rp50 million in profit on crypto games by utilizing these insights.
- Developed machine learning models using Python and Scikit-learn, including Random Forest and Logistic Regression, achieving up to 85% prediction accuracy.
- Built analytical dashboards and visual reports to communicate key findings and support data-driven decision-making.`,
        descriptionId: `- Menganalisis 50.000+ catatan transaksi blockchain untuk mengidentifikasi pola perilaku dan sinyal prediktif terkait aktivitas pengguna, menghasilkan lebih dari Rp50 juta profit pada crypto games dengan memanfaatkan wawasan tersebut.
- Mengembangkan model machine learning menggunakan Python dan Scikit-learn, termasuk Random Forest dan Logistic Regression, mencapai akurasi prediksi hingga 85%.
- Membangun dashboard analitik dan laporan visual untuk mengomunikasikan temuan utama dan mendukung pengambilan keputusan berbasis data.`,
        skills: [
          "Data Analysis",
          "Python",
          "Machine Learning",
          "Dashboards",
          "Blockchain Analytics",
        ],
      },
    ],
  },
  {
    id: "gdgoc-dinus",
    companyName: "GDGOC Universitas Dian Nuswantoro",
    companyLogo: "/logos/gdgoc.webp",
    companyWebsite: "https://gdg.community.dev",
    positions: [
      {
        id: "gdgoc-1",
        title: "Developer Community Member",
        employmentPeriod: {
          start: "11.2023",
          end: "11.2025",
        },
        employmentType: "Community",
        icon: <UsersIcon />,
        description: `- Participated in collaborative machine learning discussions and project reviews within the developer community, contributing insights on model development, data preprocessing, and evaluation techniques across multiple projects.
- Contributed to 10+ community discussions across 4 projects, sharing insights on development and analytics.`,
        descriptionId: `- Berpartisipasi dalam diskusi machine learning kolaboratif dan review proyek di dalam komunitas developer, memberikan kontribusi wawasan mengenai pengembangan model, data preprocessing, dan teknik evaluasi di berbagai proyek.
- Berkontribusi dalam 10+ diskusi komunitas di 4 proyek, berbagi wawasan seputar pengembangan dan analitik.`,
        skills: [
          "Community",
          "Machine Learning",
          "Project Reviews",
          "Data Preprocessing",
          "Evaluation",
        ],
      },
    ],
  },
  {
    id: "education",
    companyName: "Education",
    positions: [
      {
        id: "edu-udinus",
        title: "Universitas Dian Nuswantoro",
        employmentPeriod: {
          start: "2023",
          end: "2027",
        },
        icon: <GraduationCapIcon />,
        description: `- Developed strong teamwork skills through collaborative academic projects and group assignments across multiple semesters.
- Demonstrated leadership by frequently taking on team lead roles in group projects, coordinating tasks, and ensuring timely delivery.
- Practiced effective time management by balancing coursework, organizational activities, and personal development simultaneously.
- Strengthened communication skills through presentations, team discussions, and cross-functional collaboration with peers from diverse backgrounds.`,
        descriptionId: `- Mengembangkan kemampuan kerja tim yang kuat melalui proyek akademik kolaboratif dan tugas kelompok di berbagai semester.
- Menunjukkan jiwa kepemimpinan dengan sering mengambil peran sebagai ketua tim dalam proyek kelompok, mengoordinasikan tugas, dan memastikan penyelesaian tepat waktu.
- Melatih manajemen waktu yang efektif dengan menyeimbangkan perkuliahan, kegiatan organisasi, dan pengembangan diri secara bersamaan.
- Memperkuat kemampuan komunikasi melalui presentasi, diskusi tim, dan kolaborasi lintas fungsi dengan rekan-rekan dari latar belakang yang beragam.`,
        skills: [
          "Teamwork",
          "Leadership",
          "Time Management",
          "Communication",
          "Problem Solving",
        ],
      },
      {
        id: "edu-sma3",
        title: "SMA 3 Rembang",
        employmentPeriod: {
          start: "2020",
          end: "2023",
        },
        icon: <SchoolIcon />,
        description: `- Actively participated in various seminars and workshops to broaden knowledge and stay updated with current trends.
- Developed strong communication skills through active engagement in class discussions, presentations, and extracurricular activities.
- Built teamwork and problem-solving abilities by collaborating with peers on group projects and academic challenges.
- Frequently provided advice and support to friends facing personal or academic problems, strengthening interpersonal and empathy skills.`,
        descriptionId: `- Aktif berpartisipasi dalam berbagai seminar dan workshop untuk memperluas wawasan dan mengikuti perkembangan tren terkini.
- Mengembangkan kemampuan komunikasi yang kuat melalui keterlibatan aktif dalam diskusi kelas, presentasi, dan kegiatan ekstrakurikuler.
- Membangun kemampuan kerja tim dan pemecahan masalah dengan berkolaborasi bersama teman-teman dalam proyek kelompok dan tantangan akademik.
- Sering memberikan saran dan dukungan kepada teman-teman yang menghadapi masalah pribadi atau akademik, memperkuat kemampuan interpersonal dan empati.`,
        skills: [
          "Communication",
          "Teamwork",
          "Problem Solving",
          "Public Speaking",
          "Interpersonal Skills",
        ],
      },
    ],
  },
]
