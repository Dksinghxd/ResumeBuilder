import dotenv from 'dotenv';
import mongoose from 'mongoose';
import config from '../config/environment.js';
import UserModel from '../models/User.js';
import ResumeModel from '../models/Resume.js';
import TemplateModel from '../models/Template.js';
import { hashPassword } from '../utils/bcrypt.js';

dotenv.config();

async function seedDatabase() {
  await mongoose.connect(config.database.uri);

  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@resumebuilder.com';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin@12345';
  const demoEmail = process.env.SEED_DEMO_EMAIL || 'demo@resumebuilder.com';
  const demoPassword = process.env.SEED_DEMO_PASSWORD || 'Demo@12345';

  const admin = await UserModel.findOneAndUpdate(
    { email: adminEmail },
    {
      firstName: 'Admin',
      lastName: 'User',
      email: adminEmail,
      password: await hashPassword(adminPassword),
      role: 'admin',
      status: 'active',
      emailVerified: true,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const demo = await UserModel.findOneAndUpdate(
    { email: demoEmail },
    {
      firstName: 'Demo',
      lastName: 'User',
      email: demoEmail,
      password: await hashPassword(demoPassword),
      role: 'user',
      status: 'active',
      emailVerified: true,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  await TemplateModel.findOneAndUpdate(
    { name: 'Professional Teal' },
    {
      name: 'Professional Teal',
      description: 'Clean ATS-friendly template with a teal accent.',
      type: 'professional',
      colors: ['#0f766e', '#0f172a', '#ffffff'],
      fonts: {
        heading: 'Inter',
        body: 'Inter',
      },
      features: ['ATS friendly', 'Clean layout', 'PDF ready'],
      isActive: true,
      isPremium: false,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  await ResumeModel.findOneAndUpdate(
    { userId: demo._id, title: 'Demo Software Engineer Resume' },
    {
      userId: demo._id,
      title: 'Demo Software Engineer Resume',
      templateId: 'professional-teal',
      status: 'draft',
      personalInfo: {
        firstName: 'Demo',
        lastName: 'User',
        name: 'Demo User',
        email: demoEmail,
        phone: '+1 555 0100',
        location: 'Remote',
        website: 'https://example.com',
        summary:
          'Full-stack developer focused on reliable APIs, clean interfaces, and measurable product outcomes.',
      },
      experience: [
        {
          jobTitle: 'Software Engineer',
          company: 'Resume Builder Labs',
          startDate: new Date('2023-01-01'),
          currentlyWorking: true,
          description:
            'Built resume workflows, PDF exports, and analytics dashboards for job seekers.',
        },
      ],
      education: [
        {
          schoolName: 'State University',
          degree: 'Bachelor of Science',
          fieldOfStudy: 'Computer Science',
          startDate: new Date('2018-08-01'),
          endDate: new Date('2022-05-01'),
          currentlyStudying: false,
        },
      ],
      skills: [
        { name: 'React', proficiency: 'expert', endorsements: 0 },
        { name: 'Node.js', proficiency: 'expert', endorsements: 0 },
        { name: 'MongoDB', proficiency: 'intermediate', endorsements: 0 },
      ],
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  console.log(`Seed complete. Admin: ${admin.email}, Demo: ${demo.email}`);
  await mongoose.disconnect();
}

seedDatabase().catch(async (error) => {
  console.error('Seed failed', error);
  await mongoose.disconnect();
  process.exit(1);
});
