// 1. Navigation Logic
function showSection(sectionId) {
    // Hide all sections
    const sections = document.querySelectorAll('main section');
    sections.forEach(sec => sec.style.display = 'none');

    // Show the selected section
    document.getElementById(sectionId).style.display = 'block';

    // Update active state in sidebar
    // Note: You can add logic here to highlight the current menu item
}

// 2. Pomodoro Timer Logic
let timer;
let timeLeft = 1500; // 25 minutes in seconds

function startTimer() {
    if (timer) clearInterval(timer);
    
    timer = setInterval(() => {
        if (timeLeft <= 0) {
            clearInterval(timer);
            alert("Time's up! Take a break.");
            timeLeft = 1500;
        } else {
            timeLeft--;
            let minutes = Math.floor(timeLeft / 60);
            let seconds = timeLeft % 60;
            // Add leading zero
            seconds = seconds < 10 ? '0' + seconds : seconds;
            document.getElementById('pomodoro').innerText = `${minutes}:${seconds}`;
        }
    }, 1000);
}

// 3. Flashcard Logic
const cards = [
    { q: "What is the capital of France?", a: "Paris" },
    { q: "Square root of 144?", a: "12" },
    { q: "H2O is the chemical formula for?", a: "Water" }
];
let currentCardIndex = 0;

function flipCard() {
    document.getElementById('cardInner').classList.toggle('flip');
}

function nextCard() {
    // Reset flip
    document.getElementById('cardInner').classList.remove('flip');
    
    // Wait small amount for flip back then change text
    setTimeout(() => {
        currentCardIndex = (currentCardIndex + 1) % cards.length;
        document.querySelector('.flashcard-front h2').innerText = cards[currentCardIndex].q;
        document.querySelector('.flashcard-back h2').innerText = cards[currentCardIndex].a;
    }, 300);
}
