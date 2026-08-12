/**
 * Main Entry Point untuk Halaman Admin Dashboard Undangan.
 * Mengimpor modul admin dan menginisialisasi aplikasi pada objek global `window.undangan`.
 */
import { admin } from './app/admin/admin.js';

((w) => {
    // Menginisialisasi modul admin dan memasangkannya ke variabel global `window.undangan`
    w.undangan = admin.init();
})(window);