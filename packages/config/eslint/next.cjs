/**
 * For Next.js apps. Usage in an app's .eslintrc.cjs:
 *   module.exports = { root: true, extends: [require.resolve('@mitdrone/config/eslint/next')] };
 */
module.exports = {
  extends: [
    require.resolve('../../../.eslintrc.cjs'),
    'next/core-web-vitals',
    'next/typescript',
    'prettier',
  ],
  rules: {
    'react/no-unescaped-entities': 'off',
    '@next/next/no-html-link-for-pages': 'off',
  },
};
