// === STATE ===
let app = JSON.parse(localStorage.getItem('vidyarthiUltimate')) || {
    theme: 'light',
    categories: [
        { id: 'c1', name: 'Homework', color: '#4f46e5' },
        { id: 'c2', name: 'Exam', color: '#dc2626' },
        { id: 'c3', name: 'Reminder', color: '#f59e0b' }
    ],
    subjects: [], // {id, name, teacher, color}
    blocks: [],   // {id, name, start, end}
    schedule: {}, // { "Monday": [{blockId, subjectId}] }
    agenda: []    // {id, title, catId, subId, date, done}
};

// === INIT ===
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    updateDate();
    updateNextClass();
    renderAgenda('all');
    loadTimetable(getCurrentDay());
    renderSubjects();
    
    // Default Nav
    nav('dashboard');
});

function save() {
    localStorage.setItem('vidyarthiUltimate', JSON.stringify(app));
    updateNextClass();
}

// === NAVIGATION ===
function nav(viewId) {
    // Hide all views
    document.querySelectorAll('.view').forEach(el => el.style.display = 'none');
    document.getElementById(viewId).style.display = 'block';
    
    // Update Title
    const titles = { 'dashboard': 'Dashboard', 'agenda': 'My Agenda', 'timetable': 'Timetable', 'subjects': 'Subjects', 'calendar': 'Calendar' };
    document.getElementById('page-title').innerText = titles[viewId];
    
    // Update Desktop Nav
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    if(document.getElementById('desk-'+viewId)) document.getElementById('desk-'+viewId).classList.add('active');

    // Update Mobile Nav
    document.querySelectorAll('.bottom-nav button').forEach(b => b.classList.remove('active'));
    if(document.getElementById('mob-'+viewId)) document.getElementById('mob-'+viewId).classList.add('active');
}

// === THEME ===
function initTheme() {
    if(app.theme === 'dark') document.body.classList.add('dark-mode');
}

function toggleTheme() {
    app.theme = app.theme === 'light' ? 'dark' : 'light';
    document.body.classList.toggle('dark-mode');
    save();
}

// === BLOCKS & TIMETABLE ===
function addBlock() {
    const name = document.getElementById('block-name').value;
    const start = document.getElementById('block-start').value;
    const end = document.getElementById('block-end').value;
    
    if(name && start) {
        app.blocks.push({ id: Date.now().toString(), name, start, end });
        app.blocks.sort((a,b) => a.start.localeCompare(b.start));
        save();
        closeModal('block-modal');
        renderBlockList();
    }
}

function assignSubject() {
    const day = document.getElementById('assign-day').value;
    const blockId = document.getElementById('assign-block').value;
    const subId = document.getElementById('assign-subject').value;
    
    if(!app.schedule[day]) app.schedule[day] = [];
    
    // Remove old assignment for this block
    app.schedule[day] = app.schedule[day].filter(x => x.blockId !== blockId);
    app.schedule[day].push({ blockId, subjectId: subId });
    save();
    closeModal('assign-modal');
    if(document.getElementById('timetable').style.display === 'block') loadTimetable(day);
}

function loadTimetable(day) {
    // UI Update
    document.querySelectorAll('.day-chip').forEach(b => {
        b.classList.toggle('active', b.innerText === day.charAt(0) || b.innerText === day.substring(0,2));
    });

    const container = document.getElementById('timetable-list');
    
    if(!app.blocks.length) {
        container.innerHTML = '<p class="text-secondary" style="padding:20px">No time blocks. Tap "Edit Blocks".</p>';
        return;
    }

    const todaySched = app.schedule[day] || [];
    
    container.innerHTML = app.blocks.map(block => {
        const assignment = todaySched.find(x => x.blockId === block.id);
        const sub = assignment ? app.subjects.find(s => s.id === assignment.subjectId) : null;
        
        const subName = sub ? sub.name : "Free Period";
        const subColor = sub ? sub.color : "var(--border)";
        const borderStyle = sub ? `4px solid ${subColor}` : `1px solid var(--border)`;
        
        return `
            <div class="timeline-block">
                <div class="timeline-dot" style="border-color: ${sub ? subColor : 'var(--text-secondary)'}"></div>
                <div class="timeline-card" style="border-left: ${borderStyle}">
                    <div class="timeline-time">${block.start} - ${block.end}</div>
                    <div class="timeline-subject">${subName}</div>
                    <div style="font-size:0.9rem; color:var(--text-secondary)">${block.name}</div>
                </div>
            </div>
        `;
    }).join('');
}

// === AGENDA & CATEGORIES ===
function addCategory() {
    const name = document.getElementById('new-cat-name').value;
    const color = document.getElementById('new-cat-color').value;
    if(name) {
        app.categories.push({ id: 'c'+Date.now(), name, color });
        save();
        document.getElementById('new-cat-name').value = '';
        renderCategories();
    }
}

function renderCategories() {
    const filterContainer = document.getElementById('category-filters');
    // Keep 'All' button
    let html = `<button class="chip active" onclick="renderAgenda('all')">All</button>`;
    
    html += app.categories.map(cat => `
        <button class="chip" onclick="renderAgenda('${cat.id}')" style="border-color:${cat.color}">${cat.name}</button>
    `).join('');
    
    filterContainer.innerHTML = html;
    
    // Also update modal dropdown
    const select = document.getElementById('agenda-cat');
    select.innerHTML = app.categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    
    // Cat list in modal
    document.getElementById('cat-list-display').innerHTML = app.categories.map(c => 
        `<div style="display:flex; gap:10px; margin-bottom:5px;"><div style="width:20px; height:20px; background:${c.color}; border-radius:4px;"></div> ${c.name}</div>`
    ).join('');
}

function addAgenda() {
    const title = document.getElementById('agenda-title').value;
    const catId = document.getElementById('agenda-cat').value;
    const subId = document.getElementById('agenda-sub').value;
    const date = document.getElementById('agenda-date').value;
    
    if(title) {
        app.agenda.push({ id: Date.now().toString(), title, catId, subId, date, done: false });
        app.agenda.sort((a,b) => new Date(a.date) - new Date(b.date));
        save();
        closeModal('agenda-modal');
        renderAgenda('all');
    }
}

function renderAgenda(filterId) {
    const list = document.getElementById('agenda-list');
    const dashList = document.getElementById('dash-agenda-list');
    
    // Toggle active state of chips
    document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    // (Simplification: assuming user clicked the right one, UI update logic would be more complex in React)

    let items = app.agenda;
    if(filterId && filterId !== 'all') {
        items = items.filter(i => i.catId === filterId);
    }
    
    const generateHTML = (data) => data.map(item => {
        const cat = app.categories.find(c => c.id === item.catId) || app.categories[0];
        const sub = app.subjects.find(s => s.id === item.subId);
        
        return `
            <div class="agenda-item">
                <div>
                    <span class="agenda-tag" style="background:${cat.color}20; color:${cat.color}">${cat.name}</span>
                    <h4 style="font-size:1rem; margin-top:4px; ${item.done ? 'text-decoration:line-through; opacity:0.6':''}">${item.title}</h4>
                    <div style="font-size:0.85rem; color:var(--text-secondary); margin-top:2px;">
                        ${item.date} • ${sub ? sub.name : 'General'}
                    </div>
                </div>
                <button onclick="toggleDone('${item.id}')" class="btn-icon">
                    <i class="fa-solid ${item.done ? 'fa-check-circle' : 'fa-circle'}" style="color:${item.done ? 'green' : 'var(--border)'}"></i>
                </button>
            </div>
        `;
    }).join('');

    list.innerHTML = items.length ? generateHTML(items) : '<p style="text-align:center; padding:20px; color:var(--text-secondary)">No tasks found.</p>';
    
    // Dashboard: Show top 3 incomplete
    const pending = app.agenda.filter(i => !i.done).slice(0, 3);
    dashList.innerHTML = pending.length ? generateHTML(pending) : '<p style="padding:10px; color:var(--text-secondary)">All caught up!</p>';
}

function toggleDone(id) {
    const item = app.agenda.find(i => i.id === id);
    if(item) item.done = !item.done;
    save();
    renderAgenda('all');
}

// === SUBJECTS ===
function renderSubjects() {
    const container = document.getElementById('subjects-list');
    const dropdown = document.getElementById('assign-subject');
    const agendaDropdown = document.getElementById('agenda-sub');
    
    // Add logic to actually add subject... (simplified from previous iteration)
    // Assume user entered data in modal
    const nameInput = document.getElementById('sub-name');
    if(nameInput.value) {
        app.subjects.push({
            id: 's'+Date.now(),
            name: nameInput.value,
            teacher: document.getElementById('sub-teacher').value,
            color: document.getElementById('sub-color').value
        });
        nameInput.value = ''; // clear
        save();
        closeModal('subject-modal');
    }

    container.innerHTML = app.subjects.map(s => `
        <div class="card" style="border-left: 5px solid ${s.color}; padding:16px;">
            <h3 style="font-size:1.1rem;">${s.name}</h3>
            <p style="color:var(--text-secondary); font-size:0.9rem;">${s.teacher}</p>
        </div>
    `).join('');

    const options = app.subjects.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
    dropdown.innerHTML = options;
    agendaDropdown.innerHTML = `<option value="">General</option>` + options;
}

// === UTILS ===
function updateNextClass() {
    // Very basic check based on current day/time vs blocks
    // In production, need strict time parsing
    const d = new Date();
    const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const today = days[d.getDay()];
    
    // Find blocks for today
    const sched = app.schedule[today];
    if(sched && sched.length) {
        // Placeholder: Show first class of day
        // Real logic: compare currentTime with block.start
        const first = sched[0];
        const sub = app.subjects.find(s => s.id === first.subjectId);
        const blk = app.blocks.find(b => b.id === first.blockId);
        
        if(sub && blk) {
            document.getElementById('next-class-title').innerText = sub.name;
            document.getElementById('next-class-time').innerText = `${blk.start} - ${blk.end}`;
            return;
        }
    }
    document.getElementById('next-class-title').innerText = "Free Time";
    document.getElementById('next-class-time').innerText = "No upcoming classes today";
}

function renderBlockList() {
    const opts = app.blocks.map(b => `<option value="${b.id}">${b.name} (${b.start})</option>`).join('');
    document.getElementById('assign-block').innerHTML = opts;
    
    document.getElementById('existing-blocks-list').innerHTML = app.blocks.map(b => 
        `<div style="padding:8px; border-bottom:1px solid var(--border)">${b.name} (${b.start} - ${b.end})</div>`
    ).join('');
}

function updateDate() {
    document.getElementById('date-badge').innerText = new Date().toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });
}

function getCurrentDay() {
    const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    return days[new Date().getDay()];
}

// Modals
function openModal(id) { 
    document.getElementById(id).style.display = 'flex'; 
    renderCategories(); // refresh dropdowns
    renderBlockList();
}
function closeModal(id) { document.getElementById(id).style.display = 'none'; }
