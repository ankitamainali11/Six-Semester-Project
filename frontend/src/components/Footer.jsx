import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.jsx';
import logo1 from '../assets/logo1.png';

const Footer = () => {
  const { isAuthenticated, user } = useAuth();
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex flex-col items-start space-y-1">
              <img src={logo1} alt="VolunteerMe Logo" className="h-10 w-auto" />
              <span className="text-xl font-bold text-green-200">VOLUNTEERME</span>
            </div>
            <p className="text-gray-300 text-sm">
              Connecting passionate volunteers with meaningful opportunities to make a difference in their communities.
            </p>
         </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-300 hover:text-white transition-colors">
                  Home
                </Link>
              </li>
              {/* Show Find Opportunities for non-authenticated users and volunteers */}
              {(!isAuthenticated || (user && user.role === 'volunteer')) && (
                <li>
                  <Link to="/opportunities" className="text-gray-300 hover:text-white transition-colors">
                    Find Opportunities
                  </Link>
                </li>
              )}
              {/* Show Post Opportunity only for organizations */}
              {isAuthenticated && user && user.role === 'organization' && (
                <li>
                  <Link to="/create-opportunity" className="text-gray-300 hover:text-white transition-colors">
                    Post Opportunity
                  </Link>
                </li>
              )}
              <li>
                <Link to="/about" className="text-gray-300 hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Support</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/contact" className="text-gray-300 hover:text-white transition-colors">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Info</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-indigo-400" />
                <span className="text-gray-300 text-sm">ankitamainli11@gmail.com</span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-indigo-400" />
                <span className="text-gray-300 text-sm">+977 9864101305</span>
              </div>
              <div className="flex items-center space-x-3">
                <MapPin className="h-5 w-5 text-indigo-400" />
                <span className="text-gray-300 text-sm">Santinagar, Kathmandu</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center">
          <p className="text-gray-400 text-sm">
            © 2025 VolunteerMe. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;