const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('feedback')
    .setDescription('Give us your feedback'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor(0xFEE75C)
      .setTitle('📝 Feedback')
      .setDescription(
        'Wanna give us feedback? Check out:\n[illwe.illusd.com/deadbot/feedback](https://illwe.illusd.com/deadbot/feedback)'
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
