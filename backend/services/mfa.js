const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const User = require('../models/User');

const generateMFASecret = async (userId) => {
  const secret = speakeasy.generateSecret({
    name: `Cyberpunk CTF (${userId})`,
    issuer: 'Cyberpunk CTF'
  });

  const qrCode = await qrcode.toDataURL(secret.otpauth_url);
  
  return {
    secret: secret.base32,
    qrCode,
    ascii: secret.ascii
  };
};

const verifyMFA = (token, secret) => {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 1
  });
};

module.exports = { generateMFASecret, verifyMFA };