import React from 'react';
import './FileHistory.css';

const FileHistory = ({ history, loading, fileName }) => {
  // Get icon for action type
  const getActionIcon = (action) => {
    switch(action.toLowerCase()) {
      case 'upload':
        return 'fas fa-upload';
      case 'delete':
        return 'fas fa-trash-alt';
      case 'share':
        return 'fas fa-share-alt';
      case 'unshare':
        return 'fas fa-user-slash';
      case 'error':
        return 'fas fa-exclamation-circle';
      case 'info':
        return 'fas fa-info-circle';
      default:
        return 'fas fa-history';
    }
  };

  // Get class for action type
  const getActionClass = (action) => {
    switch(action.toLowerCase()) {
      case 'upload':
        return 'upload-action';
      case 'delete':
        return 'delete-action';
      case 'share':
        return 'share-action';
      case 'unshare':
        return 'unshare-action';
      case 'error':
        return 'error-action';
      case 'info':
        return 'info-action';
      default:
        return '';
    }
  };

  // Format address for display
  const formatAddress = (address) => {
    return address ? `${address.substring(0, 6)}...${address.substring(address.length - 4)}` : 'Unknown';
  };

  // Format timestamp without date-fns
  const formatDate = (timestamp) => {
    if (!timestamp) return "Unknown date";
    
    const date = new Date(timestamp);
    
    // Format the date as "MMM d, yyyy h:mm a"
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    };
    
    return date.toLocaleDateString('en-US', options);
  };

  return (
    <div className="file-history">
      {loading ? (
        <div className="history-loading">
          <div className="history-loader"></div>
          <p>Loading history...</p>
        </div>
      ) : history.length === 0 ? (
        <div className="no-history">
          <p>No history available for this file.</p>
        </div>
      ) : (
        <div className="history-timeline">
          {history.map((item, index) => (
            <div 
              key={index} 
              className={`history-item ${getActionClass(item.action)}`}
            >
              <div className="history-icon">
                <i className={getActionIcon(item.action)}></i>
              </div>
              <div className="history-content">
                <div className="history-action">
                  {item.action.charAt(0).toUpperCase() + item.action.slice(1)}
                </div>
                <div className="history-details">
                  {item.details}
                </div>
                <div className="history-meta">
                  <span className="history-time">
                    <i className="far fa-clock"></i> {formatDate(item.timestamp)}
                  </span>
                  <span className="history-user">
                    <i className="far fa-user"></i> {formatAddress(item.actionBy)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileHistory;
