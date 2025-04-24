import React, { useState, useEffect } from 'react';
import "./SharedFileView.css";

const SharedFileView = ({ contract, params, account }) => {
  const [fileUrl, setFileUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [accessRecorded, setAccessRecorded] = useState(false);

  useEffect(() => {
    const fetchSharedFile = async () => {
      if (!contract || !params || !params.address) {
        setError("Invalid sharing parameters");
        setLoading(false);
        return;
      }

      try {
        const data = await contract.display(params.address);
        
        if (data && params.fileIndex < data.length) {
          setFileUrl(data[params.fileIndex]);
          setLoading(false);
          
          // Record file access in history
          if (!accessRecorded && contract.recordFileAccess) {
            try {
              await contract.recordFileAccess(
                params.address,
                params.fileIndex,
                account || "0x0000000000000000000000000000000000000000",
                "shared_access"
              );
              setAccessRecorded(true);
            } catch (e) {
              console.error("Could not record access:", e);
            }
          }
        } else {
          setError("File not found");
          setLoading(false);
        }
      } catch (e) {
        console.error("Error fetching shared file:", e);
        setError("Error accessing shared file: " + e.message);
        setLoading(false);
      }
    };

    if (contract) {
      fetchSharedFile();
    }
  }, [contract, params, account, accessRecorded]);

  const downloadFile = () => {
    if (!fileUrl) return;
    
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = params.fileName || "shared-file";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Record download in history
    if (contract.recordFileDownload && account) {
      try {
        contract.recordFileDownload(
          params.address,
          params.fileIndex,
          account,
          "shared_download"
        );
      } catch (e) {
        console.error("Could not record download:", e);
      }
    }
  };

  const isImage = fileUrl && 
    (fileUrl.match(/\.(jpg|jpeg|png|gif|bmp|webp)($|\?)/i) || fileUrl.includes("image/"));

  return (
    <div className="shared-file-container">
      <div className="shared-file-header">
        <h1><i className="fas fa-share-alt"></i> Shared File</h1>
        <p className="shared-by">
          Shared by: {params?.address ? 
            `${params.address.substring(0, 6)}...${params.address.substring(params.address.length - 4)}` : 
            "Unknown"}
        </p>
      </div>

      {loading ? (
        <div className="loading-shared-file">
          <div className="loader"></div>
          <p>Loading shared file...</p>
        </div>
      ) : error ? (
        <div className="shared-file-error">
          <i className="fas fa-exclamation-circle"></i>
          <p>{error}</p>
          <a href="/" className="return-home">Return to Home</a>
        </div>
      ) : (
        <div className="shared-file-content">
          <div className="shared-file-preview">
            {isImage ? (
              <img src={fileUrl} alt={params.fileName || "Shared file"} />
            ) : (
              <div className="file-icon-container">
                <i className="fas fa-file-alt"></i>
                <p>{params.fileName || "Shared file"}</p>
              </div>
            )}
          </div>
          
          <div className="shared-file-actions">
            <button className="download-shared" onClick={downloadFile}>
              <i className="fas fa-download"></i> Download File
            </button>
            <a href="/" className="return-home">
              <i className="fas fa-home"></i> Return to Home
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default SharedFileView;
