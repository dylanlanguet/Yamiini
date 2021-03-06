const { AkairoClient, CommandHandler, ListenerHandler, ClientUtil } = require("discord-akairo");
const { TOKEN, MONGOSTRING, STATUS, ACTIVITY } = require('../util/config');
const { GuildsProvider, UsersProvider } = require('../structures/Providers')
const mongoose = require('mongoose');
const { embed } = require('../util/functions');

module.exports = class YamiiniClient extends AkairoClient {
  constructor(config = {}) {
    super(
      { ownerID: ["491489639434289153", "277177665818066946"] },
      {
        allowedMentions: {
          parse: ['roles', 'everyone', 'users'],
          repliedUser: false
        },
        partials: ['CHANNEL', 'GUILD_MEMBER', 'MESSAGE', 'REACTION', 'USER'],
        presence: {
          status: STATUS,
          activities: [ACTIVITY]
        },
        intents: 32767
      }
    );

    this.commandHandler = new CommandHandler(this, {
      allowMention: true,
      prefix: async message => {
        const guildPrefix = await this.guildSettings.get(message.guild);
        if (guildPrefix) return guildPrefix.prefix;
        return config.prefix;
      },
      defaultCooldown: 2000,
      directory: './src/commands/',
    });

    this.listenerHandler = new ListenerHandler(this, {
      directory: './src/listeners'
    });

    this.musicPlayer = new ClientUtil(this.client).collection();
    this.guildSettings = new GuildsProvider();
    this.userProvider = new UsersProvider();
    this.functions = { embed: embed };
  }

  
  async connect() {
    try {
      await mongoose.connect(MONGOSTRING, {
        useNewUrlParser: true,
        useUnifiedTopoLogy: true
      });
      console.log("Db connecté!");
    } catch (e) {
      console.log("Db pas connecté! Voir erreur ci-dessous!\n\n", e);
      return process.exit();
    }
  }
  
  init() {
    this.commandHandler.useListenerHandler(this.listenerHandle);
    this.commandHandler.loadAll();
    console.log(`Commandes -> ${this.commandHandler.modules.size}`);
    this.listenerHandler.loadAll();
    console.log(`Listeners -> ${this.listenerHandler.modules.size}`);
    console.log("Yamiini prêt!");
  }

  async start() {
    await this.connect();
    await this.init();
    return this.login(TOKEN);
  }
}
