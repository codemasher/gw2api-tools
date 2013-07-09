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

/*
 * TODO
 */

require_once '../inc/mysqli.inc.php';

if(isset($_POST['json'])){
	if(!$data = json_decode($_POST['json'],1)){
		exit('json error.');
	}

	if($data['get'] === 'playerdata'){
		$sql = 'SELECT t1.`player_uid`, t1.`char_name`, t1.`profession`, t1.`guild_id`, t3.`name_de`, t2.`name_de`, t2.`map_id`, t1.`pos_x`, t1.`pos_y`, t1.`pos_angle`, t1.`pos_time`, t2.`map_rect`, t2.`continent_rect`
				FROM `gw2_player_pos` AS t1, `gw2_maps` AS t2, `gw2_worlds` AS t3 WHERE t1.`guild_secret` = ? AND t2.`continent_id` = ? AND t2.`map_id` = t1.`map_id` AND t3.`world_id` = t1.`world_id`';
		$stmt = mysqli_prepare($db, $sql);

		$key = sha1($data['key']);
		$continent = intval($data['continent']);

		mysqli_stmt_bind_param($stmt, 'si', $key, $continent);
		mysqli_stmt_execute($stmt);
		/** @noinspection PhpUndefinedVariableInspection */
		mysqli_stmt_bind_result($stmt, $uid, $charname, $profession, $guild, $world, $map, $map_id, $pos_x, $pos_y, $pos_b, $time, $mr, $cr);

		$arr = [];
		while(mysqli_stmt_fetch($stmt)){
			switch(true){
				case $time < time()-60*60*24: $state = 3; break;
				case $time < time()-60*60*6: $state = 2; break;
				case $time < time()-60*60: $state = 1; break;
				default: $state = 0; break;
			}
			$arr[$uid] = [
				'charname' => $charname,
				'profession' => $profession,
				'guild' => $guild,
				'world' => $world,
				'map' => $map,
				'map_id' => $map_id,
				'pos' => recalc_coords(json_decode($cr,1), json_decode($mr,1), [$pos_x,$pos_y]),
				'angle' => $pos_b * -1,
				'time' => date('d.m.Y - H:i:s', $time),
				'state' => $state
			];
		}

		$arr = json_encode($arr);

		header('Expires: Tue, 23 May 1989 13:37:23 GMT'); // prevent caching
		header('Cache-Control: max-age=0, private, no-store, no-cache, must-revalidate, post-check=0, pre-check=0');
		header('Pragma: no-cache');
		header('Content-type: application/json;charset=utf-8;');
		echo $arr;

	}
	else{
		print_r($data);
	}
}


function recalc_coords($cr, $mr, $p){
	// don't look at it. really! it will melt your brain and make your eyes bleed!
	return [round($cr[0][0]+($cr[1][0]-$cr[0][0])*($p[0]-$mr[0][0])/($mr[1][0]-$mr[0][0])), round($cr[0][1]+($cr[1][1]-$cr[0][1])*(1-($p[1]-$mr [0][1])/($mr[1][1]-$mr[0][1])))];
}

?>