document.addEventListener('DOMContentLoaded', () => {
    // --- API Keys & Global State ---
    const WEATHER_API_KEY = '090b3e73ac9c2715424ac7569f0d8efb';
    let localTimeInterval; 
    let weatherIsSet = false; 

    // --- Weather & Background Setup ---
    const fetchWeatherAndSetBackground = async (locationQuery) => {
        if (!locationQuery) {
            showAlert("Please select a location option.");
            return;
        }

        const setBackgroundAndDetails = (data) => {
            const weatherClasses = ['weather-sunny', 'weather-cloudy', 'weather-rainy', 'weather-thunder', 'weather-snowy', 'weather-fog', 'weather-default'];
            document.body.classList.remove(...weatherClasses);

            let weatherClass = 'weather-default';
            const conditionMain = data.weather[0].main.toLowerCase();

            switch (conditionMain) {
                case 'thunderstorm': case 'drizzle': case 'rain': weatherClass = 'weather-rainy'; break;
                case 'snow': weatherClass = 'weather-snowy'; break;
                case 'clear': weatherClass = 'weather-sunny'; break;
                case 'clouds': weatherClass = 'weather-cloudy'; break;
                case 'mist': case 'smoke': case 'haze': case 'dust': case 'fog': case 'sand': case 'ash': case 'squall': case 'tornado': weatherClass = 'weather-fog'; break;
                default: weatherClass = 'weather-default'; break;
            }
            
            document.body.classList.add(weatherClass);
            
            const weatherIcon = document.getElementById('weather-icon');
            weatherIcon.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
            weatherIcon.alt = data.weather[0].description;
            document.getElementById('weather-location').textContent = `${data.name}, ${data.sys.country}`;
            const sunrise = new Date((data.sys.sunrise + data.timezone) * 1000).toUTCString().slice(-12, -7);
            const sunset = new Date((data.sys.sunset + data.timezone) * 1000).toUTCString().slice(-12, -7);
            document.getElementById('weather-details').innerHTML = `<strong>${Math.round(data.main.temp)}°C</strong> | ${data.weather[0].description}<br>Humidity: ${data.main.humidity}% | Wind: ${data.wind.speed} m/s<br>Sunrise: ${sunrise} | Sunset: ${sunset}`;

            clearInterval(localTimeInterval);
            localTimeInterval = setInterval(() => {
                const localTime = new Date(new Date().getTime() + data.timezone * 1000).toUTCString().slice(-12, -4);
                document.getElementById('weather-time').textContent = `${localTime}`;
            }, 1000);
            weatherIsSet = true;
        };

        try {
            let endpoint;
            if (locationQuery === 'auto:ip') {
                const position = await new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 }));
                endpoint = `https://api.openweathermap.org/data/2.5/weather?lat=${position.coords.latitude}&lon=${position.coords.longitude}&appid=${WEATHER_API_KEY}&units=metric`;
            } else {
                endpoint = `https://api.openweathermap.org/data/2.5/weather?q=${locationQuery}&appid=${WEATHER_API_KEY}&units=metric`;
            }
            const response = await fetch(endpoint);
            if (!response.ok) {
                showAlert(`Could not find weather for "${locationQuery}". Please try another city.`);
                throw new Error('Weather data not available');
            }
            const data = await response.json();
            setBackgroundAndDetails(data);
        } catch (error) {
            console.error("Weather fetch error:", error);
            if (locationQuery === 'auto:ip') showAlert('Could not get local weather. Please allow location access.');
        }
    };

    // --- DOM Elements ---
    const statusText = document.getElementById('status-text');
    const restartBtn = document.getElementById('restart-btn');
    const cells = document.querySelectorAll('.cell');
    const mainWrapper = document.getElementById('main-wrapper');
    const strikeLine = document.getElementById('strike-line');
    const liveQaHistory = document.getElementById('live-qa-history');

    // Modals & Buttons
    const customAlertModal = document.getElementById('custom-alert-modal');
    const alertOkBtn = document.getElementById('alert-ok-btn');
    const rulesModal = document.getElementById('rules-modal');
    const setupModal = document.getElementById('setup-modal');
    const topicModal = document.getElementById('topic-modal');
    const questionModal = document.getElementById('question-modal');
    const winnerModal = document.getElementById('winner-modal');
    const rulesOkBtn = document.getElementById('rules-ok-btn');
    const startGameBtn = document.getElementById('start-game-btn');
    const playAgainBtn = document.getElementById('play-again-btn');
    const nameError = document.getElementById('name-error');
    const topicBtns = document.querySelectorAll('.topic-btn');
    const useLocationBtn = document.getElementById('use-location-btn');
    const citySelect = document.getElementById('city-select');

    // --- Event Listeners & Initial Setup ---
    useLocationBtn.addEventListener('click', () => fetchWeatherAndSetBackground('auto:ip'));
    citySelect.addEventListener('change', (e) => fetchWeatherAndSetBackground(e.target.value));
    const populateCities = () => {
        const majorCities = ['New York', 'London', 'Tokyo', 'Paris', 'Sydney', 'Dubai', 'Moscow', 'Beijing', 'Los Angeles', 'Cairo'];
        majorCities.forEach(city => {
            const option = document.createElement('option');
            option.value = city;
            option.textContent = city;
            citySelect.appendChild(option);
        });
    };
    populateCities();

    // --- Game State & Logic ---
    let options = ["", "", "", "", "", "", "", "", ""];
    let currentPlayer = "X";
    let gameActive = false;
    let localQuestions = [];
    let currentCategory = '';
    let selectedCellIndex = null;
    let playerNames = { X: "Player 1", O: "Player 2" };
    let roundHistory = [];

    const winConditions = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6]
    ];

    const showAlert = (message) => {
        document.getElementById('alert-message').textContent = message;
        customAlertModal.classList.add('show');
    };
    alertOkBtn.addEventListener('click', () => customAlertModal.classList.remove('show'));
    
    rulesOkBtn.addEventListener('click', () => { rulesModal.classList.remove('show'); setupModal.classList.add('show'); });

    startGameBtn.addEventListener('click', () => {
        if (!weatherIsSet) {
            nameError.textContent = "Please select a weather location first.";
            return;
        }
        const p1Name = document.getElementById('player1-name').value.trim();
        const p2Name = document.getElementById('player2-name').value.trim();
        if (p1Name === "" || p2Name === "") {
            nameError.textContent = "Please enter a name for both players.";
            return;
        }
        nameError.textContent = "";
        playerNames.X = p1Name;
        playerNames.O = p2Name;
        setupModal.classList.remove('show');
        topicModal.classList.add('show');
    });

    topicBtns.forEach(button => {
        button.addEventListener('click', () => {
            currentCategory = button.getAttribute('data-category');
            topicModal.classList.remove('show');
            mainWrapper.classList.remove('hidden');
            initializeGame();
        });
    });

    const updateStatusText = () => {
        statusText.innerHTML = `${playerNames[currentPlayer]}'s turn <span class="player-symbol ${currentPlayer.toLowerCase()}">${currentPlayer}</span>`;
    };

    const initializeGame = () => {
        cells.forEach(cell => { cell.textContent = ""; cell.className = 'cell'; });
        strikeLine.className = '';
        strikeLine.style.width = '0';
        options = ["", "", "", "", "", "", "", "", ""];
        currentPlayer = "X";
        updateStatusText();
        gameActive = true;
        localQuestions = [];
        roundHistory = [];
        liveQaHistory.innerHTML = '';
        fetchQuestions();
    };

    const fetchQuestions = async () => {
        if (localQuestions.length > 0) return;
        try {
            const response = await fetch(`https://opentdb.com/api.php?amount=10&category=${currentCategory}&type=multiple`);
            const data = await response.json();
            localQuestions = data.results.map(q => ({ question: q.question, answers: [...q.incorrect_answers, q.correct_answer], correctAnswer: q.correct_answer }));
        } catch (error) { console.error("Failed to fetch questions:", error); showAlert("Error fetching questions. Please restart."); }
    };

    const getQuestion = async () => {
        if (localQuestions.length === 0) {
            statusText.textContent = "Fetching new questions...";
            await fetchQuestions();
            updateStatusText();
        }
        return localQuestions.pop();
    };

    const displayQuestion = (questionData) => {
        const questionText = document.getElementById('question-text');
        const answerButtons = document.getElementById('answer-buttons');
        questionText.innerHTML = questionData.question;
        answerButtons.innerHTML = "";
        const shuffledAnswers = questionData.answers.sort(() => Math.random() - 0.5);
        shuffledAnswers.forEach(answer => {
            const button = document.createElement('button');
            button.innerHTML = answer;
            button.addEventListener('click', () => handleAnswer(answer, questionData));
            answerButtons.appendChild(button);
        });
        questionModal.classList.add('show');
    };

    const updateLiveHistory = () => {
        const lastItem = roundHistory[roundHistory.length - 1];
        if (!lastItem) return;

        const result = lastItem.chosenAnswer === lastItem.correctAnswer ? 'Correct' : 'Incorrect';
        const qaItem = document.createElement('div');
        qaItem.className = 'qa-item';
        qaItem.innerHTML = `
            <p><strong>Player:</strong> ${lastItem.player}</p>
            <p><strong>Q:</strong> ${lastItem.question}</p>
            <p><strong>A:</strong> ${lastItem.chosenAnswer} 
               <span class="qa-result ${result.toLowerCase()}">(${result})</span></p>
        `;
        liveQaHistory.appendChild(qaItem);
        liveQaHistory.scrollTop = liveQaHistory.scrollHeight; // Auto-scroll
    };
    
    const handleAnswer = (selectedAnswer, questionData) => {
        questionModal.classList.remove('show');
        roundHistory.push({
            question: questionData.question,
            chosenAnswer: selectedAnswer,
            correctAnswer: questionData.correctAnswer,
            player: playerNames[currentPlayer]
        });
        updateLiveHistory(); // Update the live history panel
        if (selectedAnswer === questionData.correctAnswer) {
            updateCell(cells[selectedCellIndex], selectedCellIndex);
            checkResult();
        } else { showAlert("Wrong answer! Your turn is skipped."); changePlayer(); }
    };

    cells.forEach(cell => cell.addEventListener('click', cellClicked));
    restartBtn.addEventListener('click', () => { mainWrapper.classList.add('hidden'); winnerModal.classList.remove('show'); topicModal.classList.add('show'); });
    playAgainBtn.addEventListener('click', () => { mainWrapper.classList.add('hidden'); winnerModal.classList.remove('show'); topicModal.classList.add('show'); });

    async function cellClicked() {
        const cellIndex = this.getAttribute('data-cell-index');
        if (options[cellIndex] !== "" || !gameActive) return;
        selectedCellIndex = cellIndex;
        const question = await getQuestion();
        if (question) displayQuestion(question);
    }

    const updateCell = (cell, index) => {
        options[index] = currentPlayer;
        cell.textContent = currentPlayer;
        cell.classList.add(currentPlayer.toLowerCase());
    };

    const changePlayer = () => {
        currentPlayer = (currentPlayer === "X") ? "O" : "X";
        updateStatusText();
    };

    const showWinnerScreen = () => {
        document.getElementById('winner-text').textContent = `${playerNames[currentPlayer]} is the Champion!`;
        const qaHistoryContainer = document.getElementById('qa-history');
        qaHistoryContainer.innerHTML = liveQaHistory.innerHTML; // Reuse the live history
        winnerModal.classList.add('show');
    };

    const drawStrikeLine = (winIndex) => {
        const strikeClasses = [ 'strike-row-1', 'strike-row-2', 'strike-row-3', 'strike-col-1', 'strike-col-2', 'strike-col-3', 'strike-diag-1', 'strike-diag-2' ];
        strikeLine.className = strikeClasses[winIndex];
        // This forces the transition to happen
        setTimeout(() => {
            strikeLine.style.width = strikeLine.classList.contains('strike-diag-1') || strikeLine.classList.contains('strike-diag-2') ? '390px' : '300px';
        }, 50);
    };

    const checkResult = () => {
        let roundWon = false;
        let winIndex = -1;
        for (let i = 0; i < winConditions.length; i++) {
            const condition = winConditions[i];
            const cellA = options[condition[0]]; const cellB = options[condition[1]]; const cellC = options[condition[2]];
            if (cellA === "" || cellB === "" || cellC === "") continue;
            if (cellA === cellB && cellB === cellC) { roundWon = true; winIndex = i; break; }
        }

        if (roundWon) {
            statusText.textContent = `${playerNames[currentPlayer]} wins!`;
            gameActive = false;
            drawStrikeLine(winIndex);
            setTimeout(showWinnerScreen, 1200);
        } else if (!options.includes("")) {
            statusText.textContent = `It's a Draw!`;
            gameActive = false;
            setTimeout(() => {
                showAlert("It's a draw! No one wins.");
            }, 500);
        } else {
            changePlayer();
        }
    };
});

