# Kanban Task Management App

A modern, feature-rich Kanban-style task management application designed for individual professionals who need to organize, track, and manage tasks across multiple projects. Built with Next.js and inspired by the best features of Trello, Notion, and Todoist.

![Next.js](https://img.shields.io/badge/Next.js-15.3.2-black)
![React](https://img.shields.io/badge/React-19.0.0-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-38bdf8)
![Prisma](https://img.shields.io/badge/Prisma-6.8.2-2d3748)

## ✨ Features

### 🚀 Core Functionality
- **Multi-Project Support**: Organize tasks across different projects and contexts
- **Kanban Boards**: Visual workflow management with customizable columns
- **Drag & Drop**: Intuitive task and column reordering using Atlassian's Pragmatic Drag and Drop
- **Task Management**: Create, edit, delete, and organize tasks with rich descriptions
- **Checklists**: Add detailed checklists to tasks for better task breakdown
- **Real-time Updates**: Optimistic updates with TanStack Query for smooth UX

### 🎨 User Experience
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Modern UI**: Clean, professional interface built with Shadcn/ui and Radix components
- **Rich Text Editor**: Powered by Tiptap for enhanced task descriptions
- **Dark/Light Mode**: (Coming soon)
- **Keyboard Navigation**: Accessibility-first design

### 🔧 Technical Features
- **Type Safety**: Full TypeScript implementation with strict type checking
- **Database**: PostgreSQL with Prisma ORM for robust data management
- **Authentication**: Secure user authentication with NextAuth.js
- **Testing**: Comprehensive test suite with Jest and React Testing Library
- **Performance**: Optimized with Next.js 15 and React 19 features

## 🏗️ Tech Stack

### Frontend
- **Framework**: Next.js 15.3.2 with App Router
- **UI Library**: React 19
- **Styling**: TailwindCSS 4 with custom components
- **Component Library**: Shadcn/ui + Radix UI primitives
- **State Management**: TanStack Query for server state
- **Drag & Drop**: @atlaskit/pragmatic-drag-and-drop
- **Rich Text**: Tiptap editor
- **Forms**: React Hook Form with Zod validation

### Backend
- **Database**: PostgreSQL
- **ORM**: Prisma 6.8.2
- **Authentication**: NextAuth.js 5
- **API**: Next.js API Routes
- **Validation**: Zod schemas

### Development
- **Language**: TypeScript 5
- **Testing**: Jest + React Testing Library
- **Linting**: ESLint with Next.js config
- **Git Hooks**: Husky + Commitlint
- **Containerization**: Docker with PostgreSQL

## 🚦 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Docker (optional, for database)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd kanban-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Configure your environment variables:
   ```env
   DATABASE_URL="postgresql://myuser:secret@localhost:5432/kanbandb"
   NEXTAUTH_SECRET="your-secret-key"
   NEXTAUTH_URL="http://localhost:3000"
   ```

4. **Start the database (with Docker)**
   ```bash
   cd docker
   docker-compose up -d
   ```

5. **Run database migrations**
   ```bash
   npm run db:migrate
   ```

6. **Seed the database (optional)**
   ```bash
   npm run db:seed
   ```

7. **Start the development server**
   ```bash
   npm run dev
   ```

8. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📋 Available Scripts

### Development
- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build the application for production
- `npm start` - Start the production server
- `npm run lint` - Run ESLint

### Database
- `npm run db:generate` - Generate Prisma client
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed the database with sample data
- `npm run db:reset` - Reset database and reseed

### Testing
- `npm test` - Run test suite
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate test coverage report

## 🗄️ Database Schema

The application uses a PostgreSQL database with the following main entities:

- **Projects**: Top-level containers for organizing work
- **Columns**: Workflow stages within projects (To Do, In Progress, Done, etc.)
- **Cards**: Individual tasks with rich metadata
- **Checklists**: Task breakdown lists within cards
- **ChecklistItems**: Individual checklist items

## 🔄 API Routes

### Projects
- `GET /api/projects` - List all projects
- `POST /api/projects` - Create a new project
- `GET /api/projects/[id]` - Get project details
- `PUT /api/projects/[id]` - Update project
- `DELETE /api/projects/[id]` - Delete project

### Columns
- `GET /api/columns` - List columns for a project
- `POST /api/columns` - Create a new column
- `PUT /api/columns/[id]` - Update column
- `DELETE /api/columns/[id]` - Delete column

### Tasks (Cards)
- `GET /api/tasks` - List tasks for a column
- `POST /api/tasks` - Create a new task
- `PUT /api/tasks/[id]` - Update task
- `DELETE /api/tasks/[id]` - Delete task
- `POST /api/tasks/move` - Move task between columns

### Checklists
- `GET /api/checklists` - List checklists for a task
- `POST /api/checklists` - Create a new checklist
- `PUT /api/checklists/[id]` - Update checklist
- `DELETE /api/checklists/[id]` - Delete checklist

## 🧪 Testing

The application includes a comprehensive test suite:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

Tests are located in `__tests__` directories and use:
- Jest for test framework
- React Testing Library for component testing
- Mock implementations for external dependencies

## 🚀 Deployment

### Production Build
```bash
npm run build
npm start
```

### Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose -f docker/docker-compose.yml up --build
```

### Environment Configuration
Ensure all environment variables are properly configured for production:
- Database connection string
- NextAuth configuration
- Any external service credentials

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow the existing code style and patterns
- Write tests for new features
- Update documentation as needed
- Use conventional commits for commit messages
- Ensure all tests pass before submitting

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

This project was inspired by the excellent user experiences of:
- **Trello** - For pioneering the digital Kanban board concept
- **Notion** - For demonstrating the power of modular, flexible workspace design
- **Todoist** - For setting the standard in task management and productivity tools

Built with modern web technologies and a focus on developer experience and user productivity.

---

**Made with ❤️ for productivity enthusiasts and individual professionals**
