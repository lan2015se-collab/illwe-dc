const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const https = require('https');

const CWA_API_KEY = process.env.CWA_API_KEY;

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' } }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch(e) { reject(e); } });
    }).on('error', reject);
  });
}

function safeStr(val) {
  if (val === undefined || val === null || val === '' || val === -99 || val === '-99') return '—';
  return String(val);
}

function formatDateTime(dt) {
  if (!dt) return '—';
  return dt.replace('T', ' ').replace('+08:00', '');
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ty')
    .setDescription('查詢目前颱風資訊'),

  async execute(interaction) {
    await interaction.deferReply();

    try {
      // W-C0034-005 熱帶氣旋路徑（正確API）
      const j = await fetchJson(`https://opendata.cwa.gov.tw/api/v1/rest/datastore/W-C0034-005?Authorization=${CWA_API_KEY}&format=JSON`);

      const raw = j?.records?.TropicalCyclones?.TropicalCyclone;
      const typhoons = raw ? (Array.isArray(raw) ? raw : [raw]) : [];

      if (typhoons.length === 0) {
        const embed = new EmbedBuilder()
          .setTitle('🌀 颱風資訊')
          .setColor(0x00CC66)
          .setDescription('✅ 目前西太平洋無活動中的颱風或熱帶氣旋。\n\n[中央氣象署颱風消息](https://www.cwa.gov.tw/V8/C/P/Typhoon/TY_NEWS.html)')
          .setTimestamp()
          .setFooter({ text: '資料來源：中央氣象署 CWA' });
        await interaction.editReply({ embeds: [embed] });
        return;
      }

      for (const ty of typhoons) {
        const name = safeStr(ty.CwaTyphoonName || ty.TyphoonName || '未命名');
        const engName = safeStr(ty.TyphoonName || '');
        const tyNo = safeStr(ty.CwaTyNo || ty.CwaTdNo || '');
        const year = safeStr(ty.Year || '');

        // 取最新定位（AnalysisData.Fix 最後一筆）
        const fixes = ty.AnalysisData?.Fix || [];
        const fixArr = Array.isArray(fixes) ? fixes : [fixes];
        const latest = fixArr[fixArr.length - 1] || {};

        const lat = safeStr(latest.CoordinateLatitude);
        const lon = safeStr(latest.CoordinateLongitude);
        const fixTime = formatDateTime(latest.DateTime);
        const maxWind = safeStr(latest.MaxWindSpeed);
        const gust = safeStr(latest.MaxGustSpeed);
        const pressure = safeStr(latest.Pressure);
        const movDir = safeStr(latest.MovingDirection);
        const movSpd = safeStr(latest.MovingSpeed);

        // 判斷強度
        const wind = parseFloat(maxWind);
        let intensity = '熱帶性低氣壓';
        if (wind >= 51) intensity = '強烈颱風';
        else if (wind >= 33) intensity = '中度颱風';
        else if (wind >= 17.2) intensity = '輕度颱風';

        // 顏色依強度
        let color = 0xFFD700;
        if (wind >= 51) color = 0xFF0000;
        else if (wind >= 33) color = 0xFF6600;
        else if (wind >= 17.2) color = 0xFFAA00;

        const embed = new EmbedBuilder()
          .setTitle(`🌀 第${tyNo}號颱風 ${name}（${engName}）`)
          .setColor(color)
          .setTimestamp()
          .setFooter({ text: '資料來源：中央氣象署 CWA' });

        embed.addFields(
          { name: '💪 強度', value: intensity, inline: true },
          { name: '📅 年度', value: year, inline: true },
          { name: '\u200b', value: '\u200b', inline: true },
          { name: '⏰ 最新定位時間', value: fixTime, inline: false },
          { name: '📍 目前位置', value: `北緯 ${lat}°　東經 ${lon}°`, inline: false },
          { name: '💨 最大風速', value: `${maxWind} m/s`, inline: true },
          { name: '🌬️ 最大陣風', value: `${gust} m/s`, inline: true },
          { name: '🌡️ 中心氣壓', value: `${pressure} hPa`, inline: true },
          { name: '➡️ 移動方向', value: movDir, inline: true },
          { name: '🚀 移動速度', value: `${movSpd} km/h`, inline: true },
          { name: '⚠️ 警報狀態', value: '目前尚未對台灣發布颱風警報', inline: false }
        );

        // 路徑預報（ForecastData）
        const forecasts = ty.ForecastData?.Fix || ty.forecastData?.Fix || [];
        const fcArr = Array.isArray(forecasts) ? forecasts : [forecasts];
        if (fcArr.length > 0 && fcArr[0].DateTime) {
          const lines = fcArr.slice(0, 5).map(f => {
            const fTime = formatDateTime(f.DateTime);
            const fLat = safeStr(f.CoordinateLatitude);
            const fLon = safeStr(f.CoordinateLongitude);
            const fWind = safeStr(f.MaxWindSpeed);
            return `${fTime}　北緯 ${fLat}°　東經 ${fLon}°　風速 ${fWind} m/s`;
          });
          embed.addFields({ name: '📈 路徑預報', value: lines.join('\n'), inline: false });
        }

        embed.addFields({
          name: '🔗 詳細資訊',
          value: '[中央氣象署颱風消息](https://www.cwa.gov.tw/V8/C/P/Typhoon/TY_NEWS.html)',
          inline: false
        });

        await interaction.editReply({ embeds: [embed] });
      }
    } catch (err) {
      console.error('[ty] error:', err);
      await interaction.editReply('❌ 無法取得颱風資料，請稍後再試。');
    }
  }
};
