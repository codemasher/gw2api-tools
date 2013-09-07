<?php
/**
 * gw2itemsearch.php
 * created: 06.09.13
 */

require_once '../inc/mysqli.inc.php';
require_once '../inc/utils.inc.php';

mb_internal_encoding('UTF-8');


// search
if(isset($_POST['search']) && !empty($_POST['search'])){
	// decode the json
	if(!$data = json_decode($_POST['search'],1)){
		exit('json error');
	}

	// search text
	$str = utf8_encode(base64_decode($data['str']));
	$search = '%'.mb_strtolower($str).'%';

	// language colum names (whitelist)
	$cols = [
		'de' => 'name_de',
		'en' => 'name_en',
		'es' => 'name_es',
		'fr' => 'name_fr',
	];

	// determine the correct language column / else set a default
	$col = array_key_exists($data['lang'], $cols) ? $cols[$data['lang']] : 'name_de';

	// first count the results to create the pagination
	$sql = 'SELECT COUNT(*) FROM `gw2_items` WHERE LOWER(`'.$col.'`) LIKE ?';
	$count = sql_query($sql, [$search], false);

	// determine the current page number
	$page = (isset($data['p']) && !empty($data['p']) && intval($data['p']) > 0) ? intval($data['p']) : 1;

	// items per page limit
	$limit = 30;

	// create the pagination
	$pagination = pagination($count[0][0], $page, $limit);
	$sql_start = (empty($pagination['pages']) || !isset($pagination['pages'][$page])) ? 0 : $pagination['pages'][$page];

	// get the item result
	$sql = 'SELECT `'.$col.'`, `item_id`, `level` FROM `gw2_items` WHERE LOWER(`'.$col.'`) LIKE ? ORDER BY `gw2_items`.`'.$col.'` LIMIT '.$sql_start.', '.$limit;
	$result = sql_query($sql, [$search]);

	// process the result
	$list = '';
	if(count($result) > 0){
		foreach($result as $row){
			// TODO: improve text highlighting
			$list .= '<div data-id="'.$row['item_id'].'">'.(mb_strlen($str) > 0 ? mb_eregi_replace('('.$str.')', '<span class="highlight">\\1</span>', $row[$col]) : $row[$col]).' ('.$row['level'].')</div>';
		}
	}

	header('Content-type: text/html;charset=utf-8;');
	echo $pagination['pagination'].'
	<div class="table-row">
		<div class="table-cell" id="resultlist">'.$list.'</div>
		<div class="table-cell" id="details"></div>
	</div>';
	exit;
}
// detail display
else if(isset($_POST['details']) && !empty($_POST['details'])){
	if(!$data = json_decode($_POST['details'],1)){
		exit('json error');
	}

	$sql = 'SELECT * FROM `gw2_items` WHERE `item_id` = ?';
	$details = sql_query($sql, [intval($data['id'])]);

	$response = '';
	if(count($details) > 0){
		$d = $details[0];
		$flag_url = 'https://chillerlan.net/img/flags/';
		$textarea = 'style="width:35em;" cols="20" rows="3" readonly="readonly" class="selectable"';

		// TODO: display item details, icon download, wikicode for recipes (or even full pages), list of ingredients
		$response = '
		<img src="'.$flag_url.'de.png"> <a href="http://wiki-de.guildwars2.com/wiki/'.str_replace(' ', '_', $d['name_de']).'" target="wiki-de">'.$d['name_de'].'</a><br />
		<textarea '.$textarea.'>[[en:'.$d['name_en'].']]'."\n".'[[es:'.$d['name_es'].']]'."\n".'[[fr:'.$d['name_fr'].']]</textarea><br />
		<img src="'.$flag_url.'en.png"> <a href="http://wiki.guildwars2.com/wiki/'.str_replace(' ', '_', $d['name_en']).'" target="wiki-en">'.$d['name_en'].'</a><br />
		<textarea '.$textarea.'>[[de:'.$d['name_de'].']]'."\n".'[[es:'.$d['name_es'].']]'."\n".'[[fr:'.$d['name_fr'].']]</textarea><br />
		<img src="'.$flag_url.'es.png"> <a href="http://wiki-es.guildwars2.com/wiki/'.str_replace(' ', '_', $d['name_es']).'" target="wiki-es">'.$d['name_es'].'</a><br />
		<textarea '.$textarea.'>[[de:'.$d['name_de'].']]'."\n".'[[en:'.$d['name_en'].']]'."\n".'[[fr:'.$d['name_fr'].']]</textarea><br />
		<img src="'.$flag_url.'fr.png"> <a href="http://wiki-fr.guildwars2.com/wiki/'.str_replace(' ', '_', $d['name_fr']).'" target="wiki-fr">'.$d['name_fr'].'</a><br />
		<textarea '.$textarea.'>[[de:'.$d['name_de'].']]'."\n".'[[en:'.$d['name_en'].']]'."\n".'[[es:'.$d['name_es'].']]</textarea><br />
		chat code<br />
		<input type="text" readonly="readonly" style="width:35em;" value="'.item_code($d['item_id']).'" class="selectable" /><br />
		item id<br />
		<input type="text" readonly="readonly" style="width:35em;" value="'.$d['item_id'].'" class="selectable" /><br />
		icon<br />
		...<br />
		';
	}

	header('Content-type: text/html;charset=utf-8;');
	echo $response;
	exit;
}
// anything else is invalid
else{
	exit('invalid request');
}

?>