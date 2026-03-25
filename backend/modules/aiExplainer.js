const fetch = require('node-fetch');

/**
 * AI Explainer Module
 * Uses local Ollama instance (default model: llama2 or mistral) to generate AI explanations 
 * about why a package is risky and suggests safer alternatives.
 */

// Configure this to point to your local or remote Ollama URL
const OLLAMA_URL = 'http://127.0.0.1:11434';
const DEFAULT_MODEL = 'mistral'; // Assuming Mistral or Llama3 might be used locally

async function checkOllamaAvailability() {
  try {
    const res = await fetch(`${OLLAMA_URL}/api/tags`, { timeout: 3000 });
    return res.ok;
  } catch (err) {
    return false;
  }
}

async function getExplanation(packageName, vulnerabilities, similarityInfo) {
  const isAvailable = await checkOllamaAvailability();
  
  if (!isAvailable) {
    return {
      success: false,
      message: "OLLAMA_UNAVAILABLE",
      explanation: "We couldn't reach the local AI engine (Ollama) to generate an explanation. Please ensure Ollama is installed and running at http://127.0.0.1:11434."
    };
  }

  // Constructing a smart prompt based on what was found
  let prompt = `You are a cybersecurity expert analyzing npm dependencies.\n\n`;
  prompt += `Analyze the risk associated with the package: "${packageName}".\n`;

  if (vulnerabilities && vulnerabilities.length > 0) {
    prompt += `This package has the following known vulnerabilities (${vulnerabilities.length} total):\n`;
    vulnerabilities.slice(0, 3).forEach((v, index) => {
      prompt += `${index + 1}. Severity: ${v.severity}, Summary: ${v.summary}\n`;
    });
  }

  if (similarityInfo && similarityInfo.isSuspicious) {
    prompt += `\nWARNING: This package was flagged as a potential typosquatting attack!\n`;
    prompt += `It is very similar to the popular package "${similarityInfo.closestMatch?.similarTo}". Distance: ${similarityInfo.closestMatch?.distance}.\n`;
    prompt += `Reason: ${similarityInfo.reason}\n`;
  }

  prompt += `\nPlease provide a short, concise, and professional explanation (in plain text or simple markdown) covering:
1. Why this package is risky in its current state.
2. The potential impact on an application using it.
3. Suggested actionable advice or safer alternatives for the developer.
Answer in NO MORE than 150 words.`;

  try {
    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: DEFAULT_MODEL, 
        prompt: prompt,
        stream: false
      }),
      timeout: 30000 // ML models can take a bit to respond
    });

    if (!response.ok) {
      throw new Error(`Ollama responded with status: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      success: true,
      explanation: data.response
    };

  } catch (error) {
    console.error("AI Explanation Error:", error.message);
    return {
      success: false,
      message: "AI_GENERATION_FAILED",
      explanation: `Failed to generate explanation. Error: ${error.message}`
    };
  }
}

module.exports = { getExplanation };
