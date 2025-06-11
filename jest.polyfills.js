/**
 * @note The block below contains polyfills for Node.js globals
 * required for Jest to function when running JSDOM tests.
 * These have to be require's and not import's in order to load correctly.
 */

const { TextDecoder, TextEncoder } = require('util')

Object.assign(global, { TextDecoder, TextEncoder })

// Polyfill for crypto.randomUUID
if (!global.crypto) {
  global.crypto = {}
}

if (!global.crypto.randomUUID) {
  global.crypto.randomUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0
      const v = c === 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
  }
}

// Polyfill for crypto.getRandomValues
if (!global.crypto.getRandomValues) {
  global.crypto.getRandomValues = (array) => {
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256)
    }
    return array
  }
}