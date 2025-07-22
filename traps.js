class TrapManager {
    constructor(gameController) {
        this.gameController = gameController;
        this.gameState = gameController.gameState;
        this.ui = gameController.ui;
        
        this.initializeTrapDatabase();
        console.log("TrapManager initialized with", this.traps.length, "trap types");
    }

    initializeTrapDatabase() {
        this.traps = [
            {
                id: 1,
                name: "Spike Pit",
                description: "A concealed pit filled with sharp spikes",
                difficulty: 1,
                damage: [10, 25],
                disarmDC: 12,
                detectionDC: 10
            },
            {
                id: 2,
                name: "Poison Dart Trap",
                description: "Hidden darts shoot from the walls",
                difficulty: 2,
                damage: [8, 20],
                poisonDamage: [5, 10],
                disarmDC: 14,
                detectionDC: 13
            },
            {
                id: 3,
                name: "Crushing Stone Block",
                description: "A massive stone block falls from above",
                difficulty: 3,
                damage: [15, 35],
                disarmDC: 16,
                detectionDC: 12
            },
            {
                id: 4,
                name: "Flame Jet Trap",
                description: "Jets of magical fire burst from floor tiles",
                difficulty: 3,
                damage: [12, 28],
                fireDamage: true,
                disarmDC: 15,
                detectionDC: 14
            },
            {
                id: 5,
                name: "Acid Spray Trap",
                description: "Corrosive acid sprays from hidden nozzles",
                difficulty: 4,
                damage: [10, 30],
                acidDamage: [3, 8],
                disarmDC: 17,
                detectionDC: 15
            },
            {
                id: 6,
                name: "Lightning Arc Trap",
                description: "Electrical energy arcs between metal conduuits",
                difficulty: 5,
                damage: [20, 40],
                stunChance: 0.3,
                disarmDC: 19,
                detectionDC: 16
            }
        ];
    }

    /**
     * Generate a trap appropriate for the dungeon level
     */
    generateTrap(dungeonLevel) {
        const appropriateTraps = this.traps.filter(trap => 
            trap.difficulty <= Math.max(1, Math.floor(dungeonLevel / 2) + 1)
        );
        
        if (appropriateTraps.length === 0) {
            return this.traps[0]; // Fallback to simplest trap
        }
        
        const selectedTrap = appropriateTraps[Math.floor(Math.random() * appropriateTraps.length)];
        
        // Create a copy with level-scaled values
        return {
            ...selectedTrap,
            damage: selectedTrap.damage.map(d => d + Math.floor(dungeonLevel * 2)),
            disarmDC: selectedTrap.disarmDC + Math.floor(dungeonLevel / 3)
        };
    }

    /**
     * Display trap encounter interface
     */
    showTrap(trap) {
        const hasSkirmisher = this.gameState.party.some(member => 
            member.class === 'Skirmisher' && member.currentHP > 0
        );
        
        const hasAntiTrapTools = this.gameController.inventoryManager && 
            this.gameController.inventoryManager.hasItem("Anti-Trap Tools");

        const modalHTML = `
            <div class="modal-overlay" id="trapModal">
                <div class="modal-content trap-modal">
                    <h2>⚠️ ${trap.name}</h2>
                    <div class="trap-description">
                        <p>${trap.description}</p>
                        <p class="trap-warning">This looks dangerous! What do you do?</p>
                    </div>
                    
                    <div class="trap-actions">
                        <button class="action-button danger-btn" onclick="trapManager.triggerTrap('${JSON.stringify(trap).replace(/"/g, '&quot;')}')">
                            🏃 Rush Through
                        </button>
                        
                        ${hasSkirmisher ? `
                            <button class="action-button skill-btn" onclick="trapManager.attemptDisarm('${JSON.stringify(trap).replace(/"/g, '&quot;')}', false)">
                                🎯 Disarm Trap (Skirmisher)
                            </button>
                        ` : ''}
                        
                        ${hasSkirmisher && hasAntiTrapTools ? `
                            <button class="action-button success-btn" onclick="trapManager.attemptDisarm('${JSON.stringify(trap).replace(/"/g, '&quot;')}', true)">
                                🔧 Disarm with Tools (+Bonus)
                            </button>
                        ` : ''}
                        
                        <button class="action-button secondary-btn" onclick="trapManager.avoidTrap()">
                            ↩️ Find Another Path
                        </button>
                    </div>
                    
                    <div class="trap-stats">
                        <small>Estimated Damage: ${trap.damage[0]}-${trap.damage[1]} HP</small>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    /**
     * Player rushes through the trap
     */
    triggerTrap(trapJSON) {
        const trap = JSON.parse(trapJSON.replace(/&quot;/g, '"'));
        const damage = Math.floor(Math.random() * (trap.damage[1] - trap.damage[0] + 1)) + trap.damage[0];
        
        // Apply damage to random party member
        const aliveMembters = this.gameState.party.filter(member => member.currentHP > 0);
        if (aliveMembters.length > 0) {
            const victim = aliveMembters[Math.floor(Math.random() * aliveMembters.length)];
            victim.currentHP = Math.max(0, victim.currentHP - damage);
            
            this.ui.log(`💥 ${victim.name} triggers the ${trap.name}!`);
            this.ui.log(`⚡ ${victim.name} takes ${damage} damage!`);
            
            if (victim.currentHP === 0) {
                this.ui.log(`💀 ${victim.name} has been knocked unconscious!`);
            }
        }
        
        this.closeTrapModal();
        this.ui.render();
    }

    /**
     * Attempt to disarm the trap
     */
    attemptDisarm(trapJSON, withTools) {
        const trap = JSON.parse(trapJSON.replace(/&quot;/g, '"'));
        const skirmisher = this.gameState.party.find(member => 
            member.class === 'Skirmisher' && member.currentHP > 0
        );
        
        if (!skirmisher) {
            this.ui.log("No conscious Skirmisher available to disarm traps!");
            return;
        }
        
        // Calculate disarm roll
        let disarmRoll = Math.floor(Math.random() * 20) + 1;
        let bonus = Math.floor(skirmisher.level / 2) + 2; // Base skill bonus
        
        if (withTools) {
            bonus += 5; // Tools provide significant bonus
            // Consume one use of anti-trap tools
            if (this.gameController.inventoryManager) {
                this.gameController.inventoryManager.consumeItem("Anti-Trap Tools", 1);
            }
        }
        
        const totalRoll = disarmRoll + bonus;
        
        this.ui.log(`🎯 ${skirmisher.name} attempts to disarm the ${trap.name}...`);
        this.ui.log(`🎲 Disarm roll: ${disarmRoll} + ${bonus} = ${totalRoll} (DC ${trap.disarmDC})`);
        
        if (totalRoll >= trap.disarmDC) {
            // Success!
            const xpGain = trap.difficulty * 10;
            this.gameState.experience += xpGain;
            
            this.ui.log(`✅ ${skirmisher.name} successfully disarms the trap!`);
            this.ui.log(`📈 Party gains ${xpGain} XP for clever trap handling!`);
            
            // Chance to recover some materials
            if (Math.random() < 0.3) {
                const goldFound = Math.floor(Math.random() * 20) + 10;
                this.gameState.gold += goldFound;
                this.ui.log(`🔧 Salvaged ${goldFound} gold worth of trap components!`);
            }
        } else {
            // Failure - but reduced damage
            const damage = Math.floor((trap.damage[0] + trap.damage[1]) / 4); // 25% of average damage
            skirmisher.currentHP = Math.max(0, skirmisher.currentHP - damage);
            
            this.ui.log(`❌ ${skirmisher.name} fails to disarm the trap!`);
            this.ui.log(`⚡ The trap partially triggers, dealing ${damage} damage!`);
            
            if (skirmisher.currentHP === 0) {
                this.ui.log(`💀 ${skirmisher.name} has been knocked unconscious!`);
            }
        }
        
        this.closeTrapModal();
        this.ui.render();
    }

    /**
     * Find another path (safe but time-consuming)
     */
    avoidTrap() {
        this.ui.log("🔄 You carefully find an alternate route around the trap.");
        this.ui.log("⏰ This takes extra time, but you avoid the danger.");
        
        // Small penalty - maybe lose some time or minor resource
        if (Math.random() < 0.2) {
            const goldLost = Math.floor(Math.random() * 5) + 1;
            this.gameState.gold = Math.max(0, this.gameState.gold - goldLost);
            this.ui.log(`💰 You drop ${goldLost} gold while navigating the detour.`);
        }
        
        this.closeTrapModal();
        this.ui.render();
    }

    /**
     * Close trap modal
     */
    closeTrapModal() {
        const modal = document.getElementById('trapModal');
        if (modal) {
            modal.remove();
        }
    }
}

// Export for use in main game
window.TrapManager = TrapManager;
