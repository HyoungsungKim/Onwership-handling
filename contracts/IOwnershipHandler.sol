// SPDX-License-Identifier: CC0-1:0

interface IOwnersipHandler {
    /// Logged when the collateral of an NFT is changed
    /// @notice Emitted when the amount of collateral is updated
    event UpdateCollateral(uint256 indexed tokenId, uint256 collateral);

    /// @notice Map the amount of an asset to NFT
    /// Throws if NFT does not exist
    /// @param tokenId An Id of existing NFT
    /// @param amount The amount of an asset, such as Ether, ERC-20 tokens
    function _collateralize(uint256 tokenId, uint256 amount) external;

    /// @notice Increase the amount of an collateral that backing an NFT
    /// Call _collateralize function inside
    /// @param tokenId An Id of existing NFT    
    function increaseCollateral(uint256 tokenId) external payable;

    /// @notice Reduce the part of the collateral backing value of NFT and send it to an NFT owner
    /// Throws a message sender does not own NFT
    /// Throws a message sender reduces more collateral than existing
    /// @param tokenId An Id of existing NFT
    function decreaseCollateral(uint256 tokenId) external payable;

    /// @notice Reduce all collateral that backing NFT, and send it to an NFT owner
    /// Throws a message sender does not own NFT
    /// @param tokenId An Id of existing NFT
    function liquidation(uint256 tokenId) external payable;

    /// @notice Gives balance of the collateral backing value of NFT
    /// Throws if NFT does not exist
    /// @param tokenId An Id of existing NFT
    /// @return The balance of the collateral backing value of NFT
    function getBalanceById(uint256 tokenId) external view returns (uint256);
}