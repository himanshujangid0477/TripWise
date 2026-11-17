# TripWise – Travel Planner & Itinerary Builder

TripWise is a React-based travel planning application that helps users explore destinations, save places and organise trips through a day-by-day itinerary.

## Features

- Interactive map using Leaflet with mock destination locations and category-based markers.
- Marker clustering so pins stay readable when many are on screen.
- Place details shown as popups on the map pins, plus a details panel below the map.
- Save and remove favourite places, persisted in the browser.
- Day-by-day itinerary planner (3 days) with drag-and-drop organisation.
- Estimated travel time between consecutive stops on each day.
- Budget tracker with multi-currency expenses and a budget vs actual spending chart.
- Packing checklist with templates and nested sub-items.
- Export and import trip data as JSON, and export/import the itinerary as a calendar (.ics) file.
- Read-only share link for sharing a trip with others.
- Print-friendly itinerary layout.
- Dark and light mode.
- Responsive layout and empty states.

## Demo

Watch the full walkthrough of the app:

[![Demo video](https://www.loom.com/share/ab1791b60d3f461fa09df66a4a33febe)](https://www.loom.com/share/ab1791b60d3f461fa09df66a4a33febe)

The video shows dark/light mode, the interactive map with clustering and popups, drag-and-drop day-by-day planning with travel-time estimates, the budget tracker and chart, the packing checklist, JSON/ICS export/import, the read-only share link, and the print layout.

## Technology Stack

| Technology | Purpose |
|---|---|
| React | User interface |
| Vite | Development and build tooling |
| JavaScript | Application logic |
| CSS | Styling and responsive layout |
| Leaflet | Interactive maps |
| Leaflet MarkerCluster | Map marker clustering |
| dnd-kit | Drag-and-drop functionality |
| Recharts | Budget vs actual spending chart |
| React Router | Hash-based routes, including the read-only share view |

## How to Run

Clone the repository and install dependencies:

```bash
git clone https://github.com/himanshujangid0477/TripWise.git
cd TripWise
npm install
```

On Windows, run the scripts with `npm.cmd` (for example `npm.cmd run dev`), since `npm` alone may not resolve on some setups:

```bash
npm.cmd run dev
```

This starts the development server. Build the production bundle with:

```bash
npm.cmd run build
```

Lint the source with:

```bash
npm.cmd run lint
```

## Project Structure

```text
TripWise/
├── public/
├── src/
│   ├── components/
│   │   ├── MapView.jsx
│   │   ├── ItineraryPlanner.jsx
│   │   ├── BudgetTracker.jsx
│   │   ├── PackingChecklist.jsx
│   │   ├── TripTools.jsx
│   │   └── Navbar.jsx
│   ├── pages/
│   │   ├── Dashboard.jsx
│   │   └── ShareView.jsx
│   ├── styles/
│   │   ├── features.css
│   │   ├── dark.css
│   │   ├── print.css
│   │   └── responsive.css
│   ├── hooks/
│   │   ├── useLocalStorage.js
│   │   └── useTheme.js
│   ├── data/
│   │   ├── budget.js
│   │   └── places.js
│   ├── utils/
│   │   ├── format.js
│   │   ├── travel.js
│   │   ├── checklist.js
│   │   ├── ics.js
│   │   └── tripData.js
│   ├── App.jsx
│   ├── App.css
│   ├── index.css
│   └── main.jsx
├── index.html
├── package.json
└── README.md
```

## Notes

- Travel times between stops are estimated from mock coordinates and are not real routing data.
- Exchange rates used by the budget tracker (e.g. 1 USD = 83 INR) are mock values for demonstration only.
- Share links contain the trip data inside the URL. There is no backend, and all data is stored in the browser's localStorage.

## Project Information

**Project:** TripWise  
**Type:** Travel Planner Web Application  
**Status:** Under Development  
**Repository:** [GitHub – TripWise](https://github.com/himanshujangid0477/TripWise)

Developed as part of an internship assignment.