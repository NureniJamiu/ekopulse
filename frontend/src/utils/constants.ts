export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
export const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:5000';

// Lagos, Nigeria coordinates and bounds
export const LAGOS_CENTER = {
  lat: 6.5244,
  lng: 3.3792
};

export const LAGOS_BOUNDS = {
  north: 6.7028,
  south: 6.3458,
  east: 3.6969,
  west: 3.0615
};

// Issue types with colors and icons
export const ISSUE_TYPES = {
  waste: {
    label: 'Waste Management',
    color: '#dc2626', // red-600
    bgColor: '#fef2f2', // red-50
    icon: '🗑️'
  },
  drainage: {
    label: 'Drainage Issues',
    color: '#2563eb', // blue-600
    bgColor: '#eff6ff', // blue-50
    icon: '🌊'
  },
  pollution: {
    label: 'Pollution',
    color: '#7c3aed', // violet-600
    bgColor: '#f5f3ff', // violet-50
    icon: '🏭'
  },
  other: {
    label: 'Other',
    color: '#6b7280', // gray-500
    bgColor: '#f9fafb', // gray-50
    icon: '📍'
  }
} as const;

// Issue status with colors
export const ISSUE_STATUS = {
  reported: {
    label: 'Reported',
    color: '#d97706', // amber-600
    bgColor: '#fef3c7', // amber-100
  },
  under_review: {
    label: 'Under Review',
    color: '#2563eb', // blue-600
    bgColor: '#dbeafe', // blue-100
  },
  resolved: {
    label: 'Resolved',
    color: '#059669', // emerald-600
    bgColor: '#d1fae5', // emerald-100
  }
} as const;

// User roles
export const USER_ROLES = {
  citizen: 'citizen',
  authority: 'authority'
} as const;

// Map settings
export const MAP_CONFIG = {
  defaultZoom: 11,
  lagosZoom: 12,
  userLocationZoom: 16,
  minZoom: 9,
  maxZoom: 18,
  tileLayer: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  bounds: [
    [LAGOS_BOUNDS.south, LAGOS_BOUNDS.west], // Southwest
    [LAGOS_BOUNDS.north, LAGOS_BOUNDS.east]  // Northeast
  ] as [[number, number], [number, number]]
};

// API endpoints
export const API_ENDPOINTS = {
    auth: {
        user: "/auth/user",
        updateRole: "/auth/user/role",
    },
    issues: {
        list: "/issues",
        create: "/issues",
        byId: (id: string) => `/issues/${id}`,
        updateStatus: (id: string) => `/issues/${id}/status`,
        userReports: "/issues/user/my-reports",
    },
    agencies: {
        register: "/agencies/register",
        login: "/agencies/login",
        verifySession: "/agencies/verify-session",
        myIssues: "/agencies/my-issues",
        myStats: "/agencies/my-stats",
        updateIssueStatus: (id: string) => `/agencies/issues/${id}/status`,
    },
} as const;

// Form validation
export const VALIDATION_RULES = {
  title: {
    required: 'Title is required',
    maxLength: { value: 100, message: 'Title must be less than 100 characters' }
  },
  description: {
    required: 'Description is required',
    maxLength: { value: 500, message: 'Description must be less than 500 characters' }
  },
  address: {
    required: 'Address is required',
    maxLength: { value: 200, message: 'Address must be less than 200 characters' }
  },
  image: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/jpg']
  }
} as const;
