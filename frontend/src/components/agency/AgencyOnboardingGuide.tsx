import React from 'react';
import { UserPlus, Building2, Users, CheckCircle, ArrowRight } from 'lucide-react';

interface AgencyOnboardingGuideProps {
  isOpen: boolean;
  onClose: () => void;
  onStartOnboarding: () => void;
}

const AgencyOnboardingGuide: React.FC<AgencyOnboardingGuideProps> = ({
  isOpen,
  onClose,
  onStartOnboarding
}) => {
  if (!isOpen) return null;

  const steps = [
    {
      icon: UserPlus,
      title: "Sign Up as Agency Admin",
      description: "Create your account using Clerk authentication",
      status: "completed"
    },
    {
      icon: Building2,
      title: "Register Your Agency",
      description: "Fill out agency details, service areas, and issue types",
      status: "current"
    },
    {
      icon: Users,
      title: "Start Managing Issues",
      description: "View assigned issues and manage your agency dashboard",
      status: "upcoming"
    }
  ];

  return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6">
              <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Building2 className="w-8 h-8 text-blue-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      Welcome to EkoPulse Agency Portal
                  </h2>
                  <p className="text-gray-600">
                      Let's get your agency set up to start managing
                      environmental issues in your area.
                  </p>
              </div>

              <div className="space-y-4 mb-8">
                  {steps.map((step, index) => {
                      const Icon = step.icon;
                      return (
                          <div key={index} className="flex items-start gap-4">
                              <div
                                  className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                                      step.status === "completed"
                                          ? "bg-green-100 text-green-600"
                                          : step.status === "current"
                                          ? "bg-blue-100 text-blue-600"
                                          : "bg-gray-100 text-gray-400"
                                  }`}
                              >
                                  {step.status === "completed" ? (
                                      <CheckCircle className="w-5 h-5" />
                                  ) : (
                                      <Icon className="w-5 h-5" />
                                  )}
                              </div>
                              <div className="flex-1">
                                  <h3
                                      className={`font-semibold ${
                                          step.status === "current"
                                              ? "text-blue-900"
                                              : "text-gray-900"
                                      }`}
                                  >
                                      {step.title}
                                  </h3>
                                  <p className="text-gray-600 text-sm mt-1">
                                      {step.description}
                                  </p>
                              </div>
                              {index < steps.length - 1 && (
                                  <ArrowRight className="w-5 h-5 text-gray-300 mt-2" />
                              )}
                          </div>
                      );
                  })}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold text-blue-900 mb-2">
                      What You'll Need
                  </h3>
                  <ul className="text-blue-800 text-sm space-y-1">
                      <li>• Agency name and contact information</li>
                      <li>• Types of environmental issues you handle</li>
                      <li>
                          • Service area information (optional geospatial data)
                      </li>
                      <li>• Working hours and contact person details</li>
                  </ul>
              </div>

              <div className="flex justify-end gap-3">
                  <button
                      onClick={onClose}
                      className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                      Maybe Later
                  </button>
                  <button
                      onClick={() => {
                          onStartOnboarding();
                          onClose();
                      }}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                      <Building2 className="w-4 h-4" />
                      Register My Agency
                  </button>
              </div>
          </div>
      </div>
  );
};

export default AgencyOnboardingGuide;
