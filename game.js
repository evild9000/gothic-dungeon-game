// Main Game Initialization
class Game {
    constructor() {
        this.controller = new GameController();
        this.ui = new UIManager(this.controller.gameState, this.controller);
        
        // Link UI and controller
        this.controller.setUI(this.ui);
        
        this.initialize();
    }

    initialize() {
        // Initial render
        this.ui.render();
        this.ui.log("Welcome to Dungeon Adventure Game!");
        this.ui.log("Use the buttons above to interact with the game.");
        this.ui.log("Leadership determines how many underlings you can recruit. Upgrade it in the Characters menu!");
        this.ui.log("Keyboard shortcuts: Ctrl+S (Save), Ctrl+L (Load), D (Dungeon), C (Craft), R (Recruit), H (Shop), I (Inventory), K (Characters)");
        
        // Add some CSS animations
        this.addCustomStyles();
    }

    addCustomStyles() {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
            
            @keyframes gothicSlideIn {
                from { 
                    transform: translateX(100%) rotateY(90deg); 
                    opacity: 0; 
                    filter: blur(5px);
                }
                to { 
                    transform: translateX(0) rotateY(0deg); 
                    opacity: 1; 
                    filter: blur(0px);
                }
            }
            
            @keyframes gothicSlideOut {
                from { 
                    transform: translateX(0) rotateY(0deg); 
                    opacity: 1; 
                    filter: blur(0px);
                }
                to { 
                    transform: translateX(100%) rotateY(-90deg); 
                    opacity: 0; 
                    filter: blur(5px);
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
});