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
 * @link http://gw2.chillerlan.net/files/GW2LocationSender-setup.exe (binaries)
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
		// TODO: i18n
		$sql = 'SELECT t1.`player_uid`, t1.`char_name`, t1.`profession`, t1.`guild_id`, t1.`commander`, t3.`name_en`, t2.`continent_id`, t2.`name_en`, t2.`map_id`, t1.`pos_x`, t1.`pos_y`, t1.`pos_angle`, t1.`pos_time`, t2.`continent_rect`, t2.`map_rect`
				FROM `gw2_player_pos` AS t1, `gw2_maps` AS t2, `gw2_worlds` AS t3 WHERE t1.`guild_secret` = ? AND t2.`continent_id` = ? AND t2.`map_id` = t1.`map_id` AND t3.`world_id` = t1.`world_id`';

		// fetch the result via the prepared statements wrapper
		$result = sql_query($sql, [sha1($data['key']), intval($data['continent'])], false);

		$data = [];

		foreach($result as $r){
			// add some player states
			switch(true){
				case $r[12] < time()-3600*24: $state = 3; break; // last seen > 24h ago -> gray
				case $r[12] < time()-3600*6: $state = 2; break; // 6h -> red
				case $r[12] < time()-3600: $state = 1; break; // 1h -> orange
				default: $state = 0; break; // online -> green
			}

			// determine the guild name and tag
			if(preg_match("#^[A-F\d]{8}-(:?[A-F\d]{4}-){3}[A-F\d]{12}$#i", $r[3])){
				$sql = 'SELECT `name`, `tag` FROM `gw2_guilds` WHERE `guild_id` = ? LIMIT 1';
				$guild = sql_query($sql, [$r[3]]);
				// guild not in DB? let's ask the API
				if(!$guild || empty($guild)){
					require_once '../inc/request.inc.php';
					$g_data = gw2_api_request('guild_details.json?guild_id='.$r[3]);
					if(is_array($g_data) && !in_array('error', $g_data)){
						$guild = ['name' => $g_data['guild_name'], 'tag' => $g_data['tag']];
						// while we're at it, we store that guild in the DB
						$sql = 'INSERT INTO `gw2_guilds` (`guild_id`, `name`, `tag`, `emblem`) VALUES (?, ?, ?, ?)';
						$values = [
							$g_data['guild_id'],
							$g_data['guild_name'],
							$g_data['tag'],
							isset($g_data['emblem']) && is_array($g_data['emblem']) ? json_encode($g_data['emblem']) : ''
						];
						sql_query($sql, $values);
					}
				}
				else{
					$guild = $guild[0];
				}
			}
			else{
				$guild = ['name' => '', 'tag' => ''];
			}

			// prepare the output
			$data[$r[0]] = [
				'charname' => $r[1],
				'profession' => $r[2],
				'guild' => $guild,
				'commander' => $r[4],
				'world' => $r[5],
				'continent' => $r[6],
				'map' => $r[7],
				'map_id' => $r[8],
				'pos' => recalc_coords(json_decode($r[13], 1), json_decode($r[14], 1), [$r[9], $r[10]]),
				'angle' => $r[11] * -1,
				'time' => date('d.m.Y - H:i:s', $r[12]),
				'state' => $state
			];
		}

		// prevent caching
		header('Expires: Tue, 23 May 1989 13:37:23 GMT');
		header('Cache-Control: max-age=0, private, no-store, no-cache, must-revalidate, post-check=0, pre-check=0');
		header('Pragma: no-cache');
		// set a json header end output the result
		header('Content-type: application/json;charset=utf-8;');
		echo json_encode($data);

	}
}

// the ugly coordinate recalculation
function recalc_coords($cr, $mr, $p){
	// don't look at it. really! it will melt your brain and make your eyes bleed!
	return [round($cr[0][0]+($cr[1][0]-$cr[0][0])*($p[0]-$mr[0][0])/($mr[1][0]-$mr[0][0])), round($cr[0][1]+($cr[1][1]-$cr[0][1])*(1-($p[1]-$mr[0][1])/($mr[1][1]-$mr[0][1])))];
}

?>