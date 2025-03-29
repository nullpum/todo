// public/script.js
document.addEventListener('DOMContentLoaded', function() {
  // DOM 요소
  const todoInput = document.getElementById('todo-input');
  const addButton = document.getElementById('add-button');
  const todoList = document.getElementById('todo-list');
  const totalCount = document.getElementById('total-count');
  const completedCount = document.getElementById('completed-count');
  
  // 할 일 목록 로드
  loadTodos();
  
  // 이벤트 리스너
  addButton.addEventListener('click', addTodo);
  todoInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      addTodo();
    }
  });
  
  // 할 일 목록 로드 함수
  async function loadTodos() {
    try {
      const response = await fetch('/api/todos');
      const todos = await response.json();
      renderTodos(todos);
    } catch (error) {
      console.error('할 일 목록 로드 오류:', error);
    }
  }
  
  // 새 할 일 추가 함수
  async function addTodo() {
    const title = todoInput.value.trim();
    
    if (!title) {
      alert('할 일을 입력해주세요.');
      return;
    }
    
    try {
      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title })
      });
      
      if (response.ok) {
        todoInput.value = '';
        loadTodos();
      }
    } catch (error) {
      console.error('할 일 추가 오류:', error);
    }
  }
  
  // 할 일 상태 변경 함수
  async function toggleTodoStatus(id, completed) {
    try {
      const response = await fetch(`/api/todos/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ completed })
      });
      
      if (response.ok) {
        loadTodos();
      }
    } catch (error) {
      console.error('할 일 상태 변경 오류:', error);
    }
  }
  
  // 할 일 삭제 함수
  async function deleteTodo(id) {
    try {
      const response = await fetch(`/api/todos/${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        loadTodos();
      }
    } catch (error) {
      console.error('할 일 삭제 오류:', error);
    }
  }
  
  // 할 일 목록 렌더링 함수
  function renderTodos(todos) {
    todoList.innerHTML = '';
    let completedTodos = 0;
    
    todos.forEach(todo => {
      if (todo.completed) {
        completedTodos++;
      }
      
      const todoItem = document.createElement('li');
      todoItem.className = 'todo-item';
      
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'todo-checkbox';
      checkbox.checked = todo.completed;
      checkbox.addEventListener('change', () => {
        toggleTodoStatus(todo.id, checkbox.checked);
      });
      
      const todoText = document.createElement('span');
      todoText.className = `todo-text ${todo.completed ? 'completed' : ''}`;
      todoText.textContent = todo.title;
      
      const deleteButton = document.createElement('button');
      deleteButton.className = 'delete-button';
      deleteButton.textContent = '삭제';
      deleteButton.addEventListener('click', () => {
        deleteTodo(todo.id);
      });
      
      todoItem.appendChild(checkbox);
      todoItem.appendChild(todoText);
      todoItem.appendChild(deleteButton);
      
      todoList.appendChild(todoItem);
    });
    
    // 통계 업데이트
    totalCount.textContent = `총 ${todos.length}개`;
    completedCount.textContent = `완료 ${completedTodos}개`;
  }
});