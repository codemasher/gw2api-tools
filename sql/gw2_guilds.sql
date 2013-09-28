CREATE TABLE IF NOT EXISTS `gw2_guilds` (
  `guild_id` VARCHAR(40)
             COLLATE utf8_bin NOT NULL,
  `name`     TINYTEXT
             COLLATE utf8_bin NOT NULL,
  `tag`      VARCHAR(4)
             COLLATE utf8_bin NOT NULL,
  `emblem`   TINYTEXT
             COLLATE utf8_bin NOT NULL,
  PRIMARY KEY (`guild_id`)
)
  ENGINE =InnoDB
  DEFAULT CHARSET =utf8
  COLLATE =utf8_bin;
