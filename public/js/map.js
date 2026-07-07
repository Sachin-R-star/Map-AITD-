// --- MAP INITIALIZATION ---
let lat = 26.49975, long = 80.27443;
let zoomLevel = 17;
let mymap = L.map('mapid', {
    zoomControl: false
}).setView([lat, long], zoomLevel);

// Add zoom control to bottom right
L.control.zoom({
    position: 'bottomright'
}).addTo(mymap);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
}).addTo(mymap);

// --- GLOBAL VARIABLES ---
var distMat = [];
var currentRoute = null;
var polyline, markers = [];
var sourceIndex = -1;
var destIndex = -1;

// --- DATA PROCESSING ---
(function buildDistanceMatrix() {
    for (var i = 0; i < locations.length; i++) {
        locations[i].index = i;
        var distanceMatrixForEachPlace = [];
        for (var j = 0; j < locations.length; j++) {
            if (locations[i].children.indexOf(locations[j].name) > -1) {
                distanceMatrixForEachPlace[j] = calcCrowDist(locations[i].x, locations[i].y, locations[j].x, locations[j].y);
            } else {
                distanceMatrixForEachPlace[j] = Number.MAX_VALUE;
            }
        }
        distMat.push(distanceMatrixForEachPlace);
    }
})();

// --- MAP DISPLAY FUNCTIONS ---
function clearAll() {
    stopNavigation();
    if (polyline) mymap.removeLayer(polyline);
    if (markers.length > 0) {
        for (var marker of markers) mymap.removeLayer(marker);
    }
    markers = [];
    currentRoute = null;
    document.getElementById("routeInfo").classList.add("closed");
    document.getElementById("sourceInput").value = "";
    document.getElementById("destInput").value = "";
    sourceIndex = -1;
    destIndex = -1;
}

function addLinesAndMarkers(route) {
    // Clear previous items
    if (polyline) mymap.removeLayer(polyline);
    if (markers.length > 0) {
        for (var marker of markers) mymap.removeLayer(marker);
    }
    markers = [];
    
    currentRoute = route;
    var latlong = [];
    var dist = 0;

    if (!route) {
        alert("No route found between these two locations.");
        return;
    }

    for (var i = 0; i < route.length; i++) {
        var nodeIndex = route[i];
        var loc = locations[nodeIndex];
        var X = loc.x;
        var Y = loc.y;
        var label = loc.displayName || loc.name;

        if (i < route.length - 1) {
            dist += distMat[nodeIndex][route[i + 1]];
        }
        
        // Only draw markers at the start and end of the route for a clean design
        if (i === 0) {
            var startIcon = L.divIcon({ className: "custom-start-marker", iconSize: [24, 24] });
            var marker = L.marker([X, Y], { icon: startIcon }).addTo(mymap);
            marker.bindPopup(`<b>Start:</b> ${label}`);
            markers.push(marker);
        } else if (i === route.length - 1) {
            var endIcon = L.divIcon({ className: "custom-end-marker", iconSize: [24, 24] });
            var marker = L.marker([X, Y], { icon: endIcon }).addTo(mymap);
            marker.bindPopup(`<b>Destination:</b> ${label}`);
            markers.push(marker);
        }
        
        latlong.push([X, Y]);
    }

    let distText = Math.floor(dist) < 1000 ? `${Math.floor(dist)} m` : `${(dist / 1000).toFixed(1)} km`;
    let eta = Math.ceil(dist / 80); // 80 meters per minute walking speed
    let etaText = `${eta} min walk`;

    // Modern indigo route line
    polyline = L.polyline(latlong, { color: "#6366f1", weight: 6, opacity: 0.9, lineJoin: 'round' }).addTo(mymap);
    mymap.flyToBounds(L.latLngBounds(latlong), { padding: [50, 50], maxZoom: 18 });

    document.getElementById("details").innerHTML = `Route:`;
    document.getElementById("distance").innerHTML = distText;
    document.getElementById("eta").innerHTML = etaText;

    const directions = generateDirections(route);
    document.getElementById("directions").innerHTML = directions.map(d => {
        let icon = "🚶"; // default
        if (d.includes("Starting")) icon = "🏁";
        else if (d.includes("arrive") || d.includes("destination")) icon = "📍";
        else if (d.includes("turn right")) icon = "➡️";
        else if (d.includes("turn left")) icon = "⬅️";
        
        return `<div><span style="font-size: 1.1em; line-height: 1;">${icon}</span> <span>${d}</span></div>`;
    }).join("");

    document.getElementById("routeInfo").classList.remove("closed");
}

// --- ROUTING ALGORITHM (BELLMAN-FORD) ---
function bellmanFord(src, dest) {
    if (src == -1 || dest == -1 || src == dest) {
        alert("Please select a valid source and destination.");
        return;
    }

    var n = distMat.length;
    var dp = new Array(n).fill(Number.MAX_VALUE);
    var nextNode = new Array(n);
    dp[dest] = 0;

    // Relax edges repeatedly
    for (var i = 1; i < n; i++) {
        for (var u = 0; u < n; u++) {
            for (var v = 0; v < n; v++) {
                if (distMat[u][v] !== Number.MAX_VALUE && dp[v] !== Number.MAX_VALUE && dp[v] + distMat[u][v] < dp[u]) {
                    dp[u] = dp[v] + distMat[u][v];
                    nextNode[u] = v;
                }
            }
        }
    }

    // Reconstruct path
    if (dp[src] === Number.MAX_VALUE) {
        addLinesAndMarkers(null); // No path exists
        return;
    }

    let route = [];
    let curr = parseInt(src);
    while (curr !== dest) {
        route.push(curr);
        curr = nextNode[curr];
        if (curr === undefined || route.length > n) { // Path reconstruction failed or cycle detected
            addLinesAndMarkers(null);
            return;
        }
    }
    route.push(dest);
    addLinesAndMarkers(route);
}

// --- EVENT LISTENERS ---
document.getElementById("searchBtn").addEventListener("click", () => bellmanFord(sourceIndex, destIndex));
document.getElementById("clearBtn").addEventListener("click", clearAll);
document.getElementById("startNav").addEventListener("click", () => startNavigation(currentRoute));

// --- AUTOCOMPLETE UI ---
function autocomplete(inp, arr) {
    var currentFocus;
    inp.addEventListener("input", function() {
        var val = this.value.trim().toLowerCase();
        closeAllLists();
        if (!val) return;
        currentFocus = -1;
        
        var suggestions = document.createElement("DIV");
        suggestions.id = this.id + "autocomplete-list";
        suggestions.className = "autocomplete-items";
        this.parentNode.appendChild(suggestions);

        for (let i = 0; i < arr.length; i++) {
            let loc = arr[i];
            // Skip routing nodes in search suggestions
            if (loc.isRouting) continue;

            let name = loc.name.toLowerCase();
            let displayName = (loc.displayName || loc.name).toLowerCase();
            let category = (loc.category || "").toLowerCase();
            let tags = loc.tags || [];

            // Perform deep match checking
            let isMatch = displayName.includes(val) || 
                          name.includes(val) || 
                          category.includes(val) || 
                          tags.some(tag => tag.toLowerCase().includes(val));

            if (isMatch) {
                let entry = document.createElement("DIV");
                let disp = loc.displayName || loc.name;
                let icon = loc.icon || "📍";
                let catClass = `category-badge-${loc.category || "facilities"}`;
                let catLabel = loc.category ? loc.category.charAt(0).toUpperCase() + loc.category.slice(1) : "Facility";

                // Highlight exact matches
                let regex = new RegExp(`(${escapeRegExp(val)})`, "gi");
                let highlighted = disp.replace(regex, "<strong>$1</strong>");

                entry.innerHTML = `<span>${icon}</span> <span>${highlighted}</span>`;
                entry.innerHTML += `<span class="suggestion-category ${catClass}">${catLabel}</span>`;
                entry.innerHTML += `<input type='hidden' value='${loc.name}'><input type='hidden' value='${i}'>`;

                entry.addEventListener("click", function() {
                    inp.value = disp;
                    var index = this.getElementsByTagName("input")[1].value;
                    if (inp.id === "sourceInput") sourceIndex = parseInt(index);
                    else if (inp.id === "destInput") destIndex = parseInt(index);
                    closeAllLists();
                });
                suggestions.appendChild(entry);
            }
        }
    });

    inp.addEventListener("keydown", function(e) {
        var x = document.getElementById(this.id + "autocomplete-list");
        if (x) x = x.getElementsByTagName("div");
        if (e.keyCode == 40) { 
            currentFocus++; 
            addActive(x); 
        } else if (e.keyCode == 38) { 
            currentFocus--; 
            addActive(x); 
        } else if (e.keyCode == 13) { 
            e.preventDefault(); 
            if (currentFocus > -1) {
                if (x) x[currentFocus].click();
            }
        }
    });

    function addActive(x) {
        if (!x) return;
        removeActive(x);
        if (currentFocus >= x.length) currentFocus = 0;
        if (currentFocus < 0) currentFocus = x.length - 1;
        x[currentFocus].classList.add("autocomplete-active");
        x[currentFocus].scrollIntoView({ block: "nearest" });
    }

    function removeActive(x) {
        for (var i = 0; i < x.length; i++) x[i].classList.remove("autocomplete-active");
    }

    function closeAllLists(elmnt) {
        var x = document.getElementsByClassName("autocomplete-items");
        for (var i = 0; i < x.length; i++) {
            if (elmnt != x[i] && elmnt != inp) x[i].parentNode.removeChild(x[i]);
        }
    }
    
    function escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    document.addEventListener("click", (e) => closeAllLists(e.target));
}

autocomplete(document.getElementById("sourceInput"), locations);
autocomplete(document.getElementById("destInput"), locations);

// --- LOCATIONS LIST TOGGLE ---
function populateLocationsList(filterText = '') {
    const container = document.querySelector('.locations-container');
    container.innerHTML = '';
    
    // Categories metadata
    const categoryMetadata = {
        academics: { title: "Academics & Labs", icon: "🏫" },
        facilities: { title: "Facilities & Offices", icon: "🏢" },
        hostels: { title: "Hostels & Housing", icon: "🛌" },
        sports: { title: "Sports & Recreation", icon: "🏃" },
        gates: { title: "Gates & Entrances", icon: "🚪" }
    };

    // Initialize grouped categories
    const grouped = {
        academics: [],
        facilities: [],
        hostels: [],
        sports: [],
        gates: []
    };

    let totalMatchCount = 0;

    locations.forEach((location, index) => {
        // Skip routing nodes
        if (location.isRouting) return;

        if (filterText) {
            const query = filterText.toLowerCase();
            const name = location.name.toLowerCase();
            const displayName = (location.displayName || location.name).toLowerCase();
            const category = (location.category || "").toLowerCase();
            const tags = location.tags || [];

            const isMatch = displayName.includes(query) || 
                            name.includes(query) || 
                            category.includes(query) || 
                            tags.some(tag => tag.toLowerCase().includes(query));

            if (!isMatch) return;
        }

        totalMatchCount++;
        const cat = location.category || 'facilities';
        if (grouped[cat]) {
            grouped[cat].push({ location, index });
        }
    });

    if (totalMatchCount === 0 && filterText) {
        const noResults = document.createElement('div');
        noResults.style.cssText = 'padding: 16px; color: var(--text-muted); text-align: center; font-size: 0.85em;';
        noResults.textContent = `❌ No locations found for "${filterText}"`;
        container.appendChild(noResults);
        return;
    }

    // Build collapsible sections for categories
    Object.keys(categoryMetadata).forEach(catKey => {
        const items = grouped[catKey] || [];
        if (items.length === 0) return;

        const metadata = categoryMetadata[catKey];
        const accordion = document.createElement('div');
        accordion.className = 'category-accordion';
        
        // Open by default if user is actively searching
        if (filterText) {
            accordion.classList.add('open');
        }

        const header = document.createElement('div');
        header.className = 'category-header';
        header.innerHTML = `<span>${metadata.icon}</span> <span>${metadata.title}</span> <span style="font-size:0.75em; color:var(--text-muted); margin-left:6px; font-weight:normal;">(${items.length})</span>`;

        header.addEventListener('click', () => {
            accordion.classList.toggle('open');
        });

        const content = document.createElement('div');
        content.className = 'category-content';

        items.forEach(({ location, index }) => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'location-item';

            const titleDiv = document.createElement('div');
            titleDiv.className = 'location-title';
            titleDiv.innerHTML = `<span>${location.icon || "📍"}</span> <span>${location.displayName || location.name}</span>`;
            itemDiv.appendChild(titleDiv);

            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'location-actions';

            const setSrcBtn = document.createElement('button');
            setSrcBtn.className = 'action-chip-btn';
            setSrcBtn.innerHTML = '🟢 Start Here';
            setSrcBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                document.getElementById('sourceInput').value = location.displayName || location.name;
                sourceIndex = index;
                mymap.panTo([location.x, location.y]);
                if (destIndex !== -1) {
                    bellmanFord(sourceIndex, destIndex);
                }
            });

            const setDestBtn = document.createElement('button');
            setDestBtn.className = 'action-chip-btn';
            setDestBtn.innerHTML = '📍 End Here';
            setDestBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                document.getElementById('destInput').value = location.displayName || location.name;
                destIndex = index;
                mymap.panTo([location.x, location.y]);
                if (sourceIndex !== -1) {
                    bellmanFord(sourceIndex, destIndex);
                }
            });

            actionsDiv.appendChild(setSrcBtn);
            actionsDiv.appendChild(setDestBtn);
            itemDiv.appendChild(actionsDiv);
            content.appendChild(itemDiv);
        });

        accordion.appendChild(header);
        accordion.appendChild(content);
        container.appendChild(accordion);
    });
}

document.getElementById('locationsToggle').addEventListener('click', function() {
    const listDiv = document.getElementById('locationsList');
    listDiv.classList.toggle('closed');
    
    if (!listDiv.classList.contains('closed')) {
        this.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="btn-icon"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            Close Directory
        `;
        populateLocationsList();
        document.getElementById('locationsSearch').focus();
    } else {
        this.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="btn-icon"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>
            Explore Directory
        `;
        document.getElementById('locationsSearch').value = '';
    }
});

// Search functionality
document.getElementById('locationsSearch').addEventListener('input', function() {
    populateLocationsList(this.value);
});

// --- AI ASSISTANT INTEGRATION ---
const ELEVEN_LABS_AGENT_URL = 'https://elevenlabs.io/app/talk-to?agent_id=agent_2101k5pdrqbeej1syq9ksw4ptfj4&branch_id=agtbrch_0501ks18pfzfe9arg4cjs7qkc5x4';

// Modal functionality
const modal = document.getElementById('aiInfoModal');
const aiInfoBtn = document.getElementById('aiInfoBtn');
const closeBtn = document.querySelector('.close-btn');
const openAIBtn = document.getElementById('openAIBtn');

// Open modal when info button is clicked
aiInfoBtn.addEventListener('click', function() {
    modal.classList.remove('closed');
});

// Close modal when close button is clicked
closeBtn.addEventListener('click', function() {
    modal.classList.add('closed');
});

// Close modal when clicking outside the modal content
window.addEventListener('click', function(event) {
    if (event.target === modal) {
        modal.classList.add('closed');
    }
});

// Button in sidebar
document.getElementById('aiAssistantBtn').addEventListener('click', function() {
    window.open(ELEVEN_LABS_AGENT_URL, 'AI Assistant', 'width=600,height=700,left=100,top=100');
});

// Open AI from modal button
openAIBtn.addEventListener('click', function() {
    modal.classList.add('closed');
    window.open(ELEVEN_LABS_AGENT_URL, 'AI Assistant', 'width=600,height=700,left=100,top=100');
});

// Floating chat widget button
document.getElementById('floatingChatBtn').addEventListener('click', function() {
    window.open(ELEVEN_LABS_AGENT_URL, 'AI Assistant', 'width=600,height=700,left=100,top=100');
});
