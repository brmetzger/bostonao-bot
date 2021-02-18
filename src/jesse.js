//Require internal modules
const PHRASES = require("./data/jesse.json");
const SLANG = require("./data/slang.json");
let Util = require("./util.js");

//Replace variables within a phrase
function handlePhrase(message,phrase) {
    let nickname = message.guild.members.cache.get(message.author.id).nickname; //To get the nickname, you have to get the member object from the guild rather than the user object from the message.
    
    //Make this more efficient later, especially if more conditions are added.
    phrase = phrase.replaceAll("${USER}",nickname);
    phrase = phrase.replaceAll("${USERCAPS}",nickname.toUpperCase());
    phrase = phrase.replaceAll("${SLANG}",Util.randomFrom(SLANG));
    return phrase;
};

//Execute the command
exports.Execute = function(client,message,args) {
    message.channel.send(handlePhrase(message,Util.randomFrom(PHRASES)));
};

//Set up the command
exports.Command = "jesse";