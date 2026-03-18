import { NECHRONICA } from "../config.mjs";
import { addCircles } from "../lib/utils.mjs";

export class NechronicaActorSheet extends ActorSheet {
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["nechronica", "sheet", "actor"],
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
    return `systems/nechronica/templates/actors/actor-${this.actor.type}-sheet.hbs`;
  }

  getData() {
    // Retrieve base data structure.
    const context = super.getData();
    context.isOwner = this.document.isOwner;
    context.limited = this.document.limited;
    context.options = this.options;
    context.editable = this.document.isEditable;
    context.cssClass = this.document.owner ? "editable" : "locked";
    context.isGM = game.user?.isGM ?? false;
    context.config = NECHRONICA;

    // Use a safe clone of the item data for further operations.
    const actorData = context.data;
    // Add the item's data to context.data for easier access, as well as flags.
    context.system = actorData.system;
    context.flags = actorData.flags;
    // Add roll data for TinyMCE editors.
    context.rollData = context.actor.getRollData();

    // Add type specific data
    if (actorData.type === "doll") {
      this._sortItemsLocations(context);
    } else if (actorData.type === "savant") {
      this._sortItemsLocations(context);
    } else if (actorData.type === "legion") {
      this._sortItemsSimple(context);
    } else if (actorData.type === "horror") {
      this._sortItemsSimple(context);
    }

    return {
      ...context,
    };
  }

  activateListeners(html) {
    super.activateListeners(html);

    // Owned Item management
    html.find(".item-add").click((ev) => this._onItemCreate(ev));
    html.find(".item-edit").click(this._onItemEdit.bind(this));
    html.find(".item-delete").click(this._onItemDelete.bind(this));

    // Item actions
    html.find(".item-action").click(this._onItemAction.bind(this));

    // Handle location usage
    html.find(".use-location").click((ev) => this._onLocationUse(ev));

    // Handle location breaking
    html.find(".break-location").click((ev) => this._onLocationBreak(ev));

    // Circle listener
    html.find(".circles").click((ev) => this._onCircleClick(ev));

    // Edit items directly from sheet
    html.find(".item-quick-edit").change((ev) => this._onItemQuickEdit(ev));
  }

  /**
   * Handle requests to create a new OwnedItem
   *
   * @param {Event} event - The triggering event
   * @returns {object} The created OwnedItem
   */
  _onItemCreate(event) {
    event.preventDefault();
    const header = $(event.currentTarget);
    const type = header.attr("data-type");
    const subType = header.attr("data-sub-type");
    const typeName = subType ?? type;
    const name = game.i18n.format("NECH.NewItem", {
      name: game.i18n.localize(NECHRONICA.itemTypes[typeName]),
    });

    const itemData = {
      name,
      type,
      system: {},
      img: "icons/svg/item-bag.svg",
    };

    if (type === "bodypart") {
      if (subType === "skill") {
        itemData.system.partType = "skill";
      } else {
        const location = header.attr("data-location") ?? "";
        itemData.system.partType = "bodypart";
        itemData.system.location = location;
        if (location && ["doll", "savant"].includes(this.actor.type)) {
          itemData.img = `/systems/nechronica/asset/icon/parts_${location}.png`;
        }
      }
    }

    return this.actor.createEmbeddedDocuments("Item", [itemData]);
  }

  /**
   * Handle requests to open an OwnedItems's sheet
   *
   * @param {Event} event - The triggering event
   */
  _onItemEdit(event) {
    event.preventDefault();
    const li = event.currentTarget.closest(".item");
    const item = this.actor.getEmbeddedDocument("Item", li.dataset.itemId);
    item.sheet?.render(true);
  }

  /**
   * Handle requests to delete an OwnedItem
   *
   * @param {event} event - The triggering event
   */
  _onItemDelete(event) {
    event.preventDefault();
    const button = event.currentTarget;
    if (button.disabled) return;

    const li = event.currentTarget.closest(".item");
    if (event.shiftKey) {
      this.actor.deleteEmbeddedDocuments("Item", [li.dataset.itemId]);
    } else {
      button.disabled = true;

      const item = this.actor.items.find((o) => o._id === li.dataset.itemId);
      if (item == null) return;
      const msg = `<p>${game.i18n.localize("NECH.DeleteItemConfirmation")}</p>`;
      Dialog.confirm({
        title: game.i18n.format("NECH.DeleteItemTitle", { item: item.name }),
        content: msg,
        yes: () => {
          this.actor.deleteEmbeddedDocuments("Item", [li.dataset.itemId]);
          button.disabled = false;
        },
        no: () => (button.disabled = false),
      });
    }
  }

  /**
   * Sorts Item entities by their location
   *
   * @param {object} context - The data to be returned by the sheet's getData
   */
  _sortItemsLocations(context) {
    this.actor.system.position = "";
    this.actor.system.class = "";
    this.actor.system.subClass = "";

    const bodyParts = [];
    for (let i of context.items) {
      bodyParts.push(i);
    }
    context.bodyParts = bodyParts;
    // Create general bodyParts object and categories
    context.bodyParts = {};
    for (const category of ["regrets", "memories", "attacks", "skills"]) {
      context[`${category}`] = [];
    }

    // Generate locations to hold body parts
    for (const [k, v] of Object.entries(NECHRONICA.locations)) {
      context.bodyParts[k] = { label: v, parts: [] };
    }

    // Populate item categories
    for (const item of context.items) {
      if (item.type === "bodypart") {
        item.showUsed = !["action", "auto"].includes(item.system.timing);
        // Skills don't need a location
        if (item.system.partType === "skill") {
          if (this.actor.type === "savant") {
            context.bodyParts["any"].parts.push(item);
          } else {
            context.skills.push(item);
          }
        } else {
          // regular body parts do
          context.bodyParts[item.system.location].parts = [
            ...(context.bodyParts[item.system.location ?? "any"].parts ?? []),
            item,
          ];
        }
      } else if (item.type === "attack") {
        context.attacks.push(item);
      } else if (item.type === "regret") {
        addCircles(item, 4, "system.madness");
        context.regrets.push(item);
      } else if (item.type === "memory") {
        context.memories.push(item);
      } else if (item.type === "class") {
        if (this.actor.system.class == "") {
          this.actor.system.class = item._id;
          context.class = item;
        } else if (this.actor.system.subClass == "") {
          this.actor.system.subClass = item._id;
          context.subClass = item;
        }
      } else if (item.type === "position") {
        if (this.actor.system.position == "") {
          this.actor.system.position = item._id;
          context.position = item;
        }
      }
    }
  }

  /**
   * Sorts Item entities
   *
   * @param {object} context - The data to be returned by the sheet's getData
   */
  _sortItemsSimple(context) {
    context.bodyParts = [];
    for (const item of context.items) {
      if (item.type === "bodypart") {
        item.showUsed = !["action", "auto"].includes(item.system.timing);
      }
      context.bodyParts.push(item);
    }
  }

  /**
   * Handle requests to update an OwnedItem's data from the owner's sheet
   *
   * @param {Event} event - The triggering event
   */
  _onItemQuickEdit(event) {
    event.preventDefault();
    const id = $(event.currentTarget).parents(".item").attr("data-item-id");
    const target = $(event.currentTarget).attr("data-target");
    if (id == null || target == null) return;
    const item = duplicate(this.actor.getEmbeddedDocument("Item", id));
    let value = event.target.value == "on" ? true : false;
    if (event.currentTarget.type === "checkbox") {
      value = !getProperty(item, target);
    }
    let updateItem = {};
    updateItem["_id"] = id; // アイテムのIDを設定
    updateItem[target] = value; // 動的にプロパティを設定

    this.actor.updateEmbeddedDocuments("Item", [updateItem]);
  }

  /**
   * Roll an item to chat
   *
   * @param {Event} event - The click event triggering the action
   */
  _onItemAction(event) {
    event.preventDefault();
    const a = event.currentTarget;
    const item = this.actor.getEmbeddedDocument(
      "Item",
      a.closest(".item").dataset.itemId,
    );
    // Check rolls
    if (a.classList.contains("check")) {
      item.roll({ rollType: "CHECK", ev: event });
    }

    // Attack rolls
    if (a.classList.contains("attack")) {
      item.roll({ rollType: "ATTACK", ev: event });
    }

    // Roll to chat
    if (
      a.classList.contains("chat") ||
      a.classList.contains("name") ||
      a.classList.contains("target")
    ) {
      item.roll({ rollType: "MESSAGE", ev: event });
    }
  }

  /**
   * Handle requests involving circles to set a numeric value with a defined maximum
   *
   * @param {Event} event         The triggering click event
   * @returns {Promise} update    The update diff
   * @private
   */
  _onCircleClick(event) {
    const actorData = this.actor;
    const index = Number($(event.currentTarget).attr("data-index"));
    let target = $(event.currentTarget)
      .parents(".circle-row")
      .attr("data-target");
    if (target === "item") {
      const itemData = actorData.items.find(
        (i) =>
          i._id ===
          $(event.currentTarget).parents(".item").attr("data-item-id"),
      );
      target = $(event.currentTarget)
        .parents(".circle-row")
        .attr("data-item-target");
      const value = getProperty(itemData, target);
      let updateItem = {};
      updateItem["_id"] = itemData._id;
      if (value === index + 1) {
        // If the last one was clicked, decrease by 1
        updateItem[target] = index;
      } // Otherwise, value = index clicked
      else updateItem[target] = index + 1;

      this.actor.updateEmbeddedDocuments("Item", [updateItem]);
    }
  }

  /**
   * Change the "Broken" state of all Parts (belonging to a location)
   *
   * @async
   * @param {Event} event - The triggering click event
   * @returns {Promise<Entity|Entity[]>}   The updated Entity or array of Entities
   */
  async _onLocationBreak(event) {
    event.preventDefault();
    const li = $(event.currentTarget).closest(".header")[0];
    const location = li.dataset.location;
    const state = event.shiftKey ? 1 : event.ctrlKey ? "toggle" : 0;

    const actor = this.actor;
    return actor.setItemBroken({ location }, state);
  }

  /**
   * Change the "Used" state of all Parts (belonging to a location) or all Skills
   *
   * @async
   * @param {Event} event - The triggering click event
   * @returns {Promise<Entity|Entity[]>}   The updated Entity or array of Entities
   */
  async _onLocationUse(event) {
    event.preventDefault();

    const li = $(event.currentTarget).closest(".header")[0];
    const location = li.dataset.location;
    const state = event.shiftKey ? 1 : event.ctrlKey ? "toggle" : 0;

    const actor = this.actor;
    return actor.setItemUsed({ location }, state);
  }
}
