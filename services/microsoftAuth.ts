
import { PublicClientApplication, Configuration, AuthenticationResult } from "@azure/msal-browser";

// IMPORTANT: Replace this with your actual Client ID from Azure Portal
// Register a generic SPA app at portal.azure.com
// Supported account types: "Accounts in any organizational directory (Any Microsoft Entra ID tenant - Multitenant) and personal Microsoft accounts (e.g. Skype, Xbox)"
const CLIENT_ID = "YOUR_CLIENT_ID_HERE"; 

const msalConfig: Configuration = {
    auth: {
        clientId: CLIENT_ID,
        authority: "https://login.microsoftonline.com/common",
        redirectUri: window.location.origin, // This assumes you registered http://localhost:5173 or similar
    },
    cache: {
        cacheLocation: "sessionStorage",
        storeAuthStateInCookie: false,
    },
};

let msalInstance: PublicClientApplication | null = null;

export const initializeMsal = async () => {
    if (!msalInstance) {
        msalInstance = new PublicClientApplication(msalConfig);
        await msalInstance.initialize();
    }
    return msalInstance;
};

export const signInWithMicrosoft = async (): Promise<string | null> => {
    // Fail gracefully if the developer hasn't set the Client ID yet
    if (CLIENT_ID === "YOUR_CLIENT_ID_HERE") {
        console.warn("Microsoft Auth: No Client ID provided. Skipping real auth.");
        alert("To use real Microsoft Outlook integration, please open 'services/microsoftAuth.ts' and replace 'YOUR_CLIENT_ID_HERE' with your Azure Application (client) ID.");
        return null;
    }

    try {
        const msal = await initializeMsal();
        const loginRequest = {
            scopes: ["User.Read", "Mail.Read"],
        };
        
        const response: AuthenticationResult = await msal.loginPopup(loginRequest);
        return response.accessToken;
    } catch (error: any) {
        // Handle user cancellation specifically to avoid noisy console errors
        if (error.errorCode === "user_cancelled") {
            console.log("User cancelled the Microsoft login flow.");
            return null;
        }
        console.error("Microsoft Login Failed:", error);
        return null;
    }
};

export interface EmailMessage {
    subject: string;
    sender: { emailAddress: { name: string; address: string } };
    receivedDateTime: string;
    bodyPreview: string;
}

export const fetchRecentEmails = async (accessToken: string): Promise<EmailMessage[]> => {
    const headers = new Headers();
    const bearer = `Bearer ${accessToken}`;
    headers.append("Authorization", bearer);

    const options = {
        method: "GET",
        headers: headers,
    };

    try {
        // Fetch top 20 emails
        const graphEndpoint = "https://graph.microsoft.com/v1.0/me/mailFolders/inbox/messages?$select=sender,subject,receivedDateTime,bodyPreview&$top=20";
        const response = await fetch(graphEndpoint, options);
        
        if (!response.ok) {
            throw new Error(`Graph API Error: ${response.statusText}`);
        }

        const data = await response.json();
        return data.value || [];
    } catch (error) {
        console.error("Graph API Call Failed:", error);
        return [];
    }
};
