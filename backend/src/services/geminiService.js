const axios = require('axios');

const generateItinerary = async (destination, userConstraints, weatherData) => {
  try {
    const { days, budget, preferences, travelMode } = userConstraints;
    const estimatedCost = (destination.estimatedCostPerDay * days) + destination.transportCostFromNearestCity;
    const currentMonth = new Date().toLocaleString('default', { month: 'long' });
    const weatherSummary = weatherData
      ? `${weatherData.temp}°C, ${weatherData.weatherDescription}`
      : 'weather data unavailable';

    const prompt = `You are TripWise AI, an expert Indian travel planner.
Generate a detailed trip plan as a JSON object. Return ONLY valid JSON. No markdown, no explanation, no text before or after JSON.

TRIP DETAILS:
- Destination: ${destination.name}, ${destination.state}
- Duration: ${days} days
- Total Budget: Rs ${budget}
- Estimated Trip Cost: Rs ${estimatedCost}
- Travel Mode: ${travelMode || 'any'}
- Month: ${currentMonth}
- Current Weather: ${weatherSummary}
- Preferences: ${preferences && preferences.length > 0 ? preferences.join(', ') : 'general travel'}
- Attractions: ${destination.attractions.slice(0, 5).join(', ')}
- Description: ${destination.description}

Return ONLY this JSON structure, no other text:
{
  "destinationName": "string",
  "tagline": "one compelling sentence",
  "whyRecommended": "2-3 sentences why this matches constraints",
  "itinerary": [
    {
      "day": 1,
      "title": "Day title",
      "morning": "Morning activity",
      "afternoon": "Afternoon activity",
      "evening": "Evening activity",
      "meals": "Food recommendations",
      "tips": "Practical tip"
    }
  ],
  "budgetBreakdown": {
    "transport": 0,
    "accommodation": 0,
    "food": 0,
    "activities": 0,
    "miscellaneous": 0,
    "total": 0
  },
  "packingList": ["item1", "item2", "item3"],
  "localTips": ["tip1", "tip2", "tip3"],
  "weatherAdvice": "advice based on current weather"
}`;

    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 2048,
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    const rawText = response.data.choices[0].message.content;
    const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const itinerary = JSON.parse(cleaned);

    return { success: true, itinerary };

  } catch (error) {
    const errMsg = error.response?.data?.error?.message || error.message;
    console.error('AI error:', errMsg);
    return { success: false, error: errMsg, itinerary: null };
  }
};

module.exports = { generateItinerary };