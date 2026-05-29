import { Request, Response } from 'express';
import axios from 'axios';
import { sendSuccess, sendError } from '../utils/response.js';
import { HTTP_STATUS, ERROR_MESSAGES } from '../constants/index.js';
import logger from '../utils/logger.js';

export class AIController {
  async getResumesSuggestions(req: Request, res: Response): Promise<void> {
    try {
      const { resumeContent } = req.body;
      if (!resumeContent) {
        sendError(res, HTTP_STATUS.BAD_REQUEST, 'Resume content is required');
        return;
      }

      let parsedContent: any = {};
      try {
        parsedContent = typeof resumeContent === 'string' ? JSON.parse(resumeContent) : resumeContent;
      } catch (e) {
        parsedContent = resumeContent;
      }

      const suggestions = await this.generateSuggestions(parsedContent);

      sendSuccess(res, HTTP_STATUS.OK, 'Suggestions generated', {
        suggestions,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR;
      sendError(res, HTTP_STATUS.BAD_REQUEST, message);
    }
  }

  async scoreResume(req: Request, res: Response): Promise<void> {
    try {
      const { resumeContent } = req.body;
      let parsedContent: any = {};
      try {
        parsedContent = typeof resumeContent === 'string' ? JSON.parse(resumeContent) : resumeContent;
      } catch (e) {
        parsedContent = resumeContent;
      }

      const score = await this.calculateScore(parsedContent);

      sendSuccess(res, HTTP_STATUS.OK, 'Resume scored', { score });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR;
      sendError(res, HTTP_STATUS.BAD_REQUEST, message);
    }
  }

  async generateContent(req: Request, res: Response): Promise<void> {
    try {
      const { prompt, context } = req.body;
      if (!prompt) {
        sendError(res, HTTP_STATUS.BAD_REQUEST, 'Prompt is required');
        return;
      }

      const generatedContent = await this.generate(prompt, context);

      sendSuccess(res, HTTP_STATUS.OK, 'Content generated', {
        content: generatedContent,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR;
      sendError(res, HTTP_STATUS.BAD_REQUEST, message);
    }
  }

  private async generateSuggestions(content: any): Promise<unknown> {
    const apiKey = process.env.OPENAI_API_KEY;
    const hasValidKey = apiKey && apiKey !== 'your-openai-api-key' && apiKey.startsWith('sk-');

    if (hasValidKey) {
      try {
        logger.info('Calling OpenAI API for resume suggestions...');
        const response = await axios.post(
          'https://api.openai.com/v1/chat/completions',
          {
            model: 'gpt-3.5-turbo',
            messages: [
              {
                role: 'system',
                content: 'You are a professional resume writer and career coach. Analyze the resume JSON and provide suggestions. You MUST return JSON with a single key "improvements" containing an array of objects. Each object must have "type" (string, e.g. "contact", "summary", "experience", "education", "skills"), "suggestion" (string, clear actionable advice), and "impact" ("high" | "medium" | "low").'
              },
              {
                role: 'user',
                content: `Resume Content: ${JSON.stringify(content)}`
              }
            ],
            response_format: { type: 'json_object' }
          },
          {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json'
            },
            timeout: 10000
          }
        );

        const responseText = response.data.choices[0].message.content;
        const parsed = JSON.parse(responseText);
        if (parsed && Array.isArray(parsed.improvements)) {
          return parsed;
        }
      } catch (error) {
        logger.warn('OpenAI suggestions failed or timed out. Falling back to local NLP analysis.', error);
      }
    }

    // Local fallback generator (Rule-based NLP analysis)
    return this.generateLocalSuggestions(content);
  }

  private generateLocalSuggestions(content: any): any {
    const improvements: Array<{ type: string; suggestion: string; impact: string }> = [];

    const personalInfo = content.personalInfo || {};
    const summary = content.summary || personalInfo.summary || '';
    const experience = content.experience || [];
    const education = content.education || [];
    const skills = content.skills || [];

    // 1. Personal Info & Contact
    if (!personalInfo.phone) {
      improvements.push({
        type: 'contact',
        suggestion: 'Add a contact phone number so hiring managers can easily reach you.',
        impact: 'high'
      });
    }
    if (!personalInfo.location) {
      improvements.push({
        type: 'contact',
        suggestion: 'Include your location (e.g. "San Francisco, CA") to clarify your availability and location targeting.',
        impact: 'medium'
      });
    }

    // 2. Summary
    if (!summary) {
      improvements.push({
        type: 'summary',
        suggestion: 'Write a compelling professional summary (3-4 sentences) highlighting your top skills, experience, and career goals.',
        impact: 'high'
      });
    } else if (summary.length < 60) {
      improvements.push({
        type: 'summary',
        suggestion: 'Expand your professional summary. Add years of experience, core industry expertise, and key value propositions.',
        impact: 'medium'
      });
    }

    // 3. Experience
    if (experience.length === 0) {
      improvements.push({
        type: 'experience',
        suggestion: 'Add work experiences or relevant projects. A resume without professional experience is hard to evaluate.',
        impact: 'high'
      });
    } else {
      experience.forEach((exp: any) => {
        const company = exp.company || 'your employer';
        const title = exp.jobTitle || 'role';
        
        if (!exp.description) {
          improvements.push({
            type: 'experience',
            suggestion: `Add a description for your role as ${title} at ${company}. Describe your achievements and responsibilities.`,
            impact: 'high'
          });
        } else {
          if (exp.description.length < 80) {
            improvements.push({
              type: 'experience',
              suggestion: `Elaborate on your experience at ${company}. Detail specific technical challenges you solved or projects you led.`,
              impact: 'medium'
            });
          }
          
          // Action verbs check
          const actionVerbs = [
            'led', 'developed', 'managed', 'designed', 'built', 'created', 'implemented', 
            'increased', 'decreased', 'optimized', 'spearheaded', 'achieved', 'improved', 
            'conducted', 'delivered', 'supervised', 'architected', 'facilitated', 'executed'
          ];
          const words = exp.description.toLowerCase().split(/\s+/);
          const hasActionVerb = words.some((word: string) => actionVerbs.includes(word));
          if (!hasActionVerb) {
            improvements.push({
              type: 'experience',
              suggestion: `Start sentences with strong action verbs (e.g., "Developed", "Led", "Optimized") for your role at ${company} to emphasize your contributions.`,
              impact: 'medium'
            });
          }
        }
      });
    }

    // 4. Education
    if (education.length === 0) {
      improvements.push({
        type: 'education',
        suggestion: 'Add your educational history, specifying your degree, school name, and major/field of study.',
        impact: 'high'
      });
    }

    // 5. Skills
    if (skills.length === 0) {
      improvements.push({
        type: 'skills',
        suggestion: 'List key skills (e.g., languages, frameworks, methodologies) to help your resume pass applicant tracking systems (ATS).',
        impact: 'high'
      });
    } else if (skills.length < 4) {
      improvements.push({
        type: 'skills',
        suggestion: 'Add more relevant skills to demonstrate a broader capability set.',
        impact: 'medium'
      });
    }

    // Add general fallback if resume is already perfect!
    if (improvements.length === 0) {
      improvements.push({
        type: 'general',
        suggestion: 'Your resume is very comprehensive! Tailor keywords to specific job postings before submitting.',
        impact: 'low'
      });
    }

    return { improvements };
  }

  private async calculateScore(content: any): Promise<number> {
    const apiKey = process.env.OPENAI_API_KEY;
    const hasValidKey = apiKey && apiKey !== 'your-openai-api-key' && apiKey.startsWith('sk-');

    if (hasValidKey) {
      try {
        const response = await axios.post(
          'https://api.openai.com/v1/chat/completions',
          {
            model: 'gpt-3.5-turbo',
            messages: [
              {
                role: 'system',
                content: 'Analyze the resume JSON content and calculate a strength score from 0 to 100. Return JSON with a single key "score" which is a number.'
              },
              {
                role: 'user',
                content: `Resume Content: ${JSON.stringify(content)}`
              }
            ],
            response_format: { type: 'json_object' }
          },
          {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json'
            },
            timeout: 8000
          }
        );

        const responseText = response.data.choices[0].message.content;
        const parsed = JSON.parse(responseText);
        if (parsed && typeof parsed.score === 'number') {
          return parsed.score;
        }
      } catch (error) {
        logger.warn('OpenAI scoring failed. Falling back to local scoring algorithm.', error);
      }
    }

    // Local fallback scoring (comprehensive scoring algorithm)
    let score = 0;
    const personalInfo = content.personalInfo || {};
    const summary = content.summary || personalInfo.summary || '';
    const experience = content.experience || [];
    const education = content.education || [];
    const skills = content.skills || [];

    // Personal Info (max 20 points)
    if (personalInfo.name) score += 5;
    if (personalInfo.email) score += 5;
    if (personalInfo.phone) score += 5;
    if (personalInfo.location) score += 5;

    // Summary (max 20 points)
    if (summary) {
      if (summary.length >= 100) score += 20;
      else if (summary.length >= 50) score += 15;
      else score += 10;
    }

    // Experience (max 30 points)
    if (experience.length > 0) {
      score += Math.min(experience.length * 10, 20); // 10 points per job up to 20
      const descriptionsFilled = experience.every((exp: any) => exp.description && exp.description.length > 20);
      if (descriptionsFilled) score += 10;
    }

    // Education (max 15 points)
    if (education.length > 0) {
      score += 10;
      if (education[0].fieldOfStudy) score += 5;
    }

    // Skills (max 15 points)
    if (skills.length > 0) {
      score += Math.min(skills.length * 3, 15); // 3 points per skill up to 15
    }

    return Math.min(score, 100);
  }

  private async generate(prompt: string, context: unknown): Promise<string> {
    const apiKey = process.env.OPENAI_API_KEY;
    const hasValidKey = apiKey && apiKey !== 'your-openai-api-key' && apiKey.startsWith('sk-');

    if (hasValidKey) {
      try {
        const response = await axios.post(
          'https://api.openai.com/v1/chat/completions',
          {
            model: 'gpt-3.5-turbo',
            messages: [
              {
                role: 'system',
                content: 'You are a career development assistant. Complete the requested prompt using the provided context.'
              },
              {
                role: 'user',
                content: `Prompt: ${prompt}\nContext: ${JSON.stringify(context)}`
              }
            ]
          },
          {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json'
            },
            timeout: 10000
          }
        );

        return response.data.choices[0].message.content.trim();
      } catch (error) {
        logger.warn('OpenAI completion generation failed. Falling back to local completions.', error);
      }
    }

    return `[Suggestions Fallback] Generated content based on: ${prompt}`;
  }
}

export default new AIController();
