//Require external modules
const FS = require("fs");
const PATH = require("path");

//Write to a JSON file
exports.writeJSON = function(filePath,data) {
    FS.writeFileSync(PATH.join(__dirname, filePath),JSON.stringify(data));  
};