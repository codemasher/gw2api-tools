<?php
/**
 * gw2location-ajax.php
 * created: 07.07.13
 * by Smiley
 *
 * GW2 location provider backend: AJAX Response
 *
 * Location sender by Heimdall.4510:
 * @link https://gw2apicpp.codeplex.com/ (source)
 * @link http://gw2.chillerlan.net/files/gw2location.zip (binaries)
 *
 */

require_once '../inc/mysqli.inc.php';

if(isset($_POST['json'])){
	// no postdata? KTHXBYE!
	if(!$data = json_decode($_POST['json'],1)){
		// in case of an error just print the input data to receive it in the browsers console
		print_r($_POST['json']);
		exit;
	}

	if($data['get'] === 'playerdata'){
		// prepare the SQL statement - theres actually no need for a prepared statement in this case
		// since we do a type conversion of the input variables (key -> sha1, continent -> intval)
		// it's just to show best practice ;)
		// TODO: i18n
		$sql = 'SELECT t1.`player_uid`, t1.`char_name`, t1.`profession`, t1.`guild_id`, t3.`name_en`, t2.`continent_id`, t2.`name_en`, t2.`map_id`, t1.`pos_x`, t1.`pos_y`, t1.`pos_angle`, t1.`pos_time`, t2.`map_rect`, t2.`continent_rect`
				FROM `gw2_player_pos` AS t1, `gw2_maps` AS t2, `gw2_worlds` AS t3 WHERE t1.`guild_secret` = ? AND t2.`continent_id` = ? AND t2.`map_id` = t1.`map_id` AND t3.`world_id` = t1.`world_id`';
		$stmt = mysqli_prepare($db, $sql);

		// prepare the values
		$channel_key = sha1($data['key']);
		$continent = intval($data['continent']);

		// bind & execute
		mysqli_stmt_bind_param($stmt, 'si', $channel_key, $continent);
		mysqli_stmt_execute($stmt);

		// fetch the results (the following comment is for PhpStorm's sake...)
		/** @noinspection PhpUndefinedVariableInspection */
		mysqli_stmt_bind_result($stmt, $uid, $charname, $profession, $guild_id, $world, $continent_id, $map, $map_id, $pos_x, $pos_y, $pos_c, $time, $mr, $cr);

		$result = [];
		while(mysqli_stmt_fetch($stmt)){
			// add some player states
			switch(true){
				case $time < time()-3600*24: $state = 3; break; // last seen > 24h ago -> gray
				case $time < time()-3600*6: $state = 2; break; // 6h -> red
				case $time < time()-3600: $state = 1; break; // 1h -> orange
				default: $state = 0; break; // online -> green
			}

			// prepare the result row - make sure that the strings are utf-8 encoded, otherwise json_encode will fail
			$result[$uid] = [
				'charname' => $charname,
				'profession' => $profession,
				'guild' => $guild_id,
				'world' => $world,
				'continent' => $continent_id,
				'map' => $map,
				'map_id' => $map_id,
				'pos' => recalc_coords(json_decode($cr,1), json_decode($mr,1), [$pos_x,$pos_y]),
				'angle' => $pos_c * -1,
				'time' => date('d.m.Y - H:i:s', $time),
				'state' => $state
			];
		}
		mysqli_stmt_free_result($stmt);

		// determine the guild name and tag
		// (we can't do this while fetching the results, so we need to loop through again - see: http://stackoverflow.com/a/614741)
		foreach($result as $key => $value){
			if(preg_match("#^[A-F\d]{8}-(:?[A-F\d]{4}-){3}[A-F\d]{12}$#", $value['guild'])){

				// since the guild id is from a "trusted" source and we've just preg_match'ed it, we can use an "unsafe" query here
				$sql = 'SELECT `name`, `tag` FROM `gw2_guilds` WHERE `guild_id` = \''.mysqli_real_escape_string($db, $value['guild']).'\' ';
				$query = mysqli_query($db, $sql);
				$guild = mysqli_fetch_assoc($query);
				mysqli_free_result($query);
				$result[$key]['guild'] = $guild;

				// guild not in DB? let's ask the API
				if(!$query || !$guild || empty($guild['name'])){
					require_once '../inc/request.inc.php';
					$g_data = gw2_api_request('guild_details.json?guild_id='.$value['guild']);
					if(is_array($g_data) && !in_array('error', $g_data)){
						$result[$key]['guild'] = ['name' => $g_data['guild_name'], 'tag' => $g_data['tag']];

						// while we're at it, we store that guild in the DB
						$sql = 'INSERT INTO `gw2_guilds` (`guild_id`, `name`, `tag`, `emblem`) VALUES (?, ?, ?, ?)';
						$stmt = mysqli_prepare($db, $sql);

						$g_id = $g_data['guild_id'];
						$g_name = $g_data['guild_name'];
						$g_tag = $g_data['tag'];
						$g_emblem = isset($g_data['emblem']) && is_array($g_data['emblem']) ? json_encode($g_data['emblem']) : '';

						mysqli_stmt_bind_param($stmt, 'ssss', $g_id, $g_name, $g_tag, $g_emblem);
						mysqli_stmt_execute($stmt);
					}
				}
			}
			else{
				$result[$key]['guild'] = ['name' => '', 'tag' => ''];
			}
		}

		// prevent caching
		header('Expires: Tue, 23 May 1989 13:37:23 GMT');
		header('Cache-Control: max-age=0, private, no-store, no-cache, must-revalidate, post-check=0, pre-check=0');
		header('Pragma: no-cache');
		// set a json header end output the result
		header('Content-type: application/json;charset=utf-8;');
		echo json_encode($result);
	}
}

// the ugly coordinate recalculation
function recalc_coords($cr, $mr, $p){
	// don't look at it. really! it will melt your brain and make your eyes bleed!
	return [round($cr[0][0]+($cr[1][0]-$cr[0][0])*($p[0]-$mr[0][0])/($mr[1][0]-$mr[0][0])), round($cr[0][1]+($cr[1][1]-$cr[0][1])*(1-($p[1]-$mr [0][1])/($mr[1][1]-$mr[0][1])))];
}

?>