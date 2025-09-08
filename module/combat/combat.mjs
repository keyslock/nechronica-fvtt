/**
 * The Nechronica specific Combat class, providing the initiative handling necessary
 * for the AP based turn order of actors.
 */
export class NechronicaCombat extends Combat {
    /**
     * イニシアティブのロール処理をカスタマイズ
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
     * 戦闘開始時の処理
     */
    async startCombat() {
        // 戦闘開始時のデフォルト処理を呼び出す
        await super.startCombat();

        // 戦闘に参加しているキャラクターに処理を適用
        for (let combatant of this.combatants) {
            const actor = combatant.actor;
            if (!actor) continue;

            // APを最大値まで回復
            const ap = actor.system.ap.max;
            await actor.update({ "system.ap.value": ap });

            // イニシアティブを新しい値で更新
            await this.setInitiative(combatant.id, ap);

            // キャラクターが所持するアイテムを未使用状態に設定
            for (let item of actor.items) {
                if (item.system.used) {
                    await item.update({ "system.used": false });
                }
            }
        }
    }
    /**
     * ラウンド進行
     */
    async nextRound() {
        // 既存の nextRound メソッドを呼び出してラウンドを進める
        await super.nextRound();

        // 戦闘に参加しているキャラクターをループ処理
        for (let combatant of this.combatants) {
            const actor = combatant.actor;
            if (!actor) continue;

            // キャラクターのAPを更新
            const ap = actor.system.ap.value + actor.system.ap.max;
            await actor.update({ "system.ap.value": ap });

            // キャラクターが所持するアイテムを未使用状態に設定
            for (let item of actor.items) {
                if (item.system.used) {
                    await item.update({ "system.used": false });
                }
            }
        }
    }
}

