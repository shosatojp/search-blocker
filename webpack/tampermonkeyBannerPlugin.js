const { Compilation, sources: { ConcatSource } } = require("webpack");

class TampermonkeyBannerPlugin {
    constructor(banner) {
        this.banner = banner;
    }

    apply(compiler) {
        const banner = this.banner;

        compiler.hooks.compilation.tap("BannerPlugin", compilation => {
            compilation.hooks.processAssets.tap(
                {
                    name: "BannerPlugin",
                    stage: Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE_TRANSFER
                },
                () => {
                    for (const chunk of compilation.chunks) {
                        for (const file of chunk.files) {
                            console.log(file);
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
