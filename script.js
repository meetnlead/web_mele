(() => {
  'use strict';

  const SELECTORS = Object.freeze({
    navToggle: '.nav-toggle',
    primaryNav: '#primary-navigation',
    scrollLinks: '[data-scroll-to-form]',
    form: '#quote-form',
    dialog: '#confirmation-dialog',
    closeDialog: '[data-close-dialog]',
    currentYear: '[data-current-year]'
  });

  const MESSAGES = Object.freeze({
    valueMissing: 'Complete este campo.',
    typeMismatch: 'Ingrese un email válido.',
    tooShort: 'Ingrese al menos 2 caracteres.',
    rangeUnderflow: 'Ingrese al menos 1 usuario.',
    rangeOverflow: 'Ingrese una cantidad menor a 10.000.',
    sendError: 'No pudimos enviar la solicitud. Intente nuevamente.'
  });

  const getElement = (selector, root = document) => root.querySelector(selector);
  const getElements = (selector, root = document) => [...root.querySelectorAll(selector)];

  const setNavigation = (isOpen) => {
    const toggle = getElement(SELECTORS.navToggle);
    const navigation = getElement(SELECTORS.primaryNav);
    if (!toggle || !navigation) return;

    toggle.setAttribute('aria-expanded', String(isOpen));
    toggle.setAttribute('aria-label', isOpen ? 'Cerrar menú de navegación' : 'Abrir menú de navegación');
    navigation.classList.toggle('is-open', isOpen);
    const icon = getElement('i', toggle);
    if (icon) icon.className = isOpen ? 'ph ph-x' : 'ph ph-list';
  };

  const setupNavigation = () => {
    const toggle = getElement(SELECTORS.navToggle);
    const navigation = getElement(SELECTORS.primaryNav);
    if (!toggle || !navigation) return;

    toggle.addEventListener('click', () => {
      setNavigation(toggle.getAttribute('aria-expanded') !== 'true');
    });

    navigation.addEventListener('click', (event) => {
      if (event.target.closest('a')) setNavigation(false);
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') setNavigation(false);
    });
  };

  const setupSmoothScrolling = () => {
    getElements(SELECTORS.scrollLinks).forEach((link) => {
      link.addEventListener('click', (event) => {
        const targetId = link.getAttribute('href');
        const target = targetId ? getElement(targetId) : null;
        if (!target) return;

        event.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        window.history.replaceState(null, '', targetId);
      });
    });
  };

  const getValidationMessage = (field) => {
    if (field.validity.valueMissing) return MESSAGES.valueMissing;
    if (field.validity.typeMismatch) return MESSAGES.typeMismatch;
    if (field.validity.tooShort) return MESSAGES.tooShort;
    if (field.validity.rangeUnderflow) return MESSAGES.rangeUnderflow;
    if (field.validity.rangeOverflow) return MESSAGES.rangeOverflow;
    return '';
  };

  const renderFieldValidation = (field) => {
    const error = getElement(`[data-error-for="${field.id}"]`);
    const message = getValidationMessage(field);
    field.setAttribute('aria-invalid', String(Boolean(message)));
    if (error) error.textContent = message;
    return !message;
  };

  const validateForm = (form) => {
    const fields = getElements('input:not([type="hidden"]), select', form);
    const results = fields.map(renderFieldValidation);
    const firstInvalidIndex = results.findIndex((isValid) => !isValid);
    if (firstInvalidIndex >= 0) fields[firstInvalidIndex].focus();
    return firstInvalidIndex === -1;
  };

  const clearValidation = (form) => {
    getElements('[aria-invalid]', form).forEach((field) => field.removeAttribute('aria-invalid'));
    getElements('.form-field__error', form).forEach((error) => { error.textContent = ''; });
  };

  const submitPayload = async (endpoint, payload) => {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Accept': 'application/json' },
      body: payload,
      cache: 'no-store',
      credentials: 'omit',
      referrerPolicy: 'strict-origin-when-cross-origin'
    });

    if (!response.ok) throw new Error('Form submission failed');
    const result = await response.json();
    if (result.success === false || result.success === 'false') throw new Error('Form submission rejected');
    return result;
  };

  const showConfirmation = () => {
    const dialog = getElement(SELECTORS.dialog);
    if (!dialog) return;
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
  };

  const setupDialog = () => {
    const dialog = getElement(SELECTORS.dialog);
    const closeButton = getElement(SELECTORS.closeDialog);
    if (!dialog || !closeButton) return;

    closeButton.addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', (event) => {
      const bounds = dialog.getBoundingClientRect();
      const outside = event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom;
      if (outside) dialog.close();
    });
  };

  const setupForm = () => {
    const form = getElement(SELECTORS.form);
    if (!form) return;

    getElements('input:not([type="hidden"]), select', form).forEach((field) => {
      field.addEventListener('blur', () => renderFieldValidation(field));
      field.addEventListener('input', () => {
        if (field.getAttribute('aria-invalid') === 'true') renderFieldValidation(field);
      });
    });

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!validateForm(form)) return;

      const submitButton = getElement('button[type="submit"]', form);
      const buttonLabel = getElement('span', submitButton);
      const endpoint = form.dataset.endpoint || form.action;
      let payload = new FormData(form);

      submitButton.disabled = true;
      buttonLabel.textContent = 'Enviando…';

      try {
        await submitPayload(endpoint, payload);
        form.reset();
        clearValidation(form);
        showConfirmation();
      } catch (error) {
        window.alert(MESSAGES.sendError);
      } finally {
        payload = null;
        submitButton.disabled = false;
        buttonLabel.textContent = 'Quiero que me contacten';
      }
    });

    window.addEventListener('pageshow', () => {
      form.reset();
      clearValidation(form);
    });
  };

  const setCurrentYear = () => {
    const year = getElement(SELECTORS.currentYear);
    if (year) year.textContent = String(new Date().getFullYear());
  };

  const init = () => {
    setupNavigation();
    setupSmoothScrolling();
    setupDialog();
    setupForm();
    setCurrentYear();
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
