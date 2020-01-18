import webpack, { Stats } from 'webpack'
import path from 'path'

console.log('Start')

const wpOpt: webpack.Configuration = {
  watch: true,

  context: path.resolve(__dirname, '../scripts'),

  entry: {
    compose: './frontend/compose/index.js',
    admin: './frontend/admin/index.js',
  },
  // mode: 'production',
  mode: 'development',
  target: 'web',

  output: {
    path: path.resolve(__dirname, '../dist'),
    futureEmitAssets: true,
    filename: '[name].js',
  },
}

const compiler = webpack(wpOpt)

compiler.run((err: Error, stats: Stats) => {
  if (err) return console.error(err)
  console.log(stats.toJson().errors)
  console.log(stats.toJson().warnings)
})

console.log('Done')
