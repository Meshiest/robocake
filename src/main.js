import { Client, GatewayIntentBits, REST } from 'discord.js';
import dotenv from 'dotenv';
import { initCommands, putCommands } from './commands/index.js';
dotenv.config();

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

const rest = new REST({ version: '10' }).setToken(TOKEN);
const client = new Client({
  intents: [GatewayIntentBits.Guilds],

});

client.on('ready', () => console.log(`Logged in as ${client.user.tag}!`));

initCommands(client, rest);
putCommands(rest, CLIENT_ID);

client.login(process.env.TOKEN);
