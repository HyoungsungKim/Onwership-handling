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

    mapping (uint256 => UserInfo) internal _users;
    mapping (address => uint256[]) internal _owning;

    constructor(string memory name_, string memory symbol_) ERC721(name_, symbol_) {
        console.log("Deploied");
    }
    

    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    function mintNFT(address _to) public returns (uint256) {
        _tokenIds.increment();
        uint256 newNFTId = _tokenIds.current();
        _mint(_to, newNFTId);

        if (_owning[_to].length == 0) {
            _owning[_to] = [newNFTId];
        } else {
            _owning[_to].push(newNFTId);
        }

        //_setTokenURI(newNFTId, _tokenURI);
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
}

