// Data for all locations on the map
var locations = [
    { "name" : "aith gate no 1", "displayName": "AITH Gate No. 1", "x" : 26.49975, "y" : 80.27443,"children" : ["aith gate no 2","mod 1"], "category": "gates", "icon": "🚪", "tags": ["gate 1", "main gate", "entrance", "entry", "प्रवेश", "द्वार"] },
    { "name" : "mod 1", "x" : 26.49957, "y" : 80.27431,"children" : ["aith gate no 1","mod 2","rama hospital mod 1","white house"], "category": "routing", "isRouting": true },
    { "name" : "mod 2", "x" : 26.499727, "y" : 80.273779,"children" : ["mod 1","mod 3"], "category": "routing", "isRouting": true },
    { "name" : "rama hospital mod 1", "x" : 26.499287, "y" : 80.275300,"children" : ["mod 1","rama hospital mod 2"], "category": "routing", "isRouting": true },
    { "name" : "white house", "displayName": "White House Landmark", "x" : 26.497475, "y" : 80.280876,"children" : ["mod 1","awadhpuri GT road"], "category": "facilities", "icon": "🏠", "tags": ["landmark", "white house", "milestone"] },
    { "name" : "awadhpuri GT road", "displayName": "Awadhpuri GT Road Entrance", "x" : 26.493525, "y" : 80.278034,"children" : ["white house"], "category": "gates", "icon": "🛣️", "tags": ["gt road", "entrance", "gate", "road"] },
    { "name" : "mod 3", "x" : 26.499669, "y" : 80.273429,"children" : ["mod 2","mod 4"], "category": "routing", "isRouting": true },
    { "name" : "mod 4", "x" : 26.499923, "y" : 80.273046, "children" : ["mod 3","mod 5"], "category": "routing", "isRouting": true },
    { "name" : "rama hospital mod 2", "x" : 26.498106, "y" : 80.274659,"children" : ["rama hospital mod 1","rama hospital mod 3"], "category": "routing", "isRouting": true },
    { "name" : "rama hospital mod 3", "x" : 26.499200, "y" : 80.270878,"children" : ["rama hospital mod 2","GT road near csjmu"], "category": "routing", "isRouting": true },
    { "name" : "M", "x" : 26.502750, "y" : 80.278038,"children" : ["girls hostel","divyangjan hostel","S"], "category": "routing", "isRouting": true },
    { "name" : "divyangjan hostel", "displayName": "Divyangjan Hostel", "x" : 26.502798, "y" : 80.277911,"children" : ["M","F","girls hostel"], "category": "hostels", "icon": "♿", "tags": ["handicapped hostel", "accessible hostel", "disabled", "divyang", "छात्रावास"] },
    { "name" : "basketball court", "displayName": "Basketball Court", "x" : 26.50276, "y" : 80.27724,"children" : ["cricket playground boundary","stage","girls hostel"], "category": "sports", "icon": "🏀", "tags": ["sports", "play", "ground", "game", "baasket"] },
    { "name" : "stage", "displayName": "Open Air Stage", "x" : 26.50269, "y" : 80.277766,"children" : ["cricket playground","girls hostel","basketball court"], "category": "sports", "icon": "🎭", "tags": ["stage", "events", "cultural", "open air", "मंच"] },
    { "name" : "F", "x" : 26.502994, "y" : 80.277296,"children" : ["E","divyangjan hostel"], "category": "routing", "isRouting": true },
    { "name" : "E", "x" : 26.502964, "y" : 80.277212,"children" : ["D","F"], "category": "routing", "isRouting": true },
    { "name" : "D", "x" : 26.503075, "y" : 80.276902,"children" : ["R","E"], "category": "routing", "isRouting": true },
    { "name" : "X", "x" : 26.502537, "y" : 80.2766631,"children" : ["R","chauraha","first year computer lab","physics lab"], "category": "routing", "isRouting": true },
    { "name" : "chauraha", "x" : 26.50230, "y" : 80.27656,"children" : ["lift main building","advanced biotech lab","X", "library intersection"], "category": "routing", "isRouting": true },
    { "name" : "lift main building", "displayName": "Main Building Lift", "x" : 26.50228, "y" : 80.27655,"children" : ["advanced ai lab gate","chauraha","main route"], "category": "facilities", "icon": "🛗", "tags": ["elevator", "lift", "accessible", "लिफ्ट", "मुख्य भवन"] },
    { "name" : "main route", "x" : 26.502151, "y" : 80.276658,"children" : ["main building","lift main building","academic hall"], "category": "routing", "isRouting": true },
    { "name" : "advanced biotech lab", "displayName": "Advanced Biotech Lab", "x" : 26.50233, "y" : 80.27652,"children" : ["chauraha"], "category": "academics", "icon": "🧬", "tags": ["biotechnology", "lab", "academic", "बायोटेक", "प्रयोगशाला"] },
    { "name" : "advanced ai lab gate", "displayName": "Advanced AI Lab Entrance", "x" : 26.50233, "y" : 80.27647,"children" : ["F block cse /it","lift main building"], "category": "academics", "icon": "🤖", "tags": ["artificial intelligence", "computer science", "lab", "ai", "एआई", "कंप्यूटर"] },
    { "name" : "F block cse /it", "displayName": "F-Block (CSE & IT)", "x" : 26.50239, "y" : 80.27632,"children" : ["advanced ai lab gate"], "category": "academics", "icon": "💻", "tags": ["computer science", "information technology", "cse", "it", "department", "विभाग"] },
    { "name" : "academic hall", "displayName": "Academic Hall", "x" : 26.502151, "y" : 80.276658,"children" : ["main route","director room route"], "category": "academics", "icon": "🏫", "tags": ["lecture hall", "classes", "hall", "शैक्षणिक"] },
    { "name" : "aith gate no 2", "displayName": "AITH Gate No. 2", "x" : 26.502196, "y" : 80.275563,"children" : ["aith main building front","aith gate no 1","chemical and biotech department"], "category": "gates", "icon": "🚪", "tags": ["gate 2", "entrance", "exit", "निकास", "द्वार"] },
    { "name" : "mod 5", "x" : 26.500511, "y" : 80.271476,"children" : ["GT road near csjmu","mod 4"], "category": "routing", "isRouting": true },
    { "name" : "GT road near csjmu", "displayName": "GT Road (Near CSJMU)", "x" : 26.49525, "y" : 80.269523,"children" : ["mod 5","rama hospital mod 3"], "category": "gates", "icon": "🛣️", "tags": ["csjmu gate", "entrance", "gt road", "road"] },
    { "name" : "girls hostel", "displayName": "Girls Hostel", "x" : 26.502581, "y" : 80.278009,"children" : ["K","stage","M","cricket playground","basketball court","divyangjan hostel"], "category": "hostels", "icon": "👩‍🎓", "tags": ["girls", "hostel", "residence", "छात्रावास", "महिला"] },
    { "name" : "cricket playground boundary", "x" : 26.502620, "y" : 80.277354,"children" : ["cricket playground","basketball court","stage","girls hostel"], "category": "routing", "isRouting": true },
    { "name" : "cricket playground", "displayName": "Cricket Playground", "x" : 26.50193, "y" : 80.27713,"children" : ["L","cricket playground boundary","girls hostel", "sports complex"], "category": "sports", "icon": "🏏", "tags": ["cricket", "sports", "ground", "pitch", "खेल का मैदान"] },
    { "name" : "director room route", "x" : 26.502131, "y" : 80.276783,"children" : ["academic hall","accountant section","director room"], "category": "routing", "isRouting": true },
    { "name" : "aith main building front", "x" : 26.501945, "y" : 80.276281,"children" : ["main building","L","aith gate no 2"], "category": "routing", "isRouting": true },
    { "name" : "main building", "displayName": "Main Academic Building", "x" : 26.50201, "y" : 80.27645,"children" : ["aith main building front","main route"], "category": "academics", "icon": "🏫", "tags": ["main building", "admin", "offices", "classes", "मुख्य भवन"] },
    { "name" : "first year computer lab", "displayName": "First Year Computer Lab", "x" : 26.502560, "y" : 80.276580,"children" : ["electronics department nba accredited","X"], "category": "academics", "icon": "🖥️", "tags": ["first year", "lab", "computer", "cse", "it", "प्रयोगशाला"] },
    { "name" : "electronics department nba accredited", "displayName": "Electronics Dept (NBA Accredited)", "x" : 26.502632, "y" : 80.276397,"children" : ["first year computer lab"], "category": "academics", "icon": "🔌", "tags": ["electronics", "ece", "department", "nba", "विभाग"] },
    { "name" : "physics lab", "displayName": "Physics Lab", "x" : 26.502535, "y" : 80.276840,"children" : ["X","P"], "category": "academics", "icon": "⚛️", "tags": ["physics", "science", "lab", "भौतिकी", "प्रयोगशाला"] },
    { "name" : "P", "x" : 26.502452, "y" : 80.277096,"children" : ["divyangjan classroom","physics lab"], "category": "routing", "isRouting": true },
    { "name" : "divyangjan classroom", "displayName": "Divyangjan Classroom", "x" : 26.502562, "y" : 80.277096,"children" : ["P"], "category": "academics", "icon": "♿", "tags": ["accessible classroom", "divyang", "disabled", "क्लासरूम"] },
    { "name" : "L", "x" : 26.501706, "y" : 80.276939,"children" : ["aith main building front","cricket playground","K"], "category": "routing", "isRouting": true },
    { "name" : "K", "x" : 26.501658, "y" : 80.277493,"children" : ["girls hostel","L"], "category": "routing", "isRouting": true },
    { "name" : "chemical and biotech department", "displayName": "Chemical & Biotech Dept", "x" : 26.50310, "y" : 80.27597,"children" : ["chemical department exit gate","aith gate no 2","T"], "category": "academics", "icon": "🧪", "tags": ["chemical", "biotech", "department", "विभाग"] },
    { "name" : "chemical department exit gate", "displayName": "Chemical Dept Exit Gate", "x" : 26.50300, "y" : 80.27632,"children" : ["mechanical lab","chemical and biotech department"], "category": "gates", "icon": "🚪", "tags": ["chemical gate", "exit", "gate", "द्वार"] },
    { "name" : "mechanical lab", "displayName": "Mechanical Lab", "x" : 26.50307, "y" : 80.27654,"children" : ["R","chemical department exit gate"], "category": "academics", "icon": "⚙️", "tags": ["mechanical", "me", "lab", "workshop", "प्रयोगशाला"] },
    { "name" : "T", "x" : 26.50377, "y" : 80.27617,"children" : ["aith incubation and startup centre","chemical and biotech department"], "category": "routing", "isRouting": true },
    { "name" : "R", "x" : 26.50278, "y" : 80.27676,"children" : ["mechanical lab","D","X"], "category": "routing", "isRouting": true },
    { "name" : "aith incubation and startup centre", "displayName": "Incubation & Startup Centre", "x" : 26.50366, "y" : 80.27656,"children" : ["T","canteen","S"], "category": "facilities", "icon": "🚀", "tags": ["incubation", "startup", "centre", "business", "स्टार्टअप"] },
    { "name" : "canteen", "displayName": "Campus Canteen", "x" : 26.50360, "y" : 80.27651,"children" : ["aith incubation and startup centre"], "category": "facilities", "icon": "🍔", "tags": ["canteen", "food", "cafeteria", "lunch", "कैंटीन", "खाना"] },
    { "name" : "S", "x" : 26.503089, "y" : 80.278165,"children" : ["M","aith incubation and startup centre"], "category": "routing", "isRouting": true },
    { "name" : "library intersection", "x": 26.50220, "y": 80.27680, "children": ["chauraha", "library", "main route"], "category": "routing", "isRouting": true },
    { "name" : "library", "displayName": "Central Library", "x": 26.50210, "y": 80.27710, "children": ["library intersection"], "category": "facilities", "icon": "📚", "tags": ["library", "books", "study", "silent", "पुस्तकालय", "किताबें"] },
    { "name" : "sports complex", "displayName": "Sports Complex", "x": 26.50150, "y": 80.27780, "children": ["cricket playground", "K"], "category": "sports", "icon": "🏃", "tags": ["sports", "gym", "complex", "indoor games", "खेल"] },
    { "name" : "boys hostel A", "displayName": "Boys Hostel Block A", "x": 26.50350, "y": 80.27850, "children": ["S", "boys hostel B"], "category": "hostels", "icon": "👨‍🎓", "tags": ["boys", "hostel", "block a", "residence", "छात्रावास"] },
    { "name" : "boys hostel B", "displayName": "Boys Hostel Block B", "x": 26.50380, "y": 80.27880, "children": ["boys hostel A"], "category": "hostels", "icon": "👨‍🎓", "tags": ["boys", "hostel", "block b", "residence", "छात्रावास"] },
    { "name" : "food technology dept", "displayName": "Food Technology Dept", "x": 26.50390, "y": 80.27600, "children": ["T", "paint tech dept"], "category": "academics", "icon": "🍎", "tags": ["food technology", "department", "academic", "विभाग"] },
    { "name" : "paint tech dept", "displayName": "Paint Technology Dept", "x": 26.50420, "y": 80.27620, "children": ["food technology dept"], "category": "academics", "icon": "🎨", "tags": ["paint technology", "department", "paint", "विभाग"] },
    { "name" : "admin block", "displayName": "Administrative Block", "x": 26.50200, "y": 80.27600, "children": ["aith main building front"], "category": "facilities", "icon": "🏢", "tags": ["admin", "office", "block", "governance", "प्रशासनिक"] },
    { "name" : "staff parking", "displayName": "Staff Parking", "x": 26.50180, "y": 80.27580, "children": ["aith main building front", "aith gate no 2"], "category": "facilities", "icon": "🅿️", "tags": ["parking", "staff", "cars", "bikes", "पार्किंग"] },
    { "name" : "auditorium", "displayName": "Main Auditorium", "x": 26.50280, "y": 80.27550, "children": ["aith gate no 2", "chemical and biotech department"], "category": "facilities", "icon": "🎭", "tags": ["auditorium", "seminar", "events", "hall", "सभागार"] },
    { "name" : "civil dept", "displayName": "Civil Dept", "x": 26.50330, "y": 80.27680, "children": ["mechanical lab", "R"], "category": "academics", "icon": "🧱", "tags": ["civil engineering", "department", "civil", "विभाग"] },
    { "name" : "workshop", "displayName": "Central Workshop", "x": 26.50350, "y": 80.27710, "children": ["civil dept", "R"], "category": "facilities", "icon": "🛠️", "tags": ["workshop", "mechanical", "lab", "मशीन", "कार्यशाला"] },
    { "name" : "tennis court", "displayName": "Tennis Court", "x": 26.50290, "y": 80.27700, "children": ["basketball court", "F"], "category": "sports", "icon": "🎾", "tags": ["tennis", "sports", "court", "play", "टेनिस"] },
    { "name" : "ATM", "displayName": "ATM (Campus Branch)", "x": 26.50210, "y": 80.27540, "children": ["aith gate no 2"], "category": "facilities", "icon": "🏧", "tags": ["atm", "bank", "money", "cash", "एटीएम"] },
    { "name" : "guest house", "displayName": "Guest House", "x": 26.50320, "y": 80.27830, "children": ["S", "boys hostel A"], "category": "hostels", "icon": "🏡", "tags": ["guest room", "stay", "visitors", "guest", "अतिथि गृह"] },
    { "name" : "accountant section", "displayName": "Accountant Section", "x": 26.50218, "y": 80.27695, "children": ["director room route"], "category": "facilities", "icon": "💰", "tags": ["accountant", "finance", "fees", "office", "लेखा"] },
    { "name" : "director room", "displayName": "Director's Office", "x": 26.50225, "y": 80.27715, "children": ["director room route"], "category": "facilities", "icon": "💼", "tags": ["director", "head", "office", "room", "निदेशक"] }
];

// Haversine formula for distance calculation
function degtoRad(value) {
    return (value * Math.PI) / 180;
}

// Distance matrix distance calculation function
function calcCrowDist(lat1, long1, lat2, long2) {
    var R = 6371000; // Radius of Earth in meters
    var dlat = degtoRad(lat2 - lat1);
    var dlong = degtoRad(long2 - long1);
    lat1 = degtoRad(lat1);
    lat2 = degtoRad(lat2);
    var a =
        Math.sin(dlat / 2) * Math.sin(dlat / 2) +
        Math.cos(lat1) * Math.cos(lat2) * Math.sin(dlong / 2) * Math.sin(dlong / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in meters
}
