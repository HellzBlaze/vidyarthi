// --- STATE MANAGEMENT (Data Persistence) ---
// We load data from LocalStorage or use default empty arrays
let appData = JSON.parse(localStorage.getItem('vidyarthiData')) || {
    schedule: [],
    alarms: [],
    tasks: { todo: [], done: [] },
    deadlines: [],
    theme: 'light'
};

function saveData() {
    localStorage.setItem('vidyarthiData', JSON.stringify(appData));
    updateDashboardCounts();
}

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    renderSchedule();
    renderAlarms();
    renderTasks();
    renderDeadlines();
    initChart();
    updateDate();
    updateDashboardCounts();
    
    // Check alarms every second
    setInterval(checkAlarms, 1000);
});

// --- THEME & TIME ---
function initTheme() {
    if (appData.theme === 'dark') {
        document.body.classList.add('dark-mode');
        document.getElementById('theme-toggle').innerHTML = '<i class="fa-solid fa-sun"></i> Light Mode';
    }
}

function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    appData.theme = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
    const btnIcon = appData.theme === 'dark' ? '<i class="fa-solid fa-sun"></i> Light Mode' : '<i class="fa-solid fa-moon"></i> Dark Mode';
    document.getElementById('theme-toggle').innerHTML = btnIcon;
    saveData();
}

function updateDate() {
    const now = new Date();
    document.getElementById('date-display').innerText = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    
    const hour = now.getHours();
    let greeting = "Good Morning";
    if (hour >= 12) greeting = "Good Afternoon";
    if (hour >= 17) greeting = "Good Evening";
    document.getElementById('greeting-text').innerText = `${greeting}, Student`;
}

// --- NAVIGATION ---
function showSection(id) {
    document.querySelectorAll('.view-section').forEach(el => el.style.display = 'none');
    document.getElementById(id).style.display = 'block';
    
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    // Simple logic to find nav item by onclick matching (simplified for brevity)
    // In production, you'd give nav items IDs.
}

// --- SCHEDULER ---
function addClass() {
    const time = document.getElementById('new-class-time').value;
    const name = document.getElementById('new-class-name').value;
    const link = document.getElementById('new-class-link').value;

    if (time && name) {
        appData.schedule.push({ time, name, link });
        appData.schedule.sort((a, b) => a.time.localeCompare(b.time));
        saveData();
        renderSchedule();
        closeModal('class-modal');
    }
}

function renderSchedule() {
    const list = document.getElementById('schedule-list');
    list.innerHTML = '';
    appData.schedule.forEach((item, index) => {
        list.innerHTML += `
            <div class="schedule-item">
                <span style="font-weight:bold; color:var(--primary);">${item.time}</span>
                <span style="flex:1; margin-left:15px;">${item.name}</span>
                ${item.link ? `<a href="${item.link}" target="_blank" class="primary-btn" style="padding:5px 10px; font-size:0.8rem;">Join</a>` : ''}
                <button onclick="deleteItem('schedule', ${index})" style="color:red; background:none; border:none; margin-left:10px; cursor:pointer;"><i class="fa-solid fa-trash"></i></button>
            </div>
        `;
    });
}

// --- TASKS (KANBAN) ---
function addTask(type) {
    const input = document.getElementById('todo-input');
    if (input.value) {
        appData.tasks[type].push(input.value);
        input.value = '';
        saveData();
        renderTasks();
    }
}

function renderTasks() {
    const todoList = document.getElementById('todo-list');
    const doneList = document.getElementById('done-list');
    
    todoList.innerHTML = appData.tasks.todo.map((t, i) => `
        <div class="task-card" onclick="moveTask(${i}, 'todo', 'done')">${t}</div>
    `).join('');
    
    doneList.innerHTML = appData.tasks.done.map((t, i) => `
        <div class="task-card" style="text-decoration:line-through; opacity:0.6;" onclick="moveTask(${i}, 'done', 'todo')">${t}</div>
    `).join('');
}

function moveTask(index, from, to) {
    const item = appData.tasks[from].splice(index, 1)[0];
    appData.tasks[to].push(item);
    saveData();
    renderTasks();
}

// --- ALARMS ---
function addAlarm() {
    const time = document.getElementById('alarm-time').value;
    const label = document.getElementById('alarm-label').value;
    if (time) {
        appData.alarms.push({ time, label, active: true });
        saveData();
        renderAlarms();
    }
}

function renderAlarms() {
    const list = document.getElementById('alarm-list');
    list.innerHTML = '';
    appData.alarms.forEach((alarm, index) => {
        list.innerHTML += `
            <div class="stat-card" style="display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <h3>${alarm.time}</h3>
                    <p style="font-size:0.8rem; color:var(--text-muted);">${alarm.label}</p>
                </div>
                <button onclick="deleteItem('alarms', ${index})" style="color:red; background:none; border:none;"><i class="fa-solid fa-trash"></i></button>
            </div>
        `;
    });
}

function checkAlarms() {
    const now = new Date();
    const currentTime = now.toTimeString().substring(0, 5);
    appData.alarms.forEach((alarm, index) => {
        if (alarm.active && alarm.time === currentTime) {
            document.getElementById('alarm-sound').play();
            alert(`⏰ Alarm: ${alarm.label}`);
            alarm.active = false; // Prevent multiple rings
            saveData();
        }
    });
}

// --- DEADLINES & UTILS ---
function addDeadline() {
    const val = document.getElementById('deadline-input').value;
    if (val) {
        appData.deadlines.push(val);
        document.getElementById('deadline-input').value = '';
        saveData();
        renderDeadlines();
    }
}

function renderDeadlines() {
    const list = document.getElementById('deadline-list');
    list.innerHTML = appData.deadlines.map((d, i) => `
        <li style="padding:8px 0; border-bottom:1px solid var(--border); display:flex; justify-content:space-between;">
            ${d} <i class="fa-solid fa-xmark" onclick="deleteItem('deadlines', ${i})" style="cursor:pointer; color:red;"></i>
        </li>
    `).join('');
}

function deleteItem(category, index) {
    appData[category].splice(index, 1);
    saveData();
    if(category === 'schedule') renderSchedule();
    if(category === 'alarms') renderAlarms();
    if(category === 'deadlines') renderDeadlines();
}

function updateDashboardCounts() {
    document.getElementById('task-count').innerText = `${appData.tasks.todo.length} Pending`;
}

// --- MODAL UTILS ---
function openModal(id) { document.getElementById(id).style.display = 'flex'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }

// --- CHART.JS (Visual Analytics) ---
function initChart() {
    const ctx = document.getElementById('studyChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
                label: 'Hours Studied',
                data: [2, 4, 3, 5, 2, 6, 4], // Placeholder data
                backgroundColor: '#4f46e5',
                borderRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true, grid: { display: false } },
                x: { grid: { display: false } }
            }
        }
    });
}

// --- TIMER (Simplified) ---
let timerInterval;
let timeLeft = 1500;
let isTimerRunning = false;

function toggleTimer() {
    const btn = document.getElementById('timer-btn');
    if (!isTimerRunning) {
        isTimerRunning = true;
        btn.innerText = "Pause";
        timerInterval = setInterval(() => {
            if(timeLeft > 0) {
                timeLeft--;
                const m = Math.floor(timeLeft / 60).toString().padStart(2, '0');
                const s = (timeLeft % 60).toString().padStart(2, '0');
                document.getElementById('pomodoro').innerText = `${m}:${s}`;
            } else {
                clearInterval(timerInterval);
                alert("Focus session complete!");
            }
        }, 1000);
    } else {
        clearInterval(timerInterval);
        isTimerRunning = false;
        btn.innerText = "Start";
    }
}
