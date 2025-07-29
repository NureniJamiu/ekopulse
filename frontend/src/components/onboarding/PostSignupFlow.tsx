import React, { useState, useEffect } from 'react';
import { useSafeAuth } from '../../contexts/AuthContext';
import { useUser } from '@clerk/clerk-react';
import AgencyOnboardingGuide from '../agency/AgencyOnboardingGuide';
import AgencyRegistrationModal from '../agency/AgencyRegistrationModal';

const PostSignupFlow: React.FC = () => {
  const authContext = useSafeAuth();
  const { isLoaded } = useUser();
  const [showOnboardingGuide, setShowOnboardingGuide] = useState(false);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);

  // Return null if auth context is not ready
  if (!authContext) {
    return null;
  }

  const { user, needsAgencyOnboarding, updateUserRole } = authContext;

  useEffect(() => {
    // Check if user just signed up and might want to be an agency admin
    if (isLoaded && user && user.role === 'citizen') {
      // Check if they came from agency signup flow (you could use URL params or local storage)
      const wantsAgencyRole = localStorage.getItem('pendingAgencySignup');
      if (wantsAgencyRole) {
        // Automatically convert to agency_admin role and show onboarding
        updateUserRole('agency_admin').then(() => {
          setShowOnboardingGuide(true);
        });
        localStorage.removeItem('pendingAgencySignup');
      }
    } else if (isLoaded && user && needsAgencyOnboarding) {
      // User is already agency_admin but hasn't registered their agency
      setShowOnboardingGuide(true);
    }
  }, [isLoaded, user, needsAgencyOnboarding, updateUserRole]);

  if (!isLoaded || !user) return null;

  return (
    <>
      <AgencyOnboardingGuide
        isOpen={showOnboardingGuide}
        onClose={() => setShowOnboardingGuide(false)}
        onStartOnboarding={() => {
          setShowOnboardingGuide(false);
          setShowRegistrationModal(true);
        }}
      />

      <AgencyRegistrationModal
        isOpen={showRegistrationModal}
        onClose={() => setShowRegistrationModal(false)}
        onSuccess={() => {
          setShowRegistrationModal(false);
          // Refresh user data to update agency association
          window.location.reload();
        }}
      />
    </>
  );
};

export default PostSignupFlow;
