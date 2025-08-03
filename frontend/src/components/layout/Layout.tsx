import React, { useMemo, useState } from 'react';
import { useUser, UserButton } from '@clerk/clerk-react';
import { useAuthUser } from '../../hooks/useAuthUser';
import { useAgencyAuth } from '../../hooks/useAgencyAuth';
import {
    MapPin,
    Shield,
    FileText,
    Menu,
    Building2,
    UserPlus,
} from "lucide-react";
import NotificationBell from "../common/NotificationBell";

interface LayoutProps {
    children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    const { isSignedIn } = useUser();
    const { user, isAuthority } = useAuthUser();
    const { agency, isAuthenticated: isAgencyAuthenticated } = useAgencyAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const isAuthPage =
        window.location.pathname === "/login" ||
        window.location.pathname === "/register" ||
        window.location.pathname === "/agency-setup";

    const isAuthenticated = isSignedIn || isAgencyAuthenticated;

    const navigation = useMemo(() => {
        const baseNavigation = [
            {
                name: "Map",
                href: "/",
                icon: MapPin,
                current: window.location.pathname === "/",
            },
        ];

        if (isSignedIn) {
            baseNavigation.push({
                name: "My Reports",
                href: "/my-reports",
                icon: FileText,
                current: window.location.pathname === "/my-reports",
            });

            if (isAuthority) {
                baseNavigation.push({
                    name: "Dashboard",
                    href: "/authority-dashboard",
                    icon: Shield,
                    current:
                        window.location.pathname === "/authority-dashboard",
                });
            }
        } else if (isAgencyAuthenticated) {
            baseNavigation.push({
                name: "Dashboard",
                href: "/agency-dashboard",
                icon: Building2,
                current: window.location.pathname === "/agency-dashboard",
            });
        }

        return baseNavigation;
    }, [isAuthority, isSignedIn, isAgencyAuthenticated]);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navigation - Hide on auth pages */}
            {!isAuthPage && (
                <nav className="bg-white shadow-sm border-b border-gray-200 relative z-50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between h-16">
                            {/* Logo and Navigation */}
                            <div className="flex items-center">
                                <a
                                    href="/"
                                    className="flex-shrink-0 flex items-center hover:opacity-80 transition-opacity"
                                >
                                    <MapPin className="h-8 w-8 text-emerald-600" />
                                    <span className="ml-2 text-xl font-bold text-gray-900">
                                        EkoPulse
                                    </span>
                                </a>

                                {/* Desktop Navigation */}
                                {isAuthenticated && (
                                    <div className="hidden md:ml-8 md:flex md:space-x-4">
                                        {navigation.map((item) => {
                                            const Icon = item.icon;
                                            return (
                                                <a
                                                    key={item.name}
                                                    href={item.href}
                                                    className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                                        item.current
                                                            ? "bg-emerald-100 text-emerald-700"
                                                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                                                    }`}
                                                >
                                                    <Icon className="h-4 w-4 mr-2" />
                                                    {item.name}
                                                </a>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* User Menu */}
                            <div className="flex items-center space-x-4">
                                {/* For unauthenticated users - show agency signup option */}
                                {!isAuthenticated && (
                                    <div className="flex items-center space-x-3">
                                        <a
                                            href="/login"
                                            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors"
                                        >
                                            {/* <UserPlus className="w-4 h-4" /> */}
                                            Login
                                        </a>
                                        <a
                                            href="/register"
                                            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-emerald-600 bg-emerald-100 rounded-lg hover:bg-emerald-200 transition-colors"
                                        >
                                            <UserPlus className="w-4 h-4" />
                                            Register
                                        </a>
                                    </div>
                                )}

                                {/* For authenticated users */}
                                {isAuthenticated && (
                                    <>
                                        {/* Notification Bell - Show for Clerk authenticated users only for now */}
                                        {isSignedIn && (
                                            <NotificationBell
                                                recipientType="user"
                                                forceShow={false}
                                            />
                                        )}{" "}
                                        {/* Role Badge - Show for Clerk users or Agency users */}
                                        {(user || agency) && (
                                            <span
                                                className={`hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    user?.role === "authority"
                                                        ? "bg-blue-100 text-blue-800"
                                                        : user?.role ===
                                                              "agency_admin" ||
                                                          agency
                                                        ? "bg-purple-100 text-purple-800"
                                                        : "bg-green-100 text-green-800"
                                                }`}
                                            >
                                                {user?.role === "authority"
                                                    ? "Authority"
                                                    : user?.role ===
                                                          "agency_admin" ||
                                                      agency
                                                    ? "Agency"
                                                    : "Citizen"}
                                            </span>
                                        )}
                                        {/* Authentication Controls */}
                                        {isSignedIn ? (
                                            <UserButton
                                                afterSignOutUrl="/"
                                                appearance={{
                                                    elements: {
                                                        avatarBox: "h-8 w-8",
                                                    },
                                                }}
                                            />
                                        ) : agency ? (
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <Building2 className="w-4 h-4" />
                                                <span>{agency.name}</span>
                                            </div>
                                        ) : (
                                            <a
                                                href="/login"
                                                className="btn-primary"
                                            >
                                                Sign In
                                            </a>
                                        )}
                                    </>
                                )}

                                {/* Mobile menu button */}
                                {isAuthenticated && (
                                    <button
                                        onClick={() =>
                                            setIsMobileMenuOpen(
                                                !isMobileMenuOpen
                                            )
                                        }
                                        className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                                    >
                                        <Menu className="h-5 w-5" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Mobile Navigation */}
                    {isAuthenticated && isMobileMenuOpen && (
                        <div className="md:hidden border-t border-gray-200">
                            <div className="px-2 pt-2 pb-3 space-y-1">
                                {navigation.map((item) => {
                                    const Icon = item.icon;
                                    return (
                                        <a
                                            key={item.name}
                                            href={item.href}
                                            className={`flex items-center px-3 py-2 rounded-md text-base font-medium transition-colors ${
                                                item.current
                                                    ? "bg-emerald-100 text-emerald-700"
                                                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                                            }`}
                                            onClick={() =>
                                                setIsMobileMenuOpen(false)
                                            }
                                        >
                                            <Icon className="h-5 w-5 mr-3" />
                                            {item.name}
                                        </a>
                                    );
                                })}

                                {/* Mobile Role Badge */}
                                {user && (
                                    <div className="px-3 py-2">
                                        <span
                                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                isAuthority
                                                    ? "bg-blue-100 text-blue-800"
                                                    : "bg-green-100 text-green-800"
                                            }`}
                                        >
                                            {isAuthority
                                                ? "Authority"
                                                : "Citizen"}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </nav>
            )}

            {/* Main Content */}
            <main
                className="flex-1"
                style={{
                    minHeight: isAuthPage ? "100vh" : "calc(100vh - 64px)",
                }}
            >
                {children}
            </main>
        </div>
    );
};

export default Layout;
