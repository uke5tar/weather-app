// vanilla javascript document ready equivalent
var ready = function ( fn ) {
    if ( typeof fn !== 'function' ) return;
    if ( document.readyState === 'interactive' || document.readyState === 'complete' ) {
        return fn();
    }
    document.addEventListener( 'DOMContentLoaded', fn, false );
};

ready(function() {
    // helper functions
    let $QSA = (elem) => document.querySelectorAll(elem),
        $QS = (elem) => document.querySelector(elem),
        $ID = (elem) => document.getElementById(elem),
        $Arr = (elem) => Array.from(elem);

    // browser has to support geolocation feature
    if ("geolocation" in navigator) {
        // get coordinates based on browser geolocation
        function getCurrentPos(options = {}) {
            const success = pos => {
                let coordinates = pos.coords;
                init_weatherService(coordinates.latitude, coordinates.longitude);
            }

            const error = err => {
                console.error(`ERROR(${err.code}): ${err.message}`);
            }

            return new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(success, error, options);
            });
        }

        (async function loadGetCurrentPos() {
            try {
                await getCurrentPos();
            }
            catch (err) {
                console.error(`ERROR(${err.code}): ${err.message}`);
            }
        })();

    } else {
        alert("Geolocation is not enabled in your Browser.");
        // potentially geolocation could be identified here via ip service
    }

    // initial fetch of data
    function init_weatherService(latitude, longitude) {
        const getWeatherData = async (latitude, longitude) => {
            let url = `https://api.apixu.com/v1/forecast.json?key=1995ab7117654e22b06234111170306&q=${latitude},${longitude}&days=7`;
            let rawData = await(await fetch(url)).json();
            return rawData;
        };

        (async function loadGetWeatherData() {
            try {
                let rawData = await getWeatherData(latitude, longitude);
                run_weatherService(rawData);
            }
            catch(err) {
                console.error(`ERROR(${err.code}): ${err.message}`);
            }
        })();
    }

    // execute after weather data has been fetched
    function run_weatherService(weatherData) {
        var originalWeatherData = weatherData;

        // initial run
        showBody();
        updateHTML(weatherData);
        evenListeners();

        /* DECLARING FUNCTIONS */
        // show body
        function showBody() {
            $QS("main").classList.remove("hidden");
            $QS('.loader').classList.add('hidden');
        };

        // get current weather based on fetched data | returns obj
        function getCurrentWeather(weatherData) {
            let data = {};
            let current = weatherData.current;
            let fcastday = weatherData.forecast.forecastday;

            data.weatherIcon = current.condition.icon;
            data.sky = current.condition.text;
            data.windspeed = `${current.wind_kph} kph`;
            data.humidity = `${current.humidity}%`;
            data.sunrise = fcastday[0].astro.sunrise;
            data.sunset = fcastday[0].astro.sunset;
            data.tempC = current.temp_c;
            data.tempF = current.temp_f;
            data.minTempC = fcastday[0].day.mintemp_c;
            data.maxTempC = fcastday[0].day.maxtemp_c;
            data.minTempF = fcastday[0].day.mintemp_f;
            data.maxTempF = fcastday[0].day.maxtemp_f;
            data.region = weatherData.location.region;

            return data;
        }

        // get forecast weather based on fetched data | returns obj
        function getForecastWeather(weatherData, day) {
            let data = {};
            let fcastday = weatherData.forecast.forecastday;

            data.weatherIcon = fcastday[day].day.condition.icon;
            data.sky = fcastday[day].day.condition.text;
            data.windspeed = `${fcastday[day].day.avgvis_km} kph`;
            data.humidity = `${fcastday[day].day.avghumidity}%`;
            data.sunrise = fcastday[day].astro.sunrise;
            data.sunset = fcastday[day].astro.sunset;
            data.tempC = fcastday[day].day.avgtemp_c;
            data.tempF = fcastday[day].day.avgtemp_f;
            data.minTempC = fcastday[day].day.mintemp_c;
            data.maxTempC = fcastday[day].day.maxtemp_c;
            data.minTempF = fcastday[day].day.mintemp_f;
            data.maxTempF = fcastday[day].day.maxtemp_f;
            data.region = weatherData.location.region;

            return data;
        }

        // decide to call current or forecast weather
        function whichWeather(weatherData, day) {
            const whichWeather = $ID('day').value.length === 0
            ? getCurrentWeather(weatherData)
            : getForecastWeather(weatherData, day);

            return whichWeather;
        }

        // update DOM with weather information
        function updateHTML(weatherData, day = 0) {
            let wd = whichWeather(weatherData, day);
            let wt = {};

            if($ID('celsius').classList.contains('active')) {
                wt.temp = wd.tempC;
                wt.minTemp = wd.minTempC;
                wt.maxTemp = wd.maxTempC;
            }
            else {
                wt.temp = wd.tempF;
                wt.minTemp = wd.minTempF;
                wt.maxTemp = wd.maxTempF;
            }

            $ID('temp').innerText = `${wt.temp}°`;
            $ID('mintemp').innerText = `${wt.minTemp}°`;
            $ID('maxtemp').innerText = `${wt.maxTemp}°`;

            $ID('city').innerText = wd.region;
            $ID("weather-icon").setAttribute("src", "https:" + wd.weatherIcon);
            $ID("sky").innerText = wd.sky;
            $ID("windspeed").innerText = wd.windspeed;
            $ID("humidity").innerText = wd.humidity;
            $ID("sunrise").innerText = wd.sunrise;
            $ID("sunset").innerText = wd.sunset;
        }

        /* event listeners */
        function evenListeners() {
            // click events
            $QS("#add-infos-btn").addEventListener('click', () => {
                $QSA("#add-infos div span").forEach(elem => elem.classList.toggle('hidden'))
            });

            $ID('temp-buttons').addEventListener('click', function(event) {
                if(!event.target.classList.contains('active')) {
                    event.currentTarget.querySelectorAll('a').forEach(elem => elem.classList.toggle('active'));
                }
                updateHTML(weatherData);
            });

            $ID('reset').addEventListener('click', () => {
                $QS('#forecast-options select').selectedIndex = 0;
                updateHTML(weatherData);
            });

            // onchange events
            $ID('day').onchange = event => {
                let day = event.target.value;
                updateHTML(originalWeatherData, day);
            };
        }
    }

// end document ready
});
