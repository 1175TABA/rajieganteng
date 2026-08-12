/**
 * Modul Pengelolaan Sesi & Otentikasi (Session & Token Management).
 * Menangani token autentikasi admin/guest, verifikasi JWT token, masa berlaku token, serta request login.
 */
import { util } from './util.js';
import { storage } from './storage.js';
import { dto } from '../connection/dto.js';
import { request, HTTP_POST, HTTP_GET, HTTP_STATUS_OK } from '../connection/request.js';

export const session = (() => {

    /**
     * Penyimpanan sesi lokal
     * @type {ReturnType<typeof storage>|null}
     */
    let ses = null;

    /**
     * Mengambil token autentikasi yang tersimpan di localStorage
     * @returns {string|null} Token JWT atau Access Key
     */
    const getToken = () => ses.get('token');

    /**
     * Menyimpan token autentikasi ke localStorage
     * @param {string} token Token JWT atau Access Key
     * @returns {void}
     */
    const setToken = (token) => ses.set('token', token);

    /**
     * Melakukan request login admin ke API server (/api/session)
     * @param {object} body Kredensial email dan password
     * @returns {Promise<boolean>} Status keberhasilan login
     */
    const login = (body) => {
        return request(HTTP_POST, '/api/session')
            .body(body)
            .send(dto.tokenResponse)
            .then((res) => {
                if (res.code === HTTP_STATUS_OK) {
                    setToken(res.data.token);
                }

                return res.code === HTTP_STATUS_OK;
            });
    };

    /**
     * Menghapus token dari sesi untuk logout
     * @returns {void}
     */
    const logout = () => ses.unset('token');

    /**
     * Memeriksa apakah token yang tersimpan berformat JWT (3 bagian dipisahkan titik), mengindikasikan role admin
     * @returns {boolean}
     */
    const isAdmin = () => String(getToken() ?? '.').split('.').length === 3;

    /**
     * Mengambil konfigurasi undangan untuk tamu berdasarkan token/key dari API
     * @param {string} token Key undangan milik tamu
     * @returns {Promise<object>}
     */
    const guest = (token) => {
        return request(HTTP_GET, '/api/v2/config')
            .withCache(1000 * 60 * 30)
            .withForceCache()
            .token(token)
            .send()
            .then((res) => {
                if (res.code !== HTTP_STATUS_OK) {
                    throw new Error('failed to get config.');
                }

                const config = storage('config');
                for (const [k, v] of Object.entries(res.data)) {
                    config.set(k, v);
                }

                setToken(token);
                return res;
            });
    };

    /**
     * Mengembalikan payload JSON yang didekode dari JWT token admin (jika ada)
     * @returns {object|null} Payload token ter-decode
     */
    const decode = () => {
        if (!isAdmin()) {
            return null;
        }

        try {
            return JSON.parse(util.base64Decode(getToken().split('.')[1]));
        } catch {
            return null;
        }
    };

    /**
     * Memeriksa apakah sesi admin masih valid dan belum kadaluarsa (exp timestamp > Date.now())
     * @returns {boolean}
     */
    const isValid = () => {
        if (!isAdmin()) {
            return false;
        }

        return (decode()?.exp ?? 0) > (Date.now() / 1000);
    };

    /**
     * Menginisialisasi penyimpanan sesi
     * @returns {void}
     */
    const init = () => {
        ses = storage('session');
    };

    return {
        init,
        guest,
        isValid,
        login,
        logout,
        decode,
        isAdmin,
        setToken,
        getToken,
    };
})();