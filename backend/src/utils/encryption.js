const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';

const getKey = () => {
    const key = process.env.ENCRYPTION_KEY;
    if (!key || key.length !== 64) {
        throw new Error('ENCRYPTION_KEY must be a 64-character hex string (32 bytes) in .env');
    }
    return Buffer.from(key, 'hex');
};

/**
 * Encrypts a plain-text string using AES-256-GCM.
 * Returns a colon-delimited string: iv:authTag:ciphertext
 */
const encrypt = (text) => {
    if (!text) return text;
    const iv = crypto.randomBytes(12); // 96-bit IV for GCM
    const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();

    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
};

/**
 * Decrypts an AES-256-GCM encrypted string (format: iv:authTag:ciphertext).
 * Returns the original plain-text.
 */
const decrypt = (encryptedData) => {
    if (!encryptedData || !encryptedData.includes(':')) return encryptedData;
    const parts = encryptedData.split(':');
    if (parts.length !== 3) return encryptedData;

    const [ivHex, authTagHex, encrypted] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    try {
        const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
        decipher.setAuthTag(authTag);

        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (err) {
        console.error('Decryption failed:', err.message);
        return '[Encrypted Data]';
    }
};

module.exports = { encrypt, decrypt };
