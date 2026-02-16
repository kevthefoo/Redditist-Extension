"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";

export default function ExtensionAuthPage() {
  const { isSignedIn, getToken } = useAuth();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState("Authenticating...");

  useEffect(() => {
    if (!isSignedIn) {
      // Redirect to sign-in, then back here
      window.location.href = `/sign-in?redirect_url=${encodeURIComponent("/extension-auth" + window.location.search)}`;
      return;
    }

    sendTokenToExtension();
  }, [isSignedIn]);

  async function sendTokenToExtension() {
    try {
      const token = await getToken();
      const extensionId = new URLSearchParams(window.location.search).get(
        "extensionId"
      );

      if (!extensionId) {
        setStatus("error");
        setMessage("Missing extension ID. Please try again from the extension.");
        return;
      }

      // Send token to extension via chrome.runtime.sendMessage
      if (typeof chrome !== "undefined" && chrome.runtime) {
        chrome.runtime.sendMessage(
          extensionId,
          { type: "AUTH_TOKEN", token },
          (response) => {
            if (chrome.runtime.lastError) {
              setStatus("error");
              setMessage(
                "Could not connect to the extension. Make sure it is installed and enabled."
              );
              return;
            }

            if (response?.success) {
              setStatus("success");
              setMessage(
                "Successfully signed in! You can close this tab and return to the extension."
              );
            } else {
              setStatus("error");
              setMessage("Failed to send auth token to extension.");
            }
          }
        );
      } else {
        setStatus("error");
        setMessage(
          "Chrome extension API not available. Make sure you're using Google Chrome."
        );
      }
    } catch {
      setStatus("error");
      setMessage("Authentication failed. Please try again.");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="max-w-md rounded-xl border border-white/10 bg-white/5 p-8 text-center">
        <div className="mb-4 text-4xl">
          {status === "loading" && "⏳"}
          {status === "success" && "✅"}
          {status === "error" && "❌"}
        </div>
        <h1 className="text-xl font-bold">Extension Authentication</h1>
        <p className="mt-4 text-gray-400">{message}</p>
        {status === "success" && (
          <p className="mt-4 text-sm text-gray-500">
            This tab will close automatically...
          </p>
        )}
      </div>
    </div>
  );
}
