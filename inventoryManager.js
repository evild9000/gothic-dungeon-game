// Inventory Manager - Handles all inventory, equipment, and item management
class InventoryManager {
    constructor(gameController) {
        this.gameController = gameController;
        this.gameState = gameController.gameState;
        this.ui = gameController.ui;
        
        // Default inventory configuration
        this.defaultConfig = {
            baseInventorySlots: 20,        // Starting inventory capacity
            maxInventorySlots: 100,        // Maximum possible slots
            slotExpansionCost: 100,        // Base cost for first expansion
            slotExpansionMultiplier: 1.5,  // Cost multiplier for each expansion
            slotsPerExpansion: 5,          // How many slots added per expansion
        };
        
        this.initializeInventorySystem();
    }
    
    initializeInventorySystem() {
        // Ensure hero has inventory properties
        if (!this.gameState.hero.inventorySlots) {
            this.gameState.hero.inventorySlots = this.defaultConfig.baseInventorySlots;
        }
        if (!this.gameState.hero.inventory) {
            this.gameState.hero.inventory = [];
        }
        if (!this.gameState.hero.equipment) {
            this.gameState.hero.equipment = [];
        }
        
        // Initialize equipment slots for hero and underlings
        this.initializeAllCharacterEquipment();
    }
    
    initializeAllCharacterEquipment() {
        // Check if character manager is available, if not defer initialization
        if (!this.gameController.characterManager) {
            console.log('CharacterManager not yet available, deferring equipment initialization');
            return;
        }
        
        // Initialize hero equipment slots
        this.gameController.characterManager.initializeCharacterEquipment(this.gameState.hero);
        
        // Initialize underling equipment slots
        this.gameState.hero.underlings.forEach(underling => {
            this.gameController.characterManager.initializeCharacterEquipment(underling);
        });
    }
    
    // Create docked modal similar to combat interface
    createDockedModal(title, content, buttons = [], additionalClasses = '') {
        // Remove any existing modals
        const existingModals = document.querySelectorAll('.docked-modal');
        existingModals.forEach(modal => modal.remove());
        
        const modal = document.createElement('div');
        modal.className = `docked-modal ${additionalClasses}`;
        
        // Responsive sizing
        const isMobile = window.innerWidth <= 768;
        
        modal.style.cssText = `
            position: fixed;
            top: ${isMobile ? '10px' : '50px'};
            left: ${isMobile ? '10px' : '50px'};
            width: ${isMobile ? 'calc(100vw - 20px)' : '800px'};
            max-width: ${isMobile ? 'none' : '95vw'};
            max-height: ${isMobile ? 'calc(100vh - 20px)' : 'calc(100vh - 100px)'};
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
    
    updateEquippedSlots() {
        // Reset all slots
        Object.keys(this.equipmentSlots).forEach(slot => {
            this.equipmentSlots[slot].equipped = null;
        });
        
        // Update with currently equipped items
        this.gameState.hero.equipment.forEach(item => {
            if (item.equipped && this.equipmentSlots[item.type]) {
                this.equipmentSlots[item.type].equipped = item;
            }
        });
    }
    
    // Inventory capacity management
    getInventoryCapacity() {
        return this.gameState.hero.inventorySlots || this.defaultConfig.baseInventorySlots;
    }
    
    getInventoryUsage() {
        return this.gameState.hero.inventory.length + this.gameState.hero.equipment.length;
    }
    
    getInventorySpace() {
        return this.getInventoryCapacity() - this.getInventoryUsage();
    }
    
    isInventoryFull() {
        return this.getInventorySpace() <= 0;
    }
    
    canExpandInventory() {
        return this.getInventoryCapacity() < this.defaultConfig.maxInventorySlots;
    }
    
    getInventoryExpansionCost() {
        const currentSlots = this.getInventoryCapacity();
        const expansionsAlready = Math.floor((currentSlots - this.defaultConfig.baseInventorySlots) / this.defaultConfig.slotsPerExpansion);
        return Math.floor(this.defaultConfig.slotExpansionCost * Math.pow(this.defaultConfig.slotExpansionMultiplier, expansionsAlready));
    }
    
    expandInventory() {
        if (!this.canExpandInventory()) {
            this.ui.log("Inventory is already at maximum capacity!");
            this.ui.showNotification("Max inventory capacity reached!", "error");
            return false;
        }
        
        const cost = this.getInventoryExpansionCost();
        if (this.gameState.hero.gold < cost) {
            this.ui.log(`Need ${cost} gold to expand inventory. You have ${this.gameState.hero.gold} gold.`);
            this.ui.showNotification("Insufficient gold for inventory expansion!", "error");
            return false;
        }
        
        // Show confirmation modal
        const newSlots = this.getInventoryCapacity() + this.defaultConfig.slotsPerExpansion;
        const confirmContent = `
            <div style="text-align: center;">
                <h4>Expand Inventory</h4>
                <p>Cost: <span style="color: #ffd93d;">${cost} gold</span></p>
                <p>Current capacity: <span style="color: #51cf66;">${this.getInventoryCapacity()} slots</span></p>
                <p>New capacity: <span style="color: #51cf66;">${newSlots} slots</span></p>
                <p style="color: #d4af37; font-weight: bold;">Expand your inventory?</p>
            </div>
        `;
        
        this.ui.createModal("Inventory Expansion", confirmContent, [
            {
                text: "Confirm Expansion",
                onClick: () => this.confirmInventoryExpansion(cost)
            },
            {
                text: "Cancel",
                onClick: () => {}
            }
        ]);
        
        return true;
    }
    
    confirmInventoryExpansion(cost) {
        this.gameState.hero.gold -= cost;
        this.gameState.hero.inventorySlots += this.defaultConfig.slotsPerExpansion;
        
        this.ui.log(`Inventory expanded! New capacity: ${this.getInventoryCapacity()} slots.`);
        this.ui.showNotification(`Inventory expanded to ${this.getInventoryCapacity()} slots!`, "success");
        
        // Refresh inventory display if open
        setTimeout(() => {
            const modals = document.querySelectorAll('.modal-overlay');
            modals.forEach(modal => modal.remove());
            this.openInventory();
        }, 100);
    }
    
    // Item management
    addItem(item, quantity = 1) {
        if (this.isInventoryFull()) {
            this.ui.log("Inventory is full! Cannot add item.");
            this.ui.showNotification("Inventory full!", "error");
            return false;
        }
        
        // Check if item already exists (for stackable items)
        if (item.stackable) {
            const existingItem = this.gameState.hero.inventory.find(inv => inv.name === item.name);
            if (existingItem) {
                existingItem.quantity = (existingItem.quantity || 1) + quantity;
                return true;
            }
        }
        
        // Add new item
        const newItem = { ...item, quantity: quantity };
        this.gameState.hero.inventory.push(newItem);
        return true;
    }
    
    removeItem(item, quantity = 1) {
        const itemIndex = this.gameState.hero.inventory.findIndex(inv => inv === item);
        if (itemIndex === -1) return false;
        
        if (item.quantity && item.quantity > quantity) {
            item.quantity -= quantity;
        } else {
            this.gameState.hero.inventory.splice(itemIndex, 1);
        }
        return true;
    }
    
    hasItem(itemName) {
        return this.gameState.hero.inventory.some(item => item.name === itemName);
    }
    
    consumeItem(itemName, quantity = 1) {
        const item = this.gameState.hero.inventory.find(inv => inv.name === itemName);
        if (!item) return false;
        
        if (item.uses) {
            item.uses -= quantity;
            if (item.uses <= 0) {
                this.gameState.hero.inventory = this.gameState.hero.inventory.filter(inv => inv !== item);
                this.ui.log(`${itemName} has been used up and removed from inventory.`);
            }
            return true;
        }
        
        return this.removeItem(item, quantity);
    }
    
    // Equipment management
    equipItem(item) {
        if (!item || !item.type) {
            this.ui.log("equipItem: Invalid item or missing type.");
            return false;
        }

        // Check if slot exists and is unlocked
        const slot = this.equipmentSlots[item.type];
        if (!slot) {
            this.ui.log(`No equipment slot for ${item.type}!`);
            return false;
        }

        if (slot.unlocked === false) {
            this.ui.log(`${slot.name} slot is not unlocked yet!`);
            return false;
        }

        // FIRST: Store currently equipped item before making any changes
        const currentEquipped = slot.equipped;

        // SECOND: Unequip current item in slot (this will add it back to inventory)
        if (currentEquipped) {
            this.ui.log(`[equipItem] Unequipping current item in slot: ${currentEquipped.name}`);
            this.unequipItem(currentEquipped);
            // Safety: Double-check it is now in inventory
            if (!this.gameState.hero.inventory.includes(currentEquipped)) {
                this.ui.log(`[equipItem] Warning: Unequipped item ${currentEquipped.name} was not added to inventory!`);
            }
        }

        // THIRD: Equip new item
        item.equipped = true;
        slot.equipped = item;

        // FOURTH: Move from inventory to equipment if needed
        const invIndex = this.gameState.hero.inventory.findIndex(inv => inv === item);
        if (invIndex !== -1) {
            this.gameState.hero.inventory.splice(invIndex, 1);
            this.gameState.hero.equipment.push(item);
        } else if (!this.gameState.hero.equipment.includes(item)) {
            // Safety: If item is not in equipment, add it
            this.ui.log(`[equipItem] Safety: Item ${item.name} was not in inventory or equipment, adding to equipment.`);
            this.gameState.hero.equipment.push(item);
        }

        // Final safety: Ensure no duplicate items in equipment
        const equipmentSet = new Set();
        this.gameState.hero.equipment = this.gameState.hero.equipment.filter(eq => {
            if (equipmentSet.has(eq)) {
                this.ui.log(`[equipItem] Duplicate detected for ${eq.name}, removing.`);
                return false;
            }
            equipmentSet.add(eq);
            return true;
        });

        this.ui.log(`Equipped ${item.name}!${currentEquipped ? ` (Unequipped ${currentEquipped.name})` : ''}`);
        this.ui.showNotification(`Equipped ${item.name}!`, "success");
        return true;
    }
    
    unequipItem(item) {
        if (!item || !item.equipped) {
            this.ui.log("unequipItem: Invalid item or item is not equipped.");
            return false;
        }

        // Check inventory space
        if (this.isInventoryFull()) {
            this.ui.log("Inventory is full! Cannot unequip item.");
            this.ui.showNotification("Inventory full!", "error");
            return false;
        }

        // Unequip item
        item.equipped = false;

        // Update slot
        const slot = this.equipmentSlots[item.type];
        if (slot && slot.equipped === item) {
            slot.equipped = null;
        }

        // Move from equipment to inventory
        const equipIndex = this.gameState.hero.equipment.findIndex(eq => eq === item);
        if (equipIndex !== -1) {
            this.gameState.hero.equipment.splice(equipIndex, 1);
            if (!this.gameState.hero.inventory.includes(item)) {
                this.gameState.hero.inventory.push(item);
            } else {
                this.ui.log(`[unequipItem] Warning: Item ${item.name} already in inventory!`);
            }
        } else {
            this.ui.log(`[unequipItem] Warning: Tried to unequip ${item.name} but it was not found in equipment.`);
        }

        // Final safety: Ensure no duplicate items in inventory
        const inventorySet = new Set();
        this.gameState.hero.inventory = this.gameState.hero.inventory.filter(inv => {
            if (inventorySet.has(inv)) {
                this.ui.log(`[unequipItem] Duplicate detected for ${inv.name}, removing.`);
                return false;
            }
            inventorySet.add(inv);
            return true;
        });

        this.ui.log(`Unequipped ${item.name}!`);
        this.ui.showNotification(`Unequipped ${item.name}!`, "info");
        return true;
    }
    
    getEquippedItem(slotType) {
        return this.equipmentSlots[slotType]?.equipped || null;
    }
    
    // UI Methods
    openInventory() {
        // Initialize equipment slots for all characters
        this.initializeAllCharacterEquipment();
        
        const isMobile = window.innerWidth <= 768;
        
        const inventoryContent = `
            <div style="display: ${isMobile ? 'block' : 'flex'}; gap: ${isMobile ? '15px' : '20px'};">
                <!-- Equipment Slots -->
                <div style="flex: ${isMobile ? 'none' : '1'}; min-width: ${isMobile ? 'auto' : '350px'}; margin-bottom: ${isMobile ? '20px' : '0'};">
                    <h4 style="color: #d4af37; text-align: center; margin-bottom: 15px;">🛡️ Equipment Slots 🛡️</h4>
                    ${this.generateEquipmentSlotsHTML()}
                </div>
                
                <!-- Inventory -->
                <div style="flex: ${isMobile ? 'none' : '2'}; min-width: ${isMobile ? 'auto' : '400px'};">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <h4 style="color: #d4af37; margin: 0;">🎒 Inventory</h4>
                        <div style="color: #51cf66; font-size: 14px; font-weight: bold;">
                            ${this.getInventoryUsage()} items
                        </div>
                    </div>
                    ${this.generateInventoryHTML()}
                    
                    <!-- Underling Equipment Management -->
                    <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #444;">
                        <h4 style="color: #d4af37; margin-bottom: 10px;">⚔️ Underling Equipment</h4>
                        ${this.generateUnderlingEquipmentHTML()}
                    </div>
                    
                    <!-- Inventory Management -->
                    <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #444;">
                        <div style="margin-top: 10px; font-size: 12px; color: #aaa;">
                            💡 Tip: Your party shares one infinite inventory. Equipment slots are based on your species (currently human).
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.createDockedModal("Inventory & Equipment", inventoryContent, [
            {
                text: "Close",
                onClick: () => {
                    const modal = document.querySelector('.docked-modal');
                    if (modal) modal.remove();
                }
            }
        ]);
    }
    
    generateEquipmentSlotsHTML() {
        const hero = this.gameState.hero;
        const slots = this.gameController.characterManager.getCharacterEquipmentSlots(hero);
        const isMobile = window.innerWidth <= 768;
        
        let html = `<div style="display: grid; grid-template-columns: ${isMobile ? '1fr 1fr' : '1fr 1fr 1fr'}; gap: 8px; background: #1a1a2e; padding: 12px; border-radius: 8px; border: 1px solid #4a5568;">`;
        
        Object.entries(slots).forEach(([slotId, slotInfo]) => {
            const equippedItem = hero.equipmentSlots[slotId];
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
                " onclick="${!isEmpty ? `window.game.controller.inventoryManager.unequipFromSlot(window.game.controller.gameState.hero, '${slotId}'); window.game.controller.inventoryManager.openInventory();` : ''}" onmouseover="this.style.background='${isEmpty ? '#3a3a4a' : '#1a4a1a'}'" onmouseout="this.style.background='${isEmpty ? '#2a2a3a' : '#0a3a0a'}'">
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
        
        // Add equipment slot information
        html += `
            <div style="margin-top: 10px; padding: 8px; background: #2a2a3a; border-radius: 5px; font-size: 11px; color: #aaa;">
                <div style="color: #d4af37; font-weight: bold; margin-bottom: 5px;">Equipment Slot System:</div>
                <div>• Species: ${hero.species || 'Human'} (${Object.keys(slots).length} slots)</div>
                <div>• Click items in inventory to equip them</div>
                <div>• Each slot type accepts specific equipment</div>
            </div>
        `;
        
        return html;
    }
    
    generateInventoryHTML() {
        const allItems = [...this.gameState.hero.inventory, ...this.gameState.hero.equipment.filter(item => !item.equipped)];
        
        if (allItems.length === 0) {
            return '<p style="color: #888; text-align: center; padding: 20px;">Inventory is empty</p>';
        }
        
        return allItems.map((item, index) => `
            <div style="background: #1a1a1a; padding: 8px; margin: 5px 0; border-radius: 5px; display: flex; justify-content: space-between; align-items: center;">
                <div style="flex: 1;">
                    <strong style="color: #d4af37;">${item.name || 'Unknown Item'}</strong>
                    ${item.quantity && item.quantity > 1 ? ` <span style="color: #51cf66;">(${item.quantity})</span>` : ''}
                    <div style="font-size: 11px; color: #aaa;">${item.type || 'Item'}</div>
                    ${item.stats ? Object.entries(item.stats).map(([stat, value]) => 
                        `<small style="color: #51cf66;">+${value} ${stat}</small>`).join(' | ') : ''}
                    ${item.effects ? Object.entries(item.effects).map(([effect, value]) => 
                        `<small style="color: #ffd93d;">${effect}: ${value}</small>`).join(' | ') : ''}
                </div>
                <div style="display: flex; gap: 5px;">
                    ${item.type && item.type !== 'consumable' ? `
                        <button onclick="window.game.controller.inventoryManager.equipItemByIndex(${index})" 
                                style="padding: 2px 8px; background: #2a4d3a; border: 1px solid #51cf66; color: white; border-radius: 3px; cursor: pointer; font-size: 10px;"
                                ${!item.name || item.name === 'Unknown Item' ? 'disabled title="Cannot equip invalid item"' : ''}>
                            ${!item.name || item.name === 'Unknown Item' ? 'Invalid' : 'Equip'}
                        </button>
                    ` : item.type === 'consumable' ? `
                        <button onclick="window.game.controller.inventoryManager.useConsumableByIndex(${index})" 
                                style="padding: 2px 8px; background: #4a4a2d; border: 1px solid #ffd93d; color: white; border-radius: 3px; cursor: pointer; font-size: 10px;">
                            Use
                        </button>
                    ` : `
                        <button disabled 
                                style="padding: 2px 8px; background: #4a2a2a; border: 1px solid #ff6b6b; color: #888; border-radius: 3px; cursor: not-allowed; font-size: 10px;"
                                title="Invalid item type">
                            Invalid
                        </button>
                    `}
                </div>
            </div>
        `).join('');
    }
    
    // Check if an item is a weapon
    isWeapon(item) {
        const itemType = item.type ? item.type.toLowerCase() : '';
        const itemName = item.name ? item.name.toLowerCase() : '';
        
        // Check item type
        const weaponTypes = ['sword', 'bow', 'staff', 'wand', 'weapon', 'dagger', 'axe', 'mace', 'spear'];
        if (weaponTypes.includes(itemType)) {
            return true;
        }
        
        // Check item name for weapon keywords
        const weaponKeywords = ['sword', 'bow', 'staff', 'wand', 'weapon', 'dagger', 'axe', 'mace', 'spear', 'blade', 'club'];
        return weaponKeywords.some(keyword => itemName.includes(keyword));
    }
    
    // Helper methods for UI interaction
    // Equipment slot compatibility - determines which slots an item can be equipped to
    getItemSlotCompatibility(item) {
        const itemType = item.type ? item.type.toLowerCase() : '';
        const itemName = item.name ? item.name.toLowerCase() : '';
        
        console.log(`[Equipment] Checking compatibility for: "${item.name}" (type: "${item.type}", slot: "${item.slot}")`);
        console.log(`[Equipment] Lowercase name: "${itemName}", type: "${itemType}"`);
        
        // FIRST: Check if item has a specific slot property (highest priority)
        if (item.slot) {
            // For hand2 (offhand) slot, ensure it's not a weapon
            if (item.slot === 'hand2' && this.isWeapon(item)) {
                console.log(`[Equipment] Weapon ${item.name} cannot be equipped in offhand slot`);
                return [];
            }
            console.log(`[Equipment] Found specific slot property: ${item.slot} -> [${item.slot}]`);
            return [item.slot];
        }
        
        // Map item types to equipment slots (order matters - more specific first)
        const slotMap = {
            // Weapons (main hand only - no more dual wielding)
            'sword': ['hand1'],
            'bow': ['hand1'],
            'staff': ['hand1'],
            'wand': ['hand1'],
            'weapon': ['hand1'],
            'dagger': ['hand1'],
            'axe': ['hand1'],
            'mace': ['hand1'],
            'spear': ['hand1'],
            // Offhand only items
            'shield': ['hand2'],
            
            // Head equipment
            'helmet': ['head'],
            'hood': ['head'],
            'helm': ['head'],
            'hat': ['head'],
            'crown': ['head'],
            'circlet': ['head'],
            
            // Face equipment
            'mask': ['face'],
            'glasses': ['face'],
            'goggles': ['face'],
            
            // Neck equipment
            'necklace': ['neck'],
            'amulet': ['amulet'],
            
            // Chest equipment (specific before generic)
            'chestplate': ['chest'],
            'breastplate': ['chest'],
            'robe': ['chest'],
            'tunic': ['chest'],
            'shirt': ['chest'],
            'vest': ['chest'],
            
            // Arms equipment
            'vambraces': ['arms'],
            'bracers': ['arms'],
            'sleeves': ['arms'],
            'armguards': ['arms'],
            
            // Hands equipment
            'gloves': ['hands'],
            'gauntlets': ['hands'],
            'mittens': ['hands'],
            
            // Legs equipment
            'pants': ['legs'],
            'leggings': ['legs'],
            'trousers': ['legs'],
            'greaves': ['legs'],
            'legguards': ['legs'],
            
            // Feet equipment
            'boots': ['feet'],
            'shoes': ['feet'],
            'sandals': ['feet'],
            'slippers': ['feet'],
            
            // Accessories
            'ring': ['ring1', 'ring2'],
            'belt': ['belt'],
            'cloak': ['cloak'],
            'cape': ['cloak'],
            
            // Generic fallbacks (least specific)
            'armor': ['chest']
        };
        
        // Check item type first
        if (slotMap[itemType]) {
            console.log(`[Equipment] Found type match: ${itemType} -> ${slotMap[itemType]}`);
            return slotMap[itemType];
        }
        
        // Check item name for keywords (prioritize more specific matches first)
        const sortedKeywords = Object.entries(slotMap).sort((a, b) => b[0].length - a[0].length);
        for (const [keyword, slots] of sortedKeywords) {
            if (itemName.includes(keyword)) {
                console.log(`[Equipment] Found name keyword match: "${keyword}" in "${itemName}" -> ${slots}`);
                // Filter out hand2 for weapons
                if (this.isWeapon(item)) {
                    const filteredSlots = slots.filter(slot => slot !== 'hand2');
                    console.log(`[Equipment] Weapon slots filtered to: ${filteredSlots}`);
                    return filteredSlots;
                }
                return slots;
            }
        }
        
        // If no matches found, log for debugging
        console.warn(`[Equipment] No slot compatibility found for "${item.name}" (type: "${item.type}", slot: "${item.slot}")`);
        return [];
        
        // Default slots for generic items
        if (itemType === 'weapon' || itemName.includes('weapon')) {
            return ['hand1']; // Weapons only in main hand
        }
        if (itemType === 'armor' || itemName.includes('armor')) {
            return ['chest'];
        }
        
        return []; // No compatible slots
    }
    
    // Equip item to appropriate slot
    equipItemToSlot(item, character, targetSlot = null) {
        console.log('equipItemToSlot called with:', item.name, 'for character with slots:', character.equipmentSlots ? Object.keys(character.equipmentSlots) : 'none');
        
        if (!character.equipmentSlots) {
            console.warn('Character has no equipment slots');
            return false;
        }
        
        const compatibleSlots = this.getItemSlotCompatibility(item);
        console.log('Compatible slots for', item.name, ':', compatibleSlots);
        
        if (compatibleSlots.length === 0) {
            this.ui.log(`${item.name} cannot be equipped - no compatible slots!`);
            return false;
        }
        
        // If target slot specified and compatible, use it
        if (targetSlot && compatibleSlots.includes(targetSlot)) {
            return this.equipToSpecificSlot(item, character, targetSlot);
        }
        
        // Otherwise, find first available compatible slot
        for (const slotId of compatibleSlots) {
            if (!character.equipmentSlots[slotId]) {
                console.log('Equipping to empty slot:', slotId);
                return this.equipToSpecificSlot(item, character, slotId);
            }
        }
        
        // If no free slots, replace the first compatible slot
        const slotToReplace = compatibleSlots[0];
        console.log('Replacing item in slot:', slotToReplace);
        this.unequipFromSlot(character, slotToReplace);
        return this.equipToSpecificSlot(item, character, slotToReplace);
    }
    
    // Equip item to specific slot
    equipToSpecificSlot(item, character, slotId) {
        console.log('equipToSpecificSlot:', item.name, 'to slot', slotId);
        
        // Unequip any item currently in the slot
        if (character.equipmentSlots[slotId]) {
            const currentItem = character.equipmentSlots[slotId];
            console.log('Unequipping current item:', currentItem.name);
            this.unequipFromSlot(character, slotId);
        }
        
        // Equip the new item
        character.equipmentSlots[slotId] = item;
        item.equipped = true;
        item.equippedSlot = slotId;
        
        console.log('Successfully equipped', item.name, 'to slot', slotId);
        this.ui.log(`Equipped ${item.name} to ${slotId}!`);
        
        return true;
    }
    
    // Unequip item from specific slot
    unequipFromSlot(character, slotId) {
        console.log(`[Unequip] Attempting to unequip from slot: ${slotId}`);
        const item = character.equipmentSlots[slotId];
        if (item) {
            console.log(`[Unequip] Unequipping item: ${item.name}`);
            character.equipmentSlots[slotId] = null;
            item.equipped = false;
            item.equippedSlot = null;
            
            // Add back to inventory if not already there
            if (!character.equipment.includes(item)) {
                character.equipment.push(item);
                console.log(`[Unequip] Added ${item.name} back to equipment array`);
            }
            
            this.ui.log(`Unequipped ${item.name} from ${slotId}!`);
            this.ui.showNotification(`Unequipped ${item.name}!`, "success");
            return item;
        } else {
            console.log(`[Unequip] No item found in slot: ${slotId}`);
        }
        return null;
    }

    equipItemByIndex(itemIndex) {
        const allItems = [...this.gameState.hero.inventory, ...this.gameState.hero.equipment.filter(item => !item.equipped)];
        const item = allItems[itemIndex];
        
        if (!item) {
            this.ui.log("Item not found!");
            return;
        }
        
        console.log('Attempting to equip item:', item.name, 'Type:', item.type);
        
        // Ensure character manager is available
        if (!this.gameController.characterManager) {
            this.ui.log("Character system not ready!");
            return;
        }
        
        // Initialize equipment slots if not done yet
        this.gameController.characterManager.initializeCharacterEquipment(this.gameState.hero);
        
        // Check if hero has equipment slots now
        if (!this.gameState.hero.equipmentSlots) {
            this.ui.log("Equipment system not initialized!");
            return;
        }
        
        console.log('Hero equipment slots:', Object.keys(this.gameState.hero.equipmentSlots));
        
        // Remove item from inventory/equipment arrays first
        const heroItemIndex = this.gameState.hero.equipment.findIndex(heroItem => heroItem === item);
        if (heroItemIndex > -1) {
            this.gameState.hero.equipment.splice(heroItemIndex, 1);
        } else {
            const inventoryIndex = this.gameState.hero.inventory.findIndex(heroItem => heroItem === item);
            if (inventoryIndex > -1) {
                this.gameState.hero.inventory.splice(inventoryIndex, 1);
            }
        }
        
        // Use new slot-based equipment system
        if (this.equipItemToSlot(item, this.gameState.hero)) {
            this.ui.log(`Equipped ${item.name}!`);
            this.ui.showNotification(`Equipped ${item.name}!`, "success");
            this.ui.render();
            
            // Refresh inventory modal
            setTimeout(() => {
                const modal = document.querySelector('.docked-modal');
                if (modal) {
                    modal.remove();
                    this.openInventory();
                }
            }, 100);
        } else {
            // Put item back if equipping failed
            this.gameState.hero.equipment.push(item);
            this.ui.log(`Cannot equip ${item.name}!`);
        }
    }
    
    useConsumableByIndex(itemIndex) {
        const allItems = [...this.gameState.hero.inventory, ...this.gameState.hero.equipment.filter(item => !item.equipped)];
        const item = allItems[itemIndex];
        
        if (!item) {
            this.ui.log("Item not found!");
            return;
        }
        
        this.gameController.useConsumable(item);
        this.removeItem(item, 1);
        
        // Refresh inventory
        setTimeout(() => {
            const modal = document.querySelector('.docked-modal');
            if (modal) {
                modal.remove();
                this.openInventory();
            }
        }, 100);
    }

    equipItemByReference(item) {
        // Initialize equipment slots if not done yet
        this.gameController.characterManager.initializeCharacterEquipment(this.gameState.hero);
        
        // Use new slot-based equipment system
        if (this.equipItemToSlot(item, this.gameState.hero)) {
            this.gameState.render();
            
            // Refresh inventory modal
            setTimeout(() => {
                const modal = document.querySelector('.docked-modal');
                if (modal) {
                    modal.remove();
                    this.openInventory();
                }
            }, 100);
        }
    }
    
    useConsumableByReference(item) {
        this.gameController.useConsumable(item);
        this.removeItem(item, 1);
        // Refresh inventory
        setTimeout(() => {
            const modals = document.querySelectorAll('.modal-overlay');
            modals.forEach(modal => modal.remove());
            this.openInventory();
        }, 100);
    }
    
    // Equipment slot unlocking (for future expansion)
    unlockEquipmentSlot(slotType, cost = 1000) {
        const slot = this.equipmentSlots[slotType];
        if (!slot) return false;
        
        if (slot.unlocked !== false) {
            this.ui.log(`${slot.name} slot is already unlocked!`);
            return false;
        }
        
        if (this.gameState.hero.gold < cost) {
            this.ui.log(`Need ${cost} gold to unlock ${slot.name} slot.`);
            this.ui.showNotification("Insufficient gold!", "error");
            return false;
        }
        
        this.gameState.hero.gold -= cost;
        slot.unlocked = true;
        
        this.ui.log(`Unlocked ${slot.name} equipment slot!`);
        this.ui.showNotification(`${slot.name} slot unlocked!`, "success");
        return true;
    }
    
    // Calculate total equipment stats
    calculateEquippedStats() {
        const stats = { attack: 0, defense: 0 };
        
        // Check new slot-based equipment system
        if (this.gameState.hero.equipmentSlots) {
            Object.values(this.gameState.hero.equipmentSlots).forEach(equippedItem => {
                if (equippedItem && equippedItem.stats) {
                    Object.entries(equippedItem.stats).forEach(([stat, value]) => {
                        if (stats[stat] !== undefined) {
                            stats[stat] += value;
                        }
                    });
                }
            });
        }
        
        // Fallback to legacy equipment system for compatibility
        if (this.gameState.hero.equipment) {
            this.gameState.hero.equipment.forEach(item => {
                if (item.equipped && item.stats) {
                    Object.entries(item.stats).forEach(([stat, value]) => {
                        if (stats[stat] !== undefined) {
                            stats[stat] += value;
                        }
                    });
                }
            });
        }
        
        return stats;
    }
    
    generateUnderlingEquipmentHTML() {
        const aliveUnderlings = this.gameState.hero.underlings.filter(u => u.isAlive);
        
        if (aliveUnderlings.length === 0) {
            return '<p style="color: #888; font-style: italic;">No living underlings to equip</p>';
        }
        
        return `
            <div style="max-height: 400px; overflow-y: auto;">
                ${aliveUnderlings.map((underling, index) => `
                    <div style="background: #1a1a2e; padding: 15px; margin: 10px 0; border-radius: 8px; border: 1px solid #4a5568;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                            <h5 style="color: #d4af37; margin: 0;">${underling.name} (${underling.type})</h5>
                            <div style="display: flex; gap: 8px; align-items: center;">
                                <small style="color: #4ecdc4;">Level ${underling.level} | ${underling.health}/${underling.maxHealth} HP</small>
                                <button onclick="window.game.controller.inventoryManager.openUnderlingEquipmentManager(${this.gameState.hero.underlings.indexOf(underling)})" 
                                        style="padding: 4px 8px; background: linear-gradient(135deg, #d4af37, #f1c40f); color: #000; border: none; border-radius: 4px; cursor: pointer; font-size: 11px; font-weight: bold;">
                                    🛡️ Manage Equipment
                                </button>
                            </div>
                        </div>
                        
                        <!-- Quick Equipment Summary -->
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 11px;">
                            <div>
                                ${this.getUnderlingEquippedItemsSummary(underling)}
                            </div>
                            <div>
                                <strong style="color: #ffd93d;">Quick Stats:</strong>
                                <div style="color: #ccc; margin-top: 3px;">
                                    Attack: ${underling.attack || 0} | Defense: ${underling.defense || 0}<br>
                                    Mana: ${underling.mana || 0}/${underling.maxMana || 0} | Stamina: ${underling.stamina || 0}/${underling.maxStamina || 0}
                                </div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    getUnderlingEquippedItemsSummary(underling) {
        // Don't show equipped items summary for underlings in main inventory view
        return '';
    }
    
    // Open detailed equipment manager for a specific underling
    openUnderlingEquipmentManager(underlingIndex) {
        const underling = this.gameState.hero.underlings[underlingIndex];
        if (!underling) {
            this.ui.showNotification("Underling not found!", "error");
            return;
        }
        
        // Initialize equipment slots for underling
        this.gameController.characterManager.initializeCharacterEquipment(underling);
        
        const isMobile = window.innerWidth <= 768;
        
        const equipmentContent = `
            <div style="display: ${isMobile ? 'block' : 'flex'}; gap: ${isMobile ? '15px' : '25px'}; max-width: 1200px; margin: 0 auto;">
                <!-- Underling Info -->
                <div style="flex: 1; min-width: ${isMobile ? 'auto' : '300px'}; margin-bottom: ${isMobile ? '20px' : '0'};">
                    <h4 style="text-align: center; color: #4ecdc4; margin-bottom: 15px;">${underling.name} (${underling.type})</h4>
                    
                    <div style="background: #1a1a1a; padding: 15px; border-radius: 8px; margin: 10px 0;">
                        <p><strong>Level:</strong> ${underling.level}</p>
                        <p><strong>Health:</strong> ${underling.health}/${underling.maxHealth}</p>
                        <p><strong>Mana:</strong> ${underling.mana}/${underling.maxMana}</p>
                        <p><strong>Stamina:</strong> ${underling.stamina || 0}/${underling.maxStamina || 100}</p>
                        <p><strong>Attack:</strong> ${underling.attack} | <strong>Defense:</strong> ${underling.defense}</p>
                    </div>
                    
                    <!-- Equipment Slots -->
                    <div style="background: #1a1a1a; padding: 15px; border-radius: 8px;">
                        <h5 style="color: #4ecdc4; margin-bottom: 10px;">🛡️ Equipment Slots</h5>
                        ${this.gameController.characterManager.generateUnderlingEquipmentSlotsHTML(underling)}
                    </div>
                </div>
                
                <!-- Available Equipment -->
                <div style="flex: 1; min-width: ${isMobile ? 'auto' : '450px'};">
                    <h4 style="text-align: center; color: #d4af37; margin-bottom: 15px;">📦 Available Equipment</h4>
                    <div style="background: #1a1a1a; padding: 15px; border-radius: 8px;">
                        ${this.gameController.characterManager.generateAvailableEquipmentHTML(underling, underlingIndex)}
                    </div>
                </div>
            </div>
        `;

        this.createDockedModal(`Equipment Manager - ${underling.name}`, equipmentContent, [
            {
                text: "Back to Inventory",
                onClick: () => {
                    const modal = document.querySelector('.docked-modal');
                    if (modal) modal.remove();
                    // Reopen inventory after a short delay
                    setTimeout(() => this.openInventory(), 100);
                }
            },
            {
                text: "Close",
                onClick: () => {
                    const modal = document.querySelector('.docked-modal');
                    if (modal) modal.remove();
                }
            }
        ]);
    }
    
    getUnderlingEquippedItems(underling) {
        if (!underling.equipment || underling.equipment.filter(item => item.equipped).length === 0) {
            return ''; // Remove "No equipped items" text
        }
        
        return underling.equipment.filter(item => item.equipped).map(item => `
            <div style="background: #1a1a2e; padding: 4px; margin: 2px 0; border-radius: 3px; font-size: 10px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <strong>${item.name}</strong> (${item.type})
                    ${item.stats ? Object.entries(item.stats).map(([stat, value]) => 
                        `<br><small style="color: #51cf66;">+${value} ${stat}</small>`).join('') : ''}
                </div>
                <button onclick="window.inventoryManager.unequipUnderlingItem('${underling.id}', '${item.name}')" 
                        style="padding: 2px 6px; background: #8b4513; border: 1px solid #d4af37; color: white; border-radius: 2px; cursor: pointer; font-size: 9px;">
                    Unequip
                </button>
            </div>
        `).join('');
    }
    
    getUnderlingAvailableItems(underling) {
        const availableItems = this.getUnderlingCompatibleItems(underling);
        
        if (availableItems.length === 0) {
            return '<div style="font-size: 10px; color: #888;">No compatible items</div>';
        }
        
        return availableItems.slice(0, 3).map((item, index) => `
            <div style="background: #1a1a2e; padding: 4px; margin: 2px 0; border-radius: 3px; font-size: 10px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <strong>${item.name}</strong> (${item.type})
                    ${item.stats ? Object.entries(item.stats).map(([stat, value]) => 
                        `<br><small style="color: #51cf66;">+${value} ${stat}</small>`).join('') : ''}
                </div>
                <button onclick="window.inventoryManager.equipUnderlingItem('${underling.id}', ${this.getItemIndexInInventory(item)})" 
                        style="padding: 2px 6px; background: #2a6b2a; border: 1px solid #51cf66; color: white; border-radius: 2px; cursor: pointer; font-size: 9px;">
                    Equip
                </button>
            </div>
        `).join('') + (availableItems.length > 3 ? `<div style="font-size: 9px; color: #888; text-align: center;">+${availableItems.length - 3} more items...</div>` : '');
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
    
    getItemIndexInInventory(targetItem) {
        const availableItems = [...this.gameState.hero.inventory, ...this.gameState.hero.equipment.filter(item => !item.equipped)];
        return availableItems.findIndex(item => item === targetItem);
    }
    
    equipUnderlingItem(underlingId, itemIndex) {
        const underling = this.gameState.hero.underlings.find(u => u.id.toString() === underlingId.toString());
        if (!underling || !underling.isAlive) {
            this.ui.log("Cannot find living underling!");
            return;
        }

        const availableItems = [...this.gameState.hero.inventory, ...this.gameState.hero.equipment.filter(item => !item.equipped)];
        const item = availableItems[itemIndex];
        if (!item) {
            this.ui.log("Item not found!");
            return;
        }

        // Remove from hero's equipment/inventory and add to underling's equipment
        const heroItemIndex = this.gameState.hero.equipment.findIndex(heroItem => heroItem === item);
        if (heroItemIndex > -1) {
            this.gameState.hero.equipment.splice(heroItemIndex, 1);
        } else {
            const inventoryIndex = this.gameState.hero.inventory.findIndex(heroItem => heroItem === item);
            if (inventoryIndex > -1) {
                this.gameState.hero.inventory.splice(inventoryIndex, 1);
            }
        }
        
        // Ensure underling has equipment array
        if (!underling.equipment) {
            underling.equipment = [];
        }
        
        // Unequip same type items first
        underling.equipment.forEach(equippedItem => {
            if (equippedItem.type === item.type && equippedItem.equipped) {
                equippedItem.equipped = false;
                this.gameState.hero.equipment.push(equippedItem);
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
        
        // Refresh inventory modal
        setTimeout(() => {
            const modal = document.querySelector('.docked-modal');
            if (modal) {
                modal.remove();
                this.openInventory();
            }
        }, 100);
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
            
            // Refresh inventory modal
            setTimeout(() => {
                const modal = document.querySelector('.docked-modal');
                if (modal) {
                    modal.remove();
                    this.openInventory();
                }
            }, 100);
        }
    }
}

// Export for use in main game file
window.InventoryManager = InventoryManager;
