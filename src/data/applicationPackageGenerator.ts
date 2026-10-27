import { generateTailoredLatexCv } from './latexCvTemplate';
import guides from './guides.json';

export interface ApplicationPackage {
  type: 'linkedin-email' | 'ats-package' | 'qa-answer' | 'general';
  companyName?: string;
  roleTitle?: string;
  contactEmail?: string;
  cvRecommendation?: string;
  cvLink?: string;
  emailSubject?: string;
  emailDraft?: string;
  linkedinNote?: string;
  commentDraft?: string;
  coverLetter?: string;
  latexCv?: string;
  atsAnswers?: { question: string; answer: string; tag: string }[];
  notionSyncSnippet?: string;
  summaryNote: string;
}

export function analyzeAndGeneratePackage(input: string): ApplicationPackage {
  const text = input.trim();
  const lower = text.toLowerCase();

  // 1. Detectar si contiene un email o patrón de post de LinkedIn
  const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/;
  const emailMatch = text.match(emailRegex);
  const isLinkedInPost = emailMatch || lower.includes('linkedin.com') || lower.includes('reach out to') || lower.includes('send resume') || lower.includes('we are hiring');

  // Extraer nombre de empresa tentativo
  let company = 'Target Company';
  const companyPatterns = [/at\s+([A-Z][a-zA-Z0-9]+)/, /para\s+([A-Z][a-zA-Z0-9]+)/, /en\s+([A-Z][a-zA-Z0-9]+)/, /empresa:\s*([^\n,]+)/i];
  for (const pat of companyPatterns) {
    const match = text.match(pat);
    if (match && match[1]) {
      company = match[1].trim();
      break;
    }
  }

  // Extraer título de rol
  let role = 'Senior Mobile Software Engineer';
  if (lower.includes('staff')) role = 'Staff Android Software Engineer';
  else if (lower.includes('lead')) role = 'Lead Mobile Engineer';
  else if (lower.includes('principal')) role = 'Principal Mobile Engineer';
  else if (lower.includes('android')) role = 'Senior Android Engineer';
  else if (lower.includes('multiplatform') || lower.includes('kmp')) role = 'Senior Kotlin Multiplatform Engineer';

  // Determinar arquetipo canónico adecuado
  let cvRecommendation = 'Arquetipo 1: Android Platform & Core Architecture | URL: https://cv-ats-eyd.pages.dev/cv-android-platform/ | Motivo: Enfoque nativo en Android SDK, Compose y arquitectura de plataforma.';
  let cvLink = 'https://cv-ats-eyd.pages.dev/cv-android-platform/';

  if (lower.includes('multiplatform') || lower.includes('kmp') || lower.includes('cross-platform') || lower.includes('cross platform')) {
    cvRecommendation = 'Arquetipo 2: Kotlin Multiplatform (KMP) Architect | URL: https://cv-ats-eyd.pages.dev/cv-kmp-architect/ | Motivo: Enfoque en código compartido multiplataforma Android/iOS con KMP y Kotlin Coroutines.';
    cvLink = 'https://cv-ats-eyd.pages.dev/cv-kmp-architect/';
  } else if (lower.includes('founding') || lower.includes('early stage') || lower.includes('startup') || lower.includes('0 to 1') || lower.includes('0-1') || lower.includes('react native')) {
    cvRecommendation = 'Arquetipo 3: Founding Mobile & Product Engineer | URL: https://cv-ats-eyd.pages.dev/cv-founding-mobile/ | Motivo: Enfoque de producto 0-a-1, agilidad y desarrollo end-to-end (Android, KMP, React Native).';
    cvLink = 'https://cv-ats-eyd.pages.dev/cv-founding-mobile/';
  }

  const linkedinNote = `Hi, saw your note for ${role} at ${company}. With 10 yrs in mobile platform at Wells Fargo & KMP, I would love to connect! Best, Jesús`.slice(0, 195);

  // CASO 1: Post de LinkedIn con Email de Contacto
  if (isLinkedInPost && emailMatch) {
    const email = emailMatch[1];
    const subject = `Staff / Senior Mobile Engineer — Jesús Medina (${role})`;
    const draft = `Hi,

Saw your note regarding the ${role} opening at ${company}.
Currently Senior UI Engineer at Wells Fargo (Client Platform), I specialize in scaling high-performance Android systems, Jetpack Compose, modular architecture, and CI/CD pipelines.
Authorized to work in the US (TN Visa status). Resume attached—let me know if you have time for a brief sync this week.

Best,
Jesús Daniel Medina Cruz`;

    return {
      type: 'linkedin-email',
      companyName: company,
      roleTitle: role,
      contactEmail: email,
      emailSubject: subject,
      emailDraft: draft,
      linkedinNote,
      cvRecommendation,
      cvLink,
      summaryNote: `Detecté un post de LinkedIn con email de contacto (${email}). Se generó el paquete completo de postulación (CV canónico, email directo en 3 pasos, nota de LinkedIn < 200 caracteres).`
    };
  }

  // CASO 2: Job Description de ATS (Greenhouse, Lever, etc.)
  if (text.length > 150 || lower.includes('requirements') || lower.includes('responsibilities') || lower.includes('qualifications') || lower.includes('requisitos')) {
    const latexCv = generateTailoredLatexCv({
      companyName: company,
      roleTitle: role
    });

    const coverLetter = `Dear Hiring Team at ${company},

I am writing to express my interest in the ${role} position. As a Senior UI Engineer at Wells Fargo (Client Platform), I bring 10 years of mobile engineering experience architecting modular Android systems, Jetpack Compose UI, and cross-platform infrastructure with Kotlin Multiplatform (KMP).

At Wells Fargo, I lead client platform initiatives that consolidate core architecture, optimize CI/CD pipelines, and reduce defect density by 30% through disciplined TDD and Clean Architecture. My background directly bridges low-level mobile performance with high-velocity developer experience.

Authorized to work in the US under TN Visa status, I have attached my resume and look forward to discussing how my platform expertise can contribute to ${company}.

Sincerely,
Jesús Daniel Medina Cruz`;

    const atsAnswers = [
      {
        question: `Why ${company}? / What excites you about this role?`,
        answer: `With 10 years of mobile engineering experience focused on the Android SDK, Kotlin Multiplatform (KMP), and modular client architecture, I am drawn to ${company}'s commitment to engineering excellence at massive scale. Having built open-source engines like json-to-compose and consolidated banking flows at Wells Fargo, I am eager to help ${company} elevate client platform performance and developer velocity.`,
        tag: 'Why Us'
      },
      {
        question: 'Do you have iOS or Cross-Platform experience?',
        answer: 'My cross-platform expertise centers on Kotlin Multiplatform (KMP), enabling 100% shared business logic, networking, and data layers between Android and iOS without runtime overhead. While my native deep-dive is Android SDK and Compose, I routinely collaborate with iOS engineers to expose clean Swift-friendly APIs via SKIE and SPM dependencies.',
        tag: 'Cross-Platform'
      },
      {
        question: 'Work Authorization & Sponsorship',
        answer: 'Yes, I require visa sponsorship via the TN Visa category (USMCA/T-MEC treaty for Mexican citizens). I currently reside in San Leandro, CA and hold professional engineering degrees. TN visa transfers/issuance take only 2-3 weeks with minimal paperwork and zero lottery constraints.',
        tag: 'Visa TN'
      }
    ];

    const emailSubject = `${role} Application - Jesús Medina`;
    const emailDraft = `Hi,

I am applying for the ${role} position at ${company}.
Currently Senior UI Engineer at Wells Fargo (Client Platform), I specialize in scaling modular Android systems, Jetpack Compose, and CI/CD pipelines.
Authorized to work in the US (TN Visa status). Resume attached—let me know if you have time for a brief sync this week.

Best,
Jesús Daniel Medina Cruz`;

    return {
      type: 'ats-package',
      companyName: company,
      roleTitle: role,
      cvRecommendation,
      cvLink,
      emailSubject,
      emailDraft,
      linkedinNote,
      coverLetter,
      latexCv,
      atsAnswers,
      summaryNote: `Detecté un Job Description para ${company} (${role}). Se generó el paquete 4-en-1: CV Canónico recomendado, Correo de postulación, Nota de LinkedIn (< 200 chars) y Cover Letter sobrio de 3 párrafos.`
    };
  }

  // CASO 3: Pregunta ATS específica o no registrada
  // Verificar si coincide con alguna de guides.json
  const matchedGuide = guides.formAnswers.find(a => 
    lower.includes(a.id) || 
    lower.includes(a.title.toLowerCase()) || 
    a.tags.some(t => lower.includes(t.toLowerCase()))
  );

  if (matchedGuide) {
    return {
      type: 'qa-answer',
      summaryNote: `Respuesta oficial verificada para "${matchedGuide.title}":`,
      atsAnswers: [{
        question: matchedGuide.title,
        answer: matchedGuide.answer,
        tag: matchedGuide.tags[0] || 'Vetted'
      }]
    };
  }

  // Si es una pregunta nueva no catalogada en guides.json
  const customAnswer = `With 10 years of mobile software engineering experience at Wells Fargo and consulting environments, my approach emphasizes robust client architecture, strict testing practices (TDD), and Kotlin Multiplatform to deliver resilient mobile products at scale.`;
  
  const notionSnippet = `### 💡 Nueva Pregunta de Formulario:
* **Pregunta:** "${text}"
* **Respuesta Sugerida:** "${customAnswer}"
* **Contexto:** Agregada durante la sesión de Karla para revisión de Jesús.`;

  return {
    type: 'qa-answer',
    summaryNote: `Esta pregunta no tiene un registro previo en la base oficial. He generado una respuesta preliminar en el tono de Jesús y un bloque para que lo guardes en Notion:`,
    atsAnswers: [{
      question: text,
      answer: customAnswer,
      tag: 'Nueva Pregunta'
    }],
    notionSyncSnippet: notionSnippet
  };
}
