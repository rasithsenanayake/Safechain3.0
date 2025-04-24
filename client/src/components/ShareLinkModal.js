import React, { useState, useEffect, useRef } from "react";
import fileTrackingService from "../services/fileTrackingService";
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

  // Create a direct download option with tracking
  const handleDirectDownload = async () => {
    // Create downloading notification
    const downloadingNotification = document.createElement("div");
    downloadingNotification.className = "download-notification";
    downloadingNotification.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Downloading ${fileInfo.fileName}...`;
    downloadingNotification.style.position = "fixed";
    downloadingNotification.style.bottom = "20px";
    downloadingNotification.style.right = "20px";
    downloadingNotification.style.backgroundColor = "#3498db";
    downloadingNotification.style.color = "white";
    downloadingNotification.style.padding = "12px 20px";
    downloadingNotification.style.borderRadius = "4px";
    downloadingNotification.style.boxShadow = "0 2px 10px rgba(0,0,0,0.2)";
    downloadingNotification.style.zIndex = "1000";
    document.body.appendChild(downloadingNotification);
    
    try {
      // For IPFS gateway URLs, ensure we're using the right format
      const downloadUrl = fileInfo.url.startsWith('ipfs://') 
        ? fileInfo.url.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/') 
        : fileInfo.url;
      
      // Use fetch API to get the file as a blob which forces "Save As" dialog
      const response = await fetch(downloadUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
      }
      
      const blob = await response.blob();
      
      // Create a blob URL for the file
      const blobUrl = URL.createObjectURL(blob);
      
      // Create an anchor element and simulate click to download
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = fileInfo.fileName; // 'download' attribute triggers Save As dialog
      link.style.display = "none";
      document.body.appendChild(link);
      
      // Trigger the download
      link.click();
      
      // Clean up
      setTimeout(() => {
        URL.revokeObjectURL(blobUrl);
        document.body.removeChild(link);
      }, 200);
      
      // Remove downloading notification
      document.body.removeChild(downloadingNotification);
      
      // Show success notification
      const successNotification = document.createElement("div");
      successNotification.className = "download-notification";
      successNotification.innerHTML = `<i class="fas fa-check-circle"></i> ${fileInfo.fileName} downloaded`;
      successNotification.style.position = "fixed";
      successNotification.style.bottom = "20px";
      successNotification.style.right = "20px";
      successNotification.style.backgroundColor = "#4CAF50";
      successNotification.style.color = "white";
      successNotification.style.padding = "12px 20px";
      successNotification.style.borderRadius = "4px";
      successNotification.style.boxShadow = "0 2px 10px rgba(0,0,0,0.2)";
      successNotification.style.transition = "opacity 0.5s ease";
      successNotification.style.zIndex = "1000";
      document.body.appendChild(successNotification);
      setTimeout(() => {
        successNotification.style.opacity = "0";
        setTimeout(() => {
          document.body.removeChild(successNotification);
        }, 500);
      }, 2000);
      
      // Record download separately to avoid blocking the UI
      recordSharedDownload();
      
    } catch (error) {
      console.error("Direct download failed:", error);
      
      // Remove downloading notification
      if (document.body.contains(downloadingNotification)) {
        document.body.removeChild(downloadingNotification);
      }
      
      // Show error notification
      const errorNotification = document.createElement("div");
      errorNotification.className = "download-notification";
      errorNotification.innerHTML = `<i class="fas fa-exclamation-circle"></i> Download failed`;
      errorNotification.style.position = "fixed";
      errorNotification.style.bottom = "20px";
      errorNotification.style.right = "20px";
      errorNotification.style.backgroundColor = "#e74c3c";
      errorNotification.style.color = "white";
      errorNotification.style.padding = "12px 20px";
      errorNotification.style.borderRadius = "4px";
      errorNotification.style.boxShadow = "0 2px 10px rgba(0,0,0,0.2)";
      errorNotification.style.zIndex = "1000";
      document.body.appendChild(errorNotification);
      setTimeout(() => {
        document.body.removeChild(errorNotification);
      }, 3000);
    }
  };
  
  // Separate function to record shared download
  const recordSharedDownload = async () => {
    try {
      // If contract info is available via window, record the download
      const globalWindow = window;
      if (globalWindow.SafeChainApp && 
          globalWindow.SafeChainApp.contract && 
          globalWindow.SafeChainApp.account) {
        
        const now = new Date();
        await fileTrackingService.recordFileAccess(
          globalWindow.SafeChainApp.contract,
          globalWindow.SafeChainApp.account,
          fileInfo.index,
          "shared_download",
          `Downloaded via shared link at ${now.toLocaleTimeString()}`
        );
        
        console.log("Shared download recorded successfully");
      }
    } catch (error) {
      console.error("Failed to record shared download:", error);
      // Don't alert the user - the download itself was successful
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
          
          {/* Direct download option */}
          <div className="direct-download">
            <button 
              className="download-shared-btn" 
              onClick={handleDirectDownload}
            >
              <i className="fas fa-download"></i> Download File
            </button>
            <span className="download-note">Downloads will be tracked in file history</span>
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
