// The Wall Project
const truffleAssert = require('truffle-assertions');
const { calcOutGivenIn, calcInGivenOut, calcRelativeDiff } = require('../lib/calc_comparisons');

const BPool = artifacts.require('BPool');
const BFactory = artifacts.require('BFactory');
const TToken = artifacts.require('TToken');
const verbose = process.env.VERBOSE;


contract('The Wall', async (accounts) => {
    
    const admin = accounts[0];
    const attacker = accounts[1];
    const investor = accounts[2];
    const { toWei } = web3.utils;
    const { fromWei } = web3.utils;
    const errorDelta = 10 ** -8;
    const MAX = web3.utils.toTwosComplement(-1);

    let WETH; let MKR; let DAI; let USDC; // addresses
    let weth; let mkr; let dai; let usdc; // TTokens
    let factory; // BPool factory
    let pool; // first pool w/ defaults    
    let POOL; //   pool address

    // Calculation variable 
    let expected; 

    before(async () => {
        factory = await BFactory.deployed();

        POOL = await factory.newBPool.call(); // Creamos el POOL
        await factory.newBPool();
        pool = await BPool.at(POOL);        
        console.log('Pool Creados');

        weth = await TToken.new('Wrapped Ether', 'WETH', 18);
        mkr = await TToken.new('Maker', 'MKR', 18);
        dai = await TToken.new('Dai Stablecoin', 'DAI', 18);
        usdc = await TToken.new('USDC Dolar', 'USDC', 18);

        WETH = weth.address;
        MKR = mkr.address;
        DAI = dai.address;
        USDC = usdc.address;

        // Admin balances
        await weth.mint(admin, toWei('500'));
        await dai.mint(admin, toWei('500000'));
        await usdc.mint(admin, toWei('500000'));

        // Attacker balances
        await weth.mint(attacker, toWei('500'), { from: admin });
        await dai.mint(attacker, toWei('100000'), { from: admin });
        await usdc.mint(attacker, toWei('100000'), { from: admin });

        // Normal User balances
        await weth.mint(investor, toWei('100000'), { from: admin });        
        await dai.mint(investor, toWei('10000000'), { from: admin });
        await usdc.mint(investor, toWei('10000000'), { from: admin });
    });

    describe('Pool Inicial Liquidez', () => {            

        it('Aprobamos DAI, USDC y WETH', async () => {            
            await dai.approve(POOL, MAX);
            await usdc.approve(POOL, MAX);
            await weth.approve(POOL, MAX);
        });

        /*
            Pool con la Liquidez            
            DAI  - $10.000
            USDC - $10.000
        */


        // Creamos un Pool de Liquidez esto podemos sustituirlo posteriormente 
        it('Creamos el Pool de Liquidez Inicial', async () => {
            // Dejamos la Lioquidez en este Pool
            await pool.bind(DAI, toWei('10000'), toWei('10'));
            await pool.bind(USDC, toWei('10000'), toWei('10'));
            const numTokens = await pool.getNumTokens();
            assert.equal(2, numTokens);
            const totalDernomWeight = await pool.getTotalDenormalizedWeight();
            assert.equal(20, fromWei(totalDernomWeight));
            const wethNormWeight = await pool.getNormalizedWeight(USDC);
            assert.equal(0.5, fromWei(wethNormWeight));
        });


        it('Ponemos la Comisión Inicial en 0,3%', async () => {
            await pool.setSwapFee(toWei('0.003'));
            const swapFee = await pool.getSwapFee();
            assert.equal(0.003, fromWei(swapFee));
        });

        it('Comprobamos el cambio en DAI/USDC', async () => {
            const usdPrice = await pool.getSpotPriceSansFee(DAI, USDC);
            //console.log('Precio', fromWei(usdPrice));            
            assert.equal(1, fromWei(usdPrice));

            const usdPriceFee = await pool.getSpotPrice(DAI, USDC);
            const usdPriceFeeCheck = ((10000 / 10) / (10000 / 10)) * (1 / (1 - 0.003));
            //console.log('Precio con comision', fromWei(usdPriceFee));                        
            assert.equal(fromWei(usdPriceFee), usdPriceFeeCheck);
        });


        /*
            Pool de WETH
            DAI  - $10.000
            WETH - $50
            Precio de ETH = 200 DAIs
        */
        // Creamos el Pool de Liquidez con un segundo actor

        it('Eliminamos del Pool USDC', async () => {
            adminBalance = await usdc.balanceOf(admin);
            assert.equal(490000, fromWei(adminBalance));
            await pool.unbind(USDC);
            adminBalance = await usdc.balanceOf(admin);
            assert.equal(500000, fromWei(adminBalance));            
            const numTokens = await pool.getNumTokens();
            assert.equal(1, numTokens);
        });             

        it('Incluimos WETH', async () => {
            await pool.bind(WETH, toWei('50'), toWei('10'));
            const numTokens = await pool.getNumTokens();
            assert.equal(2, numTokens);
            const wethPriceFee = await pool.getSpotPrice(DAI, WETH);
            assert.ok(200 < fromWei(wethPriceFee));
        });     
        
        it('Permitimos realizar intercambios en el Pool', async () => {
            await pool.setPublicSwap(true);
            const publicSwap = pool.isPublicSwap();
            assert(publicSwap);            
        });

        it('Permitimos operar a otros usuarios', async () => {
            await weth.approve(POOL, MAX, { from: attacker });
            await usdc.approve(POOL, MAX, { from: attacker });
            await dai.approve(POOL, MAX, { from: attacker });          
        });

        // Simulaciones de precios con el actual Pool

        it('Incluimos WETH', async () => {
            console.log('SPOT PRICE');
            expected = await pool.getSpotPrice(DAI, WETH);
            console.log('Precio de DAI/WETH Pool sin comisión =', fromWei(expected));    
            expected = await pool.getSpotPrice(WETH, DAI);
            console.log('Precio de WETH/DAI Pool sin comisión =', fromWei(expected));    

            console.log('SIMULATING ATTACK WITHOUT LIQUIDITY');
            expected = calcOutGivenIn(50, 10, 10000, 10, 5, 0.000);
            console.log('Precio al vender 5 ETH al Pool , comisión 0,3% =', (expected)/5);    
            console.log('DAIs obtenidos', expected);    
            expected = calcOutGivenIn(50, 10, 10000, 10, 60, 0.003);
            console.log('Precio al vender 60 ETH al Pool , comisión 0,3% =', (expected)/60);    
            console.log('DAIs obtenidos', expected);    
            expected = calcOutGivenIn(50, 10, 10000, 10, 60, 0.09);
            console.log('Precio al vender 60 ETH al Pool , comisión 9%  =', (expected)/60);    
            console.log('DAIs obtenidos', expected);    
        });     

        // Introducimos The Wall y realizamos el ataque

        console.log('FLASH SPIKE WETH!!!!! PRICE 165!!!');    

        it('Precio atacado por debajo de 165', async () => {
            // 50 WETH -> DAI
            //const expected = calcOutGivenIn(52.5, 5, 10500, 5, 2.5, 0.04);
            expected = calcOutGivenIn(50, 10, 10000, 10, 5, 0.09); // Calcula el precio medio
            const txr = await pool.swapExactAmountIn(
                WETH, // Activo a intercambiar
                toWei('5'),
                DAI, // Activo a recibir
                toWei('1'), // Minima cantidad a recibir
                toWei('1'), // Maximo precio de Spot
                { from: attacker }, // Direccion que lo recibe
            );
            // These values are what are limited by the arguments; you are guaranteed tokenAmountOut >= minAmountOut and spotPriceAfter <= maxPrice).

            const log = txr.logs[0];
            assert.equal(log.event, 'LOG_SWAP');

            console.log('Precio despues de vender 5 ETH');
            expected = await pool.getSpotPrice(DAI, WETH);
            console.log('Precio de DAI/WETH Pool en Primera Operacion =', fromWei(expected));

            assert.ok(170 > fromWei(expected));


            console.log('Pool Situation AFTER ATTACK');
            const daiBalance = await pool.getBalance(DAI);
            console.log('DAI = ', fromWei(daiBalance));
            const wethBalance = await pool.getBalance(WETH);
            console.log('WETH = ', fromWei(wethBalance));
            assert.equal(55, fromWei(wethBalance));
            
        });


         /*
            Pool de WETH
            DAI  - $9.090 10
            WETH - $55    10
            Precio de ETH = 165 DAIs
        */
        // Creamos el Pool de Liquidez con un segundo actor

        console.log('THE WALL DRIVES LIQUIDITY!!!');            
        console.log('BUYING WETH AND ADDING TO THE POOL AND RISING COMISSION TO 4%');        
         
        /*
            Pasamos de un Pool de 20.000 DAIS a uno de 40.000 y c
            con un porcentaje de 70% DAI / 30% ETH
            Cambiamos el Pool con mucha liquidez de WETH            

            DAI  - $56.000   70%
            WETH - $145     30% 
            Precio de ETH = 170 DAIs
        */
        // Creamos el Pool de Liquidez con un segundo actor



        it('Incluimos WETH', async () => {
            await pool.rebind(WETH, toWei('350'), toWei('3'));
            await pool.rebind(DAI, toWei('140000'), toWei('7'));
            const numTokens = await pool.getNumTokens();
            assert.equal(2, numTokens);            
            const wethPriceFee = await pool.getSpotPrice(DAI, WETH);
            console.log('Pool Situation THE WALL');
            console.log('Precio de DAI/WETH Pool con Liquidez con comisión 0.3% =',
                         fromWei(wethPriceFee));               
            const daiBalance = await pool.getBalance(DAI);
            console.log('DAI = ', fromWei(daiBalance));
            const daiNormWeight = await pool.getNormalizedWeight(DAI);
            console.log('%DAI  = ', fromWei(daiNormWeight));
            const wethBalance = await pool.getBalance(WETH);
            console.log('WETH = ', fromWei(wethBalance));                                    
            adminBalance = await dai.balanceOf(admin);
            console.log('Balance Administrador =', fromWei(adminBalance));              
            
            assert.ok( 175 > fromWei(wethPriceFee));                                    
            
        });     
        
        it('Ponemos la Comisión Inicial en 9%', async () => {
            await pool.setSwapFee(toWei('0.09'));
            const swapFee = await pool.getSwapFee();
            assert.equal(0.09, fromWei(swapFee));
        });
        

        console.log('ATTACKER CONTINUE SELLING ETH!!');
        
        /*
            El Pool que presentaba esta liquidez va a recibir 195 ETHs
            DAI  - $140.000    70%
            WETH - $350       30% 
            Precio WETH =    171 Dolares
            POOL = 140.000 + 60.000 = 200.000
        */        

        it('Ataque Final del vendedor de ETH', async () => {
            // 55 WETH -> DAI
            //const expected = calcOutGivenIn(52.5, 5, 10500, 5, 2.5, 0.04);
            expected = calcOutGivenIn(350, 30, 140000, 70, 55, 0.09);   
            console.log('SIMULATING ATTACK PRICE');
            console.log('Dais conseguidos por intercambiar 55 ETHs',expected );
            console.log('Precio al vender 55 ETH al Pool , comisión 9% =', (expected)/55);            
            adminBalance = await weth.balanceOf(attacker);
            console.log('Balance Attacker WETH  = ', fromWei(adminBalance));
        
            // Operacion de SWAP, donde se da la cantidad exacta que se mete en el Pool
            // Trades an exact tokenAmountIn of tokenIn taken from the caller by the pool,
            // in exchange for at least minAmountOut of tokenOut given to the caller from the pool,
            // with a maximum marginal price of maxPrice
            // tokenAmountOut >= minAmountOut and spotPriceAfter <= maxPrice

            const txr = await pool.swapExactAmountIn(
                WETH, // TokenIn : address tokenIn,
                toWei('55'), // uint tokenAmountIn: Los tokens que vamos a intercambiar 
                DAI, //  TokenOut: address tokenOut,
                toWei('1'),  // minAmountOut: Minima cantidad a recibir, de los 195
                toWei('1'), // maxPrice: 
                //  Maximo precio de Spot que es al precio al que compramos
                { from: attacker }, // Direccion que lo recibe
            );


            // These values are what are limited by the arguments; you are guaranteed tokenAmountOut >= minAmountOut and spotPriceAfter <= maxPrice).

            const log = txr.logs[0];
            assert.equal(log.event, 'LOG_SWAP');

            console.log('Precio despues de vender 55 ETH');
            expected = await pool.getSpotPrice(DAI, WETH);
            console.log('Precio de DAI/WETH Pool total ATAQUE =', fromWei(expected));

            assert.ok(170 > fromWei(expected));


            console.log('Pool Situation AFTER GREAT ATTACK');
            const daiBalance = await pool.getBalance(DAI);
            console.log('DAI = ', fromWei(daiBalance));
            const wethBalance = await pool.getBalance(WETH);
            console.log('WETH = ', fromWei(wethBalance)); 
            adminBalance = await weth.balanceOf(attacker);
            console.log('Balance Attacker WETH  = ', fromWei(adminBalance));           
            
        });


        /*
            El Pool acaba con 
            DAI  - $132.000    70%
            WETH - $405        30% 
            Precio ETH en 153 Dolares
            POOL = 132.000 + 60.000 = 193.000
        */    

        console.log('MARKETS RECOVERS FROM SPIKE MOVEMENT!!');

        it('Aparecen los compradores de ETH', async () => {
            // 10.000 ETH -> WETH
            //const expected = calcOutGivenIn(52.5, 5, 10500, 5, 2.5, 0.04);
            expected = calcOutGivenIn(132000, 70, 405, 30,  8000, 0.09);   
            console.log('Compradores de ETH');
            console.log('ETHs conseguidos por intercambiar 8.000 DAis',expected );
            console.log('Precio al comprar ETH al Pool , comisión 9% =', 8000/(expected));   

            const txr = await pool.swapExactAmountIn(
                DAI, // TokenIn : address tokenIn,
                toWei('8000'), // uint tokenAmountIn: Los tokens que vamos a intercambiar 
                WETH, //  TokenOut: address tokenOut,
                toWei('1'),  // minAmountOut: Minima cantidad a recibir, de los 195
                toWei('300'), // maxPrice: 
                //  Maximo precio de Spot que es al precio al que compramos
                { from: attacker }, // Direccion que lo recibe
            );  

            const log = txr.logs[0];
            assert.equal(log.event, 'LOG_SWAP');    

            console.log('Precio despues de comprar 5.000 DAIs');
            expected = await pool.getSpotPrice(DAI, WETH);
            console.log('Precio de DAI/WETH Pool total ATAQUE =', fromWei(expected));

          /*
            El Pool acaba con 
            DAI  - $137.000    70%
            WETH - $374        30% 
            POOL = 137.000 + 
         */    

            console.log('Pool Situation AFTER RECOVERY');
            const daiBalance = await pool.getBalance(DAI);
            console.log('DAI = ', fromWei(daiBalance));
            const wethBalance = await pool.getBalance(WETH);
            console.log('WETH = ', fromWei(wethBalance)); 
            adminBalance = await weth.balanceOf(attacker);
            console.log('Balance Attacker WETH  = ', fromWei(adminBalance));                   
                    
        });



        /*
        it('swapExactAmountIn', async () => {
            // 100 WETH -> DAI
            const expected = calcOutGivenIn(52.5, 5, 10500, 5, 2.5, 0.04);
            const txr = await pool.swapExactAmountIn(
                WETH,
                toWei('100'),
                DAI,
                toWei('475'),
                toWei('200'),
                { from: attacker },
            );
            const log = txr.logs[0];
            assert.equal(log.event, 'LOG_SWAP');
            // 475.905805337091423

            const actual = fromWei(log.args[4]);
            const relDif = calcRelativeDiff(expected, actual);
            if (verbose) {
                console.log('swapExactAmountIn');
                console.log(`expected: ${expected})`);
                console.log(`actual  : ${actual})`);
                console.log(`relDif  : ${relDif})`);
            }

            assert.isAtMost(relDif.toNumber(), errorDelta);

            const userDaiBalance = await dai.balanceOf(investor);
            assert.equal(fromWei(userDaiBalance), Number(fromWei(log.args[4])));

            // 182.804672101083406128
            const wethPrice = await pool.getSpotPrice(DAI, WETH);
            const wethPriceFeeCheck = ((10024.094194662908577 / 5) / (55 / 5)) * (1 / (1 - 0.003));
            assert.approximately(Number(fromWei(wethPrice)), Number(wethPriceFeeCheck), errorDelta);

            const daiNormWeight = await pool.getNormalizedWeight(DAI);
            assert.equal(0.333333333333333333, fromWei(daiNormWeight));
        });
        */

        // El precio sube de nuevo y The Wall sale de su posición
        

        // Calculo de la Rentabilidad adicional

    });

    
});
