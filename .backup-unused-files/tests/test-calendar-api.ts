import { createGoogleMeetLink } from "../lib/google-meet";

async function testCalendarIntegration() {
  console.log("--- Testing Google Calendar API Integration ---");
  
  try {
    const start = new Date(Date.now() + 3600000); // 1 hour from now
    const end = new Date(start.getTime() + 1800000); // 30 mins duration

    console.log("Attempting to create a Google Meet link...");
    const result = await createGoogleMeetLink({
      title: "API Verification Meeting",
      descriptionHtml: "<p>This is a test meeting to verify the Google Calendar API integration.</p>",
      start,
      end
    });

    console.log("✓ Success! Meeting created.");
    console.log(`Meet Link: ${result.meetLink}`);
    console.log(`Event ID: ${result.eventId}`);
    console.log(`HTML Link: ${result.htmlLink}`);
    
    console.log("\n--- Verification Complete ---");
  } catch (error) {
    console.error("\n--- Calendar API Verification Failed ---");
    if (error instanceof Error) {
      console.error(`Error Message: ${error.message}`);
      if (error.message.includes("Google Calendar API has not been used")) {
        console.error("Reason: The Google Calendar API is not enabled in your Google Cloud Project.");
      }
    } else {
      console.error(error);
    }
    process.exit(1);
  }
}

testCalendarIntegration();
