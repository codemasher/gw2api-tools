<?php
/**
 * mysqli.inc.php
 * created: 07.07.13
 */

// mysql connection data
$mysql = [
	'server'   => 'localhost',
	'user'     => 'user',
	'password' => 'password',
	'dbname'   => 'dbname'
];

$db = mysqli_init();

// connect to the db
if(!mysqli_real_connect($db, $mysql['server'], $mysql['user'], $mysql['password'], $mysql['dbname'])){
	// note: you sould not expose sql errors to the public on a production system. never. ever.
	exit('Could not connect to the database: '.mysqli_connect_errno().' - '.mysqli_connect_error());
}

// set the connection dataset
if(!mysqli_set_charset($db, 'utf8')){
	exit('Error loading character set utf8: '.mysqli_error($db));
}

?>