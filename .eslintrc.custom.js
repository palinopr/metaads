module.exports = {
  rules: {
    // Prevent direct toFixed usage
    'no-restricted-syntax': [
      'error',
      {
        selector: 'CallExpression[callee.property.name="toFixed"]',
        message: 'Use safeToFixed() from @/lib/safe-utils instead of direct .toFixed() calls to prevent runtime errors.'
      }
    ],
    // Prevent unsafe property access patterns
    'no-unsafe-optional-chaining': 'error',
    // Require explicit return types
    '@typescript-eslint/explicit-function-return-type': [
      'warn',
      {
        allowExpressions: true,
        allowTypedFunctionExpressions: true
      }
    ]
  }
}