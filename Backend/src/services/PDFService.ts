import { Readable } from 'stream';
import axios from 'axios';
import PDFDocument from 'pdfkit';
import { IResume } from '../models/Resume.js';
import logger from '../utils/logger.js';
import { resolveResumeTemplateId } from '../constants/index.js';
import {
  buildModernPdfTemplate,
  isModernPdfTemplate,
} from './modernPdfTemplates.js';
import { renderHtmlToPdfBuffer } from './htmlToPdf.js';
import { resolveBrowserExecutable } from '../utils/browserPath.js';

export class PDFService {
  /**
   * Helper to format dates to professional "MMM YYYY" style.
   */
  private formatDate(dateInput?: Date | string): string {
    if (!dateInput) return '';
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }

  /**
   * Generates a print-ready HTML structure with CSS according to the selected template.
   */
  private generateHTML(resume: IResume): string {
    const { personalInfo, experience, education, skills, templateId } = resume;
    const summary = personalInfo.summary || '';
    const template = resolveResumeTemplateId(templateId);
    const fullName = `${personalInfo.firstName || ''} ${personalInfo.lastName || ''}`.trim() || personalInfo.name || 'John Doe';
    const email = personalInfo.email || '';
    const phone = personalInfo.phone || '';
    const location = personalInfo.location || '';
    const website = personalInfo.website || '';
    
    const contactParts = [email, phone, location, website].filter(Boolean);
    const firstJobTitle =
      experience && experience.length > 0 ? experience[0].jobTitle : 'Professional';

    // Experience items generator
    const experienceHTML = (experience && experience.length > 0)
      ? experience.map(exp => `
          <div class="item">
            <div class="item-header">
              <span class="title">${exp.jobTitle} &ndash; ${exp.company}</span>
              <span class="date">${this.formatDate(exp.startDate)} &ndash; ${exp.currentlyWorking ? 'Present' : this.formatDate(exp.endDate)}</span>
            </div>
            ${exp.location ? `<div class="location-italics">${exp.location}</div>` : ''}
            ${exp.description ? `<p class="description">${exp.description.replace(/\n/g, '<br/>')}</p>` : ''}
          </div>
        `).join('')
      : '';

    // Education items generator
    const educationHTML = (education && education.length > 0)
      ? education.map(edu => `
          <div class="item">
            <div class="item-header">
              <span class="title">${edu.degree} in ${edu.fieldOfStudy || 'General'}</span>
              <span class="date">${this.formatDate(edu.startDate)} &ndash; ${edu.currentlyStudying ? 'Present' : this.formatDate(edu.endDate)}</span>
            </div>
            <div class="school-name">${edu.schoolName}</div>
            ${edu.description ? `<p class="description">${edu.description.replace(/\n/g, '<br/>')}</p>` : ''}
          </div>
        `).join('')
      : '';

    // Skills generator
    let skillsHTML = '';
    if (skills && skills.length > 0) {
      if (template === 'minimalist') {
        skillsHTML = skills.map(skill => `${skill.name} (${skill.proficiency})`).join(' &bull; ');
      } else if (template === 'creative-split') {
        skillsHTML = skills.map(skill => `
          <div class="skill-item">
            <div class="skill-info">
              <span>${skill.name}</span>
              <span class="skill-prof">${skill.proficiency}</span>
            </div>
            <div class="skill-bar-bg">
              <div class="skill-bar-fill" style="width: ${skill.proficiency === 'expert' ? '100%' : skill.proficiency === 'intermediate' ? '70%' : '35%'}"></div>
            </div>
          </div>
        `).join('');
      } else {
        // modern-blue / bold-executive
        skillsHTML = skills.map(skill => `
          <span class="skill-badge">${skill.name} &bull; ${skill.proficiency}</span>
        `).join('');
      }
    }

    let layoutCSS = '';
    let bodyHTML = '';

    if (isModernPdfTemplate(template)) {
      const modernSkills =
        skills?.map((s) => ({ name: s.name, proficiency: s.proficiency })) ?? [];
      const modern = buildModernPdfTemplate(template, {
        fullName,
        headline: firstJobTitle,
        email,
        phone,
        location,
        website,
        summary,
        experienceHTML,
        educationHTML,
        skills: modernSkills,
      });
      layoutCSS = modern.layoutCSS;
      bodyHTML = modern.bodyHTML;
    } else if (template === 'minimalist') {
      layoutCSS = `
        body {
          font-family: 'Georgia', serif;
          color: #333333;
          line-height: 1.5;
          margin: 0;
          padding: 30px;
          background-color: #ffffff;
        }
        .header {
          text-align: center;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 20px;
          margin-bottom: 20px;
        }
        .name {
          font-size: 28px;
          font-weight: normal;
          text-transform: uppercase;
          letter-spacing: 2px;
          margin: 0 0 10px 0;
          color: #1a1a1a;
        }
        .contact {
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          font-size: 11px;
          color: #666666;
          margin: 0;
        }
        .contact span {
          margin: 0 8px;
        }
        .section {
          margin-bottom: 25px;
        }
        .section-title {
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          font-size: 12px;
          font-weight: bold;
          text-transform: uppercase;
          letter-spacing: 3px;
          text-align: center;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 4px;
          margin: 0 0 15px 0;
          color: #2d3748;
        }
        .summary-text {
          font-style: italic;
          text-align: center;
          max-width: 90%;
          margin: 0 auto;
          font-size: 12px;
          color: #4a5568;
        }
        .item {
          margin-bottom: 15px;
        }
        .item-header {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          font-weight: bold;
          color: #1a1a1a;
          font-size: 13px;
        }
        .item-header .date {
          font-weight: normal;
          font-size: 11px;
          color: #718096;
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
        }
        .school-name, .location-italics {
          font-style: italic;
          color: #4a5568;
          font-size: 12px;
          margin-top: 2px;
        }
        .description {
          font-size: 12px;
          color: #4a5568;
          margin: 6px 0 0 0;
          text-align: justify;
        }
        .skills-container {
          text-align: center;
          font-size: 12px;
          color: #4a5568;
          padding: 0 10px;
        }
      `;
      bodyHTML = `
        <div class="header">
          <h1 class="name">${fullName}</h1>
          <p class="contact">${contactParts.join(' <span>&bull;</span> ')}</p>
        </div>
        ${summary ? `
          <div class="section">
            <h2 class="section-title">Summary</h2>
            <p class="summary-text">${summary}</p>
          </div>
        ` : ''}
        ${experienceHTML ? `
          <div class="section">
            <h2 class="section-title">Experience</h2>
            ${experienceHTML}
          </div>
        ` : ''}
        ${educationHTML ? `
          <div class="section">
            <h2 class="section-title">Education</h2>
            ${educationHTML}
          </div>
        ` : ''}
        ${skillsHTML ? `
          <div class="section">
            <h2 class="section-title">Skills</h2>
            <div class="skills-container">${skillsHTML}</div>
          </div>
        ` : ''}
      `;
    } else if (template === 'creative-split') {
      layoutCSS = `
        body {
          font-family: 'Inter', sans-serif;
          color: #333333;
          margin: 0;
          padding: 0;
          background-color: #ffffff;
        }
        .container {
          display: flex;
          flex-direction: row;
          min-height: 100vh;
        }
        .sidebar {
          width: 35%;
          background-color: #1e1b4b;
          color: #ffffff;
          padding: 30px 20px;
          box-sizing: border-box;
        }
        .main-content {
          width: 65%;
          padding: 30px;
          box-sizing: border-box;
        }
        .sidebar-name {
          font-size: 22px;
          font-weight: 800;
          margin: 0 0 5px 0;
          line-height: 1.2;
        }
        .sidebar-subtitle {
          font-size: 10px;
          color: #c7d2fe;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin: 0 0 20px 0;
        }
        .sidebar-section {
          margin-bottom: 30px;
          border-top: 1px solid #312e81;
          padding-top: 15px;
        }
        .sidebar-section-title {
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #818cf8;
          margin: 0 0 12px 0;
        }
        .contact-item {
          font-size: 11px;
          margin-bottom: 12px;
          color: #e0e7ff;
          word-break: break-all;
        }
        .contact-item strong {
          color: #ffffff;
          display: block;
          margin-bottom: 2px;
        }
        .skill-item {
          margin-bottom: 12px;
        }
        .skill-info {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: #e0e7ff;
          margin-bottom: 4px;
        }
        .skill-prof {
          font-size: 9px;
          opacity: 0.8;
          text-transform: uppercase;
        }
        .skill-bar-bg {
          height: 4px;
          background-color: #312e81;
          border-radius: 2px;
          overflow: hidden;
        }
        .skill-bar-fill {
          height: 100%;
          background-color: #818cf8;
          border-radius: 2px;
        }
        .main-section {
          margin-bottom: 25px;
        }
        .main-section-title {
          font-size: 13px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #1e1b4b;
          border-bottom: 2px solid #e0e7ff;
          padding-bottom: 4px;
          margin: 0 0 15px 0;
        }
        .summary-text {
          font-size: 12px;
          line-height: 1.5;
          color: #4b5563;
          margin: 0;
        }
        .item {
          margin-bottom: 15px;
        }
        .item-header {
          display: flex;
          justify-content: space-between;
          font-weight: 700;
          font-size: 12px;
          color: #111827;
        }
        .item-header .date {
          font-weight: 400;
          font-size: 10px;
          color: #6b7280;
        }
        .location-italics, .school-name {
          font-size: 11px;
          color: #4f46e5;
          font-weight: 500;
          margin-top: 2px;
        }
        .description {
          font-size: 11px;
          line-height: 1.5;
          color: #4b5563;
          margin: 6px 0 0 0;
        }
      `;
      bodyHTML = `
        <div class="container">
          <div class="sidebar">
            <h1 class="sidebar-name">${fullName}</h1>
            <p class="sidebar-subtitle">Candidate Profile</p>
            
            <div class="sidebar-section">
              <h2 class="sidebar-section-title">Contact</h2>
              <div class="contact-item"><strong>Email</strong>${email}</div>
              ${phone ? `<div class="contact-item"><strong>Phone</strong>${phone}</div>` : ''}
              ${location ? `<div class="contact-item"><strong>Location</strong>${location}</div>` : ''}
              ${website ? `<div class="contact-item"><strong>Website</strong>${website}</div>` : ''}
            </div>
            
            ${skillsHTML ? `
              <div class="sidebar-section">
                <h2 class="sidebar-section-title">Skills</h2>
                ${skillsHTML}
              </div>
            ` : ''}
          </div>
          <div class="main-content">
            ${summary ? `
              <div class="main-section">
                <h2 class="main-section-title">About Me</h2>
                <p class="summary-text">${summary}</p>
              </div>
            ` : ''}
            ${experienceHTML ? `
              <div class="main-section">
                <h2 class="main-section-title">Experience</h2>
                ${experienceHTML}
              </div>
            ` : ''}
            ${educationHTML ? `
              <div class="main-section">
                <h2 class="main-section-title">Education</h2>
                ${educationHTML}
              </div>
            ` : ''}
          </div>
        </div>
      `;
    } else if (template === 'bold-executive') {
      layoutCSS = `
        body {
          font-family: 'Inter', sans-serif;
          color: #334155;
          line-height: 1.4;
          margin: 0;
          padding: 20px;
          background-color: #ffffff;
        }
        .header {
          background-color: #1e293b;
          color: #ffffff;
          padding: 25px;
          margin: -20px -20px 20px -20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .header-left h1 {
          font-size: 26px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin: 0;
        }
        .header-left p {
          font-size: 12px;
          color: #cbd5e1;
          margin: 4px 0 0 0;
          font-weight: 500;
        }
        .header-right {
          font-size: 11px;
          color: #cbd5e1;
          text-align: right;
          line-height: 1.5;
        }
        .section {
          margin-bottom: 20px;
        }
        .section-title {
          background-color: #f1f5f9;
          color: #1e293b;
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 1px;
          padding: 6px 12px;
          margin: 0 0 12px 0;
          border-left: 4px solid #1e293b;
        }
        .summary-text {
          font-size: 12px;
          color: #334155;
          margin: 0 0 0 4px;
        }
        .item {
          margin-bottom: 12px;
          padding-left: 4px;
        }
        .item-header {
          display: flex;
          justify-content: space-between;
          font-weight: 700;
          font-size: 12px;
          color: #0f172a;
        }
        .item-header .date {
          font-weight: 400;
          font-size: 10px;
          color: #64748b;
        }
        .location-italics {
          font-size: 10px;
          font-style: italic;
          color: #64748b;
          margin-top: 1px;
        }
        .school-name {
          font-size: 11px;
          color: #475569;
          margin-top: 2px;
        }
        .description {
          font-size: 11px;
          color: #334155;
          margin: 5px 0 0 0;
        }
        .skills-flex {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          padding-left: 4px;
        }
        .skill-badge {
          background-color: #f1f5f9;
          color: #334155;
          font-size: 10px;
          font-weight: 600;
          padding: 4px 8px;
          border-radius: 4px;
          text-transform: capitalize;
          border: 1px solid #e2e8f0;
        }
      `;
      const firstJobTitle = (experience && experience.length > 0) ? experience[0].jobTitle : 'Professional Profile';
      bodyHTML = `
        <div class="header">
          <div class="header-left">
            <h1>${fullName}</h1>
            <p>${firstJobTitle}</p>
          </div>
          <div class="header-right">
            <div>${email}</div>
            ${phone ? `<div>${phone}</div>` : ''}
            ${location ? `<div>${location}</div>` : ''}
            ${website ? `<div>${website}</div>` : ''}
          </div>
        </div>
        ${summary ? `
          <div class="section">
            <h2 class="section-title">Executive Summary</h2>
            <p class="summary-text">${summary}</p>
          </div>
        ` : ''}
        ${experienceHTML ? `
          <div class="section">
            <h2 class="section-title">Work Experience</h2>
            ${experienceHTML}
          </div>
        ` : ''}
        ${educationHTML ? `
          <div class="section">
            <h2 class="section-title">Education History</h2>
            ${educationHTML}
          </div>
        ` : ''}
        ${skillsHTML ? `
          <div class="section">
            <h2 class="section-title">Core Competencies</h2>
            <div class="skills-flex">${skillsHTML}</div>
          </div>
        ` : ''}
      `;
    } else {
      // Default / modern-blue
      layoutCSS = `
        body {
          font-family: 'Inter', sans-serif;
          color: #1f2937;
          line-height: 1.45;
          margin: 0;
          padding: 25px;
          background-color: #ffffff;
        }
        .header {
          border-bottom: 2px solid #2563eb;
          padding-bottom: 12px;
          margin-bottom: 20px;
        }
        .name {
          font-size: 26px;
          font-weight: 800;
          color: #111827;
          margin: 0;
        }
        .contact {
          font-size: 11px;
          color: #2563eb;
          margin: 5px 0 0 0;
          font-weight: 600;
        }
        .contact span {
          margin-right: 12px;
        }
        .section {
          margin-bottom: 22px;
        }
        .section-title {
          font-size: 12px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #1d4ed8;
          margin: 0 0 10px 0;
        }
        .summary-text {
          font-size: 11.5px;
          color: #374151;
          margin: 0;
        }
        .item {
          margin-bottom: 14px;
        }
        .item-header {
          display: flex;
          justify-content: space-between;
          font-weight: 700;
          font-size: 12px;
          color: #111827;
        }
        .item-header .date {
          font-weight: 400;
          font-size: 10px;
          color: #6b7280;
        }
        .location-italics {
          font-size: 10.5px;
          font-style: italic;
          color: #6b7280;
          margin-top: 1px;
        }
        .school-name {
          font-size: 11px;
          color: #374151;
          margin-top: 2px;
        }
        .description {
          font-size: 11px;
          color: #4b5563;
          margin: 5px 0 0 0;
          text-align: justify;
        }
        .skills-flex {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .skill-badge {
          background-color: #eff6ff;
          color: #1d4ed8;
          font-size: 10px;
          font-weight: 600;
          padding: 4px 8px;
          border-radius: 4px;
          text-transform: capitalize;
          border: 1px solid #dbeafe;
        }
      `;
      bodyHTML = `
        <div class="header">
          <h1 class="name">${fullName}</h1>
          <p class="contact">
            <span>${email}</span>
            ${phone ? `<span>&bull; ${phone}</span>` : ''}
            ${location ? `<span>&bull; ${location}</span>` : ''}
            ${website ? `<span>&bull; ${website}</span>` : ''}
          </p>
        </div>
        ${summary ? `
          <div class="section">
            <h2 class="section-title">Summary</h2>
            <p class="summary-text">${summary}</p>
          </div>
        ` : ''}
        ${experienceHTML ? `
          <div class="section">
            <h2 class="section-title">Experience</h2>
            ${experienceHTML}
          </div>
        ` : ''}
        ${educationHTML ? `
          <div class="section">
            <h2 class="section-title">Education</h2>
            ${educationHTML}
          </div>
        ` : ''}
        ${skillsHTML ? `
          <div class="section">
            <h2 class="section-title">Skills</h2>
            <div class="skills-flex">${skillsHTML}</div>
          </div>
        ` : ''}
      `;
    }

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${fullName} - Resume</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Georgia&display=swap" rel="stylesheet">
        <style>
          ${layoutCSS}
          * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          @media print {
            body {
              padding: 0;
              margin: 0;
            }
          }
        </style>
      </head>
      <body>
        ${bodyHTML}
      </body>
      </html>
    `;
  }

  /**
   * Invokes Urlbox API to generate PDF from HTML.
   * Returns a Buffer on success, or null on error/missing API key.
   */
  private async renderWithUrlbox(resume: IResume): Promise<Buffer | null> {
    const apiKey = process.env.URLBOX_API_KEY;
    if (!apiKey) {
      logger.info('URLBOX_API_KEY not configured. Falling back to local PDF renderer.');
      return null;
    }

    try {
      const htmlContent = this.generateHTML(resume);
      logger.info(`Sending resume HTML to Urlbox for rendering (Template: ${resume.templateId || 'modern-blue'})`);

      const response = await axios.post(
        'https://api.urlbox.com/v1/render/sync',
        {
          format: 'pdf',
          html: htmlContent,
          pdf_page_size: 'Letter',
          full_page: true,
          print_background: true
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          responseType: 'arraybuffer',
          timeout: 15000 // 15 seconds timeout
        }
      );

      logger.info('Urlbox PDF generated successfully.');
      return Buffer.from(response.data);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        logger.error('Urlbox API returned an error:', {
          status: error.response?.status,
          data: error.response?.data ? Buffer.from(error.response.data).toString('utf8') : undefined,
          message: error.message
        });
      } else {
        logger.error('Unexpected error rendering with Urlbox:', error);
      }
      return null;
    }
  }

  /**
   * Renders styled HTML (same as editor templates) to PDF via Chrome/Edge.
   */
  private async renderWithHtmlEngine(resume: IResume): Promise<Buffer | null> {
    try {
      const html = this.generateHTML(resume);
      logger.info(
        `Rendering template "${resolveResumeTemplateId(resume.templateId)}" with local HTML engine`
      );
      return await renderHtmlToPdfBuffer(html);
    } catch (error) {
      logger.error('Local HTML PDF rendering failed', error);
      return null;
    }
  }

  /**
   * Final fallback PDF generator. It is intentionally simple, but it keeps PDF
   * downloads working even when Urlbox and local Chrome/Edge rendering fail.
   */
  private generateWithPdfKit(resume: IResume): Promise<Buffer> {
    logger.info('Executing fallback PDFKit resume generation.');

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      this.writePdfKitResume(doc, resume);
      doc.end();
    });
  }

  private writePdfKitResume(doc: PDFKit.PDFDocument, resume: IResume): void {
    const { personalInfo, experience, education, skills } = resume;
    const fullName =
      `${personalInfo.firstName || ''} ${personalInfo.lastName || ''}`.trim() ||
      personalInfo.name ||
      'John Doe';

    doc.fontSize(24).font('Helvetica-Bold');
    doc.text(fullName, { align: 'center' });

    const contactInfo = [
      personalInfo.email,
      personalInfo.phone,
      personalInfo.location,
      personalInfo.website,
    ]
      .filter(Boolean)
      .join(' | ');

    if (contactInfo) {
      doc.moveDown(0.2);
      doc.fontSize(10).font('Helvetica');
      doc.text(contactInfo, { align: 'center' });
    }

    if (personalInfo.summary) {
      this.writePdfKitSectionTitle(doc, 'PROFESSIONAL SUMMARY');
      doc.fontSize(10).font('Helvetica');
      doc.text(personalInfo.summary);
    }

    if (experience && experience.length > 0) {
      this.writePdfKitSectionTitle(doc, 'PROFESSIONAL EXPERIENCE');

      experience.forEach((exp) => {
        doc.fontSize(10).font('Helvetica-Bold');
        doc.text(`${exp.jobTitle} at ${exp.company}`);
        doc.font('Helvetica');
        const dates = exp.currentlyWorking
          ? `${this.formatDate(exp.startDate)} - Present`
          : `${this.formatDate(exp.startDate)} - ${this.formatDate(exp.endDate)}`;
        if (dates.trim() !== '-') doc.text(dates);
        if (exp.location) doc.text(exp.location);
        if (exp.description) doc.text(exp.description);
        doc.moveDown(0.3);
      });
    }

    if (education && education.length > 0) {
      this.writePdfKitSectionTitle(doc, 'EDUCATION');

      education.forEach((edu) => {
        doc.fontSize(10).font('Helvetica-Bold');
        doc.text(`${edu.degree} in ${edu.fieldOfStudy || 'Not Specified'}`);
        doc.font('Helvetica');
        doc.text(edu.schoolName);
        const dates = edu.currentlyStudying
          ? `${this.formatDate(edu.startDate)} - Present`
          : `${this.formatDate(edu.startDate)} - ${this.formatDate(edu.endDate)}`;
        if (dates.trim() !== '-') doc.text(dates);
        if (edu.description) doc.text(edu.description);
        doc.moveDown(0.3);
      });
    }

    if (skills && skills.length > 0) {
      this.writePdfKitSectionTitle(doc, 'SKILLS');
      doc.fontSize(10).font('Helvetica');

      skills.forEach((skill) => {
        doc.text(`- ${skill.name} (${skill.proficiency})`);
      });
    }
  }

  private writePdfKitSectionTitle(doc: PDFKit.PDFDocument, title: string): void {
    doc.moveDown(0.7);
    doc.fontSize(11).font('Helvetica-Bold');
    doc.text(title);
    doc.moveDown(0.2);
  }

  /**
   * Generates resume PDF buffer (resolves to Buffer).
   */
  async generateResumePDF(resume: IResume): Promise<Buffer> {
    const urlboxBuffer = await this.renderWithUrlbox(resume);
    if (urlboxBuffer) {
      return urlboxBuffer;
    }

    const htmlBuffer = await this.renderWithHtmlEngine(resume);
    if (htmlBuffer) {
      return htmlBuffer;
    }

    if (!resolveBrowserExecutable()) {
      logger.warn(
        'Chrome/Edge not found for styled PDF export. Falling back to PDFKit generator.'
      );
    }

    return this.generateWithPdfKit(resume);
  }

  /**
   * Generates a readable PDF stream.
   */
  async generatePDFStream(resume: IResume): Promise<Readable> {
    const buffer = await this.generateResumePDF(resume);
    return Readable.from(buffer);
  }
}

export default new PDFService();
