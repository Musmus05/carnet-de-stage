"use client";

import { Button } from "@/components/ui";

// Shown inside the app shell. Kept bilingual because error boundaries
// cannot read the server-side dictionary.
export default function AppError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mt-10 max-w-md">
      <h1 className="font-serif text-2xl font-semibold">Une erreur est survenue · Something went wrong</h1>
      <p className="mt-2 text-ink-2">Réessayez dans un instant. · Try again in a moment.</p>
      <Button className="mt-6" onClick={reset}>
        Réessayer · Try again
      </Button>
    </div>
  );
}
