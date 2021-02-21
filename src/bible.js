//Require external modules
const AXIOS = require("axios");
const DISCORD = require("discord.js");

//Require internal modules
let Util = require("./util.js");
let VERSES = require("./data/verses.json");

function help(client,message,args) {
    let fields = [];
    for (let command in exports.SubCommands) {
        fields[fields.length] = {name:command,value:exports.SubCommands[command].Description,inline:true};
    }

    message.reply(new DISCORD.MessageEmbed()
        .setAuthor("Emma Price","https://avatars.githubusercontent.com/u/15811327?s=460&u=a479787e5fb1e805b48f1c815d3f897feeb34125&v=4","https://github.com/pricee")
        .setTitle("Bible Commands")
        .setDescription("Go read your Bible")
        .addFields(fields)
    );
}

async function verseOfTheDay(client, message, args) {
    const { data : { verse: { details: { text, reference } } } } = await AXIOS.get("https://beta.ourmanna.com/api/v1/get/?format=json");
    message.reply(`"${text}" -- ${reference}`);
}

async function randomVerse(client, message, args) {
    const { data : { verse: { details: { text, reference } } } } = await AXIOS.get("https://beta.ourmanna.com/api/v1/get/?format=json&order=random");
    message.reply(`"${text}" -- ${reference}`);
}

async function verse(client, message, args) {
    if (args.length !== 4) {
        message.reply(`Invalid scripture input. Try "!bible verse BOOK CHAPTER:VERSE(S)"`);
        return ;
    }
    const book = args[2];
    const chapterAndVerse = args[3];

    const {data : { reference, text, error } } = await AXIOS.get(`https://bible-api.com/${book}+${chapterAndVerse}`);

    if (error) {
        message.reply(`Invalid scripture input. Try "!bible verse BOOK CHAPTER:VERSE(S)"`);
    } else {
        let cleanText = text.replace(/^\s+|\s+$/g, '');
        message.reply(`"${cleanText}" -- ${reference}`);
    }
}

//absolute chaos
async function trueRandomVerse(client, message, args) {
    const book = Util.randomFrom(VERSES);
    const chapter = Math.floor(Math.random() * book.Chapters.length);
    const verse = Math.floor(Math.random() * (book.Chapters[chapter] - 1)) + 1;
    const {data : { reference, text, error } } = await AXIOS.get(`https://bible-api.com/${book.Name}+${chapter + 1}:${verse}`);
    if (error) {
        message.reply(`Invalid scripture input. Please contact a developer (${book.Name}+${chapter + 1}:${verse})`);
    } else {
        let cleanText = text.replace(/^\s+|\s+$/g, '');
        message.reply(`"${cleanText}" -- ${reference}`);
    }
};

exports.Command = "bible";

exports.SubCommands = {
    help:{
        Execute: help,
        Description: "List all available commands."
    },
    votd:{
        Execute: verseOfTheDay,
        Description: "Be spiritual and post the verse of the day! Verses taken from ourmanna.com"
    },
    random:{
        Execute: randomVerse,
        Description: "Be chaotic and post a random verse! Verses chosen from ourmanna.com"
    },
    verse: {
        Execute: verse,
        Description: "Be super spiritual and share what scripture(s) you read today! Format: BOOK CHAPTER:VERSE(S)"
    },
    truerandom:{
        Execute: trueRandomVerse,
        Description: "For those seeking true chaos. Generates a truly random verse. Use at your own risk."
    }
};