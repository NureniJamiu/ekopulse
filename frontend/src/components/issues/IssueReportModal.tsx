import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMap } from '../../contexts/MapContext';
import { useAuth } from '../../contexts/AuthContext';
import { issuesAPI, CreateIssueData } from '../../utils/api';
import { ISSUE_TYPES, VALIDATION_RULES } from '../../utils/constants';
import { isValidImageFile, isValidFileSize } from '../../utils/helpers';
import { X, MapPin, Camera } from 'lucide-react';
import toast from 'react-hot-toast';

interface IssueReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onIssueCreated: (issue: any) => void;
}

interface FormData {
  title: string;
  description: string;
  type: string;
  address: string;
  image?: FileList;
}

const IssueReportModal: React.FC<IssueReportModalProps> = ({
  isOpen,
  onClose,
  onIssueCreated
}) => {
  const { selectedLocation } = useMap();
  const { user, isLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm<FormData>();

  const watchedImage = watch('image');

  // Handle image preview
  React.useEffect(() => {
    if (watchedImage && watchedImage[0]) {
      const file = watchedImage[0];
      if (isValidImageFile(file)) {
        const reader = new FileReader();
        reader.onload = (e) => setPreviewImage(e.target?.result as string);
        reader.readAsDataURL(file);
      } else {
        setPreviewImage(null);
        toast.error('Please select a valid image file (JPEG, PNG)');
      }
    } else {
      setPreviewImage(null);
    }
  }, [watchedImage]);

  const onSubmit = async (data: FormData) => {
    if (!selectedLocation) {
      toast.error('Please select a location on the map');
      return;
    }

    // Check authentication before proceeding
    if (isLoading) {
      toast.error('Please wait while we verify your account...');
      return;
    }

    if (!user) {
      toast.error('Please sign in to report an issue');
      onClose();
      window.location.href = '/login';
      return;
    }

    try {
      setIsSubmitting(true);

      // Validate image if provided
      if (data.image && data.image[0]) {
        const file = data.image[0];
        if (!isValidImageFile(file)) {
          toast.error('Please select a valid image file (JPEG, PNG)');
          return;
        }
        if (!isValidFileSize(file)) {
          toast.error('Image size must be less than 5MB');
          return;
        }
      }

      const issueData: CreateIssueData = {
        title: data.title,
        description: data.description,
        type: data.type,
        coordinates: selectedLocation,
        address: data.address,
        image: data.image?.[0]
      };

      const newIssue = await issuesAPI.createIssue(issueData);
      onIssueCreated(newIssue);
      reset();
      setPreviewImage(null);
      toast.success('Issue reported successfully!');
      onClose();
    } catch (error) {
      console.error('Error creating issue:', error);

      // Extract specific error message from response
      let errorMessage = 'Failed to report issue. Please try again.';

      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        // Handle axios error response
        const axiosError = error as any;
        if (axiosError.response?.data?.error) {
          errorMessage = axiosError.response.data.error;
        } else if (axiosError.message) {
          errorMessage = axiosError.message;
        }
      }

      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Report Issue</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {/* Location Display */}
          {selectedLocation && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="h-4 w-4" />
                <span>
                  Location: {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                </span>
              </div>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              {...register('title', VALIDATION_RULES.title)}
              className="input-field"
              placeholder="Brief description of the issue"
            />
            {errors.title && (
              <p className="text-red-600 text-sm mt-1">{errors.title.message}</p>
            )}
          </div>

          {/* Issue Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Issue Type *
            </label>
            <select
              {...register('type', { required: 'Please select an issue type' })}
              className="input-field"
            >
              <option value="">Select issue type</option>
              {Object.entries(ISSUE_TYPES).map(([key, config]) => (
                <option key={key} value={key}>
                  {config.icon} {config.label}
                </option>
              ))}
            </select>
            {errors.type && (
              <p className="text-red-600 text-sm mt-1">{errors.type.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              {...register('description', VALIDATION_RULES.description)}
              rows={3}
              className="input-field"
              placeholder="Detailed description of the issue"
            />
            {errors.description && (
              <p className="text-red-600 text-sm mt-1">{errors.description.message}</p>
            )}
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address *
            </label>
            <input
              {...register('address', VALIDATION_RULES.address)}
              className="input-field"
              placeholder="Street address or landmark"
            />
            {errors.address && (
              <p className="text-red-600 text-sm mt-1">{errors.address.message}</p>
            )}
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Photo (Optional)
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
              {previewImage ? (
                <div className="relative">
                  <img
                    src={previewImage}
                    alt="Preview"
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewImage(null);
                      reset({ image: undefined });
                    }}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  <Camera className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <label className="cursor-pointer">
                    <span className="text-emerald-600 hover:text-emerald-500 font-medium">
                      Choose file
                    </span>
                    <input
                      {...register('image')}
                      type="file"
                      accept="image/*"
                      className="hidden"
                    />
                  </label>
                  <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 5MB</p>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary flex-1 disabled:opacity-50"
            >
              {isSubmitting ? 'Reporting...' : 'Report Issue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default IssueReportModal;
