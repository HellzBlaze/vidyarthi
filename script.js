// === INITIAL DATA ===
let app = JSON.parse(localStorage.getItem('vidyarthiLifeOS')) || {
    theme: 'light',
    // Areas (Categories): e.g. Math (Acad), Gym (Pers)
    areas: [
        { id: 'a1', name: 'General', type: 'personal', color: '#94a3b8' }
    ],
    // Routine: Keyed by Day Name. Each day has array of blocks
    routine: {
        'Monday': [], 'Tuesday': [], 'Wednesday': [], 'Thursday': [], 'Friday': [], 'Saturday': [], 'Sunday': []
    },
    // Tasks/Events
    tasks: [] // {id, title, date, time, type, areaId, done}
};

let currentDayView = 'Monday'; // For Routine view
let currentCalDate = new Date(); // For Calendar view

// === STARTUP ===
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    updateDateDisplay();
    updateDashboard();
    
    // Initial Renders
    loadRoutine(getTodayName());
    renderCalendar();
    renderAreas();
    renderAgenda('all');
    
    // Default Nav
    nav('dashboard');
});

function save() {
    localStorage.setItem('vidyarthiLifeOS', JSON.stringify(app));
    updateDashboard();
}

// === NAVIGATION ===
function nav(view) {
    document.querySelectorAll('.view').forEach(el => el.style.display = 'none');
    document.getElementById(view).style.display = 'block';
    
    // Update active states
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    if(document.getElementById('desk-'+view)) document.getElementById('desk-'+view).classList.add('active');
    
    document.querySelectorAll('.bottom-nav button').forEach(b => b.classList.remove('active'));
    if(document.getElementById('mob-'+view)) document.getElementById('mob-'+view).classList.add('active');
    
    // Refresh specifics
    if(view === 'dashboard') updateDashboard();
    if(view === 'calendar') renderCalendar();
}

// === DASHBOARD LOGIC ===
function updateDashboard() {
    const today = getTodayName();
    const now = new Date();
    const timeStr = now.toTimeString().substring(0,5); // HH:MM
    
    // 1. Find Current Active Block
    const blocks = app.routine[today] || [];
    blocks.sort((a,b) => a.start.localeCompare(b.start));
    
    let currentBlock = null;
    let nextBlock = null;
    
    for(let b of blocks) {
        if(timeStr >= b.start && timeStr < b.end) currentBlock = b;
        if(timeStr < b.start && !nextBlock) nextBlock = b;
    }
    
    if(currentBlock) {
        document.getElementById('now-activity').innerText = currentBlock.name;
        document.getElementById('now-time').innerText = `Until ${currentBlock.end}`;
        // Calc progress (simple)
        document.getElementById('now-progress').style.width = '50%'; // Dynamic calc is complex, keeping simple for demo
    } else if (nextBlock) {
        document.getElementById('now-activity').innerText = "Free Time";
        document.getElementById('now-time').innerText = `Next: ${nextBlock.name} at ${nextBlock.start}`;
        document.getElementById('now-progress').style.width = '0%';
    } else {
        document.getElementById('now-activity').innerText = "Relax";
        document.getElementById('now-time').innerText = "No more items today";
        document.getElementById('now-progress').style.width = '100%';
    }
    
    // 2. Stats
    const pendingTasks = app.tasks.filter(t => !t.done).length;
    document.getElementById('stat-tasks').innerText = pendingTasks;
    
    const todayStr = now.toISOString().split('T')[0];
    const todayEvents = app.tasks.filter(t => t.date === todayStr).length;
    document.getElementById('stat-events').innerText = todayEvents;
    
    // 3. Mini Timeline
    const timeline = document.getElementById('dashboard-timeline');
    if(blocks.length === 0) {
        timeline.innerHTML = '<p class="text-secondary" style="font-size:0.8rem;">No routine set for today.</p>';
    } else {
        timeline.innerHTML = blocks.map(b => `
            <div class="mini-block">
                <div class="mini-time">${b.start}</div>
                <div class="mini-title">${b.name}</div>
            </div>
        `).join('');
    }
    
    // 4. Priority Tasks (Top 3)
    const topTasks = app.tasks.filter(t => !t.done).slice(0, 3);
    const dashList = document.getElementById('dash-task-list');
    dashList.innerHTML = topTasks.length ? topTasks.map(renderTaskHTML).join('') : '<p style="text-align:center; color:var(--text-secondary)">No active tasks.</p>';
}

// === ROUTINE / PLANNER ===
function loadRoutine(day) {
    currentDayView = day;
    // Update pills
    document.querySelectorAll('.day-pill').forEach(p => {
        p.classList.toggle('active', p.innerText === day || p.innerText === day.substring(0,3));
    });
    
    document.getElementById('current-day-label').innerText = day;
    const list = document.getElementById('planner-container');
    const blocks = app.routine[day] || [];
    
    // Sort by time
    blocks.sort((a,b) => a.start.localeCompare(b.start));
    
    if(blocks.length === 0) {
        list.innerHTML = `<div style="text-align:center; padding:40px; color:var(--text-secondary);">
            <i class="fa-solid fa-mug-hot" style="font-size:2rem; margin-bottom:10px;"></i><br>
            No routine for ${day}. Click + to add.
        </div>`;
    } else {
        list.innerHTML = blocks.map((b, index) => {
            const area = app.areas.find(a => a.id === b.areaId);
            const color = area ? area.color : 'var(--text-secondary)';
            return `
                <div class="routine-block" style="border-left: 4px solid ${color}">
                    <div class="routine-time">${b.start}<br><span style="font-size:0.8rem; opacity:0.6">${b.end}</span></div>
                    <div class="routine-info">
                        <h4>${b.name}</h4>
                        <span style="background:${color}20; color:${color}">${area ? area.name : 'General'}</span>
                    </div>
                    <button onclick="removeBlock(${index})" class="btn-icon" style="color:var(--accent-red)"><i class="fa-solid fa-trash"></i></button>
                </div>
            `;
        }).join('');
    }
}

function addRoutineBlock() {
    const name = document.getElementById('block-name').value;
    const start = document.getElementById('block-start').value;
    const end = document.getElementById('block-end').value;
    const areaId = document.getElementById('block-area').value;
    
    if(name && start) {
        if(!app.routine[currentDayView]) app.routine[currentDayView] = [];
        app.routine[currentDayView].push({ name, start, end, areaId });
        save();
        closeModal('block-modal');
        loadRoutine(currentDayView);
        updateDashboard();
    }
}

function removeBlock(index) {
    if(confirm('Remove this block?')) {
        app.routine[currentDayView].splice(index, 1);
        save();
        loadRoutine(currentDayView);
    }
}

// === AREAS ===
let tempAreaType = 'academic';
function setAreaType(t) {
    tempAreaType = t;
    document.getElementById('type-academic').className = t === 'academic' ? 'seg-btn active' : 'seg-btn';
    document.getElementById('type-personal').className = t === 'personal' ? 'seg-btn active' : 'seg-btn';
}

function addArea() {
    const name = document.getElementById('area-name').value;
    const color = document.getElementById('area-color').value;
    if(name) {
        app.areas.push({ id: 'a'+Date.now(), name, type: tempAreaType, color });
        save();
        closeModal('area-modal');
        renderAreas();
    }
}

function renderAreas() {
    const grid = document.getElementById('areas-grid');
    grid.innerHTML = app.areas.map(a => `
        <div class="card" style="padding:16px; border-left:4px solid ${a.color}">
            <h4 style="font-size:1rem;">${a.name}</h4>
            <p style="font-size:0.8rem; color:var(--text-secondary); text-transform:capitalize;">${a.type}</p>
        </div>
    `).join('');
    
    // Update Dropdowns
    const opts = app.areas.map(a => `<option value="${a.id}">${a.name}</option>`).join('');
    document.getElementById('block-area').innerHTML = opts;
    document.getElementById('task-area').innerHTML = `<option value="">None</option>` + opts;
}

// === NATIVE CALENDAR ===
function renderCalendar() {
    const grid = document.getElementById('calendar-grid');
    const header = document.getElementById('cal-month-year');
    
    const year = currentCalDate.getFullYear();
    const month = currentCalDate.getMonth();
    
    header.innerText = new Date(year, month).toLocaleString('default', { month: 'long', year: 'numeric' });
    
    // Calendar logic
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    grid.innerHTML = '';
    
    // Empty slots
    for(let i=0; i<firstDay; i++) {
        grid.innerHTML += `<div></div>`;
    }
    
    // Days
    for(let d=1; d<=daysInMonth; d++) {
        const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        const hasEvent = app.tasks.some(t => t.date === dateStr);
        const isToday = dateStr === new Date().toISOString().split('T')[0];
        
        grid.innerHTML += `<div class="cal-day ${isToday?'today':''} ${hasEvent?'has-event':''}" onclick="selectDate('${dateStr}')">${d}</div>`;
    }
}

function changeMonth(dir) {
    currentCalDate.setMonth(currentCalDate.getMonth() + dir);
    renderCalendar();
}

function selectDate(dateStr) {
    document.getElementById('cal-selected-info').style.display = 'block';
    document.getElementById('cal-selected-date').innerText = new Date(dateStr).toDateString();
    
    // Show events for this date
    const events = app.tasks.filter(t => t.date === dateStr);
    const list = document.getElementById('cal-events-list');
    list.innerHTML = events.length ? events.map(renderTaskHTML).join('') : '<p class="text-secondary">No events.</p>';
    
    // Pre-fill date in add modal
    document.getElementById('task-date').value = dateStr;
}

// === AGENDA / TASKS ===
function addTask() {
    const title = document.getElementById('task-title').value;
    const date = document.getElementById('task-date').value;
    const areaId = document.getElementById('task-area').value;
    const type = document.getElementById('task-type').value;
    
    if(title) {
        app.tasks.push({ id: 't'+Date.now(), title, date, areaId, type, done: false });
        app.tasks.sort((a,b) => new Date(a.date) - new Date(b.date));
        save();
        closeModal('agenda-modal');
        renderAgenda('all');
        if(document.getElementById('calendar').style.display === 'block') {
            renderCalendar();
            if(date) selectDate(date);
        }
        updateDashboard();
    }
}

function renderAgenda(filter) {
    const container = document.getElementById('agenda-list');
    
    // Toggle chips
    document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    // (Assuming simple logic for demo: picking based on text matches filter logic roughly)
    
    let items = app.tasks;
    if(filter !== 'all') {
        // Filter by area type
        items = items.filter(t => {
            const area = app.areas.find(a => a.id === t.areaId);
            return area && area.type === filter;
        });
    }
    
    container.innerHTML = items.length ? items.map(renderTaskHTML).join('') : '<p style="text-align:center; padding:20px;">No items found.</p>';
}

function renderTaskHTML(task) {
    const area = app.areas.find(a => a.id === task.areaId);
    const color = area ? area.color : '#94a3b8';
    
    return `
        <div class="task-item">
            <div class="check-circle ${task.done?'checked':''}" onclick="toggleTask('${task.id}')">
                ${task.done ? '<i class="fa-solid fa-check" style="font-size:0.7rem"></i>' : ''}
            </div>
            <div class="task-content">
                <div class="task-title" style="${task.done?'text-decoration:line-through; opacity:0.6':''}">${task.title}</div>
                <div class="task-meta">
                    <span style="color:${color}; font-weight:700;">${area ? area.name : 'General'}</span> • 
                    ${task.date || 'No Date'}
                </div>
            </div>
        </div>
    `;
}

function toggleTask(id) {
    const t = app.tasks.find(x => x.id === id);
    if(t) {
        t.done = !t.done;
        save();
        // Re-render current view
        if(document.getElementById('dashboard').style.display === 'block') updateDashboard();
        else renderAgenda('all'); // simplified refresh
    }
}

// === UTILS ===
function getTodayName() {
    return ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date().getDay()];
}
function updateDateDisplay() {
    const d = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    document.getElementById('current-date-header').innerText = d;
}
function initTheme() {
    if(app.theme === 'dark') document.body.classList.add('dark-mode');
}
function toggleTheme() {
    app.theme = app.theme === 'light' ? 'dark' : 'light';
    document.body.classList.toggle('dark-mode');
    save();
}
function openModal(id) { document.getElementById(id).style.display = 'flex'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }
