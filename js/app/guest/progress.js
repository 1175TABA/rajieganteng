/**
 * Modul Pengelola Indikator Progres Pemuatan Aset (Preloader Progress Bar).
 * Mengacak, menambah, serta memperbarui persentase progress indikator loading di layar pembuka,
 * dan memicu event 'undangan.progress.done' setelah semua aset siap.
 */
export const progress = (() => {

    /**
     * Elemen penampil teks status progress (misal: "Loading image complete (3/5) [60%]")
     * @type {HTMLElement|null}
     */
    let info = null;

    /**
     * Elemen baris progress warna biru (progress bar fill)
     * @type {HTMLElement|null}
     */
    let bar = null;

    let total = 0;
    let loaded = 0;
    let valid = true;

    /**
     * Signal pembatalan jika terjadi kesalahan pada progres pemuatan
     * @type {Promise<void>|null}
     */
    let cancelProgress = null;

    /**
     * Menambahkan 1 item ke dalam total antrean aset yang wajib dimuat
     * @returns {void}
     */
    const add = () => {
        total += 1;
    };

    /**
     * Memformat teks ringkasan progres dalam persentase
     * @returns {string}
     */
    const showInformation = () => {
        return `(${loaded}/${total}) [${parseInt((loaded / total) * 100).toFixed(0)}%]`;
    };

    /**
     * Menandai pemuatan suatu jenis aset telah selesai (complete)
     * @param {string} type Tipe aset (misal: 'image', 'audio', 'video', 'libs')
     * @param {boolean} [skip=false] Apakah aset dilewati
     * @returns {void}
     */
    const complete = (type, skip = false) => {
        if (!valid) {
            return;
        }

        loaded += 1;
        info.innerText = `Loading ${type} ${skip ? 'skipped' : 'complete'} ${showInformation()}`;
        bar.style.width = Math.min((loaded / total) * 100, 100).toString() + '%';

        if (loaded === total) {
            valid = false;
            cancelProgress = null;
            document.dispatchEvent(new Event('undangan.progress.done'));
        }
    };

    /**
     * Menandai kegagalan pada pemuatan aset dan mengubah warna progress bar menjadi merah
     * @param {string} type Tipe aset yang gagal dimuat
     * @returns {void}
     */
    const invalid = (type) => {
        if (valid) {
            valid = false;
            bar.style.backgroundColor = 'red';
            info.innerText = `Error loading ${type} ${showInformation()}`;
            document.dispatchEvent(new Event('undangan.progress.invalid'));
        }
    };

    /**
     * Mengembalikan Promise abort yang dipicu saat terjadi kegagalan pemuatan
     * @returns {Promise<void>|null}
     */
    const getAbort = () => cancelProgress;

    /**
     * Menginisialisasi komponen progress bar
     * @returns {void}
     */
    const init = () => {
        info = document.getElementById('progress-info');
        bar = document.getElementById('progress-bar');
        info.classList.remove('d-none');
        cancelProgress = new Promise((res) => document.addEventListener('undangan.progress.invalid', res));
    };

    return {
        init,
        add,
        invalid,
        complete,
        getAbort,
    };
})();