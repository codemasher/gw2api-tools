<?php
/**
 * gw2location-receiver.php
 * created: 06.07.13
 *
 * GW2 location provider backend
 *
 * Location sender by Heimdall:
 * @link https://gw2apicpp.codeplex.com/ (source)
 * @link http://gw2.chillerlan.net/files/gw2location.zip (binaries)
 *
 */

require_once '../inc/mysqli.inc.php';

// receive data from the location-sender
if(isset($_POST['data']) && !empty($_POST['data'])){
	// decode the json
	if(!$data = json_decode($_POST['data'],1)){
		exit('json error.');
	}

	// prepare values
	$values = [
		sha1($data['account_name']),
		$data['account_name'],
		$data['name'],
		$data['guild_id'],
		$data['channel_id'],
		$data['world_id'],
		$data['map_id'],
		$data['avatar_position'][0],
		$data['avatar_position'][1],
		$data['avatar_front'],
		time()
	];

	// copy values to reference for bind_param's sake
	// see: http://www.php.net/manual/en/mysqli-stmt.bind-param.php
	$references = [];
	foreach($values as $k => &$v) {
		$references[$k] = &$v;
	}

	// add the datatypes to the top of the $references array
	array_unshift($references, 'sssssiidddi');

	// prepare the SQL statement
	$sql = 'REPLACE INTO `gw2_player_pos` (`player_uid`, `acc_name`, `char_name`, `guild_id`, `guild_secret`, `world_id`, `map_id`, `pos_x`, `pos_y`, `pos_angle`, `pos_time`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
	$stmt = mysqli_prepare($db, $sql);

	// bind the params to $stmt and execute
	call_user_func_array([$stmt, 'bind_param'], $references);
	mysqli_stmt_execute($stmt);

	print_r($data);
}

?>