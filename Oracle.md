## ORACLE
El objetivo es leer cada 10 segundos el valor de conversión entre ETH y USD.
### CONTRATOS DE EJEMPLO:

#### 1º) SET: 
	En un principio, estudiamos el contrato ETH50SMACO.sol con la intencion de usar la parte de oráculo para conseguir el precio de conversión ETH-USD.
	Pero finalmente se descartó y se trato de buscar una opción más simple.
	
Set-Oracle.sol
	- ARCHIVO ORIGINAL:
ETH50SMACO.sol

#### 2º) CHAINLINK:
	La siguiente opción que probamos fue la de ChainLink, que aparece como ejemplo en Remix. Como coincidía justo con lo que se necesitaba, se adaptó el contrato, añadiendo las funciones que necesitábamos para detectar los valores de Suelo y Techo.
	Se consiguió el objetivo, pero la operativa es un poco complicada, puesto que implica tener que disponer tanto de saldo en ETH como saldo en LINKS, el token de ChainLink.
	- RENOMBRAR A
ChainLink-Oracle.sol
	- VERSION-THE WALL:
ATestnetConsumer-ED01b.sol

#### 3º) PROVABLE:
	La opción definitiva está basada en el siguiente contrato de Provable. La ventaja que ofrece es que para hacer la consulta sólo hay que hacer un pago, el correspondiente al gas de las transacciones.
	Al contrato original se han añadido, en código Solidity, una serie de funciones:
	- Para convertir desde los datos JSON que ofrece el servidor con el precio ETH_USD
	- Las funciones que se necesitan son las siguientes:
	
