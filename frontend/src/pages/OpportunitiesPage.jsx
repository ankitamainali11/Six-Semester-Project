import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, Grid, List } from 'lucide-react';
import FilterSidebar from '../components/FilterSidebar';
import OpportunityCard from '../components/OpportunityCard';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import { useOpportunities } from '../hooks/useOpportunities';
import { useAuth } from '../hooks/useAuth.jsx';
import apiService from '../services/api';

const OpportunitiesPage = () => {
  const [searchParams] = useSearchParams();
  const { isAuthenticated, user } = useAuth();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [appliedOpportunities, setAppliedOpportunities] = useState(new Set());
  const [applyingTo, setApplyingTo] = useState(null);
  const [modal, setModal] = useState({ open: false, type: 'info', title: '', message: '', onClose: null });
  const showFilters = false; // Hide filters in UI (keep logic for future implementation)

  const [section, setSection] = useState('all'); // 'all' | 'recommended'
  const [recommended, setRecommended] = useState([]);
  const [isLoadingRecommended, setIsLoadingRecommended] = useState(false);
  const [recommendedError, setRecommendedError] = useState(null);
  const SHOW_SIMILARITY_SCORE = true; // Set to false to hide similarity score badges

  // Get initial search query from URL params
  const initialSearch = searchParams.get('search') || '';
  const { opportunities, isLoading, error, updateFilters, applyToOpportunity, refetch } = useOpportunities({
    search: initialSearch
  });

  // Load user's applied opportunities
  useEffect(() => {
    const loadAppliedOpportunities = async () => {
      if (isAuthenticated) {
        try {
          const response = await apiService.getMyApplications();
          const appliedIds = response.opportunities?.map(opp => opp._id) || [];
          setAppliedOpportunities(new Set(appliedIds));
        } catch (error) {
          console.error('Error loading applied opportunities:', error);
        }
      }
    };

    loadAppliedOpportunities();
  }, [isAuthenticated]);

  // Load recommended when section toggled to 'recommended'
  useEffect(() => {
    const loadRecommended = async () => {
      if (section !== 'recommended' || !isAuthenticated) return;
      try {
        setIsLoadingRecommended(true);
        setRecommendedError(null);
        const data = await apiService.getRecommendedOpportunities();
        const recs = Array.isArray(data)
          ? data
          : (data.opportunities || data.recommendations || data.data || []);
        recs.sort((a, b) => (b.score || 0) - (a.score || 0));
        setRecommended(recs);
      } catch (e) {
        setRecommendedError(e.message || 'Failed to load recommendations');
        setRecommended([]);
      } finally {
        setIsLoadingRecommended(false);
      }
    };
    loadRecommended();
  }, [section, isAuthenticated]);

  // Mock available tags
  const availableTags = [
    'Education', 'Environment', 'Healthcare', 'Community Service',
    'Animal Welfare', 'Disaster Relief', 'Youth Programs', 'Senior Care',
    'Food Security', 'Technology', 'Arts & Culture', 'Sports & Recreation'
  ];

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

    if (appliedOpportunities.has(opportunityId)) {
      return; // Already applied
    }

    try {
      setApplyingTo(opportunityId);
      await applyToOpportunity(opportunityId);
      setAppliedOpportunities(prev => new Set([...prev, opportunityId]));
      setModal({ open: true, type: 'success', title: 'Application submitted', message: 'Your application was submitted successfully.', onClose: () => setModal(m => ({ ...m, open: false })) });
    } catch (error) {
      setModal({ open: true, type: 'error', title: 'Submission failed', message: 'Failed to submit application. Please try again.', onClose: () => setModal(m => ({ ...m, open: false })) });
    } finally {
      setApplyingTo(null);
    }
  };

  const renderCards = (items, withScore = false) => (
    <div className={
      viewMode === 'grid' 
        ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'
        : 'space-y-6'
    }>
      {items.map((opportunity) => (
        <OpportunityCard
          key={opportunity._id}
          opportunity={opportunity}
          onApply={handleApply}
          hasApplied={appliedOpportunities.has(opportunity._id)}
          isApplying={applyingTo === opportunity._id}
          score={withScore ? opportunity.score : undefined}
        />
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Modal
        isOpen={modal.open}
        onClose={modal.onClose || (() => setModal(m => ({ ...m, open: false })))}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        primaryAction={{ label: 'OK', onClick: modal.onClose || (() => setModal(m => ({ ...m, open: false }))) }}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Opportunities</h1>
          {/* Simple section switch */}
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-1">
            <button
              onClick={() => setSection('all')}
              className={`px-3 py-1.5 text-sm rounded-md ${section === 'all' ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
            >
              All Opportunities
            </button>
            <button
              onClick={() => setSection('recommended')}
              className={`px-3 py-1.5 text-sm rounded-md ${section === 'recommended' ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
            >
              Recommended
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar (hidden) */}
          {showFilters && (
            <div className="lg:w-80 flex-shrink-0">
              <FilterSidebar
                isOpen={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
                onFilterChange={updateFilters}
                availableTags={availableTags}
              />
            </div>
          )}

          {/* Main Content */}
          <div className="flex-1">
            {/* Header Controls for view mode */}
            <div className="flex items-center justify-between mb-6">
              <div />
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
            {section === 'all' && !isLoading && !error && (
              <div className="mb-6">
                <p className="text-gray-600">
                  {opportunities.length} {opportunities.length === 1 ? 'opportunity' : 'opportunities'} found
                </p>
              </div>
            )}

            {/* Content */}
            {section === 'all' ? (
              isLoading ? (
                <LoadingSpinner size="xl" className="py-20" />
              ) : error ? (
                <ErrorMessage message={error} onRetry={refetch} />
              ) : opportunities.length === 0 ? (
                <EmptyState 
                  type="search" 
                  onAction={() => updateFilters({})}
                />
              ) : (
                renderCards(opportunities)
              )
            ) : (
              !isAuthenticated ? (
                <div className="bg-white rounded-xl p-8 border border-gray-200 text-center">
                  <p className="text-gray-700 mb-4">Please sign in to view personalized recommendations.</p>
                  <a href="/signin" className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg">Sign in</a>
                </div>
              ) : isLoadingRecommended ? (
                <LoadingSpinner size="xl" className="py-20" />
              ) : recommendedError ? (
                <ErrorMessage message={recommendedError} onRetry={() => setSection('recommended')} />
              ) : recommended.length === 0 ? (
                <div className="bg-white rounded-xl p-8 border border-gray-200 text-center">
                  <p className="text-gray-700">No recommendations yet. Try adding interests or applying to opportunities.</p>
                </div>
              ) : (
                renderCards(recommended, SHOW_SIMILARITY_SCORE)
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OpportunitiesPage;