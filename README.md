# Secure Software Supply Chain Analyzer

A powerful, full-stack application built for security analysis of npm dependencies. Detect vulnerabilities using OSV.dev, identify typosquatting attacks using Levenshtein distance, and generate actionable Trust Scores!

## Features Implemented:
1. **Upload & Input**: Seamless drag-and-drop `package.json` upload or raw JSON pasting.
2. **SBOM Generation**: Recursively fetches dependencies directly from the npm registry API.
3. **Vulnerability Scanner**: Integrates with Google's `OSV.dev` database to flag Known Vulnerabilities.
4. **Typosquatting Detection**: Uses advanced string-distance algorithms to detect suspicious package names mimicking popular packages.
5. **Trust Score Engine**: A custom severity-weighted scoring algorithm (0-100) determining the real risk of your project.
6. **Local AI Explanations**: Seamless integration with a local Ollama instance (defaulting to \`mistral\`) to explain complex vulnerabilities to developers in plain English.
7. **Dashboard UI**: Fully responsive, dark-mode prioritized premium React/Tailwind frontend.
8. **Report Generation**: Export full analysis histories as JSON, raw SBOM, or stylized HTML reports.

## Prerequisites
- Node.js (v18+)
- (Optional) [Ollama](https://ollama.com/) running locally for the 'Ask AI' feature.

## How to Run the App Locally

### 1. Start the Backend API
The backend requires Express and a few other libraries. Open a terminal and run:
\`\`\`bash
cd backend
npm install
npm start
\`\`\`
The backend will run on \`http://localhost:5000\`.

### 2. Start the Frontend Application
The frontend requires Vite, React, Tailwind CSS, and Chart.js. Open another terminal and run:
\`\`\`bash
cd frontend
npm install
npm run dev
\`\`\`
The Vite dev server will start on \`http://localhost:3000\` (or a similar port). Ensure the dev server uses the Vite proxy to connect to the backend API seamlessly.

## Testing With Sample Data
If you do not have a malicious \`package.json\` on hand, go to the application interface, click **Paste JSON**, and select **"Load sample data →"** at the bottom left. This populates a test case with outdated, vulnerable packages.

## Note on AI Feature
The backend will attempt to connect to \`http://127.0.0.1:11434\` out of the box. Ensure your Ollama server is running and has pulled a language model (e.g. \`ollama run mistral\`). If local AI is not active, the app falls back gracefully and alerts the user.
