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
        this.gameState = {
            hero: {
                name: "Hero",
                level: 1,
                fame: 0,
                gold: 100,
                health: 100,
                maxHealth: 100,
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
        
        this.ui.log("Started a new game!");
        this.ui.render();
        this.ui.showNotification("New game started!", "success");
    }

    saveGame() {
        try {
            localStorage.setItem('dungeonGameSave', JSON.stringify(this.gameState));
            this.ui.log("Game saved successfully!");
            this.ui.showNotification("Game saved!", "success");
        } catch (error) {
            this.ui.log("Failed to save game: " + error.message);
            this.ui.showNotification("Save failed!", "error");
        }
    }

    loadGame() {
        try {
            const data = localStorage.getItem('dungeonGameSave');
            if (data) {
                this.gameState = JSON.parse(data);
                this.ui.log("Game loaded successfully!");
                this.ui.render();
                this.ui.showNotification("Game loaded!", "success");
            } else {
                this.ui.log("No save file found.");
                this.ui.showNotification("No save file found!", "error");
            }
        } catch (error) {
            this.ui.log("Failed to load game: " + error.message);
            this.ui.showNotification("Load failed!", "error");
        }
    }

    enterDungeon() {
        if (this.gameState.inDungeon) {
            this.ui.log("You are already in a dungeon!");
            return;
        }

        this.gameState.inDungeon = true;
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
            `<li>${enemy.name} (Level ${enemy.level}) - HP: ${enemy.health}/${enemy.maxHealth}</li>`
        ).join('');
        
        // Show underling info if any
        let underlingInfo = '';
        if (this.gameState.hero.underlings.length > 0) {
            const underlingList = this.gameState.hero.underlings.map(underling => 
                `<li>${underling.name} (Level ${underling.level})</li>`
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
                <p><strong>Your Health:</strong> ${this.gameState.hero.health || 100}/${this.gameState.hero.maxHealth || 100}</p>
                ${underlingInfo}
                <p>Choose your action:</p>
            </div>
        `;

        const combatButtons = [
            {
                text: "⚔️ Attack",
                onClick: () => this.playerAttack()
            },
            {
                text: "🛡️ Defend",
                onClick: () => this.playerDefend()
            },
            {
                text: "💨 Flee",
                onClick: () => this.playerFlee()
            }
        ];

        this.ui.createModal("Combat", combatContent, combatButtons);
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
        const damage = Math.floor(Math.random() * heroAttack) + 5;
        
        target.health -= damage;
        this.ui.log(`You attack ${target.name} for ${damage} damage!`);
        this.ui.animateSprite('.enemy-sprite', 'shake');

        // Underlings also attack!
        this.gameState.hero.underlings.forEach((underling, index) => {
            if (this.gameState.currentEnemies.length > 0) {
                const underlingTarget = this.gameState.currentEnemies[0]; // Attack same target as hero
                const underlingAttack = 8 + (underling.level * 2); // Weaker than hero
                const underlingDamage = Math.floor(Math.random() * underlingAttack) + 3;
                
                underlingTarget.health -= underlingDamage;
                this.ui.log(`${underling.name} attacks ${underlingTarget.name} for ${underlingDamage} damage!`);
                
                // Animate the specific underling sprite
                setTimeout(() => {
                    const underlingSprites = document.querySelectorAll('.underling-sprite');
                    if (underlingSprites[index]) {
                        underlingSprites[index].classList.add('shake');
                        setTimeout(() => underlingSprites[index].classList.remove('shake'), 500);
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

    enemiesAttack() {
        this.gameState.currentEnemies.forEach(enemy => {
            const damage = Math.floor(Math.random() * enemy.attack) + 2;
            const actualDamage = this.gameState.defendingThisTurn ? Math.floor(damage / 2) : damage;
            
            this.gameState.hero.health -= actualDamage;
            this.ui.log(`${enemy.name} attacks you for ${actualDamage} damage!`);
            this.ui.animateSprite('.hero-sprite', 'shake');
            
            // Check if player is defeated
            if (this.gameState.hero.health <= 0) {
                this.playerDefeated();
                return;
            }
        });
    }

    playerDefeated() {
        this.ui.log("You have been defeated!");
        this.ui.showNotification("You were defeated! Respawning in village...", "error");
        
        // Close any open modals
        const existingModals = document.querySelectorAll('.modal-overlay');
        existingModals.forEach(modal => modal.remove());
        
        // Calculate penalties
        const goldLoss = Math.floor(this.gameState.hero.gold * 0.2); // 20% gold loss
        const newGold = this.gameState.hero.gold - goldLoss;
        
        // Apply defeat penalties
        this.gameState.hero.health = Math.floor(this.gameState.hero.maxHealth * 0.5); // Start with 50% health
        this.gameState.hero.gold = newGold;
        
        this.ui.log(`You were rescued but sustained injuries. Lost ${goldLoss} gold and health reduced to ${this.gameState.hero.health}/${this.gameState.hero.maxHealth}.`);
        this.ui.log(`Gold remaining: ${this.gameState.hero.gold}`);
        
        // Exit dungeon and force UI re-render to update button states
        this.exitDungeon();
        
        // Add a small delay then re-render to ensure button states are updated
        setTimeout(() => {
            this.ui.render();
        }, 100);
    }

    showVictoryOptions() {
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
        this.gameState.currentEnemies = null;
        this.gameState.currentScreen = 'village';
        
        // Return to village background
        this.ui.setBackground('village');
        
        this.ui.log("You exit the dungeon.");
        this.ui.render();
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
            archer: { name: "Archer", type: "ranged", level: 1, health: 75, attack: 15, defense: 5 },
            warrior: { name: "Warrior", type: "tank", level: 1, health: 120, attack: 12, defense: 10 },
            mage: { name: "Mage", type: "magic", level: 1, health: 60, attack: 20, defense: 3 }
        };

        const underling = { ...underlings[type], id: Date.now() };
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
                <li>Health Potion (25 gold) - Restores 50 HP</li>
                <li>Full Heal (50 gold) - Restores to maximum HP</li>
                <li>Mana Potion (30 gold) - Restores 30 MP</li>
                <li>Experience Scroll (100 gold) - Grants 50 XP</li>
            </ul>
            <p>Your health: ${this.gameState.hero.health}/${this.gameState.hero.maxHealth}</p>
            <p>Your gold: ${this.gameState.hero.gold}</p>
        `;

        this.ui.createModal("Shop", shopContent, [
            {
                text: "Buy Health Potion",
                onClick: () => this.buyItem('health_potion', 25)
            },
            {
                text: "Buy Full Heal",
                onClick: () => this.buyItem('full_heal', 50)
            },
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
            case 'health_potion':
                this.gameState.hero.equipment.push({
                    name: "Health Potion",
                    type: "consumable",
                    effect: "heal",
                    value: 50
                });
                this.ui.log("Bought Health Potion!");
                break;
            case 'full_heal':
                const healAmount = this.gameState.hero.maxHealth - this.gameState.hero.health;
                this.gameState.hero.health = this.gameState.hero.maxHealth;
                this.ui.log(`Full Heal used! Restored ${healAmount} HP. You are now at full health (${this.gameState.hero.health}/${this.gameState.hero.maxHealth}).`);
                break;
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

        this.ui.createModal("Inventory & Equipment", inventoryContent, [
            {
                text: "Close",
                onClick: () => {}
            }
        ]);
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
