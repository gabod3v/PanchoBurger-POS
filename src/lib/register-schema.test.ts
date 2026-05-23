import { describe, it, expect } from 'vitest';
import { registerSchema, COUNTRY_CODES, VENEZUELAN_BANKS } from './register-schema';

describe('registerSchema', () => {
  // Valid data factory
  const validData = {
    firstName: 'Juan',
    lastName: 'Pérez',
    tenantName: 'Mi Restaurante',
    email: 'juan@example.com',
    password: '123456',
    confirmPassword: '123456',
    docType: 'V' as const,
    docNumber: '12345678',
    phoneCode: '+58',
    phoneNumber: '4121234567',
    rif: 'J-12345678-9',
  };

  describe('happy path', () => {
    it('should accept valid complete registration data', () => {
      const result = registerSchema.parse(validData);
      expect(result).toMatchObject({
        firstName: 'Juan',
        lastName: 'Pérez',
        email: 'juan@example.com',
        docType: 'V',
        docNumber: '12345678',
        rif: 'J-12345678-9',
      });
    });

    it('should accept cédula E type', () => {
      const data = { ...validData, docType: 'E' as const, docNumber: '87654321' };
      const result = registerSchema.parse(data);
      expect(result.docType).toBe('E');
      expect(result.docNumber).toBe('87654321');
    });

    it('should accept pasaporte as document type', () => {
      const data = { ...validData, docType: 'P' as const, docNumber: 'AB123456' };
      const result = registerSchema.parse(data);
      expect(result.docType).toBe('P');
      expect(result.docNumber).toBe('AB123456');
    });

    it('should accept empty phone fields as optional', () => {
      const data = {
        ...validData,
        phoneCode: '',
        phoneNumber: '',
      };
      const result = registerSchema.parse(data);
      expect(result.phoneCode).toBe('');
      expect(result.phoneNumber).toBe('');
    });
  });

  describe('RIF validation', () => {
    it('should accept J-XXXXXXXX-X format', () => {
      expect(registerSchema.parse(validData).rif).toBe('J-12345678-9');
    });

    it('should accept G-XXXXXXXX-X format', () => {
      const data = { ...validData, rif: 'G-12345678-9' };
      expect(registerSchema.parse(data).rif).toBe('G-12345678-9');
    });

    it('should accept V-XXXXXXXX-X format', () => {
      const data = { ...validData, rif: 'V-12345678-0' };
      expect(registerSchema.parse(data).rif).toBe('V-12345678-0');
    });

    it('should reject invalid RIF format', () => {
      const data = { ...validData, rif: '123456789' };
      expect(() => registerSchema.parse(data)).toThrow('RIF');
    });

    it('should reject RIF without hyphen', () => {
      const data = { ...validData, rif: 'J123456789' };
      expect(() => registerSchema.parse(data)).toThrow('RIF');
    });

    it('should reject empty RIF', () => {
      const data = { ...validData, rif: '' };
      expect(() => registerSchema.parse(data)).toThrow();
    });
  });

  describe('document validation', () => {
    it('should reject docNumber that is too short', () => {
      const data = { ...validData, docNumber: '123' };
      expect(() => registerSchema.parse(data)).toThrow();
    });

    it('should require docType', () => {
      const data = { ...validData, docType: undefined as any };
      expect(() => registerSchema.parse(data)).toThrow();
    });
  });

  describe('password validation', () => {
    it('should reject when passwords do not match', () => {
      const data = { ...validData, confirmPassword: 'different' };
      expect(() => registerSchema.parse(data)).toThrow('no coinciden');
    });

    it('should reject password shorter than 6 characters', () => {
      const data = { ...validData, password: '123', confirmPassword: '123' };
      expect(() => registerSchema.parse(data)).toThrow();
    });
  });

  describe('name validation', () => {
    it('should require firstName', () => {
      const data = { ...validData, firstName: '' };
      expect(() => registerSchema.parse(data)).toThrow();
    });

    it('should require lastName', () => {
      const data = { ...validData, lastName: '' };
      expect(() => registerSchema.parse(data)).toThrow();
    });
  });
});

describe('COUNTRY_CODES', () => {
  it('should include Venezuela +58', () => {
    const ve = COUNTRY_CODES.find(c => c.code === '+58');
    expect(ve).toBeDefined();
    expect(ve?.country).toBe('VE');
  });

  it('should include multiple country codes', () => {
    expect(COUNTRY_CODES.length).toBeGreaterThan(5);
  });

  it('should have unique codes', () => {
    const codes = COUNTRY_CODES.map(c => c.code);
    expect(new Set(codes).size).toBe(codes.length);
  });
});

describe('VENEZUELAN_BANKS', () => {
  it('should include major Venezuelan banks', () => {
    expect(VENEZUELAN_BANKS).toContain('BANCO DE VENEZUELA');
    expect(VENEZUELAN_BANKS).toContain('BANCO MERCANTIL');
    expect(VENEZUELAN_BANKS).toContain('BANESCO');
  });

  it('should contain multiple banks', () => {
    expect(VENEZUELAN_BANKS.length).toBeGreaterThan(3);
  });

  it('should include "Otro" option', () => {
    expect(VENEZUELAN_BANKS).toContain('Otro');
  });
});
