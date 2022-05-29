const os = require('os');
const path = require('path');
const HtmlPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const { VueLoaderPlugin } = require('vue-loader');
const { GenerateSW } = require('workbox-webpack-plugin');
const ESLintPlugin = require('eslint-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const PreloadPlugin = require('@vue/preload-webpack-plugin');
const { DefinePlugin } = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');

const resolve = (dir) => path.resolve(__dirname, dir);

module.exports = {
  resolve,
};

const isProduction = process.env.NODE_ENV === 'production';

/** @type {import('webpack').Configuration} */
module.exports = {
  mode: isProduction ? 'production' : 'development',
  devtool: !isProduction && 'cheap-module-source-map',
  entry: './src/main.ts',
  performance: false, // 对打包结果输出性能分析
  output: {
    clean: true,
    path: isProduction ? resolve('dist') : undefined,
    filename: isProduction ? 'js/[name].[contenthash:5].js' : 'js/[name].js',
    chunkFilename: isProduction ? 'js/chunk-[name].[contenthash:5].js' : 'js/chunk-[name].js',
    assetModuleFilename: isProduction ? 'media/[hash:5].[ext][query]' : 'media/[ext][query]',
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
    alias: {
      '@/': resolve('src'),
    },
  },
  module: {
    rules: [
      {
        oneOf: [
          {
            test: /\.(ttf|woff?|mp3|mp4|avi|xlsx?|txt)$/,
            type: 'asset/resource',
          },
          {
            test: /\.(png|jpe?g|webp|bmp|gif|svg)/,
            type: 'asset',
            parser: {
              dataUrlCondition: {
                maxSize: 4 * 1024,
              },
            },
          },
          { test: /\.css$/, use: getStyleLoader() },
          { test: /\.less$/, use: getStyleLoader('less-loader') },
          { test: /\.s[ac]ss$/, use: getStyleLoader('sass-loader') },
          { test: /\.styl$/, use: getStyleLoader('stylus-loader') },
          {
            test: /\.jsx?$/,
            exclude: /node_modules/,
            use: [{
              loader: 'thread-loader',
              options: {
                works: os.cpus().length,
              },
            }, {
              loader: 'babel-loader',
              options: {
                cacheDirectory: true, // enable babel cache
                cacheCompression: false,
              },
            }],
          },
          {
            test: /\.ts$/,
            loader: 'ts-loader',
            options: { appendTsSuffixTo: [/\.vue$/] },
          },
        ],
      },
      {
        test: /\.vue$/,
        loader: 'vue-loader',
        options: {
          cacheDirectory: resolve('node_modules/.cache/vue-loader'),
        },
      },
    ],
  },
  optimization: {
    minimize: isProduction,
    minimizer: [
      new CssMinimizerPlugin(),
      new TerserPlugin({
        parallel: os.cpus().length,
      }),
    ],
    // 代码分割配置
    splitChunks: {
      chunks: 'all', // 对所有模块都进行分割
      // 以下是默认值
      // minSize: 20000, // 分割代码最小的大小
      // minRemainingSize: 0, // 类似于minSize，最后确保提取的文件大小不能为0
      // minChunks: 1, // 至少被引用的次数，满足条件才会代码分割
      // maxAsyncRequests: 30, // 按需加载时并行加载的文件的最大数量
      // maxInitialRequests: 30, // 入口js文件最大并行请求数量
      // enforceSizeThreshold: 50000, // 超过50kb一定会单独打包（此时会忽略minRemainingSize、maxAsyncRequests、maxInitialRequests）
      cacheGroups: { // 组，哪些模块要打包到一个组
        defaultVendors: { // 组名
          test: /[\\/]node_modules[\\/]/, // 需要打包到一起的模块
          priority: -10, // 权重（越大越高）
          reuseExistingChunk: true, // 如果当前 chunk 包含已从主 bundle 中拆分出的模块，则它将被重用，而不是生成新的模块
          name: 'vendors',
        },
        default: { // 其他没有写的配置会使用上面的默认值
          minChunks: 2, // 这里的minChunks权重更大
          priority: -20,
          reuseExistingChunk: true,
        },
      },
    },
    // splitChunks: false,
    runtimeChunk: {
      name: (entrypoint) => `runtime~${entrypoint.name}.js`,
    },
  },
  plugins: [
    new VueLoaderPlugin(),
    new HtmlPlugin({
      template: './public/index.html',
    }),
    new PreloadPlugin({
      rel: 'prefetch',
      // as: 'script'
    }),
    new DefinePlugin({
      __VUE_OPTIONS_API__: 'false',
      __VUE_PROD_DEVTOOLS__: 'false',
    }),
    // isProduction && new GenerateSW({
    //   clientsClaim: true,
    //   skipWaiting: true,
    // }),
    !isProduction && new ESLintPlugin({
      cache: true,
      context: resolve('src'),
      exclude: 'node_modules',
      threads: os.cpus().length,
      cacheLocation: resolve('node_modules/.cache/.eslintcache'),
    }),
    // !isProduction && new ReactRefreshPlugin(),
    isProduction && new CopyPlugin({
      patterns: [{
        from: resolve('public'),
        to: resolve('dist'),
        globOptions: {
          ignore: ['**/index.html'],
        },
      }],
    }),
    isProduction && new MiniCssExtractPlugin({
      filename: 'css/[name].[contenthash:5].css',
      chunkFilename: 'css/chunk-[name].[contenthash:5].css',
    }),
  ].filter(Boolean),
  devServer: {
    port: 8080,
    historyApiFallback: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  },
};

function getStyleLoader(pre) {
  return [
    isProduction ? MiniCssExtractPlugin.loader : 'vue-style-loader',
    {
      loader: 'css-loader',
      options: {
        // modules: true,
        // localIdentName: '[local]_[hash:base64:8]'
      },
    },
    {
      loader: 'postcss-loader',
      options: {
        postcssOptions: {
          plugins: ['postcss-preset-env'],
        },
      },
    },
    pre,
  ].filter(Boolean);
}
