"use client";

import Search from "./components/Search";

export default function Home() {
  const handleSelect = (value: string) => {
    console.log("Selected value:", value);
    // The redirection is now handled in the Search component
  };

  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="w-full max-w-2xl mt-20 px-4">
        <Search onSelect={handleSelect} />
      </div>
    </main>
  );
}
