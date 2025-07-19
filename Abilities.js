/**
 * Abilities System - Generic template for all skills, spells, powers, and item effects
 * This system handles hero abilities, monster abilities, item effects (scrolls, wands, potions), etc.
 */

class Ability {
    constructor(config) {
        // Basic ability information
        this.id = config.id;
        this.name = config.name;
        this.description = config.description || '';
        this.icon = config.icon || '✨';
        this.type = config.type || 'ability'; // 'spell', 'skill', 'item', 'monster', etc.
        
        // Targeting system
        this.targeting = {
            type: config.targeting?.type || 'single', // 'single', 'multiple', 'all', 'self', 'area'
            validTargets: config.targeting?.validTargets || 'enemies', // 'enemies', 'allies', 'any', 'self'
            count: config.targeting?.count || 1, // number of targets, or 'all' for all valid targets
            range: config.targeting?.range || 'melee' // 'melee', 'ranged', 'any'
        };
        
        // Cost system (flexible for different resource types)
        this.costs = {
            mana: config.costs?.mana || 0,
            health: config.costs?.health || 0,
            stamina: config.costs?.stamina || 0,
            gold: config.costs?.gold || 0,
            materials: config.costs?.materials || {}, // e.g., {spiderSilk: 1, bones: 2}
            cooldown: config.costs?.cooldown || 0 // turns before ability can be used again
        };
        
        // Effect system - multiple effects can be applied
        this.effects = config.effects || [];
        
        // Special handling flag
        this.hasSpecialCode = config.hasSpecialCode || false;
        this.specialHandler = config.specialHandler || null; // function reference for special abilities
        
        // Usage restrictions
        this.usageRestrictions = {
            level: config.usageRestrictions?.level || 1,
            class: config.usageRestrictions?.class || null, // specific class requirement
            inCombat: config.usageRestrictions?.inCombat !== false, // can be used in combat (default true)
            outOfCombat: config.usageRestrictions?.outOfCombat !== false // can be used out of combat (default true)
        };
        
        // Animation and visual effects
        this.visual = {
            animation: config.visual?.animation || 'default',
            color: config.visual?.color || '#ffffff',
            sound: config.visual?.sound || null
        };
    }
    
    /**
     * Check if the ability can be used by the caster
     */
    canUse(caster, gameState) {
        // Check level requirement
        if (caster.level < this.usageRestrictions.level) {
            return { canUse: false, reason: `Requires level ${this.usageRestrictions.level}` };
        }
        
        // Check class requirement
        if (this.usageRestrictions.class && caster.class !== this.usageRestrictions.class) {
            return { canUse: false, reason: `Requires ${this.usageRestrictions.class} class` };
        }
        
        // Check combat state
        if (gameState.inCombat && !this.usageRestrictions.inCombat) {
            return { canUse: false, reason: 'Cannot be used in combat' };
        }
        
        if (!gameState.inCombat && !this.usageRestrictions.outOfCombat) {
            return { canUse: false, reason: 'Can only be used in combat' };
        }
        
        // Check resource costs
        if (this.costs.mana > 0 && (caster.mana || 0) < this.costs.mana) {
            return { canUse: false, reason: `Requires ${this.costs.mana} mana` };
        }
        
        if (this.costs.health > 0 && caster.health <= this.costs.health) {
            return { canUse: false, reason: `Requires ${this.costs.health} health` };
        }
        
        if (this.costs.stamina > 0 && (caster.stamina || 0) < this.costs.stamina) {
            return { canUse: false, reason: `Requires ${this.costs.stamina} stamina` };
        }
        
        // Check material costs (for item-based abilities)
        for (const [material, amount] of Object.entries(this.costs.materials)) {
            if ((caster.materials?.[material] || 0) < amount) {
                return { canUse: false, reason: `Requires ${amount} ${material}` };
            }
        }
        
        // Check cooldown (would need to be tracked in gameState)
        if (this.costs.cooldown > 0) {
            const lastUsed = gameState.abilityCooldowns?.[this.id] || 0;
            const turnsPassed = gameState.currentTurn - lastUsed;
            if (turnsPassed < this.costs.cooldown) {
                return { canUse: false, reason: `Cooldown: ${this.costs.cooldown - turnsPassed} turns` };
            }
        }
        
        return { canUse: true };
    }
    
    /**
     * Get valid targets for this ability
     */
    getValidTargets(caster, allCharacters, gameState) {
        let validTargets = [];
        
        switch (this.targeting.validTargets) {
            case 'self':
                validTargets = [caster];
                break;
            case 'allies':
                // Set factions if not set
                allCharacters.forEach(char => {
                    if (!char.faction) {
                        if (char.name === 'Hero' || char === gameState?.hero || char.isHero) {
                            char.faction = 'player';
                        } else if (char.name && gameState?.hero?.underlings?.includes(char)) {
                            char.faction = 'player';
                        } else {
                            char.faction = 'enemy';
                        }
                    }
                });
                validTargets = allCharacters.filter(char => 
                    char.faction === caster.faction && char !== caster && char.health > 0);
                break;
            case 'allies_and_self':
                // Set factions if not set
                allCharacters.forEach(char => {
                    if (!char.faction) {
                        if (char.name === 'Hero' || char === gameState?.hero || char.isHero) {
                            char.faction = 'player';
                        } else if (char.name && gameState?.hero?.underlings?.includes(char)) {
                            char.faction = 'player';
                        } else {
                            char.faction = 'enemy';
                        }
                    }
                });
                validTargets = allCharacters.filter(char => 
                    char.faction === caster.faction && char.health > 0);
                break;
            case 'enemies':
                // Set factions if not set
                allCharacters.forEach(char => {
                    if (!char.faction) {
                        if (char.name === 'Hero' || char === gameState?.hero || char.isHero) {
                            char.faction = 'player';
                        } else if (char.name && gameState?.hero?.underlings?.includes(char)) {
                            char.faction = 'player';
                        } else {
                            char.faction = 'enemy';
                        }
                    }
                });
                validTargets = allCharacters.filter(char => 
                    char.faction !== caster.faction && char.health > 0);
                break;
            case 'any':
                validTargets = allCharacters.filter(char => char.health > 0);
                break;
        }
        
        // Apply targeting count
        if (this.targeting.count === 'all') {
            return validTargets;
        } else if (typeof this.targeting.count === 'number') {
            return validTargets.slice(0, this.targeting.count);
        }
        
        return validTargets;
    }
    
    /**
     * Use the ability on targets
     */
    use(caster, targets, gameState, gameController) {
        // Check if ability can be used
        const canUseResult = this.canUse(caster, gameState);
        if (!canUseResult.canUse) {
            return { success: false, message: canUseResult.reason };
        }
        
        // Consume resources
        this.consumeResources(caster, gameState);
        
        let results = [];
        
        // Handle special abilities first
        if (this.hasSpecialCode && this.specialHandler) {
            return this.specialHandler(caster, targets, gameState, gameController);
        }
        
        // Apply effects to each target
        for (const target of targets) {
            for (const effect of this.effects) {
                const result = this.applyEffect(effect, caster, target, gameState);
                results.push(result);
            }
        }
        
        // Set cooldown
        if (this.costs.cooldown > 0) {
            if (!gameState.abilityCooldowns) gameState.abilityCooldowns = {};
            gameState.abilityCooldowns[this.id] = gameState.currentTurn || 0;
        }
        
        return {
            success: true,
            results: results,
            message: `${caster.name} used ${this.name}!`
        };
    }
    
    /**
     * Consume the required resources
     */
    consumeResources(caster, gameState) {
        if (this.costs.mana > 0) {
            caster.mana = Math.max(0, (caster.mana || 0) - this.costs.mana);
        }
        
        if (this.costs.health > 0) {
            caster.health = Math.max(1, caster.health - this.costs.health);
        }
        
        if (this.costs.stamina > 0) {
            caster.stamina = Math.max(0, (caster.stamina || 0) - this.costs.stamina);
        }
        
        // Consume materials (for item-based abilities)
        for (const [material, amount] of Object.entries(this.costs.materials)) {
            if (caster.materials) {
                caster.materials[material] = Math.max(0, (caster.materials[material] || 0) - amount);
            }
        }
    }
    
    /**
     * Apply a specific effect to a target
     */
    applyEffect(effect, caster, target, gameState) {
        const result = {
            type: effect.type,
            target: target.name,
            success: true,
            value: 0,
            message: ''
        };
        
        switch (effect.type) {
            case 'heal':
                result.value = this.calculateEffectValue(effect, caster, target);
                target.health = Math.min(target.maxHealth, target.health + result.value);
                result.message = `${target.name} healed for ${result.value} HP`;
                break;
                
            case 'damage':
                result.value = this.calculateEffectValue(effect, caster, target);
                // Apply damage reduction if target has defense
                const finalDamage = Math.max(1, result.value - (target.defense || 0));
                target.health = Math.max(0, target.health - finalDamage);
                result.value = finalDamage;
                result.message = `${target.name} takes ${finalDamage} damage`;
                break;
                
            case 'buff_attack':
                result.value = this.calculateEffectValue(effect, caster, target);
                this.applyStatusEffect(target, 'attack_buff', result.value, effect.duration || 3);
                result.message = `${target.name} attack increased by ${result.value}`;
                break;
                
            case 'buff_defense':
                result.value = this.calculateEffectValue(effect, caster, target);
                this.applyStatusEffect(target, 'defense_buff', result.value, effect.duration || 3);
                result.message = `${target.name} defense increased by ${result.value}`;
                break;
                
            case 'debuff_attack':
                result.value = this.calculateEffectValue(effect, caster, target);
                this.applyStatusEffect(target, 'attack_debuff', result.value, effect.duration || 3);
                result.message = `${target.name} attack decreased by ${result.value}`;
                break;
                
            case 'debuff_defense':
                result.value = this.calculateEffectValue(effect, caster, target);
                this.applyStatusEffect(target, 'defense_debuff', result.value, effect.duration || 3);
                result.message = `${target.name} defense decreased by ${result.value}`;
                break;
                
            case 'resistance':
                this.applyStatusEffect(target, `${effect.damageType}_resistance`, effect.amount, effect.duration || 5);
                result.message = `${target.name} gains ${effect.damageType} resistance`;
                break;
                
            case 'stun':
                this.applyStatusEffect(target, 'stunned', 1, effect.duration || 1);
                result.message = `${target.name} is stunned`;
                break;
                
            case 'paralyze':
                this.applyStatusEffect(target, 'paralyzed', 1, effect.duration || 2);
                result.message = `${target.name} is paralyzed`;
                break;
                
            case 'dot': // Damage over time
                this.applyStatusEffect(target, effect.dotType, effect.damagePerTurn, effect.duration || 3);
                result.message = `${target.name} is afflicted with ${effect.dotType}`;
                break;
                
            case 'vampiric':
                const vampDamage = this.calculateEffectValue(effect, caster, target);
                const finalVampDamage = Math.max(1, vampDamage - (target.defense || 0));
                target.health = Math.max(0, target.health - finalVampDamage);
                const healAmount = Math.floor(finalVampDamage * (effect.healRatio || 0.5));
                caster.health = Math.min(caster.maxHealth, caster.health + healAmount);
                result.value = finalVampDamage;
                result.message = `${target.name} takes ${finalVampDamage} damage, ${caster.name} heals ${healAmount} HP`;
                break;
                
            case 'spread':
                // Damage that spreads to nearby enemies
                result.value = this.calculateEffectValue(effect, caster, target);
                const spreadDamage = Math.max(1, result.value - (target.defense || 0));
                target.health = Math.max(0, target.health - spreadDamage);
                result.message = `${target.name} takes ${spreadDamage} damage`;
                
                // Apply spread effect (would need access to all enemies)
                if (effect.spreadChance && Math.random() < effect.spreadChance) {
                    // Mark for spreading (would be handled by game controller)
                    result.spread = true;
                    result.spreadEffect = effect.spreadEffect;
                }
                break;
                
            default:
                result.success = false;
                result.message = `Unknown effect type: ${effect.type}`;
        }
        
        return result;
    }
    
    /**
     * Calculate the value of an effect based on caster stats and effect configuration
     */
    calculateEffectValue(effect, caster, target) {
        let baseValue = effect.baseValue || 0;
        
        // Add stat scaling
        if (effect.scaling) {
            for (const [stat, multiplier] of Object.entries(effect.scaling)) {
                baseValue += (caster[stat] || 0) * multiplier;
            }
        }
        
        // Add random variance
        if (effect.variance) {
            const variance = Math.random() * effect.variance * 2 - effect.variance;
            baseValue += variance;
        }
        
        // Apply target-specific modifiers
        if (effect.targetModifiers) {
            // Could modify based on target type, resistances, etc.
        }
        
        return Math.floor(baseValue);
    }
    
    /**
     * Apply a status effect to a character
     */
    applyStatusEffect(target, effectType, value, duration) {
        if (!target.statusEffects) {
            target.statusEffects = [];
        }
        
        // Remove existing effect of same type
        target.statusEffects = target.statusEffects.filter(effect => effect.type !== effectType);
        
        // Add new effect
        target.statusEffects.push({
            type: effectType,
            value: value,
            duration: duration,
            turnsRemaining: duration
        });
    }
}

/**
 * Underling Ability Registry - Stores all abilities for each underling class by level
 */
class UnderlingAbilities {
    static getAbilitiesForClass(className, level) {
        const classAbilities = this.abilities[className];
        if (!classAbilities) return [];
        
        // Return all abilities up to the current level
        return Object.keys(classAbilities)
            .filter(abilityLevel => parseInt(abilityLevel) <= level)
            .map(abilityLevel => classAbilities[abilityLevel]);
    }
    
    static abilities = {
        // ARCHER CLASS - Ranged damage dealer with utility
        archer: {
            1: new Ability({
                id: 'precise_shot',
                name: 'Precise Shot',
                description: 'A carefully aimed shot that never misses',
                icon: '🎯',
                type: 'skill',
                targeting: { type: 'single', validTargets: 'enemies', count: 1, range: 'ranged' },
                costs: { stamina: 1 },
                effects: [{
                    type: 'damage',
                    baseValue: 8,
                    scaling: { dexterity: 1.5 },
                    variance: 2
                }]
            }),
            
            2: new Ability({
                id: 'hunters_mark',
                name: "Hunter's Mark",
                description: 'Mark an enemy for increased damage',
                icon: '🏹',
                type: 'skill',
                targeting: { type: 'single', validTargets: 'enemies', count: 1 },
                costs: { stamina: 2 },
                effects: [{
                    type: 'debuff_defense',
                    baseValue: 3,
                    duration: 5
                }]
            }),
            
            3: new Ability({
                id: 'double_shot',
                name: 'Double Shot',
                description: 'Fire two arrows in quick succession',
                icon: '⚡',
                type: 'skill',
                targeting: { type: 'single', validTargets: 'enemies', count: 1, range: 'ranged' },
                costs: { stamina: 3 },
                effects: [
                    {
                        type: 'damage',
                        baseValue: 6,
                        scaling: { dexterity: 1.2 },
                        variance: 2
                    },
                    {
                        type: 'damage',
                        baseValue: 6,
                        scaling: { dexterity: 1.2 },
                        variance: 2
                    }
                ]
            }),
            
            4: new Ability({
                id: 'piercing_shot',
                name: 'Piercing Shot',
                description: 'An arrow that pierces through multiple enemies',
                icon: '💥',
                type: 'skill',
                targeting: { type: 'multiple', validTargets: 'enemies', count: 2, range: 'ranged' },
                costs: { stamina: 4 },
                effects: [{
                    type: 'damage',
                    baseValue: 10,
                    scaling: { dexterity: 1.8 },
                    variance: 3
                }]
            }),
            
            5: new Ability({
                id: 'nature_ally',
                name: 'Summon Wolf',
                description: 'Summon a wolf companion to fight alongside you',
                icon: '🐺',
                type: 'spell',
                targeting: { type: 'self', validTargets: 'self', count: 1 },
                costs: { mana: 8 },
                hasSpecialCode: true,
                specialHandler: function(caster, targets, gameState, gameController) {
                    // Create temporary wolf ally
                    const wolf = {
                        id: `summoned_wolf_${Date.now()}`,
                        name: 'Summoned Wolf',
                        health: 25,
                        maxHealth: 25,
                        attack: 8,
                        defense: 3,
                        faction: caster.faction,
                        isSummoned: true,
                        summonDuration: 5,
                        summonedBy: caster.id
                    };
                    
                    // Add wolf to appropriate ally list
                    if (gameState.underlings && caster.faction === 'player') {
                        gameState.temporaryAllies = gameState.temporaryAllies || [];
                        gameState.temporaryAllies.push(wolf);
                    }
                    
                    return {
                        success: true,
                        message: `${caster.name} summons a wolf companion!`,
                        results: [{ message: 'A wolf appears to aid in battle!' }]
                    };
                }
            }),
            
            6: new Ability({
                id: 'multishot',
                name: 'Multishot',
                description: 'Fire arrows at multiple enemies',
                icon: '🏹',
                type: 'skill',
                targeting: { type: 'multiple', validTargets: 'enemies', count: 3, range: 'ranged' },
                costs: { stamina: 5 },
                effects: [{
                    type: 'damage',
                    baseValue: 7,
                    scaling: { dexterity: 1.4 },
                    variance: 2
                }]
            }),
            
            7: new Ability({
                id: 'explosive_shot',
                name: 'Explosive Shot',
                description: 'An arrow that explodes on impact',
                icon: '💣',
                type: 'skill',
                targeting: { type: 'single', validTargets: 'enemies', count: 1, range: 'ranged' },
                costs: { stamina: 6 },
                effects: [{
                    type: 'spread',
                    baseValue: 12,
                    scaling: { dexterity: 2 },
                    variance: 4,
                    spreadChance: 0.8,
                    spreadEffect: { type: 'damage', baseValue: 6 }
                }]
            }),
            
            8: new Ability({
                id: 'rain_of_arrows',
                name: 'Rain of Arrows',
                description: 'Rain arrows down on all enemies',
                icon: '☔',
                type: 'skill',
                targeting: { type: 'all', validTargets: 'enemies', count: 'all', range: 'ranged' },
                costs: { stamina: 8 },
                effects: [{
                    type: 'damage',
                    baseValue: 9,
                    scaling: { dexterity: 1.6 },
                    variance: 3
                }]
            }),
            
            9: new Ability({
                id: 'spirit_arrow',
                name: 'Spirit Arrow',
                description: 'A mystical arrow that ignores armor',
                icon: '👻',
                type: 'spell',
                targeting: { type: 'single', validTargets: 'enemies', count: 1, range: 'ranged' },
                costs: { mana: 6, stamina: 3 },
                hasSpecialCode: true,
                specialHandler: function(caster, targets, gameState, gameController) {
                    const target = targets[0];
                    const damage = 15 + (caster.dexterity * 2.5) + (Math.random() * 6 - 3);
                    target.health = Math.max(0, target.health - Math.floor(damage));
                    return {
                        success: true,
                        message: `${caster.name}'s spirit arrow pierces ${target.name} for ${Math.floor(damage)} damage (ignores armor)!`,
                        results: [{ message: `${target.name} takes ${Math.floor(damage)} damage` }]
                    };
                }
            }),
            
            10: new Ability({
                id: 'forest_guardian',
                name: 'Summon Forest Guardian',
                description: 'Summon a powerful treant ally',
                icon: '🌳',
                type: 'spell',
                targeting: { type: 'self', validTargets: 'self', count: 1 },
                costs: { mana: 15 },
                hasSpecialCode: true,
                specialHandler: function(caster, targets, gameState, gameController) {
                    const treant = {
                        id: `forest_guardian_${Date.now()}`,
                        name: 'Forest Guardian',
                        health: 50,
                        maxHealth: 50,
                        attack: 15,
                        defense: 8,
                        faction: caster.faction,
                        isSummoned: true,
                        summonDuration: 8,
                        summonedBy: caster.id
                    };
                    
                    gameState.temporaryAllies = gameState.temporaryAllies || [];
                    gameState.temporaryAllies.push(treant);
                    
                    return {
                        success: true,
                        message: `${caster.name} summons a mighty Forest Guardian!`,
                        results: [{ message: 'A towering treant rises to defend the party!' }]
                    };
                }
            })
        },
        
        // WARRIOR CLASS - Tank with crowd control and buffs
        warrior: {
            1: new Ability({
                id: 'shield_bash',
                name: 'Shield Bash',
                description: 'Bash with shield to damage and stun',
                icon: '🛡️',
                type: 'skill',
                targeting: { type: 'single', validTargets: 'enemies', count: 1, range: 'melee' },
                costs: { stamina: 2 },
                effects: [
                    {
                        type: 'damage',
                        baseValue: 6,
                        scaling: { strength: 1.2 }
                    },
                    {
                        type: 'stun',
                        duration: 1
                    }
                ]
            }),
            
            2: new Ability({
                id: 'taunt',
                name: 'Taunt',
                description: 'Force enemies to attack you',
                icon: '😤',
                type: 'skill',
                targeting: { type: 'multiple', validTargets: 'enemies', count: 2 },
                costs: { stamina: 1 },
                hasSpecialCode: true,
                specialHandler: function(caster, targets, gameState, gameController) {
                    targets.forEach(target => {
                        target.forcedTarget = caster.id;
                        target.forcedTargetDuration = 2;
                    });
                    return {
                        success: true,
                        message: `${caster.name} taunts enemies to focus attacks!`,
                        results: targets.map(t => ({ message: `${t.name} is forced to target ${caster.name}` }))
                    };
                }
            }),
            
            3: new Ability({
                id: 'power_strike',
                name: 'Power Strike',
                description: 'A devastating melee attack',
                icon: '💪',
                type: 'skill',
                targeting: { type: 'single', validTargets: 'enemies', count: 1, range: 'melee' },
                costs: { stamina: 3 },
                effects: [{
                    type: 'damage',
                    baseValue: 12,
                    scaling: { strength: 2.2 },
                    variance: 4
                }]
            }),
            
            4: new Ability({
                id: 'fearsome_cry',
                name: 'Fearsome Cry',
                description: 'Intimidate enemies, reducing their defense',
                icon: '😱',
                type: 'skill',
                targeting: { type: 'all', validTargets: 'enemies', count: 'all' },
                costs: { stamina: 4 },
                effects: [{
                    type: 'debuff_defense',
                    baseValue: 4,
                    duration: 4
                }]
            }),
            
            5: new Ability({
                id: 'cleave',
                name: 'Cleave',
                description: 'Strike multiple enemies in melee range',
                icon: '⚔️',
                type: 'skill',
                targeting: { type: 'multiple', validTargets: 'enemies', count: 3, range: 'melee' },
                costs: { stamina: 5 },
                effects: [{
                    type: 'damage',
                    baseValue: 10,
                    scaling: { strength: 1.8 },
                    variance: 3
                }]
            }),
            
            6: new Ability({
                id: 'bulwark_defense',
                name: 'Bulwark Defense',
                description: 'Greatly increase defense for several turns',
                icon: '🏰',
                type: 'skill',
                targeting: { type: 'self', validTargets: 'self', count: 1 },
                costs: { stamina: 4 },
                effects: [{
                    type: 'buff_defense',
                    baseValue: 8,
                    duration: 5
                }]
            }),
            
            7: new Ability({
                id: 'rallying_cry',
                name: 'Rallying Cry',
                description: 'Boost all allies attack power',
                icon: '📯',
                type: 'skill',
                targeting: { type: 'all', validTargets: 'allies', count: 'all' },
                costs: { stamina: 6 },
                effects: [{
                    type: 'buff_attack',
                    baseValue: 6,
                    duration: 6
                }]
            }),
            
            8: new Ability({
                id: 'whirlwind',
                name: 'Whirlwind Attack',
                description: 'Spin attack hitting all surrounding enemies',
                icon: '🌪️',
                type: 'skill',
                targeting: { type: 'all', validTargets: 'enemies', count: 'all', range: 'melee' },
                costs: { stamina: 8 },
                effects: [{
                    type: 'damage',
                    baseValue: 8,
                    scaling: { strength: 1.5 },
                    variance: 2
                }]
            }),
            
            9: new Ability({
                id: 'shield_wall',
                name: 'Shield Wall',
                description: 'Protect all allies from damage',
                icon: '🛡️',
                type: 'skill',
                targeting: { type: 'all', validTargets: 'allies', count: 'all' },
                costs: { stamina: 7 },
                effects: [{
                    type: 'resistance',
                    damageType: 'physical',
                    amount: 50,
                    duration: 3
                }]
            }),
            
            10: new Ability({
                id: 'berserker_rage',
                name: 'Berserker Rage',
                description: 'Enter a rage, doubling attack but halving defense',
                icon: '😡',
                type: 'skill',
                targeting: { type: 'self', validTargets: 'self', count: 1 },
                costs: { stamina: 10 },
                hasSpecialCode: true,
                specialHandler: function(caster, targets, gameState, gameController) {
                    caster.rageMode = true;
                    caster.rageDuration = 5;
                    caster.rageAttackBonus = Math.floor(caster.attack);
                    caster.rageDefensePenalty = Math.floor(caster.defense / 2);
                    return {
                        success: true,
                        message: `${caster.name} enters a berserker rage!`,
                        results: [{ message: 'Attack doubled, defense halved for 5 turns!' }]
                    };
                }
            })
        },
        
        // HEALER CLASS - Divine magic with healing and support
        healer: {
            1: new Ability({
                id: 'minor_heal',
                name: 'Minor Heal',
                description: 'Restore health to an ally',
                icon: '💚',
                type: 'spell',
                targeting: { type: 'single', validTargets: 'allies', count: 1 },
                costs: { mana: 3 },
                effects: [{
                    type: 'heal',
                    baseValue: 15,
                    scaling: { willpower: 1.8, intelligence: 0.8 },
                    variance: 3
                }]
            }),
            
            2: new Ability({
                id: 'bless',
                name: 'Bless',
                description: 'Increase an ally\'s attack power',
                icon: '✨',
                type: 'spell',
                targeting: { type: 'single', validTargets: 'allies', count: 1 },
                costs: { mana: 4 },
                effects: [{
                    type: 'buff_attack',
                    baseValue: 5,
                    duration: 5
                }]
            }),
            
            3: new Ability({
                id: 'cure_poison',
                name: 'Cure Poison',
                description: 'Remove poison and other toxins from an ally',
                icon: '🧴',
                type: 'spell',
                targeting: { type: 'single', validTargets: 'allies', count: 1 },
                costs: { mana: 3 },
                hasSpecialCode: true,
                specialHandler: function(caster, targets, gameState, gameController) {
                    const target = targets[0];
                    if (target.statusEffects) {
                        const poisonEffects = target.statusEffects.filter(e => 
                            e.type === 'poison' || e.type === 'venom' || e.type === 'toxin');
                        target.statusEffects = target.statusEffects.filter(e => 
                            e.type !== 'poison' && e.type !== 'venom' && e.type !== 'toxin');
                        
                        if (poisonEffects.length > 0) {
                            return {
                                success: true,
                                message: `${caster.name} cures ${target.name} of poison!`,
                                results: [{ message: `${target.name} is cleansed of toxins` }]
                            };
                        }
                    }
                    return {
                        success: true,
                        message: `${caster.name} blesses ${target.name} with purification`,
                        results: [{ message: `${target.name} is protected from poison briefly` }]
                    };
                }
            }),
            
            4: new Ability({
                id: 'divine_protection',
                name: 'Divine Protection',
                description: 'Grant magical resistance to an ally',
                icon: '🛡️',
                type: 'spell',
                targeting: { type: 'single', validTargets: 'allies', count: 1 },
                costs: { mana: 5 },
                effects: [{
                    type: 'resistance',
                    damageType: 'magical',
                    amount: 30,
                    duration: 4
                }]
            }),
            
            5: new Ability({
                id: 'group_heal',
                name: 'Group Heal',
                description: 'Heal multiple allies at once',
                icon: '💞',
                type: 'spell',
                targeting: { type: 'multiple', validTargets: 'allies', count: 3 },
                costs: { mana: 8 },
                effects: [{
                    type: 'heal',
                    baseValue: 12,
                    scaling: { willpower: 1.5, intelligence: 0.5 },
                    variance: 2
                }]
            }),
            
            6: new Ability({
                id: 'divine_smite',
                name: 'Divine Smite',
                description: 'Channel divine power to damage an enemy',
                icon: '⚡',
                type: 'spell',
                targeting: { type: 'single', validTargets: 'enemies', count: 1 },
                costs: { mana: 6 },
                effects: [{
                    type: 'damage',
                    baseValue: 14,
                    scaling: { willpower: 2 },
                    variance: 4
                }]
            }),
            
            7: new Ability({
                id: 'sanctuary',
                name: 'Sanctuary',
                description: 'Make an ally untargetable for one turn',
                icon: '🕊️',
                type: 'spell',
                targeting: { type: 'single', validTargets: 'allies', count: 1 },
                costs: { mana: 7 },
                hasSpecialCode: true,
                specialHandler: function(caster, targets, gameState, gameController) {
                    const target = targets[0];
                    target.sanctuary = true;
                    target.sanctuaryDuration = 2;
                    return {
                        success: true,
                        message: `${caster.name} grants sanctuary to ${target.name}!`,
                        results: [{ message: `${target.name} is protected by divine sanctuary` }]
                    };
                }
            }),
            
            8: new Ability({
                id: 'mass_blessing',
                name: 'Mass Blessing',
                description: 'Bless all allies with increased stats',
                icon: '🌟',
                type: 'spell',
                targeting: { type: 'all', validTargets: 'allies', count: 'all' },
                costs: { mana: 12 },
                effects: [
                    {
                        type: 'buff_attack',
                        baseValue: 4,
                        duration: 6
                    },
                    {
                        type: 'buff_defense',
                        baseValue: 4,
                        duration: 6
                    }
                ]
            }),
            
            9: new Ability({
                id: 'divine_stun',
                name: 'Divine Stun',
                description: 'Stun an enemy with holy power',
                icon: '⭐',
                type: 'spell',
                targeting: { type: 'single', validTargets: 'enemies', count: 1 },
                costs: { mana: 8 },
                effects: [
                    {
                        type: 'damage',
                        baseValue: 8,
                        scaling: { willpower: 1.5 }
                    },
                    {
                        type: 'stun',
                        duration: 2
                    }
                ]
            }),
            
            10: new Ability({
                id: 'resurrection',
                name: 'Resurrection',
                description: 'Revive a fallen ally with half health',
                icon: '💫',
                type: 'spell',
                targeting: { type: 'single', validTargets: 'any', count: 1 },
                costs: { mana: 20 },
                hasSpecialCode: true,
                specialHandler: function(caster, targets, gameState, gameController) {
                    const target = targets[0];
                    if (target.health <= 0) {
                        target.health = Math.floor(target.maxHealth / 2);
                        return {
                            success: true,
                            message: `${caster.name} resurrects ${target.name}!`,
                            results: [{ message: `${target.name} rises with ${target.health} HP!` }]
                        };
                    } else {
                        return {
                            success: false,
                            message: `${target.name} is not fallen and cannot be resurrected`
                        };
                    }
                }
            })
        },
        
        // MAGE CLASS - Elemental magic with AOE and utility
        mage: {
            1: new Ability({
                id: 'magic_missile',
                name: 'Magic Missile',
                description: 'Unerring bolt of magical force',
                icon: '✨',
                type: 'spell',
                targeting: { type: 'single', validTargets: 'enemies', count: 1, range: 'ranged' },
                costs: { mana: 2 },
                effects: [{
                    type: 'damage',
                    baseValue: 6,
                    scaling: { intelligence: 1.5 },
                    variance: 1
                }]
            }),
            
            2: new Ability({
                id: 'frost_bolt',
                name: 'Frost Bolt',
                description: 'Ice projectile that may slow enemies',
                icon: '❄️',
                type: 'spell',
                targeting: { type: 'single', validTargets: 'enemies', count: 1, range: 'ranged' },
                costs: { mana: 3 },
                effects: [
                    {
                        type: 'damage',
                        baseValue: 8,
                        scaling: { intelligence: 1.8 }
                    },
                    {
                        type: 'debuff_attack',
                        baseValue: 2,
                        duration: 2
                    }
                ]
            }),
            
            3: new Ability({
                id: 'burning_hands',
                name: 'Burning Hands',
                description: 'Cone of fire affecting multiple enemies',
                icon: '🔥',
                type: 'spell',
                targeting: { type: 'multiple', validTargets: 'enemies', count: 2, range: 'melee' },
                costs: { mana: 4 },
                effects: [{
                    type: 'damage',
                    baseValue: 7,
                    scaling: { intelligence: 1.6 },
                    variance: 2
                }]
            }),
            
            4: new Ability({
                id: 'haste',
                name: 'Haste',
                description: 'Double an ally\'s attacks for several turns',
                icon: '💨',
                type: 'spell',
                targeting: { type: 'single', validTargets: 'allies', count: 1 },
                costs: { mana: 6 },
                hasSpecialCode: true,
                specialHandler: function(caster, targets, gameState, gameController) {
                    const target = targets[0];
                    target.hasted = true;
                    target.hasteDuration = 3;
                    return {
                        success: true,
                        message: `${caster.name} casts haste on ${target.name}!`,
                        results: [{ message: `${target.name} gains double attacks for 3 turns!` }]
                    };
                }
            }),
            
            5: new Ability({
                id: 'lightning_bolt',
                name: 'Lightning Bolt',
                description: 'Chain lightning that arcs between enemies',
                icon: '⚡',
                type: 'spell',
                targeting: { type: 'multiple', validTargets: 'enemies', count: 3, range: 'ranged' },
                costs: { mana: 7 },
                effects: [{
                    type: 'damage',
                    baseValue: 10,
                    scaling: { intelligence: 2 },
                    variance: 3
                }]
            }),
            
            6: new Ability({
                id: 'fireball',
                name: 'Fireball',
                description: 'Explosive fire magic hitting multiple targets',
                icon: '💥',
                type: 'spell',
                targeting: { type: 'multiple', validTargets: 'enemies', count: 4, range: 'ranged' },
                costs: { mana: 8 },
                effects: [{
                    type: 'spread',
                    baseValue: 12,
                    scaling: { intelligence: 2.2 },
                    variance: 4,
                    spreadChance: 0.6,
                    spreadEffect: { type: 'damage', baseValue: 6 }
                }]
            }),
            
            7: new Ability({
                id: 'mass_haste',
                name: 'Mass Haste',
                description: 'Grant haste to all allies',
                icon: '🌪️',
                type: 'spell',
                targeting: { type: 'all', validTargets: 'allies', count: 'all' },
                costs: { mana: 15 },
                hasSpecialCode: true,
                specialHandler: function(caster, targets, gameState, gameController) {
                    targets.forEach(target => {
                        target.hasted = true;
                        target.hasteDuration = 2;
                    });
                    return {
                        success: true,
                        message: `${caster.name} grants haste to the entire party!`,
                        results: [{ message: 'All allies gain double attacks for 2 turns!' }]
                    };
                }
            }),
            
            8: new Ability({
                id: 'ice_storm',
                name: 'Ice Storm',
                description: 'Devastating ice magic affecting all enemies',
                icon: '🌨️',
                type: 'spell',
                targeting: { type: 'all', validTargets: 'enemies', count: 'all', range: 'ranged' },
                costs: { mana: 12 },
                effects: [{
                    type: 'damage',
                    baseValue: 9,
                    scaling: { intelligence: 1.8 },
                    variance: 3
                }]
            }),
            
            9: new Ability({
                id: 'polymorph',
                name: 'Polymorph',
                description: 'Transform an enemy into a harmless creature',
                icon: '🐸',
                type: 'spell',
                targeting: { type: 'single', validTargets: 'enemies', count: 1 },
                costs: { mana: 10 },
                hasSpecialCode: true,
                specialHandler: function(caster, targets, gameState, gameController) {
                    const target = targets[0];
                    target.polymorphed = true;
                    target.polymorphDuration = 3;
                    target.originalAttack = target.attack;
                    target.attack = 1; // Reduced to minimal attack
                    return {
                        success: true,
                        message: `${caster.name} polymorphs ${target.name} into a sheep!`,
                        results: [{ message: `${target.name} is helpless for 3 turns!` }]
                    };
                }
            }),
            
            10: new Ability({
                id: 'meteor',
                name: 'Meteor',
                description: 'Summon a devastating meteor strike',
                icon: '☄️',
                type: 'spell',
                targeting: { type: 'all', validTargets: 'enemies', count: 'all', range: 'ranged' },
                costs: { mana: 20 },
                effects: [{
                    type: 'damage',
                    baseValue: 18,
                    scaling: { intelligence: 3 },
                    variance: 6
                }]
            })
        }
    };
}

/**
 * Monster Abilities - Special abilities for monsters
 */
class MonsterAbilities {
    static getAbility(abilityId) {
        return this.abilities[abilityId];
    }
    
    static abilities = {
        spider_poison: new Ability({
            id: 'spider_poison',
            name: 'Poison Bite',
            description: 'Venomous bite that poisons the target',
            icon: '🕷️',
            type: 'monster',
            targeting: { type: 'single', validTargets: 'enemies', count: 1, range: 'melee' },
            costs: {},
            effects: [
                {
                    type: 'damage',
                    baseValue: 4,
                    scaling: { strength: 1 }
                },
                {
                    type: 'dot',
                    dotType: 'poison',
                    damagePerTurn: 3,
                    duration: 4
                }
            ]
        }),
        
        spider_web: new Ability({
            id: 'spider_web',
            name: 'Web',
            description: 'Entangle target in webbing',
            icon: '🕸️',
            type: 'monster',
            targeting: { type: 'single', validTargets: 'enemies', count: 1, range: 'ranged' },
            costs: {},
            effects: [{
                type: 'stun',
                duration: 1
            }]
        })
    };
}

/**
 * Ability Factory - Creates common abilities
 */
class AbilityFactory {
    static createBasicHeal() {
        return new Ability({
            id: 'basic_heal',
            name: 'Heal',
            description: 'Restores health to an ally',
            icon: '💚',
            type: 'spell',
            targeting: {
                type: 'single',
                validTargets: 'allies',
                count: 1
            },
            costs: {
                mana: 3
            },
            effects: [{
                type: 'heal',
                baseValue: 20,
                scaling: {
                    willpower: 2,
                    intelligence: 1
                },
                variance: 5
            }]
        });
    }
    
    static createFirebolt() {
        return new Ability({
            id: 'firebolt',
            name: 'Firebolt',
            description: 'Launches a bolt of fire at an enemy',
            icon: '🔥',
            type: 'spell',
            targeting: {
                type: 'single',
                validTargets: 'enemies',
                count: 1,
                range: 'ranged'
            },
            costs: {
                mana: 4
            },
            effects: [{
                type: 'damage',
                baseValue: 15,
                scaling: {
                    intelligence: 2
                },
                variance: 3
            }]
        });
    }
    
    static createPoison() {
        return new Ability({
            id: 'poison',
            name: 'Poison',
            description: 'Inflicts poison damage over time',
            icon: '🐍',
            type: 'spell',
            targeting: {
                type: 'single',
                validTargets: 'enemies',
                count: 1
            },
            costs: {
                mana: 5
            },
            effects: [{
                type: 'dot',
                dotType: 'poison',
                damagePerTurn: 5,
                duration: 4
            }]
        });
    }
    
    static createHealthPotion() {
        return new Ability({
            id: 'health_potion',
            name: 'Health Potion',
            description: 'Consume a potion to restore health',
            icon: '🧪',
            type: 'item',
            targeting: {
                type: 'single',
                validTargets: 'self',
                count: 1
            },
            costs: {
                materials: {
                    'health_potion': 1
                }
            },
            effects: [{
                type: 'heal',
                baseValue: 50,
                variance: 10
            }]
        });
    }
    
    static createVampireBite() {
        return new Ability({
            id: 'vampire_bite',
            name: 'Vampire Bite',
            description: 'Drains life from enemy to heal self',
            icon: '🧛',
            type: 'monster',
            targeting: {
                type: 'single',
                validTargets: 'enemies',
                count: 1,
                range: 'melee'
            },
            costs: {},
            effects: [{
                type: 'vampiric',
                baseValue: 12,
                healRatio: 0.6,
                scaling: {
                    strength: 1.5
                }
            }]
        });
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Ability, AbilityFactory, UnderlingAbilities, MonsterAbilities };
} else {
    window.Ability = Ability;
    window.AbilityFactory = AbilityFactory;
    window.UnderlingAbilities = UnderlingAbilities;
    window.MonsterAbilities = MonsterAbilities;
}
