const fs = require('fs');
const Hapi = require('hapi');
const Request = require('request');
const data = require('../data');
const db = require('./sqlite');
const mysql = require("./mysql");

let SCRIPT_VERSION = 4;

const server = new Hapi.Server({
    debug: { request: ['error'] }
});

server.connection({ port: 25326, routes: { cors: true }});

const itemTypeByName = {};
for (let itemType of Object.keys(data.items)) {
    let item = data.items[itemType];
    let itemName = item.name;
    itemTypeByName[itemName] = itemType;
}

server.route({
    method: 'GET',
    path: '/apic',
    handler: (request, reply) => {
        const data = JSON.parse(request.payload.json);
        console.log(data)
        if (!mysql.validKey(data.key)) return reply().code(401);
        if (SCRIPT_VERSION !== data.version) return reply().code(426);
        reply().code(200);
    }
});

server.route({
    method: 'POST',
    path: '/kill',
    handler: async (request, reply) => {
        const killData = JSON.parse(request.payload);
        if (!mysql.validKey(killData.apiKey)) return reply().code(401);
        reply().code(200);
        console.log(killData);
        if(killData["kills"]) { // bulk multi-drop send
            let dataArray = [];
            for(let key in killData.kills) {
                var entity = killData.kills[key];
                if(entity.items.length > 0){
                    console.log(entity.items)
                }
                entity.items = entity.items.map(name => itemTypeByName[name]);
                console.log(entity.items)
                const dataValid = entity.items.every(name => name != null);
                if (dataValid) {
                    try{
                        var status = await mysql.insertKill(entity.type, entity.map, entity.level, entity.gold, entity.items.length, killData.name, killData.apiKey);
                        await mysql.updateKillStatistics(killData.name,entity.type, entity.map, entity.level,1,entity.gold);
                        for(let item of entity.items){
                            await mysql.insertDrop(item,status.insertId);
                            await mysql.updateDropStatistics(entity.type,item, entity.map, entity.level, 1);
                        }
                    }catch(e){
                        console.error(e);
                    }
                }
            }
        }
    }
});
/*
server.route({
    method: 'POST',
    path: '/update',
    handler: (request, reply) => {
        const updateData = JSON.parse(request.payload.json);
        if (!keys.includes(updateData.key)) return reply().code(403);
        if (SCRIPT_VERSION != updateData.version) return reply().code(426);

        reply().code(200);
        db.addMarket(updateData.items, updateData.player, updateData.map, updateData.server, updateData.key, updateData.version);
    }
});
*/
server.route({
    method: 'POST',
    path: '/upgrade',
    handler: (request, reply) => {
        const upgradeData = JSON.parse(request.payload.json);
        if (!keys.includes(upgradeData.key)) return reply().code(403);

        reply().code(200);
        db.addUpgrade(upgradeData);
    }
});

server.route({
    method: 'POST',
    path: '/compound',
    handler: (request, reply) => {
        console.log(request.payload.json);
        const compoundData = JSON.parse(request.payload.json);
        if (!keys.includes(compoundData.key)) return reply().code(403);

        reply().code(200);
        db.addCompound(compoundData);
    }
});

server.route({
    method: 'POST',
    path: '/exchange',
    handler: (request, reply) => {
        const exchangeData = JSON.parse(request.payload.json);
        if (!keys.includes(exchangeData.key)) return reply().code(403);

        reply().code(200);
        console.log(exchangeData);
        db.addExchange(exchangeData);
    }
});

module.exports.start = function() {
    server.start((err) => {
        if (err) throw err;
        console.log('Collection server running at:', server.info.uri);
    });

    fs.watch(__dirname + '/keys.json', { persistent: false }, () => {
        let res = fs.readFileSync(keyFile, 'utf-8');
        try {
            keys = JSON.parse(res);
        }
        catch(e) {
            console.log("Error parsing keys.json: " + e);
        }
    });
};
