import crypto from 'crypto';


function hashPassword(password) {
    const salt = crypto.randomBytes(16);
    const hashed = crypto.scryptSync(password, salt, 64);

    return `${salt.toString('base64')}:${hashed.toString('base64')}`;
}

function verifyPassword(password, stored) {
    const [saltBase64, hashBase64] = stored.split(':');
    const salt = Buffer.from(saltBase64, 'base64');
    const storedHash = Buffer.from(hashBase64, 'base64');

    const newHash = crypto.scryptSync(password, salt, storedHash.length);

    return crypto.timingSafeEqual(newHash, storedHash);
}

export {
    hashPassword,
    verifyPassword
}