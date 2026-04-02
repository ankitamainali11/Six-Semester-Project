import React, { useState, useEffect } from 'react';
import { Grid, List, Heart } from 'lucide-react';
import OpportunityCard from '../components/OpportunityCard';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { useSavedOpportunities } from '../hooks/useSavedOpportunities';
import { useAuth } from '../hooks/useAuth.jsx';
import apiService from '../services/api';
import Modal from '../components/Modal';

const SavedOpportunitiesPage = () => {
  const { isAuthenticated, user } = useAuth();
  const { savedOpportunities, toggleSaveOpportunity, isOpportunitySaved } = useSavedOpportunities();
  const [viewMode, setViewMode] = useState('grid');
  const [savedOpportunityDetails, setSavedOpportunityDetails] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState({ open: false, type: 'info', title: '', message: '', onClose: null });

  const fetchSavedOpportunityDetails = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiService.getSavedOpportunities();
      setSavedOpportunityDetails(response.savedOpportunities || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch saved opportunities');
      setSavedOpportunityDetails([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchSavedOpportunityDetails();
    }
  }, [isAuthenticated]);

  const handleApply = async (opportunityId) => {
    if (!isAuthenticated) {
      setModal({ open: true, type: 'info', title: 'Sign in required', message: 'Please log in to apply for opportunities', onClose: () => setModal(m => ({ ...m, open: false })) });
      return;
    }

    if (user?.role === 'organization') {
      setModal({ open: true, type: 'warning', title: 'Not allowed', message: 'Organizations cannot apply to opportunities', onClose: () => setModal(m => ({ ...m, open: false })) });
      return;
    }

    if (user?.isVerified === false) {
      setModal({ open: true, type: 'warning', title: 'Email verification required', message: 'Please verify your email before applying to opportunities.', onClose: () => setModal(m => ({ ...m, open: false })) });
      return;
    }

    try {
      await apiService.applyToOpportunity(opportunityId);
      setModal({ open: true, type: 'success', title: 'Application submitted', message: 'Your application was submitted successfully.', onClose: () => setModal(m => ({ ...m, open: false })) });
    } catch (error) {
      setModal({ open: true, type: 'error', title: 'Submission failed', message: 'Failed to submit application. Please try again.', onClose: () => setModal(m => ({ ...m, open: false })) });
    }
  };

  const handleUnsave = async (opportunityId) => {
    try {
      await toggleSaveOpportunity(opportunityId);
      // Refresh the saved opportunities list
      fetchSavedOpportunityDetails();
    } catch (error) {
      setModal({ open: true, type: 'error', title: 'Action failed', message: 'Failed to remove from saved. Please try again.', onClose: () => setModal(m => ({ ...m, open: false })) });
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please log in to view saved opportunities</h2>
          <p className="text-gray-600">You need to be logged in to see your saved opportunities.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  return (
    <>
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Saved Opportunities</h1>
            <p className="text-gray-600">Keep track of volunteer opportunities you're interested in</p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg ${
                viewMode === 'grid' 
                  ? 'bg-indigo-100 text-indigo-600' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Grid className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg ${
                viewMode === 'list' 
                  ? 'bg-indigo-100 text-indigo-600' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <List className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-600">
            {savedOpportunityDetails.length} saved {savedOpportunityDetails.length === 1 ? 'opportunity' : 'opportunities'}
          </p>
        </div>

        {/* Content */}
        {savedOpportunityDetails.length === 0 ? (
          <EmptyState 
            type="saved" 
            onAction={() => window.location.href = '/opportunities'}
            actionText="Browse Opportunities"
          />
        ) : (
          <div className={
            viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'
              : 'space-y-6'
          }>
            {savedOpportunityDetails.map((opportunity) => (
              <div key={opportunity._id} className="relative">
                <OpportunityCard
                  opportunity={opportunity}
                  onApply={handleApply}
                  onSave={handleUnsave}
                  isSaved={true}
                />
                
                {/* Saved indicator */}
                <div className="absolute top-4 left-4 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1">
                  <Heart className="h-3 w-3 fill-current" />
                  <span>Saved</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tips for saved opportunities */}
        {savedOpportunityDetails.length > 0 && (
          <div className="mt-12 bg-indigo-50 rounded-xl p-6 border border-indigo-200">
            <h3 className="text-lg font-semibold text-indigo-900 mb-3">💡 Tips for Managing Saved Opportunities</h3>
            <ul className="space-y-2 text-indigo-800">
              <li>• Review your saved opportunities regularly to stay updated on application deadlines</li>
              <li>• Apply early to increase your chances of being selected</li>
              <li>• Remove opportunities you're no longer interested in to keep your list organized</li>
              <li>• Set up notifications to get alerts about similar opportunities</li>
            </ul>
          </div>
        )}
      </div>
    </div>
    <Modal
      isOpen={modal.open}
      onClose={modal.onClose || (() => setModal(m => ({ ...m, open: false })))}
      title={modal.title}
      message={modal.message}
      type={modal.type}
      primaryAction={{ label: 'OK', onClick: modal.onClose || (() => setModal(m => ({ ...m, open: false }))) }}
    />
    </>
  );
};

export default SavedOpportunitiesPage;