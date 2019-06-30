const Hapi = require('hapi');
const data = require('../data/DataFetcher');
const mysql = require("./mysql");

let SCRIPT_VERSION = 4;

const server = new Hapi.Server({
    debug: {request: ['error']}
});

server.connection({port: 8082, routes: {cors: true}});

server.route({
    method: 'GET',
    path: '/apic',
    handler: (request, reply) => {
        const data = JSON.parse(request.payload.json);
        if (!mysql.validKey(data.key)) return reply().code(401);
        if (SCRIPT_VERSION !== data.version) return reply().code(426);
        reply().code(200);
    }
});

server.route({
    method: 'POST',
    path: '/upgrade',
    handler: async (request, reply) => {
        let upgradeData;
        try {
            upgradeData = JSON.parse(request.payload);
        } catch (e) {
            reply("invalid JSON").code(400);
            return;
        }
        let api_key_id;
        let valid_api_key;
        let api_key = saveAccessNestedProperty(upgradeData, ["apiKey"]);
        try {
            var result = await mysql.getApiKeyId(api_key);
            api_key_id = result[0].id;
            valid_api_key = !!result[0].valid;
        } catch (e) {
            console.error("api_key: " + api_key + "\n" + e);
            reply("Invalid api_key").code(400);
            return;
        }
        if (!valid_api_key) {
            console.error("api_key: " + api_key + " is invalid");
            reply("your api_key has been invalidated, please request a new one.").code(400);
            return;
        }

        let characterName = saveAccessNestedProperty(upgradeData, ["characterName"]);
        let server = saveAccessNestedProperty(upgradeData, ["server"]);
        let ALBot = saveAccessNestedProperty(upgradeData, ["ALBot"]);
        let slot_num = saveAccessNestedProperty(upgradeData, ["data", "num"]);
        let chance = parseFloat(saveAccessNestedProperty(upgradeData, ["data", "p", "chance"]));
        let nums = saveAccessNestedProperty(upgradeData, ["data", "p", "nums"]);
        let item_name = saveAccessNestedProperty(upgradeData, ["data", "p", "name"]);
        let item_level = saveAccessNestedProperty(upgradeData, ["data", "p", "level"]);
        let scroll_type = saveAccessNestedProperty(upgradeData, ["data", "p", "scroll"]);
        let offering = !!saveAccessNestedProperty(upgradeData, ["data", "p", "offering"]);
        let uchance = Math.floor(chance * 10000);
        if (Array.isArray(nums)) {
            nums = parseInt(nums.reverse().join(""));
        }
        let success = saveAccessNestedProperty(upgradeData, ["data", "p", "success"]);
        let len = parseInt(saveAccessNestedProperty(upgradeData, ["data", "q", "upgrade", "len"]));
        try {
            await mysql.insertUpgrade(item_name, item_level, scroll_type, offering, slot_num, len, !!success, nums, uchance, chance, api_key_id, characterName, server);
            await mysql.updateUpgradeStatistics(item_name, item_level, 1, !!success);
        } catch (e) {
            console.error("APIKey: " + api_key + " Character: " + characterName + " ALBot: " + ALBot + "\n" + e);
            reply().code(400);
            return;
        }
        reply().code(200);
    }
});

server.route({
    method: 'POST',
    path: '/compound',
    handler: async (request, reply) => {
        let compoundData;
        try {
            compoundData = JSON.parse(request.payload);
        } catch (e) {
            reply("invalid JSON").code(400);
            return;
        }
        let api_key_id;
        let valid_api_key;
        let api_key = saveAccessNestedProperty(compoundData, ["apiKey"]);
        try {
            var result = await mysql.getApiKeyId(api_key);
            api_key_id = result[0].id;
            valid_api_key = !!result[0].valid;
        } catch (e) {
            console.error("api_key: " + api_key + "\n" + e);
            reply("Invalid api_key").code(400);
            return;
        }
        if (!valid_api_key) {
            console.error("api_key: " + api_key + " is invalid");
            reply("your api_key has been invalidated, please request a new one.").code(400);
            return;
        }

        let characterName = saveAccessNestedProperty(compoundData, ["characterName"]);
        let server = saveAccessNestedProperty(compoundData, ["server"]);
        let ALBot = saveAccessNestedProperty(compoundData, ["ALBot"]);
        let slot_num = saveAccessNestedProperty(compoundData, ["data", "num"]);
        let chance = parseFloat(saveAccessNestedProperty(compoundData, ["data", "p", "chance"]));
        let nums = saveAccessNestedProperty(compoundData, ["data", "p", "nums"]);
        let item_name = saveAccessNestedProperty(compoundData, ["data", "p", "name"]);
        let item_level = saveAccessNestedProperty(compoundData, ["data", "p", "level"]);
        let scroll_type = saveAccessNestedProperty(compoundData, ["data", "p", "scroll"]);
        let offering = !!saveAccessNestedProperty(compoundData, ["data", "p", "offering"]);
        let uchance = Math.floor(chance * 10000);
        if (Array.isArray(nums)) {
            nums = parseInt(nums.reverse().join(""));
        }
        let success = saveAccessNestedProperty(compoundData, ["data", "p", "success"]);
        let len = parseInt(saveAccessNestedProperty(compoundData, ["data", "q", "compound", "len"]));
        try {
            await mysql.insertCompound(item_name, item_level, scroll_type, offering, slot_num, len, !!success, nums, uchance, chance, api_key_id, characterName, server);
            await mysql.updateCompoundStatistics(item_name, item_level, 1, !!success);
        } catch (e) {
            console.error("APIKey: " + api_key + " Character: " + characterName + " ALBot: " + ALBot + "\n" + e);
            reply().code(400);
            return;
        }

        reply().code(200);
    }
});

module.exports.start = function () {
    server.start((err) => {
        if (err) throw err;
        console.log('Collection server running at:', server.info.uri);
    });
};

function saveAccessNestedProperty(obj, path, errorOnFail) {
    if (typeof obj === "object") {
        let current_obj = obj;
        let i = 0;
        while (path.length - 1 > i) {
            let name = path[i];
            if (current_obj.hasOwnProperty(name) && typeof current_obj[name] === "object") {
                current_obj = current_obj[name];
                i++;
            } else {
                return undefined;
            }
        }
        if (current_obj.hasOwnProperty(path[path.length - 1])) {
            return current_obj[path[path.length - 1]];
        } else {
            if (errorOnFail) {
                throw "Undefined property";
            }
            return undefined;
        }
    }
    if (errorOnFail) {
        throw "obj is not an object";
    }
    return undefined;
}
