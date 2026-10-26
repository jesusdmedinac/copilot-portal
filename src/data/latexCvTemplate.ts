import profile from './profile.json';

interface TailoredCvOptions {
  companyName: string;
  roleTitle: string;
  summaryHook?: string;
  customHighlights?: string[];
}

export function generateTailoredLatexCv({
  companyName,
  roleTitle,
  summaryHook,
  customHighlights
}: TailoredCvOptions): string {
  const safeCompany = companyName.replace(/[&%$#_{}~^]/g, '\\$&') || 'Target Company';
  const safeRole = roleTitle.replace(/[&%$#_{}~^]/g, '\\$&') || 'Senior Mobile Engineer';

  const defaultSummary = summaryHook || 
    `Staff / Senior Mobile Software Engineer with 10 years of experience architecting large-scale Android platforms, client architecture, and cross-platform systems in Kotlin Multiplatform (KMP). Deeply aligned with ${safeCompany}'s mission and engineering standards. Proven track record of consolidating complex banking architectures at Wells Fargo, maintaining 99.9% crash-free stability, and creating developer tools (json-to-compose, Zora Community) that maximize engineering velocity in high-trust client environments.`;

  return `%% CV - Jesús Daniel Medina Cruz - ${safeRole} (${safeCompany})
\\documentclass[11pt,a4paper,sans]{moderncv}
\\moderncvstyle{banking}
\\moderncvcolor{blue}

\\renewcommand*{\\namefont}{\\fontsize{30}{32}\\bfseries\\upshape}
\\colorlet{firstnamecolor}{color1}
\\colorlet{lastnamecolor}{color1}
\\colorlet{namecolor}{color1}
\\renewcommand*{\\sectionstyle}[1]{{\\sectionfont\\color{color1}#1}}

\\usepackage[utf8]{inputenc}
\\ifpdftex\\usepackage[T1]{fontenc}\\fi
\\AtEndPreamble{\\hypersetup{
    colorlinks=true,
    linkcolor=blue,
    filecolor=magenta,
    urlcolor=blue,
    pdftitle={Jesús Daniel Medina Cruz - ${safeRole}},
    pdfpagemode=UseNone,
}}
\\usepackage[scale=0.82]{geometry}
\\usepackage{import}
\\usepackage{needspace}

% personal data
\\name{Jesús Daniel}{Medina Cruz}
\\address{San Leandro, CA (San Francisco Bay Area)}{}{}
\\phone[mobile]{+1~(470)~406-1747}
\\email{jesus.daniel.medina.cruz@gmail.com}
\\extrainfo{\\href{https://linkedin.com/in/jesusdmedinac}{LinkedIn: jesusdmedinac} \\quad \\href{https://github.com/jesusdmedinac}{GitHub: jesusdmedinac} \\quad \\href{https://jesusdmedinac.com}{jesusdmedinac.com}}

\\begin{document}

\\makecvtitle

% ============================================================
%     PROFILE STATEMENT
% ============================================================
\\vspace{-12pt}
\\small{${defaultSummary}}

% ============================================================
%     CORE COMPETENCIES
% ============================================================
\\section{Core Competencies}
\\vspace{1pt}
\\begin{itemize}
\\item \\textbf{Android Platform \\& Architecture}: Android SDK internals, Jetpack Compose, Clean Architecture, Unidirectional Data Flow (UDF), Modularization, Developer Velocity.
\\item \\textbf{Kotlin Multiplatform (KMP) \\& Systems}: Shared Domain Architecture, Compose Multiplatform, SQLDelight, Turbine, Ktor, Swift / iOS Interoperability.
\\item \\textbf{Client Reliability \\& Scale}: Large-Scale Client Platforms, High-Concurrency Coroutines, Security-First Validation, 99.9% Crash-Free Stability.
\\item \\textbf{Quality Engineering \\& Tooling}: Test-Driven Development (TDD), CI/CD Automation (GitHub Actions, Fastlane), Gradle Plugins, AI-assisted workflows.
\\end{itemize}

% ============================================================
%     PROFESSIONAL EXPERIENCE
% ============================================================
\\section{Professional Experience}
\\vspace{3pt}
\\begin{itemize}

% --- Wells Fargo ---
\\item{\\cventry{2025 -- Present}{Senior UI Engineer (Client Platform)}{Wells Fargo}{San Leandro, CA (Hybrid)}{}{\\vspace{1pt}
\\begin{itemize}
    \\item {Architected a centralized, 100\\% testable navigation framework consolidating 10+ fragmented entry points, eliminating architectural debt and regression risks across core financial workflows.}
    \\item {Spearheaded the UI modernization roadmap, leading the migration of legacy XML layouts to Jetpack Compose while enforcing Clean Architecture, MVVM, and strict unidirectional data flow (UDF).}
    \\item {Engineered robust error-handling, session recovery, and client-side validation mechanisms ensuring zero transaction leakage during network intermittency.}
    \\item {Mentored engineering teams on modern reactive Android paradigms (Coroutines, StateFlow, Compose state management) and integrated AI developer tooling to accelerate team delivery velocity.}
\\end{itemize}}}

\\vspace{3pt}

% --- Academia Desde0 ---
\\item{\\cventry{2024 -- 2024}{Senior Mobile Developer \\& Instructor}{Academia Desde0}{Remote}{}{\\vspace{1pt}
\\begin{itemize}
    \\item {Upskilled 20+ developers in modern mobile architecture by designing and delivering a curriculum focused on KMP, Compose Multiplatform, and Clean Architecture.}
    \\item {Decreased defect density by 30\\% across software projects through the strict implementation of Test-Driven Development (TDD) and automated test harnesses.}
    \\item {Established collaborative engineering culture by instituting structured pair programming and agile code review cycles.}
\\end{itemize}}}

\\vspace{3pt}

% --- Bubble ---
\\item{\\cventry{2021 -- 2024}{Senior Android Software Consultant (Fintech \\& Mobile Platforms)}{Bubble}{Remote}{}{\\vspace{1pt}
\\begin{itemize}
    \\item {Spearheaded Android codebase modernization, migrating legacy monolithic architectures into modular Kotlin packages and reducing technical debt by 31\\%.}
    \\item {Bitso (Fintech): Owned the cross-platform integration of user engagement SDKs using Kotlin Multiplatform across Android and iOS.}
    \\item {Maintained 99.9\\% crash-free sessions across millions of app sessions by establishing robust error-handling boundaries and automated regression suites.}
    \\item {Created custom Gradle plugins to standardize build configurations and automated testing suites across engineering squads.}
\\end{itemize}}}

\\vspace{3pt}

% --- Insulet Corporation ---
\\item{\\cventry{2019 -- 2021}{Senior Mobile Engineer}{Insulet Corporation}{Tijuana, Mexico}{}{\\vspace{1pt}
\\begin{itemize}
    \\item {Delivered continuous health monitoring by designing a high-concurrency client data processing pipeline with low-latency background updates.}
    \\item {Reduced app memory footprint by 35\\% and eliminated UI stutter by isolating background telemetry processing into dedicated memory-optimized domain layers.}
    \\item {Streamlined shared platform layers using Kotlin and Java to maximize code reuse across mobile clients.}
\\end{itemize}}}

\\vspace{3pt}

% --- arkusnexus ---
\\item{\\cventry{2019}{Senior Mobile Developer}{arkusnexus}{Tijuana, Mexico}{}{\\vspace{1pt}
\\begin{itemize}
    \\item {Executed a 100\\% successful zero-regression migration from React Native to native Android for the Rosy memory assistant app, improving launch times by 40\\%.}
    \\item {Engineered real-time vehicle telematics and sensor tracking systems for dynamic insurtech pricing models.}
\\end{itemize}}}

\\vspace{3pt}

% --- Compus Sistemas Express ---
\\item{\\cventry{2014 -- 2017}{Software Developer}{Compus Sistemas Express}{Tijuana, Mexico}{}{\\vspace{1pt}
\\begin{itemize}
    \\item {Boosted development velocity for internal projects by creating reusable SDKs and service clients to standardize data access.}
\\end{itemize}}}

\\end{itemize}

% ============================================================
%     KEY OPEN SOURCE PROJECTS
% ============================================================
\\section{Key Projects \\& Open Source}
\\vspace{1pt}
\\begin{itemize}
\\item \\textbf{json-to-compose} (\\href{https://github.com/jesusdmedinac/json-to-compose}{github.com/jesusdmedinac/json-to-compose}): Native Server-Driven UI engine for Compose Multiplatform enabling dynamic declarative UI updates across Android, iOS, Desktop, and Web.
\\item \\textbf{Zora Community} (\\href{https://github.com/jesusdmedinac/zora-community}{github.com/jesusdmedinac/zora-community}): Open-core automotive catalog application built with declarative Kotlin Toolchain, SQLDelight 2.x, and MVI architecture.
\\item \\textbf{KMP CLI} (\\href{https://github.com/jesusdmedinac/kmp-cli}{github.com/jesusdmedinac/kmp-cli}): Multiplatform environment diagnostic and architecture linter toolchain for Kotlin developers.
\\end{itemize}

% ============================================================
%     EDUCATION
% ============================================================
\\section{Education}
\\vspace{1pt}
\\begin{itemize}
\\item{\\cventry{2017 -- 2018}{Licence Professionnelle, Informatique Répartie et Mobile}{IUT de La Rochelle}{La Rochelle, France}{}{\\vspace{1pt}
Specialization in distributed computing, native mobile systems, and cross-platform software engineering.
}}
\\vspace{2pt}
\\item{\\cventry{2015 -- 2017}{Técnico Superior Universitario en TIC, Sistemas Informáticos}{Universidad Tecnológica de Tijuana}{Tijuana, Mexico}{}{\\vspace{1pt}
Foundations of software engineering, relational databases, object-oriented design, and mobile development.
}}
\\end{itemize}

% ============================================================
%     LANGUAGES & CERTIFICATIONS
% ============================================================
\\section{Languages \\& Certifications}
\\vspace{1pt}
\\begin{itemize}
\\item \\textbf{Languages}: Spanish (Native), English (Advanced / Professional Working Proficiency), French (Advanced).
\\item \\textbf{Certifications}: Compose Expert (DevExpert, 2025), Testing Expert (DevExpert, 2023), Kotlin Expert (DevExpert, 2022).
\\end{itemize}

\\end{document}
`;
}
