let ACC = function () {
    this.asd = "gay";
    this.kills = {};
    this.chests = {};
    this.debug = false;
    this.apiKey = "7ddf32e17a6ac5ce04a8ecbf782ca509";
    this.dropServer = "drop.adventurecode.club"
};

ACC.prototype.registerListeners = function () {
    var self = this;
    function isCompound(itemName) {
        return !!(G.items[itemName].compound);

    }
    function isUpgrade(itemName) {
        return !!(G.items[itemName].upgrade);
    }
    socket.on("q_data",function(data){
        if(isCompound(data.p.name)){
            if(data.p.failure || data.p.success) {
                self.sendCompoundData(data);
            }
        }else if(isUpgrade(data.p.name)){
            if(data.p.failure || data.p.success) {
                self.sendUpgradeData(data);
            }
        }
    });
};

ACC.prototype.sendUpgradeData = function(data){
    let request = new XMLHttpRequest();
    request.open("POST", location.protocol +"//"+ this.dropServer + "/upgrade");
    var post = {
        apiKey: this.apiKey,
        characterName: character.id,
        ALBot: false,
        server: server_name,
        data: data,
    };
    request.send(JSON.stringify(post));
};i

ACC.prototype.sendCompoundData = function(data){
    let request = new XMLHttpRequest();
    request.open("POST", location.protocol +"//"+ this.dropServer + "/compound");
    var post = {
        apiKey: this.apiKey,
        characterName: character.id,
        ALBot: false,
        server: server_name,
        data: data,
    };
    request.send(JSON.stringify(post));
};
ACC.prototype.setup = function () {
    this.registerListeners();
};

ACC.prototype.detectGrouping = function () {
    return Object.keys(party).length != 0;
};

ACC.prototype.submitData = function(){

};

if (!window.ACC) {
    window.ACC = new ACC();
    parent.add_log("Starting Adventure Code Club Listener");
    window.ACC.setup();
}else {
    parent.add_log("Adventure Code Club Listener already running");
}

