/**
 * Modul Pengelompokan Tab Navigasi Dashboard Admin (Admin Navbar Controller).
 * Menangani pengubahan dan penampilan tab aktif (Home / Setting) pada bilah navigasi admin.
 */
import { bs } from '../../libs/bootstrap.js';

export const navbar = (() => {

    /**
     * Menampilkan tab tertentu yang dipilih pengguna dan menandai tombol navbar terkait sebagai aktif
     * @param {HTMLElement} btn Tombol navigasi yang diklik
     * @param {string} id ID elemen tab tujuan
     * @returns {void}
     */
    const showActiveTab = (btn, id) => {
        document.querySelectorAll('.navbar button').forEach((b) => {
            if (b.classList.contains('active')) {
                b.classList.remove('active');
            }
        });

        bs.tab(id).show();
        btn.classList.add('active');
    };

    /**
     * Membuka tab Dashboard Utama (Home)
     * @param {HTMLElement} btn Tombol navbar Home
     * @returns {void}
     */
    const buttonNavHome = (btn) => {
        showActiveTab(btn, 'button-home');
    };

    /**
     * Membuka tab Pengaturan (Setting)
     * @param {HTMLElement} btn Tombol navbar Setting
     * @returns {void}
     */
    const buttonNavSetting = (btn) => {
        showActiveTab(btn, 'button-setting');
    };

    return {
        buttonNavHome,
        buttonNavSetting,
    };
})();