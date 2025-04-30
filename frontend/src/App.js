import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SyllabusGenerator from "./components/SyllabusGenerator";
import SyllabusPage from "./components/SyllabusPage";
import QuizPage from "./components/QuizPage";




export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<SyllabusGenerator />} />
        <Route path="/syllabus" element={<SyllabusPage />} />
        <Route path="/quiz" element={<QuizPage />} />
      </Routes>
    </Router>
  );
}