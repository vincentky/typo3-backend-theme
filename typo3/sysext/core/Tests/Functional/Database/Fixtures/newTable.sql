CREATE TABLE aTestTable (
	uid     INT(11) UNSIGNED                NOT NULL AUTO_INCREMENT,
	pid     INT(11) UNSIGNED DEFAULT '0'    NOT NULL,
	tstamp  INT(11) UNSIGNED DEFAULT '0'    NOT NULL,
	hidden  TINYINT(3) UNSIGNED DEFAULT '0' NOT NULL,
	deleted TINYINT(3) UNSIGNED DEFAULT '0' NOT NULL,

	PRIMARY KEY (uid),
	KEY parent (pid)
);
