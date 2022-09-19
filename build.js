/**
 * Build with esbuild for all platforms
 */
const fsPromises = require('fs').promises;
const fs = require('fs');
const path = require('path');
const {
    Worker,
    isMainThread,
    workerData,
} = require('worker_threads');
const { build } = require('esbuild');

const version = '2.0.0';
const mode = process.env.NODE_ENV || 'production';
const outdir = path.join(__dirname, 'dist');
const GOOGLE_CLIENT_ID = '531665009269-96fvecl3pj4717mj2e6if6oaph7eu8ar.apps.googleusercontent.com';

const packageJson = JSON.parse(fs.readFileSync('package.json', { encoding: 'utf-8' }));
const commonOptions = {
    bundle: true,
    minify: mode === 'production',
    sourcemap: mode === 'development',
    define: {
        'process.env.REPOSITORY_URL': JSON.stringify(packageJson.repository.url),
        'process.env.VERSION': JSON.stringify(version),
        'process.env.GOOGLE_CLIENT_ID': JSON.stringify(GOOGLE_CLIENT_ID),
    },
    watch: mode === 'development' && {
        onRebuild: (error, result) => {
            console.log('----------------------');
        },
    },
    banner: {
        js: `/* Search Blocker v${version} */`,
    },
};

const tasks = {
    /**
     * TamperMonkey User Script
     */
    buildTamperMonkey: async () => {
        let banner = await fsPromises.readFile('platforms/tampermonkey/header.js', { encoding: 'utf-8' });
        banner = banner.replace(/process.env.VERSION/g, version);
        await build({
            ...commonOptions,
            entryPoints: ['src/index.tsx'],
            outfile: path.join(outdir, 'search-blocker.user.js'),
            banner: { js: banner },
            define: {
                ...commonOptions.define,
                'process.env.PLATFORM': JSON.stringify('tampermonkey'),
            },
        });
    },
    /**
     * Chrome Extension
     */
    buildChromeExtension: async () => {
        await build({
            ...commonOptions,
            entryPoints: ['src/index.tsx'],
            outfile: path.join(outdir, 'chrome/search-blocker/search-blocker.js'),
            define: {
                ...commonOptions.define,
                'process.env.PLATFORM': JSON.stringify('chrome'),
            },
        });

        /* build manifest */
        const manifest = JSON.parse(await fsPromises.readFile('platforms/chrome/manifest.json'));
        const matches = JSON.parse(fs.readFileSync('platforms/chrome/matches.json'));
        manifest.version = version;
        manifest.name = packageJson.name;
        manifest.description = packageJson.description;
        for (const content_script of manifest.content_scripts) {
            content_script.matches = matches;
        }
        await fsPromises.writeFile(path.join(outdir, 'chrome/search-blocker/manifest.json'),
            JSON.stringify(manifest), { encoding: 'utf-8' });
        await fsPromises.copyFile('images/icon16.png', path.join(outdir, 'chrome/search-blocker/icon16.png'));
        await fsPromises.copyFile('images/icon32.png', path.join(outdir, 'chrome/search-blocker/icon32.png'));
        await fsPromises.copyFile('images/icon96.png', path.join(outdir, 'chrome/search-blocker/icon96.png'));
        await fsPromises.copyFile('images/icon128.png', path.join(outdir, 'chrome/search-blocker/icon128.png'));
    },
    buildChromeExtensionContentScript: async () => {
        await build({
            ...commonOptions,
            entryPoints: ['platforms/chrome/content.ts'],
            outfile: path.join(outdir, 'chrome/search-blocker/content.js'),
        });
    },
    /**
     * Firefox Extension
     */
    buildFirefoxExtension: async () => {
        await build({
            ...commonOptions,
            entryPoints: ['src/index.tsx'],
            outfile: path.join(outdir, 'firefox/search-blocker.js'),
            define: {
                ...commonOptions.define,
                'process.env.PLATFORM': JSON.stringify('firefox'),
            },
        });
        const manifest = JSON.parse(await fsPromises.readFile('platforms/firefox/manifest.json'));
        manifest.version = version;
        await fsPromises.writeFile(path.join(outdir, 'firefox/manifest.json'),
            JSON.stringify(manifest), { encoding: 'utf-8' });
    },
    buildFirefoxExtensionContentScript: async () => {
        await build({
            ...commonOptions,
            entryPoints: ['platforms/firefox/content.ts'],
            outfile: path.join(outdir, 'firefox/content.js'),
        });
    },
};

/* use threads */
if (isMainThread) {
    fs.rmSync(outdir, { recursive: true, force: true });
    for (const taskName of Object.keys(tasks)) {
        new Worker(__filename, { workerData: taskName });
    }
} else {
    const taskName = workerData;
    tasks[taskName]();
}
