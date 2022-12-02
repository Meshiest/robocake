import { Colors } from 'discord.js';

/** @param {Error} err */
export const makeErrorEmbed = (err, extra={}) => ({
  content: '',
  embeds: [
    {
      ...extra,
      title: 'Error Message',
      color: Colors.Red,
      description: '```' + err.toString() + '```',
    },
  ],
});
