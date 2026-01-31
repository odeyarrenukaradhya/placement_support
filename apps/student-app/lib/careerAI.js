export const availableRoles = [
  {
    id: 'frontend-dev',
    title: 'Frontend Developer',
    category: 'Development',
    description: 'Build beautiful, responsive, and performant user interfaces using modern web technologies.',
    averageSalary: '$80k - $140k',
    requiredSkills: ['React', 'Next.js', 'Tailwind CSS', 'TypeScript', 'State Management']
  },
  {
    id: 'backend-dev',
    title: 'Backend Developer',
    category: 'Development',
    description: 'Design and implement scalable server-side logic, databases, and APIs.',
    averageSalary: '$85k - $150k',
    requiredSkills: ['Node.js', 'PostgreSQL', 'Docker', 'GraphQL', 'AWS']
  },
  {
    id: 'fullstack-dev',
    title: 'Full Stack Developer',
    category: 'Development',
    description: 'Master both frontend and backend technologies to build complete web applications.',
    averageSalary: '$90k - $160k',
    requiredSkills: ['React', 'Node.js', 'Database Design', 'DevOps', 'System Architecture']
  },
  {
    id: 'ui-ux-designer',
    title: 'UI/UX Designer',
    category: 'Design',
    description: 'Create intuitive and visually stunning user experiences through research and design.',
    averageSalary: '$75k - $130k',
    requiredSkills: ['Figma', 'User Research', 'Prototyping', 'Design Systems', 'Visual Design']
  },
  {
    id: 'data-scientist',
    title: 'Data Scientist',
    category: 'Data Science',
    description: 'Extract insights from complex data to drive business decisions using AI and ML.',
    averageSalary: '$100k - $180k',
    requiredSkills: ['Python', 'SQL', 'Machine Learning', 'Statistics', 'Data Visualization']
  }
];

export const generateCareerRoadmap = async (roleId, durationWeeks) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  const role = availableRoles.find(r => r.id === roleId);
  if (!role) throw new Error('Role not found');

  const milestonesPerWeek = Math.max(1, Math.ceil(durationWeeks / 4));
  const totalMilestones = 4; // We'll always show 4 key milestones for this demo

  const roadmap = {
    role: role.title,
    duration: durationWeeks,
    milestones: [
      {
        id: '1',
        week: 1,
        title: 'Foundations & Setup',
        description: `Kickstart your journey as a ${role.title}. Master the basics and set up your development environment.`,
        skills: [role.requiredSkills[0], 'Git', 'Terminal'],
        resources: ['Official Documentation', 'MDN Web Docs'],
        completed: true
      },
      {
        id: '2',
        week: Math.floor(durationWeeks / 3),
        title: 'Core Concepts & Integration',
        description: `Dive deep into the fundamental concepts of ${role.title} and start building small features.`,
        skills: [role.requiredSkills[1], role.requiredSkills[2]],
        resources: ['Interactive Tutorials', 'Project-based Learning'],
        completed: false
      },
      {
        id: '3',
        week: Math.floor((durationWeeks * 2) / 3),
        title: 'Advanced Implementation',
        description: 'Explore advanced topics, optimization techniques, and best practices for commercial software.',
        skills: [role.requiredSkills[3] || 'Advanced Patterns', 'Performance'],
        resources: ['Advanced Courses', 'Case Studies'],
        completed: false
      },
      {
        id: '4',
        week: durationWeeks,
        title: 'Project Completion & Portfolio',
        description: 'Finalize a comprehensive project and prepare your portfolio for job applications.',
        skills: ['Portfolio Building', 'Interview Prep'],
        resources: ['Job Boards', 'Community Forums'],
        completed: false
      }
    ]
  };

  return roadmap;
};
