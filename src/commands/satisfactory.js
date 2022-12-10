import { Colors } from 'discord.js';
import compose from 'docker-compose';
import { makeErrorEmbed } from '../util.js';
import path from 'path';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import SatisfactoryStatus from '../lib/satisfactory.js';

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
      {
        type: 1,
        name: 'experimental',
        description: 'Get the experimental status of the server',
        options: [
          {
              type: 5,
              name: 'set-value',
              description: 'Set the experimental status of the server. (Requires a stop and start)'
            }
          ]
        }
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
  const ENV_FILE =  path.join(OPTIONS.cwd, '.env');

  function getExperimental() {
    if (!existsSync(ENV_FILE)) return null;
    const match = readFileSync(ENV_FILE).toString().match(/STEAMBETA=(true|false)/);
    if (!match) return null;
    return match[1] === 'true';
  }

  function setExperimental(value) {
    if (!existsSync(ENV_FILE)) return null;
    const newData = readFileSync(ENV_FILE).toString().replace(/STEAMBETA=(true|false)/, `STEAMBETA=${Boolean(value)}`);
    writeFileSync(ENV_FILE, newData);
  }

  async function getServices() {
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
  }

  async function getServerStatus() {
     const tester = new SatisfactoryStatus();
    const res = await tester.test(process.env.SATISFACTORY_HOST, process.env.SATISFACTORY_QUERY_PORT);
    tester.close();
    return res;
  }

  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    if (interaction.commandName !== 'satisfactory') return;

    switch (interaction.options.getSubcommand(true)) {
      case 'status': {
        await interaction.reply('_getting service status..._');
        let services = [], status, serverError;

        try {
          services = await getServices() ?? [];
        } catch (err) {
          console.error('error fetching service status', err);
        }

        try {
          status = await getServerStatus();
        } catch (err) {
          if (typeof err === 'string')
            serverError = err;
          console.error('error fetching server status', err);
        }

        interaction.editReply({ content: '',
          embeds: [{
            ...EMBED,
            color: services.length === 0 && !status ? Colors.Grey : Colors.Green,
            fields: [
              {name: 'Container Status', value: services[0]?.State ?? 'stopped', inline: false},
              status && {name: 'Game Server', value: status.state + '', inline: false},
              status && {name: 'Port', value: status.port + '', inline: true},
              status && {name: 'Version', value: status.version + '', inline: true},
              status && {name: 'Ping', value: status.ping + 'ms', inline: true},
              !status && !serverError && {name: 'Query Status', value: 'error', inline: false},
              !status && serverError && {name: 'Query Error', value: serverError, inline: false},
            ].filter(Boolean)
          }]
        });
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
      case 'experimental': {
        let oldValue;
        if (interaction.options.get('set-value', false)) {
          oldValue = getExperimental();
          const newValue = interaction.options.getBoolean('set-value', false);

          if (newValue !== oldValue) setExperimental(newValue);
          else oldValue = undefined;
        }

        const value = getExperimental();
        interaction.reply({ content: '', embeds: [{
          ...EMBED,
          color: Colors.Blue,
          fields: [
            {
              name: 'Experimental',
              value: (value === null ? 'unknown' : value ? 'yes' : 'no') +
                (typeof oldValue !== 'undefined'
                  ? ` (was ${oldValue === null ? 'unknown' : oldValue ? 'yes' : 'no'})`
                  : '')
            }
          ]
        }]});
      }
    }
  });
};

export default { COMMANDS, setup };
