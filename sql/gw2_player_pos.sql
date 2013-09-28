CREATE TABLE IF NOT EXISTS `gw2_player_pos` (
  `player_uid`   VARCHAR(40)
                 COLLATE utf8_bin     NOT NULL,
  `acc_name`     VARCHAR(40)
                 COLLATE utf8_bin     NOT NULL,
  `char_name`    VARCHAR(20)
                 COLLATE utf8_bin     NOT NULL,
  `profession`   TINYINT(2) UNSIGNED  NOT NULL,
  `team_color`   SMALLINT(4) UNSIGNED NOT NULL,
  `commander`    TINYINT(1) UNSIGNED  NOT NULL,
  `guild_id`     VARCHAR(36)
                 COLLATE utf8_bin     NOT NULL,
  `guild_secret` VARCHAR(40)
                 COLLATE utf8_bin     NOT NULL,
  `world_id`     SMALLINT(4) UNSIGNED NOT NULL,
  `map_id`       SMALLINT(4) UNSIGNED NOT NULL,
  `pos_x`        FLOAT(10, 4)         NOT NULL,
  `pos_y`        FLOAT(10, 4)         NOT NULL,
  `pos_angle`    SMALLINT(3) UNSIGNED NOT NULL,
  `pos_time`     INT(10) UNSIGNED     NOT NULL,
  PRIMARY KEY (`player_uid`)
)
  ENGINE =InnoDB
  DEFAULT CHARSET =utf8
  COLLATE =utf8_bin;
