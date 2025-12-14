// Simple Task Manager with Edit, Search, Priority, Drag&Drop, Reminders & Dark mode
let tasks = JSON.parse(localStorage.getItem('tasks')||'[]');
let editingId = null;
const taskList = document.getElementById('taskList');
const addBtn = document.getElementById('addBtn');
const form = document.getElementById('taskForm');
const search = document.getElementById('search');
const filters = document.querySelectorAll('.filters button');
const darkToggle = document.getElementById('darkToggle');

// Initialization
if (localStorage.getItem('dark') === 'true') document.body.classList.add('dark');
if (Notification && Notification.permission !== 'granted') Notification.requestPermission();

renderTasks();

// Add / Update
addBtn.addEventListener('click', ()=> {
  const title = document.getElementById('title').value.trim();
  const description = document.getElementById('description').value.trim();
  const dueDate = document.getElementById('dueDate').value;
  const priority = document.getElementById('priority').value;

  if (!title || !dueDate) { alert('Please enter title and due date'); return; }

  if (editingId) {
    tasks = tasks.map(t => t.id === editingId ? {...t, title, description, dueDate, priority} : t);
    editingId = null;
    addBtn.textContent = 'Add Task';
  } else {
    tasks.push({ id: Date.now(), title, description, dueDate, priority, complete:false });
  }
  saveAndRender();
  form.reset();
});

// Render
function renderTasks(filter='all') {
  taskList.innerHTML = '';
  let list = tasks;
  if (filter === 'complete') list = tasks.filter(t=>t.complete);
  if (filter === 'incomplete') list = tasks.filter(t=>!t.complete);

  list.forEach(t => {
    const li = document.createElement('li');
    li.className = 'task' + (t.complete ? ' completed' : '');
    li.draggable = true;
    li.id = 'task-' + t.id;
    li.innerHTML = `
      <div class="meta">
        <div>
          <div class="title">${escapeHtml(t.title)}</div>
          <div class="due">${formatDate(t.dueDate)}</div>
        </div>
        <div>
          <span class="priority ${t.priority}">${t.priority}</span>
        </div>
      </div>
      <p class="desc">${escapeHtml(t.description||'')}</p>
      <div class="actions">
        <button class="icon" onclick="toggleComplete(${t.id})">${t.complete ? '↺' : '✔'}</button>
        <button class="icon" onclick="startEdit(${t.id})">Edit</button>
        <button class="icon warn" onclick="deleteTask(${t.id})">Delete</button>
      </div>
    `;
    // Drag events
    li.addEventListener('dragstart', dragStart);
    li.addEventListener('dragend', dragEnd);
    li.addEventListener('dragover', dragOver);
    li.addEventListener('drop', dropOn);
    taskList.appendChild(li);
  });
}

// Helpers
function saveAndRender() { localStorage.setItem('tasks', JSON.stringify(tasks)); renderTasks(currentFilter); }
function toggleComplete(id){ tasks = tasks.map(t => t.id===id?{...t,complete:!t.complete}:t); saveAndRender(); }
function deleteTask(id){ if(confirm('Delete this task?')){ tasks = tasks.filter(t=>t.id!==id); saveAndRender(); } }
function startEdit(id){ const t = tasks.find(x=>x.id===id); document.getElementById('title').value=t.title; document.getElementById('description').value=t.description; document.getElementById('dueDate').value=t.dueDate; document.getElementById('priority').value=t.priority; editingId = id; addBtn.textContent='Update Task'; }
function formatDate(d){ try{ return new Date(d+'T00:00:00').toLocaleDateString(); }catch(e){ return d; } }
function escapeHtml(s){ return String(s||'').replace(/[&<>"']/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m])); }

// Search
search.addEventListener('input', ()=> {
  const q = search.value.trim().toLowerCase();
  if (!q) { renderTasks(currentFilter); return; }
  const filtered = tasks.filter(t => (t.title+t.description).toLowerCase().includes(q));
  renderTasksFiltered(filtered);
});
function renderTasksFiltered(list){
  taskList.innerHTML='';
  list.forEach(t => {
    const li = document.createElement('li');
    li.className = 'task' + (t.complete ? ' completed' : '');
    li.innerHTML = `<div class="meta"><div><div class="title">${escapeHtml(t.title)}</div><div class="due">${formatDate(t.dueDate)}</div></div><div><span class="priority ${t.priority}">${t.priority}</span></div></div><p class="desc">${escapeHtml(t.description||'')}</p><div class="actions"><button class="icon" onclick="toggleComplete(${t.id})">${t.complete ? '↺' : '✔'}</button><button class="icon" onclick="startEdit(${t.id})">Edit</button><button class="icon warn" onclick="deleteTask(${t.id})">Delete</button></div>`;
    taskList.appendChild(li);
  });
}

// Filters
let currentFilter = 'all';
filters.forEach(b=>b.addEventListener('click', ()=> {
  filters.forEach(x=>x.classList.remove('active'));
  b.classList.add('active');
  currentFilter = b.dataset.filter;
  renderTasks(currentFilter);
}));

// Dark mode
darkToggle.addEventListener('click', ()=> {
  document.body.classList.toggle('dark');
  localStorage.setItem('dark', document.body.classList.contains('dark'));
});

// Drag & Drop logic for reordering tasks array
let dragSrcEl = null;
function dragStart(e){ dragSrcEl = e.currentTarget; e.currentTarget.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', e.currentTarget.id); }
function dragEnd(e){ e.currentTarget.classList.remove('dragging'); }
function dragOver(e){ e.preventDefault(); e.dataTransfer.dropEffect = 'move'; const el = e.currentTarget; el.classList.add('over'); }
function dropOn(e){ e.preventDefault(); const srcId = e.dataTransfer.getData('text/plain'); const src = document.getElementById(srcId); const target = e.currentTarget; if(!src || src===target) return;
  // swap positions in DOM
  const nodes = Array.from(taskList.children);
  const srcIndex = nodes.indexOf(src), targetIndex = nodes.indexOf(target);
  if(srcIndex<0||targetIndex<0) return;
  taskList.insertBefore(srcIndex<targetIndex? target.nextSibling : target, src);
  // reorder tasks array accordingly
  const newOrder = Array.from(taskList.children).map(n => Number(n.id.replace('task-','')));
  tasks = newOrder.map(id => tasks.find(t=>t.id===id)).filter(Boolean);
  saveAndRender();
}

// Reminder checking (runs every minute)
setInterval(()=> {
  const now = new Date();
  tasks.forEach(t => {
    if (t.complete) return;
    const due = new Date(t.dueDate+'T09:00:00'); // treat time as morning
    const diff = due - now;
    if (diff > 0 && diff <= 24*60*60*1000) {
      // only notify once per load for a task by setting a transient flag
      if(!t._notified){ notifyUser(`Task due soon: ${t.title}`, `Due: ${formatDate(t.dueDate)}`); t._notified = true; }
    }
  });
}, 60*1000);

// Notification helper (uses Desktop Notification if available)
function notifyUser(title, body){
  if (window.Notification && Notification.permission === 'granted') {
    new Notification(title, { body });
  } else {
    // fallback to alert (non-intrusive for dev)
    console.log('Reminder:', title, body);
  }
}

// Initial render
renderTasks();
