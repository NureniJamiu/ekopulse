# EkoPulse Backend

The backend API server for the EkoPulse environmental issue reporting platform, built with Node.js, TypeScript, and Express.

## Architecture

- **Framework**: Express.js with TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: Clerk for user authentication
- **Real-time**: Socket.IO for live updates
- **File Upload**: Cloudinary for image storage
- **Validation**: Custom middleware and validation

## Project Structure

```
src/
├── config/           # Configuration files
│   ├── clerk.ts      # Clerk authentication config
│   ├── cloudinary.ts # Cloudinary file upload config
│   └── db.ts         # MongoDB connection config
├── controllers/      # Request handlers
│   ├── agencyController.ts      # Agency management
│   ├── authController.ts        # Authentication
│   ├── issueController.ts       # Issue reporting
│   └── notificationController.ts # Notifications
├── middleware/       # Express middleware
│   ├── agencyAuth.ts    # Agency authentication
│   ├── clerkAuth.ts     # Clerk user authentication
│   └── errorHandler.ts # Global error handling
├── models/          # MongoDB schemas
│   ├── Agency.ts         # Agency/authority model
│   ├── IssueReport.ts    # Issue report model
│   ├── Notification.ts   # Notification model
│   └── User.ts           # User model
├── routes/          # API route definitions
│   ├── agencyRoutes.ts      # Agency endpoints
│   ├── authRoutes.ts        # Authentication endpoints
│   ├── issueRoutes.ts       # Issue reporting endpoints
│   └── notificationRoutes.ts # Notification endpoints
├── scripts/         # Database scripts
│   └── seedAgencies.ts     # Seed agencies data
├── services/        # Business logic services
│   ├── AgencyAssignmentService.ts # Agency assignment logic
│   └── NotificationService.ts     # Notification management
├── websockets/      # Real-time communication
│   ├── socketHandlers.ts # Socket event handlers
│   └── socketServer.ts   # Socket.IO server setup
└── server.ts        # Application entry point
```

## Getting Started

### Prerequisites

- Node.js 18+ and pnpm
- MongoDB instance
- Clerk account for authentication
- Cloudinary account for file uploads

### Environment Variables

Create a `.env` file in the backend directory:

```env
# Database
MONGODB_URI=your_mongodb_connection_string

# Clerk Authentication
CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
CLERK_WEBHOOK_SECRET=your_clerk_webhook_secret

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Server
PORT=5000
NODE_ENV=development
```

### Installation

```bash
# Install dependencies
pnpm install

# Run in development mode
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### Issues
- `GET /api/issues` - Get all issues
- `POST /api/issues` - Report new issue
- `GET /api/issues/:id` - Get specific issue
- `PUT /api/issues/:id` - Update issue
- `PUT /api/issues/:id/status` - Update issue status

### Agencies
- `GET /api/agencies` - Get all agencies
- `POST /api/agencies/register` - Register new agency
- `POST /api/agencies/login` - Agency login
- `GET /api/agencies/dashboard` - Agency dashboard data

### Notifications
- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/:id/read` - Mark notification as read

## Features

- **Multi-role Authentication**: Support for citizens and government agencies
- **Real-time Updates**: Live issue status updates via WebSocket
- **Geolocation**: Location-based issue reporting and agency assignment
- **File Upload**: Image upload for issue evidence
- **Smart Assignment**: Automatic agency assignment based on location and issue type
- **Notification System**: Real-time notifications for status updates

## Development

### Code Style
- TypeScript strict mode enabled
- ESLint and Prettier configured
- Consistent error handling patterns
- Modular architecture with separation of concerns

### Testing
```bash
# Run tests (when implemented)
pnpm test

# Run tests in watch mode
pnpm test:watch
```

## Deployment

The backend can be deployed to platforms like:
- Vercel
- Railway
- DigitalOcean
- AWS/Azure/GCP

Make sure to configure environment variables and database connections for your deployment platform.
