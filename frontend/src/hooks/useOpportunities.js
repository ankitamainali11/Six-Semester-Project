import { useState, useEffect } from 'react';
import apiService from '../services/api';

export const useOpportunities = (initialFilters = {}) => {
  const [opportunities, setOpportunities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(initialFilters);

  const fetchOpportunities = async (currentFilters = filters) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiService.getOpportunities(currentFilters);
      setOpportunities(response.opportunities || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch opportunities');
      setOpportunities([]);
    } finally {
      setIsLoading(false);
    }
  };

  const updateFilters = (newFilters) => {
    setFilters(newFilters);
    fetchOpportunities(newFilters);
  };

  const searchOpportunities = (searchQuery) => {
    const searchFilters = { ...filters, search: searchQuery };
    updateFilters(searchFilters);
  };

  const applyToOpportunity = async (opportunityId) => {
    try {
      await apiService.applyToOpportunity(opportunityId);
      // Update the opportunity in the list to reflect the application
      setOpportunities(prev => 
        prev.map(opp => 
          opp._id === opportunityId 
            ? { ...opp, hasApplied: true }
            : opp
        )
      );
      return { success: true };
    } catch (error) {
      throw error;
    }
  };

  useEffect(() => {
    fetchOpportunities();
  }, []);

  return {
    opportunities,
    isLoading,
    error,
    filters,
    updateFilters,
    searchOpportunities,
    applyToOpportunity,
    refetch: fetchOpportunities,
  };
};