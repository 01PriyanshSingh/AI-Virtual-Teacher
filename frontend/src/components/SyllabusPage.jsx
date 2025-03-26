import { useLocation } from "react-router-dom";
import { useState, useEffect } from "react";

// Free TTS Integration
const speakText = (text) => {
  const speech = new SpeechSynthesisUtterance(text);
  window.speechSynthesis.cancel(); // Stop previous speech
  window.speechSynthesis.speak(speech);
};

export default function SyllabusPage() {
  const location = useLocation();
  const syllabus = location.state?.syllabus || {};
  const topics = syllabus.topics || [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [subtopics, setSubtopics] = useState({});
  const [currentSubtopicIndex, setCurrentSubtopicIndex] = useState(0);
  const [imageUrl, setImageUrl] = useState("");
  const [openTopics, setOpenTopics] = useState({}); // Tracks open/closed topics

  // Fetch Subtopics from Flask Backend
  useEffect(() => {
    fetch("http://127.0.0.1:5000/get_subtopics")
      .then((response) => response.json())
      .then((data) => setSubtopics(data))
      .catch((error) => console.error("Error fetching subtopics:", error));
  }, []);

  const currentTopic = topics[currentIndex] || "No Topics Available";
  const subtopicList = subtopics[currentTopic] || [];
  const currentSubtopic = subtopicList[currentSubtopicIndex] || null;

  // Fetch Image when Subtopic Changes
  useEffect(() => {
    if (currentSubtopic) {
      const imagePath = `http://127.0.0.1:5000/get_image/${encodeURIComponent(currentSubtopic.title)}`;
      setImageUrl(imagePath);
      speakText(`${currentSubtopic.name}. ${currentSubtopic.explanation}`);
    }
  }, [currentSubtopic]);

  // Toggle Key Topic Expansion
  const toggleTopic = (index) => {
    setOpenTopics((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  // Change Subtopic
  const nextSubtopic = () => {
    if (currentSubtopicIndex < subtopicList.length - 1) {
      setCurrentSubtopicIndex(currentSubtopicIndex + 1);
    }
  };

  const prevSubtopic = () => {
    if (currentSubtopicIndex > 0) {
      setCurrentSubtopicIndex(currentSubtopicIndex - 1);
    }
  };

  return (
    <div className="flex h-screen">
      {/* Main Content (3/4th of the page) */}
      <div className="w-3/4 p-8 bg-gray-100 flex flex-col justify-between">
        <div>
          <h1 className="text-3xl font-bold text-blue-600">{syllabus.subject || "No Subject"}</h1>
          <h2 className="text-2xl font-semibold mt-4">{currentTopic}</h2>

          {/* Subtopics Section */}
          <h3 className="text-xl font-semibold mt-4 text-gray-700">
            {currentSubtopic?.name || "No Subtopics Available"}
          </h3>
          <p className="mt-2 text-gray-600">{currentSubtopic?.explanation || ""}</p>

          {/* Display Image */}
          {imageUrl && (
            <img src={imageUrl} alt="Subtopic Illustration" className="mt-4 w-64 h-40 object-contain rounded-lg shadow-md" />
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between space-x-4 mt-4">
          <button
            onClick={prevSubtopic}
            disabled={currentSubtopicIndex === 0}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md disabled:opacity-50"
          >
            Previous Subtopic
          </button>
          <button
            onClick={nextSubtopic}
            disabled={currentSubtopicIndex === subtopicList.length - 1}
            className="px-4 py-2 bg-green-600 text-white rounded-md disabled:opacity-50"
          >
            Next Subtopic
          </button>
        </div>
      </div>

      {/* ✅ Right Sidebar (Overview & Topics List) */}
      <div className="w-1/4 bg-white p-4 shadow-lg flex flex-col">
        {/* Syllabus Preview */}
        <div className="p-3 border rounded-md mb-4">
          <h1 className="text-lg font-bold text-blue-600">{syllabus.subject}</h1>
          <p className="text-gray-700">{syllabus.summary || "No summary provided."}</p>
        </div>

        {/* Key Topics List with Expandable Subtopics */}
        <h2 className="text-lg font-semibold text-blue-500">Key Topics</h2>
        <ul className="mt-2 space-y-1">
          {topics.map((topic, index) => (
            <li key={index} className="border-b">
              {/* Topic Button */}
              <div
                className={`p-2 flex justify-between items-center cursor-pointer ${
                  index === currentIndex ? "bg-blue-200 font-bold" : "hover:bg-gray-200"
                }`}
                onClick={() => {
                  setCurrentIndex(index);
                  setCurrentSubtopicIndex(0);
                  toggleTopic(index);
                }}
              >
                {topic}
                <span className="text-gray-500">{openTopics[index] ? "▲" : "▼"}</span>
              </div>

              {/* Subtopics (Shown Only If Expanded) */}
              {openTopics[index] && (
                <ul className="ml-4 mt-2 space-y-1">
                  {(subtopics[topic] || []).map((subtopic, subIndex) => (
                    <li
                      key={subIndex}
                      className={`p-2 rounded-md cursor-pointer ${
                        subIndex === currentSubtopicIndex ? "bg-green-200 font-bold" : "hover:bg-gray-200"
                      }`}
                      onClick={() => setCurrentSubtopicIndex(subIndex)}
                    >
                      {subtopic.name}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
