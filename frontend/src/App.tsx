import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./App.css";
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";
import Tasks from "./components/Tasks";
import NewTask from "./components/NewTask";
import Home from "./components/Home";
import EditTask from "./components/EditTask";
import Executions from "./components/Executions";
import Stats from "./components/Stats";

function App() {
  return (
    <BrowserRouter>
      <header>
        <Navbar />
      </header>
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/executions" element={<Executions />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/task/new" element={<NewTask />} />
          <Route path="/task/:id/edit" element={<EditTask />} />
        </Routes>
      </main>
      <footer>
        <Footer />
      </footer>
    </BrowserRouter>
  );
}

export default App;
