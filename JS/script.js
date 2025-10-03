document.addEventListener('DOMContentLoaded', () => {
    // =================================================
    // BAGIAN 1: SELEKSI ELEMEN DOM
    // =================================================
    const addTaskForm = document.getElementById('add-task-form');
    const taskInput = document.getElementById('task-input');
    const dueDateInput = document.getElementById('due-date-input');
    const taskList = document.getElementById('task-list');
    const searchInput = document.getElementById('search-input');
    const filterButtons = document.getElementById('filter-buttons');
    const sortSelect = document.getElementById('sort-select');
    const deleteAllBtn = document.getElementById('delete-all-btn');
    
    // Elemen Statistik
    const totalTasksElem = document.getElementById('total-tasks');
    const completedTasksElem = document.getElementById('completed-tasks');
    const pendingTasksElem = document.getElementById('pending-tasks');
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');

    // Elemen Pop-up
    const modalOverlay = document.getElementById('modal-overlay');
    const modalMessage = document.getElementById('modal-message');
    const modalConfirmBtn = document.getElementById('modal-confirm-btn');
    const modalCancelBtn = document.getElementById('modal-cancel-btn');
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');

    // =================================================
    // BAGIAN 2: STATE APLIKASI
    // =================================================
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    let currentFilter = 'all'; // 'all', 'pending', 'completed'
    let currentSort = 'newest'; // 'newest', 'oldest', 'a-z', 'z-a'
    let currentSearchTerm = '';

    // =================================================
    // BAGIAN 3: FUNGSI-FUNGSI UTAMA
    // =================================================

    // Menyimpan tugas ke Local Storage
    const saveTasks = () => {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    };

    // Fungsi RENDER TUGAS (Logika utama)
    const renderTasks = () => {
        taskList.innerHTML = '';
        
        // 1. FILTERING
        let tasksToRender = tasks.filter(task => {
            // Filter berdasarkan status
            const statusMatch = (currentFilter === 'all') ||
                                (currentFilter === 'completed' && task.completed) ||
                                (currentFilter === 'pending' && !task.completed);
            
            // Filter berdasarkan pencarian
            const searchMatch = task.text.toLowerCase().includes(currentSearchTerm);

            return statusMatch && searchMatch;
        });

        // 2. SORTING
        tasksToRender.sort((a, b) => {
            switch (currentSort) {
                case 'a-z':
                    return a.text.localeCompare(b.text);
                case 'z-a':
                    return b.text.localeCompare(a.text);
                case 'oldest':
                    return a.id - b.id;
                case 'newest':
                default:
                    return b.id - a.id;
            }
        });
        
        // 3. Tampilkan ke DOM
        if (tasksToRender.length === 0) {
            taskList.innerHTML = `<li class="empty-message"><i class="fas fa-clipboard-check"></i><p>Tidak ada tugas yang cocok.</p></li>`;
        } else {
            tasksToRender.forEach(task => {
                const taskItem = document.createElement('li');
                taskItem.className = `task-item ${task.completed ? 'completed' : ''}`;
                taskItem.dataset.id = task.id;

                const dueDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '';
                
                taskItem.innerHTML = `
                    <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
                    <div class="task-content">
                        <p class="task-text">${task.text}</p>
                        ${dueDate ? `<span class="due-date"><i class="far fa-calendar-alt"></i> ${dueDate}</span>` : ''}
                    </div>
                    <div class="task-actions">
                        <button class="delete-btn"><i class="fas fa-trash"></i></button>
                    </div>`;
                taskList.appendChild(taskItem);
            });
        }
        
        updateStats();
    };

    // Memperbarui statistik
    const updateStats = () => {
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(task => task.completed).length;
        const progress = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

        totalTasksElem.textContent = totalTasks;
        completedTasksElem.textContent = completedTasks;
        pendingTasksElem.textContent = totalTasks - completedTasks;
        progressBar.style.width = `${progress}%`;
        progressText.textContent = `${progress}%`;
    };

    // Fungsi untuk Pop-up
    const showToast = (message) => {
        toastMessage.textContent = message;
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    };

    let confirmCallback = null;
    const showModal = (message, onConfirm) => {
        modalMessage.textContent = message;
        modalOverlay.classList.add('show');
        confirmCallback = onConfirm;
    };
    
    const hideModal = () => {
        modalOverlay.classList.remove('show');
        confirmCallback = null;
    };


    // =================================================
    // BAGIAN 4: EVENT LISTENERS
    // =================================================

    // Tambah Tugas
    addTaskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const taskText = taskInput.value.trim();
        if (taskText) {
            tasks.unshift({ id: Date.now(), text: taskText, completed: false, dueDate: dueDateInput.value });
            saveTasks();
            renderTasks();
            taskInput.value = '';
            dueDateInput.value = '';
            showToast('Tugas berhasil ditambahkan! 🚀');
        }
    });

    // Aksi pada item tugas (Centang & Hapus)
    taskList.addEventListener('click', (e) => {
        const taskItem = e.target.closest('.task-item');
        if (!taskItem) return;
        const taskId = Number(taskItem.dataset.id);
        const taskIndex = tasks.findIndex(t => t.id === taskId);
        
        if (e.target.matches('.task-checkbox')) {
            tasks[taskIndex].completed = !tasks[taskIndex].completed;
        } else if (e.target.closest('.delete-btn')) {
            tasks.splice(taskIndex, 1);
        }
        
        saveTasks();
        renderTasks();
    });

    // Hapus Semua Tugas
    deleteAllBtn.addEventListener('click', () => {
        if(tasks.length > 0) {
            showModal('Anda yakin ingin menghapus SEMUA tugas?', () => {
                tasks = [];
                saveTasks();
                renderTasks();
                hideModal();
                showToast('Semua tugas telah dihapus.');
            });
        } else {
            showToast('Tidak ada tugas untuk dihapus.');
        }
    });

    // Pencarian
    searchInput.addEventListener('input', (e) => {
        currentSearchTerm = e.target.value.toLowerCase();
        renderTasks();
    });

    // Filter Status
    filterButtons.addEventListener('click', (e) => {
        if (e.target.matches('.filter-btn')) {
            document.querySelector('.filter-btn.active').classList.remove('active');
            e.target.classList.add('active');
            currentFilter = e.target.dataset.filter;
            renderTasks();
        }
    });
    
    // Sorting
    sortSelect.addEventListener('change', (e) => {
        currentSort = e.target.value;
        renderTasks();
    });

    // Aksi Modal
    modalConfirmBtn.addEventListener('click', () => {
        if (confirmCallback) confirmCallback();
    });
    modalCancelBtn.addEventListener('click', hideModal);
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) hideModal();
    });

    // =================================================
    // BAGIAN 5: INISIALISASI
    // =================================================
    renderTasks();
});