// Start a new level
function startLevel(levelNum) {
    // Clean up previous level
    squares.forEach(square => square.remove());
    obstacles.forEach(obstacle => obstacle.remove());

    // Set up new level
    level = levelNum;
    speed = BASE_SPEED + (level - 1) * SPEED_INCREMENT;
    levelComplete = false;

    // Create game objects
    createGameObjects();

    // Update level display
    document.getElementById('info').innerHTML = `Level ${level}: ${LEVEL_HEADLINES[level-1]}`;

    // Opdater progressbaren til at vise korrekt niveau
    if (progressManager) {
        // Vi bruger setCurrentLevel i stedet for at sikre korrekt visning
        progressManager.setCurrentLevel(level);
    }
}

// Create game objects for a level
function createGameObjects() {
    squares = [];
    obstacles = [];
    
    // Create virus squares for each pathway
    for (let i = 0; i < 4; i++) {
        squares.push(new Virus(i));
    }
    
    // Randomly assign 1, 2, 3, and 4 obstacles to pathways
    obstacleCounts = [1, 2, 3, 4];
    shuffleArray(obstacleCounts);
    
    for (let pathway = 0; pathway < 4; pathway++) {
        const numObstacles = obstacleCounts[pathway];
        for (let i = 0; i < numObstacles; i++) {
            const y = PLAYABLE_HEIGHT * (i + 1) / (numObstacles + 1);
            obstacles.push(new Obstacle(pathway, y));
        }
    }
    
    activeSquare = squares[0];
    activePathway = 0;
    highlightPathway(activePathway);
}

// Calculate score for a level
function calculateScore(squares, obstacleCounts) {
    const totalWeight = obstacleCounts.reduce((sum, count) => sum + count, 0);
    const score = squares
        .filter(square => square.completed)
        .reduce((sum, square) => sum + obstacleCounts[square.pathway], 0);
    
    return (score / totalWeight) * 100;
}

// Show game over screen
function showGameOver() {
    const damageIsMassive = (level === MAX_LEVEL) && squares.some(square => square.completed);

    document.getElementById('gameOverTitle').innerText = damageIsMassive ? 'HACK OVER' : 'GAME OVER';

    // Vis kun procent hvis vi har gennemført alle levels (HACK OVER)
    if (damageIsMassive) {
        const finalScore = totalScore / MAX_LEVEL;
        document.getElementById('finalScore').innerText = `Virus ${finalScore.toFixed(2)}% completed`;
        document.getElementById('damageText').innerText = 'Damage is massive!';
    } else {
        // Ved almindeligt GAME OVER skal der ikke vises nogen procent
        document.getElementById('finalScore').innerText = '';
        document.getElementById('damageText').innerText = '';
    }

    document.getElementById('gameOver').style.display = 'flex';
}

// Show level complete screen
function showLevelComplete() {
    const levelScore = calculateScore(squares, obstacleCounts);
    totalScore += levelScore;
    const completedPathways = squares.filter(square => square.completed).length;
    
    document.getElementById('levelCompleteTitle').innerText = 
        level < MAX_LEVEL ? `Level ${level} Complete!` : 'All Levels Complete!';
    document.getElementById('levelScore').innerText = `Level Score: ${levelScore.toFixed(2)}%`;
    
    // Show completed subheadlines
    const completedActionsDiv = document.getElementById('completedActions');
    completedActionsDiv.innerHTML = '';
    
    const completedSquares = squares.filter(square => square.completed);
    for (let i = 0; i < completedSquares.length; i++) {
        const pathwayIndex = completedSquares[i].pathway;
        const action = LEVEL_SUBHEADLINES[level-1][pathwayIndex];
        const actionDiv = document.createElement('div');
        actionDiv.className = 'subheadline';
        actionDiv.innerText = action;
        completedActionsDiv.appendChild(actionDiv);
    }
    
    document.getElementById('levelComplete').style.display = 'flex';
    maxLevelReached = Math.max(maxLevelReached, level);
}

// Move to next level
function nextLevel() {
    document.getElementById('levelComplete').style.display = 'none';
    
    if (level < MAX_LEVEL) {
        startLevel(level + 1);
    } else {
        // Game completed, show game over with final stats
        gameOver = true;
        const damageIsMassive = squares.some(square => square.completed);
        showGameOver();
    }
}

// Restart game
function restartGame() {
    document.getElementById('gameOver').style.display = 'none';
    level = 1;
    totalScore = 0;
    maxLevelReached = 1;
    gameOver = false;
    startLevel(1);
}







