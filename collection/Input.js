let Input = function () {


};

Input.prototype.validate = function (variable, type, options) {
    switch (type) {
        case "int": {
            if (options == undefined)
                options = {};
            let max = Number.MAX_SAFE_INTEGER;
            let min = Number.MIN_SAFE_INTEGER;
            if (options.max !== undefined)
                max = options.max;
            if (options.min !== undefined)
                min = options.min;
            return this.checkInt(variable, min, max);
        }
        case "double": {
            let max = Infinity;
            let min = -Infinity;
            if (options === undefined)
                options = {};
            if (options.max !== undefined)
                max = options.max;
            if (options.min !== undefined)
                min = options.min;
            return this.checkDouble(variable, min, max);
        }
        case "string": {
            let max = Infinity;
            let min = 0;
            if (options === undefined)
                options = {};
            if (options.max !== undefined)
                max = options.max;
            if (options.min !== undefined)
                min = options.min;
            return this.checkString(variable, min, max);
        }
        case "bool": {
            return this.checkBoolean(variable);
        }
        default:
            throw "Invalid type";
    }
};

Input.prototype.checkInt = function (number, min, max) {
    return (typeof number == "number" &&
        (number % 1) === 0 &&
        min <= number &&
        max >= number);
};

Input.prototype.checkDouble = function (number, min, max) {
    return (
        typeof number == "number" &&
        !isNaN(parseFloat(number)) &&
        isFinite(number) &&
        min <= number &&
        max >= number
    );
};

Input.prototype.checkString = function (string, min, max) {
    return (
        typeof string == "string" &&
            string.length >= min &&
        string.length <= max
    )
};
Input.prototype.checkBoolean = function(boolean){
    return typeof boolean === "boolean";
}
module.exports = Input;