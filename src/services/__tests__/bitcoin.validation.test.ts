import { BitcoinValidation } from '../../types/bitcoin';

describe('Bitcoin Validation', () => {
  describe('isValidAddress', () => {
    it('should validate P2PKH addresses (starting with 1)', () => {
      expect(BitcoinValidation.isValidAddress('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa')).toBe(true);
      expect(BitcoinValidation.isValidAddress('1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2')).toBe(true);
    });

    it('should validate P2SH addresses (starting with 3)', () => {
      expect(BitcoinValidation.isValidAddress('3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy')).toBe(true);
      expect(BitcoinValidation.isValidAddress('3QJmV3qfvL9SuYo34YihAf3sRCW3qSinyC')).toBe(true);
    });

    it('should validate Bech32 addresses (starting with bc1)', () => {
      expect(BitcoinValidation.isValidAddress('bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4')).toBe(true);
      expect(BitcoinValidation.isValidAddress('bc1qrp33g0q5c5txsp9arysrx4k6zdkfs4nce4xj0gdcccefvpysxf3qccfmv3')).toBe(true);
    });

    it('should reject invalid addresses', () => {
      expect(BitcoinValidation.isValidAddress('')).toBe(false);
      expect(BitcoinValidation.isValidAddress('invalid')).toBe(false);
      expect(BitcoinValidation.isValidAddress('0x1234567890abcdef')).toBe(false);
      expect(BitcoinValidation.isValidAddress('2A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa')).toBe(false);
    });

    it('should validate testnet addresses when testnet flag is true', () => {
      expect(BitcoinValidation.isValidAddress('mzBc4XEFSdzCDcTxAgf6EZXgsZWpztRhef', true)).toBe(true);
      expect(BitcoinValidation.isValidAddress('2MzQwSSnBHWHqSAqtTVQ6v47XtaisrJa1Vc', true)).toBe(true);
      expect(BitcoinValidation.isValidAddress('tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx', true)).toBe(true);
    });
  });

  describe('isValidXpub', () => {
    it('should validate extended public keys', () => {
      expect(BitcoinValidation.isValidXpub('xpub6CUGRUonZSQ4TWtTMmzXdrXDtypWKiKrhko4egpiMZbpiaQL2jkwSB1icqYh2cfDfVxdx4df189oLKnC5fSwqPiCSQQMXnEt7zB5cCkuBBK')).toBe(true);
      expect(BitcoinValidation.isValidXpub('xpub6BosfCnifzxcFwrSzQiqu2DBVTshkCXacvNsWGYJVVhhawA7d4R5WSWGFNbi8Aw6ZRc1brxMyWMzG3DSSSSoekkudhUd9yLb6qx39T9nMdj')).toBe(true);
    });

    it('should reject invalid extended public keys', () => {
      expect(BitcoinValidation.isValidXpub('')).toBe(false);
      expect(BitcoinValidation.isValidXpub('invalid')).toBe(false);
      expect(BitcoinValidation.isValidXpub('xprv6CUGRUonZSQ4TWtTMmzXdrXDtypWKiKrhko4egpiMZbpiaQL2jkwSB1icqYh2cfDfVxdx4df189oLKnC5fSwqPiCSQQMXnEt7zB5cCkuBBK')).toBe(false);
    });
  });

  describe('isValidMnemonic', () => {
    it('should validate 12-word mnemonics', () => {
      expect(BitcoinValidation.isValidMnemonic('abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about')).toBe(true);
    });

    it('should validate 24-word mnemonics', () => {
      expect(BitcoinValidation.isValidMnemonic('abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon art')).toBe(true);
    });

    it('should validate other valid word counts', () => {
      expect(BitcoinValidation.isValidMnemonic('abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about')).toBe(true); // 15 words
      expect(BitcoinValidation.isValidMnemonic('abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about')).toBe(true); // 18 words
      expect(BitcoinValidation.isValidMnemonic('abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about')).toBe(true); // 21 words
    });

    it('should reject invalid word counts', () => {
      expect(BitcoinValidation.isValidMnemonic('')).toBe(false);
      expect(BitcoinValidation.isValidMnemonic('abandon')).toBe(false);
      expect(BitcoinValidation.isValidMnemonic('abandon abandon abandon')).toBe(false); // 3 words
      expect(BitcoinValidation.isValidMnemonic('abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon')).toBe(false); // 10 words
    });
  });

  describe('isValidIndex', () => {
    it('should validate valid indices', () => {
      expect(BitcoinValidation.isValidIndex(0)).toBe(true);
      expect(BitcoinValidation.isValidIndex(1)).toBe(true);
      expect(BitcoinValidation.isValidIndex(2147483647)).toBe(true); // 2^31 - 1
    });

    it('should reject invalid indices', () => {
      expect(BitcoinValidation.isValidIndex(-1)).toBe(false);
      expect(BitcoinValidation.isValidIndex(2147483648)).toBe(false); // 2^31
      expect(BitcoinValidation.isValidIndex(1.5)).toBe(false);
      expect(BitcoinValidation.isValidIndex(NaN)).toBe(false);
    });
  });

  describe('isValidTransactionHash', () => {
    it('should validate transaction hashes', () => {
      expect(BitcoinValidation.isValidTransactionHash('0e3e2357e806b6cdb1f70b54c3a3a17b6714ee1f0e68bebb44a74b1efd512098')).toBe(true);
      expect(BitcoinValidation.isValidTransactionHash('f4184fc596403b9d638783cf57adfe4c75c605f6356fbc91338530e9831e9e16')).toBe(true);
    });

    it('should reject invalid transaction hashes', () => {
      expect(BitcoinValidation.isValidTransactionHash('')).toBe(false);
      expect(BitcoinValidation.isValidTransactionHash('invalid')).toBe(false);
      expect(BitcoinValidation.isValidTransactionHash('0e3e2357e806b6cdb1f70b54c3a3a17b6714ee1f0e68bebb44a74b1efd51209')).toBe(false); // 63 chars
      expect(BitcoinValidation.isValidTransactionHash('0e3e2357e806b6cdb1f70b54c3a3a17b6714ee1f0e68bebb44a74b1efd5120988')).toBe(false); // 65 chars
    });
  });

  describe('isValidAmount', () => {
    it('should validate valid amounts', () => {
      expect(BitcoinValidation.isValidAmount(0)).toBe(true);
      expect(BitcoinValidation.isValidAmount(0.00000001)).toBe(true);
      expect(BitcoinValidation.isValidAmount(1)).toBe(true);
      expect(BitcoinValidation.isValidAmount(21000000)).toBe(true);
      expect(BitcoinValidation.isValidAmount('0.5')).toBe(true);
      expect(BitcoinValidation.isValidAmount('21000000')).toBe(true);
    });

    it('should reject invalid amounts', () => {
      expect(BitcoinValidation.isValidAmount(-1)).toBe(false);
      expect(BitcoinValidation.isValidAmount(21000001)).toBe(false);
      expect(BitcoinValidation.isValidAmount('invalid')).toBe(false);
      expect(BitcoinValidation.isValidAmount(NaN)).toBe(false);
    });
  });
});