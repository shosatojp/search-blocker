const path = require("path");
const fs = require("fs");
const { DefinePlugin } = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');
const CopyPlugin = require("copy-webpack-plugin");
const TampermonkeyBannerPlugin = require("./webpack/tampermonkeyBannerPlugin");

/* header for tampermonkey */
const banner = fs.readFileSync("tampermonkey/header.js", { encoding: 'utf-8' });
const packageJson = JSON.parse(fs.readFileSync("package.json", { encoding: 'utf-8' }));
const mode = process.env.NODE_ENV || "development";

const config = {
    entry: {
        "search-blocker.user.js": "./src/index.tsx",
        "chrome/content.js": "./chrome/content.ts",
        "chrome/search-blocker.js": "./src/index.tsx",
        // "firefox/search-blocker.js": "./src/index.tsx",
    },
    output: {
        filename: '[name]',
        path: path.resolve(__dirname, "dist"),
    },
    plugins: [
        new TampermonkeyBannerPlugin({ banner, regex: /.*\.user\.js$/i }),
        new CopyPlugin({
            patterns: [
                { from: "chrome/manifest.json", to: "chrome/manifest.json" },
                // { from: "firefox/manifest.json", to: "firefox/manifest.json" },
            ],
        }),
        new DefinePlugin({
            'process.env.REPOSITORY_URL': JSON.stringify(packageJson.repository.url),
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
