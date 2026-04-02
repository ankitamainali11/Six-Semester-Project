import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, User, LogOut, Plus, BookOpen, Mail } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.jsx';
import logo1 from '../assets/logo1.png';

const Header = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const navigationItems = [
    { path: '/', label: 'Home', icon: null },
    { path: '/opportunities', label: 'Opportunities', icon: null },
    { path: '/about', label: 'About', icon: null },
    { path: '/contact', label: 'Contact', icon: Mail },
  ];

  const userMenuItems = isAuthenticated ? [
    { path: '/profile', label: 'Profile', icon: User },
    { path: '/my-applications', label: 'My Applications', icon: BookOpen },
    { path: '/create-opportunity', label: 'Create Opportunity', icon: Plus },
  ] : [];

  // Filter navigation and user menu items based on user role
  let filteredNavigationItems = navigationItems;
  let filteredUserMenuItems = userMenuItems;
  if (isAuthenticated && user) {
    if (user.role === 'admin') {
      // Admins: show Admin Dashboard and keep My Applications; hide Create Opportunity
      filteredUserMenuItems = userMenuItems
        .filter(item => item.path !== '/create-opportunity')
        .concat([{ path: '/admin', label: 'Admin Dashboard', icon: BookOpen }]);
    } else if (user.role === 'volunteer') {
      // Volunteers: hide Saved and Create Opportunity, keep My Applications
      filteredUserMenuItems = userMenuItems.filter(item => 
        item.path !== '/saved' && 
        item.path !== '/create-opportunity'
      );
    } else if (user.role === 'organization') {
      // Organizations: hide Saved, show My Opportunities instead of My Applications
      filteredUserMenuItems = userMenuItems
        .filter(item => item.path !== '/saved')
        .map(item => 
          item.path === '/my-applications' 
            ? { ...item, path: '/my-opportunities', label: 'My Opportunities' }
            : item
        );
      filteredNavigationItems = navigationItems.filter(item => item.path !== '/opportunities');
    }
  }

  return (
    <>
      <header className="bg-white shadow-lg border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
              <img src={logo1} alt="VolunteerMe Logo" className="h-14 w-auto" />
              <span className="text-xl font-bold text-green-900">VOLUNTEERME</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-6">
              {filteredNavigationItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive(item.path)
                      ? 'text-indigo-600 bg-indigo-50'
                      : 'text-gray-700 hover:text-indigo-600 hover:bg-gray-50'
                  }`}
                >
                  {item.icon && <item.icon className="h-4 w-4" />}
                  <span>{item.label}</span>
                </Link>
              ))}

              {isAuthenticated ? (
                <div className="flex items-center space-x-4 ml-4 pl-4 border-l border-gray-200">
                  {filteredUserMenuItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive(item.path)
                          ? 'text-indigo-600 bg-indigo-50'
                          : 'text-gray-700 hover:text-indigo-600 hover:bg-gray-50'
                      }`}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  ))}
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-3 ml-4 pl-4 border-l border-gray-200">
                  <Link
                    to="/signin"
                    className="text-gray-700 hover:text-indigo-600 transition-colors font-medium"
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </nav>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden border-t border-gray-200 py-4 space-y-2">
              {navigationItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    isActive(item.path)
                      ? 'text-indigo-600 bg-indigo-50'
                      : 'text-gray-700 hover:text-indigo-600 hover:bg-gray-50'
                  }`}
                >
                  {item.icon && <item.icon className="h-5 w-5" />}
                  <span>{item.label}</span>
                </Link>
              ))}

              {isAuthenticated ? (
                <div className="pt-4 border-t border-gray-200 space-y-2">
                  {filteredUserMenuItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsMenuOpen(false)}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium transition-colors ${
                        isActive(item.path)
                          ? 'text-indigo-600 bg-indigo-50'
                          : 'text-gray-700 hover:text-indigo-600 hover:bg-gray-50'
                      }`}
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </Link>
                  ))}
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className="flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-red-600 hover:bg-red-50 transition-colors w-full text-left"
                  >
                    <LogOut className="h-5 w-5" />
                    <span>Logout</span>
                  </button>
                </div>
              ) : (
                <div className="pt-4 border-t border-gray-200 space-y-2">
                  <Link
                    to="/signin"
                    onClick={() => setIsMenuOpen(false)}
                    className="block w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-gray-50 rounded-md"
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => setIsMenuOpen(false)}
                    className="block w-full bg-indigo-600 text-white px-3 py-2 rounded-md hover:bg-indigo-700 text-base font-medium"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </header>
    </>
  );
};

export default Header;