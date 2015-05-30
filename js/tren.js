window.truck = null;

// URL donde está el modelo del objeto móvil
var MODEL_URL = 'http://localhost/Ourense3D/models/trenTermas.kmz';  

var TICK_MS = 66;
var STEER_ROLL = -1.0;
var ROLL_SPRING = 0.5;
var ROLL_DAMP = -0.16;
var firstClick = true;


function Truck() 
{
  
  var me = this;

  me.doTick = true;
  
  /*
  	El punto Anchor o "ancla " es el punto donde está situada la cámara.
    Todos los movimientos que hacemos son relativos a dicho punto.
    Almacenamos su posición con formato "latitud,longitud,altitud" y en coordenadas cartesianas
    In this frame, the x axis points
  // east, the y axis points north, and the z axis points straight up
  // towards the sky.
  //
  */
  
  me.localAnchorLla = [0, 0, 0];
  me.localAnchorCartesian = V3.latLonAltToCartesian(me.localAnchorLla);
  me.localFrame = M33.identity();

  // Position, in local cartesian coords.
  me.pos = [0, 0, 0];
  
  // Velocity, in local cartesian coords.
  me.vel = [0, 0, 0];

  // Orientation matrix, transforming model-relative coords into local
  // coords.
  me.modelFrame = M33.identity();

  me.roll = 0;
  me.rollSpeed = 0;
  
  me.idleTimer = 0;
  me.fastTimer = 0;
  me.popupTimer = 0;

  ge.getOptions().setMouseNavigationEnabled(false);
  ge.getOptions().setFlyToSpeed(100);  // don't filter camera motion


  window.google.earth.fetchKml(ge, MODEL_URL,function(obj) { me.finishInit(obj); });
}

Truck.prototype.finishInit = function(kml) {
  var me = this;

  // The model zip file is actually a kmz, containing a KmlFolder with
  // a camera KmlPlacemark (we don't care) and a model KmlPlacemark
  // (our milktruck).
  me.placemark = kml.getFeatures().getChildNodes().item(1);
  me.model = me.placemark.getGeometry();
  me.orientation = me.model.getOrientation();
  me.location = me.model.getLocation();

  me.model.setAltitudeMode(ge.ALTITUDE_ABSOLUTE);
  me.orientation.setHeading(0);
  me.model.setOrientation(me.orientation);
  me.model.getScale().set(3.5,3.5,3.5);
  ge.getFeatures().appendChild(me.placemark);

  //teleportTo (latitud, longitud, altitud)
  me.teleportTo(42.33581565848903, -7.8637270128801, 90);  // Punto donde se muestra el móvil al cargar la ventana Google Earth inicialmente
  
  me.lastMillis = (new Date()).getTime();//captura el instante inicial

  //creamos la sombra del móvil. Será un ground overlay
  var href = window.location.href;
  var pagePath = href.substring(0, href.lastIndexOf('/')) + '/';

 
  me.shadow = ge.createGroundOverlay('');
  me.shadow.setDrawOrder(60);
  me.shadow.setVisibility(false);//Como no le tenemos una imagen asignada en el momento de creación no nos interesa mostrarla
  me.shadow.setIcon(ge.createIcon(''));
  me.shadow.setLatLonBox(ge.createLatLonBox(''));
  me.shadow.setAltitudeMode(ge.ALTITUDE_RELATIVE_TO_GROUND);
  me.shadow.getIcon().setHref('http://localhost/Ourense3D/images/sombra.png');

  me.shadow.setVisibility(true);
  ge.getFeatures().appendChild(me.shadow);
  
 

  google.earth.addEventListener(ge, "frameend", function() { me.tick(); });

  me.cameraCut();//ivan: en principio aquí no hace falta ya que se ha hecho ya una llamada a cameraCut dentro de la función teleportTo
  				 //Básicamente es la función encargada de hacer el efecto de caida del camión al cargar la ventana.2
}

//Variables para controlar la interacción con el teclado
var leftButtonDown = false;
var rightButtonDown = false;
var gasButtonDown = false;
var reverseButtonDown = false;
var spaceButtonDown = false
var fueraLimites = false;

var reboteFrontal = false;
var reboteCulo = false;


var enMov = true;


var lastGasButton = false;
var lastReverseButton = false;
var closeView = false;

//Metodos para controlar la interacción con el teclado
function keyDown(event) 
{
  if (!event) {
    event = window.event;
  }
  if (event.keyCode == 37) {  // Left.
    leftButtonDown = true;
    event.returnValue = false;
  } else if (event.keyCode == 39) {  // Right.
    rightButtonDown = true;
    event.returnValue = false;
  } else if (event.keyCode == 38 && !fueraLimites) {  // Up.
    gasButtonDown = true;
    lastReverseButton = false;
    lastGasButton = true;
	reboteFrontal = false;
    reboteCulo = false;
    if(firstClick)firstClick = false;
    event.returnValue = false;
  } else if (event.keyCode == 40 && !fueraLimites) {  // Down.
    reverseButtonDown = true;
    lastGasButton = false;
    lastReverseButton = true;
	reboteFrontal = false;
    reboteCulo = false;
    if(firstClick)firstClick = false;
    event.returnValue = false;
  }else if (event.keyCode == 32) {  //Barra espaciadora.
	spaceButtonDown = true;
	if (closeView == true ) closeView = false;
	else if (closeView == false) closeView = true;
	event.returnValue = false;
  
 
  
  }else {
    return true;
  }
  return false;
}


function keyUp(event) 
{
  if (!event) {
    event = window.event;
  }
  if (event.keyCode == 37) {  // Left.
    leftButtonDown = false;
    event.returnValue = false;
  } else if (event.keyCode == 39) {  // Right.
    rightButtonDown = false;
    event.returnValue = false;
  } else if (event.keyCode == 38) {  // Up.
    gasButtonDown = false;
    event.returnValue = false;
  } else if (event.keyCode == 40) {  // Down.
    reverseButtonDown = false;
    event.returnValue = false;
  }else if (event.keyCode == 32){ //Barra Espaciadora
	spaceButtonDown = false;
	event.returnValue = false;
  }
  
  return false;
}

/*
Función que ajusta un valor a uno de dos valores extremos dependiendo de si es menor que el extremo inferior 
o mayor que es extremo superior
*/

function clamp(val, min, max) 
{
  if (val < min) 
  {
    return min;
  } 
  else if (val > max)
   {
    return max;
   }
  
  return val;
}

/* 
 Quizás la función más importante
 
 - IMPORTANTE: prototype en Javascript
 Todo constructor en Javascript tiene una propiedad llamada prototype, que permite añadir propiedades y métodos a todos los objetos 
 que han sido creados de una misma clase y a todos los que se creen después
 
 */
 


//ivan: quizás es la función que controla la acción que se lleva a cabo cada vez que pulsamos una tecla del teclado
Truck.prototype.tick = function(){
	
	var CAM_HEIGTH;
 	var CAM_DIST;
 	var tilt;
 	var range;
	
	var me = this;
	//me.placemark = kml.getFeatures().getChildNodes().item(1);
  	//me.model = me.placemark.getGeometry();
 
	
	//Se calcula el tiempo que ha pasado desde el ultimo tick
	var now = (new Date()).getTime();
	//dt es la variación de tiempo entre el instante actual y el instante en que se hizo tick por ultima vez
	var dt = (now - me.lastMillis) / 1000.0;
	if (dt > 0.25) {
		dt = 0.25;
	}
	me.lastMillis = now;
	
	
	
	var c0 = 1;
	var c1 = 0;
	
	var gpos = V3.add(me.localAnchorCartesian, M33.transform(me.localFrame, me.pos));
	var lla = V3.cartesianToLatLonAlt(gpos);
	
	//Ivan: para restringir el área nevagable por el móvil.
	
	
	
	
	if (V3.length([me.pos[0], me.pos[1], 0]) > 100) {
		// Re-anchor our local coordinate frame whenever we've strayed a
		// bit away from it.  This is necessary because the earth is not
		// flat!
		me.adjustAnchor();
	}
	
	var dir = me.modelFrame[1];
	var up = me.modelFrame[2];
	
	var absSpeed = V3.length(me.vel);
	
	var groundAlt = ge.getGlobe().getGroundAltitude(lla[0], lla[1]);
	var airborne = (groundAlt + 0.30 < me.pos[2]);
	var steerAngle = 0;
	
	// Steering.
	
	
	
	if (leftButtonDown || rightButtonDown) {
		var TURN_SPEED_MIN = 60.0; // radians/sec //Velocidad de giro minima
		var TURN_SPEED_MAX = 100.0; // radians/sec //Velocidad de giro maxima
		var turnSpeed;
		
		// Degrade turning at higher speeds.
		//
		//           angular turn speed vs. vehicle speed
		//    |     -------
		//    |    /       \-------
		//    |   /                 \-------
		//    |--/                           \---------------
		//    |
		//    +-----+-------------------------+-------------- speed
		//    0    SPEED_MAX_TURN           SPEED_MIN_TURN
		var SPEED_MAX_TURN = 25.0;
		var SPEED_MIN_TURN = 120.0;
		if (absSpeed < SPEED_MAX_TURN) {
			turnSpeed = TURN_SPEED_MIN +
			(TURN_SPEED_MAX - TURN_SPEED_MIN) *
			(SPEED_MAX_TURN - absSpeed) /
			SPEED_MAX_TURN;
			turnSpeed *= (absSpeed / SPEED_MAX_TURN); // Less turn as truck slows
		}
		else 
			if (absSpeed < SPEED_MIN_TURN) {
				turnSpeed = TURN_SPEED_MIN +
				(TURN_SPEED_MAX - TURN_SPEED_MIN) *
				(SPEED_MIN_TURN - absSpeed) /
				(SPEED_MIN_TURN - SPEED_MAX_TURN);
			}
			else {
				turnSpeed = TURN_SPEED_MIN;
			}
		
		//Ivan: Aquí es donde se controla el giro
		if ((leftButtonDown && lastGasButton) || (rightButtonDown && lastReverseButton)) {
			steerAngle = turnSpeed * dt * Math.PI / 180.0;
		}
		if ((rightButtonDown && lastGasButton) || (leftButtonDown && lastReverseButton)) {
			steerAngle = -turnSpeed * dt * Math.PI / 180.0;
		}
	}
	
	// Turn.
	var newdir = airborne ? dir : V3.rotate(dir, up, steerAngle);
	me.modelFrame = M33.makeOrthonormalFrame(newdir, up);
	dir = me.modelFrame[1];
	up = me.modelFrame[2];
	
	var forwardSpeed = 0;
	
	if (!airborne) {

		// I'm using a damped exponential filter here, like:
		// val = val * c0 + val_new * (1 - c0)
		//
		// For a variable time step:
		//  c0 = exp(-dt / TIME_CONSTANT)
		var right = me.modelFrame[0];
		var slip = V3.dot(me.vel, right);
		c0 = Math.exp(-dt / 0.5);
		me.vel = V3.sub(me.vel, V3.scale(right, slip * (1 - c0)));
		
		// Apply engine/reverse accelerations.
		var ACCEL = 30.0;                            //Aceleración
		var DECEL = 35.0;                            //Deceleración
		var MAX_REVERSE_SPEED = 60.0;                //Velocidad máxima marcha atrás
		var MAX_SPEED = 70.0;                //Velocidad máxima
		forwardSpeed = V3.dot(dir, me.vel);
		
		//Ivan: Aquí es donde se controla el movimiento hacia adelante y hacia atrás
		 
		var lookAt = ge.getView().copyAsLookAt(ge.ALTITUDE_RELATIVE_TO_GROUND);

  	    var auxAlt = lookAt.getAltitude();
		
	
		
		if(!fueraLimites)
		
		{

		if (gasButtonDown) {
		
			if (forwardSpeed < MAX_SPEED)
					me.vel = V3.add(me.vel, V3.scale(dir, ACCEL * dt));
		}
	
		else 
			if (reverseButtonDown) {
				
					if (forwardSpeed > -MAX_REVERSE_SPEED)
						me.vel = V3.add(me.vel, V3.scale(dir, -DECEL * dt));
			}
		}
		
		else if (fueraLimites)
		{
				
				me.vel = [0,0,0];
		
				if (gasButtonDown || /*(lastGasButton && !reboteFrontal)*/lastGasButton ) {
					me.vel = V3.add(me.vel, V3.scale(dir, -2000 * dt));
					//window.setTimeout("reboteFrontal = true",1000);
					window.setTimeout("lastGasButton = false; lastReverseButton = true;",1000);
				
					
				
					
				}
				
				else 
			
				if (reverseButtonDown || /*(lastReverseButton && !reboteCulo)*/ lastReverseButton) {
					me.vel = V3.add(me.vel, V3.scale(dir, 2000 * dt));
					//window.setTimeout("reboteFrontal = false",1000);
					window.setTimeout("lastReverseButton = false; lastGasButton = true;",1000);
				
				}
				
				//else if (reboteFrontal && lastGasButton){me.vel = V3.add(me.vel, V3.scale(dir, 300 * dt));}
				
				//else if (reboteCulo && lastReverseButton) { me.vel = V3.add(me.vel, V3.scale(dir, -300 * dt));}
				

		
		
		}
	   /*Ivan: hacer que se pare cuando levantamos el pie del acelerador*/
	   /*else if (!gasButtonDown && !gasButtonDown && !leftButtonDown && !rightButtonDown/*auxAlt < 60*//*) me.vel = [0,0,0]; */
	}
	
	//Resistencia del aire
	

	
	
	
	
	if (absSpeed > 0.01) {
		var veldir = V3.normalize(me.vel);
		var DRAG_FACTOR = 0.00090;
		var drag = absSpeed * absSpeed * DRAG_FACTOR;
		
		// Some extra constant drag (rolling resistance etc) to make sure
		// we eventually come to a stop.
		var CONSTANT_DRAG = 2.0;
		drag += CONSTANT_DRAG;
		
		if (drag > absSpeed) {
			drag = absSpeed;
		}
		
		me.vel = V3.sub(me.vel, V3.scale(veldir, drag * dt));
	}
	
	
	
	
	// Gravity
	me.vel[2] -= 9.8 * dt;
	
	// Move.
	var deltaPos = V3.scale(me.vel, dt);
	var posAnt = me.pos;
	
	me.pos = V3.add(me.pos, deltaPos);
	
	gpos = V3.add(me.localAnchorCartesian, M33.transform(me.localFrame, me.pos));
	lla = V3.cartesianToLatLonAlt(gpos);
	
	// Don't go underground.
	groundAlt = ge.getGlobe().getGroundAltitude(lla[0], lla[1]);
	if (me.pos[2] < groundAlt) {
		me.pos[2] = groundAlt;
	}
	
	var latitud = lla[0];
	var longitud = lla[1];
	
	var LatitudMax = 42.33939215651837; 
	var LatitudMin = 42.3350588898284;
	var LongitudMax = -7.861983687505251;
	var LongitudMin = -7.864782338721206;
	
	//Controlamos que no se salga de unos límites y paramos el tren
	
	/*if(latitud <= LatitudMin || latitud >= LatitudMax 
				   || longitud >= LongitudMax || longitud <= LongitudMin)
	{
	
	me.pos = posAnt;
	
	gpos = V3.add(me.localAnchorCartesian, M33.transform(me.localFrame, me.pos));
	lla = V3.cartesianToLatLonAlt(gpos);
	
	// Don't go underground.
	groundAlt = ge.getGlobe().getGroundAltitude(lla[0], lla[1]);
	if (me.pos[2] < groundAlt) {
		me.pos[2] = groundAlt;
	}
	
	}*/
	
	if(latitud <= LatitudMin || latitud >= LatitudMax 
				   || longitud >= LongitudMax || longitud <= LongitudMin)
	{
	
	fueraLimites = true;
	
	}
	else
	{
	fueraLimites = false;
	
	}
	
	
	var normal = estimateGroundNormal(gpos, me.localFrame);
	
	if (!airborne) {
		// Cancel velocity into the ground.
		//
		// TODO: would be fun to add a springy suspension here so
		// the truck bobs & bounces a little.
		var speedOutOfGround = V3.dot(normal, me.vel);
		if (speedOutOfGround < 0) {
			me.vel = V3.add(me.vel, V3.scale(normal, -speedOutOfGround));
		}
		
		// Make our orientation follow the ground.
		c0 = Math.exp(-dt / 0.25);
		c1 = 1 - c0;
		var blendedUp = V3.normalize(V3.add(V3.scale(up, c0), V3.scale(normal, c1)));
		me.modelFrame = M33.makeOrthonormalFrame(dir, blendedUp);
	}
	
	// Propagate our state into Earth.
	gpos = V3.add(me.localAnchorCartesian, M33.transform(me.localFrame, me.pos));
	lla = V3.cartesianToLatLonAlt(gpos);
	
	me.model.getLocation().setLatLngAlt(lla[0], lla[1], lla[2]); 

	
	var newhtr = M33.localOrientationMatrixToHeadingTiltRoll(me.modelFrame);
	
	// Compute roll according to steering.
	// TODO: this would be even more cool in 3d.
	var absRoll = newhtr[2];
	me.rollSpeed += steerAngle * forwardSpeed * STEER_ROLL;
	// Spring back to center, with damping.
	me.rollSpeed += (ROLL_SPRING * -me.roll + ROLL_DAMP * me.rollSpeed);
	me.roll += me.rollSpeed * dt;
	me.roll = clamp(me.roll, -30, 30);
	absRoll += me.roll;
	
	me.orientation.set(newhtr[0], newhtr[1], absRoll);
	
	var latLonBox = me.shadow.getLatLonBox();
	var radius = .00011;
	latLonBox.setNorth(lla[0] - radius);
	latLonBox.setSouth(lla[0] + radius);
	latLonBox.setEast(lla[1] - radius);
	latLonBox.setWest(lla[1] + radius);
	latLonBox.setRotation(-newhtr[0]);
	
	//me.tickPopups(dt);
	
	//ivan: Intento 1 de hacer zoom cuando soltamos los botones del cursor
	/*if( !gasButtonDown  && !reverseButtonDown && !leftButtonDown && !rightButtonDown && !firstClick )
	{
	
		CAM_HEIGTH = 10; //10
		CAM_DIST = 30;   //30
		tilt = 90;       //80
		range = 0;       //0
		me.model.getScale().set(1.5,1.5,1.5);
		ge.getOptions().setFlyToSpeed(4.5);

	
	}
	else if (!firstClick || firstClick) {
	
		if(forwardSpeed > 45){
			ge.getOptions().setFlyToSpeed(100);
			
		}
		
		CAM_HEIGTH = 60;  //60
		CAM_DIST = 60;    //60
		tilt = 60;        //60
		range = 40;       //40
		me.model.getScale().set(3.5,3.5,3.5);
	}*/
	
	if(closeView)
	{
	
		/*Ivan: hacer ke el movil se pare*/
		me.vel = [0,0,0];
		
		
		CAM_HEIGTH = 10; //10
		CAM_DIST = 30;   //30
		tilt = 90;       //80
		range = 0;       //0
		me.model.getScale().set(1.5,1.5,1.5);
		radius = .00004;
		latLonBox.setNorth(lla[0] - radius);
		latLonBox.setSouth(lla[0] + radius);
		latLonBox.setEast(lla[1] - radius);
		latLonBox.setWest(lla[1] + radius);
		latLonBox.setRotation(-newhtr[0]);
		ge.getOptions().setFlyToSpeed(4.5);
		
		enMov = false;

	
	}
	else if (!closeView) {
	
		if(forwardSpeed > 25 || forwardSpeed < -20){
			ge.getOptions().setFlyToSpeed(100);
			
			
		}
		if (enMov == false )
		{
				me.model.getScale().set(3.5,3.5,3.5);
				enMov = true;

		}
		
				
		//me.model.getScale().set(3.5,3.5,3.5);
		CAM_HEIGTH = 60;  //60
		CAM_DIST = 60;    //60
		tilt = 60;        //60
		range = 40;       //40
		
		
		
		
	}
	
	me.cameraFollow(dt, gpos, me.localFrame,CAM_DIST,CAM_HEIGTH,tilt,range);
	
	// Hack to work around focus bug
	// TODO: fix that bug and remove this hack.
	ge.getWindow().blur();
	

};


// TODO: would be nice to have globe.getGroundNormal() in the API.
function estimateGroundNormal(pos, frame) {
  // Take four height samples around the given position, and use it to
  // estimate the ground normal at that position.
  //  (North)
  //     0
  //     *
  //  2* + *3
  //     *
  //     1
  var pos0 = V3.add(pos, frame[0]);
  var pos1 = V3.sub(pos, frame[0]);
  var pos2 = V3.add(pos, frame[1]);
  var pos3 = V3.sub(pos, frame[1]);
  var globe = ge.getGlobe();
  function getAlt(p) {
    var lla = V3.cartesianToLatLonAlt(p);
    return globe.getGroundAltitude(lla[0], lla[1]);
  }
  var dx = getAlt(pos1) - getAlt(pos0);
  var dy = getAlt(pos3) - getAlt(pos2);
  var normal = V3.normalize([dx, dy, 2]);
  return normal;
}


Truck.prototype.scheduleTick = function() {
  var me = this;
  if (me.doTick) {
    setTimeout(function() { me.tick(); }, TICK_MS);
  }
};

// Cut the camera to look at me.
Truck.prototype.cameraCut = function() 
{
  var me = this;
  var lo = me.model.getLocation();
  var la = ge.createLookAt('');
  la.set(lo.getLatitude(), lo.getLongitude(),
         10 /* altitude */,
         ge.ALTITUDE_RELATIVE_TO_SEA_FLOOR,
         fixAngle(180 + me.model.getOrientation().getHeading() + 45),
         80, /* tilt */
         50 /* range */         
         );
  ge.getView().setAbstractView(la);
};

Truck.prototype.cameraFollow = function(dt, truckPos, localToGlobalFrame, TRAILING_DISTANCE, CAM_HEIGHT, tilt, range ) {
  var me = this;

  var c0 = Math.exp(-dt / 0.5);
  var c1 = 1 - c0;

  var la = ge.getView().copyAsLookAt(ge.ALTITUDE_RELATIVE_TO_SEA_FLOOR);

  var truckHeading = me.model.getOrientation().getHeading();
  var camHeading = la.getHeading();

  var deltaHeading = fixAngle(truckHeading - camHeading);
  var heading = camHeading + c1 * deltaHeading;
  heading = fixAngle(heading);

  //var TRAILING_DISTANCE = 60; //Ivan: distancia de la cámara al vehículo 
  var headingRadians = heading / 180 * Math.PI;
  
  //var CAM_HEIGHT = 60; //Altura de la cámara

  var headingDir = V3.rotate(localToGlobalFrame[1], localToGlobalFrame[2],
                             -headingRadians);
  var camPos = V3.add(truckPos, V3.scale(localToGlobalFrame[2], CAM_HEIGHT));
  camPos = V3.add(camPos, V3.scale(headingDir, -TRAILING_DISTANCE));
  var camLla = V3.cartesianToLatLonAlt(camPos);
  var camLat = camLla[0];
  var camLon = camLla[1];
  var camAlt = camLla[2] - ge.getGlobe().getGroundAltitude(camLat, camLon);

  la.set(camLat, camLon, camAlt, ge.ALTITUDE_RELATIVE_TO_SEA_FLOOR, 
        heading,  tilt, range);
  ge.getView().setAbstractView(la);

  
};

// heading is optional.
Truck.prototype.teleportTo = function(lat, lon, heading) {
  var me = this;
  me.model.getLocation().setLatitude(lat);
  me.model.getLocation().setLongitude(lon);
  me.model.getLocation().setAltitude(ge.getGlobe().getGroundAltitude(lat, lon));
  if (heading == null) {
    heading = 0;
  }
  me.vel = [0, 0, 0];

  me.localAnchorLla = [lat, lon, 0];
  me.localAnchorCartesian = V3.latLonAltToCartesian(me.localAnchorLla);
  me.localFrame = M33.makeLocalToGlobalFrame(me.localAnchorLla);
  me.modelFrame = M33.identity();
  me.modelFrame[0] = V3.rotate(me.modelFrame[0], me.modelFrame[2], -heading);
  me.modelFrame[1] = V3.rotate(me.modelFrame[1], me.modelFrame[2], -heading);
  me.pos = [0, 0, ge.getGlobe().getGroundAltitude(lat, lon)];

  me.cameraCut();
};

// Move our anchor closer to our current position.  Retain our global
// motion state (position, orientation, velocity).
Truck.prototype.adjustAnchor = function() {
  var me = this;
  var oldLocalFrame = me.localFrame;

  var globalPos = V3.add(me.localAnchorCartesian,M33.transform(oldLocalFrame, me.pos));
  var newAnchorLla = V3.cartesianToLatLonAlt(globalPos);
  newAnchorLla[2] = 0;  // For convenience, anchor always has 0 altitude.

  var newAnchorCartesian = V3.latLonAltToCartesian(newAnchorLla);
  var newLocalFrame = M33.makeLocalToGlobalFrame(newAnchorLla);

  var oldFrameToNewFrame = M33.transpose(newLocalFrame);
  oldFrameToNewFrame = M33.multiply(oldFrameToNewFrame, oldLocalFrame);

  var newVelocity = M33.transform(oldFrameToNewFrame, me.vel);
  var newModelFrame = M33.multiply(oldFrameToNewFrame, me.modelFrame);
  var newPosition = M33.transformByTranspose(
      newLocalFrame,
      V3.sub(globalPos, newAnchorCartesian));

  me.localAnchorLla = newAnchorLla;
  me.localAnchorCartesian = newAnchorCartesian;
  me.localFrame = newLocalFrame;
  me.modelFrame = newModelFrame;
  me.pos = newPosition;
  me.vel = newVelocity;
}

// Mantiene el valor del ángulo entre -180º y 180º
function fixAngle(a) 
{
  while (a < -180) 
    a += 360;
  
  while (a > 180) 
    a -= 360;
  
  return a;
}
