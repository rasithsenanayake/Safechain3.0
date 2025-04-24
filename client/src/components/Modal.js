import { useState, useEffect, useRef } from "react";
import "./Modal.css";

const Modal = ({ setModalOpen, contract }) => {
  const [address, setAddress] = useState("");
  const [isSharing, setIsSharing] = useState(false);
  const [accessList, setAccessList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const modalRef = useRef(null);

  const sharing = async () => {
    if (!address.trim()) {
      alert("Please enter a valid address");
      return;
    }
    
    try {
      setIsSharing(true);
      await contract.allow(address);
      setIsSharing(false);
      setModalOpen(false);
      alert("Access granted successfully!");
    } catch (error) {
      console.error("Sharing error:", error);
      setIsSharing(false);
      alert("An error occurred while sharing. Please try again.");
    }
  };

  const handleAddressChange = (e) => {
    setAddress(e.target.value);
  };

  const handleClickOutside = (event) => {
    if (modalRef.current && !modalRef.current.contains(event.target)) {
      setModalOpen(false);
    }
  };

  useEffect(() => {
    const loadAccessList = async () => {
      try {
        if (contract) {
          setIsLoading(true);
          const addresses = await contract.shareAccess();
          setAccessList(addresses);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Failed to load access list:", error);
        setIsLoading(false);
      }
    };
    
    loadAccessList();
    
    // Add event listener for clicking outside
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [contract]);

  const handleSelectAddress = (e) => {
    if (e.target.value !== "People With Access") {
      setAddress(e.target.value);
    }
  };

  return (
    <div className="modalBackground">
      <div className="modalContainer" ref={modalRef}>
        <div className="titleCloseBtn">
          <button onClick={() => setModalOpen(false)}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <div className="title">
          <i className="fas fa-share-alt"></i> SafeChain Sharing
        </div>
        
        <div className="body">
          <input
            type="text"
            className="address"
            placeholder="Enter Wallet Address (0x...)"
            value={address}
            onChange={handleAddressChange}
          />
        </div>
        
        <div className="select-container">
          <label htmlFor="selectNumber">
            <i className="fas fa-users"></i> People with access:
          </label>
          <select 
            id="selectNumber" 
            onChange={handleSelectAddress} 
            className="address-select"
            disabled={isLoading}
          >
            <option value="People With Access">Select an address</option>
            {isLoading ? (
              <option disabled>Loading...</option>
            ) : (
              accessList.map((addr, index) => (
                <option key={index} value={addr}>
                  {addr.substring(0, 6)}...{addr.substring(addr.length - 4)}
                </option>
              ))
            )}
          </select>
        </div>
        
        <div className="footer">
          <button
            onClick={() => setModalOpen(false)}
            id="cancelBtn"
            disabled={isSharing}
          >
            <i className="fas fa-times"></i> Cancel
          </button>
          <button 
            onClick={sharing} 
            disabled={isSharing || !address.trim()}
            className={isSharing ? "loading-btn" : ""}
          >
            {isSharing ? (
              <>
                <span className="spinner"></span> Processing...
              </>
            ) : (
              <>
                <i className="fas fa-paper-plane"></i> Share
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;
