// Game Controller - Handles all game logic and state management
class GameController {
    constructor() {
        this.gameState = {
            hero: {
                name: "Hero",
                level: 1,
                fame: 0,
                gold: 100,
                health: 100,
                maxHealth: 100,
                mana: 100,
                maxMana: 100,
                leadership: 1,
                equipment: [],
                skills: [],
                underlings: [],
            },
            dungeonLevel: 1,
            chatLog: [],
            currentEnemies: null,
            inDungeon: false,
            currentScreen: 'main'
        };
        
        this.ui = null; // Will be set when UI is initialized
    }

    setUI(uiManager) {
        this.ui = uiManager;
    }

    newGame() {
        console.log('Starting new game...');
        
        // Close any open UI elements first
        this.closeDockedCombatPanel();
        
        // Close any open modals
        const modals = document.querySelectorAll('.modal-overlay');
        modals.forEach(modal => modal.remove());
        
        // Reset game state completely
        this.gameState = {
            hero: {
                name: "Hero",
                level: 1,
                fame: 0,
                gold: 100,
                health: 100,
                maxHealth: 100,
                mana: 100,
                maxMana: 100,
                leadership: 1,
                equipment: [],
                skills: [],
                underlings: [],
            },
            dungeonLevel: 1,
            chatLog: [],
            currentEnemies: null,
            inDungeon: false,
            inCombat: false,
            currentScreen: 'village',
            defendingThisTurn: false
        };
        
        // Reset combat-related state
        this.currentSelectedItemIndex = null;
        this.currentCombatItems = null;
        this.currentCombatTargets = null;
        
        // Reset UI state completely
        if (this.ui) {
            this.ui.currentBackground = 'village';
            this.ui.setBackground('village');
            this.ui.clearChatLog();
            this.ui.log("Started a new game!");
            this.ui.render();
            this.ui.showNotification("New game started!", "success");
        }
        
        // Clear the old save to ensure fresh start
        try {
            localStorage.removeItem('dungeonGameSave');
            console.log('Cleared previous save file');
        } catch (error) {
            console.log('Could not clear save file:', error);
        }
    }

    saveGame() {
        try {
            // Create a clean copy of game state for saving
            const saveData = {
                ...this.gameState,
                // Ensure we don't save temporary combat state
                currentEnemies: null,
                inCombat: false,
                defendingThisTurn: false,
                timestamp: new Date().toISOString()
            };
            
            localStorage.setItem('dungeonGameSave', JSON.stringify(saveData));
            this.ui.log(`Game saved successfully! (${saveData.timestamp})`);
            this.ui.showNotification("Game saved!", "success");
            
            // Debug: Show what was saved
            console.log('Game saved with data:', {
                heroLevel: saveData.hero.level,
                heroGold: saveData.hero.gold,
                heroHealth: saveData.hero.health,
                underlings: saveData.hero.underlings.length,
                dungeonLevel: saveData.dungeonLevel
            });
            
        } catch (error) {
            this.ui.log("Failed to save game: " + error.message);
            this.ui.showNotification("Save failed!", "error");
            console.error('Save error:', error);
        }
    }

    loadGame() {
        try {
            const data = localStorage.getItem('dungeonGameSave');
            if (data) {
                // Close any open UI elements first
                this.closeDockedCombatPanel();
                
                // Close any open modals
                const modals = document.querySelectorAll('.modal-overlay');
                modals.forEach(modal => modal.remove());
                
                const loadedState = JSON.parse(data);
                this.gameState = loadedState;
                
                // Ensure backward compatibility - fix hero without mana
                if (!this.gameState.hero.mana) {
                    this.gameState.hero.mana = this.gameState.hero.maxMana || 100;
                }
                if (!this.gameState.hero.maxMana) {
                    this.gameState.hero.maxMana = 100;
                }
                
                // Ensure backward compatibility - fix underlings without new properties
                if (this.gameState.hero.underlings) {
                    this.gameState.hero.underlings.forEach(underling => {
                        if (!underling.maxHealth) {
                            underling.maxHealth = underling.health;
                        }
                        if (underling.isAlive === undefined) {
                            underling.isAlive = true;
                        }
                        if (!underling.equipment) {
                            underling.equipment = [];
                        }
                        if (!underling.mana) {
                            underling.mana = underling.maxMana || 50;
                        }
                        if (!underling.maxMana) {
                            underling.maxMana = 50;
                        }
                    });
                }
                
                // Reset combat state (should not be saved anyway)
                this.gameState.inCombat = false;
                this.gameState.currentEnemies = null;
                this.gameState.defendingThisTurn = false;
                
                // Reset combat-related variables
                this.currentSelectedItemIndex = null;
                this.currentCombatItems = null;
                this.currentCombatTargets = null;
                
                // Update UI to match loaded state
                const currentScreen = this.gameState.currentScreen || 'village';
                if (currentScreen === 'village' || currentScreen === 'main') {
                    this.ui.setBackground('village');
                } else {
                    this.ui.setBackground(currentScreen);
                }
                
                // Debug: Show what was loaded
                console.log('Game loaded with data:', {
                    heroLevel: this.gameState.hero.level,
                    heroGold: this.gameState.hero.gold,
                    heroHealth: this.gameState.hero.health,
                    underlings: this.gameState.hero.underlings.length,
                    dungeonLevel: this.gameState.dungeonLevel,
                    timestamp: loadedState.timestamp
                });
                
                this.ui.log(`Game loaded successfully! ${loadedState.timestamp ? `(Saved: ${new Date(loadedState.timestamp).toLocaleString()})` : ''}`);
                this.ui.render();
                this.ui.showNotification("Game loaded!", "success");
            } else {
                this.ui.log("No save file found.");
                this.ui.showNotification("No save file found!", "error");
            }
        } catch (error) {
            this.ui.log("Failed to load game: " + error.message);
            this.ui.showNotification("Load failed!", "error");
            console.error('Load error:', error);
        }
    }

    enterDungeon() {
        if (this.gameState.inDungeon) {
            this.ui.log("You are already in a dungeon!");
            return;
        }

        this.gameState.inDungeon = true;
        this.gameState.inCombat = true;
        this.gameState.currentScreen = 'dungeon';
        this.generateEnemies();
        
        // Change to random dungeon background
        this.ui.setBackground('dungeon');
        
        this.ui.log(`Entering dungeon level ${this.gameState.dungeonLevel}...`);
        this.ui.log("Enemies appear before you!");
        this.ui.render();
        this.ui.animateSprite('.hero-sprite', 'shake');
        
        // Show combat interface
        this.showCombatInterface();
    }

    generateEnemies() {
        const enemyCount = Math.floor(Math.random() * 3) + 1;
        this.gameState.currentEnemies = [];
        
        const enemyTypes = ['Goblin', 'Orc', 'Skeleton', 'Wolf', 'Spider'];
        
        for (let i = 0; i < enemyCount; i++) {
            const enemyType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
            const enemy = {
                name: enemyType,
                level: this.gameState.dungeonLevel + Math.floor(Math.random() * 2),
                health: 50 + (this.gameState.dungeonLevel * 10),
                maxHealth: 50 + (this.gameState.dungeonLevel * 10),
                attack: 10 + (this.gameState.dungeonLevel * 2)
            };
            this.gameState.currentEnemies.push(enemy);
        }
    }

    showCombatInterface() {
        const enemies = this.gameState.currentEnemies;
        let enemyList = enemies.map((enemy, index) => 
            `<li>${enemy.name} (Level ${enemy.level}) - HP: <span style="color: ${enemy.health <= enemy.maxHealth * 0.3 ? '#ff6b6b' : enemy.health <= enemy.maxHealth * 0.6 ? '#ffd93d' : '#51cf66'}">${enemy.health}</span>/${enemy.maxHealth}</li>`
        ).join('');
        
        // Show underling info if any with health status
        let underlingInfo = '';
        if (this.gameState.hero.underlings.length > 0) {
            const underlingList = this.gameState.hero.underlings.map(underling => 
                `<li>${underling.name} (Level ${underling.level}) - ${underling.isAlive ? 
                    `HP: <span style="color: ${underling.health <= underling.maxHealth * 0.3 ? '#ff6b6b' : underling.health <= underling.maxHealth * 0.6 ? '#ffd93d' : '#51cf66'}">${underling.health}</span>/${underling.maxHealth}` : 
                    '<span style="color: #ff6b6b;">💀 Fallen</span>'
                }</li>`
            ).join('');
            underlingInfo = `
                <p><strong>Your Underlings:</strong></p>
                <ul class="underling-list">${underlingList}</ul>
            `;
        }
        
        const combatContent = `
            <div class="combat-interface">
                <h4>⚔️ Combat Encounter!</h4>
                <p><strong>Enemies:</strong></p>
                <ul class="enemy-list">${enemyList}</ul>
                <p><strong>Your Health:</strong> <span style="color: ${this.gameState.hero.health <= this.gameState.hero.maxHealth * 0.3 ? '#ff6b6b' : this.gameState.hero.health <= this.gameState.hero.maxHealth * 0.6 ? '#ffd93d' : '#51cf66'}">${this.gameState.hero.health || 100}</span>/${this.gameState.hero.maxHealth || 100}</p>
                ${underlingInfo}
                <p>Choose your action:</p>
                <p style="font-size: 12px; color: #888; font-style: italic;">💡 Tip: Press 'U' to quickly access items, or use the Use Item button</p>
            </div>
        `;

        // Show combat as docked panel instead of modal
        this.showDockedCombatPanel([combatContent], 'combat');
    }

    playerAttack() {
        if (!this.gameState.currentEnemies || this.gameState.currentEnemies.length === 0) {
            this.ui.log("No enemies to attack!");
            return;
        }

        // Initialize hero health if not set
        if (!this.gameState.hero.health) {
            this.gameState.hero.health = 100;
            this.gameState.hero.maxHealth = 100;
        }

        // Player attacks first enemy
        const target = this.gameState.currentEnemies[0];
        const heroAttack = 15 + (this.gameState.hero.level * 3);
        // More consistent damage: 70-100% of attack value
        const damage = Math.floor(heroAttack * (0.7 + Math.random() * 0.3));
        
        target.health -= damage;
        this.ui.log(`You attack ${target.name} for ${damage} damage! (${target.name}: ${Math.max(0, target.health)}/${target.maxHealth} HP)`);
        this.ui.animateSprite('.enemy-sprite', 'shake');

        // Living underlings also attack!
        const aliveUnderlings = this.gameState.hero.underlings.filter(u => u.isAlive);
        aliveUnderlings.forEach((underling, index) => {
            if (this.gameState.currentEnemies.length > 0) {
                const underlingTarget = this.gameState.currentEnemies[0]; // Attack same target as hero
                
                // Calculate attack with equipment bonuses
                let baseAttack = 8 + (underling.level * 2);
                const equippedWeapons = underling.equipment ? underling.equipment.filter(item => item.equipped && item.stats && item.stats.attack) : [];
                const attackBonus = equippedWeapons.reduce((total, weapon) => total + weapon.stats.attack, 0);
                const underlingAttack = baseAttack + attackBonus;
                
                // More consistent damage: 70-100% of attack value
                const underlingDamage = Math.floor(underlingAttack * (0.7 + Math.random() * 0.3));
                
                underlingTarget.health -= underlingDamage;
                this.ui.log(`${underling.name} attacks ${underlingTarget.name} for ${underlingDamage} damage!${attackBonus > 0 ? ` (+${attackBonus} equipment bonus)` : ''} (${underlingTarget.name}: ${Math.max(0, underlingTarget.health)}/${underlingTarget.maxHealth} HP)`);
                
                // Find the actual index in the full underlings array for animation
                const actualIndex = this.gameState.hero.underlings.findIndex(u => u === underling);
                
                // Animate the specific underling sprite
                setTimeout(() => {
                    const underlingSprites = document.querySelectorAll('.underling-sprite');
                    if (underlingSprites[actualIndex]) {
                        underlingSprites[actualIndex].classList.add('shake');
                        setTimeout(() => underlingSprites[actualIndex].classList.remove('shake'), 500);
                    }
                }, index * 200); // Stagger the animations
                
                // Check if enemy is defeated by underling
                if (underlingTarget.health <= 0 && this.gameState.currentEnemies.length > 0) {
                    this.ui.log(`${underlingTarget.name} is defeated by ${underling.name}!`);
                    const goldReward = Math.floor(Math.random() * 15) + 5;
                    const xpReward = Math.floor(Math.random() * 20) + 10;
                    
                    this.gameState.hero.gold += goldReward;
                    this.gameState.hero.fame += xpReward;
                    
                    this.ui.log(`You gained ${goldReward} gold and ${xpReward} experience!`);
                    this.ui.showNotification(`${underling.name} defeated ${underlingTarget.name}! +${goldReward} gold, +${xpReward} XP`, "success");
                    
                    // Remove defeated enemy
                    this.gameState.currentEnemies.shift();
                }
            }
        });

        // Check if all enemies defeated after underling attacks
        if (this.gameState.currentEnemies.length === 0) {
            this.ui.log("All enemies defeated! You can continue deeper or exit the dungeon.");
            this.checkLevelUp();
            this.ui.render();
            this.showVictoryOptions();
            return;
        }

        // Check if main target is defeated (by hero)
        if (target.health <= 0) {
            this.ui.log(`${target.name} is defeated!`);
            const goldReward = Math.floor(Math.random() * 20) + 10;
            const xpReward = Math.floor(Math.random() * 30) + 15;
            
            this.gameState.hero.gold += goldReward;
            this.gameState.hero.fame += xpReward;
            
            this.ui.log(`You gained ${goldReward} gold and ${xpReward} experience!`);
            this.ui.showNotification(`Defeated ${target.name}! +${goldReward} gold, +${xpReward} XP`, "success");
            
            // Remove defeated enemy
            this.gameState.currentEnemies.shift();
            
            // Check if all enemies defeated
            if (this.gameState.currentEnemies.length === 0) {
                this.ui.log("All enemies defeated! You can continue deeper or exit the dungeon.");
                this.checkLevelUp();
                this.ui.render();
                this.showVictoryOptions();
                return;
            }
        }

        // Enemies counterattack
        this.enemiesAttack();
        
        // Update combat interface
        setTimeout(() => this.showCombatInterface(), 1000);
    }

    playerDefend() {
        this.ui.log("You raise your guard and defend!");
        
        // Reduce incoming damage by 50%
        this.gameState.defendingThisTurn = true;
        
        // Enemies attack
        this.enemiesAttack();
        
        // Remove defending status
        this.gameState.defendingThisTurn = false;
        
        // Update combat interface
        setTimeout(() => this.showCombatInterface(), 1000);
    }

    playerFlee() {
        const fleeChance = Math.random();
        if (fleeChance > 0.3) { // 70% chance to flee successfully
            this.ui.log("You successfully fled from combat!");
            this.ui.showNotification("Fled from combat!", "info");
            this.exitDungeon();
        } else {
            this.ui.log("You failed to flee! The enemies attack!");
            this.enemiesAttack();
            setTimeout(() => this.showCombatInterface(), 1000);
        }
    }

    showCombatItemSelection() {
        // Get all consumable items from hero's inventory
        const heroConsumables = this.gameState.hero.equipment.filter(item => 
            item.type === 'consumable'
        );

        // Get all consumable items from underlings' inventories
        let underlingConsumables = [];
        this.gameState.hero.underlings.forEach((underling, underlingIndex) => {
            if (underling.isAlive && underling.equipment) {
                underling.equipment.filter(item => item.type === 'consumable').forEach(item => {
                    underlingConsumables.push({
                        ...item,
                        owner: underling.name,
                        ownerIndex: underlingIndex,
                        isUnderling: true
                    });
                });
            }
        });

        const allConsumables = [...heroConsumables, ...underlingConsumables];

        if (allConsumables.length === 0) {
            this.ui.log("No consumable items available!");
            this.ui.showNotification("No consumable items!", "error");
            return;
        }

        // Store items for selection
        this.currentCombatItems = allConsumables;

        // Create docked panel
        this.showDockedCombatPanel(allConsumables, 'items');
    }

    showDockedCombatPanel(items, panelType) {
        // Remove any existing panel immediately if we're reopening
        const existingPanel = document.getElementById('combat-docked-panel');
        if (existingPanel) {
            existingPanel.remove();
            document.body.classList.remove('combat-panel-active');
        }

        // Add body class to shrink game area
        document.body.classList.add('combat-panel-active');

        let panelContent = '';
        let headerText = '';

        if (panelType === 'items') {
            headerText = '🧪 Use Item';
            panelContent = `
                <div class="docked-item-list">
                    ${items.map((item, index) => `
                        <div class="docked-item-option" onclick="window.game.controller.selectCombatItem(${index})">
                            <div class="docked-item-info">
                                <h4>${item.name}</h4>
                                <div class="docked-item-owner">${item.owner ? `${item.owner}'s` : 'Hero\'s'}</div>
                                <div class="docked-item-effect">${item.effect} ${item.value || ''}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        } else if (panelType === 'targets') {
            headerText = '🎯 Select Target';
            panelContent = `
                <div class="docked-target-list">
                    ${items.map((target, index) => `
                        <div class="docked-target-option" onclick="window.game.controller.useCombatItemOnTarget(${this.currentSelectedItemIndex}, ${index})">
                            <div class="docked-target-info">
                                <div>
                                    <h4>${target.name}</h4>
                                    <div class="docked-target-health">Health: ${target.health}/${target.maxHealth}</div>
                                </div>
                                <div class="docked-target-icon">${target.isHero ? '👑' : '🛡️'}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        } else if (panelType === 'combat') {
            headerText = '⚔️ Combat';
            panelContent = `
                <div class="docked-combat-interface">
                    ${items[0]}
                    <div class="docked-combat-actions">
                        <button class="docked-combat-btn attack-btn" onclick="window.game.controller.playerAttack()">⚔️ Attack</button>
                        <button class="docked-combat-btn defend-btn" onclick="window.game.controller.playerDefend()">🛡️ Defend</button>
                        <button class="docked-combat-btn item-btn" onclick="window.game.controller.showCombatItemSelection()">🧪 Use Item</button>
                        <button class="docked-combat-btn flee-btn" onclick="window.game.controller.playerFlee()">💨 Flee</button>
                    </div>
                </div>
            `;
        }

        const panelHtml = `
            <div id="combat-docked-panel" class="combat-docked-panel">
                <div class="docked-panel-header">
                    <h3>${headerText}</h3>
                    ${panelType !== 'combat' ? '<button class="docked-panel-close" onclick="window.game.controller.closeDockedCombatPanel()">&times;</button>' : ''}
                </div>
                <div class="docked-panel-content">
                    ${panelContent}
                </div>
                ${panelType !== 'combat' ? '<div class="docked-panel-footer"><button onclick="window.game.controller.closeDockedCombatPanel()">Cancel</button></div>' : ''}
            </div>
        `;

        // Add panel to page
        document.body.insertAdjacentHTML('beforeend', panelHtml);
        
        // Trigger animation
        setTimeout(() => {
            const panel = document.getElementById('combat-docked-panel');
            if (panel) {
                panel.classList.add('active');
            }
        }, 10);
    }

    closeDockedCombatPanel() {
        const panel = document.getElementById('combat-docked-panel');
        if (panel) {
            // If panel is already animating out, just remove it immediately
            if (panel.classList.contains('closing')) {
                panel.remove();
                document.body.classList.remove('combat-panel-active');
                return;
            }
            
            // Mark as closing to prevent duplicate animations
            panel.classList.add('closing');
            panel.classList.remove('active');
            
            setTimeout(() => {
                // Double-check the panel still exists before removing
                if (panel && panel.parentNode) {
                    panel.remove();
                }
                document.body.classList.remove('combat-panel-active');
            }, 300);
        } else {
            document.body.classList.remove('combat-panel-active');
        }
    }

    selectCombatItem(itemIndex) {
        const selectedItem = this.currentCombatItems[itemIndex];
        if (!selectedItem) {
            this.ui.log("Item not found!");
            return;
        }

        // Store the selected item index for target selection
        this.currentSelectedItemIndex = itemIndex;

        // Show target selection
        this.showCombatTargetSelection(selectedItem, itemIndex);
    }

    showCombatTargetSelection(item, itemIndex) {
        // Get all possible targets (hero + living underlings)
        const aliveUnderlings = this.gameState.hero.underlings.filter(u => u.isAlive);
        const allTargets = [{
            name: this.gameState.hero.name || "Hero",
            health: this.gameState.hero.health,
            maxHealth: this.gameState.hero.maxHealth,
            isHero: true
        }, ...aliveUnderlings.map(u => ({
            name: u.name,
            health: u.health,
            maxHealth: u.maxHealth,
            isUnderling: true,
            underlingRef: u
        }))];

        this.currentCombatTargets = allTargets; // Store for later reference

        // Show target selection in docked panel
        this.showDockedCombatPanel(allTargets, 'targets');
    }

    useCombatItemOnTarget(itemIndex, targetIndex) {
        const item = this.currentCombatItems[itemIndex];
        const target = this.currentCombatTargets[targetIndex];
        
        if (!item || !target) {
            this.ui.log("Invalid item or target selection!");
            return;
        }

        // Close the docked panel
        this.closeDockedCombatPanel();

        // Apply item effect
        this.applyCombatItemEffect(item, target);

        // Remove item from inventory
        this.removeCombatItem(item);

        // Log the action
        this.ui.log(`${item.owner || 'Hero'}'s ${item.name} used on ${target.name}!`);
        this.ui.showNotification(`${item.name} used on ${target.name}!`, "success");

        // Enemies attack after item use
        this.enemiesAttack();
        
        // Return to combat interface
        setTimeout(() => this.showCombatInterface(), 1500);
    }

    applyCombatItemEffect(item, target) {
        switch(item.effect) {
            case 'heal':
                const healAmount = Math.min(item.value, target.maxHealth - target.health);
                if (target.isHero) {
                    this.gameState.hero.health += healAmount;
                    this.gameState.hero.health = Math.min(this.gameState.hero.health, this.gameState.hero.maxHealth);
                } else if (target.underlingRef) {
                    target.underlingRef.health += healAmount;
                    target.underlingRef.health = Math.min(target.underlingRef.health, target.underlingRef.maxHealth);
                }
                this.ui.log(`${target.name} healed for ${healAmount} HP!`);
                break;
            case 'mana':
                // For future mana system
                this.ui.log(`${target.name} gained ${item.value || 0} MP!`);
                break;
            case 'buff':
                // For future buff system
                this.ui.log(`${target.name} received a magical enhancement!`);
                break;
            default:
                this.ui.log(`${item.name} used on ${target.name}!`);
        }
    }

    removeCombatItem(item) {
        if (item.isUnderling) {
            // Remove from underling's inventory
            const underling = this.gameState.hero.underlings[item.ownerIndex];
            if (underling && underling.equipment) {
                const itemIndex = underling.equipment.findIndex(invItem => 
                    invItem.name === item.name && invItem.type === 'consumable'
                );
                if (itemIndex > -1) {
                    underling.equipment.splice(itemIndex, 1);
                }
            }
        } else {
            // Remove from hero's inventory
            const itemIndex = this.gameState.hero.equipment.findIndex(invItem => 
                invItem.name === item.name && invItem.type === 'consumable'
            );
            if (itemIndex > -1) {
                this.gameState.hero.equipment.splice(itemIndex, 1);
            }
        }
    }

    enemiesAttack() {
        // Ensure all underlings have maxHealth (for backward compatibility)
        this.gameState.hero.underlings.forEach(underling => {
            if (!underling.maxHealth) {
                underling.maxHealth = underling.health;
            }
            if (underling.isAlive === undefined) {
                underling.isAlive = true;
            }
            if (!underling.equipment) {
                underling.equipment = [];
            }
        });

        // Get all alive party members (hero + living underlings)
        const aliveUnderlings = this.gameState.hero.underlings.filter(u => u.isAlive);
        const allTargets = [this.gameState.hero, ...aliveUnderlings];
        
        this.gameState.currentEnemies.forEach(enemy => {
            // Each enemy picks a random target from alive party members
            const target = allTargets[Math.floor(Math.random() * allTargets.length)];
            
            // More consistent enemy damage: 60-100% of attack value
            const damage = Math.floor(enemy.attack * (0.6 + Math.random() * 0.4));
            const actualDamage = this.gameState.defendingThisTurn ? Math.floor(damage / 2) : damage;
            
            target.health -= actualDamage;
            
            if (target === this.gameState.hero) {
                this.ui.log(`${enemy.name} attacks you for ${actualDamage} damage!${this.gameState.defendingThisTurn ? ' (Reduced by defending)' : ''} (Hero: ${Math.max(0, this.gameState.hero.health)}/${this.gameState.hero.maxHealth} HP)`);
                this.ui.animateSprite('.hero-sprite', 'shake');
                
                // Check if player is defeated
                if (this.gameState.hero.health <= 0) {
                    this.playerDefeated();
                    return;
                }
            } else {
                // Underling was attacked
                const underlingIndex = this.gameState.hero.underlings.findIndex(u => u === target);
                this.ui.log(`${enemy.name} attacks ${target.name} for ${actualDamage} damage!${this.gameState.defendingThisTurn ? ' (Reduced by defending)' : ''} (${target.name}: ${Math.max(0, target.health)}/${target.maxHealth} HP)`);
                
                // Animate the specific underling if it exists
                const underlingSprites = document.querySelectorAll('.underling-sprite');
                if (underlingSprites[underlingIndex]) {
                    this.ui.animateSprite(underlingSprites[underlingIndex], 'shake');
                }
                
                // Check if underling is defeated
                if (target.health <= 0) {
                    target.health = 0;
                    target.isAlive = false;
                    this.ui.log(`${target.name} has fallen in battle!`);
                    this.ui.showNotification(`${target.name} defeated!`, "error");
                    
                    // Remove from current targets list
                    const targetIndex = allTargets.indexOf(target);
                    if (targetIndex > -1) {
                        allTargets.splice(targetIndex, 1);
                    }
                    
                    // Check if all party members are defeated
                    if (allTargets.length === 0 || (allTargets.length === 1 && allTargets[0] === this.gameState.hero && this.gameState.hero.health <= 0)) {
                        this.playerDefeated();
                        return;
                    }
                }
            }
        });
        
        // Update UI to reflect health changes and fallen underlings
        this.ui.render();
    }

    playerDefeated() {
        this.ui.log("Your party has been defeated!");
        this.ui.showNotification("Party defeated! Awakening in the temple...", "error");
        
        // Close the docked combat panel since combat is over
        this.closeDockedCombatPanel();
        
        // Close any open modals
        const existingModals = document.querySelectorAll('.modal-overlay');
        existingModals.forEach(modal => modal.remove());
        
        // Calculate penalties
        const goldLoss = Math.floor(this.gameState.hero.gold * 0.2); // 20% gold loss
        const newGold = this.gameState.hero.gold - goldLoss;
        
        // Apply defeat penalties - awaken in temple at 20% health
        this.gameState.hero.health = Math.floor(this.gameState.hero.maxHealth * 0.2); // Start with 20% health
        this.gameState.hero.gold = newGold;
        
        // All underlings also recover to 20% health (none die permanently from party defeat)
        this.gameState.hero.underlings.forEach(underling => {
            if (!underling.maxHealth) {
                underling.maxHealth = underling.health; // Fix old underlings without maxHealth
            }
            underling.health = Math.floor(underling.maxHealth * 0.2);
            underling.isAlive = true; // Ensure they're alive
        });
        
        this.ui.log(`The temple priests found your party and brought you to safety. Lost ${goldLoss} gold.`);
        this.ui.log(`Hero health: ${this.gameState.hero.health}/${this.gameState.hero.maxHealth} | Gold remaining: ${this.gameState.hero.gold}`);
        this.ui.log(`All party members have been stabilized at 20% health. Visit the temple for healing.`);
        
        // Exit dungeon and return to village, but mention temple
        this.exitDungeon();
        
        // Auto-open temple after a short delay to show the player they're there
        setTimeout(() => {
            this.openTemple();
        }, 1000);
        
        // Add a small delay then re-render to ensure button states are updated
        setTimeout(() => {
            this.ui.render();
        }, 100);
    }

    showVictoryOptions() {
        // Close the docked combat panel since combat is over
        this.closeDockedCombatPanel();
        
        // Set combat state to false
        this.gameState.inCombat = false;
        
        const victoryContent = `
            <div class="victory-interface">
                <h4>🎉 Victory!</h4>
                <p>All enemies in this area have been defeated!</p>
                <p>What would you like to do next?</p>
            </div>
        `;

        const victoryButtons = [
            {
                text: "🏰 Exit Dungeon",
                onClick: () => this.exitDungeon()
            },
            {
                text: "⬇️ Go Deeper",
                onClick: () => this.goDeeperInDungeon()
            }
        ];

        this.ui.createModal("Victory!", victoryContent, victoryButtons);
    }

    goDeeperInDungeon() {
        this.gameState.dungeonLevel++;
        this.gameState.inCombat = true;
        this.ui.log(`Descending to dungeon level ${this.gameState.dungeonLevel}...`);
        this.generateEnemies();
        
        // Change to a different random dungeon background
        this.ui.setBackground('dungeon');
        
        this.ui.log("New enemies block your path!");
        this.ui.render();
        
        setTimeout(() => this.showCombatInterface(), 500);
    }

    exitDungeon() {
        this.gameState.inDungeon = false;
        this.gameState.inCombat = false;
        this.gameState.currentEnemies = null;
        this.gameState.currentScreen = 'village';
        
        // Return to village background
        this.ui.setBackground('village');
        
        // Restore 25% HP and mana for hero and underlings
        this.restorePartyAfterDungeon();
        
        this.ui.log("You exit the dungeon.");
        this.ui.render();
    }

    restorePartyAfterDungeon() {
        let restoredMembers = [];
        
        // Restore hero's HP and mana
        const heroHpBefore = this.gameState.hero.health;
        const heroManaBefore = this.gameState.hero.mana || 0;
        
        const heroHpRestore = Math.floor(this.gameState.hero.maxHealth * 0.25);
        const heroManaRestore = Math.floor((this.gameState.hero.maxMana || 100) * 0.25);
        
        this.gameState.hero.health = Math.min(
            this.gameState.hero.health + heroHpRestore, 
            this.gameState.hero.maxHealth
        );
        
        if (this.gameState.hero.maxMana) {
            this.gameState.hero.mana = Math.min(
                (this.gameState.hero.mana || 0) + heroManaRestore, 
                this.gameState.hero.maxMana
            );
        }
        
        // Track if hero was actually healed
        if (heroHpBefore < this.gameState.hero.maxHealth || (this.gameState.hero.maxMana && heroManaBefore < this.gameState.hero.maxMana)) {
            const heroHpGained = this.gameState.hero.health - heroHpBefore;
            const heroManaGained = (this.gameState.hero.mana || 0) - heroManaBefore;
            
            let restoreText = `${this.gameState.hero.name || 'Hero'}`;
            if (heroHpGained > 0) restoreText += ` +${heroHpGained} HP`;
            if (heroManaGained > 0) restoreText += ` +${heroManaGained} MP`;
            
            restoredMembers.push(restoreText);
        }
        
        // Restore underlings' HP and mana
        this.gameState.hero.underlings.forEach(underling => {
            if (underling.isAlive) {
                const underlingHpBefore = underling.health;
                const underlingManaBefore = underling.mana || 0;
                
                const underlingHpRestore = Math.floor(underling.maxHealth * 0.25);
                const underlingManaRestore = Math.floor((underling.maxMana || 50) * 0.25);
                
                underling.health = Math.min(
                    underling.health + underlingHpRestore, 
                    underling.maxHealth
                );
                
                if (underling.maxMana) {
                    underling.mana = Math.min(
                        (underling.mana || 0) + underlingManaRestore, 
                        underling.maxMana
                    );
                }
                
                // Track if underling was actually healed
                if (underlingHpBefore < underling.maxHealth || (underling.maxMana && underlingManaBefore < underling.maxMana)) {
                    const underlingHpGained = underling.health - underlingHpBefore;
                    const underlingManaGained = (underling.mana || 0) - underlingManaBefore;
                    
                    let restoreText = `${underling.name}`;
                    if (underlingHpGained > 0) restoreText += ` +${underlingHpGained} HP`;
                    if (underlingManaGained > 0) restoreText += ` +${underlingManaGained} MP`;
                    
                    restoredMembers.push(restoreText);
                }
            }
        });
        
        // Log the restoration if anyone was healed
        if (restoredMembers.length > 0) {
            this.ui.log("🌿 Leaving the dungeon, your party recovers from their trials...");
            this.ui.log(`✨ Restored: ${restoredMembers.join(', ')}`);
            this.ui.showNotification("Party recovered 25% HP/MP!", "success");
        }
    }

    openCrafting() {
        if (this.gameState.inDungeon) {
            this.ui.log("You cannot access crafting while in a dungeon!");
            this.ui.showNotification("Cannot craft in dungeon!", "error");
            return;
        }
        
        if (this.gameState.hero.level < 1) {
            this.ui.log("You need to reach level 1 to craft items!");
            this.ui.showNotification("Level 1 required for crafting!", "error");
            return;
        }

        // Change to crafting background
        this.ui.setBackground('crafting');
        this.gameState.currentScreen = 'crafting';

        this.ui.log("Opening crafting interface...");
        
        const craftingContent = `
            <p>Available crafting recipes:</p>
            <ul>
                <li>Iron Sword (Cost: 50 gold) - +5 Attack</li>
                <li>Leather Armor (Cost: 75 gold) - +3 Defense</li>
                <li>Health Potion (Cost: 25 gold) - Restores 50 HP</li>
            </ul>
            <p>Your gold: ${this.gameState.hero.gold}</p>
        `;

        this.ui.createModal("Crafting", craftingContent, [
            {
                text: "Craft Iron Sword",
                onClick: () => this.craftItem('iron_sword', 50)
            },
            {
                text: "Craft Leather Armor",
                onClick: () => this.craftItem('leather_armor', 75)
            },
            {
                text: "Craft Health Potion",
                onClick: () => this.craftItem('health_potion', 25)
            },
            {
                text: "Close",
                onClick: () => this.returnToVillage()
            }
        ]);
    }

    craftItem(itemType, cost) {
        if (this.gameState.hero.gold < cost) {
            this.ui.log("Not enough gold to craft this item!");
            this.ui.showNotification("Insufficient gold!", "error");
            return;
        }

        this.gameState.hero.gold -= cost;
        
        const items = {
            iron_sword: { name: "Iron Sword", type: "weapon", stats: { attack: 5 }, equipped: false },
            leather_armor: { name: "Leather Armor", type: "armor", stats: { defense: 3 }, equipped: false },
            health_potion: { name: "Health Potion", type: "consumable", effect: "heal", value: 50 }
        };

        const item = items[itemType];
        this.gameState.hero.equipment.push(item);
        
        this.ui.log(`Crafted ${item.name}!`);
        this.ui.showNotification(`Crafted ${item.name}!`, "success");
        this.ui.render();
    }

    openRecruitment() {
        if (this.gameState.inDungeon) {
            this.ui.log("You cannot recruit underlings while in a dungeon!");
            this.ui.showNotification("Cannot recruit in dungeon!", "error");
            return;
        }
        
        if (this.gameState.hero.level < 1) {
            this.ui.log("You need to reach level 1 to recruit underlings!");
            this.ui.showNotification("Level 1 required for recruitment!", "error");
            return;
        }

        // Change to recruitment background
        this.ui.setBackground('recruitment');
        this.gameState.currentScreen = 'recruitment';

        this.ui.log("Opening recruitment center...");
        
        const recruitmentContent = `
            <p>Available underlings for recruitment:</p>
            <ul>
                <li>Archer (Cost: 100 gold) - Ranged damage dealer</li>
                <li>Warrior (Cost: 150 gold) - Melee tank</li>
                <li>Mage (Cost: 200 gold) - Magic damage and support</li>
            </ul>
            <p>Your gold: ${this.gameState.hero.gold}</p>
            <p>Current underlings: ${this.gameState.hero.underlings.length} / ${this.gameState.hero.leadership} (Leadership limit)</p>
            ${this.gameState.hero.underlings.length >= this.gameState.hero.leadership ? 
                '<p style="color: #ff6b6b;"><strong>⚠ Leadership limit reached! Upgrade leadership to recruit more underlings.</strong></p>' : 
                '<p style="color: #51cf66;">You can recruit more underlings!</p>'
            }
        `;

        this.ui.createModal("Recruitment", recruitmentContent, [
            {
                text: "Recruit Archer",
                onClick: () => this.recruitUnderling('archer', 100)
            },
            {
                text: "Recruit Warrior",
                onClick: () => this.recruitUnderling('warrior', 150)
            },
            {
                text: "Recruit Mage",
                onClick: () => this.recruitUnderling('mage', 200)
            },
            {
                text: "Close",
                onClick: () => this.returnToVillage()
            }
        ]);
    }

    recruitUnderling(type, cost) {
        if (this.gameState.hero.underlings.length >= this.gameState.hero.leadership) {
            this.ui.log(`You can only have ${this.gameState.hero.leadership} underlings! Upgrade your leadership to recruit more.`);
            this.ui.showNotification("Leadership limit reached!", "error");
            return;
        }

        if (this.gameState.hero.gold < cost) {
            this.ui.log("Not enough gold to recruit this underling!");
            this.ui.showNotification("Insufficient gold!", "error");
            return;
        }

        this.gameState.hero.gold -= cost;
        
        const underlings = {
            archer: { name: "Archer", type: "ranged", level: 1, health: 75, mana: 40, attack: 15, defense: 5 },
            warrior: { name: "Warrior", type: "tank", level: 1, health: 120, mana: 30, attack: 12, defense: 10 },
            mage: { name: "Mage", type: "magic", level: 1, health: 60, mana: 80, attack: 20, defense: 3 }
        };

        const underling = { 
            ...underlings[type], 
            id: Date.now(),
            maxHealth: underlings[type].health,
            maxMana: underlings[type].mana,
            equipment: [],
            isAlive: true
        };
        this.gameState.hero.underlings.push(underling);
        
        this.ui.log(`Recruited ${underling.name}!`);
        this.ui.showNotification(`Recruited ${underling.name}!`, "success");
        this.ui.render();
    }

    openShop() {
        if (this.gameState.inDungeon) {
            this.ui.log("You cannot access the shop while in a dungeon!");
            this.ui.showNotification("Cannot shop in dungeon!", "error");
            return;
        }
        
        // Change to shop background
        this.ui.setBackground('shop');
        this.gameState.currentScreen = 'shop';
        
        this.ui.log("Welcome to the shop!");
        
        const shopContent = `
            <p>Items available for purchase:</p>
            <ul>
                <li>Mana Potion (30 gold) - Restores 30 MP</li>
                <li>Experience Scroll (100 gold) - Grants 50 XP</li>
            </ul>
            <p><strong>Note:</strong> Healing services have moved to the Temple!</p>
            <p>Your health: ${this.gameState.hero.health}/${this.gameState.hero.maxHealth}</p>
            <p>Your gold: ${this.gameState.hero.gold}</p>
        `;

        this.ui.createModal("Shop", shopContent, [
            {
                text: "Buy Mana Potion",
                onClick: () => this.buyItem('mana_potion', 30)
            },
            {
                text: "Buy Experience Scroll",
                onClick: () => this.buyItem('exp_scroll', 100)
            },
            {
                text: "Leave",
                onClick: () => this.returnToVillage()
            }
        ]);
    }

    buyItem(itemType, cost) {
        if (this.gameState.hero.gold < cost) {
            this.ui.log("Not enough gold!");
            this.ui.showNotification("Insufficient gold!", "error");
            return;
        }

        this.gameState.hero.gold -= cost;

        switch(itemType) {
            case 'mana_potion':
                this.gameState.hero.equipment.push({
                    name: "Mana Potion",
                    type: "consumable",
                    effect: "mana",
                    value: 30
                });
                this.ui.log("Bought Mana Potion!");
                break;
            case 'exp_scroll':
                this.gameState.hero.fame += 50;
                this.ui.log("Used Experience Scroll! Gained 50 XP!");
                this.checkLevelUp();
                break;
        }

        this.ui.showNotification("Purchase successful!", "success");
        this.ui.render();
    }

    openTemple() {
        if (this.gameState.inDungeon) {
            this.ui.log("You cannot access the temple while in a dungeon!");
            this.ui.showNotification("Cannot visit temple in dungeon!", "error");
            return;
        }
        
        // Change to temple background
        this.ui.setBackground('temple');
        this.gameState.currentScreen = 'temple';
        
        this.ui.log("Welcome to the Sacred Temple of Healing!");
        
        // Count fallen underlings
        const fallenUnderlings = this.gameState.hero.underlings.filter(u => !u.isAlive);
        const aliveUnderlings = this.gameState.hero.underlings.filter(u => u.isAlive);
        const injuredUnderlings = aliveUnderlings.filter(u => u.health < u.maxHealth);
        
        const templeContent = `
            <div style="text-align: center; color: #e6ccff; margin-bottom: 15px;">
                <h3 style="color: #b18cf2;">🏛️ Sacred Temple of Healing 🏛️</h3>
                <p style="font-style: italic;">"Here, the wounded find solace and the fallen find redemption"</p>
            </div>
            <div style="display: flex; gap: 15px; margin-bottom: 15px;">
                <div style="flex: 1; background: #2a1a3a; padding: 10px; border-radius: 8px; border: 1px solid #6b4c93;">
                    <h4 style="color: #d4af37; margin-top: 0;">⚕️ Healing Services</h4>
                    <p>• Health Potion (25 gold) - Restores 50 HP</p>
                    <p>• Full Heal (50 gold) - Restores to maximum HP</p>
                    <p>• Heal All Party (100 gold) - Heals everyone to full</p>
                </div>
                <div style="flex: 1; background: #2a1a3a; padding: 10px; border-radius: 8px; border: 1px solid #6b4c93;">
                    <h4 style="color: #d4af37; margin-top: 0;">⚰️ Resurrection Services</h4>
                    <p>• Resurrect Underling (200 gold) - Bring back a fallen ally</p>
                    <p style="color: ${fallenUnderlings.length > 0 ? '#ff6b6b' : '#51cf66'};">
                        Fallen Underlings: ${fallenUnderlings.length}
                    </p>
                </div>
            </div>
            <div style="background: #1a1a2e; padding: 10px; border-radius: 8px; margin-bottom: 15px;">
                <h4 style="color: #4ecdc4; margin-top: 0;">📊 Party Status</h4>
                <p><strong>Hero:</strong> ${this.gameState.hero.health}/${this.gameState.hero.maxHealth} HP | Gold: ${this.gameState.hero.gold}</p>
                ${aliveUnderlings.length > 0 ? 
                    `<p><strong>Living Underlings:</strong></p>
                    ${aliveUnderlings.map(u => `
                        <div style="margin: 5px 0; padding: 5px; background: #2a2a2a; border-radius: 3px;">
                            ${u.name} (${u.type}): ${u.health}/${u.maxHealth} HP ${u.health < u.maxHealth ? '🩹' : '💚'}
                        </div>
                    `).join('')}` : 
                    '<p style="color: #888;">No living underlings</p>'
                }
                ${fallenUnderlings.length > 0 ? 
                    `<p><strong style="color: #ff6b6b;">Fallen Underlings:</strong></p>
                    ${fallenUnderlings.map(u => `
                        <div style="margin: 5px 0; padding: 5px; background: #4a1a1a; border-radius: 3px; color: #ff6b6b;">
                            💀 ${u.name} (${u.type}) - Requires Resurrection
                        </div>
                    `).join('')}` : ''
                }
            </div>
        `;

        const templeButtons = [
            {
                text: "Buy Health Potion (25g)",
                onClick: () => this.buyTempleItem('health_potion', 25)
            },
            {
                text: "Full Heal Hero (50g)",
                onClick: () => this.buyTempleItem('full_heal_hero', 50)
            }
        ];

        // Add party heal button if there are injured party members
        if (this.gameState.hero.health < this.gameState.hero.maxHealth || injuredUnderlings.length > 0) {
            templeButtons.push({
                text: "Heal All Party (100g)",
                onClick: () => this.buyTempleItem('heal_all_party', 100)
            });
        }

        // Add resurrection button if there are fallen underlings
        if (fallenUnderlings.length > 0) {
            templeButtons.push({
                text: "Resurrect Underling (200g)",
                onClick: () => this.showResurrectionOptions()
            });
        }

        templeButtons.push({
            text: "Leave Temple",
            onClick: () => this.returnToVillage()
        });

        this.ui.createModal("Sacred Temple", templeContent, templeButtons);
    }

    buyTempleItem(itemType, cost) {
        if (this.gameState.hero.gold < cost) {
            this.ui.log("Not enough gold!");
            this.ui.showNotification("Insufficient gold!", "error");
            return;
        }

        this.gameState.hero.gold -= cost;

        switch(itemType) {
            case 'health_potion':
                this.gameState.hero.equipment.push({
                    name: "Health Potion",
                    type: "consumable",
                    effect: "heal",
                    value: 50
                });
                this.ui.log("Bought Health Potion from the temple!");
                break;
            case 'full_heal_hero':
                const healAmount = this.gameState.hero.maxHealth - this.gameState.hero.health;
                this.gameState.hero.health = this.gameState.hero.maxHealth;
                this.ui.log(`Temple blessing received! Restored ${healAmount} HP. You are now at full health (${this.gameState.hero.health}/${this.gameState.hero.maxHealth}).`);
                break;
            case 'heal_all_party':
                const heroHealAmount = this.gameState.hero.maxHealth - this.gameState.hero.health;
                this.gameState.hero.health = this.gameState.hero.maxHealth;
                
                let totalHealed = heroHealAmount;
                this.gameState.hero.underlings.forEach(underling => {
                    if (underling.isAlive) {
                        const underlingHealAmount = underling.maxHealth - underling.health;
                        underling.health = underling.maxHealth;
                        totalHealed += underlingHealAmount;
                    }
                });
                
                this.ui.log(`Divine light heals the entire party! Restored ${totalHealed} total HP across all party members.`);
                break;
        }

        this.ui.showNotification("Temple service completed!", "success");
        this.ui.render();
        // Refresh the temple modal to show updated stats
        setTimeout(() => this.openTemple(), 100);
    }

    showResurrectionOptions() {
        const fallenUnderlings = this.gameState.hero.underlings.filter(u => !u.isAlive);
        
        if (fallenUnderlings.length === 0) {
            this.ui.log("No fallen underlings to resurrect!");
            return;
        }

        const resurrectionContent = `
            <div style="text-align: center; color: #e6ccff; margin-bottom: 15px;">
                <h3 style="color: #b18cf2;">⚰️ Resurrection Chamber ⚰️</h3>
                <p style="font-style: italic;">"Choose wisely, for each soul demands a price"</p>
            </div>
            <p><strong>Cost:</strong> 200 gold per resurrection</p>
            <p><strong>Your Gold:</strong> ${this.gameState.hero.gold}</p>
            <div style="margin-top: 15px;">
                <h4>Fallen Underlings:</h4>
                ${fallenUnderlings.map(underling => `
                    <div style="background: #4a1a1a; padding: 10px; margin: 8px 0; border-radius: 5px; border: 1px solid #8b4513;">
                        <strong style="color: #ff6b6b;">💀 ${underling.name}</strong> (${underling.type})
                        <br><small>Level ${underling.level} | Was ${underling.maxHealth} HP</small>
                        <br><button onclick="window.game.controller.resurrectUnderling('${underling.id}')" 
                                  style="margin-top: 5px; padding: 5px 10px; background: #6b4c93; border: 1px solid #9966cc; color: white; border-radius: 3px; cursor: pointer;">
                            Resurrect (200g)
                        </button>
                    </div>
                `).join('')}
            </div>
        `;

        this.ui.createModal("Resurrection Chamber", resurrectionContent, [
            {
                text: "Back to Temple",
                onClick: () => this.openTemple()
            }
        ]);
    }

    resurrectUnderling(underlingId) {
        const cost = 200;
        if (this.gameState.hero.gold < cost) {
            this.ui.log("Not enough gold for resurrection!");
            this.ui.showNotification("Insufficient gold for resurrection!", "error");
            return;
        }

        const underling = this.gameState.hero.underlings.find(u => u.id.toString() === underlingId.toString());
        if (!underling || underling.isAlive) {
            this.ui.log("Cannot find fallen underling!");
            return;
        }

        this.gameState.hero.gold -= cost;
        underling.isAlive = true;
        underling.health = Math.floor(underling.maxHealth * 0.5); // Resurrect with 50% health

        this.ui.log(`${underling.name} has been resurrected! They return with ${underling.health}/${underling.maxHealth} HP.`);
        this.ui.showNotification(`${underling.name} resurrected!`, "success");
        this.ui.render();
        
        // Return to main temple view
        setTimeout(() => this.openTemple(), 500);
    }

    manageUnderlingEquipment() {
        const aliveUnderlings = this.gameState.hero.underlings.filter(u => u.isAlive);
        
        if (aliveUnderlings.length === 0) {
            this.ui.log("No living underlings to manage equipment for!");
            this.ui.showNotification("No living underlings!", "error");
            return;
        }

        const equipmentContent = `
            <div style="text-align: center; color: #e6ccff; margin-bottom: 15px;">
                <h3 style="color: #b18cf2;">⚔️ Underling Equipment Management ⚔️</h3>
                <p style="font-style: italic;">"Arm your followers for the battles ahead"</p>
            </div>
            <div style="max-height: 400px; overflow-y: auto;">
                ${aliveUnderlings.map(underling => `
                    <div style="background: #2a1a3a; padding: 12px; margin: 10px 0; border-radius: 8px; border: 1px solid #6b4c93;">
                        <h4 style="color: #d4af37; margin-bottom: 8px;">${underling.name} (${underling.type})</h4>
                        <p style="margin-bottom: 8px;">Health: ${underling.health}/${underling.maxHealth} | Level: ${underling.level}</p>
                        
                        <div style="display: flex; gap: 15px;">
                            <div style="flex: 1;">
                                <h5 style="color: #4ecdc4; margin-bottom: 5px;">Equipped Items:</h5>
                                ${underling.equipment && underling.equipment.filter(item => item.equipped).length > 0 ?
                                    underling.equipment.filter(item => item.equipped).map(item => `
                                        <div style="background: #1a1a2e; padding: 6px; margin: 3px 0; border-radius: 4px; font-size: 12px;">
                                            <strong>${item.name}</strong> (${item.type})
                                            ${item.stats ? Object.entries(item.stats).map(([stat, value]) => 
                                                `<br><small>+${value} ${stat}</small>`).join('') : ''}
                                            <br><button onclick="window.game.controller.unequipUnderlingItem('${underling.id}', '${item.name}')" 
                                                      style="margin-top: 3px; padding: 2px 6px; background: #8b4513; border: 1px solid #d4af37; color: white; border-radius: 2px; cursor: pointer; font-size: 10px;">
                                                Unequip
                                            </button>
                                        </div>
                                    `).join('') :
                                    '<p style="color: #888; font-size: 12px;">No equipped items</p>'
                                }
                            </div>
                            
                            <div style="flex: 1;">
                                <h5 style="color: #4ecdc4; margin-bottom: 5px;">Available Items:</h5>
                                ${this.getUnderlingCompatibleItems(underling).length > 0 ?
                                    this.getUnderlingCompatibleItems(underling).map((item, itemIndex) => `
                                        <div style="background: #1a1a2e; padding: 6px; margin: 3px 0; border-radius: 4px; font-size: 12px;">
                                            <strong>${item.name}</strong> (${item.type})
                                            ${item.stats ? Object.entries(item.stats).map(([stat, value]) => 
                                                `<br><small>+${value} ${stat}</small>`).join('') : ''}
                                            <br><button onclick="window.game.controller.equipUnderlingItem('${underling.id}', ${itemIndex})" 
                                                      style="margin-top: 3px; padding: 2px 6px; background: #2a6b2a; border: 1px solid #51cf66; color: white; border-radius: 2px; cursor: pointer; font-size: 10px;">
                                                Equip
                                            </button>
                                        </div>
                                    `).join('') :
                                    '<p style="color: #888; font-size: 12px;">No compatible items in inventory</p>'
                                }
                            </div>
                        </div>
                        
                        <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #444; font-size: 11px;">
                            <strong>Stats with Equipment:</strong>
                            Attack: ${this.calculateUnderlingStats(underling).attack} | 
                            Defense: ${this.calculateUnderlingStats(underling).defense} | 
                            Health: ${this.calculateUnderlingStats(underling).maxHealth}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        this.ui.createModal("Underling Equipment", equipmentContent, [
            {
                text: "Back to Inventory",
                onClick: () => this.openInventory()
            }
        ]);
    }

    getUnderlingCompatibleItems(underling) {
        // Get hero's inventory items that could be given to underlings
        const heroItems = this.gameState.hero.equipment.filter(item => 
            !item.equipped && 
            (item.type === 'weapon' || item.type === 'armor' || item.type === 'accessory' || item.type === 'consumable')
        );
        
        // All items can be given to underlings (equipment and consumables)
        return heroItems;
    }

    calculateUnderlingStats(underling) {
        let baseStats = {
            attack: underling.attack,
            defense: underling.defense,
            maxHealth: underling.maxHealth
        };

        if (underling.equipment) {
            underling.equipment.filter(item => item.equipped).forEach(item => {
                if (item.stats) {
                    Object.entries(item.stats).forEach(([stat, value]) => {
                        if (baseStats[stat] !== undefined) {
                            baseStats[stat] += value;
                        }
                    });
                }
            });
        }

        return baseStats;
    }

    equipUnderlingItem(underlingId, itemIndex) {
        const underling = this.gameState.hero.underlings.find(u => u.id.toString() === underlingId.toString());
        if (!underling || !underling.isAlive) {
            this.ui.log("Cannot find living underling!");
            return;
        }

        const availableItems = this.getUnderlingCompatibleItems(underling);
        const item = availableItems[itemIndex];
        if (!item) {
            this.ui.log("Item not found!");
            return;
        }

        // Remove from hero's equipment and add to underling's equipment
        const heroItemIndex = this.gameState.hero.equipment.findIndex(heroItem => heroItem === item);
        if (heroItemIndex > -1) {
            this.gameState.hero.equipment.splice(heroItemIndex, 1);
            
            // Ensure underling has equipment array
            if (!underling.equipment) {
                underling.equipment = [];
            }
            
            // Unequip same type items first
            underling.equipment.forEach(equippedItem => {
                if (equippedItem.type === item.type && equippedItem.equipped) {
                    equippedItem.equipped = false;
                    // Return to hero's inventory
                    this.gameState.hero.equipment.push({...equippedItem, equipped: false});
                }
            });
            underling.equipment = underling.equipment.filter(equippedItem => 
                !(equippedItem.type === item.type && !equippedItem.equipped)
            );
            
            // Equip new item
            item.equipped = true;
            underling.equipment.push(item);
            
            this.ui.log(`${underling.name} equipped ${item.name}!`);
            this.ui.showNotification(`${underling.name} equipped ${item.name}!`, "success");
            this.ui.render();
            
            // Refresh equipment modal
            setTimeout(() => this.manageUnderlingEquipment(), 100);
        }
    }

    unequipUnderlingItem(underlingId, itemName) {
        const underling = this.gameState.hero.underlings.find(u => u.id.toString() === underlingId.toString());
        if (!underling || !underling.isAlive) {
            this.ui.log("Cannot find living underling!");
            return;
        }

        const item = underling.equipment ? underling.equipment.find(item => item.name === itemName && item.equipped) : null;
        if (!item) {
            this.ui.log("Item not found on underling!");
            return;
        }

        // Remove from underling and return to hero's inventory
        const itemIndex = underling.equipment.findIndex(equippedItem => equippedItem === item);
        if (itemIndex > -1) {
            underling.equipment.splice(itemIndex, 1);
            item.equipped = false;
            this.gameState.hero.equipment.push(item);
            
            this.ui.log(`${underling.name} unequipped ${item.name}!`);
            this.ui.showNotification(`${item.name} returned to inventory!`, "info");
            this.ui.render();
            
            // Refresh equipment modal
            setTimeout(() => this.manageUnderlingEquipment(), 100);
        }
    }

    openInventory() {
        this.ui.log("Opening inventory...");
        
        const equipment = this.gameState.hero.equipment;
        const equippedItems = equipment.filter(item => item.equipped);
        const unequippedItems = equipment.filter(item => !item.equipped);
        
        let inventoryContent = `
            <div style="display: flex; gap: 20px;">
                <div style="flex: 1;">
                    <h4>Equipped Items</h4>
                    ${equippedItems.length > 0 ? 
                        equippedItems.map(item => `
                            <div style="background: #1a1a1a; padding: 8px; margin: 5px 0; border-radius: 5px;">
                                <strong>${item.name}</strong> (${item.type})
                                ${item.stats ? Object.entries(item.stats).map(([stat, value]) => 
                                    `<br><small>+${value} ${stat}</small>`).join('') : ''}
                            </div>
                        `).join('') : 
                        '<p style="color: #888;">No items equipped</p>'
                    }
                </div>
                <div style="flex: 1;">
                    <h4>Inventory</h4>
                    ${unequippedItems.length > 0 ? 
                        unequippedItems.map((item, index) => `
                            <div style="background: #1a1a1a; padding: 8px; margin: 5px 0; border-radius: 5px;">
                                <strong>${item.name}</strong> (${item.type})
                                ${item.stats ? Object.entries(item.stats).map(([stat, value]) => 
                                    `<br><small>+${value} ${stat}</small>`).join('') : ''}
                                ${item.effect ? `<br><small>Effect: ${item.effect} ${item.value || ''}</small>` : ''}
                                <br><button onclick="window.game.controller.equipItem(${index})" style="margin-top: 5px; padding: 2px 8px; background: #2a2a2a; border: 1px solid #555; color: white; border-radius: 3px; cursor: pointer;">
                                    ${item.type === 'consumable' ? 'Use' : 'Equip'}
                                </button>
                            </div>
                        `).join('') : 
                        '<p style="color: #888;">Inventory is empty</p>'
                    }
                </div>
            </div>
            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #444;">
                <p><strong>Hero Stats:</strong></p>
                <p>Gold: ${this.gameState.hero.gold} | Level: ${this.gameState.hero.level} | Fame: ${this.gameState.hero.fame}</p>
                <p>Total Items: ${equipment.length} | Equipped: ${equippedItems.length}</p>
            </div>
        `;

        const inventoryButtons = [
            {
                text: "Close",
                onClick: () => {}
            }
        ];

        // Add equipment management button if there are living underlings
        const aliveUnderlings = this.gameState.hero.underlings.filter(u => u.isAlive);
        if (aliveUnderlings.length > 0) {
            inventoryButtons.unshift({
                text: "Manage Underling Equipment",
                onClick: () => this.manageUnderlingEquipment()
            });
        }

        this.ui.createModal("Inventory & Equipment", inventoryContent, inventoryButtons);
    }

    equipItem(itemIndex) {
        const unequippedItems = this.gameState.hero.equipment.filter(item => !item.equipped);
        const item = unequippedItems[itemIndex];
        
        if (!item) return;

        if (item.type === 'consumable') {
            this.useConsumable(item);
            // Remove consumable from inventory
            const originalIndex = this.gameState.hero.equipment.findIndex(equip => equip === item);
            this.gameState.hero.equipment.splice(originalIndex, 1);
        } else {
            // Unequip items of the same type first
            this.gameState.hero.equipment.forEach(equip => {
                if (equip.type === item.type && equip.equipped) {
                    equip.equipped = false;
                }
            });
            
            // Equip the new item
            item.equipped = true;
            this.ui.log(`Equipped ${item.name}!`);
            this.ui.showNotification(`Equipped ${item.name}!`, "success");
        }
        
        this.ui.render();
        // Refresh the inventory modal
        setTimeout(() => this.openInventory(), 100);
    }

    useConsumable(item) {
        switch(item.effect) {
            case 'heal':
                this.ui.log(`Used ${item.name}! Restored ${item.value} health.`);
                break;
            case 'mana':
                this.ui.log(`Used ${item.name}! Restored ${item.value} mana.`);
                break;
            default:
                this.ui.log(`Used ${item.name}!`);
        }
        this.ui.showNotification(`Used ${item.name}!`, "success");
    }

    openCharacterManagement() {
        this.ui.log("Opening character management...");
        
        const hero = this.gameState.hero;
        const equippedStats = this.calculateEquippedStats();
        
        let characterContent = `
            <div style="display: flex; gap: 20px;">
                <div style="flex: 1;">
                    <h4>Hero: ${hero.name}</h4>
                    <div style="background: #1a1a1a; padding: 10px; border-radius: 5px; margin: 10px 0;">
                        <p><strong>Level:</strong> ${hero.level}</p>
                        <p><strong>Fame (XP):</strong> ${hero.fame} / ${hero.level * 100}</p>
                        <p><strong>Gold:</strong> ${hero.gold}</p>
                        <p><strong>Leadership:</strong> ${hero.leadership}</p>
                        <p style="font-size: 12px; color: #aaa; margin-left: 20px;">Next upgrade cost: ${Math.pow(hero.leadership + 1, 2) * 10} gold</p>
                        <hr style="margin: 10px 0; border-color: #444;">
                        <p><strong>Base Stats + Equipment:</strong></p>
                        <p>Attack: ${10 + (hero.level * 2)} + ${equippedStats.attack} = ${10 + (hero.level * 2) + equippedStats.attack}</p>
                        <p>Defense: ${5 + hero.level} + ${equippedStats.defense} = ${5 + hero.level + equippedStats.defense}</p>
                        <p>Health: ${100 + (hero.level * 10)}</p>
                        <p>Max Underlings: ${hero.leadership}</p>
                        <hr style="margin: 10px 0; border-color: #444;">
                        <p><strong>Equipment Slots:</strong></p>
                        <p>Weapon: ${this.getEquippedItem('weapon')?.name || 'None'}</p>
                        <p>Armor: ${this.getEquippedItem('armor')?.name || 'None'}</p>
                        <p>Accessory: ${this.getEquippedItem('accessory')?.name || 'None'}</p>
                    </div>
                </div>
                <div style="flex: 1;">
                    <h4>Underlings (${hero.underlings.length})</h4>
                    <div style="max-height: 400px; overflow-y: auto;">
                        ${hero.underlings.length > 0 ? 
                            hero.underlings.map((underling, index) => `
                                <div style="background: #1a1a1a; padding: 10px; margin: 5px 0; border-radius: 5px;">
                                    <h5>${underling.name} (${underling.type})</h5>
                                    <p>Level: ${underling.level}</p>
                                    <p>Health: ${underling.health}</p>
                                    <p>Attack: ${underling.attack}</p>
                                    <p>Defense: ${underling.defense}</p>
                                    <button onclick="window.game.controller.manageUnderling(${index})" 
                                            style="margin-top: 5px; padding: 3px 10px; background: #2a2a2a; border: 1px solid #555; color: white; border-radius: 3px; cursor: pointer;">
                                        Manage
                                    </button>
                                </div>
                            `).join('') : 
                            '<p style="color: #888;">No underlings recruited</p>'
                        }
                    </div>
                </div>
            </div>
        `;

        this.ui.createModal("Character Management", characterContent, [
            {
                text: "Level Up Hero",
                onClick: () => this.attemptHeroLevelUp()
            },
            {
                text: "Upgrade Leadership",
                onClick: () => this.upgradeLeadership()
            },
            {
                text: "Close",
                onClick: () => {}
            }
        ]);
    }

    calculateEquippedStats() {
        const stats = { attack: 0, defense: 0 };
        
        this.gameState.hero.equipment.forEach(item => {
            if (item.equipped && item.stats) {
                Object.entries(item.stats).forEach(([stat, value]) => {
                    if (stats[stat] !== undefined) {
                        stats[stat] += value;
                    }
                });
            }
        });
        
        return stats;
    }

    getEquippedItem(type) {
        return this.gameState.hero.equipment.find(item => item.type === type && item.equipped);
    }

    manageUnderling(index) {
        const underling = this.gameState.hero.underlings[index];
        if (!underling) return;

        const underlingContent = `
            <h4>Managing: ${underling.name}</h4>
            <div style="background: #1a1a1a; padding: 15px; border-radius: 5px;">
                <p><strong>Type:</strong> ${underling.type}</p>
                <p><strong>Level:</strong> ${underling.level}</p>
                <p><strong>Health:</strong> ${underling.health}</p>
                <p><strong>Attack:</strong> ${underling.attack}</p>
                <p><strong>Defense:</strong> ${underling.defense}</p>
                <hr style="margin: 15px 0; border-color: #444;">
                <p><strong>Actions:</strong></p>
                <p>Level up cost: ${underling.level * 50} gold</p>
                <p>Dismiss: Remove from party (no refund)</p>
            </div>
        `;

        this.ui.createModal(`Manage ${underling.name}`, underlingContent, [
            {
                text: "Level Up",
                onClick: () => this.levelUpUnderling(index)
            },
            {
                text: "Dismiss",
                onClick: () => this.dismissUnderling(index)
            },
            {
                text: "Back",
                onClick: () => setTimeout(() => this.openCharacterManagement(), 100)
            }
        ]);
    }

    levelUpUnderling(index) {
        const underling = this.gameState.hero.underlings[index];
        const cost = underling.level * 50;

        if (this.gameState.hero.gold < cost) {
            this.ui.log("Not enough gold to level up this underling!");
            this.ui.showNotification("Insufficient gold!", "error");
            return;
        }

        this.gameState.hero.gold -= cost;
        underling.level++;
        underling.health += 20;
        underling.attack += 3;
        underling.defense += 2;

        this.ui.log(`${underling.name} leveled up to level ${underling.level}!`);
        this.ui.showNotification(`${underling.name} leveled up!`, "success");
        this.ui.render();
        
        // Refresh the underling management view
        setTimeout(() => this.manageUnderling(index), 100);
    }

    dismissUnderling(index) {
        const underling = this.gameState.hero.underlings[index];
        this.gameState.hero.underlings.splice(index, 1);
        
        this.ui.log(`${underling.name} has been dismissed from your party.`);
        this.ui.showNotification(`${underling.name} dismissed`, "success");
        this.ui.render();
        
        // Go back to character management
        setTimeout(() => this.openCharacterManagement(), 100);
    }

    attemptHeroLevelUp() {
        const requiredXP = this.gameState.hero.level * 100;
        if (this.gameState.hero.fame >= requiredXP) {
            this.gameState.hero.level++;
            this.gameState.hero.fame -= requiredXP;
            this.ui.log(`Hero leveled up to level ${this.gameState.hero.level}!`);
            this.ui.showNotification(`Hero leveled up!`, "success");
            this.ui.render();
            // Refresh character management
            setTimeout(() => this.openCharacterManagement(), 100);
        } else {
            this.ui.log(`Need ${requiredXP - this.gameState.hero.fame} more XP to level up.`);
            this.ui.showNotification("Not enough XP!", "error");
        }
    }

    upgradeLeadership() {
        const currentLeadership = this.gameState.hero.leadership;
        const cost = Math.pow(currentLeadership + 1, 2) * 10; // Formula: (next_leadership_level)^2 * 10
        
        if (this.gameState.hero.gold < cost) {
            this.ui.log(`Need ${cost} gold to upgrade leadership to ${currentLeadership + 1}. You have ${this.gameState.hero.gold} gold.`);
            this.ui.showNotification("Insufficient gold for leadership upgrade!", "error");
            return;
        }

        // Show confirmation modal
        const confirmContent = `
            <div style="text-align: center;">
                <h4>Upgrade Leadership</h4>
                <p><strong>Current Leadership:</strong> ${currentLeadership}</p>
                <p><strong>New Leadership:</strong> ${currentLeadership + 1}</p>
                <p><strong>Cost:</strong> ${cost} gold</p>
                <p><strong>Your Gold:</strong> ${this.gameState.hero.gold}</p>
                <hr style="margin: 15px 0; border-color: #444;">
                <p>This will increase your maximum underlings from <strong>${currentLeadership}</strong> to <strong>${currentLeadership + 1}</strong>.</p>
                <p style="color: #d4af37; font-weight: bold;">Are you sure you want to upgrade?</p>
            </div>
        `;

        this.ui.createModal("Leadership Upgrade", confirmContent, [
            {
                text: "Confirm Upgrade",
                onClick: () => this.confirmLeadershipUpgrade(cost)
            },
            {
                text: "Cancel",
                onClick: () => setTimeout(() => this.openCharacterManagement(), 100)
            }
        ]);
    }

    confirmLeadershipUpgrade(cost) {
        const oldLeadership = this.gameState.hero.leadership;
        
        this.gameState.hero.gold -= cost;
        this.gameState.hero.leadership++;
        
        this.ui.log(`Leadership upgraded from ${oldLeadership} to ${this.gameState.hero.leadership}!`);
        this.ui.log(`You can now recruit up to ${this.gameState.hero.leadership} underlings.`);
        this.ui.showNotification(`Leadership upgraded to ${this.gameState.hero.leadership}!`, "success");
        this.ui.render();
        
        // Refresh character management after a short delay
        setTimeout(() => this.openCharacterManagement(), 100);
    }

    returnToVillage() {
        // Reset all dungeon-related state when returning to village
        this.gameState.inDungeon = false;
        this.gameState.currentEnemies = null;
        this.gameState.currentScreen = 'village';
        this.ui.setBackground('village');
        this.ui.log("Returning to the village...");
        this.ui.render(); // Re-render to update button states
    }

    checkLevelUp() {
        const requiredXP = this.gameState.hero.level * 100;
        if (this.gameState.hero.fame >= requiredXP) {
            this.gameState.hero.level++;
            this.gameState.hero.fame -= requiredXP;
            this.ui.log(`Level up! You are now level ${this.gameState.hero.level}!`);
            this.ui.showNotification(`Level up! Now level ${this.gameState.hero.level}!`, "success");
        }
    }
}

// Export for use in main game file
window.GameController = GameController;
