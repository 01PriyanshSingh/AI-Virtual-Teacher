import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SyllabusGenerator from "./components/SyllabusGenerator";
import SyllabusPage from "./components/SyllabusPage";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<SyllabusGenerator />} />
        <Route path="/syllabus" element={<SyllabusPage />} />
      </Routes>
    </Router>
  );
}
