# SRM Full Stack Engineering Challenge - BFHL API

A complete full-stack solution for the SRM Full Stack Engineering Challenge (Round 1). Build a REST API that processes hierarchical relationships and a frontend to interact with it.

## Features

✅ **Backend API (Express.js)**

- POST `/bfhl` endpoint with complete request validation
- Hierarchical relationship processing (tree building)
- Cycle detection using DFS
- Duplicate edge handling
- Depth calculation for trees
- CORS enabled for frontend integration
- Response time < 3 seconds for up to 50 nodes

✅ **Frontend (Vanilla JS + HTML/CSS)**

- Clean, responsive UI with gradient design
- Real-time API integration
- Structured result display (trees, invalid entries, duplicates, summary)
- Error handling with user-friendly messages
- Mobile-responsive design

## Project Structure

```
Full Stack/
├── backend/
│   ├── package.json
│   └── server.js
├── frontend/
│   └── index.html
├── vercel.json
├── .gitignore
└── README.md
```

## Setup Instructions

### Backend Setup (Local Development)

1. Navigate to the backend directory:

```bash
cd backend
```

2. Install dependencies:

```bash
npm install
```

3. Start the server:

```bash
npm start
```

The API will run on `http://localhost:8000`

### Frontend Setup (Local Development)

1. Open `frontend/index.html` in a web browser, or
2. Use a local server (e.g., `python -m http.server` from frontend directory)

Update the `API_URL` in the frontend HTML file to match your backend:

```javascript
const API_URL = "http://localhost:8000"; // Change for production
```

## API Documentation

### Endpoint: POST /bfhl

**Request Body:**

```json
{
  "data": ["A->B", "A->C", "B->D"]
}
```

**Response Schema:**

```json
{
  "user_id": "fullname_ddmmyyyy",
  "email_id": "your.email@college.edu",
  "college_roll_number": "YOUR_ROLL_NUMBER",
  "hierarchies": [
    {
      "root": "A",
      "tree": { "A": { "B": {}, "C": {} } },
      "depth": 2
    }
  ],
  "invalid_entries": [],
  "duplicate_edges": [],
  "summary": {
    "total_trees": 1,
    "total_cycles": 0,
    "largest_tree_root": "A"
  }
}
```

### Validation Rules

- **Valid Format**: Single uppercase letters with `->` separator (e.g., `A->B`)
- **Invalid Entries**: Multi-character nodes, lowercase letters, wrong separator, self-loops, empty strings
- **Duplicate Edges**: Same `Parent->Child` pair counted once in tree construction
- **Cycles**: Detected using DFS; cyclic groups return `has_cycle: true` with empty tree
- **Depth**: Number of nodes on the longest root-to-leaf path

## Deployment

### Deploy Backend to Vercel

1. Install Vercel CLI:

```bash
npm i -g vercel
```

2. From the project root:

```bash
vercel
```

3. Follow the prompts and get your API URL (e.g., `https://your-project.vercel.app`)

### Deploy Frontend

**Option 1: Vercel**

- Create a new Vercel project for the frontend
- Upload the `frontend/` folder
- Set up environment variable for API URL

**Option 2: Netlify**

- Drag and drop the `frontend/` folder to Netlify

**Option 3: GitHub Pages**

- Push to GitHub repository
- Enable GitHub Pages from repository settings

## Configuration

Before submission, update these values in `backend/server.js`:

```javascript
user_id: 'your_name_ddmmyyyy', // Your name + date of birth
email_id: 'your.email@college.edu', // Your college email
college_roll_number: 'YOUR_ROLL_NUMBER' // Your roll number
```

## Example Usage

**Request:**

```bash
curl -X POST http://localhost:8000/bfhl \
  -H "Content-Type: application/json" \
  -d '{"data": ["A->B", "A->C", "B->D", "C->E", "E->F", "X->Y", "Y->Z", "Z->X"]}'
```

**Response:**

```json
{
  "user_id": "johndoe_17091999",
  "email_id": "john.doe@college.edu",
  "college_roll_number": "21CS1001",
  "hierarchies": [
    {
      "root": "A",
      "tree": { "A": { "B": { "D": {} }, "C": { "E": { "F": {} } } } },
      "depth": 4
    },
    {
      "root": "X",
      "tree": {},
      "has_cycle": true
    }
  ],
  "invalid_entries": [],
  "duplicate_edges": [],
  "summary": {
    "total_trees": 1,
    "total_cycles": 1,
    "largest_tree_root": "A"
  }
}
```

## Submission Checklist

- [ ] Update personal details in backend/server.js
- [ ] Test API locally with various inputs
- [ ] Deploy backend to hosting platform
- [ ] Deploy frontend to hosting platform
- [ ] Update frontend API_URL to deployed backend
- [ ] Create public GitHub repository
- [ ] Test API and frontend from deployed URLs
- [ ] Ensure CORS is working (API accessible from different origin)
- [ ] Fill submission form with:
  - Hosted API base URL
  - Hosted frontend URL
  - GitHub repository URL

## Notes

- All code must be original (plagiarism detection will be run)
- API must respond in < 3 seconds for up to 50 nodes
- CORS must be enabled
- Do not hardcode responses

## License

MIT
