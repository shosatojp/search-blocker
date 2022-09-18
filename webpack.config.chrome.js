const path = require("path");
const fs = require("fs");
const { DefinePlugin } = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');
const CopyPlugin = require("copy-webpack-plugin");

const packageJson = JSON.parse(fs.readFileSync("package.json", { encoding: 'utf-8' }));
const mode = process.env.NODE_ENV || "development";

const config = {
    entry: {
        "chrome/content.js": "./chrome/content.ts",
        "chrome/search-blocker.js": "./src/index.tsx",
    },
    output: {
        filename: '[name]',
        path: path.resolve(__dirname, "dist"),
    },
    plugins: [
        new CopyPlugin({
            patterns: [
                { from: "chrome/manifest.json", to: "chrome/manifest.json" },
            ],
        }),
        new DefinePlugin({
            'process.env.REPOSITORY_URL': JSON.stringify(packageJson.repository.url),
            'process.env.PLATFORM': JSON.stringify('chrome-extension'),
        }),
    ],
    module: {
        rules: [
            {
                test: /\.(ts|tsx)$/i,
                loader: "ts-loader",
                exclude: ["/node_modules/"],
            },
            {
                test: /\.css$/i,
                use: ["css-loader"],
            },
            {
                test: /\.(eot|svg|ttf|woff|woff2|png|jpg|gif)$/i,
                type: "asset",
            },
        ],
    },
    resolve: {
        extensions: [".tsx", ".ts", ".jsx", ".js", "..."],
    },
    mode: mode,
    optimization: {
        minimize: mode === "production",
        minimizer: [
            new TerserPlugin({
                extractComments: false,
            }),
        ],
    },
    devtool: mode === "production" ? undefined : "inline-source-map",
};

module.exports = config;
