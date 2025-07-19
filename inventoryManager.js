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
    
    // Equipment management
    equipItem(item) {
        if (!item || !item.type) return false;
        
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
        
        // Unequip current item in slot
        if (slot.equipped) {
            this.unequipItem(slot.equipped);
        }
        
        // Equip new item
        item.equipped = true;
        slot.equipped = item;
        
        // Move from inventory to equipment if needed
        const invIndex = this.gameState.hero.inventory.findIndex(inv => inv === item);
        if (invIndex !== -1) {
            this.gameState.hero.inventory.splice(invIndex, 1);
            this.gameState.hero.equipment.push(item);
        }
        
        this.ui.log(`Equipped ${item.name}!`);
        this.ui.showNotification(`Equipped ${item.name}!`, "success");
        return true;
    }
    
    unequipItem(item) {
        if (!item || !item.equipped) return false;
        
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
            this.gameState.hero.inventory.push(item);
        }
        
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
                " onmouseover="this.style.background='${isEmpty ? '#3a3a4a' : '#1a4a1a'}'" onmouseout="this.style.background='${isEmpty ? '#2a2a3a' : '#0a3a0a'}'">
                    <div style="font-size: 16px; margin-bottom: 2px;">${slotInfo.icon}</div>
                    <div style="font-size: 10px; color: #d4af37; font-weight: bold; margin-bottom: 2px;">${slotInfo.name}</div>
                    ${isEmpty ? 
                        `<div style="font-size: 8px; color: #888; font-style: italic;">Empty</div>` :
                        `<div style="font-size: 9px; color: #51cf66; font-weight: bold; text-align: center; line-height: 1.2;">
                            ${equippedItem.name}
                            ${equippedItem.stats ? Object.entries(equippedItem.stats).map(([stat, value]) => 
                                `<br><span style="color: #ffd93d;">+${value} ${stat}</span>`).join('') : ''}
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
                    <strong style="color: #d4af37;">${item.name}</strong>
                    ${item.quantity && item.quantity > 1 ? ` <span style="color: #51cf66;">(${item.quantity})</span>` : ''}
                    <div style="font-size: 11px; color: #aaa;">${item.type || 'Item'}</div>
                    ${item.stats ? Object.entries(item.stats).map(([stat, value]) => 
                        `<small style="color: #51cf66;">+${value} ${stat}</small>`).join(' | ') : ''}
                    ${item.effects ? Object.entries(item.effects).map(([effect, value]) => 
                        `<small style="color: #ffd93d;">${effect}: ${value}</small>`).join(' | ') : ''}
                </div>
                <div style="display: flex; gap: 5px;">
                    ${item.type !== 'consumable' ? `
                        <button onclick="window.game.inventoryManager.equipItemByIndex(${index})" 
                                style="padding: 2px 8px; background: #2a4d3a; border: 1px solid #51cf66; color: white; border-radius: 3px; cursor: pointer; font-size: 10px;">
                            Equip
                        </button>
                    ` : `
                        <button onclick="window.game.inventoryManager.useConsumableByIndex(${index})" 
                                style="padding: 2px 8px; background: #4a4a2d; border: 1px solid #ffd93d; color: white; border-radius: 3px; cursor: pointer; font-size: 10px;">
                            Use
                        </button>
                    `}
                </div>
            </div>
        `).join('');
    }
    
    // Helper methods for UI interaction
    // Equipment slot compatibility - determines which slots an item can be equipped to
    getItemSlotCompatibility(item) {
        const itemType = item.type ? item.type.toLowerCase() : '';
        const itemName = item.name ? item.name.toLowerCase() : '';
        
        // Map item types to equipment slots
        const slotMap = {
            // Weapons
            'weapon': ['hand1', 'hand2'],
            'sword': ['hand1', 'hand2'],
            'bow': ['hand1'],
            'staff': ['hand1'],
            'wand': ['hand1'],
            'shield': ['hand2'],
            
            // Armor pieces
            'armor': ['chest'],
            'helmet': ['head'],
            'boots': ['feet'],
            'gloves': ['hands'],
            'pants': ['legs'],
            'leggings': ['legs'],
            'bracers': ['arms'],
            
            // Accessories
            'ring': ['ring1', 'ring2'],
            'amulet': ['amulet'],
            'necklace': ['neck'],
            'belt': ['belt'],
            'cloak': ['cloak'],
            'cape': ['cloak'],
            'mask': ['face'],
            'glasses': ['face']
        };
        
        // Check item type first
        if (slotMap[itemType]) {
            return slotMap[itemType];
        }
        
        // Check item name for keywords
        for (const [keyword, slots] of Object.entries(slotMap)) {
            if (itemName.includes(keyword)) {
                return slots;
            }
        }
        
        // Default slots for generic items
        if (itemType === 'weapon' || itemName.includes('weapon')) {
            return ['hand1', 'hand2'];
        }
        if (itemType === 'armor' || itemName.includes('armor')) {
            return ['chest'];
        }
        
        return []; // No compatible slots
    }
    
    // Equip item to appropriate slot
    equipItemToSlot(item, character, targetSlot = null) {
        const compatibleSlots = this.getItemSlotCompatibility(item);
        
        if (compatibleSlots.length === 0) {
            this.ui.log(`${item.name} cannot be equipped!`);
            return false;
        }
        
        // If target slot specified and compatible, use it
        if (targetSlot && compatibleSlots.includes(targetSlot)) {
            return this.equipToSpecificSlot(item, character, targetSlot);
        }
        
        // Otherwise, find first available compatible slot
        for (const slotId of compatibleSlots) {
            if (!character.equipmentSlots[slotId]) {
                return this.equipToSpecificSlot(item, character, slotId);
            }
        }
        
        // If no free slots, replace the first compatible slot
        const slotToReplace = compatibleSlots[0];
        this.unequipFromSlot(character, slotToReplace);
        return this.equipToSpecificSlot(item, character, slotToReplace);
    }
    
    // Equip item to specific slot
    equipToSpecificSlot(item, character, slotId) {
        // Unequip any item currently in the slot
        if (character.equipmentSlots[slotId]) {
            this.unequipFromSlot(character, slotId);
        }
        
        // Equip the new item
        character.equipmentSlots[slotId] = item;
        item.equipped = true;
        item.equippedSlot = slotId;
        
        this.ui.log(`Equipped ${item.name} to ${slotId}!`);
        this.ui.showNotification(`Equipped ${item.name}!`, "success");
        return true;
    }
    
    // Unequip item from specific slot
    unequipFromSlot(character, slotId) {
        const item = character.equipmentSlots[slotId];
        if (item) {
            character.equipmentSlots[slotId] = null;
            item.equipped = false;
            item.equippedSlot = null;
            
            // Add back to inventory if not already there
            if (!character.equipment.includes(item)) {
                character.equipment.push(item);
            }
            
            this.ui.log(`Unequipped ${item.name} from ${slotId}!`);
            return item;
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
        
        // Initialize equipment slots if not done yet
        this.gameController.characterManager.initializeCharacterEquipment(this.gameState.hero);
        
        // Use new slot-based equipment system
        if (this.equipItemToSlot(item, this.gameState.hero)) {
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
}

// Export for use in main game file
window.InventoryManager = InventoryManager;
