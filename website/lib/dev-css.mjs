// Astro 7 caches each page's inlined development CSS in a virtual module.
// Sass partial edits can update the browser CSS without invalidating that
// module, leaving the old styles in the initial HTML on the next navigation.
export function refreshDevCss() {
  return {
    name: 'knap:refresh-dev-css',
    apply: 'serve',
    hotUpdate: {
      order: 'post',
      handler({ file, timestamp }) {
        if (!/\.(?:css|scss|sass|astro)$/.test(file)) return;
        const environment = this.environment;
        if (environment.name === 'client') return;

        for (const [id, module] of environment.moduleGraph.idToModuleMap) {
          if (!id.startsWith('\0virtual:astro:dev-css:')) continue;
          environment.moduleGraph.invalidateModule(module, undefined, timestamp, true);
          // Vite's evaluated module cache is separate from its transform cache.
          const evaluatedModules = environment.runner?.evaluatedModules;
          const evaluated = evaluatedModules?.getModuleById(id);
          if (evaluated) evaluatedModules.invalidateModule(evaluated);
        }
      },
    },
  };
}
