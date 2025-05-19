// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

contract Upload {
  
  struct Access{
     address user; 
     bool access; //true or false
  }
  
  struct FileHistory {
    uint256 timestamp;
    string action;  // "upload", "delete", "share", etc.
    address actionBy;
    string details;
  }
  
  mapping(address=>string[]) value;
  mapping(address=>mapping(address=>bool)) ownership;
  mapping(address=>Access[]) accessList;
  mapping(address=>mapping(address=>bool)) previousData;
  // Add a mapping to track file history
  mapping(address=>mapping(uint256=>FileHistory[])) fileHistory;

  // Event to track file actions
  event FileAction(address indexed user, uint256 indexed fileIndex, string action, uint256 timestamp);
  
  // Define additional action types for file history
  event FileShared(address indexed owner, uint256 indexed fileIndex, address accessGranted);
  event FileAccessed(address indexed owner, uint256 indexed fileIndex, address accessedBy);
  event FileDownloaded(address indexed owner, uint256 indexed fileIndex, address downloadedBy);

  function add(address _user, string memory url) external {
    uint256 newFileIndex = value[_user].length;
    value[_user].push(url);
    
    // Record upload history
    FileHistory memory history = FileHistory({
      timestamp: block.timestamp,
      action: "upload",
      actionBy: msg.sender,
      details: "File uploaded"
    });
    
    fileHistory[_user][newFileIndex].push(history);
    emit FileAction(_user, newFileIndex, "upload", block.timestamp);
  }

  function deleteFile(address _user, uint256 fileIndex) external {
    require(_user == msg.sender, "Only owner can delete their files");
    require(fileIndex < value[_user].length, "File index out of bounds");
    
    // Record deletion in history before removing file
    FileHistory memory history = FileHistory({
      timestamp: block.timestamp,
      action: "delete",
      actionBy: msg.sender,
      details: "File deleted"
    });
    
    fileHistory[_user][fileIndex].push(history);
    emit FileAction(_user, fileIndex, "delete", block.timestamp);
    
    // Move the last element to the position of the element to delete
    // (if it's not already the last element)
    if (fileIndex < value[_user].length - 1) {
      value[_user][fileIndex] = value[_user][value[_user].length - 1];
      // We shouldn't move the history as it belongs to a different file
      // Keep the history of the deleted file at its index
    }
    
    // Remove the last element
    value[_user].pop();
  }

  function allow(address user) external {
    ownership[msg.sender][user]=true; 
    if(previousData[msg.sender][user]){
      for(uint i=0;i<accessList[msg.sender].length;i++){
        if(accessList[msg.sender][i].user==user){
          accessList[msg.sender][i].access=true; 
        }
      }
    } else {
      accessList[msg.sender].push(Access(user,true));  
      previousData[msg.sender][user]=true;  
    }
    
    // Record share action for all files
    for(uint256 i=0; i < value[msg.sender].length; i++) {
      FileHistory memory history = FileHistory({
        timestamp: block.timestamp,
        action: "share",
        actionBy: msg.sender,
        details: string(abi.encodePacked("Shared with ", toAsciiString(user)))
      });
      fileHistory[msg.sender][i].push(history);
      emit FileAction(msg.sender, i, "share", block.timestamp);
    }
  }
  
  function disallow(address user) public {
    ownership[msg.sender][user]=false;
    for(uint i=0;i<accessList[msg.sender].length;i++){
      if(accessList[msg.sender][i].user==user){ 
        accessList[msg.sender][i].access=false;  
      }
    }
    
    // Record unshare action for all files
    for(uint256 i=0; i < value[msg.sender].length; i++) {
      FileHistory memory history = FileHistory({
        timestamp: block.timestamp,
        action: "unshare",
        actionBy: msg.sender,
        details: string(abi.encodePacked("Unshared with ", toAsciiString(user)))
      });
      fileHistory[msg.sender][i].push(history);
      emit FileAction(msg.sender, i, "unshare", block.timestamp);
    }
  }

  function display(address _user) external view returns(string[] memory){
    require(_user==msg.sender || ownership[_user][msg.sender],"You don't have access");
    return value[_user];
  }

  function shareAccess() public view returns(Access[] memory){
    return accessList[msg.sender];
  }
  
  // New function to get file history
  function getFileHistory(address _user, uint256 fileIndex) public view returns(FileHistory[] memory) {
    require(_user == msg.sender || ownership[_user][msg.sender], "You don't have access");
    require(fileIndex < value[_user].length, "File index out of bounds");
    return fileHistory[_user][fileIndex];
  }
  
  // Function to record when a file is accessed via shareable link
  function recordFileAccess(address _owner, uint256 fileIndex, address accessedBy, string memory actionType) public {
    require(fileIndex < value[_owner].length, "File index out of bounds");
    require(_owner == msg.sender || ownership[_owner][msg.sender], "Not authorized to record access");
    
    // Record the access in file history
    FileHistory memory history = FileHistory({
      timestamp: block.timestamp,
      action: actionType,
      actionBy: accessedBy,
      details: string(abi.encodePacked("File viewed by ", toAsciiString(accessedBy)))
    });
    
    fileHistory[_owner][fileIndex].push(history);
    emit FileAccessed(_owner, fileIndex, accessedBy);
  }
  
  // Function to record when a file is downloaded via shareable link
  function recordFileDownload(address _owner, uint256 fileIndex, address downloadedBy, string memory actionType) public {
    require(fileIndex < value[_owner].length, "File index out of bounds");
    require(_owner == msg.sender || ownership[_owner][msg.sender], "Not authorized to record download");
    
    // Record the download in file history
    FileHistory memory history = FileHistory({
      timestamp: block.timestamp,
      action: actionType,
      actionBy: downloadedBy,
      details: string(abi.encodePacked("File downloaded by ", toAsciiString(downloadedBy)))
    });
    
    fileHistory[_owner][fileIndex].push(history);
    emit FileDownloaded(_owner, fileIndex, downloadedBy);
  }
  
  // Function to record when a shareable link is generated
  function recordShareLink(address _user, uint256 fileIndex, string memory actionType) public {
    require(_user == msg.sender, "Only owner can record share link actions");
    require(fileIndex < value[_user].length, "File index out of bounds");
    
    // Record the link generation in file history
    FileHistory memory history = FileHistory({
      timestamp: block.timestamp,
      action: actionType,
      actionBy: msg.sender,
      details: "Shareable link generated"
    });
    
    fileHistory[_user][fileIndex].push(history);
  }
  
  // Helper function to convert address to string
  function toAsciiString(address x) internal pure returns (string memory) {
    bytes memory s = new bytes(40);
    for (uint i = 0; i < 20; i++) {
      bytes1 b = bytes1(uint8(uint(uint160(x)) / (2**(8*(19 - i)))));
      bytes1 hi = bytes1(uint8(b) / 16);
      bytes1 lo = bytes1(uint8(b) - 16 * uint8(hi));
      s[2*i] = char(hi);
      s[2*i+1] = char(lo);            
    }
    return string(s);
  }
  
  function char(bytes1 b) internal pure returns (bytes1 c) {
    if (uint8(b) < 10) return bytes1(uint8(b) + 0x30);
    else return bytes1(uint8(b) + 0x57);
  }
}