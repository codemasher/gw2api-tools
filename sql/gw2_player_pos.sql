CREATE TABLE IF NOT EXISTS `gw2_player_pos` (
  `player_uid` varchar(40) COLLATE utf8_bin NOT NULL,
  `acc_name` varchar(40) COLLATE utf8_bin NOT NULL,
  `char_name` varchar(20) COLLATE utf8_bin NOT NULL,
  `profession` tinyint(2) unsigned NOT NULL,
  `team_color` smallint(4) unsigned NOT NULL,
  `commander` tinyint(1) unsigned NOT NULL,
  `guild_id` varchar(36) COLLATE utf8_bin NOT NULL,
  `guild_secret` varchar(40) COLLATE utf8_bin NOT NULL,
  `world_id` smallint(4) unsigned NOT NULL,
  `map_id` smallint(4) unsigned NOT NULL,
  `pos_x` float(10,4) NOT NULL,
  `pos_y` float(10,4) NOT NULL,
  `pos_angle` smallint(3) unsigned NOT NULL,
  `pos_time` int(10) unsigned NOT NULL,
  PRIMARY KEY (`player_uid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;