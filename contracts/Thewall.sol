pragma solidity ^0.5.12;

interface Erc20 {
    function approve(address, uint256) external returns (bool);
    function transfer(address, uint256) external returns (bool);
}


interface CErc20 {
    function mint(uint256) external returns (uint256);
    function exchangeRateCurrent() external returns (uint256);
    function supplyRatePerBlock() external returns (uint256);
    function redeem(uint) external returns (uint);
    function redeemUnderlying(uint) external returns (uint);
}


interface CEth {
    function mint() external payable;
    function exchangeRateCurrent() external returns (uint256);
    function supplyRatePerBlock() external returns (uint256);
    function redeem(uint) external returns (uint);
    function redeemUnderlying(uint) external returns (uint);
}

interface Comptroller {
    function markets(address) external returns (bool, uint256);

    function enterMarkets(address[] calldata)
        external
        returns (uint256[] memory);

    function getAccountLiquidity(address)
        external
        view
        returns (uint256, uint256, uint256);
}

interface PriceOracle {
    function getUnderlyingPrice(address) external view returns (uint256);
}


contract Thewall {
    
    
    CEth public cEth;
    Comptroller comptroller;
    address public manager;
    address[] public  investors;
    
    constructor()  public {
       manager = msg.sender; 
       cEth = CEth(0x1d70B01A2C3e3B2e56FcdcEfe50d5c5d70109a5D );
       comptroller = Comptroller(0x3d9819210A31b4961b30EF54bE2aeD79B9c9Cd3B);
    }
    
    function invest() public payable {
       require(msg.value > .01 ether);  
       cEth.mint.value(msg.value)();
    } 
    
       
    function getValue() public view returns(uint256, uint256, uint256) {
       return comptroller.getAccountLiquidity(address(this));
       investors.push(msg.sender);    
    }    
        
}
