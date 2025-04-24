import React, { useState, useEffect, useRef } from "react";
import "./ShareLinkModal.css";

const ShareLinkModal = ({ fileInfo, onClose }) => {
  const [copySuccess, setCopySuccess] = useState(false);
  const linkRef = useRef(null);
  const modalRef = useRef(null);

  // Handle copying the link
  const copyToClipboard = () => {
    if (!linkRef.current) return;
    
    try {
      linkRef.current.select();
      
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(fileInfo.shareLink)
          .then(() => {
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2500);
          })
          .catch(() => {
            // Fallback
            document.execCommand("copy");
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2500);
          });
      } else {
        // Old browsers
        document.execCommand("copy");
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2500);
      }
    } catch (error) {
      console.error("Copy failed:", error);
    }
  };

  // Handle click outside to close
  useEffect(() => {
    const handleOutsideClick = (e) => {
      // Close only if clicking outside the modal content
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        onClose();
      }
    };
    
    document.addEventListener('mousedown', handleOutsideClick);
    
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [onClose]);
  
  // Handle escape key to close
  useEffect(() => {
    const handleEscapeKey = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscapeKey);
    
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [onClose]);

  // Focus the input on mount for easy copying
  useEffect(() => {
    if (linkRef.current) {
      linkRef.current.focus();
    }
  }, []);

  // Get file icon based on file type
  const getFileIcon = () => {
    const url = fileInfo.url || '';
    
    if (url.match(/\.(jpg|jpeg|png|gif|bmp|webp|svg)($|\?)/i)) {
      return "fas fa-file-image";
    } else if (url.match(/\.pdf($|\?)/i)) {
      return "fas fa-file-pdf";
    } else if (url.match(/\.(doc|docx)($|\?)/i)) {
      return "fas fa-file-word";
    } else if (url.match(/\.(xls|xlsx|csv)($|\?)/i)) {
      return "fas fa-file-excel";
    } else if (url.match(/\.(ppt|pptx)($|\?)/i)) {
      return "fas fa-file-powerpoint";
    } else if (url.match(/\.(zip|rar|tar|gz)($|\?)/i)) {
      return "fas fa-file-archive";
    } else if (url.match(/\.(mp4|avi|mov|wmv)($|\?)/i)) {
      return "fas fa-file-video";
    } else if (url.match(/\.(mp3|wav|ogg)($|\?)/i)) {
      return "fas fa-file-audio";
    } else if (url.match(/\.(txt|rtf|md)($|\?)/i)) {
      return "fas fa-file-alt";
    } else if (url.match(/\.(html|css|js|jsx|ts|tsx|php|java|py|rb|go)($|\?)/i)) {
      return "fas fa-file-code";
    } else {
      return "fas fa-file";
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" ref={modalRef}>
        {/* Modal Header */}
        <div className="modal-header">
          <h3 className="modal-title">
            <i className="fas fa-link"></i> Share File
          </h3>
          <button className="modal-close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        {/* Modal Body */}
        <div className="modal-body">
          {/* File info */}
          <div className="file-info1">
            <div className="file-icon">
              <i className={getFileIcon()}></i>
            </div>
            <div className="file-name">{fileInfo.fileName}</div>
          </div>
          
          <p className="share-description">
            Share this link with anyone to give them access to this file:
          </p>
          
          {/* Link input and copy button */}
          <div className="link-box">
            <input
              type="text"
              className="link-input"
              value={fileInfo.shareLink}
              readOnly
              ref={linkRef}
            />
            <button 
              className="copy-btn" 
              onClick={copyToClipboard}
            >
              {copySuccess ? (
                <><i className="fas fa-check"></i> Copied!</>
              ) : (
                <><i className="fas fa-copy"></i> Copy</>
              )}
            </button>
          </div>
          
          {/* Note */}
          <div className="note">
            <i className="fas fa-info-circle"></i>
            <span>Anyone with this link can access this file.</span>
          </div>
        </div>
        
        {/* Modal Footer */}
        <div className="modal-footer">
          <button className="done-btn" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareLinkModal;
