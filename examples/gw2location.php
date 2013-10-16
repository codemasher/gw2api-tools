<?php
/**
 * gw2location-receiver.php
 * created: 06.07.13
 * by Smiley
 *
 * GW2 location provider backend: Location receiver
 *
 * Location sender by Heimdall.4510:
 * @link https://gw2apicpp.codeplex.com/ (source)
 * @link http://gw2.chillerlan.net/files/GW2LocationSender-setup.exe (binaries)
 *
 * TODO
 * check for existing id
 * REPLACE -> UPDATE
 * store a marker pos
 */

require_once '../inc/mysqli.inc.php';

// receive data from the location-sender
if(isset($_POST['data']) && !empty($_POST['data'])){
	// decode the json
	if(!$data = json_decode($_POST['data'],1)){
		exit('json error');
	}

	// check for illegal characters in the account name
	preg_match('#(?P<name>^[a-z\s]+.[\d]{4}$)#i', $data['account_name'], $pcre_acc);
	if(empty($pcre_acc)){
		// we need a valid account name to work - so exit here if it doesn't match because it's possibly a hacking attempt
		exit('invalid account name');
	}

	// check the length of the charname
	if(mb_strlen($data['character_data']['name'], 'UTF-8') > 19){
		// everything > 19 bytes is possibly a hacking attempt due to ArenaNet's naming guidelines
		exit('charname too long');
	}

	// check for any XSS relevant characters in the charname (you can be more restrictive, actually), see:
	// https://www.owasp.org/index.php/XSS_(Cross_Site_Scripting)_Prevention_Cheat_Sheet#RULE_.231_-_HTML_Escape_Before_Inserting_Untrusted_Data_into_HTML_Element_Content
	preg_match('#([\d\'&<>"/])#', $data['character_data']['name'], $pcre_char);
	if(!empty($pcre_char)){
		// any invalid character in the name can be considered as hacking attempt
		exit('invalid characters in the charname');
	}

	// check the guild id if it's not empty
	if(!empty($data['guild_id'])){
		preg_match('#(?P<id>^[a-f\d]{8}-(:?[a-f\d]{4}-){3}[a-f\d]{12}$)#i', $data['guild_id'], $pcre_guild);
		if(empty($pcre_guild)){
			// if the guild id doesn't match, it's possibly a hacking attempt. surprisingly.
			exit('invalid guild id');
		}
	}
	else{
		$pcre_guild['id'] = '';
	}

	// same with the channel id
	if(!empty($data['channel_id'])){
		preg_match('#(?P<id>^[a-f\d]{40}$)#i', $data['channel_id'], $pcre_channel);
		if(empty($pcre_channel)){
			// ...ya know...
			exit('invalid channel id');
		}
	}
	else{
		$pcre_channel['id'] = '';
	}

	// prepare the SQL statement
	$sql = 'REPLACE INTO `gw2_player_pos` (`player_uid`, `acc_name`, `char_name`, `profession`, `team_color`, `commander`, `guild_id`, `guild_secret`, `world_id`, `map_id`, `pos_x`, `pos_y`, `pos_angle`, `pos_time`)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';

	// prepare values
	// keep in mind, that you may receive postdata from anywhere, not just the location sender, so sanitize your data!
	$values = [
		sha1($pcre_acc['name']),
		$pcre_acc['name'],
		$data['character_data']['name'],
		intval($data['character_data']['profession']),
		intval($data['character_data']['team_color_id']),
		intval($data['character_data']['commander']),
		$pcre_guild['id'],
		$pcre_channel['id'],
		// clamp the world IDs since overflow and WvW servers seem to return garbage values
		intval($data['character_data']['world_id']) < 1001 || intval($data['character_data']['world_id']) > 2206 ? 0 : intval($data['character_data']['world_id']),
		intval($data['character_data']['map_id']),
		floatval($data['avatar_position'][0]),
		floatval($data['avatar_position'][1]),
		intval($data['avatar_front']),
		time()
	];

	// execute the statement
	sql_query($sql, $values);

	// the location sender will print the raw response text in it's log
	print_r($data);
}
// process the ajax request
else if(isset($_POST['json'])){
	// enable CORS - in some cases you may als need to add this line to a .htaccess in this file's directory
	// Header set Access-Control-Allow-Origin "*"
	header("Access-Control-Allow-Origin: *");
	header("Access-Control-Expose-Headers: X-JSON");
	// prevent caching
	header('Expires: Tue, 23 May 1989 13:37:23 GMT');
	header('Cache-Control: max-age=0, private, no-store, no-cache, must-revalidate, post-check=0, pre-check=0');
	header('Pragma: no-cache');
	// set a json header end output the result
	header('Content-type: application/json;charset=utf-8;');

	// no postdata? KTHXBYE!
	if(!$data = json_decode($_POST['json'],1)){
		// in case of an error just print the input data to receive it in the browsers console
		//print_r($_POST['json']);
		$err['error'] = 'json error.';
		$err['msg'] = $_POST['json'];
		echo json_encode($err);
		exit;
	}

	if($data['get'] === 'playerdata'){
		// TODO: i18n
		$sql = 'SELECT t1.`player_uid`, t1.`char_name`, t1.`profession`, t1.`guild_id`, t1.`commander`, t3.`name_en`, t2.`continent_id`, t2.`name_en`, t2.`map_id`, t1.`pos_x`, t1.`pos_y`, t1.`pos_angle`, t1.`pos_time`, t2.`continent_rect`, t2.`map_rect`
				FROM `gw2_player_pos` AS t1, `gw2_maps` AS t2, `gw2_worlds` AS t3 WHERE t1.`guild_secret` = ? AND t2.`continent_id` = ? AND t2.`map_id` = t1.`map_id` AND t3.`world_id` = t1.`world_id`';

		// fetch the result via the prepared statements wrapper
		$result = sql_query($sql, [$data['key'], intval($data['continent'])], false);

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
				if(!$guild || empty($guild) || !is_array($guild)){
					require_once '../inc/request.inc.php';
					$g = gw2_api_request('guild_details.json?guild_id='.$r[3]);
					if(is_array($g) && !in_array('error', $g)){
						$guild = ['name' => $g['guild_name'], 'tag' => $g['tag']];
						// while we're at it, we store that guild in the DB
						$sql = 'INSERT INTO `gw2_guilds` (`guild_id`, `name`, `tag`, `emblem`) VALUES (?, ?, ?, ?)';
						$values = [
							$g['guild_id'],
							$g['guild_name'],
							$g['tag'],
							isset($g['emblem']) && is_array($g['emblem']) ? json_encode($g['emblem']) : ''
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

		if(count($data) > 0){
			echo json_encode($data);
		}
		else{
			$err['error'] = 'no results.';
			$err['msg'] = 'go along, nothing to see here.';
			echo json_encode($err);
			exit;
		}

	}
}
// anything else is an invalid request
else{
	exit('invalid request');
}


// the ugly coordinate recalculation
function recalc_coords($cr, $mr, $p){
	// don't look at it. really! it will melt your brain and make your eyes bleed!
	return [round($cr[0][0]+($cr[1][0]-$cr[0][0])*($p[0]-$mr[0][0])/($mr[1][0]-$mr[0][0])), round($cr[0][1]+($cr[1][1]-$cr[0][1])*(1-($p[1]-$mr[0][1])/($mr[1][1]-$mr[0][1])))];
}

?>