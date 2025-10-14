import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="bg-blue-600 text-white">
      <div className="container mx-auto p-4 flex justify-between">
        <Link to="/" className="font-semibold text-lg">
          <span className="sm:hidden">TS</span>
          <span className="hidden sm:inline">Task Scheduler</span>
        </Link>
        <div className="space-x-4">
          <Link to="/task/new" className="hover:underline">
            New<span className="hidden md:inline"> Task</span>
          </Link>
          <Link to="/tasks" className="hover:underline">
            Tasks
          </Link>
          <Link to="/executions" className="hover:underline">
            Executions
          </Link>
          <Link to="/stats" className="hover:underline">
            Stats
          </Link>
        </div>
      </div>
    </nav>
  );
}
