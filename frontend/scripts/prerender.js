// Build snapshots directly from the existing public React pages.
const fs = require('node:fs');
const path = require('node:path');
const React = require('react');
const {renderToStaticMarkup} = require('react-dom/server');
const babel = require('@babel/core');
const pages = require('../src/seo/publicPages');
const output = {};
for (const page of pages) {
  const filename = path.join(__dirname, '../src/pages', `${page.component}.js`);
  const {code} = babel.transformSync(fs.readFileSync(filename,'utf8'), {
    filename, babelrc:false, configFile:false,
    presets:[require.resolve('@babel/preset-react')],
    plugins:[require.resolve('@babel/plugin-transform-modules-commonjs')]
  });
  const compiled = {exports:{}};
  const localRequire = name => {
    if (name.endsWith('.css')) return {};
    if (name === 'react') return React;
    throw new Error(`Prerender page ${page.component} has an unsupported import: ${name}`);
  };
  // Compile trusted local application source. No remote content is evaluated.
  new Function('require','module','exports',code)(localRequire,compiled,compiled.exports);
  output[page.path] = renderToStaticMarkup(React.createElement(compiled.exports.default));
}
fs.writeFileSync(path.join(__dirname,'../build/prerendered.json'), JSON.stringify(output));
console.log(`Prerendered ${Object.keys(output).length} public informational pages.`);
