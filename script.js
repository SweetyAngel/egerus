const TIME_LIMIT_SECONDS = 7;

let wordsData = [];
let currentWordData = {
    word: '',
    context: ''
};
let correctStressIndex = -1;
let selectedIndex = -1;
let correctAnswers = 0;
let totalAnswers = 0;
let timeDelta = 1;
let timer;
let timeLeft;

const timerEl = document.getElementById('timer');
const wordContainer = document.getElementById('wordContainer');
const feedbackEl = document.getElementById('feedback');
const nextBtn = document.getElementById('nextBtn');
const correctCountEl = document.getElementById('correctCount');
const incorrectCountEl = document.getElementById('incorrectCount');
const totalCountEl = document.getElementById('totalCount');
const percentageCorrectEl = document.getElementById('percentageCorrect');
const progressBar = document.getElementById('progressBar');
const progressContainer = document.querySelector('.progress');

const vowels = ['а', 'е', 'ё', 'и', 'о', 'у', 'ы', 'э', 'ю', 'я',
    'А', 'Е', 'Ё', 'И', 'О', 'У', 'Ы', 'Э', 'Ю', 'Я'
];

async function loadWords() {
    try {
        const response = await fetch('words.txt');
        const text = await response.text();
        const lines = text.split('\n').filter(line => line.trim() !== '');

        wordsData = lines.map(line => {
            const parts = line.split(';');
            const word = parts[0].trim();
            const context = parts.length > 1 ? parts[1].trim() : '';
            return {
                word,
                context
            };
        });

        startGame();
    } catch (error) {
        console.error('Ошибка загрузки слов:', error);
        wordContainer.textContent = 'Не удалось загрузить слова. Пожалуйста, обновите страницу.';
    }
}

function startGame() {
    if (wordsData.length === 0) {
        wordContainer.textContent = 'Нет слов для тренировки.';
        return;
    }

    nextWord();
}

function nextWord() {
    wordContainer.innerHTML = '';
    feedbackEl.textContent = '';
    nextBtn.style.display = 'none';
    selectedIndex = -1;

    const randomIndex = Math.floor(Math.random() * wordsData.length);
    currentWordData = wordsData[randomIndex];
    const currentWord = currentWordData.word;

    correctStressIndex = -1;
    for (let i = 0; i < currentWord.length; i++) {
        if (vowels.includes(currentWord[i]) && currentWord[i] === currentWord[i].toUpperCase()) {
            correctStressIndex = i;
            break;
        }
    }

    if (correctStressIndex === -1) {
        console.warn(`В слове "${currentWord}" не найдена ударная гласная. Пропускаем.`);
        nextWord();
        return;
    }

    displayWord();

    timeDelta = 1;

    startTimer();
}

function displayWord() {
    wordContainer.innerHTML = '';
    const currentWord = currentWordData.word;
    const context = currentWordData.context;

    for (let i = 0; i < currentWord.length; i++) {
        const letter = currentWord[i].toLowerCase();
        const span = document.createElement('span');
        span.textContent = letter;

        if (vowels.includes(letter)) {
            span.classList.add('vowel', 'letter');
            span.dataset.index = i;
            span.addEventListener('click', handleLetterClick);
        } else {
            span.classList.add('consonant');
        }

        wordContainer.appendChild(span);
    }

    if (context) {
        const contextSpan = document.createElement('span');
        contextSpan.classList.add('context');
        contextSpan.textContent = `${context}`;
        wordContainer.appendChild(contextSpan);
    }
}

function handleLetterClick(event) {
    if (selectedIndex !== -1) return;

    clearInterval(timer);
    timerEl.textContent = '';

    const clickedIndex = parseInt(event.target.dataset.index);
    selectedIndex = clickedIndex;

    const letters = wordContainer.querySelectorAll('.letter');
    letters.forEach(letter => {
        letter.classList.remove('selected');
        if (parseInt(letter.dataset.index) === clickedIndex) {
            letter.classList.add('selected');
        }
    });

    const isCorrect = clickedIndex === correctStressIndex;
    if (isCorrect) {
        correctAnswers++;
    }
    totalAnswers++;

    updateStats();

    showFeedback(isCorrect);

    nextBtn.style.display = 'inline-block';

    timeDelta = 0;
    updateTimerDisplay();
}

function showFeedback(isCorrect, timeLost = false) {
    const letters = wordContainer.querySelectorAll('.letter');
    const currentWord = currentWordData.word;
    const context = currentWordData.context;
    const stressedWord = currentWord.substring(0, correctStressIndex) + currentWord[correctStressIndex].toUpperCase() + currentWord.substring(correctStressIndex + 1);

    letters.forEach(letter => {
        const index = parseInt(letter.dataset.index);

        if (index === correctStressIndex) {
            letter.classList.add('correct');
            letter.textContent = currentWord[correctStressIndex].toUpperCase();
        }

        if (index === selectedIndex && !isCorrect) {
            letter.classList.add('incorrect');
        }
    });

    let feedbackText = isCorrect ? 'Правильно! 👍' : `Неправильно. Правильный ответ: "${stressedWord}"`;
    feedbackText = timeLost ? `К сожалению, Вы не успели. Правильный ответ: "${stressedWord}"` : feedbackText;
    feedbackEl.textContent = feedbackText;
    feedbackEl.style.color = isCorrect ? '#0f9d58' : '#db4437';
}

function updateStats() {
    const incorrectAnswers = totalAnswers - correctAnswers;
    const percentage = totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 0;
    const percentageCorrectForBar = totalAnswers > 0 ? (correctAnswers / totalAnswers) * 100 : 0;

    correctCountEl.textContent = correctAnswers;
    incorrectCountEl.textContent = incorrectAnswers;
    totalCountEl.textContent = totalAnswers;
    percentageCorrectEl.textContent = `${percentage}%`;

    progressBar.style.setProperty('--correct-percentage', `${percentageCorrectForBar}%`);

    if (incorrectAnswers > 0) {
        progressContainer.classList.add('has-incorrect');
    } else {
        progressContainer.classList.remove('has-incorrect');
    }
}

function startTimer() {
    timeLeft = TIME_LIMIT_SECONDS;
    updateTimerDisplay();
    timer = setInterval(() => {
        timeLeft -= timeDelta;
        updateTimerDisplay();
        if (timeLeft <= 0) {
            clearInterval(timer);
            if (selectedIndex === -1) {
                totalAnswers++;
                updateStats();
                showFeedback(false, true);
                nextBtn.style.display = 'inline-block';
            }
        }
    }, 1000);
}

function updateTimerDisplay() {
    const seconds = timeLeft > 0 ? timeLeft : 0;
    const formattedTime = `00:${seconds < 10 ? '0' : ''}${seconds}`;
    timerEl.textContent = formattedTime;
}

nextBtn.addEventListener('click', nextWord);

document.addEventListener('DOMContentLoaded', loadWords);
