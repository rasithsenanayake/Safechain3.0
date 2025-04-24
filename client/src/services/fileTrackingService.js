/**
 * File Tracking Service
 * Provides centralized methods to track file-related activities
 */

// Record file access in the blockchain
const recordFileAccess = async (contract, account, fileIndex, action, details = "") => {
  if (!contract || !account) return false;
  
  try {
    if (contract.recordFileAccess) {
      await contract.recordFileAccess(account, fileIndex, action, details);
      console.log(`Recorded file access: ${action} for file index ${fileIndex}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error recording file access:", error);
    return false;
  }
};

// Record when a file is accessed via a shared link
const recordSharedAccess = async (contract, account, fileIndex, action = "shared_file_accessed") => {
  return recordFileAccess(contract, account, fileIndex, action);
};

// Record when a file is downloaded via a shared link
const recordSharedDownload = async (contract, account, fileIndex) => {
  return recordFileAccess(contract, account, fileIndex, "shared_download", "Downloaded via shared link");
};

// Record when a file is directly downloaded
const recordDirectDownload = async (contract, account, fileIndex) => {
  const now = new Date();
  const formattedTime = now.toLocaleTimeString();
  return recordFileAccess(
    contract, 
    account, 
    fileIndex, 
    "downloaded", 
    `Direct download at ${formattedTime}`
  );
};

// Get file history from the blockchain
const getFileHistory = async (contract, account, fileIndex) => {
  if (!contract || !account) return [];
  
  try {
    if (contract.getFileHistory) {
      const history = await contract.getFileHistory(account, fileIndex);
      
      return history.map(item => ({
        timestamp: new Date(item.timestamp.toNumber() * 1000),
        action: item.action,
        actionBy: item.actionBy,
        details: item.details
      }));
    }
    return [];
  } catch (error) {
    console.error("Error fetching file history:", error);
    return [];
  }
};

export default {
  recordFileAccess,
  recordSharedAccess,
  recordSharedDownload,
  recordDirectDownload,
  getFileHistory
};
