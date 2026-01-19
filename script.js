// === INITIAL STATE ===
let appData = JSON.parse(localStorage.getItem('vidyarthiDataV2')) || {
    primaryColor: '#4f46e5',
    theme: 'light',
    subjects: [], // {id, name, teacher, color, attendance: {present:0, absent:0}, grades: []}
    blocks: [],   // {id, name, start, end}
    schedule: {}, // { "Monday": [ {blockId, subjectId} ] }
    agenda: []    // {id, type, title, subjectId, date, completed}
};

// === STARTUP ===
document.addEventListener('DOMContentLoaded', () => {
    applyTheme();
    renderSubjects();
    renderAgenda();
    renderTimetable('Monday'); // Default to Monday
    updateDate();
    updateNextClass();
});

function saveData() {
    localStorage.setItem('vidyarthiDataV2', JSON.stringify(appData));
    updateNextClass();
}

// === THEME & COLOR ===
function setThemeColor(color) {
    appData.primaryColor = color;
    applyTheme();
    saveData();
}

function toggleMode() {
    appData.theme = appData.theme === 'light' ? 'dark' : 'light';
    applyTheme();
    saveData();
}

function applyTheme() {
    document.documentElement.style.setProperty('--primary', appData.primaryColor);
    if(appData.theme === 'dark') document.body.classList.add('dark-mode');
    else document.body.classList.remove('dark-mode');
}

// === NAVIGATION ===
function showSection(id) {
    document.querySelectorAll('.view-section').forEach(sec => sec.style.display = 'none');
    document.getElementById(id).style.display = 'block';
    
    // Update active menu
    document.querySelectorAll('.menu-item').forEach(item => item.classList.remove('active'));
    document.getElementById('nav-' + id).classList.add('active');
}

// === SUBJECTS MANAGEMENT ===
function addSubject() {
    const name = document.getElementById('sub-name').value;
    const teacher = document.getElementById('sub-teacher').value;
    const color = document.getElementById('sub-color').value;
    
    if(name) {
        const id = Date.now().toString();
        appData.subjects.push({
            id, name, teacher, color, 
            attendance: { absent: 0 }, 
            grades: [] 
        });
        saveData();
        renderSubjects();
        closeModal('subject-modal');
    }
}

function renderSubjects() {
    const grid = document.getElementById('subjects-grid');
    grid.innerHTML = appData.subjects.map(sub => `
        <div class="subject-card" style="border-top-color: ${sub.color}">
            <h3>${sub.name}</h3>
            <p class="sub-text">${sub.teacher}</p>
            
            <div class="stat-row">
                <span>Absences: <strong>${sub.attendance.absent}</strong></span>
                <button onclick="addAbsence('${sub.id}')" class="btn btn-secondary" style="padding:2px 8px; font-size:0.8rem;">+1</button>
            </div>
            
            <div class="stat-row" style="margin-top:10px;">
                <input type="text" placeholder="Add Grade %" id="grade-input-${sub.id}" style="width:60%; margin:0; padding:5px;">
                <button onclick="addGrade('${sub.id}')" class="btn btn-primary" style="padding:5px 8px;">Add</button>
            </div>
            <div style="margin-top:10px; font-size:0.85rem; color:var(--text-muted);">
                Avg Grade: <strong>${calculateAverage(sub.grades)}%</strong>
            </div>
        </div>
    `).join('');
    
    // Update dropdowns in modals
    updateSubjectDropdowns();
}

function addAbsence(id) {
    const sub = appData.subjects.find(s => s.id === id);
    sub.attendance.absent++;
    saveData();
    renderSubjects();
}

function addGrade(id) {
    const val = document.getElementById(`grade-input-${id}`).value;
    if(val) {
        const sub = appData.subjects.find(s => s.id === id);
        sub.grades.push(parseInt(val));
        saveData();
        renderSubjects();
    }
}

function calculateAverage(grades) {
    if(!grades || grades.length === 0) return 0;
    const sum = grades.reduce((a, b) => a + b, 0);
    return Math.round(sum / grades.length);
}

// === TIMETABLE (TIMETUNE STYLE) ===
// 1. Define Blocks
function addTimeBlock() {
    const name = document.getElementById('block-name').value;
    const start = document.getElementById('block-start').value;
    const end = document.getElementById('block-end').value;
    
    if(name && start) {
        appData.blocks.push({ id: Date.now().toString(), name, start, end });
        // Sort blocks by time
        appData.blocks.sort((a,b) => a.start.localeCompare(b.start));
        saveData();
        closeModal('block-modal');
        updateBlockDropdown();
    }
}

// 2. Assign Subject to Block
function assignSubjectToSchedule() {
    const day = document.getElementById('assign-day').value;
    const blockId = document.getElementById('assign-block').value;
    const subjectId = document.getElementById('assign-subject').value;
    
    if(!appData.schedule[day]) appData.schedule[day] = [];
    
    // Remove existing assignment for this block if any
    appData.schedule[day] = appData.schedule[day].filter(item => item.blockId !== blockId);
    
    appData.schedule[day].push({ blockId, subjectId });
    saveData();
    closeModal('assign-modal');
    renderTimetable(day);
}

function renderTimetable(day) {
    // Update active button
    document.querySelectorAll('.day-btn').forEach(btn => {
        btn.classList.toggle('active', btn.innerText.includes(day.substring(0,3)));
    });

    const container = document.getElementById('timetable-display');
    
    if(!appData.blocks.length) {
        container.innerHTML = '<p style="text-align:center;">No time blocks defined. Click "Define Blocks".</p>';
        return;
    }

    const daySchedule = appData.schedule[day] || [];

    container.innerHTML = appData.blocks.map(block => {
        // Find if a subject is assigned to this block
        const assignment = daySchedule.find(a => a.blockId === block.id);
        let subjectName = "Free / Study";
        let color = "#ccc";
        
        if(assignment) {
            const sub = appData.subjects.find(s => s.id === assignment.subjectId);
            if(sub) {
                subjectName = sub.name;
                color = sub.color;
            }
        }

        return `
            <div class="tune-block">
                <div class="block-time">
                    <span>${block.start}</span>
                    <span style="font-size:0.8rem; color:var(--text-muted);">${block.end}</span>
                </div>
                <div class="block-content">
                    <div>
                        <strong>${block.name}</strong>
                        <div style="margin-top:5px;">
                            <span class="subject-pill" style="background:${color}">${subjectName}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// === AGENDA (HOMEWORK/EXAMS) ===
function addAgendaItem() {
    const type = document.getElementById('agenda-type').value;
    const title = document.getElementById('agenda-title').value;
    const subjectId = document.getElementById('agenda-subject').value;
    const date = document.getElementById('agenda-date').value;

    if(title && date) {
        appData.agenda.push({
            id: Date.now().toString(),
            type, title, subjectId, date, completed: false
        });
        // Sort by date
        appData.agenda.sort((a,b) => new Date(a.date) - new Date(b.date));
        saveData();
        renderAgenda();
        closeModal('agenda-modal');
    }
}

function renderAgenda() {
    const list = document.getElementById('agenda-list');
    const miniList = document.getElementById('dashboard-agenda-list');
    
    const html = appData.agenda.map(item => {
        const sub = appData.subjects.find(s => s.id === item.subjectId);
        const color = sub ? sub.color : '#ccc';
        const subName = sub ? sub.name : 'General';
        
        let tagClass = item.type === 'Homework' ? 'tag-homework' : item.type === 'Exam' ? 'tag-exam' : '';

        return `
            <div class="agenda-item" style="border-left-color:${color}">
                <div>
                    <span class="agenda-tag ${tagClass}">${item.type}</span>
                    <span style="font-size:0.85rem; color:var(--text-muted);">${item.date}</span>
                    <h4 style="margin-top:5px;">${item.title}</h4>
                    <span style="font-size:0.85rem; color:${color}; font-weight:600;">${subName}</span>
                </div>
                <button onclick="deleteAgenda('${item.id}')" style="color:red; background:none; border:none;"><i class="fa-solid fa-trash"></i></button>
            </div>
        `;
    }).join('');

    list.innerHTML = html || '<p class="sub-text">No upcoming tasks.</p>';
    
    // Dashboard summary (top 3)
    miniList.innerHTML = appData.agenda.slice(0, 3).map(item => `
        <div style="padding:10px; border-bottom:1px solid var(--border);">
            <div style="font-weight:600;">${item.title}</div>
            <div style="font-size:0.8rem; color:var(--text-muted);">${item.type} • ${item.date}</div>
        </div>
    `).join('') || '<p style="padding:10px;">Nothing due soon.</p>';
}

function deleteAgenda(id) {
    appData.agenda = appData.agenda.filter(i => i.id !== id);
    saveData();
    renderAgenda();
}

function filterAgenda(type) {
    const items = document.querySelectorAll('.agenda-item');
    // Simple visual filter would require re-rendering logic with filter, 
    // for simplicity here we just re-render all then hide/show.
    // Ideally, update renderAgenda to accept a filter argument.
    if(type === 'all') {
        renderAgenda();
    } else {
        // Filter data temporarily for display
        const filtered = appData.agenda.filter(i => i.type.toLowerCase() === type);
        // ... (simplified for this snippet, just re-render everything for now)
        // In full app, implement renderAgenda(filterType)
        alert("Filter: " + type); 
    }
}

// === UTILITIES ===
function updateSubjectDropdowns() {
    const opts = appData.subjects.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
    if(document.getElementById('assign-subject')) document.getElementById('assign-subject').innerHTML = opts;
    if(document.getElementById('agenda-subject')) document.getElementById('agenda-subject').innerHTML = opts;
}

function updateBlockDropdown() {
    const opts = appData.blocks.map(b => `<option value="${b.id}">${b.name} (${b.start})</option>`).join('');
    if(document.getElementById('assign-block')) document.getElementById('assign-block').innerHTML = opts;
}

function updateNextClass() {
    // Logic to find current time, check schedule, display next class
    // Simplified placeholder logic
    const d = new Date();
    const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const today = days[d.getDay()];
    // Real implementation requires comparing time strings
}

function updateDate() {
    document.getElementById('current-date').innerText = new Date().toDateString();
}

// Modals
function openModal(id) { document.getElementById(id).style.display = 'flex'; updateSubjectDropdowns(); updateBlockDropdown(); }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }
