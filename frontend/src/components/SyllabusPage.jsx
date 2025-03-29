import { useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react"; // Combined import

// Create an audio ref for TTS playback

// New speakText function using the audio element



export default function SyllabusPage() {
  const location = useLocation();
  const syllabus = location.state?.syllabus || {};
  const topics = syllabus.topics || [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [subtopics, setSubtopics] = useState({});
  const [currentSubtopicIndex, setCurrentSubtopicIndex] = useState(0);
  const [currentSubsubtopicIndex, setCurrentSubsubtopicIndex] = useState(0); // New state for subsubtopics
  const [imageUrl, setImageUrl] = useState("");
  const [openTopics, setOpenTopics] = useState({});
  const [isTeaching, setIsTeaching] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [highlightedTopic, setHighlightedTopic] = useState(null);
  const [highlightedSubtopic, setHighlightedSubtopic] = useState(null);
  const [highlightedSubsubtopic, setHighlightedSubsubtopic] = useState(null); // New state for highlighted subsubtopic
  const audioRef = useRef(null);


// Helper: Generate a TTS URL using the Google Translate TTS endpoint.
const getTTSUrl = (text, language = "en") => {
  return `http://localhost:5000/tts?language=${language}&text=${encodeURIComponent(text)}`;
};



  useEffect(() => {
    fetch("http://127.0.0.1:5000/get_subtopics")
      .then((response) => response.json())
      .then((data) => setSubtopics(data))
      .catch((error) => console.error("Error fetching subtopics:", error));
  }, []);

  const currentTopic = topics[currentIndex] || "No Topics Available";
  const subtopicList = subtopics[currentTopic] || [];
  const currentSubtopic = subtopicList[currentSubtopicIndex] || null;
  const subsubtopicList = currentSubtopic?.subsubtopics || []; // Get subsubtopics for the current subtopic
  const currentSubsubtopic = subsubtopicList[currentSubsubtopicIndex] || null;

  useEffect(() => {
    if (currentSubsubtopic) {
      const imagePath = `http://127.0.0.1:5000/get_image/${encodeURIComponent(currentSubsubtopic.title)}`;
      setImageUrl(imagePath);
      console.log("Current Subsubtopic Title:", currentSubsubtopic.title); // Log the title
    }
  }, [currentSubsubtopic]);

  // Toggle Key Topic Expansion
  const toggleTopic = (index) => {
    setOpenTopics((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const speakText = (text, callback) => {
    if (audioRef.current) {
      const ttsUrl = getTTSUrl(text);
      fetch(ttsUrl)
        .then((response) => {
          if (!response.ok) {
            throw new Error("Network response was not ok");
          }
          return response.blob();
        })
        .then((blob) => {
          const audioURL = URL.createObjectURL(blob);
          audioRef.current.src = audioURL;
          audioRef.current.onended = () => {
            URL.revokeObjectURL(audioURL);
            callback();
          };
          audioRef.current.onerror = (e) => {
            console.error("Audio playback error:", e);
            URL.revokeObjectURL(audioURL);
            callback();
          };
          audioRef.current.play();
        })
        .catch((error) => {
          console.error("Error fetching TTS audio:", error);
          callback();
        });
    }
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
    speakNextSubsubtopic(0,0); // Start teaching subsubtopics
  };

  // Speak Next Subsubtopic
  const speakNextSubsubtopic = (subtopicIndex, subsubtopicIndex) => {
    if (subtopicIndex < subtopicList.length) {
      const subtopic = subtopicList[subtopicIndex];
  
      if (subsubtopicIndex === 0) {
        // Different ways to introduce a subtopic
        const introSentences = [
          `Let's dive into ${subtopic.name}.`,
          `Up next, we have ${subtopic.name}.`,
          `Now, we'll explore ${subtopic.name}.`,
          `Time to learn about ${subtopic.name}.`,
          `Let's understand ${subtopic.name} in detail.`
        ];
  
        const randomIntro = introSentences[Math.floor(Math.random() * introSentences.length)];
  
        console.log(`Starting Subtopic: ${subtopic.name} (${subtopicIndex + 1}/${subtopicList.length})`);
        speakText(randomIntro, () => speakNextSubsubtopic(subtopicIndex, subsubtopicIndex + 1));
        return; // Prevents immediately proceeding to the first subsubtopic
      }
  
      if (subsubtopicIndex <= subtopic.subsubtopics.length) {
        const subsubtopic = subtopic.subsubtopics[subsubtopicIndex - 1];
  
        // Update states
        setCurrentSubtopicIndex(subtopicIndex);
        setCurrentSubsubtopicIndex(subsubtopicIndex - 1);
        setHighlightedSubsubtopic(subsubtopic.name);
  
        // Log current progress
        console.log(`Current Subtopic: ${subtopic.name} (${subtopicIndex + 1}/${subtopicList.length})`);
        console.log(`Current Subsubtopic: ${subsubtopic.name} (${subsubtopicIndex}/${subtopic.subsubtopics.length})`);
  
        // Speak and proceed
        speakText(
          `${subsubtopic.name}. ${subsubtopic.explanation}`,
          () => speakNextSubsubtopic(subtopicIndex, subsubtopicIndex + 1) // Move to next subsubtopic
        );
      } else {
        // Move to the next subtopic after finishing all its subsubtopics
        console.log(`Finished Subtopic: ${subtopic.name}`);
        speakNextSubsubtopic(subtopicIndex + 1, 0);
      }
    } else {
      // If all topics and subtopics are finished, reset teaching state
      console.log("All subtopics and subsubtopics completed.");
      setIsTeaching(false);
      setHighlightedTopic(null);
      setHighlightedSubtopic(null);
      setHighlightedSubsubtopic(null);
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

          {/* <h4 className={`text-lg font-semibold mt-4 ${highlightedSubsubtopic === currentSubsubtopic?.name ? "text-red-600" : "text-gray-700"}`}>
            {currentSubsubtopic?.name || "No Subsubtopics Available"}
          </h4> */}
          <p className="mt-2 text-gray-600">{currentSubsubtopic?.explanation || ""}</p>

          {/* Display Image */}
          {imageUrl && (
            <img
              src={imageUrl}
              alt="Subsubtopic Illustration"
              className="mt-4 w-100 h-96 object-contain rounded-lg shadow-md" // Increased size
            />
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
      <div className="w-1/4 bg-white p-4 shadow-lg flex flex-col overflow-y-auto max-h-screen">
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
      {/* Hidden audio element for TTS playback */}
      <audio ref={audioRef} style={{ display: "none" }} />

    </div>
  );
}
