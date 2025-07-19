/**
 * Combat Controller - Handles advanced combat mechanics and systems
 * This module manages combat-specific functionality separate from the main game controller
 */

class CombatController {
    constructor(gameController) {
        this.gameController = gameController;
        this.ui = gameController.ui;
        this.gameState = gameController.gameState;
        
        // Combat-specific state
        this.combatState = {
            activeEffects: [],
            turnQueue: [],
            combatPhase: 'setup', // setup, player-turn, enemy-turn, resolution
            currentTurn: 0,
            lastAction: null
        };
        
        // Initialize combat systems
        this.initializeCombatSystems();
    }

    /**
     * Initialize combat-related systems and configurations
     */
    initializeCombatSystems() {
        // Status effects system
        this.statusEffects = {
            poison: {
                name: 'Poison',
                icon: '🐍',
                duration: 3,
                tickDamage: 5,
                color: '#8B4513'
            },
            burn: {
                name: 'Burning',
                icon: '🔥',
                duration: 2,
                tickDamage: 8,
                color: '#FF4500'
            },
            bleed: {
                name: 'Bleeding',
                icon: '🩸',
                duration: 4,
                tickDamage: 3,
                color: '#DC143C'
            },
            regeneration: {
                name: 'Regeneration',
                icon: '💚',
                duration: 5,
                healPerTurn: 10,
                color: '#32CD32'
            },
            shield: {
                name: 'Shield',
                icon: '🛡️',
                duration: 3,
                damageReduction: 0.5,
                color: '#4169E1'
            },
            haste: {
                name: 'Haste',
                icon: '⚡',
                duration: 3,
                speedBonus: 1.5,
                color: '#FFD700'
            }
        };

        console.log('Combat Controller initialized with advanced systems');
    }

    /**
     * Apply status effect to a character
     * @param {Object} target - Character to apply effect to
     * @param {string} effectType - Type of status effect
     * @param {number} duration - Duration override (optional)
     */
    applyStatusEffect(target, effectType, duration = null) {
        if (!this.statusEffects[effectType]) {
            console.warn(`Unknown status effect: ${effectType}`);
            return false;
        }

        const effect = { ...this.statusEffects[effectType] };
        if (duration) effect.duration = duration;
        
        effect.targetId = target.id || target.name;
        effect.appliedTurn = this.combatState.currentTurn;

        // Check if effect already exists and refresh/stack
        const existingIndex = this.combatState.activeEffects.findIndex(
            e => e.name === effect.name && e.targetId === effect.targetId
        );

        if (existingIndex >= 0) {
            // Refresh duration for existing effect
            this.combatState.activeEffects[existingIndex].duration = effect.duration;
        } else {
            // Add new effect
            this.combatState.activeEffects.push(effect);
        }

        this.ui.log(`${target.name} is affected by ${effect.icon} ${effect.name}!`);
        return true;
    }

    /**
     * Reset combat state for new combat
     */
    resetCombatState() {
        this.combatState = {
            activeEffects: [],
            turnQueue: [],
            combatPhase: 'setup',
            currentTurn: 0,
            lastAction: null
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CombatController;
}
