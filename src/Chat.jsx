import React, { useEffect, useRef, useState } from 'react';
import { BsSendFill } from 'react-icons/bs';
import axios from 'axios';

const Chat = () => {
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      message:
        "Hey there! I'm CrispBurst 🤖. Need help finding meals that suit your health and budget?\n\n1. I have a meal plan\n2. I want a meal plan",
    },
  ]);
  const [input, setInput] = useState('');
  const [step, setStep] = useState(1);
  const [recording, setRecording] = useState(false)
  const [userData, setUserData] = useState({ diet: '', selectedMeal: '', selectedRestaurant: '', schedule: '', userPlan: '' });
  const messagesEndRef = useRef(null);

  const newMessage = (sender, message) => {
    setMessages((prev) => [...prev, { sender, message }]);
  };

  const saveFavorite = (meal) => {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    favorites.push(meal);
    localStorage.setItem('favorites', JSON.stringify(favorites));
  };

  const showFavorites = () => {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    if (favorites.length === 0) {
      newMessage('bot', 'You have no favorite meals saved.');
    } else {
      newMessage('bot', 'Your favorite meals:');
      favorites.forEach((meal, index) => newMessage('bot', `${index + 1}. ${meal}`));
    }
  };

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        console.log("User location:", latitude, longitude);
        newMessage('bot', `Your location: Latitude ${latitude}, Longitude ${longitude}`);
      }, () => {
        newMessage('bot', 'Location access denied.');
      });
    } else {
      newMessage('bot', 'Geolocation is not supported by your browser.');
    }
  };

  const generateAIResponse = async (prompt) => {
    const res = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
      },
      {
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
        },
      }
    );
    return res.data.choices[0].message.content;
  };

  const localMeals = {
    swallow: ["Fufu", "Eba", "Poundo", "Semo", "Wheat", "Corn", "Cocoyam"],
    'Low-Carb': ['Grilled Catfish & Veggies', 'Pepper Soup'],
    soup: ["Efo Eriro", "Ewedu", "oha", "afang", "vegetable sauce", "Banga", "Edikangikong", "Gbegiri"],
    rice: ["ofada rice", "Jollof Rice", "Fried Rice", "Coconut Rice"],
    localsnacks: ["ugba", "abacha", "uda", "bole", "okpa", "zobo", "suya", "Akara"],
    peppersoup: ["Dried Fish Pepper Soup", "catfish pepper soup", "Cowleg Pepper Soup", "Beef Pepper Soup", "Assorted Pepper Soup"],
    default: ['Jollof Rice', 'Fried Rice', 'Yam Porridge', 'Egusi Soup & Pounded Yam'],
  };

  const localRestaurants = {
    swallow: ['Mama Nkechi’s Kitchen', 'Baba Tunde’s Spot', 'Iya Basira Canteen'],
    soup: ['Soup Hub', 'Efo Delight', 'Afang Joint'],
    rice: ['Ofada Heaven', 'Rice & More', 'Niger Jollof'],
    localsnacks: ['Snack Villa', 'Abacha Corner', 'Bole Bistro'],
    peppersoup: ['Pepper Bowl', 'Hot & Spicy', 'Catfish Café'],
    default: ['CrispBurst Eatery', 'TasteLine', 'Naija Food Court'],
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const userInput = input.trim();
    newMessage('user', userInput);

    if (userInput.toLowerCase() === 'favorites') {
      showFavorites();
      setInput('');
      return;
    } else if (userInput.toLowerCase() === 'location') {
      getUserLocation();
      setInput('');
      return;
    }

    switch (step) {
      case 1:
        if (userInput === '1') {
          newMessage('bot', 'Great! Please describe your meal plan.');
          setStep(1.5);
        } else if (userInput === '2') {
          newMessage('bot', 'Awesome! Do you have any diet preferences? (food categories- swallow, soup, rice, localsnacks, peppersoup)');
          setStep(2);
        } else {
          newMessage('bot', 'Please enter 1 or 2 to proceed.');
        }
        break;

      case 1.5:
        setUserData((prev) => ({ ...prev, userPlan: userInput }));
        newMessage('bot', 'Thanks for sharing! Would you like suggestions based on your meal plan? (yes/no)');
        setStep(1.6);
        break;

      case 1.6:
        if (userInput.toLowerCase() === 'yes') {
          newMessage('bot', 'Generating suggestions based on your meal plan...');
          const aiResponse = await generateAIResponse(
            `Suggest a healthy improvement or variety for this Nigerian meal plan: ${userData.userPlan}`
          );
          newMessage('bot', aiResponse);
          newMessage('bot', 'Would you like to schedule a delivery or preorder? (yes/no)');
          setStep(5);
        } else if (userInput.toLowerCase() === 'no') {
          newMessage('bot', 'Alright! Would you like to schedule a delivery or preorder? (yes/no)');
          setStep(5);
        } else {
          newMessage('bot', 'Please reply with "yes" or "no".');
        }
        break;

      case 2:
        setUserData((prev) => ({ ...prev, diet: userInput.toLowerCase() }));
        const mealOptions = localMeals[userInput.toLowerCase()] || localMeals.default;
        mealOptions.forEach((meal, index) => newMessage('bot', `${index + 1}. ${meal}`));

        const restaurants = localRestaurants[userInput.toLowerCase()] || localRestaurants.default;
        newMessage('bot', `\nAvailable restaurants for ${userInput} meals:`);
        restaurants.forEach((r, index) => newMessage('bot', `${index + 1}. ${r}`));

        newMessage('bot', '\nPlease choose a meal by number or type its name.');
        setStep(3);
        break;

      case 3:
        const selected = /^\d+$/.test(userInput)
          ? (localMeals[userData.diet] || localMeals.default)[parseInt(userInput) - 1]
          : userInput;
        setUserData((prev) => ({ ...prev, selectedMeal: selected }));
        newMessage('bot', `Great choice! "${selected}" sounds tasty.`);
        saveFavorite(selected);
        newMessage('bot', 'Which restaurant would you like it from? Choose by number or type the name.');
        setStep(4);
        break;

      case 4:
        const restaurant = /^\d+$/.test(userInput)
          ? (localRestaurants[userData.diet] || localRestaurants.default)[parseInt(userInput) - 1]
          : userInput;
        setUserData((prev) => ({ ...prev, selectedRestaurant: restaurant }));
        newMessage('bot', `Awesome! "${restaurant}" is a great choice.`);
        newMessage('bot', 'Would you like to schedule a delivery or preorder? (yes/no)');
        setStep(5);
        break;

      case 5:
        if (userInput.toLowerCase() === 'yes') {
          newMessage('bot', 'Please enter your preferred delivery date and time (e.g., June 14, 1PM).');
          setStep(6);
        } else if (userInput.toLowerCase() === 'no') {
          newMessage('bot', 'Alright! Would you like to do anything else? (type "restart" to start over)');
          setStep(7);
        } else {
          newMessage('bot', 'Please reply with "yes" or "no".');
        }
        break;

      case 6:
        setUserData((prev) => ({ ...prev, schedule: userInput }));
        newMessage('bot', `Perfect! Your order for "${userData.selectedMeal || userData.userPlan}" from "${userData.selectedRestaurant}" is scheduled on ${userInput}.`);
        newMessage('bot', 'Would you like to do anything else? (type "restart" to start over)');
        setStep(7);
        break;

      case 7:
        if (userInput.toLowerCase() === 'restart') {
          setMessages([
            {
              sender: 'bot',
              message:
                "Welcome back! I'm CrispBurst 🤖.\n\n1. I have a meal plan\n2. I want a meal plan",
            },
          ]);
          setUserData({ diet: '', selectedMeal: '', selectedRestaurant: '', schedule: '', userPlan: '' });
          setStep(1);
        } else {
          newMessage('bot', 'Type "restart" to start again or ask anything else.');
        }
        break;
    }

    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

 const handleVoiceInput = () => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new window.webkitSpeechRecognition();
      recognition.lang = 'en-US';
      recognition.continuous = false;
      recognition.interimResults = false;

      setRecording(true);
      recognition.start();

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setRecording(false);
      };

       recognition.onerror = () => {
        setRecording(false);
      };

      recognition.onend = () => {
        setRecording(false);
      };
    } else {
      alert('Voice input not supported in this browser');
    }
  };




  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className='flex flex-col text-gray-300 justify-center items-center min-h-screen p-4 sm:p-6 lg:p-10 border border-blue-400 rounded-2xl relative'>
      {recording && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-yellow-100 text-yellow-800 px-4 py-2 rounded shadow">
          🎙️ Listening...
        </div>
      )}
      <div className='flex flex-col w-full max-w-3xl h-[calc(100vh-150px)] overflow-y-auto mb-20 px-2 sm:px-4'>
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.sender === 'bot' ? 'justify-start' : 'justify-end'} w-full`}>
            {msg.sender === 'bot' && (
              <img src='/bot-avatar.png' alt='Bot' className='w-8 h-8 rounded-full m-2' />
            )}
            <div
              className={`$ {
                msg.sender === 'bot'
                  ? 'bg-[#9ACBD0] text-blue-950'
                  : 'bg-[#EFEFEF] border text-gray-300 border-blue-800'
              } p-2 m-2 text-sm sm:text-[14px] rounded-lg max-w-[85%] whitespace-pre-line`}
            >
              {msg.message}
            </div>
            {msg.sender === 'user' && (
              <img src='/user-avatar.png' alt='User' className='w-8 h-8 rounded-full m-2' />
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className='absolute bottom-2 sm:bottom-4 w-full max-w-3xl px-2 sm:px-4'>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className='flex items-center gap-2'
        >
          <input
            type='text'
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder='Enter your message'
            className='flex-1 px-4 py-2 rounded-lg border border-gray-300 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-400'
          />
          <button
            type='button'
            onClick={handleVoiceInput}
            className='p-2.5 rounded-lg bg-green-600 text-white hover:bg-green-700 transition'
          >
            🎤
          </button>
          <button
            type='submit'
            className='p-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition'
          >
            <BsSendFill className='text-lg' />
          </button>
        </form>
        <button
          onClick={showFavorites}
          className='mt-2 w-full text-sm text-blue-700 underline'
        >
          ⭐ View Favorites
        </button>
      </div>
    </div>
  );
};

export default Chat;
