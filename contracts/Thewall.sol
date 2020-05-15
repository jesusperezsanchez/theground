pragma solidity ^0.6.8;

contract Thewall {
    
    address public manager;
    address[] public  investors;
    
    constructor()  public {
       manager = msg.sender; 
    }
    
    function enter() public payable {
       require(msg.value > .01 ether);      
       investors.push(msg.sender);    
    } 
    
       
    function getInvestors() public view returns (address[] memory ) {
        return investors;
    }    
        
}
