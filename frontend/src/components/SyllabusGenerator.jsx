import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function SyllabusGenerator() {
  const [subject, setSubject] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject) return;

    try {
      const response = await axios.post("http://127.0.0.1:5000/generate_syllabus", { subject });
      navigate("/syllabus", { state: { syllabus: response.data } });
    } catch (error) {
      console.error("Error generating syllabus:", error);
    }
  };

  return (
    <div className="flex flex-col items-center p-6">
      <div className="bg-white shadow-lg p-6 rounded-xl text-center max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4">Generate Syllabus</h1>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Enter subject..."
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full p-2 border rounded-md mb-3"
          />
          <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700">
            Generate
          </button>
        </form>
      </div>
    </div>
  );
}
