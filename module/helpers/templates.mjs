/**
 * Define a set of template paths to pre-load
 * Pre-loaded templates are compiled and cached for fast access when rendering
 * @return {Promise}
 */
export const preloadHandlebarsTemplates = async function () {
  return loadTemplates([
    // Actor partials.
    "systems/nechronica/templates/actors/parts/ap-form.hbs",
    "systems/nechronica/templates/actors/parts/biography.hbs",
    "systems/nechronica/templates/actors/parts/npc-header.hbs",
    "systems/nechronica/templates/actors/parts/parts-ol.hbs",
    "systems/nechronica/templates/actors/parts/parts-ul.hbs"
    // Item partials
  ]);
};
