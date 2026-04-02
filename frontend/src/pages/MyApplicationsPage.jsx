import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Clock, Eye, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import apiService from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';

const MyApplicationsPage = () => {
  const { isAuthenticated } = useAuth();
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchApplications = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiService.getMyApplications();
      setApplications(response.opportunities || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch applications');
      setApplications([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchApplications();
    }
  }, [isAuthenticated]);



  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };



  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please log in to view your applications</h2>
          <p className="text-gray-600">You need to be logged in to see your volunteer applications.</p>
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Applications</h1>
          <p className="text-gray-600">All volunteer opportunities you have applied to</p>
        </div>

        {/* Applications List */}
        {applications.length === 0 ? (
          <EmptyState
            type="applications"
            onAction={() => window.location.href = '/opportunities'}
            actionText="Find Opportunities"
          />
        ) : (
          <div className="space-y-6">
            {applications.map((opportunity) => (
              <div key={opportunity._id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900">
                          {opportunity.title}
                        </h3>
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium text-blue-700 bg-blue-100">
                          <span>Applied</span>
                        </span>
                      </div>
                      
                      <p className="text-indigo-600 font-medium mb-3">
                        {typeof opportunity.organization === 'object' 
                          ? opportunity.organization.name 
                          : opportunity.organizationName}
                      </p>
                      
                      <p className="text-gray-600 mb-4">{opportunity.description}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <span>{opportunity.location}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span>{opportunity.timeCommitment}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span>Starts {formatDate(opportunity.startDate)}</span>
                        </div>
                      </div>

                      {/* Tags */}
                      {opportunity.tags && opportunity.tags.length > 0 && (
                        <div className="mt-4">
                          <div className="flex flex-wrap gap-2">
                            {opportunity.tags.map((tag, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-medium rounded-full"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col items-end space-y-2 ml-6">
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <Users className="h-4 w-4" />
                        <span>{opportunity.volunteersNeeded} volunteers needed</span>
                      </div>
                      <Link
                        to={`/opportunities/${opportunity._id}`}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                      >
                        <Eye className="h-4 w-4" />
                        <span>View Details</span>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyApplicationsPage;