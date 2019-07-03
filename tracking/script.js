let ACC = function () {
    this.kills = {};
    this.chests = {};
    this.debug = false;
    this.apiKey = "7ddf32e17a6ac5ce04a8ecbf782ca509";
    this.dropServer = "drop.adventurecode.club"
    this.UI = new ACCUI(this);
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
};

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
    this.UI.addACCMenuButton();
};

ACC.prototype.detectGrouping = function () {
    return Object.keys(party).length != 0;
};

ACC.prototype.submitData = function(){

};

ACCUI = function(){
    this.menu = null;

};

ACCUI.prototype.addACCMenuButton = function(){
    var self = this;
    let menuOpener = document.createElement("div");
    menuOpener.innerHTML = "ACC";
    menuOpener.setAttribute("class","gamebutton");
    menuOpener.addEventListener("click", self.openMenu.bind(self));
    let topRightCorner = document.getElementById("toprightcorner");
    topRightCorner.insertBefore(menuOpener, topRightCorner.children[1]);
};

ACCUI.prototype.openMenu = function(){
    if(!this.menu){
        let menu = document.createElement("div");
        this.menu = menu;
        menu.setAttribute("class","modal");
        menu.setAttribute("style","position: fixed; top: 0px; bottom: 0px; left: 0px; right: 0px; z-index: 9000; text-align: center; vertical-align: middle; overflow-y: scroll; background: rgba(0,0,0,0.4)")
        menu.innerHTML = "<div>hello there</div>";
        menu.addEventListener("click",function(){menu.parentNode.removeChild(menu)});
        document.body.append(menu);
    } else {
        document.body.append(this.menu);
    }
};

if (!window.ACC) {
    window.ACC = new ACC();
    parent.add_log("Starting Adventure Code Club Listener");
    window.ACC.setup();
}else {
    parent.add_log("Adventure Code Club Listener already running");
}

