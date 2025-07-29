import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../utils/constants';

interface Agency {
  id: string;
  agencyId: string;
  name: string;
  email: string;
  type: string;
  issueTypes: string[];
}

interface AgencyAuthState {
  agency: Agency | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export const useAgencyAuth = () => {
  const [authState, setAuthState] = useState<AgencyAuthState>({
    agency: null,
    isAuthenticated: false,
    isLoading: true,
    error: null
  });

  useEffect(() => {
    checkAgencyAuth();
  }, []);

  const checkAgencyAuth = async () => {
    try {
      const token = localStorage.getItem('agencyToken');
      const agencyId = localStorage.getItem('agencyId');

      if (!token || !agencyId) {
        setAuthState({
          agency: null,
          isAuthenticated: false,
          isLoading: false,
          error: 'No agency session found'
        });
        return;
      }

      // Verify the token with the backend
      const response = await fetch(`${API_BASE_URL}/agencies/verify-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ agencyId })
      });

      if (response.ok) {
        const data = await response.json();
        setAuthState({
          agency: data.agency,
          isAuthenticated: true,
          isLoading: false,
          error: null
        });
      } else {
        // Token is invalid, clear storage
        localStorage.removeItem('agencyToken');
        localStorage.removeItem('agencyId');
        setAuthState({
          agency: null,
          isAuthenticated: false,
          isLoading: false,
          error: 'Session expired'
        });
      }
    } catch (error) {
      console.error('Agency auth check failed:', error);
      setAuthState({
        agency: null,
        isAuthenticated: false,
        isLoading: false,
        error: 'Authentication check failed'
      });
    }
  };

  const logout = () => {
    localStorage.removeItem('agencyToken');
    localStorage.removeItem('agencyId');
    localStorage.removeItem('agencyMongerId');
    setAuthState({
      agency: null,
      isAuthenticated: false,
      isLoading: false,
      error: null
    });
    window.location.href = '/login?tab=agency';
  };

  return {
    ...authState,
    checkAgencyAuth,
    logout
  };
};
