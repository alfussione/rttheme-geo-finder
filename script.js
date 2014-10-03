(function ($) {
$(window).ready(function() {

// rejestruj zmienne (czy w ogóle potrzebne?)
var lat;
var lon;

$('#przeslijprzycisk').attr("disabled","disabled");

$("#przeslijprzycisk").val("najpierw wybierz oddział");

// wyłącz wysłanie wizytówki jeśli puste pola
$('#geoformularz input').on('change', function () {odblokujPrzycisk();});
$('#geoformularz input').on('input change', function () {odblokujPrzycisk();});
$('#geoformularz input').mousemove(function () {odblokujPrzycisk();});
$('#geoformularz input').on('keyup', function () {odblokujPrzycisk();});
function odblokujPrzycisk() {
		var validated = true;
		if($('#przeslijimie').val().length === 0) validated = false;
		if($('#przeslijemail').val().length === 0) validated = false;
		if(validated) $("#przeslijprzycisk").removeAttr("disabled");
		if(validated) $("#przeslijprzycisk").val("prześlij");
}



// odpal tę funkcję dla pola wpisywania
wlasneMiasto();

// wyszukiwanie lokacji z podpowiedziami google
function wlasneMiasto() {
	  	autouzupelnianie = new google.maps.places.Autocomplete(
			    (document.getElementById('wlasnemiasto')),
			    { types: ['(cities)'],componentRestrictions: {country: "pl"} });
			 	google.maps.event.addListener(autouzupelnianie, 'place_changed', function() {

			 			//określ typ lokalizacji;
						$("#twojaLokalizacja").html("Wybrana lokalizacja:<br />");
						$("#twojeKoordynaty").html("");
						$("#dbgeoloctype").val("ręczna");


				 		var place = autouzupelnianie.getPlace();
				 		var lat = place.geometry.location.k;
				 		var lon = place.geometry.location.B;
				 		
				 		for (var przejdz1 = 0; przejdz1 < place.address_components.length; przejdz1++) {
				 			if (place.address_components[przejdz1].types[0] == 'administrative_area_level_1') {
				 				$("#dbgeolocstate").val(place.address_components[przejdz1].long_name);
				 			}
				 		}

				 		for (var przejdz2 = 0; przejdz2 < place.address_components.length; przejdz2++) {
				 			if (place.address_components[przejdz2].types[0] == 'locality') {
						 		$("#twojeMiasto").html(place.address_components[przejdz2].long_name);
						 		$("#dbgeoloccity").val(place.address_components[przejdz2].long_name);
				 			}
				 		}

				 		liczDystans(lat,lon);
				 		
		  		}
		);
}




// miganie podczas wyszukiwania
function miganie() {
		$(".wyszukuje").animate({opacity:'+=1'}, 660);
		$(".wyszukuje").animate({opacity:'-=0.5'}, 330, miganie);
}
miganie();





// podstawowa lokalizacja funkcja
function getLocation() {
	    if (navigator.geolocation) {
	        navigator.geolocation.getCurrentPosition(lokalizacja_ok, lokalizacja_blad, {enableHighAccuracy:true, timeout:15000, maximumAge:3600000});
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

		//określ typ lokalizacji;
		$("#dbgeoloctype").val("dokładna");

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

		//określ typ lokalizacji;
		$("#dbgeoloctype").val("przybliżona");

		// dopisz że niedokładna lokalizacja
		$(".przyblizona").html(" przybliżona ");

		// fallback = lokalizacja z adresu ip
		$.getJSON("http://ip-api.com/json").then(function(location) {
			    var lat = location.lat;
			    var lon = location.lon;

			    // pobierz źródło dla wykrytych koordynatów
			    koordynatyNaMiasto(lat,lon);

		});

}






// funkcja zamienia podane koordynaty na miasto wg google
function koordynatyNaMiasto(lat,lon) {

		// pobieranie źródła dla wykrytych koordynatów
		var jsonsrc = "http://maps.googleapis.com/maps/api/geocode/json?latlng="+lat+","+lon+"&sensor=false";

		//wydrukuj miasto
		$.getJSON(jsonsrc).then(function(data) {

		 		for (var przejdz1 = 0; przejdz1 < data.results[0].address_components.length; przejdz1++) {
		 			if (data.results[0].address_components[przejdz1].types[0] == 'administrative_area_level_1') {
		 				$("#dbgeolocstate").val(data.results[0].address_components[przejdz1].long_name);
		 			}
		 		}

		 		for (var przejdz2 = 0; przejdz2 < data.results[0].address_components.length; przejdz2++) {
		 			if (data.results[0].address_components[przejdz2].types[0] == 'locality') {
				 		$("#twojeMiasto").html(data.results[0].address_components[przejdz2].long_name);
				 		$("#dbgeoloccity").val(data.results[0].address_components[przejdz2].long_name);
		 			}
		 		}


		});

		//a potem odpal przeliczanie odległości
		liczDystans(lat,lon);
}






// POBIERZ LOKACJĘ GO!
getLocation();





// pobiera wykrytą lokalizację, przyrównuje do danych w bazie i wyświetla najbliższe oddziały
function liczDystans(lat,lon) {

		var adresstrony = adresurl + '/';
		var urlplacowek = adresstrony + 'bazaplacowek.json';

		$.getJSON(urlplacowek).then(function(data) {

				var referencja = [];
				var tablica = [];
				var idnajblizej;

				for(var i=0;i<data.length-1;i++){

						var targetlat = data[i].gpslat;
						var targetlon = data[i].gpslon;
						var targetid = data[i].id;
						
						referencja[i] = {id : targetid, dist : Math.sqrt(Math.pow(targetlat-lat,2)+Math.pow(targetlon-lon,2))};
						tablica[i] = (Math.sqrt(Math.pow(targetlat-lat,2)+Math.pow(targetlon-lon,2)));
				}

				tablica.sort(function(a, b){return a-b});

				for(var i=0;i<tablica.length-1;i++){
						if (tablica[0] == referencja[i].dist) {
							idnajblizej = referencja[i].id;
						}
				}

				$("#placowkitext").html("Najbliższe oddziały dla tej lokalizacji:");

				for(var j=0;j<data.length-1;j++){

						if (data[j].id == idnajblizej) {

					 			$('.placowka').html(" ");
					 			$('.placowka2').html(" ");
					 			$('.text-placowka').html(" ");
					 			$('.text-placowka2').html(" ");

								for (linieadresu = 0; linieadresu < data[j][idnajblizej][1].length; linieadresu++) {
										$(".placowka").append(data[j][idnajblizej][1][linieadresu] + "<br />");
										$(".text-placowka").append(data[j][idnajblizej][1][linieadresu] + "\r\n");
								}
								if (data[j][idnajblizej][2]) {
										for (linieadresu = 0; linieadresu < data[j][idnajblizej][2].length; linieadresu++) {
												$(".placowka2").append(data[j][idnajblizej][2][linieadresu] + "<br />");
												$(".text-placowka2").append(data[j][idnajblizej][2][linieadresu] + "\r\n");
										}
								}
						}
				}

				$("#przeslijprzycisk").val("uzupełnij powyższe pola");

		});


}

});
}(jQuery));



// pokaż po załadowaniu
jQuery(document).ready(function(){jQuery('#zaprowrap').slideUp(1).delay(2000).slideDown('slow');});