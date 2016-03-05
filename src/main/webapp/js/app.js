var ShipsType = {
  Submarine: 'submarine',
  Blue: 'blue',
  Green: 'green'
};

var WebSocketIDs = {
  UpdateCoordinates: 'updateCoordinates',
  BulletShot: 'bulletShot',
  BulletShotDouble: 'bulletShotDouble',
  MissileShot: 'missileShot',
  LightOnOff: 'lightOnOff',
  ShipArrived: 'shipArrived',
  ShipsCollided: 'shipsCollided',
  ShipKilled: 'shipKilled',
  GameOver: 'gameOver'
};

var GameResults = {
  Draw: 'draw',
  Nazis: 'nazis',
  Uruguay: 'uruguay'
}

var ShipStates = {
  Alive: 'alive',
  Destroyed: 'destroyed',
  Arrived: 'arrived'
}

var Strings = {
  PlayerArrived: 'Has llegado a Nueva York.',
  ShipArrivedBlue: 'El carguero azul ha llegado a Nueva York.',
  ShipArrivedGreen: 'El carguero verde ha llegado a Nueva York.',
  PlayerCollided: 'Has impactado con otra embarcación.',
  CollisionSubmarineBlue: 'El submarino y el carguero azul han impactado.',
  CollisionSubmarineGreen: 'El submarino y el carguero verde han impactado.',
  CollisionBlueGreen: 'El carguero azul y el carguero verde han impactado.',
  PlayerKilled: 'Te han destruido.',
  ShipKilledSubmarine: 'El submarino ha sido destruido.',
  ShipKilledBlue: 'El carguero azul ha sido destruido.',
  ShipKilledGreen: 'El carguero verde ha sido destruido.'
}

//var wsCounter = 0;

function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

var app = (function  () {
  var cursors, game,
    gameWidth = 800, 
    gameHeight = 600, 
    gameContainer = 'game-container',
    submarine, blue, green, ship,
    caribbean, ny, mvd, mask,
    currentSpeed, shipType,
    submarineState = ShipStates.Alive, 
    blueState = ShipStates.Alive, 
    greenState = ShipStates.Alive;

  var addPlayer = function(name, role) {
    $("#players-list").html(name);
  }

  $(document).ready(function() {
    $(".insert-nickname").hide();
    $(".select-sides").hide();

    $(".button-play").click(function() {
      $(".main-menu").hide();
      $(".insert-nickname").show();
    });

    $(".button-prev").click(function() {
      $(".main-menu").show();
      $(".insert-nickname").hide();
      $(".select-sides").hide();
    });

    $(".button-next").click(function() {
      $(".main-menu").hide();
      $(".insert-nickname").hide();
      $(".select-sides").show();

      var nickname = $("#insert-nickname").val();
      var connection = webSocket.init();

      //Solicito los usuarios conectados
      setTimeout(function() {
                 var message = {
          id: "getUsersConnected",
          message: ""
        }

      webSocket.sendMessage(message);
     }, 1000);
     
    

      webSocket.setOnMessage(function(msg) {
        var jsonMsg = JSON.parse(msg.data);

        if (jsonMsg.id == "setRole") {
          if (!shipType) {
            shipType = jsonMsg.message;
            webSocket.setUser(nickname, shipType);  
          } else {
            addPlayer(jsonMsg.name);
          }
        }
        //Obtengo los usuarios conectados
        if (jsonMsg.id == "getUsersConnected") {
            addPlayer(jsonMsg.message);
        }

        if (jsonMsg.id == "initGame") {
          if (shipType == ShipsType.Submarine) {
            init();
          } else {
            setTimeout(function() {
              init(); //Comienzo Juego
            }, 1000);     
          }         
        }

      });
    });
  });

  var init = function() {
    game = new Phaser.Game(gameWidth, gameHeight, Phaser.AUTO, gameContainer, { 
      preload: preload, 
      create: create, 
      update: update, 
      render: render 
    });
    //Foco al juego
    $('#game-title').remove();
    $('#players-list').remove();
  };

  function render() {}

  function preload() 
  {
    game.load.image('empty', 'assets/empty.png');
    game.load.image('water', 'assets/pattern-water.png');
    game.load.image('land', 'assets/pattern-land.png');
    game.load.image('port', 'assets/port.png');
    game.load.image('submarine', 'assets/submarine-red.png');
    game.load.image('blue', 'assets/ship-blue.png');
    game.load.image('green', 'assets/ship-green.png');
    game.load.image('island', 'assets/pattern-island.png');
    game.load.image('bullet', 'assets/bullet.png');
    game.load.image('missile', 'assets/missile.png');
  }

  function create() {
    // Inicio el motor fisico
    game.physics.startSystem(Phaser.Physics.ARCADE);

    // Inicio todo lo relacionado al mapa del juego
    var admin = (shipType == ShipsType.Submarine);
    map.init(game, admin);
    
    // Inicio las naves
    ships.init(game);

    submarine = ships.getSubmarine();
    blue = ships.getBlue();
    green = ships.getGreen();

    //var shipType = getParameterByName("shipType");

    switch (shipType) {
      // Player submarino
      case ShipsType.Submarine:
        setPlayerShip(submarine);
        //webSocket.setUser(ShipsType.Submarine);
        break;
      
      // Player carguero azul
      case ShipsType.Blue:
        setPlayerShip(blue);
        //webSocket.setUser(ShipsType.Blue);
        break;
      
      // Player carguero verde
      case ShipsType.Green:
        setPlayerShip(green);
        //webSocket.setUser(ShipsType.Green);
        break;
    }

    // Seteo que la camara siga al submarino
    game.camera.follow(ship.el);
    game.camera.focusOnXY(0, 0);

    cursors = game.input.keyboard.createCursorKeys();

    game.input.activePointer.x = ship.x;
    game.input.activePointer.y = ship.y;
    
    webSocket.setOnMessage(function (message) {
      try {
        var jsonMsg = JSON.parse(message.data);

        switch (jsonMsg.id) {

          // Update de la posicion de los barcos
          case WebSocketIDs.UpdateCoordinates:
            if (jsonMsg.user != ship.el.type) {
              if (jsonMsg.user == ShipsType.Submarine) {
                submarine.el.x = jsonMsg.x;
                submarine.el.y = jsonMsg.y;
                submarine.el.rotation = jsonMsg.rotation;
              }

              if (jsonMsg.user == ShipsType.Blue) {
                blue.el.x = jsonMsg.x;
                blue.el.y = jsonMsg.y;
                blue.el.rotation = jsonMsg.rotation;
              }

              if (jsonMsg.user == ShipsType.Green) {
                green.el.x = jsonMsg.x;
                green.el.y = jsonMsg.y;
                green.el.rotation = jsonMsg.rotation;
              }
            }
            break;

          // Update de la luz
          case WebSocketIDs.LightOnOff:
            if (jsonMsg.user == ShipsType.Blue) {
              blue.light = jsonMsg.value;
            }

            if (jsonMsg.user == ShipsType.Green) {
              green.light = jsonMsg.value;
            }
            break;

          // Update del disparo azul
          case WebSocketIDs.BulletShotDouble:
            blue.fireBullet();
            break;

          // Update del disparo bala submarino
          case WebSocketIDs.BulletShot:
            submarine.fireBullet();
            break;

          // Update del misil submarino
          case WebSocketIDs.MissileShot:
            submarine.fireMissile();
            break;

          // Update carguero llega al puerto
          case WebSocketIDs.ShipArrived:
            if (jsonMsg.ship == ShipsType.Blue) {
              // Azul llego a NY
              blue.el.kill();
              game.debug.reset();
              if (ship.el.type == ShipsType.Blue) {
                game.debug.text(Strings.PlayerArrived, 32, 32, '#ffffff', '16px Arial');
              } else {
                game.debug.text(Strings.ShipArrivedBlue, 32, 32, '#ffffff', '16px Arial');
              }
            } else {
              // Verde llego a NY
              green.el.kill();
              game.debug.reset();
              if (ship.el.type == ShipsType.Green) {
                game.debug.text(Strings.PlayerArrived, 32, 32, '#ffffff', '16px Arial');
              } else {
                game.debug.text(Strings.ShipArrivedGreen, 32, 32, '#ffffff', '16px Arial');
              }
            }
            break;

          // Update colision entre barcos
          case WebSocketIDs.ShipsCollided:
            var shipOne = jsonMsg.shipOne;
            var shipTwo = jsonMsg.shipTwo;
            game.debug.reset();
            if ((shipOne == ShipsType.Submarine || shipTwo == ShipsType.Submarine)
                  && (shipOne == ShipsType.Blue || shipTwo == ShipsType.Blue)) {
              
              // Submarino vs azul
              submarine.el.kill();
              blue.el.kill();
              if (ship.el.type == shipOne || ship.el.type == shipTwo) {
                game.debug.text(Strings.PlayerCollided, 32, 32, '#ffffff', '16px Arial');
              } else {
                game.debug.text(Strings.CollisionSubmarineBlue, 32, 32, '#ffffff', '16px Arial');
              }

            } else if ((shipOne == ShipsType.Submarine || shipTwo == ShipsType.Submarine)
                        && (shipOne == ShipsType.Green || shipTwo == ShipsType.Green)) {
              
              // Submarino vs verde
              submarine.el.kill();
              green.el.kill();
              if (ship.el.type == shipOne || ship.el.type == shipTwo) {
                game.debug.text(Strings.PlayerCollided, 32, 32, '#ffffff', '16px Arial');
              } else {
                game.debug.text(Strings.CollisionSubmarineGreen, 32, 32, '#ffffff', '16px Arial');
              }
            } else {
              
              // Azul vs verde
              blue.el.kill();
              green.el.kill();
              if (ship.el.type == shipOne || ship.el.type == shipTwo) {
                game.debug.text(Strings.PlayerCollided, 32, 32, '#ffffff', '16px Arial');
              } else {
                game.debug.text(Strings.CollisionBlueGreen, 32, 32, '#ffffff', '16px Arial');
              }
            }
            break;

          // Update barco destruido
          case WebSocketIDs.ShipKilled:
            game.debug.reset();
            switch (jsonMsg.ship) {
              case ShipsType.Submarine: 
                submarine.el.kill();
                game.debug.text(Strings.ShipKilledSubmarine, 32, 32, '#ffffff', '16px Arial');
                break;
              case ShipsType.Blue: 
                blue.el.kill();
                if (ship.el.type == ShipsType.Blue) {
                  game.debug.text(Strings.PlayerKilled, 32, 32, '#ffffff', '16px Arial');
                } else {
                  game.debug.text(Strings.ShipKilledBlue, 32, 32, '#ffffff', '16px Arial');
                }
                break;
              case ShipsType.Green: 
                green.el.kill();
                if (ship.el.type == ShipsType.Green) {
                  game.debug.text(Strings.PlayerKilled, 32, 32, '#ffffff', '16px Arial');
                } else {
                  game.debug.text(Strings.ShipKilledGreen, 32, 32, '#ffffff', '16px Arial');
                }
                break;
            }
            break;

        }
      
        
      } catch(err) {
        console.log(err);
      }   
    });
  }

  function update() {
    caribbean = map.getCaribbean();
    ny = map.getNY();
    mvd = map.getMvd();
    // mask = map.getMask(ship);
    
    mask = ship.vision;
    game.world.mask = mask;

    mask.x = ship.el.body.x + 36;
    mask.y = ship.el.body.y + 36;



    /* -------------------- */
    /* ---- COLISIONES ---- */
    /* -------------------- */

    // Los barcos chocan contra la tierra pero no se hunden
    game.physics.arcade.collide([ny.land, mvd.land, caribbean.islands], ship.el);

    game.physics.arcade.collide([ny.land, mvd.land, caribbean.islands], 
      submarine.missile, function() {
        submarine.missile.kill();
    });
    game.physics.arcade.collide([ny.land, mvd.land, caribbean.islands], 
      submarine.bullet, function() {
        submarine.bullet.kill();
    });
    game.physics.arcade.collide([ny.land, mvd.land, caribbean.islands], 
      blue.bulletLeft, function() {
        blue.bulletLeft.kill();
    });
    game.physics.arcade.collide([ny.land, mvd.land, caribbean.islands], 
      blue.bulletRight, function() {
        blue.bulletRight.kill();
    });

    /* El jugador del submarino detecta las colisiones 
    y las envia al WS unicamente el para evitar mensajes repetidos */
    if (ship.el.type == ShipsType.Submarine) {

      /* Si el barco tiene la luz apagada, el submarino
      lo ve solo dentro de un radio de 200.
      Si el barco tiene la luz prendida, el submarino lo ve siempre */ 

      // Actualizo la luz del barco azul
      if (blue.light == false 
        && game.physics.arcade.distanceBetween(submarine.el, blue.el) > 200) {
        blue.el.alpha = 0;
      } else {
        blue.el.alpha = 1;
      }

      // Actualizo la luz del barco verde
      if (green.light == false 
        && game.physics.arcade.distanceBetween(submarine.el, green.el) > 200) {
        green.el.alpha = 0;
      } else {
        green.el.alpha = 1;
      } 

      // Submarino vs azul
      game.physics.arcade.overlap(blue.el, submarine.el, function() {
        blue.el.kill();
        blueState = ShipStates.Destroyed;

        submarine.el.kill();
        submarineState = ShipStates.Destroyed;
        var message = {
          id: WebSocketIDs.ShipsCollided,
          shipOne: ShipsType.Submarine,
          shipTwo: ShipsType.Blue,
        }
        webSocket.sendMessage(message);
        game.debug.reset();
        game.debug.text(Strings.PlayerCollided, 32, 32, '#ffffff', '16px Arial');
      });

      // Submarino vs verde
      game.physics.arcade.overlap(green.el, submarine.el, function() {
        green.el.kill();
        greenState = ShipStates.Destroyed;

        submarine.el.kill();
        submarineState = ShipStates.Destroyed;
        var message = {
          id: WebSocketIDs.ShipsCollided,
          shipOne: ShipsType.Submarine,
          shipTwo: ShipsType.Green,
        }
        webSocket.sendMessage(message);
        game.debug.reset();
        game.debug.text(Strings.PlayerCollided, 32, 32, '#ffffff', '16px Arial');
      });

      // Azul vs verde
      game.physics.arcade.overlap(green.el, blue.el, function() {
        green.el.kill();
        greenState = ShipStates.Destroyed;

        blue.el.kill();
        blueState = ShipStates.Destroyed;
        var message = {
          id: WebSocketIDs.ShipsCollided,
          shipOne: ShipsType.Blue,
          shipTwo: ShipsType.Green,
        }
        webSocket.sendMessage(message);
        game.debug.reset();
        game.debug.text(Strings.CollisionBlueGreen, 32, 32, '#ffffff', '16px Arial');
      });

      /* ----------------------------- */
      /* ---- COLISIONES DISPAROS ---- */
      /* ----------------------------- */

      // Submarino vs bulletLeft
      game.physics.arcade.overlap(blue.bulletLeft, submarine.el, function() {
        blue.bulletLeft.kill();
        var destroyed = submarine.damage('bullet');
        if (destroyed) {
          submarineState = ShipStates.Destroyed;
          var message = {
            id: WebSocketIDs.ShipKilled,
            ship: ShipsType.Submarine
          }
          webSocket.sendMessage(message);
          game.debug.text(Strings.PlayerKilled, 32, 32, '#ffffff', '16px Arial');
        }
      });

      // Submarino vs bulletRight
      game.physics.arcade.overlap(blue.bulletRight, submarine.el, function() {
        blue.bulletRight.kill();
        var destroyed = submarine.damage('bullet');
        if (destroyed) {
          submarineState = ShipStates.Destroyed;
          var message = {
            id: WebSocketIDs.ShipKilled,
            ship: ShipsType.Submarine
          }
          webSocket.sendMessage(message);
          game.debug.text(Strings.PlayerKilled, 32, 32, '#ffffff', '16px Arial');
        }
      });

      // Azul vs bullet
      game.physics.arcade.overlap(submarine.bullet, blue.el, function() {
        submarine.bullet.kill();
        var destroyed = blue.damage('bullet');
        if (destroyed) {
          blueState = ShipStates.Destroyed;
          var message = {
            id: WebSocketIDs.ShipKilled,
            ship: ShipsType.Blue
          }
          webSocket.sendMessage(message);
          game.debug.text(Strings.ShipKilledBlue, 32, 32, '#ffffff', '16px Arial');
        }
      });

      // Azul vs misil
      game.physics.arcade.overlap(submarine.missile, blue.el, function() {
        submarine.missile.kill();
        var destroyed = blue.damage('missile');
        if (destroyed) {
          blueState = ShipStates.Destroyed;
          var message = {
            id: WebSocketIDs.ShipKilled,
            ship: ShipsType.Blue
          }
          webSocket.sendMessage(message);
          game.debug.text(Strings.ShipKilledBlue, 32, 32, '#ffffff', '16px Arial');
        }
      });

      // Verde vs bulletLeft
      game.physics.arcade.overlap(blue.bulletLeft, green.el, function() {
        blue.bulletLeft.kill();
        var destroyed = green.damage('bullet');
        if (destroyed) {
          greenState = ShipStates.Destroyed;
          var message = {
            id: WebSocketIDs.ShipKilled,
            ship: ShipsType.Green
          }
          webSocket.sendMessage(message);
          game.debug.text(Strings.ShipKilledGreen, 32, 32, '#ffffff', '16px Arial');
        }
      });

      // Verde vs bulletRight
      game.physics.arcade.overlap(blue.bulletRight, green.el, function() {
        blue.bulletRight.kill();
        var destroyed = green.damage('bullet');
        if (destroyed) {
          greenState = ShipStates.Destroyed;
          var message = {
            id: WebSocketIDs.ShipKilled,
            ship: ShipsType.Green
          }
          webSocket.sendMessage(message);
          game.debug.text(Strings.ShipKilledGreen, 32, 32, '#ffffff', '16px Arial');
        }
      });

      // Verde vs bullet
      game.physics.arcade.overlap(submarine.bullet, green.el, function() {
        submarine.bullet.kill();
        var destroyed = green.damage('bullet');
        if (destroyed) {
          greenState = ShipStates.Destroyed;
          var message = {
            id: WebSocketIDs.ShipKilled,
            ship: ShipsType.Green
          }
          webSocket.sendMessage(message);
          game.debug.text(Strings.ShipKilledGreen, 32, 32, '#ffffff', '16px Arial');
        }
      });

      // Verde vs misil
      game.physics.arcade.overlap(submarine.missile, green.el, function() {
        submarine.missile.kill();
        var destroyed = green.damage('missile');
        if (destroyed) {
          greenState = ShipStates.Destroyed;
          var message = {
            id: WebSocketIDs.ShipKilled,
            ship: ShipsType.Green
          }
          webSocket.sendMessage(message);
          game.debug.text(Strings.ShipKilledGreen, 32, 32, '#ffffff', '16px Arial');
        }
      });

      /* --------------------------- */
      /* ---- LLEGAN CARGUEROS ---- */
      /* --------------------------- */
      game.physics.arcade.overlap(ny.port, blue.el, function() {
        // Destruye al carguero
        blue.el.kill();
        blueState = ShipStates.Arrived;
        // Notifica al WS
        var message = {
          id: WebSocketIDs.ShipArrived,
          ship: ShipsType.Blue
        };
        webSocket.sendMessage(message);
        game.debug.text(Strings.ShipArrivedBlue, 32, 32, '#ffffff', '16px Arial');
      });

      game.physics.arcade.overlap(ny.port, green.el, function() {
        // Destruye al carguero
        green.el.kill();
        greenState = ShipStates.Arrived;
        // Notifica al WS
        var message = {
          id: WebSocketIDs.ShipArrived,
          ship: ShipsType.Green
        };
        webSocket.sendMessage(message);
        game.debug.text(Strings.ShipArrivedGreen, 32, 32, '#ffffff', '16px Arial');
      });

    } else {
      game.physics.arcade.overlap(submarine.missile, green.el, function() { submarine.missile.kill(); });
      game.physics.arcade.overlap(submarine.bullet, green.el, function() { submarine.bullet.kill(); });
      game.physics.arcade.overlap(blue.bulletRight, green.el, function() { blue.bulletRight.kill(); });
      game.physics.arcade.overlap(blue.bulletLeft, green.el, function() { blue.bulletLeft.kill(); });
      game.physics.arcade.overlap(submarine.missile, blue.el, function() { submarine.missile.kill(); });
      game.physics.arcade.overlap(submarine.bullet, blue.el, function() { submarine.bullet.kill(); });
      game.physics.arcade.overlap(blue.bulletRight, submarine.el, function() { blue.bulletRight.kill(); });
      game.physics.arcade.overlap(blue.bulletLeft, submarine.el, function() { blue.bulletLeft.kill(); });
    }

    ship.update(cursors);
    var gameOver = checkGameOver();
    if (gameOver != null) {
      console.log("FIN");
      game.debug.reset();
      game.debug.text('TERMINO EL JUEGO, DEJA DE HACER CAMBIOS SEBA', 32, 100, '#ffffff', '24px Arial');
      game.paused = true;
    }
  }

  var setPlayerShip = function(_ship) {
    ship = _ship;
  };

  var checkGameOver = function() {
    var gameOver = false;
    var result = null;
    var message = null;

    // Llegaron los cargueros
    if (blueState == ShipStates.Arrived 
      && greenState == ShipStates.Arrived) {
      console.log('Llegaron los cargueros');
        gameOver = true;
        result = GameResults.Uruguay;
    } else if (submarineState == ShipStates.Destroyed 
      && (blueState == ShipStates.Alive || blueState == ShipStates.Arrived) 
      && (greenState == ShipStates.Alive || greenState == ShipStates.Arrived)) {
      // Murio el submarino y los cargueros siguen vivos o llegaron
      console.log('Murio el submarino y los cargueros siguen vivos o llegaron');
        gameOver = true;
        result = GameResults.Uruguay;
    } else if (submarineState == ShipStates.Alive 
      && blueState == ShipStates.Destroyed  
      && greenState == ShipStates.Destroyed) {
      // Murieron los cargueros y el submarino sigue vivo
      console.log('Murieron los cargueros y el submarino sigue vivo');
        gameOver = true;
        result = GameResults.Nazis;
    } else if (submarineState == ShipStates.Destroyed 
      && (blueState == ShipStates.Destroyed || greenState == ShipStates.Destroyed)) {
        // Murio el submarino y murio algun carguero
        console.log('Murio el submarino y murio algun carguero');
        gameOver = true;
        result = GameResults.Draw;
    }
    if (gameOver) {
      console.log("RESULTADO: " + result);
      message = {
        id: WebSocketIDs.GameOver,
        result: result,
        submarine: submarineState,
        blue: blueState,
        green: greenState
      }; 
    }
    return message;
  }

})();