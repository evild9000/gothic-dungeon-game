class EncounterManager {
    constructor(gameController) {
        this.gameController = gameController;
        this.gameState = gameController.gameState;
        this.ui = gameController.ui;
        
        console.log("EncounterManager initialized");
    }

    /**
     * Main encounter router - handles all dungeon entries
     */
    triggerEncounter(dungeonLevel, source = 'unknown') {
        console.log(`EncounterManager: Triggering encounter for level ${dungeonLevel} from ${source}`);
        
        // Close any existing modals
        this.closeAllModals();
        
        // Use event manager to determine encounter type
        if (this.gameController.eventManager) {
            const eventType = this.gameController.eventManager.determineRandomEvent(dungeonLevel);
            this.gameController.eventManager.handleRandomEvent(eventType, dungeonLevel);
        } else {
            // Fallback to combat
            this.startCombatEncounter(dungeonLevel);
        }
        
        // After any encounter (except combat), show continue options
        if (this.gameController.eventManager) {
            // Set a flag to show options after non-combat encounters
            this.gameState.showContinueOptions = true;
        }
    }

    /**
     * Start a combat encounter
     */
    startCombatEncounter(dungeonLevel) {
        this.gameState.inCombat = true;
        this.gameController.generateEnemies();
        this.ui.log("🗡️ New enemies block your path!");
        setTimeout(() => this.gameController.showCombatInterface(), 500);
    }

    /**
     * Handle treasure encounters with visual flair
     */
    createTreasureEncounter(dungeonLevel) {
        // Show animated treasure discovery
        this.showTreasureAnimation();
        
        // Generate treasure
        const treasureAmount = Math.floor(Math.random() * (dungeonLevel * 15)) + (dungeonLevel * 10);
        const xpGain = Math.floor(dungeonLevel * 8); // Reduced XP by 20%
        
        this.gameState.gold += Math.floor(treasureAmount * 1.2); // Increased gold by 20%
        this.gameState.experience += xpGain;
        
        setTimeout(() => {
            this.ui.log(`💰 You discovered a hidden treasure cache!`);
            this.ui.log(`📈 Gained ${Math.floor(treasureAmount * 1.2)} gold and ${xpGain} experience!`);
            
            // Show continue options after a delay
            setTimeout(() => this.showContinueOptions(), 1500);
        }, 2000);
    }

    /**
     * Show animated treasure discovery
     */
    showTreasureAnimation() {
        const treasureHTML = `
            <div class="treasure-animation" id="treasureAnimation">
                <div class="treasure-chest">
                    <div class="treasure-sparkles">✨💎✨</div>
                    <div class="treasure-emoji">🏛️💰🏛️</div>
                    <div class="treasure-text">Hidden Treasure Found!</div>
                </div>
            </div>
        `;
        
        // Add CSS for animation
        const style = document.createElement('style');
        style.textContent = `
            .treasure-animation {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10000;
                animation: treasureFadeIn 0.5s ease-out;
            }
            
            .treasure-chest {
                text-align: center;
                color: #ffd700;
                animation: treasureBounce 1s ease-out;
            }
            
            .treasure-sparkles {
                font-size: 24px;
                margin-bottom: 10px;
                animation: sparkle 1s infinite alternate;
            }
            
            .treasure-emoji {
                font-size: 48px;
                margin: 10px 0;
                animation: treasureGlow 2s infinite alternate;
            }
            
            .treasure-text {
                font-size: 20px;
                font-weight: bold;
                text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
                animation: textPulse 1s infinite alternate;
            }
            
            @keyframes treasureFadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            @keyframes treasureBounce {
                0% { transform: scale(0) rotate(0deg); }
                50% { transform: scale(1.2) rotate(5deg); }
                100% { transform: scale(1) rotate(0deg); }
            }
            
            @keyframes sparkle {
                0% { transform: scale(1) rotate(0deg); opacity: 0.7; }
                100% { transform: scale(1.3) rotate(180deg); opacity: 1; }
            }
            
            @keyframes treasureGlow {
                0% { text-shadow: 0 0 10px #ffd700, 0 0 20px #ffd700; }
                100% { text-shadow: 0 0 20px #ffd700, 0 0 30px #ffd700, 0 0 40px #ffd700; }
            }
            
            @keyframes textPulse {
                0% { transform: scale(1); }
                100% { transform: scale(1.1); }
            }
        `;
        document.head.appendChild(style);
        
        document.body.insertAdjacentHTML('beforeend', treasureHTML);
        
        // Remove animation after 2 seconds
        setTimeout(() => {
            const animation = document.getElementById('treasureAnimation');
            if (animation) {
                animation.remove();
            }
            document.head.removeChild(style);
        }, 2000);
    }

    /**
     * Show continue options after non-combat encounters
     */
    showContinueOptions() {
        const modalHTML = `
            <div class="modal-overlay" id="continueModal">
                <div class="modal-content">
                    <h2>🎯 What's Next?</h2>
                    <p>You've completed your encounter. Choose your next action:</p>
                    
                    <div class="action-buttons">
                        <button class="action-button primary-btn" onclick="encounterManager.exploreCurrentLevel()">
                            🔍 Explore This Level
                        </button>
                        
                        <button class="action-button secondary-btn" onclick="encounterManager.goDeeperInDungeon()">
                            ⬇️ Go Deeper
                        </button>
                        
                        <button class="action-button danger-btn" onclick="encounterManager.exitDungeon()">
                            🚪 Exit Dungeon
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    /**
     * Continue exploring current level
     */
    exploreCurrentLevel() {
        this.closeAllModals();
        this.ui.log(`🔍 Continuing to explore dungeon level ${this.gameState.dungeonLevel}...`);
        this.triggerEncounter(this.gameState.dungeonLevel, 'explore_current');
    }

    /**
     * Go deeper into dungeon
     */
    goDeeperInDungeon() {
        this.closeAllModals();
        this.gameState.dungeonLevel++;
        this.ui.log(`Descending to dungeon level ${this.gameState.dungeonLevel}...`);
        
        // Change to different dungeon background
        this.ui.setBackground('dungeon');
        
        this.triggerEncounter(this.gameState.dungeonLevel, 'go_deeper');
    }

    /**
     * Exit dungeon
     */
    exitDungeon() {
        this.closeAllModals();
        this.gameController.exitDungeon();
    }

    /**
     * Close all open modals
     */
    closeAllModals() {
        const modals = document.querySelectorAll('.modal-overlay');
        modals.forEach(modal => modal.remove());
    }

    /**
     * Handle post-combat scenarios
     */
    onCombatComplete() {
        // After combat, always show continue options
        setTimeout(() => this.showContinueOptions(), 1000);
    }

    /**
     * Handle post-trap scenarios  
     */
    onTrapComplete() {
        // After trap, show continue options
        setTimeout(() => this.showContinueOptions(), 500);
    }

    /**
     * Handle post-puzzle scenarios
     */
    onPuzzleComplete() {
        // After puzzle, show continue options
        setTimeout(() => this.showContinueOptions(), 500);
    }
}

// Export for use in main game
window.EncounterManager = EncounterManager;
