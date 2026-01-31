import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm } from "hardhat";
import { ConfidentialLending, ERC20Mock, ERC7984Mock } from "../types";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";
import { parseUnits, ZeroHash } from "ethers";

type Signers = {
  deployer: HardhatEthersSigner;
  alice: HardhatEthersSigner;
  bob: HardhatEthersSigner;
};

async function deployMocksFixture(tokenName: string = "USDC", decimals: number = 6) {
  // Deploy mock USDC
  const erc20Factory = await ethers.getContractFactory("ERC20Mock");
  const mockERC20 = await erc20Factory.deploy(tokenName, tokenName, decimals);
  const mockERC20Address = await mockERC20.getAddress();

  // Deploy ERC7984 mock (Confidential cUSDC) wrapping the mock USDC
  const erc7984Factory = await ethers.getContractFactory("ERC7984Mock");
  const confidentialERC7984 = await erc7984Factory.deploy(mockERC20Address);
  const confidentialERC7984Address = await confidentialERC7984.getAddress();

  return { mockERC20, mockERC20Address, confidentialERC7984, confidentialERC7984Address };
}

async function deployConfidentialLendingFixture(
  signers: Signers,
  confidentialERC7984Address: string,
) {
  // For now, use a dummy AAVE pool address since we're just testing deployment
  const dummyAavePool = signers.alice.address;

  const confidentialLendingFactory = await ethers.getContractFactory("ConfidentialLending");
  const confidentialLending = await confidentialLendingFactory.deploy(
    dummyAavePool,
    confidentialERC7984Address,
    "Confidential Lending cUSDC",
    "lcUSDC",
  );
  const confidentialLendingAddress = await confidentialLending.getAddress();

  return { confidentialLending, confidentialLendingAddress };
}

async function mintConfidentialTokenToUser(
  user: HardhatEthersSigner,
  amount: bigint,
  mockERC20: ERC20Mock,
  confidentialERC7984: ERC7984Mock,
) {
  const formattedAmount = parseUnits(amount.toString(), await mockERC20.decimals());
  const mintTx = await mockERC20.mint(user.address, formattedAmount);
  await mintTx.wait();
  const approveTx = await mockERC20.connect(user).approve(await confidentialERC7984.getAddress(), formattedAmount);
  await approveTx.wait();
  const wrapTx = await confidentialERC7984.connect(user).wrap(user.address, formattedAmount);
  await wrapTx.wait();
}


describe("ConfidentialLending", function () {
  let signers: Signers;
  let mockUSDC: ERC20Mock;
  let mockUSDCAddress: string;
  let confidentialCUSDC: ERC7984Mock;
  let confidentialCUSDCAddress: string;
  let confidentialLending: ConfidentialLending;
  let confidentialLendingAddress: string;

  before(async function () {
    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = { deployer: ethSigners[0], alice: ethSigners[1], bob: ethSigners[2] };
  });

  beforeEach(async function () {
    // Check whether the tests are running against an FHEVM mock environment
    if (!fhevm.isMock) {
      console.warn(`This hardhat test suite cannot run on Sepolia Testnet`);
      this.skip();
    }

    ({ mockERC20: mockUSDC, mockERC20Address: mockUSDCAddress, confidentialERC7984: confidentialCUSDC, confidentialERC7984Address: confidentialCUSDCAddress } = await deployMocksFixture());
    ({ confidentialLending, confidentialLendingAddress } = await deployConfidentialLendingFixture(
      signers,
      confidentialCUSDCAddress,
    ));
  });

  it("should initialize with correct deployment variables", async function () {
    const aavePoolAddress = await confidentialLending.AAVE_POOL_ADDRESS();
    const assetAddress = await confidentialLending.asset();

    expect(aavePoolAddress).to.equal(signers.alice.address);
    expect(assetAddress).to.equal(mockUSDCAddress);
  });

  it("should increase user balance when wrapping USDC", async function () {
    // Mint 1000 USDC to alice
    const amountToMint = 1000n;
    await mintConfidentialTokenToUser(signers.alice, amountToMint, mockUSDC, confidentialCUSDC);

    const encryptedAmount = await fhevm
      .createEncryptedInput(confidentialCUSDCAddress, signers.alice.address)
      .add64(amountToMint)
      .encrypt();

    const transferTx = await confidentialCUSDC
      .connect(signers.alice)
      ["confidentialTransferAndCall(address,bytes32,bytes,bytes)"]
      (confidentialLendingAddress, encryptedAmount.handles[0], encryptedAmount.inputProof, "0x");
    await transferTx.wait();

    const encryptedLendingBalance = await confidentialLending.confidentialBalanceOf(signers.alice.address);
    const clearLendingBalance = await fhevm.userDecryptEuint(
      FhevmType.euint64,
      encryptedLendingBalance,
      confidentialLendingAddress,
      signers.alice,
    );

    expect(clearLendingBalance).to.equal(amountToMint);
  });

  it("other tokens should not increase confidential lending balance", async function () {
    const amountToMint = 1000n;
    const { mockERC20: mockDAI, confidentialERC7984: confidentialCDAI, confidentialERC7984Address: confidentialCDAIAddress } = await deployMocksFixture("DAI", 18);
    await mintConfidentialTokenToUser(signers.alice, amountToMint, mockDAI, confidentialCDAI);

    const formattedAmount = parseUnits(amountToMint.toString(), 6);

    // Try to send confidential DAI to lending (should not be transferred)
    const encryptedAmount = await fhevm
      .createEncryptedInput(confidentialCDAIAddress, signers.alice.address)
      .add64(amountToMint)
      .encrypt();

    const transferTx = await confidentialCDAI
      .connect(signers.alice)
      ["confidentialTransferAndCall(address,bytes32,bytes,bytes)"]
      (confidentialLendingAddress, encryptedAmount.handles[0], encryptedAmount.inputProof, "0x");
    await transferTx.wait();

    // Verify alice still has her confidential DAI (refunded)
    const cDAIBalanceAfter = await confidentialCDAI.confidentialBalanceOf(signers.alice.address);
    const clearCDAIBalanceAfter = await fhevm.userDecryptEuint(
      FhevmType.euint64,
      cDAIBalanceAfter,
      confidentialCDAIAddress,
      signers.alice,
    );
    expect(clearCDAIBalanceAfter).to.equal(formattedAmount);

    // Verify lending balance is still the zero handle (not initialized)
    const encryptedLendingBalance = await confidentialLending.confidentialBalanceOf(signers.alice.address);
    expect(encryptedLendingBalance).to.be.eq(ZeroHash);
  });
});
