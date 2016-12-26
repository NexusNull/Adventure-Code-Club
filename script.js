/* eslint indent: 0 */
(function() {
let DROP_SERVER = 'http://adventurecode.club:13726';
let DROP_SERVER2 = window.aldc_second_server;
let DROP_SERVER2_USE = window.aldc_second_use;
let TRACKING_TIMEOUT = 5000;
let DROP_TIMEOUT = 500;
let DROP_API_KEY = window.aldc_apikey; // REPLACE THIS WITH YOUR API KEY => Ask me for one, on discord, PM or email
let tracked_entities = [];
let tracked_entities_times = {};
let tracked_chests = {};
let tracked_drops = null;

if (parent.prev_handlers) {
    for (let [event, handler] of parent.prev_handlers) {
        parent.socket.removeListener(event, handler);
    }
}

parent.prev_handlers = [];

function register_handler(event, handler) {
    parent.prev_handlers.push([event, handler]);
    parent.socket.on(event, handler);
}

// death -> log "xx killed yy" -> drop

function death_handler(data) {
    if(!parent) return;
    let entity = parent.entities[data.id];
    if (!entity) return;

    let entity_data = {
        x: entity.real_x,
        y: entity.real_y,
        type: entity.mtype,
        seen: Date.now(),
        ours: false
    };

    tracked_entities.push(entity_data);

    setTimeout(() => {
        let index = tracked_entities.indexOf(entity_data);
        if (index != -1) {
            tracked_entities.splice(index, 1);
        }
    }, TRACKING_TIMEOUT);
}

function drop_handler(drop) {
    if(!parent) return;
    let min_distance = Infinity;
    let best_entity = null;

    for (let entity of tracked_entities) {
        let dist = parent.simple_distance(drop, entity);
        if (dist < min_distance) {
            best_entity = entity;
            min_distance = dist;
        }
    }

    if (min_distance > 8 || !best_entity.ours) return;

    let index = tracked_entities.indexOf(best_entity);
    tracked_entities.splice(index, 1);

    let chest_data = {
        type: drop.chest,
        items: drop.items,
        monster: best_entity.type,
        map: parent.current_map,
    };

    tracked_chests[drop.id] = chest_data;

    setTimeout(() => {
        if (drop.id in tracked_chests) {
            delete tracked_chests[drop.id];
        }
    }, TRACKING_TIMEOUT);
}

let LOG_KILL_REGEX = /^(\w*) killed an? (.*)$/;
let LOG_GOLD_REGEX = /^(\d+) gold$/;
let LOG_ITEM_REGEX = /(\w*)\s*[Ff]ound an? (.*)$/;
function log_handler(log) {
    if(!parent) return;
    if (typeof log == "string") {
        determineResponsibility(log);
    }

    if (!tracked_drops || tracked_drops.finished || tracked_drops.time + DROP_TIMEOUT < Date.now()) {
        tracked_drops = { gold: 0, items: [], time: Date.now(), finished: false };
    }

    if (log.color == 'gold') {
        let gold_info = LOG_GOLD_REGEX.exec(log.message);
        if (!gold_info) return;

        let gold = Number(gold_info[1]);
        tracked_drops.gold = (gold / character.goldm);
        tracked_drops.finished = true;
    } else if (log.color == '#4BAEAA') {
        let drop_info = LOG_ITEM_REGEX.exec(log.message);
        if (!drop_info) return;

        tracked_drops.items.push(drop_info[2]);
    }
}

function determineResponsibility(logMessage) {
    let kill_info = LOG_KILL_REGEX.exec(logMessage);
    if(kill_info) {
        let now = Date.now();
        let ours = kill_info[1] == character.name || logMessage.startsWith("You killed ");
        if(ours)                {
            for(let entity_data of tracked_entities) {
                if(Math.abs(now - entity_data.seen) < 10) {
                    entity_data.ours = true;
                }
            }
        }
    }
}

function chest_handler(chest) {
    if(!parent) return;
    if (!tracked_drops || tracked_drops.time + DROP_TIMEOUT < Date.now()) {
        tracked_drops = null;
        return;
    }

    if (!tracked_drops.finished) return;

    let chest_data = tracked_chests[chest.id];
    if (!chest_data) return;

    if (tracked_drops.items.length != chest_data.items) {
        tracked_drops = null;
        return;
    }

    let payload = {
        player: character.name,
        members: (character.party ? parent.party_list.length : 1),
        type: chest_data.type,
        monster: chest_data.monster,
        map: chest_data.map,
        gold: tracked_drops.gold,
        items: tracked_drops.items,
        key: DROP_API_KEY,
    };

    console.log(`Reporting kill of ${chest_data.monster} by ${character.name} for ${tracked_drops.gold} and ${tracked_drops.items} items`);

    let data = new FormData();
    data.append('json', JSON.stringify(payload));

    fetch(`${DROP_SERVER}/drop`, {
        method: 'POST',
        body: data
    }).catch(() => {});

    if(DROP_SERVER2_USE) {
        fetch(`${DROP_SERVER2}/drop`, {
            method: 'POST',
            body: data
        }).catch(() => {});
    }

    tracked_drops = null;
}

register_handler('death', death_handler);
register_handler('drop', drop_handler);
register_handler('game_log', log_handler);
register_handler('chest_opened', chest_handler);
}());
