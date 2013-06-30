/**
 * gw2Maps.js
 * created: 21.06.13
 *
 * Awesome wiki maps by Smiley
 *
 * based on Cliff's example
 * http://jsfiddle.net/cliff/CRRGC/
 *
 * and Dr. Ishmaels proof of concept
 * http://wiki.guildwars2.com/wiki/User:Dr_ishmael/leaflet
 */

/*
 * TODO
 *
 * switch floors for maps with multiple floors e.g. like Rata Sum
 * i18n for french and spanish
 */

/**
 * @param container_class - the class selector of the map containers
 * @param i18n - an object containing the language strings (currently unused)
 *
 * dataset {
 *     language: int (1=de, 2=en, 3=es, 4=fr),
 *     continent_id: (1=Tyria ,2=The Mists),
 *     floor_id: int,
 *     region_id: non negative int,
 *     map_id: non negative int,
 *     poi_id: non negative int,
 *     poi_type: int (1=poi, 2=sector, 3=task),
 *     disable_controls: bool,
 *     width: non negative int,
 *     w_percent: bool,
 *     height: non negative int,
 *     h_percent: bool
 *     linkbox: int
 *     }
 */
function gw2maps(container_class, i18n){
	$(container_class).each(function(i,c){
		// make sure that any dataset values are number - for wiki security reasons
		// (using filter type integer in the widget extension)
		// exception: the polyline will be a string of comma and space seperated number pairs
		// like: 16661,16788 17514,15935...
		// using preg_replace("#[^,\-\d\s]#", "", $str), so we need to check for valid pairs
		// i don't bother reading the elements dataset for compatibility reasons
		var options = {};
		$.each(c.attributes, function(j,e){
			if(e.name.match(/^data-/)){
				options[e.name.substr(5)] = (e.name === "data-polyline") ? e.value : intval(e.value);
			}
		});

		// prepare i18n
		// this object could also be put outta here and the specific part of it passed as second parameter to the function
		// when passing that thing as parameter, you must also remove or comment the switch below
		// it would reduce the code but also the flexibility - it's your choice ;)
		i18n = {
			de:{
				lang:"de",
				wiki:"http://wiki-de.guildwars2.com/wiki/",
				icon_poi:{link:"http://wiki-de.guildwars2.com/images/0/0f/Sehenswürdigkeit_Icon.png", size:[16,16]},
				icon_skill:{link:"http://wiki-de.guildwars2.com/images/c/c3/Fertigkeitspunkt_Icon.png", size:[20,20]},
				icon_task:{link:"http://wiki-de.guildwars2.com/images/b/b7/Aufgabe_Icon.png", size:[20,20]},
				icon_vista:{link:"http://wiki-de.guildwars2.com/images/9/9f/Aussichtspunkt_Icon.png", size:[20,20]},
				icon_waypoint:{link:"http://wiki-de.guildwars2.com/images/d/df/Wegmarke_Icon.png", size:[24,24]},
				errortile:"http://wiki-de.guildwars2.com/images/6/6f/Kartenhintergrund.png",
				poi:"Sehenswürdigkeiten",
				polyline:"Polylinien",
				sector:"Zonen",
				skill:"Fertigkeitspunkte",
				task:"Aufgaben",
				vista:"Aussichtspunkte",
				waypoint:"Wegpunkte",
				attribution:"Kartendaten und -bilder"
			},
			en:{
				lang:"en",
				wiki:"http://wiki.guildwars2.com/wiki/",
				icon_poi:{link:"http://wiki.guildwars2.com/images/f/fb/Point_of_interest.png", size:[20,20]},
				icon_skill:{link:"http://wiki.guildwars2.com/images/8/84/Skill_point.png", size:[20,20]},
				icon_task:{link:"http://wiki.guildwars2.com/images/f/f8/Complete_heart_(map_icon).png", size:[20,20]},
				icon_vista:{link:"http://wiki.guildwars2.com/images/d/d9/Vista.png", size:[20,20]},
				icon_waypoint:{link:"http://wiki.guildwars2.com/images/d/d2/Waypoint_(map_icon).png", size:[20,20]},
				errortile:"http://wiki-de.guildwars2.com/images/6/6f/Kartenhintergrund.png",
				poi:"Points of Interest",
				polyline:"Polylines",
				sector:"Sector Names",
				skill:"Skill Challenges",
				task:"Tasks",
				vista:"Vistas",
				waypoint:"Waypoints",
				attribution:"Map data and imagery"
			},
			es:{
				lang:"es",
				wiki:"http://wiki-es.guildwars2.com/wiki/",
				icon_poi:{link:"", size:[20,20]},
				icon_skill:{link:"", size:[20,20]},
				icon_task:{link:"", size:[20,20]},
				icon_vista:{link:"", size:[20,20]},
				icon_waypoint:{link:"", size:[20,20]},
				errortile:"http://wiki-de.guildwars2.com/images/6/6f/Kartenhintergrund.png",
				poi:"poi-es",
				polyline:"polyline-es",
				sector:"sector-es",
				skill:"skill-es",
				task:"task-es",
				vista:"vista-es",
				waypoint:"waypoint-es",
				attribution:"attribution-es"
			},
			fr:{
				lang:"fr",
				wiki:"http://wiki-fr.guildwars2.com/wiki/",
				icon_poi:{link:"http://wiki-fr.guildwars2.com/images/d/d2/Icône_site_remarquable_découvert.png", size:[20,20]},
				icon_skill:{link:"http://wiki-fr.guildwars2.com/images/5/5c/Progression_défi.png", size:[20,20]},
				icon_task:{link:"http://wiki-fr.guildwars2.com/images/a/af/Icône_coeur_plein.png", size:[20,20]},
				icon_vista:{link:"http://wiki-fr.guildwars2.com/images/8/82/Icône_panorama.png", size:[20,20]},
				icon_waypoint:{link:"http://wiki-fr.guildwars2.com/images/5/56/Progression_passage.png", size:[20,20]},
				errortile:"http://wiki-de.guildwars2.com/images/6/6f/Kartenhintergrund.png",
				poi:"Sites remarquables",
				polyline:"polyline-fr",
				sector:"Secteurs",
				skill:"Défis de compétences",
				task:"Cœurs",
				vista:"Panoramas",
				waypoint:"Points de passage",
				attribution:"attribution-fr"
			}
		};

		// first of all determine the language (obsolete if i18n is passed as 2nd param)
		switch(options.language){
			case 1: i18n = i18n.de; break;
			case 2: i18n = i18n.en; break;
			case 3: i18n = i18n.es; break;
			case 4: i18n = i18n.fr; break;
			default: i18n = i18n.en; break;
		}

		// check the option values and fall back to defaults if needed
		var	continent_id = (typeof options.continent_id === "number" && options.continent_id >=1 && options.continent_id <= 2) ? options.continent_id : 1,
			floor_id = (typeof options.floor_id === "number") ? options.floor_id : 2,
			region_id = (typeof options.region_id === "number" && options.region_id > 0) ? options.region_id : false,
			map_id = (typeof options.map_id === "number" && options.map_id > 0) ? options.map_id : false,
			poi_id = (typeof options.poi_id === "number" && options.poi_id > 0) ? options.poi_id : false,
			poi_type = (typeof options.poi_type === "number" && options.poi_type > 0) ? options.poi_type : false,
			w_dimension = (options.w_percent == true) ? "%" : "px",
			h_dimension = (options.h_percent == true) ? "%" : "px",
			width = (typeof options.width === "number" && options.width > 0) ? options.width+w_dimension : "800px",
			height = (typeof options.height === "number" && options.height > 0) ? options.height+h_dimension : "450px",
			list = (typeof options.linkbox === "number" && options.linkbox >= 100) ? options.linkbox+"px" : false ,
			// determine the max zoomlevel given in continents.json - Tyria: 7, The Mists: 6
			max_zoom = (continent_id == 1) ? 7 : 6,
			// the map object
			map_controls = (options.disable_controls != true),
			leaf = L.map(c, {minZoom:0, maxZoom:max_zoom, crs:L.CRS.Simple, zoomControl:map_controls, attributionControl:map_controls}),
			// set the layerGroups
			layers = {},
			vistas = L.layerGroup(),
			pois = L.layerGroup(),
			tasks = L.layerGroup(),
			skills = L.layerGroup(),
			waypoints = L.layerGroup(),
			sectors = L.layerGroup(),
			polys =  L.layerGroup(),
			// a container for some links
			linkbox = $('<div class="linkbox" style="width: '+list+'; height: '+height+';" />'),
			up = function(coords){
				return leaf.unproject(coords, max_zoom);
			},
			pan = function(e){
				leaf.panTo(up(e.data.coords)).setZoom(max_zoom);
				if(e.data.text){
					L.popup({offset:new L.Point(0,-5)}).setLatLng(up(e.data.coords)).setContent(e.data.text).openOn(leaf);
				}
			},
			parse_point = function(p){
				var marker = L.marker(up(p.coords), {
					title:p.title,
					icon:p.icon_text && p.icon_text_class ? L.divIcon({className:p.icon_text_class, html:p.icon_text}) : L.icon({iconUrl:p.icon.link, iconSize:p.icon.size, popupAnchor:[0, -p.icon.size[1]/2]})
				});
				if(p.popup){
					marker.bindPopup(p.popup);
				}
				p.layer.addLayer(marker);
				linkbox.append($('<div>'+(p.icon ? '<img src="'+p.icon.link+'" style="width:16px; height:16px" />' : '')+' '+p.text+'</div>')
					.on("click", null, {coords:p.coords, text:p.popup}, pan));
			},
			// the ugly, ugly map parser of lesser uglyness
			parse_map = function (map){
				var	popup_text;
				// loop out the map points
				linkbox.append('<div class="header">'+map.name+'</div>');
				// tasks (hearts)
				linkbox.append('<div class="header sub">'+i18n.task+'</div>');
				$.each(map.tasks, function(){
					popup_text = '<a href="'+i18n.wiki+encodeURIComponent(this.objective.replace(/\.$/, ""))+'" target="_blank">'+this.objective+"</a> ("+this.level+")<br />id:"+this.task_id;
					parse_point({layer:pois, coords:this.coord, title:this.objective, icon:i18n.icon_task, text:"("+this.level+") "+this.objective, popup:popup_text});
					if(poi_id && poi_type && this.task_id === poi_id){
						pan({data:{coords:this.coord, text:popup_text}});
					}
				});
				// pois
				linkbox.append('<div class="header sub">'+i18n.poi+'</div>');
				$.each(map.points_of_interest, function(){
					if(this.type == "waypoint"){
						popup_text = this.name+"<br />id:"+this.poi_id;
						parse_point({layer:waypoints, coords:this.coord, title:this.name, icon:i18n.icon_waypoint, text:this.name, popup:popup_text});
					}
					if(this.type == "landmark"){
						popup_text = '<a href="'+i18n.wiki+encodeURIComponent(this.name)+'" target="_blank">'+this.name+"</a><br />id:"+this.poi_id;
						parse_point({layer:pois, coords:this.coord, title:this.name, icon:i18n.icon_poi, text:this.name, popup:popup_text});
					}
					if(this.type == "vista"){
						popup_text = "id:"+this.poi_id;
						parse_point({layer:vistas, coords:this.coord, title:"id:"+this.poi_id, icon:i18n.icon_vista, text:this.name+' '+this.poi_id, popup:popup_text});
					}
					// we have also a poi? lets find and display it... (actually not beautiful...)
					if(poi_id && poi_type && this.poi_id === poi_id){
						pan({data:{coords:this.coord, text:popup_text}});
					}
				});
				// skill challenges
				linkbox.append('<div class="header sub">'+i18n.skill+'</div>');
				$.each(map.skill_challenges, function(){
					popup_text = this.name+' '+this.coord.toString();
					parse_point({layer:skills, coords:this.coord, title:this.coord.toString(), icon:i18n.icon_skill, text:this.name+' '+this.coord.toString(), popup:popup_text});
				});
				// sector names
				linkbox.append('<div class="header sub">'+i18n.sector+'</div>');
				$.each(map.sectors, function(){
					parse_point({layer:sectors, coords:this.coord, title:this.name+", id:"+this.sector_id, icon_text:this.name, icon_text_class:"sector_text", text:this.name, popup:false});
					if(poi_id && poi_type && this.sector_id === poi_id){
						pan({data:{coords:this.coord, text:false}});
					}
				});
			},
			// the response parser
			parse_response = function(data){
				var bounds, clamp;
				// the map has a clamped view? ok, we use this as bound
				if(data.clamped_view){
					clamp = data.clamped_view;
					bounds = new L.LatLngBounds(up([clamp[0][0], clamp[1][1]]), up([clamp[1][0], clamp[0][1]]));
					leaf.setMaxBounds(bounds).fitBounds(bounds);
				}
				// we display a specific map? so lets use the maps bounds
				else if(region_id && map_id){
					clamp = data.regions[region_id].maps[map_id].continent_rect;
					bounds = new L.LatLngBounds(up([clamp[0][0], clamp[1][1]]), up([clamp[1][0], clamp[0][1]])).pad(0.2);
					leaf.setMaxBounds(bounds).fitBounds(bounds);
				}
				// else use the texture_dims as bounds
				else{
					bounds = new L.LatLngBounds(up([0, data.texture_dims[1]]), up([data.texture_dims[0], 0]));
					leaf.setMaxBounds(bounds).setView(bounds.getCenter(), 0);
				}

				// ok, we want to display a single map
				if(region_id && map_id){
					parse_map(data.regions[region_id].maps[map_id]);
				}
				// else render anything we get
				else{
					$.each(data.regions, function(){
						$.each(this.maps, function(){
							parse_map(this);
						});
					});
				}
			};

		if(list){
			// oh, we want a list containing a list of points - no problem! we'll wrap the map container with a table like construct.
			var uni = Math.random().toString().replace(/\./, ""), // we need a unique container id in case we display more than one map
				row = '<div class="table-row" style="width:'+width+'" />',
				map_cell = '<div id="t-'+uni+'" class="table-cell" style="width:100%;" />',
				list_cell = '<div class="table-cell" />';
			$(c).css({"width":"100%", "height":height}).wrap(row).wrap(map_cell);
			linkbox.insertAfter("#t-"+uni+"").wrap(list_cell);
		}
		else{
			// just set the map container to the given size
			$(c).css({"width":width, "height":height});
		}

		// set the base tiles and add a little copyright info
		L.tileLayer("https://tiles.guildwars2.com/{continent_id}/{floor_id}/{z}/{x}/{y}.jpg", {
			errorTileUrl:i18n.errortile,
			minZoom:0,
			maxZoom:max_zoom,
			continuousWorld:true,
			continent_id:continent_id,
			floor_id:floor_id,
			attribution:i18n.attribution+': <a href="https://forum-en.guildwars2.com/forum/community/api/API-Documentation" target="_blank">GW2 Maps API</a>, &copy;<a href="http://www.arena.net/" target="_blank">ArenaNet</a>'
		}).addTo(leaf);

		// we have a polyline to display?
		if(options.polyline && options.polyline.length > 7){
			var coords = options.polyline.split(" "),
				line = [];
			$.each(coords, function(i,c){
				if(c.match(/\d{1,5},\d{1,5}/)){
					var point = c.split(",");
					line.push(up(point));
				}
			});
			polys.addLayer(L.polyline(line, {color: "#ffe500"}));
		}

		// add layers and a Layer control
		layers[i18n.poi] = pois;
		layers[i18n.sector] = sectors;
		layers[i18n.skill] = skills;
		layers[i18n.task] = tasks;
		layers[i18n.vista] = vistas;
		layers[i18n.waypoint] = waypoints;
		layers[i18n.polyline] = polys;
		if(map_controls){
			L.control.layers(null, layers).addTo(leaf);
		}

		// show stuff on the map
		pois.addTo(leaf);
		polys.addTo(leaf);
		skills.addTo(leaf);
		tasks.addTo(leaf);
		vistas.addTo(leaf);
		waypoints.addTo(leaf);

		// showing the sector names on the initial map would be confusing in most cases,
		// so we'll show them automatically only on higher zoom levels - they're anyway in the layer menu
		if(region_id && map_id || leaf.getZoom() > 4){
			sectors.addTo(leaf);
		}

		// magically display/remove sector names
		leaf.on("zoomend", function(){
			if(leaf.getZoom() > 4){
				sectors.addTo(leaf);
			}
			else{
				leaf.removeLayer(sectors);
			}
		});
/*
		// you may specify more mapevent handlers over here - for example a click handler to annoy people ;)
		leaf.on("click", function(e) {
			L.popup().setLatLng(e.latlng).setContent(leaf.project(e.latlng, max_zoom).toString()).openOn(leaf);
		});
*/
		// get the JSON and start the action
		$.getJSON("https://api.guildwars2.com/v1/map_floor.json?continent_id="+continent_id+"&floor="+floor_id+"&lang="+i18n.lang, parse_response);
	});
}

/**
 *  excerpts from phpJS
 *  @link http://phpjs.org
 */
function intval(mixed_var, base){
	// http://kevin.vanzonneveld.net
	// +   original by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
	// +   improved by: stensi
	// +   bugfixed by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
	// +   input by: Matteo
	// +   bugfixed by: Brett Zamir (http://brett-zamir.me)
	// +   bugfixed by: Rafał Kukawski (http://kukawski.pl)
	// *     example 1: intval('Kevin van Zonneveld');
	// *     returns 1: 0
	// *     example 2: intval(4.2);
	// *     returns 2: 4
	// *     example 3: intval(42, 8);
	// *     returns 3: 42
	// *     example 4: intval('09');
	// *     returns 4: 9
	// *     example 5: intval('1e', 16);
	// *     returns 5: 30
	var tmp;

	var type = typeof(mixed_var);

	if(type === 'boolean'){
		return +mixed_var;
	}
	else if(type === 'string'){
		tmp = parseInt(mixed_var, base || 10);
		return (isNaN(tmp) || !isFinite(tmp)) ? 0 : tmp;
	}
	else if(type === 'number' && isFinite(mixed_var)){
		return mixed_var|0;
	}
	else{
		return 0;
	}
}