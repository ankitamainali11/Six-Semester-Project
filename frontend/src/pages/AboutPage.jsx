import React from 'react';
import { Heart, CheckCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';

const AboutPage = () => {
  const { user } = useAuth();

  const values = [
    {
      title: 'Community First',
      description: 'We believe in the power of community and the impact that comes from people working together toward common goals.'
    },
    {
      title: 'Accessibility',
      description: 'Volunteering should be accessible to everyone. We work to remove barriers and create inclusive opportunities.'
    },
    {
      title: 'Impact Driven',
      description: 'Every volunteer hour matters. We focus on creating meaningful opportunities that make a real difference.'
    },
    {
      title: 'Trust & Safety',
      description: 'We maintain high standards for safety and verification to ensure positive experiences for all users.'
    }
  ];

  const features = [
    'Easy opportunity discovery.',
    'Track your volunteer history.',
    'Find opportunities that fit your skills and passions.',
    'Choose when, where, and how you want to volunteer.',
    
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              About VolunteerMe
            </h1>
            <p className="text-xl md:text-2xl text-gray-100 max-w-3xl mx-auto">
              We're on a mission to connect passionate volunteers with meaningful opportunities, 
              creating stronger communities one volunteer at a time.
            </p>
          </div>
        </div>
      </section>



      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-1 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Our Mission
              </h2>
              <p className="text-lg text-gray-700 mb-6">
                VolunteerMe was founded on the belief that everyone has something valuable to contribute to their community. 
                We created this platform to break down the barriers between willing volunteers and organizations that need help.
              </p>
              <p className="text-lg text-gray-700 mb-8">
                Whether you're looking to gain new skills, meet like-minded people, or simply give back, 
                we make it easy to find opportunities that match your interests, schedule, and location.
              </p>
              <Link
                to="/opportunities"
                className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Start Volunteering
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Our Values
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              These core values guide everything we do and shape how we build our platform and community.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {values.map((value, index) => (
              <div key={index} className="bg-gray-50 rounded-xl p-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">{value.title}</h3>
                <p className="text-gray-700">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-1 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Why Choose VolunteerMe?
              </h2>
              <p className="text-lg text-gray-700 mb-8">
                We've built a comprehensive platform that makes volunteering accessible, 
                safe, and rewarding for everyone involved.
              </p>
              <div className="space-y-4">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-indigo-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Make a Difference?
          </h2>
          <p className="text-xl text-indigo-100 mb-8 max-w-2xl mx-auto">
            Join thousands of volunteers who are already making an impact in their communities.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/opportunities"
              className="inline-flex items-center px-8 py-4 bg-white text-indigo-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
            >
              Find Opportunities
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            {user && user.role === 'organization' && (
              <Link
                to="/create-opportunity"
                className="inline-flex items-center px-8 py-4 bg-transparent border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-indigo-600 transition-colors"
              >
                Post an Opportunity
              </Link>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;