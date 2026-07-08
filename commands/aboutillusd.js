const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('aboutillusd')
    .setDescription('About illusd, the creator'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor(0xEB459E)
      .setTitle('👤 About illusd')
      .setDescription(
        "I'm **illusd**, a Vibecoder. I'm currently **11 years old** (2026) and have built a variety of projects using tools like Codex, Lovable, BanBan, ManusAI, Claude, and Replit.\n\n" +
        "Want to know more about my journey? Feel free to check out [illusd.com](https://illusd.com)."
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
