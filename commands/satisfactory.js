import compose from 'docker-compose';
import { makeErrorEmbed } from '../util.js';

/** @type {import('discord.js').ApplicationCommandData[]} */
const COMMANDS = [
  {
    name: 'satisfactory',
    description: 'Commands for managing the satisfactory server',
    options: [
      {
        type: 1,
        name: 'status',
        description: 'Check if the satisfactory server is online',
      },
      {
        type: 1,
        name: 'start',
        description: "Start the server (restarts it if it's already running)",
      },
      {
        type: 1,
        name: 'stop',
        description: 'Stops the server',
      },
    ],
  },
];

const cwd = '/home/cake/containers/satisfactory';
const OPTIONS = { cwd };

/**
 * @param {import('discord.js').Client} client
 * @param {import('discord.js').REST} rest
 */
const setup = async (client, _rest) => {
  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    if (interaction.commandName !== 'satisfactory') return;

    switch (interaction.options.getSubcommand(true)) {
      case 'status': {
        await interaction.reply('Getting service status...');
        try {
          const ps = await compose.ps({
            ...OPTIONS,
            commandOptions: ['--format=json'],
          });
          const services = JSON.parse(ps.out);
          if (services.length === 0) {
            interaction.editReply('Server is not running');
          } else {
            interaction.editReply(`Server status: \`${services[0].State}\``);
          }
        } catch (err) {
          interaction.editReply(makeErrorEmbed(err));
        }
        break;
      }
      case 'start': {
        await interaction.reply('Starting service...');
        try {
          await compose.upAll(OPTIONS);
          interaction.editReply(`Server will be up in a moment!`);
        } catch (err) {
          interaction.editReply(makeErrorEmbed(err));
        }
        break;
      }
      case 'stop': {
        await interaction.reply('Stopping service...');
        try {
          await compose.down(OPTIONS);
          interaction.editReply(`Server is stopped.`);
        } catch (err) {
          interaction.editReply(makeErrorEmbed(err));
        }
        break;
      }
    }
  });
};

export default { COMMANDS, setup };
