// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract TokenFactory is Ownable, ReentrancyGuard {
    struct TokenInfo {
        address tokenAddress;
        string name;
        string symbol;
        uint8 decimals;
        uint256 totalSupply;
        uint256 chainId;
        bool isMintable;
        bool isBurnable;
        address creator;
        uint256 createdAt;
    }

    mapping(address => TokenInfo) public tokens;
    mapping(string => address) public tokensBySymbol;
    mapping(uint256 => address[]) public tokensByChain;
    address[] public allTokens;

    event TokenCreated(
        address indexed tokenAddress,
        string name,
        string symbol,
        uint8 decimals,
        uint256 totalSupply,
        uint256 chainId,
        address indexed creator
    );

    event TokenMinted(
        address indexed tokenAddress,
        address indexed to,
        uint256 amount
    );
    event TokenBurned(
        address indexed tokenAddress,
        address indexed from,
        uint256 amount
    );

    constructor() {
        // Initialize with default chain ID (Rootstock Testnet)
        _createDefaultTokens();
    }

    function _createDefaultTokens() internal {
        // Create default tokens for testing
        _createToken(
            "Wrapped RBTC",
            "WRBTC",
            18,
            1000000 * 10 ** 18,
            true,
            true
        );
        _createToken("USD Coin", "USDC", 6, 1000000 * 10 ** 6, true, true);
        _createToken("Tether USD", "USDT", 6, 1000000 * 10 ** 6, true, true);
    }

    function _createToken(
        string memory _name,
        string memory _symbol,
        uint8 _decimals,
        uint256 _initialSupply,
        bool _isMintable,
        bool _isBurnable
    ) internal returns (address) {
        require(
            tokensBySymbol[_symbol] == address(0),
            "Token symbol already exists"
        );

        // Create new ERC20 token
        ERC20Token newToken = new ERC20Token(
            _name,
            _symbol,
            _decimals,
            _initialSupply,
            _isMintable,
            _isBurnable,
            address(this)
        );

        address tokenAddress = address(newToken);

        TokenInfo memory tokenInfo = TokenInfo({
            tokenAddress: tokenAddress,
            name: _name,
            symbol: _symbol,
            decimals: _decimals,
            totalSupply: _initialSupply,
            chainId: block.chainid,
            isMintable: _isMintable,
            isBurnable: _isBurnable,
            creator: msg.sender,
            createdAt: block.timestamp
        });

        tokens[tokenAddress] = tokenInfo;
        tokensBySymbol[_symbol] = tokenAddress;
        tokensByChain[block.chainid].push(tokenAddress);
        allTokens.push(tokenAddress);

        emit TokenCreated(
            tokenAddress,
            _name,
            _symbol,
            _decimals,
            _initialSupply,
            block.chainid,
            msg.sender
        );

        return tokenAddress;
    }

    function createToken(
        string memory _name,
        string memory _symbol,
        uint8 _decimals,
        uint256 _initialSupply,
        bool _isMintable,
        bool _isBurnable
    ) external onlyOwner returns (address) {
        return
            _createToken(
                _name,
                _symbol,
                _decimals,
                _initialSupply,
                _isMintable,
                _isBurnable
            );
    }

    function mintToken(
        address _tokenAddress,
        address _to,
        uint256 _amount
    ) external onlyOwner nonReentrant {
        require(
            tokens[_tokenAddress].tokenAddress != address(0),
            "Token does not exist"
        );
        require(tokens[_tokenAddress].isMintable, "Token is not mintable");

        ERC20Token token = ERC20Token(_tokenAddress);
        token.mint(_to, _amount);

        tokens[_tokenAddress].totalSupply += _amount;

        emit TokenMinted(_tokenAddress, _to, _amount);
    }

    function burnToken(
        address _tokenAddress,
        address _from,
        uint256 _amount
    ) external onlyOwner nonReentrant {
        require(
            tokens[_tokenAddress].tokenAddress != address(0),
            "Token does not exist"
        );
        require(tokens[_tokenAddress].isBurnable, "Token is not burnable");

        ERC20Token token = ERC20Token(_tokenAddress);
        token.burn(_from, _amount);

        tokens[_tokenAddress].totalSupply -= _amount;

        emit TokenBurned(_tokenAddress, _from, _amount);
    }

    function getTokenInfo(
        address _tokenAddress
    ) external view returns (TokenInfo memory) {
        return tokens[_tokenAddress];
    }

    function getTokenBySymbol(
        string memory _symbol
    ) external view returns (address) {
        return tokensBySymbol[_symbol];
    }

    function getTokensByChain(
        uint256 _chainId
    ) external view returns (address[] memory) {
        return tokensByChain[_chainId];
    }

    function getAllTokens() external view returns (address[] memory) {
        return allTokens;
    }

    function getTokenCount() external view returns (uint256) {
        return allTokens.length;
    }
}

contract ERC20Token is ERC20, Ownable {
    uint8 private _decimals;
    bool public isMintable;
    bool public isBurnable;

    constructor(
        string memory _name,
        string memory _symbol,
        uint8 _decimals_,
        uint256 _initialSupply,
        bool _isMintable,
        bool _isBurnable,
        address _factory
    ) ERC20(_name, _symbol) {
        _decimals = _decimals_;
        isMintable = _isMintable;
        isBurnable = _isBurnable;
        _mint(_factory, _initialSupply);
        _transferOwnership(_factory);
    }

    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }

    function mint(address _to, uint256 _amount) external onlyOwner {
        require(isMintable, "Token is not mintable");
        _mint(_to, _amount);
    }

    function burn(address _from, uint256 _amount) external onlyOwner {
        require(isBurnable, "Token is not burnable");
        _burn(_from, _amount);
    }

    function updateMintable(bool _isMintable_) external onlyOwner {
        isMintable = _isMintable_;
    }

    function updateBurnable(bool _isBurnable_) external onlyOwner {
        isBurnable = _isBurnable_;
    }
}
