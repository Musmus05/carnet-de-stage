export default function Loading() {
  return (
    <div aria-busy="true" className="animate-pulse">
      <div className="h-9 w-56 rounded bg-folder" />
      <div className="mt-8 h-3 w-full rounded bg-folder" />
      <div className="mt-6 grid gap-3">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="h-12 rounded bg-folder/70" />
        ))}
      </div>
    </div>
  );
}
