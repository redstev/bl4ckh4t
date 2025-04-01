// Create pathway objects with visual effects
function createPathways() {
    pathways = [];
    
    // Beregn center-positionen for hele spilområdet
    const totalWidth = PATHWAY_WIDTH * 4;
    const startX = -(totalWidth / 2) + (PATHWAY_WIDTH / 2);
    
    for (let i = 0; i < 4; i++) {
        const pathwayGroup = new THREE.Group();
        
        // Create main pathway structure - mere diskret
        const pathwayGeometry = new THREE.BoxGeometry(PATHWAY_WIDTH, HEIGHT, 2);
        const pathwayMaterial = new THREE.MeshPhongMaterial({
            color: COLORS.blue,
            transparent: true,
            opacity: 0.1,
            wireframe: false,
            emissive: COLORS.blue,
            emissiveIntensity: 0.1
        });
        const pathway = new THREE.Mesh(pathwayGeometry, pathwayMaterial);
        pathwayGroup.add(pathway);
        
        // Tilføj energi-spor i stedet for lige linjer
        const laneWidth = PATHWAY_WIDTH / NUM_LANES;
        const energyPaths = [];
        
        for (let lane = 0; lane < NUM_LANES; lane++) {
            // Opret energi-spor container
            const energyPath = new THREE.Group();
            energyPath.position.set((lane - 1) * laneWidth, 0, 1);
            pathwayGroup.add(energyPath);
            
            // Opret basis-energilinje med højere z-index for at være foran forhindringer
            const baseLineGeometry = new THREE.PlaneGeometry(laneWidth * 0.3, HEIGHT);
            const baseLineMaterial = new THREE.MeshBasicMaterial({
                color: COLORS.cyan,
                transparent: true,
                opacity: 0.3,
                blending: THREE.AdditiveBlending,
                depthTest: false // Ignorér dybdetest, så energilinjen altid tegnes
            });

            const baseLine = new THREE.Mesh(baseLineGeometry, baseLineMaterial);
            baseLine.position.z = 1; // Placer foran forhindringer
            baseLine.renderOrder = 10; // Sikrer at den tegnes sidst (over forhindringer)
            energyPath.add(baseLine);
            
            // Tilføj energipulser langs sporet
            const pulseCount = 15;
            const pulses = [];
            
            for (let p = 0; p < pulseCount; p++) {
                const pulseGeometry = new THREE.PlaneGeometry(laneWidth * 0.4, 4);
                const pulseMaterial = new THREE.MeshBasicMaterial({
                    color: COLORS.cyan,
                    transparent: true,
                    opacity: 0.5,
                    blending: THREE.AdditiveBlending
                });
                
                const pulse = new THREE.Mesh(pulseGeometry, pulseMaterial);
                
                // Placer pulse tilfældigt langs banen
                const yPos = (Math.random() * HEIGHT) - HEIGHT/2;
                pulse.position.set(0, yPos, 1.1); // Høj z-værdi så den altid er foran forhindringer
                pulse.renderOrder = 12; // Høj renderOrder for at sikre den tegnes efter forhindringer
                
                // Tilføj lille variation til pulse
                const wiggleAmount = laneWidth * 0.1;
                pulse.position.x += (Math.random() * wiggleAmount * 2) - wiggleAmount;
                
                // Gem oprindelig position og animationsdata
                pulse.userData = {
                    originalY: yPos,
                    speed: Math.random() * 0.5 + 0.5,
                    wiggle: {
                        x: Math.random() * 0.05,
                        freq: Math.random() * 0.02 + 0.01
                    }
                };
                
                energyPath.add(pulse);
                pulses.push(pulse);
            }
            
            // Tilføj mere dramatiske energi-lyn effekter
            const boltCount = 3;
            const bolts = [];
            
            for (let b = 0; b < boltCount; b++) {
                // Opret lyngeometri med tilfældig form
                const points = [];
                const segmentCount = 8;
                const boltLength = HEIGHT * 0.3;
                const segmentLength = boltLength / segmentCount;
                
                for (let s = 0; s <= segmentCount; s++) {
                    const xOffset = (Math.random() * laneWidth * 0.5) - (laneWidth * 0.25);
                    const yPos = (s * segmentLength) - (boltLength / 2);
                    points.push(new THREE.Vector3(xOffset, yPos, 0.2));
                }
                
                const boltGeometry = new THREE.BufferGeometry().setFromPoints(points);
                const boltMaterial = new THREE.LineBasicMaterial({
                    color: COLORS.cyan,
                    transparent: true,
                    opacity: 0.7,
                    blending: THREE.AdditiveBlending,
                    linewidth: 2,
                    depthTest: false // Ignorér dybdetest så lyn altid tegnes
                });
                
                const bolt = new THREE.Line(boltGeometry, boltMaterial);
                
                // Placer bolt tilfældigt langs banen
                const yPos = (Math.random() * (HEIGHT * 0.6)) - (HEIGHT * 0.3);
                bolt.position.set(0, yPos, 1.2); // Høj z-værdi så den altid er foran forhindringer
                bolt.renderOrder = 11; // Høj renderOrder for at sikre den tegnes efter forhindringer
                
                // Gem animation data og bolt i userdata
                bolt.userData = {
                    originalY: yPos,
                    speed: Math.random() * 0.8 + 0.2,
                    lifespan: Math.random() * 3 + 2,
                    age: 0,
                    active: true
                };
                
                energyPath.add(bolt);
                bolts.push(bolt);
            }
            
            // Gem alle elementer til senere reference
            energyPath.userData = {
                pulses: pulses,
                bolts: bolts,
                baseLine: baseLine,
                baseLineMaterial: baseLineMaterial
            };
            
            energyPaths.push(energyPath);
        }
        
        // Tilføj energiramme rundt om banen
        const frameThickness = 1.0;
        
        // Opret ramme-materialer med depthTest: false for at sikre de altid tegnes
        const frameMaterial = new THREE.MeshBasicMaterial({
            color: COLORS.cyan,
            transparent: true,
            opacity: 0.6,
            emissive: COLORS.cyan,
            emissiveIntensity: 0.5,
            depthTest: false // Sikrer at kanterne altid tegnes uanset dybde
        });
        
        // Top kant
        const topEdgeGeometry = new THREE.BoxGeometry(PATHWAY_WIDTH + frameThickness, frameThickness, 3);
        const topEdge = new THREE.Mesh(topEdgeGeometry, frameMaterial.clone());
        topEdge.position.set(0, HEIGHT/2, 1.5); // Højere Z-værdi for at være foran forhindringer
        topEdge.renderOrder = 15; // Høj renderOrder for at sikre det tegnes sidst
        pathwayGroup.add(topEdge);
        
        // Bund kant
        const bottomEdgeGeometry = new THREE.BoxGeometry(PATHWAY_WIDTH + frameThickness, frameThickness, 3);
        const bottomEdge = new THREE.Mesh(bottomEdgeGeometry, frameMaterial.clone());
        bottomEdge.position.set(0, -HEIGHT/2, 1.5); // Højere Z-værdi for at være foran forhindringer
        bottomEdge.renderOrder = 15; // Høj renderOrder for at sikre det tegnes sidst
        pathwayGroup.add(bottomEdge);
        
        // Venstre kant
        const leftEdgeGeometry = new THREE.BoxGeometry(frameThickness, HEIGHT, 3);
        const leftEdge = new THREE.Mesh(leftEdgeGeometry, frameMaterial.clone());
        leftEdge.position.set(-PATHWAY_WIDTH/2, 0, 1.5); // Højere Z-værdi for at være foran forhindringer
        leftEdge.renderOrder = 15; // Høj renderOrder for at sikre det tegnes sidst
        pathwayGroup.add(leftEdge);
        
        // Højre kant
        const rightEdgeGeometry = new THREE.BoxGeometry(frameThickness, HEIGHT, 3);
        const rightEdge = new THREE.Mesh(rightEdgeGeometry, frameMaterial.clone());
        rightEdge.position.set(PATHWAY_WIDTH/2, 0, 1.5); // Højere Z-værdi for at være foran forhindringer
        rightEdge.renderOrder = 15; // Høj renderOrder for at sikre det tegnes sidst
        pathwayGroup.add(rightEdge);
        
        // Gem kanternes materialer og energispor til senere reference
        pathwayGroup.userData = {
            edges: [topEdge, bottomEdge, leftEdge, rightEdge],
            materials: [
                topEdge.material,
                bottomEdge.material,
                leftEdge.material,
                rightEdge.material
            ],
            energyPaths: energyPaths,
            active: false
        };
        
        // Placer pathway med jævn afstand
        pathwayGroup.position.set(startX + (PATHWAY_WIDTH * i), 0, 0);
        scene.add(pathwayGroup);
        pathways.push(pathwayGroup);
    }
}

// Animation for energi-veje
function updateEnergyPaths() {
    pathways.forEach(pathway => {
        const isActive = pathway.userData.active;
        
        pathway.userData.energyPaths.forEach(energyPath => {
            // Opdater pulser
            energyPath.userData.pulses.forEach(pulse => {
                // Bevæg pulse opad
                pulse.position.y += pulse.userData.speed;
                
                // Wiggle effekt
                pulse.position.x = Math.sin(clock.getElapsedTime() * pulse.userData.wiggle.freq * 10) * pulse.userData.wiggle.x;
                
                // Reset når den når toppen
                if (pulse.position.y > HEIGHT/2) {
                    pulse.position.y = -HEIGHT/2;
                }
                
                // Juster opacity baseret på om banen er aktiv
                pulse.material.opacity = isActive ? (0.5 + Math.sin(clock.getElapsedTime() * 2) * 0.3) : 0.3;
            });
            
            // Opdater lyn-bolts
            energyPath.userData.bolts.forEach(bolt => {
                if (bolt.userData.active) {
                    // Bevæg bolt opad
                    bolt.position.y += bolt.userData.speed;
                    
                    // Øg alder
                    bolt.userData.age += 0.016;
                    
                    // Hvis for gammel, deaktiver
                    if (bolt.userData.age > bolt.userData.lifespan) {
                        bolt.userData.active = false;
                        bolt.visible = false;
                    }
                } else {
                    // Genaktiver med tilfældig position
                    bolt.userData.age = 0;
                    bolt.userData.active = true;
                    bolt.position.y = -HEIGHT/2 + Math.random() * HEIGHT * 0.3;
                    bolt.visible = true;
                    
                    // Generer ny lynform
                    const points = [];
                    const segmentCount = 8;
                    const boltLength = HEIGHT * 0.3;
                    const segmentLength = boltLength / segmentCount;
                    const laneWidth = PATHWAY_WIDTH / NUM_LANES;
                    
                    for (let s = 0; s <= segmentCount; s++) {
                        const xOffset = (Math.random() * laneWidth * 0.5) - (laneWidth * 0.25);
                        const yPos = (s * segmentLength) - (boltLength / 2);
                        points.push(new THREE.Vector3(xOffset, yPos, 0.2));
                    }
                    
                    bolt.geometry.dispose();
                    bolt.geometry = new THREE.BufferGeometry().setFromPoints(points);
                }
                
                // Juster farve og intensitet baseret på om banen er aktiv
                const targetColor = isActive ? COLORS.magenta : COLORS.cyan;
                bolt.material.color.set(targetColor);
                bolt.material.opacity = isActive ? (0.7 + Math.sin(clock.getElapsedTime() * 3) * 0.2) : 0.4;
            });
            
            // Opdater basislinje
            if (isActive) {
                energyPath.userData.baseLineMaterial.color.set(COLORS.magenta);
                energyPath.userData.baseLineMaterial.opacity = 0.4 + Math.sin(clock.getElapsedTime() * 2) * 0.1;
            } else {
                energyPath.userData.baseLineMaterial.color.set(COLORS.cyan);
                energyPath.userData.baseLineMaterial.opacity = 0.3;
            }
        });
    });
}

// Highlight selected pathway
function highlightPathway(index) {
    pathways.forEach((pathway, i) => {
        const isActive = (i === index);
        const userData = pathway.userData;
        
        // Opdater aktiv status
        userData.active = isActive;
        
        // Animate position - subtil z-forskydning
        gsap.to(pathway.position, {
            z: isActive ? 3 : 0,
            duration: 0.3
        });
        
        // Opdater kant-farve og intensitet
        userData.materials.forEach(material => {
            if (isActive) {
                // Skift til magenta for aktiv bane
                gsap.to(material.color, {
                    r: COLORS.magenta >> 16 & 255 / 255,
                    g: COLORS.magenta >> 8 & 255 / 255,
                    b: COLORS.magenta & 255 / 255,
                    duration: 0.3
                });
                
                // Øg intensity og opacity
                gsap.to(material, {
                    opacity: 0.9,
                    emissiveIntensity: 1.0,
                    duration: 0.3
                });
            } else {
                // Reset til blå for inaktiv bane
                gsap.to(material.color, {
                    r: COLORS.cyan >> 16 & 255 / 255,
                    g: COLORS.cyan >> 8 & 255 / 255,
                    b: COLORS.cyan & 255 / 255,
                    duration: 0.3
                });
                
                // Nedsæt intensity
                gsap.to(material, {
                    opacity: 0.6,
                    emissiveIntensity: 0.5,
                    duration: 0.3
                });
            }
        });
    });
}

// Funktion til at vise lane-skifte animation
function createLaneChangeEffect(virus) {
    const effectGroup = new THREE.Group();
    scene.add(effectGroup);
    
    // Pathway center position
    const totalWidth = PATHWAY_WIDTH * 4;
    const startX = -(totalWidth / 2) + (PATHWAY_WIDTH / 2);
    const pathwayCenter = startX + (PATHWAY_WIDTH * virus.pathway);
    
    // Lane positions
    const laneWidth = PATHWAY_WIDTH / NUM_LANES;
    const oldLaneX = pathwayCenter + ((virus.lane - 1) * laneWidth);
    const newLaneX = virus.x;
    
    // Create trail between old and new position
    const trailPoints = [];
    const trailSegments = 10;
    
    for (let i = 0; i <= trailSegments; i++) {
        const progress = i / trailSegments;
        // Bueformet sti mellem punkterne
        const xPos = oldLaneX + (newLaneX - oldLaneX) * progress;
        const yPos = virus.y;
        const zPos = 14 + Math.sin(progress * Math.PI) * 3; // bue i z-retning
        
        trailPoints.push(new THREE.Vector3(xPos, yPos, zPos));
    }
    
    // Opret trail-geometri
    const trailGeometry = new THREE.BufferGeometry().setFromPoints(trailPoints);
    const trailMaterial = new THREE.LineBasicMaterial({
        color: COLORS.magenta,
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending
    });
    
    const trail = new THREE.Line(trailGeometry, trailMaterial);
    effectGroup.add(trail);
    
    // Tilføj energipartikler langs trail
    const particleCount = 15;
    const particles = [];
    
    for (let i = 0; i < particleCount; i++) {
        const particleGeometry = new THREE.SphereGeometry(0.5, 8, 8);
        const particleMaterial = new THREE.MeshBasicMaterial({
            color: COLORS.magenta,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });
        
        const particle = new THREE.Mesh(particleGeometry, particleMaterial);
        
        // Placer på tilfældig position langs trail
        const progress = Math.random();
        const trailIndex = Math.floor(progress * trailSegments);
        const p1 = trailPoints[trailIndex];
        const p2 = trailPoints[Math.min(trailIndex + 1, trailSegments)];
        
        const lerpAmount = (progress * trailSegments) - trailIndex;
        const xPos = p1.x + (p2.x - p1.x) * lerpAmount;
        const yPos = p1.y + (p2.y - p1.y) * lerpAmount;
        const zPos = p1.z + (p2.z - p1.z) * lerpAmount;
        
        particle.position.set(xPos, yPos, zPos);
        
        // Gem animationsdata
        particle.userData = {
            progress: progress,
            speed: 0.05 + Math.random() * 0.05
        };
        
        effectGroup.add(particle);
        particles.push(particle);
    }
    
    // Animer og fade ud
    const animateEffect = function() {
        // Update particle positions
        particles.forEach(particle => {
            particle.userData.progress += particle.userData.speed;
            
            if (particle.userData.progress > 1) {
                particle.userData.progress = 1;
            }
            
            const trailIndex = Math.floor(particle.userData.progress * trailSegments);
            const p1 = trailPoints[Math.min(trailIndex, trailSegments)];
            const p2 = trailPoints[Math.min(trailIndex + 1, trailSegments)];
            
            const lerpAmount = (particle.userData.progress * trailSegments) - trailIndex;
            const xPos = p1.x + (p2.x - p1.x) * lerpAmount;
            const yPos = p1.y + (p2.y - p1.y) * lerpAmount;
            const zPos = p1.z + (p2.z - p1.z) * lerpAmount;
            
            particle.position.set(xPos, yPos, zPos);
            
            // Fade ud når tæt på slutpunktet
            if (particle.userData.progress > 0.8) {
                const fade = 1 - ((particle.userData.progress - 0.8) * 5);
                particle.material.opacity = 0.8 * fade;
            }
        });
        
        // Fade trail
        trailMaterial.opacity -= 0.03;
        
        // Remove effect when faded
        if (trailMaterial.opacity <= 0) {
            effectGroup.children.forEach(child => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(m => m.dispose());
                    } else {
                        child.material.dispose();
                    }
                }
            });
            scene.remove(effectGroup);
            return;
        }
        
        requestAnimationFrame(animateEffect);
    };
    
    animateEffect();
}

// Create improved explosion effect
function createExplosion(x, y) {
    const explosionGroup = new THREE.Group();
    scene.add(explosionGroup);
    
    // Add central flash
    const flashGeometry = new THREE.SphereGeometry(5, 16, 16);
    const flashMaterial = new THREE.MeshBasicMaterial({
        color: COLORS.cyan,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
    });
    const flash = new THREE.Mesh(flashGeometry, flashMaterial);
    flash.position.set(x, y, 15);
    explosionGroup.add(flash);
    
    // Animate flash
    gsap.to(flash.scale, {
        x: 2,
        y: 2,
        z: 2,
        duration: 0.2,
        onComplete: () => {
            gsap.to(flash.scale, {
                x: 0.1,
                y: 0.1,
                z: 0.1,
                duration: 0.3
            });
            gsap.to(flashMaterial, {
                opacity: 0,
                duration: 0.3
            });
        }
    });
    
    // Create particles with improved visuals
    for (let i = 0; i < 20; i++) {
        // Use different geometries for variety
        let geometry;
        const geoType = Math.floor(Math.random() * 3);
        
        if (geoType === 0) {
            geometry = new THREE.TetrahedronGeometry(Math.random() * 2 + 1);
        } else if (geoType === 1) {
            geometry = new THREE.BoxGeometry(Math.random() * 2 + 1, Math.random() * 2 + 1, Math.random() * 2 + 1);
        } else {
            geometry = new THREE.SphereGeometry(Math.random() * 1.5 + 0.5, 4, 4);
        }
        
        // Alternate between magenta and cyan for cyberpunk effect
        const color = Math.random() > 0.5 ? COLORS.magenta : COLORS.cyan;
        
        const material = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });
        
        const particle = new THREE.Mesh(geometry, material);
        
        // Set random position within explosion radius
        particle.position.set(
            x + (Math.random() - 0.5) * 3,
            y + (Math.random() - 0.5) * 3,
            15 + (Math.random() - 0.5) * 3
        );
        
        // Set random velocity
        particle.userData.velocity = {
            x: (Math.random() - 0.5) * 3,
            y: (Math.random() - 0.5) * 3,
            z: (Math.random() - 0.5) * 3
        };
        
        explosionGroup.add(particle);
    }
    
    // Animate explosion
    const explosionUpdate = function() {
        explosionGroup.children.forEach(particle => {
            if (particle !== flash) {
                particle.position.x += particle.userData.velocity.x;
                particle.position.y += particle.userData.velocity.y;
                particle.position.z += particle.userData.velocity.z;
                
                particle.rotation.x += 0.05;
                particle.rotation.y += 0.05;
                
                particle.material.opacity -= 0.015;
            }
        });
        
        // Remove explosion when particles fade out
        if (explosionGroup.children.length > 1 && explosionGroup.children[1].material.opacity <= 0) {
            explosionGroup.children.forEach(particle => {
                if (particle.geometry) particle.geometry.dispose();
                if (particle.material) particle.material.dispose();
            });
            scene.remove(explosionGroup);
            return;
        }
        
        requestAnimationFrame(explosionUpdate);
    };
    
    explosionUpdate();
}

// Utility function to shuffle an array
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}



