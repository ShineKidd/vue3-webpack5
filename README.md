performance improve

- hot module replacement
```js
if (module.hot) {
  module.hot.accept('./some.js')
}
```
- loader oneOf()
- include exclude (babel-loader eslint-plugin)
- cache (babel-loader eslint-plugin) -- rebuild
- thread(eslint terser-plugin) -- js


bundle smaller

- tree-shaking esm
- @babel/plugin-transform-runtime
- image-minimizer-webpack-plugin imagemin imagemin-gifsicle imagemin-jpegtran imagemin-svgo
- core-js useBuiltIns

runtime performance

- code split -- chunk-reuse dynamic-import
- preload prefetch
- workbox-webpack-plugin