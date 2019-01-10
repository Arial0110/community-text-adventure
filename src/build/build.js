// builds the game
require("@babel/register");
const fs = require("fs-extra");
const path = require("path");
const webpack = require("webpack");
const minifier = require("html-minifier");
const p_output_directory = JSON.parse(fs.readFileSync(path.join(__dirname, "../../package.json")).toString()).output_directory;

// get information about the scenes, endings, and other things.
const WTA = require("web-text-adventure");
const sceneFiles = fs.readdirSync(path.join(__dirname, "../../scenes"));
sceneFiles.forEach(file => require(path.join(__dirname, "../../scenes", file)));

const scenes = WTA.getAllScenes();
const endingScenes = Object.keys(scenes).filter(x=>scenes[x].ending).length;

// make `dist` folder
const dist_folder = path.join(__dirname, "../../", p_output_directory);
if (fs.pathExistsSync(dist_folder)) {
    fs.removeSync(dist_folder);
}
fs.mkdirsSync(dist_folder);

// run `webpack --mode production`
const config = require("../../webpack.config.js")({
    production: true,
    extraDefines: {
        $endingCount: JSON.stringify(endingScenes),
        $dynamicFiles: JSON.stringify(sceneFiles.filter(x => x !== "menu.jsx")),
    }
});
config.output.path = dist_folder;

webpack(config, (err, stats) => {
    // errors
    if (err) {
        // eslint-disable-next-line no-console
        console.error(err.stack || err);
        if (err.details) {
            // eslint-disable-next-line no-console
            console.error(err.details);
        }
        return;
    }

    const info = stats.toJson();

    // errors
    if (stats.hasErrors()) {
        // eslint-disable-next-line no-console
        console.error(info.errors.join("\n\n"));
    }

    // warnings
    if (stats.hasWarnings()) {
        // eslint-disable-next-line no-console
        console.warn(info.warnings.join("\n"));
    }

    // copy index.production.html
    const input_html = fs.readFileSync(path.join(__dirname, "../../src/index.html")).toString();
    const output_html = minifier.minify(input_html, {
        caseSensitive: true,
        collapseInlineTagWhitespace: true,
        collapseWhitespace: true,
        minifyURLs: true,
        minifyCSS: true,
        minifyJS: {
            ie8: false,
            mangle: {
                toplevel: true,
                keep_fnames: false
            },

        },
        removeComments: true,
        removeAttributeQuotes: true,
        removeOptionalTags: true,
        removeRedundantAttributes: true,
        removeScriptTypeAttributes: true,
        removeStyleLinkTypeAttributes: true,
        removeTagWhitespace: true,
        useShortDoctype: true
    });
    fs.writeFileSync(path.join(dist_folder, "index.html"), output_html);


    // eslint-disable-next-line no-console
    console.log("build completed!");
});