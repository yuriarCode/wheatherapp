document.addEventListener('DOMContentLoaded', () => {
    showSection('info'); // Mostrar la sección de información al cargar la página
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            const { latitude, longitude } = position.coords;
            getWeatherData(latitude, longitude);
            getRainForecast(latitude, longitude);
            getAirQuality(latitude, longitude);
            getWindData(latitude, longitude);
            getVisibilityData(latitude, longitude);
            initMap(latitude, longitude);
            getDailySummary(latitude, longitude);
        });
    } else {
        alert("Geolocation is not supported by this browser.");
    }
});

function getWeatherData(lat, lon) {
    const apiKey = 'd39850783b63753edde5be57bae0249f';
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            const temperature = Math.round(data.main.temp);
            const humidity = Math.round(data.main.humidity);
            const feelsLike = Math.round(data.main.feels_like);
            document.getElementById('temperature').innerText = temperature;
            document.getElementById('humidity').innerText = humidity;
            document.getElementById('feels-like').innerText = feelsLike;
        })
        .catch(error => {
            console.error("Error fetching weather data: ", error);
        });
}

async function getRainForecast(lat, lon) {
    const apiKey = 'd39850783b63753edde5be57bae0249f';
    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Error fetching data');
        const data = await response.json();

        const forecastData = data.list.slice(0, 24); // Obtener las próximas 24 horas
        const labels = forecastData.map(item => new Date(item.dt * 1000).getHours() + ':00');
        const rainProbabilities = forecastData.map(item => Math.round(item.pop * 100)); // pop es la probabilidad de precipitación
        const precipitationAmounts = forecastData.map(item => item.rain ? Math.round(item.rain['3h'] || 0) : 0); // Precipitación en mm

        const ctx = document.getElementById('rain-forecast-chart').getContext('2d');
        new Chart(ctx, {
            type: 'bar', // Cambia el tipo de gráfico a 'bar'
            data: {
                labels: labels,
                datasets: [
                    {
                        type: 'line', // Tipo de gráfico de línea para la probabilidad de lluvia
                        label: 'Probabilidad de lluvia (%)',
                        data: rainProbabilities,
                        borderColor: 'rgba(75, 192, 192, 1)',
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        fill: false,
                        yAxisID: 'y'
                    },
                    {
                        type: 'bar', // Tipo de gráfico de barra para la precipitación
                        label: 'Precipitación (mm)',
                        data: precipitationAmounts,
                        borderColor: 'rgba(255, 99, 132, 1)',
                        backgroundColor: 'rgba(255, 99, 132, 0.2)',
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Probabilidad de lluvia (%)'
                        }
                    },
                    y1: {
                        beginAtZero: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Precipitación (mm)'
                        }
                    }
                },
                responsive: true,
                maintainAspectRatio: false
            }
        });
    } catch (error) {
        console.error("Error fetching rain forecast: ", error);
    }
}

function getAirQuality(lat, lon) {
    const apiKey = 'd39850783b63753edde5be57bae0249f';
    const url = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            const aqi = Math.round(data.list[0].main.aqi);
            const description = getAQIDescription(aqi);
            document.getElementById('aqi').innerText = aqi;
            document.getElementById('aqi-description').innerText = description;
        })
        .catch(error => {
            console.error("Error fetching air quality data: ", error);
        });
}

function getWindData(lat, lon) {
    const apiKey = 'd39850783b63753edde5be57bae0249f';
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            const windSpeed = Math.round(data.wind.speed);
            const windDirection = Math.round(data.wind.deg);
            document.getElementById('wind-speed').innerText = windSpeed;
            document.getElementById('wind-direction').innerText = getCardinalDirection(windDirection);
        })
        .catch(error => {
            console.error("Error fetching wind data: ", error);
        });
}

function getVisibilityData(lat, lon) {
    const apiKey = 'd39850783b63753edde5be57bae0249f';
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            const visibility = Math.round(data.visibility / 1000); // Convertir metros a kilómetros
            document.getElementById('visibility').innerText = `${visibility} km`;
            const fogProbability = data.weather.some(condition => condition.main.toLowerCase().includes('fog')) ? 100 : 0;
            document.getElementById('fog-probability').innerText = fogProbability;
        })
        .catch(error => {
            console.error("Error fetching visibility data: ", error);
        });
}

function getCardinalDirection(degree) {
    const directions = ['Norte', 'Noreste', 'Este', 'Sureste', 'Sur', 'Suroeste', 'Oeste', 'Noroeste'];
    const index = Math.round(degree / 45) % 8;
    return directions[index];
}

function getAQIDescription(aqi) {
    switch(aqi) {
        case 1:
            return 'Buena';
        case 2:
            return 'Moderada';
        case 3:
            return 'Insalubre para grupos sensibles';
        case 4:
            return 'Insalubre';
        case 5:
            return 'Muy insalubre';
        default:
            return 'Desconocida';
    }
}

function getDailySummary(lat, lon) {
    const apiKey = 'd39850783b63753edde5be57bae0249f';
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            const temperature = Math.round(data.main.temp);
            const humidity = Math.round(data.main.humidity);
            const description = data.weather[0].description;
            const windSpeed = Math.round(data.wind.speed);
            const windDirection = getCardinalDirection(Math.round(data.wind.deg));
            const summary = `El clima de hoy es ${description} con una temperatura de ${temperature}°C y una humedad de ${humidity}%. La velocidad del viento es de ${windSpeed} m/s, proveniente del ${windDirection}.`;
            document.getElementById('daily-summary').innerText = summary;
        })
        .catch(error => {
            console.error("Error fetching daily summary: ", error);
        });
}

let map;

function showSection(sectionId) {
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => {
        section.classList.remove('active');
        section.style.display = 'none';
    });
    const activeSection = document.getElementById(sectionId);
    activeSection.style.display = 'block';
    setTimeout(() => {
        activeSection.classList.add('active');
    }, 10);

    if (sectionId === 'current' && map) {
        map.resize();
    }
}

function initMap(lat, lon) {
    mapboxgl.accessToken = 'pk.eyJ1IjoiaG9sdDE0NSIsImEiOiJjbHl3NjZ1cWwwM3kxMmpvaDQ2c2kwaGQ0In0.6APdINn1TFxEw1DY21kBYg'; // Tu clave de Mapbox
    map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [lon, lat],
        zoom: 10
    });

    new mapboxgl.Marker()
        .setLngLat([lon, lat])
        .addTo(map);

    getWeatherDataForMap(map, lat, lon);
}

function getWeatherDataForMap(map, lat, lon) {
    const apiKey = 'd39850783b63753edde5be57bae0249f';
    const url = `https://api.openweathermap.org/data/2.5/find?lat=${lat}&lon=${lon}&cnt=10&units=metric&appid=${apiKey}`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            data.list.forEach(location => {
                new mapboxgl.Marker({
                    color: location.main.temp > 30 ? 'red' : 'blue'
                })
                .setLngLat([location.coord.lon, location.coord.lat])
                .setPopup(new mapboxgl.Popup().setHTML(`<h5>${location.name}</h5><p>Temp: ${Math.round(location.main.temp)}°C</p><p>Humidity: ${Math.round(location.main.humidity)}%</p>`))
                .addTo(map);
            });
        })
        .catch(error => {
            console.error("Error fetching map weather data: ", error);
        });
}


