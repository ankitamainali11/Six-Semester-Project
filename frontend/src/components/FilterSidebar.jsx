import React, { useState } from 'react';
import { Filter, X, MapPin, Clock, Calendar } from 'lucide-react';

const FilterSidebar = ({ isOpen, onClose, onFilterChange, availableTags = [] }) => {
  const [filters, setFilters] = useState({
    location: '',
    timeCommitment: '',
    startDate: '',
    endDate: '',
    tags: [],
    remote: false
  });

  const timeCommitmentOptions = [
    'One-time',
    'Weekly',
    'Monthly',
    'Flexible',
    'Full-time',
    'Part-time'
  ];

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleTagToggle = (tag) => {
    const newTags = filters.tags.includes(tag)
      ? filters.tags.filter(t => t !== tag)
      : [...filters.tags, tag];
    handleFilterChange('tags', newTags);
  };

  const clearFilters = () => {
    const emptyFilters = {
      location: '',
      timeCommitment: '',
      startDate: '',
      endDate: '',
      tags: [],
      remote: false
    };
    setFilters(emptyFilters);
    onFilterChange(emptyFilters);
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed lg:static inset-y-0 left-0 z-50 w-80 bg-white shadow-xl transform transition-transform duration-300 ease-in-out lg:transform-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-indigo-600" />
              <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Filters */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Location */}
            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-900 mb-3">
                <MapPin className="h-4 w-4" />
                <span>Location</span>
              </label>
              <input
                type="text"
                placeholder="Enter city or zip code"
                value={filters.location}
                onChange={(e) => handleFilterChange('location', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <div className="mt-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={filters.remote}
                    onChange={(e) => handleFilterChange('remote', e.target.checked)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">Remote opportunities</span>
                </label>
              </div>
            </div>

            {/* Time Commitment */}
            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-900 mb-3">
                <Clock className="h-4 w-4" />
                <span>Time Commitment</span>
              </label>
              <select
                value={filters.timeCommitment}
                onChange={(e) => handleFilterChange('timeCommitment', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">Any</option>
                {timeCommitmentOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>

            {/* Date Range */}
            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-900 mb-3">
                <Calendar className="h-4 w-4" />
                <span>Date Range</span>
              </label>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">End Date</label>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => handleFilterChange('endDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Tags */}
            {availableTags.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-3">
                  Categories
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {availableTags.map(tag => (
                    <label key={tag} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={filters.tags.includes(tag)}
                        onChange={() => handleTagToggle(tag)}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-gray-700">{tag}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Clear Filters */}
          <div className="p-6 border-t border-gray-200">
            <button
              onClick={clearFilters}
              className="w-full px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Clear All Filters
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default FilterSidebar;