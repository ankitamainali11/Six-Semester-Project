import React from 'react';

const Modal = ({ isOpen, onClose, title, message, type = 'info', primaryAction, secondaryAction }) => {
  if (!isOpen) return null;

  const typeClasses = {
    success: 'text-green-700',
    error: 'text-red-700',
    info: 'text-gray-700',
    warning: 'text-yellow-700'
  };

  const badgeClasses = {
    success: 'bg-green-100 text-green-800',
    error: 'bg-red-100 text-red-800',
    info: 'bg-indigo-100 text-indigo-800',
    warning: 'bg-yellow-100 text-yellow-800'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
        <div className="px-6 py-4 border-b">
          <div className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full ${badgeClasses[type]}`}>{type.toUpperCase()}</div>
          {title && <h3 className="mt-2 text-lg font-semibold text-gray-900">{title}</h3>}
        </div>
        <div className="px-6 py-4">
          {typeof message === 'string' ? (
            <p className={typeClasses[type]}>{message}</p>
          ) : (
            message
          )}
        </div>
        <div className="px-6 py-4 border-t flex items-center justify-end gap-2">
          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              {secondaryAction.label}
            </button>
          )}
          <button
            onClick={primaryAction?.onClick || onClose}
            className={`px-4 py-2 rounded-lg ${
              type === 'error' ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700'
            } text-white`}
          >
            {primaryAction?.label || 'OK'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;


