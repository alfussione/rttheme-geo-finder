(function ($) {
$(window).ready(function() {

var lat;
var lon;

// wait to debugowania
function sleep(milliseconds) {
  var start = new Date().getTime();
  for (var i = 0; i < 1e7; i++) {
    if ((new Date().getTime() - start) > milliseconds){
      break;
    }
  }
}

// odpal tę funkcję dla pola wpisywania
wlasneMiasto();

// wyszukiwanie lokacji z podpowiedziami google
function wlasneMiasto() {
	  	autocomplete = new google.maps.places.Autocomplete(
			    (document.getElementById('wlasnemiasto')),
			    { types: ['(cities)'],componentRestrictions: {country: "pl"} });
			 	google.maps.event.addListener(autocomplete, 'place_changed', function() {
				 		var place = autocomplete.getPlace();
				 		var lat = place.geometry.location.k;
				 		var lon = place.geometry.location.B;

				 		// STATUS 1
				 		sleep(500);
						$("#status").prepend("ustanowiono nową lokalizację<br />");

				 		$('#znajdzmiasto').click(function(){

				 			// STATUS
				 			sleep(500);
				 			$("#status").prepend("wyszukuję nową lokalizację<br />");

							liczDystans(lat,lon);
						});
		  		}
		);
}





// STATUS 1
sleep(500);
$("#status").prepend("odpalone, oczekuję zgody<br />");





// miganie podczas wyszukiwania
function miganie() {
		$(".wyszukuje").animate({opacity:'+=1'}, 660);
		$(".wyszukuje").animate({opacity:'-=0.5'}, 330, miganie);
}
miganie();






// podstawowa lokalizacja funkcja
function getLocation() {
	    if (navigator.geolocation) {
	        navigator.geolocation.getCurrentPosition(lokalizacja_ok, lokalizacja_blad);
	    } else {
	        getLocationFallback();
	    }
}






// co jeśli błąd getLocation
function lokalizacja_blad(error) {
	    getLocationFallback();
}






// gdy otrzymano zgodę na geolokalizację
function lokalizacja_ok(position) {

		// status
		sleep(500);
		$("#status").prepend("geolokalizacja natywna<br />");

		// pobrane koordynaty od użytkownika
        var lat = position.coords.latitude;
		var lon = position.coords.longitude;

		// pobierz źródło dla wykrytych koordynatów
		koordynatyNaMiasto(lat,lon);

		// dodatkowo wyświetl wykryte koordynaty
		$("#twojeKoordynaty").html("(" + lat.toFixed(2) + ", " + lon.toFixed(2) + ")");

}







// gdy nie ma wsparcia, odmowa lub błąd
function getLocationFallback(){

		// status
		sleep(500);
		$("#status").prepend("nie ma wsparcia, odmowa lub błąd<br />");

		// dopisz że niedokładnA lokalizacja
		$(".przyblizona").html(" przybliżona ");

		// fallback = lokalizacja z adresu ip
		$.getJSON("http://ip-api.com/json").then(function(location) {
			    var lat = location.lat;
			    var lon = location.lon;

			    // pobierz źródło dla wykrytych koordynatów
			    koordynatyNaMiasto(lat,lon);

		});

		// status
		sleep(500);
		$("#status").prepend("geolokalizacja zapasowa<br />");

}






// funkcja zamienia podane koordynaty na miasto wg google
function koordynatyNaMiasto(lat,lon) {

		// status
		sleep(500);
		$("#status").prepend("pobrano miasto<br />");

		// pobieranie źródła dla wykrytych koordynatów
		var jsonsrc = "http://maps.googleapis.com/maps/api/geocode/json?latlng="+lat+","+lon+"&sensor=false";

		//wydrukuj miasto
		$.getJSON(jsonsrc).then(function(data) {
			    var miasto = data.results[0].address_components[2].long_name;
			    $("#twojeMiasto").html(miasto);
		});

		//a potem odpal przeliczanie odległości
		liczDystans(lat,lon);
}






// POBIERZ LOKACJĘ GO!
getLocation();





// pobiera wykrytą lokalizację, przyrównuje do danych w bazie i wyświetla najbliższe oddziały
function liczDystans(lat,lon) {

		// status
		sleep(500);
		$("#status").prepend("kalkulacja odległości<br />");

		var adresstrony = 'http://localhost/daiglob/';
		var urlplacowek = adresstrony + 'bazaplacowek.json';

		$.getJSON(urlplacowek).then(function(data) {

				var referencja = [];
				var tablica = [];
				var idnajblizej;

				for(var i=0;i<data.length;i++){

						var targetlat = data[i].gpslat;
						var targetlon = data[i].gpslon;
						var targetid = data[i].id;
						
						referencja[i] = {id : targetid, dist : Math.sqrt(Math.pow(targetlat-lat,2)+Math.pow(targetlon-lon,2))};
						tablica[i] = (Math.sqrt(Math.pow(targetlat-lat,2)+Math.pow(targetlon-lon,2)));
				}

				// status
				sleep(500);
				$("#status").prepend("sortowanie odległości<br />");

				tablica.sort(function(a, b){return a-b});

				for(var i=0;i<tablica.length;i++){
						if (tablica[0] == referencja[i].dist) {
							idnajblizej = referencja[i].id;
						}
				}

				$("#placowkitext").html("Najbliższe oddziały dla tej lokalizacji:");

				for(var j=0;j<data.length;j++){

						if (data[j].id == idnajblizej) {

					 			$('#placowka').html(" ");
					 			$('#placowka2').html(" ");

								for (linieadresu = 0; linieadresu < data[j][idnajblizej][1].length; linieadresu++) {
										$("#placowka").append(data[j][idnajblizej][1][linieadresu] + "<br />");
								}
								if (data[j][idnajblizej][2]) {
										for (linieadresu = 0; linieadresu < data[j][idnajblizej][2].length; linieadresu++) {
												$("#placowka2").append(data[j][idnajblizej][2][linieadresu] + "<br />");
										}
								}
						}
				}


				// status
				sleep(500);
				$("#status").prepend("wyświetlam placówki!<br />");



		    
		});



/*
var uzytkownik = new google.maps.LatLng(lat, lon);
var placowka   = new google.maps.LatLng(49.321, 8.789);
var dist = google.maps.geometry.spherical.computeDistanceBetween(from, to);
*/

}







});
}(jQuery));