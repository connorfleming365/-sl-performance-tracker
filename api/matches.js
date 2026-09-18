const { put, list } = require('@vercel/blob');

const PASSCODE = 'blackwave';
const PATHNAME = 'sl-tracker/season.json';
const EMPTY = { '1st-xv': [], 'dev-xv': [] };

async function readData() {
  try {
    const { blobs } = await list({ prefix: PATHNAME });
    const match = blobs.find(b => b.pathname === PATHNAME);
    if (!match) return EMPTY;
    const res = await fetch(match.url);
    if (!res.ok) return EMPTY;
    const parsed = await res.json();
    return { '1st-xv': parsed['1st-xv'] || [], 'dev-xv': parsed['dev-xv'] || [] };
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
    const data = await readData();
    return res.status(200).json(data);
  }

  if (req.method === 'POST') {
    const body = req.body || {};
    if (body.passcode !== PASSCODE) {
      return res.status(401).json({ error: 'Invalid passcode' });
    }
    if (!body.data || typeof body.data !== 'object') {
      return res.status(400).json({ error: 'Missing data' });
    }
    const safe = {
      '1st-xv': Array.isArray(body.data['1st-xv']) ? body.data['1st-xv'] : [],
      'dev-xv': Array.isArray(body.data['dev-xv']) ? body.data['dev-xv'] : []
    };
    try {
      await put(PATHNAME, JSON.stringify(safe), {
        access: 'public',
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
