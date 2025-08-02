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
      // Add a small delay to avoid race conditions during page redirects
      const timeoutId = setTimeout(() => {
          checkAgencyAuth();
      }, 300); // Increased delay to 300ms for better stability

      return () => clearTimeout(timeoutId);
  }, []);

  const checkAgencyAuth = async () => {
      try {
          const token = localStorage.getItem("agencyToken");
          const agencyId = localStorage.getItem("agencyId");

          if (!token || !agencyId) {
              setAuthState({
                  agency: null,
                  isAuthenticated: false,
                  isLoading: false,
                  error: "No agency session found",
              });
              return;
          }

          // Add a timeout to the fetch request to handle network delays
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

          try {
              // Verify the token with the backend
              const response = await fetch(
                  `${API_BASE_URL}/agencies/verify-session`,
                  {
                      method: "POST",
                      headers: {
                          "Content-Type": "application/json",
                          Authorization: `Bearer ${token}`,
                      },
                      body: JSON.stringify({ agencyId }),
                      signal: controller.signal,
                  }
              );

              clearTimeout(timeoutId);

              if (response.ok) {
                  const data = await response.json();
                  setAuthState({
                      agency: data.agency,
                      isAuthenticated: true,
                      isLoading: false,
                      error: null,
                  });
              } else if (response.status === 401 || response.status === 403) {
                  // Only clear tokens on actual authentication failures (401/403)
                  localStorage.removeItem("agencyToken");
                  localStorage.removeItem("agencyId");
                  localStorage.removeItem("agencyMongerId");
                  setAuthState({
                      agency: null,
                      isAuthenticated: false,
                      isLoading: false,
                      error: "Session expired",
                  });
              } else {
                  // For other errors (network, server errors), don't clear tokens immediately
                  // Instead, keep the loading state to prevent premature redirects
                  console.warn(
                      `Server error during auth check: ${response.status}`
                  );
                  setAuthState({
                      agency: null,
                      isAuthenticated: false,
                      isLoading: true, // Keep loading state to prevent redirect
                      error: `Server error: ${response.status}`,
                  });

                  // Retry after a delay
                  setTimeout(() => checkAgencyAuth(), 3000);
              }
          } catch (fetchError: any) {
              clearTimeout(timeoutId);

              if (fetchError.name === "AbortError") {
                  console.warn("Agency auth check timed out");
                  // Keep loading state to prevent redirect on timeout
                  setAuthState({
                      agency: null,
                      isAuthenticated: false,
                      isLoading: true,
                      error: "Connection timeout - retrying...",
                  });

                  // Retry after timeout
                  setTimeout(() => checkAgencyAuth(), 2000);
              } else {
                  throw fetchError; // Re-throw other fetch errors
              }
          }
      } catch (error) {
          console.error("Agency auth check failed:", error);
          // Don't clear tokens on network errors, just mark as unauthenticated temporarily
          // Keep loading state to prevent immediate redirect
          setAuthState({
              agency: null,
              isAuthenticated: false,
              isLoading: true, // Keep loading to prevent redirect
              error: "Network error - retrying...",
          });

          // Retry after a delay
          setTimeout(() => checkAgencyAuth(), 5000);
      }
  };

  const logout = () => {
      localStorage.removeItem("agencyToken");
      localStorage.removeItem("agencyId");
      localStorage.removeItem("agencyMongerId");
      setAuthState({
          agency: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
      });
      window.location.href = "/login?tab=agency";
  };

  const forceAuthCheck = async () => {
      try {
          const token = localStorage.getItem("agencyToken");
          const agencyId = localStorage.getItem("agencyId");

          if (!token || !agencyId) {
              setAuthState({
                  agency: null,
                  isAuthenticated: false,
                  isLoading: false,
                  error: "No agency session found",
              });
              return;
          }

          setAuthState((prev) => ({ ...prev, isLoading: true }));

          const response = await fetch(
              `${API_BASE_URL}/agencies/verify-session`,
              {
                  method: "POST",
                  headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({ agencyId }),
              }
          );

          if (response.ok) {
              const data = await response.json();
              setAuthState({
                  agency: data.agency,
                  isAuthenticated: true,
                  isLoading: false,
                  error: null,
              });
          } else {
              localStorage.removeItem("agencyToken");
              localStorage.removeItem("agencyId");
              localStorage.removeItem("agencyMongerId");
              setAuthState({
                  agency: null,
                  isAuthenticated: false,
                  isLoading: false,
                  error: "Session expired",
              });
          }
      } catch (error) {
          console.error("Force auth check failed:", error);
          setAuthState({
              agency: null,
              isAuthenticated: false,
              isLoading: false,
              error: "Network error",
          });
      }
  };

  return {
      ...authState,
      checkAgencyAuth,
      forceAuthCheck,
      refreshAuth: checkAgencyAuth, // Alias for manual refresh
      logout,
  };
};
