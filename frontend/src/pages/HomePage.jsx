import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Search, Plus, BookOpen, Eye, MapPin, Calendar } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.jsx';
import apiService from '../services/api';

const HomePage = () => {
  const { isAuthenticated, user } = useAuth();
  const [myApplications, setMyApplications] = useState([]);
  const [isLoadingApplications, setIsLoadingApplications] = useState(false);

  // Fetch user's applications for volunteers
  useEffect(() => {
    const fetchMyApplications = async () => {
      if (isAuthenticated && user?.role === 'volunteer') {
        try {
          setIsLoadingApplications(true);
          const response = await apiService.getMyApplications();
          setMyApplications(response.opportunities?.slice(0, 3) || []); // Show only first 3
        } catch (error) {
          console.error('Error fetching applications:', error);
          setMyApplications([]);
        } finally {
          setIsLoadingApplications(false);
        }
      }
    };

    fetchMyApplications();
  }, [isAuthenticated, user]);

  // Define features based on user role
  const getFeatures = () => {
    const baseFeatures = [
      {
        icon: Search,
        title: 'Find Opportunities',
        description: 'Discover volunteer opportunities that match your interests and skills.',
        link: '/opportunities'
      }
    ];

    // Add Create Opportunities for non-authenticated users and organizations
    if (!isAuthenticated || (user && user.role === 'organization')) {
      baseFeatures.push({
        icon: Plus,
        title: 'Create Opportunities',
        description: 'Organizations can post volunteer opportunities to find dedicated helpers.',
        link: '/create-opportunity'
      });
    }

    // Add Track Applications for authenticated users
    if (isAuthenticated) {
      baseFeatures.push({
        icon: BookOpen,
        title: 'Track Applications',
        description: 'Keep track of your volunteer applications and commitments.',
        link: '/my-applications'
      });
    }

    return baseFeatures;
  };

  const features = getFeatures();

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Make a Difference in Your
              <span className="block text-yellow-300">Community</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-gray-100 max-w-3xl mx-auto">
              Connect with meaningful volunteer opportunities and join thousands of people making a positive impact every day.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {/* Show Find Opportunities for non-authenticated users and volunteers */}
              {(!isAuthenticated || (user && user.role === 'volunteer')) && (
                <Link
                  to="/opportunities"
                  className="inline-flex items-center px-8 py-4 bg-white text-indigo-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors shadow-lg"
                >
                  Find Opportunities
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              )}
              {/* Show Post Opportunity only for organizations */}
              {isAuthenticated && user && user.role === 'organization' && (
                <Link
                  to="/create-opportunity"
                  className="inline-flex items-center px-8 py-4 bg-transparent border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-indigo-600 transition-colors"
                >
                  Post Opportunity
                  <Plus className="ml-2 h-5 w-5" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>



      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How VolunteerMe Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Whether you're looking to volunteer or need volunteers, we make it easy to connect and make an impact.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-100 rounded-lg mb-6">
                  <feature.icon className="h-6 w-6 text-indigo-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">{feature.title}</h3>
                <p className="text-gray-600 mb-6">{feature.description}</p>
                <Link
                  to={feature.link}
                  className="inline-flex items-center text-indigo-600 font-medium hover:text-indigo-700 transition-colors"
                >
                  Learn More
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* My Applications Section - Only for volunteers */}
      {isAuthenticated && user?.role === 'volunteer' && (
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                My Applications
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Track your volunteer applications and see the opportunities you've applied to.
              </p>
            </div>

            {isLoadingApplications ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                <p className="mt-4 text-gray-600">Loading your applications...</p>
              </div>
            ) : myApplications.length === 0 ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                  <BookOpen className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No applications yet</h3>
                <p className="text-gray-600 mb-6">Start exploring volunteer opportunities and apply to ones that interest you.</p>
                <Link
                  to="/opportunities"
                  className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Find Opportunities
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {myApplications.map((opportunity) => (
                  <div key={opportunity._id} className="bg-gray-50 rounded-xl p-6 border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                        {opportunity.title}
                      </h3>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-blue-700 bg-blue-100 ml-2">
                        Applied
                      </span>
                    </div>
                    
                    <p className="text-indigo-600 font-medium mb-3">
                      {typeof opportunity.organization === 'object' 
                        ? opportunity.organization.name 
                        : opportunity.organizationName}
                    </p>
                    
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {opportunity.description}
                    </p>
                    
                    <div className="space-y-2 text-sm text-gray-600 mb-4">
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span>{opportunity.location}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span>Starts {formatDate(opportunity.startDate)}</span>
                      </div>
                    </div>

                    {/* Tags */}
                    {opportunity.tags && opportunity.tags.length > 0 && (
                      <div className="mb-4">
                        <div className="flex flex-wrap gap-1">
                          {opportunity.tags.slice(0, 2).map((tag, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-medium rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                          {opportunity.tags.length > 2 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                              +{opportunity.tags.length - 2} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <Link
                      to={`/opportunities/${opportunity._id}`}
                      className="inline-flex items-center space-x-1 text-indigo-600 hover:text-indigo-700 font-medium text-sm"
                    >
                      <Eye className="h-4 w-4" />
                      <span>View Details</span>
                    </Link>
                  </div>
                ))}
              </div>
            )}

            {myApplications.length > 0 && (
              <div className="text-center">
                <Link
                  to="/my-applications"
                  className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  View All Applications
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>
            )}
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-20 bg-indigo-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Make a Difference?
          </h2>
          <p className="text-xl text-indigo-100 mb-8 max-w-2xl mx-auto">
            Join our community of volunteers and organizations working together to create positive change.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {/* Show Start Volunteering for non-authenticated users and volunteers */}
            {(!isAuthenticated || (user && user.role === 'volunteer')) && (
              <Link
                to="/opportunities"
                className="inline-flex items-center px-8 py-4 bg-white text-indigo-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
              >
                Start Volunteering
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            )}
            {/* Show Create Opportunity for organizations */}
            {user && user.role === 'organization' && (
              <Link
                to="/create-opportunity"
                className="inline-flex items-center px-8 py-4 bg-white text-indigo-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
              >
                Create Opportunity
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            )}
            <Link
              to="/about"
              className="inline-flex items-center px-8 py-4 bg-transparent border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-indigo-600 transition-colors"
            >
              Learn More About Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;