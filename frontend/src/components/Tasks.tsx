import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { btn } from "./styles";

export default function Tasks() {
  const apiUrl = import.meta.env.VITE_API_URL;
  const [tasks, setTasks] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<string[]>([]);
  const [showTask, setShowTask] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    document.title = "Tasks | Task Scheduler";
    getTasks();
  }, [count]);

  async function getTasks() {
    try {
      const res = await fetch(`${apiUrl}/tasks`);
      const data = await res.json();
      setTasks(data);
    } catch {
      setTasks([]);
    }
  }

  async function deleteTask(id: number) {
    if (confirm("Are you sure?")) {
      try {
        const res = await fetch(`${apiUrl}/task/${id}`, {
          method: "DELETE",
        });
        if (res.ok) {
          setCount((prev) => prev + 1);
        } else {
          alert("Error!");
        }
      } catch {
        alert("Error!");
      }
    }
  }

  async function pauseTask(id: number) {
    try {
      const res = await fetch(`${apiUrl}/task/${id}/pause`, {
        method: "POST",
      });
      if (res.ok) {
        setCount((prev) => prev + 1);
      } else {
        alert("Error!");
      }
    } catch {
      alert("Error!");
    }
  }

  async function resumeTask(id: number) {
    try {
      const res = await fetch(`${apiUrl}/task/${id}/resume`, {
        method: "POST",
      });
      if (res.ok) {
        setCount((prev) => prev + 1);
      } else {
        alert("Error!");
      }
    } catch {
      alert("Error!");
    }
  }

  async function triggerTask(id: number) {
    try {
      const res = await fetch(`${apiUrl}/task/${id}/trigger`, {
        method: "POST",
      });
      if (res.ok) {
        setCount((prev) => prev + 1);
        alert("Success!");
      } else {
        alert("Error!");
      }
    } catch {
      alert("Error!");
    }
  }

  function viewTask(nextRuns: string[]) {
    setSchedules(nextRuns);
    setShowTask(true);
  }

  function closeTask() {
    setShowTask(false);
    setSchedules([""]);
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-4">Tasks</h1>
      {tasks.length ? (
        <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
          <table className="w-full text-sm text-gray-500 text-center">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th className="px-6 py-3">ID</th>
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Cron</th>
                <th className="px-6 py-3">Active</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((t: Record<string, any>, i: number) => (
                <tr
                  key={i}
                  className="bg-white border-b border-gray-200 hover:bg-gray-50"
                >
                  <td className="px-6 py-4">{t.id}</td>
                  <td className="px-6 py-4">{t.name}</td>
                  <td className="px-6 py-4">{t.cron}</td>
                  <td className="px-6 py-4">{t.active ? "Yes" : "No"}</td>
                  <td className="px-6 py-4">
                    <Link
                      to={`/task/${t.id}/edit`}
                      className="cursor-pointer mr-2 hover:underline"
                    >
                      Edit
                    </Link>
                    <button
                      className="cursor-pointer mr-2 hover:underline"
                      onClick={() => deleteTask(t.id)}
                    >
                      Delete
                    </button>
                    {t.paused ? (
                      <button
                        className="cursor-pointer mr-2 hover:underline"
                        onClick={() => resumeTask(t.id)}
                      >
                        Resume
                      </button>
                    ) : (
                      <button
                        className="cursor-pointer mr-2 hover:underline"
                        onClick={() => pauseTask(t.id)}
                      >
                        Pause
                      </button>
                    )}
                    <button
                      className="cursor-pointer mr-2 hover:underline"
                      onClick={() => triggerTask(t.id)}
                    >
                      Trigger
                    </button>
                    <button
                      className="cursor-pointer hover:underline"
                      onClick={() => viewTask(t.next_runs)}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div>Data not found.</div>
      )}

      {showTask ? (
        <div
          aria-hidden={!showTask}
          className="fixed inset-0 z-50 flex items-center justify-center"
        >
          <div className="p-4 max-w-md mx-auto bg-gray-100 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Next Runs</h2>
            {schedules?.map((s, i) => (
              <p key={i}>{new Date(s).toUTCString()}</p>
            ))}
            <button className={`${btn} mt-4`} onClick={closeTask}>
              Close
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
