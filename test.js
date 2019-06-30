const fetcher = require("./data/DataFetcher");

var obj = {
    a:{},
    b:{b:"a"},
}
function saveAccessNestedProperty(obj, path, errorOnFail){
    if(typeof obj === "object"){
        let current_obj = obj;
        let i = 0;
        while(path.length-1 > i){
            let name = path[i];
            if(current_obj.hasOwnProperty(name) && typeof current_obj[name] === "object"){
                current_obj = current_obj[name];
                i++;
            } else {
                return undefined;
            }
        }
        if(current_obj.hasOwnProperty(path[path.length-1])){
            return current_obj[path[path.length-1]];
        } else {
            if(errorOnFail){
                throw "Undefined property";
            }
            return undefined;
        }
    }
    if(errorOnFail){
        throw "obj is not an object";
    }
    return undefined;
}


console.log(saveAccessNestedProperty(obj, ["a"], false));