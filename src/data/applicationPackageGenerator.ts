import { generateTailoredLatexCv } from './latexCvTemplate';
import guides from './guides.json';

export interface ApplicationPackage {
  type: 'linkedin-email' | 'ats-package' | 'qa-answer' | 'general';
  companyName?: string;
  roleTitle?: string;
  contactEmail?: string;
  emailSubject?: string;
  emailDraft?: string;
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

  // CASO 1: Post de LinkedIn con Email de Contacto
  if (isLinkedInPost && emailMatch) {
    const email = emailMatch[1];
    const subject = `Staff / Senior Mobile Engineer — Jesús Medina (${role})`;
    const draft = `Hi,

I came across your note regarding the ${role} opening at ${company}. With 10 years of mobile engineering experience architecting client platforms at Wells Fargo and authoring open-source Kotlin Multiplatform engines (json-to-compose), my background directly aligns with high-scale client platform engineering and developer velocity.

I am based locally in San Leandro, CA (SF Bay Area) with full US work authorization via the expedited TN Visa category (USMCA treaty). I have attached my resume for your review.

I would welcome the opportunity to connect and learn more about your technical priorities.

Best regards,
Jesús Daniel Medina Cruz
https://jesusdmedinac.com | https://linkedin.com/in/jesusdmedinac
+1 (470) 406-1747`;

    return {
      type: 'linkedin-email',
      companyName: company,
      roleTitle: role,
      contactEmail: email,
      emailSubject: subject,
      emailDraft: draft,
      summaryNote: `Detecté un post de LinkedIn con email de contacto (${email}). Se generó el borrador de email directo sin rodeos y adaptado al writing style de Jesús.`
    };
  }

  // CASO 2: Job Description de ATS (Greenhouse, Lever, etc.)
  if (text.length > 150 || lower.includes('requirements') || lower.includes('responsibilities') || lower.includes('qualifications') || lower.includes('requisitos')) {
    const latexCv = generateTailoredLatexCv({
      companyName: company,
      roleTitle: role
    });

    const coverLetter = `Dear Hiring Team at ${company},

I am writing to express my strong interest in the ${role} position. With a decade of dedicated mobile software engineering focused on Android platform architecture, developer velocity, and Kotlin Multiplatform (KMP), I have built a career around transforming complex, high-scale client systems into modular and reliable platforms.

Currently at Wells Fargo as a Senior UI Engineer on the Client Platform team, I architected a centralized navigation architecture that consolidated over 10 fragmented entry points, driving UI modernization to Jetpack Compose while enforcing strict Clean Architecture and Unidirectional Data Flow. In parallel, as the creator of json-to-compose (a native Server-Driven UI engine for Compose Multiplatform) and founder of Academia Desde0, I actively advance modern multiplatform tooling and mentor engineering teams in test-driven development (TDD).

I am drawn to ${company} for your dedication to scalable product engineering. I reside in San Leandro, CA (SF Bay Area) and hold expedited work authorization under the USMCA TN Visa status. I look forward to discussing how my experience can support your engineering roadmap.

Sincerely,
Jesús Daniel Medina Cruz
https://jesusdmedinac.com | +1 (470) 406-1747`;

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

    return {
      type: 'ats-package',
      companyName: company,
      roleTitle: role,
      coverLetter,
      latexCv,
      atsAnswers,
      summaryNote: `Detecté un Job Description completo para ${company} (${role}). Se generó el paquete integral de postulación: CV en LaTeX (ModernCV), Cover Letter personalizado y respuestas ATS.`
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
