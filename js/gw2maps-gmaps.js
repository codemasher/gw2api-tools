/**
 * gw2Maps.js
 * created: 21.06.13
 *
 * Awesome GW2 maps by Smiley
 *
 * based on Cliff's example
 * http://jsfiddle.net/cliff/CRRGC/
 *
 * and Dr. Ishmaels proof of concept
 * http://wiki.guildwars2.com/wiki/User:Dr_ishmael/leaflet
 *
 * requires:
 *
 * - array_multisort and intval from phpjs (included)
 *
 *
 * TODO
 *
 * switch floors for maps with multiple floors e.g. like Rata Sum
 *
 *
 */

// Enable XSS... errr... CORS for Prototype: http://kourge.net/node/131
// the console will tell you: Refused to get unsafe header "X-JSON"
Ajax.Responders.register({
	onCreate: function(response) {
		var t = response.transport;
		t.setRequestHeader = t.setRequestHeader.wrap(function(original, k, v) {
			if (/^(accept|accept-language|content-language)$/i.test(k)){
				return original(k, v);
			}
			if (/^content-type$/i.test(k) && /^(application\/x-www-form-urlencoded|multipart\/form-data|text\/plain)(;.+)?$/i.test(v)){
				return original(k, v);
			}
			return null;
		});
	}
});

var GW2Maps = {
	init: function(container){
		if(typeof container !== "object"){
			return false;
		}
		google.maps.visualRefresh = true;
		var options = GW2Maps.options(container),
			ll2p = function(latlng){
				return GW2Maps.fromLatLngToPoint(latlng, options.max_zoom);
			},
			p2ll = function(point){
				return GW2Maps.fromPointToLatLng(point, options.max_zoom);
			},
			mapobject = {
				continent: options.continent_id,
				linkbox: new Element("div", {"class":"linkbox"}).setStyle({"width": options.linkbox, "height": options.height}),
				map: new google.maps.Map(container, {
					zoom: 3,
					minZoom: 1,
					maxZoom: 7,
					center: new google.maps.LatLng(0,0),
					streetViewControl: false,
					panControl: options.map_controls,
					zoomControl: options.map_controls,
					mapTypeId: options.continent_id.toString(), // string for gmaps' sake
					mapTypeControlOptions: {
						mapTypeIds: ["1","2"]
					}
				}),
				layers: {},
				markers: {},
				popups: []
			},
			get_tile = function(coords,zoom){
				if(coords.y < 0 || coords.x < 0 || coords.y >= (1 << zoom) || coords.x >= (1 << zoom)){
					return "http://wiki-de.guildwars2.com/images/6/6f/Kartenhintergrund.png";
				}
				return "https://tiles.guildwars2.com/"+mapobject.map.getMapTypeId()+"/1/"+zoom+"/"+coords.x+"/"+coords.y+".jpg";
			},
			tile_size = new google.maps.Size(256,256),
			tyria = new google.maps.ImageMapType({maxZoom: 7, alt: "Tyria", name: "Tyria", tileSize: tile_size, getTileUrl: get_tile}),
			mists = new google.maps.ImageMapType({maxZoom: 6, alt: "Die Nebel", name: "Die Nebel", tileSize: tile_size, getTileUrl: get_tile}),
			max_bounds = new google.maps.LatLngBounds(p2ll([0, (1<<options.max_zoom)*256]), p2ll([(1<<options.max_zoom)*256, 0]));

		mapobject.map.mapTypes.set("1",tyria);
		mapobject.map.mapTypes.set("2",mists);

		// first lets prepare our container
		if(options.linkbox){
			// oh, we want a list containing a list of points - no problem! we'll wrap the map container with a table like construct.
			var map_cell = new Element("div", {"class": "table-cell"}).setStyle({"width": "100%"});
			container.setStyle({"width": "100%", "height": options.height}).wrap(map_cell).wrap(new Element("div",{"class": "table-row"}).setStyle({"width": options.width}));
			map_cell.insert({after:mapobject.linkbox.wrap(new Element("div", {"class": "table-cell"}))});
		}
		else{
			// just set the map container to the given size
			container.setStyle({"width": options.width, "height": options.height});
		}

		// lock panning
		google.maps.event.addListener(mapobject.map, "center_changed", function(){
			if(!max_bounds.contains(mapobject.map.getCenter())){
				var center = mapobject.map.getCenter(),
					lng = center.lng(),
					lat = center.lat(),
					lng_max = max_bounds.getNorthEast().lng(),
					lat_max = max_bounds.getNorthEast().lat(),
					lng_min = max_bounds.getSouthWest().lng(),
					lat_min = max_bounds.getSouthWest().lat();
				if(lng < lng_min){lng = lng_min;}
				if(lng > lng_max){lng = lng_max;}
				if(lat < lat_min){lat = lat_min;}
				if(lat > lat_max){lat = lat_max;}
				mapobject.map.panTo(new google.maps.LatLng(lat,lng));
			}
		});


		// return the mapobject for later use
		return mapobject;
	},


	/**
	 *
	 * @param ll
	 * @param max_zoom
	 * @returns {google.maps.Point}
	 */
	fromLatLngToPoint: function(ll, max_zoom){
		var point = new google.maps.Point(0, 0),
			origin = new google.maps.Point(128, 128),
			tiles = 1 << max_zoom,
			bound = function(value, min, max){
				if (min != null) value = Math.max(value, min);
				if (max != null) value = Math.min(value, max);
				return value;
			},
			sin_y = bound(Math.sin(ll.lat() * (Math.PI / 180)), -0.9999, 0.9999);
		point.x = origin.x + ll.lng() * (256 / 360);
		point.y = origin.y + 0.5 * Math.log((1 + sin_y) / (1 - sin_y)) * -(256 / (2 * Math.PI));
		return new google.maps.Point(Math.floor(point.x * tiles), Math.floor(point.y * tiles));
	},

	/**
	 *
	 * @param points
	 * @param max_zoom
	 * @returns {google.maps.LatLng}
	 */
	fromPointToLatLng: function(points, max_zoom) {
		var point = new google.maps.Point(points[0], points[1]),
			size = (1 << max_zoom) * 256,
			lat = (2 * Math.atan(Math.exp((point.y - size/2) / -(size/(2 * Math.PI)))) - (Math.PI / 2)) * (180/Math.PI),
			lng = (point.x - size/2) * (360/size);
		return new google.maps.LatLng(lat, lng);
	},

	/**
	 *
	 * dataset {
	 *     language: int (1=de, 2=en, 3=es, 4=fr),
	 *     continent_id: (1=Tyria ,2=The Mists),
	 *     floor_id: int,
	 *     region_id: non negative int,
	 *     map_id: non negative int,
	 *     poi_id: non negative int,
	 *     poi_type: int (1=landmark, 2=sector, 3=skill, 4=task, 5=vista, 6=waypoint),
	 *     disable_controls: bool,
	 *     width: non negative int,
	 *     w_percent: bool,
	 *     height: non negative int,
	 *     h_percent: bool
	 *     linkbox: non negative int >= 100
	 * }
	 *
	 * @param container
	 * @returns object
	 */
	options: function(container){
		// make sure that any dataset values are number - for wiki security reasons
		// (using filter type integer in the widget extension)
		// exception: the polyline will be a string of comma and space seperated number pairs
		// like: 16661,16788 17514,15935...
		// using preg_replace("#[^,;=\-\d\s\w]#", "", $str), so we need to check for valid pairs
		// i don't bother reading the elements dataset for compatibility reasons
		var dataset = {};
		$A(container.attributes).each(function(c){
			if(c.name.match(/^data-/)){
				dataset[c.name.substr(5)] = (c.name === "data-polyline") ? c.value : phpjs.intval(c.value);
			}
		});

		// check the option values and fall back to defaults if needed
		var lang = ["en","de","en","es","fr"], // 0 is the default language, change to suit your needs
			poi_types = [false, "landmark", "sector", "skill", "task", "vista", "waypoint"],
			continent_id = typeof dataset.continent_id === "number" && dataset.continent_id >=1 && dataset.continent_id <= 2 ? dataset.continent_id : 1;

		return {
			max_zoom: continent_id == 1 ? 7 : 6,
			continent_id: continent_id,
			floor_id: typeof dataset.floor_id === "number" ? dataset.floor_id : 2,
			region_id: typeof dataset.region_id === "number" && dataset.region_id > 0 ? dataset.region_id : false,
			map_id: typeof dataset.map_id === "number" && dataset.map_id > 0 ? dataset.map_id : false,
			poi_id: typeof dataset.poi_id === "number" && dataset.poi_id > 0 ? dataset.poi_id : false,
			poi_type: typeof dataset.poi_type === "number" && dataset.poi_type > 0 && dataset.poi_type <= 6 ? poi_types[dataset.poi_type] : false,
			width: typeof dataset.width === "number" && dataset.width > 0 ? dataset.width+(dataset.w_percent == true ? "%" : "px") : "800px",
			height: typeof dataset.height === "number" && dataset.height > 0 ? dataset.height+(dataset.h_percent == true ? "%" : "px") : "450px",
			map_controls: dataset.disable_controls != true,
			linkbox: typeof dataset.linkbox === "number" && dataset.linkbox >= 100 ? dataset.linkbox+"px" : false,
			polyline: dataset.polyline && dataset.polyline.length > 7 ? dataset.polyline : false,
			i18n: typeof dataset.language === "number" && dataset.language >=1 && dataset.language <= 4 ? GW2Maps.i18n[lang[dataset.language]] : GW2Maps.i18n[lang[0]]
		};
	},

	/**
	 *
	 */
	i18n: {
		de: {
			lang: "de",
			wiki: "http://wiki-de.guildwars2.com/wiki/",
			icon_event: {link: "http://wiki-de.guildwars2.com/images/7/7a/Event_Angriff_Icon.png", size: [24,24]},
			icon_landmark: {link: "http://wiki-de.guildwars2.com/images/0/0f/Sehenswürdigkeit_Icon.png", size: [16,16]},
			icon_skill: {link: "http://wiki-de.guildwars2.com/images/c/c3/Fertigkeitspunkt_Icon.png", size: [20,20]},
			icon_task: {link: "http://wiki-de.guildwars2.com/images/b/b7/Aufgabe_Icon.png", size: [20,20]},
			icon_vista: {link: "http://wiki-de.guildwars2.com/images/9/9f/Aussichtspunkt_Icon.png", size: [20,20]},
			icon_waypoint: {link: "http://wiki-de.guildwars2.com/images/d/df/Wegmarke_Icon.png", size: [24,24]},
			errortile: "http://wiki-de.guildwars2.com/images/6/6f/Kartenhintergrund.png",
			event: "Events",
			landmark: "Sehenswürdigkeiten",
			players: "Spieler",
			polyline: "Polylinien",
			sector: "Zonen",
			skill: "Fertigkeitspunkte",
			task: "Aufgaben",
			vista: "Aussichtspunkte",
			waypoint: "Wegpunkte",
			attribution: "Kartendaten und -bilder"
		},
		en: {
			lang: "en",
			wiki: "http://wiki.guildwars2.com/wiki/",
			icon_event: {link: "http://wiki-de.guildwars2.com/images/7/7a/Event_Angriff_Icon.png", size: [24,24]},
			icon_landmark: {link: "http://wiki.guildwars2.com/images/f/fb/Point_of_interest.png", size: [20,20]},
			icon_skill: {link: "http://wiki.guildwars2.com/images/8/84/Skill_point.png", size: [20,20]},
			icon_task: {link: "http://wiki.guildwars2.com/images/f/f8/Complete_heart_(map_icon).png", size: [20,20]},
			icon_vista: {link: "http://wiki.guildwars2.com/images/d/d9/Vista.png", size: [20,20]},
			icon_waypoint: {link: "http://wiki.guildwars2.com/images/d/d2/Waypoint_(map_icon).png", size: [20,20]},
			errortile: "http://wiki-de.guildwars2.com/images/6/6f/Kartenhintergrund.png",
			event: "Events",
			landmark: "Points of Interest",
			players: "Players",
			polyline: "Polylines",
			sector: "Sector Names",
			skill: "Skill Challenges",
			task: "Tasks",
			vista: "Vistas",
			waypoint: "Waypoints",
			attribution: "Map data and imagery"
		},
		// TODO add es & fr language snippets, es icons
		es: {
			lang:"es",
			wiki: "http://wiki-es.guildwars2.com/wiki/",
			icon_event: {link: "http://wiki-de.guildwars2.com/images/7/7a/Event_Angriff_Icon.png", size: [24,24]},
			icon_landmark: {link: "http://wiki.guildwars2.com/images/f/fb/Point_of_interest.png", size: [20,20]},
			icon_skill: {link: "http://wiki.guildwars2.com/images/8/84/Skill_point.png", size: [20,20]},
			icon_task: {link: "http://wiki.guildwars2.com/images/f/f8/Complete_heart_(map_icon).png", size: [20,20]},
			icon_vista: {link: "http://wiki.guildwars2.com/images/d/d9/Vista.png", size: [20,20]},
			icon_waypoint: {link: "http://wiki.guildwars2.com/images/d/d2/Waypoint_(map_icon).png", size: [20,20]},
			errortile: "http://wiki-de.guildwars2.com/images/6/6f/Kartenhintergrund.png",
			event: "event-es",
			landmark: "poi-es",
			players: "players-es",
			polyline: "polyline-es",
			sector: "sector-es",
			skill: "skill-es",
			task: "task-es",
			vista: "vista-es",
			waypoint: "waypoint-es",
			attribution: "attribution-es"
		},
		fr: {
			lang: "fr",
			wiki: "http://wiki-fr.guildwars2.com/wiki/",
			icon_event: {link: "http://wiki-de.guildwars2.com/images/7/7a/Event_Angriff_Icon.png", size: [24,24]},
			icon_landmark: {link: "http://wiki-fr.guildwars2.com/images/d/d2/Icône_site_remarquable_découvert.png", size: [20,20]},
			icon_skill: {link: "http://wiki-fr.guildwars2.com/images/5/5c/Progression_défi.png", size: [20,20]},
			icon_task: {link: "http://wiki-fr.guildwars2.com/images/a/af/Icône_coeur_plein.png", size: [20,20]},
			icon_vista: {link: "http://wiki-fr.guildwars2.com/images/8/82/Icône_panorama.png", size: [20,20]},
			icon_waypoint: {link: "http://wiki-fr.guildwars2.com/images/5/56/Progression_passage.png", size: [20,20]},
			errortile: "http://wiki-de.guildwars2.com/images/6/6f/Kartenhintergrund.png",
			event: "event-fr",
			landmark: "Sites remarquables",
			players: "players-fr",
			polyline: "polyline-fr",
			sector: "Secteurs",
			skill: "Défis de compétences",
			task: "Cœurs",
			vista: "Panoramas",
			waypoint: "Points de passage",
			attribution: "attribution-fr"
		}
	}
};


/**
 *  excerpts from phpJS
 *  @link http://phpjs.org
 */
var phpjs = {
	intval: function(mixed_var, base){
		var tmp,
			type = typeof(mixed_var);

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
	},
	array_multisort: function(arr){
		var flags = {
				'SORT_REGULAR': 16,
				'SORT_NUMERIC': 17,
				'SORT_STRING': 18,
				'SORT_ASC': 32,
				'SORT_DESC': 40
			},
		//argl = arguments.length,
		//args = arguments,
			sortArrsLength = 0,
			sortArrs = [[]],
			sortKeys = [[]],
			sortFlag = [0],
			g = 0,
			i = 0,
			j,// = 0
			k = '',
			l = 0,
			thingsToSort = [],
			vkey = 0,
			zlast = null,
			nLastSort = [],
			lastSort = [],
			lastSorts = [],
			tmpArray = [],
			elIndex = 0,
			sortDuplicator = function(){//a, b
				return nLastSort.shift();
			},
			sortFunctions = [
				[
					function(a, b){
						lastSort.push(a > b ? 1 : (a < b ? -1 : 0));
						return a > b ? 1 : (a < b ? -1 : 0);
					},
					function(a, b){
						lastSort.push(b > a ? 1 : (b < a ? -1 : 0));
						return b > a ? 1 : (b < a ? -1 : 0);
					}
				],
				[
					function(a, b){
						lastSort.push(a-b);
						return a-b;
					},
					function(a, b){
						lastSort.push(b-a);
						return b-a;
					}
				],
				[
					function(a, b){
						lastSort.push((a+'') > (b+'') ? 1 : ((a+'') < (b+'') ? -1 : 0));
						return (a+'') > (b+'') ? 1 : ((a+'') < (b+'') ? -1 : 0);
					},
					function(a, b){
						lastSort.push((b+'') > (a+'') ? 1 : ((b+'') < (a+'') ? -1 : 0));
						return (b+'') > (a+'') ? 1 : ((b+'') < (a+'') ? -1 : 0);
					}
				]
			];

		if(Object.prototype.toString.call(arr) === '[object Array]'){
			sortArrs[0] = arr;
		}
		else if(arr && typeof arr === 'object'){
			for(i in arr){
				if(arr.hasOwnProperty(i)){
					sortKeys[0].push(i);
					sortArrs[0].push(arr[i]);
				}
			}
		}
		else{
			return false;
		}

		var arrMainLength = sortArrs[0].length, sortComponents = [0, arrMainLength];

		for(j = 1; j < arguments.length; j++){
			if(Object.prototype.toString.call(arguments[j]) === '[object Array]'){
				sortArrs[j] = arguments[j];
				sortFlag[j] = 0;
				if(arguments[j].length !== arrMainLength){
					return false;
				}
			}
			else if(arguments[j] && typeof arguments[j] === 'object'){
				sortKeys[j] = [];
				sortArrs[j] = [];
				sortFlag[j] = 0;
				for(i in arguments[j]){
					if(arguments[j].hasOwnProperty(i)){
						sortKeys[j].push(i);
						sortArrs[j].push(arguments[j][i]);
					}
				}
				if(sortArrs[j].length !== arrMainLength){
					return false;
				}
			}
			else if(typeof arguments[j] === 'string'){
				var lFlag = sortFlag.pop();
				if(typeof flags[arguments[j]] === 'undefined' || ((((flags[arguments[j]]) >>> 4)&(lFlag >>> 4)) > 0)){
					return false;
				}
				sortFlag.push(lFlag+flags[arguments[j]]);
			}
			else{
				return false;
			}
		}

		for(i = 0; i !== arrMainLength; i++){
			thingsToSort.push(true);
		}

		for(i in sortArrs){
			if(sortArrs.hasOwnProperty(i)){
				lastSorts = [];
				tmpArray = [];
				elIndex = 0;
				nLastSort = [];
				lastSort = [];

				if(sortComponents.length === 0){
					if(Object.prototype.toString.call(arguments[i]) === '[object Array]'){
						arguments[i] = sortArrs[i]; // args -> arguments
					}
					else{
						for(k in arguments[i]){
							if(arguments[i].hasOwnProperty(k)){
								delete arguments[i][k];
							}
						}
						sortArrsLength = sortArrs[i].length;
						for(j = 0, vkey = 0; j < sortArrsLength; j++){
							vkey = sortKeys[i][j];
							arguments[i][vkey] = sortArrs[i][j]; // args -> arguments
						}
					}
					delete sortArrs[i];
					delete sortKeys[i];
					continue;
				}

				var sFunction = sortFunctions[(sortFlag[i]&3)][((sortFlag[i]&8) > 0) ? 1 : 0];

				for(l = 0; l !== sortComponents.length; l += 2){
					tmpArray = sortArrs[i].slice(sortComponents[l], sortComponents[l+1]+1);
					tmpArray.sort(sFunction);
					lastSorts[l] = [].concat(lastSort); // Is there a better way to copy an array in Javascript?
					elIndex = sortComponents[l];
					for(g in tmpArray){
						if(tmpArray.hasOwnProperty(g)){
							sortArrs[i][elIndex] = tmpArray[g];
							elIndex++;
						}
					}
				}

				sFunction = sortDuplicator;
				for(j in sortArrs){
					if(sortArrs.hasOwnProperty(j)){
						if(sortArrs[j] === sortArrs[i]){
							continue;
						}
						for(l = 0; l !== sortComponents.length; l += 2){
							tmpArray = sortArrs[j].slice(sortComponents[l], sortComponents[l+1]+1);
							nLastSort = [].concat(lastSorts[l]); // alert(l + ':' + nLastSort);
							tmpArray.sort(sFunction);
							elIndex = sortComponents[l];
							for(g in tmpArray){
								if(tmpArray.hasOwnProperty(g)){
									sortArrs[j][elIndex] = tmpArray[g];
									elIndex++;
								}
							}
						}
					}
				}

				for(j in sortKeys){
					if(sortKeys.hasOwnProperty(j)){
						for(l = 0; l !== sortComponents.length; l += 2){
							tmpArray = sortKeys[j].slice(sortComponents[l], sortComponents[l+1]+1);
							nLastSort = [].concat(lastSorts[l]);
							tmpArray.sort(sFunction);
							elIndex = sortComponents[l];
							for(g in tmpArray){
								if(tmpArray.hasOwnProperty(g)){
									sortKeys[j][elIndex] = tmpArray[g];
									elIndex++;
								}
							}
						}
					}
				}

				zlast = null;
				sortComponents = [];
				for(j in sortArrs[i]){
					if(sortArrs[i].hasOwnProperty(j)){
						if(!thingsToSort[j]){
							if((sortComponents.length&1)){
								sortComponents.push(j-1);
							}
							zlast = null;
							continue;
						}
						if(!(sortComponents.length&1)){
							if(zlast !== null){
								if(sortArrs[i][j] === zlast){
									sortComponents.push(j-1);
								}
								else{
									thingsToSort[j] = false;
								}
							}
							zlast = sortArrs[i][j];
						}
						else{
							if(sortArrs[i][j] !== zlast){
								sortComponents.push(j-1);
								zlast = sortArrs[i][j];
							}
						}
					}
				}

				if(sortComponents.length&1){
					sortComponents.push(j);
				}
				if(Object.prototype.toString.call(arguments[i]) === '[object Array]'){
					arguments[i] = sortArrs[i]; // args -> arguments
				}
				else{
					for(j in arguments[i]){
						if(arguments[i].hasOwnProperty(j)){
							delete arguments[i][j];
						}
					}

					sortArrsLength = sortArrs[i].length;
					for(j = 0, vkey = 0; j < sortArrsLength; j++){
						vkey = sortKeys[i][j];
						arguments[i][vkey] = sortArrs[i][j]; // args -> arguments
					}

				}
				delete sortArrs[i];
				delete sortKeys[i];
			}
		}
		return true;
	}
};