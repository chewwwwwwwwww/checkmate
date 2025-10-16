/**
 * RenderEngine - Canvas-based rendering system
 * Handles all visual rendering including facilities, males, UI, and animations
 */

export class RenderEngine {
    constructor(canvas, context) {
        this.canvas = canvas;
        this.ctx = context;

        // Load skibidi image
        this.skibidiImage = new Image();
        this.skibidiImage.src = 'assets/skibidi.png';
        this.skibidiImage.onload = () => {
            console.log('Skibidi image loaded');
        };
        this.skibidiImage.onerror = () => {
            console.warn('Failed to load skibidi image');
        };

        // Load diaper life image
        this.diaperImage = new Image();
        this.diaperImage.src = 'assets/diaper-life.png';
        this.diaperImage.onload = () => {
            console.log('Diaper life image loaded');
        };
        this.diaperImage.onerror = () => {
            console.warn('Failed to load diaper life image');
        };

        // Life change animations
        this.lifeChangeAnimations = [];

        // Colors
        this.colors = {
            background: '#f5f5f5',
            urinal: {
                available: '#3498db',
                occupied: '#e74c3c',
                hover: '#2980b9',
                outOfOrder: '#95a5a6'
            },
            cubicle: {
                available: '#2ecc71',
                occupied: '#e67e22',
                hover: '#27ae60',
                outOfOrder: '#95a5a6'
            },
            male: '#34495e',
            timeBar: {
                green: '#2ecc71',
                yellow: '#f39c12',
                orange: '#e67e22',
                red: '#e74c3c'
            },
            text: '#2c3e50',
            ui: '#ecf0f1'
        };

        // Dimensions (will be updated based on screen size)
        this.isMobile = false;
        this.updateDimensions();
    }
    
    /**
     * Update dimensions based on screen size
     */
    updateDimensions() {
        this.isMobile = this.canvas.width < 600;
        this.isTablet = this.canvas.width >= 600 && this.canvas.width < 900;
        
        this.dimensions = {
            urinal: { 
                width: this.isMobile ? 30 : (this.isTablet ? 50 : 60), 
                height: this.isMobile ? 50 : (this.isTablet ? 70 : 80) 
            },
            cubicle: { 
                width: this.isMobile ? 50 : (this.isTablet ? 70 : 80), 
                height: this.isMobile ? 65 : (this.isTablet ? 85 : 100) 
            },
            male: { 
                width: this.isMobile ? 20 : (this.isTablet ? 25 : 30), 
                height: this.isMobile ? 35 : (this.isTablet ? 42 : 50) 
            },
            timeBar: { 
                width: this.isMobile ? 30 : (this.isTablet ? 35 : 40), 
                height: this.isMobile ? 6 : (this.isTablet ? 7 : 8) 
            }
        };
    }

    /**
     * Main render method
     */
    render(gameState) {
        // Update dimensions based on current canvas size
        this.updateDimensions();
        
        this.clearCanvas();

        if (gameState.status === 'playing') {
            this.renderBackground();

            // Get facilities from facility manager if available
            if (this.facilityManager) {
                const facilities = this.facilityManager.getAllFacilities();
                this.renderFacilities(facilities);
            } else if (gameState.facilities) {
                this.renderFacilities(gameState.facilities);
            }

            // Get males from male spawner if available
            if (this.facilityManager?.gameEngine?.maleSpawner) {
                const males = this.facilityManager.gameEngine.maleSpawner.getAllMales();
                this.renderMales(males);
            }
            this.renderUI(gameState);
        }
    }

    /**
     * Set facility manager reference
     */
    setFacilityManager(facilityManager) {
        this.facilityManager = facilityManager;
        // Update dimensions when facility manager is set to ensure proper initial rendering
        this.updateDimensions();
    }

    /**
     * Clear the canvas
     */
    clearCanvas() {
        this.ctx.fillStyle = this.colors.background;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * Render background elements
     */
    renderBackground() {
        const isMobile = this.canvas.width < 600;
        const queueWidth = isMobile ? 110 : 200; // Much narrower on mobile
        const urinalWallY = isMobile ? 180 : 150;
        const cubicleWallY = isMobile ? 340 : 350;

        // Draw floor tiles (alternating pattern)
        this.ctx.strokeStyle = '#bdc3c7';
        this.ctx.lineWidth = 0.5;

        const tileSize = 40;
        for (let x = 0; x < this.canvas.width; x += tileSize) {
            for (let y = 0; y < this.canvas.height; y += tileSize) {
                // Alternating tile colors
                const isEven = (Math.floor(x / tileSize) + Math.floor(y / tileSize)) % 2 === 0;
                this.ctx.fillStyle = isEven ? '#ecf0f1' : '#e8eaed';
                this.ctx.fillRect(x, y, tileSize, tileSize);
                this.ctx.strokeRect(x, y, tileSize, tileSize);
            }
        }

        // Draw wall behind urinals
        this.ctx.fillStyle = '#d5dbdb';
        this.ctx.fillRect(0, urinalWallY, this.canvas.width, 120);
        this.ctx.strokeStyle = '#95a5a6';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(0, urinalWallY, this.canvas.width, 120);

        // Draw wall behind cubicles
        this.ctx.fillStyle = '#d5dbdb';
        this.ctx.fillRect(0, cubicleWallY, this.canvas.width, 150);
        this.ctx.strokeRect(0, cubicleWallY, this.canvas.width, 150);

        // Draw section labels with background - centered relative to facilities
        const labelWidth = isMobile ? 80 : 100;
        
        // Get facility layout info from FacilityManager
        const layoutInfo = this.facilityManager?.layoutInfo;
        
        if (layoutInfo) {
            // Center labels relative to the facilities
            const urinalLabelX = layoutInfo.urinalCenterX - labelWidth / 2;
            const cubicleLabelX = layoutInfo.cubicleCenterX - labelWidth / 2;
            
            // Draw label backgrounds
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            this.ctx.fillRect(urinalLabelX, urinalWallY + 10, labelWidth, 25);
            this.ctx.fillRect(cubicleLabelX, cubicleWallY + 10, labelWidth, 25);

            this.ctx.strokeStyle = '#2c3e50';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(urinalLabelX, urinalWallY + 10, labelWidth, 25);
            this.ctx.strokeRect(cubicleLabelX, cubicleWallY + 10, labelWidth, 25);

            // Draw label text
            this.ctx.fillStyle = this.colors.text;
            this.ctx.font = isMobile ? 'bold 11px Arial' : 'bold 14px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('URINALS', layoutInfo.urinalCenterX, urinalWallY + 28);
            this.ctx.fillText('CUBICLES', layoutInfo.cubicleCenterX, cubicleWallY + 28);
        } else {
            // Fallback to fixed positions if layoutInfo not available
            const labelX = isMobile ? 140 : 80;
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            this.ctx.fillRect(labelX, urinalWallY + 10, labelWidth, 25);
            this.ctx.fillRect(labelX, cubicleWallY + 10, labelWidth, 25);

            this.ctx.strokeStyle = '#2c3e50';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(labelX, urinalWallY + 10, labelWidth, 25);
            this.ctx.strokeRect(labelX, cubicleWallY + 10, labelWidth, 25);

            this.ctx.fillStyle = this.colors.text;
            this.ctx.font = isMobile ? 'bold 11px Arial' : 'bold 14px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('URINALS', labelX + labelWidth / 2, urinalWallY + 28);
            this.ctx.fillText('CUBICLES', labelX + labelWidth / 2, cubicleWallY + 28);
        }

        // Draw waiting area (narrower on mobile)
        this.ctx.fillStyle = 'rgba(52, 152, 219, 0.1)';
        this.ctx.fillRect(20, 20, queueWidth, this.canvas.height - 40);
        this.ctx.strokeStyle = '#3498db';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        this.ctx.strokeRect(20, 20, queueWidth, this.canvas.height - 40);
        this.ctx.setLineDash([]);

        // Waiting area label
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        this.ctx.fillRect(25, 25, 80, 20);
        this.ctx.strokeStyle = '#3498db';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(25, 25, 80, 20);

        this.ctx.fillStyle = '#3498db';
        this.ctx.font = 'bold 12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('QUEUE', 65, 38);
    }

    /**
     * Render all facilities
     */
    renderFacilities(facilities) {
        if (!facilities) {
            return;
        }

        // Render urinals
        if (facilities.urinals) {
            facilities.urinals.forEach((urinal, index) => {
                this.renderUrinal(urinal, index);
            });
        }

        // Render cubicles
        if (facilities.cubicles) {
            facilities.cubicles.forEach((cubicle, index) => {
                this.renderCubicle(cubicle, index);
            });
        }
    }

    /**
     * Render a single urinal
     */
    renderUrinal(urinal, index) {
        const x = urinal.position.x;
        const y = urinal.position.y;
        const { width, height } = this.dimensions.urinal;

        // Determine color based on state
        let color = this.colors.urinal.available;
        if (urinal.outOfOrder) {
            color = this.colors.urinal.outOfOrder;
        } else if (urinal.occupied) {
            color = this.colors.urinal.occupied;
        }

        // Draw urinal base (wall-mounted style)
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x, y, width, height);

        // Draw urinal outline
        this.ctx.strokeStyle = '#2c3e50';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x, y, width, height);

        // Draw urinal bowl (inner white area)
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(x + 8, y + 15, width - 16, height - 25);
        this.ctx.strokeStyle = '#bdc3c7';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x + 8, y + 15, width - 16, height - 25);

        // Draw urinal pipe/drain
        this.ctx.fillStyle = '#7f8c8d';
        this.ctx.fillRect(x + width / 2 - 3, y + height - 15, 6, 10);

        // Draw flush handle
        this.ctx.fillStyle = '#95a5a6';
        this.ctx.fillRect(x + width - 8, y + 10, 4, 15);

        // Draw water level if occupied
        if (urinal.occupied && !urinal.outOfOrder) {
            this.ctx.fillStyle = 'rgba(52, 152, 219, 0.3)';
            this.ctx.fillRect(x + 10, y + height - 20, width - 20, 8);
        }

        // Draw index number
        this.ctx.fillStyle = this.colors.text;
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText((index + 1).toString(), x + width / 2, y + height + 20);

        // Draw out of order indicator
        if (urinal.outOfOrder) {
            this.drawSkibidiToilet(x, y, width, height);
        }

        // Draw life reward indicator
        if (urinal.hasLifeReward && !urinal.outOfOrder) {
            this.drawLifeReward(x, y, width, height);
        }
    }

    /**
     * Render a single cubicle
     */
    renderCubicle(cubicle, index) {
        const x = cubicle.position.x;
        const y = cubicle.position.y;
        const { width, height } = this.dimensions.cubicle;

        // Determine color based on state
        let color = this.colors.cubicle.available;
        if (cubicle.outOfOrder) {
            color = this.colors.cubicle.outOfOrder;
        } else if (cubicle.occupied) {
            color = this.colors.cubicle.occupied;
        }

        // Draw cubicle walls
        this.ctx.fillStyle = '#ecf0f1';
        this.ctx.fillRect(x, y, width, height);

        // Draw cubicle outline
        this.ctx.strokeStyle = '#2c3e50';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x, y, width, height);

        // Draw door with proper color
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x + 5, y + 5, width - 10, height - 10);
        this.ctx.strokeStyle = '#2c3e50';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x + 5, y + 5, width - 10, height - 10);

        // Draw door handle
        this.ctx.fillStyle = '#f39c12';
        this.ctx.beginPath();
        this.ctx.arc(x + width - 15, y + height / 2, 4, 0, 2 * Math.PI);
        this.ctx.fill();

        // Draw door hinges
        this.ctx.fillStyle = '#7f8c8d';
        this.ctx.fillRect(x + 8, y + 15, 3, 8);
        this.ctx.fillRect(x + 8, y + height - 23, 3, 8);

        // Draw toilet inside (visible through gap)
        if (!cubicle.outOfOrder) {
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillRect(x + 15, y + height - 25, 20, 15);
            this.ctx.strokeStyle = '#bdc3c7';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(x + 15, y + height - 25, 20, 15);

            // Toilet seat
            this.ctx.fillStyle = '#ecf0f1';
            this.ctx.fillRect(x + 17, y + height - 23, 16, 3);
        }

        // Draw occupancy indicator light
        const lightColor = cubicle.occupied ? '#e74c3c' : '#2ecc71';
        if (cubicle.outOfOrder) {
            this.ctx.fillStyle = '#95a5a6';
        } else {
            this.ctx.fillStyle = lightColor;
        }
        this.ctx.beginPath();
        this.ctx.arc(x + width / 2, y + 8, 3, 0, 2 * Math.PI);
        this.ctx.fill();

        // Draw index number
        this.ctx.fillStyle = this.colors.text;
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText((index + 1).toString(), x + width / 2, y + height + 20);

        // Draw out of order indicator
        if (cubicle.outOfOrder) {
            this.drawSkibidiToilet(x, y, width, height);
        }

        // Draw life reward indicator
        if (cubicle.hasLifeReward && !cubicle.outOfOrder) {
            this.drawLifeReward(x, y, width, height);
        }
    }

    /**
     * Draw life reward indicator
     */
    drawLifeReward(x, y, width, height) {
        // Draw diaper image if loaded
        if (this.diaperImage && this.diaperImage.complete) {
            const imgSize = Math.min(width, height) * 0.4;
            const imgX = x + width - imgSize - 5;
            const imgY = y + 5;

            // Glow effect
            this.ctx.shadowColor = '#2ecc71';
            this.ctx.shadowBlur = 10;
            this.ctx.drawImage(this.diaperImage, imgX, imgY, imgSize, imgSize);
            this.ctx.shadowBlur = 0;

            // +1 Life text
            this.ctx.fillStyle = '#2ecc71';
            this.ctx.font = 'bold 12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.strokeStyle = 'white';
            this.ctx.lineWidth = 3;
            this.ctx.strokeText('+1', x + width / 2, y + height - 10);
            this.ctx.fillText('+1', x + width / 2, y + height - 10);
        } else {
            // Fallback: draw a heart
            this.ctx.fillStyle = '#2ecc71';
            this.ctx.font = '20px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('❤️', x + width / 2, y + 20);

            this.ctx.font = 'bold 10px Arial';
            this.ctx.fillStyle = 'white';
            this.ctx.strokeStyle = '#2ecc71';
            this.ctx.lineWidth = 2;
            this.ctx.strokeText('+1 LIFE', x + width / 2, y + height - 10);
            this.ctx.fillText('+1 LIFE', x + width / 2, y + height - 10);
        }
    }

    /**
     * Draw skibidi toilet image for out-of-order facilities
     */
    drawSkibidiToilet(x, y, width, height) {
        // Semi-transparent red overlay
        this.ctx.fillStyle = 'rgba(231, 76, 60, 0.7)';
        this.ctx.fillRect(x, y, width, height);

        // Draw skibidi image if loaded
        if (this.skibidiImage && this.skibidiImage.complete) {
            // Center the image in the facility
            const imgSize = Math.min(width, height) * 0.8;
            const imgX = x + (width - imgSize) / 2;
            const imgY = y + (height - imgSize) / 2;

            this.ctx.drawImage(this.skibidiImage, imgX, imgY, imgSize, imgSize);
        } else {
            // Fallback text if image not loaded
            this.ctx.fillStyle = 'white';
            this.ctx.font = 'bold 10px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('OUT OF', x + width / 2, y + height / 2 - 5);
            this.ctx.fillText('ORDER', x + width / 2, y + height / 2 + 8);
        }
        
        // X mark removed - just color change and skibidi image
    }

    /**
     * Draw usage progress bar
     */
    drawUsageProgressBar(x, y, width, percentage) {
        const barHeight = 6;

        // Background
        this.ctx.fillStyle = '#ecf0f1';
        this.ctx.fillRect(x, y, width, barHeight);

        // Progress
        const progressWidth = width * percentage;
        this.ctx.fillStyle = percentage > 0.7 ? '#e74c3c' : '#f39c12';
        this.ctx.fillRect(x, y, progressWidth, barHeight);

        // Border
        this.ctx.strokeStyle = '#2c3e50';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x, y, width, barHeight);
    }

    /**
     * Render all males
     */
    renderMales(males) {
        if (!males) return;

        // Convert Map to array if needed
        const malesArray = males instanceof Map ? Array.from(males.values()) : males;

        // Only log once per second to avoid spam
        if (!this.lastMaleLogTime || Date.now() - this.lastMaleLogTime > 1000) {
            console.log('Rendering', malesArray.length, 'males');
            this.lastMaleLogTime = Date.now();
        }

        malesArray.forEach((male) => {
            if (male.state === 'waiting') {
                this.renderMale(male);
                this.renderTimeBars(male);
            } else if (male.state === 'using') {
                // Render male at facility
                this.renderMaleAtFacility(male);
            }
        });
    }

    /**
     * Render male at urinal/cubicle
     */
    renderMaleAtFacility(male) {
        if (!this.facilityManager) return;

        let facilityPosition;
        if (male.facilityType === 'urinal') {
            const urinal = this.facilityManager.urinals[male.assignedFacility];
            if (urinal) {
                // Center male in urinal
                // Stick figure is drawn with center at x, so we want the center of the facility
                const urinalWidth = this.dimensions.urinal.width;
                facilityPosition = {
                    x: urinal.position.x + urinalWidth / 2, // Center of urinal
                    y: urinal.position.y + 15 // Slightly below top
                };
            }
        } else if (male.facilityType === 'cubicle') {
            const cubicle = this.facilityManager.cubicles[male.assignedFacility];
            if (cubicle) {
                // Center male in cubicle
                // Stick figure is drawn with center at x, so we want the center of the facility
                const cubicleWidth = this.dimensions.cubicle.width;
                facilityPosition = {
                    x: cubicle.position.x + cubicleWidth / 2, // Center of cubicle
                    y: cubicle.position.y + 20 // Slightly below top
                };
            }
        }

        if (facilityPosition) {
            // Render stick figure at facility
            const x = facilityPosition.x;
            const y = facilityPosition.y;

            this.ctx.strokeStyle = '#2c3e50';
            this.ctx.fillStyle = '#2c3e50';
            this.ctx.lineWidth = 2;
            this.ctx.lineCap = 'round';

            // Head
            this.ctx.beginPath();
            this.ctx.arc(x, y, 6, 0, 2 * Math.PI);
            this.ctx.stroke();

            // Body
            this.ctx.beginPath();
            this.ctx.moveTo(x, y + 6);
            this.ctx.lineTo(x, y + 20);
            this.ctx.stroke();

            // Arms
            this.ctx.beginPath();
            this.ctx.moveTo(x - 8, y + 12);
            this.ctx.lineTo(x + 8, y + 12);
            this.ctx.stroke();

            // Legs
            this.ctx.beginPath();
            this.ctx.moveTo(x, y + 20);
            this.ctx.lineTo(x - 6, y + 30);
            this.ctx.stroke();

            this.ctx.beginPath();
            this.ctx.moveTo(x, y + 20);
            this.ctx.lineTo(x + 6, y + 30);
            this.ctx.stroke();
        }
    }

    /**
     * Render a single male (simple stick figure)
     */
    renderMale(male) {
        const isMobile = this.canvas.width < 600;
        const scale = isMobile ? 0.6 : 1.0; // 60% size on mobile
        
        const x = male.position.x + (isMobile ? 8 : 15); // Center the stick figure
        const y = male.position.y + (isMobile ? 5 : 10);

        // Set line properties for stick figure
        this.ctx.strokeStyle = '#FF0000'; // RED for debugging - make it obvious!
        this.ctx.fillStyle = '#FF0000';
        this.ctx.lineWidth = isMobile ? 3 : 4; // Thinner on mobile
        this.ctx.lineCap = 'round';

        // Head (circle)
        this.ctx.beginPath();
        this.ctx.arc(x, y, 10 * scale, 0, 2 * Math.PI);
        this.ctx.stroke();
        this.ctx.fill();

        // Body (vertical line)
        this.ctx.beginPath();
        this.ctx.moveTo(x, y + 10 * scale);
        this.ctx.lineTo(x, y + 35 * scale);
        this.ctx.stroke();

        // Arms (horizontal line)
        this.ctx.beginPath();
        this.ctx.moveTo(x - 12 * scale, y + 20 * scale);
        this.ctx.lineTo(x + 12 * scale, y + 20 * scale);
        this.ctx.stroke();

        // Legs (two lines from body to feet)
        this.ctx.beginPath();
        this.ctx.moveTo(x, y + 35 * scale);
        this.ctx.lineTo(x - 10 * scale, y + 50 * scale);
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.moveTo(x, y + 35 * scale);
        this.ctx.lineTo(x + 10 * scale, y + 50 * scale);
        this.ctx.stroke();

        // Queue number above head - scaled for mobile
        const numberWidth = isMobile ? 18 : 24;
        const numberHeight = isMobile ? 12 : 16;
        this.ctx.fillStyle = '#FFFF00'; // Yellow background
        this.ctx.fillRect(x - numberWidth/2, y - 25 * scale, numberWidth, numberHeight);
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x - numberWidth/2, y - 25 * scale, numberWidth, numberHeight);

        this.ctx.fillStyle = '#000000';
        this.ctx.font = isMobile ? 'bold 10px Arial' : 'bold 14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(male.id.toString(), x, y - 25 * scale + numberHeight/2);
    }

    /**
     * Render time bars for males (showing their patience/waiting time)
     */
    renderTimeBars(male) {
        const x = male.position.x + 5; // Center above male stick figure
        const y = male.position.y - 10; // Above the male figure
        const barWidth = 40;
        const barHeight = 8;

        const timePercentage = male.getTimePercentage();
        const color = male.getTimeBarColor();

        // Background (full bar)
        this.ctx.fillStyle = '#ecf0f1';
        this.ctx.fillRect(x, y, barWidth, barHeight);

        // Time remaining bar (shrinks as time runs out)
        const remainingWidth = barWidth * timePercentage;
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x, y, remainingWidth, barHeight);

        // Border
        this.ctx.strokeStyle = '#2c3e50';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x, y, barWidth, barHeight);

        // Time text (shows seconds remaining)
        const timeLeft = Math.ceil(male.getTimeRemaining() / 1000);
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.font = 'bold 10px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`${timeLeft}s`, x + barWidth / 2, y - 3);
    }

    /**
     * Render UI elements
     */
    renderUI(gameState) {
        const isMobile = this.canvas.width < 600;

        // Draw game info panel (taller to accommodate 2 rows of lives)
        // On mobile, position it differently to avoid overlap
        // Smaller panel on mobile to avoid overlap
        const panelWidth = isMobile ? 140 : (this.isTablet ? 170 : 190);
        const panelX = isMobile ? this.canvas.width - panelWidth - 5 : (this.isTablet ? this.canvas.width - panelWidth - 5 : this.canvas.width - 200);

        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        this.ctx.fillRect(panelX, 10, panelWidth, 185);
        this.ctx.strokeStyle = '#2c3e50';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(panelX, 10, panelWidth, 185);

        // Draw queue info
        const textX = panelX + (isMobile ? 5 : 10);
        this.ctx.fillStyle = this.colors.text;
        this.ctx.font = isMobile ? 'bold 10px Arial' : 'bold 14px Arial';
        this.ctx.textAlign = 'left';
        // Get waiting count from male spawner if available
        const waitingCount = this.facilityManager?.gameEngine?.maleSpawner?.getWaitingCount() || 0;
        this.ctx.fillText(`Waiting: ${waitingCount}`, textX, 28);
        this.ctx.fillText(`Difficulty: ${gameState.difficulty}`, textX, 46);
        this.ctx.fillText(`Spawn: ${(gameState.spawnRate / 1000).toFixed(1)}s`, textX, 64);

        // Draw lives display (with space for 2 rows)
        this.renderLivesDisplay(gameState.lives, textX, isMobile ? 85 : 100);

        // Draw instructions (moved down to accommodate 2 rows of lives)
        this.ctx.font = isMobile ? '8px Arial' : '11px Arial';
        this.ctx.fillStyle = '#7f8c8d';
        if (isMobile) {
            this.ctx.fillText('Click to assign', textX, 145);
            this.ctx.fillText('Keys: 1-5, Space', textX, 157);
        } else {
            this.ctx.fillText('Click facilities to assign', textX, 155);
            this.ctx.fillText('Keys: 1-5 for urinals, Space=pause', textX, 167);
        }

        // Draw legend (hide on mobile to save space)
        if (!isMobile) {
            const legendY = this.canvas.height - 80;
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
            this.ctx.fillRect(250, legendY, 300, 70);
            this.ctx.strokeStyle = '#2c3e50';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(250, legendY, 300, 70);

            this.ctx.fillStyle = this.colors.text;
            this.ctx.font = 'bold 12px Arial';
            this.ctx.textAlign = 'left';
            this.ctx.fillText('Legend:', 260, legendY + 15);

            // Color indicators
            this.ctx.font = '10px Arial';

            // Urinal colors
            this.ctx.fillStyle = this.colors.urinal.available;
            this.ctx.fillRect(260, legendY + 20, 12, 8);
            this.ctx.fillStyle = this.colors.text;
            this.ctx.fillText('Available Urinal', 275, legendY + 28);

            this.ctx.fillStyle = this.colors.urinal.occupied;
            this.ctx.fillRect(260, legendY + 32, 12, 8);
            this.ctx.fillStyle = this.colors.text;
            this.ctx.fillText('Occupied Urinal', 275, legendY + 40);

            // Cubicle colors
            this.ctx.fillStyle = this.colors.cubicle.available;
            this.ctx.fillRect(260, legendY + 44, 12, 8);
            this.ctx.fillStyle = this.colors.text;
            this.ctx.fillText('Available Cubicle', 275, legendY + 52);

            this.ctx.fillStyle = this.colors.cubicle.occupied;
            this.ctx.fillRect(260, legendY + 56, 12, 8);
            this.ctx.fillStyle = this.colors.text;
            this.ctx.fillText('Occupied Cubicle', 275, legendY + 64);

            // Rules
            this.ctx.fillStyle = '#e74c3c';
            this.ctx.fillText('⚠ No adjacent urinals!', 400, legendY + 28);
            this.ctx.fillStyle = '#2ecc71';
            this.ctx.fillText('✓ Urinals = +1 point', 400, legendY + 40);
            this.ctx.fillStyle = '#7f8c8d';
            this.ctx.fillText('Cubicles = no points', 400, legendY + 52);
        }
    }

    /**
     * Show game over screen
     */
    showGameOverScreen(reason, finalScore, highScore, isNewHighScore) {
        // Semi-transparent overlay
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Game over text
        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 100);

        // Reason
        this.ctx.font = '24px Arial';
        const reasonText = reason === 'timeout' ? 'Floor Accident!' : 'Adjacency Violation!';
        this.ctx.fillText(reasonText, this.canvas.width / 2, this.canvas.height / 2 - 50);

        // Score
        this.ctx.font = '32px Arial';
        this.ctx.fillText(`Final Score: ${finalScore}`, this.canvas.width / 2, this.canvas.height / 2);

        // High score
        if (isNewHighScore) {
            this.ctx.fillStyle = '#f39c12';
            this.ctx.fillText('🎉 NEW HIGH SCORE! 🎉', this.canvas.width / 2, this.canvas.height / 2 + 40);
        } else {
            this.ctx.fillStyle = '#bdc3c7';
            this.ctx.fillText(`High Score: ${highScore}`, this.canvas.width / 2, this.canvas.height / 2 + 40);
        }

        // Floor accident visual
        if (reason === 'timeout') {
            this.drawFloorAccident(this.canvas.width / 2, this.canvas.height / 2 + 100);
        }
    }

    /**
     * Draw floor accident visual (stickman with pee)
     */
    drawFloorAccident(centerX, centerY) {
        // Stickman
        this.ctx.fillStyle = '#e74c3c';

        // Head
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY - 20, 8, 0, 2 * Math.PI);
        this.ctx.fill();

        // Body
        this.ctx.fillRect(centerX - 2, centerY - 12, 4, 25);

        // Arms (raised in distress)
        this.ctx.save();
        this.ctx.translate(centerX, centerY - 5);
        this.ctx.rotate(-Math.PI / 4);
        this.ctx.fillRect(-10, -1, 8, 2);
        this.ctx.restore();

        this.ctx.save();
        this.ctx.translate(centerX, centerY - 5);
        this.ctx.rotate(Math.PI / 4);
        this.ctx.fillRect(2, -1, 8, 2);
        this.ctx.restore();

        // Legs
        this.ctx.fillRect(centerX - 4, centerY + 13, 2, 10);
        this.ctx.fillRect(centerX + 2, centerY + 13, 2, 10);

        // Puddle
        this.ctx.fillStyle = '#f1c40f';
        this.ctx.beginPath();
        this.ctx.ellipse(centerX, centerY + 30, 20, 8, 0, 0, 2 * Math.PI);
        this.ctx.fill();
    }

    /**
     * Render lives display with diaper icons
     */
    renderLivesDisplay(lives, x, y) {
        const isMobile = this.canvas.width < 600;
        
        this.ctx.fillStyle = this.colors.text;
        this.ctx.font = isMobile ? 'bold 11px Arial' : 'bold 14px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('Lives:', x, y);

        // Smaller icons and spacing on mobile
        const iconSize = isMobile ? 16 : 24;
        const iconSpacing = isMobile ? 19 : 28;
        const startX = x + (isMobile ? 35 : 45);
        const maxPerRow = isMobile ? 4 : 5; // 4 per row on mobile, 5 on desktop

        // Draw diaper icons for each life (with wrapping to second row)
        for (let i = 0; i < lives; i++) {
            const row = Math.floor(i / maxPerRow);
            const col = i % maxPerRow;
            const iconX = startX + (col * iconSpacing);
            const iconY = y - (isMobile ? 12 : 18) + (row * (isMobile ? 20 : 28)); // Adjusted spacing

            if (this.diaperImage && this.diaperImage.complete) {
                this.ctx.drawImage(this.diaperImage, iconX, iconY, iconSize, iconSize);
            } else {
                // Fallback: draw hearts
                this.ctx.fillStyle = '#e74c3c';
                this.ctx.font = isMobile ? '14px Arial' : '20px Arial';
                this.ctx.fillText('❤️', iconX, iconY + (isMobile ? 12 : 18));
            }
        }

        // Render life change animations
        this.renderLifeChangeAnimations();
    }

    /**
     * Add life change animation
     */
    addLifeChangeAnimation(change) {
        // Position in bottom-right area with lots of space
        const x = this.canvas.width - 150;
        const y = this.canvas.height - 150;

        this.lifeChangeAnimations.push({
            change: change,
            x: x,
            y: y,
            startTime: Date.now(),
            duration: 2000 // 2 seconds for better visibility
        });
    }

    /**
     * Render life change animations
     */
    renderLifeChangeAnimations() {
        const now = Date.now();

        // Filter out expired animations
        this.lifeChangeAnimations = this.lifeChangeAnimations.filter(anim => {
            const elapsed = now - anim.startTime;
            return elapsed < anim.duration;
        });

        // Render active animations
        this.lifeChangeAnimations.forEach(anim => {
            const elapsed = now - anim.startTime;
            const progress = elapsed / anim.duration;

            // Calculate position (move up/down and fade out)
            const offsetY = anim.change > 0 ? -progress * 80 : progress * 80;
            const alpha = 1 - progress;

            // Scale effect - start big, get slightly smaller
            const scale = 1 + (1 - progress) * 0.5; // Start at 1.5x, end at 1x

            // Draw text - MUCH BIGGER
            this.ctx.save();
            this.ctx.globalAlpha = alpha;
            this.ctx.font = `bold ${Math.floor(80 * scale)}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';

            if (anim.change > 0) {
                this.ctx.fillStyle = '#2ecc71';
                this.ctx.strokeStyle = 'white';
                this.ctx.lineWidth = 6;
                this.ctx.strokeText('+1', anim.x, anim.y + offsetY);
                this.ctx.fillText('+1', anim.x, anim.y + offsetY);
            } else {
                this.ctx.fillStyle = '#e74c3c';
                this.ctx.strokeStyle = 'white';
                this.ctx.lineWidth = 6;
                this.ctx.strokeText('-1', anim.x, anim.y + offsetY);
                this.ctx.fillText('-1', anim.x, anim.y + offsetY);
            }

            this.ctx.restore();
        });
    }

    /**
     * Animate facility state changes
     */
    animateFacilityState(facility) {
        // Simple pulse animation for state changes
        // This would be called when facility state changes
        const originalColor = this.ctx.fillStyle;

        // Flash effect
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.fillRect(facility.position.x, facility.position.y,
            this.dimensions[facility.type].width,
            this.dimensions[facility.type].height);

        setTimeout(() => {
            this.ctx.fillStyle = originalColor;
        }, 200);
    }

    /**
     * Get facility at coordinates (for click detection)
     */
    getFacilityAtCoordinates(x, y, facilities) {
        // Check urinals
        for (let i = 0; i < facilities.urinals.length; i++) {
            const urinal = facilities.urinals[i];
            if (this.isPointInFacility(x, y, urinal, 'urinal')) {
                return { type: 'urinal', index: i, facility: urinal };
            }
        }

        // Check cubicles
        for (let i = 0; i < facilities.cubicles.length; i++) {
            const cubicle = facilities.cubicles[i];
            if (this.isPointInFacility(x, y, cubicle, 'cubicle')) {
                return { type: 'cubicle', index: i, facility: cubicle };
            }
        }

        return null;
    }

    /**
     * Check if point is within facility bounds
     */
    isPointInFacility(x, y, facility, type) {
        const { width, height } = this.dimensions[type];
        return x >= facility.position.x &&
            x <= facility.position.x + width &&
            y >= facility.position.y &&
            y <= facility.position.y + height;
    }
}