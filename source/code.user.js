// ==UserScript==
// @name GEFS-Online Steering Addon (seperate rudder/nosewheel steering)
// @description This extension (by Qantas 94 Heavy) allows rudder to be used without steering the nosewheel significantly.
// @namespace GEFS-Plugins
// @match http://www.gefs-online.com/gefs.php*
// @match http://gefs-online.com/gefs.php*
// @run-at document-end
// @version 0.2.0
// @grant none
// ==/UserScript==

define('events/keydown',[],function () {
  var originalEventCleared = false;
  var originalHandler = controls.keyDown;
  
  function keyDown(event) {
    var activeHandlers = $(document).data('events').keydown;
    
    if (!originalEventCleared) {
      for (var i = 0; i < activeHandlers.length; ++i) {
        if (activeHandlers[i].handler === originalHandler) {
          $(document).off('keydown', originalHandler);
          originalEventCleared = true;
          break;
        }
      }
    }
    
    // jshint sub:true
    var keys = ges.preferences.keyboard.keys;
    switch (event.which) {
      case keys['Bank left'].keycode:
        controls.states.left = true;
        event.preventDefault ? event.preventDefault() : event.returnValue = false;
        controls.keyboard.override = true;
        return;
      case keys['Bank right'].keycode:
        controls.states.right = true;
        event.preventDefault ? event.preventDefault() : event.returnValue = false;
        controls.keyboard.override = true;
        return;
      case keys['Pitch down'].keycode:
        controls.states.up = true;
        event.preventDefault ? event.preventDefault() : event.returnValue = false;
        controls.keyboard.override = true;
        return;
      case keys['Pitch up'].keycode:
        controls.states.down = true;
        event.preventDefault ? event.preventDefault() : event.returnValue = false;
        controls.keyboard.override = true;
        return;
      case keys['Steer left'].keycode:
        controls.states.rudderLeft = true;
        event.preventDefault ? event.preventDefault() : event.returnValue = false;
        return;
      case keys['Steer right'].keycode:
        controls.states.rudderRight = true;
        event.preventDefault ? event.preventDefault() : event.returnValue = false;
        return;
      case keys['Increase throttle'].keycode:
      case keys.PgUp.keycode:
        controls.states.increaseThrottle = true;
        event.preventDefault ? event.preventDefault() : event.returnValue = false;
        return;
      case keys['Decrease throttle'].keycode:
      case keys.PgDwn.keycode:
        controls.states.decreaseThrottle = true;
        event.preventDefault ? event.preventDefault() : event.returnValue = false;
        return;
      case keys['Brakes'].keycode:
        controls.setters.setBrakes.set();
        return;
      case keys['Parking brake'].keycode:
        controls.setters.toggleParkingBrake.set();
        return;
      case keys['Engine switch (on/off)'].keycode:
        var aircraft = ges.aircraft;
        aircraft.engine.on ? aircraft.stopEngine() : aircraft.startEngine();
        return;
      case keys['Gear toggle (up/down)'].keycode:
        controls.setters.setGear.set();
        return;
      case keys['Lower flaps'].keycode:
        controls.setters.setFlapsDown.set();
        return;
      case keys['Raise flaps'].keycode:
        controls.setters.setFlapsUp.set();
        return;
      case keys['Airbrake toggle (on/off)'].keycode:
        controls.setters.setAirbrakes.set();
        return;
      case keys['Elevator trim up'].keycode:
        controls.setters.setElevatorTrimUp.set();
        return;
      case keys['Elevator trim down'].keycode:
        controls.setters.setElevatorTrimDown.set();
        return;
      case keys['Elevator trim neutral'].keycode:
        controls.setters.setElevatorTrimNeutral.set();
        return;
      case 13:
        controls.recenterKeyboard();
        return;
      case 27:
        if (flight.recorder.playing) {
          flight.recorder.exitPlayback();
          event.preventDefault();
        }
        return;
      case 86:
        flight.recorder.enterPlayback();
        return;
      case 65:
        controls.autopilot.toggle();
        return;
      case 83:
        audio.toggleMute();
        return;
      case 80:
        ges.togglePause();
        return;
      case 67:
        camera.cycle();
        return;
      case 78:
        ui.toggleMap();
        return;
      case 79:
        ges.togglePreferencesPanel();
        return;
      case 9:
        ges.flyToCamera();
        return;
      case 72:
        instruments.toggle();
        return;
      case 77:
        controls.setMode('mouse');
        return;
      case 75:
        controls.setMode('keyboard');
        return;
      case 74:
        controls.setMode('joystick');
        return;
      case 82:
        ges.resetFlight();
        return;
      case 101:
        camera.setToNeutral();
        return;
      case 97:
        camera.setRotation(45);
        return;
      case 98:
        camera.setRotation(0);
        return;
      case 99:
        camera.setRotation(-45);
        return;
      case 100:
        camera.setRotation(90);
        return;
      case 102:
        camera.setRotation(-90);
        return;
      case 103:
        camera.setRotation(135);
        return;
      case 104:
        camera.setRotation(180);
        return;
      case 105:
        camera.setRotation(-135);
        return;
      // nose wheel steering
      case 90:
        // Z
        controls.states.steerLeft = true;
        event.preventDefault ? event.preventDefault() : event.returnValue = false;
        return;
      case 88:
        // X
        controls.states.steerRight = true;
        event.preventDefault ? event.preventDefault() : event.returnValue = false;
        return;
      }
      if (event.which > 47 && event.which < 58) controls.throttle = (event.which - 48) / 9; // range 48-57
  }
  
  return keyDown;
});


define('events/keyup',[],function () {
  var originalEventCleared = false;
  var originalHandler = controls.keyUp;
  
  function keyUp(event) {
    var activeHandlers = $(document).data('events').keyup;
    
    if (!originalEventCleared) {
      for (var i = 0; i < activeHandlers.length; ++i) {
        if (activeHandlers[i].handler === originalHandler) {
          $(document).off('keyup', originalHandler);
          originalEventCleared = true;
          break;
        }
      }
    }
    
    // jshint sub:true
    // TODO: refactor function in a more modular way
    // FIXME: mozilla keycodes issue
    switch (event.which) {
      case ges.preferences.keyboard.keys['Bank left'].keycode:
        controls.states.left = false;
        event.preventDefault ? event.preventDefault() : event.returnValue = false;
        break;
      case ges.preferences.keyboard.keys['Bank right'].keycode:
        controls.states.right = false;
        event.preventDefault ? event.preventDefault() : event.returnValue = false;
        break;
      case ges.preferences.keyboard.keys['Pitch down'].keycode:
        controls.states.up = false;
        event.preventDefault ? event.preventDefault() : event.returnValue = false;
        break;
      case ges.preferences.keyboard.keys['Pitch up'].keycode:
        controls.states.down = false;
        event.preventDefault ? event.preventDefault() : event.returnValue = false;
        break;
      case ges.preferences.keyboard.keys['Steer left'].keycode:
        controls.states.rudderLeft = false;
        event.preventDefault ? event.preventDefault() : event.returnValue = false;
        break;
      case ges.preferences.keyboard.keys['Steer right'].keycode:
        controls.states.rudderRight = false;
        event.preventDefault ? event.preventDefault() : event.returnValue = false;
        break;
      case ges.preferences.keyboard.keys['Increase throttle'].keycode:
      case ges.preferences.keyboard.keys.PgUp.keycode:
        controls.states.increaseThrottle = false;
        event.preventDefault ? event.preventDefault() : event.returnValue = false;
        break;
      case ges.preferences.keyboard.keys['Decrease throttle'].keycode:
      case ges.preferences.keyboard.keys.PgDwn.keycode:
        controls.states.decreaseThrottle = false;
        event.preventDefault ? event.preventDefault() : event.returnValue = false;
        break;
      case ges.preferences.keyboard.keys['Elevator trim up'].keycode:
        controls.setters.setElevatorTrimUp.unset();
        break;
      case ges.preferences.keyboard.keys['Elevator trim down'].keycode:
        controls.setters.setElevatorTrimDown.unset();
        break;
      case ges.preferences.keyboard.keys.Brakes.keycode:
        controls.setters.setBrakes.unset();
        break;
      case 84:
        ui.openChat();
        break;
      // nose wheel steering add-on
      case 90:
        // Z
        controls.states.steerLeft = false;
        event.preventDefault ? event.preventDefault() : event.returnValue = false;
        break;
      case 88:
        // X
        controls.states.steerRight = false;
        event.preventDefault ? event.preventDefault() : event.returnValue = false;
        break;
    }
  }
  
  return keyUp;
});



define('nosewheelsteering',[],function () {
  function noseWheelSteering(aircraftName) {
    var ratio;
    function set(noseWheel, tillerNoseAngle, rudderNoseAngle, lockoutSpeed) {
      return function () {
        var anim = ges.aircraft.wheels[noseWheel].animations[0];
        anim.value = 'steeringAngle';
        anim.ratio = tillerNoseAngle;
        ratio = rudderNoseAngle / tillerNoseAngle;
      };
    }
    var aircrafts = {
      a380: set(4, 75, 7),
      md11: set(3, 70, 10),
      cessna: set(2, 30, 8.5),
      AN140: set(2, 45, 5),
      concorde: set(2, 60, 10),
      su35: set(4, 45, 5),
      dc3: set(0, -45, -3),
      alphajet: set(2, 35, 5),
      zlin: set(2, -30, -2),
      sportstar: set(2, 15, 0),
      // Boeing 777-300ER
      67: set(2, 70, 7)
    };

    (aircrafts[aircraftName] || function () {
      ratio = 1;
    })();
    controls.nwAngle = 0;
    controls.updateKeyboardGeneral = function (dt) {
      var throttleIncrement = controls.keyboard.throttleIncrement * dt;
      if (controls.states.increaseThrottle) controls.throttle += throttleIncrement;
      else if (controls.states.decreaseThrottle) controls.throttle -= throttleIncrement;
      
      var sensitivity = ges.preferences.keyboard.sensitivity * ges.aircraft.controllers.yaw.sensitivity;
      var yawIncrement = controls.keyboard.yawIncrement * dt * sensitivity * ges.aircraft.controllers.yaw.ratio;
      
      var notSteering = false;
      if (controls.states.steerLeft) controls.nwAngle = clamp(controls.nwAngle - yawIncrement, -1, 1);
      else if (controls.states.steerRight) controls.nwAngle = clamp(controls.nwAngle + yawIncrement, -1, 1);
      else notSteering = true;
      
      if (controls.states.rudderLeft) {
        controls.yaw -= yawIncrement;
        
        if (notSteering) {
          // let nose wheel recentre if nose position beyond max rudder steering
          if (Math.abs(controls.nwAngle) < ratio)
            controls.nwAngle = clamp(controls.nwAngle - yawIncrement * ratio, -ratio, ratio);
          else
            controls.nwAngle -= controls.nwAngle * controls.keyboard.recenterRatio * sensitivity;
        }
      } else if (controls.states.rudderRight) {
        controls.yaw += yawIncrement;
        
        if (notSteering) {
          // let nose wheel recentre if nose position beyond max rudder steering
          if (Math.abs(controls.nwAngle) < ratio)
            controls.nwAngle = clamp(controls.nwAngle + yawIncrement * ratio, -ratio, ratio);
          else
            controls.nwAngle -= controls.nwAngle * controls.keyboard.recenterRatio * sensitivity;
        }
      } else if (ges.aircraft.controllers.yaw.recenter) {
        controls.yaw -= controls.yaw * controls.keyboard.recenterRatio * sensitivity;
        if (notSteering)
          controls.nwAngle -= controls.nwAngle * controls.keyboard.recenterRatio * sensitivity;  // recentre nosewheel if no other nosewheel input
      }
      ges.aircraft.animationValue.steeringAngle = controls.nwAngle;
    };
  }

  return noseWheelSteering;
});




require(['events/keydown', 'events/keyup', 'nosewheelsteering'], function (keyDown, keyUp, noseWheelSteering) {
  $(document).keydown(keyDown).keyup(keyUp);
      
  /* global Aircraft */
  var load = Aircraft.prototype.load;
  Aircraft.prototype.load = function (aircraftName) {
    // allow us to keep track of whether the function has loaded new aircraft yet (async) 
    var oldkmlObjects = ges.aircraft.kmlObjects;

    // call original aircraft load function
    load.apply(this, arguments);

    var timer = setInterval(function () {
      // kmlObjects has been replaced, i.e. ges.aircraft.load has completed
      if (ges.aircraft.kmlObjects !== oldkmlObjects) {
        noseWheelSteering(aircraftName);
        clearInterval(timer);
      }
    }, 16);
  };
});

define("main", function(){});

