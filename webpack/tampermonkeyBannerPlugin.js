const { Compilation, sources: { ConcatSource } } = require("webpack");

class TampermonkeyBannerPlugin {
    constructor(options = {
        banner: '',
        regex: undefined,
    }) {
        options.regex = options.regex || new RegExp('.*');
        options.banner = options.banner || '';

        this.options = options;
    }

    apply(compiler) {
        const banner = this.options.banner;

        compiler.hooks.compilation.tap("TampermonkeyBannerPlugin", compilation => {
            compilation.hooks.processAssets.tap(
                {
                    name: "TampermonkeyBannerPlugin",
                    stage: Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE_TRANSFER
                },
                () => {
                    for (const chunk of compilation.chunks) {
                        for (const file of chunk.files) {
                            if (!this.options.regex.test(file)) {
                                continue;
                            }

                            if (!chunk.canBeInitial()) {
                                continue;
                            }

                            compilation.updateAsset(file, old => {
                                return new ConcatSource(banner, '\n', old);
                            });
                        }
                    }
                }
            );
        });
    }
}

module.exports = TampermonkeyBannerPlugin;
