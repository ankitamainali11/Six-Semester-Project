import React, { useState } from 'react';
import { Mail, Phone, MapPin, Clock, Send, MessageCircle, HelpCircle, Building } from 'lucide-react';
import apiService from '../services/api';
import Modal from '../components/Modal';

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    category: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modal, setModal] = useState({ open: false, type: 'info', title: '', message: '', onClose: null });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await apiService.sendContactMessage(formData);
      setModal({ open: true, type: 'success', title: 'Message sent', message: "We'll get back to you soon.", onClose: () => setModal(m => ({ ...m, open: false })) });
      setFormData({
        name: '',
        email: '',
        subject: '',
        category: '',
        message: ''
      });
    } catch (error) {
      setModal({ open: true, type: 'error', title: 'Send failed', message: 'Failed to send message. Please try again.', onClose: () => setModal(m => ({ ...m, open: false })) });
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactInfo = [
    {
      icon: Mail,
      title: 'Email Us',
      details: 'VolunterSystem@gmail.com',
      description: 'Send us an email and we\'ll respond within 24 hours'
    },
    {
      icon: Phone,
      title: 'Call Us',
      details: '+977 9864101305',
      description: 'Sunday to Friday, 9 AM to 6 PM'
    },
    {
      icon: MapPin,
      title: 'Visit Us',
      details: 'Santinagar, Kathmandu',
      description: 'Our office is open for scheduled appointments'
    },
    {
      icon: Clock,
      title: 'Business Hours',
      details: 'Sun - Fri: 9 AM - 6 PM',
    }
  ];

  const categories = [
    { value: 'general', label: 'General Inquiry' },
    { value: 'volunteer', label: 'Volunteer Support' },
    { value: 'organization', label: 'Organization Support' },
    { value: 'technical', label: 'Technical Issue' },
    { value: 'partnership', label: 'Partnership Opportunity' },
    { value: 'feedback', label: 'Feedback & Suggestions' }
  ];

  const faqs = [
    {
      question: 'How do I create a volunteer account?',
      answer: 'Click the "Sign Up" button in the top right corner and fill out the registration form. You\'ll be able to start browsing and applying for opportunities immediately.'
    },
    {
      question: 'Is there a fee to use VolunteerMe?',
      answer: 'No, VolunteerMe is completely free for volunteers. Organizations may have premium features available, but basic posting is also free.'
    },
    {
      question: 'How do I know if an organization is legitimate?',
      answer: 'We verify all organizations before they can post opportunities. Look for the verified badge and read reviews from other volunteers.'
    },
    {
      question: 'Can I volunteer remotely?',
      answer: 'Yes! Many organizations offer remote volunteer opportunities. Use the "Remote" filter when searching for opportunities.'
    }
  ];

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Contact Us</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Have questions or need help? We're here to support you on your volunteering journey.
          </p>
        </div>

        <div className="flex justify-center">
          {/* Contact Form - REMOVED */}
          {/* <div className="lg:col-span-2"> ...form code... </div> */}

          {/* Contact Information */}
          <div className="w-full max-w-md space-y-6">
            {/* Contact Details */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Get in Touch</h3>
              <div className="space-y-6">
                {contactInfo.map((info, index) => (
                  <div key={index} className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                        <info.icon className="h-5 w-5 text-indigo-600" />
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">{info.title}</h4>
                      <p className="text-gray-900 text-sm whitespace-pre-line mb-1">{info.details}</p>
                      <p className="text-gray-500 text-xs">{info.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Links</h3>
              <div className="space-y-3">
                <a
                  href="/opportunities"
                  className="flex items-center space-x-3 text-gray-700 hover:text-indigo-600 transition-colors"
                >
                  <HelpCircle className="h-4 w-4" />
                  <span>Browse Opportunities</span>
                </a>
                {/* Removed Post an Opportunity link */}
                <a
                  href="#"
                  className="flex items-center space-x-3 text-gray-700 hover:text-indigo-600 transition-colors"
                >
                  <HelpCircle className="h-4 w-4" />
                  <span>Help Center</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16">
          <div className="bg-white rounded-xl shadow-sm p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-8 text-center">
              Frequently Asked Questions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {faqs.map((faq, index) => (
                <div key={index} className="space-y-3">
                  <h3 className="font-semibold text-gray-900">{faq.question}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
