require('dotenv').config();
const { Client, GatewayIntentBits, REST, Routes, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.commands = new Collection();

// Load commands
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(path.join(commandsPath, file));
  client.commands.set(command.data.name, command);
}

client.once('ready', () => {
  console.log(`💀 DEAD BOT 已上線：${client.user.tag}`);
  client.user.setPresence({
    activities: [{ name: '台灣天氣・地震・颱風・新聞', type: 3 }],
    status: 'online'
  });
});

client.on('interactionCreate', async interaction => {
  if (interaction.isCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;
    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(error);
      const msg = { content: '❌ 執行指令時發生錯誤，請稍後再試。', ephemeral: true };
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(msg);
      } else {
        await interaction.reply(msg);
      }
    }
  } else if (interaction.isButton()) {
    // Handle news buttons
    const newsCommand = client.commands.get('news');
    if (newsCommand && newsCommand.handleButton) {
      await newsCommand.handleButton(interaction);
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
