class EventManager {
    constructor(gameController) {
        this.gameController = gameController;
        this.gameState = gameController.gameState;
        this.ui = gameController.ui;
        
        console.log("EventManager initialized");
    }

    /**
     * Determines what type of event occurs during dungeon exploration
     * @param {number} dungeonLevel - Current dungeon level
     * @returns {string} - Event type: 'combat', 'puzzle', 'trap', or 'treasure'
     */
    determineRandomEvent(dungeonLevel) {
        const eventChance = Math.random() * 100;
        
        // Base chances - adjust these for game balance
        let combatChance = 60;
        let puzzleChance = 15;
        let trapChance = 20;
        let treasureChance = 5;
        
        // Deeper levels have more traps and puzzles
        if (dungeonLevel > 5) {
            combatChance = 50;
            puzzleChance = 20;
            trapChance = 25;
            treasureChance = 5;
        }
        
        if (eventChance < combatChance) {
            return 'combat';
        } else if (eventChance < combatChance + puzzleChance) {
            return 'puzzle';
        } else if (eventChance < combatChance + puzzleChance + trapChance) {
            return 'trap';
        } else {
            return 'treasure';
        }
    }

    /**
     * Handles the selected random event
     * @param {string} eventType - Type of event to handle
     * @param {number} dungeonLevel - Current dungeon level
     */
    handleRandomEvent(eventType, dungeonLevel) {
        console.log(`Handling random event: ${eventType} at level ${dungeonLevel}`);
        
        switch (eventType) {
            case 'puzzle':
                this.handlePuzzleEvent(dungeonLevel);
                break;
            case 'trap':
                this.handleTrapEvent(dungeonLevel);
                break;
            case 'treasure':
                this.handleTreasureEvent(dungeonLevel);
                break;
            case 'combat':
            default:
                this.handleCombatEvent();
                break;
        }
    }

    /**
     * Handle puzzle encounter
     */
    handlePuzzleEvent(dungeonLevel) {
        if (this.gameController.puzzleManager) {
            const puzzle = this.gameController.puzzleManager.generatePuzzle(dungeonLevel);
            if (puzzle) {
                this.ui.log("You discover an ancient puzzle carved into the dungeon wall...");
                setTimeout(() => this.gameController.puzzleManager.showPuzzle(puzzle), 500);
                return;
            }
        }
        // Fallback to combat if puzzle fails
        this.handleCombatEvent();
    }

    /**
     * Handle trap encounter
     */
    handleTrapEvent(dungeonLevel) {
        console.log('handleTrapEvent called, dungeonLevel:', dungeonLevel);
        console.log('gameController.trapManager:', this.gameController.trapManager);
        
        if (this.gameController.trapManager) {
            const trap = this.gameController.trapManager.generateTrap(dungeonLevel);
            console.log('Generated trap:', trap);
            if (trap) {
                this.ui.log("You notice something suspicious ahead...");
                console.log('About to call showTrap with timeout...');
                setTimeout(() => {
                    console.log('Timeout executed, calling showTrap');
                    this.gameController.trapManager.showTrap(trap);
                }, 500);
                return;
            } else {
                console.log('No trap generated, falling back to combat');
            }
        } else {
            console.log('No trapManager available, falling back to combat');
        }
        // Fallback to combat if trap fails
        this.handleCombatEvent();
    }

    /**
     * Handle treasure encounter
     */
    handleTreasureEvent(dungeonLevel) {
        // Use encounter manager for treasure if available
        if (this.gameController.encounterManager) {
            this.gameController.encounterManager.createTreasureEncounter(dungeonLevel);
            return;
        }
        
        // Fallback treasure generation (20% more gold, 20% less XP)
        const baseGold = Math.floor((dungeonLevel * 10) + Math.random() * 50 + 25);
        const treasureAmount = Math.floor(baseGold * 1.2); // +20% gold
        const baseXP = Math.floor(dungeonLevel * 2 + Math.random() * 10);
        const xpGain = Math.floor(baseXP * 0.8); // -20% XP
        
        this.gameState.gold += treasureAmount;
        this.gameState.experience += xpGain;
        
        this.ui.log(`🎯 You discover a hidden treasure cache!`);
        this.ui.log(`💰 Found ${treasureAmount} gold and gained ${xpGain} XP!`);
        
        // Chance for special items at deeper levels
        if (dungeonLevel > 3 && Math.random() < 0.3) {
            this.grantSpecialTreasure(dungeonLevel);
        }
        
        this.ui.render();
    }

    /**
     * Handle combat encounter (normal enemy generation)
     */
    handleCombatEvent() {
        this.gameState.inCombat = true;
        this.gameController.generateEnemies();
        this.ui.log("Enemies block your path!");
        setTimeout(() => this.gameController.showCombatInterface(), 500);
    }

    /**
     * Grant special treasure items at deeper levels
     */
    grantSpecialTreasure(dungeonLevel) {
        const specialItems = [
            { name: "Health Potion", description: "Restores 50 HP", type: "consumable" },
            { name: "Mana Potion", description: "Restores 30 MP", type: "consumable" },
            { name: "Enchanted Gem", description: "Glows with magical energy", type: "valuable" },
            { name: "Ancient Scroll", description: "Contains forgotten knowledge", type: "valuable" }
        ];
        
        if (dungeonLevel > 7) {
            specialItems.push(
                { name: "Anti-Trap Tools", description: "Professional trap disarming kit (10 uses)", type: "tool" },
                { name: "Magic Key", description: "Opens mysterious locks", type: "key" }
            );
        }
        
        const randomItem = specialItems[Math.floor(Math.random() * specialItems.length)];
        
        // Add to inventory if inventory manager exists
        if (this.gameController.inventoryManager) {
            this.gameController.inventoryManager.addItem(randomItem, 1);
        }
        
        this.ui.log(`✨ You also found a ${randomItem.name}! ${randomItem.description}`);
    }
}
