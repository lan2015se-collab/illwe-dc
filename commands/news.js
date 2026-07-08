const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const https = require('https');
const http = require('http');

function fetchText(url, redirectCount = 0) {
  return new Promise((resolve, reject) => {
    if (redirectCount > 5) return reject(new Error('Too many redirects'));
    const lib = url.startsWith('https') ? https : http;
    const req = lib.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*'
      }
    }, res => {
      if ([301, 302, 307, 308].includes(res.statusCode) && res.headers.location) {
        return fetchText(res.headers.location, redirectCount + 1).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.setTimeout(12000, () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

function parseRSS(xml) {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];

    const title = (/<title><!\[CDATA\[(.*?)\]\]><\/title>/.exec(block) ||
                   /<title>([^<]*)<\/title>/.exec(block) || [])[1] || '';

    // 抓原始連結（feedburner, 或 link 標籤）
    const link = (/<feedburner:origLink>(.*?)<\/feedburner:origLink>/.exec(block) ||
                  /<link>(https?:\/\/[^<\s]+)<\/link>/.exec(block) ||
                  /<link><!\[CDATA\[(.*?)\]\]><\/link>/.exec(block) || [])[1] || '';

    const pubDate = (/<pubDate>(.*?)<\/pubDate>/.exec(block) || [])[1] || '';

    const cleanTitle = title.replace(/<[^>]+>/g, '').trim();
    if (cleanTitle) items.push({ title: cleanTitle, link: link.trim(), pubDate: pubDate.trim() });
  }
  return items;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  } catch { return ''; }
}

function isValidUrl(url) {
  try { return url && url.startsWith('http') && Boolean(new URL(url)); }
  catch { return false; }
}

// 嘗試多個來源
async function fetchNews() {
  const sources = [
    // RSSHub UDN 即時新聞（最穩定）
    'https://rsshub.app/udn/news/breakingnews/99',
    // UDN 官方 RSS
    'https://udn.com/rssfeed/news/2/6638?ch=news',
    'https://udn.com/rssfeed/news/1/0?ch=news',
    // Google News 搜 UDN
    'https://news.google.com/rss/search?q=site:udn.com&hl=zh-TW&gl=TW&ceid=TW:zh-Hant',
  ];

  for (const url of sources) {
    try {
      console.log('[news] Trying:', url);
      const xml = await fetchText(url);
      if (!xml || xml.length < 200) continue;
      const items = parseRSS(xml);
      if (items.length > 0) {
        console.log('[news] Got', items.length, 'items from', url);
        return items;
      }
    } catch (e) {
      console.log('[news] Failed:', url, e.message);
    }
  }
  return [];
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('news')
    .setDescription('查詢 UDN 聯合新聞網最新 5 篇新聞'),

  async execute(interaction) {
    await interaction.deferReply();

    try {
      const allItems = await fetchNews();
      const items = allItems.slice(0, 5);

      if (items.length === 0) {
        await interaction.editReply('⚠️ 目前無法取得 UDN 新聞，請直接前往 [udn.com](https://udn.com) 查看。');
        return;
      }

      const embed = new EmbedBuilder()
        .setTitle('📰 UDN 聯合新聞網最新消息')
        .setColor(0x003580)
        .setTimestamp()
        .setFooter({ text: '資料來源：UDN 聯合新聞網' });

      const buttons = [];

      items.forEach((item, idx) => {
        const num = idx + 1;
        const dateStr = formatDate(item.pubDate);
        embed.addFields({
          name: `${num}️⃣ ${item.title}`,
          value: dateStr ? `🕐 ${dateStr}` : '點擊按鈕閱讀全文',
          inline: false
        });

        const url = isValidUrl(item.link) ? item.link : 'https://udn.com';
        buttons.push(
          new ButtonBuilder()
            .setLabel(`新聞 ${num}`)
            .setStyle(ButtonStyle.Link)
            .setURL(url)
            .setEmoji('🔗')
        );
      });

      const row = new ActionRowBuilder().addComponents(buttons);
      await interaction.editReply({ embeds: [embed], components: [row] });

    } catch (err) {
      console.error('[news]', err);
      await interaction.editReply('❌ 無法取得新聞資料，請稍後再試。');
    }
  }
};
