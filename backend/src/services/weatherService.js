const axios = require('axios');
const NodeCache = require('node-cache');

// Cache weather data for 3 hours (10800 seconds)
// Why 3 hours? Weather doesn't change meaningfully faster than that.
// Saves API calls: 36 destinations * every request = expensive. Cache = cheap.
const weatherCache = new NodeCache({ stdTTL: 10800 });

const getWeatherForLocation = async (lat, lng, destinationName) => {
  const cacheKey = `weather_${destinationName}`;

  // Check cache first
  const cached = weatherCache.get(cacheKey);
  if (cached) {
    console.log(`Cache HIT: weather for ${destinationName}`);
    return cached;
  }

  try {
    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather`,
      {
        params: {
          lat,
          lon: lng,
          appid: process.env.OPENWEATHER_API_KEY,
          units: 'metric' // Celsius
        }
      }
    );

    const data = response.data;
    const weatherData = {
      temp: Math.round(data.main.temp),
      feelsLike: Math.round(data.main.feels_like),
      humidity: data.main.humidity,
      weatherMain: data.weather[0].main,       // e.g. "Rain", "Clear"
      weatherDescription: data.weather[0].description, // e.g. "light rain"
      windSpeed: data.wind.speed,
      icon: data.weather[0].icon
    };

    // Store in cache
    weatherCache.set(cacheKey, weatherData);
    console.log(`Cache MISS: fetched weather for ${destinationName}`);
    return weatherData;

  } catch (error) {
    console.error(`Weather fetch failed for ${destinationName}:`, error.message);
    return null; // Graceful degradation — scoring continues without weather
  }
};

module.exports = { getWeatherForLocation };