<?php
/**
 * gw2wvw.php
 * created: 05.06.13
 *
 * note: this is just an example, there's not much error handling in here to keep the code as clean as possible
 *
 * see it live:
 * http://gw2.chillerlan.net/examples/gw2wvw.php
 *
 * in use over here:
 * https://chillerlan.net/gw2/wvw.html
 *
 */

/*
 * TODO
 */

require_once '../inc/request.inc.php';
require_once '../inc/wvw_stats.inc.php';

// some settings
$cfg['default_match'] = '2-9'; // you may determine that automatically by your home world (my homeserver RoF is currently in there...)

// get the world names from the API ...or from the local json, database or whatever (preferred)
$world_names = file_get_contents('../json/gw2_worlds.json');
$world_names = json_decode($world_names, 1);

// create a handy array world_id -> name
$worlds = [];
foreach($world_names as $w){
	$worlds[$w['world_id']] = $w['name_en']; // de/es/fr
}

// fetch match data and sort it (you should cache these too since they change just once a week)
$matches = gw2_api_request('wvw/matches.json');
array_multisort($matches['wvw_matches']);

// prepare the match_id - you may check if the given match_id is valid
$match = isset($_GET['match']) ? $_GET['match'] : $cfg['default_match'];

// now that we have the worlds and matches we can create a nice <select> for later use
$select_options = '';
foreach($matches['wvw_matches'] as $m){
	$info = explode('-', $m['wvw_match_id']); // to determine wether it's NA or EU and get the tier
	$select_options .= '
		<option value="'.$m['wvw_match_id'].'"'.($m['wvw_match_id'] == $match ? ' selected' : '').'>'.($info[0] == 1 ? 'NA' : 'EU').' '.$info[1].'. '.
		$worlds[$m['green_world_id']].' - '.$worlds[$m['blue_world_id']].' - '.$worlds[$m['red_world_id']].'</option>';
	// we need also the world_ids of the selected match, which we'll determine in the loop
	// if you have the matchdata in a DB, you can drop that step
	if($m['wvw_match_id'] == $match){
		$match_worlds = [$m['red_world_id'], $m['blue_world_id'], $m['green_world_id']]; // according to score order in the response
	}
}

// so lets receive the match data and shove it through the grinder
$matchdata = gw2_api_request('wvw/match_details.json?match_id='.$match);
$matchdata = parse_stats($matchdata, $match_worlds, $worlds);

// i'll leave it up to you how to use the matchdata

// prepare the HTML
$html = '<!DOCTYPE html>
<html dir="ltr" lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
	<meta charset="UTF-8"/>
	<title>Guild Wars 2 WvW Stats</title>
	<style type="text/css">

	</style>
</head>
<body>
	<form action="'.basename(__FILE__).'"><select name="match">'.$select_options.'</select>
		<button type="submit">select</button>
	</form>
	<pre>'.print_r($matchdata, 1).'</pre>
</body>
</html>';

// output
echo $html;

?>