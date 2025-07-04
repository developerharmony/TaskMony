document.addEventListener("DOMContentLoaded", function () {
  // Theme variables
  const themeToggle = document.getElementById("theme-toggle");
  const themeSlider = document.querySelector("#theme-toggle + .slider");
  const colorPickerBtn = document.getElementById("color-picker-btn");
  const colorPicker = document.getElementById("color-picker");
  const customColorPicker = document.getElementById("custom-color-picker");

  // Add click handler for slider
  themeSlider.addEventListener("click", function (e) {
    e.preventDefault();
    themeToggle.checked = !themeToggle.checked;
    themeToggle.dispatchEvent(new Event("change"));
  });

  // Theme initialization
  function initTheme() {
    const savedTheme = localStorage.getItem("theme");
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (savedTheme === "dark" || (!savedTheme && systemPrefersDark)) {
      document.documentElement.classList.add("dark");
      themeToggle.checked = true;
    } else {
      document.documentElement.classList.remove("dark");
      themeToggle.checked = false;
    }
    const savedColor = localStorage.getItem("primaryColor");
    if (savedColor) {
      setPrimaryColor(savedColor);
      customColorPicker.value = savedColor;
    }
    document.documentElement.style.setProperty(
      "--switch-color",
      getComputedStyle(document.documentElement).getPropertyValue("--primary-color") || "#FF7D54"
    );
  }

  // Toggle theme
  themeToggle.addEventListener("change", function () {
    if (this.checked) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  });

  // Color picker toggle
  colorPickerBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    colorPicker.classList.toggle("hidden");
  });

  // Close color picker when clicking outside
  document.addEventListener("click", function (e) {
    if (!colorPicker.contains(e.target) && e.target !== colorPickerBtn) {
      colorPicker.classList.add("hidden");
    }
  });

  // Custom color picker
  customColorPicker.addEventListener("input", function () {
    const color = this.value;
    setPrimaryColor(color);
    localStorage.setItem("primaryColor", color);
  });

  customColorPicker.addEventListener("change", function () {
    colorPicker.classList.add("hidden");
  });

  // Set primary color
  function setPrimaryColor(color) {
    document.documentElement.style.setProperty("--primary-color", color);
    colorPickerBtn.style.backgroundColor = color;
    tailwind.config.theme.extend.colors.primary = color;
    document.documentElement.style.setProperty("--switch-color", color);
  }

  // DOM Elements for task management
  const addTaskBtn = document.getElementById("add-task-btn");
  const addTaskModal = document.getElementById("add-task-modal");
  const closeModalBtn = document.getElementById("close-modal-btn");
  const cancelTaskBtn = document.getElementById("cancel-task-btn");
  const taskForm = document.getElementById("task-form");
  const tasksContainer = document.getElementById("tasks-container");
  const deleteConfirmModal = document.getElementById("delete-confirm-modal");
  const cancelDeleteBtn = document.getElementById("cancel-delete-btn");
  const confirmDeleteBtn = document.getElementById("confirm-delete-btn");
  const modalTitle = document.getElementById("modal-title");
  const taskIdInput = document.getElementById("task-id");
  const taskTitleInput = document.getElementById("task-title");
  const taskDescriptionInput = document.getElementById("task-description");
  const taskCategorySelect = document.getElementById("task-category");
  const taskPrioritySelect = document.getElementById("task-priority");
  const taskDateInput = document.getElementById("task-date");
  const searchInput = document.getElementById("search-input");
  const sortButton = document.getElementById("sort-button");
  const sortDropdown = document.getElementById("sort-dropdown");
  const sortOptions = document.querySelectorAll("#sort-dropdown li");
  const currentViewTitle = document.getElementById("current-view-title");
  const taskCount = document.getElementById("task-count");

  // DOM Elements for category deletion modal
  const deleteCategoryConfirmModal = document.getElementById("delete-category-confirm-modal");
  const cancelCategoryDeleteBtn = document.getElementById("cancel-category-delete-btn");
  const confirmCategoryDeleteBtn = document.getElementById("confirm-category-delete-btn");

  // Task management
  let tasks = [];
  let currentTaskId = null;
  let currentCategoryValue = null;
  let currentFilter = "all";
  let currentSort = "date-desc";

  let searchTimeout;
  searchInput.addEventListener("input", function () {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      renderTasks();
    }, 300);
  });

  let lastFocusedElement = null;

  addTaskBtn.addEventListener("click", function () {
    lastFocusedElement = document.activeElement;
    taskForm.reset();
    taskIdInput.value = "";
    modalTitle.textContent = "Yeni Görev Ekle";
    currentTaskId = null;
    const today = new Date().toISOString().split("T")[0];
    taskDateInput.value = today;
    addTaskModal.classList.remove("hidden");
    taskTitleInput.focus();
  });

  closeModalBtn.addEventListener("click", function () {
    addTaskModal.classList.add("hidden");
    if (lastFocusedElement) {
      lastFocusedElement.focus();
    }
  });

  // Initialize tasks from localStorage
  function initTasks() {
    const savedTasks = localStorage.getItem("tasks");
    if (savedTasks) {
      tasks = JSON.parse(savedTasks);
    } else {
      tasks = [
        {
          id: 1,
          title: "Market alışverişi yap",
          description: "Süt, ekmek ve yumurta al",
          category: "alisveris",
          categoryColor: "#10B981",
          priority: "medium",
          date: new Date().toISOString().split("T")[0],
          status: "active",
        },
        {
          id: 2,
          title: "Toplantı notlarını hazırla",
          description: "Pazartesi toplantısı için notlar",
          category: "is",
          categoryColor: "#4F46E5",
          priority: "high",
          date: new Date().toISOString().split("T")[0],
          status: "active",
        },
      ];
      saveTasks();
    }
    renderTasks();
    updateCategoryCounts();
    updateFilterCounts();
  }

  // Save tasks to localStorage
  function saveTasks() {
    try {
      localStorage.setItem("tasks", JSON.stringify(tasks));
    } catch (e) {
      console.error("localStorage'a görevler kaydedilemedi: ", e);
      alert("Depolama alanı dolu. Lütfen bazı görevleri silerek yer açın veya tarayıcı ayarlarınızı kontrol edin.");
    }
  }

  // Sanitize HTML to prevent XSS
  function sanitizeHTML(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  // Format date for display
  function formatDate(dateString) {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleString("tr-TR", { month: "short" });
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  }

  // Render tasks
  function renderTasks() {
    let filteredTasks = getFilteredTasks();
    const existingTaskIds = new Set(
      Array.from(tasksContainer.children).map((el) => parseInt(el.dataset.id))
    );
    const newTaskIds = new Set(filteredTasks.map((task) => task.id));

    // Remove deleted tasks
    tasksContainer
      .querySelectorAll(".task-card")
      .forEach((el) => {
        if (!newTaskIds.has(parseInt(el.dataset.id))) {
          el.remove();
        }
      });

    // Add or update tasks
    filteredTasks.forEach((task) => {
      if (!existingTaskIds.has(task.id)) {
        const taskElement = createTaskElement(task);
        tasksContainer.appendChild(taskElement);
      } else {
        const taskElement = tasksContainer.querySelector(`[data-id="${task.id}"]`);
        // Update existing task if needed
        if (
          taskElement.dataset.status !== task.status ||
          taskElement.querySelector("h3").textContent !== sanitizeHTML(task.title)
        ) {
          const newTaskElement = createTaskElement(task);
          taskElement.replaceWith(newTaskElement);
        }
      }
    });
    // Placeholder for empty state
    if (filteredTasks.length === 0) {
      tasksContainer.innerHTML = `
        <div class="text-center text-red-500 dark:text-red-400 ">
          <i class="ri-information-line text-2xl mb-2"></i>
          <p>Hiç görev bulunamadı.</p>
        </div>
      `;
    } else {
      tasksContainer.querySelector(".text-center")?.remove();
    }

    taskCount.textContent = `${filteredTasks.length} görev`;
  }

  function getFilteredTasks() {
    let filteredTasks = tasks;
    if (currentFilter === "active") {
      filteredTasks = tasks.filter((task) => task.status === "active");
    } else if (currentFilter === "completed") {
      filteredTasks = tasks.filter((task) => task.status === "completed");
    } else if (currentFilter === "high") {
      filteredTasks = tasks.filter((task) => task.priority === "high");
    } else if (currentFilter.startsWith("category-")) {
      const category = currentFilter.replace("category-", "");
      filteredTasks = tasks.filter((task) => task.category === category);
    }

    const searchTerm = searchInput.value.toLowerCase().trim();
    if (searchTerm) {
      filteredTasks = filteredTasks.filter(
        (task) =>
          task.title.toLowerCase().includes(searchTerm) ||
          task.description.toLowerCase().includes(searchTerm)
      );
    }

    if (currentSort === "date-desc") {
      filteredTasks.sort((a, b) => new Date(b.date) - new Date(a.date));
    } else if (currentSort === "date-asc") {
      filteredTasks.sort((a, b) => new Date(a.date) - new Date(b.date));
    } else if (currentSort === "priority-desc") {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      filteredTasks.sort(
        (a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]
      );
    } else if (currentSort === "priority-asc") {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      filteredTasks.sort(
        (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
      );
    }

    return filteredTasks;
  }

  // Create task element
  function createTaskElement(task) {
    const taskElement = document.createElement("div");
    taskElement.className = `task-card bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-100 dark:border-gray-700 ${task.status === "completed" ? "opacity-80" : ""}`;
    taskElement.dataset.id = task.id;
    taskElement.dataset.category = task.category;
    taskElement.dataset.priority = task.priority;
    taskElement.dataset.status = task.status;

    const priorityClass = `priority-${task.priority}`;
    let priorityText = task.priority === "high" ? "Yüksek" : task.priority === "medium" ? "Orta" : "Düşük";
    let priorityBg = task.priority === "high" ? "bg-red-100 dark:bg-red-900/30" : task.priority === "medium" ? "bg-yellow-100 dark:bg-yellow-900/30" : "bg-green-100 dark:bg-green-900/30";
    let priorityTextColor = task.priority === "high" ? "text-red-600 dark:text-red-400" : task.priority === "medium" ? "text-yellow-600 dark:text-yellow-400" : "text-green-600 dark:text-green-400";

    const categoryBg = `background-color: rgba(${hexToRgb(task.categoryColor)}, 0.1);`;
    const categoryColor = `color: ${task.categoryColor};`;
    let categoryName = categories.find(cat => cat.value === task.category)?.name || task.category;

    taskElement.innerHTML = `
      <div class="flex justify-between items-start mb-2">
        <div class="flex items-center gap-2">
          <input type="checkbox" class="task-checkbox" ${task.status === "completed" ? "checked" : ""} style="--checkbox-color: ${sanitizeHTML(task.categoryColor)};" aria-label="Görev tamamlandı olarak işaretle">
          <h3 class="font-medium ${task.status === "completed" ? "task-completed" : ""}">${sanitizeHTML(task.title)}</h3>
        </div>
        <div class="flex gap-1">
          <button class="edit-task-btn w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300" aria-label="Görevi düzenle">
            <i class="ri-pencil-line"></i>
          </button>
          <button class="delete-task-btn w-8 h-8 flex items-center justify-center text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400" aria-label="Görevi sil">
            <i class="ri-delete-bin-line"></i>
          </button>
        </div>
      </div>
      <p class="text-gray-600 dark:text-gray-300 text-sm mb-3 ${task.status === "completed" ? "task-completed" : ""}">${sanitizeHTML(task.description)}</p>
      <div class="flex justify-between items-center">
        <span class="text-xs px-2 py-1 rounded-full" style="${categoryBg} ${categoryColor}">${sanitizeHTML(categoryName)}</span>
        <div class="flex items-center gap-2">
          <span class="${priorityClass} text-xs px-2 py-1 rounded-full ${priorityBg} ${priorityTextColor}">${priorityText}</span>
          <span class="text-xs text-gray-500 dark:text-gray-400">${formatDate(task.date)}</span>
        </div>
      </div>
    `;
    return taskElement;
  }

  // Attach event listeners to task elements using event delegation
  tasksContainer.addEventListener("click", function (e) {
    const taskCard = e.target.closest(".task-card");
    if (!taskCard) return;

    const taskId = parseInt(taskCard.dataset.id);
    if (e.target.closest(".edit-task-btn")) {
      const task = tasks.find((task) => task.id === taskId);
      if (task) {
        taskIdInput.value = task.id;
        taskTitleInput.value = task.title;
        taskDescriptionInput.value = task.description;
        taskCategorySelect.value = task.category;
        taskPrioritySelect.value = task.priority;
        taskDateInput.value = task.date;
        modalTitle.textContent = "Görevi Düzenle";
        currentTaskId = task.id;
        addTaskModal.classList.remove("hidden");
        taskTitleInput.focus();
      }
    } else if (e.target.closest(".delete-task-btn")) {
      const task = tasks.find((task) => task.id === taskId);
      if (task) {
        currentTaskId = taskId;
        deleteConfirmModal.querySelector("p").textContent = `"${sanitizeHTML(task.title)}" görevini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`;
        deleteConfirmModal.classList.remove("hidden");
      }
    }
  });

  tasksContainer.addEventListener("change", function (e) {
    if (e.target.classList.contains("task-checkbox")) {
      const taskCard = e.target.closest(".task-card");
      const taskId = parseInt(taskCard.dataset.id);
      const taskIndex = tasks.findIndex((task) => task.id === taskId);
      if (taskIndex !== -1) {
        tasks[taskIndex].status = e.target.checked ? "completed" : "active";
        const titleElement = taskCard.querySelector("h3");
        const descriptionElement = taskCard.querySelector("p");
        if (e.target.checked) {
          taskCard.classList.add("opacity-80");
          titleElement.classList.add("task-completed");
          descriptionElement.classList.add("task-completed");
        } else {
          taskCard.classList.remove("opacity-80");
          titleElement.classList.remove("task-completed");
          descriptionElement.classList.remove("task-completed");
        }
        saveTasks();
        updateFilterCounts();
      }
    }
  });

  // Update category counts
  function updateCategoryCounts() {
    const categories = document.querySelectorAll(".category-item");
    categories.forEach((category) => {
      const categoryName = category.dataset.category;
      const count = tasks.filter((task) => task.category === categoryName).length;
      const countElement = category.querySelector(".category-count");
      if (countElement) {
        countElement.textContent = count;
      }
    });
  }

  // Update filter counts
  function updateFilterCounts() {
    const allCount = tasks.length;
    const activeCount = tasks.filter((task) => task.status === "active").length;
    const completedCount = tasks.filter((task) => task.status === "completed").length;
    const highPriorityCount = tasks.filter((task) => task.priority === "high").length;
    document.querySelector('[data-filter="all"] .filter-count').textContent = allCount;
    document.querySelector('[data-filter="active"] .filter-count').textContent = activeCount;
    document.querySelector('[data-filter="completed"] .filter-count').textContent = completedCount;
    document.querySelector('[data-filter="high"] .filter-count').textContent = highPriorityCount;
  }

  // Convert hex to rgb
  function hexToRgb(hex) {
    hex = hex.replace("#", "");
    if (hex.length === 3) {
      hex = hex
        .split("")
        .map((char) => char + char)
        .join("");
    }
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `${r}, ${g}, ${b}`;
  }

  // Add task modal
  addTaskBtn.addEventListener("click", function () {
    taskForm.reset();
    taskIdInput.value = "";
    modalTitle.textContent = "Yeni Görev Ekle";
    currentTaskId = null;
    const today = new Date().toISOString().split("T")[0];
    taskDateInput.value = today;
    addTaskModal.classList.remove("hidden");
    taskTitleInput.focus();
  });

  // Close task modal
  closeModalBtn.addEventListener("click", function () {
    addTaskModal.classList.add("hidden");
  });

  // Cancel task button
  cancelTaskBtn.addEventListener("click", function () {
    addTaskModal.classList.add("hidden");
  });

  // Save task
  taskForm.addEventListener("submit", function (e) {
    e.preventDefault();
    const title = sanitizeHTML(taskTitleInput.value.trim());
    const description = sanitizeHTML(taskDescriptionInput.value.trim());
    const category = taskCategorySelect.value;
    const priority = taskPrioritySelect.value;
    const date = taskDateInput.value;
    const categoryOption = taskCategorySelect.options[taskCategorySelect.selectedIndex];
    const categoryColor = categoryOption.dataset.color;

    if (!category) {
      document.getElementById("task-category-desc").classList.remove("hidden");
      return;
    }
    if (!date) {
      document.getElementById("task-date-desc").classList.remove("hidden");
      return;
    }
    if (title) {
      if (currentTaskId) {
        const taskIndex = tasks.findIndex((task) => task.id === currentTaskId);
        if (taskIndex !== -1) {
          tasks[taskIndex] = {
            ...tasks[taskIndex],
            title,
            description,
            category,
            categoryColor,
            priority,
            date,
          };
        }
      } else {
        const newId = tasks.length > 0 ? Math.max(...tasks.map((task) => task.id)) + 1 : 1;
        tasks.push({
          id: newId,
          title,
          description,
          category,
          categoryColor,
          priority,
          date,
          status: "active",
        });
      }
      saveTasks();
      renderTasks();
      updateCategoryCounts();
      updateFilterCounts();
      addTaskModal.classList.add("hidden");
      showToast(currentTaskId ? "Görev başarıyla güncellendi!" : "Görev başarıyla eklendi!");
    }
  });
  function showToast(message, type = "success") {
    const toast = document.createElement("div");
    toast.className = `fixed bottom-4 right-4 px-4 py-2 rounded shadow-lg ${type === "error" ? "bg-red-500 text-white" : "bg-green-500 text-white"
      }`;
    toast.setAttribute("role", "alert");
    toast.setAttribute("aria-live", "assertive");
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.remove();
    }, 3000);
  }

  // Delete task confirmation
  confirmDeleteBtn.addEventListener("click", function () {
    if (!currentTaskId) return;
    tasks = tasks.filter((task) => task.id !== currentTaskId);
    saveTasks();
    renderTasks();
    updateCategoryCounts();
    updateFilterCounts();
    deleteConfirmModal.classList.add("hidden");
    showToast("Görev başarıyla silindi!");
  });

  // Cancel delete
  cancelDeleteBtn.addEventListener("click", function () {
    deleteConfirmModal.classList.add("hidden");
  });

  // Delete category confirmation
  confirmCategoryDeleteBtn.addEventListener("click", function () {
    if (!currentCategoryValue) return;
    categories = categories.filter((cat) => cat.value !== currentCategoryValue);
    tasks = tasks.filter((task) => task.category !== currentCategoryValue);
    saveCategories();
    saveTasks();
    renderCategories();
    renderTasks();
    updateCategoryCounts();
    updateFilterCounts();
    deleteCategoryConfirmModal.classList.add("hidden");
    showToast("Kategori başarıyla silindi!");
  });

  // Cancel category delete
  cancelCategoryDeleteBtn.addEventListener("click", function () {
    deleteCategoryConfirmModal.classList.add("hidden");
  });

  // Search tasks
  searchInput.addEventListener("input", function () {
    renderTasks();
  });

  // Sort dropdown toggle
  sortButton.addEventListener("click", function (e) {
    e.stopPropagation();
    sortDropdown.classList.toggle("hidden");
  });

  // Close sort dropdown when clicking outside
  document.addEventListener("click", function (e) {
    if (!sortDropdown.contains(e.target) && e.target !== sortButton) {
      sortDropdown.classList.add("hidden");
    }
  });

  // Sort options
  sortOptions.forEach((option) => {
    option.addEventListener("click", function () {
      currentSort = this.dataset.sort;
      sortDropdown.classList.add("hidden");
      renderTasks();
    });
  });

  // Filter tasks
  document.querySelectorAll(".filter-item").forEach((filter) => {
    filter.addEventListener("click", function () {
      currentFilter = this.dataset.filter;
      document.querySelectorAll(".filter-item").forEach((item) => {
        item.classList.remove("bg-gray-100", "dark:bg-gray-700");
      });
      this.classList.add("bg-gray-100", "dark:bg-gray-700");
      if (currentFilter === "all") {
        currentViewTitle.textContent = "Tüm Görevler";
      } else if (currentFilter === "active") {
        currentViewTitle.textContent = "Aktif Görevler";
      } else if (currentFilter === "completed") {
        currentViewTitle.textContent = "Tamamlanan Görevler";
      } else if (currentFilter === "high") {
        currentViewTitle.textContent = "Yüksek Öncelikli Görevler";
      }
      renderTasks();
    });
  });

  // Category management
  const addCategoryBtn = document.getElementById("add-category-btn");
  const addCategoryModal = document.getElementById("add-category-modal");
  const closeCategoryModalBtn = document.getElementById("close-category-modal-btn");
  const cancelCategoryBtn = document.getElementById("cancel-category-btn");
  const categoryForm = document.getElementById("category-form");
  const categoryNameInput = document.getElementById("category-name");
  const categoryList = document.getElementById("category-list");
  const categoryColors = document.querySelectorAll("#category-colors .color-option");

  let categories = [];
  let selectedColor = "#FF7D54";

  // Initialize categories from localStorage
  function initCategories() {
    const savedCategories = localStorage.getItem("categories");
    if (savedCategories) {
      categories = JSON.parse(savedCategories);
    } else {
      categories = [
        { id: 1, name: "Kişisel", value: "kisisel", color: "#FF7D54" },
        { id: 2, name: "İş", value: "is", color: "#4F46E5" },
        { id: 3, name: "Alışveriş", value: "alisveris", color: "#10B981" },
        { id: 4, name: "Sağlık", value: "saglik", color: "#8B5CF6" },
      ];
      saveCategories();
    }
    renderCategories();
  }

  // Save categories to localStorage
  function saveCategories() {
    try {
      localStorage.setItem("categories", JSON.stringify(categories));
    } catch (e) {
      console.error("localStorage'a kategoriler kaydedilemedi: ", e);
      alert("Depolama alanı dolu. Lütfen bazı kategorileri silerek yer açın veya tarayıcı ayarlarınızı kontrol edin.");
    }
  }

  // Render categories
  function renderCategories() {
    // Update task category select
    if (taskCategorySelect) {
      const currentSelection = taskCategorySelect.value;
      taskCategorySelect.innerHTML = `
        <option value="" disabled selected>Kategori seçin</option>
      `;
      categories.forEach((category) => {
        const option = document.createElement("option");
        option.value = category.value;
        option.textContent = category.name;
        option.dataset.color = category.color;
        taskCategorySelect.appendChild(option);
      });
      if (
        currentSelection &&
        [...taskCategorySelect.options].some((option) => option.value === currentSelection)
      ) {
        taskCategorySelect.value = currentSelection;
      } else {
        taskCategorySelect.value = categories[0]?.value || "";
      }
    }

    // Update category list in sidebar
    if (categoryList) {
      categoryList.innerHTML = "";
      categories.forEach((category) => {
        const categoryItem = document.createElement("li");
        categoryItem.className =
          "category-item rounded-button p-2 flex items-center gap-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700";
        categoryItem.dataset.category = category.value;
        categoryItem.dataset.color = category.color;
        categoryItem.innerHTML = `
          <span class="w-3 h-3 rounded-full" style="background-color: ${category.color};"></span>
          <span>${sanitizeHTML(category.name)}</span>
          <span class="ml-auto text-xs text-gray-500 dark:text-gray-400 category-count">0</span>
          <button class="category-delete-btn w-6 h-6 flex items-center justify-center text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400" aria-label="Kategoriyi sil">
            <i class="ri-delete-bin-line"></i>
          </button>
        `;
        categoryList.appendChild(categoryItem);

        categoryItem.addEventListener("click", function (e) {
          if (e.target.closest(".category-delete-btn")) return;
          const categoryName = this.dataset.category;
          currentFilter = `category-${categoryName}`;
          document.querySelectorAll(".category-item").forEach((item) => {
            item.classList.remove("bg-primary/10", "text-primary");
            const color = item.dataset.color;
            if (color) {
              const rgbColor = hexToRgb(color);
              item.style.backgroundColor = "";
              item.style.color = "";
            }
          });
          const color = this.dataset.color;
          if (color) {
            const rgbColor = hexToRgb(color);
            this.style.backgroundColor = `rgba(${rgbColor}, 0.1)`;
            this.style.color = color;
          }
          currentViewTitle.textContent = `${category.name} Görevleri`;
          renderTasks();
        });

        document.querySelectorAll('input[placeholder="Görev ara..."]').forEach(input => {
          input.addEventListener("input", function () {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
              renderTasks();
            }, 300);
          });
        });

        categoryItem.querySelector(".category-delete-btn").addEventListener("click", function (e) {
          e.stopPropagation();
          const categoryValue = categoryItem.dataset.category;
          const categoryName = category.name;
          const taskCount = tasks.filter((task) => task.category === categoryValue).length;
          currentCategoryValue = categoryValue;
          deleteCategoryConfirmModal.querySelector("p").textContent = `"${sanitizeHTML(categoryName)}" kategorisini silmek istediğinizden emin misiniz? Bu işlem ${taskCount} görevi de silecektir.`;
          deleteCategoryConfirmModal.classList.remove("hidden");
        });
      });
    }
  }

  // Add category modal
  addCategoryBtn.addEventListener("click", function () {
    categoryForm.reset();
    categoryColors.forEach((color) => {
      color.classList.remove("selected");
    });
    categoryColors[0].classList.add("selected");
    selectedColor = categoryColors[0].dataset.color;
    addCategoryModal.classList.remove("hidden");
    categoryNameInput.focus();

  });

  // Close category modal
  closeCategoryModalBtn.addEventListener("click", function () {
    addCategoryModal.classList.add("hidden");
  });

  // Cancel category button
  cancelCategoryBtn.addEventListener("click", function () {
    addCategoryModal.classList.add("hidden");
  });

  // Color selection
  categoryColors.forEach((color) => {
    color.addEventListener("click", function () {
      categoryColors.forEach((c) => c.classList.remove("selected"));
      this.classList.add("selected");
      selectedColor = this.dataset.color;
    });
  });

  // Save category
  categoryForm.addEventListener("submit", function (e) {
    e.preventDefault();
    const name = sanitizeHTML(categoryNameInput.value.trim());
    if (name) {
      if (categories.some((cat) => cat.name.toLowerCase() === name.toLowerCase())) {
        document.getElementById("category-name-desc").classList.remove("hidden");
        return;
      }
      const value = name
        .toLowerCase()
        .replace(/ı/g, "i")
        .replace(/ğ/g, "g")
        .replace(/ü/g, "u")
        .replace(/ş/g, "s")
        .replace(/ö/g, "o")
        .replace(/ç/g, "c")
        .replace(/[^a-z0-9]/g, "")
        .replace(/\s+/g, "");
      const newId = categories.length > 0 ? Math.max(...categories.map((cat) => cat.id)) + 1 : 1;
      categories.push({
        id: newId,
        name,
        value,
        color: selectedColor,
      });
      saveCategories();
      renderCategories();
      updateCategoryCounts();
      addCategoryModal.classList.add("hidden");
      showToast("Kategori başarıyla eklendi!");
    }
  });

  // Sidebar toggle
  const sidebarToggle = document.getElementById("sidebar-toggle");
  const sidebar = document.getElementById("sidebar");

  sidebarToggle.addEventListener("click", function () {
    sidebar.classList.toggle("active");
    this.classList.toggle("active");
  });

  document.addEventListener("click", function (e) {
    if (
      !sidebar.contains(e.target) &&
      e.target !== sidebarToggle &&
      !sidebarToggle.contains(e.target) &&
      sidebar.classList.contains("active")
    ) {
      sidebar.classList.remove("active");
      sidebarToggle.classList.remove("active");
    }
  });


  // Initialize everything
  initTheme();
  initCategories();
  initTasks();
});