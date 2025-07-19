// Game Controller - Handles all game logic and state management
class GameController {
    constructor() {
        // Mobile detection
        this.isMobile = this.detectMobile();
        
        // Update mobile detection on window resize
        window.addEventListener('resize', () => {
            this.isMobile = this.detectMobile();
        });
        
        this.gameState = {
            hero: {
                name: "Hero",
                level: 1,
                fame: 0,
                gold: 1000,
                health: 100,
                maxHealth: 100,
                mana: 100,
                maxMana: 100,
                leadership: 1,
                equipment: [],
                skills: [],
                underlings: [],
                // New inventory system
                inventorySlots: 20,
                inventory: []
            },
            dungeonLevel: 1,
            chatLog: [],
            currentEnemies: null,
            inDungeon: false,
            currentScreen: 'main'
        };
        
        this.ui = null; // Will be set when UI is initialized
        this.heroNamingInProgress = false; // Flag to prevent multiple naming prompts
        
        // Initialize managers - will be set after UI is ready
        this.inventoryManager = null;
        this.characterManager = null;
    }

    setUI(uiManager) {
        this.ui = uiManager;
        
        // Initialize managers after UI is set
        this.initializeManagers();
        
        // Double-check managers are available and retry if not
        if (!this.inventoryManager || !this.characterManager) {
            console.warn('Managers not available after initial initialization, retrying...');
            setTimeout(() => {
                if (!this.inventoryManager || !this.characterManager) {
                    console.log('Retrying manager initialization...');
                    this.initializeManagers();
                }
            }, 100);
        }
    }
    
    // Create docked modal similar to combat interface for consistency
    createDockedModal(title, content, buttons = [], additionalClasses = '') {
        // Remove any existing docked modals
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
            width: ${isMobile ? 'calc(100vw - 20px)' : '700px'};
            max-width: ${isMobile ? 'none' : '90vw'};
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
    
    initializeManagers() {
        // Skip if already initialized
        if (this.inventoryManager && this.characterManager) {
            console.log('Managers already initialized, skipping...');
            return;
        }
        
        // Initialize inventory and character managers
        try {
            console.log('Initializing InventoryManager...');
            if (typeof InventoryManager === 'undefined') {
                throw new Error('InventoryManager class not found. Check if inventoryManager.js is loaded.');
            }
            if (!this.inventoryManager) {
                this.inventoryManager = new InventoryManager(this);
                console.log('InventoryManager initialized successfully');
            }
            
            console.log('Initializing CharacterManager...');
            if (typeof CharacterManager === 'undefined') {
                throw new Error('CharacterManager class not found. Check if characterManager.js is loaded.');
            }
            if (!this.characterManager) {
                this.characterManager = new CharacterManager(this);
                console.log('CharacterManager initialized successfully');
            }
            
            // Apply initial stat bonuses only if character manager is available
            if (this.characterManager) {
                this.characterManager.applyStatBonuses();
                console.log('Managers initialization complete');
            }
            
            // Make managers globally accessible for debugging
            window.inventoryManager = this.inventoryManager;
            window.characterManager = this.characterManager;
            
            // Add debug helper to window
            window.debugGameManagers = () => this.debugManagers();
        } catch (error) {
            console.error('Error initializing managers:', error);
            if (this.ui) {
                this.ui.log("Error initializing game systems: " + error.message);
            }
            
            // Set to null so they can be re-initialized later
            this.inventoryManager = null;
            this.characterManager = null;
        }
    }

    // Mobile detection and responsive helpers
    detectMobile() {
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        const isMobileUserAgent = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        const isSmallScreen = window.innerWidth <= 768;
        
        return isMobileUserAgent || (isTouchDevice && isSmallScreen);
    }

    // Get responsive dimensions and styles
    getResponsiveStyle(desktopValue, mobileValue) {
        return this.isMobile ? mobileValue : desktopValue;
    }

    getResponsivePadding() {
        return this.isMobile ? '2px' : '15px'; // Further reduced from 4px to 2px
    }

    getResponsiveMargin() {
        return this.isMobile ? '1px' : '8px'; // Further reduced from 2px to 1px
    }

    getResponsiveFontSize(base = 14) {
        return this.isMobile ? Math.max(6, base - 8) : base; // Further reduced: was base-5, now base-8, min 6px
    }

    getResponsiveButtonPadding() {
        return this.isMobile ? '2px 3px' : '12px 15px'; // Further reduced from 3px 5px to 2px 3px
    }

    getResponsiveModalPadding() {
        return this.isMobile ? '3px' : '20px'; // Further reduced from 6px to 3px
    }

    getResponsiveModalMargin() {
        return this.isMobile ? '1px' : '20px'; // Further reduced from 3px to 1px
    }

    getResponsiveGap() {
        return this.isMobile ? '2px' : '20px'; // Further reduced from 4px to 2px
    }

    getResponsiveIconSize() {
        return this.isMobile ? '8px' : '24px'; // Further reduced from 12px to 8px
    }

    getResponsiveBorderRadius() {
        return this.isMobile ? '2px' : '8px'; // Further reduced from 3px to 2px
    }

    // Additional mobile-specific helpers for ultra-compact design
    getResponsiveModalWidth() {
        return this.isMobile ? '99vw' : '600px'; // Increased from 98vw to 99vw for more space
    }

    getResponsiveModalHeight() {
        return this.isMobile ? '98vh' : '80vh'; // Increased from 95vh to 98vh for more space
    }

    getResponsiveCombatHeight() {
        return this.isMobile ? '40vh' : '60vh'; // Reduced from 45vh to 40vh
    }

    getResponsiveChatHeight() {
        return this.isMobile ? '20vh' : '35vh'; // Reduced from 25vh to 20vh
    }

    getResponsiveInputWidth() {
        return this.isMobile ? '98%' : '250px'; // Increased from 95% to 98%
    }

    getResponsiveButtonHeight() {
        return this.isMobile ? 'auto' : 'auto';
    }

    checkAndPromptHeroName() {
        // Check if hero has a default/generic name that needs to be made unique
        const heroName = this.gameState.hero.name;
        const needsUniqueName = !heroName || heroName === 'Hero' || heroName.trim() === '';
        
        if (needsUniqueName && !this.heroNamingInProgress) {
            console.log('Hero needs unique name, showing naming prompt...');
            this.showHeroNamingPrompt();
        }
    }

    showHeroNamingPrompt() {
        // Set flag to prevent multiple prompts
        this.heroNamingInProgress = true;
        
        // Disable keyboard shortcuts while naming prompt is active
        if (this.ui) {
            this.ui.disableKeyboardShortcuts();
        }
        
        // Close any open UI elements first
        this.closeDockedCombatPanel();
        
        // Close any open modals
        const modals = document.querySelectorAll('.modal-overlay');
        modals.forEach(modal => modal.remove());
        
        const nameContent = `
            <div style="text-align: center;">
                <h4 style="font-size: ${this.getResponsiveFontSize(18)}px;">🏰 Welcome, Adventurer! 🏰</h4>
                <p style="font-size: ${this.getResponsiveFontSize(14)}px;">Before you begin your quest, please tell us your name:</p>
                <input type="text" id="heroNameInput" placeholder="Enter your hero's name..." 
                       style="width: ${this.getResponsiveInputWidth()}; padding: ${this.getResponsiveButtonPadding()}; margin: ${this.getResponsiveMargin()} 0; border: 2px solid #d4af37; border-radius: ${this.getResponsiveBorderRadius()}; background: #2a2a2a; color: white; text-align: center; font-size: ${this.getResponsiveFontSize(14)}px;" 
                       maxlength="20" autocomplete="off">
                <p style="color: #888; font-size: ${this.getResponsiveFontSize(10)}px;">Maximum 20 characters</p>
                <div style="margin-top: ${this.getResponsiveMargin()}; padding: ${this.getResponsivePadding()}; background: #2a2a3a; border-radius: ${this.getResponsiveBorderRadius()};">
                    <p style="color: #d4af37; font-size: ${this.getResponsiveFontSize(12)}px; margin: 0;">
                        💡 This will be your unique hero identity throughout your adventure!
                    </p>
                </div>
            </div>
        `;

        this.ui.createModal("Create Your Hero", nameContent, [
            {
                text: "Begin Adventure",
                onClick: () => this.confirmHeroName()
            },
            {
                text: "Use Default Name",
                onClick: () => this.useDefaultHeroName()
            }
        ]);
        
        // Focus on the input field after modal is created
        setTimeout(() => {
            const input = document.getElementById('heroNameInput');
            if (input) {
                input.focus();
                // Enter key to confirm name
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        this.confirmHeroName();
                    }
                });
            }
        }, 100);
    }

    confirmHeroName() {
        const nameInput = document.getElementById('heroNameInput');
        let heroName = nameInput ? nameInput.value.trim() : '';
        
        // Validate and sanitize hero name
        if (!heroName) {
            heroName = 'Hero'; // Default if nothing entered
        }
        
        // Sanitize name (remove special characters that might break saves)
        heroName = heroName.replace(/[<>:"/\\|?*]/g, '').substring(0, 20);
        
        // Update hero name
        this.gameState.hero.name = heroName;
        
        // Close modal and re-enable keyboard shortcuts
        const modals = document.querySelectorAll('.modal-overlay');
        modals.forEach(modal => modal.remove());
        
        // Clear the naming in progress flag
        this.heroNamingInProgress = false;
        
        if (this.ui) {
            this.ui.enableKeyboardShortcuts();
            this.ui.log(`Welcome, ${heroName}! Your adventure begins!`);
            this.ui.showNotification(`Welcome, ${heroName}!`, "success");
            this.ui.render(); // Update UI to reflect name change
            this.ui.updateButtonStates(); // Ensure button states are refreshed
        }
        
        console.log('Hero name confirmed:', heroName);
    }

    useDefaultHeroName() {
        // Use default hero name and close modal
        this.gameState.hero.name = 'Hero';
        
        // Close modal and re-enable keyboard shortcuts
        const modals = document.querySelectorAll('.modal-overlay');
        modals.forEach(modal => modal.remove());
        
        // Clear the naming in progress flag
        this.heroNamingInProgress = false;
        
        if (this.ui) {
            this.ui.enableKeyboardShortcuts();
            this.ui.log("Welcome, Hero! Your adventure begins!");
            this.ui.showNotification("Welcome, Hero!", "success");
            this.ui.render(); // Update UI to reflect name change
            this.ui.updateButtonStates(); // Ensure button states are refreshed
        }
        
        console.log('Using default hero name: Hero');
    }

    newGame() {
        console.log('Starting new game...');
        
        // Disable keyboard shortcuts while naming prompt is active
        if (this.ui) {
            this.ui.disableKeyboardShortcuts();
        }
        
        // Close any open UI elements first
        this.closeDockedCombatPanel();
        
        // Close any open modals
        const modals = document.querySelectorAll('.modal-overlay');
        modals.forEach(modal => modal.remove());
        
        // Show hero naming prompt
        const nameContent = `
            <div style="text-align: center;">
                <h4 style="font-size: ${this.getResponsiveFontSize(18)}px;">Create Your Hero</h4>
                <p style="font-size: ${this.getResponsiveFontSize(14)}px;">Enter your hero's name to begin your adventure:</p>
                <input type="text" id="heroNameInput" placeholder="Enter hero name..." 
                       style="width: ${this.getResponsiveInputWidth()}; padding: ${this.getResponsiveButtonPadding()}; margin: ${this.getResponsiveMargin()} 0; border: 2px solid #d4af37; border-radius: ${this.getResponsiveBorderRadius()}; background: #2a2a2a; color: white; text-align: center; font-size: ${this.getResponsiveFontSize(14)}px;" 
                       maxlength="20" autocomplete="off">
                <p style="color: #888; font-size: ${this.getResponsiveFontSize(10)}px;">Maximum 20 characters</p>
                <hr style="margin: ${this.getResponsiveMargin()} 0; border-color: #444;">
                <p style="font-size: ${this.getResponsiveFontSize(14)}px;">Choose reset method:</p>
            </div>
        `;

        this.ui.createModal("Create New Hero", nameContent, [
            {
                text: "Start Adventure (Soft Reset)",
                onClick: () => this.createHeroAndStart(false)
            },
            {
                text: "Start Adventure (Hard Reset)",
                onClick: () => this.createHeroAndStart(true)
            },
            {
                text: "Cancel",
                onClick: () => {
                    // Re-enable keyboard shortcuts when canceling
                    if (this.ui) {
                        this.ui.enableKeyboardShortcuts();
                    }
                }
            }
        ]);
        
        // Focus on the input field after modal is created
        setTimeout(() => {
            const input = document.getElementById('heroNameInput');
            if (input) {
                input.focus();
                // Enter key to start adventure
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        this.createHeroAndStart(false);
                    }
                });
            }
        }, 100);
    }
    
    createHeroAndStart(isHardReset) {
        const nameInput = document.getElementById('heroNameInput');
        let heroName = nameInput ? nameInput.value.trim() : '';
        
        // Validate hero name
        if (!heroName) {
            heroName = 'Hero'; // Default name if none provided
        }
        
        // Sanitize name (remove special characters that might break saves)
        heroName = heroName.replace(/[<>:"/\\|?*]/g, '').substring(0, 20);
        
        // Re-enable keyboard shortcuts before proceeding
        if (this.ui) {
            this.ui.enableKeyboardShortcuts();
        }
        
        if (isHardReset) {
            this.performBrowserRefresh();
        } else {
            this.performNewGameReset(heroName);
        }
    }
    
    performNewGameReset(heroName = 'Hero') {
        // Reset game state completely
        this.gameState = {
            hero: {
                name: heroName,
                level: 1,
                fame: 0,
                gold: 1000,
                health: 100, // Will be recalculated by applyStatBonuses
                maxHealth: 100, // Base health, will be modified by stat bonuses
                mana: 100, // Will be recalculated by applyStatBonuses
                maxMana: 100, // Base mana, will be modified by stat bonuses
                leadership: 1,
                rations: 0, // Starting rations for dungeon resting
                // New stat system - all start at base 5
                strength: 5,      // Affects melee weapon attack
                dexterity: 5,     // Affects ranged weapon attack + crit chance (2.5% per point) + crit damage
                constitution: 5,  // Affects hit points (7 HP per point over 5)
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
            defendingThisTurn: false,
            // Reset combat states
            warriorTauntActive: false,
            tauntingWarrior: null
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
            this.ui.log(`Welcome ${heroName}! Your adventure begins!`);
            this.ui.render();
            this.ui.updateButtonStates(); // Ensure button states reflect new game state
            this.ui.showNotification(`Welcome ${heroName}!`, "success");
        }
        
        console.log('New game reset complete. Hero:', heroName, 'Gold:', this.gameState.hero.gold);
    }
    
    performBrowserRefresh() {
        // Clear only temporary localStorage data, preserve save games
        try {
            // Get all save games first
            const saves = {};
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('dungeonGameSave_')) {
                    saves[key] = localStorage.getItem(key);
                }
            }
            
            // Clear all localStorage
            localStorage.clear();
            
            // Restore save games
            Object.entries(saves).forEach(([key, value]) => {
                localStorage.setItem(key, value);
            });
            
            console.log('Cleared localStorage except save games. Preserved saves:', Object.keys(saves).length);
        } catch (error) {
            console.log('Could not manage localStorage:', error);
        }
        
        // Show message before refresh
        this.ui.showNotification("Refreshing browser for complete reset...", "info");
        
        // Refresh the browser after a short delay
        setTimeout(() => {
            window.location.reload();
        }, 1000);
    }

    saveGame() {
        try {
            const heroName = this.gameState.hero.name || 'Hero';
            const timestamp = new Date();
            
            // Create save data
            const saveData = {
                ...this.gameState,
                // Ensure we don't save temporary combat state
                currentEnemies: null,
                inCombat: false,
                defendingThisTurn: false,
                timestamp: timestamp.toISOString(),
                saveDate: timestamp.toLocaleString(),
                saveName: `${heroName} - Lv.${this.gameState.hero.level} - ${timestamp.toLocaleDateString()} ${timestamp.toLocaleTimeString()}`
            };
            
            // Create unique save key based on hero name and timestamp
            const saveKey = `dungeonGameSave_${heroName}_${Date.now()}`;
            
            localStorage.setItem(saveKey, JSON.stringify(saveData));
            
            // Verify the save actually worked
            const verification = localStorage.getItem(saveKey);
            if (verification) {
                this.ui.log(`Game saved as "${saveData.saveName}"!`);
                this.ui.showNotification(`Saved: ${heroName} Lv.${this.gameState.hero.level}`, "success");
                
                // Debug: Show what was saved
                console.log('Game saved with data:', {
                    saveKey: saveKey,
                    heroName: heroName,
                    heroLevel: saveData.hero.level,
                    heroGold: saveData.hero.gold,
                    heroHealth: saveData.hero.health,
                    underlings: saveData.hero.underlings.length,
                    dungeonLevel: saveData.dungeonLevel,
                    saveSize: verification.length + ' characters'
                });
            } else {
                throw new Error('Save verification failed - data not found in localStorage');
            }
            
        } catch (error) {
            this.ui.log("Failed to save game: " + error.message);
            this.ui.showNotification("Save failed!", "error");
            console.error('Save error:', error);
        }
    }

    loadGame() {
        try {
            // Get all save games from localStorage
            const saveGames = this.getAllSaveGames();
            
            console.log('Load attempt - found saves:', saveGames.length);
            
            if (saveGames.length === 0) {
                this.ui.log("No save files found.");
                this.ui.showNotification("No save files found!", "error");
                return;
            }
            
            // Show save selection modal
            this.showSaveSelectionModal(saveGames);
            
        } catch (error) {
            this.ui.log("Failed to load game: " + error.message);
            this.ui.showNotification("Load failed!", "error");
            console.error('Load error:', error);
        }
    }
    
    getAllSaveGames() {
        const saves = [];
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('dungeonGameSave_')) {
                try {
                    const data = localStorage.getItem(key);
                    const saveData = JSON.parse(data);
                    saves.push({
                        key: key,
                        data: saveData,
                        heroName: saveData.hero?.name || 'Unknown Hero',
                        level: saveData.hero?.level || 1,
                        gold: saveData.hero?.gold || 0,
                        dungeonLevel: saveData.dungeonLevel || 1,
                        timestamp: saveData.timestamp,
                        saveDate: saveData.saveDate || 'Unknown Date',
                        saveName: saveData.saveName || `${saveData.hero?.name || 'Hero'} - Lv.${saveData.hero?.level || 1}`
                    });
                } catch (error) {
                    console.warn('Corrupted save file:', key, error);
                }
            }
        }
        
        // Sort by timestamp (newest first)
        saves.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        return saves;
    }
    
    showSaveSelectionModal(saveGames) {
        const saveContent = `
            <div style="text-align: center; margin-bottom: ${this.getResponsiveMargin()};">
                <h3 style="color: #d4af37; font-size: ${this.getResponsiveFontSize(18)}px;">📚 Load Game</h3>
                <p style="font-size: ${this.getResponsiveFontSize(14)}px;">Choose a save file to load:</p>
            </div>
            <div style="max-height: ${this.isMobile ? '60vh' : '400px'}; overflow-y: auto; border: 1px solid #444; border-radius: ${this.getResponsiveBorderRadius()}; padding: ${this.getResponsivePadding()}; background: #1a1a2a;">
                ${saveGames.map((save, index) => `
                    <div style="display: flex; align-items: center; margin: ${this.getResponsiveMargin()} 0; padding: ${this.getResponsiveMargin()}; background: #2a2a3a; border-radius: ${this.getResponsiveBorderRadius()}; border-left: 4px solid #d4af37; cursor: pointer; transition: background 0.2s;" 
                         onclick="window.game.controller.loadSpecificSave('${save.key}')"
                         onmouseover="this.style.background='#3a3a4a'" 
                         onmouseout="this.style.background='#2a2a3a'">
                        <div style="flex: 1;">
                            <div style="font-weight: bold; color: #d4af37; font-size: ${this.getResponsiveFontSize(14)}px;">${save.heroName}</div>
                            <div style="color: #51cf66; font-size: ${this.getResponsiveFontSize(12)}px; margin: 2px 0;">Level ${save.level} • ${save.gold} Gold • Dungeon Lv.${save.dungeonLevel}</div>
                            <div style="color: #888; font-size: ${this.getResponsiveFontSize(10)}px;">${save.saveDate}</div>
                        </div>
                        <div style="margin-left: ${this.getResponsiveMargin()};">
                            <button onclick="event.stopPropagation(); window.game.controller.deleteSave('${save.key}', '${save.heroName}')" 
                                    style="padding: ${this.getResponsiveMargin()}; background: #8b0000; border: 1px solid #ff6b6b; color: white; border-radius: ${this.getResponsiveBorderRadius()}; cursor: pointer; font-size: ${this.getResponsiveFontSize(9)}px;">
                                🗑️ Delete
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
            <div style="margin-top: ${this.getResponsiveMargin()}; padding: ${this.getResponsivePadding()}; background: #2a2a3a; border-radius: ${this.getResponsiveBorderRadius()}; text-align: center;">
                <div style="font-size: ${this.getResponsiveFontSize(10)}px; color: #888; font-style: italic;">
                    💡 Click on a save to load it • Delete saves you no longer need
                </div>
            </div>
        `;

        this.ui.createModal("Load Game", saveContent, [
            {
                text: "Cancel",
                onClick: () => {}
            }
        ], { maxWidth: this.getResponsiveModalWidth() });
    }
    
    loadSpecificSave(saveKey) {
        try {
            const data = localStorage.getItem(saveKey);
            if (!data) {
                this.ui.log("Save file not found!");
                this.ui.showNotification("Save file not found!", "error");
                return;
            }
            
            const loadedState = JSON.parse(data);
            console.log('Loading save:', saveKey, 'Hero:', loadedState.hero?.name);
            
            // Close any open UI elements first
            this.closeDockedCombatPanel();
            
            // Close any open modals
            const modals = document.querySelectorAll('.modal-overlay');
            modals.forEach(modal => modal.remove());
            
            // Re-enable keyboard shortcuts (in case they were disabled)
            if (this.ui) {
                this.ui.enableKeyboardShortcuts();
            }
            
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
            
            // Ensure all stats are numbers and not undefined/null
            this.gameState.hero.strength = this.gameState.hero.strength || 5;
            this.gameState.hero.dexterity = this.gameState.hero.dexterity || 5;
            this.gameState.hero.constitution = this.gameState.hero.constitution || 5;
            this.gameState.hero.intelligence = this.gameState.hero.intelligence || 5;
            this.gameState.hero.willpower = this.gameState.hero.willpower || 5;
            this.gameState.hero.size = this.gameState.hero.size || 5;
            
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
                heroName: this.gameState.hero.name,
                heroLevel: this.gameState.hero.level,
                heroGold: this.gameState.hero.gold,
                heroHealth: this.gameState.hero.health,
                underlings: this.gameState.hero.underlings.length,
                dungeonLevel: this.gameState.dungeonLevel,
                timestamp: loadedState.timestamp
            });
            
            this.ui.log(`${this.gameState.hero.name} loaded successfully! (Saved: ${loadedState.saveDate || 'Unknown Date'})`);
            this.ui.render();
            this.ui.updateButtonStates(); // Explicitly refresh button states including shop gold display
            this.ui.showNotification(`Loaded: ${this.gameState.hero.name}`, "success");
            
        } catch (error) {
            this.ui.log("Failed to load save file: " + error.message);
            this.ui.showNotification("Load failed!", "error");
            console.error('Load specific save error:', error);
        }
    }
    
    deleteSave(saveKey, heroName) {
        if (confirm(`Delete save file for ${heroName}? This cannot be undone.`)) {
            try {
                localStorage.removeItem(saveKey);
                this.ui.log(`Deleted save file for ${heroName}.`);
                this.ui.showNotification(`Deleted: ${heroName}`, "info");
                
                // Refresh the load modal with updated save list
                setTimeout(() => {
                    const modals = document.querySelectorAll('.modal-overlay');
                    modals.forEach(modal => modal.remove());
                    this.loadGame(); // Reopen load modal with updated list
                }, 100);
                
            } catch (error) {
                this.ui.log("Failed to delete save file: " + error.message);
                this.ui.showNotification("Delete failed!", "error");
            }
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
        // Removed ui.render() to prevent old sprite display from showing
        
        // Show combat interface
        this.showCombatInterface();
    }

    generateEnemies() {
        const enemyCount = Math.floor(Math.random() * 3) + 1;
        this.gameState.currentEnemies = [];
        
        const enemyTypes = ['Goblin', 'Orc', 'Skeleton', 'Wolf', 'Spider'];
        const enemyTypeCounts = {}; // Track count for each enemy type
        
        for (let i = 0; i < enemyCount; i++) {
            const enemyType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
            
            // Increment count for this enemy type
            enemyTypeCounts[enemyType] = (enemyTypeCounts[enemyType] || 0) + 1;
            
            const enemy = {
                id: `${enemyType}_${Date.now()}_${i}`, // Unique identifier for each enemy
                name: enemyTypeCounts[enemyType] > 1 ? `${enemyType} ${enemyTypeCounts[enemyType]}` : enemyType,
                type: enemyType, // Store the base type for modifiers
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
        // Apply stat modifiers based on enemy type (use base type, not display name)
        const enemyType = enemy.type || enemy.name; // Fallback for compatibility
        switch(enemyType) {
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
        // Apply constitution and size bonuses to enemy health
        const healthBonus = this.calculateHealthBonus(enemy);
        const sizeHealthBonus = this.calculateSizeHealthBonus(enemy);
        
        // Calculate new health with minimum 10 HP cap
        const totalHealthBonus = healthBonus + sizeHealthBonus;
        const newMaxHealth = enemy.maxHealth + totalHealthBonus;
        const minimumHealth = 10; // Minimum 10 HP regardless of stat penalties
        
        enemy.maxHealth = Math.max(minimumHealth, newMaxHealth);
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
                    bonus += Math.floor((attacker.strength - 5) * 0.5); // STR bonus for melee
                }
                // Add SIZE bonus for melee weapons (can be negative)
                bonus += this.calculateSizeAttackBonus(attacker);
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
        
        // Only prevent negative bonuses for non-melee weapons or when STR component would make it positive
        if (weaponType !== 'melee') {
            return Math.max(0, bonus);
        }
        return bonus; // Allow negative total for melee if SIZE penalty is large
    }

    calculateHealthBonus(character) {
        // Constitution provides bonus/penalty HP: (CON - 5) * 7 HP
        if (!character || typeof character.constitution !== 'number' || isNaN(character.constitution)) {
            return 0;
        }
        return (character.constitution - 5) * 7;
    }

    calculateSizeHealthBonus(character) {
        // Size provides bonus/penalty HP: (SIZE - 5) * 7 HP
        // Larger size = more HP, smaller size = less HP
        if (!character || typeof character.size !== 'number' || isNaN(character.size)) {
            return 0;
        }
        return (character.size - 5) * 7;
    }

    calculateSizeAttackBonus(character) {
        // Size provides bonus/penalty to melee attack: (SIZE - 5) * 1
        // Larger size = more melee damage, smaller size = less melee damage
        if (!character || typeof character.size !== 'number' || isNaN(character.size)) {
            return 0;
        }
        return (character.size - 5) * 1;
    }

    calculateManaBonus(character) {
        // Intelligence and Willpower provide bonus mana: (INT + WIL - 10) * 2.5 mana
        if (!character || typeof character.intelligence !== 'number' || typeof character.willpower !== 'number' || 
            isNaN(character.intelligence) || isNaN(character.willpower)) {
            return 0;
        }
        return Math.max(0, (character.intelligence + character.willpower - 10) * 2.5);
    }

    calculateDefenseBonus(character) {
        // DEX above 5 increases defense, below 5 decreases it: (DEX - 5) * 0.75
        // SIZE above 5 decreases defense, below 5 increases it: (5 - SIZE) * 0.75
        if (!character || typeof character.dexterity !== 'number' || typeof character.size !== 'number' || 
            isNaN(character.dexterity) || isNaN(character.size)) {
            return 0;
        }
        
        const dexBonus = (character.dexterity - 5) * 0.75;  // +DEX = +defense
        const sizeBonus = (5 - character.size) * 0.75;     // +SIZE = -defense, -SIZE = +defense
        
        return dexBonus + sizeBonus;
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
            baseHealth -= character.previousSizeHealthBonus || 0;
            baseMana -= character.previousManaBonus || 0;
        }
        
        // Calculate new stat bonuses
        const healthBonus = this.calculateHealthBonus(character);
        const sizeHealthBonus = this.calculateSizeHealthBonus(character);
        const manaBonus = this.calculateManaBonus(character);
        
        // Apply new bonuses with minimum 10 HP cap
        const totalHealthBonus = healthBonus + sizeHealthBonus;
        const newMaxHealth = baseHealth + totalHealthBonus;
        const minimumHealth = 10; // Minimum 10 HP regardless of stat penalties
        
        character.maxHealth = Math.max(minimumHealth, newMaxHealth);
        character.maxMana = Math.max(1, baseMana + manaBonus);
        
        // Maintain current health/mana percentages
        character.health = Math.min(character.health, Math.floor(character.maxHealth * currentHealthPercent));
        character.mana = Math.min(character.mana, Math.floor(character.maxMana * currentManaPercent));
        
        // Track that bonuses have been applied
        character.statBonusesApplied = true;
        character.previousHealthBonus = healthBonus;
        character.previousSizeHealthBonus = sizeHealthBonus;
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
                <h3 style="text-align: center; color: #d4af37; margin-bottom: ${this.getResponsiveMargin()}; font-size: ${this.getResponsiveFontSize(20)}px;">⚔️ Combat Encounter ⚔️</h3>
                
                <div style="display: ${this.isMobile ? 'block' : 'flex'}; gap: ${this.getResponsiveGap()}; margin-bottom: ${this.getResponsiveMargin()};">
                    <!-- Enemies Section -->
                    <div style="flex: 1; background: #2a1a1a; padding: ${this.getResponsivePadding()}; border-radius: ${this.getResponsiveBorderRadius()}; border: 2px solid #8b0000; ${this.isMobile ? 'margin-bottom: 10px;' : ''}">
                        <h4 style="color: #ff6b6b; margin-bottom: ${this.getResponsiveMargin()}; text-align: center; font-size: ${this.getResponsiveFontSize(16)}px;">🔥 Enemies</h4>
                        ${enemies.map((enemy, index) => `
                            <div style="display: flex; align-items: center; margin: ${this.getResponsiveMargin()} 0; padding: ${this.getResponsiveMargin()}; background: #1a0000; border-radius: ${this.getResponsiveBorderRadius()}; border-left: 3px solid #ff6b6b;">
                                <div style="font-size: ${this.getResponsiveIconSize()}; margin-right: ${this.getResponsiveMargin()};">${getCharacterIcon(enemy.name)}</div>
                                <div style="flex: 1;">
                                    <div style="font-weight: bold; color: #ff6b6b; font-size: ${this.getResponsiveFontSize(14)}px;">${enemy.name}</div>
                                    <div style="font-size: ${this.getResponsiveFontSize(10)}px; color: #ccc;">Level ${enemy.level} | Attack: ${enemy.attack}</div>
                                    <div style="margin-top: 3px;">
                                        <span style="color: ${getHealthColor(enemy.health, enemy.maxHealth)}; font-weight: bold; font-size: ${this.getResponsiveFontSize(12)}px;">${enemy.health}</span>
                                        <span style="color: #888; font-size: ${this.getResponsiveFontSize(12)}px;">/${enemy.maxHealth} HP</span>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    
                    <!-- Player Party Section -->
                    <div style="flex: 1; background: #1a2a1a; padding: ${this.getResponsivePadding()}; border-radius: ${this.getResponsiveBorderRadius()}; border: 2px solid #228b22;">
                        <h4 style="color: #51cf66; margin-bottom: ${this.getResponsiveMargin()}; text-align: center; font-size: ${this.getResponsiveFontSize(16)}px;">🛡️ Your Party</h4>
                        
                        <!-- Hero -->
                        <div style="display: flex; align-items: center; margin: ${this.getResponsiveMargin()} 0; padding: ${this.getResponsiveMargin()}; background: #0a1a0a; border-radius: ${this.getResponsiveBorderRadius()}; border-left: 3px solid #d4af37;">
                            <div style="font-size: ${this.getResponsiveIconSize()}; margin-right: ${this.getResponsiveMargin()};">${getCharacterIcon('hero')}</div>
                            <div style="flex: 1;">
                                <div style="font-weight: bold; color: #d4af37; font-size: ${this.getResponsiveFontSize(14)}px;">${this.gameState.hero.name || 'Hero'}</div>
                                <div style="font-size: ${this.getResponsiveFontSize(10)}px; color: #ccc;">Level ${this.gameState.hero.level} | Leader</div>
                                <div style="margin-top: 3px;">
                                    <span style="color: ${getHealthColor(this.gameState.hero.health, this.gameState.hero.maxHealth)}; font-weight: bold; font-size: ${this.getResponsiveFontSize(12)}px;">${this.gameState.hero.health}</span>
                                    <span style="color: #888; font-size: ${this.getResponsiveFontSize(12)}px;">/${this.gameState.hero.maxHealth} HP</span>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Underlings -->
                        ${aliveUnderlings.map(underling => `
                            <div style="display: flex; align-items: center; margin: ${this.getResponsiveMargin()} 0; padding: ${this.getResponsiveMargin()}; background: #0a1a0a; border-radius: ${this.getResponsiveBorderRadius()}; border-left: 3px solid #51cf66;">
                                <div style="font-size: ${this.getResponsiveIconSize()}; margin-right: ${this.getResponsiveMargin()};">${getCharacterIcon(underling.type)}</div>
                                <div style="flex: 1;">
                                    <div style="font-weight: bold; color: #51cf66; font-size: ${this.getResponsiveFontSize(14)}px;">${underling.name}</div>
                                    <div style="font-size: ${this.getResponsiveFontSize(10)}px; color: #ccc;">Level ${underling.level} | ${underling.type}</div>
                                    <div style="margin-top: 3px;">
                                        <span style="color: ${getHealthColor(underling.health, underling.maxHealth)}; font-weight: bold; font-size: ${this.getResponsiveFontSize(12)}px;">${underling.health}</span>
                                        <span style="color: #888; font-size: ${this.getResponsiveFontSize(12)}px;">/${underling.maxHealth} HP</span>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                        
                        ${aliveUnderlings.length === 0 ? `<div style="text-align: center; color: #888; font-style: italic; padding: ${this.getResponsivePadding()}; font-size: ${this.getResponsiveFontSize(12)}px;">No underlings in party</div>` : ''}
                        
                        <!-- Show fallen underlings -->
                        ${this.gameState.hero.underlings.filter(u => !u.isAlive).map(underling => `
                            <div style="display: flex; align-items: center; margin: ${this.getResponsiveMargin()} 0; padding: ${this.getResponsiveMargin()}; background: #2a0a0a; border-radius: ${this.getResponsiveBorderRadius()}; border-left: 3px solid #666;">
                                <div style="font-size: ${this.getResponsiveIconSize()}; margin-right: ${this.getResponsiveMargin()}; opacity: 0.5;">💀</div>
                                <div style="flex: 1; opacity: 0.5;">
                                    <div style="font-weight: bold; color: #888; text-decoration: line-through; font-size: ${this.getResponsiveFontSize(14)}px;">${underling.name}</div>
                                    <div style="font-size: ${this.getResponsiveFontSize(10)}px; color: #666;">Fallen - needs resurrection</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <!-- Combat Actions -->
                <div style="background: rgba(42, 42, 58, 0.7); padding: ${this.getResponsivePadding()}; border-radius: ${this.getResponsiveBorderRadius()}; border: 2px solid #4a4a6a;">
                    <h4 style="color: #4ecdc4; margin-bottom: ${this.getResponsiveMargin()}; text-align: center; font-size: ${this.getResponsiveFontSize(16)}px; text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);">⚡ Choose Your Action</h4>
                    <div style="display: grid; grid-template-columns: ${this.isMobile ? '1fr 1fr' : '1fr 1fr'}; gap: ${this.getResponsiveMargin()};">
                        <button class="enhanced-combat-btn attack-btn" onclick="window.game.controller.playerAttack()" 
                                style="padding: ${this.getResponsiveButtonPadding()}; background: linear-gradient(45deg, #8b0000, #dc143c); border: 2px solid #ff6b6b; color: white; border-radius: ${this.getResponsiveBorderRadius()}; cursor: pointer; font-weight: bold; font-size: ${this.getResponsiveFontSize(12)}px; display: flex; align-items: center; justify-content: center; gap: 4px;">
                            ⚔️ Attack
                        </button>
                        <button class="enhanced-combat-btn defend-btn" onclick="window.game.controller.playerDefend()" 
                                style="padding: ${this.getResponsiveButtonPadding()}; background: linear-gradient(45deg, #2a4d3a, #4a7c59); border: 2px solid #51cf66; color: white; border-radius: ${this.getResponsiveBorderRadius()}; cursor: pointer; font-weight: bold; font-size: ${this.getResponsiveFontSize(12)}px; display: flex; align-items: center; justify-content: center; gap: 4px;">
                            🛡️ Defend
                        </button>
                        <button class="enhanced-combat-btn item-btn" onclick="window.game.controller.showCombatItemSelection()" 
                                style="padding: ${this.getResponsiveButtonPadding()}; background: linear-gradient(45deg, #4a4a2d, #7a7a3a); border: 2px solid #ffd93d; color: white; border-radius: ${this.getResponsiveBorderRadius()}; cursor: pointer; font-weight: bold; font-size: ${this.getResponsiveFontSize(12)}px; display: flex; align-items: center; justify-content: center; gap: 4px;">
                            🧪 Use Item
                        </button>
                        <button class="enhanced-combat-btn flee-btn" onclick="window.game.controller.playerFlee()" 
                                style="padding: ${this.getResponsiveButtonPadding()}; background: linear-gradient(45deg, #3a3a4a, #5a5a7a); border: 2px solid #9966cc; color: white; border-radius: ${this.getResponsiveBorderRadius()}; cursor: pointer; font-weight: bold; font-size: ${this.getResponsiveFontSize(12)}px; display: flex; align-items: center; justify-content: center; gap: 4px;">
                            💨 Flee
                        </button>
                    </div>
                    
                    <div style="margin-top: ${this.getResponsiveMargin()}; padding: ${this.getResponsiveMargin()}; background: rgba(26, 26, 42, 0.8); border-radius: ${this.getResponsiveBorderRadius()}; text-align: center;">
                        <div style="font-size: ${this.getResponsiveFontSize(10)}px; color: #ccc; font-style: italic; text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);">
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
                top: ${this.getResponsiveModalMargin()};
                left: ${this.getResponsiveModalMargin()};
                right: ${this.getResponsiveModalMargin()};
                bottom: ${this.getResponsiveModalMargin()};
                background: rgba(0, 0, 0, 0.3);
                border: 3px solid #d4af37;
                border-radius: ${this.getResponsiveBorderRadius()};
                z-index: 1000;
                display: flex;
                flex-direction: column;
                padding: ${this.getResponsiveModalPadding()};
                backdrop-filter: blur(3px);
            ">
                <div style="
                    flex: 1;
                    display: ${this.isMobile ? 'block' : 'flex'};
                    gap: ${this.isMobile ? '5px' : '20px'};
                    overflow: hidden;
                ">
                    <!-- Combat Interface Section -->
                    <div style="
                        flex: 1;
                        ${this.isMobile ? 'margin-bottom: 5px;' : ''}
                        background: rgba(20, 20, 40, 0.4);
                        border-radius: ${this.getResponsiveBorderRadius()};
                        padding: ${this.getResponsivePadding()};
                        overflow-y: auto;
                        border: 2px solid #4a4a6a;
                        ${this.isMobile ? `max-height: ${this.getResponsiveCombatHeight()};` : ''}
                    ">
                        ${combatContent}
                    </div>
                    
                    <!-- Chat Window Section -->
                    <div style="
                        flex: 1;
                        background: rgba(40, 20, 20, 0.4);
                        border-radius: ${this.getResponsiveBorderRadius()};
                        padding: ${this.getResponsivePadding()};
                        display: flex;
                        flex-direction: column;
                        border: 2px solid #8b4513;
                        ${this.isMobile ? `max-height: ${this.getResponsiveChatHeight()};` : ''}
                    ">
                        <h4 style="color: #d4af37; margin-bottom: ${this.getResponsiveMargin()}; text-align: center; border-bottom: 1px solid #444; padding-bottom: ${this.getResponsiveMargin()}; font-size: ${this.getResponsiveFontSize(16)}px;">
                            📜 Combat Log
                        </h4>
                        <div id="combat-chat-display" style="
                            flex: 1;
                            overflow-y: auto;
                            background: rgba(0, 0, 0, 0.2);
                            border-radius: ${this.getResponsiveBorderRadius()};
                            padding: ${this.getResponsiveMargin()};
                            border: 1px solid #666;
                            font-family: Arial, sans-serif;
                            font-size: ${this.getResponsiveFontSize(12)}px;
                            line-height: 1.5;
                            font-weight: normal;
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
            // Show last 50 messages to take advantage of larger chat area
            const recentMessages = this.gameState.chatLog.slice(-50);
            chatDisplay.innerHTML = recentMessages.map(msg => 
                `<div style="margin-bottom: 8px; font-family: Arial, sans-serif; font-weight: bold; line-height: 1.3;">${this.colorizeMessage(msg)}</div>`
            ).join('');
            
            // Auto-scroll to bottom
            chatDisplay.scrollTop = chatDisplay.scrollHeight;
        }
    }

    colorizeMessage(message) {
        let coloredMessage = message;
        
        // Critical hits - bright red/orange
        if (message.includes('CRITICAL HIT')) {
            coloredMessage = coloredMessage.replace(/CRITICAL HIT!/g, '<span style="color: #ff4444; font-weight: bold; text-shadow: 0 0 5px #ff4444;">⚡ CRITICAL HIT! ⚡</span>');
        }
        
        // Damage numbers - orange/red
        coloredMessage = coloredMessage.replace(/(\d+) damage/g, '<span style="color: #ff9933; font-weight: bold;">$1 damage</span>');
        
        // Healing - green
        coloredMessage = coloredMessage.replace(/(\d+) HP/g, '<span style="color: #33ff66;">$1 HP</span>');
        coloredMessage = coloredMessage.replace(/(\d+) MP/g, '<span style="color: #3366ff;">$1 MP</span>');
        coloredMessage = coloredMessage.replace(/Healing Light|heals|restored/gi, '<span style="color: #33ff66;">$&</span>');
        
        // Special abilities - purple/magenta
        coloredMessage = coloredMessage.replace(/Protective Taunt|Arcane Blast|casts/gi, '<span style="color: #cc66ff; font-weight: bold;">$&</span>');
        
        // Gold and experience - yellow
        coloredMessage = coloredMessage.replace(/(\d+) gold/gi, '<span style="color: #ffd700; font-weight: bold;">💰$1 gold</span>');
        coloredMessage = coloredMessage.replace(/(\d+) experience/gi, '<span style="color: #ffcc00; font-weight: bold;">⭐$1 experience</span>');
        
        // Enemy defeat - bright green
        coloredMessage = coloredMessage.replace(/is defeated/gi, '<span style="color: #00ff88; font-weight: bold; text-shadow: 0 0 3px #00ff88;">💀 is defeated</span>');
        
        // Player/party actions - cyan
        coloredMessage = coloredMessage.replace(/You attack|attacks you|attacks/g, '<span style="color: #00ccff;">$&</span>');
        
        // Stat bonuses - light blue
        coloredMessage = coloredMessage.replace(/\(\+\d+ \w+[^)]*\)/g, '<span style="color: #66ccff; font-size: 0.9em;">$&</span>');
        
        // Defense/protection - blue
        coloredMessage = coloredMessage.replace(/Reduced by defending|Taunt defense|defense/gi, '<span style="color: #4488ff;">$&</span>');
        
        // Status messages - different colors based on type
        if (message.includes('fallen') || message.includes('defeated') && !message.includes('is defeated')) {
            coloredMessage = `<span style="color: #ff6666;">${coloredMessage}</span>`;
        } else if (message.includes('gained') || message.includes('level')) {
            coloredMessage = `<span style="color: #66ff99;">${coloredMessage}</span>`;
        } else if (message.includes('uses') || message.includes('casts')) {
            coloredMessage = `<span style="color: #ffaa66;">${coloredMessage}</span>`;
        } else {
            coloredMessage = `<span style="color: #e0e0e0;">${coloredMessage}</span>`;
        }
        
        return coloredMessage;
    }

    ensureHeroStatsInitialized() {
        // Ensure all hero stats are properly initialized with default values
        if (!this.gameState.hero.strength || this.gameState.hero.strength === undefined) {
            this.gameState.hero.strength = 5;
        }
        if (!this.gameState.hero.dexterity || this.gameState.hero.dexterity === undefined) {
            this.gameState.hero.dexterity = 5;
        }
        if (!this.gameState.hero.constitution || this.gameState.hero.constitution === undefined) {
            this.gameState.hero.constitution = 5;
        }
        if (!this.gameState.hero.intelligence || this.gameState.hero.intelligence === undefined) {
            this.gameState.hero.intelligence = 5;
        }
        if (!this.gameState.hero.willpower || this.gameState.hero.willpower === undefined) {
            this.gameState.hero.willpower = 5;
        }
        if (!this.gameState.hero.size || this.gameState.hero.size === undefined) {
            this.gameState.hero.size = 5;
        }
    }

    closeEnhancedCombatModal() {
        const modal = document.getElementById('enhanced-combat-modal');
        if (modal) {
            modal.remove();
        }
        
        // Also clean up any victory-related elements
        const victoryOverlay = document.getElementById('victory-confirmation-overlay');
        if (victoryOverlay) {
            victoryOverlay.remove();
        }
        
        const returnButton = document.getElementById('return-to-victory-btn');
        if (returnButton) {
            returnButton.remove();
        }
    }

    playerAttack() {
        console.log('Player attack called');
        
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
            this.showVictoryConfirmation();
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
            
            // Remove the specific defeated enemy by ID, not by position
            this.gameState.currentEnemies = this.gameState.currentEnemies.filter(enemy => enemy.id !== target.id);
            
            // Check if all enemies defeated
            if (this.gameState.currentEnemies.length === 0) {
                this.ui.log("All enemies defeated! You can continue deeper or exit the dungeon.");
                this.checkLevelUp();
                this.ui.render();
                this.showVictoryConfirmation();
                return;
            }
        }

        // Update combat chat display immediately to show combat results
        this.updateCombatChatDisplay();
        
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
        
        // Update combat chat display immediately
        this.updateCombatChatDisplay();
        
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
            this.showVictoryConfirmation();
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
            
            // Apply stat-based defense bonus
            const defenseBonus = this.calculateDefenseBonus(target);
            if (defenseBonus !== 0) {
                const defenseMult = Math.max(0.1, 1 - (defenseBonus * 0.05)); // Each defense point = 5% damage reduction, min 10% damage
                actualDamage = Math.floor(actualDamage * defenseMult);
            }
            
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
            const defenseText = defenseBonus !== 0 ? ` (${defenseBonus > 0 ? '+' : ''}${defenseBonus.toFixed(1)} defense)` : '';
            
            if (target === this.gameState.hero) {
                this.ui.log(`${enemy.name} attacks you for ${actualDamage} damage!${critText}${statText}${defendText}${defenseText}${tauntDefenseBonus} (Hero: ${Math.max(0, this.gameState.hero.health)}/${this.gameState.hero.maxHealth} HP)`);
                
                // Check if player is defeated
                if (this.gameState.hero.health <= 0) {
                    this.playerDefeated();
                    return;
                }
            } else {
                // Underling was attacked
                const underlingIndex = this.gameState.hero.underlings.findIndex(u => u === target);
                this.ui.log(`${enemy.name} attacks ${target.name} for ${actualDamage} damage!${this.gameState.defendingThisTurn ? ' (Reduced by defending)' : ''}${defenseText}${tauntDefenseBonus} (${target.name}: ${Math.max(0, target.health)}/${target.maxHealth} HP)`);
                
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

    showVictoryConfirmation() {
        // Show the victory confirmation overlay with combat log review option
        this.createVictoryConfirmationOverlay();
    }

    createVictoryConfirmationOverlay() {
        // Remove any existing victory overlay
        const existingOverlay = document.getElementById('victory-confirmation-overlay');
        if (existingOverlay) {
            existingOverlay.remove();
        }

        const aliveUnderlings = this.gameState.hero.underlings.filter(u => u.isAlive);
        
        // Helper function to get health color
        const getHealthColor = (current, max) => {
            const ratio = current / max;
            if (ratio <= 0.3) return '#ff6b6b';
            if (ratio <= 0.6) return '#ffd93d';
            return '#51cf66';
        };

        const victoryOverlayHtml = `
            <div id="victory-confirmation-overlay" style="
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.8);
                z-index: 2000;
                display: flex;
                align-items: center;
                justify-content: center;
                backdrop-filter: blur(3px);
                padding: ${this.getResponsiveModalMargin()};
            ">
                <div style="
                    background: linear-gradient(135deg, #1a2a1a, #2a3a2a);
                    border: 3px solid #d4af37;
                    border-radius: ${this.getResponsiveBorderRadius()};
                    padding: ${this.getResponsiveModalPadding()};
                    max-width: ${this.getResponsiveModalWidth()};
                    width: 90%;
                    max-height: ${this.getResponsiveModalHeight()};
                    overflow-y: auto;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.8);
                ">
                    <div style="text-align: center; margin-bottom: ${this.getResponsiveMargin()};">
                        <h2 style="color: #d4af37; margin: 0 0 ${this.getResponsiveMargin()} 0; font-size: ${this.getResponsiveFontSize(24)}px; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">
                            🎉 VICTORY! 🎉
                        </h2>
                        <div style="color: #51cf66; font-size: ${this.getResponsiveFontSize(16)}px; font-weight: bold;">
                            All enemies have been defeated!
                        </div>
                    </div>

                    <!-- Party Status -->
                    <div style="background: #0a1a0a; padding: ${this.getResponsivePadding()}; border-radius: ${this.getResponsiveBorderRadius()}; margin-bottom: ${this.getResponsiveMargin()}; border: 2px solid #51cf66;">
                        <h3 style="color: #51cf66; margin: 0 0 ${this.getResponsiveMargin()} 0; text-align: center; font-size: ${this.getResponsiveFontSize(16)}px;">🛡️ Party Status</h3>
                        
                        <!-- Hero Status -->
                        <div style="display: flex; align-items: center; padding: ${this.getResponsiveMargin()}; background: #1a1a2a; border-radius: ${this.getResponsiveBorderRadius()}; margin-bottom: ${this.getResponsiveMargin()}; border-left: 4px solid #d4af37;">
                            <div style="font-size: ${this.getResponsiveIconSize()}; margin-right: ${this.getResponsiveMargin()};">👑</div>
                            <div style="flex: 1;">
                                <div style="color: #d4af37; font-weight: bold; font-size: ${this.getResponsiveFontSize(14)}px;">${this.gameState.hero.name || 'Hero'} (Level ${this.gameState.hero.level})</div>
                                <div style="margin-top: 3px;">
                                    <span style="color: ${getHealthColor(this.gameState.hero.health, this.gameState.hero.maxHealth)}; font-weight: bold; font-size: ${this.getResponsiveFontSize(12)}px;">${this.gameState.hero.health}</span>
                                    <span style="color: #888; font-size: ${this.getResponsiveFontSize(12)}px;">/${this.gameState.hero.maxHealth} HP</span>
                                </div>
                            </div>
                        </div>

                        <!-- Underlings Status -->
                        ${aliveUnderlings.map(underling => `
                            <div style="display: flex; align-items: center; padding: ${this.getResponsiveMargin()}; background: #1a1a2a; border-radius: ${this.getResponsiveBorderRadius()}; margin-bottom: ${this.getResponsiveMargin()}; border-left: 4px solid #51cf66;">
                                <div style="font-size: ${this.getResponsiveIconSize()}; margin-right: ${this.getResponsiveMargin()};">${underling.type === 'archer' ? '🏹' : underling.type === 'warrior' ? '⚔️' : underling.type === 'mage' ? '🔮' : '⚡'}</div>
                                <div style="flex: 1;">
                                    <div style="color: #51cf66; font-weight: bold; font-size: ${this.getResponsiveFontSize(14)}px;">${underling.name} (Level ${underling.level})</div>
                                    <div style="margin-top: 3px; font-size: ${this.getResponsiveFontSize(12)}px;">
                                        <span style="color: ${getHealthColor(underling.health, underling.maxHealth)}; font-weight: bold;">${underling.health}</span>
                                        <span style="color: #888;">/${underling.maxHealth} HP</span>
                                    </div>
                                </div>
                            </div>
                        `).join('')}

                        ${aliveUnderlings.length === 0 ? `<div style="text-align: center; color: #888; font-style: italic; padding: ${this.getResponsivePadding()}; font-size: ${this.getResponsiveFontSize(12)}px;">Fighting solo - consider recruiting underlings!</div>` : ''}
                    </div>

                    <!-- Combat Summary -->
                    <div style="background: #0a2a0a; padding: ${this.getResponsivePadding()}; border-radius: ${this.getResponsiveBorderRadius()}; margin-bottom: ${this.getResponsiveMargin()}; border: 2px solid #4ecdc4;">
                        <div style="text-align: center;">
                            <div style="color: #4ecdc4; font-weight: bold; margin-bottom: ${this.getResponsiveMargin()}; font-size: ${this.getResponsiveFontSize(14)}px;">Combat Summary</div>
                            <div style="color: #ccc; font-size: ${this.getResponsiveFontSize(12)}px;">
                                Dungeon Level: <span style="color: #ffd93d; font-weight: bold;">${this.gameState.dungeonLevel}</span> | 
                                Gold: <span style="color: #ffd93d; font-weight: bold;">${this.gameState.hero.gold}</span> | 
                                Rations: <span style="color: #ffd93d; font-weight: bold;">${this.gameState.hero.rations || 0}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Action Buttons -->
                    <div style="text-align: center;">
                        <div style="color: #51cf66; margin-bottom: ${this.getResponsiveMargin()}; font-weight: bold; font-size: ${this.getResponsiveFontSize(14)}px;">
                            What would you like to do next?
                        </div>
                        <div style="display: grid; grid-template-columns: ${this.isMobile ? '1fr' : '1fr 1fr'}; gap: ${this.getResponsiveMargin()};">
                            <button onclick="window.game.controller.showVictoryOptions()" 
                                    style="padding: ${this.getResponsiveButtonPadding()}; background: linear-gradient(45deg, #2a4d3a, #4a7c59); border: 2px solid #51cf66; color: white; border-radius: ${this.getResponsiveBorderRadius()}; cursor: pointer; font-weight: bold; font-size: ${this.getResponsiveFontSize(14)}px; transition: all 0.3s;">
                                ✅ Continue to Victory Options
                            </button>
                            <button onclick="window.game.controller.continueViewingCombatLog()" 
                                    style="padding: ${this.getResponsiveButtonPadding()}; background: linear-gradient(45deg, #4a4a2d, #7a7a3a); border: 2px solid #ffd93d; color: white; border-radius: ${this.getResponsiveBorderRadius()}; cursor: pointer; font-weight: bold; font-size: ${this.getResponsiveFontSize(14)}px; transition: all 0.3s;">
                                📜 Review Combat Log
                            </button>
                        </div>
                        
                        <div style="margin-top: ${this.getResponsiveMargin()}; padding: ${this.getResponsiveMargin()}; background: #1a1a2a; border-radius: ${this.getResponsiveBorderRadius()}; border: 1px solid #444;">
                            <div style="font-size: ${this.getResponsiveFontSize(10)}px; color: #888; font-style: italic;">
                                💡 The combat log remains visible behind this dialog. Review it carefully before proceeding!
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add the overlay to the page
        document.body.insertAdjacentHTML('beforeend', victoryOverlayHtml);

        // Add hover effects to buttons
        setTimeout(() => {
            const buttons = document.querySelectorAll('#victory-confirmation-overlay button');
            buttons.forEach(button => {
                button.addEventListener('mouseenter', () => {
                    button.style.transform = 'scale(1.05)';
                    button.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.3)';
                });
                button.addEventListener('mouseleave', () => {
                    button.style.transform = 'scale(1)';
                    button.style.boxShadow = 'none';
                });
            });
        }, 100);
    }

    continueViewingCombatLog() {
        // Close the victory confirmation overlay to allow full access to the combat log
        const victoryOverlay = document.getElementById('victory-confirmation-overlay');
        if (victoryOverlay) {
            victoryOverlay.remove();
        }
        
        // Log a message and keep the combat interface open for log review
        this.ui.log("Victory confirmation dismissed. Review the combat log below.");
        this.ui.showNotification("Combat log available for review. Check the chat area!", "info");
        
        // Add a "Return to Victory Options" button to the combat interface
        this.addReturnToVictoryButton();
        
        // The combat log remains accessible and the enhanced combat modal stays open
    }

    addReturnToVictoryButton() {
        // Add a floating button to return to victory options
        const existingButton = document.getElementById('return-to-victory-btn');
        if (existingButton) {
            existingButton.remove();
        }

        const returnButtonHtml = `
            <div id="return-to-victory-btn" style="
                position: fixed;
                top: ${this.isMobile ? '10px' : '50%'};
                right: ${this.isMobile ? '10px' : '30px'};
                ${this.isMobile ? '' : 'transform: translateY(-50%);'}
                z-index: 1500;
                background: linear-gradient(45deg, #2a4d3a, #4a7c59);
                border: 3px solid #51cf66;
                border-radius: ${this.getResponsiveBorderRadius()};
                padding: ${this.getResponsiveButtonPadding()};
                box-shadow: 0 8px 25px rgba(0, 0, 0, 0.6);
                cursor: pointer;
                transition: all 0.3s ease;
                backdrop-filter: blur(5px);
                max-width: ${this.isMobile ? '150px' : '200px'};
            " onclick="window.game.controller.returnToVictoryOptions()">
                <div style="text-align: center;">
                    <div style="font-size: ${this.getResponsiveIconSize()}; margin-bottom: 4px;">🏆</div>
                    <div style="color: white; font-weight: bold; font-size: ${this.getResponsiveFontSize(12)}px; margin-bottom: 3px;">
                        Ready to Proceed?
                    </div>
                    <div style="color: #51cf66; font-size: ${this.getResponsiveFontSize(10)}px; font-style: italic;">
                        Click to return to victory options
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', returnButtonHtml);

        // Add hover effects
        const button = document.getElementById('return-to-victory-btn');
        if (button) {
            button.addEventListener('mouseenter', () => {
                button.style.transform = 'translateY(-50%) scale(1.05)';
                button.style.boxShadow = '0 12px 35px rgba(0, 0, 0, 0.8)';
                button.style.borderColor = '#70e070';
            });
            button.addEventListener('mouseleave', () => {
                button.style.transform = 'translateY(-50%) scale(1)';
                button.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.6)';
                button.style.borderColor = '#51cf66';
            });
        }
    }

    returnToVictoryOptions() {
        // Remove the return button
        const returnButton = document.getElementById('return-to-victory-btn');
        if (returnButton) {
            returnButton.remove();
        }
        
        // Show the victory options directly
        this.showVictoryOptions();
    }

    showVictoryOptions() {
        // Close the victory confirmation overlay
        const victoryOverlay = document.getElementById('victory-confirmation-overlay');
        if (victoryOverlay) {
            victoryOverlay.remove();
        }
        
        // Remove the return to victory button if it exists
        const returnButton = document.getElementById('return-to-victory-btn');
        if (returnButton) {
            returnButton.remove();
        }
        
        // DON'T close the enhanced combat modal yet - keep it for log review
        // this.closeEnhancedCombatModal(); // Commented out to preserve combat log
        
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
                <h4 style="color: #d4af37; margin-bottom: ${this.getResponsiveMargin()};">🎉 Victory! 🎉</h4>
                <p style="margin-bottom: ${this.getResponsiveMargin()}; font-size: ${this.getResponsiveFontSize(14)}px;">All enemies in this area have been defeated!</p>
                <p style="margin-bottom: ${this.getResponsiveMargin()}; font-size: ${this.getResponsiveFontSize(14)}px;">What would you like to do next?</p>
                
                <div style="background: #2a2a3a; padding: ${this.getResponsivePadding()}; border-radius: ${this.getResponsiveBorderRadius()}; margin: ${this.getResponsiveMargin()} 0;">
                    <div style="font-size: ${this.getResponsiveFontSize(14)}px; color: #4ecdc4; margin-bottom: ${this.getResponsiveMargin()};">
                        <strong>Current Status:</strong>
                    </div>
                    <div style="font-size: ${this.getResponsiveFontSize(12)}px; color: #ccc;">
                        Dungeon Level: ${this.gameState.dungeonLevel} | 
                        Rations: ${this.gameState.hero.rations} | 
                        Gold: ${this.gameState.hero.gold}
                    </div>
                </div>
                
                ${this.gameState.hero.rations > 0 ? 
                    `<div style="background: #1a3a1a; padding: ${this.getResponsivePadding()}; border-radius: ${this.getResponsiveBorderRadius()}; margin: ${this.getResponsiveMargin()} 0; border-left: 3px solid #51cf66;"><small style="color: #51cf66; font-size: ${this.getResponsiveFontSize(10)}px;">💡 You have rations available - you can Rest to stay on this level and explore more!</small></div>` : 
                    `<div style="background: #3a1a1a; padding: ${this.getResponsivePadding()}; border-radius: ${this.getResponsiveBorderRadius()}; margin: ${this.getResponsiveMargin()} 0; border-left: 3px solid #ff6b6b;"><small style="color: #ff6b6b; font-size: ${this.getResponsiveFontSize(10)}px;">⚠ No rations available - buy some from the shop to enable resting in dungeons!</small></div>`
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
        
        // Close the enhanced combat modal
        this.closeEnhancedCombatModal();
        
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
                <h4 style="color: #d4af37; margin-bottom: ${this.getResponsiveMargin()}; font-size: ${this.getResponsiveFontSize(16)}px;">🛡️ Rested and Ready 🛡️</h4>
                <p style="margin-bottom: ${this.getResponsiveMargin()}; font-size: ${this.getResponsiveFontSize(14)}px;">Your party has recovered from their trials.</p>
                <p style="margin-bottom: ${this.getResponsiveMargin()}; font-size: ${this.getResponsiveFontSize(14)}px;">Ready to continue exploring this dungeon level?</p>
                
                <div style="background: #2a2a3a; padding: ${this.getResponsivePadding()}; border-radius: ${this.getResponsiveBorderRadius()}; margin: ${this.getResponsiveMargin()} 0;">
                    <div style="font-size: ${this.getResponsiveFontSize(14)}px; color: #4ecdc4; margin-bottom: ${this.getResponsiveMargin()};">
                        <strong>Current Status:</strong>
                    </div>
                    <div style="font-size: ${this.getResponsiveFontSize(12)}px; color: #ccc;">
                        Dungeon Level: ${this.gameState.dungeonLevel} | 
                        Rations: ${this.gameState.hero.rations} | 
                        Hero HP: ${this.gameState.hero.health}/${this.gameState.hero.maxHealth}
                    </div>
                </div>
                
                <div style="background: #1a3a1a; padding: ${this.getResponsivePadding()}; border-radius: ${this.getResponsiveBorderRadius()}; margin: ${this.getResponsiveMargin()} 0; border-left: 3px solid #51cf66;">
                    <small style="color: #51cf66; font-size: ${this.getResponsiveFontSize(10)}px;">💡 Exploring will generate new enemies on the same dungeon level</small>
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
        // Close any existing combat modals before starting new combat
        this.closeEnhancedCombatModal();
        
        // Close any open modals
        const existingModals = document.querySelectorAll('.modal-overlay');
        existingModals.forEach(modal => modal.remove());
        
        // Generate new enemies on the same level
        this.gameState.inCombat = true;
        this.generateEnemies();
        
        this.ui.log(`🔍 Exploring deeper into dungeon level ${this.gameState.dungeonLevel}...`);
        this.ui.log("New enemies block your path!");
        // Removed ui.render() to prevent old sprite display from showing
        
        setTimeout(() => this.showCombatInterface(), 500);
    }

    goDeeperInDungeon() {
        // Close any existing combat modals before starting new combat
        this.closeEnhancedCombatModal();
        
        // Close any other open modals
        const existingModals = document.querySelectorAll('.modal-overlay');
        existingModals.forEach(modal => modal.remove());
        
        this.gameState.dungeonLevel++;
        this.gameState.inCombat = true;
        this.ui.log(`Descending to dungeon level ${this.gameState.dungeonLevel}...`);
        this.generateEnemies();
        
        // Change to a different random dungeon background
        this.ui.setBackground('dungeon');
        
        this.ui.log("New enemies block your path!");
        // Removed ui.render() to prevent old sprite display from showing
        
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
            <div style="text-align: center; margin-bottom: ${this.getResponsiveMargin()};">
                <h3 style="color: #d4af37; margin-bottom: ${this.getResponsiveMargin()}; font-size: ${this.getResponsiveFontSize(18)}px;">🔨 Crafting Workshop 🔨</h3>
                <p style="color: #51cf66; font-weight: bold; font-size: ${this.getResponsiveFontSize(14)}px;">Your Gold: ${this.gameState.hero.gold}</p>
            </div>
            
            <div style="max-height: ${this.getResponsiveModalHeight()}; overflow-y: auto; border: 1px solid #444; border-radius: ${this.getResponsiveBorderRadius()}; padding: ${this.getResponsivePadding()}; background: #1a1a2a;">
                <div style="display: grid; grid-template-columns: 2fr 1fr 1fr; gap: ${this.getResponsiveMargin()}; margin-bottom: ${this.getResponsiveMargin()}; padding: ${this.getResponsivePadding()}; background: #2a2a3a; border-radius: ${this.getResponsiveBorderRadius()}; font-weight: bold; color: #d4af37; font-size: ${this.getResponsiveFontSize(12)}px;">
                    <div>Item Name & Description</div>
                    <div style="text-align: center;">Cost</div>
                    <div style="text-align: center;">Action</div>
                </div>
                
                ${craftableItems.map(item => `
                    <div style="display: grid; grid-template-columns: 2fr 1fr 1fr; gap: ${this.getResponsiveMargin()}; align-items: center; padding: ${this.getResponsivePadding()}; margin: ${this.getResponsiveMargin()} 0; background: ${this.gameState.hero.gold >= item.cost ? '#0a2a0a' : '#2a0a0a'}; border-radius: ${this.getResponsiveBorderRadius()}; border-left: 3px solid ${this.gameState.hero.gold >= item.cost ? '#51cf66' : '#ff6b6b'};">
                        <div>
                            <div style="font-weight: bold; color: ${this.gameState.hero.gold >= item.cost ? '#51cf66' : '#ff6b6b'}; font-size: ${this.getResponsiveFontSize(14)}px;">${item.name}</div>
                            <div style="font-size: ${this.getResponsiveFontSize(12)}px; color: #ccc; margin-top: 3px;">${item.description}</div>
                        </div>
                        <div style="text-align: center; font-weight: bold; color: #ffd93d; font-size: ${this.getResponsiveFontSize(14)}px;">${item.cost}g</div>
                        <div style="text-align: center;">
                            <button onclick="window.game.controller.craftItem('${item.id}', ${item.cost})" 
                                    style="padding: ${this.getResponsiveButtonPadding()}; background: ${this.gameState.hero.gold >= item.cost ? 'linear-gradient(45deg, #2a4d3a, #4a7c59)' : 'linear-gradient(45deg, #4a2a2a, #6a3a3a)'}; 
                                           border: 1px solid ${this.gameState.hero.gold >= item.cost ? '#51cf66' : '#ff6b6b'}; color: white; border-radius: ${this.getResponsiveBorderRadius()}; cursor: ${this.gameState.hero.gold >= item.cost ? 'pointer' : 'not-allowed'}; 
                                           font-size: ${this.getResponsiveFontSize(12)}px; font-weight: bold;"
                                    ${this.gameState.hero.gold < item.cost ? 'disabled' : ''}>
                                🔨 Craft
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
            
            <div style="margin-top: ${this.getResponsiveMargin()}; padding: ${this.getResponsivePadding()}; background: #2a2a3a; border-radius: ${this.getResponsiveBorderRadius()}; text-align: center;">
                <div style="font-size: ${this.getResponsiveFontSize(10)}px; color: #888; font-style: italic;">
                    💡 Tip: Different weapon types benefit from different stats - STR (melee), DEX (ranged), INT (arcane), WIL (divine)
                </div>
            </div>
        `;

        this.createDockedModal("Crafting Workshop", craftingContent, [
            {
                text: "Close Workshop",
                onClick: () => {
                    document.querySelector('.docked-modal')?.remove();
                    this.returnToVillage();
                }
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
        
        // Refresh the crafting modal to show updated gold amounts
        setTimeout(() => {
            // Close the current modal and reopen cleanly
            const modals = document.querySelectorAll('.docked-modal');
            modals.forEach(modal => modal.remove());
            this.openCrafting();
        }, 100);
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
        
        // Define available underlings with their details
        const availableUnderlings = [
            {
                id: 'archer',
                name: 'Archer',
                cost: 100,
                description: 'Ranged damage dealer with precise shots',
                icon: '🏹'
            },
            {
                id: 'warrior',
                name: 'Warrior',
                cost: 150,
                description: 'Melee tank with protective taunt ability',
                icon: '⚔️'
            },
            {
                id: 'healer',
                name: 'Healer',
                cost: 175,
                description: 'Support specialist with healing magic',
                icon: '✨'
            },
            {
                id: 'mage',
                name: 'Mage',
                cost: 200,
                description: 'Magic damage and arcane support',
                icon: '🔮'
            }
        ];
        
        const recruitmentContent = `
            <div style="text-align: center; margin-bottom: 15px;">
                <h3 style="color: #d4af37; margin-bottom: 10px;">🏰 Recruitment Center 🏰</h3>
                <p style="color: #51cf66; font-weight: bold;">Your Gold: ${this.gameState.hero.gold}</p>
                <p style="color: #4ecdc4;">Current Underlings: ${this.gameState.hero.underlings.length} / ${this.gameState.hero.leadership} (Leadership limit)</p>
                ${this.gameState.hero.underlings.length >= this.gameState.hero.leadership ? 
                    '<p style="color: #ff6b6b; font-weight: bold;">⚠ Leadership limit reached! Upgrade leadership to recruit more.</p>' : 
                    '<p style="color: #51cf66;">✅ You can recruit more underlings!</p>'
                }
            </div>
            
            <div style="max-height: 400px; overflow-y: auto; border: 1px solid #444; border-radius: 8px; padding: 10px; background: #1a1a2a;">
                <div style="display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 10px; margin-bottom: 10px; padding: 8px; background: #2a2a3a; border-radius: 5px; font-weight: bold; color: #d4af37;">
                    <div>Underling Type & Abilities</div>
                    <div style="text-align: center;">Cost</div>
                    <div style="text-align: center;">Action</div>
                </div>
                
                ${availableUnderlings.map(underling => {
                    const canAfford = this.gameState.hero.gold >= underling.cost;
                    const canRecruit = this.gameState.hero.underlings.length < this.gameState.hero.leadership;
                    const isAvailable = canAfford && canRecruit;
                    
                    return `
                    <div style="display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 10px; align-items: center; padding: 12px; margin: 5px 0; background: ${isAvailable ? '#0a2a0a' : '#2a0a0a'}; border-radius: 5px; border-left: 3px solid ${isAvailable ? '#51cf66' : '#ff6b6b'};">
                        <div>
                            <div style="font-weight: bold; color: ${isAvailable ? '#51cf66' : '#ff6b6b'};">${underling.icon} ${underling.name}</div>
                            <div style="font-size: 12px; color: #ccc; margin-top: 3px;">${underling.description}</div>
                        </div>
                        <div style="text-align: center; font-weight: bold; color: #ffd93d;">💰${underling.cost}g</div>
                        <div style="text-align: center;">
                            <button onclick="window.game.controller.recruitUnderling('${underling.id}', ${underling.cost})" 
                                    style="padding: 6px 12px; background: ${isAvailable ? 'linear-gradient(45deg, #2a4d3a, #4a7c59)' : 'linear-gradient(45deg, #4a2a2a, #6a3a3a)'}; 
                                           border: 1px solid ${isAvailable ? '#51cf66' : '#ff6b6b'}; color: white; border-radius: 4px; cursor: ${isAvailable ? 'pointer' : 'not-allowed'}; 
                                           font-size: 12px; font-weight: bold;"
                                    ${!isAvailable ? 'disabled' : ''}>
                                🤝 Recruit
                            </button>
                        </div>
                    </div>
                    `;
                }).join('')}
            </div>
            
            <div style="margin-top: 15px; padding: 10px; background: #2a2a3a; border-radius: 5px; text-align: center;">
                <div style="font-size: 12px; color: #888; font-style: italic;">
                    💡 Tip: Upgrade your Leadership in the Characters menu to recruit more underlings
                </div>
            </div>
        `;

        this.createDockedModal("Recruitment Center", recruitmentContent, [
            {
                text: "Leave Center",
                onClick: () => {
                    document.querySelector('.docked-modal')?.remove();
                    this.returnToVillage();
                }
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
                size: 5
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
                size: 5
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
                size: 5
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

        this.createDockedModal("General Store", shopContent, [
            {
                text: "Leave Store",
                onClick: () => {
                    document.querySelector('.docked-modal')?.remove();
                    this.returnToVillage();
                }
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
        setTimeout(() => {
            // Close the current modal and reopen cleanly
            const modals = document.querySelectorAll('.docked-modal');
            modals.forEach(modal => modal.remove());
            this.openShop();
        }, 100);
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
            onClick: () => {
                document.querySelector('.docked-modal')?.remove();
                this.returnToVillage();
            }
        });
        
        this.createDockedModal("Sacred Temple", templeContent, templeButtons);
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
        setTimeout(() => {
            // Close the current modal and reopen cleanly
            const modals = document.querySelectorAll('.docked-modal');
            modals.forEach(modal => modal.remove());
            this.openTemple();
        }, 100);
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
        setTimeout(() => {
            // Close the current modal and reopen cleanly
            const modals = document.querySelectorAll('.modal-overlay');
            modals.forEach(modal => modal.remove());
            this.openTemple();
        }, 500);
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
            setTimeout(() => {
                // Close the current modal and reopen cleanly
                const modals = document.querySelectorAll('.modal-overlay');
                modals.forEach(modal => modal.remove());
                this.manageUnderlingEquipment();
            }, 100);
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
            setTimeout(() => {
                // Close the current modal and reopen cleanly
                const modals = document.querySelectorAll('.modal-overlay');
                modals.forEach(modal => modal.remove());
                this.manageUnderlingEquipment();
            }, 100);
        }
    }

    // Debug function to check and reinitialize managers
    debugManagers() {
        console.log('=== Manager Debug Information ===');
        console.log('InventoryManager available:', !!this.inventoryManager);
        console.log('CharacterManager available:', !!this.characterManager);
        console.log('InventoryManager class defined:', typeof InventoryManager !== 'undefined');
        console.log('CharacterManager class defined:', typeof CharacterManager !== 'undefined');
        
        if (!this.inventoryManager || !this.characterManager) {
            console.log('Attempting to reinitialize managers...');
            this.initializeManagers();
        }
        
        return {
            inventoryManager: !!this.inventoryManager,
            characterManager: !!this.characterManager,
            classesAvailable: {
                InventoryManager: typeof InventoryManager !== 'undefined',
                CharacterManager: typeof CharacterManager !== 'undefined'
            }
        };
    }

    openInventory() {
        console.log('openInventory called, checking managers...');
        console.log('InventoryManager:', this.inventoryManager);
        
        if (!this.inventoryManager) {
            console.log('InventoryManager not initialized, creating new instance...');
            try {
                if (typeof InventoryManager === 'undefined') {
                    this.ui.log("Error: Inventory system not available. Please refresh the page.");
                    this.ui.showNotification("Inventory system not loaded!", "error");
                    return;
                }
                this.inventoryManager = new InventoryManager(this);
                console.log('InventoryManager created successfully');
            } catch (error) {
                console.error('Failed to create InventoryManager:', error);
                this.ui.log("Error: Failed to initialize inventory system - " + error.message);
                this.ui.showNotification("Inventory system failed to load!", "error");
                return;
            }
        }
        
        try {
            this.inventoryManager.openInventory();
        } catch (error) {
            console.error('Error opening inventory:', error);
            this.ui.log("Error opening inventory: " + error.message);
            this.ui.showNotification("Failed to open inventory!", "error");
        }
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
        setTimeout(() => {
            // Close the current modal and reopen cleanly
            const modals = document.querySelectorAll('.modal-overlay');
            modals.forEach(modal => modal.remove());
            this.openInventory();
        }, 100);
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
        console.log('openCharacterManagement called, checking managers...');
        console.log('CharacterManager:', this.characterManager);
        
        if (!this.characterManager) {
            console.log('CharacterManager not initialized, creating new instance...');
            try {
                if (typeof CharacterManager === 'undefined') {
                    this.ui.log("Error: Character management system not available. Please refresh the page.");
                    this.ui.showNotification("Character system not loaded!", "error");
                    return;
                }
                this.characterManager = new CharacterManager(this);
                console.log('CharacterManager created successfully');
            } catch (error) {
                console.error('Failed to create CharacterManager:', error);
                this.ui.log("Error: Failed to initialize character management system - " + error.message);
                this.ui.showNotification("Character system failed to load!", "error");
                return;
            }
        }
        
        try {
            this.characterManager.openCharacterManagement();
        } catch (error) {
            console.error('Error opening character management:', error);
            this.ui.log("Error opening character management: " + error.message);
            this.ui.showNotification("Failed to open character management!", "error");
        }
    }

    // Debug function to check and reinitialize managers
    debugManagers() {
        console.log('=== Manager Debug Information ===');
        console.log('InventoryManager available:', !!this.inventoryManager);
        console.log('CharacterManager available:', !!this.characterManager);
        console.log('InventoryManager class defined:', typeof InventoryManager !== 'undefined');
        console.log('CharacterManager class defined:', typeof CharacterManager !== 'undefined');
        
        if (!this.inventoryManager || !this.characterManager) {
            console.log('Attempting to reinitialize managers...');
            this.initializeManagers();
        }
        
        return {
            inventoryManager: !!this.inventoryManager,
            characterManager: !!this.characterManager,
            classesAvailable: {
                InventoryManager: typeof InventoryManager !== 'undefined',
                CharacterManager: typeof CharacterManager !== 'undefined'
            }
        };
    }

    calculateEquippedStats() {
        if (!this.characterManager) {
            console.warn('CharacterManager not available for calculateEquippedStats');
            return { attack: 0, defense: 0, health: 0, mana: 0 };
        }
        return this.characterManager.calculateEquippedStats();
    }

    getEquippedItem(type) {
        if (!this.characterManager) {
            console.warn('CharacterManager not available for getEquippedItem');
            return null;
        }
        return this.characterManager.getEquippedItem(type);
    }

    manageUnderling(index) {
        if (!this.characterManager) {
            console.log('CharacterManager not initialized, creating new instance...');
            try {
                if (typeof CharacterManager === 'undefined') {
                    this.ui.log("Error: Character management system not available. Please refresh the page.");
                    this.ui.showNotification("Character system not loaded!", "error");
                    return;
                }
                this.characterManager = new CharacterManager(this);
                console.log('CharacterManager created successfully');
            } catch (error) {
                console.error('Failed to create CharacterManager:', error);
                this.ui.log("Error: Failed to initialize character management system - " + error.message);
                this.ui.showNotification("Character system failed to load!", "error");
                return;
            }
        }
        
        try {
            this.characterManager.manageUnderling(index);
        } catch (error) {
            console.error('Error managing underling:', error);
            this.ui.log("Error managing underling: " + error.message);
            this.ui.showNotification("Failed to manage underling!", "error");
        }
    }

    levelUpUnderling(index) {
        this.characterManager.levelUpUnderling(index);
    }

    dismissUnderling(index) {
        this.characterManager.dismissUnderling(index);
    }

    attemptHeroLevelUp() {
        this.characterManager.attemptHeroLevelUp();
    }

    upgradeLeadership() {
        this.characterManager.upgradeLeadership();
    }

    confirmLeadershipUpgrade(cost) {
        this.characterManager.confirmLeadershipUpgrade(cost);
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
