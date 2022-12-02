module.exports = {
  apps: [
    {
      name: 'discord',
      script: './src/main.js',
      watch: true,
      //  don't for get to put `TOKEN=<TOKEN>` in .env
    },
  ],
};
