//Require external modules
const DISCORD = require("discord.js");
const FS = require("fs");

//Load all the memes
let memes = {};
const MEME_PHRASES = [
    "Here's a special meme brewed up just for you!",
    "Hey, check out this meme!",
    "Yo, check this epic meme.",
    "This one nearly killed me!"
];
function loadMemes(path) {
    //Get the files as an array
    let output = [];
    let filenames = FS.readdirSync(`./${path}`);
    filenames.forEach(filename => {
        output[output.length] = `./${path}/${filename}`;
    });
    return output;
};
memes["bostonao"] = loadMemes("bostonao");

//List all available commands
function help(client,message,args) {
    //Setup the fields
    let fields = [];
    for (let command in exports.SubCommands) {
        fields[fields.length] = {name:command,value:exports.SubCommands[command].Description,inline:true};
    };

    message.reply(new DISCORD.MessageEmbed()
        .setTitle("Meme Commands")
        .setDescription("Curated clean memes for your enjoyment, gathered from the Internet or made in house.")
        .addFields(fields)
    );
};

//Post a meme
function postmeme(client,message,args) {
    message.reply(Util.randomFrom(MEME_PHRASES),{
        files:[Util.randomFrom(memes[args[1].toLowerCase()])]
    });
};

//Set up the command
exports.Command = "meme";

//Set up the subcommands
exports.SubCommands = {
    "help":{
        "Execute":help,
        "Description":"List all available commands."
    },
    "bostonao":{
        "Execute":postmeme,
        "Description":"Post a BostonAO related meme."
    }
};