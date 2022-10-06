import * as envHelpers from './environment-helpers';

const path = require('path');
const { webpack, DefinePlugin, SourceMapDevToolPlugin } = require('webpack');

const ExtensionName = envHelpers.getExtensionName();
const BehaviorPackName = envHelpers.getBehaviorPackName();

module.exports = {
    entry: './src/index.ts',
    mode: 'development',
    devtool: false,
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: ExtensionName + '.js',
        chunkFormat: 'commonjs',
    },
    externalsType: 'module',
    externals: {
        '@minecraft/server': '@minecraft/server',
        '@minecraft/server-editor': '@minecraft/server-editor',
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
        }),
        new SourceMapDevToolPlugin({
            filename: `${ExtensionName}.js.map`,
            moduleFilenameTemplate: '[absolute-resource-path]',
        }),
    ]
};
