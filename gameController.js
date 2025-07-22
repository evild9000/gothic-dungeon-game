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
                inventory: [],
                // Crafting materials
                materials: {
                    spiderSilk: 0,
                    animalHide: 0,
                    scrapIron: 0,
                    scrapWood: 0,
                    bones: 0
                }
            },
            dungeonLevel: 1,
            chatLog: [],
            currentEnemies: null,
            inDungeon: false,
            inCombat: false,
            currentScreen: 'main',
            combatRound: 0,  // Track combat rounds for display
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
        
        // Initialize character manager first (no dependencies)
        try {
            console.log('Initializing CharacterManager...');
            if (typeof CharacterManager === 'undefined') {
                throw new Error('CharacterManager class not found. Check if characterManager.js is loaded.');
            }
            if (!this.characterManager) {
                this.characterManager = new CharacterManager(this);
                console.log('CharacterManager initialized successfully');
            }
            
            // Initialize inventory manager second (depends on character manager)
            console.log('Initializing InventoryManager...');
            if (typeof InventoryManager === 'undefined') {
                throw new Error('InventoryManager class not found. Check if inventoryManager.js is loaded.');
            }
            if (!this.inventoryManager) {
                this.inventoryManager = new InventoryManager(this);
                console.log('InventoryManager initialized successfully');
                
                // Now that both managers exist, initialize equipment properly
                this.inventoryManager.initializeAllCharacterEquipment();
            }
            
            // Initialize puzzle manager (for future expansion)
            console.log('Initializing PuzzleManager...');
            if (typeof PuzzleManager === 'undefined') {
                console.warn('PuzzleManager class not found. Check if puzzles.js is loaded.');
            } else {
                if (!this.puzzleManager) {
                    this.puzzleManager = new PuzzleManager(this.gameState, this);
                    console.log('PuzzleManager initialized successfully');
                }
            }
            
            // Initialize event manager
            console.log('Initializing EventManager...');
            if (typeof EventManager === 'undefined') {
                console.warn('EventManager class not found. Check if events.js is loaded.');
            } else {
                if (!this.eventManager) {
                    this.eventManager = new EventManager(this);
                    console.log('EventManager initialized successfully');
                }
            }
            
            // Initialize trap manager
            console.log('Initializing TrapManager...');
            if (typeof TrapManager === 'undefined') {
                console.warn('TrapManager class not found. Check if traps.js is loaded.');
            } else {
                if (!this.trapManager) {
                    this.trapManager = new TrapManager(this);
                    console.log('TrapManager initialized successfully');
                }
            }
            
            // Apply initial stat bonuses only if character manager is available
            if (this.characterManager) {
                this.characterManager.applyStatBonuses();
                console.log('Managers initialization complete');
            }
            
            // Make managers globally accessible for debugging
            window.inventoryManager = this.inventoryManager;
            window.characterManager = this.characterManager;
            window.puzzleManager = this.puzzleManager;
            window.eventManager = this.eventManager;
            window.trapManager = this.trapManager;
            
            // Also make them accessible through window.game for UI callbacks
            if (window.game) {
                window.game.inventoryManager = this.inventoryManager;
                window.game.characterManager = this.characterManager;
                window.game.puzzleManager = this.puzzleManager;
                window.game.eventManager = this.eventManager;
                window.game.trapManager = this.trapManager;
            }
            
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
                <p style="font-size: ${this.getResponsiveFontSize(14)}px;">Create your hero's identity:</p>
                
                <!-- Name Input -->
                <div style="margin: ${this.getResponsiveMargin()} 0;">
                    <label style="display: block; color: #d4af37; font-size: ${this.getResponsiveFontSize(12)}px; margin-bottom: 5px;">Hero Name:</label>
                    <input type="text" id="heroNameInput" placeholder="Enter your hero's name..." 
                           style="width: ${this.getResponsiveInputWidth()}; padding: ${this.getResponsiveButtonPadding()}; border: 2px solid #d4af37; border-radius: ${this.getResponsiveBorderRadius()}; background: #2a2a2a; color: white; text-align: center; font-size: ${this.getResponsiveFontSize(14)}px;" 
                           maxlength="20" autocomplete="off">
                    <p style="color: #888; font-size: ${this.getResponsiveFontSize(10)}px;">Maximum 20 characters</p>
                </div>
                
                <!-- Species Selection -->
                <div style="margin: ${this.getResponsiveMargin()} 0;">
                    <label style="display: block; color: #d4af37; font-size: ${this.getResponsiveFontSize(12)}px; margin-bottom: 5px;">Species:</label>
                    <select id="heroSpeciesInput" 
                            style="width: ${this.getResponsiveInputWidth()}; padding: ${this.getResponsiveButtonPadding()}; border: 2px solid #d4af37; border-radius: ${this.getResponsiveBorderRadius()}; background: #2a2a2a; color: white; font-size: ${this.getResponsiveFontSize(14)}px;"
                            onchange="window.game.controller.updateSubspeciesDropdown()">
                        ${this.generateSpeciesOptions()}
                    </select>
                </div>
                
                <!-- Subspecies Selection -->
                <div id="subspeciesContainer" style="margin: ${this.getResponsiveMargin()} 0;">
                    <label style="display: block; color: #d4af37; font-size: ${this.getResponsiveFontSize(12)}px; margin-bottom: 5px;">Subspecies:</label>
                    <select id="heroSubspeciesInput" 
                            style="width: ${this.getResponsiveInputWidth()}; padding: ${this.getResponsiveButtonPadding()}; border: 2px solid #d4af37; border-radius: ${this.getResponsiveBorderRadius()}; background: #2a2a2a; color: white; font-size: ${this.getResponsiveFontSize(14)}px;">
                        ${this.generateSubspeciesOptions('human')}
                    </select>
                </div>
                
                <!-- Species Info Display -->
                <div id="speciesInfo" style="margin-top: ${this.getResponsiveMargin()}; padding: ${this.getResponsivePadding()}; background: #2a2a3a; border-radius: ${this.getResponsiveBorderRadius()};">
                    ${this.generateSpeciesInfoDisplay('human', 'common')}
                </div>
                
                <div style="margin-top: ${this.getResponsiveMargin()}; padding: ${this.getResponsivePadding()}; background: #2a2a3a; border-radius: ${this.getResponsiveBorderRadius()};">
                    <p style="color: #d4af37; font-size: ${this.getResponsiveFontSize(12)}px; margin: 0;">
                        💡 Your species choice affects stats, abilities, and equipment slots!
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
        const speciesInput = document.getElementById('heroSpeciesInput');
        const subspeciesInput = document.getElementById('heroSubspeciesInput');
        
        let heroName = nameInput ? nameInput.value.trim() : '';
        const selectedSpecies = speciesInput ? speciesInput.value : 'human';
        const selectedSubspecies = subspeciesInput ? subspeciesInput.value : 'common';
        
        // Validate and sanitize hero name
        if (!heroName) {
            heroName = 'Hero'; // Default if nothing entered
        }
        
        // Sanitize name (remove special characters that might break saves)
        heroName = heroName.replace(/[<>:"/\\|?*]/g, '').substring(0, 20);
        
        // Update hero name and species
        this.gameState.hero.name = heroName;
        
        // Initialize hero with species data
        this.characterManager.initializeCharacterSpecies(this.gameState.hero, selectedSpecies, selectedSubspecies);
        
        // Close modal and re-enable keyboard shortcuts
        const modals = document.querySelectorAll('.modal-overlay');
        modals.forEach(modal => modal.remove());
        
        // Clear the naming in progress flag
        this.heroNamingInProgress = false;
        
        if (this.ui) {
            this.ui.enableKeyboardShortcuts();
            const speciesName = this.characterManager.getCharacterSpeciesDisplayName(this.gameState.hero);
            this.ui.log(`Welcome, ${heroName} the ${speciesName}! Your adventure begins!`);
            this.ui.showNotification(`Welcome, ${heroName} the ${speciesName}!`, "success");
            this.ui.render(); // Update UI to reflect changes
            this.ui.updateButtonStates(); // Ensure button states are refreshed
        }
        
        console.log('Hero created:', heroName, selectedSpecies, selectedSubspecies);
    }
    
    // Species selection helper methods
    generateSpeciesOptions() {
        const availableSpecies = this.characterManager.getAvailableSpecies();
        return availableSpecies.map(species => {
            const speciesDef = this.characterManager.getSpeciesDefinition(species);
            return `<option value="${species}">${speciesDef.name}</option>`;
        }).join('');
    }
    
    generateSubspeciesOptions(species) {
        const availableSubspecies = this.characterManager.getAvailableSubspecies(species);
        return availableSubspecies.map(subspecies => {
            const subspeciesDef = this.characterManager.getSubspeciesDefinition(species, subspecies);
            return `<option value="${subspecies}">${subspeciesDef.name}</option>`;
        }).join('');
    }
    
    generateSpeciesInfoDisplay(species, subspecies) {
        const speciesDef = this.characterManager.getSpeciesDefinition(species);
        const subspeciesDef = this.characterManager.getSubspeciesDefinition(species, subspecies);
        
        // Calculate total stat modifiers
        const totalModifiers = {};
        ['strength', 'dexterity', 'constitution', 'intelligence', 'willpower', 'size'].forEach(stat => {
            totalModifiers[stat] = (speciesDef.statModifiers[stat] || 0) + (subspeciesDef.statModifiers[stat] || 0);
        });
        
        const statDisplay = Object.entries(totalModifiers)
            .filter(([stat, modifier]) => modifier !== 0)
            .map(([stat, modifier]) => {
                const sign = modifier > 0 ? '+' : '';
                const color = modifier > 0 ? '#51cf66' : '#ff6b6b';
                return `<span style="color: ${color};">${sign}${modifier} ${stat.toUpperCase()}</span>`;
            }).join(', ');
        
        return `
            <p style="color: #4ecdc4; font-size: ${this.getResponsiveFontSize(12)}px; margin: 5px 0;">
                <strong>${subspeciesDef.name}</strong>
            </p>
            <p style="color: #ccc; font-size: ${this.getResponsiveFontSize(10)}px; margin: 5px 0;">
                ${subspeciesDef.description || speciesDef.description}
            </p>
            ${statDisplay ? `<p style="color: #ffd93d; font-size: ${this.getResponsiveFontSize(10)}px; margin: 5px 0;">
                <strong>Stat Modifiers:</strong> ${statDisplay}
            </p>` : ''}
        `;
    }
    
    updateSubspeciesDropdown() {
        const speciesInput = document.getElementById('heroSpeciesInput');
        const subspeciesInput = document.getElementById('heroSubspeciesInput');
        const speciesInfo = document.getElementById('speciesInfo');
        
        if (!speciesInput || !subspeciesInput || !speciesInfo) return;
        
        const selectedSpecies = speciesInput.value;
        const subspeciesOptions = this.generateSubspeciesOptions(selectedSpecies);
        subspeciesInput.innerHTML = subspeciesOptions;
        
        // Update species info display
        const selectedSubspecies = subspeciesInput.value;
        speciesInfo.innerHTML = this.generateSpeciesInfoDisplay(selectedSpecies, selectedSubspecies);
        
        // Add event listener for subspecies changes
        subspeciesInput.onchange = () => {
            const newSubspecies = subspeciesInput.value;
            speciesInfo.innerHTML = this.generateSpeciesInfoDisplay(selectedSpecies, newSubspecies);
        };
    }

    useDefaultHeroName() {
        // Use default hero name and species
        this.gameState.hero.name = 'Hero';
        
        // Initialize hero with default species data
        this.characterManager.initializeCharacterSpecies(this.gameState.hero, 'human', 'common');
        
        // Close modal and re-enable keyboard shortcuts
        const modals = document.querySelectorAll('.modal-overlay');
        modals.forEach(modal => modal.remove());
        
        // Clear the naming in progress flag
        this.heroNamingInProgress = false;
        
        if (this.ui) {
            this.ui.enableKeyboardShortcuts();
            this.ui.log("Welcome, Hero! Your adventure begins!");
            this.ui.showNotification("Welcome, Hero!", "success");
            this.ui.render(); // Update UI to reflect changes
            this.ui.updateButtonStates(); // Ensure button states are refreshed
        }
        
        console.log('Using default hero: Hero, human, common');
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
        
        // Show hero creation prompt with species selection
        const nameContent = `
            <div style="text-align: center;">
                <h4 style="font-size: ${this.getResponsiveFontSize(18)}px;">Create Your Hero</h4>
                <p style="font-size: ${this.getResponsiveFontSize(14)}px;">Create your hero's identity:</p>
                
                <!-- Name Input -->
                <div style="margin: ${this.getResponsiveMargin()} 0;">
                    <label style="display: block; color: #d4af37; font-size: ${this.getResponsiveFontSize(12)}px; margin-bottom: 5px;">Hero Name:</label>
                    <input type="text" id="heroNameInput" placeholder="Enter hero name..." 
                           style="width: ${this.getResponsiveInputWidth()}; padding: ${this.getResponsiveButtonPadding()}; border: 2px solid #d4af37; border-radius: ${this.getResponsiveBorderRadius()}; background: #2a2a2a; color: white; text-align: center; font-size: ${this.getResponsiveFontSize(14)}px;" 
                           maxlength="20" autocomplete="off">
                    <p style="color: #888; font-size: ${this.getResponsiveFontSize(10)}px;">Maximum 20 characters</p>
                </div>
                
                <!-- Species Selection -->
                <div style="margin: ${this.getResponsiveMargin()} 0;">
                    <label style="display: block; color: #d4af37; font-size: ${this.getResponsiveFontSize(12)}px; margin-bottom: 5px;">Species:</label>
                    <select id="heroSpeciesInput" 
                            style="width: ${this.getResponsiveInputWidth()}; padding: ${this.getResponsiveButtonPadding()}; border: 2px solid #d4af37; border-radius: ${this.getResponsiveBorderRadius()}; background: #2a2a2a; color: white; font-size: ${this.getResponsiveFontSize(14)}px;"
                            onchange="window.game.controller.updateSubspeciesDropdown()">
                        ${this.generateSpeciesOptions()}
                    </select>
                </div>
                
                <!-- Subspecies Selection -->
                <div id="subspeciesContainer" style="margin: ${this.getResponsiveMargin()} 0;">
                    <label style="display: block; color: #d4af37; font-size: ${this.getResponsiveFontSize(12)}px; margin-bottom: 5px;">Subspecies:</label>
                    <select id="heroSubspeciesInput" 
                            style="width: ${this.getResponsiveInputWidth()}; padding: ${this.getResponsiveButtonPadding()}; border: 2px solid #d4af37; border-radius: ${this.getResponsiveBorderRadius()}; background: #2a2a2a; color: white; font-size: ${this.getResponsiveFontSize(14)}px;">
                        ${this.generateSubspeciesOptions('human')}
                    </select>
                </div>
                
                <!-- Species Info Display -->
                <div id="speciesInfo" style="margin-top: ${this.getResponsiveMargin()}; padding: ${this.getResponsivePadding()}; background: #2a2a3a; border-radius: ${this.getResponsiveBorderRadius()};">
                    ${this.generateSpeciesInfoDisplay('human', 'common')}
                </div>
                
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
        const speciesInput = document.getElementById('heroSpeciesInput');
        const subspeciesInput = document.getElementById('heroSubspeciesInput');
        
        let heroName = nameInput ? nameInput.value.trim() : '';
        const selectedSpecies = speciesInput ? speciesInput.value : 'human';
        const selectedSubspecies = subspeciesInput ? subspeciesInput.value : 'common';
        
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
            this.performNewGameReset(heroName, selectedSpecies, selectedSubspecies);
        }
    }
    
    performNewGameReset(heroName = 'Hero', heroSpecies = 'human', heroSubspecies = 'common') {
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
                stamina: 100, // Will be recalculated by applyStatBonuses
                maxStamina: 100, // Base stamina, will be modified by stat bonuses
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
        
        // Initialize hero with species data
        this.characterManager.initializeCharacterSpecies(this.gameState.hero, heroSpecies, heroSubspecies);
        
        // Apply stat bonuses to new character (this should come after species initialization)
        this.applyStatBonuses();
        
        // Reset UI state completely
        if (this.ui) {
            this.ui.currentBackground = 'village';
            this.ui.setBackground('village');
            this.ui.clearChatLog();
            const speciesName = this.characterManager.getCharacterSpeciesDisplayName(this.gameState.hero);
            this.ui.log(`Welcome ${heroName} the ${speciesName}! Your adventure begins!`);
            this.ui.render();
            this.ui.updateButtonStates(); // Ensure button states reflect new game state
            this.ui.showNotification(`Welcome ${heroName} the ${speciesName}!`, "success");
        }
        
        console.log('New game reset complete. Hero:', heroName, heroSpecies, heroSubspecies, 'Gold:', this.gameState.hero.gold);
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
                    
                    // Add species data if missing (backward compatibility)
                    if (!underling.speciesKey && !underling.species) {
                        underling.speciesKey = 'human';
                    }
                    if (!underling.baseClass) {
                        // Extract base class from name if possible
                        const nameParts = underling.name.split(' ');
                        underling.baseClass = nameParts.length > 1 ? nameParts[nameParts.length - 1] : underling.name;
                    }
                });
            }
            
            // Add species data to hero if missing (backward compatibility)
            if (!this.gameState.hero.speciesKey && !this.gameState.hero.species) {
                this.gameState.hero.speciesKey = 'human';
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
        // Display initial round indicator
        setTimeout(() => {
            this.displayRoundIndicator();
            this.showCombatInterface();
        }, 100);
    }

    generateEnemies() {
        // Reset combat round when new enemies are generated
        this.gameState.combatRound = 0;
        
        // Dynamic enemy count based on dungeon level
        // Level 1-2: 1-3 enemies, Level 3+: 1 to (dungeon level) enemies, max 7
        let maxEnemies;
        if (this.gameState.dungeonLevel <= 2) {
            maxEnemies = 3;
        } else {
            maxEnemies = Math.min(7, this.gameState.dungeonLevel);
        }
        
        // Weighted towards larger groups in deeper dungeons
        let enemyCount;
        if (this.gameState.dungeonLevel <= 2) {
            enemyCount = Math.floor(Math.random() * 3) + 1; // 1-3 enemies
        } else {
            // For deeper levels, bias towards larger groups
            const bias = Math.min(0.3, this.gameState.dungeonLevel * 0.05); // Increasing bias
            const random = Math.random();
            if (random < bias) {
                // Higher chance of max group size
                enemyCount = maxEnemies;
            } else {
                // Random size from 1 to max
                enemyCount = Math.floor(Math.random() * maxEnemies) + 1;
            }
        }
        
        this.gameState.currentEnemies = [];
        
        // Generate appropriate monster group for dungeon level
        this.generateMonsterGroup(enemyCount);
    }

    // Comprehensive Monster System
    initializeMonsterDatabase() {
        this.monsterGroups = {
            // Undead Groups
            'Undead Patrol': {
                minLevel: 1,
                maxLevel: 10,
                monsters: ['Skeleton', 'Zombie', 'Skeleton Archer'],
                leader: null,
                weight: 3
            },
            'Necromancer\'s Minions': {
                minLevel: 4,
                maxLevel: 10,
                monsters: ['Skeleton', 'Zombie', 'Wraith'],
                leader: 'Dark Necromancer',
                weight: 2
            },
            'Ancient Undead': {
                minLevel: 6,
                maxLevel: 10,
                monsters: ['Bone Knight', 'Lich', 'Death Knight'],
                leader: null,
                weight: 1
            },
            
            // Goblin Groups
            'Goblin Raiders': {
                minLevel: 1,
                maxLevel: 5,
                monsters: ['Goblin', 'Goblin Scout', 'Goblin Warrior'],
                leader: null,
                weight: 4
            },
            'Goblin War Party': {
                minLevel: 3,
                maxLevel: 7,
                monsters: ['Goblin Warrior', 'Goblin Shaman', 'Hobgoblin'],
                leader: 'Goblin Chieftain',
                weight: 2
            },
            
            // Orc Groups
            'Orc Warband': {
                minLevel: 2,
                maxLevel: 6,
                monsters: ['Orc', 'Orc Berserker', 'Orc Scout'],
                leader: null,
                weight: 3
            },
            'Orc Legion': {
                minLevel: 4,
                maxLevel: 8,
                monsters: ['Orc Berserker', 'Orc Shaman', 'Orc Captain'],
                leader: 'Orc Warchief',
                weight: 2
            },
            
            // Beast Groups
            'Wolf Pack': {
                minLevel: 1,
                maxLevel: 6,
                monsters: ['Wolf', 'Alpha Wolf', 'Dire Wolf'],
                leader: null,
                weight: 3
            },
            'Beast Riders': {
                minLevel: 3,
                maxLevel: 8,
                monsters: ['Wolf', 'Goblin Wolf Rider', 'Orc Beast Master'],
                leader: null,
                weight: 2
            },
            
            // Spider Groups
            'Spider Nest': {
                minLevel: 1,
                maxLevel: 5,
                monsters: ['Spider', 'Venomous Spider', 'Web Spinner'],
                leader: null,
                weight: 3
            },
            'Giant Spider Colony': {
                minLevel: 4,
                maxLevel: 8,
                monsters: ['Giant Spider', 'Brood Mother', 'Phase Spider'],
                leader: 'Spider Queen',
                weight: 1
            },
            
            // Demon Groups
            'Lesser Demons': {
                minLevel: 5,
                maxLevel: 10,
                monsters: ['Imp', 'Shadow Demon', 'Fire Demon'],
                leader: null,
                weight: 2
            },
            'Demonic Legion': {
                minLevel: 7,
                maxLevel: 10,
                monsters: ['Demon Warrior', 'Succubus', 'Demon Lord'],
                leader: 'Arch Demon',
                weight: 1
            },
            
            // Dragon Groups
            'Draconic Servants': {
                minLevel: 6,
                maxLevel: 10,
                monsters: ['Kobold', 'Dragonkin', 'Wyvern'],
                leader: null,
                weight: 2
            },
            'Dragon\'s Lair': {
                minLevel: 8,
                maxLevel: 10,
                monsters: ['Young Dragon', 'Dragon Cultist'],
                leader: 'Ancient Dragon',
                weight: 1
            }
        };

        this.monsterTypes = {
            // Basic Monsters (Levels 1-3)
            'Goblin': { minLevel: 1, maxLevel: 5, stats: { str: -1, dex: 2, con: 0, int: 1, wil: 0, size: -1 }, 
                       lootTable: ['Goblin Dagger', 'Rusty Coin', 'Tattered Cloth'], specialAbilities: [] },
            'Goblin Scout': { minLevel: 1, maxLevel: 4, stats: { str: -1, dex: 3, con: 0, int: 2, wil: 1, size: -1 }, 
                             lootTable: ['Scout Bow', 'Leather Scraps', 'Poison Dart'], specialAbilities: ['Sneak Attack'] },
            'Goblin Warrior': { minLevel: 2, maxLevel: 5, stats: { str: 1, dex: 1, con: 1, int: 0, wil: 1, size: -1 }, 
                               lootTable: ['Goblin Axe', 'Leather Armor', 'Battle Banner'], specialAbilities: ['Battle Cry'] },
            'Goblin Shaman': { minLevel: 3, maxLevel: 6, stats: { str: -1, dex: 1, con: 0, int: 3, wil: 3, size: -1 }, 
                              lootTable: ['Shaman Staff', 'Ritual Bones', 'Magic Pouch'], specialAbilities: ['Heal Ally', 'Lightning Bolt'] },
            'Goblin Chieftain': { minLevel: 4, maxLevel: 7, stats: { str: 2, dex: 2, con: 2, int: 2, wil: 3, size: 0 }, 
                                 lootTable: ['Chieftain Crown', 'War Hammer', 'Command Cloak'], specialAbilities: ['Rally Troops', 'Intimidate'] },
            
            'Wolf': { minLevel: 1, maxLevel: 4, stats: { str: 2, dex: 3, con: 1, int: 1, wil: 1, size: -1 }, 
                     lootTable: ['Wolf Pelt', 'Sharp Fang', 'Animal Hide'], specialAbilities: ['Pack Hunter'] },
            'Alpha Wolf': { minLevel: 2, maxLevel: 5, stats: { str: 3, dex: 3, con: 2, int: 2, wil: 2, size: 0 }, 
                           lootTable: ['Alpha Pelt', 'Alpha Fang', 'Pack Leader Collar'], specialAbilities: ['Howl', 'Pack Leader'] },
            'Dire Wolf': { minLevel: 3, maxLevel: 6, stats: { str: 4, dex: 2, con: 3, int: 1, wil: 2, size: 1 }, 
                          lootTable: ['Dire Pelt', 'Massive Fang', 'Primal Essence'], specialAbilities: ['Savage Bite', 'Intimidate'] },
            
            'Spider': { minLevel: 1, maxLevel: 3, stats: { str: -2, dex: 4, con: 1, int: 2, wil: -1, size: -2 }, 
                       lootTable: ['Spider Silk', 'Venom Sac', 'Chitin'], specialAbilities: ['Web'] },
            'Venomous Spider': { minLevel: 2, maxLevel: 4, stats: { str: -1, dex: 4, con: 2, int: 2, wil: 0, size: -1 }, 
                                lootTable: ['Toxic Silk', 'Poison Gland', 'Venom Fang'], specialAbilities: ['Poison Bite', 'Web'] },
            'Web Spinner': { minLevel: 2, maxLevel: 5, stats: { str: -1, dex: 3, con: 1, int: 3, wil: 1, size: -1 }, 
                            lootTable: ['Master Silk', 'Web Anchor', 'Silk Gland'], specialAbilities: ['Entangle', 'Web Trap'] },
            'Giant Spider': { minLevel: 4, maxLevel: 7, stats: { str: 2, dex: 3, con: 3, int: 2, wil: 1, size: 1 }, 
                             lootTable: ['Giant Silk', 'Massive Mandible', 'Spider Heart'], specialAbilities: ['Crush', 'Web', 'Poison Bite'] },
            'Brood Mother': { minLevel: 5, maxLevel: 8, stats: { str: 1, dex: 2, con: 4, int: 3, wil: 2, size: 2 }, 
                             lootTable: ['Brood Silk', 'Egg Sac', 'Motherly Essence'], specialAbilities: ['Spawn Spiderlings', 'Protective Web'] },
            'Phase Spider': { minLevel: 6, maxLevel: 9, stats: { str: 0, dex: 5, con: 2, int: 4, wil: 3, size: 0 }, 
                             lootTable: ['Phase Silk', 'Ethereal Essence', 'Dimensional Web'], specialAbilities: ['Phase Shift', 'Dimensional Web'] },
            'Spider Queen': { minLevel: 7, maxLevel: 10, stats: { str: 3, dex: 4, con: 5, int: 5, wil: 4, size: 3 }, 
                             lootTable: ['Queen Crown', 'Royal Silk', 'Spider Throne'], specialAbilities: ['Command Spiders', 'Venom Nova', 'Web Fortress'] },
            
            // Mid-level Monsters (Levels 3-6)
            'Orc': { minLevel: 2, maxLevel: 5, stats: { str: 3, dex: -1, con: 2, int: -2, wil: 0, size: 1 }, 
                    lootTable: ['Orc Blade', 'Crude Armor', 'Orc Tooth'], specialAbilities: ['Rage'] },
            'Orc Berserker': { minLevel: 3, maxLevel: 6, stats: { str: 4, dex: 0, con: 3, int: -2, wil: 1, size: 1 }, 
                              lootTable: ['Berserker Axe', 'Battle Scars', 'Rage Potion'], specialAbilities: ['Berserk', 'Reckless Attack'] },
            'Orc Scout': { minLevel: 2, maxLevel: 5, stats: { str: 2, dex: 2, con: 1, int: -1, wil: 1, size: 0 }, 
                          lootTable: ['Scout Spear', 'Tracking Kit', 'Trail Map'], specialAbilities: ['Track', 'Ambush'] },
            'Orc Shaman': { minLevel: 4, maxLevel: 7, stats: { str: 1, dex: 0, con: 2, int: 2, wil: 4, size: 1 }, 
                           lootTable: ['Bone Staff', 'Shaman Mask', 'Spirit Pouch'], specialAbilities: ['Buff Ally', 'Lightning Strike'] },
            'Orc Captain': { minLevel: 5, maxLevel: 8, stats: { str: 4, dex: 1, con: 3, int: 0, wil: 3, size: 1 }, 
                            lootTable: ['Captain Shield', 'War Banner', 'Command Horn'], specialAbilities: ['Battle Command', 'Shield Bash'] },
            'Orc Warchief': { minLevel: 6, maxLevel: 9, stats: { str: 5, dex: 1, con: 4, int: 1, wil: 4, size: 2 }, 
                             lootTable: ['Warchief Crown', 'Great Axe', 'War Cloak'], specialAbilities: ['War Cry', 'Intimidate', 'Commanding Presence'] },
            
            'Hobgoblin': { minLevel: 3, maxLevel: 6, stats: { str: 2, dex: 1, con: 2, int: 1, wil: 2, size: 0 }, 
                          lootTable: ['Steel Sword', 'Chain Mail', 'Military Badge'], specialAbilities: ['Formation Fighting'] },
            'Goblin Wolf Rider': { minLevel: 3, maxLevel: 6, stats: { str: 1, dex: 3, con: 1, int: 1, wil: 2, size: -1 }, 
                                  lootTable: ['Riding Spear', 'Wolf Saddle', 'Rider Boots'], specialAbilities: ['Mounted Charge', 'Hit and Run'] },
            'Orc Beast Master': { minLevel: 4, maxLevel: 7, stats: { str: 3, dex: 2, con: 3, int: 2, wil: 3, size: 1 }, 
                                 lootTable: ['Beast Whip', 'Animal Hide Armor', 'Taming Collar'], specialAbilities: ['Command Beast', 'Beast Bond'] },
            
            'Skeleton': { minLevel: 1, maxLevel: 4, stats: { str: -1, dex: 1, con: 3, int: -2, wil: 2, size: 0 }, 
                         lootTable: ['Old Bones', 'Rusty Weapon', 'Bone Dust'], specialAbilities: ['Undead Resilience'] },
            'Skeleton Archer': { minLevel: 2, maxLevel: 5, stats: { str: -1, dex: 3, con: 3, int: -2, wil: 2, size: 0 }, 
                                lootTable: ['Bone Bow', 'Ancient Arrows', 'Archer Bracer'], specialAbilities: ['Precise Shot', 'Undead Resilience'] },
            'Zombie': { minLevel: 1, maxLevel: 4, stats: { str: 2, dex: -2, con: 4, int: -3, wil: 1, size: 0 }, 
                       lootTable: ['Rotting Flesh', 'Tattered Clothes', 'Grave Dirt'], specialAbilities: ['Shambling', 'Disease'] },
            'Bone Knight': { minLevel: 5, maxLevel: 8, stats: { str: 3, dex: 0, con: 4, int: -1, wil: 3, size: 1 }, 
                            lootTable: ['Bone Armor', 'Ancient Sword', 'Knight\'s Crest'], specialAbilities: ['Bone Shield', 'Undead Resilience', 'Shield Slam'] },
            'Wraith': { minLevel: 4, maxLevel: 7, stats: { str: -1, dex: 4, con: 2, int: 3, wil: 4, size: 0 }, 
                       lootTable: ['Ectoplasm', 'Spirit Essence', 'Ghostly Cloth'], specialAbilities: ['Phase', 'Life Drain', 'Terror'] },
            'Lich': { minLevel: 7, maxLevel: 10, stats: { str: -1, dex: 2, con: 3, int: 6, wil: 5, size: 0 }, 
                     lootTable: ['Lich Crown', 'Spell Tome', 'Soul Gem'], specialAbilities: ['Death Magic', 'Summon Undead', 'Mana Shield'] },
            'Death Knight': { minLevel: 8, maxLevel: 10, stats: { str: 5, dex: 1, con: 5, int: 2, wil: 5, size: 2 }, 
                             lootTable: ['Death Blade', 'Cursed Armor', 'Dark Crown'], specialAbilities: ['Death Strike', 'Aura of Fear', 'Unholy Strength'] },
            'Dark Necromancer': { minLevel: 6, maxLevel: 9, stats: { str: -2, dex: 1, con: 2, int: 6, wil: 5, size: 0 }, 
                                 lootTable: ['Necromancer Staff', 'Death Robes', 'Soul Crystal'], specialAbilities: ['Raise Dead', 'Dark Bolt', 'Command Undead'] },
            
            // High-level Monsters (Levels 6-10)
            'Imp': { minLevel: 5, maxLevel: 8, stats: { str: -1, dex: 4, con: 1, int: 3, wil: 2, size: -2 }, 
                    lootTable: ['Imp Wing', 'Sulfur', 'Demonic Essence'], specialAbilities: ['Teleport', 'Fire Bolt'] },
            'Shadow Demon': { minLevel: 6, maxLevel: 9, stats: { str: 2, dex: 5, con: 2, int: 3, wil: 3, size: 0 }, 
                             lootTable: ['Shadow Essence', 'Dark Crystal', 'Void Cloth'], specialAbilities: ['Shadow Step', 'Drain Light'] },
            'Fire Demon': { minLevel: 7, maxLevel: 10, stats: { str: 4, dex: 2, con: 4, int: 2, wil: 3, size: 1 }, 
                           lootTable: ['Flame Heart', 'Brimstone', 'Infernal Hide'], specialAbilities: ['Flame Burst', 'Fire Immunity'] },
            'Demon Warrior': { minLevel: 7, maxLevel: 10, stats: { str: 5, dex: 3, con: 4, int: 2, wil: 3, size: 2 }, 
                              lootTable: ['Demon Blade', 'Infernal Armor', 'War Horn'], specialAbilities: ['Demonic Strength', 'Fear Aura'] },
            'Succubus': { minLevel: 8, maxLevel: 10, stats: { str: 1, dex: 4, con: 3, int: 5, wil: 5, size: 0 }, 
                         lootTable: ['Succubus Charm', 'Seductive Perfume', 'Soul Shard'], specialAbilities: ['Charm', 'Life Drain', 'Illusion'] },
            'Demon Lord': { minLevel: 9, maxLevel: 10, stats: { str: 6, dex: 3, con: 5, int: 4, wil: 5, size: 3 }, 
                           lootTable: ['Demon Crown', 'Lord\'s Scepter', 'Infernal Throne'], specialAbilities: ['Summon Demons', 'Hellfire', 'Command'] },
            'Arch Demon': { minLevel: 10, maxLevel: 10, stats: { str: 7, dex: 4, con: 6, int: 5, wil: 6, size: 4 }, 
                           lootTable: ['Arch Crown', 'Reality Blade', 'Demon Gate Key'], specialAbilities: ['Reality Tear', 'Demon Army', 'Infernal Command'] },
            
            'Kobold': { minLevel: 6, maxLevel: 9, stats: { str: 0, dex: 3, con: 2, int: 3, wil: 2, size: -1 }, 
                       lootTable: ['Kobold Spear', 'Dragon Scale', 'Treasure Map'], specialAbilities: ['Dragon Worship', 'Trap Making'] },
            'Dragonkin': { minLevel: 7, maxLevel: 10, stats: { str: 4, dex: 2, con: 4, int: 3, wil: 3, size: 1 }, 
                          lootTable: ['Dragon Claw', 'Scale Mail', 'Breath Weapon'], specialAbilities: ['Dragon Breath', 'Draconic Might'] },
            'Wyvern': { minLevel: 8, maxLevel: 10, stats: { str: 5, dex: 4, con: 4, int: 2, wil: 3, size: 3 }, 
                       lootTable: ['Wyvern Wing', 'Poison Stinger', 'Dragon Blood'], specialAbilities: ['Fly', 'Poison Sting', 'Aerial Strike'] },
            'Young Dragon': { minLevel: 9, maxLevel: 10, stats: { str: 6, dex: 3, con: 6, int: 5, wil: 4, size: 4 }, 
                             lootTable: ['Dragon Heart', 'Precious Gems', 'Dragon Hoard'], specialAbilities: ['Dragon Breath', 'Flight', 'Treasure Sense'] },
            'Dragon Cultist': { minLevel: 8, maxLevel: 10, stats: { str: 2, dex: 2, con: 3, int: 4, wil: 5, size: 0 }, 
                               lootTable: ['Cultist Robes', 'Dragon Idol', 'Ritual Dagger'], specialAbilities: ['Dragon Magic', 'Summon Dragon', 'Draconic Shield'] },
            'Ancient Dragon': { minLevel: 10, maxLevel: 10, stats: { str: 8, dex: 4, con: 7, int: 6, wil: 6, size: 5 }, 
                               lootTable: ['Ancient Crown', 'Dragon Throne', 'Legendary Hoard'], specialAbilities: ['Ancient Breath', 'Dragon Magic', 'Lair Actions'] }
        };
    }

    generateMonsterGroup(enemyCount) {
        // Initialize monster database if not done
        if (!this.monsterGroups) {
            this.initializeMonsterDatabase();
        }
        
        // Get available groups for current dungeon level
        const availableGroups = Object.entries(this.monsterGroups).filter(([name, group]) => 
            this.gameState.dungeonLevel >= group.minLevel && this.gameState.dungeonLevel <= group.maxLevel
        );
        
        if (availableGroups.length === 0) {
            // Fallback to basic monsters if no groups available
            this.generateBasicEnemies(enemyCount);
            return;
        }
        
        // Select group based on weights
        const totalWeight = availableGroups.reduce((sum, [name, group]) => sum + group.weight, 0);
        let randomWeight = Math.random() * totalWeight;
        
        let selectedGroup = null;
        for (const [name, group] of availableGroups) {
            randomWeight -= group.weight;
            if (randomWeight <= 0) {
                selectedGroup = group;
                break;
            }
        }
        
        if (!selectedGroup) {
            selectedGroup = availableGroups[0][1]; // Fallback
        }
        
        // Generate enemies from selected group
        this.createGroupEnemies(selectedGroup, enemyCount);
    }

    createGroupEnemies(group, targetCount) {
        const enemyTypeCounts = {};
        let currentCount = 0;
        
        // Add leader first if exists and there's room
        if (group.leader && targetCount > 1) {
            const leader = this.createMonster(group.leader, true);
            if (leader) {
                this.gameState.currentEnemies.push(leader);
                enemyTypeCounts[group.leader] = 1;
                currentCount++;
            }
        }
        
        // Fill remaining slots with group monsters
        while (currentCount < targetCount && group.monsters.length > 0) {
            const monsterType = group.monsters[Math.floor(Math.random() * group.monsters.length)];
            
            // Check if this monster type can appear at current dungeon level
            if (this.monsterTypes[monsterType] && 
                this.gameState.dungeonLevel >= this.monsterTypes[monsterType].minLevel &&
                this.gameState.dungeonLevel <= this.monsterTypes[monsterType].maxLevel) {
                
                enemyTypeCounts[monsterType] = (enemyTypeCounts[monsterType] || 0) + 1;
                const monster = this.createMonster(monsterType, false, enemyTypeCounts[monsterType]);
                
                if (monster) {
                    this.gameState.currentEnemies.push(monster);
                    currentCount++;
                }
            }
        }
        
        // If we still don't have enough enemies, fill with basic monsters
        if (currentCount < targetCount) {
            this.generateBasicEnemies(targetCount - currentCount);
        }
    }

    createMonster(monsterType, isLeader = false, count = 1) {
        const monsterData = this.monsterTypes[monsterType];
        if (!monsterData) {
            console.warn(`Unknown monster type: ${monsterType}`);
            return null;
        }
        
        const displayName = count > 1 ? `${monsterType} ${count}` : monsterType;
        const levelVariation = Math.floor(Math.random() * 3) - 1; // -1 to +1
        const monsterLevel = Math.max(1, Math.min(10, this.gameState.dungeonLevel + levelVariation));
        
        const enemy = {
            id: `${monsterType}_${Date.now()}_${Math.random()}`,
            name: displayName,
            type: monsterType,
            isLeader: isLeader,
            level: monsterLevel,
            health: 40 + (monsterLevel * 8) + (isLeader ? 20 : 0),
            maxHealth: 40 + (monsterLevel * 8) + (isLeader ? 20 : 0),
            attack: 8 + (monsterLevel * 2) + (isLeader ? 5 : 0),
            // Base stats (will be modified by monster type)
            strength: 5,
            dexterity: 5,
            constitution: 5,
            intelligence: 5,
            willpower: 5,
            size: 5,
            specialAbilities: [...(monsterData.specialAbilities || [])],
            lootTable: [...(monsterData.lootTable || [])]
        };
        
        // Apply monster-specific stat modifiers
        this.applyMonsterStatModifiers(enemy, monsterData);
        
        // Apply stat bonuses to health and stats
        this.applyEnemyStatBonuses(enemy);
        
        return enemy;
    }

    applyMonsterStatModifiers(enemy, monsterData) {
        // Apply base stat modifiers
        const stats = monsterData.stats || {};
        enemy.strength += stats.str || 0;
        enemy.dexterity += stats.dex || 0;
        enemy.constitution += stats.con || 0;
        enemy.intelligence += stats.int || 0;
        enemy.willpower += stats.wil || 0;
        enemy.size += stats.size || 0;
        
        // Leader bonuses
        if (enemy.isLeader) {
            enemy.strength += 1;
            enemy.constitution += 2;
            enemy.willpower += 2;
            enemy.intelligence += 1;
        }
        
        // Ensure no stat goes below 1
        ['strength', 'dexterity', 'constitution', 'intelligence', 'willpower', 'size'].forEach(stat => {
            enemy[stat] = Math.max(1, enemy[stat]);
        });
    }

    generateBasicEnemies(count) {
        // Fallback to original system
        const basicTypes = ['Goblin', 'Wolf', 'Spider', 'Skeleton'];
        const enemyTypeCounts = {};
        
        for (let i = 0; i < count; i++) {
            const enemyType = basicTypes[Math.floor(Math.random() * basicTypes.length)];
            enemyTypeCounts[enemyType] = (enemyTypeCounts[enemyType] || 0) + 1;
            
            const enemy = {
                id: `${enemyType}_${Date.now()}_${i}`,
                name: enemyTypeCounts[enemyType] > 1 ? `${enemyType} ${enemyTypeCounts[enemyType]}` : enemyType,
                type: enemyType,
                level: this.gameState.dungeonLevel + Math.floor(Math.random() * 2),
                health: 50 + (this.gameState.dungeonLevel * 10),
                maxHealth: 50 + (this.gameState.dungeonLevel * 10),
                attack: 10 + (this.gameState.dungeonLevel * 2),
                strength: 5,
                dexterity: 5,
                constitution: 5,
                intelligence: 5,
                willpower: 5,
                size: 5,
                specialAbilities: [],
                lootTable: []
            };
            
            // Apply original stat modifiers
            this.applyEnemyStatModifiers(enemy);
            this.applyEnemyStatBonuses(enemy);
            
            this.gameState.currentEnemies.push(enemy);
        }
    }

    // Combat Round Display System
    displayRoundIndicator() {
        this.gameState.combatRound++;
        
        const roundText = `==== ROUND ${this.gameState.combatRound} ====`;
        
        // Log to combat chat with special styling
        this.ui.log(`<div style="text-align: center; font-size: 18px; font-weight: bold; color: #ffd700; text-shadow: 2px 2px 4px rgba(0,0,0,0.8); margin: 10px 0; padding: 8px; background: linear-gradient(45deg, rgba(255,215,0,0.2), rgba(255,140,0,0.2)); border: 2px solid #ffd700; border-radius: 8px;">${roundText}</div>`);
        
        // Show notification
        this.ui.showNotification(`Round ${this.gameState.combatRound} Begins!`, "info");
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
        
        let critChance = Math.min(30, attacker.dexterity * 2.5);
        
        // Add equipment crit bonus if available
        let equipmentCritBonus = 0;
        if (attacker.equipmentSlots) {
            Object.values(attacker.equipmentSlots).forEach(equippedItem => {
                if (equippedItem && equippedItem.stats && equippedItem.stats.critBonus) {
                    equipmentCritBonus += equippedItem.stats.critBonus;
                }
            });
        }
        
        critChance += equipmentCritBonus;
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

    // Enhanced Craftable Loot Database
    initializeCraftableLootDatabase() {
        this.craftableLootDatabase = {
            // Ring Slot Items - Enhanced with logical monster material combinations
            rings: {
                'Goblin Scavenger Ring': { 
                    slot: 'ring1', tier: 'common', level: 1,
                    stats: { dexterity: 2, intelligence: 1 }, materials: { 'Rusty Coin': 3, 'Tattered Cloth': 2 },
                    description: 'A ring crafted from goblin scavenged materials. Increases looting ability.' 
                },
                'Wolf Pack Ring': { 
                    slot: 'ring1', tier: 'common', level: 2,
                    stats: { strength: 2, constitution: 1 }, materials: { 'Wolf Pelt': 2, 'Sharp Fang': 1 },
                    description: 'Grants the wearer pack instincts and hunting prowess.' 
                },
                'Spider Chitin Ring': { 
                    slot: 'ring1', tier: 'uncommon', level: 2,
                    stats: { dexterity: 3, willpower: 1 }, materials: { 'Spider Silk': 4, 'Chitin': 2 },
                    description: 'Made from spider chitin, provides natural armor and agility.' 
                },
                'Orc Warrior Ring': { 
                    slot: 'ring1', tier: 'uncommon', level: 3,
                    stats: { strength: 3, constitution: 2 }, materials: { 'Orc Tooth': 3, 'Crude Armor': 1 },
                    description: 'Forged from orc materials, increases battle ferocity.' 
                },
                'Venom Master Ring': { 
                    slot: 'ring1', tier: 'rare', level: 4,
                    stats: { dexterity: 4, intelligence: 3 }, materials: { 'Venom Sac': 3, 'Poison Gland': 2, 'Toxic Silk': 2 },
                    description: 'Grants immunity to poison and enhances toxin mastery.',
                    special: 'Poison immunity, +25% poison damage' 
                },
                'Alpha Predator Ring': { 
                    slot: 'ring1', tier: 'rare', level: 5,
                    stats: { strength: 4, dexterity: 3, constitution: 2 }, materials: { 'Alpha Pelt': 2, 'Alpha Fang': 2, 'Pack Leader Collar': 1 },
                    description: 'Commands the respect of all beasts.',
                    special: 'Beast command aura' 
                },
                'Dimensional Spider Ring': { 
                    slot: 'ring1', tier: 'epic', level: 6,
                    stats: { dexterity: 5, intelligence: 4, willpower: 3 }, materials: { 'Phase Silk': 3, 'Ethereal Essence': 2, 'Dimensional Web': 1 },
                    description: 'Allows the wearer to phase between dimensions.',
                    special: 'Phase shift ability, +30% dodge' 
                },
                'Warchief Dominance Ring': { 
                    slot: 'ring1', tier: 'legendary', level: 7,
                    stats: { strength: 6, constitution: 5, willpower: 4 }, materials: { 'Warchief Crown': 1, 'Great Axe': 1, 'War Cloak': 1 },
                    description: 'The ultimate symbol of battlefield supremacy.',
                    special: 'Command presence, +50% leadership bonuses' 
                }
            },
            
            // Cloak Slot Items - Crafted from monster materials
            cloaks: {
                'Goblin Scout Cloak': { 
                    slot: 'cloak', tier: 'common', level: 1,
                    stats: { dexterity: 2 }, materials: { 'Tattered Cloth': 4, 'Goblin Dagger': 1 },
                    description: 'A patched cloak that provides basic stealth.' 
                },
                'Animal Hide Cloak': { 
                    slot: 'cloak', tier: 'common', level: 2,
                    stats: { constitution: 2, willpower: 1 }, materials: { 'Animal Hide': 3, 'Wolf Pelt': 1 },
                    description: 'Sturdy protection against the elements.' 
                },
                'Spider Silk Mantle': { 
                    slot: 'cloak', tier: 'uncommon', level: 3,
                    stats: { dexterity: 3, intelligence: 2 }, materials: { 'Spider Silk': 6, 'Web Anchor': 2 },
                    description: 'Lightweight and flexible, woven from spider silk.' 
                },
                'Shaman Spirit Cloak': { 
                    slot: 'cloak', tier: 'uncommon', level: 4,
                    stats: { intelligence: 3, willpower: 3 }, materials: { 'Shaman Mask': 1, 'Spirit Pouch': 2, 'Magic Pouch': 1 },
                    description: 'Imbued with shamanic magic and spirit energy.' 
                },
                'Dire Wolf Mantle': { 
                    slot: 'cloak', tier: 'rare', level: 5,
                    stats: { strength: 3, constitution: 4, dexterity: 2 }, materials: { 'Dire Pelt': 2, 'Massive Fang': 2, 'Primal Essence': 1 },
                    description: 'The ultimate predator\'s mantle.',
                    special: 'Intimidation aura, +20% critical hit chance' 
                },
                'Master Weaver Cloak': { 
                    slot: 'cloak', tier: 'rare', level: 6,
                    stats: { dexterity: 4, intelligence: 4, willpower: 2 }, materials: { 'Master Silk': 4, 'Silk Gland': 2, 'Web Trap': 1 },
                    description: 'Crafted by spider masters, provides web manipulation.',
                    special: 'Web casting ability' 
                },
                'Broodmother\'s Embrace': { 
                    slot: 'cloak', tier: 'epic', level: 7,
                    stats: { constitution: 5, willpower: 5, intelligence: 3 }, materials: { 'Brood Silk': 3, 'Egg Sac': 2, 'Motherly Essence': 1 },
                    description: 'Protective cloak that nurtures and shields allies.',
                    special: 'Ally protection aura, spawns protective spirits' 
                },
                'Spider Queen\'s Regalia': { 
                    slot: 'cloak', tier: 'legendary', level: 8,
                    stats: { all: 4 }, materials: { 'Queen Crown': 1, 'Royal Silk': 3, 'Spider Throne': 1 },
                    description: 'The ultimate spider artifact, grants dominion over arachnids.',
                    special: 'Spider command, web fortress creation, venom mastery' 
                }
            },
            
            // Neck Slot Items - Crafted from monster materials
            necks: {
                'Goblin Scrap Necklace': { 
                    slot: 'neck', tier: 'common', level: 1,
                    stats: { dexterity: 1, intelligence: 1 }, materials: { 'Rusty Coin': 2, 'Goblin Dagger': 1 },
                    description: 'A makeshift necklace of goblin scavenged items.' 
                },
                'Wolf Fang Collar': { 
                    slot: 'neck', tier: 'common', level: 2,
                    stats: { strength: 2, constitution: 1 }, materials: { 'Sharp Fang': 3, 'Animal Hide': 1 },
                    description: 'Grants predatory instincts and enhanced bite force.' 
                },
                'Spider Chitin Pendant': { 
                    slot: 'neck', tier: 'uncommon', level: 3,
                    stats: { dexterity: 3, willpower: 1 }, materials: { 'Chitin': 4, 'Spider Silk': 3 },
                    description: 'Lightweight pendant that enhances natural armor.' 
                },
                'Shaman\'s Spirit Torc': { 
                    slot: 'neck', tier: 'uncommon', level: 4,
                    stats: { intelligence: 3, willpower: 3 }, materials: { 'Ritual Bones': 3, 'Spirit Pouch': 2 },
                    description: 'Channels spiritual energy and magical power.' 
                },
                'Venomous Serpent Coil': { 
                    slot: 'neck', tier: 'rare', level: 5,
                    stats: { dexterity: 4, intelligence: 3 }, materials: { 'Venom Sac': 4, 'Poison Gland': 3, 'Venom Fang': 2 },
                    description: 'Grants mastery over all toxins and poisons.',
                    special: 'Poison immunity, venom enhancement' 
                },
                'Alpha Dominance Collar': { 
                    slot: 'neck', tier: 'rare', level: 6,
                    stats: { strength: 4, constitution: 3, willpower: 2 }, materials: { 'Pack Leader Collar': 2, 'Alpha Fang': 3, 'Alpha Pelt': 1 },
                    description: 'Commands respect from all beasts and establishes pack dominance.',
                    special: 'Beast command, intimidation aura' 
                },
                'Dimensional Phase Amulet': { 
                    slot: 'neck', tier: 'epic', level: 7,
                    stats: { dexterity: 5, intelligence: 4, willpower: 3 }, materials: { 'Ethereal Essence': 3, 'Dimensional Web': 2, 'Phase Silk': 4 },
                    description: 'Allows the wearer to exist between dimensions.',
                    special: 'Phase shift mastery, dimensional travel' 
                },
                'Crown of Monster Kings': { 
                    slot: 'neck', tier: 'legendary', level: 8,
                    stats: { all: 3 }, materials: { 'Chieftain Crown': 1, 'Warchief Crown': 1, 'Queen Crown': 1 },
                    description: 'The ultimate symbol of dominion over all monster races.',
                    special: 'Monster command, all creature immunities' 
                }
            },
            // Offhand Slot Items - Crafted from monster materials
            offhands: {
                'Goblin Buckler': { 
                    slot: 'offhand', tier: 'common', level: 1,
                    stats: { constitution: 1, dexterity: 1, defense: 1 }, materials: { 'Crude Armor': 1, 'Tattered Cloth': 2 },
                    description: 'A makeshift shield crafted from goblin scrap.' 
                },
                'Spider Web Shield': { 
                    slot: 'offhand', tier: 'common', level: 2,
                    stats: { dexterity: 2, willpower: 1, defense: 2 }, materials: { 'Spider Silk': 5, 'Chitin': 2 },
                    description: 'Flexible shield that can entangle enemies.',
                    special: 'Web entangle on block' 
                },
                'Wolf Hide Buckler': { 
                    slot: 'offhand', tier: 'uncommon', level: 3,
                    stats: { constitution: 2, strength: 2, defense: 3 }, materials: { 'Wolf Pelt': 3, 'Sharp Fang': 2 },
                    description: 'Sturdy shield with predatory intimidation.' 
                },
                'Orc War Shield': { 
                    slot: 'offhand', tier: 'uncommon', level: 4,
                    stats: { constitution: 3, strength: 2, defense: 4 }, materials: { 'War Banner': 1, 'Captain Shield': 1, 'Orc Blade': 1 },
                    description: 'Battle-tested shield from orc campaigns.',
                    special: 'Battle fury on successful block' 
                },
                'Venom Orb': { 
                    slot: 'offhand', tier: 'rare', level: 5,
                    stats: { intelligence: 4, dexterity: 2, defense: 2 }, materials: { 'Poison Gland': 4, 'Venom Sac': 3, 'Toxic Silk': 2 },
                    description: 'Crystallized venom that enhances poison abilities.',
                    special: 'Poison spell enhancement, immunity to toxins' 
                },
                'Alpha Command Totem': { 
                    slot: 'offhand', tier: 'rare', level: 6,
                    stats: { willpower: 4, constitution: 3, defense: 5 }, materials: { 'Pack Leader Collar': 2, 'Alpha Pelt': 2, 'Primal Essence': 1 },
                    description: 'Grants command over beast packs.',
                    special: 'Beast summoning, pack leader aura' 
                },
                'Dimensional Weaver\'s Focus': { 
                    slot: 'offhand', tier: 'epic', level: 7,
                    stats: { intelligence: 5, willpower: 4, defense: 3 }, materials: { 'Dimensional Web': 3, 'Ethereal Essence': 2, 'Phase Silk': 4 },
                    description: 'Allows manipulation of dimensional fabric.',
                    special: 'Dimensional magic mastery, portal creation' 
                },
                'Battle Horn of Supreme Rule': { 
                    slot: 'offhand', tier: 'legendary', level: 8,
                    stats: { all: 3, defense: 6 }, materials: { 'Spider Throne': 1, 'Command Horn': 1, 'Command Cloak': 1 },
                    description: 'The ultimate horn of absolute authority and protection.',
                    special: 'Supreme command, monster loyalty, realm dominion' 
                }
            }
        };
        
        // Initialize crafting recipes for all items
        this.initializeCraftingRecipes();
    }
    
    initializeCraftingRecipes() {
        if (!this.gameState.craftingRecipes) {
            this.gameState.craftingRecipes = {};
        }
        
        // Add basic weapon crafting recipes
        const basicWeaponRecipes = {
            'Iron Sword': { level: 1, unlocked: false, materials: { scrapIron: 1 } },
            'Elven Bow': { level: 1, unlocked: false, materials: { scrapWood: 1 } },
            'Arcane Wand': { level: 2, unlocked: false, materials: { bones: 1 } },
            'Divine Staff': { level: 2, unlocked: false, materials: { scrapWood: 1 } },
            'Shamanic Ritual Staff': { level: 5, unlocked: false, materials: { 'Shaman Staff': 1, 'Ritual Bones': 1, 'Magic Pouch': 1 } },
            'Venomous Scout Bow': { level: 6, unlocked: false, materials: { 'Scout Bow': 1, 'Leather Scraps': 1, 'Poison Dart': 1 } },
            'Mighty Hammer': { level: 7, unlocked: false, materials: { 'Chieftain Crown': 1, 'War Hammer': 1, 'Command Cloak': 1 } },
            'Raging Axe': { level: 8, unlocked: false, materials: { 'Berserker Axe': 1, 'Battle Scars': 1, 'Rage Potion': 1 } },
            'Razor Spear': { level: 9, unlocked: false, materials: { 'Scout Spear': 1, 'Tracking Kit': 1, 'Trail Map': 1 } },
            'Cracked Bone Staff': { level: 10, unlocked: false, materials: { 'Bone Staff': 1, 'Shaman Mask': 1, 'Spirit Pouch': 1 } },
            'Foul Staff': { level: 12, unlocked: false, materials: { 'Necromancer Staff': 1, 'Death Robes': 1, 'Soul Crystal': 1 } },
            'Dark Demon Blade': { level: 15, unlocked: false, materials: { 'Imp Wing': 1, 'Sulfur': 1, 'Demonic Essence': 1 } }
        };
        
        // Add basic armor recipes
        const basicArmorRecipes = {
            'Silk Robe': { level: 1, unlocked: false, materials: { spiderSilk: 1 } },
            'Leather Helm': { level: 2, unlocked: false, materials: { animalHide: 1 } },
            'Bone Arm Guards': { level: 3, unlocked: false, materials: { bones: 2 } },
            'Chitin Shell Helm': { level: 4, unlocked: false, materials: { chitin: 2 } }
        };
        
        // Merge all recipes
        Object.assign(this.gameState.craftingRecipes, basicWeaponRecipes, basicArmorRecipes);
        
        // Add all craftable loot to crafting recipes
        if (this.craftableLootDatabase) {
            ['rings', 'cloaks', 'necks', 'offhands'].forEach(category => {
                if (this.craftableLootDatabase[category]) {
                    Object.entries(this.craftableLootDatabase[category]).forEach(([itemName, itemData]) => {
                        this.gameState.craftingRecipes[itemName] = {
                            materials: itemData.materials,
                            level: itemData.level,
                            category: category,
                            unlocked: false
                        };
                    });
                }
            });
        }
        
        console.log(`Initialized ${Object.keys(this.gameState.craftingRecipes).length} crafting recipes`);
    }
    
    // Enhanced loot generation that includes craftable equipment materials
    generateEnhancedLoot(enemy) {
        const loot = [];
        
        // Use monster's loot table if available
        if (enemy.lootTable && enemy.lootTable.length > 0) {
            const dropChance = 0.7; // 70% chance for special loot
            if (Math.random() < dropChance) {
                const randomLoot = enemy.lootTable[Math.floor(Math.random() * enemy.lootTable.length)];
                loot.push(randomLoot);
            }
        }
        
        // Add enhanced material drops based on enemy type and level
        const materialDrops = this.getEnhancedMaterialDrops(enemy);
        loot.push(...materialDrops);
        
        // Improved chance for crafting recipe discovery
        if (Math.random() < 0.25) { // 25% chance for testing
            const recipeData = this.discoverCraftingRecipe(enemy.level);
            if (recipeData) {
                loot.push(`Recipe: ${recipeData.name}`);
                console.log(`Recipe discovered: ${recipeData.name} from ${enemy.name} (level ${enemy.level})`);
                
                // Store the recipe data for enhanced logging
                loot.recipeData = recipeData;
            }
        }
        
        return loot;
    }
    
    getEnhancedMaterialDrops(enemy) {
        const materials = [];
        const baseDropRate = 0.8; // 80% base chance
        const levelBonus = enemy.level * 0.05; // +5% per level
        const finalDropRate = Math.min(baseDropRate + levelBonus, 0.95); // Cap at 95%
        
        // Determine material types based on monster type
        const materialMap = {
            // Spider types
            'Spider': [{ material: 'spiderSilk', amount: 1, chance: finalDropRate }],
            'Venomous Spider': [{ material: 'spiderSilk', amount: 2, chance: finalDropRate }],
            'Web Spinner': [{ material: 'spiderSilk', amount: 2, chance: finalDropRate }],
            'Giant Spider': [{ material: 'spiderSilk', amount: 3, chance: finalDropRate }],
            'Brood Mother': [{ material: 'spiderSilk', amount: 4, chance: finalDropRate }],
            'Phase Spider': [{ material: 'spiderSilk', amount: 3, chance: finalDropRate }],
            'Spider Queen': [{ material: 'spiderSilk', amount: 6, chance: finalDropRate }],
            
            // Beast types
            'Wolf': [{ material: 'animalHide', amount: 1, chance: finalDropRate }],
            'Alpha Wolf': [{ material: 'animalHide', amount: 2, chance: finalDropRate }],
            'Dire Wolf': [{ material: 'animalHide', amount: 3, chance: finalDropRate }],
            
            // Undead types
            'Skeleton': [{ material: 'bones', amount: 2, chance: finalDropRate }],
            'Skeleton Archer': [{ material: 'bones', amount: 2, chance: finalDropRate }],
            'Zombie': [{ material: 'bones', amount: 1, chance: finalDropRate }],
            'Bone Knight': [{ material: 'bones', amount: 4, chance: finalDropRate }],
            'Wraith': [{ material: 'bones', amount: 3, chance: finalDropRate }],
            'Lich': [{ material: 'bones', amount: 6, chance: finalDropRate }],
            'Death Knight': [{ material: 'bones', amount: 5, chance: finalDropRate }],
            'Dark Necromancer': [{ material: 'bones', amount: 4, chance: finalDropRate }],
            
            // Goblin/Orc types - mixed materials
            'Goblin': [
                { material: 'scrapWood', amount: 1, chance: finalDropRate * 0.6 },
                { material: 'scrapIron', amount: 1, chance: finalDropRate * 0.4 }
            ],
            'Orc': [
                { material: 'scrapIron', amount: 2, chance: finalDropRate * 0.7 },
                { material: 'scrapWood', amount: 1, chance: finalDropRate * 0.3 }
            ]
        };
        
        // Get materials for this enemy type or use default
        const enemyMaterials = materialMap[enemy.type] || materialMap[enemy.name] || [
            { material: 'bones', amount: 1, chance: finalDropRate * 0.4 },
            { material: 'scrapIron', amount: 1, chance: finalDropRate * 0.3 },
            { material: 'scrapWood', amount: 1, chance: finalDropRate * 0.2 },
            { material: 'animalHide', amount: 1, chance: finalDropRate * 0.1 }
        ];
        
        // Roll for each material
        enemyMaterials.forEach(drop => {
            if (Math.random() < drop.chance) {
                materials.push({
                    type: 'material',
                    material: drop.material,
                    amount: drop.amount
                });
            }
        });
        
        return materials;
    }
    
    discoverCraftingRecipe(enemyLevel) {
        // Get available recipes for this level
        const availableRecipes = Object.entries(this.gameState.craftingRecipes).filter(([name, recipe]) => 
            recipe.level <= enemyLevel && !recipe.unlocked
        );
        
        console.log(`Recipe discovery attempt - Enemy level: ${enemyLevel}, Available recipes: ${availableRecipes.length}`);
        
        if (availableRecipes.length === 0) {
            console.log('No available recipes to unlock');
            return null;
        }
        
        // Select random recipe to unlock
        const [recipeName, recipe] = availableRecipes[Math.floor(Math.random() * availableRecipes.length)];
        recipe.unlocked = true;
        
        console.log(`Recipe unlocked: ${recipeName}`);
        return { name: recipeName, recipe: recipe };
    }

    getRecipeDescription(recipeName, recipe) {
        // Helper function to get an exciting description of what the recipe creates
        const weaponDescriptions = {
            'Iron Sword': 'a reliable blade for aspiring warriors',
            'Elven Bow': 'an elegant ranged weapon favored by scouts',
            'Arcane Wand': 'a mystical focus for magical energies',
            'Divine Staff': 'a holy weapon blessed with divine power',
            'Shamanic Ritual Staff': 'a powerful tribal weapon infused with ancient spirits',
            'Venomous Scout Bow': 'a deadly bow that strikes with poison',
            'Mighty Hammer': 'a crushing weapon of tremendous force',
            'Raging Axe': 'a berserker\'s weapon that feeds on fury',
            'Razor Spear': 'a precision weapon for skilled hunters',
            'Cracked Bone Staff': 'a necromantic focus crackling with dark energy',
            'Foul Staff': 'a twisted staff of pure malevolence',
            'Dark Demon Blade': 'a terrifying weapon forged in the fires of hell'
        };
        
        const armorDescriptions = {
            'Silk Robe': 'elegant robes woven from spider silk',
            'Leather Helm': 'sturdy headgear crafted from beast hide',
            'Bone Arm Guards': 'protective guards carved from ancient bones',
            'Chitin Shell Helm': 'a helmet made from insect carapace'
        };
        
        const categoryDescriptions = {
            'rings': 'a mystical ring of power',
            'cloaks': 'a protective cloak',
            'necks': 'an enchanted amulet',
            'offhands': 'a magical offhand item'
        };
        
        // Try weapon descriptions first
        if (weaponDescriptions[recipeName]) {
            return weaponDescriptions[recipeName];
        }
        
        // Try armor descriptions
        if (armorDescriptions[recipeName]) {
            return armorDescriptions[recipeName];
        }
        
        // Try category descriptions for craftable loot
        if (recipe.category && categoryDescriptions[recipe.category]) {
            return categoryDescriptions[recipe.category];
        }
        
        // Default description
        return 'a powerful craftable item';
    }

    dropLoot(enemy) {
        // Initialize loot database if not done
        if (!this.craftableLootDatabase) {
            this.initializeCraftableLootDatabase();
        }
        
        // Generate enhanced loot
        const lootItems = this.generateEnhancedLoot(enemy);
        
        // Process each loot item
        lootItems.forEach(loot => {
            if (typeof loot === 'string') {
                if (loot.startsWith('Recipe: ')) {
                    const recipeName = loot.substring(8);
                    // Store discovered recipes
                    if (!this.gameState.hero.discoveredRecipes) {
                        this.gameState.hero.discoveredRecipes = [];
                    }
                    if (!this.gameState.hero.discoveredRecipes.includes(recipeName)) {
                        this.gameState.hero.discoveredRecipes.push(recipeName);
                    }
                    
                    // Get recipe data for enhanced description
                    const recipeInfo = lootItems.recipeData;
                    if (recipeInfo) {
                        const description = this.getRecipeDescription(recipeInfo.name, recipeInfo.recipe);
                        
                        // Create exciting, bold log message
                        this.ui.log(`🎉 **RARE RECIPE DISCOVERED!** 🎉 ${enemy.name} revealed the secrets of crafting **${recipeName}** - ${description}!`);
                        this.ui.showNotification(`🔥 RECIPE DISCOVERED: ${recipeName}! 🔥`, "legendary");
                        
                        // Add materials info to log
                        if (recipeInfo.recipe.materials) {
                            const materialList = Object.entries(recipeInfo.recipe.materials)
                                .map(([material, amount]) => `${amount} ${material}`)
                                .join(', ');
                            this.ui.log(`📋 **Recipe Requirements:** ${materialList}`);
                        }
                    } else {
                        // Fallback to basic message if no recipe data
                        this.ui.log(`🎉 **RECIPE DISCOVERED!** ${enemy.name} dropped ${loot}!`);
                        this.ui.showNotification(`Discovered ${recipeName} crafting recipe!`, "legendary");
                    }
                } else {
                    // Handle special named items
                    this.addItemToInventory(loot);
                    this.ui.log(`${enemy.name} dropped ${loot}!`);
                    this.ui.showNotification(`Found ${loot}!`, "rare");
                }
            } else if (loot.type === 'material') {
                // Handle material drops
                if (!this.gameState.hero.materials) {
                    this.gameState.hero.materials = {};
                }
                this.gameState.hero.materials[loot.material] = (this.gameState.hero.materials[loot.material] || 0) + loot.amount;
                const materialNames = {
                    spiderSilk: 'Spider Silk',
                    animalHide: 'Animal Hide',
                    bones: 'Bones',
                    scrapWood: 'Scrap Wood',
                    scrapIron: 'Scrap Iron',
                    chitin: 'Chitin',
                    dragonScale: 'Dragon Scale',
                    scaleArmor: 'Scale Armor',
                    ectoplasm: 'Ectoplasm',
                    spiritEssence: 'Spirit Essence',
                    ghostlyCloth: 'Ghostly Cloth'
                };
                const materialName = materialNames[loot.material] || loot.material;
                this.ui.log(`${enemy.name} dropped ${loot.amount} ${materialName}!`);
                this.ui.showNotification(`Found ${materialName}!`, "success");
            }
        });
        
        // Fallback to old system if no enhanced loot was generated
        if (lootItems.length === 0) {
            this.dropLootLegacy(enemy);
        }
    }
    
    dropLootLegacy(enemy) {
        // Original loot system as fallback
        const lootTable = {
            Spider: { 
                material: 'spiderSilk', 
                materialName: 'Spider Silk',
                amount: 1,
                chance: 100  // 100% drop rate
            },
            Wolf: { 
                material: 'animalHide', 
                materialName: 'Animal Hide',
                amount: 1,
                chance: 100  // 100% drop rate
            },
            Orc: { 
                materials: [
                    { material: 'scrapWood', materialName: 'Scrap Wood', amount: 1 },
                    { material: 'scrapIron', materialName: 'Scrap Iron', amount: 1 }
                ],
                chance: 100  // 100% chance to drop one of the two
            },
            Goblin: { 
                materials: [
                    { material: 'scrapWood', materialName: 'Scrap Wood', amount: 1 },
                    { material: 'scrapIron', materialName: 'Scrap Iron', amount: 1 }
                ],
                chance: 100  // 100% chance to drop one of the two
            },
            Skeleton: { 
                material: 'bones', 
                materialName: 'Bones',
                amount: 1,
                chance: 100  // 100% drop rate
            }
        };

        const enemyType = enemy.name;
        const drop = lootTable[enemyType];

        if (drop && Math.random() * 100 < drop.chance) {
            if (drop.materials) {
                // Random drop from multiple materials (Orc/Goblin)
                const randomDrop = drop.materials[Math.floor(Math.random() * drop.materials.length)];
                this.gameState.hero.materials[randomDrop.material] = (this.gameState.hero.materials[randomDrop.material] || 0) + randomDrop.amount;
                this.ui.log(`${enemy.name} dropped ${randomDrop.amount} ${randomDrop.materialName}!`);
                this.ui.showNotification(`Found ${randomDrop.materialName}!`, "success");
            } else {
                // Single material drop (Spider/Wolf/Skeleton)
                this.gameState.hero.materials[drop.material] = (this.gameState.hero.materials[drop.material] || 0) + drop.amount;
                this.ui.log(`${enemy.name} dropped ${drop.amount} ${drop.materialName}!`);
                this.ui.showNotification(`Found ${drop.materialName}!`, "success");
            }
        }
    }
    
    addItemToInventory(itemName) {
        // Add item to inventory with proper structure
        if (!this.gameState.hero.inventory) {
            this.gameState.hero.inventory = [];
        }
        
        // Create proper item object based on the dropped item name
        let itemObject;
        
        // Check if it's a special crafting material/item
        if (typeof itemName === 'string') {
            // Look up the item in the loot database to get proper details
            if (this.craftableLootDatabase && this.craftableLootDatabase[itemName]) {
                const lootData = this.craftableLootDatabase[itemName];
                itemObject = {
                    name: itemName,
                    type: lootData.type || 'material',
                    description: lootData.description || 'A crafting material',
                    rarity: lootData.rarity || 'common',
                    icon: lootData.icon || '📦',
                    value: lootData.value || 10
                };
            } else {
                // Create a basic item object for unknown items
                itemObject = {
                    name: itemName,
                    type: 'material',
                    description: 'A mysterious item',
                    rarity: 'common',
                    icon: '❓',
                    value: 5
                };
            }
        } else {
            // Item is already an object
            itemObject = itemName;
        }
        
        // Add to hero's equipment/inventory
        this.gameState.hero.equipment.push(itemObject);
    }

    // Centralized enemy defeat handler to prevent double rewards
    handleEnemyDefeat(enemy, defeatedBy = 'Hero') {
        // Check if this enemy has already been processed for rewards
        if (enemy.rewardsProcessed) {
            return; // Skip duplicate processing
        }
        
        // Mark as processed to prevent double rewards
        enemy.rewardsProcessed = true;
        
        this.ui.log(`${enemy.name} 💀 is defeated by ${defeatedBy}!`);
        
        // Drop loot based on enemy type
        this.dropLoot(enemy);
        
        // Calculate rewards based on who defeated the enemy
        let baseGold, baseXp, goldMultiplier, xpMultiplier, dungeonGoldBonus, dungeonXpBonus;
        
        if (defeatedBy === 'Hero') {
            // Hero gets bonus rewards
            baseGold = Math.floor(Math.random() * 15) + 10; // 10-24 base
            baseXp = Math.floor(Math.random() * 20) + 15; // 15-34 base
            goldMultiplier = 1.5; // Hero bonus
            xpMultiplier = 1.5; // Hero bonus
            dungeonGoldBonus = this.gameState.dungeonLevel * Math.floor(Math.random() * 4 + 3); // +3-6 per level
            dungeonXpBonus = this.gameState.dungeonLevel * Math.floor(Math.random() * 6 + 4); // +4-9 per level
        } else {
            // Underling kills get standard rewards
            baseGold = Math.floor(Math.random() * 10) + 5; // 5-14 base
            baseXp = Math.floor(Math.random() * 15) + 10; // 10-24 base
            goldMultiplier = 1.0; // No bonus
            xpMultiplier = 1.0; // No bonus
            dungeonGoldBonus = this.gameState.dungeonLevel * Math.floor(Math.random() * 3 + 2); // +2-4 per level
            dungeonXpBonus = this.gameState.dungeonLevel * Math.floor(Math.random() * 5 + 3); // +3-7 per level
        }
        
        // Calculate final rewards
        const goldReward = Math.floor((baseGold + dungeonGoldBonus) * goldMultiplier);
        const xpReward = Math.floor((baseXp + dungeonXpBonus) * xpMultiplier);
        
        this.gameState.hero.gold += goldReward;
        this.gameState.hero.fame += xpReward;
        
        const bonusText = defeatedBy === 'Hero' ? ' (Hero bonus + ' : ' (';
        this.ui.log(`You gained 💰${goldReward} gold and ⭐${xpReward} experience!${bonusText}Dungeon Lv.${this.gameState.dungeonLevel})`);
        this.ui.showNotification(`${defeatedBy} defeated ${enemy.name}! +${goldReward} gold, +${xpReward} XP`, "success");
    }

    calculateManaBonus(character) {
        // Intelligence and Willpower provide bonus mana: (INT + WIL - 10) * 2.5 mana
        if (!character || typeof character.intelligence !== 'number' || typeof character.willpower !== 'number' || 
            isNaN(character.intelligence) || isNaN(character.willpower)) {
            return 0;
        }
        return Math.max(0, (character.intelligence + character.willpower - 10) * 2.5);
    }

    calculateStaminaBonus(character) {
        // Stamina derives from Strength, Dexterity, and Constitution (33% each)
        // Formula: (STR + DEX + CON - 15) * 2.5 stamina
        if (!character || typeof character.strength !== 'number' || typeof character.dexterity !== 'number' || 
            typeof character.constitution !== 'number' || isNaN(character.strength) || 
            isNaN(character.dexterity) || isNaN(character.constitution)) {
            return 0;
        }
        return Math.max(0, (character.strength + character.dexterity + character.constitution - 15) * 2.5);
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
        // Store original health/mana/stamina before applying bonuses
        const currentHealthPercent = character.health / character.maxHealth;
        const currentManaPercent = character.mana / character.maxMana;
        const currentStaminaPercent = character.stamina ? character.stamina / character.maxStamina : 1;
        
        // Calculate base values without stat bonuses
        let baseHealth = character.maxHealth;
        let baseMana = character.maxMana;
        let baseStamina = character.maxStamina || 100; // Default stamina for existing characters
        
        // Remove previous stat bonuses if they exist
        if (character.statBonusesApplied) {
            baseHealth -= character.previousHealthBonus || 0;
            baseHealth -= character.previousSizeHealthBonus || 0;
            baseMana -= character.previousManaBonus || 0;
            baseStamina -= character.previousStaminaBonus || 0;
        }
        
        // Calculate new stat bonuses
        const healthBonus = this.calculateHealthBonus(character);
        const sizeHealthBonus = this.calculateSizeHealthBonus(character);
        const manaBonus = this.calculateManaBonus(character);
        const staminaBonus = this.calculateStaminaBonus(character);
        
        // Apply new bonuses with minimum values
        const totalHealthBonus = healthBonus + sizeHealthBonus;
        const newMaxHealth = baseHealth + totalHealthBonus;
        const minimumHealth = 10; // Minimum 10 HP regardless of stat penalties
        
        character.maxHealth = Math.max(minimumHealth, newMaxHealth);
        character.maxMana = Math.max(1, baseMana + manaBonus);
        character.maxStamina = Math.max(1, baseStamina + staminaBonus);
        
        // Initialize stamina if it doesn't exist (for existing characters)
        if (!character.stamina) {
            character.stamina = character.maxStamina;
        }
        
        // Maintain current health/mana/stamina percentages
        character.health = Math.min(character.health, Math.floor(character.maxHealth * currentHealthPercent));
        character.mana = Math.min(character.mana, Math.floor(character.maxMana * currentManaPercent));
        character.stamina = Math.min(character.stamina, Math.floor(character.maxStamina * currentStaminaPercent));
        
        // Track that bonuses have been applied
        character.statBonusesApplied = true;
        character.previousHealthBonus = healthBonus;
        character.previousSizeHealthBonus = sizeHealthBonus;
        character.previousManaBonus = manaBonus;
        character.previousStaminaBonus = staminaBonus;
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
                'skirmisher': '🏹', 
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
                                    <div style="font-weight: bold; color: #ff6b6b; font-size: ${this.getResponsiveFontSize(14)}px;">${enemy.name}${this.renderStatusEffects(enemy)}</div>
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
                                <div style="font-weight: bold; color: #d4af37; font-size: ${this.getResponsiveFontSize(14)}px;">${this.gameState.hero.name || 'Hero'}${this.renderStatusEffects(this.gameState.hero)}</div>
                                <div style="font-size: ${this.getResponsiveFontSize(10)}px; color: #ccc;">Level ${this.gameState.hero.level} | Leader</div>
                                <div style="margin-top: 3px;">
                                    <span style="color: ${getHealthColor(this.gameState.hero.health, this.gameState.hero.maxHealth)}; font-weight: bold; font-size: ${this.getResponsiveFontSize(12)}px;">${this.gameState.hero.health}</span>
                                    <span style="color: #888; font-size: ${this.getResponsiveFontSize(12)}px;">/${this.gameState.hero.maxHealth} HP</span>
                                    <br>
                                    <span style="color: #4da6ff; font-weight: bold; font-size: ${this.getResponsiveFontSize(10)}px;">${this.gameState.hero.mana}</span>
                                    <span style="color: #888; font-size: ${this.getResponsiveFontSize(10)}px;">/${this.gameState.hero.maxMana} MP</span>
                                    <span style="color: #ffb84d; font-weight: bold; font-size: ${this.getResponsiveFontSize(10)}px; margin-left: 8px;">${this.gameState.hero.stamina || 0}</span>
                                    <span style="color: #888; font-size: ${this.getResponsiveFontSize(10)}px;">/${this.gameState.hero.maxStamina || 100} SP</span>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Underlings -->
                        ${aliveUnderlings.map(underling => `
                            <div style="display: flex; align-items: center; margin: ${this.getResponsiveMargin()} 0; padding: ${this.getResponsiveMargin()}; background: #0a1a0a; border-radius: ${this.getResponsiveBorderRadius()}; border-left: 3px solid #51cf66;">
                                <div style="font-size: ${this.getResponsiveIconSize()}; margin-right: ${this.getResponsiveMargin()};">${getCharacterIcon(underling.type)}</div>
                                <div style="flex: 1;">
                                    <div style="font-weight: bold; color: #51cf66; font-size: ${this.getResponsiveFontSize(14)}px;">${underling.name}${this.renderStatusEffects(underling)}</div>
                                    <div style="font-size: ${this.getResponsiveFontSize(10)}px; color: #ccc;">Level ${underling.level} | ${underling.type}</div>
                                    <div style="margin-top: 3px;">
                                        <span style="color: ${getHealthColor(underling.health, underling.maxHealth)}; font-weight: bold; font-size: ${this.getResponsiveFontSize(12)}px;">${underling.health}</span>
                                        <span style="color: #888; font-size: ${this.getResponsiveFontSize(12)}px;">/${underling.maxHealth} HP</span>
                                        <br>
                                        <span style="color: #4da6ff; font-weight: bold; font-size: ${this.getResponsiveFontSize(10)}px;">${underling.mana || 0}</span>
                                        <span style="color: #888; font-size: ${this.getResponsiveFontSize(10)}px;">/${underling.maxMana || 100} MP</span>
                                        <span style="color: #ffb84d; font-weight: bold; font-size: ${this.getResponsiveFontSize(10)}px; margin-left: 8px;">${underling.stamina || 0}</span>
                                        <span style="color: #888; font-size: ${this.getResponsiveFontSize(10)}px;">/${underling.maxStamina || 100} SP</span>
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
                    <div style="display: grid; grid-template-columns: ${this.isMobile ? '1fr 1fr' : '1fr 1fr 1fr'}; gap: ${this.getResponsiveMargin()};">
                        <button class="enhanced-combat-btn attack-btn" onclick="window.game.controller.playerAttack()" 
                                style="padding: ${this.getResponsiveButtonPadding()}; background: linear-gradient(45deg, #8b0000, #dc143c); border: 2px solid #ff6b6b; color: white; border-radius: ${this.getResponsiveBorderRadius()}; cursor: pointer; font-weight: bold; font-size: ${this.getResponsiveFontSize(12)}px; display: flex; align-items: center; justify-content: center; gap: 4px;">
                            ⚔️ Attack
                        </button>
                        <button class="enhanced-combat-btn defend-btn" onclick="window.game.controller.playerDefend()" 
                                style="padding: ${this.getResponsiveButtonPadding()}; background: linear-gradient(45deg, #2a4d3a, #4a7c59); border: 2px solid #51cf66; color: white; border-radius: ${this.getResponsiveBorderRadius()}; cursor: pointer; font-weight: bold; font-size: ${this.getResponsiveFontSize(12)}px; display: flex; align-items: center; justify-content: center; gap: 4px;">
                            🛡️ Defend
                        </button>
                        <button class="enhanced-combat-btn magic-btn" onclick="window.game.controller.showHeroAbilitySelection()" 
                                style="padding: ${this.getResponsiveButtonPadding()}; background: linear-gradient(45deg, #4a2d7a, #6b3fa0); border: 2px solid #9966cc; color: white; border-radius: ${this.getResponsiveBorderRadius()}; cursor: pointer; font-weight: bold; font-size: ${this.getResponsiveFontSize(12)}px; display: flex; align-items: center; justify-content: center; gap: 4px;">
                            ⚡ Powers
                        </button>
                        <button class="enhanced-combat-btn item-btn" onclick="window.game.controller.showCombatItemSelection()" 
                                style="padding: ${this.getResponsiveButtonPadding()}; background: linear-gradient(45deg, #4a4a2d, #7a7a3a); border: 2px solid #ffd93d; color: white; border-radius: ${this.getResponsiveBorderRadius()}; cursor: pointer; font-weight: bold; font-size: ${this.getResponsiveFontSize(12)}px; display: flex; align-items: center; justify-content: center; gap: 4px;">
                            🧪 Use Item
                        </button>
                        <button class="enhanced-combat-btn flee-btn" onclick="window.game.controller.playerFlee()" 
                                style="padding: ${this.getResponsiveButtonPadding()}; background: linear-gradient(45deg, #3a3a4a, #5a5a7a); border: 2px solid #9966cc; color: white; border-radius: ${this.getResponsiveBorderRadius()}; cursor: pointer; font-weight: bold; font-size: ${this.getResponsiveFontSize(12)}px; display: flex; align-items: center; justify-content: center; gap: 4px; ${this.isMobile ? 'grid-column: 1 / -1;' : ''}">
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
        
        // Display round indicator if this is the start of a new round
        if (this.gameState.combatRound === 0 || this.gameState.newRoundStarting) {
            this.displayRoundIndicator();
            this.gameState.newRoundStarting = false;
        }
        
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

        // Process underling turns
        this.processUnderlingTurns();
        
        // Check if main target is defeated (by hero) BEFORE filtering
        if (target.health <= 0) {
            // Use centralized defeat handler
            this.handleEnemyDefeat(target, 'Hero');
            
            // Remove the specific defeated enemy by ID, not by position
            this.gameState.currentEnemies = this.gameState.currentEnemies.filter(enemy => enemy.id !== target.id);
        }

        // Check if all enemies defeated (already handled in processUnderlingTurns if needed)
        if (this.gameState.currentEnemies.length === 0) {
            return;
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
                    ${items.map((target, index) => {
                        // Get the actual character object to access mana/stamina
                        let actualCharacter = target.isHero ? this.gameState.hero : target.underlingRef;
                        let manaInfo = actualCharacter && actualCharacter.maxMana ? `${actualCharacter.mana || 0}/${actualCharacter.maxMana}` : 'N/A';
                        let staminaInfo = actualCharacter && actualCharacter.maxStamina ? `${actualCharacter.stamina || 0}/${actualCharacter.maxStamina}` : 'N/A';
                        
                        return `
                        <div class="docked-target-option" onclick="window.game.controller.useCombatItemOnTarget(${this.currentSelectedItemIndex}, ${index})">
                            <div class="docked-target-info">
                                <div>
                                    <h4>${target.name}</h4>
                                    <div class="docked-target-health">Health: ${target.health}/${target.maxHealth}</div>
                                    <div class="docked-target-mana">Mana: ${manaInfo}</div>
                                    <div class="docked-target-stamina">Stamina: ${staminaInfo}</div>
                                </div>
                                <div class="docked-target-icon">${target.isHero ? '👑' : '🛡️'}</div>
                            </div>
                        </div>`
                    }).join('')}
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

    processUnderlingTurns() {
        // Living underlings also attack/use abilities!
        const aliveUnderlings = this.gameState.hero.underlings.filter(u => u.isAlive);
        
        aliveUnderlings.forEach((underling, index) => {
            if (this.gameState.currentEnemies.length > 0) {
                // Try to use an ability first (30% chance)
                if (this.tryUnderlingAbility(underling)) {
                    // Update combat interface
                    setTimeout(() => this.showCombatInterface(), (index + 1) * 300);
                    return; // Skip normal attack
                }
                
                // Normal attack for all other cases
                // Each underling targets a random enemy that's still alive
                const underlingTarget = this.gameState.currentEnemies[Math.floor(Math.random() * this.gameState.currentEnemies.length)];
                
                // Skip if no valid target found
                if (!underlingTarget || underlingTarget.health <= 0) {
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
                    // Use centralized defeat handler
                    this.handleEnemyDefeat(underlingTarget, underling.name);
                    
                    // Remove defeated enemy immediately
                    this.gameState.currentEnemies = this.gameState.currentEnemies.filter(enemy => enemy.id !== underlingTarget.id);
                }
            }
        });

        // Remove any other enemies with health <= 0 (safety cleanup after underling attacks already processed)
        this.gameState.currentEnemies = this.gameState.currentEnemies.filter(enemy => enemy.health > 0);

        // Check if all enemies defeated
        if (this.gameState.currentEnemies.length === 0) {
            this.ui.log("All enemies defeated! You can continue deeper or exit the dungeon.");
            this.checkLevelUp();
            this.ui.render();
            this.showVictoryConfirmation();
            return;
        }

        // Update combat chat display immediately to show combat results
        this.updateCombatChatDisplay();
    }

    // Check for defeated enemies and process XP/gold/loot (used after spells)
    checkAndProcessDefeatedEnemies() {
        if (!this.gameState.currentEnemies) return;
        
        // Find defeated enemies (health <= 0)
        const defeatedEnemies = this.gameState.currentEnemies.filter(enemy => enemy.health <= 0);
        
        // Debug logging
        if (defeatedEnemies.length > 0) {
            console.log('Processing defeated enemies from spell/ability:', defeatedEnemies.map(e => e.name));
        }
        
        // Process each defeated enemy
        defeatedEnemies.forEach(enemy => {
            this.handleEnemyDefeat(enemy, 'Hero');
        });
        
        // Remove defeated enemies from the current enemies list
        this.gameState.currentEnemies = this.gameState.currentEnemies.filter(enemy => enemy.health > 0);
    }

    // Helper function to apply status effects (used by special ability handlers)
    applyStatusEffect(target, effectType, value, duration) {
        if (!target.statusEffects) {
            target.statusEffects = {};
        }
        
        target.statusEffects[effectType] = {
            value: value,
            duration: duration
        };
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
            // Check if enemy is stunned or paralyzed BEFORE processing status effects
            if (enemy.statusEffects && (enemy.statusEffects.stunned || enemy.statusEffects.paralyzed)) {
                const effectName = enemy.statusEffects.stunned ? 'stunned' : 'paralyzed';
                const effectIcon = this.getStatusEffectInfo()[effectName].icon;
                this.ui.log(`${enemy.name} is ${effectName} and cannot act! ${effectIcon}`);
                return; // Skip this enemy's turn
            }
            
            // Try monster abilities first (25% chance)
            if (this.tryMonsterAbility(enemy)) {
                return; // Skip normal attack if ability was used
            }
            
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
                    this.gameState.hero.health = 0;
                    
                    // Check for racial abilities that prevent death (like orc ferocity)
                    const survived = this.handleCharacterDeath(this.gameState.hero);
                    
                    if (!survived) {
                        this.playerDefeated();
                        return;
                    } else {
                        this.ui.log(`${this.gameState.hero.name} refuses to fall!`);
                    }
                }
            } else {
                // Underling was attacked
                const underlingIndex = this.gameState.hero.underlings.findIndex(u => u === target);
                this.ui.log(`${enemy.name} attacks ${target.name} for ${actualDamage} damage!${this.gameState.defendingThisTurn ? ' (Reduced by defending)' : ''}${defenseText}${tauntDefenseBonus} (${target.name}: ${Math.max(0, target.health)}/${target.maxHealth} HP)`);
                
                // Check if underling is defeated
                if (target.health <= 0) {
                    target.health = 0;
                    
                    // Check for racial abilities that prevent death (like orc ferocity)
                    const survived = this.handleCharacterDeath(target);
                    
                    if (!survived) {
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
        
        // Process status effects at the END of the enemy turn (after all actions)
        this.processAllStatusEffects();
        
        // Mark that a new round is starting for next player action
        this.gameState.newRoundStarting = true;
        
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
                                <div style="font-size: ${this.getResponsiveIconSize()}; margin-right: ${this.getResponsiveMargin()};">${underling.type === 'skirmisher' ? '🏹' : underling.type === 'warrior' ? '⚔️' : underling.type === 'mage' ? '🔮' : '⚡'}</div>
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
        
        // Clear all status effects (burning, poison, bleeding, etc.)
        this.clearAllStatusEffects();
        
        // Restore some health and mana for the party
        const restHpRestore = Math.floor(this.gameState.hero.maxHealth * 0.25); // 25% HP restoration
        const restManaRestore = Math.floor((this.gameState.hero.maxMana || 100) * 0.25); // 25% Mana restoration
        const restStaminaRestore = Math.floor((this.gameState.hero.maxStamina || 100) * 0.25); // 25% Stamina restoration
        
        // Restore hero
        const heroHpBefore = this.gameState.hero.health;
        const heroManaBefore = this.gameState.hero.mana || 0;
        const heroStaminaBefore = this.gameState.hero.stamina || 0;
        
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
        
        if (this.gameState.hero.maxStamina) {
            this.gameState.hero.stamina = Math.min(
                (this.gameState.hero.stamina || 0) + restStaminaRestore, // Use proper stamina restore value
                this.gameState.hero.maxStamina
            );
        }
        
        let restoredMembers = [];
        if (heroHpBefore < this.gameState.hero.maxHealth || 
            (this.gameState.hero.maxMana && heroManaBefore < this.gameState.hero.maxMana) ||
            (this.gameState.hero.maxStamina && heroStaminaBefore < this.gameState.hero.maxStamina)) {
            
            let restoreText = `${this.gameState.hero.name || 'Hero'} (+${Math.min(restHpRestore, this.gameState.hero.maxHealth - heroHpBefore)} HP`;
            
            if (this.gameState.hero.maxMana) {
                restoreText += `, +${Math.min(restManaRestore, this.gameState.hero.maxMana - heroManaBefore)} MP`;
            }
            
            if (this.gameState.hero.maxStamina) {
                restoreText += `, +${Math.min(restStaminaRestore, this.gameState.hero.maxStamina - heroStaminaBefore)} SP`;
            }
            
            restoreText += ')';
            restoredMembers.push(restoreText);
        }
        
        // Restore underlings
        this.gameState.hero.underlings.forEach(underling => {
            if (underling.isAlive) {
                const underlingHpBefore = underling.health;
                const underlingManaBefore = underling.mana || 0;
                const underlingStaminaBefore = underling.stamina || 0;
                const underlingHpRestore = Math.floor(underling.maxHealth * 0.25);
                const underlingManaRestore = Math.floor((underling.maxMana || 50) * 0.25);
                const underlingStaminaRestore = Math.floor((underling.maxStamina || 100) * 0.25);
                
                underling.health = Math.min(underling.health + underlingHpRestore, underling.maxHealth);
                if (underling.maxMana) {
                    underling.mana = Math.min(underling.mana + underlingManaRestore, underling.maxMana);
                }
                if (underling.maxStamina) {
                    underling.stamina = Math.min((underling.stamina || 0) + underlingStaminaRestore, underling.maxStamina);
                }
                
                if (underlingHpBefore < underling.maxHealth || 
                    (underling.maxMana && underlingManaBefore < underling.maxMana) ||
                    (underling.maxStamina && underlingStaminaBefore < underling.maxStamina)) {
                    
                    let restoreText = `${underling.name} (+${Math.min(underlingHpRestore, underling.maxHealth - underlingHpBefore)} HP`;
                    
                    if (underling.maxMana) {
                        restoreText += `, +${Math.min(underlingManaRestore, underling.maxMana - underlingManaBefore)} MP`;
                    }
                    
                    if (underling.maxStamina) {
                        restoreText += `, +${Math.min(underlingStaminaRestore, underling.maxStamina - underlingStaminaBefore)} SP`;
                    }
                    
                    restoreText += ')';
                    restoredMembers.push(restoreText);
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
        // Close any existing combat modals before starting new encounter
        this.closeEnhancedCombatModal();
        
        // Close any open modals
        const existingModals = document.querySelectorAll('.modal-overlay');
        existingModals.forEach(modal => modal.remove());
        
        this.ui.log(`🔍 Exploring deeper into dungeon level ${this.gameState.dungeonLevel}...`);
        
        // Use event manager to determine what happens
        if (this.eventManager) {
            const eventType = this.eventManager.determineRandomEvent(this.gameState.dungeonLevel);
            this.eventManager.handleRandomEvent(eventType, this.gameState.dungeonLevel);
        } else {
            // Fallback to old system if event manager not available
            this.gameState.inCombat = true;
            this.generateEnemies();
            this.ui.log("New enemies block your path!");
            setTimeout(() => this.showCombatInterface(), 500);
        }
    }

    goDeeperInDungeon() {
        // Close any existing combat modals before starting new encounter
        this.closeEnhancedCombatModal();
        
        // Close any other open modals
        const existingModals = document.querySelectorAll('.modal-overlay');
        existingModals.forEach(modal => modal.remove());
        
        this.gameState.dungeonLevel++;
        this.ui.log(`Descending to dungeon level ${this.gameState.dungeonLevel}...`);
        
        // Change to a different random dungeon background
        this.ui.setBackground('dungeon');
        
        // Use event manager to determine what happens
        if (this.eventManager) {
            const eventType = this.eventManager.determineRandomEvent(this.gameState.dungeonLevel);
            this.eventManager.handleRandomEvent(eventType, this.gameState.dungeonLevel);
        } else {
            // Fallback to old system if event manager not available
            this.gameState.inCombat = true;
            this.generateEnemies();
            this.ui.log("New enemies block your path!");
            setTimeout(() => this.showCombatInterface(), 500);
        }
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
        
        // Clear all status effects when leaving dungeon
        this.clearAllStatusEffects();
        
        // Restore 15% HP and mana for hero and underlings
        this.restorePartyAfterDungeon();
        
        this.ui.log("You exit the dungeon.");
        this.ui.render();
    }

    restorePartyAfterDungeon() {
        let restoredMembers = [];
        
        // Restore hero's HP, mana, and stamina
        const heroHpBefore = this.gameState.hero.health;
        const heroManaBefore = this.gameState.hero.mana || 0;
        const heroStaminaBefore = this.gameState.hero.stamina || 0;
        
        const heroHpRestore = Math.floor(this.gameState.hero.maxHealth * 0.15);
        const heroManaRestore = Math.floor((this.gameState.hero.maxMana || 100) * 0.15);
        const heroStaminaRestore = Math.floor((this.gameState.hero.maxStamina || 100) * 0.15);
        
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
        
        if (this.gameState.hero.maxStamina) {
            this.gameState.hero.stamina = Math.min(
                (this.gameState.hero.stamina || 0) + heroStaminaRestore, 
                this.gameState.hero.maxStamina
            );
        }
        
        // Track if hero was actually healed
        if (heroHpBefore < this.gameState.hero.maxHealth || 
            (this.gameState.hero.maxMana && heroManaBefore < this.gameState.hero.maxMana) ||
            (this.gameState.hero.maxStamina && heroStaminaBefore < this.gameState.hero.maxStamina)) {
            
            const heroHpGained = this.gameState.hero.health - heroHpBefore;
            const heroManaGained = (this.gameState.hero.mana || 0) - heroManaBefore;
            const heroStaminaGained = (this.gameState.hero.stamina || 0) - heroStaminaBefore;
            
            let restoreText = `${this.gameState.hero.name || 'Hero'}`;
            if (heroHpGained > 0) restoreText += ` +${heroHpGained} HP`;
            if (heroManaGained > 0) restoreText += ` +${heroManaGained} MP`;
            if (heroStaminaGained > 0) restoreText += ` +${heroStaminaGained} SP`;
            
            restoredMembers.push(restoreText);
        }
        
        // Restore underlings' HP, mana, and stamina
        this.gameState.hero.underlings.forEach(underling => {
            if (underling.isAlive) {
                const underlingHpBefore = underling.health;
                const underlingManaBefore = underling.mana || 0;
                const underlingStaminaBefore = underling.stamina || 0;
                
                const underlingHpRestore = Math.floor(underling.maxHealth * 0.15);
                const underlingManaRestore = Math.floor((underling.maxMana || 50) * 0.15);
                const underlingStaminaRestore = Math.floor((underling.maxStamina || 100) * 0.15);
                
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
                
                if (underling.maxStamina) {
                    underling.stamina = Math.min(
                        (underling.stamina || 0) + underlingStaminaRestore, 
                        underling.maxStamina
                    );
                }
                
                // Track if underling was actually healed
                if (underlingHpBefore < underling.maxHealth || 
                    (underling.maxMana && underlingManaBefore < underling.maxMana) ||
                    (underling.maxStamina && underlingStaminaBefore < underling.maxStamina)) {
                    
                    const underlingHpGained = underling.health - underlingHpBefore;
                    const underlingManaGained = (underling.mana || 0) - underlingManaBefore;
                    const underlingStaminaGained = (underling.stamina || 0) - underlingStaminaBefore;
                    
                    let restoreText = `${underling.name}`;
                    if (underlingHpGained > 0) restoreText += ` +${underlingHpGained} HP`;
                    if (underlingManaGained > 0) restoreText += ` +${underlingManaGained} MP`;
                    if (underlingStaminaGained > 0) restoreText += ` +${underlingStaminaGained} SP`;
                    
                    restoredMembers.push(restoreText);
                }
            }
        });
        
        // Log the restoration if anyone was healed
        if (restoredMembers.length > 0) {
            this.ui.log("🌿 Leaving the dungeon, your party recovers from their trials...");
            this.ui.log(`✨ Restored: ${restoredMembers.join(', ')}`);
            this.ui.showNotification("Party recovered 15% HP/Mana/Stamina!", "success");
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
        
        // Define all craftable items with material requirements
        const craftableItems = [
            // Weapons
            { 
                id: 'iron_sword', 
                name: 'Iron Sword', 
                cost: 50,
                materials: { scrapIron: 1 },
                description: '+5 Attack (Melee Weapon)',
                type: 'weapon'
            },
            { 
                id: 'elven_bow', 
                name: 'Elven Bow', 
                cost: 60,
                materials: { scrapWood: 1 },
                description: '+6 Attack (Ranged Weapon)',
                type: 'weapon'
            },
            { 
                id: 'arcane_wand', 
                name: 'Arcane Wand', 
                cost: 80,
                materials: { bones: 1 },
                description: '+7 Attack (Arcane Weapon)',
                type: 'weapon'
            },
            { 
                id: 'divine_staff', 
                name: 'Divine Staff', 
                cost: 90,
                materials: { scrapWood: 1 },
                description: '+8 Attack (Divine Weapon)',
                type: 'weapon'
            },
            
            // New Advanced Weapons
            { 
                id: 'shamanic_ritual_staff', 
                name: 'Shamanic Ritual Staff', 
                cost: 250,
                materials: { 'Shaman Staff': 1, 'Ritual Bones': 1, 'Magic Pouch': 1 },
                description: '+9 Attack (Shamanic Weapon)',
                type: 'weapon'
            },
            { 
                id: 'venomous_scout_bow', 
                name: 'Venomous Scout Bow', 
                cost: 280,
                materials: { 'Scout Bow': 1, 'Leather Scraps': 1, 'Poison Dart': 1 },
                description: '+8 Attack (Venomous Ranged)',
                type: 'weapon'
            },
            { 
                id: 'mighty_hammer', 
                name: 'Mighty Hammer', 
                cost: 300,
                materials: { 'Chieftain Crown': 1, 'War Hammer': 1, 'Command Cloak': 1 },
                description: '+7 Attack (Mighty Weapon)',
                type: 'weapon'
            },
            { 
                id: 'raging_axe', 
                name: 'Raging Axe', 
                cost: 350,
                materials: { 'Berserker Axe': 1, 'Battle Scars': 1, 'Rage Potion': 1 },
                description: '+14 Attack (Berserker Weapon)',
                type: 'weapon'
            },
            { 
                id: 'razor_spear', 
                name: 'Razor Spear', 
                cost: 400,
                materials: { 'Scout Spear': 1, 'Tracking Kit': 1, 'Trail Map': 1 },
                description: '+15 Attack, +5% Crit (Precision Weapon)',
                type: 'weapon'
            },
            { 
                id: 'cracked_bone_staff', 
                name: 'Cracked Bone Staff', 
                cost: 450,
                materials: { 'Bone Staff': 1, 'Shaman Mask': 1, 'Spirit Pouch': 1 },
                description: '+16 Attack, +5 Willpower (Mystical Weapon)',
                type: 'weapon'
            },
            { 
                id: 'foul_staff', 
                name: 'Foul Staff', 
                cost: 500,
                materials: { 'Necromancer Staff': 1, 'Death Robes': 1, 'Soul Crystal': 1 },
                description: '+20 Attack, +5 Intelligence (Necromantic Weapon)',
                type: 'weapon'
            },
            { 
                id: 'dark_demon_blade', 
                name: 'Dark Demon Blade', 
                cost: 800,
                materials: { 'Imp Wing': 1, 'Sulfur': 1, 'Demonic Essence': 1, 'Shadow Essence': 1, 'Dark Crystal': 1, 'Void Cloth': 1, 'Flame Heart': 1, 'Brimstone': 1 },
                description: '+35 Attack, +15% Crit, +15 Dex, +15 Stamina (Demonic Weapon)',
                type: 'weapon'
            },
            { 
                id: 'warped_reality_blade', 
                name: 'Warped Reality Blade', 
                cost: 900,
                materials: { 'Reality Blade': 1, 'Demon Crown': 1, "Lord's Scepter": 1, 'Infernal Throne': 1, 'Arch Crown': 1, 'Demon Gate Key': 1 },
                description: '+30 Attack, +20 Mana, +15 Willpower, +10 Defense (Reality Weapon)',
                type: 'weapon'
            },
            { 
                id: 'bloody_ritual_dagger', 
                name: 'Bloody Ritual Dagger', 
                cost: 950,
                materials: { 'Cultist Robes': 1, 'Dragon Idol': 1, 'Ritual Dagger': 1 },
                description: '+35 Attack, +20 Willpower, +20 Mana (Ritual Weapon)',
                type: 'weapon'
            },
            
            // Silk Armor Set
            { 
                id: 'silk_hood', 
                name: 'Silk Hood', 
                cost: 40,
                materials: { spiderSilk: 1 },
                description: '+1 Defense, +2 Mana (Head Armor)',
                type: 'armor',
                slot: 'head'
            },
            { 
                id: 'silk_sleeves', 
                name: 'Silk Sleeves', 
                cost: 35,
                materials: { spiderSilk: 1 },
                description: '+1 Defense, +2 Mana (Arm Armor)',
                type: 'armor',
                slot: 'arms'
            },
            { 
                id: 'silk_gloves', 
                name: 'Silk Gloves', 
                cost: 30,
                materials: { spiderSilk: 1 },
                description: '+1 Defense, +2 Mana (Hand Armor)',
                type: 'armor',
                slot: 'hands'
            },
            { 
                id: 'silk_robe', 
                name: 'Silk Robe', 
                cost: 50,
                materials: { spiderSilk: 1 },
                description: '+2 Defense, +3 Mana (Chest Armor)',
                type: 'armor',
                slot: 'chest'
            },
            { 
                id: 'silk_pants', 
                name: 'Silk Pants', 
                cost: 40,
                materials: { spiderSilk: 1 },
                description: '+1 Defense, +2 Mana (Leg Armor)',
                type: 'armor',
                slot: 'legs'
            },
            { 
                id: 'silk_shoes', 
                name: 'Silk Shoes', 
                cost: 25,
                materials: { spiderSilk: 1 },
                description: '+1 Defense, +2 Mana (Foot Armor)',
                type: 'armor',
                slot: 'feet'
            },
            
            // Leather Armor Set
            { 
                id: 'leather_helm', 
                name: 'Leather Helm', 
                cost: 60,
                materials: { animalHide: 1 },
                description: '+2 Defense, +3 Stamina (Head Armor)',
                type: 'armor',
                slot: 'head'
            },
            { 
                id: 'leather_bracers', 
                name: 'Leather Bracers', 
                cost: 50,
                materials: { animalHide: 1 },
                description: '+2 Defense, +3 Stamina (Arm Armor)',
                type: 'armor',
                slot: 'arms'
            },
            { 
                id: 'leather_gauntlets', 
                name: 'Leather Gauntlets', 
                cost: 45,
                materials: { animalHide: 1 },
                description: '+2 Defense, +3 Stamina (Hand Armor)',
                type: 'armor',
                slot: 'hands'
            },
            { 
                id: 'leather_armor', 
                name: 'Leather Armor', 
                cost: 75,
                materials: { animalHide: 1 },
                description: '+3 Defense, +5 Stamina (Chest Armor)',
                type: 'armor',
                slot: 'chest'
            },
            { 
                id: 'leather_leggings', 
                name: 'Leather Leggings', 
                cost: 55,
                materials: { animalHide: 1 },
                description: '+2 Defense, +3 Stamina (Leg Armor)',
                type: 'armor',
                slot: 'legs'
            },
            { 
                id: 'leather_boots', 
                name: 'Leather Boots', 
                cost: 40,
                materials: { animalHide: 1 },
                description: '+2 Defense (Foot Armor)',
                type: 'armor',
                slot: 'feet'
            },
            
            // Iron Armor Set
            { 
                id: 'iron_helmet', 
                name: 'Iron Helmet', 
                cost: 80,
                materials: { scrapIron: 1 },
                description: '+4 Defense (Head Armor)',
                type: 'armor',
                slot: 'head'
            },
            { 
                id: 'iron_vambraces', 
                name: 'Iron Vambraces', 
                cost: 70,
                materials: { scrapIron: 1 },
                description: '+4 Defense (Arm Armor)',
                type: 'armor',
                slot: 'arms'
            },
            { 
                id: 'iron_gauntlets', 
                name: 'Iron Gauntlets', 
                cost: 65,
                materials: { scrapIron: 1 },
                description: '+4 Defense (Hand Armor)',
                type: 'armor',
                slot: 'hands'
            },
            { 
                id: 'iron_chestplate', 
                name: 'Iron Chestplate', 
                cost: 100,
                materials: { scrapIron: 1 },
                description: '+6 Defense (Chest Armor)',
                type: 'armor',
                slot: 'chest'
            },
            { 
                id: 'iron_greaves', 
                name: 'Iron Greaves', 
                cost: 75,
                materials: { scrapIron: 1 },
                description: '+4 Defense (Leg Armor)',
                type: 'armor',
                slot: 'legs'
            },
            { 
                id: 'iron_boots', 
                name: 'Iron Boots', 
                cost: 60,
                materials: { scrapIron: 1 },
                description: '+4 Defense (Foot Armor)',
                type: 'armor',
                slot: 'feet'
            },
            
            // Bone Armor Set (Same defense as leather, grants mana like silk)
            { 
                id: 'bone_skull_helm', 
                name: 'Bone Skull Helm', 
                cost: 70,
                materials: { bones: 2 },
                description: '+2 Defense, +3 Mana (Head Armor)',
                type: 'armor',
                slot: 'head'
            },
            { 
                id: 'bone_arm_guards', 
                name: 'Bone Arm Guards', 
                cost: 60,
                materials: { bones: 2 },
                description: '+2 Defense, +3 Mana (Arm Armor)',
                type: 'armor',
                slot: 'arms'
            },
            { 
                id: 'bone_claw_gauntlets', 
                name: 'Bone Claw Gauntlets', 
                cost: 55,
                materials: { bones: 2 },
                description: '+2 Defense, +3 Mana (Hand Armor)',
                type: 'armor',
                slot: 'hands'
            },
            { 
                id: 'bone_rib_armor', 
                name: 'Bone Rib Armor', 
                cost: 85,
                materials: { bones: 2 },
                description: '+3 Defense, +5 Mana (Chest Armor)',
                type: 'armor',
                slot: 'chest'
            },
            { 
                id: 'bone_leg_plates', 
                name: 'Bone Leg Plates', 
                cost: 65,
                materials: { bones: 2 },
                description: '+2 Defense, +3 Mana (Leg Armor)',
                type: 'armor',
                slot: 'legs'
            },
            { 
                id: 'bone_spike_boots', 
                name: 'Bone Spike Boots', 
                cost: 50,
                materials: { bones: 2 },
                description: '+2 Defense, +2 Mana (Foot Armor)',
                type: 'armor',
                slot: 'feet'
            },
            
            // Chitin Armor Set (Same defense as iron, grants stamina)
            { 
                id: 'chitin_shell_helm', 
                name: 'Chitin Shell Helm', 
                cost: 90,
                materials: { chitin: 2 },
                description: '+4 Defense, +3 Stamina (Head Armor)',
                type: 'armor',
                slot: 'head'
            },
            { 
                id: 'chitin_carapace_guards', 
                name: 'Chitin Carapace Guards', 
                cost: 80,
                materials: { chitin: 2 },
                description: '+4 Defense, +3 Stamina (Arm Armor)',
                type: 'armor',
                slot: 'arms'
            },
            { 
                id: 'chitin_claw_gauntlets', 
                name: 'Chitin Claw Gauntlets', 
                cost: 75,
                materials: { chitin: 2 },
                description: '+4 Defense, +3 Stamina (Hand Armor)',
                type: 'armor',
                slot: 'hands'
            },
            { 
                id: 'chitin_shell_armor', 
                name: 'Chitin Shell Armor', 
                cost: 110,
                materials: { chitin: 2 },
                description: '+6 Defense, +5 Stamina (Chest Armor)',
                type: 'armor',
                slot: 'chest'
            },
            { 
                id: 'chitin_leg_shells', 
                name: 'Chitin Leg Shells', 
                cost: 85,
                materials: { chitin: 2 },
                description: '+4 Defense, +3 Stamina (Leg Armor)',
                type: 'armor',
                slot: 'legs'
            },
            { 
                id: 'chitin_shell_boots', 
                name: 'Chitin Shell Boots', 
                cost: 70,
                materials: { chitin: 2 },
                description: '+4 Defense, +3 Stamina (Foot Armor)',
                type: 'armor',
                slot: 'feet'
            },
            
            // Dragon Scale Armor Set (Better than iron, grants both mana and stamina)
            { 
                id: 'dragon_scale_crown', 
                name: 'Dragon Scale Crown', 
                cost: 150,
                materials: { dragonScale: 1, scaleArmor: 1 },
                description: '+6 Defense, +4 Mana, +4 Stamina (Head Armor)',
                type: 'armor',
                slot: 'head'
            },
            { 
                id: 'dragon_scale_bracers', 
                name: 'Dragon Scale Bracers', 
                cost: 130,
                materials: { dragonScale: 1, scaleArmor: 1 },
                description: '+6 Defense, +4 Mana, +4 Stamina (Arm Armor)',
                type: 'armor',
                slot: 'arms'
            },
            { 
                id: 'dragon_scale_gauntlets', 
                name: 'Dragon Scale Gauntlets', 
                cost: 120,
                materials: { dragonScale: 1, scaleArmor: 1 },
                description: '+6 Defense, +4 Mana, +4 Stamina (Hand Armor)',
                type: 'armor',
                slot: 'hands'
            },
            { 
                id: 'dragon_scale_chestplate', 
                name: 'Dragon Scale Chestplate', 
                cost: 180,
                materials: { dragonScale: 1, scaleArmor: 1 },
                description: '+8 Defense, +6 Mana, +6 Stamina (Chest Armor)',
                type: 'armor',
                slot: 'chest'
            },
            { 
                id: 'dragon_scale_leggings', 
                name: 'Dragon Scale Leggings', 
                cost: 140,
                materials: { dragonScale: 1, scaleArmor: 1 },
                description: '+6 Defense, +4 Mana, +4 Stamina (Leg Armor)',
                type: 'armor',
                slot: 'legs'
            },
            { 
                id: 'dragon_scale_boots', 
                name: 'Dragon Scale Boots', 
                cost: 110,
                materials: { dragonScale: 1, scaleArmor: 1 },
                description: '+6 Defense, +4 Mana, +4 Stamina (Foot Armor)',
                type: 'armor',
                slot: 'feet'
            },
            
            // Ghostly Shroud Armor Set (Same defense as leather, double mana of silk)
            { 
                id: 'ghostly_hood', 
                name: 'Ghostly Hood', 
                cost: 80,
                materials: { ectoplasm: 1, spiritEssence: 1, ghostlyCloth: 1 },
                description: '+2 Defense, +6 Mana (Head Armor)',
                type: 'armor',
                slot: 'head'
            },
            { 
                id: 'ghostly_wraps', 
                name: 'Ghostly Wraps', 
                cost: 70,
                materials: { ectoplasm: 1, spiritEssence: 1, ghostlyCloth: 1 },
                description: '+2 Defense, +6 Mana (Arm Armor)',
                type: 'armor',
                slot: 'arms'
            },
            { 
                id: 'ghostly_gloves', 
                name: 'Ghostly Gloves', 
                cost: 65,
                materials: { ectoplasm: 1, spiritEssence: 1, ghostlyCloth: 1 },
                description: '+2 Defense, +6 Mana (Hand Armor)',
                type: 'armor',
                slot: 'hands'
            },
            { 
                id: 'ghostly_robes', 
                name: 'Ghostly Robes', 
                cost: 100,
                materials: { ectoplasm: 1, spiritEssence: 1, ghostlyCloth: 1 },
                description: '+3 Defense, +10 Mana (Chest Armor)',
                type: 'armor',
                slot: 'chest'
            },
            { 
                id: 'ghostly_shroud', 
                name: 'Ghostly Shroud', 
                cost: 75,
                materials: { ectoplasm: 1, spiritEssence: 1, ghostlyCloth: 1 },
                description: '+2 Defense, +6 Mana (Leg Armor)',
                type: 'armor',
                slot: 'legs'
            },
            { 
                id: 'ghostly_slippers', 
                name: 'Ghostly Slippers', 
                cost: 55,
                materials: { ectoplasm: 1, spiritEssence: 1, ghostlyCloth: 1 },
                description: '+2 Defense, +6 Mana (Foot Armor)',
                type: 'armor',
                slot: 'feet'
            },
            
            // Consumables
            { 
                id: 'health_potion', 
                name: 'Health Potion', 
                cost: 25, 
                materials: {},
                description: 'Restores 50 HP (Consumable)',
                type: 'consumable'
            }
        ];
        
        // Helper function to check if item can be crafted
        const canCraft = (item) => {
            if (this.gameState.hero.gold < item.cost) return false;
            for (const [material, required] of Object.entries(item.materials)) {
                if ((this.gameState.hero.materials[material] || 0) < required) return false;
            }
            return true;
        };
        
        // Helper function to format material requirements
        const formatMaterials = (materials) => {
            if (Object.keys(materials).length === 0) return '';
            return Object.entries(materials).map(([material, amount]) => {
                const materialNames = {
                    spiderSilk: 'Spider Silk',
                    animalHide: 'Animal Hide',
                    scrapIron: 'Scrap Iron',
                    scrapWood: 'Scrap Wood',
                    bones: 'Bones',
                    chitin: 'Chitin',
                    dragonScale: 'Dragon Scale',
                    scaleArmor: 'Scale Armor',
                    ectoplasm: 'Ectoplasm',
                    spiritEssence: 'Spirit Essence',
                    ghostlyCloth: 'Ghostly Cloth',
                    'Shaman Staff': 'Shaman Staff',
                    'Ritual Bones': 'Ritual Bones',
                    'Magic Pouch': 'Magic Pouch',
                    'Scout Bow': 'Scout Bow',
                    'Leather Scraps': 'Leather Scraps',
                    'Poison Dart': 'Poison Dart',
                    'Chieftain Crown': 'Chieftain Crown',
                    'War Hammer': 'War Hammer',
                    'Command Cloak': 'Command Cloak',
                    'Berserker Axe': 'Berserker Axe',
                    'Battle Scars': 'Battle Scars',
                    'Rage Potion': 'Rage Potion',
                    'Scout Spear': 'Scout Spear',
                    'Tracking Kit': 'Tracking Kit',
                    'Trail Map': 'Trail Map',
                    'Bone Staff': 'Bone Staff',
                    'Shaman Mask': 'Shaman Mask',
                    'Spirit Pouch': 'Spirit Pouch',
                    'Necromancer Staff': 'Necromancer Staff',
                    'Death Robes': 'Death Robes',
                    'Soul Crystal': 'Soul Crystal',
                    'Imp Wing': 'Imp Wing',
                    'Sulfur': 'Sulfur',
                    'Demonic Essence': 'Demonic Essence',
                    'Shadow Essence': 'Shadow Essence',
                    'Dark Crystal': 'Dark Crystal',
                    'Void Cloth': 'Void Cloth',
                    'Flame Heart': 'Flame Heart',
                    'Brimstone': 'Brimstone',
                    'Reality Blade': 'Reality Blade',
                    'Demon Crown': 'Demon Crown',
                    "Lord's Scepter": "Lord's Scepter",
                    'Infernal Throne': 'Infernal Throne',
                    'Arch Crown': 'Arch Crown',
                    'Demon Gate Key': 'Demon Gate Key',
                    'Cultist Robes': 'Cultist Robes',
                    'Dragon Idol': 'Dragon Idol',
                    'Ritual Dagger': 'Ritual Dagger'
                };
                const current = this.gameState.hero.materials[material] || 0;
                const color = current >= amount ? '#51cf66' : '#ff6b6b';
                return `<span style="color: ${color};">${amount} ${materialNames[material]}</span>`;
            }).join(', ');
        };
        
        const craftingContent = `
            <div style="text-align: center; margin-bottom: 15px;">
                <h3 style="color: #d4af37; margin-bottom: 10px;">🔨 Crafting Workshop 🔨</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px; margin-bottom: 15px;">
                    <div style="background: #2a2a3a; padding: 8px; border-radius: 5px;">
                        <div style="color: #ffd93d; font-weight: bold;">💰 Gold</div>
                        <div style="color: #51cf66;">${this.gameState.hero.gold}</div>
                    </div>
                    
                    <!-- Basic Materials -->
                    <div style="background: #2a2a3a; padding: 8px; border-radius: 5px;">
                        <div style="color: #ffd93d; font-weight: bold;">🕸️ Spider Silk</div>
                        <div style="color: #51cf66;">${this.gameState.hero.materials.spiderSilk || 0}</div>
                    </div>
                    <div style="background: #2a2a3a; padding: 8px; border-radius: 5px;">
                        <div style="color: #ffd93d; font-weight: bold;">🦴 Animal Hide</div>
                        <div style="color: #51cf66;">${this.gameState.hero.materials.animalHide || 0}</div>
                    </div>
                    <div style="background: #2a2a3a; padding: 8px; border-radius: 5px;">
                        <div style="color: #ffd93d; font-weight: bold;">⚙️ Scrap Iron</div>
                        <div style="color: #51cf66;">${this.gameState.hero.materials.scrapIron || 0}</div>
                    </div>
                    <div style="background: #2a2a3a; padding: 8px; border-radius: 5px;">
                        <div style="color: #ffd93d; font-weight: bold;">🪵 Scrap Wood</div>
                        <div style="color: #51cf66;">${this.gameState.hero.materials.scrapWood || 0}</div>
                    </div>
                    <div style="background: #2a2a3a; padding: 8px; border-radius: 5px;">
                        <div style="color: #ffd93d; font-weight: bold;">🦴 Bones</div>
                        <div style="color: #51cf66;">${this.gameState.hero.materials.bones || 0}</div>
                    </div>
                    <div style="background: #2a2a3a; padding: 8px; border-radius: 5px;">
                        <div style="color: #ffd93d; font-weight: bold;">🪲 Chitin</div>
                        <div style="color: #51cf66;">${this.gameState.hero.materials.chitin || 0}</div>
                    </div>
                    
                    <!-- Advanced Materials -->
                    <div style="background: #2a2a3a; padding: 8px; border-radius: 5px;">
                        <div style="color: #ffd93d; font-weight: bold;">🐉 Dragon Scale</div>
                        <div style="color: #51cf66;">${this.gameState.hero.materials.dragonScale || 0}</div>
                    </div>
                    <div style="background: #2a2a3a; padding: 8px; border-radius: 5px;">
                        <div style="color: #ffd93d; font-weight: bold;">🛡️ Scale Armor</div>
                        <div style="color: #51cf66;">${this.gameState.hero.materials.scaleArmor || 0}</div>
                    </div>
                    <div style="background: #2a2a3a; padding: 8px; border-radius: 5px;">
                        <div style="color: #ffd93d; font-weight: bold;">👻 Ectoplasm</div>
                        <div style="color: #51cf66;">${this.gameState.hero.materials.ectoplasm || 0}</div>
                    </div>
                    <div style="background: #2a2a3a; padding: 8px; border-radius: 5px;">
                        <div style="color: #ffd93d; font-weight: bold;">✨ Spirit Essence</div>
                        <div style="color: #51cf66;">${this.gameState.hero.materials.spiritEssence || 0}</div>
                    </div>
                    <div style="background: #2a2a3a; padding: 8px; border-radius: 5px;">
                        <div style="color: #ffd93d; font-weight: bold;">🌫️ Ghostly Cloth</div>
                        <div style="color: #51cf66;">${this.gameState.hero.materials.ghostlyCloth || 0}</div>
                    </div>
                    
                    <!-- Special Drop Materials (will appear as you unlock recipes) -->
                    ${(this.gameState.hero.materials['Shaman Staff'] || 0) > 0 ? `
                    <div style="background: #3a2a4a; padding: 8px; border-radius: 5px; border-left: 3px solid #9966cc;">
                        <div style="color: #cc99ff; font-weight: bold;">🔮 Shaman Staff</div>
                        <div style="color: #51cf66;">${this.gameState.hero.materials['Shaman Staff'] || 0}</div>
                    </div>` : ''}
                    ${(this.gameState.hero.materials['Scout Bow'] || 0) > 0 ? `
                    <div style="background: #3a2a4a; padding: 8px; border-radius: 5px; border-left: 3px solid #9966cc;">
                        <div style="color: #cc99ff; font-weight: bold;">🏹 Scout Bow</div>
                        <div style="color: #51cf66;">${this.gameState.hero.materials['Scout Bow'] || 0}</div>
                    </div>` : ''}
                    ${(this.gameState.hero.materials['War Hammer'] || 0) > 0 ? `
                    <div style="background: #3a2a4a; padding: 8px; border-radius: 5px; border-left: 3px solid #9966cc;">
                        <div style="color: #cc99ff; font-weight: bold;">🔨 War Hammer</div>
                        <div style="color: #51cf66;">${this.gameState.hero.materials['War Hammer'] || 0}</div>
                    </div>` : ''}
                    ${(this.gameState.hero.materials['Berserker Axe'] || 0) > 0 ? `
                    <div style="background: #3a2a4a; padding: 8px; border-radius: 5px; border-left: 3px solid #9966cc;">
                        <div style="color: #cc99ff; font-weight: bold;">🪓 Berserker Axe</div>
                        <div style="color: #51cf66;">${this.gameState.hero.materials['Berserker Axe'] || 0}</div>
                    </div>` : ''}
                    ${(this.gameState.hero.materials['Necromancer Staff'] || 0) > 0 ? `
                    <div style="background: #3a2a4a; padding: 8px; border-radius: 5px; border-left: 3px solid #9966cc;">
                        <div style="color: #cc99ff; font-weight: bold;">💀 Necromancer Staff</div>
                        <div style="color: #51cf66;">${this.gameState.hero.materials['Necromancer Staff'] || 0}</div>
                    </div>` : ''}
                    ${(this.gameState.hero.materials['Soul Crystal'] || 0) > 0 ? `
                    <div style="background: #3a2a4a; padding: 8px; border-radius: 5px; border-left: 3px solid #9966cc;">
                        <div style="color: #cc99ff; font-weight: bold;">💎 Soul Crystal</div>
                        <div style="color: #51cf66;">${this.gameState.hero.materials['Soul Crystal'] || 0}</div>
                    </div>` : ''}
                    ${(this.gameState.hero.materials['Demon Crown'] || 0) > 0 ? `
                    <div style="background: #4a2a2a; padding: 8px; border-radius: 5px; border-left: 3px solid #ff6666;">
                        <div style="color: #ff9999; font-weight: bold;">👑 Demon Crown</div>
                        <div style="color: #51cf66;">${this.gameState.hero.materials['Demon Crown'] || 0}</div>
                    </div>` : ''}
                </div>
            </div>
            
            <div style="max-height: 500px; overflow-y: auto; border: 1px solid #444; border-radius: 8px; padding: 10px; background: #1a1a2a;">
                <div style="display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 10px; margin-bottom: 10px; padding: 8px; background: #2a2a3a; border-radius: 5px; font-weight: bold; color: #d4af37;">
                    <div>Item Name & Requirements</div>
                    <div style="text-align: center;">Cost</div>
                    <div style="text-align: center;">Action</div>
                </div>
                
                ${craftableItems.map(item => {
                    const craftable = canCraft(item);
                    const materialsText = formatMaterials(item.materials);
                    
                    return `
                    <div style="display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 10px; align-items: center; padding: 12px; margin: 5px 0; background: ${craftable ? '#0a2a0a' : '#2a0a0a'}; border-radius: 5px; border-left: 3px solid ${craftable ? '#51cf66' : '#ff6b6b'};">
                        <div>
                            <div style="font-weight: bold; color: ${craftable ? '#51cf66' : '#ff6b6b'};">${item.name}</div>
                            <div style="font-size: 12px; color: #ccc; margin-top: 3px;">${item.description}</div>
                            ${materialsText ? `<div style="font-size: 11px; margin-top: 2px;">Requires: ${materialsText}</div>` : ''}
                        </div>
                        <div style="text-align: center; font-weight: bold; color: #ffd93d;">💰${item.cost}g</div>
                        <div style="text-align: center;">
                            <button onclick="window.game.controller.craftItem('${item.id}', ${item.cost}, ${JSON.stringify(item.materials).replace(/"/g, '&quot;')})" 
                                    style="padding: 6px 12px; background: ${craftable ? 'linear-gradient(45deg, #2a4d3a, #4a7c59)' : 'linear-gradient(45deg, #4a2a2a, #6a3a3a)'}; 
                                           border: 1px solid ${craftable ? '#51cf66' : '#ff6b6b'}; color: white; border-radius: 4px; cursor: ${craftable ? 'pointer' : 'not-allowed'}; 
                                           font-size: 12px; font-weight: bold;"
                                    ${!craftable ? 'disabled' : ''}>
                                🔨 Craft
                            </button>
                        </div>
                    </div>
                    `;
                }).join('')}
            </div>
            
            <div style="margin-top: 15px; padding: 10px; background: #2a2a3a; border-radius: 5px; text-align: center;">
                <div style="font-size: 12px; color: #888; font-style: italic;">
                    💡 Tip: Defeat monsters to collect crafting materials. Different armor types offer different benefits and protection levels.
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

    craftItem(itemType, cost, materials = {}) {
        // Check gold requirement
        if (this.gameState.hero.gold < cost) {
            this.ui.log("Not enough gold to craft this item!");
            this.ui.showNotification("Insufficient gold!", "error");
            return;
        }

        // Check material requirements
        for (const [material, required] of Object.entries(materials)) {
            if ((this.gameState.hero.materials[material] || 0) < required) {
                this.ui.log(`Not enough ${material} to craft this item! Need ${required}, have ${this.gameState.hero.materials[material] || 0}`);
                this.ui.showNotification(`Insufficient ${material}!`, "error");
                return;
            }
        }

        // Deduct costs
        this.gameState.hero.gold -= cost;
        for (const [material, required] of Object.entries(materials)) {
            this.gameState.hero.materials[material] = (this.gameState.hero.materials[material] || 0) - required;
        }
        
        const items = {
            // Weapons
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
            
            // New Advanced Weapons
            shamanic_ritual_staff: { 
                name: "Shamanic Ritual Staff", 
                type: "weapon", 
                weaponType: "shamanic",
                stats: { attack: 9 }, 
                equipped: false 
            },
            venomous_scout_bow: { 
                name: "Venomous Scout Bow", 
                type: "weapon", 
                weaponType: "ranged",
                stats: { attack: 8 }, 
                equipped: false 
            },
            mighty_hammer: { 
                name: "Mighty Hammer", 
                type: "weapon", 
                weaponType: "melee",
                stats: { attack: 7 }, 
                equipped: false 
            },
            raging_axe: { 
                name: "Raging Axe", 
                type: "weapon", 
                weaponType: "melee",
                stats: { attack: 14 }, 
                equipped: false 
            },
            razor_spear: { 
                name: "Razor Spear", 
                type: "weapon", 
                weaponType: "melee",
                stats: { attack: 15, critBonus: 5 }, 
                equipped: false 
            },
            cracked_bone_staff: { 
                name: "Cracked Bone Staff", 
                type: "weapon", 
                weaponType: "arcane",
                stats: { attack: 16, willpower: 5 }, 
                equipped: false 
            },
            foul_staff: { 
                name: "Foul Staff", 
                type: "weapon", 
                weaponType: "necromantic",
                stats: { attack: 20, intelligence: 5 }, 
                equipped: false 
            },
            dark_demon_blade: { 
                name: "Dark Demon Blade", 
                type: "weapon", 
                weaponType: "demonic",
                stats: { attack: 35, critBonus: 15, dexterity: 15, stamina: 15 }, 
                equipped: false 
            },
            warped_reality_blade: { 
                name: "Warped Reality Blade", 
                type: "weapon", 
                weaponType: "reality",
                stats: { attack: 30, mana: 20, willpower: 15, defense: 10 }, 
                equipped: false 
            },
            bloody_ritual_dagger: { 
                name: "Bloody Ritual Dagger", 
                type: "weapon", 
                weaponType: "ritual",
                stats: { attack: 35, willpower: 20, mana: 20 }, 
                equipped: false 
            },
            
            // Silk Armor Set
            silk_hood: { 
                name: "Silk Hood", 
                type: "armor",
                slot: "head",
                stats: { defense: 1, mana: 2 }, 
                equipped: false 
            },
            silk_sleeves: { 
                name: "Silk Sleeves", 
                type: "armor",
                slot: "arms",
                stats: { defense: 1, mana: 2 }, 
                equipped: false 
            },
            silk_gloves: { 
                name: "Silk Gloves", 
                type: "armor",
                slot: "hands",
                stats: { defense: 1, mana: 2 }, 
                equipped: false 
            },
            silk_robe: { 
                name: "Silk Robe", 
                type: "armor",
                slot: "chest",
                stats: { defense: 2, mana: 3 }, 
                equipped: false 
            },
            silk_pants: { 
                name: "Silk Pants", 
                type: "armor",
                slot: "legs",
                stats: { defense: 1, mana: 2 }, 
                equipped: false 
            },
            silk_shoes: { 
                name: "Silk Shoes", 
                type: "armor",
                slot: "feet",
                stats: { defense: 1, mana: 2 }, 
                equipped: false 
            },
            
            // Leather Armor Set
            leather_helm: { 
                name: "Leather Helm", 
                type: "armor",
                slot: "head",
                stats: { defense: 2, stamina: 3 }, 
                equipped: false 
            },
            leather_bracers: { 
                name: "Leather Bracers", 
                type: "armor",
                slot: "arms",
                stats: { defense: 2, stamina: 3 }, 
                equipped: false 
            },
            leather_gauntlets: { 
                name: "Leather Gauntlets", 
                type: "armor",
                slot: "hands",
                stats: { defense: 2, stamina: 3 }, 
                equipped: false 
            },
            leather_armor: { 
                name: "Leather Armor", 
                type: "armor",
                slot: "chest",
                stats: { defense: 3, stamina: 5 }, 
                equipped: false 
            },
            leather_leggings: { 
                name: "Leather Leggings", 
                type: "armor",
                slot: "legs",
                stats: { defense: 2, stamina: 3 }, 
                equipped: false 
            },
            leather_boots: { 
                name: "Leather Boots", 
                type: "armor",
                slot: "feet",
                stats: { defense: 2 }, 
                equipped: false 
            },
            
            // Iron Armor Set
            iron_helmet: { 
                name: "Iron Helmet", 
                type: "armor",
                slot: "head",
                stats: { defense: 4 }, 
                equipped: false 
            },
            iron_vambraces: { 
                name: "Iron Vambraces", 
                type: "armor",
                slot: "arms",
                stats: { defense: 4 }, 
                equipped: false 
            },
            iron_gauntlets: { 
                name: "Iron Gauntlets", 
                type: "armor",
                slot: "hands",
                stats: { defense: 4 }, 
                equipped: false 
            },
            iron_chestplate: { 
                name: "Iron Chestplate", 
                type: "armor",
                slot: "chest",
                stats: { defense: 6 }, 
                equipped: false 
            },
            iron_greaves: { 
                name: "Iron Greaves", 
                type: "armor",
                slot: "legs",
                stats: { defense: 4 }, 
                equipped: false 
            },
            iron_boots: { 
                name: "Iron Boots", 
                type: "armor",
                slot: "feet",
                stats: { defense: 4 }, 
                equipped: false 
            },
            
            // Consumables
            health_potion: { 
                name: "Health Potion", 
                type: "consumable", 
                effect: "heal", 
                value: 50 
            }
        };

        const item = items[itemType];
        
        // Validation: Ensure item exists and has a name
        if (!item) {
            this.ui.log(`Error: Unknown item type "${itemType}"`);
            this.ui.showNotification("Crafting error - invalid item!", "error");
            return;
        }
        
        if (!item.name || item.name === undefined) {
            item.name = "Unknown Item"; // Fallback name
            this.ui.log("Warning: Item missing name, using fallback");
        }
        
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
        
        // Generate species-specific underling names
        const getRandomSpecies = () => {
            const speciesList = Object.keys(this.characterManager.speciesDefinitions);
            if (speciesList.length === 0) {
                return 'human'; // Fallback if no species defined
            }
            return speciesList[Math.floor(Math.random() * speciesList.length)];
        };

        const getSpeciesDisplayName = (speciesKey) => {
            const species = this.characterManager.speciesDefinitions[speciesKey];
            if (species && species.displayName) {
                return species.displayName;
            }
            if (species && species.name) {
                return species.name;
            }
            // Fallback for unknown species
            return 'Human';
        };

        // Define available underlings with their details
        const availableUnderlings = [
            {
                id: 'skirmisher',
                baseClass: 'Skirmisher',
                speciesKey: getRandomSpecies(),
                cost: 100,
                description: 'Ranged damage dealer with precise shots',
                icon: '🏹'
            },
            {
                id: 'warrior',
                baseClass: 'Warrior', 
                speciesKey: getRandomSpecies(),
                cost: 150,
                description: 'Melee tank with protective taunt ability',
                icon: '⚔️'
            },
            {
                id: 'priest',
                baseClass: 'Priest',
                speciesKey: getRandomSpecies(),
                cost: 175,
                description: 'Support specialist with healing magic',
                icon: '✨'
            },
            {
                id: 'mage',
                baseClass: 'Mage',
                speciesKey: getRandomSpecies(),
                cost: 200,
                description: 'Magic damage and arcane support',
                icon: '🔮'
            }
        ].map(underling => ({
            ...underling,
            name: `${getSpeciesDisplayName(underling.speciesKey)} ${underling.baseClass}`,
            speciesDisplayName: getSpeciesDisplayName(underling.speciesKey)
        }));
        
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
                            <button onclick="window.game.controller.recruitUnderling('${underling.id}', ${underling.cost}, '${underling.speciesKey}', '${underling.baseClass}')" 
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

    recruitUnderling(type, cost, speciesKey = 'human', baseClass = null) {
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
            skirmisher: { 
                name: "Skirmisher", 
                type: "ranged", 
                level: 1, 
                health: 75, 
                mana: 40, 
                stamina: 80,
                attack: 15, 
                defense: 5,
                // Skirmisher stats - focused on dexterity and intelligence 
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
                stamina: 100,
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
                stamina: 60,
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
            priest: { 
                name: "Priest", 
                type: "support", 
                level: 1, 
                health: 80, 
                mana: 60, 
                stamina: 70, 
                attack: 8, 
                defense: 6,
                // Priest stats - focused on willpower and intelligence
                strength: 3,
                dexterity: 5,
                constitution: 6,
                intelligence: 7,
                willpower: 9,
                size: 5
            }
        };

        const baseUnderling = underlings[type];
        if (!baseUnderling) {
            this.ui.log("Unknown underling type!");
            return;
        }

        // Get species information for display name
        const speciesDisplayName = this.characterManager.getSpeciesDisplayName(speciesKey);
        const finalClassName = baseClass || baseUnderling.name;

        const underling = { 
            ...baseUnderling, 
            id: Date.now(),
            name: `${speciesDisplayName} ${finalClassName}`,
            speciesKey: speciesKey,
            baseClass: finalClassName,
            maxHealth: baseUnderling.health,
            maxMana: baseUnderling.mana,
            maxStamina: baseUnderling.stamina,
            equipment: [],
            isAlive: true
        };

        // Apply species modifiers to the underling
        this.characterManager.applySpeciesModifiers(underling, speciesKey);

        this.gameState.hero.underlings.push(underling);
        
        // Apply stat bonuses to the new underling
        this.applyCharacterStatBonuses(underling);
        
        // Ensure newly recruited underlings start at full health/mana/stamina
        underling.health = underling.maxHealth;
        underling.mana = underling.maxMana;
        underling.stamina = underling.maxStamina;
        
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
                id: 'stamina_potion', 
                name: 'Stamina Potion', 
                cost: 30, 
                description: 'Restores 30 SP (Consumable)',
                type: 'consumable'
            },
            { 
                id: 'rations', 
                name: 'Rations', 
                cost: 25, 
                description: 'Provides 7 uses for resting in dungeons',
                type: 'supply'
            },
            { 
                id: 'anti_trap_tools', 
                name: 'Anti-Trap Tools', 
                cost: 150, 
                description: 'Professional kit for disarming traps (10 uses)',
                type: 'tool'
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
            case 'stamina_potion':
                this.gameState.hero.equipment.push({
                    name: "Stamina Potion",
                    type: "consumable",
                    effect: "stamina",
                    value: 30
                });
                this.ui.log("Bought Stamina Potion!");
                break;
            case 'rations':
                // Add or increase rations count
                if (!this.gameState.hero.rations) {
                    this.gameState.hero.rations = 0;
                }
                this.gameState.hero.rations += 7;
                this.ui.log("Bought Rations! You now have " + this.gameState.hero.rations + " rations.");
                break;
            case 'anti_trap_tools':
                // Add anti-trap tools to inventory
                if (this.inventoryManager) {
                    this.inventoryManager.addItem({
                        name: "Anti-Trap Tools",
                        type: "tool",
                        uses: 10,
                        description: "Professional kit for disarming traps"
                    }, 1);
                } else {
                    // Fallback to equipment if no inventory manager
                    this.gameState.hero.equipment.push({
                        name: "Anti-Trap Tools",
                        type: "tool",
                        uses: 10,
                        description: "Professional kit for disarming traps"
                    });
                }
                this.ui.log("Bought Anti-Trap Tools! Perfect for dungeon exploration.");
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
            case 'stamina':
                const staminaAmount = Math.min(item.value, this.gameState.hero.maxStamina - this.gameState.hero.stamina);
                this.gameState.hero.stamina = Math.min((this.gameState.hero.stamina || 0) + item.value, this.gameState.hero.maxStamina);
                this.ui.log(`Used ${item.name}! Restored ${staminaAmount} stamina.`);
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
        const requiredXP = Math.floor(100 * Math.pow(1.5, this.gameState.hero.level - 1));
        if (this.gameState.hero.fame >= requiredXP) {
            this.gameState.hero.level++;
            this.gameState.hero.fame -= requiredXP;
            this.ui.log(`Level up! You are now level ${this.gameState.hero.level}!`);
            this.ui.showNotification(`Level up! Now level ${this.gameState.hero.level}!`, "success");
        }
    }

    /**
     * Status Effect System
     */
    getStatusEffectInfo() {
        return {
            // Buffs (positive effects)
            'attack_buff': { 
                icon: '⚔️', 
                color: '#51cf66', 
                name: 'Attack Boost',
                description: 'Increased attack power'
            },
            'defense_buff': { 
                icon: '🛡️', 
                color: '#51cf66', 
                name: 'Defense Boost',
                description: 'Increased defense'
            },
            
            // Debuffs (negative effects)
            'attack_debuff': { 
                icon: '🗡️', 
                color: '#ff6b6b', 
                name: 'Weakened',
                description: 'Reduced attack power'
            },
            'defense_debuff': { 
                icon: '💔', 
                color: '#ff6b6b', 
                name: 'Vulnerable',
                description: 'Reduced defense'
            },
            
            // Crowd Control
            'stunned': { 
                icon: '💫', 
                color: '#ffd93d', 
                name: 'Stunned',
                description: 'Cannot act for this turn'
            },
            'paralyzed': { 
                icon: '⚡', 
                color: '#ffd93d', 
                name: 'Paralyzed',
                description: 'Cannot move or act'
            },
            
            // Damage Over Time
            'poison': { 
                icon: '☠️', 
                color: '#9f7aea', 
                name: 'Poisoned',
                description: 'Takes poison damage each turn'
            },
            'bleeding': { 
                icon: '🩸', 
                color: '#e53e3e', 
                name: 'Bleeding',
                description: 'Loses health each turn'
            },
            'burn': { 
                icon: '🔥', 
                color: '#fd79a8', 
                name: 'Burning',
                description: 'Takes fire damage each turn'
            },
            
            // Special Effects  
            'regeneration': { 
                icon: '💚', 
                color: '#51cf66', 
                name: 'Regenerating',
                description: 'Heals each turn'
            }
        };
    }

    renderStatusEffects(character) {
        if (!character.statusEffects || Object.keys(character.statusEffects).length === 0) {
            return '';
        }
        
        const statusInfo = this.getStatusEffectInfo();
        let statusHtml = '<div class="status-effects" style="display: inline-block; margin-left: 5px;">';
        
        for (const [effectType, effectData] of Object.entries(character.statusEffects)) {
            const info = statusInfo[effectType];
            if (info && effectData.duration > 0) {
                statusHtml += `
                    <span class="status-icon" 
                          style="color: ${info.color}; font-size: 12px; margin: 0 1px; cursor: help;" 
                          title="${info.name}: ${info.description}&#10;Turns remaining: ${effectData.duration}&#10;Value: ${effectData.value || 'N/A'}">
                        ${info.icon}
                    </span>
                `;
            }
        }
        
        statusHtml += '</div>';
        return statusHtml;
    }

    updateStatusEffects(character) {
        if (!character.statusEffects) {
            character.statusEffects = {};
            return;
        }
        
        // Process each status effect
        for (const [effectType, effectData] of Object.entries(character.statusEffects)) {
            // Apply effect if it's an ongoing effect
            if (effectType === 'poison' || effectType === 'bleeding' || effectType === 'burn') {
                const damage = effectData.value || 3;
                character.health = Math.max(0, character.health - damage);
                this.ui.log(`${character.name} takes ${damage} ${effectType} damage! ${this.getStatusEffectInfo()[effectType].icon}`);
            } else if (effectType === 'regeneration') {
                const healing = effectData.value || 5;
                const actualHealing = Math.min(healing, character.maxHealth - character.health);
                character.health = Math.min(character.maxHealth, character.health + healing);
                if (actualHealing > 0) {
                    this.ui.log(`${character.name} regenerates ${actualHealing} health! 💚`);
                }
            }
            
            // Decrease duration
            effectData.duration--;
            
            // Remove expired effects
            if (effectData.duration <= 0) {
                delete character.statusEffects[effectType];
                const statusInfo = this.getStatusEffectInfo()[effectType];
                if (statusInfo) {
                    this.ui.log(`${character.name} recovers from ${statusInfo.name} ${statusInfo.icon}`);
                }
            }
        }
    }

    processAllStatusEffects() {
        // Process hero status effects and racial abilities
        this.updateStatusEffects(this.gameState.hero);
        this.processRacialAbilities(this.gameState.hero);
        
        // Process underling status effects and racial abilities
        if (this.gameState.hero.underlings) {
            this.gameState.hero.underlings.forEach(underling => {
                if (underling.isAlive) {
                    this.updateStatusEffects(underling);
                    this.processRacialAbilities(underling);
                }
            });
        }
        
        // Process enemy status effects
        if (this.gameState.currentEnemies) {
            this.gameState.currentEnemies.forEach(enemy => {
                this.updateStatusEffects(enemy);
            });
        }
    }
    
    // Process passive racial abilities each combat round
    processRacialAbilities(character) {
        if (!character.species || !character.subspecies) return;
        
        const subspeciesDef = this.characterManager.getSubspeciesDefinition(character.species, character.subspecies);
        
        // Handle troll regeneration
        if (subspeciesDef.name === 'Troll' && subspeciesDef.racialAbility && 
            subspeciesDef.racialAbility.effect === 'regeneration') {
            this.characterManager.executeRegeneration(character, character.level || 1);
        }
    }
    
    // Add method to handle character "death" and check for orc ferocity
    handleCharacterDeath(character) {
        if (character.health <= 0) {
            // Check for orc ferocity
            if (character.species === 'orc' && !character.ferocityUsed) {
                const racialAbilities = this.characterManager.getCharacterRacialAbilities(character);
                const ferocityAbility = racialAbilities.find(a => a.effect === 'ferocity_revival');
                
                if (ferocityAbility) {
                    const success = this.characterManager.executeFerocity(character, character.level || 1);
                    if (success) {
                        return true; // Character survived due to ferocity
                    }
                }
            }
            
            // Handle normal death
            character.isAlive = false;
            return false;
        }
        return true; // Character is still alive
    }

    // Clear all status effects from a character or all party members
    clearAllStatusEffects(character = null) {
        if (character) {
            // Clear status effects from specific character
            if (character.statusEffects) {
                character.statusEffects = {};
            }
        } else {
            // Clear status effects from entire party
            if (this.gameState.hero.statusEffects) {
                this.gameState.hero.statusEffects = {};
            }
            
            if (this.gameState.hero.underlings) {
                this.gameState.hero.underlings.forEach(underling => {
                    if (underling.statusEffects) {
                        underling.statusEffects = {};
                    }
                });
            }
        }
    }

    getHeroAbilities() {
        // Define hero abilities that scale with level and stats
        const abilities = {
            'hero_heal': new Ability({
                id: 'hero_heal',
                name: 'Healing Light',
                description: 'Restore health to yourself or an ally',
                icon: '💚',
                type: 'spell',
                targeting: { type: 'single', validTargets: 'allies_and_self', count: 1 },
                costs: { mana: 8 },
                usageRestrictions: { level: 3 },
                effects: [{
                    type: 'heal',
                    baseValue: 20,
                    scaling: { willpower: 2, intelligence: 1 },
                    variance: 5
                }]
            }),
            
            'hero_fireball': new Ability({
                id: 'hero_fireball',
                name: 'Fireball',
                description: 'Launch a ball of fire at enemies, chance to cause burning',
                icon: '🔥',
                type: 'spell',
                targeting: { type: 'multiple', validTargets: 'enemies', count: 3, range: 'ranged' },
                costs: { mana: 12 },
                usageRestrictions: { level: 5 },
                hasSpecialCode: true,
                specialHandler: (caster, targets, gameState, gameController) => {
                    console.log('[Fireball Debug] Starting Fireball cast');
                    console.log('[Fireball Debug] Caster:', caster);
                    console.log('[Fireball Debug] Caster intelligence:', caster.intelligence, typeof caster.intelligence);
                    console.log('[Fireball Debug] Targets:', targets);
                    console.log('[Fireball Debug] Target count:', targets.length);
                    
                    const results = [];
                    
                    targets.forEach((target, index) => {
                        console.log(`[Fireball Debug] Processing target ${index + 1}:`, target.name);
                        console.log(`[Fireball Debug] Target defense:`, target.defense, typeof target.defense);
                        
                        // Calculate damage - ensure intelligence is valid
                        const intelligence = (typeof caster.intelligence === 'number' && !isNaN(caster.intelligence)) ? caster.intelligence : 5;
                        const defense = (typeof target.defense === 'number' && !isNaN(target.defense)) ? target.defense : 0;
                        
                        console.log(`[Fireball Debug] Using intelligence:`, intelligence);
                        console.log(`[Fireball Debug] Using defense:`, defense);
                        
                        const baseDamage = 18 + (intelligence * 2.5) + (Math.random() * 8 - 4);
                        console.log(`[Fireball Debug] Base damage:`, baseDamage);
                        
                        const finalDamage = Math.max(1, Math.floor(baseDamage) - defense);
                        console.log(`[Fireball Debug] Final damage before validation:`, finalDamage);
                        
                        // Ensure final damage is a valid number
                        const validFinalDamage = (typeof finalDamage === 'number' && !isNaN(finalDamage)) ? finalDamage : 1;
                        console.log(`[Fireball Debug] Valid final damage:`, validFinalDamage);
                        
                        target.health = Math.max(0, target.health - validFinalDamage);
                        
                        let message = `${target.name} takes ${validFinalDamage} fire damage`;
                        console.log(`[Fireball Debug] Message:`, message);
                        
                        // 50% chance to apply burning DOT (increased from 25%)
                        if (Math.random() < 0.50) {
                            gameController.applyStatusEffect(target, 'burn', 4, 3); // 4 damage per turn for 3 turns
                            message += ' and catches fire! 🔥';
                        }
                        
                        results.push({ message: message });
                    });
                    
                    console.log('[Fireball Debug] Final results:', results);
                    
                    return {
                        success: true,
                        message: `${caster.name} casts Fireball!`,
                        results: results
                    };
                }
            }),
            
            'hero_lightning': new Ability({
                id: 'hero_lightning',
                name: 'Lightning Bolt',
                description: 'Chain lightning with a chance to arc between all enemies',
                icon: '⚡',
                type: 'spell',
                targeting: { type: 'multiple', validTargets: 'enemies', count: 2, range: 'ranged' },
                costs: { mana: 10 },
                usageRestrictions: { level: 4 },
                hasSpecialCode: true,
                specialHandler: (caster, targets, gameState, gameController) => {
                    const results = [];
                    const hitTargets = new Set();
                    const allEnemies = gameState.currentEnemies.filter(e => e.health > 0);
                    
                    // Initial targets
                    let currentTargets = [...targets];
                    let arcLevel = 0;
                    const maxArcs = 5; // Prevent infinite loops
                    
                    while (currentTargets.length > 0 && arcLevel < maxArcs) {
                        const newTargets = [];
                        
                        currentTargets.forEach(target => {
                            if (target.health <= 0) return; // Skip dead targets
                            
                            // Calculate damage (reduced by 10% per arc level) - ensure intelligence is valid
                            const intelligence = (typeof caster.intelligence === 'number' && !isNaN(caster.intelligence)) ? caster.intelligence : 5;
                            const defense = (typeof target.defense === 'number' && !isNaN(target.defense)) ? target.defense : 0;
                            
                            // Reduced base damage by 25% (from 15 to 11.25, rounded to 11)
                            const baseDamage = (11 + (intelligence * 2) + (Math.random() * 6 - 3)) * Math.pow(0.9, arcLevel);
                            const finalDamage = Math.max(1, Math.floor(baseDamage) - defense);
                            
                            // Ensure final damage is a valid number
                            const validFinalDamage = (typeof finalDamage === 'number' && !isNaN(finalDamage)) ? finalDamage : 1;
                            
                            target.health = Math.max(0, target.health - validFinalDamage);
                            
                            const arcText = arcLevel > 0 ? ` (Arc ${arcLevel})` : '';
                            results.push({ message: `${target.name} takes ${validFinalDamage} lightning damage${arcText} ⚡` });
                            hitTargets.add(target);
                            
                            // 33% chance to arc to other enemies (reduced from 40%)
                            if (Math.random() < 0.33) {
                                const unhitEnemies = allEnemies.filter(e => !hitTargets.has(e) && e.health > 0);
                                if (unhitEnemies.length > 0) {
                                    newTargets.push(...unhitEnemies);
                                    results.push({ message: `Lightning arcs to other enemies!` });
                                }
                            }
                        });
                        
                        currentTargets = newTargets;
                        arcLevel++;
                    }
                    
                    return {
                        success: true,
                        message: `${caster.name} casts Lightning Bolt!`,
                        results: results
                    };
                }
            }),
            
            'hero_shield': new Ability({
                id: 'hero_shield',
                name: 'Protective Shield',
                description: 'Grant magical protection to an ally or yourself',
                icon: '🛡️',
                type: 'spell',
                targeting: { type: 'single', validTargets: 'allies_and_self', count: 1 },
                costs: { mana: 6 },
                usageRestrictions: { level: 2 },
                effects: [{
                    type: 'buff_defense',
                    baseValue: 5,
                    duration: 4
                }]
            }),
            
            'hero_group_heal': new Ability({
                id: 'hero_group_heal',
                name: 'Healing Circle',
                description: 'Heal all party members',
                icon: '💞',
                type: 'spell',
                targeting: { type: 'all', validTargets: 'allies', count: 'all' },
                costs: { mana: 20 },
                usageRestrictions: { level: 6 },
                effects: [{
                    type: 'heal',
                    baseValue: 12,
                    scaling: { willpower: 1.5, intelligence: 0.8 },
                    variance: 3
                }]
            }),
            
            'hero_power_strike': new Ability({
                id: 'hero_power_strike',
                name: 'Power Strike',
                description: 'A devastating melee attack',
                icon: '💥',
                type: 'skill',
                targeting: { type: 'single', validTargets: 'enemies', count: 1, range: 'melee' },
                costs: { stamina: 8 },
                effects: [{
                    type: 'damage',
                    baseValue: 20,
                    scaling: { strength: 2 },
                    variance: 5
                }]
            }),
            
            'hero_ice_shard': new Ability({
                id: 'hero_ice_shard',
                name: 'Ice Shard',
                description: 'Launch sharp ice that may slow enemies',
                icon: '❄️',
                type: 'spell',
                targeting: { type: 'single', validTargets: 'enemies', count: 1, range: 'ranged' },
                costs: { mana: 8 },
                usageRestrictions: { level: 1 },
                effects: [
                    {
                        type: 'damage',
                        baseValue: 12,
                        scaling: { intelligence: 1.8 }
                    },
                    {
                        type: 'debuff_attack',
                        baseValue: 3,
                        duration: 2
                    }
                ]
            }),
            
            'hero_rage': new Ability({
                id: 'hero_rage',
                name: 'Berserker Rage',
                description: 'Increase your attack power temporarily',
                icon: '😡',
                type: 'skill',
                targeting: { type: 'self', validTargets: 'self', count: 1 },
                costs: { stamina: 12 },
                effects: [{
                    type: 'buff_attack',
                    baseValue: 8,
                    duration: 4
                }]
            })
        };
        
        return abilities;
    }

    showHeroAbilitySelection() {
        console.log('[Debug] Magic button clicked - checking combat state:', this.gameState.inCombat);
        
        if (!this.gameState.inCombat) {
            this.ui.showNotification("Can only use powers in combat!", "error");
            return;
        }

        console.log('[Debug] Character manager available:', !!this.characterManager);
        if (!this.characterManager) {
            this.ui.showNotification("Character system not ready!", "error");
            return;
        }

        console.log('[Debug] Hero species:', this.gameState.hero.species, this.gameState.hero.speciesKey);
        
        const heroAbilities = this.getHeroAbilities();
        console.log('[Debug] Hero abilities found:', Object.keys(heroAbilities));
        
        const availableAbilities = Object.values(heroAbilities).filter(ability => {
            // The canUse method already checks level requirements in usageRestrictions.level
            const canUseResult = ability.canUse(this.gameState.hero, this.gameState);
            return canUseResult.canUse;
        });
        console.log('[Debug] Available regular abilities:', availableAbilities.length);
        
        // Get racial abilities
        const racialAbilities = this.characterManager.getCharacterRacialAbilities(this.gameState.hero);
        console.log('[Debug] Racial abilities found:', racialAbilities.map(a => a.name));
        
        const availableRacialAbilities = racialAbilities.filter(ability => 
            this.characterManager.isRacialAbilityAvailable(this.gameState.hero, ability.name)
        );
        console.log('[Debug] Available racial abilities:', availableRacialAbilities.map(a => a.name));
        
        // Get all abilities for display (including locked ones)
        const allAbilities = Object.values(heroAbilities);

        if (availableAbilities.length === 0 && availableRacialAbilities.length === 0) {
            console.log('[Debug] No abilities available - showing error notification');
            this.ui.showNotification("No usable powers available!", "error");
            return;
        }

        const abilityContent = `
            <div style="background: rgba(20, 20, 40, 0.9); padding: 20px; border-radius: 12px; border: 2px solid #9966cc;">
                <h3 style="color: #d4af37; margin-bottom: 15px; text-align: center;">⚡ Hero Powers ⚡</h3>
                
                <div style="margin-bottom: 15px;">
                    <label style="color: #4ecdc4; font-weight: bold; margin-bottom: 8px; display: block;">Choose Power:</label>
                    <select id="abilitySelect" style="width: 100%; padding: 8px; background: #2a2a4a; color: white; border: 1px solid #666; border-radius: 6px; font-size: 14px;">
                        <option value="">-- Select a Power --</option>
                        ${availableAbilities.length > 0 ? '<optgroup label="🔮 Magic Powers">' : ''}
                        ${availableAbilities.map(ability => 
                            `<option value="${ability.id}">${ability.icon} ${ability.name} (${ability.costs.mana || 0} MP, ${ability.costs.stamina || 0} SP)</option>`
                        ).join('')}
                        ${availableAbilities.length > 0 ? '</optgroup>' : ''}
                        ${availableRacialAbilities.length > 0 ? '<optgroup label="🧬 Racial Powers">' : ''}
                        ${availableRacialAbilities.map(ability => 
                            `<option value="racial_${ability.name}">🧬 ${ability.name} (Racial)</option>`
                        ).join('')}
                        ${availableRacialAbilities.length > 0 ? '</optgroup>' : ''}
                    </select>
                </div>
                
                <div style="margin-bottom: 15px;">
                    <h4 style="color: #d4af37; margin-bottom: 10px;">📚 All Powers (Level Requirements)</h4>
                    <div style="background: rgba(42, 42, 58, 0.6); padding: 10px; border-radius: 6px; max-height: 200px; overflow-y: auto;">
                        ${allAbilities.map(ability => {
                            const isLocked = ability.usageRestrictions && ability.usageRestrictions.level && this.gameState.hero.level < ability.usageRestrictions.level;
                            const canUse = !isLocked && ability.canUse(this.gameState.hero, this.gameState).canUse;
                            return `
                                <div style="display: flex; justify-content: space-between; align-items: center; padding: 4px 0; color: ${isLocked ? '#888' : (canUse ? '#4ecdc4' : '#ccc')};">
                                    <span>${ability.icon} ${ability.name}</span>
                                    <span style="font-size: 12px;">
                                        ${isLocked ? `🔒 Level ${ability.usageRestrictions.level}` : (canUse ? '✅ Available' : '❌ Insufficient Resources')}
                                    </span>
                                </div>
                            `;
                        }).join('')}
                        ${racialAbilities.length > 0 ? '<hr style="border: 1px solid #666; margin: 10px 0;">' : ''}
                        ${racialAbilities.map(ability => {
                            const isAvailable = this.characterManager.isRacialAbilityAvailable(this.gameState.hero, ability.name);
                            return `
                                <div style="display: flex; justify-content: space-between; align-items: center; padding: 4px 0; color: ${isAvailable ? '#4ecdc4' : '#888'};">
                                    <span>🧬 ${ability.name} (Racial)</span>
                                    <span style="font-size: 12px;">
                                        ${isAvailable ? '✅ Available' : '❌ On Cooldown'}
                                    </span>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
                
                <div id="abilityDescription" style="margin-bottom: 15px; padding: 10px; background: rgba(42, 42, 58, 0.6); border-radius: 6px; min-height: 40px; color: #ccc; font-style: italic;">
                    Select a power to see its description...
                </div>
                
                <div id="targetSelection" style="display: none; margin-bottom: 15px;">
                    <label style="color: #4ecdc4; font-weight: bold; margin-bottom: 8px; display: block;">Choose Target:</label>
                    <select id="targetSelect" style="width: 100%; padding: 8px; background: #2a2a4a; color: white; border: 1px solid #666; border-radius: 6px; font-size: 14px;">
                        <option value="">-- Select Target --</option>
                    </select>
                </div>
            </div>
        `;

        console.log('[Debug] Creating ability selection modal...');
        
        // Create a modal with cast/cancel buttons
        const modalButtons = [
            {
                text: "⚡ Cast Power",
                onClick: () => this.castHeroAbility()
            },
            {
                text: "Cancel",
                onClick: () => {
                    // Modal will be closed automatically by the UI system
                }
            }
        ];
        
        try {
            this.ui.createModal("Hero Powers", abilityContent, modalButtons);
            console.log('[Debug] Modal created successfully');
        } catch (error) {
            console.error('[Debug] Error creating modal:', error);
            this.ui.showNotification("Error opening ability selection!", "error");
            return;
        }

        // Add event listener for ability selection
        setTimeout(() => {
            const abilitySelect = document.getElementById('abilitySelect');
            const descriptionDiv = document.getElementById('abilityDescription');
            const targetDiv = document.getElementById('targetSelection');
            const targetSelect = document.getElementById('targetSelect');

            if (abilitySelect && descriptionDiv) {
                abilitySelect.addEventListener('change', () => {
                    const selectedValue = abilitySelect.value;
                    if (!selectedValue) {
                        descriptionDiv.innerHTML = 'Select a power to see its description...';
                        targetDiv.style.display = 'none';
                        return;
                    }

                    let selectedAbility = null;
                    let isRacial = false;
                    
                    if (selectedValue.startsWith('racial_')) {
                        const racialName = selectedValue.replace('racial_', '');
                        selectedAbility = racialAbilities.find(a => a.name === racialName);
                        isRacial = true;
                    } else {
                        selectedAbility = heroAbilities[selectedValue];
                    }

                    if (selectedAbility) {
                        if (isRacial) {
                            descriptionDiv.innerHTML = `<strong style="color: #d4af37;">🧬 ${selectedAbility.name}</strong><br>${selectedAbility.description}`;
                            targetDiv.style.display = 'none'; // Most racial abilities are self-target or automatic
                        } else {
                            descriptionDiv.innerHTML = `<strong style="color: #d4af37;">${selectedAbility.icon} ${selectedAbility.name}</strong><br>${selectedAbility.description}`;
                            
                            // Show target selection for abilities that need targets
                            if (selectedAbility.targeting && 
                                (selectedAbility.targeting.type === 'single' || 
                                 selectedAbility.targeting.type === 'multiple') &&
                                selectedAbility.targeting.validTargets !== 'self') {
                                targetDiv.style.display = 'block';
                                this.updateTargetSelection(selectedAbility, targetDiv, targetSelect);
                            } else {
                                targetDiv.style.display = 'none';
                            }
                        }
                    }
                });
            }
        }, 100);
    }

    updateTargetSelection(ability, targetSelection, targetSelect) {
        const allCharacters = this.getAllCombatCharacters();
        const validTargets = ability.getValidTargets(this.gameState.hero, allCharacters, this.gameState);
        
        targetSelect.innerHTML = '<option value="">-- Select Target --</option>';
        
        if (ability.targeting.type === 'self') {
            targetSelect.innerHTML += `<option value="hero">${this.gameState.hero.name || 'Hero'} (You)</option>`;
        } else if (ability.targeting.type === 'all') {
            targetSelect.innerHTML += `<option value="all">All ${ability.targeting.validTargets}</option>`;
        } else {
            validTargets.forEach((target, index) => {
                let targetId, targetName;
                
                if (target === this.gameState.hero) {
                    targetId = 'hero';
                    targetName = target.name || 'Hero';
                } else if (target.id) {
                    targetId = target.id.toString();
                    targetName = target.name || 'Unknown';
                } else {
                    // For enemies and underlings without IDs, use their index in the array
                    targetId = `${target.name || 'unknown'}_${index}`;
                    targetName = target.name || 'Unknown';
                }
                
                const healthInfo = target.health ? `(${target.health}/${target.maxHealth} HP)` : '';
                targetSelect.innerHTML += `<option value="${targetId}">${targetName} ${healthInfo}</option>`;
            });
        }
        
        targetSelection.style.display = validTargets.length > 0 ? 'block' : 'none';
    }

    getAllCombatCharacters() {
        const characters = [this.gameState.hero];
        
        // Set factions for proper targeting
        this.gameState.hero.faction = 'player';
        
        // Add alive underlings
        if (this.gameState.hero.underlings) {
            const aliveUnderlings = this.gameState.hero.underlings.filter(u => u.isAlive);
            aliveUnderlings.forEach(u => u.faction = 'player');
            characters.push(...aliveUnderlings);
        }
        
        // Add enemies
        if (this.gameState.currentEnemies) {
            this.gameState.currentEnemies.forEach(e => e.faction = 'enemy');
            characters.push(...this.gameState.currentEnemies);
        }
        
        return characters;
    }

    castHeroAbility() {
        const abilitySelect = document.getElementById('abilitySelect');
        const targetSelect = document.getElementById('targetSelect');
        
        if (!abilitySelect || !abilitySelect.value) {
            this.ui.showNotification("Please select an ability!", "error");
            return;
        }
        
        const selectedAbilityId = abilitySelect.value;
        
        // Check if this is a racial ability
        if (selectedAbilityId.startsWith('racial_')) {
            const racialAbilityName = selectedAbilityId.replace('racial_', '');
            
            // Use racial ability
            const success = this.characterManager.useRacialAbility(this.gameState.hero, racialAbilityName);
            
            if (success) {
                this.ui.showNotification("Racial ability used successfully!", "success");
                
                // Close the docked modal
                const modal = document.querySelector('.docked-modal');
                if (modal) {
                    modal.remove();
                }
                
                // Update combat interface
                this.updateCombatChatDisplay();
                
                // Check for defeated enemies after racial ability
                this.checkAndProcessDefeatedEnemies();
                
                // Check if all enemies are defeated
                if (this.gameState.currentEnemies.length === 0) {
                    this.ui.log("All enemies defeated! You can continue deeper or exit the dungeon.");
                    this.checkLevelUp();
                    this.ui.render();
                    this.showVictoryConfirmation();
                    return;
                }
                
                // Continue combat
                this.enemiesAttack();
                setTimeout(() => this.showCombatInterface(), 1000);
            } else {
                this.ui.showNotification("Failed to use racial ability!", "error");
            }
            return;
        }
        
        // Handle regular hero abilities
        const heroAbilities = this.getHeroAbilities();
        const ability = heroAbilities[selectedAbilityId];
        
        if (!ability) {
            this.ui.showNotification("Invalid ability selected!", "error");
            return;
        }
        
        // Use canUse method to check all restrictions including level
        const canUseResult = ability.canUse(this.gameState.hero, this.gameState);
        if (!canUseResult.canUse) {
            this.ui.showNotification(canUseResult.reason, "error");
            return;
        }
        
        // Determine targets
        let targets = [];
        const allCharacters = this.getAllCombatCharacters();
        
        if (ability.targeting.type === 'self') {
            targets = [this.gameState.hero];
        } else if (ability.targeting.type === 'all' || ability.targeting.type === 'multiple') {
            targets = ability.getValidTargets(this.gameState.hero, allCharacters, this.gameState);
            
            // For multiple targeting, limit to the specified count
            if (ability.targeting.type === 'multiple' && typeof ability.targeting.count === 'number') {
                targets = targets.slice(0, ability.targeting.count);
            }
        } else {
            // Single target abilities need target selection
            const selectedTargetId = targetSelect ? targetSelect.value : '';
            if (!selectedTargetId) {
                this.ui.showNotification("Please select a target!", "error");
                return;
            }
            
            let target = null;
            
            if (selectedTargetId === 'hero') {
                target = this.gameState.hero;
            } else {
                // Try to find by ID first
                target = allCharacters.find(char => 
                    char.id && char.id.toString() === selectedTargetId
                );
                
                // If not found by ID, try by name_index pattern or name
                if (!target) {
                    if (selectedTargetId.includes('_')) {
                        const [targetName, targetIndex] = selectedTargetId.split('_');
                        const charactersWithName = allCharacters.filter(char => char.name === targetName);
                        target = charactersWithName[parseInt(targetIndex)] || charactersWithName[0];
                    } else {
                        target = allCharacters.find(char => char.name === selectedTargetId);
                    }
                }
            }
            
            if (!target) {
                this.ui.showNotification("Invalid target selected!", "error");
                return;
            }
            
            // Special check for healing abilities - don't heal if already at full health
            if (ability.effects && ability.effects.some(effect => effect.type === 'heal')) {
                if (target.health >= target.maxHealth) {
                    this.ui.showNotification(`${target.name || 'Target'} is already at full health!`, "error");
                    return;
                }
            }
            
            targets = [target];
        }
        
        // Use the ability
        const result = ability.use(this.gameState.hero, targets, this.gameState, this);
        
        if (result.success) {
            this.ui.log(result.message);
            if (result.results) {
                result.results.forEach(r => {
                    if (r.message) {
                        this.ui.log(`  ${r.message}`);
                    }
                });
            }
            this.ui.showNotification("Ability cast successfully!", "success");
            
            // Check for defeated enemies after spell casting and process XP/gold/loot
            this.checkAndProcessDefeatedEnemies();
            
            // Close the docked modal
            const modal = document.querySelector('.docked-modal');
            if (modal) {
                modal.remove();
            }
            
            // Update UI first
            this.ui.render();
            
            // Check if all enemies are defeated before continuing
            if (this.gameState.currentEnemies.length === 0) {
                this.ui.log("All enemies defeated! You can continue deeper or exit the dungeon.");
                this.checkLevelUp();
                this.ui.render();
                this.showVictoryConfirmation();
                return;
            }
            
            // Hero's turn is over after casting, process underling turns then enemy turns
            setTimeout(() => {
                // Process underling turns first (similar to playerAttack)
                this.processUnderlingTurns();
                
                // Then enemy turns
                setTimeout(() => {
                    this.enemiesAttack();
                    
                    // Update combat interface after enemy attacks
                    setTimeout(() => {
                        this.showCombatInterface();
                        this.updateCombatChatDisplay();
                    }, 1000);
                }, 500);
            }, 500);
            
        } else {
            this.ui.log(result.message || "Failed to cast ability!");
            this.ui.showNotification(result.message || "Failed to cast ability!", "error");
            
            // Update UI but don't end turn on failed cast
            this.ui.render();
        }
    }

    processEnemyTurns() {
        // This function should handle enemy turns after hero abilities
        // For now, we'll just delay a bit and continue with normal combat flow
        setTimeout(() => {
            this.showCombatInterface();
        }, 500);
    }

    // Enhanced underling ability usage
    tryUnderlingAbility(underling) {
        if (!underling || !underling.isAlive || !underling.type) {
            return false;
        }

        // First check if we should skip ability usage (only when single enemy with low health)
        const enemyCount = this.gameState.currentEnemies ? this.gameState.currentEnemies.length : 0;
        if (enemyCount === 1) {
            const singleEnemy = this.gameState.currentEnemies[0];
            const enemyHealthPercent = singleEnemy.health / singleEnemy.maxHealth;
            if (enemyHealthPercent < 0.33) {
                // Skip ability usage when single enemy has <33% health
                return false;
            }
        }

        // Try racial abilities first (50% chance - increased for testing)
        if (Math.random() < 0.5) {
            const racialAbilities = this.characterManager.getCharacterRacialAbilities(underling);
            const availableRacialAbilities = racialAbilities.filter(ability => 
                this.characterManager.isRacialAbilityAvailable(underling, ability.name)
            );
            
            console.log(`[AI] ${underling.name} checking racial abilities:`, availableRacialAbilities.map(a => a.name));
            
            if (availableRacialAbilities.length > 0) {
                const selectedRacial = availableRacialAbilities[Math.floor(Math.random() * availableRacialAbilities.length)];
                
                console.log(`[AI] ${underling.name} considering racial ability: ${selectedRacial.name}`);
                
                // Check if racial ability should be used based on conditions
                const shouldUse = this.shouldUseRacialAbility(underling, selectedRacial);
                console.log(`[AI] Should use ${selectedRacial.name}:`, shouldUse);
                
                if (shouldUse) {
                    const success = this.characterManager.useRacialAbility(underling, selectedRacial.name);
                    if (success) {
                        this.ui.log(`🧬 ${underling.name} uses racial ability: ${selectedRacial.name}!`);
                        return true;
                    }
                }
            }
        }

        // Map underling types to ability classes
        const typeMapping = {
            'ranged': 'skirmisher',
            'tank': 'warrior', 
            'magic': 'mage',
            'support': 'priest'
        };
        
        const abilityClass = typeMapping[underling.type];
        if (!abilityClass) {
            return false;
        }

        const abilities = UnderlingAbilities.getAbilitiesForClass(abilityClass, underling.level);
        if (!abilities || abilities.length === 0) {
            return false;
        }

        // Find a usable ability
        const usableAbilities = abilities.filter(ability => {
            const canUseResult = ability.canUse(underling, this.gameState);
            return canUseResult.canUse;
        });

        if (usableAbilities.length === 0) {
            return false;
        }

        // Pick a random usable ability
        const selectedAbility = usableAbilities[Math.floor(Math.random() * usableAbilities.length)];
        
        // Get valid targets
        const allCharacters = this.getAllCombatCharacters();
        const validTargets = selectedAbility.getValidTargets(underling, allCharacters, this.gameState);
        
        if (validTargets.length === 0) {
            return false;
        }

        // Select targets based on ability type
        let targets = [];
        if (selectedAbility.targeting.type === 'self') {
            targets = [underling];
        } else if (selectedAbility.targeting.type === 'all') {
            targets = validTargets;
        } else {
            // For single target abilities, pick intelligently
            if (selectedAbility.targeting.validTargets === 'enemies') {
                // Pick a random enemy, preferring those with higher health
                const sortedEnemies = validTargets.sort((a, b) => b.health - a.health);
                targets = [sortedEnemies[0]];
            } else if (selectedAbility.targeting.validTargets === 'allies') {
                // For healing/buff abilities, pick most wounded ally
                const woundedAllies = validTargets.filter(ally => ally.health < ally.maxHealth);
                
                // Special check for priest class - only heal if someone is at 60% health or less
                if (underling.type === 'support' && selectedAbility.effects && 
                    selectedAbility.effects.some(effect => effect.type === 'heal')) {
                    const criticallyWounded = woundedAllies.filter(ally => {
                        const healthPercent = ally.health / ally.maxHealth;
                        return healthPercent <= 0.6;
                    });
                    
                    if (criticallyWounded.length === 0) {
                        // No one needs healing urgently, skip this healing ability
                        return false;
                    }
                    
                    // Pick the most wounded from critically wounded allies
                    const mostWounded = criticallyWounded.reduce((worst, current) => {
                        const currentPercent = current.health / current.maxHealth;
                        const worstPercent = worst.health / worst.maxHealth;
                        return currentPercent < worstPercent ? current : worst;
                    });
                    targets = [mostWounded];
                } else if (woundedAllies.length > 0) {
                    const mostWounded = woundedAllies.reduce((worst, current) => {
                        const currentPercent = current.health / current.maxHealth;
                        const worstPercent = worst.health / worst.maxHealth;
                        return currentPercent < worstPercent ? current : worst;
                    });
                    targets = [mostWounded];
                } else {
                    targets = [validTargets[0]];
                }
            }
        }

        if (targets.length === 0) {
            return false;
        }

        // Use the ability
        const result = selectedAbility.use(underling, targets, this.gameState, this);
        
        if (result.success) {
            this.ui.log(`🔮 ${underling.name} uses ${selectedAbility.name}! ${selectedAbility.icon}`);
            if (result.results) {
                result.results.forEach(r => {
                    if (r.message) {
                        this.ui.log(`  ✨ ${r.message}`);
                    }
                });
            }
        } else {
            this.ui.log(`❌ ${underling.name} failed to use ${selectedAbility.name}: ${result.message || 'Unknown error'}`);
        }
        
        return true;
    }
    
    // Helper method to decide if underling should use racial ability
    shouldUseRacialAbility(character, ability) {
        console.log(`[AI] Evaluating racial ability ${ability.name} with effect: ${ability.effect}`);
        
        switch(ability.effect) {
            case 'stone_bulwark_defense':
                // Use if character has no defense buff or health is below 70%
                const hasDefenseBuff = character.statusEffects && character.statusEffects.stone_bulwark;
                const healthPercent = character.health / character.maxHealth;
                const shouldUse1 = !hasDefenseBuff && healthPercent < 0.8; // Increased threshold
                console.log(`[AI] Stone Bulwark check: hasDefenseBuff=${hasDefenseBuff}, healthPercent=${healthPercent}, shouldUse=${shouldUse1}`);
                return shouldUse1;
                
            case 'meditate_restore':
                // Use if mana or stamina is below 60%
                const manaPercent = character.mana / character.maxMana;
                const staminaPercent = character.stamina / character.maxStamina;
                const shouldUse2 = manaPercent < 0.6 || staminaPercent < 0.6; // Increased threshold
                console.log(`[AI] Meditate check: mana=${manaPercent}, stamina=${staminaPercent}, shouldUse=${shouldUse2}`);
                return shouldUse2;
                
            case 'clockwork_summon':
                // Use if there are multiple enemies and no summons active
                const enemyCount = this.gameState.currentEnemies ? this.gameState.currentEnemies.length : 0;
                const hasSummons = this.gameState.battleSummons && this.gameState.battleSummons.length > 0;
                const shouldUse3 = enemyCount >= 1 && !hasSummons; // Lowered threshold
                console.log(`[AI] Clockwork check: enemies=${enemyCount}, hasSummons=${hasSummons}, shouldUse=${shouldUse3}`);
                return shouldUse3;
                
            case 'rock_throw':
                // Use if stamina is above 40% and there's an enemy
                const hasStamina = character.stamina >= 20; // Lowered requirement
                const hasEnemies = this.gameState.currentEnemies && this.gameState.currentEnemies.length > 0;
                const shouldUse4 = hasStamina && hasEnemies;
                console.log(`[AI] Rock Throw check: stamina=${character.stamina}, hasEnemies=${hasEnemies}, shouldUse=${shouldUse4}`);
                return shouldUse4;
                
            case 'knockdown_multiple':
                // Use if there are 1+ enemies
                const shouldUse5 = (this.gameState.currentEnemies ? this.gameState.currentEnemies.length : 0) >= 1;
                console.log(`[AI] Brute check: shouldUse=${shouldUse5}`);
                return shouldUse5;
                
            case 'frost_breath_aoe':
                // Use if there are 1+ enemies
                const shouldUse6 = (this.gameState.currentEnemies ? this.gameState.currentEnemies.length : 0) >= 1;
                console.log(`[AI] Frost Breath check: shouldUse=${shouldUse6}`);
                return shouldUse6;
                
            case 'ferocity_revival':
            case 'regeneration':
                // These are passive/automatic, don't actively use
                console.log(`[AI] Passive ability ${ability.name}, skipping`);
                return false;
                
            default:
                console.log(`[AI] Unknown ability effect: ${ability.effect}, using 75% chance`);
                return Math.random() < 0.75; // Increased chance for unknown abilities
        }
    }

    // Monster ability usage system
    tryMonsterAbility(monster) {
        if (!monster || !monster.name) {
            return false;
        }

        // Define monster abilities by type
        const monsterAbilities = {
            'Spider': ['spider_poison', 'spider_web'],
            'Wolf': [], // Wolves don't have special abilities, just normal attacks
            'Orc': [],
            'Goblin': [],
            'Skeleton': []
        };

        const abilities = monsterAbilities[monster.name] || [];
        if (abilities.length === 0) {
            return false;
        }

        // 25% chance to use an ability instead of normal attack
        if (Math.random() > 0.25) {
            return false;
        }

        // Pick a random ability
        const abilityId = abilities[Math.floor(Math.random() * abilities.length)];
        const ability = MonsterAbilities.getAbility(abilityId);
        
        if (!ability) {
            return false;
        }

        // Get valid targets (hero + living underlings)
        const aliveUnderlings = this.gameState.hero.underlings.filter(u => u.isAlive);
        const allTargets = [this.gameState.hero, ...aliveUnderlings];
        const validTargets = ability.getValidTargets(monster, allTargets, this.gameState);
        
        if (validTargets.length === 0) {
            return false;
        }

        // Select target(s)
        let targets = [];
        if (ability.targeting.type === 'single') {
            targets = [validTargets[Math.floor(Math.random() * validTargets.length)]];
        } else if (ability.targeting.type === 'all') {
            targets = validTargets;
        }

        if (targets.length === 0) {
            return false;
        }

        // Use the ability
        const result = ability.use(monster, targets, this.gameState, this);
        
        if (result.success) {
            this.ui.log(`👹 ${monster.name} uses ${ability.name}! ${ability.icon}`);
            if (result.results) {
                result.results.forEach(r => {
                    if (r.message) {
                        this.ui.log(`  💀 ${r.message}`);
                    }
                });
            }
        } else {
            this.ui.log(`❌ ${monster.name} failed to use ${ability.name}: ${result.message || 'Unknown error'}`);
        }
        
        return result.success;
    }
}

// Export for use in main game file
window.GameController = GameController;
