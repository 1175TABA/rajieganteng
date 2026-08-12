/**
 * Modul Penanganan Status Koneksi Internet (Offline & Online Handler).
 * Memantau status koneksi browser (event 'online' dan 'offline'),
 * menampilkan pemberitahuan toast banner koneksi, dan menonaktifkan elemen form secara otomatis saat offline.
 */
import { util } from './util.js';

export const offline = (() => {

    /**
     * Elemen alert banner pemberitahuan status koneksi
     * @type {HTMLElement|null}
     */
    let alert = null;

    let online = true;

    // Selector elemen yang akan di-disabled secara otomatis saat koneksi terputus (offline)
    const classes = [
        'input[data-offline-disabled]',
        'button[data-offline-disabled]',
        'select[data-offline-disabled]',
        'textarea[data-offline-disabled]',
    ];

    /**
     * Memeriksa apakah perangkat terhubung ke internet saat ini
     * @returns {boolean} True jika online
     */
    const isOnline = () => online;

    /**
     * Mengubah tampilan elemen alert menjadi warna merah (offline state)
     * @returns {void}
     */
    const setOffline = () => {
        const el = alert.firstElementChild.firstElementChild;
        el.classList.remove('bg-success');
        el.classList.add('bg-danger');
        el.firstElementChild.innerHTML = '<i class="fa-solid fa-ban me-2"></i>Koneksi tidak tersedia';
    };

    /**
     * Mengubah tampilan elemen alert menjadi warna hijau (online state)
     * @returns {void}
     */
    const setOnline = () => {
        const el = alert.firstElementChild.firstElementChild;
        el.classList.remove('bg-danger');
        el.classList.add('bg-success');
        el.firstElementChild.innerHTML = '<i class="fa-solid fa-cloud me-2"></i>Koneksi tersedia kembali';
    };

    /**
     * Mengembalikan status alert ke tampilan default (fade out banner setelah beberapa detik)
     * @returns {Promise<void>}
     */
    const setDefaultState = async () => {
        if (!online) {
            return;
        }

        await util.changeOpacity(alert, false);
        setOffline();
    };

    /**
     * Mengubah atribut status disabled dan memicu event 'online'/'offline' pada elemen-elemen form yang ditandai
     * @returns {void}
     */
    const changeState = () => {
        document.querySelectorAll(classes.join(', ')).forEach((e) => {

            e.dispatchEvent(new Event(isOnline() ? 'online' : 'offline'));
            e.setAttribute('data-offline-disabled', isOnline() ? 'false' : 'true');

            if (e.tagName === 'BUTTON') {
                isOnline() ? e.classList.remove('disabled') : e.classList.add('disabled');
            } else {
                isOnline() ? e.removeAttribute('disabled') : e.setAttribute('disabled', 'true');
            }
        });
    };

    /**
     * Handler saat event 'offline' dipicu oleh window browser
     * @returns {void}
     */
    const onOffline = () => {
        online = false;

        setOffline();
        util.changeOpacity(alert, true);
        changeState();
    };

    /**
     * Handler saat event 'online' dipicu oleh window browser
     * @returns {void}
     */
    const onOnline = () => {
        online = true;

        setOnline();
        util.timeOut(setDefaultState, 3000);
        changeState();
    };

    /**
     * Menginisialisasi event listener koneksi dan membuat elemen alert pemberitahuan mengambang di atas layar
     * @returns {void}
     */
    const init = () => {
        window.addEventListener('online', onOnline);
        window.addEventListener('offline', onOffline);

        alert = document.createElement('div');
        alert.classList.add('fixed-top', 'pe-none');
        alert.style.cssText = 'opacity: 0; z-index: 1057;';
        alert.innerHTML = `
        <div class="d-flex justify-content-center mx-auto">
            <div class="d-flex justify-content-center align-items-center rounded-pill my-2 bg-danger shadow">
                <small class="text-center py-1 px-2 mx-1 mt-1 mb-0 text-white" style="font-size: 0.8rem;"></small>
            </div>
        </div>`;

        document.body.insertBefore(alert, document.body.lastChild);
    };

    return {
        init,
        isOnline,
    };
})();