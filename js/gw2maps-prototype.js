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
 * - Leaflet polyline decorator (not included, https://github.com/bbecquet/Leaflet.PolylineDecorator)
 *
 *
 * TODO
 *
 * switch floors for maps with multiple floors e.g. like Rata Sum
 */

// Enable XSS... errr... CORS for Prototype: http://kourge.net/node/131
// the console will tell you: Refused to get unsafe header "X-JSON"
Ajax.Responders.register({
	onCreate: function(response) {
//		if (response.request.isSameOrigin())
//			return;
		var t = response.transport;
		t.setRequestHeader = t.setRequestHeader.wrap(function(original, k, v) {
			if (/^(accept|accept-language|content-language)$/i.test(k) || (/^content-type$/i.test(k) && /^(application\/x-www-form-urlencoded|multipart\/form-data|text\/plain)(;.+)?$/i.test(v)))
				return original(k, v);
			return;
		});
	}
});


var GW2Maps = {
	/**
	 * @param container
	 * @returns object|bool
	 */
	init: function(container){
		if(typeof container !== "object"){
			return false;
		}
		var options = GW2Maps.options(container),
			mapobject = {
				map: L.map(container, {
					//minZoom: 0,
					maxZoom: options.max_zoom,
					crs: L.CRS.Simple,
					zoomControl: options.map_controls,
					attributionControl: options.map_controls
				}),
				layers: {},
				linkbox: new Element("div", {"class":"linkbox"}).setStyle({"width": options.linkbox, "height": options.height}),
				continent: options.continent_id
			};

		// resize the container to the current viewport size
		//container.setStyle({"height":document.viewport.getHeight()+"px"});

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

		// set the base tiles and add a little copyright info
		L.tileLayer("https://tiles.guildwars2.com/{continent_id}/{floor_id}/{z}/{x}/{y}.jpg", {
			errorTileUrl: options.i18n.errortile,
			//minZoom: 0,
			maxZoom: options.max_zoom,
			continuousWorld: true,
			continent_id: options.continent_id,
			floor_id: options.floor_id,
			attribution: options.i18n.attribution+': <a href="https://forum-en.guildwars2.com/forum/community/api/API-Documentation" target="_blank">GW2 Maps API</a>, &copy;<a href="http://www.arena.net/" target="_blank">ArenaNet</a>'
		}).addTo(mapobject.map);

		// add layergroups and show them on the map
		mapobject.layers[options.i18n.event] = L.layerGroup();
		mapobject.layers[options.i18n.landmark] = L.layerGroup();
		mapobject.layers[options.i18n.polyline] = L.layerGroup();
		mapobject.layers[options.i18n.players] = L.layerGroup();
		mapobject.layers[options.i18n.players].addTo(mapobject.map);
		mapobject.layers[options.i18n.skill] = L.layerGroup();
		mapobject.layers[options.i18n.task] = L.layerGroup();
		mapobject.layers[options.i18n.vista] = L.layerGroup();
		mapobject.layers[options.i18n.waypoint] = L.layerGroup();
		mapobject.layers[options.i18n.waypoint].addTo(mapobject.map);
		mapobject.layers[options.i18n.sector] = L.layerGroup();
		// showing all the stuff on the initial map would be confusing in most cases,
		// so we'll show it automatically only on higher zoom levels - it's in the layer menu anyway
		if(mapobject.map.getZoom() > 3){
			mapobject.layers[options.i18n.landmark].addTo(mapobject.map);
			mapobject.layers[options.i18n.skill].addTo(mapobject.map);
			mapobject.layers[options.i18n.task].addTo(mapobject.map);
			mapobject.layers[options.i18n.vista].addTo(mapobject.map);
		}
		if(mapobject.map.getZoom() > 4){
			mapobject.layers[options.i18n.polyline].addTo(mapobject.map);
		}
		if(options.region_id && options.map_id || mapobject.map.getZoom() > 5){
			mapobject.layers[options.i18n.sector].addTo(mapobject.map);
			mapobject.layers[options.i18n.event].addTo(mapobject.map);
		}

		// a Layer control if wanted
		if(options.map_controls){
			L.control.layers(null, mapobject.layers).addTo(mapobject.map);
		}

		// we have polylines to display?
		if(options.polyline && options.polyline.length > 7){
			GW2Maps.parse_polylines(mapobject, options);
		}

		// magically display/remove icons
		// the checkbox in the layer menu will not update - bug?
		mapobject.map.on("zoomend", function(){
			var z = mapobject.map.getZoom();
			z > 5 ? mapobject.layers[options.i18n.event].addTo(mapobject.map) : mapobject.map.removeLayer(mapobject.layers[options.i18n.event]);
			z > 5 ? mapobject.layers[options.i18n.sector].addTo(mapobject.map) : mapobject.map.removeLayer(mapobject.layers[options.i18n.sector]);
			z > 4 ? mapobject.layers[options.i18n.polyline].addTo(mapobject.map) : mapobject.map.removeLayer(mapobject.layers[options.i18n.polyline]);
			z > 3 ? mapobject.layers[options.i18n.landmark].addTo(mapobject.map) : mapobject.map.removeLayer(mapobject.layers[options.i18n.landmark]);
			z > 3 ? mapobject.layers[options.i18n.skill].addTo(mapobject.map) : mapobject.map.removeLayer(mapobject.layers[options.i18n.skill]);
			z > 3 ? mapobject.layers[options.i18n.task].addTo(mapobject.map) : mapobject.map.removeLayer(mapobject.layers[options.i18n.task]);
			z > 3 ? mapobject.layers[options.i18n.vista].addTo(mapobject.map) : mapobject.map.removeLayer(mapobject.layers[options.i18n.vista]);
		});

		// you may specify more mapevent handlers over here - for example a click handler to annoy people ;)
		mapobject.map.on("click", function(event){
//			L.popup().setLatLng(event.latlng).setContent(mapobject.map.project(event.latlng, options.max_zoom).toString()).openOn(mapobject.map);
			console.log(mapobject.map.project(event.latlng, options.max_zoom).toString());
		});

		new Ajax.Request("https://api.guildwars2.com/v1/map_floor.json?continent_id="+options.continent_id+"&floor="+options.floor_id+"&lang="+options.i18n.lang ,{method: "get",
			onSuccess: function(floordata){
				new Ajax.Request("https://api.guildwars2.com/v1/event_details.json?lang="+options.i18n.lang ,{method: "get",
					onSuccess: function(event_response){
						// get that event_details.json sorted by map
						var eventdata = {};
						$H(event_response.responseJSON.events).each(function(e){
							if(typeof eventdata[e[1].map_id] === "undefined"){
								eventdata[e[1].map_id] = {};
							}
							eventdata[e[1].map_id][e[0]] = e[1];
						});
						GW2Maps.parse_response(mapobject, options, floordata.responseJSON, eventdata);
					},
					onFailure: function(err){
						console.log(err);
						//...
					}
				});
			},
			onFailure: function(err){
				console.log(err);
				// if we don't get any floordata, we try at least to render the map
				options.region_id = false;
				GW2Maps.parse_response(mapobject, options, {texture_dims: options.continent_id === 1 ? [32768,32768] : [16384,16384], regions:[]}, {});
				//mapobject.linkbox.append();
			}
		});
		// return the mapobject for later use
		return mapobject;
	},

	/**
	 * @param mapobject
	 * @param options
	 * @param floordata
	 * @param eventdata
	 */
	parse_response: function(mapobject, options, floordata, eventdata){
		var bounds, clamp, ev,
			p2ll = function(coords){
				return mapobject.map.unproject(coords, options.max_zoom);
			};
		// the map has a clamped view? ok, we use this as bound
		if(floordata.clamped_view){
			clamp = floordata.clamped_view;
			bounds = new L.LatLngBounds(p2ll([clamp[0][0], clamp[1][1]]), p2ll([clamp[1][0], clamp[0][1]])).pad(0.2);
		}
		// we display a specific map? so lets use the maps bounds
		else if(options.region_id && options.map_id){
			clamp = floordata.regions[options.region_id].maps[options.map_id].continent_rect;
			bounds = new L.LatLngBounds(p2ll([clamp[0][0], clamp[1][1]]), p2ll([clamp[1][0], clamp[0][1]])).pad(0.4);
		}
		// else use the texture_dims as bounds
		else{
//			bounds = new L.LatLngBounds(p2ll([0, (1 << options.max_zoom)*256]), p2ll([(1 << options.max_zoom)*256, 0]));
			bounds = new L.LatLngBounds(p2ll([0, floordata.texture_dims[1]]), p2ll([floordata.texture_dims[0], 0])).pad(0.1);
		}
		mapobject.map.setMaxBounds(bounds).fitBounds(bounds);

		// ok, we want to display a single map
		if(options.region_id && options.map_id){
			ev = typeof eventdata[options.map_id] !== "undefined" ? eventdata[options.map_id] : false;
			GW2Maps.parse_map(mapobject, options, floordata.regions[options.region_id].maps[options.map_id], ev);
		}
		// else render anything we get
		else{
			$H(floordata.regions).each(function(region){
				$H(region[1].maps).each(function(map){
					GW2Maps.parse_map(mapobject, options, map[1], typeof eventdata[map[0]] !== "undefined" ? eventdata[map[0]] : false);
				});
			});
		}
	},

	/**
	 * the no more so ugly map parser of uglyness (Anet, please get your data straight!)
	 *
	 * @param mapobject
	 * @param options
	 * @param map
	 * @param eventdata
	 */
	parse_map: function(mapobject, options, map, eventdata){
		var pois = {task: [], event: [], landmark: [], skill: [], vista: [], waypoint: [], sector: []},
			sort = {task: [], event: [], landmark: [], skill: [], vista: [], waypoint: [], sector: []},
			recalc_event_coords = function(cr, mr, p){
				// don't look at it. really! it will melt your brain and make your eyes bleed!
				return [Math.round(cr[0][0]+(cr[1][0]-cr[0][0])*(p[0]-mr[0][0])/(mr[1][0]-mr[0][0])),Math.round(cr[0][1]+(cr[1][1]-cr[0][1])*(1-(p[1]-mr [0][1])/(mr[1][1]-mr[0][1])))]
			};
		// pois
		map.points_of_interest.each(function(p){
			if(p.type == "waypoint"){
				sort.waypoint.push(p.name);
				pois.waypoint.push({
					id: p.poi_id,
					type: p.type,
					coords: p.coord,
					title: p.name,
					text: p.name,
					popup: p.name+"<br />id:"+p.poi_id+"<br />"+p.coord.toString()
				});
			}
			if(p.type == "landmark"){
				sort.landmark.push(p.name);
				pois.landmark.push({
					id: p.poi_id,
					type: p.type,
					coords: p.coord,
					title: p.name,
					text: p.name,
					popup: '<a href="'+options.i18n.wiki+encodeURIComponent(p.name)+'" target="_blank">'+p.name+"</a><br />id:"+p.poi_id
				});
			}
			if(p.type == "vista"){
				sort.vista.push(p.poi_id);
				pois.vista.push({
					type: p.type,
					coords:p.coord,
					title: "id:"+p.poi_id,
					text: p.name+' '+p.poi_id,
					popup: "id:"+p.poi_id
				});
			}
		});
		// tasks (hearts)
		map.tasks.each(function(p){
			sort.task.push(p.level);
			pois.task.push({
				id: p.task_id,
				type: "task",
				coords: p.coord,
				title: p.objective+" ("+p.level+")",
				text: "("+p.level+") "+p.objective,
				popup: '<a href="'+options.i18n.wiki+encodeURIComponent(p.objective.replace(/\.$/, ""))+'" target="_blank">'+p.objective+"</a> ("+p.level+")<br />id:"+p.task_id
			});
		});
		// skill challenges
		map.skill_challenges.each(function(p){
			sort.skill.push(p.coord.toString());
			pois.skill.push({
				id: null,
				type: "skill",
				coords: p.coord,
				title: p.coord.toString(),
				text: p.name+' '+p.coord.toString(),
				popup: p.name+' '+p.coord.toString()
			});
		});
		// sector names
		map.sectors.each(function(p){
			sort.sector.push(p.name);
			pois.sector.push({
				id: p.sector_id,
				type: "sector",
				coords:p.coord,
				title: p.name+", id:"+p.sector_id,
				icon_text: p.name,
				icon_text_class: "sector_text",
				text: p.name,
				popup: false
			});
		});
		// eventdata
		if(eventdata){
			$H(eventdata).each(function(p){
				sort.event.push(p[1].level);
				pois.event.push({
					id: p[0],
					type: "event",
					coords: recalc_event_coords(map.continent_rect,map.map_rect,p[1].location.center),
					title: p[1].name+" ("+p[1].level+")",
					text: "("+p[1].level+") "+p[1].name,
					popup: '<a href="'+options.i18n.wiki+encodeURIComponent(p[1].name.replace(/\.$/, ""))+'" target="_blank">'+p[1].name+"</a> ("+p[1].level+")<br />id:"+p[0]
				});
			});
		}
		// loop out the map points
		mapobject.linkbox.insert(new Element("div", {"class":"header"}).update(map.name));
		$H(pois).each(function(points){
			if(points[1].length > 0){
				// phpJS... <3
				phpjs.array_multisort(sort[points[0]], "SORT_ASC", points[1]);
				mapobject.linkbox.insert(new Element("div", {"class":"header sub"}).update(options.i18n[points[0]]));
				points[1].each(function(p){
					GW2Maps.parse_point(mapobject, options, p);
				});
			}
		});
	},

	/**
	 * @param mapobject
	 * @param options
	 * @param point
	 */
	parse_point: function(mapobject, options, point){
		var i = options.i18n["icon_"+point.type],
			icon,
			pan = function(p,text){
				var ll = mapobject.map.unproject(p, options.max_zoom);
				mapobject.map.panTo(ll);
				if(text){
					L.popup({offset:new L.Point(0,-5)}).setLatLng(ll).setContent(text).openOn(mapobject.map);
				}
			};

		if(point.type === "sector"){
			icon = L.divIcon({className: point.icon_text_class, html: point.icon_text});
		}
		else if(point.type === "event"){
			//...
			icon = L.icon({iconUrl: i.link, iconSize: i.size, popupAnchor:[0, -i.size[1]/2]});
		}
		else{
			icon = L.icon({iconUrl: i.link, iconSize: i.size, popupAnchor:[0, -i.size[1]/2]});
		}

		var marker = L.marker(mapobject.map.unproject(point.coords, options.max_zoom), {title: point.title, icon: icon});

		if(point.popup){
			marker.bindPopup(point.popup);
		}
		mapobject.layers[options.i18n[point.type]].addLayer(marker);
		mapobject.linkbox.insert(new Element("div").insert(i ? new Element("img", {"src":i.link}).setStyle({"width":"16px", "height":"16px"}) : '').insert(' '+point.text).observe("click", function(){
			pan(point.coords,point.popup);
		}));

		// we have also a poi? lets find and display it...
		if(options.poi_id && point.id === options.poi_id && options.poi_type && point.type === options.poi_type){
			pan(point.coords,point.popup);
			mapobject.map.setZoom(options.max_zoom);
		}
	},

	/**
	 * @param mapobject
	 * @param options
	 */
	parse_polylines: function(mapobject, options){
		var lines = options.polyline.split(";");
		lines.each(function(l){
			var coords = l.split(" "), line = [], opts = {};
			coords.each(function(c){
				if(c.match(/\d{1,5},\d{1,5}/)){
					var point = c.split(",");
					line.push(mapobject.map.unproject(point, options.max_zoom));
				}
				if(c.match(/(color|width|opacity|style|type)=(([0-9a-f]{3}){1,2}|\d{1,3}|(arrow|marker|dash))/i)){
					var opt = c.toLowerCase().split("=");
					opts[opt[0]] = opt[1];
				}
			});
			var color = typeof opts.color !== "undefined" ? "#"+opts.color : "#ffe500",
				width = typeof opts.width !== "undefined" ? phpjs.intval(opts.width) : 3,
				opacity = typeof opts.opacity !== "undefined" ? phpjs.intval(opts.opacity)/100 : 0.8,
				dash = opts.style === "dash"  ? "30,15,10,15" : "";

			line = L.polyline(line, {color: color, weight: width, opacity: opacity, dashArray: dash});
			mapobject.layers[options.i18n.polyline].addLayer(line);

			if(typeof opts.type !== "undefined"){
				var patterns = [];
				if(opts.type === "arrow"){
					patterns.push({offset: 50, repeat: "150px", symbol: new L.Symbol.ArrowHead({pixelSize: 15, polygon: false, pathOptions: {stroke: true, color: color, weight: width, opacity: opacity}})});
				}
				if(opts.type === "marker"){
					patterns.push({offset: 0, repeat: "100%", symbol: new L.Symbol.Marker()});
				}
				mapobject.layers[options.i18n.polyline].addLayer(L.polylineDecorator(line, {patterns: patterns}));
			}
		});
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
 *  (minified) excerpts from phpJS
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
