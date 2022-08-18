import * as envHelpers from './environment-helpers';

const path = require('path');
const { webpack, DefinePlugin } = require('webpack');

const ExtensionName = envHelpers.getExtensionName();
const BehaviorPackName = envHelpers.getBehaviorPackName();

module.exports = {
    entry: './src/index.ts',
    mode: 'development',
    devtool: 'source-map',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: ExtensionName + '.js',
        chunkFormat: 'commonjs',
    },
    externalsType: 'module',
    externals: {
        'mojang-minecraft': 'mojang-minecraft',
        'mojang-editor': 'mojang-editor',
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js'],
    },
    experiments: {
        outputModule: true,
    },
    module: {
        rules: [
            // all files with a `.ts` or `.tsx` extension will be handled by `ts-loader`
            { test: /\.tsx?$/, loader: 'ts-loader' },
        ],
    },
    plugins: [
        new DefinePlugin({
            __EXTENSION_NAME__: JSON.stringify(ExtensionName),
            __BEHAVIOR_PACK_NAME__: JSON.stringify(BehaviorPackName)
        })
    ]
};
