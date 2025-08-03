# EkoPulse Frontend

The frontend React application for the EkoPulse environmental issue reporting platform, built with React, TypeScript, and Tailwind CSS.

## Technology Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and building
- **Styling**: Tailwind CSS for utility-first styling
- **State Management**: React Context API
- **Authentication**: Clerk for user authentication
- **Maps**: Interactive maps for location-based reporting
- **Real-time**: Socket.IO client for live updates
- **HTTP Client**: Axios for API communication

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── agency/         # Agency-specific components
│   │   ├── AgencyLoginModal.tsx
│   │   ├── AgencyOnboardingGuide.tsx
│   │   └── AgencyRegistrationModal.tsx
│   ├── common/         # Common/shared components
│   │   ├── EmptyState.tsx
│   │   ├── ErrorBoundary.tsx
│   │   ├── LoadingSpinner.tsx
│   │   ├── LocationReportButton.tsx
│   │   └── NotificationBell.tsx
│   ├── issues/         # Issue-related components
│   │   ├── IssueCard.tsx
│   │   ├── IssueDetailPanel.tsx
│   │   ├── IssueReportModal.tsx
│   │   └── StatusUpdateModal.tsx
│   ├── landing/        # Landing page components
│   ├── layout/         # Layout components
│   └── map/           # Map-related components
├── contexts/           # React Context providers
│   ├── AuthContext.tsx      # Authentication state
│   └── MapContext.tsx       # Map state and interactions
├── hooks/              # Custom React hooks
│   ├── useAgencyAuth.ts     # Agency authentication logic
│   ├── useAuthUser.ts       # User authentication logic
│   ├── useMapInteractions.ts # Map interaction handlers
│   ├── useUserLocation.ts   # Geolocation functionality
│   └── useWebSocket.ts      # WebSocket connection management
├── pages/              # Main page components
│   ├── AgencyDashboardPage.tsx    # Agency control panel
│   ├── AgencyManagementPage.tsx   # Agency administration
│   ├── AgencySetupPage.tsx        # Agency onboarding
│   ├── AuthorityDashboardPage.tsx # Authority overview
│   ├── HomePage.tsx               # Landing/home page
│   ├── LoginPage.tsx              # User login
│   ├── MyReportsPage.tsx          # User's reports
│   └── RegisterPage.tsx           # User registration
├── utils/              # Utility functions
│   ├── api.ts          # API client configuration
│   ├── constants.ts    # Application constants
│   └── helpers.ts      # Helper functions
├── App.tsx             # Main application component
├── main.tsx           # Application entry point
├── index.css          # Global styles and Tailwind imports
└── vite-env.d.ts      # Vite type definitions
```

## Key Features

### Multi-Role Authentication
- **Citizens**: Report environmental issues, track progress
- **Government Agencies**: Manage assigned issues, update status
- **Authorities**: Oversee multiple agencies and system administration

### Interactive Mapping
- Location-based issue reporting
- Visual representation of issues on map
- Geolocation integration for accurate reporting

### Real-time Updates
- Live notifications for issue status changes
- WebSocket connection for instant updates
- Notification bell with unread count

### Responsive Design
- Mobile-first design approach
- Tailwind CSS for consistent styling
- Accessible UI components

## Getting Started

### Prerequisites

- Node.js 18+ and pnpm
- Backend API server running
- Clerk account for authentication

### Environment Variables

Create a `.env` file in the frontend directory:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:5000/api

# Clerk Authentication
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key

# Map Configuration (if using map services)
VITE_MAPBOX_TOKEN=your_mapbox_token

# Application Settings
VITE_APP_NAME=EkoPulse
VITE_APP_VERSION=1.0.0
```

### Installation and Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview

# Type checking
pnpm type-check

# Linting
pnpm lint
```

## Available Scripts

- `pnpm dev` - Start development server with hot reload
- `pnpm build` - Build optimized production bundle
- `pnpm preview` - Preview production build locally
- `pnpm type-check` - Run TypeScript type checking
- `pnpm lint` - Run ESLint for code quality

## Component Architecture

### Context Providers
- **AuthContext**: Manages user authentication state and Clerk integration
- **MapContext**: Handles map state, markers, and location data

### Custom Hooks
- **useAgencyAuth**: Agency-specific authentication logic
- **useAuthUser**: User authentication and profile management
- **useMapInteractions**: Map click handlers and location selection
- **useUserLocation**: Geolocation API integration
- **useWebSocket**: Real-time communication with backend

### Page Components
Each page component is self-contained and handles its own state management while utilizing shared contexts and hooks.

### Utility Functions
- **api.ts**: Centralized API client with authentication headers
- **constants.ts**: Application-wide constants and configuration
- **helpers.ts**: Common utility functions and data transformations

## Styling Guidelines

### Tailwind CSS
- Utility-first approach for consistent design
- Custom color palette for environmental theme
- Responsive breakpoints for mobile-first design

### Component Structure
- Each component follows single responsibility principle
- Props interfaces defined with TypeScript
- Error boundaries for graceful error handling

## State Management

### React Context
- Authentication state managed globally
- Map state shared across map-related components
- Minimal global state, component-level state preferred

### Data Fetching
- React Query or SWR for server state management
- Optimistic updates for better UX
- Error handling and retry logic

## Deployment

The frontend can be deployed to:
- Vercel (recommended for Vite projects)
- Netlify
- AWS S3 + CloudFront
- Any static hosting service

### Build Configuration
- Vite handles bundling and optimization
- Tree shaking for smaller bundle sizes
- Code splitting for better performance

### Environment Setup
Make sure to configure environment variables for your deployment platform and update the API base URL to point to your production backend.

## Contributing

1. Follow TypeScript strict mode
2. Use functional components with hooks
3. Implement proper error boundaries
4. Write accessible JSX with proper ARIA labels
5. Test components in isolation
6. Follow the established folder structure
