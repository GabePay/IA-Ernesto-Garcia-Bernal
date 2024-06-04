var w = 600;
var h = 600;
var jugador, fondo, bala;
var VOLVIENDOV = false;
var VOLVIENDOH = false;

var keyA, keyW, keyD, keyS;
var menu;
var contador = 0;

var estatusIzquierda, estatusDerecha, estatusArriba, estatusAbajo;
var nnNetwork, nnEntrenamiento, datosEntrenamiento = [], agruparDatos = [];
var autoMode = false, eCompleto = false;

var JX = 200;
var JY = 200;

var audioFondo = new Audio()
audioFondo.src = 'assets/audio/fondo.mp3'


var juego = new Phaser.Game(w, h, Phaser.CANVAS, '', { preload: preload, create: create, update: update, render: render });



function preload() {
    juego.load.image('fondo', 'assets/game/fondo.png');
    juego.load.spritesheet('mono', 'assets/sprites/p2.png', 34, 48);
    juego.load.image('menu', 'assets/game/menu.png');
    juego.load.image('bala', 'assets/sprites/wizball.png');
}

function create() {
    juego.physics.startSystem(Phaser.Physics.ARCADE);
    juego.time.desiredFps = 30;

    fondo = juego.add.tileSprite(0, 0, w, h, 'fondo');
    jugador = juego.add.sprite(w / 2, h / 2, 'mono');
    juego.physics.enable(jugador);
    jugador.body.collideWorldBounds = true;
    var corre = jugador.animations.add('corre', [8, 9, 10, 11]);
    jugador.animations.play('corre', 10, true);

    
    var random = Math.floor(Math.random() * 4);
    switch (random){
        case 0:
            bala = juego.add.sprite(0, 0, 'bala');
            break;
        case 1:
            bala = juego.add.sprite(w, 0, 'bala');
            break;
        case 2:
            bala = juego.add.sprite(0, h, 'bala');
            break;
        default:
            bala = juego.add.sprite(w, h, 'bala');
            break;
    }

    juego.physics.enable(bala);
    bala.body.collideWorldBounds = true;
    bala.body.bounce.set(1);
    setBalaVelocity();

    pausaL = juego.add.text(w - 100, 20, 'Pausa', { font: '20px Arial', fill: '#fff' });
    pausaL.inputEnabled = true;
    pausaL.events.onInputUp.add(pausa, self);
    juego.input.onDown.add(mPausa, self);

    keyA = juego.input.keyboard.addKey(Phaser.Keyboard.A);
    keyW = juego.input.keyboard.addKey(Phaser.Keyboard.W);
    keyD = juego.input.keyboard.addKey(Phaser.Keyboard.D);
    keyS = juego.input.keyboard.addKey(Phaser.Keyboard.S);

    // Incrementamos la cantidad de neuronas y capas ocultas
    nnNetwork = new synaptic.Architect.Perceptron(2, 8, 8, 4);
    nnEntrenamiento = new synaptic.Trainer(nnNetwork);
}

function enRedNeural() {
    nnEntrenamiento.train(datosEntrenamiento, {
        rate: 0.01,
        iterations: 4000,
        shuffle: true,
        log: 4000,
        cost: synaptic.Trainer.cost.CROSS_ENTROPY
    });
}

function datosMovimiento(param_entrada) {
    nnSalida = nnNetwork.activate(param_entrada);

    var Izq = nnSalida[0];
    var Der = nnSalida[1];
    var Arr = nnSalida[2];
    var Aba = nnSalida[3];

    var valores = [Izq, Der, Arr, Aba];
    var maximo = Math.max.apply(null, valores);

    console.log('first')
    console.log(maximo)
    console.log(Izq+'   '+Der+'   '+Arr+'   '+Aba)

    if (maximo >= 0.05){
        if (maximo === Izq) return "Izq";
        if (maximo === Der) return "Der";
        if (maximo === Arr) return "Arr";
        if (maximo === Aba) return "Aba";
    }else{
        return null
    }
    
}

function resetNeuralNetwork() {
    // Reiniciar las variables de entrenamiento
    datosEntrenamiento = [];
    eCompleto = false;
    // Crear una nueva red neuronal y un nuevo entrenador
    nnNetwork = new synaptic.Architect.Perceptron(2, 8, 8, 4);
    nnEntrenamiento = new synaptic.Trainer(nnNetwork);
    
    console.log("Red neuronal reiniciada");
}

function getCuadrante(x, y) {
    if (x > 0 && y < 0) {
        return 1;
    } else if (x < 0 && y < 0) {
        return 2;
    } else if (x < 0 && y > 0) {
        return 3;
    } else if (x > 0 && y > 0) {
        return 4;
    }

    return 0
}

function update() {
    fondo.tilePosition.x -= 0;
    juego.physics.arcade.collide(bala, jugador, colisionH, null, this);

    var dx = (bala.x - jugador.x) / w;
    var dy = (bala.y - jugador.y) / h;
    var distancia = Math.sqrt(dx * dx + dy * dy);

    var bDx = bala.x - jugador.x;
    var bDy = bala.y - jugador.y;
    var cuadrante = getCuadrante(bDx, bDy)

    if (autoMode) {
        if (distancia < 0.25) {
            var movimiento = datosMovimiento([cuadrante, distancia]);
            console.log('movimiento')
            console.log(distancia)
            if (movimiento === 'Izq') {
                jugador.body.velocity.x = -300;
            } else if (movimiento === 'Der') {
                jugador.body.velocity.x = 300;
            } else if (movimiento === 'Arr') {
                jugador.body.velocity.y = -300;
            } else if (movimiento === 'Aba') {
                jugador.body.velocity.y = 300;
            }
        } else if (distancia >= 0.2 && distancia <= 0.4) {
            jugador.body.velocity.setTo(0, 0);
        } 
            else if (distancia > 0.4 && distancia <= 5) {
                var speed = 200;
                var angle = Math.atan2((h / 2) - jugador.y, (w / 2) - jugador.x);
                jugador.body.velocity.x = speed * Math.cos(angle);
                jugador.body.velocity.y = speed * Math.sin(angle);

                if (Math.abs(jugador.x - w / 2) < 5 && Math.abs(jugador.y - h / 2) < 5) {
                    jugador.body.velocity.setTo(0, 0);
                    jugador.x = w / 2;
                    jugador.y = h / 2;
                }
            }else if (distancia > 4) {
                jugador.body.velocity.setTo(0, 0);
            } 
    } else {
        jugador.body.velocity.setTo(0, 0);
        estatusIzquierda = estatusDerecha = estatusArriba = estatusAbajo = 0;

        if (keyA.isDown) {
            jugador.body.velocity.x = -300;
            estatusIzquierda = 1;
        } else if (keyD.isDown) {
            jugador.body.velocity.x = 300;
            estatusDerecha = 1;
        }

        if (keyW.isDown) {
            jugador.body.velocity.y = -300;
            estatusArriba = 1;
        } else if (keyS.isDown) {
            jugador.body.velocity.y = 300;
            estatusAbajo = 1;
        }
    }

    if (!autoMode && bala.position.x > 0) {
        datosEntrenamiento.push({
            'input': [cuadrante, distancia],
            'output': [estatusIzquierda, estatusDerecha, estatusArriba, estatusAbajo]
        });

        console.log(estatusIzquierda+'   '+estatusDerecha+'   '+estatusAbajo+'   '+estatusAbajo)
    }
}

function render() {
    //juego.debug.text('X: ' + jugador.x + ' Y: ' + jugador.y, 32, 32);
}

function pausa() {
    juego.paused = true;
    menu = juego.add.sprite(w / 2, h / 2, 'menu');
    menu.anchor.setTo(0.5, 0.5);
}

function mPausa(event) {
    if (juego.paused) {
        var menu_x1 = w / 2 - 270 / 2, menu_x2 = w / 2 + 270 / 2,
            menu_y1 = h / 2 - 180 / 2, menu_y2 = h / 2 + 180 / 2;

        var mouse_x = event.x, mouse_y = event.y;

        if (mouse_x > menu_x1 && mouse_x < menu_x2 && mouse_y > menu_y1 && mouse_y < menu_y2) {
            if (mouse_y <= menu_y1 + 90) {
                eCompleto = false;
                datosEntrenamiento = [];
                autoMode = false;
                resetGame2();
                resetNeuralNetwork();  // Reiniciar la red neuronal aquí
            } else {
                if (!eCompleto) {
                    // agruparDatos = agruparDatos.concat(datosEntrenamiento);
                    enRedNeural();
                    eCompleto = true;
                }
                resetGame();
                autoMode = true;
            }
            menu.destroy();
            juego.paused = false;
        }
    }
}


function setBalaVelocity() {
    bala.body.velocity.setTo(130, 190);
}

function setRandomPositionBala() {
    var random = Math.floor(Math.random() * 4);
    switch (random){
        case 0:
            bala.x = 0;
            bala.y = 0;
            break;
        case 1:
            bala.x = 600;
            bala.y = 0;
            break;
        case 2:
            bala.x = 0;
            bala.y = 600;
            break;
        default:
            bala.x = 600;
            bala.y = 600;
            
            break;
    }
    
    // bala.x = 0;
    // bala.y = 0;
}

function setRandomPositionBala2() {
    switch (contador){
        case 0:
            bala.x = 0;
            bala.y = 0;

            contador = contador + 1;
            break;
        case 1:
            bala.x = 600;
            bala.y = 0;
            contador = contador + 1;
            break;
        case 2:
            bala.x = 0;
            bala.y = 600;
            contador = contador + 1;
            break;
        default:
            bala.x = 600;
            bala.y = 600;
            contador = 0;
            break;
    }
    
    // bala.x = 0;
    // bala.y = 0;
}

function resetGame() {
    jugador.x = w / 2;
    jugador.y = h / 2;
    jugador.body.velocity.setTo(0, 0);
    setRandomPositionBala();
    setBalaVelocity();
}

function resetGame2() {
    jugador.x = w / 2;
    jugador.y = h / 2;
    jugador.body.velocity.setTo(0, 0);
    setRandomPositionBala2();
    setBalaVelocity();
}

function colisionH() {
    pausa();
}
