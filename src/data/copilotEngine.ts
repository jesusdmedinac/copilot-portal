import profile from './profile.json';
import guides from './guides.json';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  links?: { label: string; url: string }[];
  copySnippet?: string;
  timestamp: string;
  category?: string;
}

export const INITIAL_COPILOT_MESSAGES: ChatMessage[] = [
  {
    id: 'welcome',
    sender: 'assistant',
    text: '¡Hola Karla! Soy tu copiloto operativo. Estoy anclado a la experiencia verificada de Jesús y sus plantillas autorizadas. Puedes tocar cualquiera de las consultas temáticas abajo o escribir cualquier duda que encuentres en un formulario.',
    links: [
      { label: 'Ver Perfil Oficial', url: '/perfil' },
      { label: 'Ver Guías de Redacción', url: '/guias' }
    ],
    timestamp: 'Ahora'
  }
];

export const COPILOT_CATEGORIES = [
  {
    id: 'wells-fargo',
    label: 'Rol Actual y Fechas',
    query: '¿Cuál es el empleo actual y fechas de Jesús?',
    badge: 'Wells Fargo'
  },
  {
    id: 'ios',
    label: 'Experiencia en iOS',
    query: '¿Qué respondemos si piden experiencia en iOS?',
    badge: 'KMP'
  },
  {
    id: 'visa-tn',
    label: 'Visa TN y Autorización',
    query: '¿Qué contestar sobre patrocinio y Visa TN?',
    badge: 'Legal US'
  },
  {
    id: 'why-us',
    label: 'Plantilla Why Us',
    query: '¿Qué plantilla usar para Why Us?',
    badge: 'Formularios'
  },
  {
    id: 'projects',
    label: 'Proyectos Open Source',
    query: '¿Qué proyectos open source y repos citar?',
    badge: 'json-to-compose'
  },
  {
    id: 'outreach',
    label: 'Mensajes a Recruiters',
    query: '¿Cómo redactar un mensaje a un Recruiter o Manager en LinkedIn?',
    badge: 'LinkedIn'
  },
  {
    id: 'leadership',
    label: 'Liderazgo y TDD',
    query: '¿Cómo responder sobre liderazgo técnico y mentoría?',
    badge: 'Staff'
  },
  {
    id: 'mission',
    label: 'Misión e Impacto',
    query: '¿Qué contestar sobre impacto social y misión?',
    badge: 'Desde0'
  }
];

export function generateCopilotAnswer(query: string): ChatMessage {
  const q = query.toLowerCase();
  const id = Date.now().toString();
  const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // 1. iOS / Cross-platform
  if (q.includes('ios') || q.includes('swift') || q.includes('multiplataforma') || q.includes('cross')) {
    const guide = guides.formAnswers.find(a => a.id === 'ios-cross-platform');
    return {
      id,
      sender: 'assistant',
      text: 'Jesús no se posiciona como programador Swift exclusivo, sino como **Especialista en Kotlin Multiplatform (KMP)**. Explica que comparte el 100% de la lógica de negocio, arquitectura, datos y networking entre Android e iOS, colaborando directamente con ingenieros de iOS mediante SKIE y APIs nativas en Swift.',
      copySnippet: guide?.answer,
      links: [{ label: 'Ver Sección en Guías: Experiencia en iOS', url: '/guias#ios-cross-platform' }],
      category: 'Cross-Platform',
      timestamp
    };
  }

  // 2. Empleo Actual / Wells Fargo / Fechas / HansellApp
  if (q.includes('actual') || q.includes('wells') || q.includes('empleo') || q.includes('trabajo') || q.includes('fechas') || q.includes('hansell')) {
    return {
      id,
      sender: 'assistant',
      text: '⚠️ **Regla Mandatoria:** NUNCA mencionar HansellApp. El rol oficial y activo de Jesús es **Senior UI Engineer (Client Platform) en Wells Fargo**, con fecha continua desde **Enero 2025 (2025-01) hasta el Presente** (ubicación híbrida en San Leandro, CA).',
      copySnippet: 'Wells Fargo — Senior UI Engineer (Client Platform) | 2025-01 to Present | San Leandro, CA',
      links: [{ label: 'Ver Perfil: Wells Fargo', url: '/perfil#wells-fargo' }],
      category: 'Trayectoria',
      timestamp
    };
  }

  // 3. Visa TN / Autorización Laboral / Sponsorship
  if (q.includes('visa') || q.includes('tn') || q.includes('patrocinio') || q.includes('sponsor') || q.includes('autorizaci') || q.includes('legal')) {
    const guide = guides.formAnswers.find(a => a.id === 'work-authorization-tn');
    return {
      id,
      sender: 'assistant',
      text: 'En preguntas de autorización laboral en EE.UU.:\n• "¿Authorized to work lawfully?": **YES**\n• "¿Will you require sponsorship?": **YES (TN Visa)**.\n\nNota operativa: La Visa TN (bajo el tratado T-MEC/USMCA para profesionistas mexicanos) es un trámite expedito de solo 2 a 3 semanas con carta oferta, sin lotería ni cupos anuales.',
      copySnippet: guide?.answer,
      links: [{ label: 'Ver Sección en Guías: Visa TN', url: '/guias#work-authorization-tn' }],
      category: 'Legal',
      timestamp
    };
  }

  // 4. Why Us / Motivación / Interés en el rol
  if (q.includes('why') || q.includes('motiva') || q.includes('interes') || q.includes('entusiasma') || q.includes('porque')) {
    const guide = guides.formAnswers.find(a => a.id === 'why-us');
    return {
      id,
      sender: 'assistant',
      text: 'Para la pregunta "¿Por qué quieres trabajar aquí?", usa la plantilla oficial para Staff Mobile Engineer, enfatizando sus 10 años en Android SDK, Kotlin Multiplatform y aceleración de desarrolladores.',
      copySnippet: guide?.answer,
      links: [{ label: 'Ver Sección en Guías: Why Us', url: '/guias#why-us' }],
      category: 'Formularios ATS',
      timestamp
    };
  }

  // 5. Proyectos Open Source / Portafolio / Código
  if (q.includes('proyecto') || q.includes('open source') || q.includes('codigo') || q.includes('repo') || q.includes('github') || q.includes('json')) {
    return {
      id,
      sender: 'assistant',
      text: 'Los proyectos técnicos reales y verificados de Jesús para citar son:\n1. **json-to-compose:** Motor de Server-Driven UI en Compose Multiplatform.\n2. **Zora Community:** App automotriz de referencia en Kotlin Toolchain + SQLDelight.\n3. **KMP CLI:** Suite de diagnóstico y arquitectura multiplataforma.\n4. **Academia Desde0:** Plataforma educativa con más de 2,000 alumnos.',
      copySnippet: 'json-to-compose: https://github.com/jesusdmedinac/json-to-compose\nZora Community: https://github.com/jesusdmedinac/zora-community',
      links: [{ label: 'Ver Perfil: Proyectos de Código Abierto', url: '/perfil#proyectos' }],
      category: 'Proyectos',
      timestamp
    };
  }

  // 6. Outreach / Recruiter / Hiring Manager / LinkedIn
  if (q.includes('recruiter') || q.includes('manager') || q.includes('outreach') || q.includes('mensaje') || q.includes('contact') || q.includes('linkedin')) {
    const template = guides.outreachTemplates[0];
    return {
      id,
      sender: 'assistant',
      text: 'Para enviar mensaje en LinkedIn tras postular, mantén el mensaje en menos de 5 líneas, mencionando 10 años en Android/KMP, Wells Fargo, residencia en San Leandro, CA y enlace directo a su web.',
      copySnippet: template?.text,
      links: [{ label: 'Ver Sección en Guías: Plantillas de Outreach', url: '/guias#outreach' }],
      category: 'Outreach',
      timestamp
    };
  }

  // 7. Misión / Impacto / Valores
  if (q.includes('mision') || q.includes('misión') || q.includes('proposito') || q.includes('propósito') || q.includes('impacto')) {
    const guide = guides.formAnswers.find(a => a.id === 'mission-empowerment');
    return {
      id,
      sender: 'assistant',
      text: 'Para preguntas sobre impacto o misión, Jesús conecta la filosofía mobile-first con su experiencia real fundando Academia Desde0 para democratizar la tecnología.',
      copySnippet: guide?.answer,
      links: [{ label: 'Ver Sección en Guías: Misión e Impacto', url: '/guias#mission-empowerment' }],
      category: 'Cultura',
      timestamp
    };
  }

  // 8. Liderazgo / Mentoría
  if (q.includes('lider') || q.includes('mentor') || q.includes('equipo') || q.includes('tdd') || q.includes('calidad')) {
    const guide = guides.formAnswers.find(a => a.id === 'leadership-mentorship');
    return {
      id,
      sender: 'assistant',
      text: 'Para liderazgo técnico, enfócate en la multiplicación del impacto de los demás: mentoría a más de 20 ingenieros, reducción de bugs con TDD y buenas prácticas de IA.',
      copySnippet: guide?.answer,
      links: [{ label: 'Ver Sección en Guías: Liderazgo y Mentoría', url: '/guias#leadership-mentorship' }],
      category: 'Liderazgo',
      timestamp
    };
  }

  // Respuesta por defecto con enlaces sugeridos
  return {
    id,
    sender: 'assistant',
    text: `Entendido. Para "${query}", te recomiendo revisar la sección de perfil oficial o las guías de redacción. Si necesitas datos exactos, puedes tocar una de las sugerencias temáticas en el panel lateral.`,
    links: [
      { label: 'Consultar Perfil y Trayectoria', url: '/perfil' },
      { label: 'Consultar Guías y Respuestas', url: '/guias' }
    ],
    timestamp
  };
}
