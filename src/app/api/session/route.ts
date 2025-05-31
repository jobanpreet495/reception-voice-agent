// import { NextResponse } from "next/server";

// export async function GET() {
//   try {
//     const response = await fetch(
//       "https://api.openai.com/v1/realtime/sessions",
//       {
//         method: "POST",
//         headers: {
//           Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           model: "gpt-4o-realtime-preview-2024-12-17",
//           // model: "gpt-4o-mini-realtime-preview-2024-12-17",
//         }),
//       }
//     );
//     const data = await response.json();
//     return NextResponse.json(data);
//   } catch (error) {
//     console.error("Error in /session:", error);
//     return NextResponse.json(
//       { error: "Internal Server Error" },
//       { status: 500 }
//     );
//   }
// }




// import { NextResponse } from "next/server";

// // Helper function to make API call with timeout and retry
// async function makeOpenAIRequest(apiKey: string, retries = 3): Promise<Response> {
//   for (let attempt = 1; attempt <= retries; attempt++) {
//     try {
//       console.log(`Attempt ${attempt} to reach OpenAI API...`);
      
//       const controller = new AbortController();
//       const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
//       const response = await fetch(
//         "https://api.openai.com/v1/realtime/sessions",
//         {
//           method: "POST",
//           headers: {
//             Authorization: `Bearer ${apiKey}`,
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify({
//             model: "gpt-4o-realtime-preview-2024-12-17",
//           }),
//           signal: controller.signal,
//         }
//       );
      
//       clearTimeout(timeoutId);
//       return response;
      
//     } catch (error) {
//       console.error(`Attempt ${attempt} failed:`, error);
      
//       if (attempt === retries) {
//         throw error;
//       }
      
//       // Wait before retry (exponential backoff)
//       const delay = Math.pow(2, attempt) * 1000;
//       console.log(`Waiting ${delay}ms before retry...`);
//       await new Promise(resolve => setTimeout(resolve, delay));
//     }
//   }
  
//   throw new Error("All retry attempts failed");
// }

// export async function GET() {
//   try {
//     console.log("Session API called");
//     console.log("API Key exists:", !!process.env.OPENAI_API_KEY);
//     console.log("API Key starts with sk-:", process.env.OPENAI_API_KEY?.startsWith('sk-'));
    
//     if (!process.env.OPENAI_API_KEY) {
//       console.error("OPENAI_API_KEY environment variable is not set");
//       return NextResponse.json(
//         { error: "OpenAI API key not configured" },
//         { status: 500 }
//       );
//     }

//     // Test basic connectivity first
//     console.log("Testing basic connectivity to OpenAI...");
    
//     const response = await makeOpenAIRequest(process.env.OPENAI_API_KEY);
    
//     console.log("OpenAI API response status:", response.status);
//     console.log("OpenAI API response headers:", Object.fromEntries(response.headers.entries()));
    
//     if (!response.ok) {
//       const errorText = await response.text();
//       console.error("OpenAI API error response:", errorText);
      
//       // Handle specific error cases
//       if (response.status === 401) {
//         return NextResponse.json(
//           { error: "Invalid OpenAI API key" },
//           { status: 401 }
//         );
//       } else if (response.status === 429) {
//         return NextResponse.json(
//           { error: "Rate limit exceeded. Please try again later." },
//           { status: 429 }
//         );
//       } else if (response.status === 403) {
//         return NextResponse.json(
//           { error: "Access denied. Check if your account has access to the Realtime API." },
//           { status: 403 }
//         );
//       }
      
//       return NextResponse.json(
//         { error: `OpenAI API error: ${response.status} - ${errorText}` },
//         { status: response.status }
//       );
//     }

//     const data = await response.json();
//     console.log("OpenAI API response data structure:", {
//       hasClientSecret: !!data.client_secret,
//       clientSecretType: typeof data.client_secret,
//       clientSecretHasValue: !!data.client_secret?.value,
//       fullResponse: data
//     });
    
//     return NextResponse.json(data);
    
//   } catch (error) {
//     console.error("Error in /session:", error);
    
//     // Provide more specific error messages
//     let errorMessage = "Internal Server Error";
//     let statusCode = 500;
    
//     if (error instanceof Error) {
//       if (error.name === 'AbortError' || error.message.includes('timeout')) {
//         errorMessage = "Request timeout - unable to reach OpenAI API. Check your network connection.";
//         statusCode = 504;
//       } else if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
//         errorMessage = "Network error - unable to connect to OpenAI API. Check your internet connection or firewall settings.";
//         statusCode = 503;
//       }
//     }
    
//     return NextResponse.json(
//       { 
//         error: errorMessage, 
//         details: error instanceof Error ? error.message : "Unknown error",
//         suggestion: "Try connecting from a different network or check if you're behind a firewall/proxy"
//       },
//       { status: statusCode }
//     );
//   }
// }







import { NextResponse } from "next/server";

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
  console.log("🔄 Making request to OpenAI...");

  try {
    const response = await fetch(
      "https://api.openai.com/v1/realtime/sessions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-realtime-preview-2024-12-17",
        }),
      }
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
                     response.status === 429 ? "Rate limit exceeded" : "Unknown error"
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log("✅ OpenAI Response Success!");
    console.log("📦 Response structure:", {
      hasClientSecret: !!data.client_secret,
      clientSecretType: typeof data.client_secret,
      clientSecretHasValue: !!data.client_secret?.value,
      keys: Object.keys(data)
    });

    if (!data.client_secret?.value) {
      console.error("❌ No client_secret.value in response");
      return NextResponse.json(
        { error: "Invalid response from OpenAI - no ephemeral key" },
        { status: 500 }
      );
    }

    console.log("✅ Ephemeral key found, returning response");
    return NextResponse.json(data);

  } catch (error) {
    console.error("❌ Fetch Error:", error);
    
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }

    return NextResponse.json(
      { 
        error: "Network error connecting to OpenAI",
        details: error instanceof Error ? error.message : "Unknown error",
        suggestion: "Check your internet connection and firewall settings"
      },
      { status: 500 }
    );
  }
}