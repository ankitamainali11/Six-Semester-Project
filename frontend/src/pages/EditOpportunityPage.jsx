import React, { useState, useEffect } from 'react';
import { Plus, X, Calendar, MapPin, Users, Clock } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.jsx';
import { useNavigate, useParams } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import Modal from '../components/Modal';

const EditOpportunityPage = () => {
  const { id } = useParams();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState({ open: false, type: 'info', title: '', message: '', onClose: null });
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    fullDescription: '',
    location: '',
    isRemote: false,
    timeCommitment: '',
    startDate: '',
    endDate: '',
    applicationDeadline: '',
    volunteersNeeded: '',
    requirements: '',
    tags: [],
    contactEmail: '',
    contactPhone: '',
    imageUrl: '',
    ageRequirement: '',
    accessibility: ''
  });

  const [currentTag, setCurrentTag] = useState('');
  const [customTags, setCustomTags] = useState('');

  const timeCommitmentOptions = [
    'One-time',
    'Weekly',
    'Monthly',
    'Flexible',
    'Full-time',
    'Part-time'
  ];

  const availableTags = [
    'Education', 'Environment', 'Healthcare', 'Community Service',
    'Animal Welfare', 'Disaster Relief', 'Youth Programs', 'Senior Care',
    'Food Security', 'Technology', 'Arts & Culture', 'Sports & Recreation'
  ];

  useEffect(() => {
    if (isAuthenticated && user && id) {
      fetchOpportunity();
    }
  }, [isAuthenticated, user, id]);

  const fetchOpportunity = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`/api/opportunities/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch opportunity');
      }

      const opportunity = await response.json();
      
      // Check if the user owns this opportunity
      if (opportunity.organization !== user._id) {
        setError('You can only edit opportunities that you created');
        return;
      }

      // Format dates for input fields
      const formatDateForInput = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
      };

      setFormData({
        title: opportunity.title || '',
        description: opportunity.description || '',
        fullDescription: opportunity.fullDescription || '',
        location: opportunity.location || '',
        isRemote: opportunity.isRemote || false,
        timeCommitment: opportunity.timeCommitment || '',
        startDate: formatDateForInput(opportunity.startDate),
        endDate: formatDateForInput(opportunity.endDate),
        applicationDeadline: formatDateForInput(opportunity.applicationDeadline),
        volunteersNeeded: opportunity.volunteersNeeded || '',
        requirements: opportunity.requirements || '',
        tags: opportunity.tags || [],
        contactEmail: opportunity.contactEmail || '',
        contactPhone: opportunity.contactPhone || '',
        imageUrl: opportunity.imageUrl || '',
        ageRequirement: opportunity.ageRequirement || '',
        accessibility: opportunity.accessibility || ''
      });
    } catch (err) {
      setError(err.message || 'Failed to fetch opportunity');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const toggleTag = (tag) => {
    const lowercaseTag = tag.toLowerCase();
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(lowercaseTag)
        ? prev.tags.filter(t => t !== lowercaseTag)
        : [...prev.tags, lowercaseTag]
    }));
  };

  const addCustomTag = () => {
    if (customTags.trim()) {
      const newTags = customTags
        .split(',')
        .map(tag => tag.trim().toLowerCase())
        .filter(tag => tag.length > 0 && !formData.tags.includes(tag));
      
      if (newTags.length > 0) {
        setFormData(prev => ({
          ...prev,
          tags: [...prev.tags, ...newTags]
        }));
        setCustomTags('');
      }
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      setModal({ open: true, type: 'info', title: 'Sign in required', message: 'Please log in to edit opportunities', onClose: () => setModal(m => ({ ...m, open: false })) });
      return;
    }
    
    // Check if user is an organization
    if (user && user.role !== 'organization') {
      setModal({ open: true, type: 'warning', title: 'Not allowed', message: 'Only organizations can edit opportunities', onClose: () => setModal(m => ({ ...m, open: false })) });
      return;
    }

    setIsSubmitting(true);
    
    try {
      console.log('Form data being submitted:', formData);
      
      // Prepare the data to send
      const opportunityData = {
        title: formData.title,
        description: formData.description,
        fullDescription: formData.fullDescription,
        location: formData.location,
        isRemote: formData.isRemote,
        startDate: formData.startDate,
        endDate: formData.endDate,
        applicationDeadline: formData.applicationDeadline || undefined,
        timeCommitment: formData.timeCommitment,
        volunteersNeeded: formData.volunteersNeeded,
        requirements: formData.requirements,
        tags: formData.tags,
        contactEmail: formData.contactEmail,
        contactPhone: formData.contactPhone,
        imageUrl: formData.imageUrl,
        ageRequirement: formData.ageRequirement,
        accessibility: formData.accessibility
      };

      console.log('Opportunity data to send:', opportunityData);

      // Send the data to the backend
      const response = await fetch(`/api/opportunities/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(opportunityData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update opportunity');
      }

      const result = await response.json();
      console.log('Backend response:', result);
      setModal({ open: true, type: 'success', title: 'Updated', message: 'Opportunity updated successfully!', onClose: () => { setModal(m => ({ ...m, open: false })); navigate('/my-opportunities'); } });
    } catch (error) {
      console.error('Error updating opportunity:', error);
      setModal({ open: true, type: 'error', title: 'Update failed', message: error.message || 'Failed to update opportunity. Please try again.', onClose: () => setModal(m => ({ ...m, open: false })) });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Login Required</h2>
          <p className="text-gray-600 mb-6">You need to be logged in to edit opportunities.</p>
          <button
            onClick={() => navigate('/signin')}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  if (user && user.role !== 'organization') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-6">Only organizations can edit opportunities.</p>
          <button
            onClick={() => navigate('/opportunities')}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Browse Opportunities
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <LoadingSpinner size="xl" className="py-20" />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={fetchOpportunity} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Modal
        isOpen={modal.open}
        onClose={modal.onClose || (() => setModal(m => ({ ...m, open: false })))}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        primaryAction={{ label: 'OK', onClick: modal.onClose || (() => setModal(m => ({ ...m, open: false }))) }}
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Volunteer Opportunity</h1>
          <p className="text-gray-600">Update your volunteer opportunity details</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Basic Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Opportunity Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="e.g., Community Garden Maintenance"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time Commitment *
                </label>
                <select
                  name="timeCommitment"
                  value={formData.timeCommitment}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">Select time commitment</option>
                  {timeCommitmentOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Short Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Brief description that will appear in opportunity listings..."
              />
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Description *
              </label>
              <textarea
                name="fullDescription"
                value={formData.fullDescription}
                onChange={handleInputChange}
                required
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Detailed description including what volunteers will do, schedule details, etc..."
              />
            </div>
          </div>

          {/* Location and Schedule */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Location & Schedule</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location *
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    required
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="e.g., Bhrikutimandap, Kathmandu, Nepal"
                  />
                </div>
                <div className="mt-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      name="isRemote"
                      checked={formData.isRemote}
                      onChange={handleInputChange}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">This is a remote opportunity</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type="date"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleInputChange}
                      required
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type="date"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleInputChange}
                      required
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Volunteers Needed *
                  </label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type="number"
                      name="volunteersNeeded"
                      value={formData.volunteersNeeded}
                      onChange={handleInputChange}
                      required
                      min="1"
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="e.g., 5"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Application Deadline
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type="date"
                      name="applicationDeadline"
                      value={formData.applicationDeadline}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Requirements and Details */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Requirements & Details</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Requirements
                </label>
                <textarea
                  name="requirements"
                  value={formData.requirements}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="List any requirements, qualifications, or restrictions..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Age Requirement
                  </label>
                  <input
                    type="text"
                    name="ageRequirement"
                    value={formData.ageRequirement}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="e.g., 16+ (under 18 requires parent consent)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Accessibility
                  </label>
                  <input
                    type="text"
                    name="accessibility"
                    value={formData.accessibility}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="e.g., Wheelchair accessible"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Categories and Contact */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Categories & Contact</h2>
            
            <div className="space-y-6">
              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Categories *
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {availableTags.map(tag => (
                    <label key={tag} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.tags.includes(tag.toLowerCase())}
                        onChange={() => toggleTag(tag)}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-gray-700">{tag}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Custom Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Add Custom Categories (optional)
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={customTags}
                    onChange={(e) => setCustomTags(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomTag())}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="e.g., Environmental Conservation, Youth Education"
                  />
                  <button
                    type="button"
                    onClick={addCustomTag}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center space-x-1 px-3 py-1 bg-purple-100 text-purple-700 text-sm font-medium rounded-full"
                    >
                      <span>{tag}</span>
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="text-purple-500 hover:text-purple-700"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Email *
                  </label>
                  <input
                    type="email"
                    name="contactEmail"
                    value={formData.contactEmail}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="volunteer@organization.org"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    name="contactPhone"
                    value={formData.contactPhone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="(+977) 9XX-XXXXXXX"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Image URL (optional)
                </label>
                <input
                  type="url"
                  name="imageUrl"
                  value={formData.imageUrl}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/my-opportunities')}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Updating...' : 'Update Opportunity'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditOpportunityPage;
