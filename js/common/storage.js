/**
 * Helper Utility untuk Pengelolaan LocalStorage berbasis Nama Tabel (Key Store).
 * Menyediakan fungsi pembungkus (wrapper) untuk membaca, menulis, mengecek, dan menghapus data JSON pada LocalStorage.
 *
 * @param {string} table Nama tabel/key utama di LocalStorage
 */
export const storage = (table) => {

    /**
     * Mengambil nilai data dari localStorage berdasarkan key tertentu atau seluruh tabel.
     * @param {string|null} [key=null] Key spesifik yang ingin diambil
     * @returns {any} Nilai dari key tersebut, atau seluruh data tabel jika key=null
     */
    const get = (key = null) => {
        const data = JSON.parse(localStorage.getItem(table));
        return key ? data[String(key)] : data;
    };

    /**
     * Menyimpan nilai baru ke dalam tabel localStorage.
     * @param {string} key Key data
     * @param {any} value Nilai data yang akan disimpan
     * @returns {void}
     */
    const set = (key, value) => {
        const data = get();
        data[String(key)] = value;
        localStorage.setItem(table, JSON.stringify(data));
    };

    /**
     * Memeriksa apakah key tertentu ada di dalam tabel localStorage.
     * @param {string} key Key data
     * @returns {boolean} True jika key ditemukan
     */
    const has = (key) => Object.keys(get()).includes(String(key));

    /**
     * Menghapus key tertentu dari tabel localStorage.
     * @param {string} key Key data yang akan dihapus
     * @returns {void}
     */
    const unset = (key) => {
        if (!has(key)) {
            return;
        }

        const data = get();
        delete data[String(key)];
        localStorage.setItem(table, JSON.stringify(data));
    };

    /**
     * Mengosongkan tabel pada localStorage dengan mengeset objek JSON kosong.
     * @returns {void}
     */
    const clear = () => localStorage.setItem(table, '{}');

    // Inisialisasi awal tabel di localStorage jika belum pernah dibuat
    if (!localStorage.getItem(table)) {
        clear();
    }

    return {
        set,
        get,
        has,
        clear,
        unset,
    };
};