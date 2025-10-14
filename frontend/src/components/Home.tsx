import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    document.title = "Task Scheduler | Home";
  }, []);

  return (
    <div className="container mx-auto p-4 flex justify-center">
      <h1 className="text-4xl font-bold mt-30">Task Scheduler</h1>
    </div>
  );
}
