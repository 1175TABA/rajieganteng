/**
 * Modul Pengelolaan & Caching Gambar (Image Loader & Downloader).
 * Mengunduh seluruh gambar yang ada pada halaman, memproses dengan Cache API,
 * memprioritaskan pemuatan berbasis atribut `fetchpriority`, serta menyediakan fitur unduh gambar.
 */
import { progress } from './progress.js';
import { cache } from '../../connection/cache.js';

export const image = (() => {

    /**
     * Daftar seluruh elemen <img> pada dokumen
     * @type {NodeListOf<HTMLImageElement>|null}
     */
    let images = null;

    /**
     * Instansi Cache untuk gambar
     * @type {ReturnType<typeof cache>|null}
     */
    let c = null;

    /**
     * Antrean aset gambar yang akan dimuat
     * @type {object[]}
     */
    const urlCache = [];

    /**
     * Membuat instansi Image HTML untuk mendeteksi kesiapan muat gambar
     * @param {string} src URL sumber gambar
     * @returns {Promise<HTMLImageElement>}
     */
    const loadedImage = (src) => new Promise((res, rej) => {
        const i = new Image();
        i.onload = () => res(i);
        i.onerror = rej;
        i.src = src;
    });

    /**
     * Memasangkan sumber gambar (src) ke elemen HTML <img> dan mengatur dimensi secara tepat
     * @param {HTMLImageElement} el Elemen target <img>
     * @param {string} src URL sumber gambar (Blob URL atau URL asli)
     * @returns {Promise<void>}
     */
    const appendImage = (el, src) => loadedImage(src).then((img) => {
        el.width = img.naturalWidth;
        el.height = img.naturalHeight;
        el.classList.remove('opacity-0');
        el.src = img.src;
        img.remove();

        progress.complete('image');
    });

    /**
     * Mengambil gambar dari Cache API (menggunakan atribut `data-src`)
     * @param {HTMLImageElement} el Elemen gambar
     * @returns {void}
     */
    const getByFetch = (el) => {
        urlCache.push({
            url: el.getAttribute('data-src'),
            res: (url) => appendImage(el, url),
            rej: (err) => {
                console.warn('Failed to load image, using fallback:', el.getAttribute('data-src'), err);
                appendImage(el, el.src).catch(() => progress.invalid('image'));
            },
        });
    };

    /**
     * Mengambil gambar secara konvensional (default browser load) jika tidak memiliki atribut `data-src`
     * @param {HTMLImageElement} el Elemen gambar
     * @returns {void}
     */
    const getByDefault = (el) => {
        el.onerror = () => progress.invalid('image');
        el.onload = () => {
            el.width = el.naturalWidth;
            el.height = el.naturalHeight;
            progress.complete('image');
        };

        if (el.complete && el.naturalWidth !== 0 && el.naturalHeight !== 0) {
            progress.complete('image');
        } else if (el.complete) {
            progress.invalid('image');
        }
    };

    /**
     * Memeriksa apakah ada elemen gambar yang memiliki atribut `data-src`
     * @returns {boolean}
     */
    const hasDataSrc = () => Array.from(images).some((i) => i.hasAttribute('data-src'));

    /**
     * Memuat seluruh gambar pada dokumen secara berurutan sesuai prioritas
     * @returns {Promise<void>}
     */
    const load = async () => {
        const imgs = Array.from(images);

        /**
         * Menjalankan pemuatan sekelompok gambar sesuai filter prioritas
         * @param {function} filter Fungsi penyaring elemen
         * @returns {Promise<void>}
         */
        const runGroup = async (filter) => {
            urlCache.length = 0;
            imgs.filter(filter).forEach((el) => el.hasAttribute('data-src') ? getByFetch(el) : getByDefault(el));
            await c.run(urlCache, progress.getAbort());
        };

        // Muat gambar berprioritas tinggi terlebih dahulu (fetchpriority), kemudian gambar berprioritas normal
        await runGroup((el) => el.hasAttribute('fetchpriority'));
        await runGroup((el) => !el.hasAttribute('fetchpriority'));
    };

    /**
     * Memicu pengunduhan file gambar ke perangkat pengguna
     * @param {string} blobUrl URL Blob gambar
     * @returns {void}
     */
    const download = (blobUrl) => {
        c.download(blobUrl, `${window.location.hostname}_image_${Date.now()}`);
    };

    /**
     * Menginisialisasi modul pemuat gambar
     * @returns {object}
     */
    const init = () => {
        c = cache('image').withForceCache();
        images = document.querySelectorAll('img');
        images.forEach(progress.add);

        return {
            load,
            download,
            hasDataSrc,
        };
    };

    return {
        init,
    };
})();