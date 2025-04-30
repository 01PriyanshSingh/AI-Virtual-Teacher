import { useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react"; // Combined import

// Create an audio ref for TTS playback

// New speakText function using the audio element



export default function SyllabusPage() {

  const [selectedChatTopic, setSelectedChatTopic] = useState(null);
  const [selectedChatSubtopic, setSelectedChatSubtopic] = useState(null);
  const [chatInput, setChatInput] = useState("");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatResponse, setChatResponse] = useState("");
const [isLoadingResponse, setIsLoadingResponse] = useState(false);

const [chatMessages, setChatMessages] = useState([]); // [{ role: 'user' | 'assistant', content: string }]
const [chatSessionId, setChatSessionId] = useState(null);
const textareaRef = useRef(null);



const videoRef = useRef(null); // For controlling the avatar video



const autoResizeTextarea = () => {
  if (textareaRef.current) {
    textareaRef.current.style.height = "auto";
    textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
  }
};



  

  

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
    const ttsUrl = getTTSUrl(text);
  
    fetch(ttsUrl)
      .then((res) => res.blob())
      .then((blob) => {
        const audioURL = URL.createObjectURL(blob);
  
        if (audioRef.current) {
          audioRef.current.src = audioURL;
  
          // Play audio and video together
          audioRef.current.play().then(() => {
            if (videoRef.current) {
              videoRef.current.currentTime = 0;
              videoRef.current.loop = true;
              videoRef.current.play().catch((e) =>
                console.error("Video play error", e)
              );
            }
          });
  
          // Sync: when audio ends
          audioRef.current.onended = () => {
            if (videoRef.current) videoRef.current.pause();
            URL.revokeObjectURL(audioURL);
            callback();
          };
  
          // Also pause video if audio errors
          audioRef.current.onerror = () => {
            if (videoRef.current) videoRef.current.pause();
            URL.revokeObjectURL(audioURL);
            callback();
          };
  
          // Optional: Stop video if audio is manually paused (edge case)
          audioRef.current.onpause = () => {
            if (videoRef.current && !audioRef.current.ended) {
              videoRef.current.pause();
            }
          };
  
          // Optional: Resume video if audio is resumed
          audioRef.current.onplay = () => {
            if (videoRef.current) {
              videoRef.current.play().catch((e) => console.error(e));
            }
          };
        }
      });
  };
  
  
  
  
  
  
  
  // Start Teaching Mode
 

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
  const toggleTeaching = () => {
    if (!isTeaching) {
      if (!subtopicList.length) {
        alert("No subtopics available for this topic.");
        return;
      }
  
      setIsTeaching(true);
      setIsPaused(false);
      setHighlightedTopic(currentTopic);
  
      // Attempt to "prime" audio and video on first click
      if (audioRef.current && videoRef.current) {
        audioRef.current.play().catch((e) => {
          console.warn("Priming audio (expected to fail silently):", e);
        });
        videoRef.current.play().catch((e) => {
          console.warn("Priming video (expected to fail silently):", e);
        });
      }
  
      speakNextSubsubtopic(0, 0);
    } else {
      // Toggle pause/resume
      if (audioRef.current && videoRef.current) {
        if (!isPaused) {
          audioRef.current.pause();
          videoRef.current.pause();
          setIsPaused(true);
        } else {
          audioRef.current.play().catch((e) => console.error("Resume audio error:", e));
          videoRef.current.play().catch((e) => console.error("Resume video error:", e));
          setIsPaused(false);
        }
      }
    }
  };
  
  const sendDoubt = () => {
    if (!chatInput.trim()) return;
  
    setIsLoadingResponse(true);
    setChatResponse("");
  
    fetch("http://127.0.0.1:5000/submit_doubt", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        topic: selectedChatTopic,
        subtopic: selectedChatSubtopic,
        doubt: chatInput,
        session_id: chatSessionId || undefined,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        setIsLoadingResponse(false);
        if (data.response) {
          if (!chatSessionId && data.session_id) {
            setChatSessionId(data.session_id);
          }
  
          setChatMessages((prev) => [
            ...prev,
            { role: "user", content: chatInput },
            { role: "assistant", content: data.response },
          ]);
  
          setChatInput("");
        } else {
          setChatResponse("Something went wrong.");
        }
      })
      .catch((err) => {
        console.error("Error:", err);
        setIsLoadingResponse(false);
        setChatResponse("Something went wrong while fetching the response.");
      });
  };
  
  

  return (
    <div className="flex h-screen">
      
      {/* Main Content (3/4th of the page) */}
      <div className="w-3/4 p-8 bg-gray-100 flex flex-col justify-between relative">
            <div className="absolute top-4 right-4">
        <button
          onClick={() => window.open("/quiz", "_blank")}
          className="px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 shadow-md"
        >
          Access Quiz
        </button>
      </div>

        
        
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
        <div className="flex justify-end mt-4">
          <button
            onClick={toggleTeaching}
            className={`px-4 py-2 rounded-md text-white ${
              !isTeaching ? "bg-purple-600" : isPaused ? "bg-green-500" : "bg-yellow-500"
            }`}
          >
            {!isTeaching ? "Start Teaching" : isPaused ? "Resume" : "Pause"}
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
                  {
                    (subtopics[topic] || []).map((subtopic, subIndex) => {
                      const isCurrentTopic = index === currentIndex;
                      const isSelected = isCurrentTopic && subIndex === currentSubtopicIndex;

                      const sendDoubt = () => {
  if (!chatInput.trim()) return;

  setIsLoadingResponse(true);
  setChatResponse("");

  fetch("http://127.0.0.1:5000/submit_doubt", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      topic: selectedChatTopic,
      subtopic: selectedChatSubtopic,
      doubt: chatInput,
      session_id: chatSessionId || undefined,
    }),
  })
    .then((res) => res.json())
    .then((data) => {
      setIsLoadingResponse(false);
      if (data.response) {
        if (!chatSessionId && data.session_id) {
          setChatSessionId(data.session_id);
        }

        setChatMessages((prev) => [
          ...prev,
          { role: "user", content: chatInput },
          { role: "assistant", content: data.response },
        ]);

        setChatInput("");
      } else {
        setChatResponse("Something went wrong.");
      }
    })
    .catch((err) => {
      console.error("Error:", err);
      setIsLoadingResponse(false);
      setChatResponse("Something went wrong while fetching the response.");
    });
};

                    
                      return (
                        <li
                          key={subIndex}
                          className={`p-2 rounded-md cursor-pointer ${
                            isSelected ? "bg-green-200 font-bold" : "hover:bg-gray-200"
                          }`}
                          onClick={() => {
                            setCurrentIndex(index); // ensure topic is selected
                            setCurrentSubtopicIndex(subIndex); // set subtopic
                          }}
                        >
                          {subtopic.name}
                        </li>
                      );
                    })
                  
                  }
                </ul>
              )}
            </li>
          ))}
        </ul>
      </div>
      {/* Hidden audio element for TTS playback */}
      <audio ref={audioRef} style={{ display: "none" }} />




      {/* Chatbot Button and Panel */}
      {isChatOpen && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white w-full max-w-xl rounded-lg shadow-lg p-6 relative">
      {/* Close Button */}
      <button
        onClick={() => {
          setIsChatOpen(false);
          setSelectedChatTopic(null);
          setSelectedChatSubtopic(null);
          setChatInput("");
          setChatResponse("");
          setChatSessionId(null);
          setChatMessages([]); // Reset chat history
        }}
        
        
        className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-xl"
      >
        ×
      </button>

      {/* Step 1: Select Topic */}
      {!selectedChatTopic && (
        <>
          <h2 className="text-xl font-bold text-blue-600 mb-4">What’s your doubt?</h2>
          <p className="text-sm mb-2 text-gray-600">Select a Key Topic:</p>
          <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
            {topics.map((topic, index) => (
              <button
                key={index}
                onClick={() => setSelectedChatTopic(topic)}
                className="text-left border border-blue-300 px-3 py-2 rounded-md hover:bg-blue-50"
              >
                {topic}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Step 2: Select Subtopic */}
      {selectedChatTopic && !selectedChatSubtopic && (
        <>
          <h2 className="text-lg font-semibold text-blue-600 mb-3">{selectedChatTopic}</h2>
          <p className="text-sm text-gray-600 mb-2">Now choose a subtopic:</p>
          <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
            {(subtopics[selectedChatTopic] || []).map((sub, index) => (
              <button
                key={index}
                onClick={() => setSelectedChatSubtopic(sub.name)}
                className="text-left border border-green-300 px-3 py-2 rounded-md hover:bg-green-50"
              >
                {sub.name}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Step 3: Doubt Chat Interface */}
     
{selectedChatTopic && selectedChatSubtopic && (
  <div className="flex flex-col h-[70vh]">
    {/* Header */}
    <div className="mb-2">
      <h2 className="text-lg font-semibold text-blue-600">
        {selectedChatTopic} → {selectedChatSubtopic}
      </h2>
    </div>

    {/* Chat Scrollable Messages */}
    <div className="flex-1 overflow-y-auto space-y-4 px-2 py-4 bg-gray-50 border border-gray-200 rounded-md mb-3">
      {chatMessages.map((msg, index) => (
        <div
          key={index}
          className={`max-w-[75%] px-4 py-2 rounded-xl text-sm whitespace-pre-wrap ${
            msg.role === "user"
              ? "bg-blue-100 self-end ml-auto text-right"
              : "bg-white border self-start text-left"
          } shadow-sm`}
        >
          {msg.content}
        </div>
      ))}

      {isLoadingResponse && (
        <div className="text-blue-500 text-sm animate-pulse">Generating response...</div>
      )}
    </div>

    {/* Input Row */}
    <div className="flex items-end gap-2 border border-gray-300 rounded-full px-4 py-2 bg-white shadow-sm">
      <textarea
        ref={textareaRef}
        value={chatInput}
        onChange={(e) => {
          setChatInput(e.target.value);
          autoResizeTextarea();
        }}
        placeholder="Type a message..."
        rows={1}
        className="flex-1 resize-none border-none focus:outline-none focus:ring-0 text-sm placeholder-gray-400 bg-transparent max-h-[120px] overflow-y-auto"
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendDoubt();
          }
        }}
      />

      {/* Send Button */}
      <button
        onClick={sendDoubt}
        disabled={!chatInput.trim()}
        className="text-blue-600 hover:text-blue-800 transition"
        title="Send"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      </button>
    </div>
  </div>
)}


      


    </div>
  </div>
)}

{/* Floating Chat Button */}
<div className="fixed bottom-6 right-6 z-40">
  <button
    onClick={() => setIsChatOpen(true)}
    className="bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition duration-300"
  >
    💬
  </button>
</div>



{/* Floating Avatar Video */}
{isTeaching && (
  <div className="fixed bottom-4 left-4 z-40">
    <video
      ref={videoRef}
      src="/avatar.mp4"
      className="w-40 h-40 rounded-full shadow-lg border border-gray-300"
      muted
    />
  </div>
)}


    </div>
    
  );
}
