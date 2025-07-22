// Puzzle System - Future Expansion Module
// Handles various types of puzzles that can be encountered in dungeons

class PuzzleManager {
    constructor(gameState, gameController) {
        this.gameState = gameState;
        this.gameController = gameController;
        this.currentPuzzle = null;
        this.puzzleTypes = [
            'riddle',
            'logic',
            'memory',
            'sequence',
            'math',
            'wordplay',
            'safecracker',
            'tileslider'
        ];
        this.initializePuzzleDatabase();
    }

    initializePuzzleDatabase() {
        this.puzzleDatabase = {
            riddle: [
                {
                    id: 'riddle_1',
                    difficulty: 1,
                    question: "I have keys but no locks. I have space but no room. You can enter, but you can't go outside. What am I?",
                    answer: "keyboard",
                    alternateAnswers: ["a keyboard", "computer keyboard"],
                    reward: { gold: 50, xp: 25 },
                    hint: "You use this to type..."
                },
                {
                    id: 'riddle_2',
                    difficulty: 2,
                    question: "The more you take, the more you leave behind. What am I?",
                    answer: "footsteps",
                    alternateAnswers: ["steps", "footprints"],
                    reward: { gold: 75, xp: 40 },
                    hint: "Think about walking..."
                }
            ],
            logic: [
                {
                    id: 'logic_1',
                    difficulty: 1,
                    question: "Three goblins guard three doors. One always tells the truth, one always lies, and one sometimes tells the truth. Which door leads to treasure?",
                    options: ["Left Door", "Middle Door", "Right Door"],
                    correctAnswer: 1, // Middle Door
                    reward: { gold: 100, xp: 50 },
                    hint: "The truthful goblin points to the middle door..."
                }
            ],
            memory: [
                {
                    id: 'memory_1',
                    difficulty: 1,
                    sequence: [1, 3, 2, 4, 1, 3],
                    question: "Remember this sequence and repeat it:",
                    reward: { gold: 60, xp: 30 },
                    hint: "Take your time to memorize the pattern..."
                }
            ],
            sequence: [
                {
                    id: 'sequence_1',
                    difficulty: 1,
                    pattern: [2, 4, 6, 8, '?'],
                    question: "What comes next in this sequence: 2, 4, 6, 8, ?",
                    answer: "10",
                    reward: { gold: 40, xp: 20 },
                    hint: "Look for the pattern in the numbers..."
                }
            ],
            math: [
                {
                    id: 'math_1',
                    difficulty: 1,
                    question: "A dungeon has 5 levels. Each level has twice as many rooms as the level above it. If the top level has 3 rooms, how many rooms are on the bottom level?",
                    answer: "48",
                    alternateAnswers: ["48 rooms"],
                    reward: { gold: 80, xp: 35 },
                    hint: "Start with 3 and keep doubling..."
                }
            ],
            wordplay: [
                {
                    id: 'wordplay_1',
                    difficulty: 1,
                    question: "Rearrange these letters to form a word related to dungeons: DRAGONWS",
                    answer: "dungeons",
                    alternateAnswers: ["dungeon"],
                    reward: { gold: 45, xp: 25 },
                    hint: "Think about where you are..."
                }
            ],
            safecracker: [
                {
                    id: 'safecracker_1',
                    difficulty: 2,
                    codeLength: 3,
                    maxAttempts: 8,
                    reward: { gold: 200, xp: 100 },
                    specialRewards: ['Magic Ring', 'Ancient Gem', 'Enchanted Scroll'],
                    description: "An ancient dwarven vault sealed with a mystical combination lock"
                },
                {
                    id: 'safecracker_2',
                    difficulty: 3,
                    codeLength: 4,
                    maxAttempts: 10,
                    reward: { gold: 350, xp: 150 },
                    specialRewards: ['Legendary Weapon', 'Dragon Scale', 'Tome of Power', 'Crystal of Might'],
                    description: "A dragon-guarded treasure chest with an elaborate runic lock"
                },
                {
                    id: 'safecracker_3',
                    difficulty: 4,
                    codeLength: 5,
                    maxAttempts: 12,
                    reward: { gold: 500, xp: 200 },
                    specialRewards: ['Artifact Weapon', 'Crown of Ages', 'Philosopher\'s Stone', 'Staff of Eternity'],
                    description: "The legendary vault of an ancient archmage, sealed by powerful magic"
                }
            ],
            tileslider: [
                {
                    id: 'tileslider_1',
                    difficulty: 2,
                    gridSize: 3,
                    timeLimit: 60,
                    colors: ['#ff4444', '#44ff44', '#4444ff', '#ffff44'],
                    reward: { gold: 150, xp: 75 },
                    description: "An ancient mystical tile puzzle glows with magical energy"
                },
                {
                    id: 'tileslider_2', 
                    difficulty: 3,
                    gridSize: 4,
                    timeLimit: 90,
                    colors: ['#ff4444', '#44ff44', '#4444ff', '#ffff44', '#ff44ff', '#44ffff'],
                    reward: { gold: 250, xp: 125 },
                    description: "A complex runic tile array pulses with arcane power"
                },
                {
                    id: 'tileslider_3',
                    difficulty: 4,
                    gridSize: 5,
                    timeLimit: 120,
                    colors: ['#ff4444', '#44ff44', '#4444ff', '#ffff44', '#ff44ff', '#44ffff', '#ff8844', '#8844ff'],
                    reward: { gold: 400, xp: 200 },
                    description: "The legendary Chromatic Codex - a master puzzle of the ancient mages"
                }
            ]
        };
    }

    // Check if puzzles should appear in this dungeon level
    shouldGeneratePuzzle(dungeonLevel) {
        // 15% chance for puzzle encounters, increasing with dungeon level
        const baseChance = 0.10;
        const levelBonus = dungeonLevel * 0.02;
        const totalChance = Math.min(baseChance + levelBonus, 0.25); // Cap at 25%
        
        return Math.random() < totalChance;
    }

    // Generate a random puzzle appropriate for the current dungeon level
    generatePuzzle(dungeonLevel) {
        const puzzleType = this.puzzleTypes[Math.floor(Math.random() * this.puzzleTypes.length)];
        const puzzlesOfType = this.puzzleDatabase[puzzleType];
        
        if (!puzzlesOfType || puzzlesOfType.length === 0) {
            return null;
        }

        // Filter puzzles by appropriate difficulty for dungeon level
        const appropriatePuzzles = puzzlesOfType.filter(puzzle => 
            puzzle.difficulty <= Math.max(1, Math.floor(dungeonLevel / 2))
        );

        if (appropriatePuzzles.length === 0) {
            // Fall back to easiest puzzle if none match level
            return puzzlesOfType[0];
        }

        const selectedPuzzle = appropriatePuzzles[Math.floor(Math.random() * appropriatePuzzles.length)];
        
        // Scale rewards based on dungeon level
        const scaledReward = {
            gold: Math.floor(selectedPuzzle.reward.gold * (1 + dungeonLevel * 0.1)),
            xp: Math.floor(selectedPuzzle.reward.xp * (1 + dungeonLevel * 0.1))
        };

        return {
            ...selectedPuzzle,
            reward: scaledReward,
            type: puzzleType
        };
    }

    // Present puzzle to player
    showPuzzle(puzzle) {
        this.currentPuzzle = puzzle;
        
        let puzzleContent = `
            <div style="background: rgba(20, 20, 40, 0.9); padding: 20px; border-radius: 12px; border: 2px solid #9966cc;">
                <h3 style="color: #d4af37; margin-bottom: 15px; text-align: center;">🧩 Ancient Puzzle 🧩</h3>
                <div style="background: #1a1a2a; padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #d4af37;">
                    <p style="color: #ccc; font-size: 14px; line-height: 1.5; margin: 0;">
                        ${puzzle.question}
                    </p>
                </div>
        `;

        // Add type-specific content
        if (puzzle.type === 'logic' && puzzle.options) {
            puzzleContent += `
                <div style="margin-bottom: 15px;">
                    <label style="color: #4ecdc4; font-weight: bold; margin-bottom: 8px; display: block;">Choose your answer:</label>
                    <select id="puzzleSelect" style="width: 100%; padding: 8px; background: #2a2a4a; color: white; border: 1px solid #666; border-radius: 6px; font-size: 14px;">
                        <option value="">-- Select an option --</option>
                        ${puzzle.options.map((option, index) => 
                            `<option value="${index}">${option}</option>`
                        ).join('')}
                    </select>
                </div>
            `;
        } else if (puzzle.type === 'memory') {
            puzzleContent += `
                <div style="margin-bottom: 15px;">
                    <div style="color: #4ecdc4; font-weight: bold; margin-bottom: 8px;">Memorize this sequence:</div>
                    <div style="background: #2a2a4a; padding: 10px; border-radius: 6px; text-align: center; font-size: 18px; color: #fff; margin-bottom: 10px;">
                        ${puzzle.sequence.join(' - ')}
                    </div>
                    <input type="text" id="puzzleInput" placeholder="Enter the sequence (separated by commas)" 
                           style="width: 100%; padding: 8px; background: #2a2a4a; color: white; border: 1px solid #666; border-radius: 6px; font-size: 14px;">
                </div>
            `;
        } else if (puzzle.type === 'safecracker') {
            // Initialize the safecracker puzzle
            this.initializeSafecracker(puzzle);
            puzzleContent += this.getSafecrackerHTML(puzzle);
        } else if (puzzle.type === 'tileslider') {
            // Initialize the tile slider puzzle
            this.initializeTileSlider(puzzle);
            puzzleContent += this.getTileSliderHTML(puzzle);
        } else {
            puzzleContent += `
                <div style="margin-bottom: 15px;">
                    <label style="color: #4ecdc4; font-weight: bold; margin-bottom: 8px; display: block;">Your answer:</label>
                    <input type="text" id="puzzleInput" placeholder="Type your answer here..." 
                           style="width: 100%; padding: 8px; background: #2a2a4a; color: white; border: 1px solid #666; border-radius: 6px; font-size: 14px;">
                </div>
            `;
        }

        puzzleContent += `
                <div style="background: #0a2a0a; padding: 10px; border-radius: 6px; margin-bottom: 15px; border: 2px solid #4ecdc4;">
                    <div style="color: #4ecdc4; font-weight: bold; margin-bottom: 5px;">Rewards:</div>
                    <div style="color: #ffd93d;">💰 ${puzzle.reward.gold} Gold | ⭐ ${puzzle.reward.xp} Experience</div>
                </div>
                
                <div id="puzzleHint" style="display: none; background: #2a2a1a; padding: 10px; border-radius: 6px; margin-bottom: 15px; border-left: 3px solid #ffcc00;">
                    <div style="color: #ffcc00; font-weight: bold; margin-bottom: 5px;">💡 Hint:</div>
                    <div style="color: #ccc; font-style: italic;">${puzzle.hint}</div>
                </div>
            </div>
        `;

        let modalButtons;
        if (puzzle.type === 'safecracker') {
            modalButtons = [
                {
                    text: "❌ Give Up",
                    onClick: () => this.skipPuzzle()
                }
            ];
        } else if (puzzle.type === 'tileslider') {
            modalButtons = [
                {
                    text: "🔄 Scramble Again",
                    onClick: () => this.scrambleTileSlider()
                },
                {
                    text: "❌ Give Up",
                    onClick: () => this.skipPuzzle()
                }
            ];
        } else {
            modalButtons = [
                {
                    text: "🧩 Submit Answer",
                    onClick: () => this.submitPuzzleAnswer()
                },
                {
                    text: "💡 Show Hint",
                    onClick: () => this.showHint()
                },
                {
                    text: "❌ Skip Puzzle",
                    onClick: () => this.skipPuzzle()
                }
            ];
        }

        this.gameController.ui.createModal("Ancient Puzzle", puzzleContent, modalButtons);
        
        // Start timer for tile slider puzzles
        if (puzzle.type === 'tileslider') {
            setTimeout(() => this.startTileSliderTimer(), 500);
        }
    }

    showHint() {
        const hintDiv = document.getElementById('puzzleHint');
        if (hintDiv) {
            hintDiv.style.display = 'block';
        }
    }

    submitPuzzleAnswer() {
        if (!this.currentPuzzle) return;

        let userAnswer = '';
        
        if (this.currentPuzzle.type === 'logic') {
            const select = document.getElementById('puzzleSelect');
            if (select) {
                userAnswer = select.value;
            }
        } else {
            const input = document.getElementById('puzzleInput');
            if (input) {
                userAnswer = input.value.trim().toLowerCase();
            }
        }

        if (!userAnswer) {
            this.gameController.ui.showNotification("Please provide an answer!", "error");
            return;
        }

        const isCorrect = this.checkAnswer(userAnswer);
        
        if (isCorrect) {
            this.solvePuzzle();
        } else {
            this.gameController.ui.showNotification("Incorrect answer. Try again or use a hint!", "error");
        }
    }

    checkAnswer(userAnswer) {
        const puzzle = this.currentPuzzle;
        
        if (puzzle.type === 'logic') {
            return parseInt(userAnswer) === puzzle.correctAnswer;
        } else if (puzzle.type === 'memory') {
            const userSequence = userAnswer.split(',').map(s => s.trim());
            return JSON.stringify(userSequence) === JSON.stringify(puzzle.sequence.map(String));
        } else {
            // Text-based answers
            const correctAnswers = [puzzle.answer.toLowerCase()];
            if (puzzle.alternateAnswers) {
                correctAnswers.push(...puzzle.alternateAnswers.map(a => a.toLowerCase()));
            }
            
            return correctAnswers.some(answer => 
                userAnswer === answer || userAnswer.includes(answer.replace(/^(a |an |the )/, ''))
            );
        }
    }

    solvePuzzle() {
        const puzzle = this.currentPuzzle;
        
        // Award rewards
        this.gameState.hero.gold += puzzle.reward.gold;
        this.gameState.hero.experience += puzzle.reward.xp;
        
        // Log success
        this.gameController.ui.log(`🧩 **PUZZLE SOLVED!** You earned ${puzzle.reward.gold} gold and ${puzzle.reward.xp} experience!`);
        this.gameController.ui.showNotification("Puzzle solved! Wisdom brings rewards.", "success");
        
        // Check for level up
        this.gameController.checkLevelUp();
        
        // Clear current puzzle
        this.currentPuzzle = null;
        
        // Close any open modals
        const modals = document.querySelectorAll('.modal-overlay');
        modals.forEach(modal => modal.remove());
        
        // Continue with dungeon exploration
        this.gameController.ui.render();
    }

    skipPuzzle() {
        this.gameController.ui.log("You decided to skip the ancient puzzle and continue exploring.");
        this.currentPuzzle = null;
        
        // Close any open modals
        const modals = document.querySelectorAll('.modal-overlay');
        modals.forEach(modal => modal.remove());
    }

    // Future expansion methods (placeholders)
    addCustomPuzzle(puzzleData) {
        // Allow adding custom puzzles
        console.log("Custom puzzle system - Future feature");
    }

    getPuzzleStats() {
        // Track puzzle solving statistics
        return {
            totalSolved: 0,
            totalSkipped: 0,
            totalRewards: 0
        };
    }

    // Safecracker-specific methods
    initializeSafecracker(puzzle) {
        // Generate random code
        this.secretCode = [];
        for (let i = 0; i < puzzle.codeLength; i++) {
            this.secretCode.push(Math.floor(Math.random() * 10));
        }
        
        this.attempts = [];
        this.attemptsRemaining = puzzle.maxAttempts;
        
        console.log("Secret code:", this.secretCode); // For debugging - remove in production
    }

    getSafecrackerHTML(puzzle) {
        return `
            <div style="margin-bottom: 15px;">
                <div style="color: #4ecdc4; font-weight: bold; margin-bottom: 8px; text-align: center;">
                    ${puzzle.description}
                </div>
                <div style="background: #1a1a2a; padding: 20px; border-radius: 10px; border: 3px solid #8b4513; margin-bottom: 15px;">
                    <div style="text-align: center; margin-bottom: 15px;">
                        <div style="background: #2d1810; padding: 15px; border-radius: 8px; border: 2px solid #d4af37; display: inline-block;">
                            <div style="color: #d4af37; font-weight: bold; margin-bottom: 10px;">🏛️ MYSTICAL VAULT 🏛️</div>
                            <div style="display: flex; justify-content: center; gap: 10px; margin-bottom: 15px;">
                                ${Array(puzzle.codeLength).fill(0).map((_, i) => 
                                    `<input type="number" id="code${i}" min="0" max="9" 
                                     style="width: 50px; height: 50px; text-align: center; font-size: 24px; font-weight: bold; 
                                            background: #0a0a0a; color: #d4af37; border: 2px solid #8b4513; border-radius: 8px;">`
                                ).join('')}
                            </div>
                            <button onclick="puzzleManager.submitSafecrackerGuess()" 
                                    style="background: #8b4513; color: #d4af37; border: 2px solid #d4af37; padding: 10px 20px; 
                                           border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 14px;">
                                🔓 Try Combination
                            </button>
                        </div>
                    </div>
                    
                    <div style="color: #ffcc00; text-align: center; margin-bottom: 10px;">
                        Attempts Remaining: <span id="attemptsRemaining">${puzzle.maxAttempts}</span>
                    </div>
                    
                    <div id="safecrackerHistory" style="background: #0a0a0a; padding: 10px; border-radius: 6px; max-height: 200px; overflow-y: auto;">
                        <div style="color: #888; text-align: center; font-style: italic;">Enter your guesses above...</div>
                    </div>
                </div>
                
                <div style="background: #1a1a0a; padding: 10px; border-radius: 6px; border-left: 4px solid #ffcc00;">
                    <div style="color: #ffcc00; font-weight: bold; margin-bottom: 5px;">🔍 Legend:</div>
                    <div style="color: #ccc; font-size: 12px;">
                        🟢 = Correct number in correct position<br>
                        🟡 = Correct number in wrong position<br>
                        🔴 = Wrong number
                    </div>
                </div>
            </div>
        `;
    }

    submitSafecrackerGuess() {
        if (!this.currentPuzzle || this.currentPuzzle.type !== 'safecracker') return;
        
        // Get the current guess
        const guess = [];
        for (let i = 0; i < this.currentPuzzle.codeLength; i++) {
            const input = document.getElementById(`code${i}`);
            if (!input || input.value === '') {
                this.gameController.ui.showNotification("Please fill in all digits!", "error");
                return;
            }
            guess.push(parseInt(input.value));
        }
        
        // Analyze the guess
        const result = this.analyzeSafecrackerGuess(guess);
        this.attempts.push({ guess: [...guess], result });
        this.attemptsRemaining--;
        
        // Update the display
        this.updateSafecrackerDisplay();
        
        // Check win condition
        if (result.correct === this.currentPuzzle.codeLength) {
            this.safecrackerSuccess();
        } else if (this.attemptsRemaining <= 0) {
            this.safecrackerFailure();
        } else {
            // Clear inputs for next attempt
            for (let i = 0; i < this.currentPuzzle.codeLength; i++) {
                document.getElementById(`code${i}`).value = '';
            }
        }
    }

    analyzeSafecrackerGuess(guess) {
        let correct = 0;  // Right number, right position
        let wrongPosition = 0;  // Right number, wrong position
        let wrong = 0;  // Wrong number entirely
        
        const secretCopy = [...this.secretCode];
        const guessCopy = [...guess];
        
        // First pass: count exact matches
        for (let i = 0; i < guess.length; i++) {
            if (guess[i] === this.secretCode[i]) {
                correct++;
                secretCopy[i] = -1; // Mark as used
                guessCopy[i] = -2; // Mark as used
            }
        }
        
        // Second pass: count wrong positions
        for (let i = 0; i < guessCopy.length; i++) {
            if (guessCopy[i] !== -2) { // Not already matched
                const index = secretCopy.indexOf(guessCopy[i]);
                if (index !== -1) {
                    wrongPosition++;
                    secretCopy[index] = -1; // Mark as used
                }
            }
        }
        
        wrong = guess.length - correct - wrongPosition;
        
        return { correct, wrongPosition, wrong };
    }

    updateSafecrackerDisplay() {
        const historyDiv = document.getElementById('safecrackerHistory');
        const attemptsDiv = document.getElementById('attemptsRemaining');
        
        if (attemptsDiv) {
            attemptsDiv.textContent = this.attemptsRemaining;
        }
        
        if (historyDiv) {
            let historyHTML = '';
            this.attempts.forEach((attempt, index) => {
                const guessStr = attempt.guess.join(' ');
                const result = attempt.result;
                historyHTML += `
                    <div style="background: #1a1a1a; margin-bottom: 5px; padding: 8px; border-radius: 4px; border-left: 3px solid #666;">
                        <div style="color: #ccc; font-family: monospace;">
                            Attempt ${index + 1}: [${guessStr}]
                        </div>
                        <div style="margin-top: 5px; font-size: 12px;">
                            ${'🟢'.repeat(result.correct)}${'🟡'.repeat(result.wrongPosition)}${'🔴'.repeat(result.wrong)}
                            <span style="color: #888; margin-left: 10px;">
                                (${result.correct} correct, ${result.wrongPosition} wrong position, ${result.wrong} wrong)
                            </span>
                        </div>
                    </div>
                `;
            });
            historyDiv.innerHTML = historyHTML;
        }
    }

    safecrackerSuccess() {
        // Award treasures
        this.gameState.gold += this.currentPuzzle.reward.gold;
        this.gameState.experience += this.currentPuzzle.reward.xp;
        
        // Award special items
        const specialReward = this.currentPuzzle.specialRewards[
            Math.floor(Math.random() * this.currentPuzzle.specialRewards.length)
        ];
        
        if (this.gameController.inventoryManager) {
            this.gameController.inventoryManager.addItem(specialReward, 1);
        }
        
        this.gameController.ui.log("🎉 SUCCESS! The vault opens with a satisfying click!");
        this.gameController.ui.log(`💰 You found ${this.currentPuzzle.reward.gold} gold!`);
        this.gameController.ui.log(`⭐ Gained ${this.currentPuzzle.reward.xp} experience!`);
        this.gameController.ui.log(`✨ Discovered a ${specialReward}!`);
        
        this.closePuzzleModal();
        this.gameController.ui.render();
    }

    safecrackerFailure() {
        // Small consolation prize
        const consolationGold = Math.floor(this.currentPuzzle.reward.gold * 0.1);
        this.gameState.gold += consolationGold;
        
        this.gameController.ui.log("💀 The vault remains sealed. Your attempts have been exhausted.");
        this.gameController.ui.log(`💰 You find ${consolationGold} gold coins scattered nearby.`);
        
        this.closePuzzleModal();
        this.gameController.ui.render();
    }

    // Tile Slider Puzzle Methods (Rubik's Race style)
    initializeTileSlider(puzzle) {
        const gridSize = puzzle.gridSize;
        const totalTiles = gridSize * gridSize;
        
        // Generate target pattern
        this.targetPattern = [];
        for (let i = 0; i < totalTiles - 1; i++) {
            this.targetPattern.push(puzzle.colors[Math.floor(Math.random() * puzzle.colors.length)]);
        }
        this.targetPattern.push(null); // Empty space
        
        // Create current state (copy of target initially)
        this.currentGrid = [...this.targetPattern];
        
        // Scramble the grid with valid moves to ensure solvability
        this.emptyIndex = totalTiles - 1;
        this.scrambleTiles(gridSize, 100); // 100 random moves
        
        // Timer setup
        this.tileSliderTimer = puzzle.timeLimit;
        this.tileSliderInterval = null;
        
        console.log("Target pattern:", this.targetPattern);
        console.log("Scrambled grid:", this.currentGrid);
    }

    getTileSliderHTML(puzzle) {
        const gridSize = puzzle.gridSize;
        
        return `
            <div style="margin-bottom: 15px;">
                <div style="color: #4ecdc4; font-weight: bold; margin-bottom: 8px; text-align: center;">
                    ${puzzle.description}
                </div>
                
                <div style="background: #1a1a2a; padding: 20px; border-radius: 10px; border: 3px solid #8b4513; margin-bottom: 15px;">
                    <div style="text-align: center; margin-bottom: 15px;">
                        <div style="color: #d4af37; font-weight: bold; margin-bottom: 10px;">🧩 MYSTICAL TILE ARRAY 🧩</div>
                        <div style="color: #ffcc00; font-size: 18px; margin-bottom: 10px;">
                            Time Remaining: <span id="tileSliderTimer">${this.tileSliderTimer}</span>s
                        </div>
                    </div>
                    
                    <!-- Target Pattern -->
                    <div style="margin-bottom: 20px;">
                        <div style="color: #4ecdc4; font-weight: bold; text-align: center; margin-bottom: 10px;">
                            🎯 Target Pattern
                        </div>
                        <div id="targetGrid" style="display: grid; grid-template-columns: repeat(${gridSize}, 1fr); gap: 2px; max-width: 200px; margin: 0 auto; background: #2d1810; padding: 10px; border-radius: 8px;">
                            ${this.generateGridHTML(this.targetPattern, gridSize, false)}
                        </div>
                    </div>
                    
                    <!-- Current Grid -->
                    <div>
                        <div style="color: #ff8844; font-weight: bold; text-align: center; margin-bottom: 10px;">
                            🔄 Your Grid (Click to Move)
                        </div>
                        <div id="currentGrid" style="display: grid; grid-template-columns: repeat(${gridSize}, 1fr); gap: 2px; max-width: 300px; margin: 0 auto; background: #2d1810; padding: 10px; border-radius: 8px;">
                            ${this.generateGridHTML(this.currentGrid, gridSize, true)}
                        </div>
                    </div>
                    
                    <div style="text-align: center; margin-top: 15px; color: #888; font-size: 12px;">
                        Click on tiles adjacent to the empty space to slide them
                    </div>
                </div>
            </div>
        `;
    }

    generateGridHTML(grid, gridSize, clickable) {
        return grid.map((color, index) => {
            if (color === null) {
                // Empty space
                return `<div class="tile-empty" style="aspect-ratio: 1; background: #0a0a0a; border: 2px dashed #444; border-radius: 4px;"></div>`;
            } else {
                const clickHandler = clickable ? `onclick="puzzleManager.moveTile(${index})"` : '';
                const cursor = clickable ? 'cursor: pointer;' : '';
                return `<div class="tile-color" ${clickHandler} style="aspect-ratio: 1; background: ${color}; border: 2px solid #666; border-radius: 4px; ${cursor} transition: all 0.2s ease; display: flex; align-items: center; justify-content: center; font-weight: bold; text-shadow: 1px 1px 2px rgba(0,0,0,0.8);"></div>`;
            }
        }).join('');
    }

    scrambleTiles(gridSize, moves) {
        for (let i = 0; i < moves; i++) {
            const validMoves = this.getValidMoves(gridSize);
            if (validMoves.length > 0) {
                const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
                this.swapTiles(randomMove, this.emptyIndex);
                this.emptyIndex = randomMove;
            }
        }
    }

    getValidMoves(gridSize) {
        const validMoves = [];
        const row = Math.floor(this.emptyIndex / gridSize);
        const col = this.emptyIndex % gridSize;
        
        // Check all four directions
        const directions = [
            { dr: -1, dc: 0 }, // Up
            { dr: 1, dc: 0 },  // Down
            { dr: 0, dc: -1 }, // Left
            { dr: 0, dc: 1 }   // Right
        ];
        
        for (const dir of directions) {
            const newRow = row + dir.dr;
            const newCol = col + dir.dc;
            
            if (newRow >= 0 && newRow < gridSize && newCol >= 0 && newCol < gridSize) {
                validMoves.push(newRow * gridSize + newCol);
            }
        }
        
        return validMoves;
    }

    moveTile(tileIndex) {
        if (!this.currentPuzzle || this.currentPuzzle.type !== 'tileslider') return;
        
        const gridSize = this.currentPuzzle.gridSize;
        const validMoves = this.getValidMoves(gridSize);
        
        if (validMoves.includes(tileIndex)) {
            // Valid move - swap tile with empty space
            this.swapTiles(tileIndex, this.emptyIndex);
            this.emptyIndex = tileIndex;
            
            // Update the visual grid
            this.updateTileSliderDisplay();
            
            // Check if puzzle is solved
            if (this.isTileSliderSolved()) {
                this.tileSliderSuccess();
            }
        } else {
            // Invalid move
            this.gameController.ui.showNotification("Can only move tiles adjacent to empty space!", "error");
        }
    }

    swapTiles(index1, index2) {
        const temp = this.currentGrid[index1];
        this.currentGrid[index1] = this.currentGrid[index2];
        this.currentGrid[index2] = temp;
    }

    updateTileSliderDisplay() {
        const currentGridElement = document.getElementById('currentGrid');
        if (currentGridElement) {
            currentGridElement.innerHTML = this.generateGridHTML(this.currentGrid, this.currentPuzzle.gridSize, true);
        }
    }

    isTileSliderSolved() {
        for (let i = 0; i < this.currentGrid.length; i++) {
            if (this.currentGrid[i] !== this.targetPattern[i]) {
                return false;
            }
        }
        return true;
    }

    startTileSliderTimer() {
        this.tileSliderInterval = setInterval(() => {
            this.tileSliderTimer--;
            const timerElement = document.getElementById('tileSliderTimer');
            if (timerElement) {
                timerElement.textContent = this.tileSliderTimer;
                
                // Change color when time is running out
                if (this.tileSliderTimer <= 10) {
                    timerElement.style.color = '#ff4444';
                } else if (this.tileSliderTimer <= 30) {
                    timerElement.style.color = '#ff8844';
                }
            }
            
            if (this.tileSliderTimer <= 0) {
                this.tileSliderTimeUp();
            }
        }, 1000);
    }

    scrambleTileSlider() {
        if (!this.currentPuzzle || this.currentPuzzle.type !== 'tileslider') return;
        
        // Re-scramble the grid
        this.currentGrid = [...this.targetPattern];
        this.emptyIndex = this.currentGrid.length - 1;
        this.scrambleTiles(this.currentPuzzle.gridSize, 100);
        
        // Update display
        this.updateTileSliderDisplay();
        
        this.gameController.ui.showNotification("Grid scrambled again!", "info");
    }

    tileSliderSuccess() {
        // Stop timer
        if (this.tileSliderInterval) {
            clearInterval(this.tileSliderInterval);
            this.tileSliderInterval = null;
        }
        
        // Calculate bonus based on remaining time
        const timeBonus = Math.floor(this.tileSliderTimer * 2);
        const totalGold = this.currentPuzzle.reward.gold + timeBonus;
        const totalXP = this.currentPuzzle.reward.xp + Math.floor(timeBonus / 2);
        
        // Award rewards
        this.gameState.gold += totalGold;
        this.gameState.experience += totalXP;
        
        this.gameController.ui.log("🎉 SUCCESS! The mystical tiles align perfectly!");
        this.gameController.ui.log(`💰 You earned ${totalGold} gold (${timeBonus} time bonus)!`);
        this.gameController.ui.log(`⭐ Gained ${totalXP} experience!`);
        
        // Chance for special reward on harder puzzles
        if (this.currentPuzzle.difficulty >= 3 && Math.random() < 0.4) {
            const magicalItems = ['Enchanted Lens', 'Crystal of Clarity', 'Tome of Patterns', 'Mystic Compass'];
            const reward = magicalItems[Math.floor(Math.random() * magicalItems.length)];
            
            if (this.gameController.inventoryManager) {
                this.gameController.inventoryManager.addItem(reward, 1);
            }
            this.gameController.ui.log(`✨ The tiles reveal a hidden ${reward}!`);
        }
        
        this.closePuzzleModal();
        this.gameController.ui.render();
    }

    tileSliderTimeUp() {
        // Stop timer
        if (this.tileSliderInterval) {
            clearInterval(this.tileSliderInterval);
            this.tileSliderInterval = null;
        }
        
        // Small consolation prize
        const consolationGold = Math.floor(this.currentPuzzle.reward.gold * 0.15);
        this.gameState.gold += consolationGold;
        
        this.gameController.ui.log("⏰ Time's up! The mystical tiles fade back to their original state.");
        this.gameController.ui.log(`💰 You managed to collect ${consolationGold} gold from the tile fragments.`);
        
        this.closePuzzleModal();
        this.gameController.ui.render();
    }

    // Override closePuzzleModal to clean up tile slider timer
    closePuzzleModal() {
        // Clean up tile slider timer if active
        if (this.tileSliderInterval) {
            clearInterval(this.tileSliderInterval);
            this.tileSliderInterval = null;
        }
        
        // Close modal
        const modals = document.querySelectorAll('.modal-overlay');
        modals.forEach(modal => modal.remove());
        
        this.currentPuzzle = null;
    }
}

// Export for use in main game
window.PuzzleManager = PuzzleManager;
