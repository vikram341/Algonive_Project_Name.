let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

document.getElementById("addBtn").addEventListener("click", addTask);
renderTasks();

// ADD TASK
function addTask() {
    let title = document.getElementById("title").value;
    let description = document.getElementById("description").value;
    let dueDate = document.getElementById("dueDate").value;

    if (title === "" || dueDate === "") {
        alert("Title & Due Date required!");
        return;
    }

    tasks.push({
        id: Date.now(),
        title,
        description,
        dueDate,
        complete: false
    });

    saveTasks();
    renderTasks();
}

// SAVE TO LOCAL STORAGE
function saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
}

// RENDER TASKS
function renderTasks(filter = "all") {
    let list = document.getElementById("taskList");
    list.innerHTML = "";

    tasks
        .filter(t => filter === "all" ||
            (filter === "complete" && t.complete) ||
            (filter === "incomplete" && !t.complete))
        .forEach(task => {
            let li = document.createElement("li");

            li.innerHTML = `
                <strong>${task.title}</strong> — ${task.dueDate}
                <p>${task.description}</p>

                <button onclick="toggleComplete(${task.id})">
                    ${task.complete ? "Mark Incomplete" : "Mark Complete"}
                </button>

                <button onclick="deleteTask(${task.id})" style="color:red">
                    Delete
                </button>
            `;

            if (task.complete) li.classList.add("completed");

            list.appendChild(li);
        });
}

// MARK COMPLETE
function toggleComplete(id) {
    tasks = tasks.map(t => {
        if (t.id === id) t.complete = !t.complete;
        return t;
    });
    saveTasks();
    renderTasks();
}

// DELETE TASK
function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    saveTasks();
    renderTasks();
}

// FILTERS
function filterTasks(type) {
    renderTasks(type);
}

// REMINDER
setInterval(() => {
    tasks.forEach(t => {
        let today = new Date();
        let due = new Date(t.dueDate);

        // If due within 1 day & incomplete
        if (!t.complete && (due - today) <= 24 * 60 * 60 * 1000 && (due - today) > 0) {
            alert("Reminder: Task '" + t.title + "' is due soon!");
        }
    });
}, 60000); // checks every 1 minute
