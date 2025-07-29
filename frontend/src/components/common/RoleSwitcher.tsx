import React, { useState, useRef, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Shield, User, GripVertical, Building2 } from 'lucide-react';

const RoleSwitcher: React.FC = () => {
  const { user, isAuthority, isCitizen, isAgencyAdmin, updateUserRole, refreshUser } = useAuth();

  // Load position from localStorage or use default (with fallback for SSR)
  const getInitialPosition = () => {
    try {
      const saved = localStorage.getItem('roleSwitcherPosition');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Fallback if localStorage fails
    }

    // Safe fallback that works even if window is not available
    const defaultX = typeof window !== 'undefined' ? window.innerWidth - 200 : 200;
    const defaultY = 16;
    return { x: defaultX, y: defaultY };
  };

  // Initialize all hooks BEFORE any conditional returns to avoid Rules of Hooks violation
  const [position, setPosition] = useState(getInitialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const dragRef = useRef<HTMLDivElement>(null);

  const handleRoleSwitch = async (role: 'citizen' | 'authority' | 'agency_admin') => {
    if (user.role === role) return;

    try {
      console.log('[RoleSwitcher] Switching role to:', role);
      await updateUserRole(role);
      console.log('[RoleSwitcher] Role switch successful');
      // Don't reload the page - let React handle the state updates
      // The AuthContext will automatically update and trigger re-renders
    } catch (error) {
      console.error('[RoleSwitcher] Failed to switch role:', error);
      // If there's an auth error, try refreshing the user context
      if (error instanceof Error && error.message.includes('auth')) {
        console.log('[RoleSwitcher] Auth error detected, attempting to refresh user context');
        try {
          await refreshUser();
        } catch (refreshError) {
          console.error('[RoleSwitcher] Failed to refresh user context:', refreshError);
        }
      }
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
    e.preventDefault();
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;

    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;

    // Keep the component within viewport bounds
    const rect = dragRef.current?.getBoundingClientRect();
    if (rect) {
      const maxX = window.innerWidth - rect.width;
      const maxY = window.innerHeight - rect.height;

      const newPosition = {
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY)),
      };

      setPosition(newPosition);

      // Save position to localStorage
      try {
        localStorage.setItem('roleSwitcherPosition', JSON.stringify(newPosition));
      } catch (error) {
        console.warn('Failed to save position to localStorage:', error);
      }
    }
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Add global mouse event listeners
  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Handle window resize to keep component within bounds
  React.useEffect(() => {
    const handleResize = () => {
      const rect = dragRef.current?.getBoundingClientRect();
      if (rect) {
        const maxX = window.innerWidth - rect.width;
        const maxY = window.innerHeight - rect.height;

        setPosition((prev: { x: number; y: number }) => ({
          x: Math.max(0, Math.min(prev.x, maxX)),
          y: Math.max(0, Math.min(prev.y, maxY)),
        }));
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Return null AFTER all hooks have been called to avoid Rules of Hooks violation
  if (!user) return null;

  return (
    <div
      ref={dragRef}
      className={`fixed z-50 bg-white rounded-lg shadow-lg border select-none ${
        isDragging ? 'cursor-grabbing shadow-xl' : 'cursor-grab'
      }`}
      style={{
        left: position.x,
        top: position.y,
      }}
    >
      {/* Drag Handle */}
      <div
        className="flex items-center justify-between p-2 bg-gray-50 rounded-t-lg border-b cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-1">
          <GripVertical size={12} className="text-gray-400" />
          <span className="text-xs text-gray-500 font-medium">Role Switcher</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-3">
        <div className="flex gap-2 mb-2">
          <button
            onClick={() => handleRoleSwitch('citizen')}
            className={`flex items-center gap-1 px-3 py-1 rounded text-sm transition-colors ${
              isCitizen
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <User size={14} />
            Citizen
          </button>
          <button
            onClick={() => handleRoleSwitch('authority')}
            className={`flex items-center gap-1 px-3 py-1 rounded text-sm transition-colors ${
              isAuthority
                ? 'bg-green-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Shield size={14} />
            Authority
          </button>
          <button
            onClick={() => handleRoleSwitch('agency_admin')}
            className={`flex items-center gap-1 px-3 py-1 rounded text-sm transition-colors ${
              user.role === 'agency_admin'
                ? 'bg-purple-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Building2 size={14} />
            Agency
          </button>
        </div>
        <div className="text-xs text-gray-400">
          Current: <span className="font-medium text-gray-600">{user.role}</span>
        </div>

        {/* Optional: Add a refresh button for emergencies */}
        <button
          onClick={() => window.location.reload()}
          className="mt-1 text-xs text-gray-400 hover:text-gray-600 underline"
          title="Refresh page if role switch doesn't work"
        >
          Force Refresh
        </button>
      </div>
    </div>
  );
};

export default RoleSwitcher;
