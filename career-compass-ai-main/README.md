# Career Compass AI

An intelligent career navigation platform powered by AI. Career Compass helps job seekers manage their application pipeline, schedule interviews, track opportunities, and get AI-driven insights to accelerate their career growth.

## 🌟 Features

- **Dashboard**: Get an overview of your job applications, upcoming interviews, and career insights
- **Job Opportunities**: Discover and track job opportunities with detailed analytics
- **Application Pipeline**: Manage your job applications from initial contact to offer stage
- **Interview Scheduler**: Keep track of scheduled interviews and prepare with AI assistance
- **Career Roadmap**: Visualize your career growth path and skill development
- **AI Interview Assistant**: Get AI-powered interview coaching and preparation
- **Analytics**: Track application success rates, interview statistics, and career progress
- **Resume Management**: Upload and manage your resume for job applications
- **Notification System**: Stay updated with deadline reminders and application status changes
- **Dark/Light Theme**: Customizable UI theme for comfortable viewing

## 🛠 Technology Stack

This project is built with modern, industry-standard technologies:

- **Frontend Framework**: React with TypeScript
- **Build Tool**: Vite
- **UI Components**: shadcn-ui (Radix UI + Tailwind CSS)
- **Styling**: Tailwind CSS
- **State Management**: TanStack React Query
- **Backend**: Supabase (PostgreSQL + Auth)
- **Form Handling**: React Hook Form
- **Date Handling**: date-fns
- **Analytics**: Chart.js

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or bun package manager
- Git

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone <YOUR_GIT_URL>
cd career-compass-ai-main
```

### 2. Install Dependencies

```bash
npm install
# or if using bun
bun install
```

### 3. Set Up Environment Variables

Create a `.env` file in the project root with your Supabase credentials:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Start the Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## 📦 Available Scripts

- `npm run dev` - Start the development server with hot module replacement
- `npm run build` - Build the project for production
- `npm run build:dev` - Build in development mode
- `npm run lint` - Run ESLint to check code quality
- `npm run preview` - Preview the production build locally

## 📁 Project Structure

```
src/
├── components/          # Reusable React components
│   ├── ui/             # shadcn-ui components
│   ├── analytics/      # Analytics dashboard components
│   ├── dashboard/      # Dashboard-specific components
│   └── opportunities/  # Job opportunity components
├── pages/              # Full page components (routes)
├── hooks/              # Custom React hooks
├── lib/                # Utility functions and helpers
├── integrations/       # External service integrations (Supabase)
└── styles/             # Global CSS files

supabase/
├── functions/          # Supabase Edge Functions
│   ├── ai-interview/   # AI-powered interview prep
│   ├── fetch-jobs/     # Job scraping/fetching
│   ├── parse-resume/   # Resume parsing
│   └── send-notification/ # Email notifications
└── migrations/         # Database schema migrations
```

## 🔑 Key Features Breakdown

### Dashboard
- View application statistics and upcoming events
- Agent status monitoring
- Career progress visualization

### Job Opportunities
- Browse and filter job listings
- Save favorite positions
- Track application status
- View detailed job information

### Interview Management
- Schedule interviews with reminders
- AI-powered interview preparation
- Interview notes and feedback
- Performance analytics

### Career Roadmap
- Set career goals
- Track skill development
- Visualize career progression timeline

### Settings
- User profile management
- Notification preferences
- API key configuration
- Theme customization

## 🔐 Authentication

The application uses Supabase Authentication for secure user management. Users can sign up with email/password and access their personalized dashboard.

## 🗄️ Database

The application uses PostgreSQL via Supabase with the following main entities:
- Users
- Job Applications
- Interviews
- Opportunities
- Career Roadmaps
- Analytics Data

## 📊 Analytics

Track your job search metrics:
- Applications sent per week/month
- Interview success rate
- Offer conversion rate
- Time-to-interview statistics
- Salary insights

## 🤖 AI Features

### Interview Assistant
- Get AI-powered interview preparation tips
- Practice common interview questions
- Receive real-time feedback

### Resume Analysis
- AI-powered resume parsing
- Skill extraction
- Match scoring with job descriptions

## 🌐 Deployment

The application can be deployed to various platforms:

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Configure environment variables
4. Deploy with one click

### Other Platforms
- Netlify
- Railway
- Render
- AWS S3 + CloudFront

## 📝 Configuration

### Tailwind CSS
Customize the design system in `tailwind.config.ts`

### shadcn-ui Components
Component configuration is in `components.json`

### TypeScript
Strict type checking in `tsconfig.json`

## 🐛 Development Tips

- Use `npm run lint` to check code quality before committing
- Follow the component structure in `/src/components` for new components
- Keep API calls in `lib/` or create custom hooks in `hooks/`
- Use shadcn-ui components for consistent UI

## 📚 Documentation

For more information on the technologies used:
- [Vite Documentation](https://vitejs.dev)
- [React Documentation](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [shadcn-ui](https://ui.shadcn.com)
- [Supabase](https://supabase.com/docs)

## 🤝 Contributing

1. Create a new branch for your feature
2. Make your changes
3. Run `npm run lint` to ensure code quality
4. Commit and push your changes
5. Create a pull request

## 📄 License

This project is part of the Career Compass AI initiative.

## 👨‍💻 Support

For questions or issues, please open a GitHub issue or contact the development team.

---

**Last Updated**: January 2026
