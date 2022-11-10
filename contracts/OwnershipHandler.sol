// SPDX-License-Identifier: CC0-1.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "./IOwnershipHandler.sol";

import "hardhat/console.sol";

contract OwnershipHandler is ERC721URIStorage, IOwnershipHandler {
    struct UserInfo {
        address user;
        uint64 expires;
    }

    struct HandShake {
        bool ownerConfirm;
        bool userConfirm;
        string encryptedPhraseByOwner; // Owner encrypt a filename using the pubkey of the user
        string encryptedPhraseByUser; // User encrypt a path using the pubkey of the owner
        bytes updatedEncryptedURI; // AES encrypted
    }

    struct BankAccount {
        address owner;
        uint256 amount;
    }

    mapping (uint256 => UserInfo) internal _users;
    mapping (address => uint256[]) internal _owning;
    mapping (address => string) private _pubKeyOf;
    mapping (uint256 => HandShake) private _handshake;
    mapping (address => BankAccount) private _bankAccount;

    constructor(string memory name_, string memory symbol_) ERC721(name_, symbol_) {
        console.log("Deploied");
    }
    
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    function mintNFT(address _to, string memory _tokenURI) public returns (uint256) {
        _tokenIds.increment();
        uint256 newNFTId = _tokenIds.current();
        _mint(_to, newNFTId);

        if (_owning[_to].length == 0) {
            _owning[_to] = [newNFTId];
        } else {
            _owning[_to].push(newNFTId);
        }

        _setTokenURI(newNFTId, _tokenURI);
        // _mint already emits Transfer event
        //emit Transfer(address(0), _to, newNFTId);

        return newNFTId;
    }

    function _burn(uint256 tokenId) internal override (ERC721URIStorage) {
        super._burn(tokenId);
    }

    function setUser(uint256 tokenId, address _user, uint64 expires) public override {
        require(_isApprovedOrOwner(msg.sender, tokenId), "ERC4907: transfer caller is not owner nor approved");
        require(uint256(_users[tokenId].expires) <= block.timestamp, "It already has a user");
        UserInfo storage info = _users[tokenId];
        info.user = _user;
        info.expires = expires;

        emit UpdateUser(tokenId, _user, expires);
    }

    function userOf(uint256 tokenId) public view override returns(address) {
        if(uint256(_users[tokenId].expires) >= block.timestamp) {
            return _users[tokenId].user;
        } else {
            return address(0);
        }
    }

    function userExpires(uint256 tokenId) public view override returns(uint256) {
        return _users[tokenId].expires;
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return interfaceId == type(IOwnershipHandler).interfaceId || super.supportsInterface(interfaceId);
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal virtual override {
        super._beforeTokenTransfer(from, to, tokenId);

        if (from != to && _users[tokenId].user != address(0)) {
            delete _users[tokenId];
            emit UpdateUser(tokenId, address(0), 0);
        }
    }

    function viewOwning(address owner) public view override returns(uint256[] memory) {
        return _owning[owner];
    }

    function setPubKey(string memory pubKey) external override {
        _pubKeyOf[msg.sender] = pubKey;
    }

    function getPubKey(address addr) external view override returns(string memory) {
        return _pubKeyOf[addr];
    }

    function setEncryptedPhrase(uint256 tokenId, string memory encryptedPhrase) external {
        require(msg.sender == ownerOf(tokenId) || msg.sender == userOf(tokenId), "Requester's address is incorrect");
        if (msg.sender == ownerOf(tokenId)) {
            _handshake[tokenId].encryptedPhraseByOwner = encryptedPhrase;
        } else {
            _handshake[tokenId].encryptedPhraseByUser = encryptedPhrase;
        }
    }

    function depositAsset() external payable {        
        BankAccount storage acc = _bankAccount[msg.sender];
        acc.owner = msg.sender;
        acc.amount = msg.value;
    }

    function getDeposit() external view returns (uint256) {
        return _bankAccount[msg.sender].amount;
    }

    // Temporary public for testing implementation
    function _transferAsset(address from, address to, uint256 amount) public {
        require(from == _bankAccount[from].owner, "From addres does not match");
        require(amount <= _bankAccount[from].amount, "Deposit is not enough");
        payable(to).transfer(amount);
        _bankAccount[from].amount -= amount;
    }


    // function updateURI...
    // User wants this URI path
    function setUpdatedEncryptedURI(uint256 tokenId, bytes memory updatedEncryptedURI) external {
        require(tokenId <= _tokenIds.current());
        require(ownerOf(tokenId) == msg.sender);

        _handshake[tokenId].updatedEncryptedURI = updatedEncryptedURI;

    }

    function setOwnerConfirm(uint256 tokenId, uint256 amount) external {
        require(msg.sender == ownerOf(tokenId), "Not own this token");
        require(amount <= _bankAccount[userOf(tokenId)].amount, "Not enough deposit");
        _handshake[tokenId].ownerConfirm = true;
    }

    function setUserConfirm(uint256 tokenId, bytes memory expectedUpdate) external {
        require(msg.sender == userOf(tokenId));
        require(keccak256(expectedUpdate) == keccak256(_handshake[tokenId].updatedEncryptedURI), "It does not match");
        _handshake[tokenId].userConfirm = true;
    }

    function showHandShakeStatus(uint256 tokenId) external view returns (HandShake memory) {
        require(tokenId <= _tokenIds.current());
        return _handshake[tokenId];
    }

    function updateURIandTransfer(uint256 tokenId, uint256 amount, string memory newURIHash) external {
        require(msg.sender == ownerOf(tokenId) || msg.sender == userOf(tokenId), "Message sender does not the owner or the user");
        require(ownerOf(tokenId) != address(0), "Owner is zero address");
        require(userOf(tokenId) != address(0), "User is zero address");
        require(_handshake[tokenId].ownerConfirm == true, "Owner does not confirm yet");
        require(_handshake[tokenId].userConfirm == true, "User does not confirm yet");
        address ownerAddr = ownerOf(tokenId);
        address userAddrr = userOf(tokenId);

        _beforeTokenTransfer(ownerAddr, userAddrr, tokenId);
        transferFrom(ownerAddr, userAddrr, tokenId);
        _transferAsset(userAddrr, ownerAddr, amount);
        _setTokenURI(tokenId, newURIHash);
    }
}

