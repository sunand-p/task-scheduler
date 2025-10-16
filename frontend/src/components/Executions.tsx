import { useEffect, useState } from "react";
import { API } from "../api";

export default function Executions() {
  const [tasks, setTasks] = useState<any[]>([]);

  useEffect(() => {
    document.title = "Executions | Task Scheduler";
    getExecs();
  }, []);

  async function getExecs() {
    try {
      const res = await fetch(`${API}/executions`);
      const data = await res.json();
      setTasks(data);
    } catch {
      setTasks([]);
    }
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-4">Executions</h1>
      {tasks.length ? (
        <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
          <table className="w-full text-sm text-gray-500 text-center">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th className="px-6 py-3">Task ID</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Time (UTC)</th>
                <th className="px-6 py-3">Attempt</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((t: Record<string, any>, i: number) => (
                <tr
                  key={i}
                  className="bg-white border-b border-gray-200 hover:bg-gray-50"
                >
                  <td className="px-6 py-4">{t.task_id}</td>
                  <td className="px-6 py-4">{t.status}</td>
                  <td className="px-6 py-4">
                    {new Date(t.start).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">{t.attempt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div>Data not found.</div>
      )}
    </div>
  );
}
