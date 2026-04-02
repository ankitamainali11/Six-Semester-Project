import { useState, useEffect } from 'react';
import apiService from '../services/api';

export const useSavedOpportunities = () => {
  const [savedOpportunities, setSavedOpportunities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSavedOpportunities = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getSavedOpportunities();
      setSavedOpportunities(response.savedOpportunities || []);
    } catch (error) {
      console.error('Failed to fetch saved opportunities:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveOpportunity = async (opportunityId) => {
    try {
      await apiService.saveOpportunity(opportunityId);
      setSavedOpportunities(prev => [...prev, opportunityId]);
      return { success: true };
    } catch (error) {
      throw error;
    }
  };

  const unsaveOpportunity = async (opportunityId) => {
    try {
      await apiService.unsaveOpportunity(opportunityId);
      setSavedOpportunities(prev => prev.filter(id => id !== opportunityId));
      return { success: true };
    } catch (error) {
      throw error;
    }
  };

  const toggleSaveOpportunity = async (opportunityId) => {
    if (savedOpportunities.includes(opportunityId)) {
      return unsaveOpportunity(opportunityId);
    } else {
      return saveOpportunity(opportunityId);
    }
  };

  const isOpportunitySaved = (opportunityId) => {
    return savedOpportunities.includes(opportunityId);
  };

  useEffect(() => {
    fetchSavedOpportunities();
  }, []);

  return {
    savedOpportunities,
    isLoading,
    saveOpportunity,
    unsaveOpportunity,
    toggleSaveOpportunity,
    isOpportunitySaved,
    refetch: fetchSavedOpportunities,
  };
};