import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useUser } from '@clerk/clerk-react';
import { authAPI, User } from '../utils/api';
import toast from 'react-hot-toast';
import logger from '../utils/logger';
import LoadingSpinner from "../components/common/LoadingSpinner";

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isAuthority: boolean;
    isCitizen: boolean;
    isAgencyAdmin: boolean;
    needsAgencyOnboarding: boolean;
    updateUserRole: (
        role: "citizen" | "authority" | "agency_admin"
    ) => Promise<void>;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const { user: clerkUser, isLoaded: isClerkLoaded } = useUser();
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchOrCreateUser = async () => {
        if (!clerkUser) return;

        // Check if user is logged in via agency authentication
        // If so, skip Clerk user creation to avoid authentication conflicts
        const agencyToken = localStorage.getItem("agencyToken");
        if (agencyToken) {
            logger.info(
                "Agency authentication detected, skipping Clerk user fetch"
            );
            setUser(null);
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);

            // Try to get existing user first
            try {
                const existingUser = await authAPI.getCurrentUser();
                setUser(existingUser);
            } catch (error: any) {
                // If user doesn't exist (404), create them
                if (error.response?.status === 404) {
                    const newUser = await authAPI.getOrCreateUser({
                        email:
                            clerkUser.primaryEmailAddress?.emailAddress || "",
                        firstName: clerkUser.firstName || undefined,
                        lastName: clerkUser.lastName || undefined,
                        role: "citizen", // Default role
                    });
                    setUser(newUser);
                } else {
                    throw error;
                }
            }
        } catch (error) {
            console.error("Error fetching/creating user:", error);
            toast.error("Failed to load user data");
        } finally {
            setIsLoading(false);
        }
    };

    const updateUserRole = async (
        role: "citizen" | "authority" | "agency_admin"
    ) => {
        try {
            logger.info("Updating user role", { role });
            const updatedUser = await authAPI.updateUserRole(role);
            logger.info("Role update successful", {
                newRole: updatedUser.role,
            });
            setUser(updatedUser);
            toast.success(`Role updated to ${role}`);
        } catch (error) {
            console.error("[AuthContext] Error updating user role:", error);
            toast.error("Failed to update role");
            throw error;
        }
    };

    const refreshUser = async () => {
        await fetchOrCreateUser();
    };

    useEffect(() => {
        if (isClerkLoaded) {
            if (clerkUser) {
                fetchOrCreateUser();
            } else {
                setUser(null);
                setIsLoading(false);
            }
        }
    }, [clerkUser, isClerkLoaded]);

    const value: AuthContextType = {
        user,
        isLoading,
        isAuthority: user?.role === "authority",
        isCitizen: user?.role === "citizen",
        isAgencyAdmin: user?.role === "agency_admin",
        needsAgencyOnboarding: user?.role === "agency_admin" && !user?.agency,
        updateUserRole,
        refreshUser,
    };

    return (
        <AuthContext.Provider value={value}>
            {/* Only render children when Clerk is loaded to prevent context access before initialization */}
            {isClerkLoaded ? (
                children
            ) : (
                <div className="flex items-center justify-center min-h-screen">
                    <LoadingSpinner />
                </div>
            )}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Safe hook that returns null instead of throwing during provider initialization
export const useSafeAuth = (): AuthContextType | null => {
  const context = useContext(AuthContext);
  return context || null;
};
