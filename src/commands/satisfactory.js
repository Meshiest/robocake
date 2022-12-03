import { Colors } from 'discord.js';
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

const EMBED = {
  author: {
    icon_url: 'https://media.discordapp.net/attachments/755536678726139934/1048026350298087494/image.png',
    name: 'Satisfactory',
  }
};

/**
 * @param {import('discord.js').Client} client
 * @param {import('discord.js').REST} rest
 */
const setup = async (client, _rest) => {
  const OPTIONS = { cwd: process.env.PATH_SATISFACTORY };

  const getServices = async () => {
    try {
      const ps = await compose.ps({
        ...OPTIONS,
        commandOptions: ['--format=json'],
      });
      return JSON.parse(ps.out);
    } catch (err) {
      console.error('error getting services', err);
      return [];
    }
  };

  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    if (interaction.commandName !== 'satisfactory') return;

    switch (interaction.options.getSubcommand(true)) {
      case 'status': {
        await interaction.reply('_getting service status..._');
        try {
          const services = await getServices();
            if (services.length === 0) {
              interaction.editReply({ content: '',
                embeds: [{
                  ...EMBED,
                  color: Colors.Grey,
                  fields: [{name: 'Server Status', value: 'offline'}]
                }]
              });
          } else {
            interaction.editReply({ content: '', embeds: [{
              ...EMBED,
              color: Colors.Green,
              fields: [{name: 'Server Status', value: services[0].State}]
            }]});
          }
        } catch (err) {
          interaction.editReply(makeErrorEmbed(err));
        }
        break;
      }
      case 'start': {
        const services = await getServices();
        const isRunning = services[0]?.State === 'running';

        await interaction.reply(`_${isRunning ? 're' : ''}starting service..._`);
        try {
          await (isRunning ? compose.restartAll(OPTIONS) : compose.upAll(OPTIONS));
          interaction.editReply({ content: '', embeds: [{
            ...EMBED,
            color: isRunning ? Colors.Navy : Colors.DarkGreen,
            fields: [{name: 'Server Status', value: (isRunning ? 're' : '') + 'starting'}]
          }]});
        } catch (err) {
          interaction.editReply(makeErrorEmbed(err));
        }
        break;
      }
      case 'stop': {
        await interaction.reply('_stopping service..._');
        try {
          await compose.down(OPTIONS);
          interaction.editReply({ content: '', embeds: [{
            ...EMBED,
            color: Colors.Yellow,
            fields: [{name: 'Server Status', value: 'stopped'}]
          }]});
        } catch (err) {
          interaction.editReply(makeErrorEmbed(err));
        }
        break;
      }
    }
  });
};

export default { COMMANDS, setup };
