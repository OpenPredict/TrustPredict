pragma solidity ^0.6.0;

contract ContractProxy {

    address OPUSDAddress;
    address ChainLinkAddress;
    address UtilsAddress;
    address OracleAddress;
    address TrustPredictAddress;
    address OPEventFactoryAddress;
    address owner;

    function _onlyOwner() private view {
        require(msg.sender == owner, "ContractProxy: attempt to set address from non-owner.");
    }

    constructor () public {     
        owner = msg.sender;     
    }

    function getOPUSDAddress() external view returns (address) {
        return OPUSDAddress;
    }

    function getChainLinkAddress() external view returns (address) {
        return ChainLinkAddress;
    }

    function getUtilsAddress() external view returns (address) {
        return UtilsAddress;
    }

    function getOracleAddress() external view returns (address) {
        return OracleAddress;
    }

    function getTrustPredictAddress() external view returns (address) {
        return TrustPredictAddress;
    }

    function getOPEventFactoryAddress() external view returns (address) {
        return OPEventFactoryAddress;
    }

    function setOPUSDAddress(address _OPUSDAddress) external {
        _onlyOwner();
        OPUSDAddress = _OPUSDAddress;
    }

    function setChainLinkAddress(address _ChainLinkAddress) external {
        _onlyOwner();
        ChainLinkAddress = _ChainLinkAddress;
    }

    function setUtilsAddress(address _UtilsAddress) external {
        _onlyOwner();
        UtilsAddress = _UtilsAddress;
    }

    function setOracleAddress(address _OracleAddress) external {
        _onlyOwner();
        OracleAddress = _OracleAddress;
    }

    function setTrustPredictAddress(address _TrustPredictAddress) external {
        _onlyOwner();
        TrustPredictAddress = _TrustPredictAddress;
    }

    function setOPEventFactoryAddress(address _OPEventFactoryAddress) external {
        _onlyOwner();
        OPEventFactoryAddress = _OPEventFactoryAddress;
    }
}

