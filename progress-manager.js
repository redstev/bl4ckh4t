// Dette er en komplet erstatning af progress-manager.js
// Med grøn farve KUN ved 100% gennemførelse

// Progress Manager - Håndterer visning af fremdrift
class ProgressManager {
    constructor() {
        console.log("Progress Manager initialiseret");
        
        // Cache DOM elementer
        this.levelBars = [
            document.getElementById('level1-bar'),
            document.getElementById('level2-bar'),
            document.getElementById('level3-bar'),
            document.getElementById('level4-bar')
        ];
        
        this.progressBarContainers = document.querySelectorAll('.progress-bar');
        
        // State
        this.currentLevel = 1;
        this.maxLevels = 4;
        this.levelProgress = [0, 0, 0, 0]; // Progress for hver level (0-100)
        this.completedLevels = [false, false, false, false]; // Hvilke levels er gennemført
        
        // Vægtninger for baner baseret på antal forhindringer
        this.pathwayWeights = {
            4: 0.4, // 4 forhindringer = 40%
            3: 0.3, // 3 forhindringer = 30%
            2: 0.2, // 2 forhindringer = 20%
            1: 0.1  // 1 forhindring = 10%
        };
        
        // Initialiser UI
        this.initializeUI();
        
        // Debug: Log variabler
        console.log(`Initial level: ${this.currentLevel}`);
    }
    
    // Initialiser UI-elementer
    initializeUI() {
        // Fjern alle active/completed klasser først
        this.progressBarContainers.forEach(bar => {
            bar.classList.remove('active', 'completed');
        });

        // Sæt aktiv klasse på første niveau
        if (this.progressBarContainers[0]) {
            this.progressBarContainers[0].classList.add('active');
        }

        // Nulstil alle bar fills og sæt normal farve
        this.levelBars.forEach(bar => {
            if (bar) {
                bar.style.width = '0%';
                bar.style.background = 'linear-gradient(to right, #00ffff, #ff00ff)';
            }
        });
    }
    
    // Manuelt skift til et bestemt niveau
    setCurrentLevel(levelNumber) {
        if (levelNumber < 1 || levelNumber > this.maxLevels) return;

        // Gem tidligere level som gennemført, hvis vi rykker fremad
        if (levelNumber > this.currentLevel) {
            for (let i = 0; i < levelNumber - 1; i++) {
                this.completedLevels[i] = true;

                // Vi sætter IKKE levelProgress til 100% her, så den faktiske gennemførelsesgrad bevares

                // Opdater UI for tidligere niveauer, men bevar den eksisterende progress
                if (this.progressBarContainers[i]) {
                    this.progressBarContainers[i].classList.remove('active');
                    this.progressBarContainers[i].classList.add('completed');
                }
            }
        }

        // Opdater currentLevel
        this.currentLevel = levelNumber;

        // Opdater active classes
        this.progressBarContainers.forEach((bar, index) => {
            bar.classList.remove('active');
            if (index === this.currentLevel - 1) {
                bar.classList.add('active');
            }
        });

        console.log(`Skiftet til niveau ${this.currentLevel}`);
    }
    
    // Skift til næste niveau
    advanceToNextLevel() {
        if (this.currentLevel >= this.maxLevels) return;

        console.log(`Avancerer fra niveau ${this.currentLevel} til ${this.currentLevel + 1}`);

        // Markér nuværende niveau som gennemført, men bevar den faktiske procentdel
        // Bemærk: Vi sætter IKKE levelProgress til 100% her
        this.completedLevels[this.currentLevel - 1] = true;

        // Opdater UI for nuværende niveau - fjern active og tilføj completed
        if (this.progressBarContainers[this.currentLevel - 1]) {
            this.progressBarContainers[this.currentLevel - 1].classList.remove('active');
            this.progressBarContainers[this.currentLevel - 1].classList.add('completed');

            // Bevar den nuværende bredde - sæt den IKKE til 100%
            // Vi beholder den værdi, der allerede er sat via updateProgress()
        }

        // Gå til næste niveau
        this.currentLevel++;

        // Markér det nye niveau som aktivt
        if (this.currentLevel <= this.maxLevels && this.progressBarContainers[this.currentLevel - 1]) {
            this.progressBarContainers[this.currentLevel - 1].classList.add('active');
        }
    }
    
    // Opdater fremskridt baseret på aktive vira
    updateProgress(squares) {
        if (this.currentLevel > this.maxLevels || gameOver) return;
        
        // Beregn aktuel fremskridt for det nuværende niveau
        const activeSquares = squares.filter(square => square.active);
        const completedSquares = squares.filter(square => square.completed);
        
        if (activeSquares.length === 0 && completedSquares.length === 0) {
            // Game over, intet ændres
            return;
        }
        
        // Opdater progress for tidligere niveauer først
        for (let i = 0; i < this.currentLevel - 1; i++) {
            // Hvis niveauet er gennemført, sikrer vi det vises som 100%
            if (this.completedLevels[i]) {
                if (this.levelBars[i]) {
                    this.levelBars[i].style.width = '100%';
                }
                
                if (this.progressBarContainers[i]) {
                    this.progressBarContainers[i].classList.add('completed');
                }
            }
        }
        
        // Beregn fremskridt for den aktuelle bane
        let levelProgressValue = 0;
        
        // Hvis der er gennemførte baner, tilføj deres værdi
        completedSquares.forEach(square => {
            const pathwayObstacleCount = obstacleCounts[square.pathway];
            levelProgressValue += this.pathwayWeights[pathwayObstacleCount] * 100;
        });
        
        // For aktive baner, beregn deres delvise bidrag baseret på position
        activeSquares.forEach(square => {
            const pathwayObstacleCount = obstacleCounts[square.pathway];
            const weight = this.pathwayWeights[pathwayObstacleCount];
            
            // Beregn procentdel af banen, der er tilbagelagt (y-position / total højde)
            const totalPathwayHeight = HEIGHT;
            const startY = -HEIGHT/2 + VIRUS_SIZE + 10; // Start position fra konstruktøren
            const currentProgress = (square.y - startY) / (totalPathwayHeight - startY - VIRUS_SIZE*2);
            
            // Bidrag fra denne aktive bane
            levelProgressValue += weight * 100 * Math.min(1, Math.max(0, currentProgress));
        });
        
        // Begræns progress til max 100%
        this.levelProgress[this.currentLevel - 1] = Math.min(100, levelProgressValue);
        
        // Opdater UI for det aktuelle niveau og sikrer tidligere niveauer er opdateret korrekt
        this.updateUI();
    }
    
    // Opdater UI baseret på current state - med farvestyring
    updateUI() {
        console.log("Opdaterer UI med korrekt farvestyring");

        // Opdater alle niveau-barer
        for (let i = 0; i < this.maxLevels; i++) {
            const barFill = this.levelBars[i];
            const barContainer = this.progressBarContainers[i];

            // Hvis dette er det aktuelle niveau eller tidligere
            if (i < this.currentLevel) {
                // Tidligere niveauer skal vise den faktiske gennemførelsesgrad
                if (i < this.currentLevel - 1) {
                    if (barFill) {
                        // Sæt bredde baseret på faktisk fremskridt
                        barFill.style.width = `${this.levelProgress[i]}%`;

                        // Skift eksplicit farve baseret på procentdel
                        if (this.levelProgress[i] >= 100) {
                            // 100% = grøn
                            console.log(`Niveau ${i+1} er 100% - sætter til GRØN`);
                            barFill.style.background = 'linear-gradient(to right, #00ff00, #00ffaa)';
                        } else {
                            // Mindre end 100% = standard gradient
                            console.log(`Niveau ${i+1} er ${this.levelProgress[i]}% - sætter til NORMAL`);
                            barFill.style.background = 'linear-gradient(to right, #00ffff, #ff00ff)';
                        }
                    }

                    if (barContainer) {
                        barContainer.classList.add('completed');
                        barContainer.classList.remove('active');
                    }
                }
                // Nuværende niveau skal vise aktuel fremskridt
                else {
                    if (barFill) {
                        barFill.style.width = `${this.levelProgress[i]}%`;

                        // Skift eksplicit farve baseret på procentdel - også for nuværende niveau
                        if (this.levelProgress[i] >= 100) {
                            // 100% = grøn
                            console.log(`Nuværende niveau ${i+1} er 100% - sætter til GRØN`);
                            barFill.style.background = 'linear-gradient(to right, #00ff00, #00ffaa)';
                        } else {
                            // Mindre end 100% = standard gradient
                            console.log(`Nuværende niveau ${i+1} er ${this.levelProgress[i]}% - sætter til NORMAL`);
                            barFill.style.background = 'linear-gradient(to right, #00ffff, #ff00ff)';
                        }
                    }

                    if (barContainer) {
                        barContainer.classList.add('active');
                    }
                }
            }
            // Fremtidige niveauer er inaktive
            else {
                if (barFill) {
                    barFill.style.width = '0%';
                    // Sikrer standardfarve på tomme barer
                    barFill.style.background = 'linear-gradient(to right, #00ffff, #ff00ff)';
                }

                if (barContainer) {
                    barContainer.classList.remove('active', 'completed');
                }
            }
        }
    }
    
    // Nulstil fremskridt
    reset() {
        console.log("Nulstiller progression");

        this.levelProgress = [0, 0, 0, 0];
        this.currentLevel = 1;
        this.completedLevels = [false, false, false, false];

        // Nulstil UI - fjern alle active/completed klasser
        this.progressBarContainers.forEach((bar, index) => {
            bar.classList.remove('active', 'completed');

            // Sæt bar width til 0 og sikr normalfarve
            if (this.levelBars[index]) {
                this.levelBars[index].style.width = '0%';
                this.levelBars[index].style.background = 'linear-gradient(to right, #00ffff, #ff00ff)';
            }
        });

        // Sæt første niveau som aktivt
        if (this.progressBarContainers[0]) {
            this.progressBarContainers[0].classList.add('active');
        }
    }
    
    // Få samlet fremskridt til game over skærmen
    getTotalProgressForGameOver() {
        // Beregn total progress baseret på gennemførte niveauer og det aktuelle niveau
        let total = 0;
        
        // Tilføj 25% for hvert tidligere niveau der er gennemført
        for (let i = 0; i < this.currentLevel - 1; i++) {
            total += 25;
        }
        
        // Tilføj en del af det aktuelle niveau
        total += (this.levelProgress[this.currentLevel - 1] / 100) * 25;
        
        return Math.round(total);
    }
}

// Eksporter Progress Manager
window.ProgressManager = ProgressManager;







