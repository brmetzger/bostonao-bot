//Require external modules
const DISCORD = require("discord.js");
    let client = new DISCORD.Client();

//Require internal modules
let clientInfo = require("./client.json");
let config = require("./config.json");
let Jesse = require("./jesse.js");
let Memes = require("./memes.js");
let Util = require("./util.js");
const STATUSES = require("./data/status.json");

//Load the modules set up for commands
const COMMAND_MODULES = {
    [Jesse.Command]:Jesse,
    [Memes.Command]:Memes
};
const ROLES = {
    "minecraft":"811378789786845204",
    "wandavision":"811378062524022806"
};

//Update the bot's status
/*
    The statuses are contained in src/data/status.json, and have the following formats:
    COMPETING: Competing in...
    LISTENING: Listening to...
    PLAYING: Playing...
    STREAMING: Playing...
    WATCHING: Watching...
    These are the status formats currently supported by Discord.
    Custom statuses are not available for bots at the time of writing this. (02/18/2021)
*/
function updateStatus() {
    client.user.setPresence({
        activity:Util.randomFrom(STATUSES)
    });
    //Change the status every minute
    setTimeout(updateStatus,60000);
};

//Bot logged in, perform initial setup
client.on("ready", async () => {
    console.log(`Logged in as ${client.user.tag} using ID ${client.user.id}!`);
    if (!config.RoleMessage) {
        //Create the role message
        let new_role_message = await client.channels.cache.get(config.RoleChannel).send("@everyone");
        config.RoleMessage = new_role_message.id;
        Util.writeJSON("./config.json",config);
    };

    //Write the role message
    client.channels.cache.get(config.RoleChannel).messages.fetch(config.RoleMessage).then(role_message => {role_message.edit(new DISCORD.MessageEmbed()
        .setColor("5f9afa")
        .setTitle("React to gain access to specific roles")
        .setThumbnail("https://cdn.discordapp.com/icons/807751336959148060/4b862d0e99235badcc76c28c57e21f06.webp?size=256")
        .setDescription("To prevent unwanted notifications, we've added roles you can subscribe to to get certain notifications! Just add a reaction to this message to get notified when something happens regarding one of these roles.")
        .addFields(
            {name:"<:minecraft:811359879024476160> Minecraft",value:"If you're interested in playing Minecraft with others here, just react to this message with \"<:minecraft:811359879024476160>\""},
            {name:"<:wandavision:811359535817424907> WandaVision",value:"If you're interested in watching WandaVision with others here, just react to this message with \"<:wandavision:811359535817424907>\""},
        )
    )});

    //Begin the status loop.
    updateStatus();
});

client.on("message",(message) => {
    if (message.content.startsWith(config.CommandPrefix)) {
        let args = message.content.split(" ");
        if (COMMAND_MODULES[args[0].replace(config.CommandPrefix,"")]) {
            if (COMMAND_MODULES[args[0].replace(config.CommandPrefix,"")].SubCommands) {
                args[1] = args[1] || "help";
                if (COMMAND_MODULES[args[0].replace(config.CommandPrefix,"")].SubCommands[args[1].toLowerCase()]) {
                    COMMAND_MODULES[args[0].replace(config.CommandPrefix,"")].SubCommands[args[1].toLowerCase()].Execute(client,message,args);
                };
            } else {
                COMMAND_MODULES[args[0].replace(config.CommandPrefix,"")].Execute(client,message,args);
            };
        };
    };
});

client.on("messageReactionAdd", async (reaction, user) => {
    if (clientInfo.logging) {
        console.log(reaction.emoji.name);
    };
    if (reaction.message.id == config.RoleMessage && ROLES[reaction.emoji.name]) {
        reaction.message.guild.member(user).roles.add(ROLES[reaction.emoji.name]);
    };
});

client.on("messageReactionRemove", async (reaction, user) => {
    if (reaction.message.id == config.RoleMessage && ROLES[reaction.emoji.name]) {
        reaction.message.guild.member(user).roles.remove(ROLES[reaction.emoji.name]);
    };
});


client.login(clientInfo.token);