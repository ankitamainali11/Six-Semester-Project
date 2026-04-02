import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Calendar, Edit2, Save, X, ShieldCheck } from 'lucide-react';
import Modal from '../components/Modal';
import { useAuth } from '../hooks/useAuth.jsx';
import apiService from '../services/api';

const ProfilePage = () => {
  const { user, updateProfile, refreshUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [modal, setModal] = useState({ open: false, type: 'info', title: '', message: '', onClose: null });
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    location: user?.location || '',
    bio: user?.bio || '',
    skills: user?.skills || [],
    interests: user?.interests || [],
    availability: user?.availability || 'weekends'
  });

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      location: user?.location || '',
      bio: user?.bio || '',
      skills: Array.isArray(user?.skills) ? user.skills : prev.skills,
      interests: Array.isArray(user?.interests) ? user.interests : prev.interests,
      availability: user?.availability || prev.availability
    }));
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSkillsChange = (e) => {
    const skills = e.target.value.split(',').map(skill => skill.trim()).filter(Boolean);
    setFormData(prev => ({ ...prev, skills }));
  };

  const handleInterestsChange = (e) => {
    const interests = e.target.value.split(',').map(interest => interest.trim()).filter(Boolean);
    setFormData(prev => ({ ...prev, interests }));
  };

  const handleSave = async () => {
    try {
      const payload = {};
      if (formData.name !== user?.name) payload.name = formData.name;
      if (formData.email !== user?.email) payload.email = formData.email;
      if (formData.phone !== user?.phone) payload.phone = formData.phone;
      if (formData.location !== user?.location) payload.location = formData.location;
      if (formData.bio !== user?.bio) payload.bio = formData.bio;
      if (Array.isArray(formData.skills) && JSON.stringify(formData.skills) !== JSON.stringify(user?.skills || [])) {
        payload.skills = formData.skills;
      }
      if (Array.isArray(formData.interests) && JSON.stringify(formData.interests) !== JSON.stringify(user?.interests || [])) {
        payload.interests = formData.interests;
      }
      if ((formData.availability || '') !== (user?.availability || '')) payload.availability = formData.availability;

      const res = await updateProfile(payload);
      if (res && res.user) {
        setFormData(prev => ({
          ...prev,
          phone: res.user.phone || '',
          location: res.user.location || '',
          bio: res.user.bio || '',
          skills: Array.isArray(res.user.skills) ? res.user.skills : prev.skills,
          interests: Array.isArray(res.user.interests) ? res.user.interests : prev.interests,
          availability: res.user.availability || prev.availability,
        }));
      }
      setIsEditing(false);
      setModal({ open: true, type: 'success', title: 'Profile updated', message: 'Your profile has been updated successfully.', onClose: () => setModal(m => ({ ...m, open: false })) });
    } catch (error) {
      setModal({ open: true, type: 'error', title: 'Update failed', message: 'Failed to update profile. Please try again.', onClose: () => setModal(m => ({ ...m, open: false })) });
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      location: user?.location || '',
      bio: user?.bio || '',
      skills: user?.skills || [],
      interests: user?.interests || [],
      availability: user?.availability || 'weekends'
    });
  };

  // Email verification section
  const [verifyCode, setVerifyCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState('');
  const [verifySuccess, setVerifySuccess] = useState('');

  const handleVerify = async () => {
    setVerifyError('');
    setVerifySuccess('');
    if (!verifyCode.trim()) {
      setVerifyError('Enter the 6-digit code');
      return;
    }
    setVerifying(true);
    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user?.email, code: verifyCode.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Verification failed');
      setVerifySuccess('Email verified successfully');
      await refreshUser();
    } catch (e) {
      setVerifyError(e.message || 'Verification failed');
    } finally {
      setVerifying(false);
    }
  };



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
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center">
                <User className="h-10 w-10 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{formData.name}</h1>
                <p className="text-gray-600">{formData.email}</p>
                <p className="text-sm text-gray-500">Member since {new Date(user?.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Edit2 className="h-4 w-4" />
              <span>{isEditing ? 'Cancel' : 'Edit Profile'}</span>
            </button>
          </div>
        </div>

        <div className="space-y-8">
          {/* Main Profile Info */}
          <div className="space-y-8">
            {/* Personal Information */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Personal Information</h2>
              
              {isEditing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Location
                      </label>
                      <input
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleInputChange}
                        placeholder="City, State"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bio
                    </label>
                    <textarea
                      name="bio"
                      value={formData.bio}
                      onChange={handleInputChange}
                      rows={4}
                      placeholder="Tell us about yourself and your volunteer interests..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>

                  <div className="flex space-x-4">
                    <button
                      onClick={handleSave}
                      className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Save className="h-4 w-4" />
                      <span>Save Changes</span>
                    </button>
                    <button
                      onClick={handleCancel}
                      className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      <X className="h-4 w-4" />
                      <span>Cancel</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center space-x-3">
                      <Mail className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="font-medium text-gray-900">{formData.email || 'Not provided'}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Phone className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Phone</p>
                        <p className="font-medium text-gray-900">{formData.phone || 'Not provided'}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <MapPin className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Location</p>
                      <p className="font-medium text-gray-900">{formData.location || 'Not provided'}</p>
                    </div>
                  </div>

                  {formData.bio && (
                    <div>
                      <p className="text-sm text-gray-500 mb-2">Bio</p>
                      <p className="text-gray-700">{formData.bio}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Skills and Interests */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Skills & Interests</h2>
              
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Skills (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={formData.skills.join(', ')}
                      onChange={handleSkillsChange}
                      placeholder="e.g., Teaching, Gardening, Event Planning"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Interests (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={formData.interests.join(', ')}
                      onChange={handleInterestsChange}
                      placeholder="e.g., Education, Environment, Animal Welfare"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Availability
                    </label>
                    <select
                      name="availability"
                      value={formData.availability}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="weekends">Weekends only</option>
                      <option value="weekdays">Weekdays only</option>
                      <option value="flexible">Flexible schedule</option>
                      <option value="evenings">Evenings only</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Skills</h3>
                    {formData.skills.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {formData.skills.map((skill, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500">No skills added yet</p>
                    )}
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Interests</h3>
                    {formData.interests.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {formData.interests.map((interest, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full"
                          >
                            {interest}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500">No interests added yet</p>
                    )}
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Availability</h3>
                    <p className="text-gray-900 capitalize">{formData.availability.replace('-', ' ')}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Email Verification (if not verified) */}
          {user && user.isVerified === false && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-amber-500" /> Email Verification
              </h2>
              <p className="text-sm text-gray-600 mb-3">Enter the 6-digit code sent to {user.email} to verify your account.</p>
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value)}
                  className="w-40 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="123456"
                />
                <button
                  onClick={handleVerify}
                  disabled={verifying}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {verifying ? 'Verifying...' : 'Verify'}
                </button>
              </div>
              {verifyError && <p className="text-sm text-red-600">{verifyError}</p>}
              {verifySuccess && <p className="text-sm text-green-600">{verifySuccess}</p>}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default ProfilePage;