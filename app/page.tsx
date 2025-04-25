"use client";

import { useRouter } from "next/navigation";
import DesignSelector from "./components/DesignSelector";
import Search from "./components/Search";

const useDesignSelection = () => {
  const router = useRouter();

  const handleDesignSelect = (design: string) => {
    router.push(`/${design}`);
  };

  return { handleDesignSelect };
};

export default function Home() {
  const { handleDesignSelect } = useDesignSelection();

  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="w-full max-w-2xl mt-8 px-4">
        <div className="flex gap-4 items-center">
          <div className="w-64">
            <DesignSelector onSelect={handleDesignSelect} />
          </div>
          <div className="flex-1">
            <Search />
          </div>
        </div>
      </div>
    </main>
  );
}
