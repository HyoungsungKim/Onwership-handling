import { expect } from "chai"
import hre, { ethers } from "hardhat"
import { time } from "@nomicfoundation/hardhat-network-helpers"

describe("OwnershipHandler", async function () {
    const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

    async function deployContract() {
        const signers = await ethers.getSigners()
        const OwnershipHandling = await ethers.getContractFactory("OwnershipHandler")    
        const ownershipHandling = await OwnershipHandling.deploy("Media art", "MART")
        await ownershipHandling.deployed()

        return {signers, ownershipHandling}
    }
    

    it("Test mint", async function () {
        const {signers, ownershipHandling} = await deployContract()
        const signerAddress = signers[0].address

        await ownershipHandling.mintNFT(signerAddress)
        expect(await ownershipHandling.ownerOf(1)).to.equal(signerAddress)

        await ownershipHandling.mintNFT(signerAddress)
        let owning = await ownershipHandling.viewOwning(signerAddress)
        expect(owning.length).to.equal(2)


        let filter = ownershipHandling.filters.Transfer(null, signerAddress, null)
        
        async function waitingFilterPrint() {            
            ownershipHandling.on(filter, (from, minter, tokenId) => {
                console.log("from", from)
                console.log("minter", minter)
                console.log("tokenId", tokenId)
                
                expect(parseInt(from, 16)).to.equal(0)
                expect(minter).to.equal(signerAddress)
            })
            return delay(5000)
        }

        console.log(await ownershipHandling.queryFilter(filter))
        expect(
            await waitingFilterPrint()
        )
    })

    it("Test rent", async function () {
        const {signers, ownershipHandling} = await deployContract()
        console.log("Contract address: ", ownershipHandling.address)

        const signerAddress = signers[0].address
        const toAddress = signers[1].address

        const rentalSince = new Date().getTime();
        let expiration = Math.floor(rentalSince/1000) + 30000000

        await ownershipHandling.mintNFT(signerAddress)
        await ownershipHandling.mintNFT(signerAddress)

        let filter1 = ownershipHandling.filters.UpdateUser(1, toAddress)        
        let filter2 = ownershipHandling.filters.UpdateUser(2, toAddress)        
        let filter3 = ownershipHandling.filters.UpdateUser(null, null) 

        const waitingFilterPrint = async (filter: any, idx: number) => {
            console.log(`filter ${idx}...`)

            //console.log(await ownershipHandling.queryFilter(filter))
            ownershipHandling.on("UpdateUser", (tokenId, toAddress, expiration, event) => {
                console.log("token Id", tokenId)
                console.log("to address", toAddress)
                console.log("expiration", expiration)                           
            })
            
            // Delay to print event log: https://github.com/NomicFoundation/hardhat/issues/1692#issuecomment-905674692
            return delay(5000)
        }

        expect(await ownershipHandling.ownerOf(1), "This address does not own the token 1").to.equal(signerAddress)
        expect(await ownershipHandling.ownerOf(2), "This address does not own the token 2").to.equal(signerAddress)
        expect(parseInt(await ownershipHandling.userOf(1), 16), "The signer cannot rent this token").to.equal(0)
        expect(parseInt(await ownershipHandling.userOf(2), 16), "The signer cannot rent this token").to.equal(0)

        
        
        //await ownershipHandling.setUser(2, toAddress, expiration)
        await expect((await ownershipHandling.setUser(1, toAddress, expiration))).to.emit(ownershipHandling, "UpdateUser").withArgs(1, toAddress, expiration)
        await expect((await ownershipHandling.setUser(2, toAddress, expiration))).to.emit(ownershipHandling, "UpdateUser").withArgs(2, toAddress, expiration)
        

        expect(await ownershipHandling.userOf(1), "The token 1 is not under rent").to.equal(toAddress)
        expect(await ownershipHandling.userOf(2), "The token 2 is not under rent").to.equal(toAddress)   
        
        console.log(await ownershipHandling.queryFilter(filter3))
        //await waitingFilterPrint(filter3, 1)
        //await waitingFilterPrint(filter3, 2)
    })
})