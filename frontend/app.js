const API_BASE_URL = 'http://localhost:5000/api';

// Функции утилиты
function showStatus(message, type) {
    const statusDiv = document.getElementById('status-message');
    if (!statusDiv) return;
    
    statusDiv.textContent = message;
    statusDiv.className = `status-message ${type}`;
    
    setTimeout(() => {
        statusDiv.className = 'status-message';
    }, 5000);
}

function displayResult(elementId, data) {
    const element = document.getElementById(elementId);
    if (!element) return;
    element.textContent = JSON.stringify(data, null, 2);
}

function showError(elementId, error) {
    const element = document.getElementById(elementId);
    if (!element) return;
    element.textContent = `Error: ${error.message}`;
    element.style.color = 'red';
}

function setLoadingState(button, isLoading, text = '') {
    if (!button) return;
    button.disabled = isLoading;
    if (isLoading) {
        button.dataset.originalText = button.textContent;
        button.textContent = text || 'Загрузка...';
        return;
    }
    if (button.dataset.originalText) {
        button.textContent = button.dataset.originalText;
    }
}

// API вызов для получения Hello World из базы данных
async function fetchHelloWorld() {
    try {
        const response = await fetch(`${API_BASE_URL}/hello`);
        const data = await response.json();
        
        if (response.ok) {
            displayResult('hello-result', data);
            showStatus('Данные успешно получены из БД', 'success');
        } else {
            throw new Error(data.error || 'Failed to fetch');
        }
    } catch (error) {
        showError('hello-result', error);
        showStatus('Ошибка при подключении к БД', 'error');
    }
}

async function registerUser(event) {
    event.preventDefault();

    const fullName = document.getElementById('full-name')?.value.trim();
    const email = document.getElementById('email')?.value.trim();
    const password = document.getElementById('password')?.value;
    const registerBtn = document.getElementById('register-btn');

    if (!fullName || !email || !password) {
        showStatus('Заполните все поля регистрации', 'error');
        return;
    }

    setLoadingState(registerBtn, true, 'Регистрируем...');

    try {
        const response = await fetch(`${API_BASE_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                full_name: fullName,
                email,
                password
            })
        });
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Ошибка регистрации');
        }

        displayResult('register-result', data);
        showStatus('Регистрация выполнена успешно', 'success');
        document.getElementById('register-form')?.reset();
    } catch (error) {
        showError('register-result', error);
        showStatus(error.message || 'Ошибка регистрации', 'error');
    } finally {
        setLoadingState(registerBtn, false);
    }
}

// Слушатели событий
document.addEventListener('DOMContentLoaded', () => {
    console.log('ConResEd Frontend initialized');
    
    // Прикрепить слушателя событий к кнопке
    const helloBtn = document.getElementById('hello-btn');
    if (helloBtn) helloBtn.addEventListener('click', fetchHelloWorld);

    const registerForm = document.getElementById('register-form');
    if (registerForm) registerForm.addEventListener('submit', registerUser);
});