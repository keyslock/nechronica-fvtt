export class NechronicaItemSheet extends ItemSheet {
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["nechronica", "sheet", "item"],
      width: 600,
      height: 400,
      tabs: [
        {
          navSelector: ".sheet-tabs",
          contentSelector: ".sheet-body",
          initial: "attributes",
        },
      ],
    });
  }

  /** @override */
  get template() {
    return `systems/nechronica-fvtt/templates/items/item-${this.item.type}-sheet.hbs`;
  }

  getData() {
    // Retrieve base data structure.
    const context = super.getData();

    // Use a safe clone of the item data for further operations.
    const itemData = context.data;
    // Add the item's data to context.data for easier access, as well as flags.
    context.system = itemData.system;
    context.flags = itemData.flags;
    // Add roll data for TinyMCE editors.
    context.rollData = context.item.getRollData();

    return {
      ...context,
    };
  }

  activateListeners(html) {
    super.activateListeners(html);
    html.find(".edit-button").on("click", this._onEditClick.bind(this));
    html.find(".add-item").click(this._onAddItem.bind(this));
  }

  _onAddItem(event) {
    // TODO
    // const button = event.currentTarget;
    // const content = $(button).closest(".header").next(".content");
    // const newItem = $("<p>新しい項目</p>");
    // content.append(newItem);
  }

  _onEditClick(event) {
    // TODO
  }
}
