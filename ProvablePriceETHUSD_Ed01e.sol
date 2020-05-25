pragma solidity ^0.4.22;

import "github.com/provable-things/ethereum-api/provableAPI_0.4.25.sol";



contract precioETHUSD is usingProvable {



   string public ETHUSD;

   event LogConstructorInitiated(string nextStep);

   event LogPriceUpdated(string price);

   event LogNewProvableQuery(string description);

   

   uint256 VALOR;

   uint256 TECHO;

   uint256 SUELO;






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

   function stringToUint(string s) constant returns (uint256) {
       bytes memory b = bytes(s);
       uint result = 0;
       for (uint i = 0; i < b.length; i++) { // c = b[i] was not needed
          if (b[i] >= 48 && b[i] <= 57) {
              result = result * 10 + (uint(b[i]) - 48); // bytes and int are not compatible with the operator -.
          }
       }
       return result; // this was missing
  }


  function asignaPrecio() public constant returns (string _resultado) {

      _resultado = "OK";

      VALOR = stringToUint(ETHUSD);

      if (VALOR > TECHO) {

          (_resultado = "TECHO");} return;

  }



  function pideTecho(uint256 _pideTecho) public {

        

      TECHO = _pideTecho;

  }

  

  function pideSuelo(uint256 _pideSuelo) public {

        

      SUELO = _pideSuelo;

  }

 
   
   
  function comparaTecho() public constant returns (string _resultado) {

      _resultado = "OK";

      VALOR = stringToUint(ETHUSD);

      if (VALOR > TECHO) {

          (_resultado = "TECHO");} return;



  }

    



  function comparaSuelo() public constant returns (string _resultado) {


      _resultado = "OK";

      VALOR = stringToUint(ETHUSD);

      if (VALOR < SUELO) {

          (_resultado = "SUELO");} return;

  }






}

