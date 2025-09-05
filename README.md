# Rezom - Knowledge Discovery and Learning Platform

**Rezom** is a modern web application designed to help users explore concepts, ask questions, share insights, and engage in meaningful learning conversations. Think of it as a combination of a Q&A platform, a concept mapping tool, and a personal knowledge journal.

## 🌟 What is Rezom?

Rezom enables users to:
- **Explore concepts** through an interactive knowledge graph
- **Ask and answer questions** related to specific topics
- **Write free-form insights** on any subject
- **Comment and discuss** answers with other users
- **Track their learning journey** through personal dashboards

## 🎯 Key Features

### 1. **Concept Exploration** (`/define`)
- Browse concepts like "language-definition", "programming", etc.
- Interactive visualization of related concepts and connections
- Top-5 questions for each concept based on community engagement

### 2. **Question & Answer System**
- **Ask Questions** (`/write`): Create questions linked to specific concepts
- **Answer Questions**: Provide detailed answers with optional titles
- **Answer Numbering**: See how many times each user has answered questions
- **Answer Details**: Dedicated pages for each answer with full content and comments

### 3. **Free Insights** (`/free-insight`) ⭐ *New Feature*
- Write topic-based insights on any subject (Programming, Philosophy, Daily Life, etc.)
- No restrictions on topics - complete creative freedom
- Organize thoughts with topic tags and descriptive titles
- View and manage all insights in your personal dashboard

### 4. **Comment System** ⭐ *New Feature*
- Comment on any answer to engage in discussions
- Edit and delete your own comments
- Real-time updates and notifications

### 5. **Personal Dashboard** (`/users/me`)
- **Questions Tab**: All questions you've created
- **Answers Tab**: All answers you've provided
- **Insights Tab**: All free insights you've written ⭐ *New*
- **Analyze World Top-5 Tab**: View the most important questions from analyze-world ⭐ *New*
- Edit, delete, and manage all your content

### 6. **Daily Question System** ⭐ *New Feature*
- **Admin Panel**: Manage today's question through dedicated admin interface
- **Question Selection**: Choose from all available questions to feature as daily
- **Dynamic Updates**: Real-time question management with Redis caching
- **Admin Access**: Protected admin routes for authorized users only

### 7. **User Authentication**
- Secure sign-up and login system
- Password reset functionality
- Protected routes for authenticated content

## 🚀 Getting Started

### Prerequisites
- Node.js 18.0.0 or higher
- MySQL database
- Redis (for caching)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/Gunhee-b/rezom_server.git
cd rezom_server
```

2. **Set up the backend**
```bash
cd backend
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database and Redis configuration

# Run database migrations
npx prisma migrate dev
npx prisma db seed

# Start the backend server
npm run dev
```

3. **Set up the frontend**
```bash
cd ../frontend
npm install

# Start the frontend development server
npm run dev
```

4. **Access the application**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- Admin Panel: http://localhost:3001 (for daily question management)
- API Documentation: http://localhost:3000/docs

## 📱 How to Use Rezom

### For New Users

1. **Sign Up** (`/sign-up`)
   - Create an account with email and password
   - Verify your account and log in

2. **Explore Concepts** (`/define`)
   - Browse available concepts
   - Click on concepts to see related questions
   - Read answers and engage with the community

3. **Start Writing**
   - **Ask Questions** (`/write`): Create questions about topics you're curious about
   - **Write Insights** (`/free-insight`): Share your thoughts on any topic
   - **Answer Questions**: Respond to questions from other users

4. **Engage with Community**
   - Read answers and leave comments
   - Build discussions around interesting topics
   - Learn from different perspectives

5. **Track Your Progress** (`/users/me`)
   - See all your questions, answers, and insights
   - Edit or update your content
   - Monitor your learning journey

### For Experienced Users

- **Deep Concept Exploration**: Use the concept graph to discover connections
- **Quality Contributions**: Write detailed answers and insightful comments
- **Community Building**: Engage thoughtfully with other users' content
- **Knowledge Organization**: Use insights to capture and organize your learning

## 🏗️ Technical Architecture

### Backend (NestJS + Prisma)
```
backend/
├── src/
│   ├── modules/
│   │   ├── auth/          # Authentication system
│   │   ├── users/         # User management
│   │   ├── questions/     # Q&A system
│   │   ├── answers/       # Answer management
│   │   ├── comments/      # Comment system
│   │   ├── insights/      # Free insights feature
│   │   └── define/        # Concept exploration
│   ├── infrastructure/
│   │   ├── prisma/        # Database ORM
│   │   └── redis/         # Caching layer
│   └── app.module.ts
├── prisma/
│   └── schema.prisma      # Database schema
└── package.json
```

### Frontend (React + TypeScript + Vite)
```
frontend/
├── src/
│   ├── pages/
│   │   ├── HomePage/           # Landing page
│   │   ├── Define/             # Concept exploration
│   │   ├── Write/              # Question creation
│   │   ├── FreeInsight/        # Insight creation
│   │   ├── AnswerDetail/       # Answer pages with comments
│   │   ├── MyQuestions/        # Personal dashboard
│   │   └── Auth/               # Authentication pages
│   ├── components/             # Reusable components
│   ├── api/                    # API communication
│   ├── hooks/                  # Custom React hooks
│   └── shared/                 # Shared utilities
└── package.json
```

### Database Schema (Key Models)
- **Users**: Authentication and profile information
- **Questions**: User-generated questions linked to concepts
- **Answers**: Detailed responses to questions
- **Comments**: Discussion threads on answers
- **Insights**: Free-form writing on any topic
- **Concepts**: Knowledge graph nodes with relationships

## 🌐 API Endpoints

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login  
- `POST /auth/refresh` - Token refresh
- `GET /auth/me` - Get current user

### Questions & Answers
- `GET /questions` - List questions
- `POST /questions` - Create question
- `GET /answers/question/:questionId` - Get answers
- `POST /answers` - Create answer
- `PUT /answers/:id` - Update answer
- `DELETE /answers/:id` - Delete answer

### Comments
- `GET /comments/answer/:answerId` - Get comments
- `POST /comments` - Create comment
- `PUT /comments/:id` - Update comment
- `DELETE /comments/:id` - Delete comment

### Daily Question ⭐ *New*
- `GET /daily/question` - Get current daily question
- `PUT /daily/question` - Set daily question (admin only)

### Insights ⭐ *New*
- `GET /insights/my` - Get user's insights
- `POST /insights` - Create insight
- `PUT /insights/:id` - Update insight
- `DELETE /insights/:id` - Delete insight

### Concepts
- `GET /define/concepts/:slug` - Get concept details
- `GET /define/:slug/top5` - Get top questions
- `GET /define/concepts/:slug/keywords` - Get concept keywords

## 🎨 User Interface

### Design Philosophy
- **Clean and Minimal**: Focus on content and readability
- **Responsive**: Works seamlessly on desktop, tablet, and mobile
- **Intuitive Navigation**: Clear paths between related content
- **Color-Coded**: Emerald for Q&A, Purple for insights

### Key UI Components
- **Tabbed Interface**: Organize different content types
- **Real-time Updates**: Immediate feedback on user actions
- **Modal Dialogs**: Edit and delete operations
- **Loading States**: Visual feedback during operations
- **Form Validation**: Helpful error messages and guidance

## 🔒 Security Features

- JWT-based authentication with refresh tokens
- Password hashing with Argon2
- CORS protection and rate limiting
- Input validation and sanitization
- Ownership-based authorization
- CSRF protection for sensitive operations

## 🚀 Deployment

### Environment Variables

**Backend (.env)**
```env
DATABASE_URL="mysql://user:password@localhost:3306/rezom"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="your-secret-key"
JWT_REFRESH_SECRET="your-refresh-secret"
```

**Frontend (.env)**
```env
VITE_API_BASE_URL="http://localhost:3000"
```

### Production Deployment
1. Build the applications
2. Set up MySQL and Redis instances
3. Configure environment variables
4. Deploy using Docker or your preferred platform
5. Set up reverse proxy (Nginx recommended)

## 🧪 Development & Testing

### Backend Development
```bash
cd backend
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Run ESLint
```

### Frontend Development  
```bash
cd frontend
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
```

### Database Management
```bash
npx prisma migrate dev     # Run migrations
npx prisma db seed         # Seed database
npx prisma studio          # Database GUI
```

## 📝 Admin CLI Tool

Rezom includes a powerful CLI tool for administrative operations:

```bash
# Upload questions from YAML/JSON
npx tsx cli.ts upload-questions --file questions.yaml

# Upload concept keywords
npx tsx cli.ts upload-keywords --slug language-definition --file keywords.json

# Clear caches
npx tsx cli.ts purge-define --slug language-definition
```

See the CLI documentation for detailed usage instructions.

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

### Development Guidelines
- Follow TypeScript best practices
- Use consistent code formatting (Prettier)
- Write descriptive commit messages
- Include documentation for new features

## 📊 Recent Updates

### Version 1.4.1 (2025-09-05) ⭐ *Latest*
- ✨ **New**: Daily Question management system with admin panel
- ✨ **New**: Analyze World Top-5 questions display in user dashboard
- 🐛 **Fixed**: Today's question internal server error resolved
- 🔄 **Enhanced**: Route conflict resolution and improved API reliability
- 🎯 **Improved**: User dashboard now shows community's most important questions

### Version 1.4.0 (2025-09-03)
- ✨ **New**: Free Insights feature for topic-based writing
- ✨ **New**: Comment system for answers with real-time updates
- ✨ **New**: Answer numbering system showing user's writing sequence
- 🔄 **Enhanced**: User dashboard with tabbed interface
- 🔄 **Enhanced**: Answer detail pages with full CRUD operations
- 🎨 **Improved**: UI/UX consistency across all features
- 🐛 **Fixed**: Various performance and usability improvements

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Team

Developed by the Rezom team with contributions from the open-source community.

## 📞 Support

- **Documentation**: Check this README and inline code comments
- **Issues**: Report bugs on GitHub Issues
- **Discussions**: Join discussions on GitHub Discussions

---

**Ready to start your learning journey?** 🌱

Visit [http://localhost:5173](http://localhost:5173) after setup to begin exploring Rezom!