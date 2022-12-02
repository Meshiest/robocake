import { Colors } from 'discord.js';

/** @param {Error} err */
export const makeErrorEmbed = (err, extra={}) => ({
  content: '',
  embeds: [
    {
      ...extra,
      title: 'Error Message',
      color: Colors.Red,
      description: (err?.message ?? (typeof err === 'string' ? err : 'Error JSON')) +
        '\n```\n' + (err.stack ?? JSON.stringify(err, null, 2)) + '\n```',
    },
  ],
});
