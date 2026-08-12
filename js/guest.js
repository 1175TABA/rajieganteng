/**
 * Main Entry Point untuk Halaman Tamu Undangan (Guest Page).
 * Mengimpor modul guest dan menginisialisasi aplikasi pada objek global `window.undangan`.
 */
import { guest } from './app/guest/guest.js';

((w) => {
    // Menginisialisasi modul guest dan memasangkannya ke variabel global `window.undangan`
    w.undangan = guest.init();
})(window);