require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.OPENWEATHER_API_KEY;
const BASE_URL = process.env.OPENWEATHER_BASE_URL;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

// Render main dashboard page
app.get('/', (req, res) => {
  res.render('index');
});

// API endpoint to fetch current weather
app.get('/api/weather/current', async (req, res) => {
  try {
    const { city } = req.query;

    if (!city) {
      return res.status(400).json({ error: 'City parameter is required' });
    }

    if (!API_KEY) {
      return res.status(500).json({ error: 'API key is not configured' });
    }

    const response = await axios.get(`${BASE_URL}/weather`, {
      params: {
        q: city,
        appid: API_KEY,
        units: 'metric'
      }
    });

    const data = response.data;
    res.json({
      city: data.name,
      country: data.sys.country,
      temperature: data.main.temp,
      feelsLike: data.main.feels_like,
      humidity: data.main.humidity,
      pressure: data.main.pressure,
      description: data.weather[0].description,
      icon: data.weather[0].icon,
      windSpeed: data.wind.speed,
      cloudiness: data.clouds.all,
      sunrise: new Date(data.sys.sunrise * 1000),
      sunset: new Date(data.sys.sunset * 1000)
    });
  } catch (error) {
    console.error('Error fetching weather:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.message || 'Failed to fetch weather data'
    });
  }
});

// API endpoint to fetch 5-day forecast
app.get('/api/weather/forecast', async (req, res) => {
  try {
    const { city } = req.query;

    if (!city) {
      return res.status(400).json({ error: 'City parameter is required' });
    }

    if (!API_KEY) {
      return res.status(500).json({ error: 'API key is not configured' });
    }

    const response = await axios.get(`${BASE_URL}/forecast`, {
      params: {
        q: city,
        appid: API_KEY,
        units: 'metric'
      }
    });

    const data = response.data;
    const forecastList = data.list.slice(0, 40); // 5 days, 8 forecasts per day

    const forecast = forecastList.map(item => ({
      dt: new Date(item.dt * 1000),
      temperature: item.main.temp,
      feelsLike: item.main.feels_like,
      humidity: item.main.humidity,
      pressure: item.main.pressure,
      description: item.weather[0].description,
      icon: item.weather[0].icon,
      windSpeed: item.wind.speed,
      cloudiness: item.clouds.all,
      rain: item.rain?.['3h'] || 0,
      snow: item.snow?.['3h'] || 0
    }));

    res.json({
      city: data.city.name,
      country: data.city.country,
      forecast: forecast
    });
  } catch (error) {
    console.error('Error fetching forecast:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.message || 'Failed to fetch forecast data'
    });
  }
});

// API endpoint to fetch weather by coordinates
app.get('/api/weather/coordinates', async (req, res) => {
  try {
    const { lat, lon } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    if (!API_KEY) {
      return res.status(500).json({ error: 'API key is not configured' });
    }

    const response = await axios.get(`${BASE_URL}/weather`, {
      params: {
        lat: parseFloat(lat),
        lon: parseFloat(lon),
        appid: API_KEY,
        units: 'metric'
      }
    });

    const data = response.data;
    res.json({
      city: data.name,
      country: data.sys.country,
      temperature: data.main.temp,
      feelsLike: data.main.feels_like,
      humidity: data.main.humidity,
      pressure: data.main.pressure,
      description: data.weather[0].description,
      icon: data.weather[0].icon,
      windSpeed: data.wind.speed,
      cloudiness: data.clouds.all
    });
  } catch (error) {
    console.error('Error fetching weather by coordinates:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.message || 'Failed to fetch weather data'
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Weather Dashboard server running on http://localhost:${PORT}`);
  if (!API_KEY) {
    console.warn('⚠️  WARNING: OPENWEATHER_API_KEY is not set. Weather API calls will fail.');
  }
});
