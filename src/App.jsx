import { useEffect, useMemo, useState } from "react";
import "./App.css";

const STORAGE_KEY = "react-task-dashboard-tasks";

function loadTasks() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function TaskForm({ onAddTask }) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [dueDate, setDueDate] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    const cleanTitle = title.trim();

    if (!cleanTitle) {
      return;
    }

    onAddTask({
      id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
      title: cleanTitle,
      priority,
      dueDate,
      completed: false,
      createdAt: Date.now(),
    });

    setTitle("");
    setPriority("Medium");
    setDueDate("");
  }

  return (
    <form className="task-form" onSubmit={handleSubmit}>
      <label>
        Task title
        <input
          type="text"
          placeholder="What needs to get done?"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
      </label>

      <div className="form-row">
        <label>
          Priority
          <select value={priority} onChange={(event) => setPriority(event.target.value)}>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </label>

        <label>
          Due date
          <input
            type="date"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
          />
        </label>
      </div>

      <button className="primary-button" type="submit">+ Add Task</button>
    </form>
  );
}

function SummaryCard({ label, count, kind }) {
  return (
    <article className={`summary-card ${kind}`}>
      <p>{label}</p>
      <strong>{count}</strong>
    </article>
  );
}

function TaskCard({ task, onToggle, onDelete }) {
  const overdue = task.dueDate && task.dueDate < new Date().toLocaleDateString("en-CA") && !task.completed;

  return (
    <article className={`task-card ${task.completed ? "is-completed" : ""} ${overdue ? "is-overdue" : ""}`}>
      <div className="task-main">
        <button
          type="button"
          className={`status-toggle ${task.completed ? "checked" : ""}`}
          onClick={() => onToggle(task.id)}
          aria-label={task.completed ? "Mark task pending" : "Mark task completed"}
          title={task.completed ? "Mark pending" : "Mark completed"}
        >
          {task.completed ? "✓" : ""}
        </button>

        <div className="task-copy">
          <h3>{task.title}</h3>
          <div className="task-meta">
            <span className={`priority-badge priority-${task.priority.toLowerCase()}`}>
              {task.priority} priority
            </span>
            <span className="due-date">
              {task.dueDate ? `Due ${task.dueDate}` : "No due date"}
            </span>
            {overdue && <span className="overdue-label">Overdue</span>}
          </div>
        </div>
      </div>

      <div className="task-actions">
        <span className={`status-label ${task.completed ? "done" : "pending"}`}>
          {task.completed ? "Completed" : "Pending"}
        </span>
        <button className="delete-button" type="button" onClick={() => onDelete(task.id)}>
          Delete
        </button>
      </div>
    </article>
  );
}

function App() {
  const [tasks, setTasks] = useState(loadTasks);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [sortByDate, setSortByDate] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  function addTask(newTask) {
    setTasks((currentTasks) => [newTask, ...currentTasks]);
  }

  //  API Starting here
  async function handleAddRandomTask() {
    try {
      const response = await fetch('https://dummyjson.com/todos/random');
      const data = await response.json();

      // Format the API data to match your app's task structure
      const randomTask = {
        id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
        title: data.todo, // The raw text from the API
        priority: "Medium",
        dueDate: "",
        completed: false,
        createdAt: Date.now(),
      };


      addTask(randomTask);
      
    } catch (error) {
      console.error("Failed to fetch task:", error);
      alert("Couldn't fetch a random task right now.");
    }
  }
  //  END OF FUNCTION 


  function toggleTask(taskId) {
    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    );
  }

  function deleteTask(taskId) {
    const confirmed = window.confirm("Are you sure you want to delete this task?");
    if (!confirmed) return;

    setTasks((currentTasks) => currentTasks.filter((task) => task.id !== taskId));
  }

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((task) => task.completed).length;
  const pendingTasks = totalTasks - completedTasks;

  const visibleTasks = useMemo(() => {
    let result = tasks.filter((task) =>
      task.title.toLowerCase().includes(search.trim().toLowerCase())
    );

    if (statusFilter === "Pending") {
      result = result.filter((task) => !task.completed);
    } else if (statusFilter === "Completed") {
      result = result.filter((task) => task.completed);
    }

    if (priorityFilter !== "All") {
      result = result.filter((task) => task.priority === priorityFilter);
    }

    if (sortByDate) {
      result = [...result].sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate.localeCompare(b.dueDate);
      });
    }

    return result;
  }, [tasks, search, statusFilter, priorityFilter, sortByDate]);

  return (
    <main className="dashboard">
      <header className="page-header">
        <div>
          <p className="eyebrow">YOUR PERSONAL WORKSPACE</p>
          <h1>Task Dashboard</h1>
          <p className="subtitle">Plan your work, track your progress, one task at a time.</p>
        </div>
        <div className="date-chip">
          <span className="date-dot" />
          Saved on this device
        </div>
      </header>

      <section className="summary-grid" aria-label="Task summary">
        <SummaryCard label="Total Tasks" count={totalTasks} kind="total" />
        <SummaryCard label="Pending Tasks" count={pendingTasks} kind="pending-summary" />
        <SummaryCard label="Completed Tasks" count={completedTasks} kind="completed-summary" />
      </section>

      <div className="content-grid">
          <section className="panel create-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">GET STARTED</p>
              <h2>Add a new task</h2>
            </div>
          </div>
          
          <TaskForm onAddTask={addTask} />

           {/* ADD THIS BUTTON RIGHT HERE */}
          <div style={{ marginTop: "1rem", textAlign: "center" }}>
            <p style={{ fontSize: "0.875rem", color: "#666", marginBottom: "0.5rem" }}>Don't know what to do?</p>
            <button 
              type="button" 
              className="primary-button" 
              onClick={handleAddRandomTask}
              style={{ backgroundColor: "#4b5563" }} // Giving it a slightly different color
            >
              ✨ Generate a Random Task
            </button>
          </div>
          {/*  END OF NEW BUTTON  */}
        </section>

        <section className="panel list-panel">
          <div className="list-heading">
            <div>
              <p className="eyebrow">YOUR WORKLOAD</p>
              <h2>Tasks <span className="count-pill">{visibleTasks.length}</span></h2>
            </div>
          </div>

          <div className="filters">
            <label className="search-field">
              <span aria-hidden="true">⌕</span>
              <input
                type="search"
                placeholder="Search by task title..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>

            <div className="filter-row">
              <label>
                <span className="sr-only">Filter by status</span>
                <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                  <option value="All">All tasks</option>
                  <option value="Pending">Pending tasks</option>
                  <option value="Completed">Completed tasks</option>
                </select>
              </label>
              <label>
                <span className="sr-only">Filter by priority</span>
                <select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)}>
                  <option value="All">All priorities</option>
                  <option value="High">High priority</option>
                  <option value="Medium">Medium priority</option>
                  <option value="Low">Low priority</option>
                </select>
              </label>

              <label className="sort-control">
                <input
                  type="checkbox"
                  checked={sortByDate}
                  onChange={(event) => setSortByDate(event.target.checked)}
                />
                Sort by due date
              </label>
            </div>
          </div>

          <div className="task-list">
            {visibleTasks.length > 0 ? (
              visibleTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onToggle={toggleTask}
                  onDelete={deleteTask}
                />
              ))
            ) : (
              <div className="empty-state">
                <div className="empty-icon">✓</div>
                <h3>{tasks.length === 0 ? "Your task list is clear" : "No tasks found"}</h3>
                <p>
                  {tasks.length === 0
                    ? "Add your first task above and make a little progress today."
                    : "Try changing your search or filters."}
                </p>
              </div>
            )}
          </div>

          {totalTasks > 0 && completedTasks === totalTasks && (
            <div className="all-done-message">🎉 Everything is completed. Great work!</div>
          )}
        </section>
      </div>

      <footer className="page-footer">
        <span>Task Dashboard</span>
        <span>Your tasks are saved in this browser using localStorage.</span>
      </footer>
    </main>
  );
}

export default App;