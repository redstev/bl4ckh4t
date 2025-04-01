class Virus {
    constructor(pathway) {
        this.pathway = pathway;
        this.lane = 1; // Start i midterste lane
        this.y = -HEIGHT/2 + VIRUS_SIZE + 10;
        this.active = true;
        this.completed = false;
        this.mesh = null;
        this.energyField = null;
        this.glow = null;
        this.pulseInterval = null;
        this.oldLane = 1; // Gem tidligere lane position til animations brug
        this.spheres = []; // Array til at gemme virus-sfærer
        
        // Tilfældig startrotation - simpelt men effektivt
        this.rotationOffset = Math.random() * Math.PI * 2;
        
        // Tilfældigt pulseringsinterval
        this.pulseDelay = 1500 + Math.floor(Math.random() * 1000);
        
        // Beregn x position
        this.updateX();
        
        // Opret virus 3D model
        this.createVirusModel();
        
        // Tilføj energifelt under virus
        this.createEnergyField();
        
        // Start pulsing animation med unik timing
        this.startPulsingAnimation();
    }
    
    createVirusModel() {
        // Opret hovedgruppe for virusset
        this.mesh = new THREE.Group();
        this.mesh.position.set(this.x, this.y, 15);
        this.mesh.rotation.y = this.rotationOffset; // Start med tilfældig rotation
        scene.add(this.mesh);
        
        // Start kontinuerlig rotation af hele virusset
        gsap.to(this.mesh.rotation, {
            y: this.rotationOffset + Math.PI * 2,
            duration: 12,
            repeat: -1,
            ease: "none"
        });
        
        // Vælg farvevariant - stadig magenta og cyan, men med små variationer
        const colorOptions = [
            COLORS.magenta, // Standard magenta
            new THREE.Color(0xff00dd), // Lidt lysere magenta
            COLORS.cyan,    // Standard cyan
            new THREE.Color(0x00ddff)  // Lidt lysere cyan
        ];
        
        const baseColor = colorOptions[Math.floor(Math.random() * colorOptions.length)];
        
        // Opret central lysende kerne
        const coreGeometry = new THREE.IcosahedronGeometry(VIRUS_SIZE * 0.3, 1);
        const coreMaterial = new THREE.MeshPhongMaterial({
            color: baseColor,
            emissive: baseColor,
            emissiveIntensity: 0.8,
            shininess: 60
        });
        
        this.core = new THREE.Mesh(coreGeometry, coreMaterial);
        this.mesh.add(this.core);
        
        // Tilføj modsatrettet rotation til kernen
        gsap.to(this.core.rotation, {
            y: -Math.PI * 2,
            x: Math.PI,
            duration: 20,
            repeat: -1,
            ease: "none"
        });
        
        // Tilføj sfærer med forbindelsesstænger til kernen
        const sphereCount = 8;
        
        for (let i = 0; i < sphereCount; i++) {
            // Beregn position på sfære med jævn fordeling
            const phi = Math.acos(-1 + (2 * i) / sphereCount);
            const theta = Math.sqrt(sphereCount * Math.PI) * phi;
            
            // Konverter sfæriske til kartesiske koordinater
            const x = Math.sin(phi) * Math.cos(theta);
            const y = Math.sin(phi) * Math.sin(theta);
            const z = Math.cos(phi);
            
            // Radius for sfæren (afstand fra centrum)
            const radius = VIRUS_SIZE * 0.7;
            
            // Opret sfæren - samme farve som kernen for konsistens
            const sphereSize = VIRUS_SIZE * 0.16;
            const sphereGeometry = new THREE.SphereGeometry(sphereSize, 10, 10);
            
            // Subtil farvemæssig variation - mest samme farve med små variationer
            const useDifferentColor = Math.random() < 0.3; // 30% chance for anden farve
            const sphereColor = useDifferentColor ? 
                colorOptions[Math.floor(Math.random() * colorOptions.length)] : baseColor;
            
            const sphereMaterial = new THREE.MeshPhongMaterial({
                color: sphereColor,
                emissive: sphereColor,
                emissiveIntensity: 0.5,
                transparent: true,
                opacity: 0.9,
                shininess: 40
            });
            
            const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
            
            // Placer sfæren
            sphere.position.set(
                x * radius,
                y * radius,
                z * radius
            );
            
            // Opret forbindelsesstang mellem kerne og sfære
            const spikeGeometry = new THREE.CylinderGeometry(VIRUS_SIZE * 0.03, VIRUS_SIZE * 0.03, radius * 0.7, 6);
            const spikeMaterial = new THREE.MeshPhongMaterial({
                color: sphereColor,
                emissive: sphereColor,
                emissiveIntensity: 0.3,
                transparent: true,
                opacity: 0.8
            });
            
            const spike = new THREE.Mesh(spikeGeometry, spikeMaterial);
            
            // Placer og orienter stangen mellem kerne og sfære
            spike.position.set(
                x * radius * 0.4,
                y * radius * 0.4,
                z * radius * 0.4
            );
            
            // Få stangen til at pege mod sfæren
            spike.lookAt(sphere.position);
            
            // Tilføj til virusset
            this.mesh.add(spike);
            this.mesh.add(sphere);
            
            // Gem reference til sfæren
            this.spheres.push({
                sphere: sphere,
                spike: spike,
                basePosition: new THREE.Vector3(x * radius, y * radius, z * radius),
                pulseSpeed: 0.5 + Math.random() * 0.5,
                color: sphereColor
            });
        }
        
        // Tilføj en ydre glød
        const glowGeometry = new THREE.SphereGeometry(VIRUS_SIZE * 1.1, 20, 20);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: baseColor,
            transparent: true,
            opacity: 0.15,
            blending: THREE.AdditiveBlending,
            side: THREE.BackSide
        });
        this.glow = new THREE.Mesh(glowGeometry, glowMaterial);
        this.mesh.add(this.glow);
    }
    
    createEnergyField() {
        // TILBAGE TIL ORIGINAL IMPLEMENTATION uden eksperimenter
        this.energyField = new THREE.Group();
        scene.add(this.energyField);
        
        // Energipulse disk
        const discGeometry = new THREE.CircleGeometry(VIRUS_SIZE * 0.8, 16);
        const discMaterial = new THREE.MeshBasicMaterial({
            color: COLORS.magenta,
            transparent: true,
            opacity: 0.4,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide,
            depthTest: false
        });
        
        this.energyDisc = new THREE.Mesh(discGeometry, discMaterial);
        this.energyDisc.rotation.x = -Math.PI / 2; // Læg fladt
        this.energyDisc.position.set(this.x, this.y - VIRUS_SIZE/2 - 0.5, 10);
        this.energyField.add(this.energyDisc);
        
        // Tilføj indre energiring
        const ringGeometry = new THREE.RingGeometry(VIRUS_SIZE * 0.4, VIRUS_SIZE * 0.5, 16);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: COLORS.magenta,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide,
            depthTest: false
        });
        
        this.energyRing = new THREE.Mesh(ringGeometry, ringMaterial);
        this.energyRing.rotation.x = -Math.PI / 2;
        // Start fra tilfældig rotation, men ellers som original
        this.energyRing.rotation.z = Math.random() * Math.PI * 2;
        this.energyRing.position.set(this.x, this.y - VIRUS_SIZE/2 - 0.4, 10);
        this.energyField.add(this.energyRing);
        
        // Animér ringen
        gsap.to(this.energyRing.rotation, {
            z: this.energyRing.rotation.z + Math.PI * 2,
            duration: 4,
            repeat: -1,
            ease: "none"
        });
    }
    
    startPulsingAnimation() {
        // Start med tilfældig forsinkelse for at undgå synkron pulsering
        setTimeout(() => {
            this.pulseInterval = setInterval(() => {
                if (!this.active) return;
                
                // Puls animation for virus - standard implementation
                gsap.to(this.mesh.scale, {
                    x: 1.1,
                    y: 1.1,
                    z: 1.1,
                    duration: 0.5,
                    ease: "power1.inOut",
                    onComplete: () => {
                        gsap.to(this.mesh.scale, {
                            x: 1.0,
                            y: 1.0,
                            z: 1.0,
                            duration: 0.5,
                            ease: "power1.inOut"
                        });
                    }
                });
                
                // Pulse energy field too
                gsap.to(this.energyDisc.scale, {
                    x: 1.2,
                    y: 1.2,
                    z: 1.0,
                    duration: 0.7,
                    ease: "power1.inOut",
                    yoyo: true,
                    repeat: 1
                });
                
                // Pulsing glow also
                gsap.to(this.glow.material, {
                    opacity: 0.3,
                    duration: 0.5,
                    ease: "power1.inOut",
                    onComplete: () => {
                        gsap.to(this.glow.material, {
                            opacity: 0.15,
                            duration: 0.5,
                            ease: "power1.inOut"
                        });
                    }
                });
                
            }, this.pulseDelay); // Individuelt interval for hvert virus
        }, Math.random() * 1000); // Initial delay
    }
    
    updateX() {
        // Gem tidligere lane før opdatering
        this.oldLane = this.lane;
        
        // Beregn center-positionen for hele spilområdet
        const totalWidth = PATHWAY_WIDTH * 4;
        const startX = -(totalWidth / 2) + (PATHWAY_WIDTH / 2);
        
        const pathwayCenter = startX + (PATHWAY_WIDTH * this.pathway);
        const laneWidth = PATHWAY_WIDTH / NUM_LANES;
        this.x = pathwayCenter + (this.lane - 1) * laneWidth;
    }
    
    move(direction) {
        if (!this.active) return;
        
        // Gem tidligere position før bevægelse
        const oldX = this.x;
        
        if (direction === 'left' && this.lane > 0) {
            this.lane -= 1;
        } else if (direction === 'right' && this.lane < NUM_LANES - 1) {
            this.lane += 1;
        }
        
        // Hvis lane er ændret, opret lane-skifte effekt
        if (this.lane !== this.oldLane) {
            this.updateX();
            
            // Opret lane-skifte effekt hvis funktionen findes
            if (typeof createLaneChangeEffect === 'function') {
                createLaneChangeEffect(this);
            }
            
            // Stop igangværende animationer
            gsap.killTweensOf(this.mesh.position);
            gsap.killTweensOf(this.mesh.scale);
            gsap.killTweensOf(this.energyDisc.position);
            gsap.killTweensOf(this.energyRing.position);
            
            // Animer bevægelsen med en bue-effekt
            gsap.to(this.mesh.position, {
                x: this.x,
                z: 15 + 6, // Hop højere op
                duration: 0.2,
                ease: "power1.out",
                onComplete: () => {
                    gsap.to(this.mesh.position, {
                        z: 15, // Fald tilbage til normal højde
                        duration: 0.15,
                        ease: "power1.in"
                    });
                }
            });
            
            // Opdater energifelt position
            gsap.to(this.energyDisc.position, {
                x: this.x,
                duration: 0.2
            });
            
            gsap.to(this.energyRing.position, {
                x: this.x,
                duration: 0.2
            });
            
            // Gør virus lidt større ved lane skift for ekstra feedback
            gsap.to(this.mesh.scale, {
                x: 1.3,
                y: 1.3,
                z: 1.3,
                duration: 0.1,
                onComplete: () => {
                    gsap.to(this.mesh.scale, {
                        x: 1.0,
                        y: 1.0,
                        z: 1.0,
                        duration: 0.2
                    });
                }
            });
            
            // Få sfærerne til at reagere på bevægelsen
            this.spheres.forEach((sphereData) => {
                const origPos = sphereData.basePosition.clone();
                
                // Stop eventuelle igangværende animationer
                gsap.killTweensOf(sphereData.sphere.position);
                
                // Stretch effekt i retning af bevægelsen
                const moveDirection = (this.lane > this.oldLane) ? 1 : -1;
                
                gsap.to(sphereData.sphere.position, {
                    x: origPos.x - moveDirection * VIRUS_SIZE * 0.2,
                    duration: 0.2,
                    onComplete: () => {
                        gsap.to(sphereData.sphere.position, {
                            x: origPos.x,
                            duration: 0.3,
                            ease: "elastic.out(1.5, 0.3)"
                        });
                    }
                });
            });
        }
    }
    
    update(speed) {
        if (this.active) {
            this.y += speed;
            
            // Opdater virus position
            this.mesh.position.y = this.y;
            
            // Opdater energifelt position - DIREKTE som i original
            this.energyDisc.position.y = this.y - VIRUS_SIZE/2 - 0.5;
            this.energyRing.position.y = this.y - VIRUS_SIZE/2 - 0.4;
            
            // Check if virus has reached the top
            if (this.y > HEIGHT/2) {
                this.completed = true;
                this.active = false;
                
                // Skift til grøn når gennemført
                this.core.material.color.set(COLORS.green);
                this.core.material.emissive.set(COLORS.green);
                
                this.spheres.forEach(data => {
                    data.sphere.material.color.set(COLORS.green);
                    data.sphere.material.emissive.set(COLORS.green);
                    data.spike.material.color.set(COLORS.green);
                    data.spike.material.emissive.set(COLORS.green);
                });
                
                this.glow.material.color.set(COLORS.green);
                this.energyDisc.material.color.set(COLORS.green);
                this.energyRing.material.color.set(COLORS.green);
                
                // Stop pulsing animation
                clearInterval(this.pulseInterval);
            }
        }
    }
    
    pulse() {
        // Extra pulse animation
        gsap.to(this.glow.scale, {
            x: 1.5,
            y: 1.5,
            z: 1.5,
            duration: 0.5,
            yoyo: true,
            repeat: 1
        });
        
        // Add extra pulse to the virus core
        gsap.to(this.mesh.scale, {
            x: 1.3,
            y: 1.3, 
            z: 1.3,
            duration: 0.3,
            yoyo: true,
            repeat: 1
        });
        
        // Pulse energy field too
        gsap.to([this.energyDisc.scale, this.energyRing.scale], {
            x: 1.5,
            y: 1.5,
            duration: 0.3,
            yoyo: true,
            repeat: 1
        });
        
        // Ekstra puls for alle sfærer
        this.spheres.forEach(data => {
            const sphere = data.sphere;
            const origPos = data.basePosition.clone();
            
            gsap.killTweensOf(sphere.scale);
            gsap.killTweensOf(sphere.position);
            
            // Forstør sfæren midlertidigt
            gsap.to(sphere.scale, {
                x: 1.4,
                y: 1.4,
                z: 1.4,
                duration: 0.2,
                onComplete: () => {
                    gsap.to(sphere.scale, {
                        x: 1.0,
                        y: 1.0,
                        z: 1.0,
                        duration: 0.3
                    });
                }
            });
            
            // Bevæg sfæren længere ud og tilbage igen
            gsap.to(sphere.position, {
                x: origPos.x * 1.2,
                y: origPos.y * 1.2,
                z: origPos.z * 1.2,
                duration: 0.25,
                onComplete: () => {
                    gsap.to(sphere.position, {
                        x: origPos.x,
                        y: origPos.y,
                        z: origPos.z,
                        duration: 0.35,
                        ease: "elastic.out(1.5, 0.5)"
                    });
                }
            });
        });
    }
    
    updateEnergyFieldColor(isActivePathway) {
        // Opdater farve baseret på om banen er aktiv
        const targetColor = isActivePathway ? COLORS.magenta : COLORS.cyan;
        
        // Opdater energifelt
        this.energyDisc.material.color.set(targetColor);
        this.energyRing.material.color.set(targetColor);
    }
    
    hasPassed(obstacle) {
        return this.y > obstacle.y + OBSTACLE_HEIGHT/2;
    }
    
    remove() {
        clearInterval(this.pulseInterval);
        
        // Stop alle GSAP animationer
        gsap.killTweensOf(this.mesh.position);
        gsap.killTweensOf(this.mesh.scale);
        gsap.killTweensOf(this.mesh.rotation);
        gsap.killTweensOf(this.core.rotation);
        gsap.killTweensOf(this.glow.scale);
        gsap.killTweensOf(this.glow.material);
        gsap.killTweensOf(this.energyDisc.scale);
        gsap.killTweensOf(this.energyRing.scale);
        gsap.killTweensOf(this.energyDisc.position);
        gsap.killTweensOf(this.energyRing.position);
        gsap.killTweensOf(this.energyRing.rotation);
        
        this.spheres.forEach(data => {
            gsap.killTweensOf(data.sphere.position);
            gsap.killTweensOf(data.sphere.scale);
            gsap.killTweensOf(data.spike.position);
            gsap.killTweensOf(data.spike.scale);
        });
        
        // VIGTIGT: Fjern fra scenen
        scene.remove(this.mesh);
        scene.remove(this.energyField);
    }
}







