import { useLocation } from "react-router-dom";
import { useState } from "react";

export default function SyllabusPage() {
  const location = useLocation();
  const syllabus = location.state?.syllabus || {};
  const topics = syllabus.topics || [];
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextTopic = () => {
    if (currentIndex < topics.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const prevTopic = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  return (
    <div className="flex h-screen">
      {/* Main Content (3/4th of the page) */}
      <div className="w-3/4 p-8 bg-gray-100 flex flex-col justify-between">
        {/* Title & Current Topic */}
        <div>
          <h1 className="text-3xl font-bold text-blue-600">{syllabus.subject || "No Subject"}</h1>
          <h2 className="text-2xl font-semibold mt-4">{topics[currentIndex] || "No Topics Available"}</h2>
        </div>

        {/* Navigation Buttons at the Bottom */}
        <div className="flex justify-center space-x-4 mb-4">
          <button
            onClick={prevTopic}
            disabled={currentIndex === 0}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={nextTopic}
            disabled={currentIndex === topics.length - 1}
            className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      {/* Sidebar (1/4th of the page) */}
      <div className="w-1/4 bg-white p-4 shadow-lg flex flex-col">
        {/* Syllabus Preview (small YouTube-style preview) */}
        <div className="p-3 border rounded-md mb-4">
          <h1 className="text-lg font-bold text-blue-600">{syllabus.subject}</h1>
          <p className="text-gray-700">{syllabus.summary || "No summary provided."}</p>
        </div>

        {/* Key Topics List */}
        <h2 className="text-lg font-semibold text-blue-500">Key Topics</h2>
        <ul className="mt-2 space-y-1">
          {topics.map((topic, index) => (
            <li
              key={index}
              className={`p-2 rounded-md cursor-pointer ${
                index === currentIndex ? "bg-blue-200 font-bold" : "hover:bg-gray-200"
              }`}
              onClick={() => setCurrentIndex(index)}
            >
              {topic}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
