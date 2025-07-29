import React, { useState, useEffect } from 'react';
import { ArrowLeft, Building2, Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../utils/constants';

const AgencySetupPage: React.FC = () => {
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [agencyInfo, setAgencyInfo] = useState<any>(null);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);

  // Get token from URL
  const urlParams = new URLSearchParams(window.location.search);
  const setupToken = urlParams.get('token');

  useEffect(() => {
    if (!setupToken) {
      setTokenValid(false);
      return;
    }

    // Validate setup token and get agency info
    validateSetupToken();
  }, [setupToken]);

  const validateSetupToken = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/agencies/validate-setup-token?token=${setupToken}`);

      if (response.ok) {
        const data = await response.json();
        setAgencyInfo(data.agency);
        setTokenValid(true);
      } else {
        setTokenValid(false);
        toast.error('Invalid or expired setup link. Please contact support.');
      }
    } catch (error) {
      console.error('Token validation error:', error);
      setTokenValid(false);
      toast.error('Failed to validate setup link. Please try again.');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validatePassword = (password: string) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasNonalphas = /\W/.test(password);

    return {
      minLength: password.length >= minLength,
      hasUpperCase,
      hasLowerCase,
      hasNumbers,
      hasNonalphas
    };
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else {
      const validation = validatePassword(formData.password);
      if (!validation.minLength) {
        newErrors.password = 'Password must be at least 8 characters long';
      } else if (!validation.hasUpperCase || !validation.hasLowerCase || !validation.hasNumbers) {
        newErrors.password = 'Password must contain uppercase, lowercase, and numbers';
      }
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/agencies/setup-credentials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: setupToken,
          password: formData.password
        }),
      });

      if (response.ok) {
        await response.json(); // Get response data but don't need to use it
        toast.success('Credentials set up successfully! You can now log in to your agency dashboard.', {
          duration: 6000,
        });

        // Redirect to login page with agency tab pre-selected
        setTimeout(() => {
          window.location.href = '/login?tab=agency';
        }, 2000);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to set up credentials. Please try again.');
      }
    } catch (error) {
      console.error('Credential setup error:', error);
      toast.error('Setup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToHome = () => {
    window.location.href = '/';
  };

  const passwordValidation = validatePassword(formData.password);

  if (tokenValid === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Validating setup link...</p>
        </div>
      </div>
    );
  }

  if (tokenValid === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="absolute top-6 left-6">
          <button
            onClick={handleBackToHome}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-white/50 rounded-lg transition-all duration-200 backdrop-blur-sm"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Home</span>
          </button>
        </div>

        <div className="flex items-center justify-center min-h-screen">
          <div className="max-w-md w-full text-center">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Invalid Setup Link</h2>
              <p className="text-gray-600 mb-6">
                This setup link is invalid or has expired. Please contact support for assistance.
              </p>
              <button
                onClick={handleBackToHome}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                Return to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
      {/* Back Button */}
      <div className="absolute top-6 left-6">
        <button
          onClick={handleBackToHome}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-white/50 rounded-lg transition-all duration-200 backdrop-blur-sm"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Back to Home</span>
        </button>
      </div>

      <div className="flex items-center justify-center min-h-screen">
        <div className="max-w-md w-full space-y-8">
          {/* Header */}
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900">
              Set Up Agency Credentials
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Complete your agency account setup
            </p>
          </div>

          {/* Agency Info */}
          {agencyInfo && (
            <div className="bg-white rounded-lg shadow-sm p-4 border border-blue-200">
              <h3 className="font-semibold text-gray-900">{agencyInfo.name}</h3>
              <p className="text-sm text-gray-600">{agencyInfo.email}</p>
              <p className="text-xs text-blue-600 mt-1">Agency ID: {agencyInfo.agencyId}</p>
            </div>
          )}

          {/* Setup Form */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Create Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 pl-11 pr-11 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.password ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter a secure password"
                    disabled={loading}
                  />
                  <Lock className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                )}

                {/* Password Requirements */}
                {formData.password && (
                  <div className="mt-2 space-y-1">
                    <div className={`flex items-center gap-2 text-sm ${passwordValidation.minLength ? 'text-green-600' : 'text-gray-500'}`}>
                      <CheckCircle className="w-4 h-4" />
                      At least 8 characters
                    </div>
                    <div className={`flex items-center gap-2 text-sm ${passwordValidation.hasUpperCase ? 'text-green-600' : 'text-gray-500'}`}>
                      <CheckCircle className="w-4 h-4" />
                      Uppercase letter
                    </div>
                    <div className={`flex items-center gap-2 text-sm ${passwordValidation.hasLowerCase ? 'text-green-600' : 'text-gray-500'}`}>
                      <CheckCircle className="w-4 h-4" />
                      Lowercase letter
                    </div>
                    <div className={`flex items-center gap-2 text-sm ${passwordValidation.hasNumbers ? 'text-green-600' : 'text-gray-500'}`}>
                      <CheckCircle className="w-4 h-4" />
                      Number
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password Field */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 pl-11 pr-11 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Confirm your password"
                    disabled={loading}
                  />
                  <Lock className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    Setting up...
                  </>
                ) : (
                  <>
                    <Building2 className="w-5 h-5" />
                    Complete Setup
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgencySetupPage;
