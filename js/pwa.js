(() => {
    const installState = {
        deferredPrompt: null,
        registration: null,
        isInstalling: false,
        hasRegistrationError: false,
        hasUpdateReady: false
    };
    const standaloneQuery = window.matchMedia
        ? window.matchMedia('(display-mode: standalone)')
        : null;

    function getElements() {
        return {
            installButton: document.getElementById('installButton'),
            status: document.getElementById('pwaStatus')
        };
    }

    function isInstalled() {
        return Boolean(
            (standaloneQuery && standaloneQuery.matches)
            || window.navigator.standalone === true
        );
    }

    function updateStatus(message, state) {
        const { status } = getElements();

        if (!status) {
            return;
        }

        status.textContent = message;
        if (state) {
            status.dataset.state = state;
        } else {
            delete status.dataset.state;
        }
    }

    function setOfflineClass() {
        document.body.classList.toggle('is-offline', navigator.onLine === false);
    }

    function refreshUi() {
        const { installButton } = getElements();
        const installed = isInstalled();
        const canInstall = Boolean(installState.deferredPrompt) && !installed;
        const isOffline = navigator.onLine === false;

        setOfflineClass();

        if (installButton) {
            installButton.hidden = !canInstall;
            installButton.disabled = !canInstall || installState.isInstalling;
            installButton.classList.toggle('hud-button--available', canInstall);
        }

        if (installState.hasRegistrationError) {
            updateStatus('Не удалось включить офлайн-режим.', 'error');
            return;
        }

        if (installState.hasUpdateReady) {
            updateStatus('Доступно обновление приложения. Перезапусти игру.', '');
            return;
        }

        if (installed) {
            updateStatus(
                isOffline
                    ? 'Приложение установлено и работает офлайн.'
                    : 'Приложение установлено. Можно запускать отдельным окном.',
                'installed'
            );
            return;
        }

        if (isOffline) {
            updateStatus('Нет сети. Игра использует локальный кеш.', 'offline');
            return;
        }

        if (canInstall) {
            updateStatus('Игра готова к установке на устройство.', '');
            return;
        }

        if (installState.registration) {
            updateStatus('Офлайн-кеш активен. Установка доступна из меню браузера.', '');
            return;
        }

        updateStatus('Подготавливаю офлайн-режим приложения.', '');
    }

    async function promptInstall() {
        if (!installState.deferredPrompt || installState.isInstalling) {
            return;
        }

        installState.isInstalling = true;
        refreshUi();

        try {
            await installState.deferredPrompt.prompt();
            await installState.deferredPrompt.userChoice;
        } catch (error) {
            console.warn('PWA install prompt failed:', error);
        } finally {
            installState.deferredPrompt = null;
            installState.isInstalling = false;
            refreshUi();
        }
    }

    async function registerServiceWorker() {
        if (!('serviceWorker' in navigator)) {
            updateStatus('Браузер не поддерживает сервис-воркеры.', 'error');
            return;
        }

        try {
            const registration = await navigator.serviceWorker.register('./sw.js');
            installState.registration = registration;
            installState.hasRegistrationError = false;

            if (registration.waiting) {
                installState.hasUpdateReady = true;
            }

            registration.addEventListener('updatefound', () => {
                const installingWorker = registration.installing;

                if (!installingWorker) {
                    return;
                }

                installingWorker.addEventListener('statechange', () => {
                    if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        installState.hasUpdateReady = true;
                        refreshUi();
                    }
                });
            });

            refreshUi();
        } catch (error) {
            console.warn('PWA registration failed:', error);
            installState.hasRegistrationError = true;
            refreshUi();
        }
    }

    function bindEvents() {
        const { installButton } = getElements();

        if (installButton) {
            installButton.addEventListener('click', promptInstall);
        }

        window.addEventListener('beforeinstallprompt', (event) => {
            event.preventDefault();
            installState.deferredPrompt = event;
            refreshUi();
        });

        window.addEventListener('appinstalled', () => {
            installState.deferredPrompt = null;
            refreshUi();
        });

        window.addEventListener('online', refreshUi);
        window.addEventListener('offline', refreshUi);

        if (standaloneQuery && typeof standaloneQuery.addEventListener === 'function') {
            standaloneQuery.addEventListener('change', refreshUi);
        }
    }

    function scheduleDeferredCallback(callback, timeout = 2500) {
        if (typeof callback !== 'function') {
            return;
        }

        if (typeof window.requestIdleCallback === 'function') {
            window.requestIdleCallback(callback, { timeout });
            return;
        }

        window.setTimeout(callback, timeout);
    }

    function scheduleServiceWorkerRegistration() {
        const register = () => {
            scheduleDeferredCallback(() => {
                registerServiceWorker();
            });
        };

        if (document.readyState === 'complete') {
            register();
            return;
        }

        window.addEventListener('load', register, { once: true });
    }

    function initializePwa() {
        bindEvents();
        refreshUi();
        scheduleServiceWorkerRegistration();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializePwa, { once: true });
    } else {
        initializePwa();
    }
})();
