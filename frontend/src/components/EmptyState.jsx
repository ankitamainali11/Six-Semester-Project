import React from 'react';
import { Search, Heart, Plus } from 'lucide-react';

const EmptyState = ({ type = 'search', onAction, actionText }) => {
  const configs = {
    search: {
      icon: Search,
      title: 'No opportunities found',
      description: 'Try adjusting your search criteria or filters to find more volunteer opportunities.',
      actionText: 'Clear Filters'
    },
    saved: {
      icon: Heart,
      title: 'No saved opportunities',
      description: 'Start exploring volunteer opportunities and save the ones that interest you.',
      actionText: 'Browse Opportunities'
    },
    applications: {
      icon: Plus,
      title: 'No applications yet',
      description: 'You haven\'t applied to any volunteer opportunities yet. Start making a difference today!',
      actionText: 'Find Opportunities'
    }
  };

  const config = configs[type] || configs.search;
  const Icon = config.icon;

  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
        <Icon className="h-12 w-12 text-gray-400" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{config.title}</h3>
      <p className="text-gray-600 mb-6 max-w-md">{config.description}</p>
      {onAction && (
        <button
          onClick={onAction}
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
        >
          {actionText || config.actionText}
        </button>
      )}
    </div>
  );
};

export default EmptyState;