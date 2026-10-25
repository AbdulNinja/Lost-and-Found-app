# Lost & Found

A web app where people report lost or found belongings, search and filter listings, edit them, mark them as recovered, and delete them. Data is stored through a REST API (JSON Server), so it persists between reloads and is shared between users.

Links:
- **Live app:** https://YOUR-USERNAME.github.io/lost-and-found/
- **Live API:** https://YOUR-API-NAME.onrender.com/items
- **Figma wireframe:** (your design link)
- **GitHub repository:** https://github.com/YOUR-USERNAME/lost-and-found

## Problem

People lose belongings in schools, universities and public places, and there is no central place to report or find them.

## Objectives

- Let users report lost or found items.
- Let users search and filter listings.
- Let users update an item's details and mark it as recovered.
- Let users delete listings.
- Save everything through a deployed REST API.

## Features

| Feature | How it works |
|---|---|
| Report an item | Form with validation, saved with `POST` |
| View listings | Loaded with `GET`, newest first |
| Search and filter | By text, type (lost/found), category and status |
| Edit an item | Replaces the whole item with `PUT` |
| Mark as recovered | Changes one field with `PATCH` |
| Delete a listing | `DELETE`, after a confirmation |
| Feedback | Loading text, success messages and clear error messages |
| Responsive | Desktop, tablet and mobile layouts |

## Technologies

- HTML, CSS and JavaScript (ES modules, no framework)
- JSON Server 0.17 (mock REST API)
- Vitest (tests and coverage)
- Git and GitHub, GitHub Pages and Render (hosting)

## Project structure

```
lost-and-found/
├── index.html          page structure (semantic HTML, no JavaScript inside)
├── styles.css          styling and responsive design (no :root variables)
├── db.json             the API's data (3 sample items)
├── js/
│   ├── items.js        data layer: API calls, validation, filtering (95.65% tested)
│   └── app.js          UI layer: page behaviour, form handling, rendering
├── tests/
│   ├── items.test.js   14 unit tests for data layer
│   └── app.test.js     42 unit tests for UI layer
├── vitest.config.js    test configuration
├── package.json        scripts and dependencies
└── [docs]
    ├── README.md       (this file)
    ├── GIT-WORKFLOW.md feature branches and PR cycle
    └── LEARNING-GUIDE.md 13 lessons on the concepts
```

**How the modules connect:**
- `app.js` (UI layer) calls functions from `items.js` (data layer)
- `items.js` sends HTTP requests to JSON Server
- Both use ES6 modules (`import`/`export`)

## API endpoints

Base URL while developing: `http://localhost:3000`

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/items` | Get all items |
| GET | `/items/:id` | Get one item |
| POST | `/items` | Create an item |
| PUT | `/items/:id` | Replace a whole item (Edit) |
| PATCH | `/items/:id` | Change some fields (Mark recovered) |
| DELETE | `/items/:id` | Delete an item |

Example item:

```json
{
  "id": 1,
  "type": "lost",
  "name": "Black backpack",
  "category": "Bags",
  "location": "Main library, 2nd floor",
  "date": "2026-10-18",
  "description": "Black backpack with a red keychain.",
  "contact": "0712 345 678",
  "recovered": false,
  "createdAt": "2026-10-18T09:30:00.000Z"
}
```

## Run it on your computer

You need [Node.js](https://nodejs.org) installed.

```bash
git clone YOUR_REPO_LINK
cd lost-and-found
npm install
npm run api      # terminal 1: API at http://localhost:3000
npm run web      # terminal 2: app at http://localhost:5500
```

Open `http://localhost:5500`. (The page must be served, not opened by double-clicking, because it uses JavaScript modules.)

## Tests

```bash
npm test             # run 56 tests
npm run coverage     # run tests and show coverage table (HTML report in coverage/)
```

**Coverage:**
- **items.js** (data layer): 14 unit tests, **95.65% coverage**
  - Validation: type, category, location, date, description, contact
  - All 5 HTTP methods: GET, POST, PUT, PATCH, DELETE
  - Filtering by type, category, status, and search query
  - Error handling
- **app.js** (UI layer): 42 unit tests + manual browser testing
  - Form submission and validation display
  - Edit mode toggling
  - Card rendering and list updates
  - Filter interactions
  - Event handlers tested interactively in the browser

**Threshold:** 43% overall (items.js 95.65% + app.js 22% = realistic split)

## Deployment

1. **API (Render):** create a Web Service from this repo. Build command `npm install`, start command `npm run api:prod`.
2. Put the Render address in `js/items.js` as `API_BASE_URL` (near the top), then commit and push.
3. **Frontend (GitHub Pages):** repository Settings, Pages, deploy from the `main` branch, root folder.

Note: on Render's free plan the API goes to sleep when idle, so the first request can take about 30 seconds. Changes made through the API may reset when the service restarts, because the data is stored in `db.json`.

## Design

- Wireframe made before the build (link above).
- Three colours plus neutrals: blue `#2f5fd0` (primary), amber `#e8a317` (lost), green `#1f7a4f` (found and recovered). Red is used only for errors and delete.
- Semantic HTML with labels, `aria-live` status messages and visible focus styles.

## License

MIT. See [LICENSE](LICENSE) file.