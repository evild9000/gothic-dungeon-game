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
            statDescriptions: {
                strength: "Increases melee weapon damage and stamina",
                dexterity: "Increases critical hit chance, critical damage, defense, and stamina",
                constitution: "Increases health points and stamina", 
                intelligence: "Increases mana and arcane spell damage",
                willpower: "Increases mana, divine spell damage, and magic resistance",
                size: "Affects health, melee damage, and defense (larger = more HP/damage but less defense, smaller = less HP/damage but more defense)"
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
    
    // Character management UI
    openCharacterManagement() {
        this.ensureHeroStatsInitialized();
        
        const hero = this.gameState.hero;
        const equippedStats = this.gameController.inventoryManager ? 
            this.gameController.inventoryManager.calculateEquippedStats() : 
            { attack: 0, defense: 0 };
        
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
                        <p><strong>Stamina:</strong> ${hero.stamina || 0}/${hero.maxStamina || 100}</p>
                        <p><strong>Leadership:</strong> ${hero.leadership}</p>
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
                        ${this.generateStatDisplayHTML('strength', hero.strength)}
                        ${this.generateStatDisplayHTML('dexterity', hero.dexterity)}
                        ${this.generateStatDisplayHTML('constitution', hero.constitution)}
                        ${this.generateStatDisplayHTML('intelligence', hero.intelligence)}
                        ${this.generateStatDisplayHTML('willpower', hero.willpower)}
                        ${this.generateStatDisplayHTML('size', hero.size)}
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
                                    <p><strong>Stamina:</strong> ${underling.stamina || 0}/${underling.maxStamina || 100}</p>
                                    <p><strong>Attack:</strong> ${underling.attack} | <strong>Defense:</strong> ${underling.defense}</p>
                                    <div style="font-size: 11px; color: #bbb; margin-top: 8px;">
                                        <strong>Stats:</strong> STR: ${underling.strength || 5}, DEX: ${underling.dexterity || 5}, CON: ${underling.constitution || 5}, INT: ${underling.intelligence || 5}, WIL: ${underling.willpower || 5}, SIZ: ${underling.size || 5}
                                    </div>
                                    <button onclick="window.game.controller.manageUnderling(${index})" 
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

        const characterButtons = [];
        
        // Add leadership upgrade button if possible
        if (hero.leadership < hero.level) {
            const nextLeadershipLevel = hero.leadership + 1;
            const cost = nextLeadershipLevel * nextLeadershipLevel * 10;
            const canAfford = hero.gold >= cost;
            
            characterButtons.push({
                text: `${canAfford ? '💰' : '❌'} Upgrade Leadership (${hero.leadership} → ${nextLeadershipLevel}) - ${cost}g`,
                onClick: () => this.upgradeLeadership()
            });
        }
        
        characterButtons.push({
            text: "Close",
            onClick: () => {
                const modal = document.querySelector('.docked-modal');
                if (modal) modal.remove();
            }
        });

        // Create wider modal for character management
        this.createCharacterModal("Character Management", characterContent, characterButtons);
    }

    createCharacterModal(title, content, buttons = []) {
        // Remove any existing modals
        const existingModals = document.querySelectorAll('.docked-modal');
        existingModals.forEach(modal => modal.remove());
        
        const modal = document.createElement('div');
        modal.className = 'docked-modal character-modal';
        
        // Responsive sizing - character management needs more space
        const isMobile = window.innerWidth <= 768;
        
        modal.style.cssText = `
            position: fixed;
            top: ${isMobile ? '10px' : '30px'};
            left: ${isMobile ? '10px' : '30px'};
            width: ${isMobile ? 'calc(100vw - 20px)' : '900px'};
            max-width: ${isMobile ? 'none' : '97vw'};
            max-height: ${isMobile ? 'calc(100vh - 20px)' : 'calc(100vh - 60px)'};
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f1419 100%);
            border: 2px solid #4a5568;
            border-radius: 12px;
            box-shadow: 0 20px 50px rgba(0, 0, 0, 0.8);
            z-index: 9999;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            font-family: 'Cinzel', serif;
        `;
        
        // Modal header
        const header = document.createElement('div');
        header.style.cssText = `
            background: linear-gradient(90deg, #2d3748, #4a5568);
            color: #f7fafc;
            padding: ${isMobile ? '12px' : '16px'};
            font-size: ${isMobile ? '16px' : '18px'};
            font-weight: bold;
            border-bottom: 1px solid #4a5568;
            display: flex;
            justify-content: space-between;
            align-items: center;
        `;
        
        const titleElement = document.createElement('span');
        titleElement.textContent = title;
        titleElement.style.color = '#d4af37';
        
        const closeButton = document.createElement('button');
        closeButton.innerHTML = '✕';
        closeButton.style.cssText = `
            background: none;
            border: none;
            color: #f7fafc;
            font-size: ${isMobile ? '18px' : '20px'};
            cursor: pointer;
            padding: 4px 8px;
            border-radius: 4px;
            transition: background-color 0.2s;
        `;
        closeButton.onmouseover = () => closeButton.style.backgroundColor = '#e53e3e';
        closeButton.onmouseout = () => closeButton.style.backgroundColor = 'transparent';
        closeButton.onclick = () => modal.remove();
        
        header.appendChild(titleElement);
        header.appendChild(closeButton);
        
        // Modal content
        const contentDiv = document.createElement('div');
        contentDiv.style.cssText = `
            flex: 1;
            overflow-y: auto;
            overflow-x: auto;
            padding: ${isMobile ? '12px' : '20px'};
            color: #f7fafc;
        `;
        contentDiv.innerHTML = content;
        
        // Modal footer with buttons
        if (buttons.length > 0) {
            const footer = document.createElement('div');
            footer.style.cssText = `
                background: linear-gradient(90deg, #2d3748, #4a5568);
                padding: ${isMobile ? '12px' : '16px'};
                border-top: 1px solid #4a5568;
                display: flex;
                gap: ${isMobile ? '8px' : '12px'};
                flex-wrap: wrap;
                justify-content: flex-end;
            `;
            
            buttons.forEach(button => {
                const btn = document.createElement('button');
                btn.textContent = button.text;
                btn.style.cssText = `
                    padding: ${isMobile ? '8px 12px' : '10px 16px'};
                    background: linear-gradient(45deg, #2a4d3a, #4a7c59);
                    border: 1px solid #51cf66;
                    color: white;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: ${isMobile ? '12px' : '14px'};
                    font-weight: bold;
                    transition: all 0.2s;
                    font-family: 'Cinzel', serif;
                `;
                btn.onmouseover = () => {
                    btn.style.background = 'linear-gradient(45deg, #4a7c59, #6aa76a)';
                    btn.style.transform = 'translateY(-1px)';
                };
                btn.onmouseout = () => {
                    btn.style.background = 'linear-gradient(45deg, #2a4d3a, #4a7c59)';
                    btn.style.transform = 'translateY(0)';
                };
                btn.onclick = button.onClick;
                footer.appendChild(btn);
            });
            
            modal.appendChild(header);
            modal.appendChild(contentDiv);
            modal.appendChild(footer);
        } else {
            modal.appendChild(header);
            modal.appendChild(contentDiv);
        }
        
        document.body.appendChild(modal);
        return modal;
    }
    
    generateStatDisplayHTML(statName, currentValue) {
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
            </div>
        `;
    }
    
    // Underling management
    manageUnderling(underlingIndex) {
        const underling = this.gameState.hero.underlings[underlingIndex];
        if (!underling) return;
        
        // Initialize equipment slots for underling
        this.initializeCharacterEquipment(underling);
        
        const isMobile = window.innerWidth <= 768;
        
        const underlingContent = `
            <div style="display: ${isMobile ? 'block' : 'flex'}; gap: ${isMobile ? '15px' : '25px'}; max-width: 1200px; margin: 0 auto; align-items: flex-start; justify-content: center; padding-top: 10px;">
                <!-- Underling Info and Stats -->
                <div style="flex: 1; min-width: ${isMobile ? 'auto' : '400px'}; margin-bottom: ${isMobile ? '20px' : '0'};">
                    <h4 style="text-align: center; color: #4ecdc4; margin-bottom: 15px;">${underling.name} (${underling.type})</h4>
                    
                    <!-- Basic Info -->
                    <div style="background: #1a1a1a; padding: 15px; border-radius: 8px; margin: 10px 0;">
                        <p><strong>Level:</strong> ${underling.level}</p>
                        <p><strong>Health:</strong> ${underling.health}/${underling.maxHealth}</p>
                        <p><strong>Mana:</strong> ${underling.mana}/${underling.maxMana}</p>
                        <p><strong>Stamina:</strong> ${underling.stamina || 0}/${underling.maxStamina || 100}</p>
                        <p><strong>Attack:</strong> ${underling.attack} | <strong>Defense:</strong> ${underling.defense}</p>
                        ${!underling.isAlive ? '<p style="color: #ff6b6b; font-weight: bold;">⚰️ FALLEN - Needs Resurrection</p>' : ''}
                    </div>
                    
                    <!-- Character Stats -->
                    <div style="background: #1a1a1a; padding: 15px; border-radius: 8px; margin: 10px 0;">
                        <h5 style="color: #4ecdc4; text-align: center; margin-bottom: 15px;">Character Stats</h5>
                        ${this.generateStatDisplayHTML('strength', underling.strength || 5)}
                        ${this.generateStatDisplayHTML('dexterity', underling.dexterity || 5)}
                        ${this.generateStatDisplayHTML('constitution', underling.constitution || 5)}
                        ${this.generateStatDisplayHTML('intelligence', underling.intelligence || 5)}
                        ${this.generateStatDisplayHTML('willpower', underling.willpower || 5)}
                        ${this.generateStatDisplayHTML('size', underling.size || 5)}
                    </div>
                    
                    <!-- Level Up Section -->
                    <div style="background: #1a1a1a; padding: 15px; border-radius: 8px; margin: 10px 0;">
                        <h5 style="color: #d4af37; text-align: center; margin-bottom: 15px;">⭐ Character Advancement</h5>
                        ${this.generateLevelUpHTML(underling, underlingIndex)}
                    </div>
                </div>
            </div>
            
            <div style="text-align: center; margin-top: 20px;">
                <p style="color: #aaa; font-size: 12px;">
                    💡 Equipment and gear management is available in the Inventory area.
                </p>
            </div>
        `;
        
        const underlingButtons = [];
        
        if (!underling.isAlive) {
            underlingButtons.push({
                text: "Resurrect (500 gold)",
                onClick: () => this.resurrectUnderling(underlingIndex)
            });
        }
        
        underlingButtons.push({
            text: "Back to Character Management", 
            onClick: () => {
                const modal = document.querySelector('.docked-modal');
                if (modal) modal.remove();
                this.openCharacterManagement();
            }
        });
        
        underlingButtons.push({
            text: "Close",
            onClick: () => {
                const modal = document.querySelector('.docked-modal');
                if (modal) modal.remove();
            }
        });
        
        this.createCharacterModal(`${underling.name} - Management`, underlingContent, underlingButtons);
    }
    
    generateUnderlingEquipmentSlotsHTML(underling) {
        const slots = this.getCharacterEquipmentSlots(underling);
        const isMobile = window.innerWidth <= 768;
        
        let html = `<div style="display: grid; grid-template-columns: ${isMobile ? '1fr 1fr' : '1fr 1fr 1fr'}; gap: 8px; background: #1a1a2e; padding: 12px; border-radius: 8px; border: 1px solid #4a5568;">`;
        
        Object.entries(slots).forEach(([slotId, slotInfo]) => {
            const equippedItem = underling.equipmentSlots[slotId];
            const isEmpty = !equippedItem;
            
            html += `
                <div style="
                    background: ${isEmpty ? '#2a2a3a' : '#0a3a0a'};
                    border: 2px solid ${isEmpty ? '#4a5568' : '#51cf66'};
                    border-radius: 6px;
                    padding: 8px;
                    text-align: center;
                    cursor: ${isEmpty ? 'default' : 'pointer'};
                    transition: all 0.2s;
                    min-height: 60px;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                " onclick="${!isEmpty ? `window.game.characterManager.unequipUnderlingItem('${underling.id}', '${slotId}')` : ''}" onmouseover="this.style.background='${isEmpty ? '#3a3a4a' : '#1a4a1a'}'" onmouseout="this.style.background='${isEmpty ? '#2a2a3a' : '#0a3a0a'}'">
                    <div style="font-size: 16px; margin-bottom: 2px;">${slotInfo.icon}</div>
                    <div style="font-size: 10px; color: #d4af37; font-weight: bold; margin-bottom: 2px;">${slotInfo.name}</div>
                    ${isEmpty ? 
                        `<div style="font-size: 8px; color: #888; font-style: italic;">Empty</div>` :
                        `<div style="font-size: 9px; color: #51cf66; font-weight: bold; text-align: center; line-height: 1.2;">
                            ${equippedItem.name}
                            ${equippedItem.stats ? Object.entries(equippedItem.stats).map(([stat, value]) => 
                                `<br><span style="color: #ffd93d;">+${value} ${stat}</span>`).join('') : ''}
                            <br><span style="color: #ff6b6b; font-size: 8px; cursor: pointer;">Click to unequip</span>
                        </div>`
                    }
                </div>
            `;
        });
        
        html += `</div>`;
        return html;
    }
    
    generateAvailableEquipmentHTML(underling, underlingIndex) {
        // Get all unequipped items from hero's inventory and equipment
        const availableItems = [...this.gameState.hero.inventory, ...this.gameState.hero.equipment.filter(item => !item.equipped)];
        const compatibleItems = availableItems.filter(item => 
            item.type === 'weapon' || item.type === 'armor' || item.type === 'accessory' || item.type === 'consumable'
        );
        
        if (compatibleItems.length === 0) {
            return '<p style="color: #888; text-align: center; padding: 20px;">No equipment available to give to this underling</p>';
        }
        
        return `
            <div style="max-height: 300px; overflow-y: auto; background: #1a1a2e; padding: 10px; border-radius: 8px; border: 1px solid #4a5568;">
                ${compatibleItems.map((item, itemIndex) => `
                    <div style="background: #1a1a1a; padding: 8px; margin: 5px 0; border-radius: 5px; display: flex; justify-content: space-between; align-items: center;">
                        <div style="flex: 1;">
                            <strong style="color: #d4af37;">${item.name}</strong>
                            <div style="font-size: 11px; color: #aaa;">${item.type || 'Item'}</div>
                            ${item.stats ? Object.entries(item.stats).map(([stat, value]) => 
                                `<small style="color: #51cf66;">+${value} ${stat}</small>`).join(' | ') : ''}
                            ${item.effects ? Object.entries(item.effects).map(([effect, value]) => 
                                `<small style="color: #ffd93d;">${effect}: ${value}</small>`).join(' | ') : ''}
                        </div>
                        <div style="display: flex; gap: 5px;">
                            ${item.type !== 'consumable' ? `
                                <button onclick="window.game.characterManager.equipItemToUnderling(${underlingIndex}, ${availableItems.indexOf(item)})" 
                                        style="padding: 2px 8px; background: #2a4d3a; border: 1px solid #51cf66; color: white; border-radius: 3px; cursor: pointer; font-size: 10px;">
                                    Equip
                                </button>
                            ` : `
                                <button onclick="window.game.characterManager.giveConsumableToUnderling(${underlingIndex}, ${availableItems.indexOf(item)})" 
                                        style="padding: 2px 8px; background: #4a4a2d; border: 1px solid #ffd93d; color: white; border-radius: 3px; cursor: pointer; font-size: 10px;">
                                    Give
                                </button>
                            `}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    // Equipment management methods for underlings
    equipItemToUnderling(underlingIndex, itemIndex) {
        const underling = this.gameState.hero.underlings[underlingIndex];
        if (!underling) return;
        
        const availableItems = [...this.gameState.hero.inventory, ...this.gameState.hero.equipment.filter(item => !item.equipped)];
        const item = availableItems[itemIndex];
        if (!item) return;
        
        // Use inventory manager's equipment system
        if (this.gameController.inventoryManager.equipItemToSlot(item, underling)) {
            // Remove from hero's inventory/equipment
            const heroInventoryIndex = this.gameState.hero.inventory.indexOf(item);
            const heroEquipmentIndex = this.gameState.hero.equipment.indexOf(item);
            
            if (heroInventoryIndex > -1) {
                this.gameState.hero.inventory.splice(heroInventoryIndex, 1);
            } else if (heroEquipmentIndex > -1) {
                this.gameState.hero.equipment.splice(heroEquipmentIndex, 1);
            }
            
            this.ui.log(`${underling.name} equipped ${item.name}!`);
            this.ui.showNotification(`${underling.name} equipped ${item.name}!`, "success");
            
            // Refresh the underling management screen
            setTimeout(() => {
                this.manageUnderling(underlingIndex);
            }, 100);
        }
    }
    
    unequipUnderlingItem(underlingId, slotId) {
        const underling = this.gameState.hero.underlings.find(u => u.id.toString() === underlingId.toString());
        if (!underling || !underling.equipmentSlots[slotId]) return;
        
        const item = underling.equipmentSlots[slotId];
        
        // Unequip the item
        underling.equipmentSlots[slotId] = null;
        item.equipped = false;
        item.equippedSlot = null;
        
        // Return to hero's inventory
        this.gameState.hero.inventory.push(item);
        
        this.ui.log(`${underling.name} unequipped ${item.name}!`);
        this.ui.showNotification(`${item.name} returned to inventory!`, "info");
        
        // Refresh the underling management screen
        const underlingIndex = this.gameState.hero.underlings.indexOf(underling);
        setTimeout(() => {
            this.manageUnderling(underlingIndex);
        }, 100);
    }
    
    giveConsumableToUnderling(underlingIndex, itemIndex) {
        const underling = this.gameState.hero.underlings[underlingIndex];
        if (!underling) return;
        
        const availableItems = [...this.gameState.hero.inventory, ...this.gameState.hero.equipment.filter(item => !item.equipped)];
        const item = availableItems[itemIndex];
        if (!item || item.type !== 'consumable') return;
        
        // Use the consumable on the underling
        if (item.effect === 'heal') {
            const healAmount = Math.min(item.value, underling.maxHealth - underling.health);
            underling.health = Math.min(underling.health + item.value, underling.maxHealth);
            this.ui.log(`${underling.name} used ${item.name}! Restored ${healAmount} health.`);
        } else if (item.effect === 'mana') {
            const manaAmount = Math.min(item.value, underling.maxMana - underling.mana);
            underling.mana = Math.min(underling.mana + item.value, underling.maxMana);
            this.ui.log(`${underling.name} used ${item.name}! Restored ${manaAmount} mana.`);
        } else {
            this.ui.log(`${underling.name} used ${item.name}!`);
        }
        
        // Remove the consumable from inventory
        const heroInventoryIndex = this.gameState.hero.inventory.indexOf(item);
        const heroEquipmentIndex = this.gameState.hero.equipment.indexOf(item);
        
        if (heroInventoryIndex > -1) {
            this.gameState.hero.inventory.splice(heroInventoryIndex, 1);
        } else if (heroEquipmentIndex > -1) {
            this.gameState.hero.equipment.splice(heroEquipmentIndex, 1);
        }
        
        this.ui.showNotification(`${underling.name} used ${item.name}!`, "success");
        
        // Refresh the underling management screen
        setTimeout(() => {
            this.manageUnderling(underlingIndex);
        }, 100);
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

    upgradeLeadership() {
        const hero = this.gameState.hero;
        const nextLeadershipLevel = hero.leadership + 1;
        
        // Check if leadership can exceed level
        if (nextLeadershipLevel > hero.level) {
            this.ui.log("Leadership cannot exceed your character level!");
            this.ui.showNotification("Leadership limited by character level!", "error");
            return;
        }
        
        // Calculate cost: (level to increase to)^2 * 10
        const cost = nextLeadershipLevel * nextLeadershipLevel * 10;
        
        if (hero.gold < cost) {
            this.ui.log(`Not enough gold! Need ${cost} gold to upgrade leadership to ${nextLeadershipLevel}.`);
            this.ui.showNotification("Insufficient gold for leadership upgrade!", "error");
            return;
        }
        
        // Show confirmation modal
        const confirmContent = `
            <div style="text-align: center; color: #e6ccff;">
                <h3 style="color: #d4af37; margin-bottom: 15px;">💼 Leadership Upgrade 💼</h3>
                <p style="margin-bottom: 15px;">Upgrade your leadership from <strong>${hero.leadership}</strong> to <strong>${nextLeadershipLevel}</strong>?</p>
                <div style="background: #2a2a3a; padding: 15px; border-radius: 8px; margin: 15px 0;">
                    <p><strong>Cost:</strong> <span style="color: #ffd93d;">${cost} gold</span></p>
                    <p><strong>Your Gold:</strong> <span style="color: #51cf66;">${hero.gold} gold</span></p>
                    <p><strong>Benefits:</strong> <span style="color: #51cf66;">Can recruit ${nextLeadershipLevel} underlings (currently ${hero.leadership})</span></p>
                </div>
                <div style="background: #1a3a1a; padding: 10px; border-radius: 8px; border-left: 3px solid #51cf66;">
                    <small style="color: #51cf66;">💡 Leadership cost formula: (target level)² × 10 gold</small>
                </div>
            </div>
        `;
        
        this.ui.createModal("Leadership Upgrade", confirmContent, [
            {
                text: `Upgrade for ${cost}g`,
                onClick: () => this.confirmLeadershipUpgrade(cost)
            },
            {
                text: "Cancel",
                onClick: () => {
                    const modals = document.querySelectorAll('.modal-overlay');
                    modals.forEach(modal => modal.remove());
                }
            }
        ]);
    }

    confirmLeadershipUpgrade(cost) {
        const hero = this.gameState.hero;
        
        if (hero.gold < cost) {
            this.ui.log("Not enough gold!");
            this.ui.showNotification("Insufficient gold!", "error");
            return;
        }
        
        hero.gold -= cost;
        hero.leadership++;
        
        this.ui.log(`Leadership upgraded to ${hero.leadership}! You can now recruit up to ${hero.leadership} underlings.`);
        this.ui.showNotification(`Leadership upgraded to ${hero.leadership}!`, "success");
        this.ui.render();
        
        // Close modal and refresh character management
        const modals = document.querySelectorAll('.modal-overlay');
        modals.forEach(modal => modal.remove());
        
        setTimeout(() => {
            this.openCharacterManagement();
        }, 100);
    }
    
    // Generate level up HTML for underlings
    generateLevelUpHTML(underling, underlingIndex) {
        const levelUpCost = this.calculateLevelUpCost(underling.level);
        const canAfford = this.gameState.hero.gold >= levelUpCost;
        const isMaxLevel = underling.level >= 10; // Assuming max level 10
        const isLevelCapReached = underling.level >= this.gameState.hero.level; // Cannot exceed hero level
        
        if (isMaxLevel) {
            return `
                <div style="text-align: center; color: #d4af37;">
                    <p><strong>Maximum Level Reached!</strong></p>
                    <p>🏆 This underling has reached their full potential.</p>
                </div>
            `;
        }
        
        if (isLevelCapReached) {
            return `
                <div style="text-align: center; color: #ff6b6b;">
                    <p><strong>Level Cap Reached!</strong></p>
                    <p>🚫 Underlings cannot exceed the Hero's level (${this.gameState.hero.level}).</p>
                    <p>Level up your Hero first to unlock further advancement.</p>
                </div>
            `;
        }
        
        const canLevelUp = canAfford && !isLevelCapReached && !isMaxLevel;
        
        return `
            <div style="text-align: center;">
                <p><strong>Current Level:</strong> ${underling.level}</p>
                <p><strong>Level Up Cost:</strong> ${levelUpCost} gold</p>
                <p style="color: ${canAfford ? '#4ecdc4' : '#ff6b6b'};">
                    <strong>Available Gold:</strong> ${this.gameState.hero.gold}
                </p>
                <button 
                    onclick="window.game.controller.characterManager.levelUpUnderling(${underlingIndex})" 
                    style="
                        padding: 8px 16px;
                        background: ${canLevelUp ? 'linear-gradient(135deg, #d4af37, #f1c40f)' : '#666'};
                        color: ${canLevelUp ? '#000' : '#ccc'};
                        border: none;
                        border-radius: 5px;
                        cursor: ${canLevelUp ? 'pointer' : 'not-allowed'};
                        font-weight: bold;
                        font-size: 14px;
                        margin-top: 10px;
                    "
                    ${!canLevelUp ? 'disabled' : ''}
                >
                    ⭐ Level Up (${levelUpCost}g)
                </button>
            </div>
        `;
    }
    
    // Calculate level up cost
    calculateLevelUpCost(currentLevel) {
        return Math.floor(100 * Math.pow(1.5, currentLevel - 1));
    }
    
    // Level up an underling
    levelUpUnderling(underlingIndex) {
        const underling = this.gameState.hero.underlings[underlingIndex];
        if (!underling) {
            this.ui.showNotification("Underling not found!", "error");
            return;
        }
        
        const levelUpCost = this.calculateLevelUpCost(underling.level);
        const isMaxLevel = underling.level >= 10;
        const isLevelCapReached = underling.level >= this.gameState.hero.level;
        
        if (isMaxLevel) {
            this.ui.showNotification(`${underling.name} is already at maximum level!`, "error");
            return;
        }
        
        if (isLevelCapReached) {
            this.ui.showNotification(`${underling.name} cannot exceed Hero's level (${this.gameState.hero.level})!`, "error");
            return;
        }
        
        if (this.gameState.hero.gold < levelUpCost) {
            this.ui.showNotification(`Not enough gold! Need ${levelUpCost} gold.`, "error");
            return;
        }
        
        // Deduct gold
        this.gameState.hero.gold -= levelUpCost;
        
        // Level up the underling
        underling.level++;
        
        // Increase stats based on underling type
        const statIncreases = this.getStatIncreases(underling.type);
        
        underling.maxHealth += statIncreases.health;
        underling.health = underling.maxHealth; // Full heal on level up
        underling.maxMana += statIncreases.mana;
        underling.mana = underling.maxMana;
        underling.maxStamina += statIncreases.stamina;
        underling.stamina = underling.maxStamina;
        underling.attack += statIncreases.attack;
        underling.defense += statIncreases.defense;
        
        // Increase character stats
        underling.strength = (underling.strength || 5) + statIncreases.strength;
        underling.dexterity = (underling.dexterity || 5) + statIncreases.dexterity;
        underling.constitution = (underling.constitution || 5) + statIncreases.constitution;
        underling.intelligence = (underling.intelligence || 5) + statIncreases.intelligence;
        underling.willpower = (underling.willpower || 5) + statIncreases.willpower;
        
        this.ui.log(`${underling.name} gained a level! Now level ${underling.level}.`);
        this.ui.showNotification(`${underling.name} leveled up!`, "success");
        
        // Refresh the display
        this.manageUnderling(underlingIndex);
    }
    
    // Get stat increases per level based on underling type
    getStatIncreases(type) {
        const increases = {
            'ranged': { // Archer
                health: 8, mana: 4, stamina: 6, attack: 2, defense: 1,
                strength: 1, dexterity: 2, constitution: 1, intelligence: 1, willpower: 1
            },
            'tank': { // Warrior
                health: 12, mana: 2, stamina: 8, attack: 2, defense: 2,
                strength: 2, dexterity: 1, constitution: 2, intelligence: 0, willpower: 1
            },
            'magic': { // Mage
                health: 6, mana: 8, stamina: 4, attack: 1, defense: 1,
                strength: 0, dexterity: 1, constitution: 1, intelligence: 2, willpower: 2
            },
            'support': { // Healer
                health: 8, mana: 6, stamina: 5, attack: 1, defense: 1,
                strength: 0, dexterity: 1, constitution: 1, intelligence: 1, willpower: 2
            }
        };
        
        return increases[type] || increases['ranged']; // Default to ranged if type not found
    }
}

// Export for use in main game file
window.CharacterManager = CharacterManager;
