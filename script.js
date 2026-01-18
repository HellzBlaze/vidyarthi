// === STATE MANAGEMENT ===
let appData = JSON.parse(localStorage.getItem('vidyarthiProData')) || {
    schedule: [],
    alarms: [],
    tasks: { todo: [], done: [] },
    theme: 'light'
};

function saveData() {
    localStorage.setItem('vidyarthiProData', JSON.stringify(appData));
    updateUI();
}

// === INITIALIZATION ===
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    updateDate();
    renderSchedule();
    renderAlarms();
    renderTasks();
    
    // Check alarms every second
    setInterval(checkAlarms, 1000);
});

// === HELPER FUNCTIONS ===
function updateUI() {
    document.getElementById('todo-count').innerText = appData.tasks.todo.length;
    document.getElementById('done-count').innerText = appData.tasks.done.length;
    renderTasks(); // Re-render tasks to ensure correct state
    renderSchedule(); // Re-render schedule for dashboard widget
}

function handleKeyPress(event, callback) {
    if (event.key === 'Enter') callback();
}

// === THEME & DATE ===
function initTheme() {
    if (appData.theme === 'dark') document.body.classList.add('dark-mode');
    updateThemeIcon();
}

function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    appData.theme = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
    updateThemeIcon();
    saveData();
}

function updateThemeIcon() {
    const icon = document.querySelector('#theme-toggle i');
    icon.className = appData.theme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
}

function updateDate() {
    const now = new Date();
    document.getElementById('current-date').innerText = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    const hour = now.getHours();
    let greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";
    document.getElementById('greeting').innerText = greeting;
}

// === NAVIGATION ===
function showSection(sectionId) {
    document.querySelectorAll('.view-section').forEach(el => el.style.display = 'none');
    document.getElementById(sectionId).style.display = 'block';
    
    document.querySelectorAll('.menu-item').forEach(el => el.classList.remove('active'));
    document.getElementById('nav-' + sectionId).classList.add('active');
}

// === SCHEDULER ===
function addClass() {
    const time = document.getElementById('new-class-time').value;
    const name = document.getElementById('new-class-name').value;
    const link = document.getElementById('new-class-link').value;

    if (time && name) {
        appData.schedule.push({ time, name, link });
        appData.schedule.sort((a, b) => a.time.localeCompare(b.time));
        saveData();
        closeModal('class-modal');
        // Clear inputs
        document.getElementById('new-class-time').value = '';
        document.getElementById('new-class-name').value = '';
        document.getElementById('new-class-link').value = '';
    }
}

function renderSchedule() {
    const fullList = document.getElementById('full-schedule-list');
    const dashList = document.getElementById('dashboard-schedule-list');
    
    let htmlContent = '';
    
    if (appData.schedule.length === 0) {
        htmlContent = '<p class="sub-text" style="text-align:center; padding:20px;">No classes added yet.</p>';
        dashList.innerHTML = '<p class="sub-text">No classes scheduled today.</p>';
    } else {
        appData.schedule.forEach((item, index) => {
            htmlContent += `
                <div class="schedule-row">
                    <span class="schedule-time">${item.time}</span>
                    <span class="schedule-details">${item.name}</span>
                    <div class="schedule-actions">
                        ${item.link ? `<a href="${item.link}" target="_blank" class="btn-join">Join Meeting</a>` : ''}
                        <button onclick="deleteItem('schedule', ${index})" class="btn-icon" style="color:var(--color-danger); border:none; background:none;"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </div>
            `;
        });
        // Dashboard widget shows max 3 items
        dashList.innerHTML = appData.schedule.slice(0, 3).map(item => `
             <div class="widget-list-item">
                <span style="font-weight:600; font-size:0.9rem;">${item.time}</span>
                <span style="font-size:0.9rem;">${item.name}</span>
            </div>
        `).join('');
    }
    fullList.innerHTML = htmlContent;
}

// === TASKS (KANBAN & QUICK DASHBOARD TASKS) ===
function addQuickTask() {
     const input = document.getElementById('quick-task-input');
     if(input.value) {
         appData.tasks.todo.unshift(input.value); // Add to top of todo list
         input.value = '';
         saveData();
     }
}

function addTask(type) {
    const input = document.getElementById('kanban-input');
    if (input.value) {
        appData.tasks[type].push(input.value);
        input.value = '';
        saveData();
    }
}

function renderTasks() {
    const todoList = document.getElementById('todo-list');
    const doneList = document.getElementById('done-list');
    const dashDeadlineList = document.getElementById('deadline-list');

    // Kanban rendering
    todoList.innerHTML = appData.tasks.todo.map((t, i) => `
        <div class="task-card" onclick="moveTask(${i}, 'todo', 'done')">${t}</div>
    `).join('');
    
    doneList.innerHTML = appData.tasks.done.map((t, i) => `
        <div class="task-card task-done" onclick="moveTask(${i}, 'done', 'todo')">${t}</div>
    `).join('');

    // Dashboard "Quick Tasks" rendering (Top 5 todos)
    if(appData.tasks.todo.length === 0) {
        dashDeadlineList.innerHTML = '<li class="sub-text">Nothing due soon!</li>';
    } else {
        dashDeadlineList.innerHTML = appData.tasks.todo.slice(0, 5).map((t, i) => `
            <li>
                <span>${t}</span>
                <button onclick="moveTask(${i}, 'todo', 'done')" class="btn-text" style="color:var(--color-success);"><i class="fa-solid fa-check"></i></button>
            </li>
        `).join('');
    }
}

function moveTask(index, from, to) {
    const item = appData.tasks[from].splice(index, 1)[0];
    appData.tasks[to].unshift(item); // Add to top of new list
    saveData();
}

// === ALARMS ===
function addAlarm() {
    const time = document.getElementById('alarm-time').value;
    const label = document.getElementById('alarm-label').value || 'Alarm';
    if (time) {
        appData.alarms.push({ time, label, active: true });
        appData.alarms.sort((a, b) => a.time.localeCompare(b.time));
        document.getElementById('alarm-time').value = '';
        document.getElementById('alarm-label').value = '';
        saveData();
        renderAlarms();
    }
}

function renderAlarms() {
    const list = document.getElementById('alarm-list-grid');
    list.innerHTML = appData.alarms.map((alarm, index) => `
        <div class="alarm-card">
            <div>
                <h3 style="font-size:1.5rem; margin-bottom:4px;">${alarm.time}</h3>
                <p class="sub-text">${alarm.label}</p>
            </div>
            <button onclick="deleteItem('alarms', ${index})" class="btn-icon" style="color:var(--color-danger);"><i class="fa-solid fa-trash"></i></button>
        </div>
    `).join('');
}

function checkAlarms() {
    const now = new Date();
    const currentTime = now.toTimeString().substring(0, 5);
    appData.alarms.forEach((alarm, index) => {
        if (alarm.active && alarm.time === currentTime) {
            document.getElementById('alarm-sound').play();
            alert(`⏰ Alarm: ${alarm.label}`);
            alarm.active = false; 
            saveData();
        }
    });
}

// === UTILS & TIMER ===
function deleteItem(category, index) {
    appData[category].splice(index, 1);
    saveData();
    if(category === 'schedule') renderSchedule();
    if(category === 'alarms') renderAlarms();
}

function openModal(id) { document.getElementById(id).style.display = 'flex'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }

// Timer Logic
let timerInterval;
let timeLeft = 1500; // 25 mins
let isTimerRunning = false;

function toggleTimer() {
    const btn = document.getElementById('timer-btn');
    if (!isTimerRunning) {
        isTimerRunning = true;
        btn.innerText = "Pause Focus";
        btn.classList.replace('btn-primary', 'btn-secondary');
        timerInterval = setInterval(() => {
            if(timeLeft > 0) {
                timeLeft--;
                updateTimerDisplay();
            } else {
                clearInterval(timerInterval);
                document.getElementById('alarm-sound').play();
                alert("Focus session complete!");
                resetTimer();
            }
        }, 1000);
    } else {
        clearInterval(timerInterval);
        isTimerRunning = false;
        btn.innerText = "Resume Focus";
        btn.classList.replace('btn-secondary', 'btn-primary');
    }
}

function updateTimerDisplay() {
    const m = Math.floor(timeLeft / 60).toString().padStart(2, '0');
    const s = (timeLeft % 60).toString().padStart(2, '0');
    document.getElementById('pomodoro').innerText = `${m}:${s}`;
}

function resetTimer() {
     timeLeft = 1500;
     isTimerRunning = false;
     updateTimerDisplay();
     const btn = document.getElementById('timer-btn');
     btn.innerText = "Start Focus";
     btn.classList.replace('btn-secondary', 'btn-primary');
}
