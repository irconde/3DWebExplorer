var TINY={};

var puntos;


/*
 *@description: método que controla el "switcheo" entre pestañas y su contenido correspondiente.
 *@param tab: entero. Es el identificador de la pestaña.
 *
 */
 
var pestanaActual = null;  
 
function showTab(tab)
{
	if(pestanaActual != tab){
	
		var pestañas = $('toc');
		var listaPes = $$('li',pestañas);
		var i = 0;
		var tipoPes = listaPes[i].className;
	    	    
		while(tipoPes != "activa"){
	   		i++;
	   		tipoPes = listaPes[i].className;
		}
	    	    
		listaPes[i].className = "noActiva";
		listaPes[tab].className = "activa";
			    
		var slideshow = new TINY.slideshow();
		slideshow.empty();
		slideshow.fill(tab);
		pestanaActual = tab;
	}
	    	    
}

function $(i){
	return document.getElementById(i)
}

//getElementsByTagName devuelve una lista de todos los subelementos del elemnto actual que tienen un nombre determinado.
function $$(e,p){
	p = p||document;
	return p.getElementsByTagName(e)
}

TINY.slideshow=function( ){

	this.thumbOpacity=this.navHover=70;
	this.navOpacity=25;
	this.scrollSpeed=5;
	this.thumbs="slider";
	this.left="slideleft";
	this.right="slideright";
	this.spacing=5;	

};


TINY.slideshow.prototype={

	
	fill:function(tipo){
		
		
	
	var w=0;
	var l;	//l = numero de elementos almacenados en la barra
	var img;
	
	
	puntos = getDatosPuntos(tipo);
	l = puntos.length;
		
		if(this.thumbs){
			//u = slideleft
			//r = slideright
			var u=$(this.left),r=$(this.right);
			u.onmouseover=new Function('TINY.scroll.init("'+this.thumbs+'",-1,'+this.scrollSpeed+')');
			u.onmouseout=r.onmouseout=new Function('TINY.scroll.cl("'+this.thumbs+'")');
			r.onmouseover=new Function('TINY.scroll.init("'+this.thumbs+'",1,'+this.scrollSpeed+')');
			//la barra de scroll
			this.p=$(this.thumbs);
			this.p.style.left = '0px'; //Mostrar el scroll desde el comienzo
		}
		
		
		
		
		//Recorremos los elementos del slider
		for(i=0;i<l;i++){
			

			if(this.thumbs){

				//en g recuperamos la imagen miniatura del elemento del slider
				var g = document.createElement('img');
				g.src = puntos[i][2]; 
				//Añadimos la minitura al slider
				
				this.p.appendChild(g);
				//añadimos al ancho total del slider el ancho de la miniatura
		 	    
		 	    w+= 131;//g.offsetWidth;
		
				//si no hemos llegado al ultimo elemento del slider ...
				if(i!=l-1){
				    //añadimos un margen derecho a cada miniatura
				    //spacing se define en page2.html
					g.style.marginRight=this.spacing+'px';
					//sumamos al ancho total del slider el ancho de la separacion entre miniaturas
					w+=this.spacing;
				}
				
				this.p.style.width=w+'px';
				//Establecemos la opacidad de las minituras 
				g.style.opacity=this.thumbOpacity/100;g.style.filter='alpha(opacity='+this.thumbOpacity+')';
				g.onmouseover=new Function('TINY.alpha.set(this,100,5)');
				g.onmouseout=new Function('TINY.alpha.set(this,'+this.thumbOpacity+',5)');
				//Ivan: función que se ejecuta al hacer click sobre las miniaturas
				g.onclick=new Function('fly('+i+')');
					
				}
			}
			
		
		}
		
		,empty:function(){
		  
		  var imagenes;
		  var numImg;
	      if(this.thumbs){
					var a=document.getElementById(this.thumbs);
 					while(a.hasChildNodes())
					a.removeChild(a.firstChild);
		   }
		}
			
	
};
	
TINY.scroll=function(){
	
	return{
		
		/*
		 *
		 * e : slider
		 * d : direccion
		 * s : velocidad
		 *
		 */
		
		init:function(e,d,s){
			
			//Recuperamos el objeto slider
			e=typeof e=='object'?e:$(e);
			
			//En el caso de que left valga distinto de cero se lo asignamos al slider  
			var p = e.style.left||TINY.style.val(e,'left');
			
			e.style.left=p;
			
			/* A l le asignamos la diferencia del ancho actual del slider menos el ancho del sliderarea que 
			 * en este caso son 131px. De este modo se produce scroll hacia la izquierda.
			 */
			 
			 
			var l = d==1? parseInt(e.offsetWidth)- parseInt(e.parentNode.offsetWidth):0;
			
			/*
			 * Cada 20 segundos ejecutamos el scroll. Se recoge en una variable la salida de esta funcion 
			 * para posteriormente parar la ejecución con clearInterval.
			 *
			 */
			 
			e.si = setInterval(function(){TINY.scroll.mv(e,l,d,s)},20)
		}
		
		/*
		 * e:slider
		 * l:ancho del intervalo, es decir, el desplazamiento que va a realizar el slider
		 * d:direccion
		 * s:velocidad del scroll 
		 */
		 
		,mv:function(e,l,d,s){
			
			//Recuperamos el valor actual del campo left del slider
			var c = parseInt(e.style.left);
			
			//si la posición actual del slider coincide con el desplazamiento que se va a hacer paramos el scroll
			if(c==l){
				TINY.scroll.cl(e)
			}
			else{
			    //i es la suma del desplazamiento y la posicion inicial
				var i = Math.abs(l+c);
				/*
				 * Si i es menor que la velocidad no cambia su valor mientras que si es igual o mayor se actualiza 
				 * su valor con el de la velocidad
				 */
				i=i<s?i:s;
				// Se calcula la nueva posición del slider.
				var n = c-i*d;
				e.style.left=n+'px'
			}
		}
		
		//Función que para la ejecución del slider.
		,cl:function(e){
			
			e=typeof e=='object'?e:$(e);
			clearInterval(e.si)
		
		}
	}

   }();
		

	
	TINY.alpha=function(){
	
		return{
			set:function(e,a,s){
				e=typeof e=='object'?e:$(e);
				var o=e.style.opacity||TINY.style.val(e,'opacity'),d=a>o*100?1:-1;
				e.style.opacity=o;
				clearInterval(e.ai);
				e.ai=setInterval(function(){
					TINY.alpha.tw(e,a,d,s)},20)},tw:function(e,a,d,s){
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
			
	TINY.style=function(){
	
		return{
			val:function(e,p){
				e=typeof e=='object'?e:$(e);
				return e.currentStyle?e.currentStyle[p]:document.defaultView.getComputedStyle(e,null).getPropertyValue(p)
			}
		}
	}();
	
 function fly(i){
 	
	//Ivan: para parar la rotación inicial
	
 	if(frameendEL){
      toggleFrameendEL();
      ge.getOptions().setFlyToSpeed(.5);
    }
	
	
 	
 	latitud = parseFloat(puntos[i][3]);
 	longitud = parseFloat(puntos[i][4]);
 	altitud = parseFloat(puntos[i][5]);
 	heading = parseFloat(puntos[i][6]);
 	tilt = parseFloat(puntos[i][7]);
 	range =	parseFloat(puntos[i][8]);
 	
 	var la = ge.createLookAt('');
         
    la.set(latitud, longitud, altitud, ge.ALTITUDE_RELATIVE_TO_GROUND, heading, tilt, range); 
    
  	ge.getView().setAbstractView(la); 
  	
  	document.getElementById('locinfo').innerHTML = puntos[i][1];

		
	}

			

