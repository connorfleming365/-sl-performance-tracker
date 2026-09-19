const { put, get } = require('@vercel/blob');
 
const PASSCODE = 'blackwave';
const PATHNAME = 'sl-tracker/season.json';

const DEFAULT_ROSTER = ["Kieran Manson","Louis Trimble","Lee Bell","Mikey Meade","Dan Martin","Todd Anderson",
"Haydn Miller","Connor Jenkinson","Ethan Cook","Rhys Cook","Milo Chisholm","Dylan Chigome",
"Haiden Cunnington","James McCallum","Stephen Davidson","Ewan Martin","Ellis Brown","Harrison Pullen",
"Brad Adams","Henry Crewe","Jay Manson","Kai Manson","Grant Cook","Andy Findlay","Martin Drummond",
"Harvey Palmer-Naylor","Josh Aston","Josh Sawford","Ryan Hammett","Callum McGill","Rory Hames",
"JJ Nightingale","Jordan Branston","Dave Jacklin","Sol Petty","Noah Rogers","Liam Feely",
"Dale Borthwick","Sean Martin","Keegan Bima","Owen Phoenix","Kyran Phoenix","Harley Phoenix",
"Jack Riley","Nathan Hand","Josh Ruddick","Charlie Prentice","Jordan Tinto","Michael Sanni",
"Alden Marshall","Jack Sayers"].sort();

const EMPTY = { '1st-xv': [], 'dev-xv': [], roster: DEFAULT_ROSTER, _version: 'v2' };

async function readData() {
  try {
    const result = await get(PATHNAME, { access: 'private' });
    if (!result || result.statusCode !== 200) return EMPTY;
    const chunks = [];
    for await (const chunk of result.stream) chunks.push(chunk);
    const text = Buffer.concat(chunks).toString('utf-8');
    const parsed = JSON.parse(text);
    const roster = Array.isArray(parsed.roster) && parsed.roster.length ? parsed.roster : DEFAULT_ROSTER;
    return { '1st-xv': parsed['1st-xv'] || [], 'dev-xv': parsed['dev-xv'] || [], roster };
  } catch (e) {
    return EMPTY;
  }
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

   if (req.method === 'GET') {
    return res.status(200).json({ TEST_MARKER: 'HELLO_FROM_NEW_CODE', time: Date.now() });
  }
  }

  if (req.method === 'POST') {
    const body = req.body || {};
    if (body.passcode !== PASSCODE) {
      return res.status(401).json({ error: 'Invalid passcode' });
    }
    if (!body.data || typeof body.data !== 'object') {
      return res.status(400).json({ error: 'Missing data' });
    }
    const rosterIn = Array.isArray(body.data.roster) ? body.data.roster : DEFAULT_ROSTER;
    const rosterClean = Array.from(new Set(rosterIn.map(n => String(n).trim()).filter(Boolean))).sort();
    const safe = {
      '1st-xv': Array.isArray(body.data['1st-xv']) ? body.data['1st-xv'] : [],
      'dev-xv': Array.isArray(body.data['dev-xv']) ? body.data['dev-xv'] : [],
      roster: rosterClean
    };
    try {
      await put(PATHNAME, JSON.stringify(safe), {
        access: 'private',
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: 'application/json'
      });
      return res.status(200).json({ ok: true });
    } catch (err) {
      return res.status(500).json({ error: 'Write failed', detail: String(err && err.message || err) });
    }
  }

  res.setHeader('Allow', 'GET, POST, OPTIONS');
  return res.status(405).end('Method Not Allowed');
};
