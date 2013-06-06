<?php
/**
 * gw2color.php
 * created: 05.06.13
 *
 * A list of dye colors using the GW2 color API
 *
 * see it live:
 * http://gw2.chillerlan.net/examples/gw2color.php
 *
 */

/*
 * TODO
 */

require_once '../inc/request.inc.php';
require_once '../inc/math.inc.php';
require_once '../inc/color.inc.php';

// prepare the language
$lang = isset($_GET['lang']) && in_array($_GET['lang'], ['de','en','es','fr']) ? $_GET['lang'] : 'en';

// prepare the HTML
$html = '<!DOCTYPE html>
<html dir="ltr" lang="'.$lang.'" xmlns="http://www.w3.org/1999/xhtml">
<head>
	<meta charset="UTF-8"/>
	<title>Dye colors in Guild Wars 2</title>
	<style type="text/css">
		table{border-spacing: 0;}
		td, th{border-right: 1px solid #000;}
		tbody > tr > td:first-of-type{width: 15em;}
		tbody > tr > td:not(first-of-type){width: 5em;}
	</style>
</head>
<body>
	<h1>A list of all dye colors in Guild Wars 2</h1>

	<p>This list is created using the <a target="_blank" href="https://api.guildwars2.com/v1/colors.json">GW2 color API</a>.</p>

	<ul>
		<li><a href="https://forum-en.guildwars2.com/forum/community/api/API-Documentation" target="_blank">GW2 API documentation</a></li>
		<li><a href="https://forum-en.guildwars2.com/forum/community/api/How-To-Colors-API" target="_blank">Discussion</a></li>
		<li><a href="https://gist.github.com/codemasher/b869faa7603e1934c28d" target="_blank">Code example</a></li>
	</ul>

	<p>color language: <a href="?lang=de">german</a> <a href="?lang=en">english</a> <a href="?lang=es">spanish</a> <a href="?lang=fr">french</a></p>';

// fetch color data
$data = gw2_api_request('colors.json?lang='.$lang);

// is there any data in here...?
if(is_array($data) && isset($data['colors'])){
	// sort the array by key (color id)
	ksort($data['colors']);

	// table header
	$html .= '
	<table>
		<thead>
			<tr>
				<th>id/name</th>
				<th colspan="2">cloth</th>
				<th colspan="2">leather</th>
				<th colspan="2">metal</th>
			</tr>
		</thead>
		<tbody>
			<tr style="text-align: center;">
				<td></td>
				<td title="calculated values from hsl">calculated</td>
				<td title="precalculated values">rgb</td>
				<td title="calculated values from hsl">calculated</td>
				<td title="precalculated values">rgb</td>
				<td title="calculated values from hsl">calculated</td>
				<td title="precalculated values">rgb</td>
			</tr>';

	// loop the colors out
	foreach($data['colors'] as $id => $color){
		// calculate the RGB values
		$cloth = apply_color_transform(get_color_matrix($color['cloth']), $color['base_rgb']);
		$cloth = implode(',', $cloth);

		$leather = apply_color_transform(get_color_matrix($color['leather']), $color['base_rgb']);
		$leather = implode(',', $leather);

		$metal = apply_color_transform(get_color_matrix($color['metal']), $color['base_rgb']);
		$metal = implode(',', $metal);

		// precalculated RGB values for reference
		$cloth_pre = implode(',', $color['cloth']['rgb']);
		$leather_pre = implode(',', $color['leather']['rgb']);
		$metal_pre = implode(',', $color['metal']['rgb']);

		$html .= '
			<tr>
				<td><a href="#'.$id.'" name="'.$id.'">'.$id.'</a> <b>'.$color['name'].'</b></td>
				<td style="background:rgb('.$cloth.');" title="rgb('.$cloth.')"></td>
				<td style="background:rgb('.$cloth_pre.');" title="rgb('.$cloth_pre.')"></td>
				<td style="background:rgb('.$leather.');" title="rgb('.$leather.')"></td>
				<td style="background:rgb('.$leather_pre.');" title="rgb('.$leather_pre.')"></td>
				<td style="background:rgb('.$metal.');" title="rgb('.$metal.')"></td>
				<td style="background:rgb('.$metal_pre.');" title="rgb('.$metal_pre.')"></td>
			</tr>';
	}

	// close the table
	$html .= '
		</tbody>
	</table>';

}

// close HTML
$html .= '
</body>
</html>';

// output that stuff
echo $html;

?>