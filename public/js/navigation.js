var navigationArrow = null;
var navigationInterval = null;

// Helper to get friendly user-facing name for navigation instructions
function getFriendlyNodeName(loc) {
    if (!loc.isRouting) {
        return loc.displayName || loc.name;
    }
    
    const name = loc.name.toLowerCase();
    if (name.includes("mod") || name === "p" || name === "l" || name === "k") {
        return "the turn";
    }
    if (name === "chauraha" || name.includes("intersection")) {
        return "the intersection";
    }
    if (name === "lift main building") {
        return "the Main Building Lift";
    }
    if (name === "main route") {
        return "the main pathway";
    }
    return "the pathway";
}

// --- VOICE & NAVIGATION LOGIC ---
function startNavigation(route) {
    if (!route || route.length < 2) return;
    stopNavigation(); // Stop any ongoing navigation

    let startPoint = locations[route[0]];
    let arrowIcon = L.divIcon({ className: 'navigation-arrow', iconSize: [32, 32] });
    navigationArrow = L.marker([startPoint.x, startPoint.y], { icon: arrowIcon, rotationAngle: 0, zIndexOffset: 1000 }).addTo(mymap);

    // Speak directions
    speakDirections(generateDirections(route));
    simulateMovement(route);
}

function stopNavigation() {
    if (navigationInterval) clearInterval(navigationInterval);
    if (navigationArrow) mymap.removeLayer(navigationArrow);
    
    // Stop any speech that is currently happening
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
    }

    navigationArrow = null;
    navigationInterval = null;
}

function simulateMovement(route) {
    let routeIndex = 0;
    let progress = 0; // Progress along the current leg of the journey (0 to 1)
    const speed = 0.015; // Controls how fast the simulation runs (slightly adjusted for smoothness)

    navigationInterval = setInterval(() => {
        if (routeIndex >= route.length - 1) {
            stopNavigation();
            return;
        }

        let p1 = locations[route[routeIndex]];
        let p2 = locations[route[routeIndex + 1]];

        // Interpolate position between p1 and p2
        let lat = p1.x + (p2.x - p1.x) * progress;
        let lng = p1.y + (p2.y - p1.y) * progress;
        
        navigationArrow.setLatLng([lat, lng]);

        // Calculate bearing and update arrow rotation
        let bearing = getBearing(p1, p2);
        navigationArrow.setRotationAngle(bearing);
        
        mymap.panTo([lat, lng]);

        progress += speed;
        if (progress >= 1) {
            progress = 0;
            routeIndex++;
        }
    }, 100); // Update every 100ms
}

function getBearing(p1, p2) {
    const lat1 = degtoRad(p1.x);
    const lon1 = degtoRad(p1.y);
    const lat2 = degtoRad(p2.x);
    const lon2 = degtoRad(p2.y);
    const y = Math.sin(lon2 - lon1) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1);
    const bearing = (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
    return bearing;
}

function generateDirections(route) {
    const directions = [];
    if (!route || route.length < 2) return ["No route."];

    const destName = locations[route[route.length - 1]].displayName || locations[route[route.length - 1]].name;
    directions.push(`Starting route to ${destName}.`);

    for (let i = 0; i < route.length - 1; i++) {
        const current = locations[route[i]];
        const next = locations[route[i + 1]];
        const distance = calcCrowDist(current.x, current.y, next.x, next.y).toFixed(0);
        
        let targetName = getFriendlyNodeName(next);
        let instruction = `In ${distance} meters, head towards ${targetName}.`;
        
        if (i < route.length - 2) {
            const afterNext = locations[route[i + 2]];
            const bearing1 = getBearing(current, next);
            const bearing2 = getBearing(next, afterNext);
            let turnAngle = bearing2 - bearing1;
            if (turnAngle > 180) turnAngle -= 360;
            if (turnAngle < -180) turnAngle += 360;

            if (turnAngle > 45) instruction += " Then, turn right.";
            else if (turnAngle < -45) instruction += " Then, turn left.";
            else if (Math.abs(turnAngle) > 20) instruction += " Then, bear slightly.";
        }
        directions.push(instruction);
    }
    directions.push(`You will arrive at your destination: ${destName}.`);
    return directions;
}

// --- VOICE ASSISTANT ---
function speakDirections(directions) {
    if ('speechSynthesis' in window) {
        const synth = window.speechSynthesis;

        if (synth.speaking) {
            synth.cancel();
        }
        
        if (synth.paused) {
            synth.resume();
        }

        directions.forEach(direction => {
            const utterance = new SpeechSynthesisUtterance(direction);
            utterance.rate = 0.95; // Slightly slower for clear instruction
            synth.speak(utterance);
        });
    } else {
        alert("Sorry, your browser does not support text-to-speech.");
    }
}
