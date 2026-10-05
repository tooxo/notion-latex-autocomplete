import path from "node:path";
import {fileURLToPath} from "url";
import webpack from "webpack";
import CopyPlugin from "copy-webpack-plugin";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config: webpack.Configuration = {
    entry: {
        autocomplete: "./src/autocomplete.ts",
        isolated: "./src/isolated.ts",
        "options/options": "./src/options/options.ts"
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: "ts-loader",
                exclude: /node_modules/,
            },
            {
                test: /\.ts$/,
                include: /node_modules\/katex\/src/, // exclude everything except katex/src
                use: {
                    loader: "ts-loader",
                    options: {transpileOnly: true}, // skip type-checking third-party source
                },
            }
        ],
    },
    optimization: {
        minimize: false
    },
    resolve: {
        extensions: [".tsx", ".ts", ".js"],
    },
    output: {
        filename: "[name].js",
        path: path.resolve(__dirname, "dist"),
    },
    plugins: [
        new CopyPlugin(
            {
                patterns: [
                    {
                        from: "**/*",
                        context: "src",
                        filter: filepath => !filepath.endsWith(".ts")
                    }
                ]
            }
        )
    ]
};

export default config;