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
	if(mb_strlen($data['character_data']['name']) > 19){
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
		// overflow servers seem to return negative garbage values
		intval($data['character_data']['world_id']) < 0 ? 0 : intval($data['character_data']['world_id']),
		intval($data['character_data']['map_id']),
		floatval($data['avatar_position'][0]),
		floatval($data['avatar_position'][1]),
		intval($data['avatar_front']),
		time()
	];

	// copy values to reference for bind_param's sake
	// see: http://www.php.net/manual/en/mysqli-stmt.bind-param.php
	$references = [];
	foreach($values as $k => &$v) {
		$references[$k] = &$v;
	}

	// add the datatypes to the top of the $references array
	array_unshift($references, 'sssiiissiiddii');

	// prepare the SQL statement
	$sql = 'REPLACE INTO `gw2_player_pos` (`player_uid`, `acc_name`, `char_name`, `profession`, `team_color`, `commander`, `guild_id`, `guild_secret`, `world_id`, `map_id`, `pos_x`, `pos_y`, `pos_angle`, `pos_time`)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
	$stmt = mysqli_prepare($db, $sql);

	// bind the params to $stmt and execute
	call_user_func_array([$stmt, 'bind_param'], $references);
	mysqli_stmt_execute($stmt);

	// the location sender will print the raw response text in it's log
	print_r($data);
}
// anything else is an invalid request
else{
	exit('invalid request');
}
?>