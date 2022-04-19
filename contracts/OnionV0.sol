// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721URIStorageUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "./IOnion.sol";

/// @custom:security-contact techsecurity@mvlchain.io
contract OnionV0 is Initializable, ERC721Upgradeable, ERC721EnumerableUpgradeable, ERC721URIStorageUpgradeable, AccessControlUpgradeable, UUPSUpgradeable {
    using CountersUpgradeable for CountersUpgradeable.Counter;

    uint256 public MAX_SUPPLY;

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    CountersUpgradeable.Counter private _tokenIdCounter;
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    string internal _nftBaseUri;

    address private _owner;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() initializer {}


    function initialize(string memory _name, string memory _symbol, string memory _initialBaseUri, uint256 _max) initializer public {
        __ERC721_init(_name, _symbol);
        __ERC721Enumerable_init();
        __ERC721URIStorage_init();
        __AccessControl_init();
        __UUPSUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(UPGRADER_ROLE, msg.sender);

        _nftBaseUri = _initialBaseUri;
        MAX_SUPPLY = _max;
        _owner = msg.sender;
    }

    function setOwner(address owner) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _owner = owner;
    }

    // Support owner for opensea
    function owner() public view virtual returns (address) {
        return _owner;
    }

    function baseURI() public view returns (string memory) {
        return _nftBaseUri;
    }

    function _baseURI() internal view override returns (string memory) {
        return _nftBaseUri;
    }

    function setBaseURI(string memory _uri) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _nftBaseUri = _uri;
    }

    function setMinter(address minter) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(MINTER_ROLE, minter);
    }

    function removeFromMinter(address minter) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _revokeRole(MINTER_ROLE, minter);
    }

    function setTokenUri(uint256 tokenId, string memory uri) public onlyRole(DEFAULT_ADMIN_ROLE) {
        _setTokenURI(tokenId, uri);
    }

    function safeMint(address to) external onlyRole(DEFAULT_ADMIN_ROLE) {
        uint256 tokenId = _tokenIdCounter.current();
        require(tokenId + 1 <= MAX_SUPPLY, "Purchase would exceed max tokens");

        _tokenIdCounter.increment();
        _safeMint(to, tokenId);
    }

    function saleMint(address to) external onlyRole(MINTER_ROLE) {
        uint256 tokenId = _tokenIdCounter.current();
        require(tokenId + 1 <= MAX_SUPPLY, "Purchase would exceed max tokens");

        _tokenIdCounter.increment();
        _safeMint(to, tokenId);
    }

    function burn(uint256 tokenId) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _burn(tokenId);
    }

    function _authorizeUpgrade(address newImplementation)
    internal
    onlyRole(UPGRADER_ROLE)
    override
    {}

    // The following functions are overrides required by Solidity.

    function _beforeTokenTransfer(address from, address to, uint256 tokenId)
    internal
    override(ERC721Upgradeable, ERC721EnumerableUpgradeable)
    {
        super._beforeTokenTransfer(from, to, tokenId);
    }

    function _burn(uint256 tokenId)
    internal
    override(ERC721Upgradeable, ERC721URIStorageUpgradeable)
    {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId)
    public
    view
    override(ERC721Upgradeable, ERC721URIStorageUpgradeable)
    returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
    public
    view
    override(ERC721Upgradeable, ERC721EnumerableUpgradeable, AccessControlUpgradeable)
    returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
