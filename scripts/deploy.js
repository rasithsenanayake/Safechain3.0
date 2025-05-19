const hre = require("hardhat");

async function main() {
  // Get the contract factory
  const Upload = await hre.ethers.getContractFactory("Upload");
  
  // Deploy the contract
  console.log("Deploying Upload contract...");
  const upload = await Upload.deploy();
  
  // Wait for deployment to complete
  await upload.deployed();

  console.log("Library deployed to:", upload.address);
}

// Run the deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
