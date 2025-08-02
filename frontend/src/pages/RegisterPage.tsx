import React, { useState, useEffect } from 'react';
import { SignUp } from '@clerk/clerk-react';
import { ArrowLeft, User, Building2, CheckCircle, MapPin } from 'lucide-react';
import AgencyRegistrationModal from '../components/agency/AgencyRegistrationModal';

const RegisterPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'citizen' | 'agency'>('citizen');
  const [showAgencyModal, setShowAgencyModal] = useState(false);
  const [showCitizenModal, setShowCitizenModal] = useState(false);

  // Check URL parameters to set initial tab
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab');
    if (tab === 'agency') {
      setActiveTab('agency');
    }
  }, []);

  const handleBackClick = () => {
    window.location.href = '/';
  };

  const handleAgencyRegister = () => {
    setShowAgencyModal(true);
  };

  const handleCitizenRegister = () => {
    setShowCitizenModal(true);
  };

  const citizenBenefits = [
    'Report environmental issues in your area',
    'Track the status of your reports',
    'Get notifications on issue resolutions',
    'Contribute to community environmental health'
  ];

  const agencyBenefits = [
    'Manage and respond to environmental reports',
    'Coordinate with other agencies',
    'Access comprehensive dashboard and analytics',
    'Streamline workflow for issue resolution'
  ];

  return (
      <div
          className={`min-h-screen py-12 px-4 sm:px-6 lg:px-8 transition-all duration-500 ${
              activeTab === "agency"
                  ? "bg-gradient-to-br from-blue-50 to-indigo-50"
                  : "bg-gradient-to-br from-emerald-50 to-blue-50"
          }`}
      >
          {/* Back Button */}
          <div className="absolute top-6 left-6">
              <button
                  onClick={handleBackClick}
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-white/50 rounded-lg transition-all duration-200 backdrop-blur-sm"
              >
                  <ArrowLeft className="w-5 h-5" />
                  <span className="font-medium">Back</span>
              </button>
          </div>

          <div className="flex items-center justify-center min-h-screen">
              <div className="max-w-md w-full space-y-8">
                  {/* Logo */}
                  <div className="flex justify-center">
                      <div className="flex items-center">
                          <MapPin className="h-10 w-10 text-emerald-600" />
                          <span className="ml-2 text-2xl font-bold text-gray-900">
                              EkoPulse
                          </span>
                      </div>
                  </div>

                  {/* Header */}
                  <div className="text-center">
                      <h2 className="text-3xl font-extrabold text-gray-900">
                          Join EkoPulse
                      </h2>
                      <p className="mt-2 text-sm text-gray-600">
                          Create your account and help make a difference
                      </p>
                  </div>

                  {/* Tab Navigation */}
                  <div className="bg-white rounded-lg shadow-sm p-1">
                      <div className="flex space-x-1">
                          <button
                              onClick={() => setActiveTab("citizen")}
                              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                                  activeTab === "citizen"
                                      ? "bg-emerald-100 text-emerald-700 shadow-sm"
                                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                              }`}
                          >
                              <User className="w-4 h-4" />
                              Citizen
                          </button>
                          <button
                              onClick={() => setActiveTab("agency")}
                              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                                  activeTab === "agency"
                                      ? "bg-blue-100 text-blue-700 shadow-sm"
                                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                              }`}
                          >
                              <Building2 className="w-4 h-4" />
                              Agency
                          </button>
                      </div>
                  </div>

                  {/* Content Area */}
                  <div className="bg-white rounded-lg shadow-lg p-6">
                      {activeTab === "citizen" ? (
                          <div>
                              {/* Citizen Benefits */}
                              <div className="mb-6">
                                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                                      As a Citizen, you can:
                                  </h3>
                                  <ul className="space-y-2">
                                      {citizenBenefits.map((benefit, index) => (
                                          <li
                                              key={index}
                                              className="flex items-start gap-2 text-sm text-gray-600"
                                          >
                                              <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                                              {benefit}
                                          </li>
                                      ))}
                                  </ul>
                              </div>

                              {/* Citizen Register Button */}
                              <button
                                  onClick={handleCitizenRegister}
                                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                              >
                                  <User className="w-5 h-5" />
                                  Continue as Citizen
                              </button>
                          </div>
                      ) : (
                          <div>
                              {/* Agency Benefits */}
                              <div className="mb-6">
                                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                                      As an Agency, you can:
                                  </h3>
                                  <ul className="space-y-2">
                                      {agencyBenefits.map((benefit, index) => (
                                          <li
                                              key={index}
                                              className="flex items-start gap-2 text-sm text-gray-600"
                                          >
                                              <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                              {benefit}
                                          </li>
                                      ))}
                                  </ul>
                              </div>

                              {/* Agency Registration Button */}
                              <button
                                  onClick={handleAgencyRegister}
                                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                              >
                                  <Building2 className="w-5 h-5" />
                                  Register as Agency
                              </button>

                              <p className="text-xs text-gray-500 text-center mt-4">
                                  Agency accounts require verification and
                                  approval
                              </p>
                          </div>
                      )}
                  </div>

                  {/* Login Link */}
                  <div className="text-center">
                      <p className="text-sm text-gray-600">
                          Already have an account?{" "}
                          <a
                              href="/login"
                              className="font-medium text-emerald-600 hover:text-emerald-500 transition-colors"
                          >
                              Login here
                          </a>
                      </p>
                  </div>
              </div>
          </div>

          {/* Agency Registration Modal */}
          <AgencyRegistrationModal
              isOpen={showAgencyModal}
              onClose={() => setShowAgencyModal(false)}
              onSuccess={() => {
                  setShowAgencyModal(false);
                  // Handle success - maybe show a success message or redirect
              }}
          />

          {/* Citizen Register Modal */}
          {showCitizenModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-lg shadow-xl max-w-md w-full relative">
                      <button
                          onClick={() => setShowCitizenModal(false)}
                          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl font-bold"
                      >
                          ×
                      </button>
                      <div className="p-6">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
                              Register as Citizen
                          </h3>
                          <div className="flex justify-center">
                              <SignUp
                                  routing="hash"
                                  redirectUrl="/"
                                  appearance={{
                                      elements: {
                                          formButtonPrimary:
                                              "bg-emerald-600 hover:bg-emerald-700 text-sm normal-case",
                                          card: "shadow-none border-0 bg-transparent",
                                      },
                                  }}
                              />
                          </div>
                      </div>
                  </div>
              </div>
          )}
      </div>
  );
};export default RegisterPage;
