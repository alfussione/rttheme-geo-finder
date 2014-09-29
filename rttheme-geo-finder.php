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

if(isset($_POST['geoemail'])) {
	
	return '
	<!--[if gte IE 9]>
	  <style type="text/css">
	    .gradient {
	       filter: none;
	    }
	  </style>
	<![endif]-->
	<div id="zaprowrap">
	<div id="zaproszenie" class="clearfix">
		Wizytówka została wysłana na adres
		<h2>'.$_POST['geoemail'].'</h2>
		<span class="dziekizielone">Dziękujemy za zainteresowanie,<BR />
		<img src="http://daiglob.pl/wp-content/uploads/2014/07/daiglob-logo.png" width="150" height="26">
		</span>
		<br /><a class="ponownielink" href="http://daiglob.pl/">kliknij tutaj by wyszukać ponownie</a>
	</div>
	</div>
	';


}else{



	return '
	<!--[if gte IE 9]>
	  <style type="text/css">
	    .gradient {
	       filter: none;
	    }
	  </style>
	<![endif]-->
	<div id="zaprowrap">
	<div id="zaproszenie" class="clearfix">

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
		<p class="placowka"></p>
		<p class="placowka2"></p>
	</div>

	<div id="przeslij">

		<form name="formularz" id="geoformularz" method="post" action="">

			<textarea class="text-placowka" name="geoplace"></textarea>
			<textarea class="text-placowka2" name="geoplace2"></textarea>


			<span><b>Pobierz naszą wizytówkę</b><BR /></span>
			<label class="geoimielabel">
			<span>wpisz swoje imię:</span>
			<input type="text" name="geoimie" id="przeslijimie" autocomplete="off">
			</label>

			<label class="geoemaillabel">
			<span>oraz adres email:</span>
			<input type="text" name="geoemail" id="przeslijemail" autocomplete="off">
			</label>

			<label class="geoprzycisklabel">
			<input type="submit" value="prześlij" id="przeslijprzycisk">
			</label>

		</form>

	</div>
	</div>
	
	';

// koniec if przesłano formularz
}
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


// zakoduj do json po pobraniu
$file = 'bazaplacowek.json';
file_put_contents($file, json_encode($json_elementow));


// formularz

if(isset($_POST['geoemail'])) {
	$odbiorca = $_post['geoemail'];
	$temat = "DAIGLOB.PL - wizytówka";

	function niepoprawne($blad) {
		echo "<meta charset=utf-8>";
		echo "Wystąpił błąd: <br />";
		echo $blad;
		echo "<br /> Spróbuj ponownie. Jeśli to nie pomoże skontaktuj się z nami przez standardowy formularz.";
		die();
		//wstaw powrót
	}

	if(!isset($_POST['geoimie']) || !isset($_POST['geoemail']) || !isset($_POST['geoplace'])) niepoprawne("- błąd z formularzem");

	$imie = $_POST['geoimie'];
	$email = $_POST['geoemail'];
	$placowka = nl2br(htmlspecialchars($_POST['geoplace']));
	$placowka2 = nl2br(htmlspecialchars($_POST['geoplace2']));

	$wiadomoscbledu = "";
	$email_wzor = '/^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4}$/';
	$imie_wzor = "/^[A-Za-z .'-]+$/";


 	if(!preg_match($email_wzor,$email)) {
 		$wiadomoscbledu .= '- email wydaje się być niepoprawny <br />';
 	}
 	if(!preg_match($imie_wzor,$imie)) {
 		$wiadomoscbledu .= '- wpisane imię jest niepoprawne <br />';
 	}
 	if(strlen($placowka) == 0) {
 		$wiadomoscbledu .= '- nie wykryto placówki - proszę się upewnić, że wyświetlono najbliższe oddziały <br />';
 	}
	if(strlen($wiadomoscbledu) > 0) {
		niepoprawne($wiadomoscbledu);
	}

	$tresc_wizytowki = "Dzień dobry! <BR /><BR />Oto dane, o które prosiłeś:<BR /><BR />".$placowka."<BR /><BR />".$placowka2."<BR /><BR />Pozdrawiamy,<BR />DAIGLOB FINANCE";

$headers = "From: DAIGLOB <daiglob@telvinet.pl>\r\n";
$headers .= "Reply-To:biuro@daiglob.pl\r\n";
$headers .= "MIME-Version: 1.0\r\n";
$headers .= "Content-Type: text/html; charset=utf-8\r\n";
$headers .= "Content-Transfer-Encoding: 8bit\r\n";

	@mail($email, $temat, $tresc_wizytowki, $headers);  
}

?>

</div>