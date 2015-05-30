function getDatosPunto(i,t)
{
	var xmlDoc;
	
	if (window.XMLHttpRequest)
	{
		xmlDoc=new window.XMLHttpRequest();
		xmlDoc.open("GET","xml/pointlist.xml",false);
		xmlDoc.send("");
		xmlDoc=xmlDoc.responseXML;
	}

	// IE 5 and IE 6
	else if (ActiveXObject("Microsoft.XMLDOM"))
	{
		xmlDoc=new ActiveXObject("Microsoft.XMLDOM");
		xmlDoc.async=false;
		xmlDoc.load("xml/pointlist.xml");
	}
	
	var tipoPunto;
	
	if(t == 0) tipoPunto = "monumento";
		else if(t == 1) tipoPunto = "calle"; 
	
	var x = xmlDoc.getElementsByTagName(tipoPunto);
	var datos = new Array();
	
	if( i < x.length)
	{	 
		datos[0] = (x[i].getElementsByTagName("nombre")[0].childNodes[0].nodeValue);
		datos[1] = (x[i].getElementsByTagName("descripcion")[0].childNodes[0].nodeValue);
		datos[2] = (x[i].getElementsByTagName("imagen")[0].childNodes[0].nodeValue);
		datos[3] = (x[i].getElementsByTagName("latitud")[0].childNodes[0].nodeValue);
		datos[4] = (x[i].getElementsByTagName("longitud")[0].childNodes[0].nodeValue);
		datos[5] = (x[i].getElementsByTagName("altitud")[0].childNodes[0].nodeValue);
		datos[6] = (x[i].getElementsByTagName("rango")[0].childNodes[0].nodeValue);
		datos[7] = (x[i].getElementsByTagName("inclinacion")[0].childNodes[0].nodeValue);
		datos[8] = (x[i].getElementsByTagName("encabezado")[0].childNodes[0].nodeValue);

	
	}
	return datos;
    
}


function getDatosPuntos(t)
{
	
	if (window.XMLHttpRequest)
	{
		xmlDoc=new window.XMLHttpRequest();
		xmlDoc.open("GET","xml/pointlist.xml",false);
		xmlDoc.send("");
		xmlDoc=xmlDoc.responseXML;
	}

	// IE 5 and IE 6
	else if (ActiveXObject("Microsoft.XMLDOM"))
	{
		xmlDoc=new ActiveXObject("Microsoft.XMLDOM");
		xmlDoc.async=false;
		xmlDoc.load("xml/pointlist.xml");
	}
	
	var tipoPunto;
	
	if(t == 0) tipoPunto = "monumento";
		else if(t == 1) tipoPunto = "calle"; 
	
	var x = xmlDoc.getElementsByTagName(tipoPunto);

	var puntos = new Array();
	

	for(i = 0; i < x.length; i++)
	{	 
		puntos[i] = new Array();
		
		puntos[i][0] = (x[i].getElementsByTagName("nombre")[0].childNodes[0].nodeValue);
		puntos[i][1] = (x[i].getElementsByTagName("descripcion")[0].childNodes[0].nodeValue);
		puntos[i][2] = (x[i].getElementsByTagName("imagen")[0].childNodes[0].nodeValue);
		puntos[i][3] = (x[i].getElementsByTagName("latitud")[0].childNodes[0].nodeValue);
		puntos[i][4] = (x[i].getElementsByTagName("longitud")[0].childNodes[0].nodeValue);
		puntos[i][5] = (x[i].getElementsByTagName("altitud")[0].childNodes[0].nodeValue);
		puntos[i][6] = (x[i].getElementsByTagName("rango")[0].childNodes[0].nodeValue);
		puntos[i][7] = (x[i].getElementsByTagName("inclinacion")[0].childNodes[0].nodeValue);
		puntos[i][8] = (x[i].getElementsByTagName("encabezado")[0].childNodes[0].nodeValue);

	
	
	}
	return puntos;
    
}

function getNumPuntos(t)
{
	
	if (window.XMLHttpRequest)
	{
		xmlDoc=new window.XMLHttpRequest();
		xmlDoc.open("GET","xml/pointlist.xml",false);
		xmlDoc.send("");
		xmlDoc=xmlDoc.responseXML;
	}

	// IE 5 and IE 6
	else if (ActiveXObject("Microsoft.XMLDOM"))
	{
		xmlDoc=new ActiveXObject("Microsoft.XMLDOM");
		xmlDoc.async=false;
		xmlDoc.load("xml/pointlist.xml");
	}
	
	var tipoPunto;
	
	if(t == 0) tipoPunto = "monumento";
		else if(t == 1) tipoPunto = "calle"; 
	
	var x = xmlDoc.getElementsByTagName(tipoPunto);

	return x.length;
}
