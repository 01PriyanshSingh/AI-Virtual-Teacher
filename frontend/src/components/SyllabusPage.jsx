import { useLocation } from "react-router-dom";
import { useState, useEffect } from "react";

let speechInstance = null; // Global instance for speech control

// Function to Speak Text
const speakText = (text, callback) => {
  if ("speechSynthesis" in window) {
    speechInstance = new SpeechSynthesisUtterance(text);
    speechInstance.onend = callback; // Move to the next subtopic after speaking
    speechInstance.onerror = (e) => console.error("Speech error:", e);

    window.speechSynthesis.cancel(); // Stop previous speech
    window.speechSynthesis.speak(speechInstance);
  } else {
    alert("Text-to-Speech is not supported in this browser.");
  }
};

export default function SyllabusPage() {
  const location = useLocation();
  const syllabus = location.state?.syllabus || {};
  const topics = syllabus.topics || [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [subtopics, setSubtopics] = useState({});
  const [currentSubtopicIndex, setCurrentSubtopicIndex] = useState(0);
  const [imageUrl, setImageUrl] = useState("");
  const [openTopics, setOpenTopics] = useState({});
  const [isTeaching, setIsTeaching] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [highlightedTopic, setHighlightedTopic] = useState(null);
  const [highlightedSubtopic, setHighlightedSubtopic] = useState(null);

  useEffect(() => {
    fetch("http://127.0.0.1:5000/get_subtopics")
      .then((response) => response.json())
      .then((data) => setSubtopics(data))
      .catch((error) => console.error("Error fetching subtopics:", error));
  }, []);

  const currentTopic = topics[currentIndex] || "No Topics Available";
  const subtopicList = subtopics[currentTopic] || [];
  const currentSubtopic = subtopicList[currentSubtopicIndex] || null;

  useEffect(() => {
    if (currentSubtopic) {
      const imagePath = `http://127.0.0.1:5000/get_image/${encodeURIComponent(currentSubtopic.title)}`;
      setImageUrl(imagePath);
    }
  }, [currentSubtopic]);

  // Toggle Key Topic Expansion
  const toggleTopic = (index) => {
    setOpenTopics((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  // Start Teaching Mode
  const startTeaching = () => {
    if (!subtopicList.length) {
      alert("No subtopics available for this topic.");
      return;
    }

    setIsTeaching(true);
    setIsPaused(false);
    setHighlightedTopic(currentTopic);
    speakNextSubtopic(currentSubtopicIndex);
  };

  // Speak Next Subtopic
  const speakNextSubtopic = (index) => {
    if (index < subtopicList.length) {
      const subtopic = subtopicList[index];
      setCurrentSubtopicIndex(index);
      setHighlightedSubtopic(subtopic.name);

      speakText(`${subtopic.name}. ${subtopic.explanation}`, () => speakNextSubtopic(index + 1));
    } else {
      setIsTeaching(false);
      setHighlightedTopic(null);
      setHighlightedSubtopic(null);
    }
  };

  // Pause Speech
  const pauseTeaching = () => {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  };

  // Resume Speech
  const resumeTeaching = () => {
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    }
  };

  return (
    <div className="flex h-screen">
      {/* Main Content (3/4th of the page) */}
      <div className="w-3/4 p-8 bg-gray-100 flex flex-col justify-between">
        <div>
          <h1 className="text-3xl font-bold text-blue-600">{syllabus.subject || "No Subject"}</h1>
          <h2 className={`text-2xl font-semibold mt-4 ${highlightedTopic === currentTopic ? "text-red-600" : ""}`}>
            {currentTopic}
          </h2>

          {/* Subtopics Section */}
          <h3 className={`text-xl font-semibold mt-4 ${highlightedSubtopic === currentSubtopic?.name ? "text-red-600" : "text-gray-700"}`}>
            {currentSubtopic?.name || "No Subtopics Available"}
          </h3>
          <p className="mt-2 text-gray-600">{currentSubtopic?.explanation || ""}</p>

          {/* Display Image */}
          {imageUrl && (
            <img src={imageUrl} alt="Subtopic Illustration" className="mt-4 w-64 h-40 object-contain rounded-lg shadow-md" />
          )}
        </div>

        {/* Navigation & Teaching Buttons */}
        <div className="flex justify-between space-x-4 mt-4">
          <button
            onClick={startTeaching}
            className="px-4 py-2 bg-purple-600 text-white rounded-md disabled:opacity-50"
            disabled={isTeaching}
          >
            Start Teaching
          </button>
          <button
            onClick={pauseTeaching}
            className="px-4 py-2 bg-yellow-500 text-white rounded-md disabled:opacity-50"
            disabled={!isTeaching || isPaused}
          >
            Pause
          </button>
          <button
            onClick={resumeTeaching}
            className="px-4 py-2 bg-green-500 text-white rounded-md disabled:opacity-50"
            disabled={!isPaused}
          >
            Resume
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
              <div
                className={`p-2 flex justify-between items-center cursor-pointer ${
                  index === currentIndex ? "bg-blue-200 font-bold" : "hover:bg-gray-200"
                } ${highlightedTopic === topic ? "bg-red-300" : ""}`}
                onClick={() => {
                  setCurrentIndex(index);
                  setCurrentSubtopicIndex(0);
                  toggleTopic(index);
                }}
              >
                {topic}
                <span className="text-gray-500">{openTopics[index] ? "▲" : "▼"}</span>
              </div>

              {openTopics[index] && (
                <ul className="ml-4 mt-2 space-y-1">
                  {(subtopics[topic] || []).map((subtopic, subIndex) => (
                    <li
                      key={subIndex}
                      className={`p-2 rounded-md cursor-pointer ${
                        subIndex === currentSubtopicIndex ? "bg-green-200 font-bold" : "hover:bg-gray-200"
                      } ${highlightedSubtopic === subtopic.name ? "bg-red-300" : ""}`}
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
