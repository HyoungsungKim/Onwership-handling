import React, {useState, useEffect} from 'react';
import { Buffer } from 'buffer';

import { ethers, Contract } from 'ethers';
import {encrypt} from "@metamask/eth-sig-util"

import {Box, Button, Stack, TextField, Typography, Paper  } from '@mui/material';
import {Table, TableBody, TableCell, TableContainer, TableHead, TableRow} from '@mui/material';

import ContractABI from "./contract_abi/OwnershipHandler.json"

declare global {
  interface Window {
      ethereum: any;
      Buffer: Buffer;
  }
}

interface Props {
  setLoading: React.Dispatch<React.SetStateAction<boolean>>
  setSuccess: React.Dispatch<React.SetStateAction<boolean>>
}

interface HandshakeStatus {
  ownerConfirm: boolean,
  userConfirm: boolean,
  encryptedPhraseByOwner: string;
  encryptedPhraseByUser: string;
  updatedEncryptedURI: string ; // AES encrypted
}

const CONTRACT_ADDRESS = "0x06Ed9d96aE41677deF0629a8171278cAb1F48E78";
const txOverrides = {
  //value: ethers.utils.parseEther('0.0001'),
  gasLimit: 1000000,
}

let connect: Connect | undefined = undefined;
let provider: ethers.providers.Web3Provider;

interface ConnectProps {
  account: string | undefined
}

// https://github.com/MetaMask/test-dapp/blob/main/src/index.js#L1416
function stringifiableToHex(value: any) {
  return ethers.utils.hexlify(Buffer.from(JSON.stringify(value)));
}

class Connect {
  private provider: ethers.providers.Web3Provider;
  private signer: ethers.providers.JsonRpcSigner;

  constructor(externalProvider: ethers.providers.ExternalProvider) {
      this.provider = new ethers.providers.Web3Provider(externalProvider)
      this.signer = this.provider.getSigner();
  }

  getProvider(): ethers.providers.Web3Provider {
      return this.provider;
  }

  getSigner(): ethers.providers.JsonRpcSigner | undefined {
      return this.signer;
  }
}

function getContract(connect: Connect | undefined ): Contract {
  if (!connect) { }
  const abi = ContractABI.abi;
  const signer = connect!.getSigner();
  const contract = new Contract(CONTRACT_ADDRESS, abi, signer)

  return contract
}

function ConnectAccount(props: ConnectProps): JSX.Element {
  const [isConnected, setIsConnected] = useState<boolean>(false)
  const [account, setAccount] = useState<string|undefined>(props.account)

  useEffect(() => {
    connect = new Connect(window.ethereum);
  }, [account])

  const connectMetamask = async () => {
    connect = new Connect(window.ethereum);
    provider = connect.getProvider();
    await provider.send("eth_requestAccounts", []);
    const signer= connect.getSigner()

    setIsConnected(true)
    setAccount(await signer?.getAddress())
  }

  const clickHandler = async () => {
    if (!isConnected) {
      await connectMetamask()
      console.log("Account", account)
    }
  }

  return  (
    <Box m={2}>
      <Typography align="center" >Connect to MetaMask</Typography>
      {
        isConnected ? (
          <Typography variant="h6">{account}</Typography>
        ) :(
          <Typography align="center" >
            
            <Button variant="outlined" size="small" color="inherit" onClick={clickHandler}>
              Connect to Metamask
            </Button> 
          </Typography>
        )
      }
    </Box>
  ) 
}

function Mint(props: Props): JSX.Element {
  const {setLoading, setSuccess} = props
  const [tokenId, setTokenId] = useState<string|undefined>()
  const [filePath, setFilePath] = useState<string|undefined>()
  const [fileName, setFileName] = useState<string|undefined>()

  const passFieldHandler = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFilePath(event.target.value);
  }

  const fileNameFieldHandler = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFileName(event.target.value);
  }


  const clickHandler = async () => {
    const contract = getContract(connect)
    const toAddress = await connect!.getSigner()?.getAddress()
    console.log(toAddress)

    setLoading(true)
    setSuccess(false)

    const mintingResult = await contract.mintNFT(toAddress, filePath!+fileName)
    const receipt = await mintingResult.wait()
    console.log(receipt)
    setLoading(false)
    setSuccess(true)

    const hexTokenId = receipt.logs[0].topics[3]
    const tokenId_dec = parseInt(hexTokenId, 16).toString()
    setTokenId(tokenId_dec)
    console.log("receipt:", receipt)
    console.log("tokenId:", tokenId_dec)
  }

  return (
      <Box m={2}>
        {tokenId ? (
            <Stack spacing={2} direction="column" sx={{my:1}} justifyContent="center">    
              <Typography align="center" >Step 1 Mint NFT</Typography>
              <Typography align="center" >Token Id: {tokenId}</Typography>
            </Stack>
          ) :
          (
            <Stack spacing={2} direction="column" sx={{my:1}} justifyContent="center">    
              <Typography align="center" >Step 1 Mint NFT</Typography>
            </Stack>
          )}
          <Stack spacing={2} direction="row" sx={{my:1}} justifyContent="center">     
            <Typography component={'span'} align="center" >
              <TextField id="Path" label="path" variant="standard" size="small" onChange={passFieldHandler}/>
            </Typography>

            <Typography component={'span'} align="center" >
              <TextField id="FileName" label="file name" variant="standard" size="small" onChange={fileNameFieldHandler}/>
            </Typography>

            <Typography align="center" >
              <Button variant="outlined" size="small" color="inherit" onClick={clickHandler} disabled={!filePath || !fileName} sx={{height: 45 }}>
                Mint
              </Button>           
            </Typography>
          </Stack>
      </Box>
  )
}

function RentNFT(props: Props): JSX.Element {
  const {setLoading, setSuccess} = props

  const [tokenId, setTokenId] = useState<string|undefined>()
  const [toAddress, setToAddress] = useState<string|undefined>()


  const textFieldHandler = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTokenId(event.target.value);
  }

  const toAddressFieldHandler = (event: React.ChangeEvent<HTMLInputElement>) => {
    setToAddress(event.target.value);
  }


  const RentButtonClickHandler = async () => {
    const contract = getContract(connect)
    const rentalSince = new Date().getTime();
    const expiration = Math.floor(rentalSince/1000) + 3600

    const txResult = await contract.setUser(tokenId, toAddress, expiration)

    setLoading(true)
    setSuccess(false)

    await txResult.wait()
    //const receipt = await txResult.wait()

    setLoading(false)
    setSuccess(true)
  }

  return (
      <Box m={2}>
      {(tokenId && toAddress) ? (
            <Stack spacing={2} direction="column" sx={{my:1}} justifyContent="center">    
              <Typography align="center" >Step 2</Typography>
              <Typography align="center" >The token id {tokenId} will be rented to {toAddress} for 3600 sec</Typography>
            </Stack>
          ) :
          (
            <Stack spacing={2} direction="column" sx={{my:1}} justifyContent="center">    
              <Typography align="center" >Step 2</Typography>
              <Typography align="center" >Owner enter token id and user's address</Typography>
            </Stack>
          )}
        <Stack spacing={2} direction="row" sx={{my:1}} justifyContent="center">     
          <Typography component={'span'} align="center" >
            <TextField id="TokenId" label="Token Id" variant="standard" size="small" onChange={textFieldHandler}/>
          </Typography>

          <Typography component={'span'} align="center" >
            <TextField id="ToAddress" label="to address" variant="standard" size="small" onChange={toAddressFieldHandler}/>
          </Typography>

          <Typography component={'span'} align="center" >
            <Button variant="outlined" size="small" color="inherit" sx={{height: 45 }} onClick={RentButtonClickHandler} disabled={!toAddress}>
              Rent NFT
            </Button> 
          </Typography>
        </Stack>
      </Box>
  )
}

function ShowStatus(props: Props): JSX.Element {
  const {setLoading, setSuccess} = props

  const [tokenId, setTokenId] = useState<string|undefined>()
  const [ownerAddr, setOwnerAddr] = useState<string|undefined>()
  const [userAddr, setUserAddr] = useState<string|undefined>()


  const textFieldHandler = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setTokenId(event.target.value);
  }

  const RentButtonClickHandler = async () => {
    const contract = getContract(connect)
    try {
      let ownerAddr = (await contract.ownerOf(tokenId)).toString()
      let userAddr = (await contract.userOf(tokenId)).toString()
      setOwnerAddr(ownerAddr)
      setUserAddr(userAddr)
    } catch {
      setOwnerAddr("Owner does not exist")
      setUserAddr("User does not exist")
    }
    

    setLoading(true)
    setSuccess(false)

    
    //const receipt = await txResult.wait()

    setLoading(false)
    setSuccess(true)
  }

  return (
      <Box m={2}>
      {tokenId ? (
          <Stack spacing={2} direction="column" sx={{my:1}} justifyContent="center">    
            <Typography align="center" >Step 3</Typography>
            <Typography align="center" >Owner: {ownerAddr}</Typography>
            <Typography align="center" >User: {userAddr}</Typography>
          </Stack>
          ) :
          (
            <Stack spacing={2} direction="column" sx={{my:1}} justifyContent="center">    
              <Typography align="center" >Step 3</Typography>
              <Typography align="center" >Show rental status of token id</Typography>
            </Stack>
          )}
        <Stack spacing={2} direction="row" sx={{my:1}} justifyContent="center">     
          <Typography component={'span'} align="center" >
            <TextField id="TokenId" label="Token Id" variant="standard" size="small" onChange={textFieldHandler}/>
          </Typography>

          <Typography component={'span'} align="center" >
            <Button variant="outlined" size="small" color="inherit" sx={{height: 45 }} onClick={RentButtonClickHandler} disabled={!tokenId}>
              Get status
            </Button> 
          </Typography>
        </Stack>
      </Box>
  )
}


function HandlePubKey(props: Props): JSX.Element {
  const {setLoading, setSuccess} = props

  const [pubKey, setPubKey] = useState<string|undefined>()
  const [receivedPubKey, setReceivedPubKey] = useState<string|undefined>()

  const setPubKeyButtonClickHandler = async () => {
    const contract = getContract(connect)
    const provider = connect?.getProvider()
    const addr = await connect?.getSigner()?.getAddress()

    setLoading(true)
    setSuccess(false)

    console.log(addr)
    await provider?.send("eth_getEncryptionPublicKey", [addr])
    const pubKey = await provider?.send("eth_getEncryptionPublicKey", [addr])
    setPubKey(pubKey)
    console.log(pubKey)

    const txResult = await contract.setPubKey(pubKey)
    await txResult.wait()
    //const receipt = await txResult.wait()

    setLoading(false)
    setSuccess(true)
  }

  const getPubKeyButtonClickHandler = async () => {
    const contract = getContract(connect)
    const addr = await connect?.getSigner()?.getAddress()

    setLoading(true)
    setSuccess(false)
    const receivedPubKey = await contract.getPubKey(addr)
    setReceivedPubKey(receivedPubKey)

    setLoading(false)
    setSuccess(true)
  }

  return (
      <Box m={2}>
      {pubKey ? (
          <Stack spacing={2} direction="column" sx={{my:1}} justifyContent="center">  
            <Typography align="center" >Step 4</Typography>  
            <Typography align="center" >Public key: {pubKey}</Typography>
            {
              receivedPubKey ? (
                <Typography align="center" >Received public key: {receivedPubKey}</Typography>
              ) : (
                <Typography align="center" >Get a public key from Blockchain</Typography>
              )
            }
          </Stack>
          ) :
          (
            <Stack spacing={2} direction="column" sx={{my:1}} justifyContent="center">  
              <Typography align="center" >Step 4</Typography>  
              <Typography align="center" >Set/Get pubkey</Typography>
            </Stack>
          )}
        <Stack spacing={2} direction="row" sx={{my:1}} justifyContent="center">     
          <Typography component={'span'} align="center" >
            {
              // <TextField id="TokenId" label="Token Id" variant="standard" size="small" onChange={textFieldHandler}/>
            }
          </Typography>

          <Typography component={'span'} align="center" >
            <Button variant="outlined" size="small" color="inherit" sx={{height: 45 }} onClick={setPubKeyButtonClickHandler}>
              Set public key
            </Button> 
          </Typography>

          <Typography component={'span'} align="center" >
            <Button variant="outlined" size="small" color="inherit" sx={{height: 45 }} onClick={getPubKeyButtonClickHandler}>
              Get public key
            </Button> 
          </Typography>
        </Stack>
      </Box>
  )
}


function SetSecretPhrase(props: Props): JSX.Element {
  const {setLoading, setSuccess} = props

  const [tokenId, setTokenId] = useState<string|undefined>()
  const [receivedPubKey, setReceivedPubKey] = useState<string|undefined>()
  const [param, setParam] = useState<unknown>()


  const tokenIdFieldHandler = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setTokenId(event.target.value);
  }

  const phraseFieldHandler = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setParam(event.target.value);
  }

  const EncryptButtonClickHandler = async () => {


    const contract = getContract(connect)
    const addr = await connect?.getSigner()?.getAddress()

    if (addr === await contract.ownerOf(tokenId).valueOf()) {
      setLoading(true)
      setSuccess(false)

      console.log("This address is Owner")
      const userAddr = await contract.userOf(tokenId)
      const pubKeyOfUser: string = await contract.getPubKey(userAddr)
      setReceivedPubKey(pubKeyOfUser)

      console.log(pubKeyOfUser)

      const version: string = "x25519-xsalsa20-poly1305"
      const encryptedPhrase = stringifiableToHex(encrypt({publicKey: pubKeyOfUser, data: param, version: version}))
      console.log(encryptedPhrase)
      contract.setEncryptedPhrase(tokenId, encryptedPhrase)
      
      console.log(encryptedPhrase)
      
    setLoading(false)
    setSuccess(true)

    } else if (addr === await contract.userOf(tokenId).valueOf()) {
      setLoading(true)
      setSuccess(false)

      console.log("This address is User")
      const ownerAddr = await contract.ownerOf(tokenId)
      const pubKeyOfOwner: string = await contract.getPubKey(ownerAddr)
      setReceivedPubKey(pubKeyOfOwner)

      console.log(pubKeyOfOwner)

      const version: string = "x25519-xsalsa20-poly1305"
      const encryptedPhrase = stringifiableToHex(encrypt({publicKey: pubKeyOfOwner, data: param, version: version}))
      contract.setEncryptedPhrase(tokenId, encryptedPhrase)

      console.log(encryptedPhrase)
      
      setLoading(false)
      setSuccess(true)
    }
    //const receipt = await txResult.wait()
  }

  return (
      <Box m={2}>
      {(tokenId && receivedPubKey) ? (
          <Stack spacing={2} direction="column" sx={{my:1}} justifyContent="center">    
            <Typography align="center" >Step 5</Typography>
            <Typography align="center" >Token id: {tokenId}</Typography>
            <Typography align="center" >Public key: {receivedPubKey}</Typography>
          </Stack>
          ) :
          (
            <Stack spacing={2} direction="column" sx={{my:1}} justifyContent="center">    
              <Typography align="center" >Step 5</Typography>
              <Typography align="center">Encrypt phrase using a pubkey</Typography>
              <Typography align="center">(Owner: Encrypt filename, User: Encrypt file path)</Typography>
            </Stack>
          )}
        <Stack spacing={2} direction="row" sx={{my:1}} justifyContent="center">     
          <Typography component={'span'} align="center" >
            <TextField id="TokenId" label="Token Id" variant="standard" size="small" onChange={tokenIdFieldHandler}/>
          </Typography>

          <Typography component={'span'} align="center" >
            <TextField id="Phrase" label="Phrase" variant="standard" size="small" onChange={phraseFieldHandler}/>
          </Typography>

          <Typography component={'span'} align="center" >
            <Button variant="outlined" size="small" color="inherit" sx={{height: 45 }} onClick={EncryptButtonClickHandler} disabled={(!tokenId || !param)}>
              Encrypt
            </Button> 
          </Typography>
        </Stack>
      </Box>
  )
}

function DepositAsset(props: Props): JSX.Element {
  const {setLoading, setSuccess} = props

  const [balance, setBalance] = useState<string|undefined>()

  const depositTxOverride = {
    value: ethers.utils.parseEther('0.00001'),
    gasLimit: 500000,
  }

  const depositButtonClickHandler = async () => {
    const contract = getContract(connect)

    setLoading(true)
    setSuccess(false)

    contract.depositAsset(depositTxOverride)
    
    //const receipt = await txResult.wait()

    setLoading(false)
    setSuccess(true)
  }

  const getBalanceButtonClickHandler = async () => {
    const contract = getContract(connect)

    setLoading(true)
    setSuccess(false)

    const txResult = await contract.getDeposit()
    const parsedBalance = parseInt(txResult._hex, 16).toString()
    setBalance(ethers.utils.formatEther(parsedBalance).toString())
    //const receipt = await txResult.wait()

    setLoading(false)
    setSuccess(true)
  }

  const liquidationButtonClickHandler = async () => {
    const contract = getContract(connect)
    const addr = connect?.getSigner()?.getAddress()

    setLoading(true)
    setSuccess(false)

    const txResult = await contract._transferAsset(addr, addr, depositTxOverride)
    await txResult.wait()

    setLoading(false)
    setSuccess(true)
  }

  return (
      <Box m={2}>
      {balance ? (
          <Stack spacing={2} direction="column" sx={{my:1}} justifyContent="center">    
            <Typography align="center" >Step 6</Typography>
            <Typography align="center" >User's Balance: {balance}</Typography>
          </Stack>
          ) :
          (
            <Stack spacing={2} direction="column" sx={{my:1}} justifyContent="center">    
              <Typography align="center" >Step 6</Typography>
              <Typography align="center" >Deposit 0.00001 ETH to CA account</Typography>
            </Stack>
          )}
        <Stack spacing={2} direction="row" sx={{my:1}} justifyContent="center">     
          <Typography component={'span'} align="center" >
            <Button variant="outlined" size="small" color="inherit" sx={{height: 45 }} onClick={depositButtonClickHandler}>
              Deposit ETH
            </Button> 
          </Typography>

          <Typography component={'span'} align="center" >
            <Button variant="outlined" size="small" color="inherit" sx={{height: 45 }} onClick={getBalanceButtonClickHandler}>
              Get Balance
            </Button> 
          </Typography>

          <Typography component={'span'} align="center" >
            <Button variant="outlined" size="small" color="inherit" sx={{height: 45 }} onClick={liquidationButtonClickHandler}>
              Liquidation
            </Button> 
          </Typography>
        </Stack>
      </Box>
  )
}

function SetOwnerConfirm(props: Props): JSX.Element {
  const {setLoading, setSuccess} = props

  const [tokenId, setTokenId] = useState<string|undefined>()
  const [amount, setAmount] = useState<string|undefined>()

  const tokenIdFieldHandler = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setTokenId(event.target.value);
  }

  const amountFieldHandler = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(event.target.value);
  }


  const ConfirmButtonClickHandler = async () => {
    const contract = getContract(connect)

    setLoading(true)
    setSuccess(false)
    console.log(amount)
    const txResult = await contract.setOwnerConfirm(tokenId, ethers.utils.parseEther(amount!), txOverrides)
    await txResult.wait()
    //const receipt = await txResult.wait()

    setLoading(false)
    setSuccess(true)
  }

  return (
      <Box m={2}>
        {amount ? (
            <Stack spacing={2} direction="column" sx={{my:1}} justifyContent="center">    
              <Typography align="center" >Step 7</Typography>
              <Typography align="center" >Requesting amount: {amount}</Typography>
            </Stack>
          ) :
          (
            <Stack spacing={2} direction="column" sx={{my:1}} justifyContent="center">    
              <Typography align="center" >Step 7</Typography>
              <Typography align="center" >Set owner confirm</Typography>
            </Stack>
          )}

        <Stack spacing={2} direction="row" sx={{my:1}} justifyContent="center">     
          <Typography component={'span'} align="center" >
            <TextField id="TokenId" label="Token Id" variant="standard" size="small" onChange={tokenIdFieldHandler}/>
          </Typography>

          <Typography component={'span'} align="center" >
            <TextField id="Amount" label="Amount" variant="standard" size="small" onChange={amountFieldHandler}/>
          </Typography>

          <Typography component={'span'} align="center" >
            <Button variant="outlined" size="small" color="inherit" sx={{height: 45 }} onClick={ConfirmButtonClickHandler} disabled={!tokenId}>
              Confirm
            </Button> 
          </Typography>
        </Stack>
      </Box>
  )
}

function SetExpectedURI(props: Props): JSX.Element {
  const {setLoading, setSuccess} = props
  const [tokenId, setTokenId] = useState<string|undefined>()
  const [fileName, setFileName] = useState<string|undefined>()
  const [decryptedPath, setDecryptedPath] = useState<string|undefined>()
  const [expectedEncryptedURI, setExpectedEncryptedURI] = useState<string|undefined>()

  const tokenIdFieldHandler = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTokenId(event.target.value);
  }

  const fileNameFieldHandler = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFileName(event.target.value);
  }


  const getDecryptedURIButtonHandler = async () => {
    const contract = getContract(connect)
    const provider = connect?.getProvider()
    const addr = await connect?.getSigner()?.getAddress()

    const handShakeStatus = await contract.showHandShakeStatus(tokenId)
    console.log(handShakeStatus)
    const encryptedPath = await handShakeStatus.encryptedPhraseByUser

    setLoading(true)
    setSuccess(false)

    const decryptedPath = await provider?.send("eth_decrypt", [encryptedPath, addr])
    console.log(decryptedPath)
    setDecryptedPath(decryptedPath)

    setLoading(false)
    setSuccess(true)
  }

  const setEncryptedURIButtonHandler = async () => {
    const contract = getContract(connect)

    //const pubKey = await contract.getPubKey(await contract.ownerOf(tokenId))

    //const version: string = "x25519-xsalsa20-poly1305"
    //const expectedEncryptedURI = stringifiableToHex(encrypt({publicKey: pubKey, data: decryptedPath! + fileName, version: version}))
    
    const hashedPath = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(decryptedPath! + fileName))
    setLoading(true)
    setSuccess(false)

    contract.setUpdatedEncryptedURI(tokenId, hashedPath)  
    setExpectedEncryptedURI(hashedPath.toString())

    setLoading(false)
    setSuccess(true)
  }

  return (
      <Box m={2}>
        {decryptedPath ? (
            <Stack spacing={2} direction="column" sx={{my:1}} justifyContent="center">    
              <Typography align="center" >Step 8</Typography>
              <Typography align="center" >Decrypted Path: {decryptedPath}</Typography>
              <Typography align="center" >Expected Encrypted URI Path: {expectedEncryptedURI?.slice(0, 12) + "..."}</Typography>
            </Stack>
          ) :
          (
            <Stack spacing={2} direction="column" sx={{my:1}} justifyContent="center">    
              <Typography align="center" >Step 9</Typography>
              <Typography align="center" >Owner sets expected URI of user</Typography>
            </Stack>
          )}
          <Stack spacing={2} direction="row" sx={{my:1}} justifyContent="center">     
            <Typography component={'span'} align="center" >
              <TextField id="TokenId" label="Token Id" variant="standard" size="small" onChange={tokenIdFieldHandler}/>
            </Typography>

            <Typography component={'span'} align="center" >
              <TextField id="FileName" label="File name" variant="standard" size="small" onChange={fileNameFieldHandler}/>
            </Typography>

            <Typography align="center" >
              <Button variant="outlined" size="small" color="inherit" onClick={getDecryptedURIButtonHandler} disabled={!fileName} sx={{height: 45 }}>
                Get
              </Button>           
            </Typography>

            <Typography align="center" >
              <Button variant="outlined" size="small" color="inherit" onClick={setEncryptedURIButtonHandler} disabled={!fileName} sx={{height: 45 }}>
                Write
              </Button>           
            </Typography>
          </Stack>
      </Box>
  )
}

function SetUserConfirm(props: Props): JSX.Element {
  const {setLoading, setSuccess} = props
  const [tokenId, setTokenId] = useState<string|undefined>()
  const [filePath, setFilePath] = useState<string|undefined>()
  const [decryptedFileName, setDecryptedFileName] = useState<string|undefined>()
  const [hashedPath, setHashedPath] = useState<string|undefined>()
  const [expect, setExpect] = useState<string|undefined>()

  const filePathFieldHandler = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFilePath(event.target.value);
  }

  const tokenIdFieldHandler = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTokenId(event.target.value);
  }

  const getFilePathButtonHandler = async () => {
    const contract = getContract(connect)
    const provider = connect?.getProvider()
    const addr = await connect?.getSigner()?.getAddress()

    const handShakeStatus: HandshakeStatus = await contract.showHandShakeStatus(tokenId)
    const encryptedFileName = handShakeStatus.encryptedPhraseByOwner
    console.log(handShakeStatus)

    const expect = handShakeStatus.updatedEncryptedURI
    setExpect(expect)

    setLoading(true)
    setSuccess(false)

    const decryptedFileName = await provider?.send("eth_decrypt", [encryptedFileName, addr])
    setDecryptedFileName(decryptedFileName)
    console.log(decryptedFileName)

    setLoading(false)
    setSuccess(true)  
  }

  const setConfirmButtonHandler = async () => {
    const contract = getContract(connect)

    setLoading(true)
    setSuccess(false)
    console.log(filePath)
    console.log(decryptedFileName)
    console.log(filePath! + decryptedFileName)

    const hashedPath = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(filePath! + decryptedFileName))
    console.log(hashedPath)
    console.log(expect)
    console.log(hashedPath == expect)
    contract.setUserConfirm(tokenId, hashedPath, txOverrides)
    setHashedPath(hashedPath)

    setLoading(false)
    setSuccess(true)  
  }

  return (
      <Box m={2}>
        {tokenId ? (
            <Stack spacing={2} direction="column" sx={{my:1}} justifyContent="center">    
              <Typography align="center" >Step 9</Typography>
              <Typography align="center" >Token Id: {tokenId}</Typography>
              <Typography align="center" >Decrypted file name: {decryptedFileName}</Typography>
              <Typography align="center" >Hashed path: {hashedPath?.slice(0, 12) + "..."}</Typography>
            </Stack>
          ) :
          (
            <Stack spacing={2} direction="column" sx={{my:1}} justifyContent="center">    
              <Typography align="center" >Step 10</Typography>
              <Typography align="center" >User confirm expected URI</Typography>
            </Stack>
          )}
          <Stack spacing={2} direction="row" sx={{my:1}} justifyContent="center">     
            <Typography component={'span'} align="center" >
              <TextField id="TokenId" label="Token id" variant="standard" size="small" onChange={tokenIdFieldHandler}/>
            </Typography>

            <Typography component={'span'} align="center" >
              <TextField id="FilePath" label="File path" variant="standard" size="small" onChange={filePathFieldHandler}/>
            </Typography>

            <Typography align="center" >
              <Button variant="outlined" size="small" color="inherit" onClick={getFilePathButtonHandler} disabled={!tokenId} sx={{height: 45 }}>
                Get file name
              </Button>           
            </Typography>

            <Typography align="center" >
              <Button variant="outlined" size="small" color="inherit" onClick={setConfirmButtonHandler} disabled={!tokenId} sx={{height: 45 }}>
                Confirm
              </Button>           
            </Typography>
          </Stack>
      </Box>
  )
}

function ShowHandshakeStatus(props: Props): JSX.Element {
  const {setLoading, setSuccess} = props

  const [tokenId, setTokenId] = useState<string|undefined>()
  const [handShakeStatus, setHandShakeStatus] = useState<HandshakeStatus|undefined>()

  const tokenIdFieldHandler = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setTokenId(event.target.value);
  }

  const SetStatusButtonClickHandler = async () => {
    const contract = getContract(connect)

    setLoading(true)
    setSuccess(false)

    const handShakeStatus: HandshakeStatus = await contract.showHandShakeStatus(tokenId)    
    setHandShakeStatus(handShakeStatus)
    console.log(handShakeStatus)
    

    setLoading(false)
    setSuccess(true)
  }

  return (
      <Box m={2}>
      {handShakeStatus ? (
             <TableContainer component={Paper}>
             <Table sx={{ minWidth: 350 }} size="small" aria-label="simple table" >
               <TableHead>
                 <TableRow>
                   <TableCell align="center">Owner confirm</TableCell>
                   <TableCell align="center">User confirm</TableCell>
                   <TableCell align="center">Encrypted Phrase by Owner</TableCell>
                   <TableCell align="center">Encrypted Phrase by User</TableCell>
                   <TableCell align="center">Updated Encrypted URI</TableCell>
                 </TableRow>
               </TableHead>
               <TableBody>
                  <TableRow>
                    <TableCell align="center">{handShakeStatus.ownerConfirm.toString()}</TableCell>
                    <TableCell align="center">{handShakeStatus.userConfirm.toString()}</TableCell>
                    <TableCell align="center">{handShakeStatus.encryptedPhraseByOwner.slice(0, 6) + "..."}</TableCell>
                    <TableCell align="center">{handShakeStatus.encryptedPhraseByUser.slice(0, 6) + "..."}</TableCell>
                    <TableCell align="center">{handShakeStatus.updatedEncryptedURI.slice(0, 6) + "..."}</TableCell>
                   </TableRow>
               </TableBody>
             </Table>
           </TableContainer>
          ) :
          (
            <Typography align="center" >Show handshake status</Typography>
          )}
        <Stack spacing={2} direction="row" sx={{my:1}} justifyContent="center">     
          <Typography component={'span'} align="center" >
            <TextField id="TokenId" label="Token Id" variant="standard" size="small" onChange={tokenIdFieldHandler}/>
          </Typography>

          <Typography component={'span'} align="center" >
            <Button variant="outlined" size="small" color="inherit" sx={{height: 45 }} onClick={SetStatusButtonClickHandler} disabled={!tokenId}>
              Get status
            </Button> 
          </Typography>

        </Stack>
      </Box>
  )
}


function TransferNFT(props: Props): JSX.Element {
  const {setLoading, setSuccess} = props

  const [tokenId, setTokenId] = useState<string|undefined>()
  const [amount, setAmount] = useState<string|undefined>()
  const [tokenURI, setTokenURI] = useState<string|undefined>()

  const TokenIdTextFieldHandler = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTokenId(event.target.value);
  }

  const amountTextFieldHandler = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(event.target.value);
  }

  const TransferClickHandler = async () => {
    const contract = getContract(connect)
    //const from = connect!.getSigner()?.getAddress()
    //const txResult = await contract.transferFrom(from, toAddress, tokenId)
    console.log(contract)
    const handShakeStatus: HandshakeStatus = await contract.showHandShakeStatus(tokenId)   
    const txResult = await contract.updateURIandTransfer(tokenId, ethers.utils.parseEther(amount!), handShakeStatus.updatedEncryptedURI, txOverrides)
    
    setLoading(true)
    setSuccess(false)

    await txResult.wait()    
    //const receipt = await txResult.wait()    
    const tokenURI = await contract.tokenURI(tokenId)
    setTokenURI(tokenURI)

    setLoading(false)
    setSuccess(true)
  }


  return (
      <Box m={2}>
      {tokenId ? (
          <Stack spacing={2} direction="column" sx={{my:1}} justifyContent="center">    
            <Typography align="center" >Transfer token {tokenId} for {amount} Ether</Typography>
            <Typography align="center" >Updated URI is {tokenURI}</Typography>
          </Stack>
          ) :
          (
            <Typography align="center" >Transfer token</Typography>
          )}
        <Stack spacing={2} direction="row" sx={{my:1}} justifyContent="center">     
          <Typography component={'span'} align="center" >
            <TextField id="TokenId" label="Token Id" variant="standard" size="small" onChange={TokenIdTextFieldHandler}/>
          </Typography>

          <Typography component={'span'} align="center" >
            <TextField id="Amount" label="Amount" variant="standard" size="small" onChange={amountTextFieldHandler}/>
          </Typography>

          <Typography component={'span'} align="center" >
            <Button variant="outlined" size="small" color="inherit" sx={{height: 45 }} onClick={TransferClickHandler} disabled={!tokenId}>
              Transfer
            </Button> 
          </Typography>
        </Stack>
      </Box>
  )
}

export {ConnectAccount, Mint, RentNFT, ShowStatus, HandlePubKey, SetSecretPhrase, DepositAsset, SetOwnerConfirm, SetExpectedURI, SetUserConfirm, ShowHandshakeStatus,TransferNFT}