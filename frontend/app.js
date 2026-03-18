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

// Слушатели событий
document.addEventListener('DOMContentLoaded', () => {
    console.log('ConResEd Frontend initialized');
    
    // Прикрепить слушателя событий к кнопке
    const helloBtn = document.getElementById('hello-btn');
    if (helloBtn) helloBtn.addEventListener('click', fetchHelloWorld);
});