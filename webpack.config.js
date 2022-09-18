const path = require("path");
const fs = require("fs");
const TerserPlugin = require('terser-webpack-plugin');
const TampermonkeyBannerPlugin = require("./webpack/tampermonkeyBannerPlugin");

/* header for tampermonkey */
const banner = fs.readFileSync("tampermonkey/header.js", { encoding: 'utf-8' });

const config = {
    entry: "./src/index.tsx",
    output: {
        filename: 'search-blocker.user.js',
        path: path.resolve(__dirname, "dist"),
    },
    plugins: [
        new TampermonkeyBannerPlugin(banner),
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
    mode: process.env.NODE_ENV || "development",
    optimization: {
        minimize: true,
        minimizer: [
            new TerserPlugin({
                extractComments: false,
            }),
        ],
    }
};

module.exports = config;
