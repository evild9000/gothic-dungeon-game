// Character Manager - Handles character stats, leveling, and stat management
class CharacterManager {
    constructor(gameController) {
        this.gameController = gameController;
        this.gameState = gameController.gameState;
        this.ui = gameController.ui;
        
        // Equipment slot definitions for different species
        this.speciesEquipmentSlots = {
            human: {
                head: { name: "Head", icon: "🎩", description: "Helmets, hats, crowns" },
                face: { name: "Face", icon: "😶", description: "Masks, glasses, visors" },
                neck: { name: "Neck", icon: "📿", description: "Necklaces, collars, torcs" },
                chest: { name: "Chest", icon: "🛡️", description: "Armor, robes, shirts" },
                legs: { name: "Legs", icon: "👖", description: "Pants, greaves, leggings" },
                feet: { name: "Feet", icon: "👢", description: "Boots, shoes, sandals" },
                arms: { name: "Arms", icon: "💪", description: "Bracers, arm guards" },
                hands: { name: "Hands", icon: "🧤", description: "Gloves, gauntlets" },
                hand1: { name: "Main Hand", icon: "⚔️", description: "Primary weapon" },
                hand2: { name: "Off Hand", icon: "🛡️", description: "Secondary weapon or shield" },
                ring1: { name: "Ring 1", icon: "💍", description: "First ring slot" },
                ring2: { name: "Ring 2", icon: "💍", description: "Second ring slot" },
                amulet: { name: "Amulet", icon: "🔮", description: "Magical amulets" },
                belt: { name: "Belt", icon: "👑", description: "Belts, sashes, girdles" },
                cloak: { name: "Cloak", icon: "🧥", description: "Cloaks, capes, mantles" }
            }
            // Future species can be added here:
            // spider: { legs1-8, abdomen, head, etc. }
            // dragon: { head, neck, wings, tail, etc. }
        };
        
        // Character species definitions (currently all human)
        this.defaultSpecies = 'human';
        
        // Stat configuration
        this.statConfig = {
            baseCost: 100,          // Base cost for first stat upgrade
            costMultiplier: 1.3,    // Cost multiplier for each upgrade
            maxStatValue: 20,       // Maximum stat value
            statDescriptions: {
                strength: "Increases melee weapon damage and carrying capacity",
                dexterity: "Increases critical hit chance, critical damage, and defense",
                constitution: "Increases health points and resistance to effects", 
                intelligence: "Increases mana and arcane spell damage",
                willpower: "Increases mana, divine spell damage, and magic resistance",
                size: "Affects health, melee damage, defense, and hit chance"
            }
        };
    }
    
    // Get equipment slots for a character based on their species
    getCharacterEquipmentSlots(character) {
        const species = character.species || this.defaultSpecies;
        return this.speciesEquipmentSlots[species] || this.speciesEquipmentSlots[this.defaultSpecies];
    }
    
    // Initialize equipment slots for a character
    initializeCharacterEquipment(character) {
        if (!character.species) {
            character.species = this.defaultSpecies;
        }
        
        if (!character.equipmentSlots) {
            character.equipmentSlots = {};
            const slots = this.getCharacterEquipmentSlots(character);
            Object.keys(slots).forEach(slotId => {
                character.equipmentSlots[slotId] = null; // null means no item equipped
            });
        }
        
        // Ensure legacy equipment array exists for compatibility
        if (!character.equipment) {
            character.equipment = [];
        }
    }
    
    // Stat bonus calculations
    calculateHealthBonus(character) {
        if (!character || typeof character.constitution !== 'number' || isNaN(character.constitution)) {
            return 0;
        }
        return (character.constitution - 5) * 7;
    }

    calculateSizeHealthBonus(character) {
        if (!character || typeof character.size !== 'number' || isNaN(character.size)) {
            return 0;
        }
        return (character.size - 5) * 7;
    }

    calculateManaBonus(character) {
        if (!character || typeof character.intelligence !== 'number' || typeof character.willpower !== 'number' || 
            isNaN(character.intelligence) || isNaN(character.willpower)) {
            return 0;
        }
        return Math.max(0, (character.intelligence + character.willpower - 10) * 2.5);
    }

    calculateDefenseBonus(character) {
        if (!character || typeof character.dexterity !== 'number' || typeof character.size !== 'number' || 
            isNaN(character.dexterity) || isNaN(character.size)) {
            return 0;
        }
        
        const dexBonus = (character.dexterity - 5) * 0.75;
        const sizeBonus = (5 - character.size) * 0.75;
        return dexBonus + sizeBonus;
    }

    calculateAttackBonus(attacker, weaponType = 'melee') {
        if (!attacker) return 0;
        
        let bonus = 0;
        
        switch(weaponType) {
            case 'melee':
                if (typeof attacker.strength === 'number' && !isNaN(attacker.strength)) {
                    bonus += (attacker.strength - 5) * 1.5;
                }
                bonus += this.calculateSizeAttackBonus(attacker);
                break;
            case 'ranged':
                if (typeof attacker.dexterity === 'number' && !isNaN(attacker.dexterity)) {
                    bonus += (attacker.dexterity - 5) * 1.5;
                }
                break;
            case 'arcane':
                if (typeof attacker.intelligence === 'number' && !isNaN(attacker.intelligence)) {
                    bonus += (attacker.intelligence - 5) * 1.5;
                }
                break;
            case 'divine':
                if (typeof attacker.willpower === 'number' && !isNaN(attacker.willpower)) {
                    bonus += (attacker.willpower - 5) * 1.5;
                }
                break;
        }
        
        if (weaponType !== 'melee') {
            return Math.max(0, bonus);
        }
        return bonus;
    }

    calculateSizeAttackBonus(character) {
        if (!character || typeof character.size !== 'number' || isNaN(character.size)) {
            return 0;
        }
        return (character.size - 5) * 1;
    }

    calculateCriticalHit(attacker) {
        if (!attacker || typeof attacker.dexterity !== 'number' || isNaN(attacker.dexterity)) {
            return { isCritical: false, multiplier: 1.0 };
        }
        
        const critChance = Math.min(30, attacker.dexterity * 2.5);
        const isCritical = Math.random() * 100 < critChance;
        
        if (isCritical) {
            const critMultiplier = Math.min(3.0, 1.5 + Math.max(0, (attacker.dexterity - 5) * 0.1));
            return { isCritical: true, multiplier: critMultiplier };
        }
        
        return { isCritical: false, multiplier: 1.0 };
    }
    
    // Apply stat bonuses to characters
    applyStatBonuses() {
        this.applyCharacterStatBonuses(this.gameState.hero);
        
        if (this.gameState.hero.underlings) {
            this.gameState.hero.underlings.forEach(underling => {
                this.applyCharacterStatBonuses(underling);
            });
        }
    }

    applyCharacterStatBonuses(character) {
        const currentHealthPercent = character.health / character.maxHealth;
        const currentManaPercent = character.mana / character.maxMana;
        
        let baseHealth = character.maxHealth;
        let baseMana = character.maxMana;
        
        if (character.statBonusesApplied) {
            baseHealth -= character.previousHealthBonus || 0;
            baseHealth -= character.previousSizeHealthBonus || 0;
            baseMana -= character.previousManaBonus || 0;
        }
        
        const healthBonus = this.calculateHealthBonus(character);
        const sizeHealthBonus = this.calculateSizeHealthBonus(character);
        const manaBonus = this.calculateManaBonus(character);
        
        const totalHealthBonus = healthBonus + sizeHealthBonus;
        const newMaxHealth = baseHealth + totalHealthBonus;
        const minimumHealth = 10;
        
        character.maxHealth = Math.max(minimumHealth, newMaxHealth);
        character.maxMana = Math.max(1, baseMana + manaBonus);
        
        character.health = Math.min(character.health, Math.floor(character.maxHealth * currentHealthPercent));
        character.mana = Math.min(character.mana, Math.floor(character.maxMana * currentManaPercent));
        
        character.statBonusesApplied = true;
        character.previousHealthBonus = healthBonus;
        character.previousSizeHealthBonus = sizeHealthBonus;
        character.previousManaBonus = manaBonus;
    }
    
    // Stat management
    ensureHeroStatsInitialized() {
        const hero = this.gameState.hero;
        
        // Initialize stats if missing
        if (hero.strength === undefined) hero.strength = 5;
        if (hero.dexterity === undefined) hero.dexterity = 5;
        if (hero.constitution === undefined) hero.constitution = 5;
        if (hero.intelligence === undefined) hero.intelligence = 5;
        if (hero.willpower === undefined) hero.willpower = 5;
        if (hero.size === undefined) hero.size = 5;
        if (hero.rations === undefined) hero.rations = 0;
        
        // Ensure stats are valid numbers
        hero.strength = Math.max(1, hero.strength || 5);
        hero.dexterity = Math.max(1, hero.dexterity || 5);
        hero.constitution = Math.max(1, hero.constitution || 5);
        hero.intelligence = Math.max(1, hero.intelligence || 5);
        hero.willpower = Math.max(1, hero.willpower || 5);
        hero.size = Math.max(1, hero.size || 5);
    }
    
    getStatUpgradeCost(currentValue) {
        const upgradeLevel = currentValue - 5; // Starting from 5
        return Math.floor(this.statConfig.baseCost * Math.pow(this.statConfig.costMultiplier, upgradeLevel));
    }
    
    canUpgradeStat(statName) {
        const hero = this.gameState.hero;
        const currentValue = hero[statName];
        
        if (currentValue >= this.statConfig.maxStatValue) {
            return { canUpgrade: false, reason: "Maximum stat value reached" };
        }
        
        const cost = this.getStatUpgradeCost(currentValue);
        if (hero.gold < cost) {
            return { canUpgrade: false, reason: `Insufficient gold (need ${cost})` };
        }
        
        return { canUpgrade: true, cost: cost };
    }
    
    upgradeStat(statName) {
        const hero = this.gameState.hero;
        const upgradeCheck = this.canUpgradeStat(statName);
        
        if (!upgradeCheck.canUpgrade) {
            this.ui.log(upgradeCheck.reason);
            this.ui.showNotification("Cannot upgrade stat!", "error");
            return false;
        }
        
        const cost = upgradeCheck.cost;
        const oldValue = hero[statName];
        
        // Confirm upgrade
        const confirmContent = `
            <div style="text-align: center;">
                <h4>Upgrade ${statName.charAt(0).toUpperCase() + statName.slice(1)}</h4>
                <p>Cost: <span style="color: #ffd93d;">${cost} gold</span></p>
                <p>Current value: <span style="color: #51cf66;">${oldValue}</span></p>
                <p>New value: <span style="color: #51cf66;">${oldValue + 1}</span></p>
                <div style="margin: 15px 0; padding: 10px; background: #2a2a3a; border-radius: 5px;">
                    <p style="color: #d4af37; font-size: 12px; margin: 0;">${this.statConfig.statDescriptions[statName]}</p>
                </div>
                <p style="color: #d4af37; font-weight: bold;">Upgrade this stat?</p>
            </div>
        `;
        
        this.ui.createModal("Stat Upgrade", confirmContent, [
            {
                text: "Confirm Upgrade",
                onClick: () => this.confirmStatUpgrade(statName, cost)
            },
            {
                text: "Cancel",
                onClick: () => {}
            }
        ]);
        
        return true;
    }
    
    confirmStatUpgrade(statName, cost) {
        const hero = this.gameState.hero;
        const oldValue = hero[statName];
        
        hero.gold -= cost;
        hero[statName] += 1;
        
        // Apply new stat bonuses
        this.applyStatBonuses();
        
        this.ui.log(`${statName.charAt(0).toUpperCase() + statName.slice(1)} upgraded from ${oldValue} to ${hero[statName]}!`);
        this.ui.showNotification(`${statName} upgraded to ${hero[statName]}!`, "success");
        
        // Refresh character management if open
        setTimeout(() => {
            const modals = document.querySelectorAll('.modal-overlay');
            modals.forEach(modal => modal.remove());
            this.openCharacterManagement();
        }, 100);
    }
    
    // Leadership management
    upgradeLeadership() {
        const currentLeadership = this.gameState.hero.leadership;
        const cost = Math.pow(currentLeadership + 1, 2) * 10;
        
        if (this.gameState.hero.gold < cost) {
            this.ui.log(`Need ${cost} gold to upgrade leadership to ${currentLeadership + 1}. You have ${this.gameState.hero.gold} gold.`);
            this.ui.showNotification("Insufficient gold for leadership upgrade!", "error");
            return;
        }
        
        const confirmContent = `
            <div style="text-align: center;">
                <h4>Upgrade Leadership</h4>
                <p>Cost: <span style="color: #ffd93d;">${cost} gold</span></p>
                <p>Current leadership: <span style="color: #51cf66;">${currentLeadership}</span></p>
                <p>New leadership: <span style="color: #51cf66;">${currentLeadership + 1}</span></p>
                <p>This will allow you to recruit more underlings.</p>
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
                onClick: () => {}
            }
        ]);
    }
    
    confirmLeadershipUpgrade(cost) {
        const oldLeadership = this.gameState.hero.leadership;
        this.gameState.hero.gold -= cost;
        this.gameState.hero.leadership += 1;
        
        this.ui.log(`Leadership upgraded from ${oldLeadership} to ${this.gameState.hero.leadership}!`);
        this.ui.showNotification(`Leadership upgraded to ${this.gameState.hero.leadership}!`, "success");
        
        // Refresh character management
        setTimeout(() => {
            const modals = document.querySelectorAll('.modal-overlay');
            modals.forEach(modal => modal.remove());
            this.openCharacterManagement();
        }, 100);
    }
    
    // Character management UI
    openCharacterManagement() {
        this.ensureHeroStatsInitialized();
        
        const hero = this.gameState.hero;
        const equippedStats = this.gameController.inventoryManager ? 
            this.gameController.inventoryManager.calculateEquippedStats() : 
            this.gameController.calculateEquippedStats();
        
        let characterContent = `
            <div style="display: flex; gap: 25px; max-width: 1200px; margin: 0 auto; align-items: flex-start; justify-content: center; padding-top: 10px;">
                <div style="flex: 1; min-width: 450px;">
                    <h4 style="text-align: center; color: #d4af37; margin-bottom: 15px;">Hero: ${hero.name}</h4>
                    
                    <!-- Basic Info -->
                    <div style="background: #1a1a1a; padding: 15px; border-radius: 8px; margin: 10px 0;">
                        <p><strong>Level:</strong> ${hero.level}</p>
                        <p><strong>Gold:</strong> ${hero.gold}</p>
                        <p><strong>Fame:</strong> ${hero.fame}</p>
                        <p><strong>Health:</strong> ${hero.health}/${hero.maxHealth}</p>
                        <p><strong>Mana:</strong> ${hero.mana}/${hero.maxMana}</p>
                        <p><strong>Leadership:</strong> ${hero.leadership}</p>
                        <p style="font-size: 12px; color: #aaa; margin-left: 20px;">Next upgrade cost: ${Math.pow(hero.leadership + 1, 2) * 10} gold</p>
                    </div>
                    
                    <!-- Combat Stats -->
                    <div style="background: #1a1a1a; padding: 15px; border-radius: 8px; margin: 10px 0;">
                        <p><strong>Base Stats + Equipment:</strong></p>
                        <p>Attack: ${10 + (hero.level * 2)} + ${equippedStats.attack} = ${10 + (hero.level * 2) + equippedStats.attack}</p>
                        <p>Defense: ${5 + hero.level} + ${equippedStats.defense} + ${this.calculateDefenseBonus(hero).toFixed(1)} = ${(5 + hero.level + equippedStats.defense + this.calculateDefenseBonus(hero)).toFixed(1)} (Base + Equipment + DEX/SIZE bonuses)</p>
                        <p>Max Underlings: ${hero.leadership}</p>
                    </div>
                    
                    <!-- Character Stats -->
                    <div style="background: #1a1a1a; padding: 15px; border-radius: 8px; margin: 10px 0;">
                        <h5 style="color: #4ecdc4; text-align: center; margin-bottom: 15px;">Character Stats</h5>
                        ${this.generateStatUpgradeHTML('strength', hero.strength)}
                        ${this.generateStatUpgradeHTML('dexterity', hero.dexterity)}
                        ${this.generateStatUpgradeHTML('constitution', hero.constitution)}
                        ${this.generateStatUpgradeHTML('intelligence', hero.intelligence)}
                        ${this.generateStatUpgradeHTML('willpower', hero.willpower)}
                        ${this.generateStatUpgradeHTML('size', hero.size)}
                    </div>
                </div>
                
                <!-- Underlings Section -->
                <div style="flex: 1; min-width: 350px;">
                    <h4 style="text-align: center; color: #d4af37; margin-bottom: 15px;">Underlings (${hero.underlings.length})</h4>
                    <div style="max-height: 600px; overflow-y: auto;">
                        ${hero.underlings.length > 0 ? 
                            hero.underlings.map((underling, index) => `
                                <div style="background: #1a1a1a; padding: 12px; margin: 8px 0; border-radius: 8px;">
                                    <h5 style="color: #4ecdc4; margin-bottom: 8px;">${underling.name} (${underling.type})</h5>
                                    <p><strong>Level:</strong> ${underling.level}</p>
                                    <p><strong>Health:</strong> ${underling.health}/${underling.maxHealth}</p>
                                    <p><strong>Mana:</strong> ${underling.mana}/${underling.maxMana}</p>
                                    <p><strong>Attack:</strong> ${underling.attack} | <strong>Defense:</strong> ${underling.defense}</p>
                                    <div style="font-size: 11px; color: #bbb; margin-top: 8px;">
                                        <strong>Stats:</strong> STR: ${underling.strength || 5}, DEX: ${underling.dexterity || 5}, CON: ${underling.constitution || 5}, INT: ${underling.intelligence || 5}, WIL: ${underling.willpower || 5}, SIZ: ${underling.size || 5}
                                    </div>
                                    <button onclick="window.game.characterManager.manageUnderling(${index})" 
                                            style="margin-top: 8px; padding: 4px 12px; background: #2a2a2a; border: 1px solid #555; color: white; border-radius: 4px; cursor: pointer;">
                                        Manage
                                    </button>
                                </div>
                            `).join('') : 
                            '<p style="color: #888; text-align: center; padding: 20px;">No underlings recruited</p>'
                        }
                    </div>
                </div>
            </div>
        `;

        const characterButtons = [
            {
                text: "Upgrade Leadership",
                onClick: () => this.upgradeLeadership()
            },
            {
                text: "Close",
                onClick: () => {
                    const modal = document.querySelector('.docked-modal');
                    if (modal) modal.remove();
                }
            }
        ];

        this.gameController.createDockedModal("Character Management", characterContent, characterButtons);
    }
    
    generateStatUpgradeHTML(statName, currentValue) {
        const upgradeCheck = this.canUpgradeStat(statName);
        const displayName = statName.charAt(0).toUpperCase() + statName.slice(1);
        
        return `
            <div style="display: flex; justify-content: space-between; align-items: center; margin: 8px 0; padding: 8px; background: #2a2a2a; border-radius: 5px;">
                <div style="flex: 1;">
                    <strong style="color: #d4af37;">${displayName}:</strong> 
                    <span style="color: #51cf66;">${currentValue}</span>
                    <div style="font-size: 10px; color: #aaa; margin-top: 2px;">
                        ${this.statConfig.statDescriptions[statName]}
                    </div>
                </div>
                <div>
                    ${upgradeCheck.canUpgrade ? `
                        <button onclick="window.game.characterManager.upgradeStat('${statName}')" 
                                style="padding: 4px 8px; background: #2a4d3a; border: 1px solid #51cf66; color: white; border-radius: 3px; cursor: pointer; font-size: 10px;">
                            +1 (${upgradeCheck.cost}g)
                        </button>
                    ` : `
                        <span style="color: #888; font-size: 10px;">${upgradeCheck.reason}</span>
                    `}
                </div>
            </div>
        `;
    }
    
    // Underling management
    manageUnderling(underlingIndex) {
        const underling = this.gameState.hero.underlings[underlingIndex];
        if (!underling) return;
        
        const underlingContent = `
            <div style="text-align: center;">
                <h4 style="color: #4ecdc4;">${underling.name}</h4>
                <p><strong>Type:</strong> ${underling.type}</p>
                <p><strong>Level:</strong> ${underling.level}</p>
                <p><strong>Health:</strong> ${underling.health}/${underling.maxHealth}</p>
                <p><strong>Mana:</strong> ${underling.mana}/${underling.maxMana}</p>
                <p><strong>Attack:</strong> ${underling.attack} | <strong>Defense:</strong> ${underling.defense}</p>
                <hr style="margin: 15px 0; border-color: #444;">
                <p><strong>Stats:</strong></p>
                <p>STR: ${underling.strength || 5} | DEX: ${underling.dexterity || 5} | CON: ${underling.constitution || 5}</p>
                <p>INT: ${underling.intelligence || 5} | WIL: ${underling.willpower || 5} | SIZ: ${underling.size || 5}</p>
                ${!underling.isAlive ? '<p style="color: #ff6b6b; font-weight: bold;">⚰️ FALLEN - Needs Resurrection</p>' : ''}
            </div>
        `;
        
        const underlingButtons = [
            {
                text: "Equipment",
                onClick: () => this.gameController.manageUnderlingEquipment ? 
                    this.gameController.manageUnderlingEquipment() : 
                    this.ui.log("Equipment management not available")
            },
            {
                text: "Close",
                onClick: () => {}
            }
        ];
        
        if (!underling.isAlive) {
            underlingButtons.unshift({
                text: "Resurrect (500 gold)",
                onClick: () => this.resurrectUnderling(underlingIndex)
            });
        }
        
        this.ui.createModal(`${underling.name} - Details`, underlingContent, underlingButtons);
    }
    
    resurrectUnderling(underlingIndex) {
        const underling = this.gameState.hero.underlings[underlingIndex];
        const cost = 500;
        
        if (this.gameState.hero.gold < cost) {
            this.ui.log(`Need ${cost} gold to resurrect ${underling.name}.`);
            this.ui.showNotification("Insufficient gold for resurrection!", "error");
            return;
        }
        
        this.gameState.hero.gold -= cost;
        underling.isAlive = true;
        underling.health = Math.floor(underling.maxHealth * 0.5); // Revive at 50% health
        
        this.ui.log(`${underling.name} has been resurrected!`);
        this.ui.showNotification(`${underling.name} resurrected!`, "success");
        
        // Refresh underling management
        setTimeout(() => {
            const modals = document.querySelectorAll('.modal-overlay');
            modals.forEach(modal => modal.remove());
            this.manageUnderling(underlingIndex);
        }, 100);
    }
}

// Export for use in main game file
window.CharacterManager = CharacterManager;
