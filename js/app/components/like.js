/**
 * Modul Pengelolaan Suka / Like Komentar (Comment Like Component).
 * Menangani fungsi menyukai komentar (love/unlike), efek getar (vibration),
 * serta deteksi gestur ketuk dua kali (Double-Tap / Tap-Tap) di layar sentuh dengan animasi hati.
 */
import { dto } from '../../connection/dto.js';
import { storage } from '../../common/storage.js';
import { session } from '../../common/session.js';
import { tapTapAnimation } from '../../libs/confetti.js';
import { request, HTTP_PATCH, HTTP_POST, HTTP_STATUS_CREATED } from '../../connection/request.js';

export const like = (() => {

    /**
     * Penyimpanan data komentar yang sudah disukai pada localStorage
     * @type {ReturnType<typeof storage>|null}
     */
    let likes = null;

    /**
     * Peta penyimpan AbortController untuk listener touch pada tiap komentar
     * @type {Map<string, AbortController>|null}
     */
    let listeners = null;

    /**
     * Menjalankan aksi Like (POST API) atau Unlike (PATCH API) saat tombol hati diklik
     * @param {HTMLButtonElement} button Tombol like
     * @returns {Promise<void>}
     */
    const love = async (button) => {

        const info = button.firstElementChild;
        const heart = button.lastElementChild;

        const id = button.getAttribute('data-uuid');
        const count = parseInt(info.getAttribute('data-count-like'));

        button.disabled = true;

        if (navigator.vibrate) {
            navigator.vibrate(100);
        }

        if (likes.has(id)) {
            // Proses Batal Suka (Unlike)
            await request(HTTP_PATCH, '/api/comment/' + likes.get(id))
                .token(session.getToken())
                .send(dto.statusResponse)
                .then((res) => {
                    if (res.data.status) {
                        likes.unset(id);

                        heart.classList.remove('fa-solid', 'text-danger');
                        heart.classList.add('fa-regular');

                        info.setAttribute('data-count-like', String(count - 1));
                    }
                })
                .finally(() => {
                    info.innerText = info.getAttribute('data-count-like');
                    button.disabled = false;
                });
        } else {
            // Proses Beri Suka (Like)
            await request(HTTP_POST, '/api/comment/' + id)
                .token(session.getToken())
                .send(dto.uuidResponse)
                .then((res) => {
                    if (res.code === HTTP_STATUS_CREATED) {
                        likes.set(id, res.data.uuid);

                        heart.classList.remove('fa-regular');
                        heart.classList.add('fa-solid', 'text-danger');

                        info.setAttribute('data-count-like', String(count + 1));
                    }
                })
                .finally(() => {
                    info.innerText = info.getAttribute('data-count-like');
                    button.disabled = false;
                });
        }
    };

    /**
     * Mengambil elemen tombol Like HTML berdasarkan UUID komentar
     * @param {string} uuid UUID komentar
     * @returns {HTMLElement|null}
     */
    const getButtonLike = (uuid) => {
        return document.querySelector(`button[onclick="undangan.comment.like.love(this)"][data-uuid="${uuid}"]`);
    };

    /**
     * Menangani gestur ketuk dua kali (Double-Tap) pada layar sentuh untuk menyukai komentar dengan cepat
     * @param {HTMLElement} div Elemen pembungkus teks komentar
     * @returns {Promise<void>}
     */
    const tapTap = async (div) => {
        if (!navigator.onLine) {
            return;
        }

        const currentTime = Date.now();
        const tapLength = currentTime - parseInt(div.getAttribute('data-tapTime'));
        const uuid = div.id.replace('body-content-', '');

        const isTapTap = tapLength < 300 && tapLength > 0;
        const notLiked = !likes.has(uuid) && div.getAttribute('data-liked') !== 'true';

        if (isTapTap && notLiked) {
            tapTapAnimation(div);

            div.setAttribute('data-liked', 'true');
            await love(getButtonLike(uuid));
            div.setAttribute('data-liked', 'false');
        }

        div.setAttribute('data-tapTime', String(currentTime));
    };

    /**
     * Menambahkan listener event `touchend` pada elemen komentar tertentu
     * @param {string} uuid UUID komentar
     * @returns {void}
     */
    const addListener = (uuid) => {
        const ac = new AbortController();

        const bodyLike = document.getElementById(`body-content-${uuid}`);
        bodyLike.addEventListener('touchend', () => tapTap(bodyLike), { signal: ac.signal });

        listeners.set(uuid, ac);
    };

    /**
     * Menghapus listener event `touchend` komentar saat dibersihkan
     * @param {string} uuid UUID komentar
     * @returns {void}
     */
    const removeListener = (uuid) => {
        const ac = listeners.get(uuid);
        if (ac) {
            ac.abort();
            listeners.delete(uuid);
        }
    };

    /**
     * Inisialisasi modul Like
     * @returns {void}
     */
    const init = () => {
        listeners = new Map();
        likes = storage('likes');
    };

    return {
        init,
        love,
        getButtonLike,
        addListener,
        removeListener,
    };
})();