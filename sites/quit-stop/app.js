(() => {
  'use strict';
  const form = document.querySelector('#stopForm');
  const input = document.querySelector('#phoneNumber');
  const error = document.querySelector('#numberError');
  const status = document.querySelector('#messageStatus');
  const followUp = document.querySelector('#followUp');
  const followUpHelp = document.querySelector('#followUpHelp');
  const nextMessage = document.querySelector('#nextMessage');
  let pending = null;
  const isApple = /iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent);
  function clearError() {
    error.hidden = true;
    error.textContent = '';
    input.removeAttribute('aria-invalid');
  }
  function resetFollowUp() { pending = null; followUp.hidden = true; }
  function openMessage(number, body) {
    status.textContent = 'Review your request in Messages, then tap Send.';
    window.location.href = `sms:${number}${isApple ? '&' : '?'}body=${body}`;
  }
  input.addEventListener('input', () => { clearError(); status.textContent = ''; resetFollowUp(); });
  nextMessage.addEventListener('click', () => {
    if (!pending) return;
    const { number, body } = pending;
    resetFollowUp();
    openMessage(number, body);
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    clearError();
    resetFollowUp();
    const raw = input.value.trim();
    const number = raw.replace(/[\s().-]/g, '');
    // One recipient only: reject letters, URI parameters, separators, and extensions.
    const valid = /^\+?\d+$/.test(number) && (/^\+\d{7,15}$/.test(number) || /^\d{3,15}$/.test(number));
    if (!valid) {
      error.textContent = 'Enter one phone number or short code. Use digits and an optional + country code.';
      error.hidden = false;
      input.setAttribute('aria-invalid', 'true');
      input.focus();
      return;
    }
    const body = event.submitter?.value === 'QUIT' ? 'QUIT' : 'STOP';
    const next = body === 'STOP' ? 'QUIT' : 'STOP';
    pending = { number, body: next };
    followUpHelp.textContent = 'Once you’ve sent your first request, come back to continue.';
    nextMessage.textContent = 'Continue ↗';
    nextMessage.setAttribute('aria-label', `After sending ${body}, open a ${next} text to the same number`);
    followUp.hidden = false;
    openMessage(number, body);
  });
  // Keep the recipient only in this page's memory; never persist it.
  // Returning from Messages preserves this in-memory follow-up. Reloading clears it.
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    });
  }
})();
