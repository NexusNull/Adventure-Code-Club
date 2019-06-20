const settings = require("../settings");
const mysql = require('mysql');
const input = new (require("./Input"))();
var pool  = mysql.createPool({
    connectionLimit : 10,
    host: settings.database.hostname,
    user: settings.database.username,
    password: settings.database.password,
    database: settings.database.database,
    multipleStatements: true
});

const st = {
    insert: {
        kills: "INSERT INTO kills (monster_name, map, monster_level, gold, items, character_name, api_key, time) VALUES (?,?,?,?,?,?,?,CURRENT_TIMESTAMP());",
        drops: "INSERT INTO drops (item_name, kill_id) VALUES (?,?);",
        exchanges: "INSERT INTO exchanges (item_name, item_level, result, amount, api_key, time) VALUES (?,?,?,?,?,CURRENT_TIMESTAMP());",
        compounds: "INSERT INTO compounds (item_name, item_level, scroll_type, offering, success, api_key, time) VALUES (?,?,?,?,?,?,CURRENT_TIMESTAMP());",
        upgrades: "INSERT INTO upgrades (item_name, item_level, scroll_type, offering, success, api_key, time,) VALUES (?,?,?,?,?,?,CURRENT_TIMESTAMP());",
        market: "",
        api_key: "INSERT INTO api_keys (player, api_key, valid) VALUES (?,?,?)",
    },
    tables: ["drops", "exchanges", "upgrades", "compounds", "kills"],
    limits: "SELECT \n" +
        "(SELECT id FROM ?? ORDER BY id LIMIT 1) as 'first',\n" +
        "(SELECT id FROM ?? ORDER BY id DESC LIMIT 1) as 'last'",
    aggregate: {
        kills: "SELECT i.monster_name, COUNT(*) AS kills, i.character_name, i.map, i.monster_level, SUM(i.gold) AS total_gold FROM (SELECT * FROM kills WHERE id >= ?  AND id < ?) AS i GROUP BY i.monster_name, i.character_name, i.map,i.monster_level;",
        drops: "SELECT k.monster_name, d.item_name, k.map, k.monster_level, COUNT(*) AS seen FROM (SELECT * FROM drops WHERE id >= ?  AND id < ? ) AS d INNER JOIN kills AS k ON d.kill_id = k.id GROUP BY k.monster_name, d.item_name, k.monster_level, k.map;",
        exchanges: "SELECT e.item_name, e.item_level, e.result, e.amount, COUNT(*) AS seen FROM (SELECT * FROM exchanges WHERE id >= ?  AND id < ? ) AS e GROUP BY e.item_name, e.item_level, e.result, e.amount;",
        upgrades: "SELECT u.item_name, u.item_level, COUNT(*) AS total, SUM(u.success) AS success FROM (SELECT * FROM upgrades WHERE id >= ?  AND id < ?) AS u GROUP BY u.item_name, u.item_level",
        compounds: "SELECT c.item_name, c.item_level, COUNT(*) AS total, SUM(c.success) AS success FROM (SELECT * FROM compounds WHERE id >= ?  AND id < ?) AS c GROUP BY c.item_name, c.item_level"
    },
    update_statistics: {
        kills: "INSERT INTO kill_statistics (character_name, monster_name, map, monster_level, kills, total_gold) Values (?,?,?,?,?,?) ON DUPLICATE KEY Update `kills` = `kills` + ?, `total_gold` = `total_gold` + ?;",
        drops: "INSERT INTO drop_statistics (monster_name, item_name, map, monster_level, seen) Values (?,?,?,?,?) ON DUPLICATE KEY Update `seen` = `seen` + ? ;",
        exchanges: "INSERT INTO exchange_statistics (item_name, item_level, result, amount, seen) Values (?,?,?,?,?) ON DUPLICATE KEY Update `seen` = `seen` + ? ;",
        compounds: "INSERT INTO compound_statistics (item_name, item_level, total, success) Values (?,?,?,?) ON DUPLICATE KEY Update `total` = `total` + ?, `success` = `success` + ? ;",
        upgrades: "INSERT INTO upgrade_statistics (item_name, item_level, total, success) Values (?,?,?,?) ON DUPLICATE KEY Update `total` = `total` + ?, `success` = `success` + ? ;",
        market: ""
    },
    get_statistics: {
        kills: "SELECT * FROM kill_statistics WHERE monster_name = ? AND monster_level = ? ORDER BY kills DESC",
        drops: "SELECT * FROM drop_statistics WHERE monster_name = ?",
        exchanges: "SELECT * FROM exchange_statistics WHERE item_name = ?",
        compounds: "SELECT * FROM compound_statistics WHERE item_name = ?",
        upgrades: "SELECT * FROM upgrade_statistics WHERE item_name = ?",
        reverseDrop: "SELECT *, a.seen*100 / a.kills AS rate FROM(SELECT i.monster_name, SUM( `kill_statistics`.`kills`) AS kills, i.seen, i.map FROM (SELECT * FROM `drop_statistics` WHERE item_name = ?) i INNER JOIN `kill_statistics` ON i.monster_name = `kill_statistics`.monster_name GROUP BY i.monster_name, i.map) a ORDER BY rate DESC"
    },
    get: {
        api_key: "SELECT player, valid FROM api_keys WHERE api_key = ?"
    },
    clear_statistics: {
        kills: "DELETE FROM kill_statistics",
        drops: "DELETE FROM drop_statistics",
        exchanges: "DELETE FROM exchange_statistics",
        compounds: "DELETE FROM compound_statistics",
        upgrades: "DELETE FROM upgrade_statistics",
    }
};

/**
 *
 * @param {string} monster_name
 * @param {string} chest_type
 * @param {string} map_name
 * @param {number} monster_level
 * @param {number} gold
 * @param {number} items
 * @param {string} character_name
 * @param {string} api_key
 * @param version
 * @returns {Promise<any>}
 */
const insertKill = async function (monster_name, map_name, monster_level, gold, items, character_name, api_key) {
    return new Promise(function (resolve, reject) {
        let failed = false;

        function fail(reason) {
            failed = true;
            reject(new Error(reason));
        }

        if (!input.validate(monster_name, "string", {min: 2, max: 16}))
            fail("invalid monster name");
        if (!input.validate(map_name, "string", {min: 2, max: 16}))
            fail("invalid map name");
        if (!input.validate(monster_level, "int", {min: 0, max: 1000}))
            fail("invalid monster level");
        if (!input.validate(gold, "int", {min: 0, max: 100000000}))
            fail("invalid gold amount");
        if (!input.validate(items, "int", {min: 0, max: 1000}))
            fail("invalid item amount");
        if (!input.validate(character_name, "string", {min: 2, max: 16}))
            fail("invalid character name");
        if (!input.validate(api_key, "string", {min: 2, max: 64}))
            fail("invalid api key");

        if (!failed)
            pool.query(st.insert.kills, [monster_name, map_name, monster_level, gold, items, character_name, api_key], function (err, result) {
                if (err)
                    reject(err);
                resolve(result);
            });
    });
};

/**
 *
 * @param {string} item_name
 * @param {number} kill_id
 * @returns {Promise<void>}
 */
const insertDrop = async function (item_name, kill_id) {
    return new Promise(function (resolve, reject) {
        let failed = false;

        function fail(reason) {
            failed = true;
            reject(new Error(reason));
        }

        if (!input.validate(item_name, "string", {min: 2, max: 16}))
            fail("invalid item name");
        if (!input.validate(kill_id, "int", {min: 0}))
            fail("invalid kill id");

        if (!failed)
            pool.query(st.insert.drops, [item_name, kill_id], function (err, result) {
                if (err)
                    reject(err);
                resolve(result);
            });
    });
};

/**
 *
 * @param {string} item_name
 * @param {number} item_level
 * @param {string} result
 * @param {number} amount
 * @param {string} api_key
 * @returns {Promise<void>}
 */
const insertExchange = async function (item_name, item_level, result, amount, api_key) {
    return new Promise(function (resolve, reject) {
        let failed = false;

        function fail(reason) {
            failed = true;
            reject(new Error(reason));
        }

        if (!input.validate(item_name, "string", {min: 2, max: 16}))
            fail("invalid item name");
        if (!input.validate(item_level, "int", {min: 0, max: 12}))
            fail("invalid item level");
        if (!input.validate(result, "string", {min: 2, max: 16}))
            fail("invalid result item name");
        if (!input.validate(amount, "int", {min: 0, max: 9999}))
            fail("invalid item amount");
        if (!input.validate(api_key, "string", {min: 2, max: 64}))
            fail("invalid api key");

        if (!failed)
            pool.query(st.insert.exchanges, [item_name, item_level, result, amount, api_key], function (err, result) {
                if (err)
                    reject(err);
                resolve(result);
            });
    });
};

/**
 *
 * @param {string} item_name
 * @param {number} item_level
 * @param {string} scroll_type
 * @param {boolean} offering
 * @param {boolean} success
 * @param {string} api_key
 * @returns {Promise<any>}
 */
const insertCompound = async function (item_name, item_level, scroll_type, offering, success, api_key) {
    return new Promise(function (resolve, reject) {
        let failed = false;

        function fail(reason) {
            failed = true;
            reject(new Error(reason));
        }

        if (!input.validate(item_name, "string", {min: 2, max: 16}))
            fail("invalid item name");
        if (!input.validate(item_level, "int", {min: 0, max: 12}))
            fail("invalid item level");
        if (!input.validate(scroll_type, "string", {min: 2, max: 16}))
            fail("invalid scroll_type");
        if (!input.validate(offering, "bool"))
            fail("invalid offering");
        if (!input.validate(success, "bool"))
            fail("invalid success");
        if (!input.validate(api_key, "string", {min: 2, max: 64}))
            fail("invalid api key");

        if (!failed)
            pool.query(st.insert.compounds, [item_name, item_level, scroll_type, offering, success, api_key], function (err, result) {
                if (err)
                    reject(err);
                resolve(result);
            });
    });
};

/**
 *
 * @param {string} item_name
 * @param {number} item_level
 * @param {string} scroll_type
 * @param {number} offering
 * @param {number} success
 * @param {string} api_key
 * @param {number} seed0
 * @param {number} seed1
 * @returns {Promise<any>}
 */
const insertUpgrade = async function (item_name, item_level, scroll_type, offering, success, api_key) {
    return new Promise(function (resolve, reject) {
        let failed = false;

        function fail(reason) {
            failed = true;
            reject(new Error(reason));
        }

        if (!input.validate(item_name, "string", {min: 2, max: 16}))
            fail("invalid item name");
        if (!input.validate(item_level, "int", {min: 0, max: 12}))
            fail("invalid item level");
        if (!input.validate(scroll_type, "string", {min: 2, max: 16}))
            fail("invalid scroll_type");
        if (!input.validate(offering, "bool"))
            fail("invalid offering");
        if (!input.validate(success, "bool"))
            fail("invalid success");
        if (!input.validate(api_key, "string", {min: 2, max: 64}))
            fail("invalid api key");

        if (!failed)
            pool.query(st.insert.upgrades, [item_name, item_level, scroll_type, offering, success, api_key], function (err, result) {
                if (err)
                    reject(err);
                resolve(result);
            });
    });
};

/**
 *
 * @param {string} player
 * @param {string} api_key
 * @param {boolean} valid
 * @returns {Promise<any>}
 */
const insertApiKey = async function (player, api_key, valid) {
    return new Promise(function (resolve, reject) {
        let failed = false;

        function fail(reason) {
            failed = true;
            reject(new Error(reason));
        }

        if (!input.validate(player, "string", {min: 2, max: 64}))
            fail("invalid player name");
        if (!input.validate(api_key, "string", {min: 2, max: 64}))
            fail("invalid character name");
        if (!input.validate(valid, "bool", {min: 2, max: 64}))
            fail("valid has to be bool");

        if (!failed)
            pool.query(st.insert.api_key, [player, api_key, valid], function (err, result) {
                if (err)
                    reject(err);
                resolve(result);
            });

    });
};

/**
 *
 * @param {string} tableName
 * @returns {Promise<any>}
 */
const getLimits = async function (tableName) {
    return new Promise(function (resolve, reject) {
        let failed = false;

        function fail(reason) {
            failed = true;
            reject(new Error(reason));
        }

        if (st.tables.includes(tableName)) {
            fail("Table name invalid!");
        }

        if (!failed)
        pool.query(st.limits, [tableName, tableName], function (err, result) {
            if (err)
                reject(err);
            resolve(result);
        });
    });
};

/**
 *
 * @param {number} start
 * @param {number} end
 * @returns {Promise<any>}
 */
const aggregateDrops = async function (start, end) {
    return new Promise(function (resolve, reject) {
        let failed = false;

        function fail(reason) {
            failed = true;
            reject(new Error(reason));
}

if (end <= start)
    fail("end has to be grater than start");
if(!input.validate(start, "int", {min: 0}))
    fail("start has to greater than zero");
if(!input.validate(end, "int", {min: 0}))
    fail("end has to greater than zero");

        if (!failed)
            pool.query(st.aggregate.drops, [start, end], function (err, result) {
                if (err)
                    reject(err);
                resolve(result);
            });
    })
};

/**
 *
 * @param {number} start
 * @param {number} end
 * @returns {Promise<any>}
 */
const aggregateKills = async function (start, end) {
    return new Promise(function (resolve, reject) {
        let failed = false;

        function fail(reason) {
            failed = true;
            reject(new Error(reason));
        }

        if (end <= start)
            fail("end has to be grater than start");
        if(!input.validate(start, "int", {min: 0}))
            fail("start has to an integer greater than zero");
        if(!input.validate(end, "int", {min: 0}))
            fail("end has to an integer greater than zero");

        if (!failed)
            pool.query(st.aggregate.kills, [start, end], function (err, result) {
                if (err)
                    reject(err);
                resolve(result);
            });
    })
};

/**
 *
 * @param {int} start
 * @param {int} end
 * @returns {Promise<any>}
 */
const aggregateExchanges = async function (start, end) {
    return new Promise(function (resolve, reject) {
        let failed = false;

        function fail(reason) {
            failed = true;
            reject(new Error(reason));
        }

        if (end <= start)
            fail("end has to be grater than start");
        if(!input.validate(start, "int", {min: 0}))
            fail("start has to an integer greater than zero");
        if(!input.validate(end, "int", {min: 0}))
            fail("end has to an integer greater than zero");

        if (!failed)
            pool.query(st.aggregate.exchanges, [start, end], function (err, result) {
                if (err)
                    reject(err);
                resolve(result);
            });
    })
};

/**
 *
 * @param {number} start
 * @param {number} end
 * @returns {Promise<any>}
 */
const aggregateUpgrades = async function (start, end) {
    return new Promise(function (resolve, reject) {
        let failed = false;

        function fail(reason) {
            failed = true;
            reject(new Error(reason));
        }

        if (end <= start)
            fail("end has to be grater than start");
        if(!input.validate(start, "int", {min: 0}))
            fail("start has to an integer greater than zero");
        if(!input.validate(end, "int", {min: 0}))
            fail("end has to an integer greater than zero");

        if (!failed)
            pool.query(st.aggregate.upgrades, [start, end], function (err, result) {
                if (err)
                    reject(err);
                resolve(result);
            });
    })
};

/**
 *
 * @param {number} start
 * @param {number} end
 * @returns {Promise<any>}
 */
const aggregateCompounds = async function (start, end) {
    return new Promise(function (resolve, reject) {
        let failed = false;

        function fail(reason) {
            failed = true;
            reject(new Error(reason));
        }

        if (end <= start)
            fail("end has to be grater than start");
        if(!input.validate(start, "int", {min: 0}))
            fail("start has to an integer greater than zero");
        if(!input.validate(end, "int", {min: 0}))
            fail("end has to an integer greater than zero");

        if (!failed)
            pool.query(st.aggregate.compounds, [start, end], function (err, result) {
                if (err)
                    reject(err);
                resolve(result);
            });
    })
};

/**
 *
 * @param {string} monster_name
 * @param {string} item_name
 * @param {string} map_name
 * @param {number} monster_level
 * @param {number} seen
 * @returns {Promise<any>}
 */
const updateDropStatistics = function (monster_name, item_name, map_name, monster_level, seen) {
    return new Promise(function (resolve, reject) {
        let failed = false;

        function fail(reason) {
            failed = true;
            reject(new Error(reason));
        }

        if (!input.validate(monster_name, "string", {min: 2, max: 16}))
            fail("invalid monster name");
        if (!input.validate(item_name, "string", {min: 2, max: 16}))
            fail("invalid item name");
        if (!input.validate(map_name, "string", {min: 2, max: 16}))
            fail("invalid map name");
        if (!input.validate(monster_level, "int", {min: 0}))
            fail("invalid monster level");
        if (!input.validate(seen, "int", {min: 0}))
            fail("seen invalid");

        if (!failed)
            pool.query(st.update_statistics.drops, [monster_name, item_name, map_name, monster_level, seen, seen], function (err, result) {
                if (err)
                    reject(err);
                resolve(result);
            });
    })
};

/**
 *
 * @param {string} character_name
 * @param {string} monster_name
 * @param {string} map_name
 * @param {number} monster_level
 * @param {number} kills
 * @param {number} total_gold
 * @returns {Promise<any>}
 */
const updateKillStatistics = function (character_name, monster_name, map_name, monster_level, kills, total_gold) {
    return new Promise(function (resolve, reject) {
        let failed = false;

        function fail(reason) {
            failed = true;
            reject(new Error(reason));
        }

        if (!input.validate(character_name, "string", {min: 2, max: 16}))
            fail("invalid character name");
        if (!input.validate(monster_name, "string", {min: 2, max: 16}))
            fail("invalid monster name");
        if (!input.validate(map_name, "string", {min: 2, max: 16}))
            fail("invalid map name");
        if (!input.validate(monster_level, "int", {min: 0}))
            fail("invalid monster level");
        if (!input.validate(kills, "int", {min: 0}))
            fail("invalid item amount");
        if (!input.validate(total_gold, "int", {min: 0}))
            fail("invalid gold amount");

        if (!failed)
            pool.query(st.update_statistics.kills, [character_name, monster_name, map_name, monster_level, kills, total_gold, kills, total_gold], function (err, result) {
                if (err)
                    reject(err);
                resolve(result);
            });
    })
};

/**
 *
 * @param {string} item_name
 * @param {number} item_level
 * @param {string} result
 * @param {number} amount
 * @param {number} seen
 * @returns {Promise<any>}
 */
const updateExchangeStatistics = function (item_name, item_level, result, amount, seen) {
    return new Promise(function (resolve, reject) {
        let failed = false;

        function fail(reason) {
            failed = true;
            reject(new Error(reason));
        }

        if (!input.validate(item_name, "string", {min: 2, max: 16}))
            fail("invalid item name");
        if (!input.validate(item_level, "int", {min: 0, max: 12}))
            fail("invalid item level");
        if (!input.validate(result, "string", {min: 2, max: 16}))
            fail("invalid result item name");
        if (!input.validate(amount, "int", {min: 0, max: 9999}))
            fail("invalid item amount");
        if (!input.validate(seen, "int", {min: 0}))
            fail("invalid item amount");

        if (!failed)
            pool.query(st.update_statistics.exchanges, [item_name, item_level, result, amount, seen, seen], function (err, result) {
                if (err)
                    reject(err);
                resolve(result);
            });
    })
};

/**
 *
 * @param item_name
 * @param item_level
 * @param total
 * @param success
 * @returns {Promise<any>}
 */
const updateUpgradesStatistics = function (item_name, item_level, total, success) {
    return new Promise(function (resolve, reject) {
        let failed = false;

        function fail(reason) {
            failed = true;
            reject(new Error(reason));
        }

        if (!input.validate(item_name, "string", {min: 2, max: 16}))
            fail("invalid item name");
        if (!input.validate(item_level, "int", {min: 0, max: 12}))
            fail("invalid item level");
        if (!input.validate(success, "bool"))
            fail("invalid success");

        if (total < success) {
            reject("Success has to smaller or equal to Total!");
            return;
        }

        if (!failed)
            pool.query(st.update_statistics.upgrades, [item_name, item_level, total, success, total, success], function (err, result) {
                if (err)
                    reject(err);
                resolve(result);
            });
    })
};

/**
 *
 * @param {string} item_name
 * @param {number} item_level
 * @param {number} total
 * @param {number} success
 * @returns {Promise<any>}
 */
const updateCompoundsStatistics = function (item_name, item_level, total, success) {
    return new Promise(function (resolve, reject) {
        let failed = false;

        function fail(reason) {
            failed = true;
            reject(new Error(reason));
        }

        if (!input.validate(item_name, "string", {min: 2, max: 16}))
            fail("invalid item name");
        if (!input.validate(item_level, "int", {min: 0, max: 12}))
            fail("invalid item level");
        if (!input.validate(total, "int", {min: 1}))
            fail("invalid item level");
        if (!input.validate(success, "int", {min: 1}))
            fail("invalid item level");
        if (total < success) {
            fail("Success has to smaller or equal to Total!");
        }

        if (!failed)
            pool.query(st.update_statistics.compounds, [item_name, item_level, total, success, total, success], function (err, result) {
                if (err)
                    reject(err);
                resolve(result);
            });
    })
};

/**
 *
 * @param {string} monster_name
 * @param {int} level
 * @returns {Promise<any>}
 */
const getKillsByMonster = function (monster_name, level) {
    return new Promise(function (resolve, reject) {
        let failed = false;

        function fail(reason) {
            failed = true;
            reject(new Error(reason));
        }

        if (!input.validate(monster_name, "string", {min: 2, max: 16}))
            fail("invalid monster name");
        if(!input.validate(level,"int",{min:0}))
            fail("invalid monster level");


        if (!failed)
            pool.query(st.get_statistics.kills, [monster_name, level], function (err, result) {
                if (err)
                    reject(err);
                resolve(result);
            });
    })
};

/**
 *
 * @param {string} monster_name
 * @returns {Promise<any>}
 */
const getDropsByMonster = function (monster_name) {
    return new Promise(function (resolve, reject) {
        let failed = false;

        function fail(reason) {
            failed = true;
            reject(new Error(reason));
        }

        if (!input.validate(monster_name, "string", {min: 2, max: 16}))
            fail("invalid monster name");

        if (!failed)
            pool.query(st.get_statistics.drops, [monster_name], function (err, result) {
                if (err)
                    reject(err);
                resolve(result);
            });
    })
};

/**
 *
 * @param {string} item_name
 * @returns {Promise<any>}
 */
const getExchangesByItemName = function (item_name) {
    return new Promise(function (resolve, reject) {
        let failed = false;

        function fail(reason) {
            failed = true;
            reject(new Error(reason));
        }

        if (!input.validate(item_name, "string", {min: 2, max: 16}))
            fail("invalid monster name");

        if (!failed)
            pool.query(st.get_statistics.exchanges, [item_name], function (err, result) {
                if (err)
                    reject(err);
                resolve(result);
            });
    })
};

/**
 *
 * @param {string} item_name
 * @returns {Promise<any>}
 */
const getUpgradesByItemName = function (item_name) {
    return new Promise(function (resolve, reject) {
        let failed = false;

        function fail(reason) {
            failed = true;
            reject(new Error(reason));
        }

        if (!input.validate(item_name, "string", {min: 2, max: 16}))
            fail("invalid monster name");

        if (!failed)
            pool.query(st.get_statistics.upgrades, [item_name], function (err, result) {
                if (err)
                    reject(err);
                resolve(result);
            });
    })
};
/**
 *
 * @param {string} item_name
 * @returns {Promise<any>}
 */
const getCompoundsByItemName = function (item_name) {
    return new Promise(function (resolve, reject) {
        let failed = false;

        function fail(reason) {
            failed = true;
            reject(new Error(reason));
        }

        if (!input.validate(item_name, "string", {min: 2, max: 16}))
            fail("invalid monster name");

        if (!failed)
            pool.query(st.get_statistics.compounds, [item_name], function (err, result) {
                if (err)
                    reject(err);
                resolve(result);
            });
    })
};

/**
 *
 * @param {string} key
 * @returns {Promise<any>}
 */
const validKey = async function (key) {
    return new Promise(function (resolve, reject) {
        function fail(reason) {
            reject(new Error(reason));
        }

        if (input.validate(key, "string", {min: 0, max: 64}))
            pool.query(st.get.api_key, [key], function (err, result) {
                if (err)
                    reject(err);
                resolve(result);
            });
        else
            fail("Invalid Input");
    });
};

const getReverseDrop = async function (itemName) {
    return new Promise(function (resolve, reject) {
        if (typeof itemName === "string")
            pool.query(st.get_statistics.reverseDrop, [itemName], function (err, result) {
                if (err)
                    reject(err);
                resolve(result);
            });
        else
            reject("Item name invalid");
    });
};


/**
 * Deletes all data in the statistics tables
 */
const clearAllStatistics = function () {
    return Promise.all([
        new Promise(function (resolve, reject) {
            pool.query(st.clear_statistics.kills, function (err, result) {
                if (err)
                    reject(err);
                resolve(result);
            });
        }),
        new Promise(function (resolve, reject) {
            pool.query(st.clear_statistics.drops, function (err, result) {
                if (err)
                    reject(err);
                resolve(result);
            });
        }),
        new Promise(function (resolve, reject) {
            pool.query(st.clear_statistics.exchanges, function (err, result) {
                if (err)
                    reject(err);
                resolve(result);
            });
        }),
        new Promise(function (resolve, reject) {
            pool.query(st.clear_statistics.compounds, function (err, result) {
                if (err)
                    reject(err);
                resolve(result);
            });
        }),
        new Promise(function (resolve, reject) {
            pool.query(st.clear_statistics.upgrades, function (err, result) {
                if (err)
                    reject(err);
                resolve(result);
            });
        }),
    ]);
};

module.exports = {
    insertKill: insertKill,
    insertDrop: insertDrop,
    insertExchange: insertExchange,
    insertCompound: insertCompound,
    insertUpgrade: insertUpgrade,
    insertApiKey: insertApiKey,
    getLimits: getLimits,
    aggregateDrops: aggregateDrops,
    aggregateKills: aggregateKills,
    aggregateExchanges: aggregateExchanges,
    aggregateUpgrades: aggregateUpgrades,
    aggregateCompounds: aggregateCompounds,
    updateDropStatistics: updateDropStatistics,
    updateKillStatistics: updateKillStatistics,
    updateExchangeStatistics: updateExchangeStatistics,
    updateUpgradesStatistics: updateUpgradesStatistics,
    updateCompoundsStatistics: updateCompoundsStatistics,
    getKillsByMonster: getKillsByMonster,
    getDropsByMonster: getDropsByMonster,
    getExchangesByItemName: getExchangesByItemName,
    getUpgradesByItemName: getUpgradesByItemName,
    getCompoundsByItemName: getCompoundsByItemName,
    validKey: validKey,
    getReverseDrop: getReverseDrop,
    clearAllStatistics: clearAllStatistics,
    pool: pool,
}

