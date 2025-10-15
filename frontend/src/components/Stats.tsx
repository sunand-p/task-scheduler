import { useEffect, useState } from "react";
import { API } from "../api";

export default function Stats() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [stats, setStats] = useState<Record<string, any>>({});

  useEffect(() => {
    document.title = "Stats | Task Scheduler";
    getStats();
  }, []);

  async function getStats() {
    try {
      const res = await fetch(`${API}/stats`);
      const data = await res.json();
      setStats(data);
      setTasks(data.upcoming);
    } catch {
      setTasks([]);
    }
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-4">Stats</h1>
      <p>Tasks: {stats.total_tasks}</p>
      <p>Executions: {stats.total_executions}</p>
      <p>Success Rate: {stats.success_rate}%</p>
      {tasks.length ? (
        <div className="relative overflow-x-auto shadow-md sm:rounded-lg mt-4">
          <table className="w-full text-sm text-gray-500 text-center">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th className="px-6 py-3">Task ID</th>
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Next Run</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((t: Record<string, any>, i: number) => (
                <tr
                  key={i}
                  className="bg-white border-b border-gray-200 hover:bg-gray-50"
                >
                  <td className="px-6 py-4">{t.task_id}</td>
                  <td className="px-6 py-4">{t.name}</td>
                  <td className="px-6 py-4">
                    {new Date(t.next_run).toUTCString()}
                  </td>
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
