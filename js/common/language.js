/**
 * Modul Pengelolaan Bahasa & Lokalisasi (Multi-language Support).
 * Mendeteksi bahasa browser pengguna dan menyediakan utilitas terjemahan/pemetaan bahasa.
 */
export const lang = (() => {

    // Pemetaan kode bahasa ke kode negara 2 huruf (ISO 3166-1 alpha-2)
    const countryMapping = {
        'id': 'ID',
        'en': 'US',
        'fr': 'FR',
        'de': 'DE',
        'es': 'ES',
        'zh': 'CN',
        'ja': 'JP',
        'ko': 'KR',
        'ar': 'SA',
        'ru': 'RU',
        'it': 'IT',
        'nl': 'NL',
        'pt': 'PT',
        'tr': 'TR',
        'th': 'TH',
        'vi': 'VN',
        'ms': 'MY',
        'hi': 'IN',
    };

    /**
     * Kode negara aktif (misal: 'ID', 'US')
     * @type {string|null}
     */
    let country = null;

    /**
     * Kode locale gabungan (misal: 'id_ID', 'en_US')
     * @type {string|null}
     */
    let locale = null;

    /**
     * Kode bahasa aktif (misal: 'id', 'en')
     * @type {string|null}
     */
    let language = null;

    /**
     * Peta terjemahan pesan berbasis bahasa
     * @type {Map<string, string>|null}
     */
    let mapping = null;

    return {
        /**
         * Mendaftarkan opsi teks terjemahan untuk kode bahasa tertentu.
         * @param {string} l Kode bahasa (misal 'id' atau 'en')
         * @param {string} val Teks terjemahan
         * @returns {this}
         */
        on(l, val) {
            mapping.set(l, val);
            return this;
        },
        /**
         * Mengambil teks terjemahan yang sesuai dengan bahasa aktif saat ini lalu mengosongkan peta terjemahan.
         * @returns {string|undefined}
         */
        get() {
            const tmp = mapping.get(language);
            mapping.clear();
            return tmp;
        },
        /**
         * Mengembalikan kode negara aktif.
         * @returns {string|null}
         */
        getCountry() {
            return country;
        },
        /**
         * Mengembalikan kode locale aktif.
         * @returns {string|null}
         */
        getLocale() {
            return locale;
        },
        /**
         * Mengembalikan kode bahasa aktif.
         * @returns {string|null}
         */
        getLanguage() {
            return language;
        },
        /**
         * Mengatur bahasa default aplikasi berdasarkan kode bahasa yang diberikan.
         * @param {string} l Kode bahasa
         * @returns {void}
         */
        setDefault(l) {
            let isFound = true;
            if (!countryMapping[l]) {
                isFound = false;
                console.warn('Language not found, please add manually in countryMapping');
            }

            country = isFound ? countryMapping[l] : 'US';
            language = isFound ? l : 'en';
            locale = `${language}_${country}`;
        },
        /**
         * Menginisialisasi modul bahasa dengan membaca bahasa utama dari browser pengguna.
         * @returns {void}
         */
        init() {
            mapping = new Map();
            this.setDefault(navigator.language.split('-').shift());
        },
    };
})();