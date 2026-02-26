const ballisticsEl = document.querySelector('[data-service="ballistics"]');
const healthBtn = document.querySelector('#health-check');

async function checkBallistics() {
  try {
    const response = await fetch('http://localhost:8000/docs', { mode: 'no-cors' });
    if (response || response.type === 'opaque') {
      ballisticsEl.textContent = '✅ Запущен';
      ballisticsEl.classList.remove('warn');
      return;
    }
  } catch {
    // ignore
  }

  ballisticsEl.textContent = '⚠️ Не отвечает. Проверьте Python и uvicorn.';
  ballisticsEl.classList.add('warn');
}

healthBtn?.addEventListener('click', checkBallistics);
checkBallistics();
