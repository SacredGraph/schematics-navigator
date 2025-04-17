export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="w-full max-w-2xl mt-20 px-4">
        <input
          type="text"
          placeholder="Search by net name (e.g., VDD, GND, CLK)"
          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-lg"
        />
      </div>
    </main>
  );
}
