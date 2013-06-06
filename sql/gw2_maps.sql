DROP TABLE IF EXISTS `gw2_maps`;
CREATE TABLE IF NOT EXISTS `gw2_maps` (
  `map_id` int(5) unsigned NOT NULL,
  `name_de` varchar(40) NOT NULL,
  `name_en` varchar(40) NOT NULL,
  `name_es` varchar(40) NOT NULL,
  `name_fr` varchar(40) NOT NULL,
  PRIMARY KEY (`map_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

INSERT INTO `gw2_maps` (`map_id`, `name_de`, `name_en`, `name_es`, `name_fr`) VALUES
(15, 'Königintal', 'Queensdale', 'Valle de la Reina', 'La Vallée de la reine'),
(17, 'Harathi-Hinterland', 'Harathi Hinterlands', 'Interior Harathi', 'Hinterlands harathis'),
(19, 'Ebenen von Aschfurt', 'Plains of Ashford', 'Llanuras de Ashford', 'Plaines d''Ashford'),
(20, 'Flammenkamm-Steppe', 'Blazeridge Steppes', 'Estepas Crestafulgurante', 'Les Steppes de la Strie flamboyante'),
(21, 'Felder der Verwüstung', 'Fields of Ruin', 'Campos de la Ruina', 'Champs de Ruine'),
(22, 'Feuerherzhügel', 'Fireheart Rise', 'Colina del Corazón de fuego', 'Montée de Flambecœur'),
(23, 'Kessex-Hügel', 'Kessex Hills', 'Colinas Kessex', 'Collines de Kesse'),
(24, 'Gendarran-Felder', 'Gendarran Fields', 'Campos de Gendarran', 'Champs de Gendarran'),
(25, 'Eisensümpfe', 'Iron Marches', 'Fronteras de Hierro', 'Marais de fer'),
(26, 'Schauflerschreck-Klippen', 'Dredgehaunt Cliffs', 'Acantilados de Guaridadraga', 'Falaises de Hantedraguerre'),
(27, 'Lornars Pass', 'Lornar''s Pass', 'Paso de Lornar', 'Passage de Lornar'),
(28, 'Wanderer-Hügel', 'Wayfarer Foothills', 'Colinas del Caminante', 'Contreforts du Voyageur'),
(29, 'Baumgrenzen-Fälle', 'Timberline Falls', 'Cataratas de Linarbórea', 'Chutes de la Canopée'),
(30, 'Eisklamm-Sund', 'Frostgorge Sound', 'Estrecho de Forjaescarcha', 'Détroit des gorges glacées'),
(31, 'Schneekuhlenhöhen', 'Snowden Drifts', 'Cúmulos de Guaridanieve', 'Congères d''Antreneige'),
(32, 'Diessa-Plateau', 'Diessa Plateau', 'Meseta de Diessa', 'Plateau de Diessa'),
(34, 'Caledon-Wald', 'Caledon Forest', 'Bosque de Caledon', 'Forêt de Caledon'),
(35, 'Provinz Metrica', 'Metrica Province', 'Provincia de Métrica', 'Province de Metrica'),
(39, 'Mahlstromgipfel', 'Mount Maelstrom', 'Monte Vorágine', 'Mont Maelström'),
(51, 'Meerenge der Verwüstung', 'Straits of Devastation', 'Estrechos de la devastación', 'Détroit de la Dévastation'),
(53, 'Funkenschwärmersumpf', 'Sparkfly Fen', 'Pantano de las Centellas', 'Marais de Lumillule'),
(54, 'Brisban-Wildnis', 'Brisban Wildlands', 'Selvas Brisbanas', 'Terres sauvages de Brisban'),
(62, 'Fluchküste', 'Cursed Shore', 'Ribera Maldita', 'Rivage maudit'),
(65, 'Malchors Sprung', 'Malchor''s Leap', 'Salto de Malchor', 'Saut de Malchor'),
(73, 'Blutstrom-Küste', 'Bloodtide Coast', 'Costa Mareasangrienta', 'Côte de la marée sanglante'),
(873, 'Südlicht-Bucht', 'Southsun Cove', 'Cala del Sol Austral', 'Crique de Sud-Soleil');