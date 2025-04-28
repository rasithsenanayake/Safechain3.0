import Upload from "./artifacts/contracts/Upload.sol/Upload.json";
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import FileUpload from "./components/FileUpload";
import Display from "./components/Display";
import Modal from "./components/Modal";
import SharedFileView from "./components/SharedFileView";
import "./App.css";

function App() {
  const [account, setAccount] = useState("");
  const [contract, setContract] = useState(null);
  const [provider, setProvider] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [networkName, setNetworkName] = useState("");
  const [connectionStatus, setConnectionStatus] = useState("Connecting");
  const [isSharedFileView, setIsSharedFileView] = useState(false);
  const [sharedFileParams, setSharedFileParams] = useState(null);
  const [contractError, setContractError] = useState("");
  const [accountError, setAccountError] = useState("");

  useEffect(() => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);

    const loadBlockchainData = async () => {
      try {
        setConnectionStatus("Connecting to network");
        await provider.send("eth_requestAccounts", []);
        
        const network = await provider.getNetwork();
        setNetworkName(network.name === 'unknown' ? 'Local Network' : network.name);
        
        const signer = provider.getSigner();
        const address = await signer.getAddress();
        
        // Load the contract with better error handling
        try {
          let contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // Replace with your contract address
          const contract = new ethers.Contract(
            contractAddress,
            Upload.abi,
            signer
          );
          
          // Test if contract is properly loaded by calling a simple view function
          try {
            await contract.provider.getCode(contractAddress);
            
            setAccount(address);
            setContract(contract);
            setProvider(provider);
            
            // Make contract available globally for components that need it
            window.SafeChainApp = {
              contract,
              account: address
            };
            setConnectionStatus("Connected");
          } catch (contractMethodError) {
            console.error("Error testing contract:", contractMethodError);
            setContractError("Contract initialization failed. Please check contract address and network connection.");
          }
        } catch (contractError) {
          console.error("Error loading contract:", contractError);
          setContractError("Failed to load the contract. Please check if the contract is deployed to this network.");
        }
      } catch (error) {
        console.error("Blockchain data load error:", error);
        setAccountError("Failed to connect to blockchain. Please check your wallet connection.");
        setConnectionStatus("Connection failed");
      } finally {
        setLoading(false);
      }
    };

    const loadProvider = async () => {
      if (provider) {
        window.ethereum.on("chainChanged", () => {
          window.location.reload();
        });

        window.ethereum.on("accountsChanged", () => {
          window.location.reload();
        });
        
        await loadBlockchainData();
      } else {
        console.error("Metamask is not installed");
        setConnectionStatus("Metamask not installed");
        setLoading(false);
      }
    };
    provider && loadProvider();
  }, []);

  useEffect(() => {
    const url = new URL(window.location.href);
    const isShared = url.pathname === "/shared";
    
    if (isShared) {
      const address = url.searchParams.get("address");
      const fileIndex = url.searchParams.get("fileIndex");
      const fileName = url.searchParams.get("fileName");
      
      if (address && fileIndex) {
        setIsSharedFileView(true);
        setSharedFileParams({
          address,
          fileIndex: parseInt(fileIndex, 10),
          fileName: fileName || "Shared File"
        });
      }
    }
  }, []);

  return (
    <>
      {modalOpen && (
        <Modal setModalOpen={setModalOpen} contract={contract}></Modal>
      )}

      <div className="App">
        {isSharedFileView ? (
          <SharedFileView 
            contract={contract} 
            params={sharedFileParams}
            account={account}
          />
        ) : (
          <>
            <div className="page-header">
              <div className="logo-container">
                <img src="Safechain.png" alt="SafeChain Logo" className="logo" />
                <h1>SAFECHAIN</h1>
              </div>
              <p className="app-description">
                Secure decentralized file storage and sharing powered by blockchain technology
              </p>
              <div className="account-info">
                {loading ? (
                  <span>{connectionStatus}...</span>
                ) : account ? (
                  <>
                    <i className="fas fa-user-circle"></i> 
                    {` ${account.substring(0, 6)}...${account.substring(account.length - 4)}`}
                    {networkName && <span className="network-badge">{networkName}</span>}
                  </>
                ) : (
                  <>
                    <i className="fas fa-exclamation-circle"></i> Not connected
                  </>
                )}
                {contractError && <p className="error-message">{contractError}</p>}
                {accountError && <p className="error-message">{accountError}</p>}
              </div>
            </div>
            
            {loading ? (
              <div className="loading-container">
                <div className="loader"></div>
                <p>{connectionStatus}...</p>
              </div>
            ) : (
              <>
                <div className="container" style={{animationDelay: "0.1s"}}>
                  <h2><i className="fas fa-cloud-upload-alt"></i> Upload Files</h2>
                  <FileUpload
                    account={account}
                    provider={provider}
                    contract={contract}
                    onUploadComplete={() => {
                      if (document.querySelector('.display-container')) {
                        const displayElement = document.querySelector('.display-container');
                        if (displayElement.getData) {
                          displayElement.getData();
                        }
                      }
                    }}
                  />
                </div>
                
                <div className="container" style={{animationDelay: "0.3s"}}>
                  <h2><i className="fas fa-folder-open"></i> My Files</h2>
                  <Display 
                    contract={contract} 
                    account={account}
                  />
                </div>
              </>
            )}
          </>
        )}
        
        <footer className="app-footer">
          <p>
            &copy; {new Date().getFullYear()} SafeChain - Secure Decentralized Storage Solution
            {networkName && ` | Connected to ${networkName}`}
          </p>
        </footer>
      </div>
    </>
  );
}

export default App;
