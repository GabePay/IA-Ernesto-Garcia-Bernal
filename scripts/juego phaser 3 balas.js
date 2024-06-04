var anchoJuego = 800;
var altoJuego = 400;
var jugador;
var fondo;

var bala1, bala2, bala3, balaDisparada = false;
var nave1, nave2, nave3;

var teclaSaltar, teclaIzquierda;
var menuPausa;

var sonidoSaltar = new Audio();
sonidoSaltar.src = 'assets/audio/jump2.mp3';

var sonidoDisparo1 = new Audio();
sonidoDisparo1.src = 'assets/audio/disparoSound.mp3';

var sonidoDisparo2 = new Audio();
sonidoDisparo2.src = 'assets/audio/disparoSound.mp3';

var sonidoDisparo3 = new Audio();
sonidoDisparo3.src = 'assets/audio/disparoSound.mp3';

var sonidoPausa = new Audio();
sonidoPausa.src = 'assets/audio/pause.mp3';

var sonidoGameOver = new Audio();
sonidoGameOver.src = 'assets/audio/game_over.mp3';

var musicaFondo = new Audio();
musicaFondo.src = 'assets/audio/musicFondo.mp3';

var velocidadBala;
var desplazamientoBala;

var enAire;
var enSuelo;

var redNeuronalSaltar, redNeuronalMoverIzquierda, redNeuronalMoverDerecha;
var entrenamientoSaltar, entrenamientoMoverIzquierda, entrenamientoMoverDerecha;

var salidaRedNeuronal, datosEntrenamientoSaltar = [];
var datosEntrenamientoMoverIzquierda = [];
var datosEntrenamientoMoverDerecha = [];

var moverDerechaEnAire = 0;
var modoAutomatico = false, entrenamientoCompleto = false;

var moviendoDerecha = false;

var juego = new Phaser.Game(anchoJuego, altoJuego, Phaser.CANVAS, '', { preload: preload, create: create, update: update, render: render });

const bala3PosX = anchoJuego - 270;
const bala3PosY = altoJuego - 350;
const velocidadBala2 = 85;

var bloqueIA = false;
var moviendoIzquierda = false;
var estadoDerecha = 0;
var estadoIzquierda = 0;
var estadoTemporal = 0;

function preload() {
    juego.load.image('fondo', 'assets/game/fondo.png');
    juego.load.spritesheet('jugador', 'assets/sprites/p3.png', 34, 48);
    juego.load.image('nave', 'assets/game/nave.png');
    juego.load.image('bala', 'assets/sprites/ball.png');
    juego.load.image('menu', 'assets/game/menu.png');
    musicaFondo.loop = true;
    musicaFondo.play();
}

function create() {
    juego.physics.startSystem(Phaser.Physics.ARCADE);
    juego.physics.arcade.gravity.y = 800;
    juego.time.desiredFps = 30;

    fondo = juego.add.tileSprite(0, 0, anchoJuego, altoJuego, 'fondo');

    nave1 = juego.add.sprite(anchoJuego - 110, altoJuego - 55, 'nave');
    nave2 = juego.add.sprite(anchoJuego - 800, altoJuego - 400, 'nave');
    nave3 = juego.add.sprite(anchoJuego - 200, altoJuego - 400, 'nave');

    jugador = juego.add.sprite(50, altoJuego, 'jugador');

    juego.physics.enable(jugador);
    jugador.body.collideWorldBounds = true;
    var animacionCorrer = jugador.animations.add('correr', [0, 1]);
    jugador.animations.play('correr', 6, true);

    bala1 = juego.add.sprite(anchoJuego - 100, altoJuego, 'bala');
    juego.physics.enable(bala1);
    bala1.body.collideWorldBounds = true;

    bala2 = juego.add.sprite(anchoJuego - 750, altoJuego - 350, 'bala');
    juego.physics.enable(bala2);
    bala2.body.collideWorldBounds = false;

    bala3 = juego.add.sprite(bala3PosX, bala3PosY, 'bala');
    juego.physics.enable(bala3);
    bala3.body.collideWorldBounds = false;

    etiquetaPausa = juego.add.text(anchoJuego - 430, 10, 'Pausa', { font: '20px Arial', fill: '#fff' });
    etiquetaPausa.inputEnabled = true;
    etiquetaPausa.events.onInputUp.add(pausarJuego, self);
    juego.input.onDown.add(reanudarJuego, self);

    teclaSaltar = juego.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
    teclaIzquierda = juego.input.keyboard.addKey(Phaser.Keyboard.A);

    teclaIzquierda.onUp.add(detenerMovimiento, this);

    redNeuronalSaltar = new synaptic.Architect.Perceptron(2, 8, 8, 1);
    entrenamientoSaltar = new synaptic.Trainer(redNeuronalSaltar);

    redNeuronalMoverIzquierda = new synaptic.Architect.Perceptron(3, 8, 8, 1);
    entrenamientoMoverIzquierda = new synaptic.Trainer(redNeuronalMoverIzquierda);

    redNeuronalMoverDerecha = new synaptic.Architect.Perceptron(2, 8, 8, 1);
    entrenamientoMoverDerecha = new synaptic.Trainer(redNeuronalMoverDerecha);
}

const reiniciarBala2 = () => {
    bala2.position.x = anchoJuego - 750;
    bala2.body.position.y = 5;
    bala2.body.velocity.y = velocidadBala2;
    sonidoDisparo2.play();
};

const reiniciarPosicionBala3 = () => {
    bala3.position.x = bala3PosX;
    bala3.position.y = bala3PosY;
    sonidoDisparo3.play();
};

function entrenarRedNeuronal() {
    entrenamientoSaltar.train(datosEntrenamientoSaltar, { rate: 0.0003, iterations: 5000, shuffle: true });
    entrenamientoMoverIzquierda.train(datosEntrenamientoMoverIzquierda, { rate: 0.0003, iterations: 5000, shuffle: true });
    entrenamientoMoverDerecha.train(datosEntrenamientoMoverDerecha, { rate: 0.0003, iterations: 5000, shuffle: true });
}

function obtenerDatosSaltar(parametrosEntrada) {
    salidaRedNeuronal = redNeuronalSaltar.activate(parametrosEntrada);
    var porcentajeAire = Math.round(salidaRedNeuronal[0] * 100);
    return porcentajeAire >= 40;
}

function obtenerDatosMoverIzquierda(parametrosEntrada) {
    salidaRedNeuronalMoverIzquierda = redNeuronalMoverIzquierda.activate(parametrosEntrada);    
    const resultado = Math.round(salidaRedNeuronalMoverIzquierda[0] * 100);
    console.log("RN Mover Izquierda", salidaRedNeuronalMoverIzquierda, resultado);
    return resultado > 20;
}

function obtenerDatosMoverDerecha(parametrosEntrada) {
    salidaRedNeuronalMoverDerecha = redNeuronalMoverDerecha.activate(parametrosEntrada);
    const resultado = Math.round(salidaRedNeuronalMoverDerecha[0] * 100);
    console.log("RN Mover Derecha", salidaRedNeuronalMoverDerecha, resultado);
    return resultado >= 9;
}

function pausarJuego() {
    juego.paused = true;
    menuPausa = juego.add.sprite(anchoJuego / 2, altoJuego / 2, 'menu');
    menuPausa.anchor.setTo(0.5, 0.5);
    sonidoPausa.play();
}

function reanudarJuego(evento) {
    if (juego.paused) {
        var menuX1 = anchoJuego / 2 - 270 / 2, menuX2 = anchoJuego / 2 + 270 / 2,
            menuY1 = altoJuego / 2 - 180 / 2, menuY2 = altoJuego / 2 + 180 / 2;

        var mouseX = evento.x,
            mouseY = evento.y;

        if (mouseX > menuX1 && mouseX < menuX2 && mouseY > menuY1 && mouseY < menuY2) {
            if (mouseX >= menuX1 && mouseX <= menuX2 && mouseY >= menuY1 && mouseY <= menuY1 + 90) {
                entrenamientoCompleto = false;
                datosEntrenamientoSaltar = [];
                modoAutomatico = false;
            } else if (mouseX >= menuX1 && mouseX <= menuX2 && mouseY >= menuY1 + 90 && mouseY <= menuY2) {
                if (!entrenamientoCompleto) {
                    entrenarRedNeuronal();
                    entrenamientoCompleto = true;
                    jugador.position.x = 50;
                }
                modoAutomatico = true;
            }
            menuPausa.destroy();
            resetearVariablesJuego();
            juego.paused = false;
        }
    }
}

function resetearVariablesJuego() {
    jugador.body.velocity.x = 0;
    jugador.body.velocity.y = 0;
    bala1.body.velocity.x = 0;
    bala1.position.x = anchoJuego - 100;
    sonidoDisparo1.play();
    balaDisparada = false;
}

function saltar() {
    sonidoSaltar.play();
    jugador.body.velocity.y = -270;
}

const moverDerecha = () => {
    if (jugador.body.position.x > 100) return;
    jugador.body.position.x = 50;
    jugador.body.position.y = 400;

    estadoDerecha = 1;
    estadoIzquierda = 0;
    moviendoIzquierda = false;
    estadoTemporal = 1;
};

const moverIzquierda = () => {
    jugador.body.velocity.x = -80;
    estadoDerecha = 0;
    estadoIzquierda = 1;
    moviendoIzquierda = true;
};

function detenerMovimiento() {
    if (!modoAutomatico && jugador.body.onFloor()) {
        jugador.body.velocity.x = 0;
    }
}

function update() {
    fondo.tilePosition.x -= 1;
    juego.physics.arcade.collide(bala1, jugador, manejarColision, null, this);
    juego.physics.arcade.collide(bala2, jugador, manejarColision, null, this);
    juego.physics.arcade.collide(bala3, jugador, manejarColision, null, this);

    bala3.body.velocity.y = 80;
    bala3.body.position.x -= 5;

    enSuelo = 1;
    enAire = 0;

    estadoDerecha = 0;
    estadoIzquierda = 0;

    if (!jugador.body.onFloor()) {
        enSuelo = 0;
        enAire = 1;
        moverDerechaEnAire = 1;
    } else {
        moverDerechaEnAire = 0;
    }

    if (bala3.position.x <= 0) {
        reiniciarPosicionBala3();
    }

    desplazamientoBala = Math.floor(jugador.position.x - bala1.position.x);
    desplazamientoBala2 = Math.floor(jugador.position.y - bala2.position.y);
    desplazamientoBala3 = Math.floor(jugador.position.x - bala3.position.x);
    desplazamientoBala3b = Math.floor(jugador.position.y - bala3.position.y);

    if (!modoAutomatico && teclaSaltar.isDown && jugador.body.onFloor()) {
        saltar();
    }

    if (!modoAutomatico && teclaIzquierda.isDown) {
        moverIzquierda();
    }

    if (moviendoIzquierda) {
        if (bala1.body.position.x > 600 && bala2.body.position.y < 280 && bala3.body.position.y < 280) {
            moverDerecha();
        }
    }

    if (modoAutomatico && bala2.position.y > 200) {
        const resultado = obtenerDatosMoverIzquierda([desplazamientoBala2, jugador.position.x, bala2.position.x]);
        if (resultado) {
            moverIzquierda();
        }
    }

    if (modoAutomatico && bala3.position.y > 300 && bala3.position.x > 0) {
        if (obtenerDatosMoverDerecha([desplazamientoBala3, desplazamientoBala3b])) {
            moverIzquierda();
            console.log("RN Mover Izquierda");
        }
    }

    if (modoAutomatico && bala1.position.x > 0 && jugador.body.onFloor()) {
        if (obtenerDatosSaltar([desplazamientoBala, velocidadBala])) {
            saltar();
        }
    }

    bala2.body.velocity.y = velocidadBala2;

    if (bala2.body.position.y <= 0) {
        bloqueIA = false;
    }

    if (!balaDisparada) {
        disparar();
    }

    if (bala1.position.x <= 0) {
        resetearVariablesJuego();
    }
    if (bala2.position.y >= 380) {
        reiniciarBala2();
    }

    if (!modoAutomatico && bala2.position.y > 100 && desplazamientoBala2 > 0) {
        datosEntrenamientoMoverIzquierda.push({
            'input': [desplazamientoBala2, jugador.position.x, bala2.position.x],
            'output': [estadoIzquierda]
        });
    }

    if (!modoAutomatico && bala3.position.y > 200 && bala3.position.x > 0) {
        datosEntrenamientoMoverDerecha.push({
            'input': [desplazamientoBala3, desplazamientoBala3b],
            'output': [estadoIzquierda]
        });
    }

    if (!modoAutomatico && bala1.position.x > 0) {
        datosEntrenamientoSaltar.push({
            'input': [desplazamientoBala, velocidadBala],
            'output': [enAire]
        });
    }
}

function disparar() {
    const max = modoAutomatico ? 700 : 500;
    velocidadBala = -1 * obtenerVelocidadAleatoria(300, max);
    bala1.body.velocity.y = 0;
    bala1.body.velocity.x = velocidadBala;
    balaDisparada = true;
}

function manejarColision() {
    pausarJuego();
    reiniciarPosicionBala3();
    reiniciarBala2();
    sonidoGameOver.play();
    jugador.position.x = 50;
}

function obtenerVelocidadAleatoria(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function render() {
    // Función vacía para posibles renderizados futuros
}
