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

/**
 * @param container_class
 *
 * dataset {
 *     map_container: string "container_id_mandatory",
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
 *     }
 */
function gw2maps(container_class){
	$(container_class).each(function(i,c){
		// make sure that any dataset values are number
		// i don't bother reading the elements dataset for compatibility reasons
		var options = {};
		$.each(c.attributes, function(j,e){
			if(e.name.match(/^data-/)){
				options[e.name.substr(5)] = intval(e.value);
			}
		});

		// check the option values and fall back to defaults if needed
		var	continent_id = (typeof options.continent_id === "number" && options.continent_id >=1 && options.continent_id >= 2) ? options.continent_id : 1,
			floor_id = (typeof options.floor_id === "number") ? options.floor_id : 2,
			region_id = (typeof options.region_id === "number" && options.region_id >= 0) ? options.region_id : false,
			map_id = (typeof options.map_id === "number" && options.map_id >= 0) ? options.map_id : false,
			poi_id = (typeof options.poi_id === "number" && options.poi_id >= 0) ? options.poi_id : false,
			poi_type = (typeof options.poi_type === "number" && options.poi_type >= 0) ? options.poi_type : false,
			map_controls = (options.disable_controls != true),
			w_dimension = (options.w_percent == true) ? "%" : "px",
			h_dimension = (options.h_percent == true) ? "%" : "px",
			width = (typeof options.width === "number" && options.width >= 0) ? options.width+w_dimension : "800px",
			height = (typeof options.height === "number" && options.height >= 0) ? options.height+h_dimension : "450px",
			// determine the max zoomlevel given in continents.json - Tyria: 7, The Mists: 6
			mz = (continent_id == 1) ? 7 : 6,
			// the map object
			leaf = L.map(c, {minZoom: 0, maxZoom: mz, crs: L.CRS.Simple, zoomControl: map_controls, attributionControl: map_controls}),
			// some marker icons
			icon_wp = L.icon({iconUrl: "http://gw2.chillerlan.net/img/waypoint.png", iconSize: [20, 20], iconAnchor: [10, 10], popupAnchor: [0, -10]}),
			icon_poi = L.icon({iconUrl: "http://gw2.chillerlan.net/img/poi.png", iconSize: [20, 20], iconAnchor: [10, 10], popupAnchor: [0, -10]}),
			icon_vista = L.icon({iconUrl: "http://gw2.chillerlan.net/img/vista.png", iconSize: [20, 20], iconAnchor: [10, 10], popupAnchor: [0, -10]}),
			icon_heart = L.icon({iconUrl: "http://gw2.chillerlan.net/img/heart.png", iconSize: [20, 20], iconAnchor: [10, 10], popupAnchor: [0, -10]}),
			icon_skill = L.icon({iconUrl: "http://gw2.chillerlan.net/img/skill_point.png", iconSize: [20, 20], iconAnchor: [10, 10], popupAnchor: [0, -10]}),
			// set the layerGroups
			vistas = L.layerGroup(),
			pois = L.layerGroup(),
			tasks = L.layerGroup(),
			skills = L.layerGroup(),
			waypoints = L.layerGroup(),
			sectors = L.layerGroup(),
			// the map parser
			parse_map = function(map){
				// loop out pois
				$.each(map.points_of_interest, function(){
					if(this.type == "waypoint"){
						waypoints.addLayer(L.marker(leaf.unproject(this.coord, mz), {title: this.name, icon: icon_wp}).bindPopup(this.name));
					}
					if(this.type == "landmark"){
						pois.addLayer(L.marker(leaf.unproject(this.coord, mz), {title: this.name, icon: icon_poi})
							.bindPopup('<a href="http://wiki'+wiki+".guildwars2.com/wiki/"+encodeURIComponent(this.name)+'" target="_blank">'+this.name+"</a>"));
					}
					if(this.type == "vista"){
						vistas.addLayer(L.marker(leaf.unproject(this.coord, mz), {icon: icon_vista}));
					}
				});
				// sector names
				$.each(map.sectors, function(){
					sectors.addLayer(L.marker(leaf.unproject(this.coord, mz), {title: this.name, icon: L.divIcon({className: "sector_text", html: this.name})}));
				});
				// skill challenges
				$.each(map.skill_challenges, function(){
					skills.addLayer(L.marker(leaf.unproject(this.coord, mz), {icon: icon_skill}));
				});
				// tasks (hearts)
				$.each(map.tasks, function(){
					tasks.addLayer(L.marker(leaf.unproject(this.coord, mz), {title: this.objective, icon: icon_heart})
						.bindPopup('<a href="http://wiki'+wiki+".guildwars2.com/wiki/"+encodeURIComponent(this.objective.replace(/\.$/, ""))+'" target="_blank">'+this.objective+"</a> ("+this.level+")"));
				});

			},
			// prepare i18n
			wiki,
			lang,
			text = {};

		// first of all determine the language and wiki prefix - integer for wiki security reasons (using filter type integer in the widget extension)
		switch(options.language){
			case 1: lang = "de"; wiki = "-de"; break;
			case 2: lang = "en"; wiki = ""; break;
			case 3: lang = "es"; wiki = "-es"; break;
			case 4: lang = "fr"; wiki = "-fr"; break;
			default: lang = "en"; wiki = ""; break;
		}

		// set the map container to the given size
		$(c).css("width",width).css("height",height).css("background-color","#fff");

		// set the base tiles and add a little copyright info
		L.tileLayer("https://tiles.guildwars2.com/{continent_id}/{floor_id}/{z}/{x}/{y}.jpg", {
			minZoom: 0,
			maxZoom: mz,
			continuousWorld: true,
			continent_id: continent_id,
			floor_id: floor_id,
			attribution: 'Map data and imagery: <a href="https://forum-en.guildwars2.com/forum/community/api/API-Documentation" target="_blank">GW2 Maps API</a>, '+
				'&copy;<a href="http://www.arena.net/" target="_blank">ArenaNet</a>'
		}).addTo(leaf);

		// add a Layer control
		if(map_controls){
			L.control.layers(null, {
				"Points of Interest": pois,
				"Sector Names": sectors,
				"Skill Challenges": skills,
				"Tasks": tasks,
				"Vistas": vistas,
				"Waypoints": waypoints
			}).addTo(leaf);
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

		// you may specify more mapevent handlers over here - for example a click handler:
		leaf.on("click", function(e) {
			console.log("You clicked the map at "+leaf.project(e.latlng));
		});

		// show stuff on the map
		pois.addTo(leaf);
		skills.addTo(leaf);
		tasks.addTo(leaf);
		vistas.addTo(leaf);
		waypoints.addTo(leaf);

		// showing the sector names on the initial map would be confusing in most cases,
		// so we'll show them automatically only on higher zoom levels - they're anyway in the layer menu
		if(region_id && map_id || leaf.getZoom() > 4){
			sectors.addTo(leaf);
		}

		// get the JSON and start the action
		$.getJSON("https://api.guildwars2.com/v1/map_floor.json?continent_id="+continent_id+"&floor="+floor_id+"&lang="+lang, function(data){
			var bounds, clamp;
			// the map has a clamped view? ok, we use this as bound
			if(data.clamped_view){
				clamp = data.clamped_view;
				bounds = new L.LatLngBounds(leaf.unproject([clamp[0][0], clamp[1][1]], mz), leaf.unproject([clamp[1][0], clamp[0][1]], mz));
				leaf.setMaxBounds(bounds).fitBounds(bounds);
			}
			// we display a specific map? so lets use the maps bounds
			else if(region_id && map_id){
				clamp = data.regions[region_id].maps[map_id].continent_rect;
				bounds = new L.LatLngBounds(leaf.unproject([clamp[0][0], clamp[1][1]], mz), leaf.unproject([clamp[1][0], clamp[0][1]], mz)).pad(0.2);
				leaf.setMaxBounds(bounds).fitBounds(bounds);
				// we have also a poi? lets find and display it...
				if(poi_id && poi_type){
					var a, n;
					switch(poi_type){
						//case "skill": a = data.regions[region_id].maps[map_id].skill_challenges; break; //skill challenges don't have ids yet
						case 1:
							a = data.regions[region_id].maps[map_id].points_of_interest;
							n = "poi_id";
							break;
						case 2:
							a = data.regions[region_id].maps[map_id].sectors;
							n = "sector_id";
							break;
						case 3:
							a = data.regions[region_id].maps[map_id].tasks;
							n = "task_id";
							break;
					}

					// workaround to get the given poi_id
					// life could be so easy with data.regions[region_id].maps[map_id].points_of_interest[poi_id];
					$.each(a, function(){
						if(this[n] == poi_id){
							leaf.panTo(leaf.unproject(this.coord, mz)).setZoom(mz);
						}
					});
				}
			}
			// else use the texture_dims as bounds
			else{
				bounds = new L.LatLngBounds(leaf.unproject([0, data.texture_dims[1]], mz), leaf.unproject([data.texture_dims[0], 0], mz));
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
		});
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