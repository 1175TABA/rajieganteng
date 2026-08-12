/**
 * Modul Utama Dasbor Pengelola Undangan (Admin Dashboard Controller).
 * Mengelola statistik ucapan, kehadiran, dan suka (likes), pembuatan ulang access key undangan,
 * pengunduhan data komentar (format CSV), konfigurasi Tenor API Key, pengaturan filter kata kasar,
 * serta pengubahan kata sandi, nama profil, dan zona waktu (time zone).
 */
import { auth } from './auth.js';
import { navbar } from './navbar.js';
import { util } from '../../common/util.js';
import { dto } from '../../connection/dto.js';
import { theme } from '../../common/theme.js';
import { lang } from '../../common/language.js';
import { storage } from '../../common/storage.js';
import { session } from '../../common/session.js';
import { offline } from '../../common/offline.js';
import { comment } from '../components/comment.js';
import { pool, request, HTTP_GET, HTTP_PATCH, HTTP_PUT } from '../../connection/request.js';

export const admin = (() => {

    /**
     * Mengambil dan merender informasi statistik ucapan, jumlah hadir/absen, serta konfigurasi akun admin dari API
     * @returns {Promise<void>}
     */
    const getUserStats = () => auth.getDetailUser().then((res) => {

        util.safeInnerHTML(document.getElementById('dashboard-name'), `${util.escapeHtml(res.data.name)}<i class="fa-solid fa-hands text-warning ms-2"></i>`);
        document.getElementById('dashboard-email').textContent = res.data.email;
        document.getElementById('dashboard-accesskey').value = res.data.access_key;
        document.getElementById('button-copy-accesskey').setAttribute('data-copy', res.data.access_key);

        document.getElementById('form-name').value = util.escapeHtml(res.data.name);
        document.getElementById('form-timezone').value = res.data.tz;
        document.getElementById('filterBadWord').checked = Boolean(res.data.is_filter);
        document.getElementById('confettiAnimation').checked = Boolean(res.data.is_confetti_animation);
        document.getElementById('replyComment').checked = Boolean(res.data.can_reply);
        document.getElementById('editComment').checked = Boolean(res.data.can_edit);
        document.getElementById('deleteComment').checked = Boolean(res.data.can_delete);
        document.getElementById('dashboard-tenorkey').value = res.data.tenor_key;

        storage('config').set('tenor_key', res.data.tenor_key);
        document.dispatchEvent(new Event('undangan.session'));

        request(HTTP_GET, '/api/stats').token(session.getToken()).withCache(1000 * 30).withForceCache().send().then((resp) => {
            document.getElementById('count-comment').textContent = String(resp.data.comments).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
            document.getElementById('count-like').textContent = String(resp.data.likes).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
            document.getElementById('count-present').textContent = String(resp.data.present).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
            document.getElementById('count-absent').textContent = String(resp.data.absent).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        });

        comment.show();
    });

    /**
     * Mengirimkan perubahan opsi pengaturan berjenis boolean (checkbox toggle) ke API server (PATCH /api/user)
     * @param {HTMLElement} checkbox Elemen checkbox yang diubah
     * @param {string} type Nama properti pengaturan (misal: 'is_filter', 'can_reply', dll)
     * @returns {void}
     */
    const changeCheckboxValue = (checkbox, type) => {
        const label = util.disableCheckbox(checkbox);

        request(HTTP_PATCH, '/api/user')
            .token(session.getToken())
            .body({ [type]: checkbox.checked })
            .send()
            .finally(() => label.restore());
    };

    /**
     * Menyimpan atau menghapus API Key Tenor GIF (PATCH /api/user)
     * @param {HTMLButtonElement} button Tombol simpan Tenor key
     * @returns {void}
     */
    const tenor = (button) => {
        const btn = util.disableButton(button);

        const form = document.getElementById('dashboard-tenorkey');
        form.disabled = true;

        request(HTTP_PATCH, '/api/user')
            .token(session.getToken())
            .body({ tenor_key: form.value.length ? form.value : null })
            .send()
            .then(() => util.notify(`success ${form.value.length ? 'add' : 'remove'} tenor key`).success())
            .finally(() => {
                form.disabled = false;
                btn.restore();
            });
    };

    /**
     * Menghasilkan ulang (regenerate) Access Key undangan (PUT /api/key)
     * @param {HTMLButtonElement} button Tombol regenerate
     * @returns {void}
     */
    const regenerate = (button) => {
        if (!util.ask('Are you sure?')) {
            return;
        }

        const btn = util.disableButton(button);

        request(HTTP_PUT, '/api/key')
            .token(session.getToken())
            .send(dto.statusResponse)
            .then((res) => {
                if (!res.data.status) {
                    return;
                }

                getUserStats();
            })
            .finally(() => btn.restore());
    };

    /**
     * Mengubah kata sandi pengguna admin (PATCH /api/user)
     * @param {HTMLButtonElement} button Tombol ganti password
     * @returns {void}
     */
    const changePassword = (button) => {
        const old = document.getElementById('old_password');
        const newest = document.getElementById('new_password');

        if (old.value.length === 0 || newest.value.length === 0) {
            util.notify('Password cannot be empty').warning();
            return;
        }

        old.disabled = true;
        newest.disabled = true;

        const btn = util.disableButton(button);

        request(HTTP_PATCH, '/api/user')
            .token(session.getToken())
            .body({
                old_password: old.value,
                new_password: newest.value,
            })
            .send(dto.statusResponse)
            .then((res) => {
                if (!res.data.status) {
                    return;
                }

                old.value = null;
                newest.value = null;
                util.notify('Success change password').success();
            })
            .finally(() => {
                btn.restore(true);

                old.disabled = false;
                newest.disabled = false;
            });
    };

    /**
     * Mengubah nama profil pengguna admin (PATCH /api/user)
     * @param {HTMLButtonElement} button Tombol ganti nama
     * @returns {void}
     */
    const changeName = (button) => {
        const name = document.getElementById('form-name');

        if (name.value.length === 0) {
            util.notify('Name cannot be empty').warning();
            return;
        }

        name.disabled = true;
        const btn = util.disableButton(button);

        request(HTTP_PATCH, '/api/user')
            .token(session.getToken())
            .body({ name: name.value })
            .send(dto.statusResponse)
            .then((res) => {
                if (!res.data.status) {
                    return;
                }

                util.safeInnerHTML(document.getElementById('dashboard-name'), `${util.escapeHtml(name.value)}<i class="fa-solid fa-hands text-warning ms-2"></i>`);
                util.notify('Success change name').success();
            })
            .finally(() => {
                name.disabled = false;
                btn.restore(true);
            });
    };

    /**
     * Mengunduh seluruh data ucapan/komentar dalam berkas berformat CSV (GET /api/download)
     * @param {HTMLButtonElement} button Tombol download CSV
     * @returns {void}
     */
    const download = (button) => {
        const btn = util.disableButton(button);
        request(HTTP_GET, '/api/download')
            .token(session.getToken())
            .withDownload('download', 'csv')
            .send()
            .finally(() => btn.restore());
    };

    /**
     * Mengaktifkan tombol ubah nama saat ada perubahan input
     * @returns {void}
     */
    const enableButtonName = () => {
        const btn = document.getElementById('button-change-name');
        if (btn.disabled) {
            btn.disabled = false;
        }
    };

    /**
     * Mengaktifkan tombol ubah password saat form diisi
     * @returns {void}
     */
    const enableButtonPassword = () => {
        const btn = document.getElementById('button-change-password');
        const old = document.getElementById('old_password');

        if (btn.disabled && old.value.length !== 0) {
            btn.disabled = false;
        }
    };

    /**
     * Menampilkan daftar pilihan zona waktu IANA pada menu dropdown pilihan
     * @param {HTMLFormElement} form Input form timezone
     * @param {string|null} [query=null] Kata kunci pencarian timezone
     * @returns {void}
     */
    const openLists = (form, query = null) => {
        let timezones = Intl.supportedValuesOf('timeZone');
        const dropdown = document.getElementById('dropdown-tz-list');

        if (form.value && form.value.trim().length > 0) {
            timezones = timezones.filter((tz) => tz.toLowerCase().includes(form.value.trim().toLowerCase()));
        }

        if (query === null) {
            document.addEventListener('click', (e) => {
                if (!form.contains(e.currentTarget) && !dropdown.contains(e.currentTarget)) {
                    if (form.value.trim().length <= 0) {
                        form.setCustomValidity('Timezone cannot be empty.');
                        form.reportValidity();
                        return;
                    }

                    form.setCustomValidity('');
                    dropdown.classList.add('d-none');
                }
            }, { once: true, capture: true });
        }

        dropdown.replaceChildren();
        dropdown.classList.remove('d-none');

        timezones.slice(0, 20).forEach((tz) => {
            const item = document.createElement('button');
            item.type = 'button';
            item.className = 'list-group-item list-group-item-action py-1 small';
            item.textContent = `${tz} (${util.getGMTOffset(tz)})`;
            item.onclick = () => {
                form.value = tz;
                dropdown.classList.add('d-none');
                document.getElementById('button-timezone').disabled = false;
            };
            dropdown.appendChild(item);
        });
    };

    /**
     * Mengubah zona waktu akun pengguna (PATCH /api/user)
     * @param {HTMLButtonElement} button Tombol simpan timezone
     * @returns {void}
     */
    const changeTz = (button) => {
        const tz = document.getElementById('form-timezone');

        if (tz.value.length === 0) {
            util.notify('Time zone cannot be empty').warning();
            return;
        }

        if (!Intl.supportedValuesOf('timeZone').includes(tz.value)) {
            util.notify('Timezone not supported').warning();
            return;
        }

        tz.disabled = true;
        const btn = util.disableButton(button);

        request(HTTP_PATCH, '/api/user')
            .token(session.getToken())
            .body({ tz: tz.value })
            .send(dto.statusResponse)
            .then((res) => {
                if (!res.data.status) {
                    return;
                }

                util.notify('Success change tz').success();
            })
            .finally(() => {
                tz.disabled = false;
                btn.restore(true);
            });
    };

    /**
     * Keluar dari akun admin (Logout)
     * @returns {void}
     */
    const logout = () => {
        if (!util.ask('Are you sure?')) {
            return;
        }

        auth.clearSession();
    };

    /**
     * Pemasangan awal komponen halaman admin setelah DOM dimuat
     * @returns {void}
     */
    const pageLoaded = () => {
        lang.init();
        lang.setDefault('en');

        comment.init();
        offline.init();
        theme.spyTop();

        document.addEventListener('hidden.bs.modal', getUserStats);

        const raw = window.location.hash.slice(1);
        if (raw.length > 0) {
            session.setToken(raw);
            window.history.replaceState({}, document.title, window.location.pathname);
        }

        session.isValid() ? getUserStats() : auth.clearSession();
    };

    /**
     * Inisialisasi utama modul admin
     * @returns {object} Public API pengelola admin
     */
    const init = () => {
        auth.init();
        theme.init();
        session.init();

        if (!session.isAdmin()) {
            storage('owns').clear();
            storage('likes').clear();
            storage('config').clear();
            storage('comment').clear();
            storage('session').clear();
            storage('information').clear();
        }

        window.addEventListener('load', () => pool.init(pageLoaded, ['gif']));

        return {
            util,
            theme,
            comment,
            admin: {
                auth,
                navbar,
                logout,
                tenor,
                download,
                regenerate,
                changeName,
                changePassword,
                changeCheckboxValue,
                enableButtonName,
                enableButtonPassword,
                openLists,
                changeTz,
            },
        };
    };

    return {
        init,
    };
})();