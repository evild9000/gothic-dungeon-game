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
                rations: 0, // Starting rations for dungeon resting
                // New stat system - all start at base 5
                strength: 5,      // Affects melee weapon attack
                dexterity: 5,     // Affects ranged weapon attack + crit chance (2.5% per point) + crit damage
                constitution: 5,  // Affects hit points (5 HP per point over 5)
                intelligence: 5,  // Affects mana + arcane spell attack
                willpower: 5,     // Affects mana + divine spell attack + magic resistance
                size: 5,          // Affects hit chance, hit points, and damage
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
        
        // Apply stat bonuses to new character
        this.applyStatBonuses();
        
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
                        // Add new stats if missing (backward compatibility)
                        if (underling.strength === undefined) {
                            underling.strength = 5;
                            underling.dexterity = 5;
                            underling.constitution = 5;
                            underling.intelligence = 5;
                            underling.willpower = 5;
                            underling.size = 5;
                        }
                    });
                }
                
                // Add new stats to hero if missing (backward compatibility)
                if (this.gameState.hero.strength === undefined) {
                    this.gameState.hero.strength = 5;
                    this.gameState.hero.dexterity = 5;
                    this.gameState.hero.constitution = 5;
                    this.gameState.hero.intelligence = 5;
                    this.gameState.hero.willpower = 5;
                    this.gameState.hero.size = 5;
                }
                
                // Add rations if missing (backward compatibility)
                if (this.gameState.hero.rations === undefined) {
                    this.gameState.hero.rations = 0;
                }
                
                // Apply stat bonuses to all characters
                this.applyStatBonuses();
                
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
                attack: 10 + (this.gameState.dungeonLevel * 2),
                // Base stats for enemies (modified by type)
                strength: 5,
                dexterity: 5,
                constitution: 5,
                intelligence: 5,
                willpower: 5,
                size: 5
            };
            
            // Apply enemy type stat modifiers
            this.applyEnemyStatModifiers(enemy);
            
            // Apply stat bonuses to enemy health and stats after modifiers
            this.applyEnemyStatBonuses(enemy);
            
            this.gameState.currentEnemies.push(enemy);
        }
    }

    applyEnemyStatModifiers(enemy) {
        // Apply stat modifiers based on enemy type
        switch(enemy.name) {
            case 'Goblin':
                enemy.dexterity += 2; // Quick and sneaky
                enemy.intelligence += 1; // Cunning
                enemy.size -= 1; // Small
                enemy.strength -= 1; // Weak
                break;
            case 'Orc':
                enemy.strength += 3; // Very strong
                enemy.constitution += 2; // Hardy
                enemy.size += 1; // Large
                enemy.intelligence -= 2; // Not bright
                enemy.dexterity -= 1; // Clumsy
                break;
            case 'Skeleton':
                enemy.constitution += 3; // Undead resilience
                enemy.willpower += 2; // Unbreaking will
                enemy.dexterity += 1; // Bone joints move well
                enemy.intelligence -= 2; // Mindless
                enemy.strength -= 1; // Brittle bones
                break;
            case 'Wolf':
                enemy.dexterity += 3; // Very agile
                enemy.strength += 2; // Powerful bite
                enemy.constitution += 1; // Enduring
                enemy.intelligence += 1; // Pack hunter
                enemy.size -= 1; // Medium size
                break;
            case 'Spider':
                enemy.dexterity += 4; // Extremely agile
                enemy.constitution += 1; // Hardy
                enemy.intelligence += 2; // Web tactics
                enemy.size -= 2; // Small
                enemy.strength -= 2; // Delicate
                enemy.willpower -= 1; // Instinct driven
                break;
        }
        
        // Ensure no stat goes below 1
        ['strength', 'dexterity', 'constitution', 'intelligence', 'willpower', 'size'].forEach(stat => {
            enemy[stat] = Math.max(1, enemy[stat]);
        });
    }

    applyEnemyStatBonuses(enemy) {
        // Apply constitution bonus to enemy health
        const healthBonus = this.calculateHealthBonus(enemy);
        enemy.maxHealth = Math.max(1, enemy.maxHealth + healthBonus);
        enemy.health = enemy.maxHealth; // Enemies start at full health
        
        // Ensure all values are valid numbers and not NaN
        enemy.health = Math.max(1, isNaN(enemy.health) ? enemy.maxHealth : enemy.health);
        enemy.maxHealth = Math.max(1, isNaN(enemy.maxHealth) ? 50 : enemy.maxHealth);
        enemy.attack = Math.max(1, isNaN(enemy.attack) ? 10 : enemy.attack);
        
        // Debug logging for problematic enemies
        if (isNaN(enemy.health) || isNaN(enemy.maxHealth)) {
            console.warn('NaN detected in enemy stats:', enemy);
            enemy.health = 50;
            enemy.maxHealth = 50;
        }
    }

    // New stat-based combat calculation methods
    calculateCriticalHit(attacker) {
        // Critical hit chance based on dexterity: DEX * 2.5% chance, max 30%
        if (!attacker || typeof attacker.dexterity !== 'number' || isNaN(attacker.dexterity)) {
            return { isCritical: false, multiplier: 1.0 };
        }
        
        const critChance = Math.min(30, attacker.dexterity * 2.5);
        const isCritical = Math.random() * 100 < critChance;
        
        if (isCritical) {
            // Critical damage multiplier based on dexterity: 1.5 + (DEX - 5) * 0.1, max 3.0x
            const critMultiplier = Math.min(3.0, 1.5 + Math.max(0, (attacker.dexterity - 5) * 0.1));
            return { isCritical: true, multiplier: critMultiplier };
        }
        
        return { isCritical: false, multiplier: 1.0 };
    }

    calculateAttackBonus(attacker, weaponType = 'melee') {
        // Attack bonuses based on weapon type and stats
        if (!attacker) return 0;
        
        let bonus = 0;
        
        switch(weaponType) {
            case 'melee':
                if (typeof attacker.strength === 'number' && !isNaN(attacker.strength)) {
                    bonus = Math.floor((attacker.strength - 5) * 0.5); // STR bonus for melee
                }
                break;
            case 'ranged':
                if (typeof attacker.dexterity === 'number' && !isNaN(attacker.dexterity)) {
                    bonus = Math.floor((attacker.dexterity - 5) * 0.5); // DEX bonus for ranged
                }
                break;
            case 'arcane':
                if (typeof attacker.intelligence === 'number' && !isNaN(attacker.intelligence)) {
                    bonus = Math.floor((attacker.intelligence - 5) * 0.5); // INT bonus for arcane
                }
                break;
            case 'divine':
                if (typeof attacker.willpower === 'number' && !isNaN(attacker.willpower)) {
                    bonus = Math.floor((attacker.willpower - 5) * 0.5); // WIL bonus for divine
                }
                break;
        }
        
        return Math.max(0, bonus);
    }

    calculateHealthBonus(character) {
        // Constitution provides bonus HP: (CON - 5) * 5 HP
        if (!character || typeof character.constitution !== 'number' || isNaN(character.constitution)) {
            return 0;
        }
        return Math.max(0, (character.constitution - 5) * 5);
    }

    calculateManaBonus(character) {
        // Intelligence and Willpower provide bonus mana: (INT + WIL - 10) * 2.5 mana
        if (!character || typeof character.intelligence !== 'number' || typeof character.willpower !== 'number' || 
            isNaN(character.intelligence) || isNaN(character.willpower)) {
            return 0;
        }
        return Math.max(0, (character.intelligence + character.willpower - 10) * 2.5);
    }

    getWeaponType(attacker) {
        // Determine weapon type based on equipped weapons or character type
        if (attacker.equipment) {
            const equippedWeapons = attacker.equipment.filter(item => item.equipped && item.stats && item.stats.attack);
            if (equippedWeapons.length > 0) {
                // Return the type of the first equipped weapon
                return equippedWeapons[0].weaponType || 'melee';
            }
        }
        
        // Default weapon types by character type
        if (attacker.type === 'ranged') return 'ranged';
        if (attacker.type === 'magic') return 'arcane';
        if (attacker.type === 'support') return 'divine';
        
        return 'melee'; // Default for heroes, warriors, and enemies
    }

    applyStatBonuses() {
        // Apply stat bonuses to hero
        this.applyCharacterStatBonuses(this.gameState.hero);
        
        // Apply stat bonuses to underlings
        if (this.gameState.hero.underlings) {
            this.gameState.hero.underlings.forEach(underling => {
                this.applyCharacterStatBonuses(underling);
            });
        }
    }

    applyCharacterStatBonuses(character) {
        // Store original health/mana before applying bonuses
        const currentHealthPercent = character.health / character.maxHealth;
        const currentManaPercent = character.mana / character.maxMana;
        
        // Calculate base values without stat bonuses
        let baseHealth = character.maxHealth;
        let baseMana = character.maxMana;
        
        // Remove previous stat bonuses if they exist
        if (character.statBonusesApplied) {
            baseHealth -= character.previousHealthBonus || 0;
            baseMana -= character.previousManaBonus || 0;
        }
        
        // Calculate new stat bonuses
        const healthBonus = this.calculateHealthBonus(character);
        const manaBonus = this.calculateManaBonus(character);
        
        // Apply new bonuses
        character.maxHealth = Math.max(1, baseHealth + healthBonus);
        character.maxMana = Math.max(1, baseMana + manaBonus);
        
        // Maintain current health/mana percentages
        character.health = Math.min(character.health, Math.floor(character.maxHealth * currentHealthPercent));
        character.mana = Math.min(character.mana, Math.floor(character.maxMana * currentManaPercent));
        
        // Track that bonuses have been applied
        character.statBonusesApplied = true;
        character.previousHealthBonus = healthBonus;
        character.previousManaBonus = manaBonus;
    }

    showCombatInterface() {
        const enemies = this.gameState.currentEnemies;
        const aliveUnderlings = this.gameState.hero.underlings.filter(u => u.isAlive);
        
        // Helper function to get health color
        const getHealthColor = (current, max) => {
            const ratio = current / max;
            if (ratio <= 0.3) return '#ff6b6b';
            if (ratio <= 0.6) return '#ffd93d';
            return '#51cf66';
        };
        
        // Helper function to get character icon
        const getCharacterIcon = (type) => {
            const icons = {
                'hero': '👑',
                'archer': '🏹', 
                'warrior': '⚔️',
                'mage': '🔮',
                'Goblin': '👹',
                'Orc': '🧌',
                'Skeleton': '💀',
                'Wolf': '🐺',
                'Spider': '🕷️'
            };
            return icons[type] || '⚡';
        };
        
        const combatContent = `
            <div class="enhanced-combat-interface">
                <h3 style="text-align: center; color: #d4af37; margin-bottom: 20px;">⚔️ Combat Encounter ⚔️</h3>
                
                <div style="display: flex; gap: 20px; margin-bottom: 20px;">
                    <!-- Enemies Section -->
                    <div style="flex: 1; background: #2a1a1a; padding: 15px; border-radius: 8px; border: 2px solid #8b0000;">
                        <h4 style="color: #ff6b6b; margin-bottom: 10px; text-align: center;">🔥 Enemies</h4>
                        ${enemies.map((enemy, index) => `
                            <div style="display: flex; align-items: center; margin: 8px 0; padding: 8px; background: #1a0000; border-radius: 5px; border-left: 3px solid #ff6b6b;">
                                <div style="font-size: 24px; margin-right: 10px;">${getCharacterIcon(enemy.name)}</div>
                                <div style="flex: 1;">
                                    <div style="font-weight: bold; color: #ff6b6b;">${enemy.name}</div>
                                    <div style="font-size: 12px; color: #ccc;">Level ${enemy.level} | Attack: ${enemy.attack}</div>
                                    <div style="margin-top: 3px;">
                                        <span style="color: ${getHealthColor(enemy.health, enemy.maxHealth)}; font-weight: bold;">${enemy.health}</span>
                                        <span style="color: #888;">/${enemy.maxHealth} HP</span>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    
                    <!-- Player Party Section -->
                    <div style="flex: 1; background: #1a2a1a; padding: 15px; border-radius: 8px; border: 2px solid #228b22;">
                        <h4 style="color: #51cf66; margin-bottom: 10px; text-align: center;">🛡️ Your Party</h4>
                        
                        <!-- Hero -->
                        <div style="display: flex; align-items: center; margin: 8px 0; padding: 8px; background: #0a1a0a; border-radius: 5px; border-left: 3px solid #d4af37;">
                            <div style="font-size: 24px; margin-right: 10px;">${getCharacterIcon('hero')}</div>
                            <div style="flex: 1;">
                                <div style="font-weight: bold; color: #d4af37;">${this.gameState.hero.name || 'Hero'}</div>
                                <div style="font-size: 12px; color: #ccc;">Level ${this.gameState.hero.level} | Leader</div>
                                <div style="margin-top: 3px;">
                                    <span style="color: ${getHealthColor(this.gameState.hero.health, this.gameState.hero.maxHealth)}; font-weight: bold;">${this.gameState.hero.health}</span>
                                    <span style="color: #888;">/${this.gameState.hero.maxHealth} HP</span>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Underlings -->
                        ${aliveUnderlings.map(underling => `
                            <div style="display: flex; align-items: center; margin: 8px 0; padding: 8px; background: #0a1a0a; border-radius: 5px; border-left: 3px solid #51cf66;">
                                <div style="font-size: 24px; margin-right: 10px;">${getCharacterIcon(underling.type)}</div>
                                <div style="flex: 1;">
                                    <div style="font-weight: bold; color: #51cf66;">${underling.name}</div>
                                    <div style="font-size: 12px; color: #ccc;">Level ${underling.level} | ${underling.type}</div>
                                    <div style="margin-top: 3px;">
                                        <span style="color: ${getHealthColor(underling.health, underling.maxHealth)}; font-weight: bold;">${underling.health}</span>
                                        <span style="color: #888;">/${underling.maxHealth} HP</span>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                        
                        ${aliveUnderlings.length === 0 ? '<div style="text-align: center; color: #888; font-style: italic; padding: 20px;">No underlings in party</div>' : ''}
                        
                        <!-- Show fallen underlings -->
                        ${this.gameState.hero.underlings.filter(u => !u.isAlive).map(underling => `
                            <div style="display: flex; align-items: center; margin: 8px 0; padding: 8px; background: #2a0a0a; border-radius: 5px; border-left: 3px solid #666;">
                                <div style="font-size: 24px; margin-right: 10px; opacity: 0.5;">💀</div>
                                <div style="flex: 1; opacity: 0.5;">
                                    <div style="font-weight: bold; color: #888; text-decoration: line-through;">${underling.name}</div>
                                    <div style="font-size: 12px; color: #666;">Fallen - needs resurrection</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <!-- Combat Actions -->
                <div style="background: #2a2a3a; padding: 15px; border-radius: 8px; border: 2px solid #4a4a6a;">
                    <h4 style="color: #4ecdc4; margin-bottom: 15px; text-align: center;">⚡ Choose Your Action</h4>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                        <button class="enhanced-combat-btn attack-btn" onclick="window.game.controller.playerAttack()" 
                                style="padding: 12px; background: linear-gradient(45deg, #8b0000, #dc143c); border: 2px solid #ff6b6b; color: white; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 14px; display: flex; align-items: center; justify-content: center; gap: 8px;">
                            ⚔️ Attack
                        </button>
                        <button class="enhanced-combat-btn defend-btn" onclick="window.game.controller.playerDefend()" 
                                style="padding: 12px; background: linear-gradient(45deg, #2a4d3a, #4a7c59); border: 2px solid #51cf66; color: white; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 14px; display: flex; align-items: center; justify-content: center; gap: 8px;">
                            🛡️ Defend
                        </button>
                        <button class="enhanced-combat-btn item-btn" onclick="window.game.controller.showCombatItemSelection()" 
                                style="padding: 12px; background: linear-gradient(45deg, #4a4a2d, #7a7a3a); border: 2px solid #ffd93d; color: white; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 14px; display: flex; align-items: center; justify-content: center; gap: 8px;">
                            🧪 Use Item
                        </button>
                        <button class="enhanced-combat-btn flee-btn" onclick="window.game.controller.playerFlee()" 
                                style="padding: 12px; background: linear-gradient(45deg, #3a3a4a, #5a5a7a); border: 2px solid #9966cc; color: white; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 14px; display: flex; align-items: center; justify-content: center; gap: 8px;">
                            💨 Flee
                        </button>
                    </div>
                    
                    <div style="margin-top: 15px; padding: 10px; background: #1a1a2a; border-radius: 5px; text-align: center;">
                        <div style="font-size: 12px; color: #888; font-style: italic;">
                            💡 Tip: Defend reduces incoming damage by 50% | Use items to heal your party
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Create a side-by-side modal instead of docked panel
        this.showEnhancedCombatModal(combatContent);
    }

    showEnhancedCombatModal(combatContent) {
        // Remove any existing combat interface
        const existingModal = document.getElementById('enhanced-combat-modal');
        if (existingModal) {
            existingModal.remove();
        }

        // Create the enhanced combat modal that sits alongside the chat
        const modalHtml = `
            <div id="enhanced-combat-modal" style="
                position: fixed;
                top: 20px;
                left: 20px;
                right: 20px;
                bottom: 20px;
                background: rgba(0, 0, 0, 0.9);
                border: 3px solid #d4af37;
                border-radius: 12px;
                z-index: 1000;
                display: flex;
                flex-direction: column;
                padding: 20px;
                backdrop-filter: blur(5px);
            ">
                <div style="
                    flex: 1;
                    display: flex;
                    gap: 20px;
                    overflow: hidden;
                ">
                    <!-- Combat Interface Section -->
                    <div style="
                        flex: 1;
                        background: rgba(20, 20, 40, 0.9);
                        border-radius: 8px;
                        padding: 15px;
                        overflow-y: auto;
                        border: 2px solid #4a4a6a;
                    ">
                        ${combatContent}
                    </div>
                    
                    <!-- Chat Window Section -->
                    <div style="
                        flex: 1;
                        background: rgba(40, 20, 20, 0.9);
                        border-radius: 8px;
                        padding: 15px;
                        display: flex;
                        flex-direction: column;
                        border: 2px solid #8b4513;
                    ">
                        <h4 style="color: #d4af37; margin-bottom: 15px; text-align: center; border-bottom: 1px solid #444; padding-bottom: 10px;">
                            📜 Combat Log
                        </h4>
                        <div id="combat-chat-display" style="
                            flex: 1;
                            overflow-y: auto;
                            background: rgba(0, 0, 0, 0.3);
                            border-radius: 5px;
                            padding: 10px;
                            border: 1px solid #666;
                            font-family: monospace;
                            font-size: 13px;
                            line-height: 1.4;
                        ">
                            <!-- Chat content will be inserted here -->
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add modal to page
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Update the chat display with current chat log
        this.updateCombatChatDisplay();
        
        // Add hover effects to buttons
        setTimeout(() => {
            const buttons = document.querySelectorAll('.enhanced-combat-btn');
            buttons.forEach(button => {
                button.addEventListener('mouseenter', () => {
                    button.style.transform = 'scale(1.05)';
                    button.style.boxShadow = '0 5px 15px rgba(0,0,0,0.3)';
                });
                button.addEventListener('mouseleave', () => {
                    button.style.transform = 'scale(1)';
                    button.style.boxShadow = 'none';
                });
            });
        }, 100);
    }

    updateCombatChatDisplay() {
        const chatDisplay = document.getElementById('combat-chat-display');
        if (chatDisplay && this.gameState.chatLog) {
            // Show last 20 messages to keep it manageable
            const recentMessages = this.gameState.chatLog.slice(-20);
            chatDisplay.innerHTML = recentMessages.map(msg => 
                `<div style="margin-bottom: 8px; color: #e0e0e0;">${msg}</div>`
            ).join('');
            
            // Auto-scroll to bottom
            chatDisplay.scrollTop = chatDisplay.scrollHeight;
        }
    }

    closeEnhancedCombatModal() {
        const modal = document.getElementById('enhanced-combat-modal');
        if (modal) {
            modal.remove();
        }
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
        const hero = this.gameState.hero;
        
        // Calculate base attack with level progression
        const baseAttack = 15 + (hero.level * 3);
        
        // Get weapon type and calculate stat-based attack bonus
        const weaponType = this.getWeaponType(hero);
        const statBonus = this.calculateAttackBonus(hero, weaponType);
        
        // Calculate critical hit
        const critResult = this.calculateCriticalHit(hero);
        
        // Total attack value with stat bonuses
        const totalAttack = baseAttack + statBonus;
        
        // Apply damage variance (70-100% of attack value) and critical multiplier
        const baseDamage = Math.floor(totalAttack * (0.7 + Math.random() * 0.3));
        const finalDamage = Math.floor(baseDamage * critResult.multiplier);
        
        target.health -= finalDamage;
        
        // Enhanced attack log with weapon type and critical hit info
        const weaponText = weaponType !== 'melee' ? ` (${weaponType})` : '';
        const critText = critResult.isCritical ? ` CRITICAL HIT! (${critResult.multiplier.toFixed(1)}x)` : '';
        const statText = statBonus > 0 ? ` (+${statBonus} stat bonus)` : '';
        
        this.ui.log(`You attack ${target.name}${weaponText} for ${finalDamage} damage!${critText}${statText} (${target.name}: ${Math.max(0, target.health)}/${target.maxHealth} HP)`);
        
        // Update combat interface instead of sprite animation
        setTimeout(() => this.showCombatInterface(), 200);

        // Living underlings also attack!
        const aliveUnderlings = this.gameState.hero.underlings.filter(u => u.isAlive);
        const defeatedEnemiesThisTurn = new Set(); // Track enemies defeated by underlings this turn
        
        aliveUnderlings.forEach((underling, index) => {
            if (this.gameState.currentEnemies.length > 0) {
                // Special abilities for specific underling types
                
                // Warrior: Taunt when any ally is under 50% health and has mana
                if (underling.type === 'tank' && underling.mana >= 8) {
                    const allPartyMembers = [this.gameState.hero, ...this.gameState.hero.underlings.filter(u => u.isAlive)];
                    const injuredMembers = allPartyMembers.filter(member => {
                        const healthPercent = member.health / member.maxHealth;
                        return healthPercent < 0.5;
                    });
                    
                    if (injuredMembers.length > 0) {
                        // Activate taunt ability
                        underling.mana -= 8;
                        
                        // Set taunt state on game state
                        this.gameState.warriorTauntActive = true;
                        this.gameState.tauntingWarrior = underling;
                        
                        this.ui.log(`${underling.name} uses Protective Taunt! All enemies will focus on the warrior next turn. (Cost: 8 MP)`);
                        this.ui.log(`${underling.name} gains +25% defense while taunting!`);
                        
                        // Update combat interface
                        setTimeout(() => this.showCombatInterface(), (index + 1) * 300);
                        return; // Skip normal attack
                    }
                }
                
                // Healer: Heal most wounded ally if under 50% health and has mana
                if (underling.type === 'support' && underling.mana >= 10) {
                    const allPartyMembers = [this.gameState.hero, ...this.gameState.hero.underlings.filter(u => u.isAlive)];
                    const woundedMembers = allPartyMembers.filter(member => {
                        const healthPercent = member.health / member.maxHealth;
                        return healthPercent < 0.5;
                    });
                    
                    if (woundedMembers.length > 0) {
                        // Find most wounded member (lowest health percentage)
                        const mostWounded = woundedMembers.reduce((worst, current) => {
                            const currentPercent = current.health / current.maxHealth;
                            const worstPercent = worst.health / worst.maxHealth;
                            return currentPercent < worstPercent ? current : worst;
                        });
                        
                        // Heal for 25% of max health
                        const healAmount = Math.floor(mostWounded.maxHealth * 0.25);
                        const actualHealing = Math.min(healAmount, mostWounded.maxHealth - mostWounded.health);
                        mostWounded.health = Math.min(mostWounded.health + healAmount, mostWounded.maxHealth);
                        underling.mana -= 10;
                        
                        const targetName = mostWounded === this.gameState.hero ? 'Hero' : mostWounded.name;
                        this.ui.log(`${underling.name} casts Healing Light on ${targetName} for ${actualHealing} HP! (Cost: 10 MP) (${targetName}: ${mostWounded.health}/${mostWounded.maxHealth} HP)`);
                        
                        // Update combat interface
                        setTimeout(() => this.showCombatInterface(), (index + 1) * 300);
                        return; // Skip normal attack
                    }
                }
                
                // Mage: Area effect spell if 3+ enemies and has mana
                if (underling.type === 'magic' && underling.mana >= 15 && this.gameState.currentEnemies.length >= 3) {
                    // Calculate spell damage
                    let baseSpellDamage = 6 + (underling.level * 1.5);
                    const statBonus = this.calculateAttackBonus(underling, 'arcane');
                    const totalSpellDamage = Math.floor(baseSpellDamage + statBonus);
                    
                    underling.mana -= 15;
                    
                    this.ui.log(`${underling.name} casts Arcane Blast! (Cost: 15 MP)`);
                    
                    // Damage all enemies
                    this.gameState.currentEnemies.forEach(enemy => {
                        // Apply damage variance (80-100% of spell damage)
                        const variance = 0.8 + Math.random() * 0.2;
                        const finalDamage = Math.floor(totalSpellDamage * variance);
                        enemy.health -= finalDamage;
                        
                        this.ui.log(`  ${enemy.name} takes ${finalDamage} arcane damage! (${Math.max(0, enemy.health)}/${enemy.maxHealth} HP)`);
                        
                        // Check if enemy is defeated
                        if (enemy.health <= 0) {
                            defeatedEnemiesThisTurn.add(enemy);
                            this.ui.log(`  ${enemy.name} is defeated by the arcane blast!`);
                            
                            // Give rewards for defeated enemies
                            const baseGold = Math.floor(Math.random() * 10) + 5;
                            const baseXp = Math.floor(Math.random() * 15) + 10;
                            const goldReward = baseGold + (this.gameState.dungeonLevel * Math.floor(Math.random() * 3 + 2));
                            const xpReward = baseXp + (this.gameState.dungeonLevel * Math.floor(Math.random() * 5 + 3));
                            
                            this.gameState.hero.gold += goldReward;
                            this.gameState.hero.fame += xpReward;
                            
                            this.ui.log(`You gained ${goldReward} gold and ${xpReward} experience! (Dungeon Lv.${this.gameState.dungeonLevel})`);
                        }
                    });
                    
                    // Update combat interface
                    setTimeout(() => this.showCombatInterface(), (index + 1) * 300);
                    return; // Skip normal attack
                }
                
                // Normal attack for all other cases
                // Each underling targets the first available enemy (not yet defeated this turn)
                let underlingTarget = null;
                for (let i = 0; i < this.gameState.currentEnemies.length; i++) {
                    const potentialTarget = this.gameState.currentEnemies[i];
                    if (!defeatedEnemiesThisTurn.has(potentialTarget)) {
                        underlingTarget = potentialTarget;
                        break;
                    }
                }
                
                // Skip if no valid target found
                if (!underlingTarget) {
                    return;
                }
                
                // Calculate base attack with level progression
                let baseAttack = 8 + (underling.level * 2);
                
                // Equipment attack bonuses
                const equippedWeapons = underling.equipment ? underling.equipment.filter(item => item.equipped && item.stats && item.stats.attack) : [];
                const equipmentBonus = equippedWeapons.reduce((total, weapon) => total + weapon.stats.attack, 0);
                
                // Get weapon type and calculate stat-based attack bonus
                const weaponType = this.getWeaponType(underling);
                const statBonus = this.calculateAttackBonus(underling, weaponType);
                
                // Calculate critical hit
                const critResult = this.calculateCriticalHit(underling);
                
                // Total attack value with all bonuses
                const totalAttack = baseAttack + equipmentBonus + statBonus;
                
                // Apply damage variance (70-100% of attack value) and critical multiplier
                const baseDamage = Math.floor(totalAttack * (0.7 + Math.random() * 0.3));
                const finalDamage = Math.floor(baseDamage * critResult.multiplier);
                
                underlingTarget.health -= finalDamage;
                
                // Enhanced attack log with weapon type and critical hit info
                const weaponText = weaponType !== 'melee' ? ` (${weaponType})` : '';
                const critText = critResult.isCritical ? ` CRITICAL HIT! (${critResult.multiplier.toFixed(1)}x)` : '';
                const equipmentText = equipmentBonus > 0 ? ` (+${equipmentBonus} equipment)` : '';
                const statText = statBonus > 0 ? ` (+${statBonus} stat)` : '';
                
                this.ui.log(`${underling.name} attacks ${underlingTarget.name}${weaponText} for ${finalDamage} damage!${critText}${equipmentText}${statText} (${underlingTarget.name}: ${Math.max(0, underlingTarget.health)}/${underlingTarget.maxHealth} HP)`);
                
                // Update combat interface after a short delay instead of sprite animation
                setTimeout(() => this.showCombatInterface(), (index + 1) * 300);
                
                // Check if enemy is defeated by underling
                if (underlingTarget.health <= 0) {
                    // Mark this enemy as defeated to prevent double-processing
                    defeatedEnemiesThisTurn.add(underlingTarget);
                    
                    this.ui.log(`${underlingTarget.name} is defeated by ${underling.name}!`);
                    // Scale rewards with dungeon level
                    const baseGold = Math.floor(Math.random() * 10) + 5; // 5-14 base
                    const baseXp = Math.floor(Math.random() * 15) + 10; // 10-24 base
                    const goldReward = baseGold + (this.gameState.dungeonLevel * Math.floor(Math.random() * 3 + 2)); // +2-4 per level
                    const xpReward = baseXp + (this.gameState.dungeonLevel * Math.floor(Math.random() * 5 + 3)); // +3-7 per level
                    
                    this.gameState.hero.gold += goldReward;
                    this.gameState.hero.fame += xpReward;
                    
                    this.ui.log(`You gained ${goldReward} gold and ${xpReward} experience! (Dungeon Lv.${this.gameState.dungeonLevel})`);
                    this.ui.showNotification(`${underling.name} defeated ${underlingTarget.name}! +${goldReward} gold, +${xpReward} XP`, "success");
                }
            }
        });
        
        // Remove all defeated enemies after all underlings have attacked
        this.gameState.currentEnemies = this.gameState.currentEnemies.filter(enemy => !defeatedEnemiesThisTurn.has(enemy));

        // Safety check: Also remove any enemies with health <= 0 (in case of edge cases)
        this.gameState.currentEnemies = this.gameState.currentEnemies.filter(enemy => enemy.health > 0);

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
            // Scale rewards with dungeon level - Hero gets bonus rewards
            const baseGold = Math.floor(Math.random() * 15) + 10; // 10-24 base
            const baseXp = Math.floor(Math.random() * 20) + 15; // 15-34 base
            const goldReward = Math.floor((baseGold + (this.gameState.dungeonLevel * Math.floor(Math.random() * 4 + 3))) * 1.5); // +3-6 per level, 1.5x hero bonus
            const xpReward = Math.floor((baseXp + (this.gameState.dungeonLevel * Math.floor(Math.random() * 6 + 4))) * 1.5); // +4-9 per level, 1.5x hero bonus
            
            this.gameState.hero.gold += goldReward;
            this.gameState.hero.fame += xpReward;
            
            this.ui.log(`You gained ${goldReward} gold and ${xpReward} experience! (Hero bonus + Dungeon Lv.${this.gameState.dungeonLevel})`);
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
        setTimeout(() => {
            this.showCombatInterface();
            this.updateCombatChatDisplay();
        }, 1000);
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
        setTimeout(() => {
            this.showCombatInterface();
            this.updateCombatChatDisplay();
        }, 1000);
    }

    playerFlee() {
        const fleeChance = Math.random();
        if (fleeChance > 0.3) { // 70% chance to flee successfully
            this.ui.log("You successfully fled from combat!");
            this.ui.showNotification("Fled from combat!", "info");
            
            // Close the enhanced combat modal before exiting
            this.closeEnhancedCombatModal();
            
            this.exitDungeon();
        } else {
            this.ui.log("You failed to flee! The enemies attack!");
            this.enemiesAttack();
            setTimeout(() => {
                this.showCombatInterface();
                this.updateCombatChatDisplay();
            }, 1000);
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

        // Check if all enemies defeated after item use
        if (this.gameState.currentEnemies.length === 0) {
            this.ui.log("All enemies defeated! You can continue deeper or exit the dungeon.");
            this.checkLevelUp();
            this.ui.render();
            this.showVictoryOptions();
            return;
        }

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
            let target;
            
            // Check if warrior taunt is active
            if (this.gameState.warriorTauntActive && this.gameState.tauntingWarrior && this.gameState.tauntingWarrior.isAlive) {
                // All enemies must attack the taunting warrior
                target = this.gameState.tauntingWarrior;
                this.ui.log(`${enemy.name} is forced to attack ${target.name} due to Protective Taunt!`);
            } else {
                // Each enemy picks a random target from alive party members
                target = allTargets[Math.floor(Math.random() * allTargets.length)];
            }
            
            // Calculate stat-based attack bonus (enemies use melee by default)
            const statBonus = this.calculateAttackBonus(enemy, 'melee');
            
            // Calculate critical hit
            const critResult = this.calculateCriticalHit(enemy);
            
            // Total attack value with stat bonuses
            const totalAttack = enemy.attack + statBonus;
            
            // Apply damage variance (60-100% of attack value) and critical multiplier
            const baseDamage = Math.floor(totalAttack * (0.6 + Math.random() * 0.4));
            const critDamage = Math.floor(baseDamage * critResult.multiplier);
            
            // Apply defense bonuses
            let actualDamage = this.gameState.defendingThisTurn ? Math.floor(critDamage / 2) : critDamage;
            
            // Apply warrior taunt defense bonus if this target is the taunting warrior
            let tauntDefenseBonus = '';
            if (this.gameState.warriorTauntActive && target === this.gameState.tauntingWarrior) {
                actualDamage = Math.floor(actualDamage * 0.75); // 25% defense bonus (75% damage taken)
                tauntDefenseBonus = ' (Taunt defense +25%)';
            }
            
            target.health -= actualDamage;
            
            // Enhanced attack log with critical hit info
            const critText = critResult.isCritical ? ` CRITICAL HIT! (${critResult.multiplier.toFixed(1)}x)` : '';
            const statText = statBonus > 0 ? ` (+${statBonus} stat)` : '';
            const defendText = this.gameState.defendingThisTurn ? ' (Reduced by defending)' : '';
            
            if (target === this.gameState.hero) {
                this.ui.log(`${enemy.name} attacks you for ${actualDamage} damage!${critText}${statText}${defendText}${tauntDefenseBonus} (Hero: ${Math.max(0, this.gameState.hero.health)}/${this.gameState.hero.maxHealth} HP)`);
                
                // Check if player is defeated
                if (this.gameState.hero.health <= 0) {
                    this.playerDefeated();
                    return;
                }
            } else {
                // Underling was attacked
                const underlingIndex = this.gameState.hero.underlings.findIndex(u => u === target);
                this.ui.log(`${enemy.name} attacks ${target.name} for ${actualDamage} damage!${this.gameState.defendingThisTurn ? ' (Reduced by defending)' : ''}${tauntDefenseBonus} (${target.name}: ${Math.max(0, target.health)}/${target.maxHealth} HP)`);
                
                // Check if underling is defeated
                if (target.health <= 0) {
                    target.health = 0;
                    target.isAlive = false;
                    this.ui.log(`${target.name} has fallen in battle!`);
                    this.ui.showNotification(`${target.name} defeated!`, "error");
                    
                    // If the taunting warrior dies, clear taunt state
                    if (this.gameState.warriorTauntActive && target === this.gameState.tauntingWarrior) {
                        this.gameState.warriorTauntActive = false;
                        this.gameState.tauntingWarrior = null;
                        this.ui.log(`Protective Taunt ends as ${target.name} falls!`);
                    }
                    
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
        
        // Clear taunt state after enemies attack (taunt only lasts one turn)
        if (this.gameState.warriorTauntActive) {
            this.gameState.warriorTauntActive = false;
            if (this.gameState.tauntingWarrior && this.gameState.tauntingWarrior.isAlive) {
                this.ui.log(`${this.gameState.tauntingWarrior.name}'s Protective Taunt ends.`);
            }
            this.gameState.tauntingWarrior = null;
        }
        
        // Update UI to reflect health changes and fallen underlings
        this.ui.render();
    }

    playerDefeated() {
        this.ui.log("Your party has been defeated!");
        this.ui.showNotification("Party defeated! Awakening in the temple...", "error");
        
        // Close the enhanced combat modal since combat is over
        this.closeEnhancedCombatModal();
        
        // Close any open modals
        const existingModals = document.querySelectorAll('.modal-overlay');
        existingModals.forEach(modal => modal.remove());
        
        // Clear taunt state when combat ends in defeat
        this.gameState.warriorTauntActive = false;
        this.gameState.tauntingWarrior = null;
        
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
        // Close the enhanced combat modal since combat is over
        this.closeEnhancedCombatModal();
        
        // Set combat state to false
        this.gameState.inCombat = false;
        
        // Clear taunt state when combat ends
        this.gameState.warriorTauntActive = false;
        this.gameState.tauntingWarrior = null;
        
        // Ensure rations property exists
        if (!this.gameState.hero.rations) {
            this.gameState.hero.rations = 0;
        }
        
        const victoryContent = `
            <div class="victory-interface" style="text-align: center;">
                <h4 style="color: #d4af37; margin-bottom: 15px;">🎉 Victory! 🎉</h4>
                <p style="margin-bottom: 10px;">All enemies in this area have been defeated!</p>
                <p style="margin-bottom: 15px;">What would you like to do next?</p>
                
                <div style="background: #2a2a3a; padding: 10px; border-radius: 5px; margin: 15px 0;">
                    <div style="font-size: 14px; color: #4ecdc4; margin-bottom: 8px;">
                        <strong>Current Status:</strong>
                    </div>
                    <div style="font-size: 12px; color: #ccc;">
                        Dungeon Level: ${this.gameState.dungeonLevel} | 
                        Rations: ${this.gameState.hero.rations} | 
                        Gold: ${this.gameState.hero.gold}
                    </div>
                </div>
                
                ${this.gameState.hero.rations > 0 ? 
                    '<div style="background: #1a3a1a; padding: 8px; border-radius: 5px; margin: 10px 0; border-left: 3px solid #51cf66;"><small style="color: #51cf66;">💡 You have rations available - you can Rest to stay on this level and explore more!</small></div>' : 
                    '<div style="background: #3a1a1a; padding: 8px; border-radius: 5px; margin: 10px 0; border-left: 3px solid #ff6b6b;"><small style="color: #ff6b6b;">⚠ No rations available - buy some from the shop to enable resting in dungeons!</small></div>'
                }
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

        // Add Rest button if player has rations
        if (this.gameState.hero.rations > 0) {
            victoryButtons.splice(1, 0, {
                text: "🍖 Rest (1 Ration)",
                onClick: () => this.restInDungeon()
            });
        }

        this.ui.createModal("Victory!", victoryContent, victoryButtons);
    }

    restInDungeon() {
        // Consume one ration
        this.gameState.hero.rations--;
        
        // Close any open modals
        const existingModals = document.querySelectorAll('.modal-overlay');
        existingModals.forEach(modal => modal.remove());
        
        // Restore some health and mana for the party
        const restHpRestore = Math.floor(this.gameState.hero.maxHealth * 0.25); // 25% HP restoration
        const restManaRestore = Math.floor((this.gameState.hero.maxMana || 100) * 0.25); // 25% Mana restoration
        
        // Restore hero
        const heroHpBefore = this.gameState.hero.health;
        const heroManaBefore = this.gameState.hero.mana || 0;
        
        this.gameState.hero.health = Math.min(
            this.gameState.hero.health + restHpRestore, 
            this.gameState.hero.maxHealth
        );
        
        if (this.gameState.hero.maxMana) {
            this.gameState.hero.mana = Math.min(
                this.gameState.hero.mana + restManaRestore, 
                this.gameState.hero.maxMana
            );
        }
        
        let restoredMembers = [];
        if (heroHpBefore < this.gameState.hero.maxHealth || (this.gameState.hero.maxMana && heroManaBefore < this.gameState.hero.maxMana)) {
            restoredMembers.push(`${this.gameState.hero.name || 'Hero'} (+${Math.min(restHpRestore, this.gameState.hero.maxHealth - heroHpBefore)} HP${this.gameState.hero.maxMana ? `, +${Math.min(restManaRestore, this.gameState.hero.maxMana - heroManaBefore)} MP` : ''})`);
        }
        
        // Restore underlings
        this.gameState.hero.underlings.forEach(underling => {
            if (underling.isAlive) {
                const underlingHpBefore = underling.health;
                const underlingManaBefore = underling.mana || 0;
                const underlingHpRestore = Math.floor(underling.maxHealth * 0.25);
                const underlingManaRestore = Math.floor((underling.maxMana || 50) * 0.25);
                
                underling.health = Math.min(underling.health + underlingHpRestore, underling.maxHealth);
                if (underling.maxMana) {
                    underling.mana = Math.min(underling.mana + underlingManaRestore, underling.maxMana);
                }
                
                if (underlingHpBefore < underling.maxHealth || (underling.maxMana && underlingManaBefore < underling.maxMana)) {
                    restoredMembers.push(`${underling.name} (+${Math.min(underlingHpRestore, underling.maxHealth - underlingHpBefore)} HP${underling.maxMana ? `, +${Math.min(underlingManaRestore, underling.maxMana - underlingManaBefore)} MP` : ''})`);
                }
            }
        });
        
        this.ui.log(`🍖 Your party consumes rations and rests...`);
        if (restoredMembers.length > 0) {
            this.ui.log(`✨ Party restored: ${restoredMembers.join(', ')}`);
        }
        this.ui.log(`Rations remaining: ${this.gameState.hero.rations}`);
        this.ui.showNotification("Party rested and recovered!", "success");
        
        // Show explore option
        this.showExploreOption();
    }

    showExploreOption() {
        const exploreContent = `
            <div style="text-align: center;">
                <h4 style="color: #d4af37; margin-bottom: 15px;">🛡️ Rested and Ready 🛡️</h4>
                <p style="margin-bottom: 10px;">Your party has recovered from their trials.</p>
                <p style="margin-bottom: 15px;">Ready to continue exploring this dungeon level?</p>
                
                <div style="background: #2a2a3a; padding: 10px; border-radius: 5px; margin: 15px 0;">
                    <div style="font-size: 14px; color: #4ecdc4; margin-bottom: 8px;">
                        <strong>Current Status:</strong>
                    </div>
                    <div style="font-size: 12px; color: #ccc;">
                        Dungeon Level: ${this.gameState.dungeonLevel} | 
                        Rations: ${this.gameState.hero.rations} | 
                        Hero HP: ${this.gameState.hero.health}/${this.gameState.hero.maxHealth}
                    </div>
                </div>
                
                <div style="background: #1a3a1a; padding: 8px; border-radius: 5px; margin: 10px 0; border-left: 3px solid #51cf66;">
                    <small style="color: #51cf66;">💡 Exploring will generate new enemies on the same dungeon level</small>
                </div>
            </div>
        `;

        this.ui.createModal("Ready to Explore", exploreContent, [
            {
                text: "🔍 Explore This Level",
                onClick: () => this.exploreCurrentLevel()
            },
            {
                text: "🏰 Exit Dungeon",
                onClick: () => this.exitDungeon()
            }
        ]);
    }

    exploreCurrentLevel() {
        // Close any open modals
        const existingModals = document.querySelectorAll('.modal-overlay');
        existingModals.forEach(modal => modal.remove());
        
        // Generate new enemies on the same level
        this.gameState.inCombat = true;
        this.generateEnemies();
        
        this.ui.log(`🔍 Exploring deeper into dungeon level ${this.gameState.dungeonLevel}...`);
        this.ui.log("New enemies block your path!");
        this.ui.render();
        
        setTimeout(() => this.showCombatInterface(), 500);
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
        
        // Close any combat-related modals
        this.closeEnhancedCombatModal();
        
        // Close any other open modals
        const existingModals = document.querySelectorAll('.modal-overlay');
        existingModals.forEach(modal => modal.remove());
        
        // Return to village background
        this.ui.setBackground('village');
        
        // Restore 15% HP and mana for hero and underlings
        this.restorePartyAfterDungeon();
        
        this.ui.log("You exit the dungeon.");
        this.ui.render();
    }

    restorePartyAfterDungeon() {
        let restoredMembers = [];
        
        // Restore hero's HP and mana
        const heroHpBefore = this.gameState.hero.health;
        const heroManaBefore = this.gameState.hero.mana || 0;
        
        const heroHpRestore = Math.floor(this.gameState.hero.maxHealth * 0.15);
        const heroManaRestore = Math.floor((this.gameState.hero.maxMana || 100) * 0.15);
        
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
                
                const underlingHpRestore = Math.floor(underling.maxHealth * 0.15);
                const underlingManaRestore = Math.floor((underling.maxMana || 50) * 0.15);
                
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
            this.ui.showNotification("Party recovered 15% HP/MP!", "success");
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
        
        // Define all craftable items in one place for easier management
        const craftableItems = [
            { 
                id: 'iron_sword', 
                name: 'Iron Sword', 
                cost: 50, 
                description: '+5 Attack (Melee Weapon)',
                type: 'weapon'
            },
            { 
                id: 'elven_bow', 
                name: 'Elven Bow', 
                cost: 60, 
                description: '+6 Attack (Ranged Weapon)',
                type: 'weapon'
            },
            { 
                id: 'arcane_wand', 
                name: 'Arcane Wand', 
                cost: 80, 
                description: '+7 Attack (Arcane Weapon)',
                type: 'weapon'
            },
            { 
                id: 'divine_staff', 
                name: 'Divine Staff', 
                cost: 90, 
                description: '+8 Attack (Divine Weapon)',
                type: 'weapon'
            },
            { 
                id: 'leather_armor', 
                name: 'Leather Armor', 
                cost: 75, 
                description: '+3 Defense (Body Armor)',
                type: 'armor'
            },
            { 
                id: 'health_potion', 
                name: 'Health Potion', 
                cost: 25, 
                description: 'Restores 50 HP (Consumable)',
                type: 'consumable'
            }
        ];
        
        const craftingContent = `
            <div style="text-align: center; margin-bottom: 15px;">
                <h3 style="color: #d4af37; margin-bottom: 10px;">🔨 Crafting Workshop 🔨</h3>
                <p style="color: #51cf66; font-weight: bold;">Your Gold: ${this.gameState.hero.gold}</p>
            </div>
            
            <div style="max-height: 400px; overflow-y: auto; border: 1px solid #444; border-radius: 8px; padding: 10px; background: #1a1a2a;">
                <div style="display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 10px; margin-bottom: 10px; padding: 8px; background: #2a2a3a; border-radius: 5px; font-weight: bold; color: #d4af37;">
                    <div>Item Name & Description</div>
                    <div style="text-align: center;">Cost</div>
                    <div style="text-align: center;">Action</div>
                </div>
                
                ${craftableItems.map(item => `
                    <div style="display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 10px; align-items: center; padding: 12px; margin: 5px 0; background: ${this.gameState.hero.gold >= item.cost ? '#0a2a0a' : '#2a0a0a'}; border-radius: 5px; border-left: 3px solid ${this.gameState.hero.gold >= item.cost ? '#51cf66' : '#ff6b6b'};">
                        <div>
                            <div style="font-weight: bold; color: ${this.gameState.hero.gold >= item.cost ? '#51cf66' : '#ff6b6b'};">${item.name}</div>
                            <div style="font-size: 12px; color: #ccc; margin-top: 3px;">${item.description}</div>
                        </div>
                        <div style="text-align: center; font-weight: bold; color: #ffd93d;">${item.cost}g</div>
                        <div style="text-align: center;">
                            <button onclick="window.game.controller.craftItem('${item.id}', ${item.cost})" 
                                    style="padding: 6px 12px; background: ${this.gameState.hero.gold >= item.cost ? 'linear-gradient(45deg, #2a4d3a, #4a7c59)' : 'linear-gradient(45deg, #4a2a2a, #6a3a3a)'}; 
                                           border: 1px solid ${this.gameState.hero.gold >= item.cost ? '#51cf66' : '#ff6b6b'}; color: white; border-radius: 4px; cursor: ${this.gameState.hero.gold >= item.cost ? 'pointer' : 'not-allowed'}; 
                                           font-size: 12px; font-weight: bold;"
                                    ${this.gameState.hero.gold < item.cost ? 'disabled' : ''}>
                                🔨 Craft
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
            
            <div style="margin-top: 15px; padding: 10px; background: #2a2a3a; border-radius: 5px; text-align: center;">
                <div style="font-size: 12px; color: #888; font-style: italic;">
                    💡 Tip: Different weapon types benefit from different stats - STR (melee), DEX (ranged), INT (arcane), WIL (divine)
                </div>
            </div>
        `;

        this.ui.createModal("Crafting Workshop", craftingContent, [
            {
                text: "Close Workshop",
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
            iron_sword: { 
                name: "Iron Sword", 
                type: "weapon", 
                weaponType: "melee",
                stats: { attack: 5 }, 
                equipped: false 
            },
            elven_bow: { 
                name: "Elven Bow", 
                type: "weapon", 
                weaponType: "ranged",
                stats: { attack: 6 }, 
                equipped: false 
            },
            arcane_wand: { 
                name: "Arcane Wand", 
                type: "weapon", 
                weaponType: "arcane",
                stats: { attack: 7 }, 
                equipped: false 
            },
            divine_staff: { 
                name: "Divine Staff", 
                type: "weapon", 
                weaponType: "divine",
                stats: { attack: 8 }, 
                equipped: false 
            },
            leather_armor: { 
                name: "Leather Armor", 
                type: "armor", 
                stats: { defense: 3 }, 
                equipped: false 
            },
            health_potion: { 
                name: "Health Potion", 
                type: "consumable", 
                effect: "heal", 
                value: 50 
            }
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
                <li>Warrior (Cost: 150 gold) - Melee tank with protective taunt</li>
                <li>Healer (Cost: 175 gold) - Support and healing</li>
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
                text: "Recruit Healer",
                onClick: () => this.recruitUnderling('healer', 175)
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
            archer: { 
                name: "Archer", 
                type: "ranged", 
                level: 1, 
                health: 75, 
                mana: 40, 
                attack: 15, 
                defense: 5,
                // Archer stats - focused on dexterity and intelligence 
                strength: 4,
                dexterity: 8,
                constitution: 5,
                intelligence: 6,
                willpower: 5,
                size: 5
            },
            warrior: { 
                name: "Warrior", 
                type: "tank", 
                level: 1, 
                health: 120, 
                mana: 30, 
                attack: 12, 
                defense: 10,
                // Warrior stats - focused on strength and constitution
                strength: 8,
                dexterity: 4,
                constitution: 8,
                intelligence: 4,
                willpower: 6,
                size: 6
            },
            mage: { 
                name: "Mage", 
                type: "magic", 
                level: 1, 
                health: 60, 
                mana: 80, 
                attack: 20, 
                defense: 3,
                // Mage stats - focused on intelligence and willpower
                strength: 3,
                dexterity: 5,
                constitution: 4,
                intelligence: 8,
                willpower: 8,
                size: 4
            },
            healer: { 
                name: "Healer", 
                type: "support", 
                level: 1, 
                health: 80, 
                mana: 60, 
                attack: 8, 
                defense: 6,
                // Healer stats - focused on willpower and intelligence
                strength: 3,
                dexterity: 5,
                constitution: 6,
                intelligence: 7,
                willpower: 9,
                size: 4
            }
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
        
        // Apply stat bonuses to the new underling
        this.applyCharacterStatBonuses(underling);
        
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
        
        // Define all shop items in one place for easier management
        const shopItems = [
            { 
                id: 'mana_potion', 
                name: 'Mana Potion', 
                cost: 30, 
                description: 'Restores 30 MP (Consumable)',
                type: 'consumable'
            },
            { 
                id: 'exp_scroll', 
                name: 'Experience Scroll', 
                cost: 100, 
                description: 'Grants 50 XP (Consumable)',
                type: 'consumable'
            },
            { 
                id: 'rations', 
                name: 'Rations', 
                cost: 25, 
                description: 'Provides 7 uses for resting in dungeons',
                type: 'supply'
            }
        ];
        
        const shopContent = `
            <div style="text-align: center; margin-bottom: 15px;">
                <h3 style="color: #d4af37; margin-bottom: 10px;">🏪 General Store 🏪</h3>
                <p style="color: #51cf66; font-weight: bold;">Your Gold: ${this.gameState.hero.gold}</p>
                <p style="color: #4ecdc4;">Your Rations: ${this.gameState.hero.rations || 0}</p>
            </div>
            
            <div style="max-height: 400px; overflow-y: auto; border: 1px solid #444; border-radius: 8px; padding: 10px; background: #1a1a2a;">
                <div style="display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 10px; margin-bottom: 10px; padding: 8px; background: #2a2a3a; border-radius: 5px; font-weight: bold; color: #d4af37;">
                    <div>Item Name & Description</div>
                    <div style="text-align: center;">Cost</div>
                    <div style="text-align: center;">Action</div>
                </div>
                
                ${shopItems.map(item => `
                    <div style="display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 10px; align-items: center; padding: 12px; margin: 5px 0; background: ${this.gameState.hero.gold >= item.cost ? '#0a2a0a' : '#2a0a0a'}; border-radius: 5px; border-left: 3px solid ${this.gameState.hero.gold >= item.cost ? '#51cf66' : '#ff6b6b'};">
                        <div>
                            <div style="font-weight: bold; color: ${this.gameState.hero.gold >= item.cost ? '#51cf66' : '#ff6b6b'};">${item.name}</div>
                            <div style="font-size: 12px; color: #ccc; margin-top: 3px;">${item.description}</div>
                        </div>
                        <div style="text-align: center; font-weight: bold; color: #ffd93d;">💰${item.cost}g</div>
                        <div style="text-align: center;">
                            <button onclick="window.game.controller.buyItem('${item.id}', ${item.cost})" 
                                    style="padding: 6px 12px; background: ${this.gameState.hero.gold >= item.cost ? 'linear-gradient(45deg, #2a4d3a, #4a7c59)' : 'linear-gradient(45deg, #4a2a2a, #6a3a3a)'}; 
                                           border: 1px solid ${this.gameState.hero.gold >= item.cost ? '#51cf66' : '#ff6b6b'}; color: white; border-radius: 4px; cursor: ${this.gameState.hero.gold >= item.cost ? 'pointer' : 'not-allowed'}; 
                                           font-size: 12px; font-weight: bold;"
                                    ${this.gameState.hero.gold < item.cost ? 'disabled' : ''}>
                                💰 Buy
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
            
            <div style="margin-top: 15px; padding: 10px; background: #2a2a3a; border-radius: 5px; text-align: center;">
                <div style="font-size: 12px; color: #888; font-style: italic;">
                    💡 Tip: Visit the Temple for healing services and the Crafting Workshop for equipment
                </div>
            </div>
        `;

        this.ui.createModal("General Store", shopContent, [
            {
                text: "Leave Store",
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
            case 'rations':
                // Add or increase rations count
                if (!this.gameState.hero.rations) {
                    this.gameState.hero.rations = 0;
                }
                this.gameState.hero.rations += 7;
                this.ui.log("Bought Rations! You now have " + this.gameState.hero.rations + " rations.");
                break;
        }

        this.ui.showNotification("Purchase successful!", "success");
        this.ui.render();
        
        // Refresh the shop modal to show updated gold amounts
        setTimeout(() => this.openShop(), 100);
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
                const healAmount = Math.min(item.value, this.gameState.hero.maxHealth - this.gameState.hero.health);
                this.gameState.hero.health = Math.min(this.gameState.hero.health + item.value, this.gameState.hero.maxHealth);
                this.ui.log(`Used ${item.name}! Restored ${healAmount} health.`);
                break;
            case 'mana':
                const manaAmount = Math.min(item.value, this.gameState.hero.maxMana - this.gameState.hero.mana);
                this.gameState.hero.mana = Math.min(this.gameState.hero.mana + item.value, this.gameState.hero.maxMana);
                this.ui.log(`Used ${item.name}! Restored ${manaAmount} mana.`);
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
                        <p><strong>Rations:</strong> ${hero.rations || 0}</p>
                        <p><strong>Leadership:</strong> ${hero.leadership}</p>
                        <p style="font-size: 12px; color: #aaa; margin-left: 20px;">Next upgrade cost: ${Math.pow(hero.leadership + 1, 2) * 10} gold</p>
                        <hr style="margin: 10px 0; border-color: #444;">
                        <p><strong>Core Attributes (Base):</strong></p>
                        <p>Strength: ${hero.strength} (Melee attack bonus: +${this.calculateAttackBonus(hero, 'melee')})</p>
                        <p>Dexterity: ${hero.dexterity} (Ranged attack bonus: +${this.calculateAttackBonus(hero, 'ranged')}, Crit chance: ${(typeof hero.dexterity === 'number' && !isNaN(hero.dexterity)) ? Math.min(30, hero.dexterity * 2.5).toFixed(1) : '0.0'}%)</p>
                        <p>Constitution: ${hero.constitution} (HP bonus: +${this.calculateHealthBonus(hero)})</p>
                        <p>Intelligence: ${hero.intelligence} (Arcane attack bonus: +${this.calculateAttackBonus(hero, 'arcane')})</p>
                        <p>Willpower: ${hero.willpower} (Divine attack bonus: +${this.calculateAttackBonus(hero, 'divine')})</p>
                        <p>Size: ${hero.size} (Affects hit chance and damage)</p>
                        <hr style="margin: 10px 0; border-color: #444;">
                        <p><strong>Derived Stats:</strong></p>
                        <p>Health: ${hero.health}/${hero.maxHealth} (Base + CON bonus)</p>
                        <p>Mana: ${hero.mana}/${hero.maxMana} (Base + INT/WIL bonus: +${this.calculateManaBonus(hero)})</p>
                        <hr style="margin: 10px 0; border-color: #444;">
                        <p><strong>Base Stats + Equipment:</strong></p>
                        <p>Attack: ${10 + (hero.level * 2)} + ${equippedStats.attack} = ${10 + (hero.level * 2) + equippedStats.attack}</p>
                        <p>Defense: ${5 + hero.level} + ${equippedStats.defense} = ${5 + hero.level + equippedStats.defense}</p>
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
                                    <p><strong>Level:</strong> ${underling.level}</p>
                                    <p><strong>Health:</strong> ${underling.health}/${underling.maxHealth}</p>
                                    <p><strong>Mana:</strong> ${underling.mana}/${underling.maxMana}</p>
                                    <p><strong>Attack:</strong> ${underling.attack} | <strong>Defense:</strong> ${underling.defense}</p>
                                    <div style="font-size: 11px; color: #bbb; margin-top: 5px;">
                                        <strong>Stats:</strong> STR: ${underling.strength || 5}, DEX: ${underling.dexterity || 5}, CON: ${underling.constitution || 5}, INT: ${underling.intelligence || 5}, WIL: ${underling.willpower || 5}, SIZ: ${underling.size || 5}
                                    </div>
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
