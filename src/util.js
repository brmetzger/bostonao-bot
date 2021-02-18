//Require external modules
const FS = require("fs");
const PATH = require("path");

//Get a random element from an array
exports.randomFrom = function(useArray) {
    return useArray[Math.floor(Math.random() * useArray.length)];
};

//Write to a JSON file
exports.writeJSON = function(filePath,data) {
    FS.writeFileSync(PATH.join(__dirname, filePath),JSON.stringify(data));  
};