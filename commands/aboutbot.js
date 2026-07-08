const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('aboutbot')
    .setDescription('About DEAD BOT'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle('💀 About DEAD BOT')
      .setDescription(
        'I was created by **ilusd.com**. I can provide you with the latest weather and news in Taiwan.\n\n' +
        'Want to learn more? Check out: [illwe.illusd.com/deadbot](https://illwe.illusd.com/deadbot)'
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
