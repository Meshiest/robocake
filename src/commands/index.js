import { Routes } from 'discord.js';
import satisfactory from './satisfactory.js';

/**
 * @param {import('discord.js').REST} rest
 * @param {string} CLIENT_ID
 */
export async function putCommands(rest, CLIENT_ID) {
  try {
    console.log('Started refreshing application (/) commands.');

    /** @type {import('discord.js').ApplicationCommandData[]} */
    const commands = [...satisfactory.COMMANDS];

    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
}

/**
 * @param {import('discord.js').Client} client
 * @param {import('discord.js').REST} rest
 */
export async function initCommands(client, rest) {
  satisfactory.setup(client, rest);
}
