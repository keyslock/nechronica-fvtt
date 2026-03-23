import { NECHRONICA } from "../config.mjs";

export class NechronicaActor extends Actor {
  async applyDamage(damage) {
    // Always take a minimum of 1 damage, and round to the nearest integer.
    damage = Math.round(Math.max(1, damage));

    // Update the health.
    const { value } = this.system.resources.health;
    await this.update({ "system.resources.health.value": value - damage });

    // Log a message.
    await ChatMessage.implementation.create({
      content: `${this.name} took ${damage} damage!`,
    });
  }

  prepareDerivedData() {
    super.prepareDerivedData();

    const actor = this;

    // Doll specific data
    if (this.type === "doll") {
      // Generate attribute (experience) bonus
      for (const attribute of Object.keys(NECHRONICA.attributes)) {
        const curAttribute = actor.system.attributes[attribute];
        if (actor.system.bonusAttribute == attribute) curAttribute.bonus = 1;
        else curAttribute.bonus = 0;

        actor.system.attributes[attribute].total =
          curAttribute.bonus + curAttribute.experience;
      }
    }

    // Base value for max AP
    actor.system.ap.max = 6 + (actor.system.ap.bonus ?? 0);
    if (this.type === "legion") actor.system.ap.max += 2;

    // Item dependent data
    const threatMulti = this.type === "legion" ? 2 : 1;
    switch (this.type) {
      case "legion":
        actor.system.threat = { base: -2 };
        actor.system.threat.base += this.system.ap.bonus
          ? this.system.ap.bonus
          : 0;
        break;
      case "horror":
        actor.system.threat = { base: -3.5 };
        break;
      case "savant":
        actor.system.threat = { base: -8 };
        break;
      default:
        break;
    }

    actor.system.hp = {
      value: 0,
      max: 0,
    };

    if (actor.type === "legion") {
      actor.system.hp = {
        value: Number(actor.system.remaining) || 0,
        max: Number(actor.system.initialing) || 0,
      };
    }

    for (const item of this.items) {
      // Doll specific data
      if (this.type === "doll") {
        // Generate attribute totals
        if (item.type === "class") {
          for (const attribute of Object.keys(NECHRONICA.attributes)) {
            actor.system.attributes[attribute].total +=
              item.system.parameter[attribute];
          }
        }
      }

      // Body Parts
      if (item.type === "bodypart") {
        // HP calculation
        if (actor.type !== "legion") {
          if (actor.type !== "doll" || item.system.partType === "bodypart") {
            actor.system.hp.max++;
            if (!item.system.broken) actor.system.hp.value++;
          }
        }

        // Threat calculation
        if (actor.type !== "doll") {
          if (item.system.threat) {
            if (item.system.threatmulti) {
              actor.system.threat.base += item.system.threat;
            } else {
              actor.system.threat.base += item.system.threat * threatMulti;
            }
          }
        }

        // Benefits granted by intact parts
        if (!item.system.broken) {
          // Add max AP
          const apBonus = "apBonus" in item.system ? item.system.apBonus : null;
          if (apBonus) {
            actor.system.ap.max += apBonus;
          }
        }
      }
    }

    const hp = actor.system.hp;
    const rate = hp.max > 0 ? hp.value / hp.max : 0;

    let color = "green";
    if (rate < 0.5) color = "orange";
    if (rate < 0.25) color = "red";

    actor.system.hp.rate = rate * 100;
    actor.system.hp.color = color;

    // Threat calc.
    if (actor.system.threat) {
      let threatValue = Math.ceil(actor.system.threat.base);

      if (threatValue != actor.system.threat.base) {
        actor.system.threat.temp = actor.system.threat.base;
        actor.system.threat.base = threatValue;
      }

      if (actor.type === "legion") {
        threatValue = threatValue * Math.ceil(actor.system.initialing / 5);
      }

      actor.system.threat.value = threatValue;
    }
  }

  /**
   * Change the "Broken" state of one or multiple items, or a whole location
   *
   * @param targets - Indicator for items to change
   * @param state - State that is to be set
   * @returns The updated Documents
   */
  async setItemBroken(target = {}, state = 1) {
    const location = target.location;
    let paramItems = target.paramItems;
    // States: used true, unused false, "toggle"
    if (!paramItems?.length && location === "") return;

    if (paramItems != null && !Array.isArray(paramItems)) {
      paramItems = [paramItems];
    }
    let items = [];

    if (paramItems?.length) {
      items = paramItems.flatMap((i) => {
        const item = this.items.get(i);
        return item ? [item] : [];
      });
    } else if (location != null && location.length > 0) {
      const locationItems = this.items.filter(
        (i) =>
          i.type === "bodypart" &&
          i.system.partType === "bodypart" &&
          (i.system.location === location || location === "all"),
      );
      items.push(...locationItems);
    } else return [];

    const updates = items.reduce((arr, item) => {
      const oldState = item.system.broken;
      if (state !== "toggle" && state === oldState) return arr;
      const newState = state === "toggle" ? !!(oldState ^ 1) : !!state;
      if (item.id && item.broken != newState)
        arr.push({ _id: item._id, "system.broken": newState });
      return arr;
    }, []);
    if (!updates.length) return [];

    return this.updateEmbeddedDocuments("Item", updates);
  }

  /**
   * Change the "Used" state of one or multiple items, or a whole location
   *
   * @param paramItems - One or multiple IDs
   * @param location - A location string, or "all" for all parts, or "skills" for all skills
   * @param state - State that is to be set
   * @returns The updated Document
   */
  async setItemUsed(target = {}, state = 1) {
    let paramItems = target.paramItems;
    const location = target.location;
    // States: used true, unused false, "toggle"
    if (!paramItems?.length && location === "") return;

    if (paramItems != null && !Array.isArray(paramItems)) {
      paramItems = [paramItems];
    }
    let items = [];
    if (paramItems?.length) {
      items = paramItems.flatMap((i) => {
        const item = this.items.get(i);
        return item ? [item] : [];
      });
    } else if (location != null && location.length > 0) {
      const locationItems = this.items.filter(
        (i) =>
          i.type === "bodypart" &&
          !i.isRepeatable &&
          (location === "skills"
            ? i.system.partType === "skill"
            : i.system.partType === "bodypart" &&
              (location === "all" || i.system.location === location)),
      );
      items.push(...locationItems);
    } else return [];

    const updates = items.reduce((arr, item) => {
      const oldState = item.system.used;
      if (state !== "toggle" && state === oldState) return arr;
      const newState = state === "toggle" ? !!(oldState ^ 1) : !!state;
      if (item.id) arr.push({ _id: item.id, "system.used": newState });
      return arr;
    }, []);

    if (!updates.length) return [];

    return this.updateEmbeddedDocuments("Item", updates);
  }

  /**
   * Spend AP from this actor's combatant's AP pool if there is a current combatant
   *
   * @param ap - Number of AP to subtract
   * @param options - Optional parameters
   * @returns Number of AP spent from pool and spine counter
   */
  async spendAp(cost, spine) {
    let ap = this.system.ap.value;
    let spineCounter = this.system.spineCounter.value;
    if (spine) {
      ap -= cost;
      spineCounter += cost;
    } else {
      if (cost >= spineCounter) {
        ap -= cost - spineCounter;
        spineCounter = 0;
      } else {
        spineCounter -= cost;
      }
    }
    await this.update({
      "system.ap.value": ap,
      "system.spineCounter.value": spineCounter,
    });
  }
}

CONFIG.Actor.documentClass = NechronicaActor;
