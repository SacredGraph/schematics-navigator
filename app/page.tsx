"use client";

import Search from "./components/Search";

export default function Home() {
  const handleSelect = (value: string) => {
    console.log("Selected value:", value);
    // Add additional logic when a suggestion is selected
  };

  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="w-full max-w-2xl mt-20 px-4">
        <Search onSelect={handleSelect} />
      </div>
    </main>
  );
}
