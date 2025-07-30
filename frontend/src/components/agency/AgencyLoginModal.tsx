import React, { useState } from 'react';
import { X, Building2, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../../utils/constants';

interface AgencyLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AgencyLoginModal: React.FC<AgencyLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [formData, setFormData] = useState({
      identifier: "", // Changed from agencyId to identifier
      password: "",
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setFormData((prev) => ({
          ...prev,
          [name]: value,
      }));
      // Clear error when user starts typing
      if (errors[name]) {
          setErrors((prev) => ({
              ...prev,
              [name]: "",
          }));
      }
  };

  const validateForm = () => {
      const newErrors: Record<string, string> = {};

      if (!formData.identifier.trim()) {
          newErrors.identifier = "Agency ID or Email is required";
      }

      if (!formData.password) {
          newErrors.password = "Password is required";
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
          console.log("[Agency Login] Attempting login with:", {
              identifier: formData.identifier,
          });

          // Agency login API call
          const response = await fetch(`${API_BASE_URL}/agencies/login`, {
              method: "POST",
              headers: {
                  "Content-Type": "application/json",
              },
              body: JSON.stringify(formData),
          });

          console.log("[Agency Login] Response status:", response.status);

          if (response.ok) {
              const data = await response.json();
              console.log("[Agency Login] Success:", data);
              toast.success("Successfully logged in!");
              onSuccess();

              // Store agency session/token
              localStorage.setItem("agencyToken", data.token);
              localStorage.setItem("agencyId", data.agency.agencyId); // Use the human-readable agencyId, not the MongoDB _id
              localStorage.setItem("agencyMongerId", data.agency.id); // Store MongoDB _id separately if needed

              // Redirect to agency dashboard
              window.location.href = "/agency-dashboard";
          } else {
              const errorData = await response.json();
              console.error("[Agency Login] Error response:", errorData);
              toast.error(
                  errorData.error ||
                      "Invalid credentials. Please check your Agency ID/Email and password."
              );
          }
      } catch (error) {
          console.error("[Agency Login] Network/parsing error:", error);
          toast.error(
              "Login failed. Please check your connection and try again."
          );
      } finally {
          setLoading(false);
      }
  };

  const handleForgotPassword = () => {
      toast("Please contact support to reset your agency password.", {
          icon: "ℹ️",
      });
  };

  if (!isOpen) return null;

  return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full relative max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                          <Building2 className="w-6 h-6 text-blue-600" />
                      </div>
                      <h2 className="text-xl font-semibold text-gray-900">
                          Agency Login
                      </h2>
                  </div>
                  <button
                      onClick={onClose}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                      <X className="w-5 h-5 text-gray-500" />
                  </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                  <div className="text-center mb-6">
                      <p className="text-sm text-gray-600">
                          Enter your agency credentials to access your dashboard
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                          You can login using either your Agency ID or
                          registered email address
                      </p>
                  </div>

                  {/* Agency ID/Email Field */}
                  <div>
                      <label
                          htmlFor="identifier"
                          className="block text-sm font-medium text-gray-700 mb-2"
                      >
                          Agency ID or Email
                      </label>
                      <div className="relative">
                          <input
                              type="text"
                              id="identifier"
                              name="identifier"
                              value={formData.identifier}
                              onChange={handleInputChange}
                              className={`w-full px-4 py-3 pl-11 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                  errors.identifier
                                      ? "border-red-500"
                                      : "border-gray-300"
                              }`}
                              placeholder="Enter your Agency ID or Email"
                              disabled={loading}
                          />
                          <Mail className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                      </div>
                      {errors.identifier && (
                          <p className="mt-1 text-sm text-red-600">
                              {errors.identifier}
                          </p>
                      )}
                  </div>

                  {/* Password Field */}
                  <div>
                      <label
                          htmlFor="password"
                          className="block text-sm font-medium text-gray-700 mb-2"
                      >
                          Password
                      </label>
                      <div className="relative">
                          <input
                              type={showPassword ? "text" : "password"}
                              id="password"
                              name="password"
                              value={formData.password}
                              onChange={handleInputChange}
                              className={`w-full px-4 py-3 pl-11 pr-11 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                  errors.password
                                      ? "border-red-500"
                                      : "border-gray-300"
                              }`}
                              placeholder="Enter your password"
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
                          <p className="mt-1 text-sm text-red-600">
                              {errors.password}
                          </p>
                      )}
                  </div>

                  {/* Forgot Password Link */}
                  <div className="text-center">
                      <button
                          type="button"
                          onClick={handleForgotPassword}
                          className="text-sm text-blue-600 hover:text-blue-500 transition-colors"
                      >
                          Forgot your password?
                      </button>
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
                              Signing in...
                          </>
                      ) : (
                          <>
                              <Building2 className="w-5 h-5" />
                              Sign In to Dashboard
                          </>
                      )}
                  </button>

                  {/* Help Text */}
                  <div className="text-center text-xs text-gray-500">
                      <p>Don't have agency credentials yet?</p>
                      <p>
                          Your Agency ID and setup link were sent to your email
                          after registration.
                      </p>
                      <p className="mt-1 text-gray-600">
                          Use either your <strong>Agency ID</strong> or{" "}
                          <strong>Email</strong> to login.
                      </p>
                  </div>
              </form>
          </div>
      </div>
  );
};

export default AgencyLoginModal;
