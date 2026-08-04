"use client";

import { RotateCcw } from "lucide-react";
import { useEffect } from "react";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Signalbrief page error", { digest: error.digest, message: error.message });
  }, [error]);

  return (
    <main className="error-page">
      <div className="error-card">
        <span>Signalbrief</span>
        <h1>The demo hit an unexpected error.</h1>
        <p>No customer data was affected. Retry the page, or open the public repository if the issue persists.</p>
        <div>
          <button onClick={reset}><RotateCcw size={16} /> Try again</button>
          <a href="https://github.com/mherzog4/signalbrief/issues/new">Report an issue</a>
        </div>
      </div>
    </main>
  );
}
