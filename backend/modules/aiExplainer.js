const fetch = require('node-fetch');

/**
 * AI Explainer Module
 * Uses a remote Hugging Face Space running Ollama to generate AI explanations 
 * about why a package is risky and suggests safer alternatives.
 */

// Configure this to point to the remote Hub/Space
const HUGGINGFACE_SPACE_URL = 'https://raghu0934-qwen2-5-1-5b-model.hf.space';
const OLLAMA_MODEL = 'qwen2.5:1.5b';

async function getExplanation(packageName, vulnerabilities, similarityInfo) {
  // Constructing a smart prompt based on what was found
  let systemPrompt = `You are a cybersecurity expert analyzing npm dependencies.`;
  
  let userPrompt = `Analyze the risk associated with the package: "${packageName}".\n`;

  if (vulnerabilities && vulnerabilities.length > 0) {
    userPrompt += `This package has the following known vulnerabilities (${vulnerabilities.length} total):\n`;
    vulnerabilities.slice(0, 3).forEach((v, index) => {
      userPrompt += `${index + 1}. Severity: ${v.severity}, Summary: ${v.summary}\n`;
    });
  }

  if (similarityInfo && similarityInfo.isSuspicious) {
    userPrompt += `\nWARNING: This package was flagged as a potential typosquatting attack!\n`;
    userPrompt += `It is very similar to the popular package "${similarityInfo.closestMatch?.similarTo}". Distance: ${similarityInfo.closestMatch?.distance}.\n`;
    userPrompt += `Reason: ${similarityInfo.reason}\n`;
  }

  userPrompt += `\nPlease provide a short, concise, and professional explanation (in plain text or simple markdown) covering:
1. Why this package is risky in its current state.
2. The potential impact on an application using it.
3. Suggested actionable advice or safer alternatives for the developer.
Answer in NO MORE than 150 words.`;

  try {
    const response = await fetch(`${HUGGINGFACE_SPACE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL, 
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        stream: false
      }),
      timeout: 60000 // Extended timeout since HF Spaces can take a moment to wake up
    });

    if (!response.ok) {
      throw new Error(`AI Model Endpoint responded with status: ${response.status}`);
    }

    const data = await response.json();
    
    // In chat API, Ollama responds with { message: { content: "..." } }
    let explanationText = "Unable to parse AI response";
    if (data && data.message && data.message.content) {
      explanationText = data.message.content;
    } else if (data && data.response) { // Fallback just in case it behaves like /generate
      explanationText = data.response;
    }

    return {
      success: true,
      explanation: explanationText
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

async function getReportExplanation(trustScore, riskLevel, issues) {
  let systemPrompt = `You are a cybersecurity assistant.`;
  
  let userPrompt = `Analyze the given dependency risk report and explain it in simple, clear language for a developer.

Input:
- Trust Score: ${trustScore}
- Risk Level: ${riskLevel}
- Issues:
${issues}

Instructions:
1. Explain why the project is safe or risky.
2. Mention the most important issues (e.g., suspicious package names, unknown packages, vulnerabilities).
3. Keep the explanation short (2–3 sentences).
4. Avoid technical jargon.
5. Give 1 simple recommendation to improve security.

Output format:
- Summary:
- Reason:
- Recommendation:`;

  try {
    const response = await fetch(`${HUGGINGFACE_SPACE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL, 
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        stream: false
      }),
      timeout: 60000
    });

    if (!response.ok) {
      throw new Error(`AI Model Endpoint responded with status: ${response.status}`);
    }

    const data = await response.json();
    
    let explanationText = "Unable to parse AI response";
    if (data && data.message && data.message.content) {
      explanationText = data.message.content;
    } else if (data && data.response) {
      explanationText = data.response;
    }

    return {
      success: true,
      explanation: explanationText
    };

  } catch (error) {
    console.error("AI Report Explanation Error:", error.message);
    return {
      success: false,
      message: "AI_GENERATION_FAILED",
      explanation: `Failed to generate explanation. Error: ${error.message}`
    };
  }
}

module.exports = { getExplanation, getReportExplanation };
