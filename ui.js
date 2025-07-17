// UI Module - Handles all user interface elements and interactions
class UIManager {
    constructor(gameState, gameController) {
        this.gameState = gameState;
        this.gameController = gameController;
        this.elements = {};
        this.currentBackground = 'village';
        this.dungeonBackgrounds = [
            'dungeon1', 'dungeon2', 'dungeon3', 'dungeon4', 'dungeon5'
        ];
        this.isMobile = this.detectMobile();
        this.initializeElements();
        this.bindEvents();
        this.setBackground('village'); // Start with village background
    }

    detectMobile() {
        // Detect mobile devices using multiple methods
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
        const isSmallScreen = window.innerWidth <= 768 || window.innerHeight <= 600;
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        
        const isMobile = isMobileUA || (isSmallScreen && isTouchDevice);
        
        // Debug logging
        console.log('Mobile Detection:', {
            userAgent: userAgent,
            isMobileUA: isMobileUA,
            screenSize: `${window.innerWidth}x${window.innerHeight}`,
            isSmallScreen: isSmallScreen,
            isTouchDevice: isTouchDevice,
            finalResult: isMobile
        });
        
        return isMobile;
    }

    initializeElements() {
        // Cache DOM elements for better performance
        this.elements = {
            gameContainer: document.getElementById('game-container'),
            gui: document.getElementById('gui'),
            spritesArea: document.getElementById('sprites-area'),
            chatLog: document.getElementById('chat-log'),
            
            // Buttons
            newGameBtn: document.getElementById('new-game-btn'),
            saveBtn: document.getElementById('save-btn'),
            loadBtn: document.getElementById('load-btn'),
            dungeonBtn: document.getElementById('dungeon-btn'),
            craftingBtn: document.getElementById('crafting-btn'),
            recruitBtn: document.getElementById('recruit-btn'),
            shopBtn: document.getElementById('shop-btn'),
            templeBtn: document.getElementById('temple-btn'),
            inventoryBtn: document.getElementById('inventory-btn'),
            characterBtn: document.getElementById('character-btn')
        };
    }

    bindEvents() {
        // Bind all button events with visual feedback
        this.elements.newGameBtn.onclick = () => {
            this.flashButton(this.elements.newGameBtn);
            this.gameController.newGame();
        };
        this.elements.saveBtn.onclick = () => {
            this.flashButton(this.elements.saveBtn);
            this.gameController.saveGame();
        };
        this.elements.loadBtn.onclick = () => {
            this.flashButton(this.elements.loadBtn);
            this.gameController.loadGame();
        };
        this.elements.dungeonBtn.onclick = () => {
            this.flashButton(this.elements.dungeonBtn);
            this.gameController.enterDungeon();
        };
        this.elements.craftingBtn.onclick = () => {
            this.flashButton(this.elements.craftingBtn);
            this.gameController.openCrafting();
        };
        this.elements.recruitBtn.onclick = () => {
            this.flashButton(this.elements.recruitBtn);
            this.gameController.openRecruitment();
        };
        this.elements.shopBtn.onclick = () => {
            this.flashButton(this.elements.shopBtn);
            this.gameController.openShop();
        };
        this.elements.templeBtn.onclick = () => {
            this.flashButton(this.elements.templeBtn);
            this.gameController.openTemple();
        };
        this.elements.inventoryBtn.onclick = () => {
            this.flashButton(this.elements.inventoryBtn);
            this.gameController.openInventory();
        };
        this.elements.characterBtn.onclick = () => {
            this.flashButton(this.elements.characterBtn);
            this.gameController.openCharacterManagement();
        };

        // Add keyboard shortcuts
        this.keyboardShortcutsEnabled = true;
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
    }

    flashButton(button) {
        // Visual feedback for button clicks
        if (button) {
            button.style.transform = 'scale(0.95)';
            button.style.filter = 'brightness(1.3)';
            setTimeout(() => {
                button.style.transform = '';
                button.style.filter = '';
            }, 150);
        }
    }

    handleKeyPress(event) {
        // Check if keyboard shortcuts are disabled (e.g., during name input)
        if (!this.keyboardShortcutsEnabled) {
            return;
        }
        
        switch(event.key) {
            case 's':
                if (event.ctrlKey) {
                    event.preventDefault();
                    this.gameController.saveGame();
                }
                break;
            case 'l':
                if (event.ctrlKey) {
                    event.preventDefault();
                    this.gameController.loadGame();
                }
                break;
            case 'd':
                this.gameController.enterDungeon();
                break;
            case 'c':
                this.gameController.openCrafting();
                break;
            case 'r':
                this.gameController.openRecruitment();
                break;
            case 'h':
                this.gameController.openShop();
                break;
            case 't':
                this.gameController.openTemple();
                break;
            case 'i':
                this.gameController.openInventory();
                break;
            case 'k':
                this.gameController.openCharacterManagement();
                break;
            case 'u':
                // Use item shortcut (in combat)
                if (this.gameState.inDungeon && this.gameState.currentEnemies) {
                    this.gameController.showCombatItemSelection();
                }
                break;
        }
    }

    // Methods to control keyboard shortcuts during input dialogs
    disableKeyboardShortcuts() {
        this.keyboardShortcutsEnabled = false;
        console.log('Keyboard shortcuts disabled');
    }

    enableKeyboardShortcuts() {
        this.keyboardShortcutsEnabled = true;
        console.log('Keyboard shortcuts enabled');
    }

    log(message) {
        this.gameState.chatLog.push(message);
        this.updateChatLog();
        
        // Add visual feedback on mobile
        if (this.isMobile) {
            const chatLog = this.elements.chatLog;
            chatLog.style.border = '3px solid #d4af37';
            setTimeout(() => {
                chatLog.style.border = '';
            }, 500);
        }
    }

    updateChatLog() {
        this.elements.chatLog.innerText = this.gameState.chatLog.join('\n');
        // Auto-scroll to bottom
        this.elements.chatLog.scrollTop = this.elements.chatLog.scrollHeight;
    }

    clearChatLog() {
        this.gameState.chatLog = [];
        this.updateChatLog();
    }

    render() {
        this.renderSprites();
        this.updateChatLog();
        this.updateButtonStates();
    }

    renderSprites() {
        // Clear existing sprites
        this.elements.spritesArea.innerHTML = '';

        // Only render sprites when in dungeons (during combat)
        if (this.gameState.inDungeon) {
            // Render hero sprite
            this.renderHero();
            
            // Render underlings in dungeon (they fight alongside you)
            this.gameState.hero.underlings.forEach((underling, index) => {
                this.renderUnderling(underling, index);
            });
        }

        // Render enemies if in dungeon
        if (this.gameState.currentEnemies) {
            this.gameState.currentEnemies.forEach((enemy, index) => {
                this.renderEnemy(enemy, index);
            });
        }
    }

    renderHero() {
        const heroSprite = document.createElement('div');
        heroSprite.className = 'sprite hero-sprite fade-in';
        heroSprite.style.left = '50px';
        heroSprite.style.top = '50px';
        heroSprite.title = `${this.gameState.hero.name} (Level ${this.gameState.hero.level})`;
        
        // Add hit point indicator
        const hpIndicator = document.createElement('div');
        hpIndicator.className = this.getHealthClass(this.gameState.hero.health, this.gameState.hero.maxHealth);
        hpIndicator.textContent = `${this.gameState.hero.health}/${this.gameState.hero.maxHealth}`;
        heroSprite.appendChild(hpIndicator);
        
        this.elements.spritesArea.appendChild(heroSprite);
    }

    renderUnderling(underling, index) {
        const sprite = document.createElement('div');
        sprite.className = `sprite underling-sprite fade-in ${!underling.isAlive ? 'fallen-underling' : ''}`;
        sprite.style.left = `${120 + (index * 60)}px`;
        sprite.style.top = '50px';
        
        // Different display for fallen vs alive underlings
        if (underling.isAlive) {
            sprite.title = `${underling.name} (Level ${underling.level})`;
            
            // Add hit point indicator
            const hpIndicator = document.createElement('div');
            hpIndicator.className = this.getHealthClass(underling.health, underling.maxHealth || underling.health);
            hpIndicator.textContent = `${underling.health}/${underling.maxHealth || underling.health}`;
            sprite.appendChild(hpIndicator);
        } else {
            sprite.title = `${underling.name} (FALLEN - Needs Resurrection)`;
            sprite.style.filter = 'grayscale(100%) brightness(0.5)';
            
            // Add fallen indicator
            const fallenIndicator = document.createElement('div');
            fallenIndicator.className = 'fallen-indicator';
            fallenIndicator.textContent = '💀 FALLEN';
            fallenIndicator.style.cssText = `
                position: absolute;
                bottom: -5px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(255, 0, 0, 0.8);
                color: white;
                padding: 2px 6px;
                border-radius: 3px;
                font-size: 10px;
                font-weight: bold;
                text-align: center;
                min-width: 45px;
            `;
            sprite.appendChild(fallenIndicator);
        }
        
        this.elements.spritesArea.appendChild(sprite);
    }

    renderEnemy(enemy, index) {
        const sprite = document.createElement('div');
        sprite.className = 'sprite enemy-sprite fade-in';
        sprite.style.left = `${300 + (index * 70)}px`;
        sprite.style.top = '150px';
        sprite.title = `${enemy.name} (Level ${enemy.level})`;
        
        // Add hit point indicator
        const hpIndicator = document.createElement('div');
        hpIndicator.className = this.getHealthClass(enemy.health, enemy.maxHealth);
        hpIndicator.textContent = `${enemy.health}/${enemy.maxHealth}`;
        sprite.appendChild(hpIndicator);
        
        this.elements.spritesArea.appendChild(sprite);
    }

    getHealthClass(currentHealth, maxHealth) {
        const healthPercentage = (currentHealth / maxHealth) * 100;
        let className = 'hp-indicator';
        
        if (healthPercentage <= 20) {
            className += ' critical-health';
        } else if (healthPercentage <= 40) {
            className += ' low-health';
        }
        
        return className;
    }

    updateButtonStates() {
        // Enable/disable buttons based on game state
        this.elements.dungeonBtn.disabled = this.gameState.hero.level < 1;
        this.elements.craftingBtn.disabled = this.gameState.hero.level < 1 || this.gameState.inDungeon;
        this.elements.recruitBtn.disabled = this.gameState.hero.level < 1 || this.gameState.inDungeon; // Changed from level 2 to 1
        
        // Disable shop and temple when in dungeon
        this.elements.shopBtn.disabled = this.gameState.inDungeon;
        this.elements.templeBtn.disabled = this.gameState.inDungeon;
        
        // Update button text and onclick handlers based on state
        if (this.gameState.inDungeon) {
            this.elements.dungeonBtn.textContent = `Exit Dungeon`;
            this.elements.dungeonBtn.onclick = () => this.gameController.exitDungeon();
            
            // Update disabled button text to show why they're disabled
            this.elements.craftingBtn.textContent = `Craft Items (Disabled in Dungeon)`;
            this.elements.shopBtn.textContent = `Shop (Disabled in Dungeon)`;
            this.elements.templeBtn.textContent = `Temple (Disabled in Dungeon)`;
            this.elements.recruitBtn.textContent = `Recruit (Disabled in Dungeon)`;
        } else {
            this.elements.dungeonBtn.textContent = `Enter Dungeon (Level ${this.gameState.dungeonLevel})`;
            this.elements.dungeonBtn.onclick = () => this.gameController.enterDungeon();
            
            // Show level requirements in button text when disabled due to level
            if (this.gameState.hero.level < 1) {
                this.elements.craftingBtn.textContent = `Craft Items (Requires Level 1)`;
            } else {
                this.elements.craftingBtn.textContent = `Craft Items`;
            }
            
            if (this.gameState.hero.level < 1) {
                this.elements.recruitBtn.textContent = `Recruit (Requires Level 1)`;
            } else {
                this.elements.recruitBtn.textContent = `Recruit Underlings (${this.gameState.hero.underlings.length}/${this.gameState.hero.leadership})`;
            }
            
            this.elements.shopBtn.textContent = `Shop (Gold: ${this.gameState.hero.gold})`;
            this.elements.templeBtn.textContent = `Temple (Healing & Resurrection)`;
            
            // Reset the onclick handlers to default (in case they were overridden)
            this.elements.craftingBtn.onclick = () => this.gameController.openCrafting();
            this.elements.shopBtn.onclick = () => this.gameController.openShop();
            this.elements.templeBtn.onclick = () => this.gameController.openTemple();
            this.elements.recruitBtn.onclick = () => this.gameController.openRecruitment();
        }
        
        this.elements.characterBtn.textContent = `Characters (Leadership: ${this.gameState.hero.leadership})`;
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        const bgColor = type === 'error' ? 
            'linear-gradient(135deg, rgba(139, 0, 0, 0.9), rgba(100, 0, 0, 0.9))' : 
            type === 'success' ? 
            'linear-gradient(135deg, rgba(139, 69, 19, 0.9), rgba(212, 175, 55, 0.9))' : 
            'linear-gradient(135deg, rgba(70, 130, 180, 0.9), rgba(100, 149, 237, 0.9))';
            
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${bgColor};
            color: white;
            padding: 15px 25px;
            border-radius: 10px;
            border: 2px solid ${type === 'error' ? '#8b0000' : type === 'success' ? '#d4af37' : '#4682b4'};
            z-index: 1000;
            font-family: 'Cinzel', serif;
            font-weight: 600;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
            box-shadow: 
                0 8px 16px rgba(0, 0, 0, 0.6),
                inset 0 1px 0 rgba(255, 255, 255, 0.2),
                0 0 20px ${type === 'error' ? 'rgba(139, 0, 0, 0.4)' : type === 'success' ? 'rgba(212, 175, 55, 0.4)' : 'rgba(70, 130, 180, 0.4)'};
            animation: gothicSlideIn 0.5s ease-out;
            letter-spacing: 0.5px;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'gothicSlideOut 0.5s ease-in';
            setTimeout(() => notification.remove(), 500);
        }, 3000);
    }

    closeAllModals() {
        // Remove all existing modal overlays to prevent stacking
        const existingModals = document.querySelectorAll('.modal-overlay');
        existingModals.forEach(modal => modal.remove());
    }

    createModal(title, content, buttons = [], options = {}) {
        // Close any existing modals first to prevent stacking
        this.closeAllModals();
        
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        
        // Determine positioning based on options
        const isTopPositioned = options.position === 'top';
        const alignItems = isTopPositioned ? 'flex-start' : 'center';
        const paddingTop = isTopPositioned ? '5px' : '0';
        
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            justify-content: center;
            align-items: ${alignItems};
            z-index: 2000;
            padding-top: ${paddingTop};
            overflow-y: auto;
        `;

        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content';
        modalContent.style.cssText = `
            background: #2a2a2a;
            border: 2px solid #444;
            border-radius: 10px;
            padding: 20px;
            max-width: ${options.maxWidth || '700px'};
            width: 95%;
            color: white;
            ${isTopPositioned ? 'margin-bottom: 20px;' : ''}
        `;

        const modalTitle = document.createElement('h3');
        modalTitle.textContent = title;
        modalTitle.style.marginBottom = '15px';

        const modalBody = document.createElement('div');
        modalBody.innerHTML = content;
        modalBody.style.marginBottom = '20px';

        const modalButtons = document.createElement('div');
        modalButtons.style.display = 'flex';
        modalButtons.style.gap = '12px';
        modalButtons.style.justifyContent = 'center';
        modalButtons.style.flexWrap = 'wrap';
        modalButtons.style.marginTop = '20px';

        buttons.forEach(button => {
            const btn = document.createElement('button');
            btn.textContent = button.text;
            btn.onclick = () => {
                button.onClick();
                modal.remove();
                // Force UI re-render after modal action to ensure button states are updated
                setTimeout(() => this.render(), 50);
            };
            btn.style.cssText = `
                padding: 12px 20px;
                background: linear-gradient(145deg, 
                    rgba(70, 35, 18, 0.9) 0%, 
                    rgba(50, 25, 13, 0.9) 50%, 
                    rgba(30, 15, 8, 0.9) 100%);
                border: 2px solid #8b4513;
                color: #d4af37;
                border-radius: 8px;
                cursor: pointer;
                font-family: 'Cinzel', serif;
                font-weight: 600;
                font-size: 14px;
                text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
                transition: all 0.3s ease;
                min-width: 140px;
            `;
            
            // Add hover effects
            btn.addEventListener('mouseenter', () => {
                btn.style.background = `linear-gradient(145deg, 
                    rgba(90, 45, 23, 0.9) 0%, 
                    rgba(70, 35, 18, 0.9) 50%, 
                    rgba(50, 25, 13, 0.9) 100%)`;
                btn.style.transform = 'translateY(-2px)';
                btn.style.boxShadow = '0 6px 12px rgba(0, 0, 0, 0.5)';
            });
            
            btn.addEventListener('mouseleave', () => {
                btn.style.background = `linear-gradient(145deg, 
                    rgba(70, 35, 18, 0.9) 0%, 
                    rgba(50, 25, 13, 0.9) 50%, 
                    rgba(30, 15, 8, 0.9) 100%)`;
                btn.style.transform = 'translateY(0)';
                btn.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.4)';
            });
            
            modalButtons.appendChild(btn);
        });

        modalContent.appendChild(modalTitle);
        modalContent.appendChild(modalBody);
        modalContent.appendChild(modalButtons);
        modal.appendChild(modalContent);
        document.body.appendChild(modal);

        // Close on background click
        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.remove();
                // Force UI re-render after modal closes to ensure button states are updated
                setTimeout(() => this.render(), 50);
            }
        };

        return modal;
    }

    animateSprite(selector, animationClass) {
        const sprite = document.querySelector(selector);
        if (sprite) {
            sprite.classList.add(animationClass);
            setTimeout(() => sprite.classList.remove(animationClass), 500);
        }
    }

    setBackground(backgroundType, specificImage = null) {
        const spritesArea = this.elements.spritesArea;
        
        // Remove all background classes
        spritesArea.className = spritesArea.className.replace(/\b\w+-background\b/g, '').replace(/\bmobile-mode\b/g, '');
        
        let imagePath = '';
        let backgroundClass = '';
        
        // Determine background class first (needed for both mobile and desktop)
        switch(backgroundType) {
            case 'village':
                backgroundClass = 'village-background';
                break;
            case 'dungeon':
                backgroundClass = 'dungeon-background';
                break;
            case 'shop':
                backgroundClass = 'shop-background';
                break;
            case 'crafting':
                backgroundClass = 'crafting-background';
                break;
            case 'recruitment':
                backgroundClass = 'recruitment-background';
                break;
            case 'temple':
                backgroundClass = 'temple-background';
                break;
            default:
                backgroundClass = 'village-background';
        }
        
        // On mobile, skip images entirely and use CSS gradients only for better performance
        if (this.isMobile) {
            // Clear any existing background image
            spritesArea.style.backgroundImage = '';
            
            // Add the specific background class for CSS gradients
            spritesArea.classList.add(backgroundClass);
            spritesArea.classList.add('mobile-mode');
            
            // Force a visual update with animation
            spritesArea.style.transition = 'all 0.5s ease';
            spritesArea.style.transform = 'scale(0.98)';
            setTimeout(() => {
                spritesArea.style.transform = 'scale(1)';
            }, 100);
            
            this.log(`📱 Mobile: ${backgroundType} area loaded`);
            console.log(`Mobile background applied: ${backgroundClass}`, spritesArea.classList.toString());
            this.currentBackground = backgroundType;
            return;
        }
        
        // Desktop image loading logic
        const supportsWebP = this.checkWebPSupport();
        const imageExtension = supportsWebP ? '.webp' : '.jpg';
        const basePath = 'images/backgrounds/';
        
        switch(backgroundType) {
            case 'village':
                imagePath = `${basePath}village${imageExtension}`;
                break;
            case 'dungeon':
                const dungeonIndex = specificImage !== null ? specificImage : Math.floor(Math.random() * this.dungeonBackgrounds.length);
                imagePath = `${basePath}${this.dungeonBackgrounds[dungeonIndex]}${imageExtension}`;
                break;
            case 'shop':
                imagePath = `${basePath}shop${imageExtension}`;
                break;
            case 'crafting':
                imagePath = `${basePath}crafting${imageExtension}`;
                break;
            case 'recruitment':
                imagePath = `${basePath}recruitment${imageExtension}`;
                break;
            case 'temple':
                imagePath = `${basePath}temple${imageExtension}`;
                break;
            default:
                imagePath = `${basePath}village${imageExtension}`;
        }
        
        // Test if image exists, fall back to CSS gradients if not
        const img = new Image();
        img.onload = () => {
            // Image loaded successfully, apply it
            spritesArea.style.backgroundImage = `url('${imagePath}')`;
            spritesArea.classList.add(backgroundClass);
            this.log(`Background changed to: ${backgroundType}`);
        };
        img.onerror = () => {
            this.handleImageFallback(spritesArea, backgroundClass, backgroundType, imagePath, supportsWebP, imageExtension);
        };
        img.src = imagePath;
        
        this.currentBackground = backgroundType;
    }

    handleImageFallback(spritesArea, backgroundClass, backgroundType, imagePath, supportsWebP, imageExtension) {
        // If WebP failed, try JPG fallback
        if (supportsWebP && imageExtension === '.webp') {
            const jpgPath = imagePath.replace('.webp', '.jpg');
            const fallbackImg = new Image();
            fallbackImg.onload = () => {
                spritesArea.style.backgroundImage = `url('${jpgPath}')`;
                spritesArea.classList.add(backgroundClass);
                this.log(`Background changed to: ${backgroundType} (JPG fallback)`);
            };
            fallbackImg.onerror = () => {
                // Both formats failed, use CSS gradient fallback
                spritesArea.style.backgroundImage = '';
                spritesArea.classList.add(backgroundClass);
                this.log(`Background changed to: ${backgroundType} (CSS fallback - no image found)`);
                console.warn(`Background image not found: ${imagePath}`);
            };
            fallbackImg.src = jpgPath;
        } else {
            // Image failed to load, use CSS gradient fallback
            spritesArea.style.backgroundImage = '';
            spritesArea.classList.add(backgroundClass);
            this.log(`Background changed to: ${backgroundType} (CSS fallback - image not found)`);
            console.warn(`Background image not found: ${imagePath}`);
        }
    }

    checkWebPSupport() {
        // Simple WebP support detection
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        return canvas.toDataURL('image/webp').indexOf('webp') !== -1;
    }

    getRandomDungeonBackground() {
        const randomIndex = Math.floor(Math.random() * this.dungeonBackgrounds.length);
        return randomIndex;
    }
}

// Export for use in main game file
window.UIManager = UIManager;
