const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  entry: "./index.js", // Entry point for the application
  mode: "development",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "bundle.js",
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/, // Match both .js and .jsx files
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-react"],
          },
        },
      },
      {
        test: /\.(png|jpe?g|gif|svg)$/i,
        type: "asset/resource",
      },
      {
        test: /\.css$/,
        use: [
          "style-loader",
          "css-loader",
          "postcss-loader", // Add PostCSS loader
        ],
      },
      {
        test: /pdf\.worker\.mjs$/,
        type: 'asset/resource'
      }
    ],
  },
  resolve: {
    extensions: [".js", ".jsx"],
  },
  devServer: {
    static: {
      directory: path.join(__dirname, "dist"),
    },
    compress: true,
    port: 3000, // Application will be served at localhost:3000
    headers: {
      "Access-Control-Allow-Origin": "*", // Example header
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS", // Example header
      "Access-Control-Allow-Headers": "X-Requested-With, content-type", // Example header
    },
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "./index.html", // Path to the template file
      filename: "index.html",
    }),
  ],
};
