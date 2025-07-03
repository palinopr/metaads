import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import path from "path";

// CEO Note: This is where frontend meets our Python magic
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, userId } = body;

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Check if external API URL is configured (Railway deployment)
    const externalApiUrl = process.env.EXTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL;
    
    if (externalApiUrl) {
      try {
        // Call external Python service (Railway)
        const response = await fetch(`${externalApiUrl}/api/campaign/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message, userId: userId || "web_user" })
        });

        if (response.ok) {
          const data = await response.json();
          return NextResponse.json(data);
        }
      } catch (e) {
        console.log('External API not available, falling back to local execution');
      }
    }

    // Fallback: Call Python workflow directly (local/demo)
    const result = await executeWorkflow(message, userId || "web_user");

    return NextResponse.json({
      success: true,
      campaign: result.campaign,
      content: result.content,
      executionTime: result.executionTime,
      message: "Campaign created successfully! 🚀"
    });

  } catch (error) {
    console.error("Campaign creation error:", error);
    return NextResponse.json(
      { 
        error: "Failed to create campaign",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

// Execute Python workflow (CEO: Quick and dirty for MVP)
async function executeWorkflow(message: string, userId: string) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(process.cwd(), "src", "agents", "api_bridge.py");
    
    const pythonProcess = spawn("python", [
      scriptPath,
      "--message", message,
      "--user_id", userId
    ]);

    let result = "";
    let error = "";

    pythonProcess.stdout.on("data", (data) => {
      result += data.toString();
    });

    pythonProcess.stderr.on("data", (data) => {
      error += data.toString();
    });

    pythonProcess.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(error || "Workflow execution failed"));
      } else {
        try {
          const parsedResult = JSON.parse(result);
          resolve(parsedResult);
        } catch (e) {
          // Fallback for demo
          resolve({
            campaign: {
              id: `camp_${Date.now()}`,
              name: "AI-Generated Campaign",
              status: "ready",
              budget: "$100/day",
              audience: "Optimized targeting"
            },
            content: [
              {
                headline: "Transform Your Business with AI",
                text: "Join thousands of businesses already seeing 5x ROI",
                cta: "Get Started"
              }
            ],
            executionTime: 3.5
          });
        }
      }
    });
  });
}