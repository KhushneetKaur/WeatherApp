/************ ELEMENT REFERENCES ************/
const userTab = document.querySelector("[data-userWeather]");
const searchTab = document.querySelector("[data-searchWeather]");
const userContainer = document.querySelector(".weather-container");

const grantAccessContainer = document.querySelector(".grant-location-container");
const searchForm = document.querySelector("[data-searchForm]");
const loadingScreen = document.querySelector(".loading-container");
const userInfoContainer = document.querySelector(".user-info-container");
const errorContainer = document.querySelector(".error-container");
const retryBtn = document.querySelector("#retry-btn");
const themeBtn = document.getElementById("theme-btn");
const searchInput = document.querySelector("[data-searchInput]");

const API_KEY = "d1845658f92b31c64bd94f06f7188c9c";
let oldTab = userTab;
let isCelsius = true; // For temperature toggle

/************ INITIAL SETUP ************/
oldTab.classList.add("current-tab");
getFromSessionStorage();

/************ THEME TOGGLE ************/
// const savedTheme = localStorage.getItem("theme");
// if (savedTheme === "dark") {
//     document.body.classList.add("dark");
//     themeBtn.textContent = "☀️ Light Mode";
// }

// themeBtn.addEventListener("click", () => {
//     document.body.classList.toggle("dark");
//     const isDark = document.body.classList.contains("dark");
//     themeBtn.textContent = isDark ? "☀️ Light Mode" : "🌙 Dark Mode";
//     localStorage.setItem("theme", isDark ? "dark" : "light");
// });

/************ TAB SWITCHING ************/
function switchTab(newTab) {
    if (newTab !== oldTab) {
        oldTab.classList.remove("current-tab");
        oldTab = newTab;
        oldTab.classList.add("current-tab");

        userInfoContainer.classList.remove("active");
        grantAccessContainer.classList.remove("active");
        searchForm.classList.remove("active"); // hide search by default
        errorContainer.classList.remove("active");

        if (newTab === userTab) {
            // Hide search form completely
            searchForm.classList.remove("active");
            getFromSessionStorage();
        } else {
            // Show search form
            searchForm.classList.add("active");
        }
    }
}


userTab.addEventListener("click", () => switchTab(userTab));
searchTab.addEventListener("click", () => switchTab(searchTab));

/************ SESSION STORAGE ************/
function getFromSessionStorage() {
    const localCoordinates = sessionStorage.getItem("user-coordinates");
    if (!localCoordinates) {
        // No coordinates stored, show grant access
        grantAccessContainer.classList.add("active");
        searchForm.classList.remove("active");
        userInfoContainer.classList.remove("active");
        errorContainer.classList.remove("active");
    } else {
        // Coordinates exist, hide grant access and fetch weather
        grantAccessContainer.classList.remove("active");
        searchForm.classList.remove("active");
        userInfoContainer.classList.remove("active");
        errorContainer.classList.remove("active");

        const coordinates = JSON.parse(localCoordinates);
        fetchUserWeatherInfo(coordinates);
    }
}


/************ GEOLOCATION ************/
function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showPosition, showGeoError);
    } else {
        alert("Geolocation not supported by your browser.");
    }
}

function showGeoError() {
    showError("Unable to access location. Please enable GPS or try searching manually.");
}

function showPosition(position) {
    const userCoordinates = {
        lat: position.coords.latitude,
        lon: position.coords.longitude,
    };
    sessionStorage.setItem("user-coordinates", JSON.stringify(userCoordinates));
    
    // Hide grant access immediately
    grantAccessContainer.classList.remove("active"); 
    loadingScreen.classList.add("active");

    fetchUserWeatherInfo(userCoordinates);
}


document.querySelector("[data-grantAccess]").addEventListener("click", getLocation);

/************ WEATHER FETCH FUNCTIONS ************/
async function fetchUserWeatherInfo(coordinates) {
    const { lat, lon } = coordinates;

    // Hide grant access container immediately
    grantAccessContainer.classList.remove("active");

    // Show loading
    loadingScreen.classList.add("active");

    // Ensure other containers are hidden
    userInfoContainer.classList.remove("active");
    errorContainer.classList.remove("active");

    try {
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
        );
        if (!response.ok) throw new Error("Failed to fetch user weather");

        const data = await response.json();

        // Hide loading, show user info
        loadingScreen.classList.remove("active");
        userInfoContainer.classList.add("active");

        renderWeatherInfo(data);
    } catch (err) {
        console.error(err);
        showError("Network issue or API error. Please try again!");
    }
}


async function fetchSearchWeatherInfo(city) {
    if (!city || !isNaN(city)) {
        alert("Please enter a valid city name.");
        return;
    }

   grantAccessContainer.classList.remove("active"); // hide grant location
   loadingScreen.classList.add("active"); // show loading
   userInfoContainer.classList.remove("active"); // make sure user info is hidden
   errorContainer.classList.remove("active"); // hide errors


    try {
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`
        );

        if (response.status === 404) {
            throw new Error("City not found");
        }

        if (!response.ok) {
            throw new Error("Failed to fetch weather data");
        }

        const data = await response.json();

        loadingScreen.classList.remove("active");
        userInfoContainer.classList.add("active");
        renderWeatherInfo(data);
    } catch (err) {
        console.error(err);
        if (err.message.includes("City not found")) {
            showError("City not found. Please check spelling and try again!");
        } else {
            showError("Network issue. Please try again later!");
        }
    }
}

/************ RENDER WEATHER INFO ************/
function renderWeatherInfo(weatherInfo) {
    errorContainer.classList.remove("active");

    const cityName = document.querySelector("[data-cityName]");
    const countryIcon = document.querySelector("[data-countryIcon]");
    const desc = document.querySelector("[data-weatherDesc]");
    const weatherIcon = document.querySelector("[data-weatherIcon]");
    const temp = document.querySelector("[data-temp]");
    const windspeed = document.querySelector("[data-windspeed]");
    const humidity = document.querySelector("[data-humidity]");
    const cloudiness = document.querySelector("[data-cloudiness]");

    cityName.innerText = weatherInfo?.name;
    countryIcon.src = `https://flagcdn.com/144x108/${weatherInfo?.sys?.country?.toLowerCase()}.png`;
    desc.innerText = weatherInfo?.weather?.[0]?.description;
    weatherIcon.src = `http://openweathermap.org/img/w/${weatherInfo?.weather?.[0]?.icon}.png`;
    temp.innerText = `${weatherInfo?.main?.temp.toFixed(1)} °C`;
    windspeed.innerText = `${weatherInfo?.wind?.speed} m/s`;
    humidity.innerText = `${weatherInfo?.main?.humidity}%`;
    cloudiness.innerText = `${weatherInfo?.clouds?.all}%`;

    updateBackground(weatherInfo.weather[0].main.toLowerCase());
    addLastUpdated();
    addTempToggle(weatherInfo?.main?.temp);
}

/************ WEATHER-BASED BACKGROUND ************/
function updateBackground(condition) {
    const wrapper = document.querySelector(".wrapper");
    let gradient;

    if (condition.includes("rain")) gradient = "linear-gradient(160deg, #2C5364, #203A43)";
    else if (condition.includes("clear")) gradient = "linear-gradient(160deg, #F9D423, #FF4E50)";
    else if (condition.includes("cloud")) gradient = "linear-gradient(160deg, #bdc3c7, #2c3e50)";
    else if (condition.includes("snow")) gradient = "linear-gradient(160deg, #E0EAFC, #CFDEF3)";
    else gradient = "linear-gradient(160deg, var(--colorDark1), var(--colorDark2))";

    wrapper.style.backgroundImage = gradient;
}

/************ ERROR HANDLER ************/
function showError(message) {
    loadingScreen.classList.remove("active");
    userInfoContainer.classList.remove("active");
    grantAccessContainer.classList.remove("active");
    errorContainer.classList.add("active");
    errorContainer.querySelector("p").textContent = message;
}

/************ SEARCH SUBMIT ************/
searchForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const cityName = searchInput.value.trim();
    fetchSearchWeatherInfo(cityName);
});

/************ RETRY BUTTON ************/
retryBtn.addEventListener("click", () => {
    errorContainer.classList.remove("active");
    if (oldTab === userTab) getFromSessionStorage();
});

/************ LAST UPDATED TIME ************/
function addLastUpdated() {
    let existing = document.querySelector(".last-updated");
    if (existing) existing.remove();

    const lastUpdated = document.createElement("p");
    lastUpdated.className = "last-updated";
    lastUpdated.style.marginTop = "1rem";
    lastUpdated.style.fontSize = "0.9rem";
    lastUpdated.textContent = `Last updated: ${new Date().toLocaleTimeString()}`;
    userInfoContainer.appendChild(lastUpdated);
}

/************ TEMPERATURE TOGGLE ************/
function addTempToggle(tempValue) {
    let existingToggle = document.querySelector("#temp-toggle");
    if (existingToggle) existingToggle.remove();

    const toggleBtn = document.createElement("button");
    toggleBtn.id = "temp-toggle";
    toggleBtn.textContent = "Switch to °F";
    toggleBtn.classList.add("btn");
    toggleBtn.style.marginTop = "0.8rem";

    toggleBtn.addEventListener("click", () => {
        const temp = document.querySelector("[data-temp]");
        if (isCelsius) {
            temp.innerText = `${(tempValue * 9 / 5 + 32).toFixed(1)} °F`;
            toggleBtn.textContent = "Switch to °C";
        } else {
            temp.innerText = `${tempValue.toFixed(1)} °C`;
            toggleBtn.textContent = "Switch to °F";
        }
        isCelsius = !isCelsius;
    });

     const tempElement = document.querySelector("[data-temp]");
    tempElement.insertAdjacentElement("afterend", toggleBtn);
}