import { ethers } from "hardhat"

async function main() {
    console.log("Start deploying ERC-4907 contract");
    const Minting = await ethers.getContractFactory("ERC4907")
    const minting = await Minting.deploy(
        "MediaArt",
        "MART",
    )
    console.log(`contract address:${minting.address}`)
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });

