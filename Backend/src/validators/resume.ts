import Joi from 'joi';

export const createResumeSchema = Joi.object({
  title: Joi.string().required().trim().min(2).max(100),
  templateId: Joi.string().optional().allow(''),
  personalInfo: Joi.object({
    firstName: Joi.string().trim().min(2).allow(''),
    lastName: Joi.string().trim().min(2).allow(''),
    name: Joi.string().trim().min(2).allow(''),
    email: Joi.string().required().email(),
    phone: Joi.string().trim().max(20).allow(''),
    location: Joi.string().trim().max(100).allow(''),
    website: Joi.string().uri().allow(null, ''),
    summary: Joi.string().trim().max(500).allow(''),
    profileImage: Joi.string().uri().allow(null, ''),
  }).required().unknown(true),
  experience: Joi.array().items(
    Joi.object({
      jobTitle: Joi.string().required().trim(),
      company: Joi.string().required().trim(),
      startDate: Joi.date().required(),
      endDate: Joi.date().allow(null, ''),
      currentlyWorking: Joi.boolean(),
      description: Joi.string().trim().max(1000).allow(''),
      location: Joi.string().trim().max(100).allow(''),
    }).unknown(true)
  ),
  education: Joi.array().items(
    Joi.object({
      schoolName: Joi.string().required().trim(),
      degree: Joi.string().required().trim(),
      fieldOfStudy: Joi.string().trim().allow(''),
      startDate: Joi.date().required(),
      endDate: Joi.date().allow(null, ''),
      currentlyStudying: Joi.boolean(),
      description: Joi.string().trim().max(500).allow(''),
    }).unknown(true)
  ),
  skills: Joi.array().items(
    Joi.object({
      name: Joi.string().required().trim(),
      proficiency: Joi.string()
        .required()
        .valid('beginner', 'intermediate', 'expert'),
      endorsements: Joi.number().default(0),
    }).unknown(true)
  ),
  certifications: Joi.array().items(
    Joi.object({
      name: Joi.string().required().trim(),
      issuingOrganization: Joi.string().required().trim(),
      issueDate: Joi.date().required(),
      expirationDate: Joi.date().allow(null, ''),
      credentialUrl: Joi.string().uri().allow(null, ''),
    }).unknown(true)
  ),
  projects: Joi.array().items(
    Joi.object({
      name: Joi.string().required().trim(),
      description: Joi.string().trim().max(500).allow(''),
      technologies: Joi.array().items(Joi.string()),
      startDate: Joi.date().allow(null, ''),
      endDate: Joi.date().allow(null, ''),
      link: Joi.string().uri().allow(null, ''),
    }).unknown(true)
  ),
  socialLinks: Joi.array().items(
    Joi.object({
      platform: Joi.string().required().trim(),
      url: Joi.string().required().uri(),
    }).unknown(true)
  ),
  summary: Joi.string().trim().max(1000).allow(''),
  status: Joi.string().valid('draft', 'published', 'archived').default('draft'),
});

export const updateResumeSchema = Joi.object({
  title: Joi.string().trim().min(2).max(100),
  templateId: Joi.string(),
  personalInfo: Joi.object().unknown(true),
  experience: Joi.array(),
  education: Joi.array(),
  skills: Joi.array(),
  certifications: Joi.array(),
  projects: Joi.array(),
  socialLinks: Joi.array(),
  status: Joi.string().valid('draft', 'published', 'archived'),
});

export const shareResumeSchema = Joi.object({
  expiresIn: Joi.string()
    .valid('never', '7days', '30days', '60days', '90days')
    .required(),
  allowDownload: Joi.boolean().default(true),
  allowComments: Joi.boolean().default(false),
});
