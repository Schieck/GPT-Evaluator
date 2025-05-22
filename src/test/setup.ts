import '@testing-library/jest-dom';
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect method with methods from react-testing-library
Object.entries(matchers).forEach(([name, matcher]) => {
  expect.extend({ [name]: matcher });
});

// Cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
  cleanup();
}); 