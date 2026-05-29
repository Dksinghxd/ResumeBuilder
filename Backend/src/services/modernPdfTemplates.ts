/**
 * Modern professional PDF layouts (2024–2025 style).
 * Used when templateId is one of the new slugs.
 */

export interface PdfSectionContext {
  fullName: string;
  headline: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  summary: string;
  experienceHTML: string;
  educationHTML: string;
  skills: Array<{ name: string; proficiency: string }>;
}

export type ModernPdfTemplateId =
  | 'professional-teal'
  | 'corporate-navy'
  | 'tech-sidebar'
  | 'clean-linear';

export const MODERN_PDF_TEMPLATE_IDS: ModernPdfTemplateId[] = [
  'professional-teal',
  'corporate-navy',
  'tech-sidebar',
  'clean-linear',
];

export function isModernPdfTemplate(
  template: string
): template is ModernPdfTemplateId {
  return (MODERN_PDF_TEMPLATE_IDS as string[]).includes(template);
}

function skillsPills(
  skills: PdfSectionContext['skills'],
  bg: string,
  color: string,
  border: string
): string {
  if (!skills.length) return '';
  return skills
    .map(
      (s) =>
        `<span style="display:inline-block;background:${bg};color:${color};border:1px solid ${border};font-size:9px;font-weight:600;padding:3px 8px;border-radius:12px;margin:2px 4px 2px 0;text-transform:capitalize;">${s.name}</span>`
    )
    .join('');
}

function skillsListSidebar(skills: PdfSectionContext['skills']): string {
  if (!skills.length) return '';
  return `<ul style="list-style:none;padding:0;margin:0;font-size:10px;">
    ${skills
      .map(
        (s) =>
          `<li style="display:flex;justify-content:space-between;margin-bottom:6px;color:#e2e8f0;"><span>${s.name}</span><span style="opacity:0.7;font-size:8px;text-transform:capitalize;">${s.proficiency}</span></li>`
      )
      .join('')}
  </ul>`;
}

function skillsMono(skills: PdfSectionContext['skills']): string {
  if (!skills.length) return '';
  return skills
    .map(
      (s) =>
        `<span style="display:inline-block;font-family:monospace;font-size:8px;background:#27272a;border:1px solid #52525b;color:#6ee7b7;padding:2px 6px;border-radius:3px;margin:2px;">${s.name}</span>`
    )
    .join('');
}

export function buildModernPdfTemplate(
  template: ModernPdfTemplateId,
  ctx: PdfSectionContext
): { layoutCSS: string; bodyHTML: string } {
  const contactLine = [
    ctx.email,
    ctx.phone,
    ctx.location,
    ctx.website,
  ]
    .filter(Boolean)
    .join(' &nbsp;|&nbsp; ');

  if (template === 'professional-teal') {
    return {
      layoutCSS: `
        body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; margin: 0; padding: 0; color: #1f2937; background: #fff; line-height: 1.45; }
        .hero { background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%); color: #fff; padding: 28px 32px; }
        .hero h1 { margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.02em; }
        .hero .role { margin: 4px 0 0; font-size: 12px; color: #ccfbf1; font-weight: 500; }
        .hero .contact { margin: 10px 0 0; font-size: 10px; color: #f0fdfa; }
        .body { padding: 24px 32px; }
        .section { margin-bottom: 20px; }
        .section-title { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.12em; color: #0f766e; border-left: 4px solid #14b8a6; padding-left: 8px; margin: 0 0 10px; }
        .summary-text { font-size: 11px; color: #4b5563; margin: 0; }
        .item { margin-bottom: 12px; }
        .item-header { display: flex; justify-content: space-between; font-size: 11px; font-weight: 700; color: #111827; }
        .item-header .date { font-weight: 400; font-size: 9px; color: #6b7280; }
        .company { font-size: 10px; color: #0d9488; font-weight: 600; margin-top: 2px; }
        .description { font-size: 10px; color: #4b5563; margin: 4px 0 0; }
        .school-name { font-size: 10px; color: #6b7280; }
      `,
      bodyHTML: `
        <div class="hero">
          <h1>${ctx.fullName}</h1>
          <p class="role">${ctx.headline}</p>
          <p class="contact">${contactLine}</p>
        </div>
        <div class="body">
          ${ctx.summary ? `<div class="section"><h2 class="section-title">Profile</h2><p class="summary-text">${ctx.summary}</p></div>` : ''}
          ${ctx.experienceHTML ? `<div class="section"><h2 class="section-title">Experience</h2>${ctx.experienceHTML}</div>` : ''}
          ${ctx.educationHTML ? `<div class="section"><h2 class="section-title">Education</h2>${ctx.educationHTML}</div>` : ''}
          ${ctx.skills.length ? `<div class="section"><h2 class="section-title">Skills</h2><div>${skillsPills(ctx.skills, '#f0fdfa', '#115e59', '#99f6e4')}</div></div>` : ''}
        </div>
      `,
    };
  }

  if (template === 'corporate-navy') {
    return {
      layoutCSS: `
        body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; margin: 0; padding: 0; color: #1e293b; }
        .layout { display: flex; min-height: 100vh; }
        .sidebar { width: 32%; background: #172554; color: #fff; padding: 28px 20px; box-sizing: border-box; }
        .sidebar h1 { margin: 0; font-size: 20px; font-weight: 800; line-height: 1.2; }
        .sidebar .role { font-size: 11px; color: #93c5fd; margin-top: 6px; }
        .sidebar .block { margin-top: 20px; padding-top: 16px; border-top: 1px solid #1e3a8a; font-size: 10px; color: #dbeafe; line-height: 1.6; }
        .sidebar .label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #60a5fa; margin-bottom: 8px; }
        .main { width: 68%; padding: 28px 24px; box-sizing: border-box; }
        .section-title { font-size: 10px; font-weight: 800; text-transform: uppercase; color: #172554; border-bottom: 2px solid #172554; padding-bottom: 4px; margin: 0 0 12px; }
        .section { margin-bottom: 22px; }
        .timeline { border-left: 2px solid #bfdbfe; padding-left: 14px; margin-left: 4px; }
        .item { margin-bottom: 14px; position: relative; }
        .item::before { content: ''; position: absolute; left: -19px; top: 4px; width: 8px; height: 8px; background: #172554; border-radius: 50%; }
        .item-header { display: flex; justify-content: space-between; font-size: 11px; font-weight: 700; }
        .item-header .date { font-size: 9px; color: #64748b; font-weight: 400; }
        .company { font-size: 10px; color: #1d4ed8; font-weight: 600; margin-top: 2px; }
        .description { font-size: 10px; color: #475569; margin-top: 4px; }
        .summary-text { font-size: 11px; color: #475569; line-height: 1.5; }
        .school-name { font-size: 10px; color: #64748b; }
      `,
      bodyHTML: `
        <div class="layout">
          <aside class="sidebar">
            <h1>${ctx.fullName}</h1>
            <p class="role">${ctx.headline}</p>
            <div class="block">
              <div class="label">Contact</div>
              <div>${ctx.email}</div>
              ${ctx.phone ? `<div>${ctx.phone}</div>` : ''}
              ${ctx.location ? `<div>${ctx.location}</div>` : ''}
            </div>
            ${ctx.skills.length ? `<div class="block"><div class="label">Expertise</div>${skillsListSidebar(ctx.skills)}</div>` : ''}
          </aside>
          <main class="main">
            ${ctx.summary ? `<div class="section"><h2 class="section-title">Professional Summary</h2><p class="summary-text">${ctx.summary}</p></div>` : ''}
            ${ctx.experienceHTML ? `<div class="section"><h2 class="section-title">Experience</h2><div class="timeline">${ctx.experienceHTML}</div></div>` : ''}
            ${ctx.educationHTML ? `<div class="section"><h2 class="section-title">Education</h2>${ctx.educationHTML}</div>` : ''}
          </main>
        </div>
      `,
    };
  }

  if (template === 'tech-sidebar') {
    return {
      layoutCSS: `
        body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; margin: 0; padding: 0; }
        .layout { display: flex; }
        .sidebar { width: 34%; background: #18181b; color: #fafafa; padding: 28px 20px; box-sizing: border-box; }
        .sidebar h1 { margin: 0; font-size: 18px; font-family: ui-monospace, monospace; font-weight: 700; }
        .sidebar .role { color: #34d399; font-size: 10px; font-family: ui-monospace, monospace; margin-top: 8px; }
        .sidebar .meta { margin-top: 20px; padding-top: 16px; border-top: 1px solid #3f3f46; font-size: 9px; font-family: ui-monospace, monospace; color: #a1a1aa; line-height: 1.8; }
        .sidebar .meta span { color: #71717a; }
        .main { width: 66%; background: #fafafa; padding: 28px 24px; box-sizing: border-box; color: #27272a; }
        .section-title { font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.15em; margin: 0 0 10px; color: #18181b; }
        .section { margin-bottom: 20px; }
        .item { margin-bottom: 14px; padding-bottom: 14px; border-bottom: 1px solid #e4e4e7; }
        .item:last-child { border-bottom: none; }
        .item-header { display: flex; justify-content: space-between; font-size: 11px; font-weight: 700; }
        .item-header .date { font-size: 9px; color: #71717a; font-family: ui-monospace, monospace; font-weight: 400; }
        .company { font-size: 10px; color: #059669; font-weight: 600; margin-top: 2px; }
        .description { font-size: 10px; color: #52525b; margin-top: 4px; }
        .summary-text { font-size: 11px; color: #52525b; line-height: 1.5; }
        .school-name { font-size: 10px; color: #71717a; }
      `,
      bodyHTML: `
        <div class="layout">
          <aside class="sidebar">
            <h1>${ctx.fullName}</h1>
            <p class="role">${ctx.headline}</p>
            <div class="meta">
              <div><span>email</span> ${ctx.email}</div>
              ${ctx.phone ? `<div><span>tel</span> ${ctx.phone}</div>` : ''}
              ${ctx.location ? `<div><span>loc</span> ${ctx.location}</div>` : ''}
            </div>
            ${ctx.skills.length ? `<div class="meta" style="border-top:1px solid #3f3f46;margin-top:16px;padding-top:16px;"><div style="color:#71717a;margin-bottom:8px;">STACK</div>${skillsMono(ctx.skills)}</div>` : ''}
          </aside>
          <main class="main">
            ${ctx.summary ? `<div class="section"><h2 class="section-title">About</h2><p class="summary-text">${ctx.summary}</p></div>` : ''}
            ${ctx.experienceHTML ? `<div class="section"><h2 class="section-title">Experience</h2>${ctx.experienceHTML}</div>` : ''}
            ${ctx.educationHTML ? `<div class="section"><h2 class="section-title">Education</h2>${ctx.educationHTML}</div>` : ''}
          </main>
        </div>
      `,
    };
  }

  // clean-linear
  return {
    layoutCSS: `
      body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; margin: 0; padding: 32px 36px; color: #111827; background: #fff; line-height: 1.45; }
      .header { border-bottom: 2px solid #7c3aed; padding-bottom: 14px; margin-bottom: 22px; }
      .header h1 { margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.03em; }
      .header .role { margin: 4px 0 0; font-size: 13px; color: #6d28d9; font-weight: 600; }
      .header .contact { margin: 8px 0 0; font-size: 10px; color: #6b7280; }
      .section { margin-bottom: 22px; }
      .section-title { font-size: 8px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.2em; color: #9ca3af; margin: 0 0 10px; }
      .item { margin-bottom: 12px; }
      .item-header { display: flex; justify-content: space-between; font-size: 11px; font-weight: 700; }
      .item-header .date { font-size: 9px; color: #9ca3af; font-weight: 400; }
      .company { font-size: 10px; color: #7c3aed; font-weight: 600; margin-top: 2px; }
      .description { font-size: 10px; color: #4b5563; margin-top: 4px; }
      .summary-text { font-size: 11px; color: #374151; }
      .school-name { font-size: 10px; color: #6b7280; }
      .skills-line { font-size: 11px; color: #374151; }
    `,
    bodyHTML: `
      <div class="header">
        <h1>${ctx.fullName}</h1>
        <p class="role">${ctx.headline}</p>
        <p class="contact">${contactLine}</p>
      </div>
      ${ctx.summary ? `<div class="section"><h2 class="section-title">Summary</h2><p class="summary-text">${ctx.summary}</p></div>` : ''}
      ${ctx.experienceHTML ? `<div class="section"><h2 class="section-title">Experience</h2>${ctx.experienceHTML}</div>` : ''}
      ${ctx.educationHTML ? `<div class="section"><h2 class="section-title">Education</h2>${ctx.educationHTML}</div>` : ''}
      ${ctx.skills.length ? `<div class="section"><h2 class="section-title">Skills</h2><p class="skills-line">${ctx.skills.map((s) => s.name).join(' &nbsp;&middot;&nbsp; ')}</p></div>` : ''}
    `,
  };
}
