import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';

const TagSelector = ({ selectedTags, onTagsChange, error }) => {
  const [customTag, setCustomTag] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  // Default categories from CreateOpportunityPage
  const defaultCategories = [
    'Education', 'Environment', 'Healthcare', 'Community Service',
    'Animal Welfare', 'Disaster Relief', 'Youth Programs', 'Senior Care',
    'Food Security', 'Technology', 'Arts & Culture', 'Sports & Recreation'
  ];

  const handleTagToggle = (tag) => {
    const normalizedTag = tag.toLowerCase().trim();
    if (selectedTags.includes(normalizedTag)) {
      onTagsChange(selectedTags.filter(t => t !== normalizedTag));
    } else {
      onTagsChange([...selectedTags, normalizedTag]);
    }
  };

  const handleCustomTagAdd = () => {
    const trimmedTag = customTag.trim();
    if (trimmedTag && !selectedTags.includes(trimmedTag.toLowerCase())) {
      onTagsChange([...selectedTags, trimmedTag.toLowerCase()]);
      setCustomTag('');
      setShowCustomInput(false);
    }
  };

  const handleCustomTagKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCustomTagAdd();
    }
  };

  const removeTag = (tagToRemove) => {
    onTagsChange(selectedTags.filter(tag => tag !== tagToRemove));
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select your areas of interest *
        </label>
        <p className="text-sm text-gray-500 mb-3">
          Choose categories that interest you. You can add custom categories too.
        </p>
        
        {/* Selected tags display */}
        {selectedTags.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              {selectedTags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-800 text-sm rounded-full"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="text-indigo-600 hover:text-indigo-800"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Default categories */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
          {defaultCategories.map((category) => {
            const isSelected = selectedTags.includes(category.toLowerCase());
            return (
              <button
                key={category}
                type="button"
                onClick={() => handleTagToggle(category)}
                className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-indigo-300 hover:bg-indigo-50'
                }`}
              >
                {category}
              </button>
            );
          })}
        </div>

        {/* Custom tag input */}
        <div className="space-y-2">
          {!showCustomInput ? (
            <button
              type="button"
              onClick={() => setShowCustomInput(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-indigo-600 border border-indigo-300 rounded-lg hover:bg-indigo-50 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add custom category
            </button>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                value={customTag}
                onChange={(e) => setCustomTag(e.target.value)}
                onKeyPress={handleCustomTagKeyPress}
                placeholder="Enter custom category"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                autoFocus
              />
              <button
                type="button"
                onClick={handleCustomTagAdd}
                disabled={!customTag.trim()}
                className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCustomInput(false);
                  setCustomTag('');
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 text-sm rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
      </div>
    </div>
  );
};

export default TagSelector;
