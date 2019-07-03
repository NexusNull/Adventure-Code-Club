-- MySQL dump 10.16  Distrib 10.1.31-MariaDB, for Win32 (AMD64)
--
-- Host: localhost    Database: drops_db
-- ------------------------------------------------------
-- Server version	10.1.31-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `api_keys`
--

DROP TABLE IF EXISTS `api_keys`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `api_keys` (
  `id` int(11) NOT NULL,
  `player` varchar(64) NOT NULL,
  `api_key` varchar(32) NOT NULL,
  `valid` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `compound_statistics`
--

DROP TABLE IF EXISTS `compound_statistics`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `compound_statistics` (
  `item_name` varchar(64) NOT NULL,
  `item_level` int(11) NOT NULL,
  `total` int(11) NOT NULL,
  `success` int(11) NOT NULL,
  PRIMARY KEY (`item_name`,`item_level`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `compounds`
--

DROP TABLE IF EXISTS `compounds`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `compounds` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `item_name` varchar(16) NOT NULL,
  `item_level` int(11) NOT NULL,
  `scroll_type` varchar(16) NOT NULL,
  `offering` tinyint(1) NOT NULL,
  `slot_num` tinyint(4) NOT NULL,
  `len` smallint(6) NOT NULL,
  `success` tinyint(1) NOT NULL,
  `roll` smallint(6) NOT NULL,
  `uchance` smallint(6) NOT NULL,
  `chance` double NOT NULL,
  `api_key_id` int(11) NOT NULL,
  `character_name` varchar(12) NOT NULL,
  `server` varchar(16) NOT NULL,
  `time` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `compounds_api_key_id` (`api_key_id`),
  CONSTRAINT `compounds_api_key_id` FOREIGN KEY (`api_key_id`) REFERENCES `api_keys` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `drop_statistics`
--

DROP TABLE IF EXISTS `drop_statistics`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `drop_statistics` (
  `monster_name` varchar(64) NOT NULL,
  `item_name` varchar(64) NOT NULL,
  `map` varchar(64) NOT NULL,
  `monster_level` int(11) NOT NULL,
  `seen` int(11) NOT NULL,
  PRIMARY KEY (`monster_name`,`item_name`,`map`,`monster_level`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `drops`
--

DROP TABLE IF EXISTS `drops`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `drops` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `item_name` varchar(64) NOT NULL,
  `kill_id` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `exchange_statistics`
--

DROP TABLE IF EXISTS `exchange_statistics`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `exchange_statistics` (
  `item_name` varchar(64) NOT NULL,
  `item_level` int(11) NOT NULL,
  `result` varchar(64) NOT NULL,
  `amount` int(11) NOT NULL,
  `seen` int(11) NOT NULL,
  PRIMARY KEY (`item_name`,`item_level`,`result`,`amount`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `exchanges`
--

DROP TABLE IF EXISTS `exchanges`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `exchanges` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `item_name` varchar(64) NOT NULL,
  `result` varchar(64) NOT NULL,
  `amount` int(11) NOT NULL,
  `api_key_id` int(11) NOT NULL,
  `time` datetime NOT NULL,
  `item_level` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `exchanges_api_key_id` (`api_key_id`),
  CONSTRAINT `exchanges_api_key_id` FOREIGN KEY (`api_key_id`) REFERENCES `api_keys` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `kill_statistics`
--

DROP TABLE IF EXISTS `kill_statistics`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `kill_statistics` (
  `character_name` varchar(64) NOT NULL,
  `monster_name` varchar(64) NOT NULL,
  `kills` bigint(20) NOT NULL,
  `total_gold` bigint(20) NOT NULL,
  `map` varchar(64) NOT NULL,
  `monster_level` int(11) NOT NULL,
  PRIMARY KEY (`character_name`,`monster_name`,`map`,`monster_level`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `kills`
--

DROP TABLE IF EXISTS `kills`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `kills` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `monster_name` varchar(64) NOT NULL,
  `map` varchar(64) NOT NULL,
  `monster_level` int(11) NOT NULL,
  `gold` int(11) NOT NULL,
  `items` int(11) NOT NULL,
  `character_name` varchar(12) NOT NULL,
  `api_key_id` int(11) NOT NULL,
  `time` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `kills_api_key_id` (`api_key_id`),
  CONSTRAINT `kills_api_key_id` FOREIGN KEY (`api_key_id`) REFERENCES `api_keys` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `market`
--

DROP TABLE IF EXISTS `market`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `market` (
  `id` int(11) NOT NULL,
  `type` varchar(64) NOT NULL,
  `price` int(11) NOT NULL,
  `map` varchar(64) NOT NULL,
  `server` varchar(64) NOT NULL,
  `items` int(11) NOT NULL,
  `level` int(11) NOT NULL,
  `player` varchar(64) NOT NULL,
  `api_key_id` int(11) NOT NULL,
  `version` int(11) NOT NULL,
  `time` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `market_api_key_id` (`api_key_id`),
  CONSTRAINT `market_api_key_id` FOREIGN KEY (`api_key_id`) REFERENCES `api_keys` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `market_items`
--

DROP TABLE IF EXISTS `market_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `market_items` (
  `id` int(11) NOT NULL,
  `name` varchar(64) NOT NULL,
  `marketid` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `marketid` (`marketid`),
  CONSTRAINT `market_items_ibfk_1` FOREIGN KEY (`marketid`) REFERENCES `market` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `upgrade_statistics`
--

DROP TABLE IF EXISTS `upgrade_statistics`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `upgrade_statistics` (
  `item_name` varchar(64) NOT NULL,
  `item_level` int(11) NOT NULL,
  `total` bigint(20) NOT NULL,
  `success` bigint(20) NOT NULL,
  PRIMARY KEY (`item_name`,`item_level`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `upgrades`
--

DROP TABLE IF EXISTS `upgrades`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `upgrades` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `item_name` varchar(16) NOT NULL,
  `item_level` int(11) NOT NULL,
  `scroll_type` varchar(16) NOT NULL,
  `offering` tinyint(1) NOT NULL,
  `slot_num` tinyint(4) NOT NULL,
  `len` smallint(6) NOT NULL,
  `success` tinyint(1) NOT NULL,
  `roll` smallint(4) NOT NULL,
  `uchance` smallint(4) NOT NULL,
  `chance` double NOT NULL,
  `api_key_id` int(11) NOT NULL,
  `character_name` varchar(12) NOT NULL,
  `server` varchar(16) NOT NULL,
  `time` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `upgrades_api_key_id` (`api_key_id`),
  CONSTRAINT `upgrades_api_key_id` FOREIGN KEY (`api_key_id`) REFERENCES `api_keys` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2019-07-03 12:40:26
