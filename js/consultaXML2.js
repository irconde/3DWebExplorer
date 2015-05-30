function getTours()
{
	var xmlDoc;
	
	if (window.XMLHttpRequest)
	{
		xmlDoc=new window.XMLHttpRequest();
		xmlDoc.open("GET","xml/tourlist.xml",false);
		xmlDoc.send("");
		xmlDoc=xmlDoc.responseXML;
	}

	// IE 5 and IE 6
	else if (ActiveXObject("Microsoft.XMLDOM"))
	{
		xmlDoc=new ActiveXObject("Microsoft.XMLDOM");
		xmlDoc.async=false;
		xmlDoc.load("xml/tourlist.xml");
	}
	

	
	var x = xmlDoc.getElementsByTagName('tour');

	var tours = new Array();
	

	for(i = 0; i < x.length; i++)
	{	 
		tours[i] = new Array();
		
		tours[i][0] = (x[i].getElementsByTagName("nombre")[0].childNodes[0].nodeValue);
		tours[i][1] = (x[i].getElementsByTagName("url")[0].childNodes[0].nodeValue);
		tours[i][2] = (x[i].getElementsByTagName("imagen")[0].childNodes[0].nodeValue);
	}
	return tours;
    
}


