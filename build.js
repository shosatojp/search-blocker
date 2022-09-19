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

const mode = process.env.NODE_ENV || 'production';
const outdir = path.join(__dirname, 'dist');

const packageJson = JSON.parse(fs.readFileSync('package.json', { encoding: 'utf-8' }));
const commonOptions = {
    bundle: true,
    minify: mode === 'production',
    sourcemap: mode === 'development',
    define: {
        'process.env.REPOSITORY_URL': JSON.stringify(packageJson.repository.url),
    },
    watch: mode === 'development' && {
        onRebuild: (error, result) => {
            console.log('----------------------');
        },
    },
}

const tasks = {
    /**
     * TamperMonkey User Script
     */
    buildTamperMonkey: async () => {
        const banner = await fsPromises.readFile('tampermonkey/header.js', { encoding: 'utf-8' });
        await build({
            ...commonOptions,
            entryPoints: ['src/index.tsx'],
            outfile: path.join(outdir, 'search-blocker.user.js'),
            banner: {
                js: banner,
            },
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
            outfile: path.join(outdir, 'chrome/search-blocker.js'),
            define: {
                ...commonOptions.define,
                'process.env.PLATFORM': JSON.stringify('tampermonkey'),
            },
        });
        await fsPromises.copyFile('chrome/manifest.json', path.join(outdir, 'chrome/manifest.json'));
    },
    buildChromeExtensionContentScript: async () => {
        await build({
            ...commonOptions,
            entryPoints: ['chrome/content.ts'],
            outfile: path.join(outdir, 'chrome/content.js'),
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
        await fsPromises.copyFile('firefox/manifest.json', path.join(outdir, 'firefox/manifest.json'));
    },
    buildFirefoxExtensionContentScript: async () => {
        await build({
            ...commonOptions,
            entryPoints: ['firefox/content.ts'],
            outfile: path.join(outdir, 'firefox/content.js'),
        });
    },
}

/* use threads */
if (isMainThread) {
    fs.rmSync(outdir, { recursive: true, force: true });
    for (const taskName of Object.keys(tasks)) {
        new Worker(__filename, { workerData: taskName })
    }
} else {
    const taskName = workerData;
    tasks[taskName]();
}
