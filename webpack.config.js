const path = require("path");
const { BannerPlugin } = require("webpack");
const fs = require("fs");

/* header for tampermonkey */
const banner = fs.readFileSync("tampermonkey/header.js", { encoding: 'utf-8' });

const config = {
    entry: "./src/index.tsx",
    output: {
        filename: '[name].user.js',
        path: path.resolve(__dirname, "dist"),
    },
    plugins: [
        new BannerPlugin({ banner: banner, raw: true }),
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
};

module.exports = config;
