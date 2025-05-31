import { NextResponse } from "next/server";

// Helper function to create fetch with timeout
async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number = 30000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

// Helper function to retry fetch with exponential backoff
async function fetchWithRetry(url: string, options: RequestInit, maxRetries: number = 5) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Attempt ${attempt}/${maxRetries} to fetch from OpenAI...`);
      
      const timeoutMs = 30000 * attempt; // Increase timeout with each retry
      const response = await fetchWithTimeout(url, options, timeoutMs);
      
      console.log(`✅ Fetch successful on attempt ${attempt}`);
      return response;
      
    } catch (error) {
      console.error(`❌ Attempt ${attempt} failed:`, error);
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Wait before retrying (exponential backoff)
      const delay = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s...
      console.log(`⏱️  Waiting ${delay}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new Error("Max retries exceeded");
}

export async function GET() {
  console.log("=== SESSION API DEBUG ===");
  console.log("Environment check:");
  console.log("- NODE_ENV:", process.env.NODE_ENV);
  console.log("- API Key exists:", !!process.env.OPENAI_API_KEY);
  console.log("- API Key length:", process.env.OPENAI_API_KEY?.length);
  console.log("- API Key starts with sk-:", process.env.OPENAI_API_KEY?.startsWith('sk-'));

  if (!process.env.OPENAI_API_KEY) {
    console.error("❌ OPENAI_API_KEY is not set!");
    return NextResponse.json(
      { error: "OpenAI API key not configured" },
      { status: 500 }
    );
  }

  if (!process.env.OPENAI_API_KEY.startsWith('sk-')) {
    console.error("❌ OPENAI_API_KEY doesn't start with 'sk-'");
    return NextResponse.json(
      { error: "Invalid OpenAI API key format" },
      { status: 500 }
    );
  }

  console.log("✅ API Key validation passed");

  try {
    // First, let's try a simple connectivity test
    console.log("🔍 Testing basic connectivity to OpenAI...");
    
    const connectivityTest = await fetchWithTimeout(
      "https://api.openai.com/v1/models", 
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
      },
      15000
    );
    
    if (connectivityTest.ok) {
      console.log("✅ Basic connectivity to OpenAI successful");
    } else {
      console.log("⚠️  Basic connectivity returned non-OK status:", connectivityTest.status);
    }

    // Now try the realtime session endpoint with retry logic
    console.log("🔄 Making request to OpenAI Realtime API...");
    
    const response = await fetchWithRetry(
      "https://api.openai.com/v1/realtime/sessions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
          // Add user agent and additional headers that might help
          "User-Agent": "NextJS-Realtime-Client/1.0",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-realtime-preview-2024-12-17",
        }),
      },
      3 // max retries
    );

    console.log("📡 OpenAI Response Status:", response.status);
    console.log("📡 OpenAI Response Headers:", Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ OpenAI API Error:", errorText);
      
      return NextResponse.json(
        { 
          error: `OpenAI API Error: ${response.status}`,
          details: errorText,
          suggestion: response.status === 401 ? "Check your API key" : 
                     response.status === 403 ? "Check if you have access to Realtime API" :
                     response.status === 429 ? "Rate limit exceeded" : 
                     response.status === 404 ? "Realtime API endpoint not found - check if you have beta access" :
                     "Unknown error"
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log("✅ OpenAI Response Success!");
    console.log("📦 Full OpenAI response:", JSON.stringify(data, null, 2));

    // Handle different possible response structures from OpenAI
    let ephemeralKey = null;
    
    if (data.client_secret?.value) {
      ephemeralKey = data.client_secret.value;
    } else if (typeof data.client_secret === 'string') {
      ephemeralKey = data.client_secret;
    } else if (data.ephemeral_key) {
      ephemeralKey = data.ephemeral_key;
    }

    if (!ephemeralKey) {
      console.error("❌ No ephemeral key found in any expected format");
      return NextResponse.json(
        { 
          error: "Invalid response from OpenAI - no ephemeral key",
          receivedStructure: Object.keys(data),
          fullResponse: data
        },
        { status: 500 }
      );
    }

    console.log("✅ Ephemeral key found:", ephemeralKey.substring(0, 20) + "...");
    
    const responseData = {
      client_secret: {
        value: ephemeralKey
      }
    };

    console.log("✅ Returning formatted response");
    return NextResponse.json(responseData);

  } catch (error) {
    console.error("❌ Fetch Error:", error);
    
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error cause:", (error as any).cause);
    }

    // Provide specific error messages based on the error type
    let errorMessage = "Network error connecting to OpenAI";
    let suggestion = "Check your internet connection";
    
    if (error instanceof Error) {
      if (error.message.includes('timeout') || error.message.includes('TIMEOUT')) {
        errorMessage = "Connection timeout to OpenAI API";
        suggestion = "OpenAI API is taking too long to respond. This might be due to high traffic or network issues. Try again in a moment.";
      } else if (error.message.includes('ENOTFOUND') || error.message.includes('DNS')) {
        errorMessage = "DNS resolution error";
        suggestion = "Cannot resolve api.openai.com. Check your DNS settings or try using a different network.";
      } else if (error.message.includes('ECONNREFUSED')) {
        errorMessage = "Connection refused";
        suggestion = "Connection to OpenAI was refused. Check if you're behind a firewall or proxy.";
      } else if (error.name === 'AbortError') {
        errorMessage = "Request was aborted due to timeout";
        suggestion = "The request took too long. OpenAI servers might be overloaded.";
      }
    }

    return NextResponse.json(
      { 
        error: errorMessage,
        details: error instanceof Error ? error.message : "Unknown error",
        suggestion,
        troubleshooting: [
          "1. Check your internet connection",
          "2. Try again in a few moments (OpenAI servers might be busy)",
          "3. Check if you're behind a corporate firewall",
          "4. Verify your OpenAI API key has Realtime API access",
          "5. Try using a VPN if you're in a restricted region"
        ]
      },
      { status: 500 }
    );
  }
}