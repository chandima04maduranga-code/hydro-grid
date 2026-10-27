const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Sensor nodes prove which company they belong to with a secret device key
// sent in the X-Device-Key header. Only a SHA-256 hash is stored in the
// database, so a database leak does not reveal working keys.
const DEVICE_KEY_HEADER = 'X-Device-Key';

const generateDeviceKey = () => `hgd_${crypto.randomBytes(24).toString('base64url')}`;

const hashDeviceKey = (key) => crypto.createHash('sha256').update(key).digest('hex');

// Local, git-ignored file where the scripts keep the plain keys for the
// virtual nodes: { "<companyId>": "<device key>" }
const KEYS_FILE = path.join(__dirname, '..', '.device-keys.json');

const readSavedKeys = () => {
  try {
    return JSON.parse(fs.readFileSync(KEYS_FILE, 'utf8'));
  } catch {
    return {};
  }
};

const saveKey = (companyId, key) => {
  const keys = { ...readSavedKeys(), [String(companyId)]: key };
  fs.writeFileSync(KEYS_FILE, `${JSON.stringify(keys, null, 2)}\n`, { mode: 0o600 });
};

module.exports = { DEVICE_KEY_HEADER, KEYS_FILE, generateDeviceKey, hashDeviceKey, readSavedKeys, saveKey };
