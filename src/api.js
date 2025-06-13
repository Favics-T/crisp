import axios from 'axios';

export const fetchMenuFromSpoonacular = async (query) => {
  const res = await axios.get(`https://api.spoonacular.com/recipes/complexSearch`, {
    params: {
      query,
      number: 5,
      apiKey: import.meta.env.VITE_SPOONACULAR_API_KEY,
    },
  });
  return res.data.results;
};

export const fetchNutritionFromEdamam = async (food) => {
  const res = await axios.get(`https://api.edamam.com/api/nutrition-data`, {
    params: {
      app_id: import.meta.env.VITE_EDAMAM_NUTRITION_APP_ID,
      app_key: import.meta.env.VITE_EDAMAM_NUTRITION_API_KEY,
      ingr: food,
    },
  });
  return res.data;
};

export const generateAIResponse = async (prompt) => {
  const res = await axios.post('https://api.openai.com/v1/chat/completions', {
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: prompt }],
  }, {
    headers: {
      Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
    },
  });
  return res.data.choices[0].message.content;
};
