import React, { useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Building2, Users, MapPin, CheckCircle, ArrowRight, X } from 'lucide-react';

const AgencyLandingBanner: React.FC = () => {
  const { isSignedIn } = useUser();
  const [isVisible, setIsVisible] = useState(true);

  // Don't show banner if user is already signed in
  if (isSignedIn || !isVisible) return null;

  return (
    <div className="fixed top-16 left-0 right-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white z-40 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <button
          onClick={() => setIsVisible(false)}
          className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Left Content */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Are you an Environmental Agency?</h2>
                <p className="text-blue-100">Join EcoPulse to manage environmental issues in your area</p>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-300" />
                <span>Receive real-time citizen reports</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-300" />
                <span>Automated issue assignment based on your service areas</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-300" />
                <span>Track and update issue resolution status</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-300" />
                <span>Connect directly with citizens and other agencies</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href="/register?tab=agency"
                className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-blue-600 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
              >
                <Building2 className="w-5 h-5" />
                Register as Agency
                <ArrowRight className="w-4 h-4" />
              </a>

              <a
                href="/register"
                className="flex items-center justify-center gap-2 px-6 py-3 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors border border-white/30"
              >
                <Users className="w-5 h-5" />
                I'm a Citizen
              </a>
            </div>
          </div>

          {/* Right Content - Stats or Visual */}
          <div className="hidden lg:block">
            <div className="bg-white/10 rounded-xl p-6 backdrop-blur-sm">
              <h3 className="text-lg font-semibold mb-4">Platform Impact</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">50+</div>
                  <div className="text-blue-100 text-sm">Partner Agencies</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">1,200+</div>
                  <div className="text-blue-100 text-sm">Issues Resolved</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">24h</div>
                  <div className="text-blue-100 text-sm">Avg Response Time</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">95%</div>
                  <div className="text-blue-100 text-sm">Satisfaction Rate</div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-white/20">
                <div className="flex items-center gap-2 text-sm text-blue-100">
                  <MapPin className="w-4 h-4" />
                  <span>Operating in 12+ cities nationwide</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgencyLandingBanner;
