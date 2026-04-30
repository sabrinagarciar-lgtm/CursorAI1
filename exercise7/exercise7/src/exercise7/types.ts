export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export type ColumnId = 'todo' | 'in-progress' | 'done';

export interface Assignee {
  id: string;
  name: string;
  initials: string;
  color: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  assignee?: Assignee;
  dueDate?: string;
  priority: Priority;
  columnId: ColumnId;
  tags?: string[];
  createdAt: string;
}

export interface Column {
  id: ColumnId;
  title: string;
  accentColor: string;
  tasks: Task[];
}

export interface BoardState {
  columns: Column[];
}

export interface NewTaskFormData {
  title: string;
  description: string;
  assigneeId: string;
  dueDate: string;
  priority: Priority;
  tags: string;
  columnId: ColumnId;
}

export const ASSIGNEES: Assignee[] = [
  { id: 'u1', name: 'Alice Johnson', initials: 'AJ', color: '#6366f1' },
  { id: 'u2', name: 'Bob Smith', initials: 'BS', color: '#8b5cf6' },
  { id: 'u3', name: 'Carol White', initials: 'CW', color: '#ec4899' },
  { id: 'u4', name: 'David Lee', initials: 'DL', color: '#14b8a6' },
  { id: 'u5', name: 'Eva Martinez', initials: 'EM', color: '#f59e0b' },
];

export const PRIORITY_CONFIG: Record<
  Priority,
  { label: string; bgLight: string; bgDark: string; textLight: string; textDark: string; dot: string }
> = {
  low: {
    label: 'Low',
    bgLight: 'bg-slate-100',
    bgDark: 'dark:bg-slate-700',
    textLight: 'text-slate-600',
    textDark: 'dark:text-slate-300',
    dot: 'bg-slate-400',
  },
  medium: {
    label: 'Medium',
    bgLight: 'bg-blue-100',
    bgDark: 'dark:bg-blue-900/40',
    textLight: 'text-blue-700',
    textDark: 'dark:text-blue-300',
    dot: 'bg-blue-500',
  },
  high: {
    label: 'High',
    bgLight: 'bg-orange-100',
    bgDark: 'dark:bg-orange-900/40',
    textLight: 'text-orange-700',
    textDark: 'dark:text-orange-300',
    dot: 'bg-orange-500',
  },
  urgent: {
    label: 'Urgent',
    bgLight: 'bg-red-100',
    bgDark: 'dark:bg-red-900/40',
    textLight: 'text-red-700',
    textDark: 'dark:text-red-300',
    dot: 'bg-red-500',
  },
};

export const INITIAL_COLUMNS: Column[] = [
  {
    id: 'todo',
    title: 'Todo',
    accentColor: 'bg-slate-400',
    tasks: [
      {
        id: 'task-1',
        title: 'Design new landing page',
        description: 'Create wireframes and mockups for the new product landing page with updated branding.',
        assignee: ASSIGNEES[0],
        dueDate: '2026-05-10',
        priority: 'high',
        columnId: 'todo',
        tags: ['design', 'ui'],
        createdAt: '2026-04-25',
      },
      {
        id: 'task-2',
        title: 'Write API documentation',
        description: 'Document all REST endpoints with request/response examples and error codes.',
        assignee: ASSIGNEES[1],
        dueDate: '2026-05-15',
        priority: 'medium',
        columnId: 'todo',
        tags: ['docs', 'api'],
        createdAt: '2026-04-26',
      },
      {
        id: 'task-3',
        title: 'Set up CI/CD pipeline',
        description: 'Configure GitHub Actions for automated testing and deployment to staging.',
        assignee: ASSIGNEES[3],
        dueDate: '2026-04-28',
        priority: 'urgent',
        columnId: 'todo',
        tags: ['devops', 'automation'],
        createdAt: '2026-04-20',
      },
      {
        id: 'task-4',
        title: 'Update user onboarding flow',
        description: 'Revise the onboarding steps to improve activation rates.',
        assignee: ASSIGNEES[2],
        dueDate: '2026-05-20',
        priority: 'low',
        columnId: 'todo',
        tags: ['ux'],
        createdAt: '2026-04-27',
      },
    ],
  },
  {
    id: 'in-progress',
    title: 'In Progress',
    accentColor: 'bg-indigo-500',
    tasks: [
      {
        id: 'task-5',
        title: 'Implement dark mode',
        description: 'Add system-level dark mode support across all components using Tailwind CSS.',
        assignee: ASSIGNEES[0],
        dueDate: '2026-05-02',
        priority: 'medium',
        columnId: 'in-progress',
        tags: ['frontend', 'ui'],
        createdAt: '2026-04-22',
      },
      {
        id: 'task-6',
        title: 'Migrate database to PostgreSQL',
        description: 'Move from SQLite to PostgreSQL with zero downtime migration strategy.',
        assignee: ASSIGNEES[3],
        dueDate: '2026-05-05',
        priority: 'high',
        columnId: 'in-progress',
        tags: ['backend', 'database'],
        createdAt: '2026-04-18',
      },
      {
        id: 'task-7',
        title: 'Build analytics dashboard',
        description: 'Create real-time metrics dashboard with charts and KPI widgets.',
        assignee: ASSIGNEES[4],
        dueDate: '2026-05-12',
        priority: 'medium',
        columnId: 'in-progress',
        tags: ['analytics', 'frontend'],
        createdAt: '2026-04-21',
      },
    ],
  },
  {
    id: 'done',
    title: 'Done',
    accentColor: 'bg-emerald-500',
    tasks: [
      {
        id: 'task-8',
        title: 'Set up project repository',
        description: 'Initialize Git repository, add .gitignore, README, and branch protection rules.',
        assignee: ASSIGNEES[1],
        dueDate: '2026-04-15',
        priority: 'medium',
        columnId: 'done',
        tags: ['setup'],
        createdAt: '2026-04-10',
      },
      {
        id: 'task-9',
        title: 'Define product requirements',
        description: 'Collect stakeholder input and write the product requirements document.',
        assignee: ASSIGNEES[2],
        dueDate: '2026-04-20',
        priority: 'high',
        columnId: 'done',
        tags: ['planning', 'docs'],
        createdAt: '2026-04-08',
      },
      {
        id: 'task-10',
        title: 'Security audit',
        description: 'Review authentication flows, input validation, and dependency vulnerabilities.',
        assignee: ASSIGNEES[0],
        dueDate: '2026-04-25',
        priority: 'urgent',
        columnId: 'done',
        tags: ['security'],
        createdAt: '2026-04-12',
      },
    ],
  },
];
