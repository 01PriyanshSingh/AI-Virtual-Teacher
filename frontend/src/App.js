import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar"; // Import your Navbar
import SyllabusGenerator from "./components/SyllabusGenerator";
import SyllabusPage from "./components/SyllabusPage";
import QuizPage from "./components/QuizPage";

export default function App() {
  return (
    <Router>
      {/* Include the Navbar here */}
      <Navbar />

      <div className="pt-20"> {/* Add padding to account for the fixed navbar */}
        <Routes>
          <Route path="/" element={<SyllabusGenerator />} />
          <Route path="/syllabus" element={<SyllabusPage />} />
          <Route path="/quiz" element={<QuizPage />} />
        </Routes>
      </div>
    </Router>
  );
}
