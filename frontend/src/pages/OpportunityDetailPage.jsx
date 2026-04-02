import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Calendar, Clock, Users, Mail, Phone, Globe, Check } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.jsx';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import apiService from '../services/api';
import Modal from '../components/Modal';

const OpportunityDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [opportunity, setOpportunity] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasApplied, setHasApplied] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [modal, setModal] = useState({ open: false, type: 'info', title: '', message: '', onClose: null });

  useEffect(() => {
    if (id) {
      fetchOpportunity();
    }
  }, [id]);

  const fetchOpportunity = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`/api/opportunities/${id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch opportunity');
      }
      
      const data = await response.json();
      setOpportunity(data);
      
      // Check if user has applied to this opportunity
      if (isAuthenticated && user) {
        checkIfApplied(data._id);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch opportunity');
    } finally {
      setIsLoading(false);
    }
  };



  const checkIfApplied = async (opportunityId) => {
    try {
      const response = await fetch('/api/opportunities/my-applications', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const appliedIds = data.opportunities?.map(opp => opp._id) || [];
        setHasApplied(appliedIds.includes(opportunityId));
      }
    } catch (err) {
      console.error('Error checking application status:', err);
    }
  };



  const handleApply = async () => {
    if (!isAuthenticated) {
      setModal({ open: true, type: 'info', title: 'Sign in required', message: 'Please sign in to apply.', onClose: () => { setModal(m => ({ ...m, open: false })); navigate('/signin'); } });
      return;
    }
    
    if (user.role !== 'volunteer' && user.role !== 'admin') {
      setModal({ open: true, type: 'warning', title: 'Not allowed', message: 'Only volunteers or admins can apply to opportunities', onClose: () => setModal(m => ({ ...m, open: false })) });
      return;
    }

    if (user.isVerified === false) {
      setModal({ open: true, type: 'warning', title: 'Email verification required', message: 'Please verify your email before applying to opportunities.', onClose: () => setModal(m => ({ ...m, open: false })) });
      return;
    }

    if (hasApplied) {
      return; // Already applied, button should be disabled
    }

    try {
      setIsApplying(true);
      await apiService.applyToOpportunity(opportunity._id);
      setHasApplied(true);
      setModal({ open: true, type: 'success', title: 'Application submitted', message: 'Your application was submitted successfully.', onClose: () => setModal(m => ({ ...m, open: false })) });
    } catch (error) {
      console.error('Error applying to opportunity:', error);
      setModal({ open: true, type: 'error', title: 'Submission failed', message: 'Failed to submit application. Please try again.', onClose: () => setModal(m => ({ ...m, open: false })) });
    } finally {
      setIsApplying(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return <LoadingSpinner size="xl" className="py-20" />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={fetchOpportunity} />;
  }

  if (!opportunity) {
    return <ErrorMessage message="Opportunity not found" />;
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
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {opportunity.title}
              </h1>
              <p className="text-lg text-gray-600 mb-4">
                {opportunity.description}
              </p>
              
              {/* Organization Info */}
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span className="font-medium text-indigo-600">
                  {typeof opportunity.organization === 'object' 
                    ? opportunity.organization.name 
                    : opportunity.organization}
                </span>
                {opportunity.isRemote && (
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                    Remote
                  </span>
                )}
              </div>
            </div>
            

          </div>

          {/* Quick Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="flex items-center text-sm text-gray-600">
              <MapPin className="h-4 w-4 mr-2 text-gray-400" />
              <span>{opportunity.location}</span>
            </div>
            
            <div className="flex items-center text-sm text-gray-600">
              <Clock className="h-4 w-4 mr-2 text-gray-400" />
              <span>{opportunity.timeCommitment}</span>
            </div>
            
            <div className="flex items-center text-sm text-gray-600">
              <Users className="h-4 w-4 mr-2 text-gray-400" />
              <span>{opportunity.volunteersNeeded} volunteers needed</span>
            </div>
            
            <div className="flex items-center text-sm text-gray-600">
              <Calendar className="h-4 w-4 mr-2 text-gray-400" />
              <span>
                {formatDate(opportunity.startDate)} - {formatDate(opportunity.endDate)}
              </span>
            </div>
            {opportunity.imageUrl && (
              <div className="ml-6 w-40 h-28 rounded-lg overflow-hidden flex-shrink-0 hidden sm:block">
                <img
                  src={opportunity.imageUrl}
                  alt={opportunity.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>

          {/* Apply Button */}
          {isAuthenticated && (user?.role === 'volunteer' || user?.role === 'admin') && (
            <div className="flex justify-center">
              <button
                onClick={handleApply}
                disabled={hasApplied || isApplying}
                className={`px-8 py-3 rounded-lg transition-colors font-medium text-lg flex items-center gap-2 ${
                  hasApplied
                    ? 'bg-green-600 text-white cursor-not-allowed'
                    : isApplying
                    ? 'bg-indigo-400 text-white cursor-not-allowed'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                {hasApplied ? (
                  <>
                    <Check className="h-5 w-5" />
                    Applied
                  </>
                ) : isApplying ? (
                  'Applying...'
                ) : (
                  'Apply Now'
                )}
              </button>
            </div>
          )}
        </div>

        {/* Full Description */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">About This Opportunity</h2>
          <div className="prose max-w-none text-gray-700">
            <p className="whitespace-pre-wrap">{opportunity.fullDescription}</p>
          </div>
        </div>

        {/* Requirements and Details */}
        {(opportunity.requirements || opportunity.ageRequirement || opportunity.accessibility) && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Requirements & Details</h2>
            
            {opportunity.requirements && (
              <div className="mb-4">
                <h3 className="font-medium text-gray-900 mb-2">Requirements</h3>
                <p className="text-gray-700">{opportunity.requirements}</p>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {opportunity.ageRequirement && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Age Requirement</h3>
                  <p className="text-gray-700">{opportunity.ageRequirement}</p>
                </div>
              )}
              
              {opportunity.accessibility && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Accessibility</h3>
                  <p className="text-gray-700">{opportunity.accessibility}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Categories */}
        {opportunity.tags && opportunity.tags.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Categories</h2>
            <div className="flex flex-wrap gap-2">
              {opportunity.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-indigo-100 text-indigo-700 text-sm font-medium rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Contact Information */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {opportunity.contactEmail && (
              <div className="flex items-center text-gray-700">
                <Mail className="h-5 w-5 mr-3 text-gray-400" />
                <a 
                  href={`mailto:${opportunity.contactEmail}`}
                  className="text-indigo-600 hover:text-indigo-800"
                >
                  {opportunity.contactEmail}
                </a>
              </div>
            )}
            
            {opportunity.contactPhone && (
              <div className="flex items-center text-gray-700">
                <Phone className="h-5 w-5 mr-3 text-gray-400" />
                <a 
                  href={`tel:${opportunity.contactPhone}`}
                  className="text-indigo-600 hover:text-indigo-800"
                >
                  {opportunity.contactPhone}
                </a>
              </div>
            )}
            
            {opportunity.imageUrl && (
              <div className="flex items-center text-gray-700">
                <Globe className="h-5 w-5 mr-3 text-gray-400" />
                <a 
                  href={opportunity.imageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:text-indigo-800"
                >
                  View Image
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Application Deadline */}
        {opportunity.applicationDeadline && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Application Deadline</h2>
            <p className="text-gray-700">
              Applications close on <span className="font-medium">{formatDate(opportunity.applicationDeadline)}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OpportunityDetailPage;