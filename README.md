# 🗺️ mapAITD - The AITD Campus Navigator

**mapAITD** is an interactive campus map created specifically for the students of Dr. Ambedkar Institute of Technology for Handicapped (AITD), Kanpur. It helps students, faculty, and visitors easily find the shortest walking paths between college buildings and nearby places, eliminating the confusion of navigating our campus.

### ✨ [**View the Live Demo Here!**](https://mapaitd.netlify.app/)
*(You can update this link with your own Netlify URL after deployment!)*

---

## 🚀 Key Features

This project is packed with features designed to make campus navigation seamless and intuitive.

| Main Interface | Route Calculation | Live Navigation |
| :---: | :---: | :---: |
| *Screenshot of the main map view* | *Screenshot of a route displayed* | *Screenshot of the navigation arrow* |
| **![Main Interface](assets/screenshot-main.png)** | **![Calculated Route](assets/screenshot-route.png)** | **![Navigation Arrow](assets/screenshot-navigation.png)** |
| A clean, responsive interface with smart, auto-completing search fields. | Instantly calculates and displays the shortest path between any two points. | A dynamic arrow simulates your movement and provides turn-by-turn guidance. |

* **📍 Interactive AITD Map**: A smooth, zoomable map of the AITD campus and its surroundings.
* **⚡ Smart Pathfinding**: Uses the Bellman-Ford algorithm to find the most efficient walking route.
* **🎤 Voice-Guided Navigation**: Get clear, turn-by-turn audio directions via the Web Speech API.
* **⏱️ Estimated Walk Time**: Know exactly how long your walk will take with an automatically calculated ETA.
* **📝 Written Directions**: A clear, step-by-step list of directions is provided for every route.
* **📱 Mobile-Friendly**: Works perfectly on both desktop and mobile browsers, so you can use it on the go.

---

## 💻 How to Use

1.  **Enter Locations**: Start typing your starting and destination points in the search boxes.
2.  **Find Route**: Click the **"Find Route"** button to see the path on the map.
3.  **View Details**: Check the route details panel for distance, estimated time, and written directions.
4.  **Start Navigation**: Click **"Start Navigation"** to activate the live arrow and voice guidance.
5.  **Clear**: Use the **"Clear"** button to reset the map for a new search.

---

## 🛠️ Local Development & Setup

If you want to run this project locally or contribute to its development:

1.  **Clone the Repository**
    ```bash
    git clone [https://github.com/YourUsername/mapAITD.git](https://github.com/YourUsername/mapAITD.git) 
    # Replace with your actual repository URL
    ```
2.  **Navigate to the Directory**
    ```bash
    cd mapAITD
    ```
3.  **Run with a Live Server**
    * If you're using VS Code, install the **"Live Server"** extension.
    * Right-click on the `dist/index.html` file and select **"Open with Live Server"**.

This will open the project in your browser, and you can start making changes.