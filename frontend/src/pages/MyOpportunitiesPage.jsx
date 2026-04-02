import React, { useState, useEffect } from 'react';
import { Edit, Trash2, Eye, Users, Calendar, MapPin, Clock, ChevronDown, ChevronUp, Mail, Phone, Check, X, CheckCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.jsx';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import apiService from '../services/api';

const MyOpportunitiesPage = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [opportunities, setOpportunities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState({}); // opportunityId => boolean
  const [applicantsByOpp, setApplicantsByOpp] = useState({}); // opportunityId => { applicants: [], approvedVolunteers: [] }
  const [processing, setProcessing] = useState({}); // opportunityId_userId => boolean
  const [modal, setModal] = useState({ open: false, type: 'info', title: '', message: '', onClose: null });
  const [confirm, setConfirm] = useState({ open: false, title: '', message: '', onConfirm: null, onCancel: null });

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchMyOpportunities();
    }
  }, [isAuthenticated, user]);

  const fetchMyOpportunities = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/opportunities/my', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch opportunities');
      }

      const data = await response.json();
      setOpportunities(data.opportunities || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch opportunities');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (opportunityId) => {
    navigate(`/edit-opportunity/${opportunityId}`);
  };

  const handleDelete = (opportunityId) => {
    setConfirm({
      open: true,
      title: 'Delete opportunity',
      message: 'Are you sure you want to delete this opportunity? This action cannot be undone.',
      onConfirm: async () => {
        setConfirm(c => ({ ...c, open: false }));
        try {
          const response = await fetch(`/api/opportunities/${opportunityId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });

          if (!response.ok) {
            throw new Error('Failed to delete opportunity');
          }

          setOpportunities(prev => prev.filter(opp => opp._id !== opportunityId));
          setModal({ open: true, type: 'success', title: 'Deleted', message: 'Opportunity deleted successfully.', onClose: () => setModal(m => ({ ...m, open: false })) });
        } catch (err) {
          setModal({ open: true, type: 'error', title: 'Delete failed', message: err.message || 'Failed to delete opportunity.', onClose: () => setModal(m => ({ ...m, open: false })) });
        }
      },
      onCancel: () => setConfirm(c => ({ ...c, open: false }))
    });
  };

  const handleView = (opportunityId) => {
    navigate(`/opportunities/${opportunityId}`);
  };

  const toggleApplicants = async (opportunityId) => {
    setExpanded(prev => ({ ...prev, [opportunityId]: !prev[opportunityId] }));
    // Load applicants on first expand
    if (!applicantsByOpp[opportunityId]) {
      try {
        const data = await apiService.getApplicants(opportunityId);
        setApplicantsByOpp(prev => ({ 
          ...prev, 
          [opportunityId]: {
            applicants: data.applicants || [],
            approvedVolunteers: data.approvedVolunteers || []
          }
        }));
      } catch (e) {
        setModal({ 
          open: true, 
          type: 'error', 
          title: 'Failed to load applicants', 
          message: e.message || 'Failed to load applicants', 
          onClose: () => setModal(m => ({ ...m, open: false })) 
        });
      }
    }
  };

  const handleApprove = async (opportunityId, userId, userName) => {
    const key = `${opportunityId}_${userId}`;
    try {
      setProcessing(prev => ({ ...prev, [key]: true }));
      await apiService.approveApplicant(opportunityId, userId);
      
      // Update local state
      setApplicantsByOpp(prev => {
        const current = prev[opportunityId] || { applicants: [], approvedVolunteers: [] };
        const approvedIds = current.approvedVolunteers.map(v => v._id || v.id);
        const applicant = current.applicants.find(a => (a._id || a.id) === userId);
        
        return {
          ...prev,
          [opportunityId]: {
            applicants: current.applicants.filter(a => (a._id || a.id) !== userId),
            approvedVolunteers: approvedIds.includes(userId) 
              ? current.approvedVolunteers 
              : [...current.approvedVolunteers, applicant].filter(Boolean)
          }
        };
      });
      
      setModal({ 
        open: true, 
        type: 'success', 
        title: 'Approved', 
        message: `${userName || 'Applicant'} has been approved and notified by email.`, 
        onClose: () => setModal(m => ({ ...m, open: false })) 
      });
    } catch (error) {
      setModal({ 
        open: true, 
        type: 'error', 
        title: 'Approval failed', 
        message: error.message || 'Failed to approve applicant.', 
        onClose: () => setModal(m => ({ ...m, open: false })) 
      });
    } finally {
      setProcessing(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleReject = async (opportunityId, userId, userName) => {
    const key = `${opportunityId}_${userId}`;
    try {
      setProcessing(prev => ({ ...prev, [key]: true }));
      await apiService.rejectApplicant(opportunityId, userId);
      
      // Update local state - remove from both applicants and approvedVolunteers
      setApplicantsByOpp(prev => {
        const current = prev[opportunityId] || { applicants: [], approvedVolunteers: [] };
        return {
          ...prev,
          [opportunityId]: {
            applicants: current.applicants.filter(a => (a._id || a.id) !== userId),
            approvedVolunteers: current.approvedVolunteers.filter(a => (a._id || a.id) !== userId)
          }
        };
      });
      
      setModal({ 
        open: true, 
        type: 'success', 
        title: 'Rejected', 
        message: `${userName || 'Applicant'} has been rejected and removed from the application list.`, 
        onClose: () => setModal(m => ({ ...m, open: false })) 
      });
    } catch (error) {
      setModal({ 
        open: true, 
        type: 'error', 
        title: 'Rejection failed', 
        message: error.message || 'Failed to reject applicant.', 
        onClose: () => setModal(m => ({ ...m, open: false })) 
      });
    } finally {
      setProcessing(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleMarkAttendance = async (opportunityId, userId, userName) => {
    const key = `${opportunityId}_${userId}_attendance`;
    try {
      setProcessing(prev => ({ ...prev, [key]: true }));
      await apiService.markAsCompleted(opportunityId, userId);
      
      // Update local state to mark as completed
      setApplicantsByOpp(prev => {
        const current = prev[opportunityId] || { applicants: [], approvedVolunteers: [] };
        return {
          ...prev,
          [opportunityId]: {
            applicants: current.applicants,
            approvedVolunteers: current.approvedVolunteers.map(vol => {
              const volId = vol._id || vol.id;
              if (volId === userId) {
                return { ...vol, isCompleted: true };
              }
              return vol;
            })
          }
        };
      });
      
      setModal({ 
        open: true, 
        type: 'success', 
        title: 'Attendance Marked', 
        message: `${userName || 'Volunteer'}'s attendance has been confirmed and they have been notified by email.`, 
        onClose: () => setModal(m => ({ ...m, open: false })) 
      });
    } catch (error) {
      setModal({ 
        open: true, 
        type: 'error', 
        title: 'Failed to mark attendance', 
        message: error.message || 'Failed to mark attendance. They may have already been marked.', 
        onClose: () => setModal(m => ({ ...m, open: false })) 
      });
    } finally {
      setProcessing(prev => ({ ...prev, [key]: false }));
    }
  };

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
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Login Required</h2>
          <p className="text-gray-600 mb-6">You need to be logged in to view your opportunities.</p>
          <button
            onClick={() => navigate('/signin')}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  if (user && user.role !== 'organization') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-6">Only organizations can view their posted opportunities.</p>
          <button
            onClick={() => navigate('/opportunities')}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Browse Opportunities
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <LoadingSpinner size="xl" className="py-20" />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={fetchMyOpportunities} />;
  }

  return (
    <>
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Opportunities</h1>
          <p className="text-gray-600">Manage the volunteer opportunities you've posted</p>
        </div>

        {/* Create New Button */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/create-opportunity')}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            Create New Opportunity
          </button>
        </div>

        {/* Content */}
        {opportunities.length === 0 ? (
          <EmptyState 
            type="opportunities" 
            onAction={() => navigate('/create-opportunity')}
          />
        ) : (
          <div className="space-y-6">
            {opportunities.map((opportunity) => (
              <div key={opportunity._id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {opportunity.title}
                      </h3>
                      <p className="text-gray-600 line-clamp-2">
                        {opportunity.description}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => handleView(opportunity._id)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleEdit(opportunity._id)}
                        className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Edit Opportunity"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(opportunity._id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Opportunity"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                      <span>{opportunity.location}</span>
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="h-4 w-4 mr-2 text-gray-400" />
                      <span>{opportunity.timeCommitment}</span>
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="h-4 w-4 mr-2 text-gray-400" />
                      <span>{opportunity.volunteersNeeded} volunteers needed</span>
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                      <span>
                        {formatDate(opportunity.startDate)} - {formatDate(opportunity.endDate)}
                      </span>
                    </div>
                  </div>

                  {/* Status and Tags */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        opportunity.status === 'active' 
                          ? 'bg-green-100 text-green-700'
                          : opportunity.status === 'completed'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {opportunity.status}
                      </span>
                      
                      {opportunity.tags && opportunity.tags.length > 0 && (
                        <div className="flex space-x-1">
                          {opportunity.tags.slice(0, 3).map((tag, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-medium rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                          {opportunity.tags.length > 3 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                              +{opportunity.tags.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="text-sm text-gray-500">
                      Posted {formatDate(opportunity.createdAt)}
                    </div>
                  </div>

                  {/* Applicants Section */}
                  <div className="mt-4 border-t pt-4">
                    <button
                      onClick={() => toggleApplicants(opportunity._id)}
                      className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-800"
                    >
                      {expanded[opportunity._id] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      {expanded[opportunity._id] ? 'Hide Applicants' : 'Show Applicants'}
                      {applicantsByOpp[opportunity._id] && (
                        <span className="ml-2 px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
                          {((applicantsByOpp[opportunity._id].applicants || []).length + (applicantsByOpp[opportunity._id].approvedVolunteers || []).length) || '0'}
                        </span>
                      )}
                    </button>

                    {expanded[opportunity._id] && (
                      <div className="mt-3 space-y-3">
                        {/* Approved Volunteers Section */}
                        {(applicantsByOpp[opportunity._id]?.approvedVolunteers || []).length > 0 && (
                          <div className="mb-4">
                            <h4 className="text-sm font-semibold text-green-700 mb-2 flex items-center gap-2">
                              <Check className="h-4 w-4" />
                              Approved Volunteers ({(applicantsByOpp[opportunity._id].approvedVolunteers || []).length})
                            </h4>
                            <div className="space-y-2">
                              {(applicantsByOpp[opportunity._id].approvedVolunteers || []).map(vol => {
                                const volId = vol._id || vol.id;
                                const key = `${opportunity._id}_${volId}`;
                                const attendanceKey = `${opportunity._id}_${volId}_attendance`;
                                const isCompleted = vol.isCompleted || false;
                                return (
                                  <div key={volId} className={`p-3 border-2 rounded-lg ${
                                    isCompleted 
                                      ? 'border-blue-300 bg-blue-50' 
                                      : 'border-green-200 bg-green-50'
                                  }`}>
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                          <div className="font-medium text-gray-900">{vol.name}</div>
                                          {isCompleted && (
                                            <CheckCircle className="h-4 w-4 text-blue-600" title="Attendance confirmed" />
                                          )}
                                        </div>
                                        <div className="text-sm text-gray-700 mt-1 inline-flex items-center gap-2"><Mail className="h-4 w-4" /> {vol.email}</div>
                                        {vol.phone && (
                                          <div className="text-sm text-gray-700 mt-1 inline-flex items-center gap-2"><Phone className="h-4 w-4" /> {vol.phone}</div>
                                        )}
                                        {vol.location && (
                                          <div className="text-sm text-gray-700 mt-1">Location: {vol.location}</div>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-2 ml-4">
                                        {isCompleted ? (
                                          <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                                            Attendance Confirmed
                                          </span>
                                        ) : (
                                          <>
                                            <button
                                              onClick={() => handleMarkAttendance(opportunity._id, volId, vol.name)}
                                              disabled={processing[attendanceKey]}
                                              className="px-3 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                                              title="Mark attendance"
                                            >
                                              <CheckCircle className="h-4 w-4" />
                                              {processing[attendanceKey] ? 'Marking...' : 'Mark Attendance'}
                                            </button>
                                            <button
                                              onClick={() => handleReject(opportunity._id, volId, vol.name)}
                                              disabled={processing[key]}
                                              className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                                              title="Remove approval"
                                            >
                                              <X className="h-4 w-4" />
                                            </button>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Pending Applicants Section */}
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-2">
                            Pending Applicants ({(applicantsByOpp[opportunity._id]?.applicants || []).length || 0})
                          </h4>
                          {(applicantsByOpp[opportunity._id]?.applicants || []).length === 0 ? (
                            <p className="text-sm text-gray-600">
                              {(applicantsByOpp[opportunity._id]?.approvedVolunteers || []).length > 0 
                                ? 'No pending applicants.' 
                                : 'No applicants yet.'}
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {(applicantsByOpp[opportunity._id].applicants || []).map(vol => {
                                const volId = vol._id || vol.id;
                                const key = `${opportunity._id}_${volId}`;
                                return (
                                  <div key={volId} className="p-3 border rounded-lg bg-white">
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <div className="font-medium text-gray-900">{vol.name}</div>
                                        <div className="text-sm text-gray-700 mt-1 inline-flex items-center gap-2"><Mail className="h-4 w-4" /> {vol.email}</div>
                                        {vol.phone && (
                                          <div className="text-sm text-gray-700 mt-1 inline-flex items-center gap-2"><Phone className="h-4 w-4" /> {vol.phone}</div>
                                        )}
                                        {vol.location && (
                                          <div className="text-sm text-gray-700 mt-1">Location: {vol.location}</div>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-2 ml-4">
                                        <button
                                          onClick={() => handleApprove(opportunity._id, volId, vol.name)}
                                          disabled={processing[key]}
                                          className="px-3 py-1.5 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                                        >
                                          <Check className="h-4 w-4" />
                                          {processing[key] ? 'Processing...' : 'Approve'}
                                        </button>
                                        <button
                                          onClick={() => handleReject(opportunity._id, volId, vol.name)}
                                          disabled={processing[key]}
                                          className="px-3 py-1.5 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                                        >
                                          <X className="h-4 w-4" />
                                          {processing[key] ? 'Processing...' : 'Reject'}
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
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
    <Modal
      isOpen={confirm.open}
      onClose={confirm.onCancel || (() => setConfirm(c => ({ ...c, open: false })))}
      title={confirm.title}
      message={confirm.message}
      type="warning"
      primaryAction={{ label: 'Delete', onClick: confirm.onConfirm }}
      secondaryAction={{ label: 'Cancel', onClick: confirm.onCancel || (() => setConfirm(c => ({ ...c, open: false }))) }}
    />
    </>
  );
};

export default MyOpportunitiesPage;
