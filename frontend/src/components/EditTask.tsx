import React, { useEffect, useState } from "react";
import parser from "cron-parser";
import { btn } from "./styles";
import { useNavigate, useParams } from "react-router-dom";

export default function EditTask() {
  const apiUrl = import.meta.env.VITE_API_URL;
  const { id } = useParams();
  const [name, setName] = useState("");
  const [cron, setCron] = useState("");
  const [command, setCommand] = useState("");
  // const [loading, setLoading] = useState(false);
  // const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Edit Task | Task Scheduler";
    getTask();
  }, []);

  async function getTask() {
    try {
      const res = await fetch(`${apiUrl}/task/${id}`);
      const data = await res.json();
      setName(data.name);
      setCron(data.cron);
      setCommand(data.command);
    } catch {
      setName("");
      setCron("");
      setCommand("");
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      parser.parse(cron);
    } catch {
      alert("Invalid Cron!");
      return;
    }
    // setLoading(true);
    // setError("");

    try {
      const response = await fetch(`${apiUrl}/task/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          cron,
          command,
        }),
      });

      if (response.ok) {
        setName("");
        setCron("");
        setCommand("");
        alert("Task updated successfully!");
        navigate("/tasks");
      } else {
        alert("Error!");
      }
    } catch {
      alert("Error!");
    } finally {
      // setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <form
        onSubmit={handleSubmit}
        className="max-w-md mx-auto p-4 space-y-3 bg-white rounded-2xl shadow"
      >
        <h1 className="text-xl font-semibold">Edit Task</h1>

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Task name"
          className="w-full border p-2 rounded"
          required
        />

        <input
          value={cron}
          onChange={(e) => setCron(e.target.value)}
          placeholder="Cron expression (Eg: 0 7 * * *)"
          className="w-full border p-2 rounded"
          required
        />

        <input
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          placeholder="Command to run"
          className="w-full border p-2 rounded"
          required
        />

        <button type="submit" className={btn}>
          Save Task
        </button>
      </form>
    </div>
  );
}
