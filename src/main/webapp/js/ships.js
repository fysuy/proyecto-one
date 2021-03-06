var ships = (function() {
  function Ship (game, type, x, y) {
    this.game = game;

    this.dx = x;
    this.dy = y;
    this.dRotation = 0;

    this.el = this.game.add.sprite(x, y, type);
    this.el.anchor.setTo(0.5, 0.5);

    this.game.physics.enable(this.el, Phaser.Physics.ARCADE);
    this.el.body.collideWorldBounds = true;
    this.el.health = 2;

    this.state = ShipStates.Alive;

    this.el.type = type;

    this.bulletRange = 200;

    this.timer = this.game.time.create(false);
    this.timer.loop(200, function() { this.allowSend = true; }, this);

    this.allowSend = false;

    this.timer.start();

    return this.el;
  }

  Ship.prototype = {
    constructor: Ship,
    hasMoved: function() {
      var xDiff = Math.ceil(this.dx) != Math.ceil(this.el.x);
      var yDiff = Math.ceil(this.dx) != Math.ceil(this.el.x);
      var rotationDiff = Math.ceil(this.dRotation) != Math.ceil(this.el.rotation);

      if (xDiff || yDiff || rotationDiff) {
        return true;
      } else {
        return false;
      }
    },
    update: function(cursors) {
      if (this.el.alive) {
        if (cursors) {
          if (cursors.left.isDown)
          {
            this.el.body.rotation -= 4;
          }
          else if (cursors.right.isDown)
          {
            this.el.body.rotation += 4;
          }
          else if (cursors.up.isDown)
          {
            if (this.el.type == ShipsType.Submarine) {
              this.el.currentSpeed = 300;
            } else {
              this.el.currentSpeed = 150;
            }
            
          }
        }

        if(this.el.currentSpeed == 0) {
          this.el.body.velocity.x = 0;
          this.el.body.velocity.y = 0;
        }

        if (this.el.currentSpeed >= 0)
        {        
          if (this.el.currentSpeed > 0) {
            this.el.currentSpeed -= 5;
            this.game.physics.arcade.velocityFromRotation(this.el.rotation, this.el.currentSpeed, this.el.body.velocity);
          }
        }

        if (this.hasMoved() && this.allowSend)  {
          this.dx = Math.ceil(this.el.x);
          this.dy = Math.ceil(this.el.y);
          this.dRotation = Math.ceil(this.el.rotation);

          var message = {
            id: WebSocketIDs.UpdateCoordinates,
            x: this.el.x,
            y: this.el.y,
            rotation: this.el.rotation
          };

          webSocket.sendMessage(message);
          this.allowSend = false;
        }
      }
    }
  }

  Ship.prototype.damage = function(ammoType) {
    if (ammoType == 'bullet') {
      this.el.health -= 1;
    } else {
      this.el.health -= 2;
    }
    if (this.el.health <= 0) {
      this.el.kill();
      this.state = ShipStates.Destroyed;
      return true;
    }
    return false;
  }

  /* ------------------------ */
  /* ------- CARGUERO ------- */
  /* ------------------------ */

  function CargoBoat(game, type, x, y) {
    Ship.call(this, game, type, x, y);

    this.light = false;
    this.lightChange = false;
    this.lightRate = 500;
    this.lightTimer = 0;

    this.nextFire = 0;

    this.vision = game.add.graphics(-1000, -1000);
    this.vision.beginFill(0x000000);
    this.vision.drawCircle(0, 0, 400);

    // Propiedades del barco azul
    if (this.el.type == ShipsType.Blue) {

      // Creo la bala izquierda
      this.bulletLeft = this.game.add.sprite(0, 0, 'bullet');
      this.bulletLeft.anchor.setTo(0.5, 0.5);
      this.bulletLeft.exists = false;
      this.game.physics.arcade.enable(this.bulletLeft);
      this.bulletLeft.body.checkWorldBounds = true;
      this.bulletLeft.startX;
      this.bulletLeft.startY;
      this.bulletLeft.outOfBoundsKill = true;

      // Creo la bala derecha
      this.bulletRight = this.game.add.sprite(0, 0, 'bullet');
      this.bulletRight.anchor.setTo(0.5, 0.5);
      this.bulletRight.exists = false;
      this.game.physics.arcade.enable(this.bulletRight);
      this.bulletRight.body.checkWorldBounds = true;
      this.bulletRight.startX;
      this.bulletRight.startY;
      this.bulletRight.outOfBoundsKill = true;

      // Fijo SPACEBAR como boton para disparar
      this.bulletButton = this.game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
    }
    // Fijo F como boton para prender/apagar la luz
    this.lightButton = this.game.input.keyboard.addKey(Phaser.Keyboard.F);

  }

  CargoBoat.prototype = Object.create(Ship.prototype);
  CargoBoat.prototype.constructor = CargoBoat;
  CargoBoat.prototype.update = function(cursors) {
    Ship.prototype.update.call(this, cursors);

    if (this.lightButton.isDown) {
      if (this.game.time.now > this.lightTimer) {
        this.lightTimer = game.time.now + this.lightRate;
        this.turnLightOnOff();
        this.updateLightOnOff();
      }
    }

    // Si no hay una bala disparada -> dispara
    if (this.el.type == ShipsType.Blue) {
      if (this.bulletButton.isDown) {
        if ((!(this.bulletLeft.exists) && !(this.bulletRight.exists))
              || (!(this.bulletLeft.alive) && !(this.bulletRight.alive))) {
          this.fireBullet();
          this.updateBulletShot();
        }
      }
    }

  }

  CargoBoat.prototype.turnLightOnOff = function() {
    this.light = !(this.light);

    this.vision.clear();
    this.vision = game.add.graphics(this.el.x, this.y);
    this.vision.beginFill(0x000000);
    if (this.light) {
      this.vision.drawCircle(0, 0, 600);
    } else {
      this.vision.drawCircle(0, 0, 400);
    }
  }


  CargoBoat.prototype.updateLightOnOff = function() {
    var message = {
      id: WebSocketIDs.LightOnOff,
      value: this.light
    };
    webSocket.sendMessage(message);
  }

  CargoBoat.prototype.updateBulletShot = function() {
    var message = {
      id: WebSocketIDs.BulletShotDouble
    };
    webSocket.sendMessage(message);
  }

  CargoBoat.prototype.fireBullet = function() {
    if (this.el.alive) {

      this.bulletLeft.reset(this.el.x, this.el.y);
      this.bulletRight.reset(this.el.x, this.el.y);

      this.bulletLeft.rotation = this.el.rotation;
      this.bulletRight.rotation = this.el.rotation;

      var gunLeft = Math.PI * 1.5;  // Izquierda
      var gunRight = Math.PI * 0.5;  // Derecha

      //  Disparo las balas considerando la direccion del barco
      this.game.physics.arcade.velocityFromRotation(this.el.rotation + gunLeft, 500, this.bulletLeft.body.velocity);
      this.game.physics.arcade.velocityFromRotation(this.el.rotation + gunRight, 500, this.bulletRight.body.velocity);
      
      this.bulletLeft.startX = this.el.x;
      this.bulletLeft.startY = this.el.y;

      this.bulletRight.startX = this.el.x;
      this.bulletRight.startY = this.el.y;

    }
  }

    /* ------------------------- */
    /* ------- SUBMARINO ------- */
    /* ------------------------- */

    function Submarine (game, type, x, y) {
      Ship.call(this, game, type, x, y);

      this.nextFire = 0;

      this.missileRange = this.bulletRange * 2;
      this.fireRateMissile = 4000;
      this.nextFireMissile = 0;

      this.vision = game.add.graphics(-1000, -1000);
      this.vision.beginFill(0x000000);
      this.vision.drawCircle(0, 0, 1200);

      // Creo la bala
      this.bullet = this.game.add.sprite(0, 0, 'bullet');
      this.bullet.anchor.setTo(0.5, 0.5);
      this.bullet.exists = false;
      this.game.physics.arcade.enable(this.bullet);
      this.bullet.body.checkWorldBounds = true;
      this.bullet.startX;
      this.bullet.startY;
      this.bullet.outOfBoundsKill = true;

      // Creo el misil
      this.missile = this.game.add.sprite(0, 0, 'missile');
      this.missile.anchor.setTo(0.5, 0.5);
      this.missile.exists = false;
      this.game.physics.arcade.enable(this.missile);
      this.missile.body.checkWorldBounds = true;
      this.missile.startX;
      this.missile.startY;
      this.missile.outOfBoundsKill = true;

      this.bulletButton = this.game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
      this.missileButton = this.game.input.keyboard.addKey(Phaser.Keyboard.CONTROL);

  }

  Submarine.prototype = Object.create(Ship.prototype);
  Submarine.prototype.constructor = Submarine;
  Submarine.prototype.update = function(cursors) {
    Ship.prototype.update.call(this, cursors);

    if (this.bulletButton.isDown) {
      if ((!(this.bullet.exists) && !(this.bullet.exists))
            || (!(this.bullet.alive) && !(this.bullet.alive))) {
        this.fireBullet();
        this.updateBulletShot();
      }
    }

    if (this.missileButton.isDown) {
      if (this.game.time.now > this.nextFireMissile) {
        this.nextFireMissile = game.time.now + this.fireRateMissile;
        this.fireMissile();
        this.updateMissileShot();
      }
    }
  }

  Submarine.prototype.updateBulletShot = function() {
    var message = {
      id: WebSocketIDs.BulletShot
    };
    webSocket.sendMessage(message);
  }

  Submarine.prototype.updateMissileShot = function() {
    var message = {
      id: WebSocketIDs.MissileShot
    };
    webSocket.sendMessage(message);
  }

  Submarine.prototype.fireBullet = function() {
    if (this.el.alive) {
      // Verifico que el submarino siga vivo

      this.bullet.reset(this.el.x, this.el.y);
      this.bullet.rotation = this.el.rotation;
      this.bullet.startX = this.el.x;
      this.bullet.startY = this.el.y;

      //  Disparo la bala considerando la direccion del barco
      this.game.physics.arcade.velocityFromRotation(this.el.rotation, 500, this.bullet.body.velocity);
    }
  }

  Submarine.prototype.fireMissile = function() {

    if (this.el.alive) {
      // Verifico que el submarino siga vivo

      this.missile.reset(this.el.x, this.el.y);
      this.missile.rotation = this.el.rotation;
      this.missile.startX = this.el.x;
      this.missile.startY = this.el.y;

      //  Disparo el misil en la direccion del barco
      this.game.physics.arcade.velocityFromRotation(this.el.rotation, 500, this.missile.body.velocity);
    }
  }

  // Variables de los barcos
  var submarine, blue, green, game, gameId, loadedShips;

  var getShips = function() {
    var url = "rest/ships/" + gameId;
    return $.get(url, function(response) {
      loadedShips = response;
    });
  }

  var appendShips = function() {
    $.each(loadedShips, function(i, ship) {
      if (ship.name == ShipsType.Submarine) {
        // Creo al submarino, le cargo su vida y estado
        submarine = new Submarine(game, ShipsType.Submarine, ship.x, ship.y);
        submarine.el.health = ship.health;
        submarine.state = ship.state;

        if (ship.state == ShipStates.Destroyed) {
          submarine.el.kill();
        }
      }

      if (ship.name == ShipsType.Blue) {
        // Creo al azul, le cargo su vida y estado
        blue = new CargoBoat(game, ShipsType.Blue, ship.x, ship.y);
        blue.el.health = ship.health;
        blue.state = ship.state;

        if (ship.state == ShipStates.Destroyed || ship.state == ShipStates.Arrived) {
          blue.el.kill();
        }
      }

      if (ship.name == ShipsType.Green) {
        // Creo al verde, le cargo su vida y estado
        green = new CargoBoat(game, ShipsType.Green, ship.x, ship.y);
        green.el.health = ship.health;
        green.state = ship.state;

        if (ship.state == ShipStates.Destroyed || ship.state == ShipStates.Arrived) {
          green.el.kill();
        } 
      }
    }); 
  }

  var generateShips = function(players) {
    var deferred = $.Deferred();

    var ports = map.getLoadedPorts();
    var caribbean = map.getCaribbean();
    var x, y, mvd = {};

    var overlapsIsland = true;
    var islands = caribbean.islands;

    $.each(ports, function(i, port) {
      if (port.name == "mvd") {
        mvd.x = port.x;
        mvd.y = map.worldBounds.yBottomRight;
      }
    });

    blue = new CargoBoat(game, ShipsType.Blue, (mvd.x - 100), (mvd.y - 200));
    green = new CargoBoat(game, ShipsType.Green, (mvd.x - 300), (mvd.y - 200));

    x = getRandomInt(map.worldBounds.xTopLeft, map.worldBounds.xBottomRight);
    y = getRandomInt(caribbean.yTop + 72, caribbean.yBottom - 72);

    submarine = new Submarine(game, ShipsType.Submarine, x, y);

    saveShips(players).done(function() {
      deferred.resolve();
    });

    return deferred;
  }

  var init = function(_game) {
    game = _game;
    //appendShips(loadedShips);
  };

  var saveShips = function(players) {
    var getNicknameByRole = function (players, role) {
      var nickname;
      $.each(players, function(i, p) {
        if (p.role == role) {
          nickname = p.name;
        }
      });
      return nickname;
    }

    var ships = [
      { 
        name: ShipsType.Submarine, 
        x: Math.floor(submarine.el.x),  
        y: Math.floor(submarine.el.y),
        rotation: Math.floor(submarine.el.rotation),
        health: submarine.el.health,
        state: submarine.state,
        nickname: getNicknameByRole(players, ShipsType.Submarine)
      },
      {
        name: ShipsType.Blue, 
        x: Math.floor(blue.el.x),  
        y: Math.floor(blue.el.y),
        rotation: Math.floor(blue.el.rotation),
        health: blue.el.health,
        state: blue.state,
        nickname: getNicknameByRole(players, ShipsType.Blue)
      },
      {
        name: ShipsType.Green, 
        x: Math.floor(green.el.x),  
        y: Math.floor(green.el.y),
        rotation: Math.floor(green.el.rotation),
        health: green.el.health,
        state: green.state,
        nickname: getNicknameByRole(players, ShipsType.Green)
      }
    ];

    var deferred = $.Deferred();
    var url = "rest/ships/" + gameId;

    $.post(url, JSON.stringify(ships), function(response) {
      deferred.resolve(response);
    });

    return deferred;
  };

  var getSubmarine = function() {
    return submarine;
  };

  var getBlue = function() {
    return blue;
  };

  var getGreen = function() {
    return green;
  };

  var setGameId = function(id) { gameId = id; }

  return {
    init: init,
    getSubmarine: getSubmarine,
    getBlue: getBlue,
    getGreen: getGreen,
    saveShips: saveShips,
    generateShips: generateShips,
    getShips: getShips,
    appendShips: appendShips,
    setGameId: setGameId
  }
})();