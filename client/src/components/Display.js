import { useState, useEffect, useCallback } from "react";
import FileHistory from "./FileHistory";
import ShareLinkModal from "./ShareLinkModal";
import "./Display.css";

const Display = ({ contract, account }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingIndex, setDeletingIndex] = useState(null);
  const [showHistoryIndex, setShowHistoryIndex] = useState(null);
  const [fileHistory, setFileHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [shareLinkModalOpen, setShareLinkModalOpen] = useState(false);
  const [selectedFileForSharing, setSelectedFileForSharing] = useState(null);

  const getData = useCallback(async () => {
    if (!contract || !account) {
      setLoading(false);
      return;
    }
    
    try {
      console.log("Fetching files...");
      setLoading(true);
      setError(null);
      
      const timeoutId = setTimeout(() => {
        if (loading) {
          setError("Request is taking too long. Check your network connection.");
          setLoading(false);
        }
      }, 15000);
      
      const dataArray = await contract.display(account);
      console.log("Files fetched:", dataArray.length);
      
      clearTimeout(timeoutId);
      
      setData(dataArray);
      setLoading(false);
    } catch (e) {
      console.error("Error fetching files:", e);
      setError(`Failed to fetch files: ${e.message}`);
      setLoading(false);
    }
  }, [contract, account]);

  const deleteFile = async (fileIndex) => {
    if (!contract || !account) return;
    
    try {
      setDeletingIndex(fileIndex);
      
      console.log("Attempting to delete file at index:", fileIndex);
      
      if (contract.deleteFile) {
        console.log("Using contract.deleteFile function");
        const tx = await contract.deleteFile(account, fileIndex);
        console.log("Transaction submitted, waiting for confirmation...");
        await tx.wait();
        console.log("Delete transaction confirmed");
        
        if (showHistoryIndex === fileIndex) {
          setShowHistoryIndex(null);
        }
        
        getData();
      } else {
        console.log("deleteFile function not found on contract");
        alert("Delete function not available in the current contract. Please redeploy the contract with the deleteFile function.");
      }
    } catch (e) {
      console.error("Error deleting file:", e);
      alert(`Failed to delete file: ${e.message}`);
    } finally {
      setDeletingIndex(null);
    }
  };

  const downloadFile = (url, filename = "download", fileIndex) => {
    try {
      console.log(`Initiating download for: ${filename} from ${url}`);
      
      // For IPFS gateway URLs, ensure we're using the right format
      const downloadUrl = url.startsWith('ipfs://') 
        ? url.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/') 
        : url;
      
      // Create a temporary anchor element
      const link = document.createElement("a");
      link.href = downloadUrl;
      
      // Set the download attribute with the filename
      link.setAttribute("download", filename);
      
      // Make the link invisible
      link.style.display = "none";
      document.body.appendChild(link);
      
      // Use setTimeout to ensure the browser has time to process
      setTimeout(() => {
        link.click();
        
        // Remove the element after a brief delay
        setTimeout(() => {
          document.body.removeChild(link);
        }, 100);
      }, 0);
      
      // Log record of download if contract supports it
      if (contract && contract.recordFileAccess) {
        contract.recordFileAccess(account, fileIndex, "downloaded")
          .catch(err => console.error("Failed to record file access:", err));
      }
      
    } catch (error) {
      console.error("Download failed:", error);
      alert("Failed to download file. Please try again.");
    }
  };

  const getFilenameFromUrl = (url) => {
    try {
      const urlObj = new URL(url);
      const filenameParam = urlObj.searchParams.get('filename');
      if (filenameParam) return decodeURIComponent(filenameParam);
      
      const pathParts = urlObj.pathname.split('/');
      const lastPart = pathParts[pathParts.length - 1];
      
      if (lastPart && lastPart.length > 30 && !lastPart.includes('.')) {
        return `File ${lastPart.substring(0, 6)}...`;
      }
      
      return lastPart || "File";
    } catch (e) {
      return "File";
    }
  };

  const getFileHistory = async (fileIndex) => {
    if (!contract || !account) return;
    
    try {
      setLoadingHistory(true);
      
      if (contract.getFileHistory) {
        const history = await contract.getFileHistory(account, fileIndex);
        console.log("File history:", history);
        
        const formattedHistory = history.map(item => ({
          timestamp: new Date(item.timestamp.toNumber() * 1000),
          action: item.action,
          actionBy: item.actionBy,
          details: item.details
        }));
        
        setFileHistory(formattedHistory);
      } else {
        console.log("getFileHistory function not found on contract");
        setFileHistory([{ 
          timestamp: new Date(), 
          action: "info", 
          actionBy: "0x0", 
          details: "History tracking not available in current contract version" 
        }]);
      }
    } catch (e) {
      console.error("Error fetching file history:", e);
      setFileHistory([{ 
        timestamp: new Date(), 
        action: "error", 
        actionBy: "0x0", 
        details: `Error fetching history: ${e.message}` 
      }]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const toggleHistory = (fileIndex) => {
    if (showHistoryIndex === fileIndex) {
      setShowHistoryIndex(null);
    } else {
      setShowHistoryIndex(fileIndex);
      getFileHistory(fileIndex);
    }
  };

  const getFileIcon = (url) => {
    try {
      const filename = getFilenameFromUrl(url).toLowerCase();
      
      if (url.match(/\.(jpg|jpeg|png|gif|bmp|webp|svg)($|\?)/i)) {
        return 'fas fa-file-image';
      } else if (url.match(/\.pdf($|\?)/i)) {
        return 'fas fa-file-pdf';
      } else if (url.match(/\.(doc|docx|txt|rtf|odt)($|\?)/i)) {
        return 'fas fa-file-alt';
      } else if (url.match(/\.(xls|xlsx|ods|csv)($|\?)/i)) {
        return 'fas fa-file-excel';
      } else if (url.match(/\.(mp4|avi|mov|wmv|flv|mkv)($|\?)/i)) {
        return 'fas fa-file-video';
      } else if (url.match(/\.(mp3|wav|ogg|flac|aac)($|\?)/i)) {
        return 'fas fa-file-audio';
      } else if (url.match(/\.(zip|rar|tar|gz|7z)($|\?)/i)) {
        return 'fas fa-file-archive';
      } else if (url.match(/\.(js|py|java|html|css|php|cpp|h|c|cs)($|\?)/i)) {
        return 'fas fa-file-code';
      } else {
        return 'fas fa-file';
      }
    } catch (e) {
      return 'fas fa-file';
    }
  };

  const getFileType = (url) => {
    const icon = getFileIcon(url);
    
    if (icon.includes('image')) return 'image';
    if (icon.includes('pdf')) return 'pdf';
    if (icon.includes('video')) return 'video';
    if (icon.includes('audio')) return 'audio';
    
    return 'document';
  };

  const generateShareableLink = (url, index, fileName) => {
    const baseUrl = window.location.origin;
    const shareLink = `${baseUrl}/shared?address=${account}&fileIndex=${index}&fileName=${encodeURIComponent(fileName)}`;
    
    setSelectedFileForSharing({
      url,
      index,
      fileName,
      shareLink
    });
    
    setShareLinkModalOpen(true);
    
    try {
      if (contract.recordShareLink) {
        contract.recordShareLink(account, index, "link_generated");
      }
    } catch (error) {
      console.error("Failed to record share link action:", error);
    }
  };

  const recordSharedFileAccess = async (fileIndex) => {
    try {
      if (contract.recordFileAccess) {
        await contract.recordFileAccess(account, fileIndex, "shared_file_accessed");
      }
    } catch (error) {
      console.error("Failed to record file access:", error);
    }
  };

  useEffect(() => {
    getData();
  }, [getData]);

  useEffect(() => {
    if (document.querySelector('.display-container')) {
      document.querySelector('.display-container').getData = getData;
    }
  }, [getData]);

  return (
    <div className="display-container">
      {loading ? (
        <div className="loading-files">
          <div className="loader"></div>
          <p>Loading your files...</p>
        </div>
      ) : error ? (
        <div className="error-message">
          <i className="fas fa-exclamation-triangle"></i> {error}
          <button onClick={getData} className="retry-btn">
            <i className="fas fa-redo"></i> Retry
          </button>
        </div>
      ) : data.length === 0 ? (
        <div className="no-files">
          <i className="fas fa-folder-open"></i>
          <p>No files found. Upload some files to see them here.</p>
        </div>
      ) : (
        <div className="files-grid">
          {data.map((url, index) => {
            const fileName = getFilenameFromUrl(url);
            const fileIcon = getFileIcon(url);
            const fileType = getFileType(url);
            const isImage = fileType === 'image';
            const isHistoryShown = showHistoryIndex === index;
            
            return (
              <div 
                className={`file-card ${isHistoryShown ? 'expanded' : ''}`} 
                key={`${url}_${index}`}
              >
                <div className={`file-preview ${fileType}`}>
                  {isImage ? (
                    <img 
                      src={url} 
                      alt={fileName} 
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.parentNode.className = 'file-preview document';
                        e.target.replaceWith((() => {
                          const i = document.createElement('i');
                          i.className = 'fas fa-file-image';
                          return i;
                        })());
                      }}
                    />
                  ) : (
                    <i className={fileIcon}></i>
                  )}
                </div>
                <div className="file-info">
                  <div className="file-header">
                    <h3 className="file-title" title={fileName}>
                      {fileName}
                    </h3>
                  </div>
                  
                  <div className="file-actions">
                    <button 
                      className="action-button history-btn"
                      onClick={() => toggleHistory(index)}
                      title={isHistoryShown ? "Close History" : "View History"}
                    >
                      <i className={isHistoryShown ? "fas fa-times" : "fas fa-history"}></i>
                      <span>{isHistoryShown ? "Close" : "History"}</span>
                    </button>
                    <button 
                      className="action-button share-link-btn" 
                      onClick={() => generateShareableLink(url, index, fileName)}
                      title="Share Link"
                    >
                      <i className="fas fa-link"></i> <span>Share</span>
                    </button>
                    <button 
                      className="action-button download-btn" 
                      onClick={() => downloadFile(url, fileName, index)}
                      title="Download File"
                    >
                      <i className="fas fa-download"></i> <span>Download</span>
                    </button>
                    <button 
                      className="action-button delete-btn"
                      disabled={deletingIndex === index}
                      onClick={() => {
                        if(window.confirm(`Are you sure you want to delete "${fileName}"?`)) {
                          deleteFile(index);
                        }
                      }}
                      title="Delete File"
                    >
                      {deletingIndex === index ? (
                        <><i className="fas fa-spinner fa-spin"></i> <span>Deleting...</span></>
                      ) : (
                        <><i className="fas fa-trash-alt"></i> <span>Delete</span></>
                      )}
                    </button>
                  </div>
                </div>
                
                {isHistoryShown && (
                  <div className="file-history-container">
                    <h3><i className="fas fa-history"></i> File History</h3>
                    <FileHistory 
                      history={fileHistory} 
                      loading={loadingHistory} 
                      fileName={fileName}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      
      {/* Fix refresh container positioning and styling */}
      <div className="refresh-section">
        <button 
          className="refresh-btn" 
          onClick={getData}
          disabled={loading}
        >
          {loading ? 
            <><i className="fas fa-spinner fa-spin"></i> Loading...</> : 
            <><i className="fas fa-sync-alt"></i> Refresh Files</>
          }
        </button>
      </div>
      
      {shareLinkModalOpen && (
        <ShareLinkModal 
          fileInfo={selectedFileForSharing}
          onClose={() => setShareLinkModalOpen(false)}
        />
      )}
    </div>
  );
};

export default Display;
