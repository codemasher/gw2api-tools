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

	// language column names (whitelist)
	$cols = [
		'de' => 'name_de',
		'en' => 'name_en',
		'es' => 'name_es',
		'fr' => 'name_fr',
	];

	// determine the correct language column / else set a default
	$col = array_key_exists($data['form']['lang'], $cols) ? $cols[$data['form']['lang']] : 'name_de';

	// build the WHERE clause for the SQL statement and add the corresponding values to an array
	$values = [];

	// if the search string is integer, use the id column else the item name (is_int() doesn't work here!)
	$where = check_int($str) ? '`item_id` LIKE ?' : 'LOWER(`'.$col.'`) LIKE ?';
	$values[] = '%'.(check_int($str) ? intval($str) : mb_strtolower($str)).'%';

	if(isset($data['form']['type']) && !empty($data['form']['type'])){
		$where .= ' AND `type` = ?';
		$values[] = $data['form']['type'];
	}

	if(isset($data['form']['rarity']) && !empty($data['form']['rarity'])){
		$where .= ' AND `rarity` = ?';
		$values[] = $data['form']['rarity'];
	}

	if(isset($data['form']['min-level']) && $data['form']['min-level'] !== ''){ // empty won't work because 0 counts as empty too
		$where .= ' AND `level` >= ?';
		$values[] = isset($data['form']['max-level']) && intval($data['form']['max-level']) < intval($data['form']['min-level']) ? intval($data['form']['max-level']) : intval($data['form']['min-level']);
	}

	if(isset($data['form']['max-level']) && $data['form']['max-level'] !== ''){
		$where .= ' AND `level` <= ?';
		$values[] = isset($data['form']['min-level']) && intval($data['form']['min-level']) > intval($data['form']['max-level']) ? intval($data['form']['min-level']) : intval($data['form']['max-level']);
	}

	// first count the results to create the pagination
	$sql = 'SELECT COUNT(*) FROM `gw2_items` WHERE '.$where;
	$count = sql_query($sql, $values, false);

	// determine the current page number
	$page = (isset($data['p']) && !empty($data['p']) && intval($data['p']) > 0) ? intval($data['p']) : 1;

	// items per page limit
	$limit = 30;

	// create the pagination
	$pagination = pagination($count[0][0], $page, $limit);
	$sql_start = (empty($pagination['pages']) || !isset($pagination['pages'][$page])) ? 0 : $pagination['pages'][$page];

	// get the item result
	$sql = 'SELECT `'.$col.'`, `item_id`, `level` FROM `gw2_items` WHERE '.$where.' ORDER BY `gw2_items`.`'.(check_int($str) ? 'item_id' : $col).'` LIMIT '.$sql_start.', '.$limit;
	$result = sql_query($sql, $values);

	// process the result
	$list = '';
	if(is_array($result) && count($result) > 0){
		foreach($result as $row){
			// TODO: improve text highlighting
			$list .= '<div data-id="'.$row['item_id'].'">';
			if(mb_strlen($str) > 0){
				if(check_int($str)){
					$list .= preg_replace('/('.$str.')/U', '<span class="highlight">$1</span>', $row['item_id']).': ';
				}
				$list .= mb_eregi_replace('('.$str.')', '<span class="highlight">\\1</span>', $row[$col]);
			}
			else{
				$list .= $row[$col];
			}
			$list .= ' ('.$row['level'].')</div>';
		}
	}
	else{
		$list .= 'no results';
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
		$n = "\n";
		$flag_url = 'https://chillerlan.net/img/flags/';
		$icon_url = 'http://gw2wbot.darthmaim.de/icon/'.$d['signature'].'/'.$d['file_id'].'.png'; // https://render.guildwars2.com/file/
		$textarea = 'cols="20" rows="3" readonly="readonly" class="selectable"';

		// TODO: display item details, icon download, wikicode for recipes (or even full pages), list of ingredients
		$response = '
		<img src="'.$flag_url.'de.png"> <a href="http://wiki-de.guildwars2.com/wiki/'.str_replace(' ', '_', $d['name_de']).'" target="wiki-de">'.$d['name_de'].'</a><br />
		<textarea '.$textarea.'>[[en:'.$d['name_en'].']]'.$n.'[[es:'.$d['name_es'].']]'.$n.'[[fr:'.$d['name_fr'].']]</textarea><br />
		<img src="'.$flag_url.'en.png"> <a href="http://wiki.guildwars2.com/wiki/'.str_replace(' ', '_', $d['name_en']).'" target="wiki-en">'.$d['name_en'].'</a><br />
		<textarea '.$textarea.'>[[de:'.$d['name_de'].']]'.$n.'[[es:'.$d['name_es'].']]'.$n.'[[fr:'.$d['name_fr'].']]</textarea><br />
		<img src="'.$flag_url.'es.png"> <a href="http://wiki-es.guildwars2.com/wiki/'.str_replace(' ', '_', $d['name_es']).'" target="wiki-es">'.$d['name_es'].'</a><br />
		<textarea '.$textarea.'>[[de:'.$d['name_de'].']]'.$n.'[[en:'.$d['name_en'].']]'.$n.'[[fr:'.$d['name_fr'].']]</textarea><br />
		<img src="'.$flag_url.'fr.png"> <a href="http://wiki-fr.guildwars2.com/wiki/'.str_replace(' ', '_', $d['name_fr']).'" target="wiki-fr">'.$d['name_fr'].'</a><br />
		<textarea '.$textarea.'>[[de:'.$d['name_de'].']]'.$n.'[[en:'.$d['name_en'].']]'.$n.'[[es:'.$d['name_es'].']]</textarea><br />
		chat code<br />
		<input type="text" readonly="readonly" value="'.item_code($d['item_id']).'" class="selectable" /><br />
		item id<br />
		<input type="text" readonly="readonly" value="'.$d['item_id'].'" class="selectable" /><br />
		icon<br />
		<img src="'.$icon_url.'"><br />
		<input type="text" readonly="readonly" value="'.$icon_url.'" class="selectable" /><br />
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