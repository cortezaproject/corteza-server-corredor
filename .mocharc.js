module.exports = {
  require: [
    'esm',
    'ts-node/register',
    'source-map-support/register',
  ],
  'full-trace': true,
  bail: true,
  recursive: true,
  extension: ['.test.ts'],
}
