export const registerHandlebarsHelpers = function () {
  /**
   * A helper to create a set of radio checkbox input elements in a named set.
   * The provided keys are the possible radio values while the provided values are human readable labels.
   *
   * @param name               The radio checkbox field name
   * @param choices            A mapping of radio checkbox values to human readable labels
   * @param options            Options
   * @param options.checked    Which key is currently checked?
   * @param options.localize  Pass each label through string localization?
   * @returns HTML radio checkbox input elements
   *
   * @example <caption>The provided input data</caption>
   * let groupName = "importantChoice";
   * let choices = {a: "Choice A", b: "Choice B"};
   * let chosen = "a";
   *
   * @example <caption>The template HTML structure</caption>
   * <div class="form-group">
   *   <label>Radio Group Label</label>
   *   <div class="form-fields">
   *     {{radioBoxes groupName choices checked=chosen localize=true}}
   *   </div>
   * </div>
   */
  const nechRadioBoxesRow = (
    name,
    choices,
    options
  ) => {
    const checked = options.hash.checked || null;
    let html = "";
    for (const key of Object.keys(choices)) {
      const isChecked = checked === key;
      html += `<label class="checkbox ${name}"><input type="radio" name="system.bonusAttribute" value="${key}" ${
        isChecked ? "checked" : ""
      }></label>`;
    }
    return new Handlebars.SafeString(html);
  };

  Handlebars.registerHelper({
    nechRadioBoxesRow
  });
}