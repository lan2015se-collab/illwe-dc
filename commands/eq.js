const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const https = require('https');

const CWA_API_KEY = process.env.CWA_API_KEY;

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

function getMagnitudeEmoji(mag) {
  if (mag >= 6.0) return '🔴';
  if (mag >= 5.0) return '🟠';
  if (mag >= 4.0) return '🟡';
  return '🟢';
}

function formatDateTime(dt) {
  if (!dt) return '未知';
  return dt.replace('T', ' ').replace('+08:00', '');
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('eq')
    .setDescription('查詢台灣最近10筆地震資料'),

  async execute(interaction) {
    await interaction.deferReply();

    try {
      // 小區域地震 + 顯著有感地震
      const url = `https://opendata.cwa.gov.tw/api/v1/rest/datastore/E-A0016-001?Authorization=${CWA_API_KEY}&format=JSON&limit=10`;
      const json = await fetchJson(url);

      const quakes = json?.records?.Earthquake || [];

      if (quakes.length === 0) {
        await interaction.editReply('⚠️ 目前沒有地震資料。');
        return;
      }

      const embed = new EmbedBuilder()
        .setTitle('🌏 台灣最近地震資料（前10筆）')
        .setColor(0xFF6347)
        .setTimestamp()
        .setFooter({ text: '資料來源：中央氣象署 CWA' });

      for (let i = 0; i < Math.min(quakes.length, 10); i++) {
        const q = quakes[i];
        const info = q.EarthquakeInfo || {};
        const mag = info.EarthquakeMagnitude?.MagnitudeValue || '?';
        const depth = info.FocalDepth || '?';
        const loc = info.Epicenter?.Location || '未知';
        const time = formatDateTime(info.OriginTime);
        const emoji = getMagnitudeEmoji(parseFloat(mag));
        const intensity = q.Intensity?.ShakingArea?.[0]?.EqStation?.[0]?.PGAUnit || '';

        embed.addFields({
          name: `${emoji} #${i + 1}　規模 M${mag}　深度 ${depth} km`,
          value: `📍 ${loc}\n🕐 ${time}`,
          inline: false
        });
      }

      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      console.error('[eq]', err);
      await interaction.editReply('❌ 無法取得地震資料，請稍後再試。');
    }
  }
};
