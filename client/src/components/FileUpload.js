import { useState, useRef } from "react";
import axios from "axios";
import fileTrackingService from "../services/fileTrackingService";
import "./FileUpload.css";

const FileUpload = ({ contract, account, provider }) => {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("No file selected");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fileSize, setFileSize] = useState(null);
  const [fileType, setFileType] = useState(null);
  const fileInputRef = useRef(null);
  const dragAreaRef = useRef(null);

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };
  
  // Get appropriate icon for file type
  const getFileIcon = (type) => {
    const fileType = type?.toLowerCase() || "";
    
    if (fileType.includes('image')) return 'fas fa-file-image';
    if (fileType.includes('pdf')) return 'fas fa-file-pdf';
    if (fileType.includes('word') || fileType.includes('document')) return 'fas fa-file-word';
    if (fileType.includes('excel') || fileType.includes('sheet')) return 'fas fa-file-excel';
    if (fileType.includes('video')) return 'fas fa-file-video';
    if (fileType.includes('audio')) return 'fas fa-file-audio';
    if (fileType.includes('zip') || fileType.includes('archive')) return 'fas fa-file-archive';
    if (fileType.includes('text')) return 'fas fa-file-alt';
    
    return 'fas fa-file';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      alert("Please select a file first");
      return;
    }
    
    if (!account) {
      alert("Please connect your wallet first");
      return;
    }
    
    setIsUploading(true);
    setUploadProgress(10);
    
    try {
      const formData = new FormData();
      formData.append("file", file);

      // Add metadata to preserve the file name
      const metadata = JSON.stringify({
        name: fileName,
      });
      formData.append('pinataMetadata', metadata);
      
      // Add content type options
      const options = JSON.stringify({
        cidVersion: 0,
      });
      formData.append('pinataOptions', options);

      setUploadProgress(30);
      
      const resFile = await axios({
        method: "post",
        url: "https://api.pinata.cloud/pinning/pinFileToIPFS",
        data: formData,
        headers: {
          pinata_api_key: `dfb9f22a84581fd59e8b`,
          pinata_secret_api_key: `6db6a1fa8811e390c01570f310954d9784eced9dba303468d01b61805a6da060`,
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(30 + percentCompleted * 0.5); // 30% to 80%
        }
      });
      
      setUploadProgress(80);
      
      // Create URL with filename as query parameter for better identification
      const fileUrl = `https://gateway.pinata.cloud/ipfs/${resFile.data.IpfsHash}?filename=${encodeURIComponent(fileName)}`;
      const tx = await contract.add(account, fileUrl);
      await tx.wait();
      
      // Record this upload in file tracking (as the last index)
      try {
        const currentFiles = await contract.display(account);
        const newFileIndex = currentFiles.length - 1;
        await fileTrackingService.recordFileAccess(
          contract, 
          account, 
          newFileIndex, 
          "upload", 
          `File uploaded: ${fileName}`
        );
      } catch (err) {
        console.error("Failed to record upload in history", err);
      }
      
      setUploadProgress(100);
      
      // Notify any parent components that might need to refresh their data
      if (document.querySelector('.display-container')?.getData) {
        document.querySelector('.display-container').getData();
      }
      
      setTimeout(() => {
        alert("File uploaded successfully!");
        setFileName("No file selected");
        setFile(null);
        setFileSize(null);
        setFileType(null);
        setIsUploading(false);
        setUploadProgress(0);
      }, 1000);
      
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload file. Please try again.");
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const retrieveFile = (e) => {
    try {
      const selectedFile = e.target.files[0];
      
      if (!selectedFile) return;
      
      const reader = new window.FileReader();
      reader.readAsArrayBuffer(selectedFile);
      reader.onloadend = () => {
        setFile(selectedFile);
      };
      
      setFileName(selectedFile.name);
      setFileSize(formatSize(selectedFile.size));
      setFileType(selectedFile.type);
      
    } catch (error) {
      console.error("File selection error:", error);
      alert("There was an error selecting the file. Please try again.");
    }
  };
  
  // Handle drag and drop functionality
  const handleDragOver = (e) => {
    e.preventDefault();
    if (dragAreaRef.current) {
      dragAreaRef.current.classList.add('dragging');
    }
  };
  
  const handleDragLeave = (e) => {
    e.preventDefault();
    if (dragAreaRef.current) {
      dragAreaRef.current.classList.remove('dragging');
    }
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    if (dragAreaRef.current) {
      dragAreaRef.current.classList.remove('dragging');
    }
    
    if (!account || isUploading) return;
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      const reader = new window.FileReader();
      reader.readAsArrayBuffer(droppedFile);
      reader.onloadend = () => {
        setFile(droppedFile);
      };
      
      setFileName(droppedFile.name);
      setFileSize(formatSize(droppedFile.size));
      setFileType(droppedFile.type);
    }
  };

  return (
    <div className="top">
      <form className="form" onSubmit={handleSubmit}>
        <div 
          className="file-upload-container" 
          ref={dragAreaRef}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <label htmlFor="file-upload" className="choose">
            <i className="fas fa-file-upload"></i> Select File
          </label>
          <input
            disabled={!account || isUploading}
            type="file"
            id="file-upload"
            name="data"
            onChange={retrieveFile}
            ref={fileInputRef}
          />
          
          {file ? (
            <div className="file-details">
              <div className="file-name">
                <i className={getFileIcon(fileType)}></i> {fileName}
              </div>
              {fileSize && <div className="file-size">Size: {fileSize}</div>}
              {fileType && <div className="file-type">Type: {fileType}</div>}
            </div>
          ) : (
            <div className="file-prompt">
              <i className="fas fa-cloud-upload-alt"></i>
              <p>Drag & drop or click to select file</p>
            </div>
          )}
        </div>
        
        {isUploading && (
          <div className="progress-container">
            <div 
              className="progress-bar" 
              style={{ width: `${uploadProgress}%` }}
            ></div>
            <span className="progress-text">{uploadProgress}%</span>
          </div>
        )}
        
        <button 
          type="submit" 
          className="upload" 
          disabled={!file || !account || isUploading}
        >
          {isUploading ? (
            <>
              <i className="fas fa-spinner fa-spin"></i> Uploading...
            </>
          ) : (
            <>
              <i className="fas fa-cloud-upload-alt"></i> Upload File
            </>
          )}
        </button>
        
        {!account && (
          <div className="wallet-reminder">
            <i className="fas fa-exclamation-circle"></i>
            Connect your wallet to upload files
          </div>
        )}
      </form>
    </div>
  );
};

export default FileUpload;
