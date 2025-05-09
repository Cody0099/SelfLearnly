// renderer.js
const { ipcRenderer } = require('electron');

// DOM 元素
const navButtons = document.querySelectorAll('.nav-btn');
const pages = document.querySelectorAll('.page');
const actionButtons = document.querySelectorAll('.action-btn');

// 番茄钟元素
const timerDisplay = document.querySelector('.timer');
const timerLabel = document.querySelector('.timer-label');
const startButton = document.getElementById('start-timer');
const pauseButton = document.getElementById('pause-timer');
const resetButton = document.getElementById('reset-timer');
const sessionCounter = document.getElementById('session-count');
const workDurationInput = document.getElementById('work-duration');
const breakDurationInput = document.getElementById('break-duration');
const saveSettingsButton = document.getElementById('save-settings');

// 学习方法库元素
const methodsContainer = document.querySelector('.methods-container');
const methodSearch = document.getElementById('method-search');
const methodModal = document.getElementById('method-detail-modal');
const modalTitle = document.getElementById('modal-method-title');
const modalContent = document.getElementById('modal-method-content');
const closeModal = document.querySelector('.close-modal');
const methodCategoryFilter = document.getElementById('method-category-filter');
const methodDifficultyFilter = document.getElementById('method-difficulty-filter');
const methodResetFilter = document.getElementById('method-reset-filter');

// 学习方法编辑元素
const methodEditModal = document.getElementById('method-edit-modal');
const methodEditForm = document.getElementById('method-edit-form');
const methodNameInput = document.getElementById('method-name');
const methodShortDescInput = document.getElementById('method-short-description');
const methodCategorySelect = document.getElementById('method-category');
const methodDifficultySelect = document.getElementById('method-difficulty');
const methodTimeRequiredSelect = document.getElementById('method-time-required');
const methodFullDescInput = document.getElementById('method-full-description');
const closeEditModal = document.querySelector('.close-edit-modal');
const cancelEditBtn = document.getElementById('cancel-edit-btn');
const deleteMethodBtn = document.getElementById('delete-method-btn');

// 间隔复习提醒系统元素
const reviewForm = document.getElementById('review-form');
const itemTitleInput = document.getElementById('item-title');
const itemDescriptionInput = document.getElementById('item-description');
const itemFirstDateInput = document.getElementById('item-first-date');
const itemDifficultySelect = document.getElementById('item-difficulty');
const calendarGrid = document.querySelector('.calendar-grid');
const prevMonthBtn = document.getElementById('prev-month');
const nextMonthBtn = document.getElementById('next-month');
const currentMonthDisplay = document.getElementById('current-month');
const todayReviewList = document.querySelector('.today-review-list');
const reviewItemsList = document.querySelector('.review-items-list');

// ============ 笔记系统功能 ============

// DOM元素
const notesContainer = document.querySelector('.notes-container');
const notesList = document.querySelector('.notes-list');
const newNoteBtn = document.getElementById('new-note-btn');
const noteSearch = document.getElementById('note-search');
const noteTitle = document.getElementById('note-title');
const noteContent = document.getElementById('note-content');
const saveNoteBtn = document.getElementById('save-note-btn');
const exportNoteBtn = document.getElementById('export-note-btn');
const deleteNoteBtn = document.getElementById('delete-note-btn');
const noteTemplate = document.getElementById('note-template');
const normalEditor = document.getElementById('normal-editor');
const cornellEditor = document.getElementById('cornell-editor');
const cornellTitle = document.getElementById('cornell-title');
const cornellDate = document.getElementById('cornell-date');
const cornellCuesContent = document.getElementById('cornell-cues-content');
const cornellNotesContent = document.getElementById('cornell-notes-content');
const cornellSummaryContent = document.getElementById('cornell-summary-content');
const tagInput = document.getElementById('tag-input');
const addTagBtn = document.getElementById('add-tag-btn');
const tagsList = document.querySelector('.tags-list');

// 全局变量
let timer;
let timerRunning = false;
let workMode = true;
let timeLeft = 25 * 60; // 默认25分钟
let sessionCount = 0;
let pomodoroSettings = {
  workDuration: 25,
  breakDuration: 5,
  longBreakDuration: 15,
  sessionsBeforeLongBreak: 4
};
let learningMethods = [];
let reviewItems = [];
let currentDate = new Date();
let currentMonth = currentDate.getMonth();
let currentYear = currentDate.getFullYear();
let notes = [];
let currentNote = null;
let currentTags = [];

// 找到首页今日学习计划内容区域
const summaryContent = document.querySelector('.today-summary .summary-content');

// 找到复习项目的筛选控件
const reviewItemSearch = document.getElementById('review-item-search');
const reviewDifficultyFilter = document.getElementById('review-difficulty-filter');
const reviewResetFilter = document.getElementById('review-reset-filter');

// 页面导航
navButtons.forEach(button => {
  button.addEventListener('click', () => {
    const targetPage = button.getAttribute('data-page');
    
    // 更新活动按钮
    navButtons.forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');
    
    // 更新活动页面
    pages.forEach(page => {
      if (page.id === `${targetPage}-page`) {
        page.classList.add('active');
      } else {
        page.classList.remove('active');
      }
    });

    // 如果是学习方法页面且尚未加载数据，则加载数据
    if (targetPage === 'methods' && methodsContainer.children.length === 0) {
      loadLearningMethods();
    }

    // 如果是复习提醒页面，则加载复习项目
    if (targetPage === 'review') {
      loadReviewItems();
      renderCalendar();
    }
  });
});

// 快速操作按钮
actionButtons.forEach(button => {
  button.addEventListener('click', () => {
    const action = button.getAttribute('data-action');
    
    switch (action) {
      case 'start-pomodoro':
        // 切换到番茄钟页面并启动计时器
        navButtons.forEach(btn => {
          if (btn.getAttribute('data-page') === 'pomodoro') {
            btn.click();
          }
        });
        if (!timerRunning) {
          startTimer();
        }
        break;
      case 'add-review':
        // 切换到复习提醒页面
        navButtons.forEach(btn => {
          if (btn.getAttribute('data-page') === 'review') {
            btn.click();
          }
        });
        break;
      case 'new-note':
        // 切换到笔记系统页面
        navButtons.forEach(btn => {
          if (btn.getAttribute('data-page') === 'notes') {
            btn.click();
          }
        });
        break;
      case 'browse-methods':
        // 切换到学习方法页面
        navButtons.forEach(btn => {
          if (btn.getAttribute('data-page') === 'methods') {
            btn.click();
          }
        });
        break;
      case 'create-plan':
        // 切换到学习计划定制页面
        document.querySelectorAll('.page').forEach(page => {
          page.classList.remove('active');
        });
        document.getElementById('plan-page').classList.add('active');
        break;
    }
  });
});

// ============ 番茄钟功能 ============

// 加载设置
function loadSettings() {
  pomodoroSettings = ipcRenderer.sendSync('get-pomodoro-settings');
  
  workDurationInput.value = pomodoroSettings.workDuration;
  breakDurationInput.value = pomodoroSettings.breakDuration;
  
  // 如果计时器未运行，重置计时器显示
  if (!timerRunning) {
    timeLeft = pomodoroSettings.workDuration * 60;
    updateTimerDisplay();
  }
}

// 保存设置
saveSettingsButton.addEventListener('click', () => {
  pomodoroSettings.workDuration = parseInt(workDurationInput.value);
  pomodoroSettings.breakDuration = parseInt(breakDurationInput.value);
  
  ipcRenderer.send('save-pomodoro-settings', pomodoroSettings);
  
  // 如果计时器未运行，更新显示
  if (!timerRunning) {
    resetTimer();
  }
});

// 格式化时间显示
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// 更新计时器显示
function updateTimerDisplay() {
  timerDisplay.textContent = formatTime(timeLeft);
}

// 开始计时器
function startTimer() {
  if (timerRunning) return;
  
  timerRunning = true;
  startButton.disabled = true;
  pauseButton.disabled = false;
  
  timer = setInterval(() => {
    timeLeft--;
    updateTimerDisplay();
    
    if (timeLeft <= 0) {
      clearInterval(timer);
      timerRunning = false;
      
      // 播放提示音
      const audio = new Audio('../assets/notification.mp3');
      audio.play().catch(e => console.log('提示音播放失败:', e));
      
      // 模式切换
      if (workMode) {
        // 工作模式结束，切换到休息模式
        workMode = false;
        sessionCount++;
        sessionCounter.textContent = sessionCount;
        
        // 保存会话计数
        localStorage.setItem('sessionCount', sessionCount);
        
        timeLeft = pomodoroSettings.breakDuration * 60;
        timerLabel.textContent = '休息时间';
      } else {
        // 休息模式结束，切换到工作模式
        workMode = true;
        timeLeft = pomodoroSettings.workDuration * 60;
        timerLabel.textContent = '工作时间';
      }
      
      updateTimerDisplay();
      startButton.disabled = false;
      pauseButton.disabled = true;
    }
  }, 1000);
}

// 暂停计时器
function pauseTimer() {
  if (!timerRunning) return;
  
  clearInterval(timer);
  timerRunning = false;
  startButton.disabled = false;
  pauseButton.disabled = true;
}

// 重置计时器
function resetTimer() {
  clearInterval(timer);
  timerRunning = false;
  workMode = true;
  timerLabel.textContent = '工作时间';
  timeLeft = pomodoroSettings.workDuration * 60;
  updateTimerDisplay();
  startButton.disabled = false;
  pauseButton.disabled = true;
}

// 添加事件监听器
startButton.addEventListener('click', startTimer);
pauseButton.addEventListener('click', pauseTimer);
resetButton.addEventListener('click', resetTimer);

// ============ 学习方法库功能 ============

// 加载学习方法
async function loadLearningMethods() {
  try {
    // 尝试从主进程获取学习方法数据
    learningMethods = ipcRenderer.sendSync('get-learning-methods');
    
    // 如果没有获取到数据，从本地模块加载
    if (!learningMethods || learningMethods.length === 0) {
      // 在渲染进程中直接引入模块可能会有安全限制，这里使用备选方案
      try {
        const modulePath = require('path').join(__dirname, 'models', 'learningMethods.js');
        const methodsModule = require(modulePath);
        learningMethods = methodsModule.all;
      } catch (error) {
        console.error('加载学习方法数据失败:', error);
        learningMethods = [];
      }
    }

    // 显示学习方法
    renderLearningMethods(learningMethods);
    
    // 设置分类筛选器
    setupCategoryFilter();
    
    // 设置难度筛选器
    setupDifficultyFilter();
  } catch (error) {
    console.error('获取学习方法数据失败:', error);
  }
}

// 设置分类筛选器
function setupCategoryFilter() {
  // 清空当前选项
  methodCategoryFilter.innerHTML = '<option value="all">所有分类</option>';
  
  // 获取所有分类
  const categories = ipcRenderer.sendSync('get-learning-method-categories');
  
  // 添加分类选项
  categories.forEach(category => {
    const option = document.createElement('option');
    option.value = category;
    option.textContent = category;
    methodCategoryFilter.appendChild(option);
  });
  
  // 添加变更事件
  methodCategoryFilter.addEventListener('change', filterMethods);
}

// 设置难度筛选器
function setupDifficultyFilter() {
  // 难度级别是固定的
  methodDifficultyFilter.innerHTML = `
    <option value="all">所有难度</option>
    <option value="低">简单</option>
    <option value="中等">中等</option>
    <option value="高">困难</option>
  `;
  
  // 添加变更事件
  methodDifficultyFilter.addEventListener('change', filterMethods);
}

// 筛选方法
function filterMethods() {
  const category = methodCategoryFilter.value;
  const difficulty = methodDifficultyFilter.value;
  const searchTerm = methodSearch.value.toLowerCase().trim();
  
  let filteredMethods = learningMethods;
  
  // 应用分类筛选
  if (category !== 'all') {
    filteredMethods = filteredMethods.filter(method => method.category === category);
  }
  
  // 应用难度筛选
  if (difficulty !== 'all') {
    filteredMethods = filteredMethods.filter(method => method.difficulty === difficulty);
  }
  
  // 应用搜索筛选
  if (searchTerm !== '') {
    filteredMethods = filteredMethods.filter(method => 
      method.name.toLowerCase().includes(searchTerm) || 
      method.shortDescription.toLowerCase().includes(searchTerm)
    );
  }
  
  // 渲染过滤后的结果
  renderLearningMethods(filteredMethods);
}

// 重置筛选器
if (methodResetFilter) {
  methodResetFilter.addEventListener('click', () => {
    methodCategoryFilter.value = 'all';
    methodDifficultyFilter.value = 'all';
    methodSearch.value = '';
    renderLearningMethods(learningMethods);
  });
}

// 显示学习方法卡片
function renderLearningMethods(methods) {
  // 清空容器
  methodsContainer.innerHTML = '';
  
  if (methods.length === 0) {
    methodsContainer.innerHTML = '<p class="empty-methods">暂无符合条件的学习方法</p>';
    return;
  }
  
  // 添加新建学习方法按钮
  const addMethodCard = document.createElement('div');
  addMethodCard.className = 'method-card add-method-card';
  addMethodCard.innerHTML = `
    <div class="add-method-content">
      <div class="add-method-icon">+</div>
      <h3 class="add-method-text">添加学习方法</h3>
    </div>
  `;
  
  // 添加点击事件
  addMethodCard.addEventListener('click', () => openMethodEditModal());
  
  // 添加到容器
  methodsContainer.appendChild(addMethodCard);
  
  // 创建方法卡片
  methods.forEach(method => {
    const card = document.createElement('div');
    card.className = 'method-card';
    card.setAttribute('data-id', method.id);
    
    // 根据方法的难度级别添加额外的类
    if (method.difficulty) {
      card.classList.add(`difficulty-${method.difficulty}`);
    }
    
    // 根据方法的分类添加额外的类
    if (method.category) {
      card.classList.add(`category-${method.category.replace(/\s+/g, '-')}`);
    }
    
    card.innerHTML = `
      <div class="method-card-header">
        <div class="method-icon">${method.name.charAt(0)}</div>
        <h3 class="method-name">${method.name}</h3>
      </div>
      <div class="method-meta">
        <span class="method-category">${method.category || '未分类'}</span>
        <span class="method-difficulty">难度: ${method.difficulty || '未知'}</span>
        <span class="method-time">用时: ${method.timeRequired || '未知'}</span>
      </div>
      <div class="method-description">${method.shortDescription}</div>
      <div class="method-card-footer">
        <button class="edit-method-btn">编辑</button>
        <button class="view-method-btn">查看详情</button>
      </div>
    `;
    
    // 添加查看详情点击事件
    card.querySelector('.view-method-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      showMethodDetail(method);
    });
    
    // 添加编辑点击事件
    card.querySelector('.edit-method-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      openMethodEditModal(method);
    });
    
    // 添加到容器
    methodsContainer.appendChild(card);
  });
}

// 显示学习方法详情
function showMethodDetail(method) {
  modalTitle.textContent = method.name;
  modalContent.innerHTML = method.fullDescription;
  methodModal.style.display = 'block';
}

// 关闭详情弹窗
if (closeModal) {
  closeModal.addEventListener('click', () => {
    methodModal.style.display = 'none';
  });
}

// 打开编辑学习方法模态框
function openMethodEditModal(method = null) {
  // 如果传入了method参数，表示编辑现有方法
  // 否则表示新建方法
  if (method) {
    // 填充表单
    methodNameInput.value = method.name || '';
    methodShortDescInput.value = method.shortDescription || '';
    methodCategorySelect.value = method.category || '其他';
    methodDifficultySelect.value = method.difficulty || '中等';
    methodTimeRequiredSelect.value = method.timeRequired || '中等';
    methodFullDescInput.value = method.fullDescription || '';
    
    // 保存当前编辑的方法ID
    methodEditForm.setAttribute('data-id', method.id);
    
    // 显示删除按钮
    if (deleteMethodBtn) {
      deleteMethodBtn.style.display = 'block';
    }
  } else {
    // 清空表单
    methodEditForm.reset();
    methodEditForm.removeAttribute('data-id');
    
    // 隐藏删除按钮
    if (deleteMethodBtn) {
      deleteMethodBtn.style.display = 'none';
    }
  }
  
  // 显示模态框
  methodEditModal.style.display = 'block';
}

// 保存学习方法
function saveMethod(e) {
  e.preventDefault();
  
  // 获取表单数据
  const id = methodEditForm.hasAttribute('data-id') ? 
    parseInt(methodEditForm.getAttribute('data-id')) : 
    Date.now();
    
  const method = {
    id,
    name: methodNameInput.value.trim(),
    shortDescription: methodShortDescInput.value.trim(),
    category: methodCategorySelect.value,
    difficulty: methodDifficultySelect.value,
    timeRequired: methodTimeRequiredSelect.value,
    fullDescription: methodFullDescInput.value.trim(),
    icon: `${methodNameInput.value.charAt(0).toLowerCase()}.svg` // 简单处理图标
  };
  
  // 通过IPC发送保存请求
  const success = ipcRenderer.sendSync('save-learning-method', method);
  
  if (success) {
    // 更新本地数据
    const index = learningMethods.findIndex(m => m.id === method.id);
    if (index >= 0) {
      learningMethods[index] = method;
    } else {
      learningMethods.push(method);
    }
    
    // 重新渲染列表
    renderLearningMethods(learningMethods);
    
    // 关闭模态框
    closeMethodEditModal();
    
    // 显示成功消息
    showNotification('学习方法已保存');
  } else {
    showNotification('保存失败，请重试', 'error');
  }
}

// 关闭编辑模态框
function closeMethodEditModal() {
  methodEditModal.style.display = 'none';
}

// 创建通用确认对话框组件
function createConfirmDialog() {
  // 清理之前可能存在的对话框
  const oldDialogs = document.querySelectorAll('.custom-dialog');
  oldDialogs.forEach(dialog => {
    if (dialog && dialog.parentNode) {
      dialog.parentNode.removeChild(dialog);
    }
  });
  
  // 创建新的对话框
  const confirmDialog = document.createElement('div');
  confirmDialog.id = 'custom-confirm-dialog';
  confirmDialog.className = 'custom-dialog';
  
  // 简化样式设置
  confirmDialog.style.position = 'fixed';
  confirmDialog.style.top = '0';
  confirmDialog.style.left = '0';
  confirmDialog.style.width = '100%';
  confirmDialog.style.height = '100%';
  confirmDialog.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
  confirmDialog.style.display = 'none';
  confirmDialog.style.justifyContent = 'center';
  confirmDialog.style.alignItems = 'center';
  confirmDialog.style.zIndex = '9999';
  
  // 内容区域
  const dialogContent = document.createElement('div');
  dialogContent.style.backgroundColor = 'white';
  dialogContent.style.padding = '20px';
  dialogContent.style.borderRadius = '5px';
  dialogContent.style.maxWidth = '400px';
  dialogContent.style.minWidth = '300px';
  
  // 内容区域的HTML
  dialogContent.innerHTML = `
    <h3 style="margin-top:0">确认操作</h3>
    <p class="dialog-message" style="margin-bottom:20px"></p>
    <div style="text-align:right">
      <button class="dialog-cancel-btn" style="margin-right:10px;padding:5px 15px">取消</button>
      <button class="dialog-confirm-btn" style="padding:5px 15px">确定</button>
    </div>
  `;
  
  confirmDialog.appendChild(dialogContent);
  document.body.appendChild(confirmDialog);
  
  // 防止点击对话框内容区域时关闭对话框
  dialogContent.addEventListener('click', (e) => {
    e.stopPropagation();
  });
  
  // 点击对话框背景时关闭对话框（取消操作）
  confirmDialog.addEventListener('click', () => {
    confirmDialog.style.display = 'none';
    if (confirmDialog.onCancel) {
      confirmDialog.onCancel();
    }
  });
  
  return confirmDialog;
}

// 显示自定义确认对话框
function showConfirmDialog(message) {
  return new Promise((resolve) => {
    // 创建自定义对话框
    const dialog = createConfirmDialog();
    
    // 设置消息内容
    const messageEl = dialog.querySelector('.dialog-message');
    if (messageEl) {
      messageEl.textContent = message;
    }
    
    // 获取按钮元素
    const cancelBtn = dialog.querySelector('.dialog-cancel-btn');
    const confirmBtn = dialog.querySelector('.dialog-confirm-btn');
    
    // 处理确认操作
    const handleConfirm = () => {
      dialog.style.display = 'none';
      
      // 清理事件处理器
      if (cancelBtn) cancelBtn.removeEventListener('click', handleCancel);
      if (confirmBtn) confirmBtn.removeEventListener('click', handleConfirm);
      
      // 修复表单元素状态
      setTimeout(() => {
        // 恢复所有输入元素状态
        const inputs = document.querySelectorAll('input, textarea, select');
        for (let i = 0; i < inputs.length; i++) {
          inputs[i].disabled = false;
        }
        
        // 尝试聚焦一个可见的输入元素
        const visibleInput = Array.from(inputs).find(input => {
          const style = window.getComputedStyle(input);
          return style.display !== 'none' && style.visibility !== 'hidden';
        });
        if (visibleInput) {
          visibleInput.focus();
          visibleInput.blur();
        }
      }, 10);
      
      // 返回确认结果
      resolve(true);
    };
    
    // 处理取消操作
    const handleCancel = () => {
      dialog.style.display = 'none';
      
      // 清理事件处理器
      if (cancelBtn) cancelBtn.removeEventListener('click', handleCancel);
      if (confirmBtn) confirmBtn.removeEventListener('click', handleConfirm);
      
      // 修复表单元素状态（同样需要修复，因为对话框可能已经影响了状态）
      setTimeout(() => {
        const inputs = document.querySelectorAll('input, textarea, select');
        for (let i = 0; i < inputs.length; i++) {
          inputs[i].disabled = false;
        }
      }, 10);
      
      // 返回取消结果
      resolve(false);
    };
    
    // 添加事件监听器
    if (cancelBtn) cancelBtn.addEventListener('click', handleCancel);
    if (confirmBtn) confirmBtn.addEventListener('click', handleConfirm);
    
    // 显示对话框
    dialog.style.display = 'flex';
  });
}

// 删除学习方法 - 使用自定义对话框替代系统对话框
async function deleteMethod() {
  // 获取当前编辑的方法ID
  if (!methodEditForm.hasAttribute('data-id')) {
    return;
  }
  
  const methodId = parseInt(methodEditForm.getAttribute('data-id'));
  
  // 使用自定义确认对话框
  const confirmed = await showConfirmDialog('确定要删除这个学习方法吗？此操作不可撤销。');
  
  if (confirmed) {
    // 禁用删除按钮防止重复操作
    deleteMethodBtn.disabled = true;
    deleteMethodBtn.textContent = '删除中...';
    
    try {
      // 使用异步方式发送删除请求
      setTimeout(() => {
        try {
          // 通过IPC发送删除请求
          const success = ipcRenderer.sendSync('delete-learning-method', methodId);
          
          if (success) {
            // 从本地数据中移除
            learningMethods = learningMethods.filter(method => method.id !== methodId);
            
            // 重新渲染列表
            renderLearningMethods(learningMethods);
            
            // 关闭模态框
            closeMethodEditModal();
            
            // 显示成功消息
            showNotification('学习方法已删除');
            
            // 强制重新聚焦
            setTimeout(() => {
              // 聚焦到搜索框或其他可见元素
              if (methodSearch) {
                methodSearch.focus();
              }
            }, 100);
          } else {
            showNotification('删除失败，请重试', 'error');
          }
        } catch (error) {
          console.error('删除学习方法出错:', error);
          showNotification('删除出错，请重试', 'error');
        } finally {
          // 恢复按钮状态
          deleteMethodBtn.disabled = false;
          deleteMethodBtn.textContent = '删除';
        }
      }, 10);
    } catch (error) {
      console.error('删除操作准备失败:', error);
      deleteMethodBtn.disabled = false;
      deleteMethodBtn.textContent = '删除';
    }
  }
}

// 点击模态框外部关闭模态框
window.addEventListener('click', (event) => {
  if (event.target === methodModal) {
    methodModal.style.display = 'none';
  }
  if (event.target === methodEditModal) {
    methodEditModal.style.display = 'none';
  }
});

// 搜索学习方法
methodSearch.addEventListener('input', filterMethods);

// ============ 间隔复习提醒功能 ============

// 加载复习项目
function loadReviewItems() {
  try {
    reviewItems = ipcRenderer.sendSync('get-review-items') || [];
    renderReviewItems();
    updateHomeSummary(); // 更新首页学习计划
    
    // 初始化复习项目搜索和筛选
    initReviewItemsFilters();
  } catch (error) {
    console.error('获取复习项目失败:', error);
    reviewItems = [];
  }
}

// 初始化复习项目搜索和筛选功能
function initReviewItemsFilters() {
  if (reviewItemSearch) {
    reviewItemSearch.addEventListener('input', filterReviewItems);
  }
  
  if (reviewDifficultyFilter) {
    reviewDifficultyFilter.addEventListener('change', filterReviewItems);
  }
  
  if (reviewResetFilter) {
    reviewResetFilter.addEventListener('click', () => {
      if (reviewItemSearch) reviewItemSearch.value = '';
      if (reviewDifficultyFilter) reviewDifficultyFilter.value = 'all';
      filterReviewItems();
    });
  }
}

// 筛选复习项目
function filterReviewItems() {
  if (!reviewItemSearch || !reviewDifficultyFilter) return;
  
  const searchTerm = reviewItemSearch.value.trim().toLowerCase();
  const difficultyFilter = reviewDifficultyFilter.value;
  
  // 筛选项目
  const filteredItems = reviewItems.filter(item => {
    // 标题匹配
    const titleMatch = item.title.toLowerCase().includes(searchTerm);
    
    // 描述匹配
    const descMatch = item.description ? 
      item.description.toLowerCase().includes(searchTerm) : 
      false;
    
    // 难度匹配
    const difficultyMatch = difficultyFilter === 'all' || item.difficulty === difficultyFilter;
    
    return (titleMatch || descMatch) && difficultyMatch;
  });
  
  // 渲染筛选后的列表
  renderFilteredReviewItems(filteredItems);
}

// 渲染筛选后的复习项目列表
function renderFilteredReviewItems(filteredItems) {
  // 清空所有项目列表
  reviewItemsList.innerHTML = '';
  
  if (filteredItems.length === 0) {
    reviewItemsList.innerHTML = '<p class="empty-list-message">未找到匹配的学习项目</p>';
    return;
  }
  
  // 按首次学习日期排序
  const sortedItems = [...filteredItems].sort((a, b) => {
    return new Date(b.firstDate) - new Date(a.firstDate);
  });
  
  // 创建所有项目列表
  sortedItems.forEach(item => {
    const itemElement = createReviewItemElement(item, false);
    reviewItemsList.appendChild(itemElement);
  });
}

// 显示复习项目
function renderReviewItems() {
  renderTodayReviewList();
  renderAllReviewItems();
}

// 显示今日待复习列表
function renderTodayReviewList() {
  // 清空今日复习列表
  todayReviewList.innerHTML = '';
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // 找出今日需要复习的项目
  const todayItems = reviewItems.filter(item => {
    return item.reviewDates.some(dateStr => {
      const reviewDate = new Date(dateStr);
      reviewDate.setHours(0, 0, 0, 0);
      
      // 检查是否是今天，并且尚未完成
      return isSameDay(reviewDate, today) && 
             !item.completed.some(completedStr => {
                const completedDate = new Date(completedStr);
                return isSameDay(completedDate, today);
             });
    });
  });
  
  if (todayItems.length === 0) {
    todayReviewList.innerHTML = '<p class="empty-list-message">今日暂无复习项目</p>';
    return;
  }
  
  // 创建今日复习项目列表
  todayItems.forEach(item => {
    const itemElement = createReviewItemElement(item, true);
    todayReviewList.appendChild(itemElement);
  });
}

// 显示所有复习项目
function renderAllReviewItems() {
  // 清空所有项目列表
  reviewItemsList.innerHTML = '';
  
  if (reviewItems.length === 0) {
    reviewItemsList.innerHTML = '<p class="empty-list-message">暂无学习项目，请添加</p>';
    return;
  }
  
  // 按首次学习日期排序
  const sortedItems = [...reviewItems].sort((a, b) => {
    return new Date(b.firstDate) - new Date(a.firstDate);
  });
  
  // 创建所有项目列表
  sortedItems.forEach(item => {
    const itemElement = createReviewItemElement(item, false);
    reviewItemsList.appendChild(itemElement);
  });
}

// 创建复习项目元素
function createReviewItemElement(item, isToday) {
  const itemElement = document.createElement('div');
  itemElement.className = 'review-item';
  itemElement.setAttribute('data-id', item.id);
  
  let nextReviewDate = 'N/A';
  if (item.reviewDates.length > 0) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // 找到下一个复习日期
    for (const dateStr of item.reviewDates) {
      const reviewDate = new Date(dateStr);
      reviewDate.setHours(0, 0, 0, 0);
      
      // 判断是否已完成
      const isCompleted = item.completed.some(completedStr => {
        const completedDate = new Date(completedStr);
        return isSameDay(completedDate, reviewDate);
      });
      
      if (reviewDate >= today && !isCompleted) {
        nextReviewDate = formatDate(reviewDate);
        break;
      }
    }
  }
  
  // 获取难度对应的类名
  const difficultyClass = `difficulty-${item.difficulty}`;
  
  itemElement.innerHTML = `
    <div class="review-item-header">
      <div class="review-item-title">${item.title}</div>
      <div class="review-item-date">首次学习: ${formatDate(new Date(item.firstDate))}</div>
    </div>
    ${item.description ? `<div class="review-item-description">${item.description}</div>` : ''}
    <div class="review-item-status">
      <div class="review-item-difficulty ${difficultyClass}">
        难度: ${getDifficultyText(item.difficulty)}
      </div>
      <div class="review-item-next">
        ${isToday ? '今日待复习' : `下次复习: ${nextReviewDate}`}
      </div>
    </div>
  `;
  
  // 添加操作按钮
  const actionsDiv = document.createElement('div');
  actionsDiv.className = 'review-item-actions';
  
  if (isToday) {
    // 今日复习项目，添加完成按钮
    const completeBtn = document.createElement('button');
    completeBtn.textContent = '标记完成';
    completeBtn.addEventListener('click', (event) => {
      event.stopPropagation();
      completeReview(item.id);
    });
    
    actionsDiv.appendChild(completeBtn);
  } else {
    // 非今日复习项目，添加删除按钮
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = '删除';
    deleteBtn.className = 'delete-review-btn';
    deleteBtn.addEventListener('click', (event) => {
      event.stopPropagation();
      deleteReviewItem(item.id);
    });
    
    actionsDiv.appendChild(deleteBtn);
  }
  
  itemElement.appendChild(actionsDiv);
  
  return itemElement;
}

// 标记复习完成
function completeReview(itemId) {
  const item = reviewItems.find(item => item.id === itemId);
  if (!item) return;
  
  const today = new Date();
  item.completed.push(today.toISOString());
  
  ipcRenderer.send('save-review-item', item);
  
  // 重新渲染显示
  renderReviewItems();
  renderCalendar();
  updateHomeSummary(); // 更新首页学习计划
  
  showNotification('复习项目已标记为完成', 'success');
}

// 删除复习项目
async function deleteReviewItem(itemId) {
  // 使用自定义确认对话框
  const confirmed = await showConfirmDialog('确定要删除这个复习项目吗？此操作不可撤销。');
  
  if (confirmed) {
    try {
      // 通过IPC发送删除请求
      const success = ipcRenderer.sendSync('delete-review-item', itemId);
      
      if (success) {
        // 从内存中移除
        reviewItems = reviewItems.filter(item => item.id !== itemId);
        
        // 重新渲染
        renderReviewItems();
        renderCalendar();
        updateHomeSummary();
        
        // 确保所有输入元素可用
        setTimeout(() => {
          const inputs = document.querySelectorAll('#review-container input, #review-container textarea, #review-container select');
          inputs.forEach(input => {
            input.disabled = false;
            input.readOnly = false;
            if (input.style) {
              input.style.pointerEvents = 'auto';
              input.style.opacity = '1';
            }
          });
        }, 50);
        
        // 显示成功消息
        showNotification('复习项目已删除');
      } else {
        showNotification('删除失败，请重试', 'error');
      }
    } catch (error) {
      console.error('删除复习项目时出错:', error);
      showNotification('删除失败，请重试', 'error');
    }
  }
}

// 渲染日历
function renderCalendar() {
  // 清空日历网格
  calendarGrid.innerHTML = '';
  
  // 设置当前月份显示
  currentMonthDisplay.textContent = `${currentYear}年${currentMonth + 1}月`;
  
  // 获取当前月份的第一天
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  // 获取当前月份的最后一天
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
  
  // 获取当前月份第一天是星期几(0-6，0表示星期日)
  const firstDayOfWeek = firstDayOfMonth.getDay();
  
  // 创建星期标题
  const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
  weekdays.forEach(day => {
    const dayElement = document.createElement('div');
    dayElement.className = 'calendar-weekday';
    dayElement.textContent = day;
    calendarGrid.appendChild(dayElement);
  });
  
  // 创建上个月的占位天数
  for (let i = 0; i < firstDayOfWeek; i++) {
    const dayElement = document.createElement('div');
    dayElement.className = 'calendar-day disabled';
    calendarGrid.appendChild(dayElement);
  }
  
  // 获取今天的日期
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // 创建当月的天数
  for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
    const dayElement = document.createElement('div');
    dayElement.className = 'calendar-day';
    
    const dayDate = new Date(currentYear, currentMonth, i);
    
    // 如果是今天，添加today类
    if (isSameDay(dayDate, today)) {
      dayElement.classList.add('today');
    }
    
    // 如果这一天有复习项目，添加has-review类
    if (hasDayReview(dayDate)) {
      dayElement.classList.add('has-review');
    }
    
    dayElement.innerHTML = `<span class="calendar-day-number">${i}</span>`;
    calendarGrid.appendChild(dayElement);
  }
}

// 检查某一天是否有复习项目
function hasDayReview(date) {
  return reviewItems.some(item => {
    return item.reviewDates.some(dateStr => {
      const reviewDate = new Date(dateStr);
      return isSameDay(reviewDate, date);
    });
  });
}

// 切换月份
prevMonthBtn.addEventListener('click', () => {
  currentMonth--;
  if (currentMonth < 0) {
    currentMonth = 11;
    currentYear--;
  }
  renderCalendar();
});

nextMonthBtn.addEventListener('click', () => {
  currentMonth++;
  if (currentMonth > 11) {
    currentMonth = 0;
    currentYear++;
  }
  renderCalendar();
});

// ============ 辅助函数 ============

// 判断两个日期是否是同一天
function isSameDay(date1, date2) {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
}

// 格式化日期显示
function formatDate(date) {
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
}

// 获取难度文本
function getDifficultyText(difficulty) {
  switch (difficulty) {
    case 'easy':
      return '简单';
    case 'medium':
      return '中等';
    case 'hard':
      return '困难';
    default:
      return '未知';
  }
}

// 更新首页今日学习计划
function updateHomeSummary() {
  if (!summaryContent) return;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // 找出今日需要复习的项目
  const todayItems = reviewItems.filter(item => {
    return item.reviewDates.some(dateStr => {
      const reviewDate = new Date(dateStr);
      reviewDate.setHours(0, 0, 0, 0);
      
      // 检查是否是今天，并且尚未完成
      return isSameDay(reviewDate, today) && 
             !item.completed.some(completedStr => {
                const completedDate = new Date(completedStr);
                return isSameDay(completedDate, today);
             });
    });
  });
  
  if (todayItems.length === 0) {
    summaryContent.innerHTML = '<p>暂无学习计划，点击"复习提醒"添加你的第一个学习项目。</p>';
    return;
  }
  
  let html = '<ul class="home-plan-list">';
  todayItems.forEach(item => {
    html += `<li data-id="${item.id}">
      <span class="plan-title">${item.title}</span>
      <span class="plan-difficulty ${item.difficulty}">${getDifficultyText(item.difficulty)}</span>
    </li>`;
  });
  html += '</ul>';
  
  summaryContent.innerHTML = html;
  
  // 为每个计划项添加点击事件
  const planItems = summaryContent.querySelectorAll('.home-plan-list li');
  planItems.forEach(item => {
    item.addEventListener('click', handleHomePlanClick);
  });
}

// 处理首页学习计划项点击
function handleHomePlanClick(event) {
  const itemId = event.currentTarget.dataset.id;
  
  // 切换到复习提醒页面
  navButtons.forEach(btn => {
    if (btn.getAttribute('data-page') === 'review') {
      btn.click();
    }
  });
  
  // 确保切换到复习页面后添加高亮效果
  setTimeout(() => {
    // 在页面中查找并高亮显示相应的项目
    const reviewItem = document.querySelector(`.review-item[data-id="${itemId}"]`);
    if (reviewItem) {
      // 移除之前的高亮
      document.querySelectorAll('.review-item.highlighted').forEach(item => {
        item.classList.remove('highlighted');
      });
      
      // 添加高亮
      reviewItem.classList.add('highlighted');
      
      // 滚动到该项目
      reviewItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, 100);
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  // 加载设置
  loadSettings();
  
  // 加载会话计数
  const savedSessionCount = localStorage.getItem('sessionCount');
  if (savedSessionCount) {
    sessionCount = parseInt(savedSessionCount);
    sessionCounter.textContent = sessionCount;
  }
  
  // 初始化计时器显示
  updateTimerDisplay();
  
  // 为首次学习日期输入框设置默认值为今天
  if (itemFirstDateInput) {
    itemFirstDateInput.value = formatDate(new Date());
  }
  
  // 加载复习项目并更新首页
  loadReviewItems();
  
  // 如果当前页面是学习方法库，加载学习方法
  const activePage = document.querySelector('.page.active');
  if (activePage) {
    if (activePage.id === 'methods-page') {
      loadLearningMethods();
    } else if (activePage.id === 'review-page') {
      renderCalendar();
    }
  }
});

// 每天重置会话计数
const today = new Date().toDateString();
const lastDate = localStorage.getItem('lastDate');

if (lastDate !== today) {
  localStorage.setItem('lastDate', today);
  localStorage.setItem('sessionCount', '0');
  sessionCount = 0;
  sessionCounter.textContent = '0';
}

// ============ 笔记系统功能 ============

// 初始化笔记系统
function initNotesSystem() {
  console.log('初始化笔记系统');
  
  // 加载笔记
  loadNotes();
  
  // 确保事件只绑定一次
  if (!newNoteBtn.hasEventHandler) {
    // 创建新笔记
    newNoteBtn.addEventListener('click', createNewNote);
    newNoteBtn.hasEventHandler = true;
    
    // 保存笔记
    saveNoteBtn.addEventListener('click', saveNote);
    
    // 导出笔记
    exportNoteBtn.addEventListener('click', exportNote);
    
    // 删除笔记
    deleteNoteBtn.addEventListener('click', deleteNote);
    deleteNoteBtn.hasEventHandler = true;
    
    // 搜索笔记
    noteSearch.addEventListener('input', searchNotes);
    
    // 切换笔记模板
    noteTemplate.addEventListener('change', changeNoteTemplate);
    
    // 添加标签
    addTagBtn.addEventListener('click', addTag);
    tagInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addTag();
      }
    });
  }
  
  // 初始化后自动创建一个新笔记，提升用户体验
  setTimeout(() => {
    createNewNote();
    
    // 笔记输入自动创建功能
    autoCreateNoteOnInput();
  }, 100);
}

// 加载所有笔记
function loadNotes() {
  try {
    // 显示加载状态
    notesList.innerHTML = '<p class="loading-message">正在加载笔记...</p>';
    
    // 异步加载笔记
    setTimeout(() => {
      try {
        notes = ipcRenderer.sendSync('get-notes');
        console.log(`已加载${notes.length}条笔记`);
        renderNotesList();
      } catch (error) {
        console.error('加载笔记失败:', error);
        notesList.innerHTML = '<p class="error-message">加载笔记失败，请刷新页面重试</p>';
      }
    }, 50);
  } catch (error) {
    console.error('加载笔记错误:', error);
    notesList.innerHTML = '<p class="error-message">加载笔记出错</p>';
  }
}

// 创建新笔记
function createNewNote() {
  // 清空字段
  noteTitle.value = '';
  noteContent.value = '';
  cornellTitle.value = '';
  cornellDate.value = formatDate(new Date());
  cornellCuesContent.value = '';
  cornellNotesContent.value = '';
  cornellSummaryContent.value = '';
  
  // 重置标签
  currentTags = [];
  renderTags();
  
  // 默认显示普通编辑器
  noteTemplate.value = 'normal';
  document.querySelectorAll('.note-editor').forEach(editor => {
    editor.classList.remove('active');
  });
  normalEditor.classList.add('active');
  
  // 创建空笔记对象，确保ID是全新生成的
  const newId = Date.now();
  currentNote = {
    id: newId,
    title: '',
    content: '',
    type: 'normal',
    cornell: {
      title: '',
      date: formatDate(new Date()),
      cues: '',
      notes: '',
      summary: ''
    },
    tags: [],
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  // 设置日期
  if (cornellDate) {
    cornellDate.value = formatDate(new Date());
  }
  
  // 启用所有编辑区域
  noteTitle.disabled = false;
  noteContent.disabled = false;
  noteTemplate.disabled = false;
  saveNoteBtn.disabled = false;
  deleteNoteBtn.disabled = true; // 新笔记不能删除
  cornellTitle.disabled = false;
  cornellDate.disabled = false;
  cornellCuesContent.disabled = false;
  cornellNotesContent.disabled = false;
  cornellSummaryContent.disabled = false;
  tagInput.disabled = false;
  addTagBtn.disabled = false;
  
  console.log('创建新笔记，ID:', newId);
  
  // 强制聚焦到标题输入框
  setTimeout(() => {
    noteTitle.focus();
  }, 10);
}

// 保存笔记
function saveNote() {
  if (!currentNote) {
    console.error('当前没有笔记可保存');
    showNotification('保存失败，请重新创建笔记', 'error');
    return;
  }
  
  // 更新基本信息
  currentNote.title = noteTitle.value.trim();
  currentNote.updatedAt = new Date();
  currentNote.tags = [...currentTags];
  
  // 根据笔记类型更新内容
  if (currentNote.type === 'normal') {
    currentNote.content = noteContent.value.trim();
  } else if (currentNote.type === 'cornell') {
    currentNote.cornell.title = cornellTitle.value.trim();
    currentNote.cornell.date = cornellDate.value;
    currentNote.cornell.cues = cornellCuesContent.value.trim();
    currentNote.cornell.notes = cornellNotesContent.value.trim();
    currentNote.cornell.summary = cornellSummaryContent.value.trim();
  }
  
  // 显示保存中状态
  saveNoteBtn.disabled = true;
  saveNoteBtn.textContent = '保存中...';
  
  // 创建深拷贝，确保不会因引用导致覆盖问题
  const noteCopy = JSON.parse(JSON.stringify(currentNote));
  
  console.log('保存笔记，ID:', noteCopy.id);
  
  // 保存到主进程（异步方式）
  setTimeout(() => {
    try {
      const success = ipcRenderer.sendSync('save-note', noteCopy);
      
      if (success) {
        // 保存成功，更新当前笔记ID以避免覆盖
        currentNote.id = noteCopy.id;
        
        // 更新笔记列表
        loadNotes();
        
        // 显示保存成功提示
        showNotification('笔记已保存');
      } else {
        showNotification('保存失败，请重试', 'error');
      }
    } catch (error) {
      console.error('保存笔记出错:', error);
      showNotification('保存出错，请重试', 'error');
    } finally {
      // 恢复按钮状态
      saveNoteBtn.disabled = false;
      saveNoteBtn.textContent = '保存';
    }
  }, 100);
}

// 删除笔记
async function deleteNote() {
  if (!currentNote) {
    showNotification('没有选择的笔记', 'error');
    return;
  }

  const confirmed = await showConfirmDialog('确定要删除这个笔记吗？此操作不可撤销。');
  
  if (confirmed) {
    try {
      // 显示删除中状态
      deleteNoteBtn.disabled = true;
      deleteNoteBtn.textContent = '删除中...';
      
      // 通过IPC发送删除请求
      const success = ipcRenderer.sendSync('delete-note', currentNote.id);
      
      if (success) {
        // 删除成功，创建新笔记
        currentNote = null;
        createNewNote();
        
        // 重新加载笔记列表
        loadNotes();
        
        // 手动确保所有输入元素可用
        setTimeout(() => {
          const editorInputs = document.querySelectorAll('#notes-container input, #notes-container textarea, #notes-container select');
          editorInputs.forEach(input => {
            input.disabled = false;
            input.readOnly = false;
            if (input.style) {
              input.style.pointerEvents = 'auto';
              input.style.opacity = '1';
            }
          });
          
          // 尝试聚焦标题输入框
          if (noteTitle) {
            noteTitle.focus();
            noteTitle.blur(); // 强制浏览器重新评估焦点
          }
        }, 50);
        
        // 显示成功消息
        showNotification('笔记已删除');
      } else {
        showNotification('删除失败，请重试', 'error');
      }
    } catch (error) {
      console.error('删除笔记时出错:', error);
      showNotification('删除笔记失败，请重试', 'error');
    } finally {
      // 恢复按钮状态
      deleteNoteBtn.disabled = false;
      deleteNoteBtn.textContent = '删除';
    }
  }
}

// 渲染笔记列表
function renderNotesList(filteredNotes = null) {
  // 清空列表
  notesList.innerHTML = '';
  
  // 获取要显示的笔记
  const notesToRender = filteredNotes || notes;
  
  // 如果没有笔记，显示空消息
  if (notesToRender.length === 0) {
    notesList.innerHTML = '<p class="empty-list-message">暂无笔记，点击"新建笔记"创建</p>';
    return;
  }
  
  // 按更新时间排序（最新的在前面）
  const sortedNotes = [...notesToRender].sort((a, b) => {
    return new Date(b.updatedAt) - new Date(a.updatedAt);
  });
  
  // 渲染每个笔记
  sortedNotes.forEach(note => {
    const noteElement = document.createElement('div');
    noteElement.className = 'note-item';
    noteElement.dataset.id = note.id;
    
    // 格式化日期
    const date = new Date(note.updatedAt);
    const formattedDate = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
    
    // 笔记标题（如果没有标题则显示"无标题笔记"）
    const title = note.title || '无标题笔记';
    
    // 笔记预览内容
    let preview = '';
    if (note.type === 'normal') {
      preview = note.content.substring(0, 60) + (note.content.length > 60 ? '...' : '');
    } else if (note.type === 'cornell') {
      preview = note.cornell.notes.substring(0, 60) + (note.cornell.notes.length > 60 ? '...' : '');
    }
    
    // 构建HTML
    noteElement.innerHTML = `
      <div class="note-item-header">
        <h4 class="note-item-title">${title}</h4>
        <span class="note-item-date">${formattedDate}</span>
      </div>
      <p class="note-item-preview">${preview}</p>
      <div class="note-item-footer">
        <span class="note-item-type">${note.type === 'normal' ? '普通笔记' : '康奈尔笔记'}</span>
        ${note.tags.length > 0 ? `<span class="note-item-tags">${note.tags.slice(0, 2).join(', ')}${note.tags.length > 2 ? ' ...' : ''}</span>` : ''}
      </div>
    `;
    
    // 点击笔记项打开编辑
    noteElement.addEventListener('click', () => {
      openNote(note);
    });
    
    notesList.appendChild(noteElement);
  });
}

// 打开笔记
function openNote(note) {
  currentNote = note;
  currentTags = [...note.tags];
  
  // 设置基本信息
  noteTitle.value = note.title || '';
  
  // 设置笔记模板
  noteTemplate.value = note.type;
  changeNoteTemplate();
  
  // 根据笔记类型填充内容
  if (note.type === 'normal') {
    noteContent.value = note.content || '';
  } else if (note.type === 'cornell') {
    cornellTitle.value = note.cornell.title || '';
    cornellDate.value = note.cornell.date || formatDate(new Date());
    cornellCuesContent.value = note.cornell.cues || '';
    cornellNotesContent.value = note.cornell.notes || '';
    cornellSummaryContent.value = note.cornell.summary || '';
  }
  
  // 渲染标签
  renderTags();
  
  // 启用编辑器
  enableEditor();
}

// 切换笔记模板
function changeNoteTemplate() {
  if (!currentNote) return;
  
  const selectedTemplate = noteTemplate.value;
  currentNote.type = selectedTemplate;
  
  // 隐藏所有编辑器
  document.querySelectorAll('.note-editor').forEach(editor => {
    editor.classList.remove('active');
  });
  
  // 显示选中的编辑器
  if (selectedTemplate === 'normal') {
    normalEditor.classList.add('active');
  } else if (selectedTemplate === 'cornell') {
    cornellEditor.classList.add('active');
  }
}

// 重置编辑器
function resetEditor() {
  // 清空字段
  noteTitle.value = '';
  noteContent.value = '';
  cornellTitle.value = '';
  cornellDate.value = formatDate(new Date());
  cornellCuesContent.value = '';
  cornellNotesContent.value = '';
  cornellSummaryContent.value = '';
  
  // 重置当前笔记（关键修改：完全置为null，确保后续操作不会复用）
  currentNote = null;
  
  // 重置标签
  currentTags = [];
  renderTags();
  
  // 默认显示普通编辑器
  noteTemplate.value = 'normal';
  document.querySelectorAll('.note-editor').forEach(editor => {
    editor.classList.remove('active');
  });
  normalEditor.classList.add('active');
  
  // 重新启用基本元素（关键修改：确保新建笔记能力）
  noteTitle.disabled = false;
  noteContent.disabled = false;
  noteTemplate.disabled = false;
  saveNoteBtn.disabled = false;
  deleteNoteBtn.disabled = true; // 新笔记不能删除
  cornellTitle.disabled = false;
  cornellDate.disabled = false;
  cornellCuesContent.disabled = false;
  cornellNotesContent.disabled = false;
  cornellSummaryContent.disabled = false;
  tagInput.disabled = false;
  addTagBtn.disabled = false;
}

// 启用编辑器
function enableEditor() {
  noteTitle.disabled = false;
  noteContent.disabled = false;
  noteTemplate.disabled = false;
  saveNoteBtn.disabled = false;
  deleteNoteBtn.disabled = currentNote && currentNote.id ? false : true;
  cornellTitle.disabled = false;
  cornellDate.disabled = false;
  cornellCuesContent.disabled = false;
  cornellNotesContent.disabled = false;
  cornellSummaryContent.disabled = false;
  tagInput.disabled = false;
  addTagBtn.disabled = false;
}

// 禁用编辑器
function disableEditor() {
  noteTitle.disabled = true;
  noteContent.disabled = true;
  noteTemplate.disabled = true;
  saveNoteBtn.disabled = true;
  deleteNoteBtn.disabled = true;
  cornellTitle.disabled = true;
  cornellDate.disabled = true;
  cornellCuesContent.disabled = true;
  cornellNotesContent.disabled = true;
  cornellSummaryContent.disabled = true;
  tagInput.disabled = true;
  addTagBtn.disabled = true;
}

// 搜索笔记
function searchNotes() {
  const query = noteSearch.value.toLowerCase().trim();
  
  if (!query) {
    renderNotesList();
    return;
  }
  
  const filteredNotes = notes.filter(note => {
    // 搜索标题
    if (note.title.toLowerCase().includes(query)) return true;
    
    // 搜索内容
    if (note.type === 'normal' && note.content.toLowerCase().includes(query)) return true;
    
    // 搜索康奈尔笔记内容
    if (note.type === 'cornell') {
      if (note.cornell.title.toLowerCase().includes(query)) return true;
      if (note.cornell.cues.toLowerCase().includes(query)) return true;
      if (note.cornell.notes.toLowerCase().includes(query)) return true;
      if (note.cornell.summary.toLowerCase().includes(query)) return true;
    }
    
    // 搜索标签
    if (note.tags.some(tag => tag.toLowerCase().includes(query))) return true;
    
    return false;
  });
  
  renderNotesList(filteredNotes);
}

// 添加标签
function addTag() {
  const tag = tagInput.value.trim();
  
  if (!tag) return;
  
  // 检查是否已存在该标签
  if (currentTags.includes(tag)) {
    showNotification('标签已存在', 'error');
    return;
  }
  
  // 添加标签
  currentTags.push(tag);
  
  // 清空输入框
  tagInput.value = '';
  
  // 渲染标签
  renderTags();
}

// 删除标签
function removeTag(tag) {
  const index = currentTags.indexOf(tag);
  if (index !== -1) {
    currentTags.splice(index, 1);
    renderTags();
  }
}

// 渲染标签
function renderTags() {
  tagsList.innerHTML = '';
  
  if (currentTags.length === 0) {
    tagsList.innerHTML = '<p class="empty-tags">暂无标签</p>';
    return;
  }
  
  currentTags.forEach(tag => {
    const tagElement = document.createElement('span');
    tagElement.className = 'tag';
    tagElement.textContent = tag;
    
    const removeButton = document.createElement('button');
    removeButton.className = 'remove-tag';
    removeButton.textContent = 'x';
    removeButton.addEventListener('click', (e) => {
      e.stopPropagation();
      removeTag(tag);
    });
    
    tagElement.appendChild(removeButton);
    tagsList.appendChild(tagElement);
  });
}

// 导出笔记
function exportNote() {
  if (!currentNote) {
    showNotification('请先保存或选择笔记', 'error');
    return;
  }
  
  // 创建导出格式选择对话框
  const formatDialog = document.createElement('div');
  formatDialog.className = 'custom-dialog';
  
  formatDialog.innerHTML = `
    <div class="dialog-content">
      <h3 class="dialog-title">选择导出方式</h3>
      <div class="dialog-message">
        <p style="margin-bottom: 10px;">选择适合您设备的导出方式：</p>
        
        <div style="margin-bottom: 15px;">
          <h4 style="font-size: 14px; margin-bottom: 8px;">文件格式</h4>
          <div style="margin-bottom: 8px;">
            <input type="radio" id="format-txt" name="format" value="txt" checked>
            <label for="format-txt">文本文件 (.txt)</label>
          </div>
          <div style="margin-bottom: 8px;">
            <input type="radio" id="format-md" name="format" value="md">
            <label for="format-md">Markdown文件 (.md)</label>
          </div>
          <div>
            <input type="radio" id="format-html" name="format" value="html">
            <label for="format-html">HTML文件 (.html) - 适合移动设备</label>
          </div>
        </div>
        
        <div style="margin-bottom: 15px;">
          <h4 style="font-size: 14px; margin-bottom: 8px;">导出方式</h4>
          <div style="margin-bottom: 8px;">
            <input type="radio" id="export-save" name="export-method" value="save" checked>
            <label for="export-save">保存到设备</label>
          </div>
          <div>
            <input type="radio" id="export-copy" name="export-method" value="copy">
            <label for="export-copy">复制到剪贴板（可粘贴到其他应用）</label>
          </div>
        </div>
      </div>
      <div class="dialog-buttons">
        <button class="dialog-cancel-btn">取消</button>
        <button class="dialog-confirm-btn">导出</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(formatDialog);
  formatDialog.style.display = 'flex';
  
  // 绑定事件
  const cancelBtn = formatDialog.querySelector('.dialog-cancel-btn');
  const confirmBtn = formatDialog.querySelector('.dialog-confirm-btn');
  
  cancelBtn.addEventListener('click', () => {
    formatDialog.style.display = 'none';
    setTimeout(() => formatDialog.remove(), 300);
  });
  
  confirmBtn.addEventListener('click', () => {
    const formatRadio = formatDialog.querySelector('input[name="format"]:checked');
    const format = formatRadio ? formatRadio.value : 'txt';
    
    const methodRadio = formatDialog.querySelector('input[name="export-method"]:checked');
    const exportMethod = methodRadio ? methodRadio.value : 'save';
    
    formatDialog.style.display = 'none';
    setTimeout(() => formatDialog.remove(), 300);
    
    // 获取文件名（基于笔记标题）
    let fileName = (currentNote.title || '无标题笔记').replace(/[\\/:*?"<>|]/g, '_');
    
    if (exportMethod === 'copy') {
      // 复制到剪贴板
      const content = ipcRenderer.sendSync('get-note-content', { 
        note: currentNote, 
        format
      });
      
      if (content) {
        navigator.clipboard.writeText(content)
          .then(() => {
            showNotification(`笔记内容已复制到剪贴板`);
          })
          .catch(err => {
            console.error('复制失败:', err);
            showNotification('复制失败，请重试', 'error');
          });
      } else {
        showNotification('生成内容失败，请重试', 'error');
      }
    } else {
      // 保存到文件
      // 显示保存对话框
      const defaultPath = `${fileName}.${format}`;
      let filters;
      
      switch(format) {
        case 'txt':
          filters = [{ name: '文本文件', extensions: ['txt'] }];
          break;
        case 'md':
          filters = [{ name: 'Markdown文件', extensions: ['md'] }];
          break;
        case 'html':
          filters = [{ name: 'HTML文件', extensions: ['html'] }];
          break;
        default:
          filters = [{ name: '文本文件', extensions: ['txt'] }];
      }
      
      const filePath = ipcRenderer.sendSync('show-save-dialog', { defaultPath, filters });
      
      if (filePath) {
        // 执行导出
        const success = ipcRenderer.sendSync('export-note', { 
          note: currentNote, 
          format, 
          filePath 
        });
        
        if (success) {
          showNotification(`笔记已导出为${format.toUpperCase()}格式`);
        } else {
          showNotification('导出失败，请重试', 'error');
        }
      }
    }
  });
}

// 显示通知
function showNotification(message, type = 'success') {
  // 创建通知元素
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  
  // 添加到页面
  document.body.appendChild(notification);
  
  // 2秒后移除
  setTimeout(() => {
    notification.classList.add('fade-out');
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 300);
  }, 2000);
}

// 输入自动创建笔记
function autoCreateNoteOnInput() {
  // 如果当前没有活动笔记，但用户开始输入，则自动创建新笔记
  if (!currentNote && !noteTitle.disabled) {
    console.log('检测到输入，自动创建新笔记');
    createNewNote();
    return true;
  }
  return false;
}

// 添加输入事件监听以提升用户体验
window.addEventListener('DOMContentLoaded', () => {
  // 其他DOMContentLoaded代码...

  // 监听所有笔记编辑输入框，在用户首次输入时自动创建笔记
  const inputFields = [noteTitle, noteContent, cornellTitle, cornellDate, 
                     cornellCuesContent, cornellNotesContent, cornellSummaryContent];
  
  inputFields.forEach(field => {
    if (field) {
      field.addEventListener('focus', () => {
        autoCreateNoteOnInput();
      });
      
      field.addEventListener('input', () => {
        autoCreateNoteOnInput();
      });
    }
  });
});

// 初始化笔记系统
window.addEventListener('DOMContentLoaded', () => {
  let notesInitialized = false;
  
  // 当用户点击笔记页面时初始化
  navButtons.forEach(button => {
    if (button.getAttribute('data-page') === 'notes') {
      button.addEventListener('click', () => {
        if (!notesInitialized) {
          initNotesSystem();
          notesInitialized = true;
        }
      });
    }
  });
  
  // 如果用户直接通过操作按钮进入笔记页面
  actionButtons.forEach(button => {
    if (button.getAttribute('data-action') === 'new-note') {
      button.addEventListener('click', () => {
        if (!notesInitialized) {
          initNotesSystem();
          notesInitialized = true;
        } else {
          // 如果已初始化，直接创建新笔记
          createNewNote();
        }
      });
    }
  });
});

// 添加事件监听器
if (methodEditForm) {
  methodEditForm.addEventListener('submit', saveMethod);
}

if (closeEditModal) {
  closeEditModal.addEventListener('click', closeMethodEditModal);
}

if (cancelEditBtn) {
  cancelEditBtn.addEventListener('click', closeMethodEditModal);
}

if (deleteMethodBtn) {
  deleteMethodBtn.addEventListener('click', deleteMethod);
}

// 添加复习项目
reviewForm.addEventListener('submit', (event) => {
  event.preventDefault();
  
  const title = itemTitleInput.value.trim();
  const description = itemDescriptionInput.value.trim();
  const firstDate = new Date(itemFirstDateInput.value);
  const difficulty = itemDifficultySelect.value;
  
  if (!title || !firstDate) {
    alert('请填写项目名称和首次学习日期');
    return;
  }
  
  const newItem = {
    id: Date.now().toString(),
    title,
    description,
    firstDate: firstDate.toISOString(),
    difficulty,
    reviewDates: generateReviewDates(firstDate, difficulty),
    completed: []
  };
  
  ipcRenderer.send('save-review-item', newItem);
  reviewItems.push(newItem);
  
  // 清空表单
  reviewForm.reset();
  
  // 更新显示
  renderReviewItems();
  renderCalendar();
  updateHomeSummary(); // 更新首页学习计划
});

// 生成复习日期
function generateReviewDates(firstDate, difficulty) {
  // 艾宾浩斯间隔: 1, 3, 7, 14, 30 天
  const intervals = [1, 3, 7, 14, 30];
  
  // 根据难度调整间隔
  if (difficulty === 'easy') {
    // 简单的内容，间隔时间延长
    intervals.forEach((_, index) => {
      intervals[index] = Math.round(intervals[index] * 1.5);
    });
  } else if (difficulty === 'hard') {
    // 困难的内容，间隔时间缩短
    intervals.forEach((_, index) => {
      intervals[index] = Math.round(intervals[index] * 0.7);
    });
  }
  
  const reviewDates = [];
  const firstDateCopy = new Date(firstDate);
  
  intervals.forEach(interval => {
    const reviewDate = new Date(firstDateCopy);
    reviewDate.setDate(reviewDate.getDate() + interval);
    reviewDates.push(reviewDate.toISOString());
  });
  
  return reviewDates;
}

// ============ 学习计划定制功能 ============

// DOM元素
const planForm = document.getElementById('plan-form');
const planSubject = document.getElementById('plan-subject');
const planGoal = document.getElementById('plan-goal');
const planTime = document.getElementById('plan-time');
const planDeadline = document.getElementById('plan-deadline');
const planLevel = document.getElementById('plan-level');
const planLearningStyle = document.getElementById('plan-learning-style');
const generatedPlan = document.getElementById('generated-plan');
const planSummaryGoal = document.getElementById('plan-summary-goal');
const planRecommendedMethods = document.getElementById('plan-recommended-methods');
const planScheduleContent = document.getElementById('plan-schedule-content');
const planMilestonesContent = document.getElementById('plan-milestones-content');
const planResourcesContent = document.getElementById('plan-resources-content');
const planActions = document.getElementById('plan-actions') || document.querySelector('.plan-actions');
const savePlanButton = document.getElementById('save-plan');
const printPlanButton = document.getElementById('print-plan');
const createNewPlanButton = document.getElementById('create-new-plan');
const savedPlansList = document.getElementById('saved-plans-list');

// 当前显示的计划
let currentPlan = null;

// 初始化学习计划页面
function initPlanPage() {
  // 设置今天的日期为最小日期
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];
  planDeadline.min = dateStr;
  
  // 添加表单提交事件
  if (planForm) {
    planForm.addEventListener('submit', generateLearningPlan);
  }
  
  // 添加按钮事件
  if (savePlanButton) {
    savePlanButton.addEventListener('click', saveLearningPlan);
  }
  
  if (printPlanButton) {
    printPlanButton.addEventListener('click', exportLearningPlan);
  }
  
  if (createNewPlanButton) {
    createNewPlanButton.addEventListener('click', createNewLearningPlan);
  }
  
  // 加载已保存的学习计划
  loadSavedPlans();
}

// 生成学习计划
function generateLearningPlan(e) {
  if (e) e.preventDefault();
  
  try {
    // 获取表单数据
    const subject = planSubject.value;
    const goal = planGoal.value;
    const weeklyTime = parseInt(planTime.value);
    const deadline = planDeadline.value ? new Date(planDeadline.value) : null;
    const level = planLevel.value;
    const learningStyle = planLearningStyle.value;
    
    // 验证表单数据
    if (!subject || !goal || isNaN(weeklyTime) || weeklyTime <= 0) {
      showNotification('请完整填写学习计划信息', 'error');
      return;
    }
    
    // 根据主题和目标找到最匹配的学习方法
    const recommendedMethods = findRecommendedMethods(subject, goal, level, learningStyle);
    
    // 确保即使没有找到方法也能继续
    if (!recommendedMethods || recommendedMethods.length === 0) {
      console.warn('未找到推荐学习方法，使用默认方法');
      // 创建一个默认方法
      recommendedMethods = [{
        name: '自定义学习方法',
        shortDescription: '根据您的学习主题自定义内容',
        category: '通用',
        difficulty: '中等',
        fullDescription: '这是一个自动生成的学习方法。请根据您的学习目标自定义具体内容。'
      }];
    }
    
    // 创建当前计划对象，确保包含推荐方法
    currentPlan = {
      id: Date.now().toString(),
      subject,
      goal,
      weeklyTime,
      deadline: planDeadline.value,
      level,
      learningStyle,
      createdAt: new Date().toISOString(),
      recommendedMethods: recommendedMethods
    };
    
    // 显示学习目标摘要
    planSummaryGoal.textContent = goal;
    
    // 显示推荐的学习方法
    displayRecommendedMethods(recommendedMethods);
    
    // 生成学习时间表
    generateSchedule(weeklyTime, recommendedMethods);
    
    // 生成学习里程碑
    generateMilestones(deadline, level);
    
    // 生成学习资源
    generateResources(subject, level);
    
    // 显示生成的计划
    if (planForm && planForm.parentElement) {
      planForm.parentElement.style.display = 'none';
    }
    if (generatedPlan) {
      generatedPlan.style.display = 'block';
    }
    
    // 显示成功消息
    showNotification('学习计划已生成');
    
  } catch (error) {
    console.error('生成学习计划时出错:', error);
    showNotification('生成学习计划失败，请重试', 'error');
  }
}

// 加载已保存的学习计划
function loadSavedPlans() {
  if (!savedPlansList) return;
  
  // 从localStorage获取保存的计划
  const savedPlans = JSON.parse(localStorage.getItem('learningPlans') || '[]');
  
  // 清空列表
  savedPlansList.innerHTML = '';
  
  if (savedPlans.length === 0) {
    savedPlansList.innerHTML = '<p class="empty-list-message">暂无保存的学习计划</p>';
    return;
  }
  
  // 按创建时间倒序排列
  savedPlans.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  // 显示已保存的计划
  savedPlans.forEach(plan => {
    const planElement = document.createElement('div');
    planElement.className = 'saved-plan-item';
    planElement.setAttribute('data-id', plan.id);
    
    // 格式化日期
    const createdDate = new Date(plan.createdAt);
    const formattedDate = `${createdDate.getFullYear()}/${(createdDate.getMonth() + 1).toString().padStart(2, '0')}/${createdDate.getDate().toString().padStart(2, '0')}`;
    
    // 计划内容
    planElement.innerHTML = `
      <div class="saved-plan-title">${plan.subject}</div>
      <div class="saved-plan-goal">${plan.goal}</div>
      <div class="saved-plan-meta">
        <span>每周${plan.weeklyTime}小时</span>
        <span class="saved-plan-date">${formattedDate}</span>
      </div>
      <div class="saved-plan-actions">
        <button class="view-plan-btn">查看</button>
        <button class="delete-plan-btn">删除</button>
      </div>
    `;
    
    // 添加查看按钮事件
    planElement.querySelector('.view-plan-btn').addEventListener('click', () => {
      viewSavedPlan(plan);
    });
    
    // 添加删除按钮事件
    planElement.querySelector('.delete-plan-btn').addEventListener('click', (e) => {
      e.stopPropagation(); // 防止触发父元素的点击事件
      deleteSavedPlan(plan.id, e);
    });
    
    savedPlansList.appendChild(planElement);
  });
}

// 查看已保存的学习计划
function viewSavedPlan(plan) {
  try {
    // 确保plan对象有效
    if (!plan || !plan.id) {
      showNotification('学习计划数据无效', 'error');
      return;
    }
    
    // 设置当前计划，创建深拷贝以避免修改原始数据
    currentPlan = JSON.parse(JSON.stringify(plan));
    
    // 填充表单数据（方便用户修改）
    if (planSubject) planSubject.value = plan.subject || '';
    if (planGoal) planGoal.value = plan.goal || '';
    if (planTime) planTime.value = plan.weeklyTime || 10;
    if (planDeadline) planDeadline.value = plan.deadline || '';
    if (planLevel) planLevel.value = plan.level || 'intermediate';
    if (planLearningStyle) planLearningStyle.value = plan.learningStyle || 'visual';
    
    // 检查并确保推荐方法数组存在
    if (!currentPlan.recommendedMethods || !Array.isArray(currentPlan.recommendedMethods) || currentPlan.recommendedMethods.length === 0) {
      // 重新生成推荐方法
      currentPlan.recommendedMethods = findRecommendedMethods(
        currentPlan.subject, 
        currentPlan.goal, 
        currentPlan.level, 
        currentPlan.learningStyle
      );
    }
    
    // 显示学习目标摘要
    if (planSummaryGoal) {
      planSummaryGoal.textContent = currentPlan.goal || '';
    }
    
    // 显示推荐的学习方法
    if (planRecommendedMethods) {
      displayRecommendedMethods(currentPlan.recommendedMethods);
    }
    
    // 生成学习时间表
    if (planScheduleContent) {
      generateSchedule(currentPlan.weeklyTime, currentPlan.recommendedMethods);
    }
    
    // 生成学习里程碑
    if (planMilestonesContent) {
      const deadline = currentPlan.deadline ? new Date(currentPlan.deadline) : null;
      generateMilestones(deadline, currentPlan.level);
    }
    
    // 生成学习资源
    if (planResourcesContent) {
      generateResources(currentPlan.subject, currentPlan.level);
    }
    
    // 显示生成的计划
    if (planForm && planForm.parentElement) {
      planForm.parentElement.style.display = 'none';
    }
    if (generatedPlan) {
      generatedPlan.style.display = 'block';
    }
    
    // 添加返回按钮
    const addReturnButton = () => {
      // 先移除可能已存在的返回按钮
      if (planActions) {
        const existingReturnButtons = planActions.querySelectorAll('button');
        existingReturnButtons.forEach(btn => {
          if (btn.textContent === '返回计划列表') {
            btn.remove();
          }
        });
      }
      
      const returnButton = document.createElement('button');
      returnButton.className = 'secondary-btn';
      returnButton.textContent = '返回计划列表';
      returnButton.style.marginRight = '10px';
      
      returnButton.addEventListener('click', () => {
        // 移除返回按钮
        if (planActions && planActions.contains(returnButton)) {
          planActions.removeChild(returnButton);
        }
        
        // 隐藏生成的计划，显示计划列表
        if (generatedPlan) generatedPlan.style.display = 'none';
        if (planForm && planForm.parentElement) planForm.parentElement.style.display = 'block';
        
        // 重置当前计划
        currentPlan = null;
        
        // 重置表单
        if (planForm) planForm.reset();
        
        // 确保所有表单元素可用
        if (planForm) {
          Array.from(planForm.elements).forEach(element => {
            element.disabled = false;
          });
        }
      });
      
      // 添加到操作按钮区域前面
      if (planActions) {
        planActions.insertBefore(returnButton, planActions.firstChild);
      }
    };
    
    // 执行添加返回按钮
    addReturnButton();
    
  } catch (error) {
    console.error('查看学习计划时出错:', error);
    showNotification('查看学习计划失败', 'error');
    
    // 出错时恢复到表单视图
    if (planForm && planForm.parentElement) planForm.parentElement.style.display = 'block';
    if (generatedPlan) generatedPlan.style.display = 'none';
  }
}

// 删除已保存的学习计划
async function deleteSavedPlan(planId, event) {
  // 阻止事件冒泡和默认行为
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }
  
  // 使用自定义确认对话框
  const confirmed = await showConfirmDialog('确定要删除这个学习计划吗？');
  
  if (!confirmed) {
    return;
  }
  
  try {
    // 从localStorage获取保存的计划
    const savedPlans = JSON.parse(localStorage.getItem('learningPlans') || '[]');
    
    // 保存当前计划的引用，以便后续比较
    const isCurrentPlanDeleted = currentPlan && currentPlan.id === planId;
    
    // 过滤掉要删除的计划
    const updatedPlans = savedPlans.filter(plan => plan.id !== planId);
    
    // 更新localStorage
    localStorage.setItem('learningPlans', JSON.stringify(updatedPlans));
    
    // 如果删除的是当前显示的计划，则重置UI
    if (isCurrentPlanDeleted) {
      // 重置当前计划
      currentPlan = null;
      
      // 确保返回到表单视图
      if (generatedPlan) generatedPlan.style.display = 'none';
      if (planForm && planForm.parentElement) planForm.parentElement.style.display = 'block';
      
      // 重置表单
      if (planForm) {
        planForm.reset();
        
        // 确保所有表单元素可用
        setTimeout(() => {
          Array.from(planForm.elements).forEach(element => {
            element.disabled = false;
            
            // 特别处理特定类型的输入
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA' || element.tagName === 'SELECT') {
              element.readOnly = false;
              if (element.style) {
                element.style.pointerEvents = 'auto';
                element.style.opacity = '1';
              }
            }
          });
          
          // 尝试聚焦第一个输入框
          const firstInput = planForm.querySelector('input, textarea, select');
          if (firstInput) {
            firstInput.focus();
            firstInput.blur(); // 强制浏览器重新评估焦点
          }
        }, 50);
      }
    }
    
    // 重新加载计划列表
    loadSavedPlans();
    
    // 显示删除成功通知
    showNotification('学习计划已删除');
  } catch (error) {
    console.error('删除学习计划时出错:', error);
    showNotification('删除学习计划失败', 'error');
  }
}

// 保存学习计划
function saveLearningPlan() {
  if (!currentPlan) {
    showNotification('请先生成学习计划', 'error');
    return;
  }
  
  try {
    // 确保currentPlan包含所有必要的属性
    if (!currentPlan.recommendedMethods || !Array.isArray(currentPlan.recommendedMethods)) {
      currentPlan.recommendedMethods = findRecommendedMethods(
        currentPlan.subject,
        currentPlan.goal,
        currentPlan.level,
        currentPlan.learningStyle
      );
    }
    
    // 从localStorage获取保存的计划
    const savedPlans = JSON.parse(localStorage.getItem('learningPlans') || '[]');
    
    // 检查计划是否已存在
    const existingPlanIndex = savedPlans.findIndex(plan => plan.id === currentPlan.id);
    
    if (existingPlanIndex >= 0) {
      // 更新已存在的计划
      savedPlans[existingPlanIndex] = JSON.parse(JSON.stringify(currentPlan));
    } else {
      // 添加新计划
      savedPlans.push(JSON.parse(JSON.stringify(currentPlan)));
    }
    
    // 更新localStorage
    localStorage.setItem('learningPlans', JSON.stringify(savedPlans));
    
    // 重新加载计划列表
    loadSavedPlans();
    
    showNotification('学习计划已保存！');
  } catch (error) {
    console.error('保存学习计划失败:', error);
    showNotification('保存学习计划失败', 'error');
  }
}

// 创建新学习计划
function createNewLearningPlan() {
  // 重置当前计划
  currentPlan = null;
  
  // 重置表单
  planForm.reset();
  
  // 切换显示
  planForm.parentElement.style.display = 'block';
  generatedPlan.style.display = 'none';
}

// 执行初始化
document.addEventListener('DOMContentLoaded', () => {
  initPlanPage();
});

// 补充打印学习计划功能，改为导出功能（已废弃，保留为兼容性考虑）
function printLearningPlan() {
  // 该函数已被废弃，改用exportLearningPlan函数来导出计划
  // 为了兼容性，调用新函数
  exportLearningPlan();
}

// 导出学习计划到本地文件
function exportLearningPlan() {
  if (!currentPlan) {
    showNotification('请先生成学习计划', 'error');
    return;
  }
  
  // 创建导出格式选择对话框
  const formatDialog = document.createElement('div');
  formatDialog.className = 'custom-dialog';
  
  formatDialog.innerHTML = `
    <div class="dialog-content">
      <h3 class="dialog-title">选择导出方式</h3>
      <div class="dialog-message">
        <p style="margin-bottom: 10px;">选择适合您设备的导出方式：</p>
        
        <div style="margin-bottom: 15px;">
          <h4 style="font-size: 14px; margin-bottom: 8px;">文件格式</h4>
          <div style="margin-bottom: 8px;">
            <input type="radio" id="format-txt" name="format" value="txt" checked>
            <label for="format-txt">文本文件 (.txt)</label>
          </div>
          <div style="margin-bottom: 8px;">
            <input type="radio" id="format-md" name="format" value="md">
            <label for="format-md">Markdown文件 (.md)</label>
          </div>
        </div>
        
        <div style="margin-bottom: 15px;">
          <h4 style="font-size: 14px; margin-bottom: 8px;">导出方式</h4>
          <div style="margin-bottom: 8px;">
            <input type="radio" id="export-save" name="export-method" value="save" checked>
            <label for="export-save">保存到设备</label>
          </div>
          <div>
            <input type="radio" id="export-copy" name="export-method" value="copy">
            <label for="export-copy">复制到剪贴板（可粘贴到其他应用）</label>
          </div>
        </div>
      </div>
      <div class="dialog-buttons">
        <button class="dialog-cancel-btn">取消</button>
        <button class="dialog-confirm-btn">导出</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(formatDialog);
  formatDialog.style.display = 'flex';
  
  // 绑定事件
  const cancelBtn = formatDialog.querySelector('.dialog-cancel-btn');
  const confirmBtn = formatDialog.querySelector('.dialog-confirm-btn');
  
  cancelBtn.addEventListener('click', () => {
    formatDialog.style.display = 'none';
    setTimeout(() => formatDialog.remove(), 300);
  });
  
  confirmBtn.addEventListener('click', () => {
    const formatRadio = formatDialog.querySelector('input[name="format"]:checked');
    const format = formatRadio ? formatRadio.value : 'txt';
    
    const methodRadio = formatDialog.querySelector('input[name="export-method"]:checked');
    const exportMethod = methodRadio ? methodRadio.value : 'save';
    
    formatDialog.style.display = 'none';
    setTimeout(() => formatDialog.remove(), 300);
    
    // 获取文件名（基于学习计划主题）
    let fileName = (currentPlan.subject || '学习计划').replace(/[\\/:*?"<>|]/g, '_');
    
    // 创建要导出的内容
    let content = generateExportContent(format);
    
    if (exportMethod === 'copy') {
      // 复制到剪贴板
      navigator.clipboard.writeText(content)
        .then(() => {
          showNotification(`学习计划内容已复制到剪贴板`);
        })
        .catch(err => {
          console.error('复制失败:', err);
          showNotification('复制失败，请重试', 'error');
        });
    } else {
      // 保存到文件
      const blob = new Blob([content], { type: format === 'txt' ? 'text/plain' : 'text/markdown' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${fileName}_学习计划.${format}`;
      
      // 触发下载
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      showNotification(`学习计划已导出为${format.toUpperCase()}格式`);
    }
  });
}

// 根据格式生成导出内容
function generateExportContent(format) {
  let content = '';
  const mdFormat = format === 'md';
  
  // 标题和基本信息
  if (mdFormat) {
    content = `# ${currentPlan.subject} 学习计划\n\n`;
    content += `## 学习目标\n${currentPlan.goal}\n\n`;
    content += `## 计划信息\n`;
    content += `- 难度级别: ${getLevelText(currentPlan.level)}\n`;
    content += `- 每周学习时间: ${currentPlan.weeklyTime} 小时\n`;
    content += `- 学习风格: ${getLearningStyleText(currentPlan.learningStyle)}\n`;
    if (currentPlan.deadline) {
      content += `- 计划截止日期: ${currentPlan.deadline}\n`;
    }
  } else {
    content = `${currentPlan.subject} 学习计划\n\n`;
    content += `学习目标:\n${currentPlan.goal}\n\n`;
    content += `计划信息:\n`;
    content += `难度级别: ${getLevelText(currentPlan.level)}\n`;
    content += `每周学习时间: ${currentPlan.weeklyTime} 小时\n`;
    content += `学习风格: ${getLearningStyleText(currentPlan.learningStyle)}\n`;
    if (currentPlan.deadline) {
      content += `计划截止日期: ${currentPlan.deadline}\n`;
    }
  }
  
  // 添加推荐方法
  content += mdFormat ? `\n## 推荐学习方法\n` : `\n推荐学习方法:\n`;
  
  currentPlan.recommendedMethods.forEach((method, index) => {
    if (mdFormat) {
      content += `### ${index + 1}. ${method.name}\n`;
      content += `${method.shortDescription}\n`;
      content += `分类: ${method.category}, 难度: ${method.difficulty}\n\n`;
    } else {
      content += `${index + 1}. ${method.name}\n`;
      content += `   ${method.shortDescription}\n`;
      content += `   分类: ${method.category}, 难度: ${method.difficulty}\n\n`;
    }
  });
  
  // 添加时间表
  content += mdFormat ? `## 每周时间表\n` : `每周时间表:\n`;
  const weekdays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
  weekdays.forEach((day, index) => {
    let dayTime = 0;
    let activities = '';
    
    if (index < 5) { // 工作日
      dayTime = Math.round(currentPlan.weeklyTime / 5);
      const methodIndex = index % currentPlan.recommendedMethods.length;
      const method = currentPlan.recommendedMethods[methodIndex];
      activities = `${method.name}: ${method.shortDescription}`;
    } else { // 周末
      dayTime = Math.round(currentPlan.weeklyTime * 0.2);
      activities = '复习和巩固本周学习内容';
    }
    
    if (mdFormat) {
      content += `- **${day}**: ${dayTime}小时 - ${activities}\n`;
    } else {
      content += `${day}: ${dayTime}小时 - ${activities}\n`;
    }
  });
  
  // 添加里程碑
  content += mdFormat ? `\n## 学习里程碑\n` : `\n学习里程碑:\n`;
  if (currentPlan.milestones && currentPlan.milestones.length > 0) {
    currentPlan.milestones.forEach(milestone => {
      if (mdFormat) {
        content += `- **${milestone.date}**: ${milestone.title} - ${milestone.description}\n`;
      } else {
        content += `${milestone.date}: ${milestone.title} - ${milestone.description}\n`;
      }
    });
  }
  
  // 添加资源
  content += mdFormat ? `\n## 推荐学习资源\n` : `\n推荐学习资源:\n`;
  if (currentPlan.resources && currentPlan.resources.length > 0) {
    currentPlan.resources.forEach(resource => {
      if (mdFormat) {
        content += `- **${resource.name}**: ${resource.description}\n`;
      } else {
        content += `${resource.name}: ${resource.description}\n`;
      }
    });
  }
  
  return content;
}

// 获取难度级别文本
function getLevelText(level) {
  switch (level) {
    case 'beginner': return '初级';
    case 'intermediate': return '中级';
    case 'advanced': return '高级';
    default: return '未设置';
  }
}

// 获取学习风格文本
function getLearningStyleText(style) {
  switch (style) {
    case 'visual': return '视觉型';
    case 'auditory': return '听觉型';
    case 'reading': return '阅读型';
    case 'kinesthetic': return '动觉型';
    default: return '未设置';
  }
}

// 找到推荐的学习方法
function findRecommendedMethods(subject, goal, level, learningStyle) {
  // 创建一个评分系统来匹配最适合的方法
  const recommendedMethods = [];
  const allMethods = learningMethods || [];
  
  // 如果没有加载任何学习方法，尝试重新加载
  if (allMethods.length === 0) {
    try {
      // 尝试从主进程获取学习方法数据
      const fromMain = ipcRenderer.sendSync('get-learning-methods');
      if (fromMain && fromMain.length > 0) {
        learningMethods = fromMain;
      } else {
        // 尝试从模块加载学习方法
        try {
          const modulePath = require('path').join(__dirname, 'models', 'learningMethods.js');
          const methodsModule = require(modulePath);
          if (methodsModule && methodsModule.all) {
            learningMethods = methodsModule.all;
          }
        } catch (error) {
          console.error('加载学习方法模块失败:', error);
        }
      }
    } catch (error) {
      console.error('加载学习方法失败:', error);
    }
  }
  
  // 确保allMethods是最新的
  const methods = learningMethods || allMethods || [];
  
  // 提取关键词
  const keywords = extractKeywords(subject, goal);
  
  // 对每个方法评分
  methods.forEach(method => {
    let score = 0;
    
    // 根据关键词匹配
    keywords.forEach(keyword => {
      if (method.name.toLowerCase().includes(keyword.toLowerCase())) {
        score += 3;
      }
      if (method.shortDescription.toLowerCase().includes(keyword.toLowerCase())) {
        score += 2;
      }
      if (method.fullDescription && method.fullDescription.toLowerCase().includes(keyword.toLowerCase())) {
        score += 1;
      }
    });
    
    // 根据难度匹配
    if ((level === 'beginner' && method.difficulty === '低') || 
        (level === 'intermediate' && method.difficulty === '中等') || 
        (level === 'advanced' && method.difficulty === '高')) {
      score += 2;
    }
    
    // 根据学习风格匹配
    if (matchLearningStyle(method, learningStyle)) {
      score += 2;
    }
    
    // 如果评分大于0，添加到推荐列表
    if (score > 0) {
      recommendedMethods.push({
        method,
        score
      });
    }
  });
  
  // 如果没有找到匹配的方法，返回前5个方法作为兜底方案
  if (recommendedMethods.length === 0 && methods.length > 0) {
    // 创建默认方法列表
    const defaultMethods = methods.slice(0, Math.min(5, methods.length));
    console.log('未找到匹配的学习方法，使用默认方法列表:', defaultMethods.length);
    return defaultMethods;
  }
  
  // 按评分排序
  recommendedMethods.sort((a, b) => b.score - a.score);
  
  // 返回前5个方法
  return recommendedMethods.slice(0, 5).map(item => item.method);
}

// 从文本中提取关键词
function extractKeywords(subject, goal) {
  // 合并主题和目标
  const text = `${subject} ${goal}`.toLowerCase();
  
  // 移除常见的停用词
  const stopWords = ['的', '地', '得', '和', '在', '是', '我', '有', '与', '这', '了', '中', '要', '对', '上', '下', '能', '来', '他', '们', '从', '时', '到', '都', '为', '被'];
  
  // 分词并过滤
  let words = text.split(/\s+|[,.?!;:，。？！；：]/);
  words = words.filter(word => word.length > 1 && !stopWords.includes(word));
  
  // 移除重复词
  return [...new Set(words)];
}

// 匹配学习风格
function matchLearningStyle(method, learningStyle) {
  const description = method.fullDescription.toLowerCase();
  
  switch (learningStyle) {
    case 'visual':
      return description.includes('图') || description.includes('视频') || description.includes('图表') || description.includes('可视化');
    case 'auditory':
      return description.includes('听') || description.includes('讲') || description.includes('讨论') || description.includes('解释');
    case 'reading':
      return description.includes('读') || description.includes('书') || description.includes('文章') || description.includes('笔记');
    case 'kinesthetic':
      return description.includes('做') || description.includes('练习') || description.includes('实践') || description.includes('操作');
    default:
      return false;
  }
}

// 显示推荐的学习方法
function displayRecommendedMethods(methods) {
  if (!planRecommendedMethods) return;
  
  planRecommendedMethods.innerHTML = '';
  
  if (!methods || methods.length === 0) {
    planRecommendedMethods.innerHTML = '<p>未找到匹配的学习方法，请尝试调整学习目标描述。</p>';
    return;
  }
  
  // 添加整体的收缩/展开控制按钮
  const toggleAllButton = document.createElement('button');
  toggleAllButton.className = 'toggle-methods-btn secondary-btn';
  toggleAllButton.textContent = '收缩';
  toggleAllButton.style.marginBottom = '10px';
  toggleAllButton.style.float = 'right';
  toggleAllButton.style.padding = '2px 8px';
  toggleAllButton.style.fontSize = '14px';
  
  const methodsContainer = document.createElement('div');
  methodsContainer.className = 'methods-container';
  methodsContainer.style.clear = 'both';
  
  let allExpanded = true;
  toggleAllButton.addEventListener('click', () => {
    allExpanded = !allExpanded;
    
    if (allExpanded) {
      // 展开全部
      methodsContainer.querySelectorAll('.recommended-method').forEach(elem => {
        elem.style.display = 'block';
      });
      toggleAllButton.textContent = '收缩';
    } else {
      // 收缩，只显示前两个方法
      methodsContainer.querySelectorAll('.recommended-method').forEach((elem, index) => {
        elem.style.display = index < 2 ? 'block' : 'none';
      });
      toggleAllButton.textContent = '展开';
    }
  });
  
  planRecommendedMethods.appendChild(toggleAllButton);
  
  methods.forEach(method => {
    const methodElement = document.createElement('div');
    methodElement.className = 'recommended-method';
    methodElement.style.position = 'relative';
    methodElement.style.marginBottom = '15px';
    methodElement.style.border = '1px solid #e0e0e0';
    methodElement.style.borderRadius = '5px';
    methodElement.style.padding = '15px';
    
    methodElement.innerHTML = `
      <h5 style="margin-top: 0;">${method.name}</h5>
      <p class="method-short-desc">${method.shortDescription}</p>
      <div class="method-meta">
        <span class="method-category">分类: ${method.category}</span>
        <span class="method-difficulty">难度: ${method.difficulty}</span>
      </div>
      <button class="view-method-detail">查看详情</button>
    `;
    
    // 添加查看详情按钮事件
    const detailButton = methodElement.querySelector('.view-method-detail');
    if (detailButton) {
      detailButton.addEventListener('click', (e) => {
        e.stopPropagation(); // 防止事件冒泡
        
        try {
          showMethodDetail(method);
        } catch (error) {
          console.error('显示方法详情时出错:', error);
          alert(`${method.name}\n\n${method.fullDescription || method.shortDescription}`);
        }
      });
    }
    
    methodsContainer.appendChild(methodElement);
  });
  
  planRecommendedMethods.appendChild(methodsContainer);
  
  // 将推荐方法存储到当前计划中
  if (currentPlan) {
    currentPlan.recommendedMethods = methods;
  }
}

// 生成学习时间表
function generateSchedule(weeklyTime, recommendedMethods) {
  if (!planScheduleContent) return;
  planScheduleContent.innerHTML = '';
  
  // 确保参数类型正确
  if (typeof weeklyTime !== 'number' || isNaN(weeklyTime)) {
    weeklyTime = parseInt(weeklyTime) || 10; // 提供默认值
  }
  
  // 确保推荐方法数组有效，如果不是数组或为空，创建一个临时方法
  if (!recommendedMethods || !Array.isArray(recommendedMethods) || recommendedMethods.length === 0) {
    try {
      // 尝试加载所有方法，至少显示一些内容
      const allMethods = learningMethods || [];
      if (allMethods.length > 0) {
        recommendedMethods = allMethods.slice(0, 5);
        console.log('使用默认方法生成时间表:', recommendedMethods.length);
      } else {
        // 如果没有方法可用，创建一个临时方法
        recommendedMethods = [{
          name: '自定义学习',
          shortDescription: '根据您的学习主题自定义学习内容',
          category: '通用',
          difficulty: '中等'
        }];
        console.log('创建临时方法生成时间表');
      }
    } catch (error) {
      console.error('创建默认学习方法时出错:', error);
      planScheduleContent.innerHTML = '<p>未能生成时间表，请重新填写学习计划信息。</p>';
      return;
    }
  }
  
  // 创建周一到周日的时间表
  const weekdays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
  
  // 计算每天学习时间(排除周末)
  const workdays = 5;
  let dailyTime = Math.round(weeklyTime / workdays);
  const weekendTime = Math.round(weeklyTime * 0.2); // 周末时间为总时间的20%
  
  // 创建时间表
  const scheduleTable = document.createElement('table');
  scheduleTable.className = 'schedule-table';
  
  // 表头
  const tableHead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  headerRow.innerHTML = `
    <th>星期</th>
    <th>推荐学习时间</th>
    <th>学习活动</th>
  `;
  tableHead.appendChild(headerRow);
  scheduleTable.appendChild(tableHead);
  
  // 表体
  const tableBody = document.createElement('tbody');
  
  weekdays.forEach((day, index) => {
    const row = document.createElement('tr');
    
    // 确定当天时间
    let dayTime = 0;
    let activities = '';
    
    if (index < 5) { // 工作日
      dayTime = dailyTime;
      
      // 分配方法，确保安全访问
      try {
        const methodIndex = index % recommendedMethods.length;
        const method = recommendedMethods[methodIndex];
        
        // 确保方法对象有效
        if (method && method.name) {
          activities = `
            <strong>${method.name}</strong>: ${method.shortDescription || ''}
          `;
        } else {
          activities = '自定义学习内容';
        }
      } catch (error) {
        console.error('处理学习方法时出错:', error);
        activities = '自定义学习内容';
      }
    } else { // 周末
      dayTime = weekendTime;
      activities = '复习和巩固本周学习内容';
    }
    
    row.innerHTML = `
      <td>${day}</td>
      <td>${dayTime} 小时</td>
      <td>${activities}</td>
    `;
    
    tableBody.appendChild(row);
  });
  
  scheduleTable.appendChild(tableBody);
  planScheduleContent.appendChild(scheduleTable);
  
  // 将时间表保存到当前计划中（如果存在）
  if (currentPlan) {
    currentPlan.schedule = weekdays.map((day, index) => {
      const isWeekday = index < 5;
      return {
        day,
        hours: isWeekday ? Math.round(weeklyTime / 5) : Math.round(weeklyTime * 0.2),
        activity: isWeekday ? 
          (recommendedMethods[index % recommendedMethods.length]?.name || '自定义学习') : 
          '复习和巩固本周学习内容'
      };
    });
  }
}

// 生成学习里程碑
function generateMilestones(deadline, level) {
  planMilestonesContent.innerHTML = '';
  
  const milestones = [];
  const now = new Date();
  const endDate = deadline || new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000); // 默认90天
  
  // 计算总天数
  const totalDays = Math.ceil((endDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
  
  // 根据级别设置不同数量的里程碑
  let milestoneCount = 3; // 默认
  
  if (level === 'beginner') {
    milestoneCount = 4; // 初学者需要更多的里程碑
  } else if (level === 'advanced') {
    milestoneCount = 2; // 高级者可以有更少的里程碑
  }
  
  // 创建里程碑
  for (let i = 1; i <= milestoneCount; i++) {
    const percentage = i / milestoneCount;
    const daysFromStart = Math.ceil(totalDays * percentage);
    const milestoneDate = new Date(now.getTime() + daysFromStart * 24 * 60 * 60 * 1000);
    
    milestones.push({
      title: `里程碑 ${i}`,
      date: milestoneDate.toLocaleDateString(),
      description: getMilestoneDescription(i, milestoneCount, level)
    });
  }
  
  // 显示里程碑
  const milestonesList = document.createElement('ul');
  milestonesList.className = 'milestones-list';
  
  milestones.forEach(milestone => {
    const item = document.createElement('li');
    item.className = 'milestone-item';
    item.innerHTML = `
      <div class="milestone-date">${milestone.date}</div>
      <div class="milestone-content">
        <h5>${milestone.title}</h5>
        <p>${milestone.description}</p>
      </div>
    `;
    milestonesList.appendChild(item);
  });
  
  planMilestonesContent.appendChild(milestonesList);
}

// 获取里程碑描述
function getMilestoneDescription(current, total, level) {
  if (current === 1) {
    if (level === 'beginner') {
      return '掌握基础概念，能够理解和记忆核心术语';
    } else if (level === 'intermediate') {
      return '巩固现有知识，学习并应用一个新的高级概念';
    } else {
      return '深入研究领域内前沿知识，形成自己的见解';
    }
  } else if (current === total) {
    if (level === 'beginner') {
      return '能够独立解决基本问题，形成完整的知识体系';
    } else if (level === 'intermediate') {
      return '能够熟练应用所学知识解决复杂问题';
    } else {
      return '能够创新性地解决领域内的难题，形成专业级水平';
    }
  } else {
    const percentage = Math.round(current / total * 100);
    if (level === 'beginner') {
      return `完成约${percentage}%的学习内容，能够解释和应用已学知识`;
    } else if (level === 'intermediate') {
      return `完成约${percentage}%的学习计划，能够分析和评估复杂概念`;
    } else {
      return `完成约${percentage}%的深入研究，能够综合和创新性地应用知识`;
    }
  }
}

// 生成学习资源
function generateResources(subject, level) {
  planResourcesContent.innerHTML = '';
  
  // 根据主题和水平推荐资源
  const resources = getRecommendedResources(subject, level);
  
  if (resources.length === 0) {
    planResourcesContent.innerHTML = '<p>未找到匹配的学习资源。</p>';
    return;
  }
  
  // 显示资源
  const resourceCategories = {};
  
  // 按类别分组
  resources.forEach(resource => {
    if (!resourceCategories[resource.type]) {
      resourceCategories[resource.type] = [];
    }
    resourceCategories[resource.type].push(resource);
  });
  
  // 创建资源列表
  Object.keys(resourceCategories).forEach(category => {
    const categoryContainer = document.createElement('div');
    categoryContainer.className = 'resource-category';
    
    categoryContainer.innerHTML = `<h5>${category}</h5>`;
    
    const resourcesList = document.createElement('ul');
    resourcesList.className = 'resources-list';
    
    resourceCategories[category].forEach(resource => {
      const item = document.createElement('li');
      if (resource.url) {
        item.innerHTML = `<a href="${resource.url}" target="_blank">${resource.title}</a> - ${resource.description}`;
      } else {
        item.textContent = `${resource.title} - ${resource.description}`;
      }
      resourcesList.appendChild(item);
    });
    
    categoryContainer.appendChild(resourcesList);
    planResourcesContent.appendChild(categoryContainer);
  });
}

// 获取推荐资源
function getRecommendedResources(subject, level) {
  // 这里可以使用更复杂的匹配逻辑
  // 简单起见，提供一些通用资源
  const resources = [
    {
      type: '书籍',
      title: '学习之道',
      description: '介绍有效学习策略的经典著作',
      url: 'https://book.douban.com/subject/26895988/'
    },
    {
      type: '在线课程',
      title: '如何高效学习',
      description: '系统介绍高效学习方法的课程',
      url: 'https://www.coursera.org/learn/learning-how-to-learn'
    },
    {
      type: '工具',
      title: 'Anki',
      description: '强大的间隔重复记忆软件',
      url: 'https://apps.ankiweb.net/'
    },
    {
      type: '工具',
      title: '飞书',
      description: '多功能笔记和知识管理工具',
      url: 'https://www.feishu.cn/download'
    }
  ];
  
  // 匹配一些关键词，添加特定资源
  const subjectLower = subject.toLowerCase();
  
  if (subjectLower.includes('编程') || subjectLower.includes('程序') || subjectLower.includes('代码')) {
    resources.push(
      {
        type: '在线课程',
        title: 'freeCodeCamp',
        description: '免费编程学习平台',
        url: 'https://www.freecodecamp.org/'
      },
      {
        type: '书籍',
        title: '代码大全',
        description: '软件构建的实践指南',
        url: 'https://book.douban.com/subject/1477390/'
      }
    );
  }
  
  if (subjectLower.includes('数学') || subjectLower.includes('微积分')) {
    resources.push(
      {
        type: '在线课程',
        title: 'Khan Academy',
        description: '免费数学课程和练习',
        url: 'https://www.khanacademy.org/'
      },
      {
        type: '书籍',
        title: '微积分的力量',
        description: '趣味数学科普读物',
        url: 'https://book.douban.com/subject/30135025/'
      }
    );
  }
  
  if (subjectLower.includes('语言') || subjectLower.includes('英语')) {
    resources.push(
      {
        type: '应用',
        title: 'Duolingo',
        description: '游戏化语言学习应用',
        url: 'https://www.duolingo.com/'
      },
      {
        type: '工具',
        title: 'Lingvist',
        description: '基于AI的词汇学习工具',
        url: 'https://lingvist.com/'
      }
    );
  }
  
  // 根据水平过滤资源
  return resources;
} 