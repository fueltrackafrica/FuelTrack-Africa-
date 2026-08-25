const API_BASE_URL = '/api/weather';
const WEATHER_ICON_BASE = 'https://openweathermap.org/img/wn';

const elements = {
  cityInput: document.getElementById('cityInput'),
  searchBtn: document.getElementById('searchBtn'),
  geoBtn: document.getElementById('geoBtn'),
  errorMessage: document.getElementById('errorMessage'),
  currentWeather: document.getElementById('currentWeather'),
  forecastSection: document.getElementById('forecastSection'),
  forecastContainer: document.getElementById('forecastContainer'),
  cityName: document.getElementById('cityName'),
  updateTime: document.getElementById('updateTime'),
  weatherIcon: document.getElementById('weatherIcon'),
  temp: document.getElementById('temp'),
  weatherDesc: document.getElementById('weatherDesc'),
  feelsLike: document.getElementById('feelsLike'),
  humidity: document.getElementById('humidity'),
  windSpeed: document.getElementById('windSpeed'),
  pressure: document.getElementById('pressure'),
  cloudiness: document.getElementById('cloudiness'),
  sunrise: document.getElementById('sunrise'),
  sunset: document.getElementById('sunset')
};

// Event Listeners
elements.searchBtn.addEventListener('click', handleSearch);
elements.cityInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') handleSearch();
});
elements.geoBtn.addEventListener('click', handleGeolocation);

// Handle search
function handleSearch() {
  const city = elements.cityInput.value.trim();
  if (!city) {
    showError('Please enter a city name');
    return;
  }
  clearError();
  fetchWeatherAndForecast(city);
}

// Handle geolocation
function handleGeolocation() {
  if (!navigator.geolocation) {
    showError('Geolocation is not supported by your browser');
    return;
  }

  elements.geoBtn.disabled = true;
  elements.geoBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      fetchWeatherByCoordinates(latitude, longitude);
      elements.geoBtn.disabled = false;
      elements.geoBtn.innerHTML = '<i class="fas fa-map-marker-alt"></i>';
    },
    (error) => {
      showError('Unable to get your location: ' + error.message);
      elements.geoBtn.disabled = false;
      elements.geoBtn.innerHTML = '<i class="fas fa-map-marker-alt"></i>';
    }
  );
}

// Fetch weather and forecast
async function fetchWeatherAndForecast(city) {
  try {
    elements.searchBtn.disabled = true;
    elements.searchBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Searching...';

    const [weatherResponse, forecastResponse] = await Promise.all([
      fetch(`${API_BASE_URL}/current?city=${encodeURIComponent(city)}`),
      fetch(`${API_BASE_URL}/forecast?city=${encodeURIComponent(city)}`)
    ]);

    if (!weatherResponse.ok) {
      const error = await weatherResponse.json();
      throw new Error(error.error || 'Failed to fetch weather');
    }

    if (!forecastResponse.ok) {
      const error = await forecastResponse.json();
      throw new Error(error.error || 'Failed to fetch forecast');
    }

    const weatherData = await weatherResponse.json();
    const forecastData = await forecastResponse.json();

    clearError();
    displayWeather(weatherData);
    displayForecast(forecastData.forecast);
  } catch (error) {
    showError(error.message);
  } finally {
    elements.searchBtn.disabled = false;
    elements.searchBtn.innerHTML = '<i class="fas fa-search"></i> Search';
  }
}

// Fetch weather by coordinates
async function fetchWeatherByCoordinates(latitude, longitude) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/coordinates?lat=${latitude}&lon=${longitude}`
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch weather');
    }

    const weatherData = await response.json();
    clearError();
    elements.cityInput.value = weatherData.city;
    displayWeather(weatherData);
    fetchWeatherAndForecast(weatherData.city);
  } catch (error) {
    showError(error.message);
  }
}

// Display current weather
function displayWeather(data) {
  const now = new Date();
  const formattedTime = now.toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  elements.cityName.textContent = `${data.city}, ${data.country}`;
  elements.updateTime.textContent = `Updated: ${formattedTime}`;
  elements.weatherIcon.src = `${WEATHER_ICON_BASE}/${data.icon}@4x.png`;
  elements.weatherIcon.alt = data.description;
  elements.temp.textContent = Math.round(data.temperature);
  elements.weatherDesc.textContent = capitalizeWords(data.description);
  elements.feelsLike.textContent = `Feels like ${Math.round(data.feelsLike)}°C`;
  elements.humidity.textContent = `${data.humidity}%`;
  elements.windSpeed.textContent = `${data.windSpeed.toFixed(1)} m/s`;
  elements.pressure.textContent = `${data.pressure} hPa`;
  elements.cloudiness.textContent = `${data.cloudiness}%`;
  elements.sunrise.textContent = formatTime(new Date(data.sunrise));
  elements.sunset.textContent = formatTime(new Date(data.sunset));

  elements.currentWeather.classList.remove('hidden');
}

// Display forecast
function displayForecast(forecast) {
  elements.forecastContainer.innerHTML = '';

  // Group forecast by day and get one forecast per day at noon
  const dailyForecasts = {};
  forecast.forEach(item => {
    const date = new Date(item.dt);
    const dayKey = date.toDateString();
    const hour = date.getHours();

    if (!dailyForecasts[dayKey] || Math.abs(hour - 12) < Math.abs(new Date(dailyForecasts[dayKey].dt).getHours() - 12)) {
      dailyForecasts[dayKey] = item;
    }
  });

  Object.values(dailyForecasts).forEach(item => {
    const card = createForecastCard(item);
    elements.forecastContainer.appendChild(card);
  });

  elements.forecastSection.classList.remove('hidden');
}

// Create forecast card
function createForecastCard(item) {
  const date = new Date(item.dt);
  const card = document.createElement('div');
  card.className = 'forecast-card';

  const dayName = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const time = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  card.innerHTML = `
    <div class="time">${dayName}</div>
    <div class="time" style="font-size: 0.8em;">${time}</div>
    <img src="${WEATHER_ICON_BASE}/${item.icon}@2x.png" alt="${item.description}" class="icon">
    <div class="temp">${Math.round(item.temperature)}°C</div>
    <div class="desc">${capitalizeWords(item.description)}</div>
    <div class="extra">
      <span><i class="fas fa-tint"></i> ${item.humidity}%</span>
      <span><i class="fas fa-wind"></i> ${item.windSpeed.toFixed(1)} m/s</span>
    </div>
  `;

  return card;
}

// Utility functions
function showError(message) {
  elements.errorMessage.textContent = `❌ ${message}`;
  elements.errorMessage.style.display = 'block';
}

function clearError() {
  elements.errorMessage.textContent = '';
  elements.errorMessage.style.display = 'none';
}

function capitalizeWords(str) {
  return str.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

function formatTime(date) {
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

// Initialize with a default city on page load
window.addEventListener('load', () => {
  elements.cityInput.value = 'London';
  fetchWeatherAndForecast('London');
});
