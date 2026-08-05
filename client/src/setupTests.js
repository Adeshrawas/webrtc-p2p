// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// ── Polyfills ────────────────────────────────────────────────────────────────
// react-router v7 requires TextEncoder / TextDecoder at module-load time.
// CRA's jsdom environment doesn't expose them as globals, so we pull them
// from Node's built-in 'util' module.
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
