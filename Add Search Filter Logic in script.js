document.getElementById("searchInput").addEventListener("keyup", function () {
  let filter = this.value.toLowerCase();
  let tasks = document.querySelectorAll("#taskList li");

  tasks.forEach(task => {
    let text = task.querySelector("span").textContent.toLowerCase();
    task.style.display = text.includes(filter) ? "" : "none";
  });
});
