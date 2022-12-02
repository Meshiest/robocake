# robocake

This discord bot automates things for me on one of my pcs.

Right now it can start, stop, and get the status of a Satisfactory server created via docker-compose.

## Running

1. install node v18+, preferably via nvm
1. clone the repo and cd into it
1. `npm i`
1. create a `.env` based on `.env.default` and fill in the values
1. if you have `pm2`, `npm run start-pm2`. otherwise `npm start`

## Contributing

Please format the code on save using `prettier` (`npm i -g prettier` + the vscode extension)

I don't know why you'd contribute to this though