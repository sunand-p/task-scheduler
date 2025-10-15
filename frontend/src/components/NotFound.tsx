import { useEffect } from "react";

export default function NotFound() {
  useEffect(() => {
    document.title = "404 | Task Scheduler";
  }, []);

  return (
    <div className="container mx-auto p-4 flex justify-center">
      <div>
        <h1 className="text-4xl font-bold mt-30">404</h1>
        <p className="mt-4">Page not found!</p>
      </div>
    </div>
  );
}
