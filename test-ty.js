const https = require('https');
const CWA_API_KEY = 'CWA-8F229941-658B-40ED-9A7D-1D0C1EBB865A';

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'Accept': 'application/json' } }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

(async () => {
  console.log('\n=== W-C0034-005 熱帶氣旋路徑 ===');
  try {
    const j = await fetchJson(`https://opendata.cwa.gov.tw/api/v1/rest/datastore/W-C0034-005?Authorization=${CWA_API_KEY}&format=JSON`);
    console.log(JSON.stringify(j, null, 2).slice(0, 3000));
  } catch(e) { console.log('ERROR:', e.message); }

  console.log('\n=== W-C0034-001 颱風警報 ===');
  try {
    const j2 = await fetchJson(`https://opendata.cwa.gov.tw/api/v1/rest/datastore/W-C0034-001?Authorization=${CWA_API_KEY}&format=JSON`);
    console.log(JSON.stringify(j2, null, 2).slice(0, 3000));
  } catch(e) { console.log('ERROR:', e.message); }
})();
