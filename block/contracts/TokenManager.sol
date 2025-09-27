// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./ChainRegistry.sol";
import "./TokenFactory.sol";

contract TokenManager is Ownable, ReentrancyGuard {
    struct TokenData {
        address tokenAddress;
        string name;
        string symbol;
        uint8 decimals;
        uint256 chainId;
        bool isVerified;
        bool isActive;
        uint256 lastUpdated;
    }
    
    struct CrossChainToken {
        address localToken;
        address remoteToken;
        uint256 remoteChainId;
        bool isActive;
    }
    
    ChainRegistry public chainRegistry;
    TokenFactory public tokenFactory;
    
    mapping(address => TokenData) public tokenData;
    mapping(string => address) public tokensBySymbol;
    mapping(uint256 => mapping(address => address)) public crossChainTokens; // chainId => localToken => remoteToken
    mapping(address => CrossChainToken[]) public crossChainMappings;
    
    address[] public supportedTokens;
    
    event TokenRegistered(
        address indexed tokenAddress,
        string name,
        string symbol,
        uint256 chainId,
        address indexed registrar
    );
    
    event CrossChainMappingAdded(
        address indexed localToken,
        address indexed remoteToken,
        uint256 remoteChainId
    );
    
    event TokenVerified(address indexed tokenAddress, bool isVerified);
    event TokenActivated(address indexed tokenAddress, bool isActive);
    
    modifier onlySupportedChain(uint256 _chainId) {
        require(chainRegistry.isChainSupported(_chainId), "Chain not supported");
        _;
    }
    
    constructor(address _chainRegistry, address _tokenFactory) {
        chainRegistry = ChainRegistry(_chainRegistry);
        tokenFactory = TokenFactory(_tokenFactory);
    }
    
    function registerToken(
        address _tokenAddress,
        string memory _name,
        string memory _symbol,
        uint8 _decimals,
        uint256 _chainId
    ) external onlyOwner onlySupportedChain(_chainId) {
        require(tokenData[_tokenAddress].tokenAddress == address(0), "Token already registered");
        
        TokenData memory data = TokenData({
            tokenAddress: _tokenAddress,
            name: _name,
            symbol: _symbol,
            decimals: _decimals,
            chainId: _chainId,
            isVerified: false,
            isActive: true,
            lastUpdated: block.timestamp
        });
        
        tokenData[_tokenAddress] = data;
        tokensBySymbol[_symbol] = _tokenAddress;
        supportedTokens.push(_tokenAddress);
        
        emit TokenRegistered(_tokenAddress, _name, _symbol, _chainId, msg.sender);
    }
    
    function createAndRegisterToken(
        string memory _name,
        string memory _symbol,
        uint8 _decimals,
        uint256 _initialSupply,
        bool _isMintable,
        bool _isBurnable
    ) external onlyOwner returns (address) {
        address newToken = tokenFactory.createToken(
            _name,
            _symbol,
            _decimals,
            _initialSupply,
            _isMintable,
            _isBurnable
        );
        
        registerToken(newToken, _name, _symbol, _decimals, block.chainid);
        
        return newToken;
    }
    
    function addCrossChainMapping(
        address _localToken,
        address _remoteToken,
        uint256 _remoteChainId
    ) external onlyOwner onlySupportedChain(_remoteChainId) {
        require(tokenData[_localToken].tokenAddress != address(0), "Local token not registered");
        
        crossChainTokens[_remoteChainId][_localToken] = _remoteToken;
        
        CrossChainToken memory mapping = CrossChainToken({
            localToken: _localToken,
            remoteToken: _remoteToken,
            remoteChainId: _remoteChainId,
            isActive: true
        });
        
        crossChainMappings[_localToken].push(mapping);
        
        emit CrossChainMappingAdded(_localToken, _remoteToken, _remoteChainId);
    }
    
    function verifyToken(address _tokenAddress, bool _isVerified) external onlyOwner {
        require(tokenData[_tokenAddress].tokenAddress != address(0), "Token not registered");
        tokenData[_tokenAddress].isVerified = _isVerified;
        tokenData[_tokenAddress].lastUpdated = block.timestamp;
        
        emit TokenVerified(_tokenAddress, _isVerified);
    }
    
    function activateToken(address _tokenAddress, bool _isActive) external onlyOwner {
        require(tokenData[_tokenAddress].tokenAddress != address(0), "Token not registered");
        tokenData[_tokenAddress].isActive = _isActive;
        tokenData[_tokenAddress].lastUpdated = block.timestamp;
        
        emit TokenActivated(_tokenAddress, _isActive);
    }
    
    function mintToken(address _tokenAddress, address _to, uint256 _amount) external onlyOwner nonReentrant {
        require(tokenData[_tokenAddress].tokenAddress != address(0), "Token not registered");
        require(tokenData[_tokenAddress].isActive, "Token not active");
        
        tokenFactory.mintToken(_tokenAddress, _to, _amount);
    }
    
    function burnToken(address _tokenAddress, address _from, uint256 _amount) external onlyOwner nonReentrant {
        require(tokenData[_tokenAddress].tokenAddress != address(0), "Token not registered");
        require(tokenData[_tokenAddress].isActive, "Token not active");
        
        tokenFactory.burnToken(_tokenAddress, _from, _amount);
    }
    
    function getTokenInfo(address _tokenAddress) external view returns (TokenData memory) {
        return tokenData[_tokenAddress];
    }
    
    function getTokenBySymbol(string memory _symbol) external view returns (address) {
        return tokensBySymbol[_symbol];
    }
    
    function getCrossChainToken(address _localToken, uint256 _remoteChainId) external view returns (address) {
        return crossChainTokens[_remoteChainId][_localToken];
    }
    
    function getCrossChainMappings(address _localToken) external view returns (CrossChainToken[] memory) {
        return crossChainMappings[_localToken];
    }
    
    function getSupportedTokens() external view returns (address[] memory) {
        return supportedTokens;
    }
    
    function getTokensByChain(uint256 _chainId) external view returns (address[] memory) {
        address[] memory tokens = new address[](supportedTokens.length);
        uint256 count = 0;
        
        for (uint256 i = 0; i < supportedTokens.length; i++) {
            if (tokenData[supportedTokens[i]].chainId == _chainId) {
                tokens[count] = supportedTokens[i];
                count++;
            }
        }
        
        // Resize array
        address[] memory result = new address[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = tokens[i];
        }
        
        return result;
    }
    
    function getActiveTokens() external view returns (address[] memory) {
        address[] memory tokens = new address[](supportedTokens.length);
        uint256 count = 0;
        
        for (uint256 i = 0; i < supportedTokens.length; i++) {
            if (tokenData[supportedTokens[i]].isActive) {
                tokens[count] = supportedTokens[i];
                count++;
            }
        }
        
        // Resize array
        address[] memory result = new address[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = tokens[i];
        }
        
        return result;
    }
    
    function getVerifiedTokens() external view returns (address[] memory) {
        address[] memory tokens = new address[](supportedTokens.length);
        uint256 count = 0;
        
        for (uint256 i = 0; i < supportedTokens.length; i++) {
            if (tokenData[supportedTokens[i]].isVerified) {
                tokens[count] = supportedTokens[i];
                count++;
            }
        }
        
        // Resize array
        address[] memory result = new address[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = tokens[i];
        }
        
        return result;
    }
}
