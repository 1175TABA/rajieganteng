/**
 * Modul Cache Manager Objek & Asset (Image/Audio/Video Blob Cache).
 * Menyediakan caching media berbasis Blob / ObjectURL, pencegahan request ganda (in-flight request deduplication),
 * serta pengunduhan aset media secara batch.
 *
 * @param {string} cacheName Nama cache kategori (misal: 'image', 'audio', 'video')
 */
import { request, cacheWrapper, HTTP_GET } from './request.js';

export const cache = (cacheName) => {

    /**
     * Map penyimpan ObjectURL yang telah dibuat dari Blob (URL -> blobUrl)
     * @type {Map<string, string>}
     */
    const objectUrls = new Map();

    /**
     * Map penyimpan request yang sedang berjalan untuk mencegah pengunduhan ganda bersamaan (in-flight request deduplication)
     * @type {Map<string, Promise<string>>}
     */
    const inFlightRequests = new Map();

    /**
     * Pembungkus Cache API
     * @type {ReturnType<typeof cacheWrapper>}
     */
    const cw = cacheWrapper(cacheName);

    // TTL default cache aset: 6 jam (dalam milidetik)
    let ttl = 1000 * 60 * 60 * 6;

    let forceCache = false;

    /**
     * Menyimpan respon media ke dalam Cache API
     * @param {string|URL} input URL aset
     * @param {Response} res Objek respon HTTP
     * @returns {Promise<Response>}
     */
    const set = (input, res) => {
        if (!res.ok) {
            throw new Error(res.statusText);
        }

        return cw.set(input, res, forceCache, ttl);
    };

    /**
     * Memeriksa keberadaan aset pada cache
     * @param {string|URL} input URL aset
     * @returns {Promise<Response|null>}
     */
    const has = (input) => cw.has(input);

    /**
     * Menghapus aset dari cache
     * @param {string|URL} input URL aset
     * @returns {Promise<boolean>}
     */
    const del = (input) => cw.del(input);

    /**
     * Mengambil aset dari ObjectURL yang sudah ada, atau mengunduhnya dari cache/jaringan jika belum ada.
     * Mengembalikan URL Blob lokal (`blob:...`) yang dapat dipasang ke elemen <img>/<video>/<audio>.
     *
     * @param {string} input URL aset media
     * @param {Promise<void>|null} [cancel=null] Signal pembatalan request
     * @returns {Promise<string>} URL Blob lokal
     */
    const get = (input, cancel = null) => {
        if (objectUrls.has(input)) {
            return Promise.resolve(objectUrls.get(input));
        }

        if (inFlightRequests.has(input)) {
            return inFlightRequests.get(input);
        }

        /**
         * Request mendasar menggunakan modul `request`
         * @returns {Promise<Response>}
         */
        const fetchPut = () => request(HTTP_GET, input).withCancel(cancel).withRetry().default();

        const inflightPromise = has(input)
            .then((res) => res ? Promise.resolve(res) : del(input).then(fetchPut).then((r) => set(input, r)))
            .then((r) => r.blob())
            .then((b) => objectUrls.set(input, URL.createObjectURL(b)))
            .then(() => objectUrls.get(input))
            .finally(() => inFlightRequests.delete(input));

        inFlightRequests.set(input, inflightPromise);
        return inflightPromise;
    };

    /**
     * Menjalankan pemuatan beberapa aset media secara berskala batch (Promise.allSettled)
     * @param {object[]} items Daftar aset yang akan dimuat ({ url, res, rej })
     * @param {Promise<void>|null} cancel Signal pembatalan
     * @returns {Promise<void>}
     */
    const run = (items, cancel = null) => {
        const uniq = new Map();

        if (items.length === 0) {
            return Promise.resolve();
        }

        items.filter((val) => val !== null).forEach((val) => {
            const exist = uniq.get(val.url) ?? [];
            uniq.set(val.url, [...exist, [val.res, val?.rej]]);
        });

        return Promise.allSettled(Array.from(uniq).map(([k, v]) => get(k, cancel)
            .then((s) => {
                v.forEach((cb) => cb[0]?.(s));
                return s;
            })
            .catch((r) => {
                v.forEach((cb) => cb[1]?.(r));
                return r;
            })
        ));
    };

    /**
     * Memicu pengunduhan file dari Blob URL atau URL jaringan
     * @param {string} input URL Aset / Blob URL
     * @param {string} name Nama file hasil unduhan
     * @returns {Promise<Response>}
     */
    const download = async (input, name) => {
        const reverse = new Map(Array.from(objectUrls.entries()).map(([k, v]) => [v, k]));

        if (!reverse.has(input)) {
            try {
                const checkUrl = new URL(input);
                if (!checkUrl.protocol.includes('blob')) {
                    throw new Error('Is not blob');
                }
            } catch {
                input = await get(input);
            }
        }

        return request(HTTP_GET, input).withDownload(name).default();
    };

    return {
        run,
        del,
        has,
        set,
        get,
        open,
        download,
        /**
         * Mengatur batas durasi aktif (TTL) cache
         * @param {number} v TTL dalam milidetik
         * @returns {ReturnType<typeof cache>} 
         */
        setTtl(v) {
            ttl = Number(v);
            return this;
        },
        /**
         * Mengaktifkan opsi penyimpanan paksa (force cache)
         * @returns {ReturnType<typeof cache>} 
         */
        withForceCache() {
            forceCache = true;
            return this;
        },
    };
};