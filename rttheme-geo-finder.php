<?php
/**
* Plugin Name: Rubycon: RT Theme 18 Geo Finder
* Description: Przeszukuje templatki RT Theme 18 w poszukiwaniu danych klienta w postaci adresów i lokalizacji GPS placówek, ustala lokalizację odwiedzającego i wyświetla najbliższy punkt.
* Version: 0.3a
* Author: Paweł Foryński
* Author URI: http://rubycon.pl
* License: no license
*/

function rtgeoloc_add_scripts(){
	wp_register_script( 'rtgeoloc_script', plugins_url( '/script.js', __FILE__ ), array('jquery') );
	wp_enqueue_script( 'rtgeoloc_script');
	wp_register_style( 'rtgeoloc_style', plugins_url( '/style.css', __FILE__ ), array(), 'all' );
	wp_enqueue_style('rtgeoloc_style');
	wp_register_script( 'google_places_script', 'https://maps.googleapis.com/maps/api/js?v=3.exp&libraries=places&language=pl', array('jquery'));
	wp_enqueue_script( 'google_places_script');
}
add_action( 'wp_enqueue_scripts', 'rtgeoloc_add_scripts' );

// start drukowania szkieletu (pamiętaj żeby wywołać)
function rtgeoloc_szkielet($atts) {

return '
<div id="zaproszenie">

<div id="geolokalizacja">
<p>
<span id="twojaLokalizacja">Twoja<span class="przyblizona"> </span>lokalizacja: <BR /></span>
<span id="twojeMiasto"><span class="wyszukuje">wyszukuję...</span></span>
<span id="twojeKoordynaty"></span>
</p>

<label>
<span>Inna miejscowość? Wpisz poniżej:</span>
<input type="text" id="wlasnemiasto"><BR />
<input type="button" value="znajdź" id="znajdzmiasto">
</label>
</div>

<div id="placowkiwrap">
<p id="placowkitext"></p>
<p id="placowka"></p>
<p id="placowka2"></p>
</div>

<div id="przeslij">
<span><b>Pobierz naszą wizytówkę</b><BR /></span>
<label>
<span>wpisz swoje imię:</span>
<input type="text" id="przeslijimie">
</label>

<label>
<span>oraz adres email:</span>
<input type="text" id="przeslijemail">
</label>

<label>
<input type="button" value="prześlij" id="przeslijprzycisk">
</label>

</div>

<p id="status">tutaj wyświetli status aplikacji</p>

';

// koniec szkieletu
} 
// dodaj shortcode
add_shortcode( 'rtgeoloc', 'rtgeoloc_szkielet' );

// podłącz do bazy
global $wpdb;

// pobierz z bazy

$cala_zawartosc = $wpdb->get_results("SELECT option_id,option_value FROM wp_options WHERE option_id>891 AND option_id!=2127 AND option_id!=901 AND option_name REGEXP '^rttheme18_templateid_.*_content_output'");
//$cala_zawartosc = $wpdb->get_results("SELECT option_id,option_value FROM wp_options WHERE (option_name = 'rttheme18_templateid_633015_content_output' OR option_name = 'rttheme18_templateid_613534_content_output')");

global $json_elementow;

// walker
foreach ($cala_zawartosc as $element) {

	//deklaracje
	$id_elementu = $element->option_id;
	$tresc_elementu = $element->option_value;
	//przeszukanie dla lat i lon
	$wzor_latlon = '/lat="(.*?)".*?lon="(.*?)".*?/s';
	preg_match_all($wzor_latlon,$tresc_elementu, $znalezione);

	//przeszukanie dla nazw i adresów
	$wzor_adres = '/icon_list title="(.*?)"|icon_list_line.*?](.*?)\[\/icon_list_line\]/';
	preg_match_all($wzor_adres,$tresc_elementu, $znaladres);


	//pobieracz adresow
	$licz1 = 1;
	$licz2 = 0;
	$numerplacowki = 0;
	$licznik_top = count($znaladres[0]);
	for ($licznik = 0; $licznik < $licznik_top; $licznik++) {
		if ($znaladres[$licz1][$licz2] !== '') {
			//gdy pole niepuste czyli to tytuł to wtedy:
			$numerplacowki++;

			$placowka_dane[$numerplacowki][] = $znaladres[$licz1][$licz2];

			$licz2++;
		}else{
			$licz1++;
			//gdy pole tytułu puste to wtedy dodaj linię dla tej placówki
			$placowka_dane[$numerplacowki][] = $znaladres[$licz1][$licz2];

			$licz1--;
			$licz2++;
		}
	}

	//wypisz tablice
	if ($znalezione[1][0] != '') {
		$json_elementow[] = array(
			'gpslat' => $znalezione[1][0], 
			'gpslon' => $znalezione[2][0],
			$id_elementu => $placowka_dane,
			'id' => $id_elementu
			);
	}
    unset ($placowka_dane);



} //foreach


$file = 'bazaplacowek.json';
file_put_contents($file, json_encode($json_elementow));


?>

</div>