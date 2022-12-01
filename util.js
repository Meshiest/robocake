import { Colors } from 'discord.js';

/** @param {Error} err */
export const makeErrorEmbed = (err) => ({
  content: 'Error!!',
  embeds: [
    {
      title: 'Error mesage',
      color: Colors.Red,
      description: '```' + err.toString() + '```',
    },
  ],
});
