var ge;
var currentTourKmlObject = null; 
var currentFetchedKmlObject = null; 
var currentTourIndex = -1;
var currentExtraKmlsObject = null;
var loadingOverlay = null;


var tourList = getTours();
var firstTime;
var instructionsOverlay;

//Variables barra de scroll

	var thumbOpacity = navHover = 70;
	var navOpacity=25;
	var scrollSpeed=5;
	var thumbs="slider";
	var left="slideleft";
	var right="slideright";
	var spacing=5;	

function $(i){
	return document.getElementById(i)
}

//getElementsByTagName devuelve una lista de todos los subelementos del elemnto actual que tienen un nombre determinado.
function $$(e,p){
	p = p||document;
	return p.getElementsByTagName(e)
}

function init() {
	
  var h = 0; //Variable que indica la altura del slider (menú con scroll de videos)
  firstTime = true;
  
  if (!checkTourHash()) {
    loadPlugin('earth', function() {
      if (loadingOverlay)
        loadingOverlay.setVisibility(false);
    });
  }
  
  //Botones de avance del slider 
  
  var u=$(this.left),r=$(this.right);
  u.onmouseover=new Function('scroll("'+thumbs+'",-1,'+scrollSpeed+')');
  u.onmouseout=r.onmouseout=new Function('cl("'+thumbs+'")');
  r.onmouseover=new Function('scroll("'+thumbs+'",1,'+scrollSpeed+')');
  
  // Generar la lista de selección del tour.
  var tourListNode = document.getElementById('slider');
  var numTours = tourList.length;
  
  for (var i = 0; i < numTours; i++) {
    
    // Crear el link al tour y su contenedor
    
    var thumbnailNode = document.createElement('IMG');
    thumbnailNode.src = tourList[i][2];
    thumbnailNode.id = 'tourind-' + i;
    
    thumbnailNode.onclick = (function(tourIndex) {
      return function(e) {
        document.location.hash = '#' + tourList[tourIndex][0];
        loadTour(tourIndex);
      };
    })(i);
    
    //Establecemos la opacidad de las minituras 
	thumbnailNode.style.opacity = thumbOpacity/100;
	thumbnailNode.style.filter ='alpha(opacity='+thumbOpacity+')';
	thumbnailNode.onmouseover=new Function('alpha.set(this,100,5)');
	thumbnailNode.onmouseout=new Function('alpha.set(this,'+ thumbOpacity+',5)');
    
    //si no hemos llegado al ultimo elemento del slider ...
	if(i!=numTours-1){
		//Añadimos un margen inferior a cada miniatura
		thumbnailNode.style.marginBottom =this.spacing+'px';
		//Sumamos al ancho total del slider el ancho de la separacion entre miniaturas
		h+=spacing;
	}
    
    tourListNode.appendChild(thumbnailNode);

	h+= 106; //Añadimos la altura de cada miniatura para calcular el tamaño total del slider
			
	tourListNode.style.height = h+'px';
   
  }



  // Watch the document location hash for changes.
  window.setInterval(checkTourHash, 100);
}

/**
 * Comprueba la ubicación del documento y carga el tour solicitado
 * en caso de que cambie el id.
 */
function checkTourHash() {
  var destID = document.location.hash.match(/(\w+)/);
  if (destID)
    destID = destID[1];

  if (destID && (currentTourIndex < 0 ||
                 destID != tourList[currentTourIndex].id)) {

    // Find the tour with this ID.
    var destTourIndex = -1;
    for (var i = 0; i < tourList.length; i++) {
      if (tourList[i].id == destID) {
        destTourIndex = i;
        break;
      }
    }

    // Select the tour and open it up.
    if (destTourIndex >= 0) {
      loadTour(destTourIndex);
      return true;
    }
  }

  return false;
}


function loadPlugin(mapType, callback) {
    google.earth.createInstance('map3d', function(pluginInstance) {
    ge = pluginInstance;
    ge.getWindow().setVisibility(true);
	
	ge.getLayerRoot().enableLayerById(ge.LAYER_BUILDINGS, true);
	
	if(firstTime){
	
	//Ventana inicial hecho con una imagen de Overlay  
  	
  	instructionsOverlay = ge.createScreenOverlay('');
    
    //No visualizamos el overlay mientras lo estamos definiendo
 	instructionsOverlay.setVisibility(false);
    
	//Le asignamos una imagen al overlay
    var icon = ge.createIcon('');
    icon.setHref('http://localhost/Ourense3D/images/ToursInfo.png');  
    instructionsOverlay.setIcon(icon);
    
    // Posicionamos el overlay
    var screenXY = instructionsOverlay.getScreenXY();
    screenXY.setXUnits(ge.UNITS_PIXELS);
    screenXY.setYUnits(ge.UNITS_PIXELS);
    screenXY.setX(0);
    screenXY.setY(0);
    
    var overlayXY = instructionsOverlay.getOverlayXY();
    overlayXY.setXUnits(ge.UNITS_PIXELS);
    overlayXY.setYUnits(ge.UNITS_PIXELS);
    overlayXY.setX(-1); //Debe ser -1, porque pinta el overlay desplazado 1px a la derecha. Fallo Google
    overlayXY.setY(0);
    
    var overlaySize = instructionsOverlay.getSize()
    overlaySize.setXUnits(ge.UNITS_FRACTION);
    overlaySize.setYUnits(ge.UNITS_FRACTION);
    overlaySize.setX(1);
    overlaySize.setY(1);
    
    instructionsOverlay.setVisibility(true);
    
    ge.getFeatures().appendChild(instructionsOverlay);
    firstTime = false;

	}

	//Creando el marco de la ventana Google Earth 
	
	var frameOverlay = ge.createScreenOverlay('');
	
 	frameOverlay.setVisibility(false);
    
    var icon = ge.createIcon('');
    icon.setHref('http://localhost/Ourense3D/images/frame.png');  
    frameOverlay.setIcon(icon);
    
    var screenXY = frameOverlay.getScreenXY();
    screenXY.setXUnits(ge.UNITS_PIXELS);
    screenXY.setYUnits(ge.UNITS_PIXELS);
    screenXY.setX(0);
    screenXY.setY(0);
    
    var overlayXY = frameOverlay.getOverlayXY();
    overlayXY.setXUnits(ge.UNITS_PIXELS);
    overlayXY.setYUnits(ge.UNITS_PIXELS);
    overlayXY.setX(-1); //Debe ser -1, porque pinta el overlay desplazado 1px a la derecha. Fallo Google
    overlayXY.setY(0);
    

    var overlaySize = frameOverlay.getSize()
    overlaySize.setXUnits(ge.UNITS_FRACTION);
    overlaySize.setYUnits(ge.UNITS_FRACTION);
    overlaySize.setX(1);
    overlaySize.setY(1);
    
    frameOverlay.setVisibility(true);
    
    ge.getFeatures().appendChild(frameOverlay);
    
    // Creamos el overlay de Loading...
    var loadingImage = ge.createIcon('');
    loadingImage.setHref('http://localhost/Rutas/images/loading.png');

    loadingOverlay = ge.createScreenOverlay('');
    loadingOverlay.setIcon(loadingImage);
    loadingOverlay.getOverlayXY().set(
        25, ge.UNITS_PIXELS, 25, ge.UNITS_INSET_PIXELS);
    loadingOverlay.getScreenXY().set(
        0, ge.UNITS_FRACTION, 1, ge.UNITS_FRACTION);
    loadingOverlay.getSize().set(-1, ge.UNITS_FRACTION, -1, ge.UNITS_FRACTION);
    ge.getFeatures().appendChild(loadingOverlay);2

    // Vista inicial al cargar la página
    var lookAt = ge.createLookAt('');
    lookAt.set(0.5, 0.5, 0, ge.ALTITUDE_RELATIVE_TO_GROUND,
        0, 0, 7000000);
    ge.getView().setAbstractView(lookAt);

    if (callback) {
      callback.call(null);
    }
  }, function(errorCode) {
    if (errorCode == 'ERR_NOT_INSTALLED' ||
        errorCode == 'ERR_CREATE_PLUGIN' && !google.earth.isInstalled()) {
      document.getElementById('tourlist_status').innerHTML =
          'To tour the world in your browser, you must first install the ' +
          'Google Earth Plugin by clicking the download link to the right.';
    } else {
      document.getElementById('tourlist_status').className = 'error';
      document.getElementById('tourlist_status').innerHTML =
          'There was an error loading the touring application.';
    }
  }, (mapType == 'mars' ?
         { database: 'http://khmdb.google.com/?db=mars' } : {}));
}


function loadTour(tourIndex) {

  if(instructionsOverlay.getVisibility()) instructionsOverlay.setVisibility(false);
  
  if (currentTourIndex == tourIndex)
    return;

  // Deselecciona el tour actual
  var oldTourIndex = currentTourIndex;
  if (currentTourIndex >= 0) {
    document.getElementById('tourind-' + oldTourIndex).className = '';
    currentTourIndex = -1;
  }

 
  var linkNode = document.getElementById('tourind-' + tourIndex);
  if (!linkNode)
    return;

  linkNode.className = 'selected';
  if ('linkNode' in linkNode)
    linkContainerNode.scrollIntoView(false);

  currentTourIndex = tourIndex;

 
    if (loadingOverlay)
      loadingOverlay.setVisibility(true);

    continueLoadTour_(null);
 
}

/**
 * Continuation function for loadTour()
 */
function continueLoadTour_() {
  // Detiene la reproducción del tour
  if (currentTourKmlObject) {
    ge.getTourPlayer().setTour(null);
  }

  // Carga el primer tour del KML
  var tourNumber = 1;
  var tourIndexAtFetch = currentTourIndex;

  google.earth.fetchKml(
    ge,
    tourList[currentTourIndex][1],
    function(kmlObject) {
      if (!kmlObject) {
         return;
      }

      // Si el usuario hace clic sobre otro tour, cancelamos la carga
	  // del actual.
      if (tourIndexAtFetch != currentTourIndex) {
        return;
      }

      if (currentFetchedKmlObject) {
        ge.getFeatures().removeChild(currentFetchedKmlObject);
        currentFetchedKmlObject = null;
      }

      currentFetchedKmlObject = kmlObject;
      ge.getFeatures().appendChild(currentFetchedKmlObject);

      // Recorremos el KML buscando un objeto <gx:Tour>.
      walkKmlDom(kmlObject, function(context) {
        if (this.getType() == 'KmlTour' && !--tourNumber) {
          ge.getTourPlayer().setTour(this);

          // Ocultar el overlay Loading...
          if (loadingOverlay)
            loadingOverlay.setVisibility(false);

          ge.getTourPlayer().play();

          currentTourKmlObject = this;
          return false;
        }
      });
      
      // Eliminar cualquier elemento extra, presente en el KML
	  // cargado
      if (currentExtraKmlsObject) {
        ge.getFeatures().removeChild(currentExtraKmlsObject);
        currentExtraKmlsObject = null;
      }
      
    }
  )
}


		
function scroll(e,d,s){

			//Recuperamos el objeto slider
			e=typeof e=='object'?e:$(e);
			
			var p=e.style.bottom||style.val(e,'bottom');
			
			e.style.bottom=p;
			
			//Si d es igual a uno asignamos a l la diferencia entre 
			var l= d==1? parseInt(e.offsetHeight) - parseInt(e.parentNode.offsetHeight)+3 :0;
			
			e.si=setInterval(function(){
					mv(e,l,d,s)},20)
			}

function mv(e,l,d,s){
							
				var c =parseInt(e.style.bottom);
				if(c==l){
					cl(e)
				}
				else{
					var i=Math.abs(l+c);
					i=i<s?i:s;
					var n=c+i*d;
					e.style.bottom=n+'px';
				}
			}

function cl(e){
				
				e=typeof e=='object'?e:$(e);
				clearInterval(e.si)
			}
	
  alpha=function(){
	
		return{
			set:function(e,a,s){
				e=typeof e=='object'?e:$(e);
				var o=e.style.opacity|| style.val(e,'opacity'),d=a>o*100?1:-1;
				e.style.opacity=o;
				clearInterval(e.ai);
				e.ai=setInterval(function(){
					alpha.tw(e,a,d,s)},20)},tw:function(e,a,d,s){
						var o=Math.round(e.style.opacity*100);
						if(o==a){
							clearInterval(e.ai)
						}
						else{
							var n=o+Math.ceil(Math.abs(a-o)/s)*d;
							e.style.opacity=n/100;
							e.style.filter='alpha(opacity='+n+')'
						}
					}
				}
			}();
			
   style=function(){
	
		return{
			val:function(e,p){
				e=typeof e=='object'?e:$(e);
				return e.currentStyle?e.currentStyle[p]:document.defaultView.getComputedStyle(e,null).getPropertyValue(p)
			}
		}
	}();



