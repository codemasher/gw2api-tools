<?php
/**
 * mysqli.inc.php
 * created: 07.07.13
 */

// mysql connection data
$mysql = [
	'server'   => 'server',
	'user'     => 'user',
	'password' => 'password',
	'dbname'   => 'dbname'
];

// connect to the db
$db = mysqli_init();

if(!mysqli_real_connect($db, $mysql['server'], $mysql['user'], $mysql['password'], $mysql['dbname'])){
	// note: you sould not expose sql errors to the public on a production system. never. ever.
	exit('Could not connect to the database: '.mysqli_connect_errno().' - '.mysqli_connect_error());
}

?>