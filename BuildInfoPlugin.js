class BuildInfoPlugin {
  constructor(output) {
    this.output = output;
  }

  apply(compiler) {
    const pluginName = BuildInfoPlugin.name;
    const { webpack } = compiler;
    const { Compilation } = webpack;
    const { RawSource } = webpack.sources;
    compiler.hooks.thisCompilation.tap(pluginName, (compilation) => {
      compilation.hooks.processAssets.tap(
        {
          name: pluginName,
          stage: Compilation.PROCESS_ASSETS_STAGE_SUMMARIZE,
        },
        (assets) => {
          const bInfo = {};
          bInfo.date = new Date().toUTCString();
          bInfo.files = Array.from(Object.keys(assets));
          compilation.emitAsset(
            this.output,
            new RawSource(JSON.stringify(bInfo))
          );
        }
      );
    });
  }
}

module.exports = BuildInfoPlugin;
