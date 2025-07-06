import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { User } from '../src/models/User';
import { Campus } from '../src/models/Campus';
import { College } from '../src/models/College';
import { Department } from '../src/models/Department';
import { Question } from '../src/models/Question';
import { Tag } from '../src/models/Tag';
import { Post } from '../src/models/Post';
import { logger } from '../src/utils/logger';

dotenv.config();

interface SeedData {
  campuses: any[];
  colleges: any[];
  departments: any[];
  questions: any[];
  tags: any[];
  users: any[];
  posts: any[];
}

const seedData: SeedData = {
  campuses: [
    {
      name: 'Main Campus',
      campusId: 'MAIN001',
      location: 'City Center',
      description: 'The main campus of the university'
    },
    {
      name: 'North Campus',
      campusId: 'NORTH001',
      location: 'North District',
      description: 'Northern branch campus'
    },
    {
      name: 'South Campus',
      campusId: 'SOUTH001',
      location: 'South District',
      description: 'Southern branch campus'
    }
  ],

  colleges: [
    {
      name: 'College of Engineering',
      collegeId: 'ENG001',
      description: 'Engineering and Technology programs'
    },
    {
      name: 'College of Business',
      collegeId: 'BUS001',
      description: 'Business and Management programs'
    },
    {
      name: 'College of Arts and Sciences',
      collegeId: 'ART001',
      description: 'Liberal Arts and Sciences programs'
    },
    {
      name: 'College of Medicine',
      collegeId: 'MED001',
      description: 'Medical and Health Sciences programs'
    }
  ],

  departments: [
    // Engineering departments
    {
      name: 'Computer Science',
      departmentId: 'CS001',
      description: 'Computer Science and Software Engineering'
    },
    {
      name: 'Electrical Engineering',
      departmentId: 'EE001',
      description: 'Electrical and Electronics Engineering'
    },
    {
      name: 'Mechanical Engineering',
      departmentId: 'ME001',
      description: 'Mechanical and Manufacturing Engineering'
    },
    // Business departments
    {
      name: 'Business Administration',
      departmentId: 'BA001',
      description: 'General Business Administration'
    },
    {
      name: 'Marketing',
      departmentId: 'MKT001',
      description: 'Marketing and Sales'
    },
    {
      name: 'Finance',
      departmentId: 'FIN001',
      description: 'Finance and Accounting'
    },
    // Arts departments
    {
      name: 'English Literature',
      departmentId: 'ENG001',
      description: 'English Language and Literature'
    },
    {
      name: 'Psychology',
      departmentId: 'PSY001',
      description: 'Psychology and Behavioral Sciences'
    },
    // Medicine departments
    {
      name: 'General Medicine',
      departmentId: 'GMED001',
      description: 'General Medical Practice'
    },
    {
      name: 'Nursing',
      departmentId: 'NURS001',
      description: 'Nursing and Patient Care'
    }
  ],

  questions: [
    // Profile questions
    {
      question: 'What is your biggest achievement during university?',
      type: 'profile',
      category: 'achievements',
      isRequired: true,
      order: 1
    },
    {
      question: 'What advice would you give to incoming students?',
      type: 'profile',
      category: 'advice',
      isRequired: true,
      order: 2
    },
    {
      question: 'What was your favorite subject?',
      type: 'profile',
      category: 'academics',
      isRequired: false,
      order: 3
    },
    {
      question: 'Who was your most influential professor?',
      type: 'profile',
      category: 'academics',
      isRequired: false,
      order: 4
    },
    {
      question: 'What extracurricular activities were you involved in?',
      type: 'profile',
      category: 'activities',
      isRequired: false,
      order: 5
    },

    // Last word questions
    {
      question: 'What is your final message to your classmates?',
      type: 'lastword',
      category: 'farewell',
      isRequired: true,
      order: 1
    },
    {
      question: 'How do you want to be remembered?',
      type: 'lastword',
      category: 'legacy',
      isRequired: false,
      order: 2
    },
    {
      question: 'What are your plans after graduation?',
      type: 'lastword',
      category: 'future',
      isRequired: false,
      order: 3
    },

    // Post questions
    {
      question: 'What was the most challenging moment in your university journey?',
      type: 'post',
      category: 'challenges',
      isRequired: false,
      order: 1
    },
    {
      question: 'Share a funny memory from university',
      type: 'post',
      category: 'memories',
      isRequired: false,
      order: 2
    },
    {
      question: 'What skill did you develop that surprised you?',
      type: 'post',
      category: 'skills',
      isRequired: false,
      order: 3
    },
    {
      question: 'If you could relive one university moment, what would it be?',
      type: 'post',
      category: 'memories',
      isRequired: false,
      order: 4
    },
    {
      question: 'What would you change about your university experience?',
      type: 'post',
      category: 'reflection',
      isRequired: false,
      order: 5
    }
  ],

  tags: [
    // Personality tags
    { name: 'leader', description: 'Natural leader', category: 'personality' },
    { name: 'creative', description: 'Creative thinker', category: 'personality' },
    { name: 'analytical', description: 'Analytical mind', category: 'personality' },
    { name: 'outgoing', description: 'Social butterfly', category: 'personality' },
    { name: 'quiet', description: 'Quiet observer', category: 'personality' },
    { name: 'funny', description: 'Class clown', category: 'personality' },
    { name: 'serious', description: 'Always focused', category: 'personality' },
    { name: 'helpful', description: 'Always helping others', category: 'personality' },

    // Academic tags
    { name: 'bookworm', description: 'Always studying', category: 'academic' },
    { name: 'procrastinator', description: 'Last minute hero', category: 'academic' },
    { name: 'overachiever', description: 'Goes above and beyond', category: 'academic' },
    { name: 'researcher', description: 'Loves research', category: 'academic' },
    { name: 'presenter', description: 'Great at presentations', category: 'academic' },

    // Social tags
    { name: 'party-animal', description: 'Life of the party', category: 'social' },
    { name: 'networker', description: 'Knows everyone', category: 'social' },
    { name: 'mentor', description: 'Guides others', category: 'social' },
    { name: 'team-player', description: 'Great team member', category: 'social' },
    { name: 'organizer', description: 'Event organizer', category: 'social' },

    // Hobby tags
    { name: 'athlete', description: 'Sports enthusiast', category: 'hobbies' },
    { name: 'artist', description: 'Creative artist', category: 'hobbies' },
    { name: 'musician', description: 'Music lover', category: 'hobbies' },
    { name: 'gamer', description: 'Gaming enthusiast', category: 'hobbies' },
    { name: 'traveler', description: 'Loves to travel', category: 'hobbies' },
    { name: 'foodie', description: 'Food enthusiast', category: 'hobbies' },
    { name: 'photographer', description: 'Captures moments', category: 'hobbies' },

    // Behavior tags
    { name: 'early-bird', description: 'Always early', category: 'behavior' },
    { name: 'night-owl', description: 'Night person', category: 'behavior' },
    { name: 'coffee-addict', description: 'Runs on coffee', category: 'behavior' },
    { name: 'multitasker', description: 'Juggles everything', category: 'behavior' },
    { name: 'perfectionist', description: 'Attention to detail', category: 'behavior' }
  ],

  users: [],
  posts: []
};

class DatabaseSeeder {
  private campusIds: string[] = [];
  private collegeIds: string[] = [];
  private departmentIds: string[] = [];
  private questionIds: string[] = [];
  private userIds: string[] = [];

  async connect(): Promise<void> {
    try {
      await mongoose.connect(process.env.MONGODB_URI!);
      logger.info('Connected to MongoDB for seeding');
    } catch (error) {
      logger.error('Failed to connect to MongoDB:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    await mongoose.disconnect();
    logger.info('Disconnected from MongoDB');
  }

  async clearDatabase(): Promise<void> {
    logger.info('Clearing existing data...');
    
    await Promise.all([
      User.deleteMany({}),
      Campus.deleteMany({}),
      College.deleteMany({}),
      Department.deleteMany({}),
      Question.deleteMany({}),
      Tag.deleteMany({}),
      Post.deleteMany({})
    ]);

    logger.info('Database cleared');
  }

  async seedCampuses(): Promise<void> {
    logger.info('Seeding campuses...');
    
    const campuses = await Campus.insertMany(seedData.campuses);
    this.campusIds = campuses.map(campus => campus._id.toString());
    
    logger.info(`Seeded ${campuses.length} campuses`);
  }

  async seedColleges(): Promise<void> {
    logger.info('Seeding colleges...');
    
    const collegesWithCampus = seedData.colleges.map((college, index) => ({
      ...college,
      campus: this.campusIds[index % this.campusIds.length]
    }));

    const colleges = await College.insertMany(collegesWithCampus);
    this.collegeIds = colleges.map(college => college._id.toString());
    
    logger.info(`Seeded ${colleges.length} colleges`);
  }

  async seedDepartments(): Promise<void> {
    logger.info('Seeding departments...');
    
    const departmentsWithCollege = seedData.departments.map((department, index) => ({
      ...department,
      college: this.collegeIds[index % this.collegeIds.length]
    }));

    const departments = await Department.insertMany(departmentsWithCollege);
    this.departmentIds = departments.map(dept => dept._id.toString());
    
    logger.info(`Seeded ${departments.length} departments`);
  }

  async seedQuestions(): Promise<void> {
    logger.info('Seeding questions...');
    
    const questions = await Question.insertMany(seedData.questions);
    this.questionIds = questions.map(q => q._id.toString());
    
    logger.info(`Seeded ${questions.length} questions`);
  }

  async seedTags(): Promise<void> {
    logger.info('Seeding tags...');
    
    const tags = await Tag.insertMany(seedData.tags);
    
    logger.info(`Seeded ${tags.length} tags`);
  }

  async seedUsers(): Promise<void> {
    logger.info('Seeding users...');
    
    const hashedPassword = await bcrypt.hash('password123', 12);
    
    // Create admin user
    const adminUser = await User.create({
      firstName: 'Admin',
      lastName: 'User',
      surname: 'System',
      username: 'admin',
      email: 'admin@gradbook.com',
      password: hashedPassword,
      phoneNumber: '+1234567890',
      graduationYear: 2024,
      campus: this.campusIds[0],
      college: this.collegeIds[0],
      department: this.departmentIds[0],
      role: 'admin',
      isVerified: true,
      isActive: true,
      profileCompleted: true
    });

    // Create sample graduates
    const graduates = [];
    const firstNames = ['John', 'Jane', 'Mike', 'Sarah', 'David', 'Emily', 'Chris', 'Lisa', 'Tom', 'Anna'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
    const surnames = ['Jr', 'Sr', 'III', 'IV', '', '', '', '', '', ''];

    for (let i = 0; i < 50; i++) {
      const firstName = firstNames[i % firstNames.length];
      const lastName = lastNames[i % lastNames.length];
      const surname = surnames[i % surnames.length];
      
      graduates.push({
        firstName,
        lastName,
        surname,
        username: `${firstName.toLowerCase()}${lastName.toLowerCase()}${i}`,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@university.edu`,
        password: hashedPassword,
        phoneNumber: `+123456789${i.toString().padStart(2, '0')}`,
        graduationYear: 2024,
        campus: this.campusIds[i % this.campusIds.length],
        college: this.collegeIds[i % this.collegeIds.length],
        department: this.departmentIds[i % this.departmentIds.length],
        role: 'graduate',
        isVerified: true,
        isActive: true,
        profileCompleted: true,
        quote: `This is my graduation quote - ${firstName} ${lastName}`,
        socialLinks: {
          instagram: `@${firstName.toLowerCase()}${lastName.toLowerCase()}`,
          telegram: `@${firstName.toLowerCase()}${lastName.toLowerCase()}`
        }
      });
    }

    // Create sample guests
    const guests = [];
    for (let i = 0; i < 10; i++) {
      const firstName = firstNames[i % firstNames.length];
      const lastName = lastNames[i % lastNames.length];
      
      guests.push({
        firstName,
        lastName,
        surname: '',
        username: `guest${firstName.toLowerCase()}${i}`,
        email: `guest${i}@example.com`,
        password: hashedPassword,
        graduationYear: 2024,
        campus: this.campusIds[i % this.campusIds.length],
        college: this.collegeIds[i % this.collegeIds.length],
        department: this.departmentIds[i % this.departmentIds.length],
        role: 'guest',
        isVerified: true,
        isActive: true,
        profileCompleted: true
      });
    }

    const allUsers = [adminUser, ...await User.insertMany([...graduates, ...guests])];
    this.userIds = allUsers.map(user => user._id.toString());
    
    logger.info(`Seeded ${allUsers.length} users (1 admin, ${graduates.length} graduates, ${guests.length} guests)`);
  }

  async seedPosts(): Promise<void> {
    logger.info('Seeding posts...');
    
    const posts = [];
    const graduateUsers = this.userIds.slice(1, 51); // Skip admin user
    
    // Create last words for each graduate
    for (const userId of graduateUsers) {
      const lastWordQuestion = this.questionIds.find(qId => 
        seedData.questions.find(q => q._id?.toString() === qId && q.type === 'lastword')
      ) || this.questionIds[0];
      
      posts.push({
        user: userId,
        question: lastWordQuestion,
        answer: `This is my final message to all my classmates. Thank you for the amazing memories!`,
        type: 'lastword'
      });
    }

    // Create some regular posts
    for (let i = 0; i < 30; i++) {
      const userId = graduateUsers[i % graduateUsers.length];
      const questionId = this.questionIds[i % this.questionIds.length];
      
      posts.push({
        user: userId,
        question: questionId,
        answer: `This is my answer to this interesting question. University has been an amazing journey!`,
        type: 'question'
      });
    }

    const createdPosts = await Post.insertMany(posts);
    
    logger.info(`Seeded ${createdPosts.length} posts`);
  }

  async seed(): Promise<void> {
    try {
      await this.connect();
      await this.clearDatabase();
      
      await this.seedCampuses();
      await this.seedColleges();
      await this.seedDepartments();
      await this.seedQuestions();
      await this.seedTags();
      await this.seedUsers();
      await this.seedPosts();
      
      logger.info('✅ Database seeding completed successfully!');
      
      // Log sample credentials
      logger.info('\n📋 Sample Credentials:');
      logger.info('Admin: admin@gradbook.com / password123');
      logger.info('Graduate: john.smith0@university.edu / password123');
      logger.info('Guest: guest0@example.com / password123');
      
    } catch (error) {
      logger.error('❌ Database seeding failed:', error);
      throw error;
    } finally {
      await this.disconnect();
    }
  }
}

// Run seeding if called directly
if (require.main === module) {
  const seeder = new DatabaseSeeder();
  seeder.seed().catch((error) => {
    logger.error('Seeding failed:', error);
    process.exit(1);
  });
}

export { DatabaseSeeder };