import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Search, ArrowLeft, Heart } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.jsx';

const NotFoundPage = () => {
  const { user } = useAuth();
  
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center">
        {/* 404 Illustration */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-32 h-32 bg-indigo-100 rounded-full mb-6">
            <Heart className="h-16 w-16 text-indigo-600" />
          </div>
          <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-gray-700 mb-2">Page Not Found</h2>
          <p className="text-gray-600 mb-8">
            Oops! The page you're looking for doesn't exist. It might have been moved, deleted, or you entered the wrong URL.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <Link
            to="/"
            className="w-full inline-flex items-center justify-center px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Home className="h-5 w-5 mr-2" />
            Go to Homepage
          </Link>
          
          <Link
            to="/opportunities"
            className="w-full inline-flex items-center justify-center px-6 py-3 bg-white text-indigo-600 font-medium rounded-lg border border-indigo-600 hover:bg-indigo-50 transition-colors"
          >
            <Search className="h-5 w-5 mr-2" />
            Browse Opportunities
          </Link>
          
          <button
            onClick={() => window.history.back()}
            className="w-full inline-flex items-center justify-center px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Go Back
          </button>
        </div>

        {/* Help Text */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-blue-800 text-sm">
            <strong>Need help?</strong> If you think this is an error, please{' '}
            <Link to="/contact" className="underline hover:no-underline">
              contact our support team
            </Link>
            .
          </p>
        </div>

        {/* Popular Links */}
        <div className="mt-8">
          <h3 className="text-sm font-medium text-gray-900 mb-4">Popular Pages</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <Link
              to="/opportunities"
              className="text-indigo-600 hover:text-indigo-700 hover:underline"
            >
              Find Opportunities
            </Link>
            {user && user.role === 'organization' && (
              <Link
                to="/create-opportunity"
                className="text-indigo-600 hover:text-indigo-700 hover:underline"
              >
                Post Opportunity
              </Link>
            )}
            <Link
              to="/about"
              className="text-indigo-600 hover:text-indigo-700 hover:underline"
            >
              About Us
            </Link>
            <Link
              to="/contact"
              className="text-indigo-600 hover:text-indigo-700 hover:underline"
            >
              Contact
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;