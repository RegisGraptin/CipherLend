import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const TOKENS = [
    // USDC address used by AAVE on sepolia
    "0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8",
    // Addresses used by Uniswap on sepolia
    "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238", // USDC
    "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984", // UNI
  ];

  for (const token of TOKENS) {
    const deployedToken = await deploy("ERC7984Mock", {
      from: deployer,
      args: [token],
      log: true,
    });
    console.log(`Confidential Wrapper contract: `, deployedToken.address);

    // Cooldown between deployments 
    await new Promise((resolve) => setTimeout(resolve, 5_000));

    // Verify the contract on Etherscan
    await hre.run("verify:verify", {
      address: deployedToken.address,
      constructorArguments: [token],
    });
  }
};
export default func;
func.id = "deploy_usdc_wrapper"; // id required to prevent reexecution
func.tags = ["ERC7984Mock"];
