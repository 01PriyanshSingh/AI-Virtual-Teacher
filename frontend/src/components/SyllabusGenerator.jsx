import { useState } from "react";
import axios from "axios";
import { Info } from "lucide-react";

export default function SyllabusGenerator() {
  const [subject, setSubject] = useState("");
  const [syllabus, setSyllabus] = useState(null);
  const [minimized, setMinimized] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject) return;
    
    try {
      const response = await axios.post("http://127.0.0.1:5000/generate_syllabus", { subject });
      setSyllabus(response.data);
    } catch (error) {
      console.error("Error generating syllabus:", error);
    }
  };

  return (
    <div className="flex flex-col items-center p-6">
      {/* Syllabus Form */}
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

      {/* Syllabus Display */}
      {syllabus && (
        <div
          className={`fixed bg-white shadow-lg rounded-lg p-6 transition-all duration-300 ${
            minimized ? "top-5 right-5 w-14 h-14 flex items-center justify-center" : "top-20 max-w-lg"
          }`}
        >
          {/* Minimize/Maximize Button */}
          <button
            onClick={() => setMinimized(!minimized)}
            className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
          >
            <Info size={24} />
          </button>

          {/* Show Content Only When Not Minimized */}
          {!minimized ? (
            syllabus.subject ? (
              <>
                <h1 className="text-xl font-bold text-blue-600">{syllabus.subject}</h1>
                <p className="mt-2 text-gray-700">{syllabus.introduction || "No introduction available."}</p>

                {/* Key Topics */}
                <h2 className="mt-4 text-lg font-semibold text-blue-500">Key Topics</h2>
                {syllabus.topics && syllabus.topics.length > 0 ? (
                  <ul className="list-disc list-inside">
                    {syllabus.topics.map((topic, index) => (
                      <li key={index} className="text-gray-600">{topic}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500">No topics available.</p>
                )}

                {/* Summary */}
                <h2 className="mt-4 text-lg font-semibold text-blue-500">Summary</h2>
                <p className="text-gray-700">{syllabus.summary || "No summary provided."}</p>

                {/* Footer */}
                <footer className="mt-4 text-sm text-gray-500">{syllabus.footer || "No footer text."}</footer>
              </>
            ) : (
              <p className="text-gray-500">No syllabus data available.</p>
            )
          ) : (
            <p className="text-gray-500 text-sm">📜</p>
          )}
        </div>
      )}
    </div>
  );
}
