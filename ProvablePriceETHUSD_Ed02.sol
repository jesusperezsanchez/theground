pragma solidity ^0.4.22;
import "github.com/provable-things/ethereum-api/provableAPI_0.4.25.sol";
contract ExampleContract is usingProvable {

   string public ETHUSD;
   event LogConstructorInitiated(string nextStep);
   event LogPriceUpdated(string price);
   event LogNewProvableQuery(string description);
   
   uint256 techo;
   uint256 suelo;
   uint256 currentPrice;


   function ExampleContract() payable {
       LogConstructorInitiated("Constructor was initiated. Call 'updatePrice()' to send the Provable Query.");
   }

   function __callback(bytes32 myid, string result) {
       if (msg.sender != provable_cbAddress()) revert();
       ETHUSD = result;
       LogPriceUpdated(result);
   }

   function updatePrice() payable {
       if (provable_getPrice("URL") > this.balance) {
           LogNewProvableQuery("Provable query was NOT sent, please add some ETH to cover for the query fee");
       } else {
           LogNewProvableQuery("Provable query was sent, standing by for the answer..");
           provable_query("URL", "json(https://api.pro.coinbase.com/products/ETH-USD/ticker).price");
       }
   }

  function pideTecho(uint256 _pideTecho) public {
        
    techo = _pideTecho;
  }
  
  function pideSuelo(uint256 _pideSuelo) public {
        
    suelo = _pideSuelo;
  }
  
  function comparaTecho() public constant returns (uint8 _resultado) {
     _resultado = 1;
        
     if (currentPrice > techo) {
       (_resultado = 2);} return;

    }
    

  function comparaSuelo() public constant returns (uint8 _resultado) {

    _resultado = 1;
        
    if (currentPrice < suelo) {
      (_resultado = 4);} return;
    }

  function asignaPrecio() public constant returns (string _resultado) {
     _resultado = ETHUSD; 
     return;
        
     // {(_resultado = 2);} return;

    }


}
