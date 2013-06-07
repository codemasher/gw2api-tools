<?php
/**
 * gw2emblems.php
 * created: 06.06.13
 *
 * Approach to create guild emblems on the fly using the gw2 guild & color APIs
 * Based on the script by Moturdrn.2837
 * https://gist.github.com/moturdrn/9d03a0cd4967828ac6cc
 *
 * Image parts download provided by:
 * Dr Ishmael.9685 (original ingame textures, 3 parts, contains the background images used by this script)
 * https://docs.google.com/file/d/0B5NobLNMdY89TVFiU3NjSUdCOEE/edit
 *
 * Moturdrn.2837 (foreground images only, combined, 2 parts, used by the script)
 * https://docs.google.com/file/d/0B2y4ZZsTcmTXa25Fa2huemx2MjA/edit
 *
 * see it live:
 * http://gw2.chillerlan.net/examples/gw2emblems.php?guild_id=75FD83CF-0C45-4834-BC4C-097F93A487AF
 *
 */

/*
 * TODO
 *
 * find out the right way to postprocess the images
 *
 */

require_once '../inc/request.inc.php';
require_once '../inc/math.inc.php';
require_once '../inc/color.inc.php';
require_once '../inc/image.inc.php';

// some settings
$cfg['bg_path'] = '../img/background/'; // trailing slash!
$cfg['fg_path'] = '../img/foreground/';
$cfg['ca_path'] = '../img/cache/';
$cfg['error_image'] = '../img/404-quaggan.png';

// get the size and clamp if needed
$size = isset($_GET['size']) && !empty($_GET['size']) ? max(40, min(256, intval($_GET['size']))) : 256;

// i cant't work without guild data...
if(!isset($_GET['guild_id']) || empty($_GET['guild_id'])){
	image_error($size);
}

// cache path/image name
$cache = $cfg['ca_path'].md5($_GET['guild_id'].$size).'.png';

// first check if there is a cached image
if(is_file($cache)){
	header('Content-type: image/png');
	readfile($cache);
	exit();
}

// get guild data. it's recommended to build a local guild database to increase performance
$data = gw2_api_request('guild_details.json?guild_id='.$_GET['guild_id']);
if(!$data || !is_array($data) || in_array('error', $data)){
	image_error($size);
}

// it's highly recommended to pull the color data (~160kb API response) from a database or local .json since it's pretty static
$colors = file_get_contents('../json/gw2_colors.json');
$colors = json_decode($colors, 1);

// get the color arrays
$bgc = $colors['colors'][$data['emblem']['background_color_id']]['cloth'];
$fc1 = $colors['colors'][$data['emblem']['foreground_primary_color_id']]['cloth'];
$fc2 = $colors['colors'][$data['emblem']['foreground_secondary_color_id']]['cloth'];

// determine the filenames+path
$img_p = $cfg['bg_path'].$data['emblem']['background_id'].'.png';
$fi1_p = $cfg['fg_path'].$data['emblem']['foreground_id'].'a.png';
$fi2_p = $cfg['fg_path'].$data['emblem']['foreground_id'].'b.png';

if(!is_file($img_p) || !is_file($fi1_p) || !is_file($fi2_p)){
	image_error($size);
}

// fetch the images
$img = imagecreatefrompng($img_p);
$fi1 = imagecreatefrompng($fi1_p);
$fi2 = imagecreatefrompng($fi2_p);

// Apply transparency information for the background - PHP GD Base image issue
imagecolortransparent($img, imagecolorallocate($img, 255, 255, 255));
imagealphablending($img, true);
imagesavealpha($img, true);

// re-color images
imagehue($img, $bgc);
imagehue($fi1, $fc1);
imagehue($fi2, $fc2);

// apply filters like i've described over here:
// https://forum-en.guildwars2.com/forum/community/api/API-Suggestion-Guilds/2155863
// not yet perfect, but the results are ok..
imagefilter($img, IMG_FILTER_CONTRAST, $bgc['contrast']);
imagefilter($img, IMG_FILTER_COLORIZE, $bgc['rgb'][0], $bgc['rgb'][1],$bgc['rgb'][2]);
imagefilter($fi1, IMG_FILTER_CONTRAST, $fc1['contrast']);
imagefilter($fi1, IMG_FILTER_COLORIZE, $fc1['rgb'][0], $fc1['rgb'][1],$fc1['rgb'][2]);
imagefilter($fi2, IMG_FILTER_CONTRAST, $fc2['contrast']);
imagefilter($fi2, IMG_FILTER_COLORIZE, $fc2['rgb'][0], $fc2['rgb'][1],$fc2['rgb'][2]);

// Combine the primary and secondary emblem image
imagecopy($fi1, $fi2, 0, 0, 0, 0, 256, 256);

//apply flags
if(in_array('FlipBackgroundHorizontal', $data['emblem']['flags'])){$img = image_flip($img, 'h');}
if(in_array('FlipBackgroundVertical', $data['emblem']['flags'])){$img = image_flip($img, 'v');}
if(in_array('FlipForegroundHorizontal', $data['emblem']['flags'])){$fi1 = image_flip($fi1, 'h');}
if(in_array('FlipForegroundVertical', $data['emblem']['flags'])){$fi1 = image_flip($fi1, 'v');}

// Combine the emblem and background
imagecopy($img, $fi1, 0, 0, 0, 0, 256, 256);

// resize and save to cache
if($size < 256){
	$thumb = imagecreate($size, $size);
	imagecopyresampled($thumb, $img, 0, 0, 0, 0, $size, $size, 256, 256);
	imagepng($thumb, $cache);
	imagedestroy($thumb);
}
else{
	imagepng($img, $cache);
}

// output and clean up
header('Content-type: image/png');
readfile($cache);
imagedestroy($img);
imagedestroy($fi1);
imagedestroy($fi2);

?>