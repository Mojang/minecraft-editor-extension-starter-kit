import * as envHelpers from './environment-helpers';

const path = require('path');
const baseConfig = require('./webpack.config');

const ExtensionName = envHelpers.getExtensionName();
var OutputDir = envHelpers.getTargetDir('UWP', ExtensionName);

module.exports = {
    ...baseConfig,
    watch: false,
    output: {
        ...baseConfig.output,
        path: path.resolve(OutputDir, 'scripts'),
        filename: ExtensionName + '.js',
    }
};
