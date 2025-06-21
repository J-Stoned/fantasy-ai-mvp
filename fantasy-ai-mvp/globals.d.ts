/// <reference types="jsonwebtoken" />
/// <reference types="bcryptjs" />
/// <reference types="speakeasy" />
/// <reference types="jest" />

declare module 'jsonwebtoken';
declare module 'bcryptjs';
declare module 'speakeasy';

// Jest globals for test environment only
declare global {
  var jest: typeof import('jest');
  namespace NodeJS {
    interface Global {
      fetch: jest.Mock;
    }
  }
}