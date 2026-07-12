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
var watchId = null;

function startNavigation(route) {
    if (!route || route.length < 2) return;
    stopNavigation(); // Stop any ongoing navigation

    let startPoint = locations[route[0]];
    let arrowIcon = L.divIcon({ className: 'navigation-arrow', iconSize: [32, 32] });
    navigationArrow = L.marker([startPoint.x, startPoint.y], { icon: arrowIcon, rotationAngle: 0, zIndexOffset: 1000 }).addTo(mymap);

    // Speak initial directions
    const directionsList = generateDirections(route);
    speakDirections(directionsList);

    // Check if GPS is available and if the user is on/near AITD Kanpur campus
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const userLat = position.coords.latitude;
                const userLng = position.coords.longitude;
                
                // Calculate distance to AITD campus center (Gate 1)
                const distToCampus = calcCrowDist(userLat, userLng, 26.49975, 80.27443);
                
                if (distToCampus < 1000) { // On/near campus (within 1km)
                    console.log("User is on AITD campus. Enabling Real-Time GPS Tracking.");
                    startGPSTracking(route);
                } else { // Testing remotely (e.g. from home)
                    console.log("User is far from campus. Starting Simulated Navigation mode.");
                    alert("You are far from the AITD Kanpur campus (testing from home/remote location). Starting Simulated Walkthrough mode...");
                    simulateMovement(route);
                }
            },
            (error) => {
                console.warn("Geolocation failed. Starting Simulated Navigation mode.", error);
                simulateMovement(route);
            },
            { enableHighAccuracy: true, timeout: 3000, maximumAge: 0 }
        );
    } else {
        simulateMovement(route);
    }
}

function stopNavigation() {
    if (navigationInterval) clearInterval(navigationInterval);
    if (watchId !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
    }
    if (navigationArrow) mymap.removeLayer(navigationArrow);
    
    // Stop any speech that is currently happening
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
    }

    navigationArrow = null;
    navigationInterval = null;
    watchId = null;
}

function startGPSTracking(route) {
    if (!navigator.geolocation) return;

    let announcedNodes = new Set();

    watchId = navigator.geolocation.watchPosition(
        (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            
            // Update GPS tracking arrow position on map
            navigationArrow.setLatLng([lat, lng]);
            mymap.panTo([lat, lng]);

            // Find closest node on route
            let closestNodeIdx = 0;
            let minNodeDist = Number.MAX_VALUE;
            
            for (let i = 0; i < route.length; i++) {
                const loc = locations[route[i]];
                const d = calcCrowDist(lat, lng, loc.x, loc.y);
                if (d < minNodeDist) {
                    minNodeDist = d;
                    closestNodeIdx = i;
                }
            }

            // Update direction bearing angle to next node
            if (closestNodeIdx < route.length - 1) {
                const nextNode = locations[route[closestNodeIdx + 1]];
                const userPos = { x: lat, y: lng };
                const bearing = getBearing(userPos, nextNode);
                navigationArrow.setRotationAngle(bearing);

                // Proximity Trigger: If user is within 6 meters of the current target node
                // Speak the instructions for the next leg of the journey
                const currentTarget = locations[route[closestNodeIdx]];
                const distToTarget = calcCrowDist(lat, lng, currentTarget.x, currentTarget.y);
                
                if (distToTarget < 6 && !announcedNodes.has(closestNodeIdx)) {
                    announcedNodes.add(closestNodeIdx);
                    const nextInstruction = `Arrived at ${getFriendlyNodeName(currentTarget)}.`;
                    speakDirections([nextInstruction]);
                }
            } else {
                // Arrived at destination
                speakDirections(["You have arrived at your destination!"]);
                stopNavigation();
            }
        },
        (error) => {
            console.error("GPS Tracking Error:", error);
        },
        {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
        }
    );
}

function simulateMovement(route) {
    let routeIndex = 0;
    let progress = 0; // Progress along the current leg of the journey (0 to 1)
    const speed = 0.015; // Controls how fast the simulation runs

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
