/**
 * Modul Komponen Pagination Komentar (Comment Pagination Component).
 * Menangani pembuatan tombol navigasi halaman "Previous" dan "Next",
 * kalkulasi halaman aktif, serta pemicuan penayangan komentar per halaman.
 */
import { util } from '../../common/util.js';

export const pagination = (() => {

    let perPage = 10;
    let pageNow = 0;
    let totalData = 0;

    /**
     * Elemen penampil nomor halaman
     * @type {HTMLElement|null}
     */
    let page = null;

    /**
     * Elemen li tombol Previous
     * @type {HTMLElement|null}
     */
    let liPrev = null;

    /**
     * Elemen li tombol Next
     * @type {HTMLElement|null}
     */
    let liNext = null;

    /**
     * Elemen kontainer pagination
     * @type {HTMLElement|null}
     */
    let paginate = null;

    /**
     * Elemen kontainer daftar komentar
     * @type {HTMLElement|null}
     */
    let comment = null;

    /**
     * Mengatur jumlah item per halaman
     * @param {number} num Jumlah item
     * @returns {void}
     */
    const setPer = (num) => {
        perPage = Number(num);
    };

    /**
     * Mengambil jumlah item per halaman saat ini
     * @returns {number}
     */
    const getPer = () => perPage;

    /**
     * Mengambil offset data untuk halaman berikutnya (offset next)
     * @returns {number}
     */
    const getNext = () => pageNow;

    /**
     * Mengambil total jumlah seluruh komentar
     * @returns {number}
     */
    const geTotal = () => totalData;

    /**
     * Menonaktifkan tombol Previous
     * @returns {void}
     */
    const disablePrevious = () => !liPrev.classList.contains('disabled') ? liPrev.classList.add('disabled') : null;

    /**
     * Mengaktifkan tombol Previous
     * @returns {void}
     */
    const enablePrevious = () => liPrev.classList.contains('disabled') ? liPrev.classList.remove('disabled') : null;

    /**
     * Menonaktifkan tombol Next
     * @returns {void}
     */
    const disableNext = () => !liNext.classList.contains('disabled') ? liNext.classList.add('disabled') : null;

    /**
     * Mengaktifkan tombol Next
     * @returns {void}
     */
    const enableNext = () => liNext.classList.contains('disabled') ? liNext.classList.remove('disabled') : null;

    /**
     * Mengelola animasi loading tombol pagination dan pembaruan offset `pageNow`
     * @param {HTMLButtonElement} button Tombol yang diklik
     * @returns {object} Objek dengan metode `next()` dan `prev()`
     */
    const buttonAction = (button) => {
        disableNext();
        disablePrevious();

        const btn = util.disableButton(button, util.loader.replace('ms-0 me-1', 'mx-1'), true);

        const process = () => {
            comment.addEventListener('undangan.comment.done', () => btn.restore(), { once: true });
            comment.addEventListener('undangan.comment.result', () => comment.scrollIntoView(), { once: true });

            comment.dispatchEvent(new Event('undangan.comment.show'));
        };

        const next = () => {
            pageNow += perPage;
            button.innerHTML = 'Next' + button.innerHTML;
            process();
        };

        const prev = () => {
            pageNow -= perPage;
            button.innerHTML = button.innerHTML + 'Prev';
            process();
        };

        return {
            next,
            prev,
        };
    };

    /**
     * Mengembalikan posisi halaman ke awal (pageNow = 0)
     * @returns {boolean} True jika dilakukan reset
     */
    const reset = () => {
        if (pageNow === 0) {
            return false;
        }

        pageNow = 0;
        disableNext();
        disablePrevious();

        return true;
    };

    /**
     * Memperbarui total data komentar dan mengatur keaktifan tombol Next/Previous
     * @param {number} len Total data komentar dari API
     * @returns {void}
     */
    const setTotal = (len) => {
        totalData = Number(len);

        if (totalData <= perPage && pageNow === 0) {
            paginate.classList.add('d-none');
            return;
        }

        const current = (pageNow / perPage) + 1;
        const total = Math.ceil(totalData / perPage);

        page.innerText = `${current} / ${total}`;

        if (pageNow > 0) {
            enablePrevious();
        }

        if (current >= total) {
            disableNext();
            return;
        }

        enableNext();

        if (paginate.classList.contains('d-none')) {
            paginate.classList.remove('d-none');
        }
    };

    /**
     * Menginisialisasi komponen pagination dan merender markup tombol-tombolnya
     * @returns {void}
     */
    const init = () => {
        paginate = document.getElementById('pagination');
        paginate.innerHTML = `
        <ul class="pagination mb-2 shadow-sm rounded-4">
            <li class="page-item disabled" id="previous">
                <button class="page-link rounded-start-4" onclick="undangan.comment.pagination.previous(this)" data-offline-disabled="false">
                    <i class="fa-solid fa-circle-left me-1"></i>Prev
                </button>
            </li>
            <li class="page-item disabled">
                <span class="page-link text-theme-auto" id="page"></span>
            </li>
            <li class="page-item" id="next">
                <button class="page-link rounded-end-4" onclick="undangan.comment.pagination.next(this)" data-offline-disabled="false">
                    Next<i class="fa-solid fa-circle-right ms-1"></i>
                </button>
            </li>
        </ul>`;

        comment = document.getElementById('comments');
        page = document.getElementById('page');
        liPrev = document.getElementById('previous');
        liNext = document.getElementById('next');
    };

    return {
        init,
        setPer,
        getPer,
        getNext,
        reset,
        setTotal,
        geTotal,
        previous: (btn) => buttonAction(btn).prev(),
        next: (btn) => buttonAction(btn).next(),
    };
})();

