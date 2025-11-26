// functions/index.js
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { google } = require("googleapis");

admin.initializeApp();

// Initialize Google Calendar API
const calendar = google.calendar("v3");

exports.addEventsToCalendar = functions.https.onCall(async (data, context) => {
  // Check if user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "User must be authenticated"
    );
  }

  try {
    const { events } = data;

    if (!events || events.length === 0) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "No events provided"
      );
    }

    // Get user's ID token
    const idToken = context.auth.token;

    // Create OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.FIREBASE_URL}/`
    );

    // Set credentials with the user's token
    oauth2Client.setCredentials({
      access_token: idToken,
    });

    let successCount = 0;
    const failedEvents = [];

    // Add each event to calendar
    for (const event of events) {
      try {
        const response = await calendar.events.insert({
          auth: oauth2Client,
          calendarId: "primary",
          resource: event,
        });

        if (response.status === 200) {
          successCount++;
          console.log(`✅ Added event: ${event.summary}`);
        }
      } catch (err) {
        failedEvents.push({
          summary: event.summary,
          error: err.message,
        });
        console.error(`❌ Failed to add ${event.summary}:`, err.message);
      }
    }

    return {
      success: true,
      successCount,
      totalEvents: events.length,
      failedEvents,
    };
  } catch (error) {
    console.error("Error in addEventsToCalendar:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});