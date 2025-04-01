// Game variables
let renderer, scene, camera;
let level = 1;
let gameOver = false;
let levelComplete = false;
let activePathway = 0;
let totalScore = 0;
let maxLevelReached = 1;
let squares = [];
let obstacles = [];
let obstacleCounts = [];
let pathways = [];
let speed;
let clock;
let activeSquare;
let gamePaused = false; // Tilføjet pause variabel
let progressManager; // Progress manager instance

// Kamera kontroller variabler
let cameraController = {
    active: true,  // Sæt til false i den endelige version
    useOrtho: false, // Skift mellem ortografisk og perspektiv
    fov: 35.0,
    posX: 0.0,
    posY: -673.2,
    posZ: 373.2,
    lookAtX: 0.0,
    lookAtY: -138.8,
    lookAtZ: 0.0,
    showUI: true,
    adjustmentSpeed: 10,
    orthoViewSize: HEIGHT * 1.5
};

// Camera map variabler
let camMapActive = false;
let camMapState = 'positions'; // 'positions' eller 'controls'

// Kamera preset positioner
const cameraPresets = {
    main: {
        fov: 35.0,
        posX: 0.0,
        posY: -673.2,
        posZ: 373.2,
        lookAtX: 0.0,
        lookAtY: -138.8,
        lookAtZ: 0.0
    },
    overhead: {
        fov: 50.0,
        posX: 0.0,
        posY: 0.0,
        posZ: 800.0,
        lookAtX: 0.0,
        lookAtY: 0.0,
        lookAtZ: 0.0
    },
    cinematic: {
        fov: 25.0,
        posX: -200.0,
        posY: -200.0,
        posZ: 120.0,
        lookAtX: 0.0,
        lookAtY: 50.0,
        lookAtZ: 0.0
    },
    closeup: {
        fov: 45.0,
        posX: 0.0,
        posY: -200.0,
        posZ: 100.0,
        lookAtX: 0.0,
        lookAtY: 0.0,
        lookAtZ: 0.0
    },
    matrix: {
        fov: 20.0,
        posX: -400.0,
        posY: -800.0,
        posZ: 100.0,
        lookAtX: 0.0,
        lookAtY: 200.0,
        lookAtZ: 0.0
    }
};

// Initialize the game
init();

function init() {
    // Create renderer with better quality settings
    renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true
    });
    renderer.setSize(WIDTH, HEIGHT);
    renderer.setClearColor(0x000000);
    renderer.shadowMap.enabled = true;
    renderer.sortObjects = true; // Tillad manuel sortering af objekter
    document.body.appendChild(renderer.domElement);
    
    // Create scene - uden fog
    scene = new THREE.Scene();
    
    // Opret kamera baseret på controller indstillinger
    if (cameraController.useOrtho) {
        // Ortografisk kamera
        const aspectRatio = WIDTH / HEIGHT;
        const viewSize = cameraController.orthoViewSize;
        camera = new THREE.OrthographicCamera(
            -aspectRatio * viewSize / 2,
            aspectRatio * viewSize / 2,
            viewSize / 2,
            -viewSize / 2,
            1,
            2000
        );
    } else {
        // Perspektiv kamera
        camera = new THREE.PerspectiveCamera(cameraController.fov, WIDTH / HEIGHT, 0.1, 2000);
    }
    
    // Sæt kameraposition og lookAt fra kontroller
    updateCameraFromController();
    
    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0x333355, 0.6);
    scene.add(ambientLight);
    
    // Add directional light
    const directionalLight = new THREE.DirectionalLight(0xaaaaff, 0.8);
    directionalLight.position.set(100, 100, 100);
    scene.add(directionalLight);
    
    // Add point lights for glow effect
    for (let i = 0; i < 4; i++) {
        const totalWidth = PATHWAY_WIDTH * 4;
        const startX = -(totalWidth / 2) + (PATHWAY_WIDTH / 2);
        
        const light = new THREE.PointLight(COLORS.cyan, 0.7, 150);
        const pathwayCenter = startX + (PATHWAY_WIDTH * i);
        light.position.set(pathwayCenter, HEIGHT/3, 20);
        scene.add(light);
    }
    
    // Add global light for improved atmosphere
    const globalLight = new THREE.SpotLight(0x5522aa, 0.3);
    globalLight.position.set(0, -100, 200);
    globalLight.angle = Math.PI / 3;
    globalLight.penumbra = 0.5;
    scene.add(globalLight);
    
    // Add subtle particle effect in background
    createBackgroundParticles();
    
    // Create clock for animation
    clock = new THREE.Clock();
    
    // Initialize pathways
    createPathways();
    
    // Start first level
    startLevel(level);

    // Initialiser progress manager
    progressManager = new ProgressManager();

    // Event listeners
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('keydown', onKeyDown);

    // Camera map event listeners
    initCameraMap();
    
    // Start animation loop
    animate();
}

// Funktion til at opdatere kamera fra kontroller
function updateCameraFromController() {
    // Sæt position og lookAt
    camera.position.set(
        cameraController.posX, 
        cameraController.posY, 
        cameraController.posZ
    );
    camera.lookAt(
        cameraController.lookAtX, 
        cameraController.lookAtY, 
        cameraController.lookAtZ
    );
    
    // Opdater FOV hvis perspektivkamera
    if (!cameraController.useOrtho && camera instanceof THREE.PerspectiveCamera) {
        camera.fov = cameraController.fov;
        camera.updateProjectionMatrix();
    }
}

// Funktion til at tegne kamera-UI
function drawCameraUI() {
    if (!cameraController.showUI) return;

    const ctx = renderer.getContext();
    const width = renderer.domElement.width;
    const height = renderer.domElement.height;

    // Gem den aktuelle tilstand
    ctx.save();

    // Tegn baggrund
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(10, 10, 300, 200);

    // Tegn tekst
    ctx.fillStyle = '#00ffff';
    ctx.font = '14px monospace';
    ctx.fillText('CAMERA CONTROLLER (H to hide)', 20, 30);
    ctx.fillText(`Type: ${cameraController.useOrtho ? 'Ortographic' : 'Perspective'} (P)`, 20, 50);
    ctx.fillText(`FOV: ${cameraController.fov.toFixed(1)} (Q/A)`, 20, 70);
    ctx.fillText(`Pos X: ${cameraController.posX.toFixed(1)} (W/S)`, 20, 90);
    ctx.fillText(`Pos Y: ${cameraController.posY.toFixed(1)} (E/D)`, 20, 110);
    ctx.fillText(`Pos Z: ${cameraController.posZ.toFixed(1)} (R/F)`, 20, 130);
    ctx.fillText(`Look Y: ${cameraController.lookAtY.toFixed(1)} (T/G)`, 20, 150);
    ctx.fillText(`Speed: ${cameraController.adjustmentSpeed} (Z/X)`, 20, 170);
    ctx.fillText('Press C to copy settings to clipboard', 20, 190);

    // Gendan den tidligere tilstand
    ctx.restore();
}

// Funktion til at tegne pause-indikator
function drawPauseIndicator() {
    const ctx = renderer.getContext();
    const width = renderer.domElement.width;
    const height = renderer.domElement.height;

    // Gem den aktuelle tilstand
    ctx.save();

    // Tegn semi-transparent baggrund
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, width, height);

    // Tegn pause-ikon
    const iconSize = 80;
    const barWidth = 20;
    const barHeight = 60;
    const spacing = 15;

    ctx.fillStyle = 'rgba(255, 0, 255, 0.8)';

    // Tegn de to pauser-linjer
    ctx.fillRect(
        width/2 - spacing - barWidth,
        height/2 - barHeight/2,
        barWidth,
        barHeight
    );

    ctx.fillRect(
        width/2 + spacing,
        height/2 - barHeight/2,
        barWidth,
        barHeight
    );

    // Tegn tekst
    ctx.fillStyle = '#00ffff';
    ctx.font = 'bold 24px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('GAME PAUSED', width/2, height/2 + 60);
    ctx.font = '16px monospace';
    ctx.fillText('Press M to resume', width/2, height/2 + 90);

    // Tegn glødende kant omkring den centrale del
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.rect(
        width/2 - iconSize/2,
        height/2 - iconSize/2,
        iconSize,
        iconSize
    );
    ctx.stroke();

    // Pulserende effekt
    const pulse = (Math.sin(clock.getElapsedTime() * 2) + 1) / 2;
    ctx.strokeStyle = `rgba(0, 255, 255, ${0.2 + pulse * 0.4})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.rect(
        width/2 - iconSize/1.5,
        height/2 - iconSize/1.5,
        iconSize*1.33,
        iconSize*1.33
    );
    ctx.stroke();

    // Gendan den tidligere tilstand
    ctx.restore();
}

function createBackgroundParticles() {
    const particlesGroup = new THREE.Group();
    scene.add(particlesGroup);
    
    // Create fewer particles for better performance
    for (let i = 0; i < 80; i++) {
        const size = Math.random() * 0.8 + 0.2;
        const geometry = new THREE.BoxGeometry(size, size, size);
        const material = new THREE.MeshBasicMaterial({
            color: Math.random() > 0.5 ? 0x2244aa : 0x6600aa,
            transparent: true,
            opacity: Math.random() * 0.3 + 0.1
        });
        const particle = new THREE.Mesh(geometry, material);
        
        // Random position in scene
        const spread = 400;
        particle.position.set(
            (Math.random() - 0.5) * spread,
            (Math.random() - 0.5) * spread,
            (Math.random() - 0.5) * spread - 200 // Push particles further back
        );
        
        // Random rotation
        particle.rotation.set(
            Math.random() * Math.PI,
            Math.random() * Math.PI,
            Math.random() * Math.PI
        );
        
        // Store original y position for animation
        particle.userData.originalY = particle.position.y;
        particle.userData.speed = Math.random() * 0.05 + 0.02;
        
        particlesGroup.add(particle);
    }
    
    // Function to animate particles
    function animateParticles() {
        particlesGroup.children.forEach(particle => {
            particle.position.y -= particle.userData.speed;
            particle.rotation.x += 0.002;
            particle.rotation.y += 0.001;
            
            // Reset position when particle goes out of view
            if (particle.position.y < -HEIGHT) {
                particle.position.y = HEIGHT;
                particle.position.x = (Math.random() - 0.5) * 400;
            }
        });
        
        requestAnimationFrame(animateParticles);
    }
    
    animateParticles();
}

function animate() {
    requestAnimationFrame(animate);

    if (!gameOver && !levelComplete && !gamePaused) {
        // Update squares
        squares.forEach(square => square.update(speed));

        // Update obstacles and check for collisions
        obstacles.forEach(obstacle => {
            obstacle.update();

            // Check for collisions
            squares.forEach(square => {
                if (square.active && obstacle.collidesWith(square)) {
                    square.active = false;
                    if (square.mesh.material) {
                        square.mesh.material.opacity = 0.3;
                    }
                    square.shadowMesh.material.opacity = 0.1;

                    // Add explosion effect
                    createExplosion(square.mesh.position.x, square.mesh.position.y);
                }

                // Fade obstacles when passed
                obstacle.fadePassed(square);
            });
        });

        // Opdater progression
        if (progressManager) {
            progressManager.updateProgress(squares);
        }

        // Check for level state
        const activeSquares = squares.filter(square => square.active);
        const completedSquares = squares.filter(square => square.completed);

        if (!activeSquares.length && !completedSquares.length) {
            gameOver = true;
            showGameOver();
        } else if (!activeSquares.length || completedSquares.length === squares.length) {
            levelComplete = true;
            showLevelComplete();
        }
    }

    // Opdater energi-spor animationer (fortsæt med visuelle effekter selv når spillet er på pause)
    updateEnergyPaths();

    // Render the scene
    renderer.render(scene, camera);

    // Tegn kamera UI efter rendering hvis aktivt
    if (cameraController.active) {
        drawCameraUI();
    }

    // Vis pause-indikator hvis spillet er på pause og map ikke er aktivt
    if (gamePaused && !camMapActive) {
        drawPauseIndicator();
    }
}

function onWindowResize() {
    const newWidth = window.innerWidth;
    const newHeight = window.innerHeight;
    
    if (cameraController.useOrtho && camera instanceof THREE.OrthographicCamera) {
        // Opdater ortografisk kamera ved resize
        const aspectRatio = newWidth / newHeight;
        const viewSize = cameraController.orthoViewSize;
        
        camera.left = -aspectRatio * viewSize / 2;
        camera.right = aspectRatio * viewSize / 2;
        camera.top = viewSize / 2;
        camera.bottom = -viewSize / 2;
    } else {
        // Opdater perspektiv kamera
        camera.aspect = newWidth / newHeight;
    }
    
    camera.updateProjectionMatrix();
    renderer.setSize(newWidth, newHeight);
}

// Camera map initialization
function initCameraMap() {
    // Get elements
    const mapRoll = document.querySelector('.map-roll');
    const mapSheets = document.querySelector('.map-sheets');
    const positionsMap = document.getElementById('positionsMap');
    const controlsMap = document.getElementById('controlsMap');
    const closeButtons = document.querySelectorAll('.map-close');
    const positions = document.querySelectorAll('.map-position');
    const showControlsBtn = document.getElementById('showControlsBtn');
    const showPositionsBtn = document.getElementById('showPositionsBtn');
    const mapPositions = document.querySelector('.map-positions');

    // Create connecting paths between camera positions
    createPositionPaths();

    // Toggle map on roll click
    mapRoll.addEventListener('click', toggleCameraMap);

    // Close buttons
    closeButtons.forEach(button => {
        button.addEventListener('click', toggleCameraMap);
    });

    // Navigation between maps
    showControlsBtn.addEventListener('click', () => {
        positionsMap.classList.add('hidden');
        controlsMap.classList.remove('hidden');
        camMapState = 'controls';
    });

    showPositionsBtn.addEventListener('click', () => {
        controlsMap.classList.add('hidden');
        positionsMap.classList.remove('hidden');
        camMapState = 'positions';
    });

    // Camera positions
    positions.forEach(position => {
        position.addEventListener('click', (e) => {
            const preset = position.getAttribute('data-position');
            setCameraPreset(preset);

            // Add click effect
            position.style.transform = 'scale(0.95)';
            setTimeout(() => {
                position.style.transform = '';
            }, 150);
        });
    });
}

// Toggle camera map visibility
function toggleCameraMap() {
    const mapRoll = document.querySelector('.map-roll');
    const mapSheets = document.querySelector('.map-sheets');
    const positionsMap = document.getElementById('positionsMap');
    const controlsMap = document.getElementById('controlsMap');

    camMapActive = !camMapActive;

    if (camMapActive) {
        mapRoll.classList.add('active');
        mapSheets.classList.add('active');

        // Sæt spillet på pause når kortvisningen aktiveres
        gamePaused = true;

        // Show the correct map based on state
        if (camMapState === 'positions') {
            positionsMap.classList.remove('hidden');
            controlsMap.classList.add('hidden');
        } else {
            controlsMap.classList.remove('hidden');
            positionsMap.classList.add('hidden');
        }
    } else {
        mapRoll.classList.remove('active');
        mapSheets.classList.remove('active');

        // Genoptag spillet når kortvisningen lukkes
        gamePaused = false;
    }
}

// Create path lines between camera positions
function createPositionPaths() {
    const mapPositions = document.querySelector('.map-positions');
    const positions = document.querySelectorAll('.map-position');

    // Define connections between positions
    const connections = [
        ['main', 'overhead'],
        ['main', 'cinematic'],
        ['main', 'closeup'],
        ['main', 'matrix'],
        ['overhead', 'closeup'],
        ['cinematic', 'matrix']
    ];

    // Create path for each connection
    connections.forEach(connection => {
        const pos1 = document.querySelector(`.map-position[data-position="${connection[0]}"]`);
        const pos2 = document.querySelector(`.map-position[data-position="${connection[1]}"]`);

        if (pos1 && pos2) {
            // Get positions
            const rect1 = pos1.getBoundingClientRect();
            const rect2 = pos2.getBoundingClientRect();
            const mapRect = mapPositions.getBoundingClientRect();

            // Calculate relative positions
            const x1 = rect1.left + rect1.width/2 - mapRect.left;
            const y1 = rect1.top + rect1.height/2 - mapRect.top;
            const x2 = rect2.left + rect2.width/2 - mapRect.left;
            const y2 = rect2.top + rect2.height/2 - mapRect.top;

            // Create line element
            const line = document.createElement('div');
            line.className = 'path-line';

            // Calculate line properties
            const length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
            const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;

            // Set line style
            line.style.width = `${length}px`;
            line.style.left = `${x1}px`;
            line.style.top = `${y1}px`;
            line.style.transform = `rotate(${angle}deg)`;
            line.style.transformOrigin = '0 0';
            line.style.width = '0'; // Start with zero width for animation

            // Add to map
            mapPositions.appendChild(line);
        }
    });
}

// Set camera to a preset position
function setCameraPreset(preset) {
    if (cameraPresets[preset]) {
        // Apply preset values
        Object.assign(cameraController, cameraPresets[preset]);

        // Update camera
        updateCameraFromController();

        // Visual feedback (compass spin or similar)
        const compass = document.querySelector('.map-compass');
        compass.style.animation = 'none';
        setTimeout(() => {
            compass.style.animation = 'compassSpin 2s ease-out';
        }, 10);
    }
}

function onKeyDown(event) {
    // Hvis kamera-kontrolsystem er aktivt, håndtér disse taster først
    if (cameraController.active) {
        const speed = cameraController.adjustmentSpeed;
        
        switch (event.key.toLowerCase()) {
            case 'h': // Vis/skjul UI
                cameraController.showUI = !cameraController.showUI;
                return; // Stop yderligere processing
            case 'p': // Skift kamera type
                cameraController.useOrtho = !cameraController.useOrtho;
                
                // Genopret kamera helt
                if (cameraController.useOrtho) {
                    const aspectRatio = WIDTH / HEIGHT;
                    const viewSize = cameraController.orthoViewSize;
                    camera = new THREE.OrthographicCamera(
                        -aspectRatio * viewSize / 2,
                        aspectRatio * viewSize / 2,
                        viewSize / 2,
                        -viewSize / 2,
                        1,
                        2000
                    );
                } else {
                    camera = new THREE.PerspectiveCamera(cameraController.fov, WIDTH / HEIGHT, 0.1, 2000);
                }
                updateCameraFromController();
                return; // Stop yderligere processing
            case 'q': // Øg FOV
                cameraController.fov += 1;
                break;
            case 'a': // Mindsk FOV
                cameraController.fov -= 1;
                break;
            case 'w': // Øg X position
                cameraController.posX += speed;
                break;
            case 's': // Mindsk X position
                cameraController.posX -= speed;
                break;
            case 'e': // Øg Y position
                cameraController.posY += speed;
                break;
            case 'd': // Mindsk Y position
                cameraController.posY -= speed;
                break;
            case 'r': // Øg Z position
                cameraController.posZ += speed;
                break;
            case 'f': // Mindsk Z position
                cameraController.posZ -= speed;
                break;
            case 't': // Øg lookAt Y
                cameraController.lookAtY += speed;
                break;
            case 'g': // Mindsk lookAt Y
                cameraController.lookAtY -= speed;
                break;
            case 'z': // Mindsk justeringshastighed
                cameraController.adjustmentSpeed = Math.max(1, cameraController.adjustmentSpeed - 1);
                break;
            case 'x': // Øg justeringshastighed
                cameraController.adjustmentSpeed += 1;
                break;
            case 'c': // Kopier indstillinger til clipboard
                let settings;
                if (cameraController.useOrtho) {
                    settings = `// Ortografisk kamera\n` +
                        `const aspectRatio = WIDTH / HEIGHT;\n` +
                        `const viewSize = ${cameraController.orthoViewSize};\n` +
                        `camera = new THREE.OrthographicCamera(\n` +
                        `    -aspectRatio * viewSize / 2,\n` +
                        `    aspectRatio * viewSize / 2,\n` +
                        `    viewSize / 2,\n` +
                        `    -viewSize / 2,\n` +
                        `    1,\n` +
                        `    2000\n` +
                        `);\n`;
                } else {
                    settings = `// Perspektiv kamera\n` +
                        `camera = new THREE.PerspectiveCamera(${cameraController.fov.toFixed(1)}, WIDTH / HEIGHT, 0.1, 2000);\n`;
                }
                settings += `camera.position.set(${cameraController.posX.toFixed(1)}, ${cameraController.posY.toFixed(1)}, ${cameraController.posZ.toFixed(1)});\n` +
                    `camera.lookAt(${cameraController.lookAtX.toFixed(1)}, ${cameraController.lookAtY.toFixed(1)}, ${cameraController.lookAtZ.toFixed(1)});`;
                
                navigator.clipboard.writeText(settings)
                    .then(() => console.log("Kameraindstillinger kopieret til clipboard"))
                    .catch(err => console.error("Kunne ikke kopiere indstillinger:", err));
                return; // Stop yderligere processing
        }
        
        // Opdater kamera efter tastaturinput
        updateCameraFromController();
        
        // Hvis vi behandlede en kamerakontrol-tast, spring over spillogikken
        if (['q', 'a', 'w', 's', 'e', 'd', 'r', 'f', 't', 'g', 'z', 'x'].includes(event.key.toLowerCase())) {
            return;
        }
    }
    
    // Check for camera map toggle
    if (event.key === 'm' || event.key === 'M') {
        toggleCameraMap();
        return; // Prevent further processing
    }

    // Håndtér oprindelig spil-logik
    if (gameOver) {
        if (event.key === 'n' || event.key === 'N') {
            restartGame();
        }
    } else if (levelComplete) {
        if (event.key === ' ') {
            nextLevel();
        }
    } else {
        switch (event.key) {
            case '1':
            case '2':
            case '3':
            case '4':
                const pathwayIndex = parseInt(event.key) - 1;
                if (pathwayIndex >= 0 && pathwayIndex < 4) {
                    activePathway = pathwayIndex;
                    activeSquare = squares[activePathway];
                    highlightPathway(activePathway);
                    if (activeSquare.active) {
                        activeSquare.pulse();
                    }
                }
                break;
            case 'ArrowLeft':
                activeSquare.move('left');
                break;
            case 'ArrowRight':
                activeSquare.move('right');
                break;
        }
    }
}






