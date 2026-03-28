/**
 * Define a set of template paths to pre-load
 * Pre-loaded templates are compiled and cached for fast access when rendering
 * @return {Promise}
 */
export const preloadHandlebarsTemplates = async function () {
  return loadTemplates([
    // Actor partials.
    "systems/nechronica-fvtt/templates/actors/parts/ap-form.hbs",
    "systems/nechronica-fvtt/templates/actors/parts/biography.hbs",
    "systems/nechronica-fvtt/templates/actors/parts/npc-header.hbs",
    "systems/nechronica-fvtt/templates/actors/parts/parts-ol.hbs",
    "systems/nechronica-fvtt/templates/actors/parts/parts-ul.hbs"
    // Item partials
  ]);
};
