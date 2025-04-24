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
      case 'downloaded':
        return 'fas fa-download';
      case 'shared_download':
        return 'fas fa-external-link-alt';
      case 'shared_file_accessed':
        return 'fas fa-eye';
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
      case 'downloaded':
        return 'download-action';
      case 'shared_download':
        return 'shared-download-action';
      case 'shared_file_accessed':
        return 'shared-access-action';
      case 'error':
        return 'error-action';
      case 'info':
        return 'info-action';
      default:
        return '';
    }
  };

  // Get friendly name for action type
  const getActionName = (action) => {
    switch(action.toLowerCase()) {
      case 'downloaded':
        return 'Downloaded';
      case 'shared_download':
        return 'Shared Link Download';
      case 'shared_file_accessed':
        return 'Viewed via Shared Link';
      default:
        return action.charAt(0).toUpperCase() + action.slice(1);
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
                  {getActionName(item.action)}
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
