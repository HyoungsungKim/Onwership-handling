// npx hardhat run --network goerli scripts/deploy.ts
// npx hardhat run --network sepolia scripts/deploy.ts

import { ethers } from "hardhat"

async function main() {
    console.log("Start deploying OwnershipHandler contract");
    const Minting = await ethers.getContractFactory("OwnershipHandler")
    const minting = await Minting.deploy(
        "MediaArt",
        "MART",
    )
    console.log(`contract address: ${minting.address}`)
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });

