// --- 1. GENERAL NAVIGATION ---
function showSection(sectionId) {
    document.querySelectorAll('main section').forEach(sec => sec.style.display = 'none');
    document.getElementById(sectionId).style.display = 'block';
}

// Display Today's Date
const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
document.getElementById('date-display').innerText = new Date().toLocaleDateString('en-US', dateOptions);


// --- 2. SCHEDULER & MEETINGS ---
let schedule = [
    { time: '09:00', title: 'Math Class', link: 'https://zoom.us' },
    { time: '11:00', title: 'History', link: '' }
];

function renderSchedule() {
    const container = document.getElementById('schedule-list');
    container.innerHTML = ''; // Clear current list

    // Sort by time
    schedule.sort((a, b) => a.time.localeCompare(b.time));

    schedule.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'time-slot';
        
        let linkHtml = item.link ? `<a href="${item.link}" target="_blank" class="join-btn">Join Meeting</a>` : '';
        
        div.innerHTML = `
            <span class="time-label">${item.time}</span>
            <div class="event-details">
                <span>${item.title}</span>
                ${linkHtml}
                <button class="delete-btn" onclick="deleteClass(${index})">X</button>
            </div>
        `;
        container.appendChild(div);
    });
}

function addClass() {
    const time = document.getElementById('class-time').value;
    const name = document.getElementById('class-name').value;
    const link = document.getElementById('class-link').value;

    if (time && name) {
        schedule.push({ time, title: name, link });
        renderSchedule();
        // Clear inputs
        document.getElementById('class-time').value = '';
        document.getElementById('class-name').value = '';
        document.getElementById('class-link').value = '';
    } else {
        alert("Please enter a time and class name.");
    }
}

function deleteClass(index) {
    schedule.splice(index, 1);
    renderSchedule();
}


// --- 3. ALARMS ---
let alarms = [];
const alarmSound = document.getElementById('alarm-sound');

function setAlarm() {
    const time = document.getElementById('alarm-time').value;
    const label = document.getElementById('alarm-label').value || 'Alarm';
    
    if (time) {
        alarms.push({ time, label, active: true });
        renderAlarms();
        updateNextAlarmDisplay();
    }
}

function renderAlarms() {
    const container = document.getElementById('active-alarms-list');
    container.innerHTML = '';
    
    alarms.forEach((alarm, index) => {
        const div = document.createElement('div');
        div.className = 'card';
        div.innerHTML = `
            <h3>${alarm.time}</h3>
            <p>${alarm.label}</p>
            <button onclick="removeAlarm(${index})" class="delete-btn" style="margin:0; margin-top:10px;">Remove</button>
        `;
        container.appendChild(div);
    });
}

function removeAlarm(index) {
    alarms.splice(index, 1);
    renderAlarms();
    updateNextAlarmDisplay();
}

function updateNextAlarmDisplay() {
    if (alarms.length > 0) {
        // Simple logic: just show the first one in the list for now
        document.getElementById('next-alarm-display').innerText = alarms[0].time;
    } else {
        document.getElementById('next-alarm-display').innerText = "None";
    }
}

// Check time every second
setInterval(() => {
    const now = new Date();
    const currentTime = now.toTimeString().substring(0, 5); // Format HH:MM

    alarms.forEach((alarm, index) => {
        if (alarm.active && alarm.time === currentTime) {
            alarmSound.play();
            alert(`⏰ ALARM: ${alarm.label}`);
            alarm.active = false; // Disable so it doesn't ring forever
            removeAlarm(index); // Remove after ringing (optional)
        }
    });
}, 1000);


// --- 4. DEADLINES ---
function addDeadline() {
    const text = document.getElementById('new-deadline').value;
    if (text) {
        const ul = document.getElementById('deadline-list');
        const li = document.createElement('li');
        li.innerHTML = `${text} <span style="cursor:pointer; color:red;" onclick="this.parentElement.remove()">&#10006;</span>`;
        ul.appendChild(li);
        document.getElementById('new-deadline').value = '';
    }
}

// --- 5. TIMER & FLASHCARDS (Kept simple) ---
let timer;
function startTimer() {
    alert("Timer started! (Simulated)");
}

// Init
renderSchedule();
