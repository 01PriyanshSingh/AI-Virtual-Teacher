import React, { useEffect, useState, useRef } from 'react';

export default function QuizPage() {
  const [quizData, setQuizData] = useState([]);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [score, setScore] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const submitRef = useRef(null); // 🧭 Reference for scroll target

  const fetchQuiz = () => {
    fetch('http://127.0.0.1:5000/get_quiz')
      .then((res) => res.json())
      .then((data) => {
        const formattedQuizData = [];

        data.forEach((q) => {
          formattedQuizData.push({
            question: q.question,
            correct_answer: q.correct_answer,
            options: q.options,
            topic: q.topic,
          });
        });

        setQuizData(formattedQuizData);
        setSelectedAnswers({});
        setScore(null);
        setIsSubmitted(false);
      })
      .catch((err) => console.error('Error fetching quiz:', err));
  };

  useEffect(() => {
    fetchQuiz();
  }, []);

  const handleOptionChange = (questionIndex, selectedOption) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionIndex]: selectedOption,
    }));
  };

  const calculateScore = () => {
    let correctCount = 0;
    quizData.forEach((q, index) => {
      if (selectedAnswers[index] === q.correct_answer) {
        correctCount++;
      }
    });
    setScore(correctCount);
    setIsSubmitted(true);

    // 🔽 Smoothly scroll to score section
    setTimeout(() => {
      if (submitRef.current) {
        submitRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-lg mt-10 rounded-lg">
      <h1 className="text-3xl font-bold mb-6 text-blue-700">Quiz</h1>

      {quizData.length === 0 ? (
        <p>Loading quiz questions...</p>
      ) : (
        quizData.map((q, index) => (
          <div key={index} className="mb-6 border-b pb-4">
            <p className="font-semibold mb-2 text-lg">
              {index + 1}. {q.question}
            </p>
            <div className="space-y-2">
              {q.options.map((option, i) => {
                const isSelected = selectedAnswers[index] === option;
                let optionClass = '';

                if (isSubmitted) {
                  if (option === q.correct_answer) {
                    optionClass = 'text-green-600 font-semibold';
                  } else if (isSelected && option !== q.correct_answer) {
                    optionClass = 'text-red-600';
                  }
                }

                return (
                  <label key={i} className={`block ${optionClass}`}>
                    <input
                      type="radio"
                      name={`question-${index}`}
                      value={option}
                      checked={isSelected}
                      onChange={() => handleOptionChange(index, option)}
                      className="mr-2"
                      disabled={isSubmitted}
                    />
                    {option}
                  </label>
                );
              })}
            </div>

            {isSubmitted && selectedAnswers[index] !== q.correct_answer && (
              <>
                <div className="text-red-500 mt-2">
                  Incorrect! Refer to the topic: <strong>{q.topic}</strong>
                </div>
                <div className="text-green-500 mt-1">
                  Correct answer: <strong>{q.correct_answer}</strong>
                </div>
              </>
            )}
          </div>
        ))
      )}

      {/* 🧭 Ref target */}
      <div className="mt-6" ref={submitRef}>
        {!isSubmitted ? (
          <button
            onClick={calculateScore}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition"
          >
            Submit
          </button>
        ) : (
          <button
            onClick={fetchQuiz}
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded-md"
          >
            Retake Quiz
          </button>
        )}
      </div>

      {score !== null && (
        <div className="mt-4 text-xl font-bold text-green-600">
          Your score: {score} / {quizData.length}
        </div>
      )}
    </div>
  );
}
