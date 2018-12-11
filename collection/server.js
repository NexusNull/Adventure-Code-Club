const fs = require('fs');
const Hapi = require('hapi');
const Request = require('request');
const data = require('../data');
const db = require('./sqlite');

const keyFile = __dirname + '/keys.json';
let keys = require(keyFile);
let SCRIPT_VERSION = -1;

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
    method: 'POST',
    path: '/apic',
    handler: (request, reply) => {
        const data = JSON.parse(request.payload.json);
        if (!keys.includes(data.key)) return reply().code(403);
        if (SCRIPT_VERSION != data.version) return reply().code(426);
        reply().code(200);
    }
});

server.route({
    method: 'POST',
    path: '/drop',
    handler: (request, reply) => {
        const dropData = JSON.parse(request.payload.json);
        if (!keys.includes(dropData.key)) return reply().code(403);
        if (SCRIPT_VERSION != dropData.version) return reply().code(426);
        reply().code(200);

        if(dropData.hasOwnProperty("data")) { // bulk multi-drop send
            let dataArray = [];
            for(let entry of dropData.data) {
                entry.items = entry.items.map(name => itemTypeByName[name]);
                const dataValid = entry.items.every(name => name != null);
                if (dataValid) {
                    dataArray.push(entry);
                }
            }
            db.addDrops(dataArray, dropData.key, dropData.version);
        } else { // deprec old single-drop send
            dropData.items = dropData.items.map(name => itemTypeByName[name]);
            const dataValid = dropData.items.every(name => name != null);

            if (!dataValid) return;

            db.addDrop(dropData);
        }
    }
});

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
