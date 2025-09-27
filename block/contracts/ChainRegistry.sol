// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract ChainRegistry {
    struct ChainInfo {
        uint256 chainId;
        string name;
        string rpcUrl;
        address router;
        bool isActive;
    }

    mapping(uint256 => ChainInfo) public chains;
    uint256[] public supportedChains;

    address public owner;

    event ChainAdded(uint256 indexed chainId, string name, address router);
    event ChainUpdated(uint256 indexed chainId, string name, address router);
    event ChainDeactivated(uint256 indexed chainId);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
        _initializeDefaultChains();
    }

    function _initializeDefaultChains() internal {
        // Ethereum Mainnet
        _addChain(1, "Ethereum", "https://eth.llamarpc.com", address(0));

        // BSC
        _addChain(56, "BSC", "https://bsc-dataseed.binance.org", address(0));

        // Polygon
        _addChain(137, "Polygon", "https://polygon-rpc.com", address(0));

        // Arbitrum
        _addChain(
            42161,
            "Arbitrum",
            "https://arb1.arbitrum.io/rpc",
            address(0)
        );

        // Optimism
        _addChain(10, "Optimism", "https://mainnet.optimism.io", address(0));

        // Avalanche
        _addChain(
            43114,
            "Avalanche",
            "https://api.avax.network/ext/bc/C/rpc",
            address(0)
        );

        // Rootstock Testnet
        _addChain(
            31,
            "Rootstock Testnet",
            "https://public-node.testnet.rsk.co",
            address(0)
        );
    }

    function _addChain(
        uint256 _chainId,
        string memory _name,
        string memory _rpcUrl,
        address _router
    ) internal {
        chains[_chainId] = ChainInfo({
            chainId: _chainId,
            name: _name,
            rpcUrl: _rpcUrl,
            router: _router,
            isActive: true
        });
        supportedChains.push(_chainId);
        emit ChainAdded(_chainId, _name, _router);
    }

    function addChain(
        uint256 _chainId,
        string memory _name,
        string memory _rpcUrl,
        address _router
    ) external onlyOwner {
        require(chains[_chainId].chainId == 0, "Chain already exists");
        _addChain(_chainId, _name, _rpcUrl, _router);
    }

    function updateChain(
        uint256 _chainId,
        string memory _name,
        string memory _rpcUrl,
        address _router
    ) external onlyOwner {
        require(chains[_chainId].chainId != 0, "Chain does not exist");
        chains[_chainId].name = _name;
        chains[_chainId].rpcUrl = _rpcUrl;
        chains[_chainId].router = _router;
        emit ChainUpdated(_chainId, _name, _router);
    }

    function deactivateChain(uint256 _chainId) external onlyOwner {
        require(chains[_chainId].chainId != 0, "Chain does not exist");
        chains[_chainId].isActive = false;
        emit ChainDeactivated(_chainId);
    }

    function getChainInfo(
        uint256 _chainId
    ) external view returns (ChainInfo memory) {
        return chains[_chainId];
    }

    function getSupportedChains() external view returns (uint256[] memory) {
        return supportedChains;
    }

    function isChainSupported(uint256 _chainId) external view returns (bool) {
        return chains[_chainId].isActive;
    }

    function getActiveChains() external view returns (ChainInfo[] memory) {
        uint256 activeCount = 0;
        for (uint256 i = 0; i < supportedChains.length; i++) {
            if (chains[supportedChains[i]].isActive) {
                activeCount++;
            }
        }

        ChainInfo[] memory activeChains = new ChainInfo[](activeCount);
        uint256 index = 0;
        for (uint256 i = 0; i < supportedChains.length; i++) {
            if (chains[supportedChains[i]].isActive) {
                activeChains[index] = chains[supportedChains[i]];
                index++;
            }
        }
        return activeChains;
    }
}
