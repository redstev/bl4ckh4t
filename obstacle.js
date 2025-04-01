class Obstacle {
    constructor(pathway, y) {
        this.pathway = pathway;
        this.y = y - HEIGHT/2;
        this.openLane = Math.floor(Math.random() * NUM_LANES);
        this.meshes = [];
        this.warningLights = [];
        
        // Beregn center-positionen for hele spilområdet
        const totalWidth = PATHWAY_WIDTH * 4;
        const startX = -(totalWidth / 2) + (PATHWAY_WIDTH / 2);
        
        const pathwayCenter = startX + (PATHWAY_WIDTH * this.pathway);
        const laneWidth = PATHWAY_WIDTH / NUM_LANES;
        
        // Create obstacle for each blocked lane
        for (let lane = 0; lane < NUM_LANES; lane++) {
            if (lane !== this.openLane) {
                // Create main firewall structure
                const obstacleGroup = new THREE.Group();
                
                // Main firewall block - more detailed
                const obstacleGeometry = new THREE.BoxGeometry(laneWidth * 0.9, OBSTACLE_HEIGHT, 10);
                const obstacleMaterial = new THREE.MeshPhongMaterial({
                    color: COLORS.cyan,
                    emissive: COLORS.cyan,
                    emissiveIntensity: 0.4,
                    transparent: true,
                    opacity: 0.8,
                    shininess: 50
                });

                const obstacle = new THREE.Mesh(obstacleGeometry, obstacleMaterial);
                obstacle.castShadow = true;
                obstacle.renderOrder = 0; // Lavere renderOrder end energibanerne
                obstacleGroup.add(obstacle);
                
                // Add warning light on top
                const lightGeometry = new THREE.BoxGeometry(laneWidth * 0.2, OBSTACLE_HEIGHT * 0.3, 2);
                const lightMaterial = new THREE.MeshBasicMaterial({
                    color: COLORS.red,
                    transparent: true,
                    opacity: 0.9,
                    emissive: COLORS.red,
                    emissiveIntensity: 1
                });
                
                const warningLight = new THREE.Mesh(lightGeometry, lightMaterial);
                warningLight.position.set(0, OBSTACLE_HEIGHT/2 + 1, 0);
                obstacleGroup.add(warningLight);
                this.warningLights.push(warningLight);
                
                // Add firewall effect - hexagonal pattern overlay
                const hexOverlayGeometry = new THREE.PlaneGeometry(laneWidth * 0.85, OBSTACLE_HEIGHT * 0.85);
                const hexOverlayMaterial = new THREE.MeshBasicMaterial({
                    color: COLORS.white,
                    transparent: true,
                    opacity: 0.2,
                    blending: THREE.AdditiveBlending,
                    wireframe: true
                });
                
                // Make the wireframe more detailed
                hexOverlayGeometry.parameters = {
                    widthSegments: 6,
                    heightSegments: 4
                };
                
                const hexOverlay = new THREE.Mesh(hexOverlayGeometry, hexOverlayMaterial);
                hexOverlay.position.z = 5.1;
                obstacleGroup.add(hexOverlay);
                
                // Add visual "danger zone" - more subtle
                const dangerGeometry = new THREE.PlaneGeometry(laneWidth * 0.9, OBSTACLE_HEIGHT * 3);
                const dangerMaterial = new THREE.MeshBasicMaterial({
                    color: COLORS.red,
                    transparent: true,
                    opacity: 0.07,
                    blending: THREE.AdditiveBlending
                });
                const dangerZone = new THREE.Mesh(dangerGeometry, dangerMaterial);
                dangerZone.position.set(0, 0, -1);
                obstacleGroup.add(dangerZone);
                
                // Position the obstacle group
                const x = pathwayCenter + (lane - 1) * laneWidth;
                obstacleGroup.position.set(x, this.y, 5);
                scene.add(obstacleGroup);
                this.meshes.push(obstacleGroup);
                
                // Add scanning effect
                this.addScanningEffect(obstacleGroup);
            }
        }
        
        // Start warning light blinking
        this.startBlinking();
    }
    
    addScanningEffect(obstacleGroup) {
        // Create scanning line
        const scanLineGeometry = new THREE.PlaneGeometry(PATHWAY_WIDTH / NUM_LANES * 0.9, 0.5);
        const scanLineMaterial = new THREE.MeshBasicMaterial({
            color: COLORS.cyan,
            transparent: true,
            opacity: 0.7,
            blending: THREE.AdditiveBlending
        });
        
        const scanLine = new THREE.Mesh(scanLineGeometry, scanLineMaterial);
        scanLine.position.z = 5.2;
        scanLine.position.y = -OBSTACLE_HEIGHT/2;
        obstacleGroup.add(scanLine);
        
        // Animate scanning line
        const scanAnimation = () => {
            gsap.to(scanLine.position, {
                y: OBSTACLE_HEIGHT/2,
                duration: 1.5,
                ease: "power1.inOut",
                onComplete: () => {
                    gsap.to(scanLine.position, {
                        y: -OBSTACLE_HEIGHT/2,
                        duration: 1.5,
                        ease: "power1.inOut",
                        onComplete: scanAnimation
                    });
                }
            });
        };
        
        scanAnimation();
    }
    
    startBlinking() {
        // Blink warning lights
        this.warningLights.forEach(light => {
            const blinkAnimation = () => {
                gsap.to(light.material, {
                    opacity: 0.3,
                    duration: 0.5,
                    ease: "power1.inOut",
                    onComplete: () => {
                        gsap.to(light.material, {
                            opacity: 0.9,
                            duration: 0.5,
                            ease: "power1.inOut",
                            onComplete: blinkAnimation
                        });
                    }
                });
            };
            
            // Start with slight delay to desynchronize the lights
            setTimeout(blinkAnimation, Math.random() * 500);
        });
    }
    
    collidesWith(virus) {
        if (virus.pathway !== this.pathway) return false;
        
        const virusBottom = virus.y - VIRUS_SIZE/2;
        const virusTop = virus.y + VIRUS_SIZE/2;
        const obstacleBottom = this.y - OBSTACLE_HEIGHT/2;
        const obstacleTop = this.y + OBSTACLE_HEIGHT/2;
        
        if (virusBottom < obstacleTop && virusTop > obstacleBottom) {
            return virus.lane !== this.openLane;
        }
        return false;
    }
    
    update() {
        // Slightly rotate obstacles for dynamic feel
        this.meshes.forEach(mesh => {
            mesh.rotation.z = Math.sin(clock.getElapsedTime() * 2) * 0.05;
            
            // Add subtle hover effect
            mesh.position.y = this.y + Math.sin(clock.getElapsedTime() * 3 + this.pathway) * 0.3;
        });
    }
    
    fadePassed(virus) {
        if (virus.pathway === this.pathway && virus.hasPassed(this)) {
            this.meshes.forEach(meshGroup => {
                meshGroup.children.forEach(mesh => {
                    if (mesh.material) {
                        gsap.to(mesh.material, {
                            opacity: mesh.material.opacity * 0.4,
                            duration: 0.5
                        });
                    }
                });
                
                // Add passed effect - a pulse of light
                const pulseGeometry = new THREE.SphereGeometry(5, 16, 16);
                const pulseMaterial = new THREE.MeshBasicMaterial({
                    color: COLORS.green,
                    transparent: true,
                    opacity: 0.7,
                    blending: THREE.AdditiveBlending
                });
                
                const pulse = new THREE.Mesh(pulseGeometry, pulseMaterial);
                pulse.scale.set(0.1, 0.1, 0.1);
                pulse.position.z = 2;
                meshGroup.add(pulse);
                
                // Animate pulse
                gsap.to(pulse.scale, {
                    x: 1.5,
                    y: 1.5,
                    z: 1.5,
                    duration: 0.5,
                    ease: "power1.out"
                });
                
                gsap.to(pulseMaterial, {
                    opacity: 0,
                    duration: 0.5,
                    ease: "power1.out",
                    onComplete: () => {
                        meshGroup.remove(pulse);
                        pulse.geometry.dispose();
                        pulseMaterial.dispose();
                    }
                });
            });
        }
    }
    
    remove() {
        this.meshes.forEach(meshGroup => {
            // Clean up all child meshes
            while(meshGroup.children.length > 0) { 
                const child = meshGroup.children[0];
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(material => material.dispose());
                    } else {
                        child.material.dispose();
                    }
                }
                meshGroup.remove(child);
            }
            scene.remove(meshGroup);
        });
    }
}

