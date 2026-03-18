/**
 * The Nechronica specific Combat class, providing the initiative handling necessary
 * for the AP based turn order of actors.
 */
export class NechronicaCombat extends Combat {
    /**
     * custom initiative
     */
    async rollInitiative(ids, options = {}) {
        const combatants = ids.map((id) => this.combatants.get(id));
        const updates = [];
        
        for (const combatant of combatants) {
            const actor = combatant.actor;
            if (!actor) continue;
            const actorData = actor.system;
            console.log(actorData);
            let initiativeFormula = actorData.ap.max;
            let initiative = actorData.ap.value + initiativeFormula;
            updates.push({
                _id: combatant.id,
                initiative: initiativeFormula,
            });
        }
    
        // Update combat tracker
        if (updates.length > 0) {
            await this.updateEmbeddedDocuments("Combatant", updates);
        }
    }
    /**
     * start combat
     */
    async startCombat() {
        await super.startCombat();

        for (let combatant of this.combatants) {
            const actor = combatant.actor;
            if (!actor) continue;

            // ap update.
            const ap = actor.system.ap.max;
            await actor.update({ "system.ap.value": ap });
            await this.setInitiative(combatant.id, ap);

            // item update.
            for (let item of actor.items) {
                if (item.system.used) {
                    await item.update({ "system.used": false });
                }
            }
        }
    }
    /**
     * round activate
     */
    async nextRound() {
        await super.nextRound();

        for (let combatant of this.combatants) {
            const actor = combatant.actor;
            if (!actor) continue;

            // ap update.
            const ap = actor.system.ap.value + actor.system.ap.max;
            await actor.update({ "system.ap.value": ap });

            // item update.
            for (let item of actor.items) {
                if (item.system.used) {
                    await item.update({ "system.used": false });
                }
            }
        }
    }
}

