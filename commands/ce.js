const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const https = require('https');

const CWA_API_KEY = process.env.CWA_API_KEY;

const LOCATIONS = [
  '基隆市', '臺北市', '新北市', '桃園市', '新竹市', '新竹縣',
  '苗栗縣', '臺中市', '彰化縣', '南投縣', '雲林縣', '嘉義市',
  '嘉義縣', '臺南市', '高雄市', '屏東縣', '宜蘭縣', '花蓮縣',
  '臺東縣', '澎湖縣', '金門縣', '連江縣'
];

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

// 計算體感溫度（Steadman 公式）
function calcApparent(tempC, humidity) {
  if (isNaN(tempC) || isNaN(humidity)) return null;
  // 簡易體感溫度（熱指數，適用 > 27°C）
  if (tempC >= 27) {
    const T = tempC;
    const R = humidity;
    const HI = -8.78469475556
      + 1.61139411 * T
      + 2.33854883889 * R
      - 0.14611605 * T * R
      - 0.012308094 * T * T
      - 0.0164248277778 * R * R
      + 0.002211732 * T * T * R
      + 0.00072546 * T * R * R
      - 0.000003582 * T * T * R * R;
    return HI;
  }
  // 低溫時直接回傳氣溫（簡化）
  return tempC;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ce')
    .setDescription('查詢台灣各地區目前溫度與體感溫度'),

  async execute(interaction) {
    await interaction.deferReply();

    try {
      // O-A0001-001 自動氣象站（含溫度、濕度）
      const url = `https://opendata.cwa.gov.tw/api/v1/rest/datastore/O-A0001-001?Authorization=${CWA_API_KEY}&format=JSON&elementName=AirTemperature,RelativeHumidity`;
      const json = await fetchJson(url);

      const stations = json?.records?.Station || [];

      if (stations.length === 0) {
        await interaction.editReply('⚠️ 目前無法取得氣象資料。');
        return;
      }

      const cityMap = {};

      for (const station of stations) {
        const city = station.GeoInfo?.CountyName;
        const temp = parseFloat(station.WeatherElement?.AirTemperature);
        const humidity = parseFloat(station.WeatherElement?.RelativeHumidity);

        if (!city || isNaN(temp) || temp === -99) continue;

        if (!cityMap[city]) {
          cityMap[city] = { temps: [], apparents: [] };
        }
        cityMap[city].temps.push(temp);

        const apparent = calcApparent(temp, humidity);
        if (apparent !== null) cityMap[city].apparents.push(apparent);
      }

      const embed = new EmbedBuilder()
        .setTitle('🌡️ 台灣各地區即時溫度')
        .setColor(0x1E90FF)
        .setTimestamp()
        .setFooter({ text: '資料來源：中央氣象署 CWA' });

      const rows = [];
      for (const loc of LOCATIONS) {
        const data = cityMap[loc];
        if (!data || data.temps.length === 0) continue;

        const avgTemp = (data.temps.reduce((a, b) => a + b, 0) / data.temps.length).toFixed(1);
        const avgApparent = data.apparents.length > 0
          ? (data.apparents.reduce((a, b) => a + b, 0) / data.apparents.length).toFixed(1)
          : avgTemp; // fallback 用氣溫

        rows.push(`**${loc}**　🌡️ ${avgTemp}°C　🤔 體感 ${avgApparent}°C`);
      }

      if (rows.length === 0) {
        await interaction.editReply('⚠️ 目前無資料可顯示。');
        return;
      }

      const chunkSize = 8;
      for (let i = 0; i < rows.length; i += chunkSize) {
        embed.addFields({
          name: i === 0 ? '縣市 ／ 溫度 ／ 體感溫度' : '\u200b',
          value: rows.slice(i, i + chunkSize).join('\n'),
          inline: false
        });
      }

      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      console.error('[ce]', err);
      await interaction.editReply('❌ 無法取得氣象資料，請稍後再試。');
    }
  }
};
