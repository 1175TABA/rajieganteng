/**
 * Modul Pengelolaan Tema (Dark Mode / Light Mode).
 * Menangani alur perubahan tema Bootstrap (data-bs-theme), meta tag theme-color untuk browser seluler,
 * serta sinkronisasi dengan preferensi sistem pengguna atau penyimpanan lokal.
 */
import { storage } from './storage.js';

export const theme = (() => {

    // Pemetaan warna tema untuk penyesuaian header meta theme-color
    const themeColors = {
        '#000000': '#ffffff',
        '#ffffff': '#000000',
        '#212529': '#f8f9fa',
        '#f8f9fa': '#212529'
    };
    const themeLight = ['#ffffff', '#f8f9fa'];
    const themeDark = ['#000000', '#212529'];

    let isAuto = false;

    /**
     * Objek penyimpanan tema pada localStorage
     * @type {ReturnType<typeof storage>|null}
     */
    let themes = null;

    /**
     * Elemen meta tag theme-color pada head dokumen
     * @type {HTMLElement|null}
     */
    let metaTheme = null;

    /**
     * Menyimpan preferensi tema terang (light) ke localStorage
     * @returns {void}
     */
    const setLight = () => themes.set('active', 'light');

    /**
     * Menyimpan preferensi tema gelap (dark) ke localStorage
     * @returns {void}
     */
    const setDark = () => themes.set('active', 'dark');

    /**
     * Memperbarui atribut warna meta theme-color di dokumen HTML
     * @param {string[]} listTheme Daftar warna acuan
     * @returns {void}
     */
    const setMetaTheme = (listTheme) => {
        const now = metaTheme.getAttribute('content');
        metaTheme.setAttribute('content', listTheme.some((i) => i === now) ? themeColors[now] : now);
    };

    /**
     * Mengaktifkan tema terang (light mode) pada elemen HTML root
     * @returns {void}
     */
    const onLight = () => {
        setLight();
        document.documentElement.setAttribute('data-bs-theme', 'light');
        setMetaTheme(themeDark);
    };

    /**
     * Mengaktifkan tema gelap (dark mode) pada elemen HTML root
     * @returns {void}
     */
    const onDark = () => {
        setDark();
        document.documentElement.setAttribute('data-bs-theme', 'dark');
        setMetaTheme(themeLight);
    };

    /**
     * Memeriksa apakah mode gelap sedang aktif
     * @param {string|null} [dark=null] Nilai opsional yang dikembalikan jika dark mode aktif
     * @param {string|null} [light=null] Nilai opsional yang dikembalikan jika light mode aktif
     * @returns {boolean|string}
     */
    const isDarkMode = (dark = null, light = null) => {
        const status = themes.get('active') === 'dark';

        if (dark && light) {
            return status ? dark : light;
        }

        return status;
    };

    /**
     * Mengubah/tukar mode antara terang dan gelap (toggle theme)
     * @returns {void}
     */
    const change = () => isDarkMode() ? onLight() : onDark();

    /**
     * Memeriksa apakah tema dikonfigurasi secara otomatis
     * @returns {boolean}
     */
    const isAutoMode = () => isAuto;

    /**
     * Memantau posisi scroll section menggunakan IntersectionObserver untuk menyesuaikan meta theme-color
     * @returns {void}
     */
    const spyTop = () => {
        const callback = (es) => es.filter((e) => e.isIntersecting).forEach((e) => {
            const themeColor = e.target.classList.contains('bg-white-black')
                ? isDarkMode(themeDark[0], themeLight[0])
                : isDarkMode(themeDark[1], themeLight[1]);

            metaTheme.setAttribute('content', themeColor);
        });

        const observerTop = new IntersectionObserver(callback, { rootMargin: '0% 0% -95% 0%' });
        document.querySelectorAll('section').forEach((e) => observerTop.observe(e));
    };

    /**
     * Menginisialisasi konfigurasi tema berdasarkan localStorage atau preferensi sistem (prefers-color-scheme)
     * @returns {void}
     */
    const init = () => {
        themes = storage('theme');
        metaTheme = document.querySelector('meta[name="theme-color"]');

        if (!themes.has('active')) {
            window.matchMedia('(prefers-color-scheme: dark)').matches ? setDark() : setLight();
        }

        switch (document.documentElement.getAttribute('data-bs-theme')) {
            case 'dark':
                setDark();
                break;
            case 'light':
                setLight();
                break;
            default:
                isAuto = true;
        }

        if (isDarkMode()) {
            onDark();
        } else {
            onLight();
        }
    };

    return {
        init,
        spyTop,
        change,
        isDarkMode,
        isAutoMode,
    };
})();