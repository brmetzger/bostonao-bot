//Require external dependencies
const DISCORD = require("discord.js");
const FS = require("fs");

//Require internal dependencies
const CONFIG = require("./config.json");
let points = require("./points.json");
let tributePool = require("./tributes.json");
let util = require("./util.js");

//Setup the scenarios for Hunger Games
let scenarios = {};
exports.Setup = function() {
    function loadScenarios(path) {
        //Get the files as an array
        let output = [];
        let filenames = FS.readdirSync(`./scenarios/${path}`);
        filenames.forEach(filename => {
            let content = FS.readFileSync(`./scenarios/${path}/${filename}`, "utf-8")
            output[output.length] = JSON.parse(content);
        });
        return output;
    };
    scenarios["day"] = loadScenarios("day");
    scenarios["night"] = loadScenarios("night");
    scenarios["bloodbath"] = loadScenarios("bloodbath");
};

//Class for each player
class Player {
    constructor(name,gender) {
        this.Name = name;
        this.Gender = gender;
    };
};

let pronouns = {
    "M":{
        "He/She":"He",
        "he/she":"he",
        "Him/Her":"Him",
        "him/her":"him",
        "His/Hers":"His",
        "his/hers":"his",
        "His/Her":"His",
        "his/her":"his"
    },
    "F":{
        "He/She":"She",
        "he/she":"she",
        "Him/Her":"Her",
        "him/her":"her",
        "His/Hers":"Hers",
        "his/hers":"hers",
        "His/Her":"Her",
        "his/her":"her"
    }
};
function formatScenario(scenario,tributes) {
    let output = scenario.Message;
    for (let i = 0;i < tributes.length;i++) {
        output = output.replaceAll("${P" + (i + 1) + "}",tributes[i].Name);
        for (let pronounset in pronouns[tributes[i].Gender]) {
            output = output.replaceAll("${P" + (i + 1) + pronounset + "}",pronouns[tributes[i].Gender][pronounset]);
        };
    };

    return output;
};

function tributeNames(tributes,killCount) {
    let output = "";
    if (tributes.length > 2) {
        for (let i = 0;i < tributes.length - 1;i++) {
            output += `${tributes[i].Name}${killCount && ` (${tributes[i].Kills} kill${tributes[i].Kills != 1 && "s" || ""})` || ""}, `
        };
        output += `and ${tributes[tributes.length - 1].Name}${killCount && ` (${tributes[tributes.length - 1].Kills} kill${tributes[tributes.length - 1].Kills != 1 && "s" || ""})` || ""}`;
    } else if (tributes.length == 2) {
        output = `${tributes[0].Name}${killCount && ` (${tributes[0].Kills} kill${tributes[0].Kills != 1 && "s" || ""})` || ""} and ${tributes[1].Name}${killCount && ` (${tributes[1].Kills} kill${tributes[1].Kills != 1 && "s" || ""})` || ""}`;
    } else if (tributes.length == 1) {
        output = `${tributes[0].Name}${killCount && ` (${tributes[0].Kills} kill${tributes[0].Kills != 1 && "s" || ""})` || ""}`;
    };
    return output;
};

const COOLDOWN = 10000;
var wait = ms => new Promise((r, j)=>setTimeout(r, ms));
let wagers = {};
async function handleSetting(sendmsg,tributes,killed,setting,haveWagers) {
    //Set up the list of tributes to be used
    let use_tributes = [];
    for (let i = 0;i < tributes.length;i++) {
        use_tributes[use_tributes.length] = tributes[i];
    };

    //Go through all the tributes
    while (use_tributes.length > 0) {
        let scenario = scenarios[setting][Math.floor(Math.random() * scenarios[setting].length)];
        if (scenario.Tributes <= use_tributes.length) {
            let scenario_tributes = [];
            for (let i = 0;i < scenario.Tributes;i++) { 
                let tribute = use_tributes[Math.floor(Math.random() * use_tributes.length)];
                scenario_tributes[scenario_tributes.length] = tribute;
                use_tributes.splice(use_tributes.indexOf(tribute),1);
            };
            
            //Print the scenario
            await wait(COOLDOWN);
            sendmsg(formatScenario(scenario,scenario_tributes));

            //Kill off the dead tributes
            if (scenario.Killed) {
                //Credit the killers
                if (scenario.Killers) {
                    for (let i = 0;i < scenario.Killers.length;i++) {
                        tributes[tributes.indexOf(scenario_tributes[scenario.Killers[i]-1])].Kills += scenario.Killed.length;
                    };
                };
                for (let i = 0;i < scenario.Killed.length;i++) {
                    if (haveWagers[tributes[tributes.indexOf(scenario_tributes[scenario.Killed[i]-1])].Name]) {
                        for (let j = 0;j < haveWagers[tributes[tributes.indexOf(scenario_tributes[scenario.Killed[i]-1])].Name].length;j++) {
                            sendmsg(`<@${haveWagers[tributes[tributes.indexOf(scenario_tributes[scenario.Killed[i]-1])].Name][j]}>, one of the tributes you wagered on has died.`);
                        };
                    };
                    tributes.splice(tributes.indexOf(scenario_tributes[scenario.Killed[i]-1]),1);
                    killed[killed.length] = scenario_tributes[scenario.Killed[i]-1];
                };
            };
        };
    };
    return tributes, killed;
};

async function startGame(sendmsg,tributes) {
    //Save the wavers
    let gameWagers = wagers;
    wagers = {};
    console.log(gameWagers);
    let haveWagers = {};
    for (let userid in gameWagers) {
        for (let i = 0;i < gameWagers[userid].length;i++) {
            if (!haveWagers[gameWagers[userid][i]]) {
                haveWagers[gameWagers[userid][i]] = [];      
            };
            haveWagers[gameWagers[userid][i]][haveWagers[gameWagers[userid][i]].length] = userid;
        };
    };
    console.log(haveWagers);

    //Announce the game's start
    sendmsg(`Welcome to the Hunger Games! The tributes below will be dropped into an arena in the middle of the wilderness, and the last one standing will be declared victor!\n\`${tributeNames(tributes)}\``);
    await wait(3000);
    sendmsg("A cornucopia full of goods that will help the tributes survive has been placed in the middle of the arena. Let the bloodbath begin!");

    //Setup the game
    let killed = [];
    let origCount = tributes.length;
    for (let i = 0;i<tributes.length;i++) {
        tributes[i].Kills = 0;
    };

    //Start the bloodbath
    tributes, killed = await handleSetting(sendmsg,tributes,killed,"bloodbath",haveWagers);
    let cycle = 0;
    while (tributes.length > 1) {
        cycle++;
        await wait(3000);
        sendmsg(`Day ${cycle}`);
        tributes, killed = await handleSetting(sendmsg,tributes,killed,"day",haveWagers);
        await wait(3000);
        if (tributes.length > 1) {
            if (killed.length > 0) {
                sendmsg(`The sun sets, and cannon shots can be heard in the distance in memorial of the tributes who died today.\n\`${tributeNames(killed,true)} ha${killed.length != 1 && "ve" || "s"} died. ${tributes.length} tributes remain.\``);
            } else {
                sendmsg("The sun sets, and no cannon shots are heard. No tributes were slain.");
            };
            killed = [];
            await wait(3000);
            sendmsg(`Night ${cycle}`);
            tributes, killed = await handleSetting(sendmsg,tributes,killed,"night",haveWagers);
        };
    };
    if (tributes.length > 0) {
        sendmsg(`${tributes[0].Name} is the victor of the Hunger Games with ${tributes[0].Kills} kill${tributes[0].Kills != 1 && "s" || ""}!`);
        for (let userid in gameWagers) {
            for (let i = 0;i < gameWagers[userid].length;i++) {
                if (gameWagers[userid][i] == tributes[0].Name) {
                    //Wager was correct
                    let wagerpoints = 4 - gameWagers[userid].length;
                    sendmsg(`<@${userid}> You have been awarded ${wagerpoints} point${wagerpoints != 1 && "s" || ""} for your wager!`);

                    //Award the user their lasting points
                    if (!points[userid]) {
                        points[userid] = 0;
                    };
                    points[userid] += wagerpoints;
                    util.writeJSON("./points.json",points);
                    break;
                };
            };
        };
    } else {
        sendmsg(`${origCount} bodies were collected from the arena, but no victor could be found...`);
    };
};

function help(client,message,args) {
    //Setup the fields
    let fields = [];
    for (let command in exports.SubCommands) {
        fields[fields.length] = {name:command,value:exports.SubCommands[command].Description,inline:true};
    };

    message.reply(new DISCORD.MessageEmbed()
        .setTitle("Hunger Games Commands")
        .setDescription("The Hunger Games bot runs a simulated hunger games scenario using a list of tributes.")
        .addFields(fields)
    );
};

//Start the game using the command
function pubstart(client,message,args) {
    let playerPool = [];
    for (let i = 0;i < tributePool.length;i++) {
        playerPool[i] = new Player(tributePool[i].Name,tributePool[i].Gender);
    };
    startGame(function(content) {client.channels.cache.get(CONFIG.GameChannel).send(content);},playerPool)
};

//Add a new tribute
function addtribute(client,message,args) {
    if (args.length != 4) {
        message.reply("Unexpected syntax. Expected \">hgames addtribute <Name> <M/F>\"");
        return;
    };

    args[3] = args[3].toUpperCase();
    if (args[3] != "M" && args[3] != "F") {
        message.reply("Unexpected gender input. Expected \"M\" or \"F\"");
        return;
    };

    //Check if the tribute is already in the pool
    for (let i = 0;i < tributePool.length;i++) {
        if (tributePool[i].Name.toUpperCase() == args[2].toUpperCase()) {
            message.reply(`The tribute "${args[2]}" already exists.`);
            return;
        };
    };

    //Add the tribute to the pool
    tributePool[tributePool.length] = {"Name":args[2],"Gender":args[3]};
    util.writeJSON("./tributes.json",tributePool);
    let warning = "";
    if (tributePool.length != 24) {
        warning = ` This game was designed for 24 players. You currently have ${tributePool.length}.`
    };
    message.reply(`The tribute ${args[2]} has been added to the pool.${warning}`);
};

//Add a new tribute
function removetribute(client,message,args) {
    if (args.length != 3) {
        message.reply("Unexpected syntax. Expected \">hgames removetribute <Name>\"");
        return;
    };

    //Check if the tribute is in the pool
    for (let i = 0;i < tributePool.length;i++) {
        if (tributePool[i].Name.toUpperCase() == args[2].toUpperCase()) {
            let newPool = [];
            for (let j = 0;j < tributePool.length;j++) {
                if (j != i) {
                    newPool[newPool.length] = tributePool[j];
                };
            };
            tributePool = newPool;
            util.writeJSON("./tributes.json",tributePool);
            message.reply(`The tribute ${args[2]} has been removed from the pool.`);
            return;
        };
    };

    //Add the tribute to the pool
    tributePool[tributePool.length] = {"Name":args[2],"Gender":args[3]};
    
    let warning = "";
    if (tributePool.length != 24) {
        warning = ` This game was designed for 24 players. You currently have ${tributePool.length}.`
    };
    message.reply(`The tribute ${args[2]} has been added to the pool.${warning}`);
};

//List all tributes
function listtributes(client,message,args) {
    message.reply(`The current tributes are:\n\`${tributeNames(tributePool)}\``);
};

//Put a wager on three tributes
function setwager(client,message,args) {
    if (args.length < 3 || args.length > 5) {
        message.reply("Unexpected syntax. Expected \">hgames setwager <Name> <Optional Name> <Optional Name>\"");
        return;
    };

    let playerWagers = [];
    for (let i = 2;i < args.length;i++) {
        //Check if the tribute is in the pool
        for (let j = 0;j < tributePool.length;j++) {
            if (tributePool[j].Name.toUpperCase() == args[i].toUpperCase()) {
                playerWagers[playerWagers.length] = tributePool[j].Name;
                break;
            };
        };
    };

    if (playerWagers.length == 0) {
        message.reply("Tributes not found.");
        return;
    };
    wagers[message.author.id] = playerWagers;
    message.reply(`Wager on ${playerWagers.length} tribute${playerWagers.length != 1 && "s" || ""} successfully set.`)
};

//Set up the commands
exports.Command = "hgames";

//Set up the subcommands
exports.SubCommands = {
    "help":{
        "Execute":help,
        "Description":"List all available commands."
    },
    "start":{
        "Execute":pubstart,
        "Description":"Start a new instance of the game."
    },
    "addtribute":{
        "Execute":addtribute,
        "Description":"Add a new tribute to the pool."
    },
    "removetribute":{
        "Execute":removetribute,
        "Description":"Remove a tribute from the pool."
    },
    "tributes":{
        "Execute":listtributes,
        "Description":"List all tributes in the pool."
    },
    "wager":{
        "Execute":setwager,
        "Description":"Place a wager on three tributes for the next round."
    }
};