/**
 * Komponen Renderer Kartu Komentar (Comment Card Component).
 * Bertanggung jawab untuk merender elemen-elemen HTML komentar, termasuk:
 * header komentar, lencana admin/kehadiran, pesan teks, media GIF, lencana pelacak lokasi IP/User-Agent,
 * tombol like, tombol balasan (reply), serta form edit/reply secara tertanam.
 */
import { gif } from './gif.js';
import { util } from '../../common/util.js';
import { storage } from '../../common/storage.js';
import { session } from '../../common/session.js';

export const card = (() => {

    /**
     * Storage kepemilikan komentar (owns)
     * @type {ReturnType<typeof storage>|null}
     */
    let owns = null;

    /**
     * Storage data like komentar (likes)
     * @type {ReturnType<typeof storage>|null}
     */
    let likes = null;

    /**
     * Storage konfigurasi undangan (config)
     * @type {ReturnType<typeof storage>|null}
     */
    let config = null;

    /**
     * Storage status tampil/sembunyi balasan komentar (showHide)
     * @type {ReturnType<typeof storage>|null}
     */
    let showHide = null;

    // Batas karakter maksimum komentar sebelum tombol "Selengkapnya" ditampilkan
    const maxCommentLength = 300;

    /**
     * Merender elemen placeholder skeletal saat data komentar sedang dimuat (Loading Skeleton)
     * @returns {string} String HTML skeleton loading
     */
    const renderLoading = () => {
        return `
        <div class="bg-theme-auto shadow p-3 mx-0 mt-0 mb-3 rounded-4">
            <div class="d-flex justify-content-between align-items-center placeholder-wave">
                <span class="placeholder bg-secondary col-5 rounded-3 my-1"></span>
                <span class="placeholder bg-secondary col-3 rounded-3 my-1"></span>
            </div>
            <hr class="my-1">
            <p class="placeholder-wave m-0">
                <span class="placeholder bg-secondary col-6 rounded-3"></span>
                <span class="placeholder bg-secondary col-5 rounded-3"></span>
                <span class="placeholder bg-secondary col-12 rounded-3 my-1"></span>
            </p>
        </div>`;
    };

    /**
     * Merender tombol Like/Suka beserta ikon hati dan jumlah suka
     * @param {ReturnType<typeof dto.getCommentResponse>} c Objek data komentar
     * @returns {string} HTML tombol like
     */
    const renderLike = (c) => {
        return `
        <button style="font-size: 0.8rem;" onclick="undangan.comment.like.love(this)" data-uuid="${c.uuid}" class="btn btn-sm btn-outline-auto ms-auto rounded-3 p-0 shadow-sm d-flex justify-content-start align-items-center" data-offline-disabled="false">
            <span class="my-0 mx-1" data-count-like="${c.like_count}">${c.like_count}</span>
            <i class="me-1 ${likes.has(c.uuid) ? 'fa-solid fa-heart text-danger' : 'fa-regular fa-heart'}"></i>
        </button>`;
    };

    /**
     * Merender tombol-tombol aksi komentar (Reply, Edit, Delete) sesuai hak akses pemilik/admin
     * @param {ReturnType<typeof dto.getCommentResponse>} c Objek data komentar
     * @returns {string} HTML deretan tombol aksi
     */
    const renderAction = (c) => {
        let action = `<div class="d-flex justify-content-start align-items-center" data-button-action="${c.uuid}">`;

        if (config.get('can_reply') !== false) {
            action += `<button style="font-size: 0.8rem;" onclick="undangan.comment.reply('${c.uuid}')" class="btn btn-sm btn-outline-auto rounded-4 py-0 me-1 shadow-sm" data-offline-disabled="false">Reply</button>`;
        }

        if (session.isAdmin() && c.is_admin && (!c.gif_url || gif.isActive())) {
            action += `<button style="font-size: 0.8rem;" onclick="undangan.comment.edit(this, ${c.is_parent ? 'true' : 'false'})" data-uuid="${c.uuid}" class="btn btn-sm btn-outline-auto rounded-4 py-0 me-1 shadow-sm" data-own="${c.own}" data-offline-disabled="false">Edit</button>`;
        } else if (owns.has(c.uuid) && config.get('can_edit') !== false && (!c.gif_url || gif.isActive())) {
            action += `<button style="font-size: 0.8rem;" onclick="undangan.comment.edit(this, ${c.is_parent ? 'true' : 'false'})" data-uuid="${c.uuid}" class="btn btn-sm btn-outline-auto rounded-4 py-0 me-1 shadow-sm" data-offline-disabled="false">Edit</button>`;
        }

        if (session.isAdmin()) {
            action += `<button style="font-size: 0.8rem;" onclick="undangan.comment.remove(this)" data-uuid="${c.uuid}" class="btn btn-sm btn-outline-auto rounded-4 py-0 me-1 shadow-sm" data-own="${c.own}" data-offline-disabled="false">Delete</button>`;
        } else if (owns.has(c.uuid) && config.get('can_delete') !== false) {
            action += `<button style="font-size: 0.8rem;" onclick="undangan.comment.remove(this)" data-uuid="${c.uuid}" class="btn btn-sm btn-outline-auto rounded-4 py-0 me-1 shadow-sm" data-offline-disabled="false">Delete</button>`;
        }

        action += '</div>';

        return action;
    };

    /**
     * Merender tombol "Show replies / Hide replies" untuk komentar yang memiliki balasan
     * @param {string} uuid UUID komentar induk
     * @param {string[]} uuids Array UUID balasan
     * @returns {string} HTML tautan pembuka balasan
     */
    const renderReadMore = (uuid, uuids) => {
        uuid = util.escapeHtml(uuid);

        const hasId = showHide.get('show').includes(uuid);
        return `<a class="text-theme-auto" style="font-size: 0.8rem;" onclick="undangan.comment.showOrHide(this)" data-uuid="${uuid}" data-uuids="${util.escapeHtml(uuids.join(','))}" data-show="${hasId ? 'true' : 'false'}" role="button" class="me-auto ms-1 py-0">${hasId ? 'Hide replies' : `Show replies (${uuids.length})`}</a>`;
    };

    /**
     * Merender kontainer baris tombol aksi (Aksi + ReadMore + Like)
     * @param {ReturnType<typeof dto.getCommentResponse>} c Objek data komentar
     * @returns {string}
     */
    const renderButton = (c) => {
        return `
        <div class="d-flex justify-content-between align-items-center" id="button-${c.uuid}">
            ${renderAction(c)}
            ${c.comments.length > 0 ? renderReadMore(c.uuid, c.comments.map((i) => i.uuid)) : ''}
            ${renderLike(c)}
        </div>`;
    };

    /**
     * Merender informasi lokasi IP dan User-Agent (khusus untuk tampilan Admin Dashboard)
     * @param {ReturnType<typeof dto.getCommentResponse>} c Objek data komentar
     * @returns {string}
     */
    const renderTracker = (c) => {
        if (!c.ip || !c.user_agent || c.is_admin) {
            return '';
        }

        return `
        <div class="mb-1 mt-3">
            <p class="text-theme-auto mb-1 mx-0 mt-0 p-0" style="font-size: 0.7rem;" id="ip-${c.uuid}"><i class="fa-solid fa-location-dot me-1"></i>${util.escapeHtml(c.ip)} <span class="mb-1 placeholder col-2 rounded-3"></span></p>
            <p class="text-theme-auto m-0 p-0" style="font-size: 0.7rem;"><i class="fa-solid fa-mobile-screen-button me-1"></i>${util.parseUserAgent(util.escapeHtml(c.user_agent))}</p>
        </div>`;
    };

    /**
     * Merender atribut class elemen pembungkus komentar (parent vs child reply)
     * @param {ReturnType<typeof dto.getCommentResponse>} c Objek data komentar
     * @returns {string} Atribut class HTML
     */
    const renderHeader = (c) => {
        if (c.is_parent) {
            return `class="bg-theme-auto shadow p-3 mx-0 mt-0 mb-3 rounded-4"`;
        }

        return `class="${!showHide.get('hidden').find((i) => i.uuid === c.uuid)['show'] ? 'd-none' : ''} overflow-x-auto mw-100 border-start bg-theme-auto py-2 ps-2 pe-0 my-2 ms-2 me-0"`;
    };

    /**
     * Merender judul pengirim komentar beserta lencana (badge) kehadiran atau sertifikat admin
     * @param {ReturnType<typeof dto.getCommentResponse>} c Objek data komentar
     * @returns {string} HTML nama & badge
     */
    const renderTitle = (c) => {
        if (c.is_admin) {
            return `<strong class="me-1">${util.escapeHtml(c.name)}</strong><i class="fa-solid fa-certificate text-primary"></i>`;
        }

        if (c.is_parent) {
            return `<strong class="me-1">${util.escapeHtml(c.name)}</strong><i id="badge-${c.uuid}" data-is-presence="${c.presence ? 'true' : 'false'}" class="fa-solid ${c.presence ? 'fa-circle-check text-success' : 'fa-circle-xmark text-danger'}"></i>`;
        }

        return `<strong>${util.escapeHtml(c.name)}</strong>`;
    };

    /**
     * Merender isi konten utama komentar (teks atau gambar GIF sticker)
     * @param {ReturnType<typeof dto.getCommentResponse>} c Objek data komentar
     * @returns {Promise<string>} HTML isi komentar
     */
    const renderBody = async (c) => {
        const head = `
        <div class="d-flex justify-content-between align-items-center">
            <p class="text-theme-auto text-truncate m-0 p-0 fw-semibold" style="font-size: 0.95rem;">${renderTitle(c)}</p>
            <small class="text-secondary m-0 p-0" style="font-size: 0.75rem;">${c.created_at}</small>
        </div>
        <hr class="my-1">`;

        if (c.gif_url) {
            return head + `
            <div class="d-flex justify-content-center align-items-center my-2">
                <img src="${await gif.get(c.gif_url)}" id="img-gif-${c.uuid}" class="img-fluid mx-auto gif-image rounded-4" alt="selected-gif">
            </div>`;
        }

        const moreMaxLength = c.comment.length > maxCommentLength;
        const data = util.convertMarkdownToHTML(util.escapeHtml(moreMaxLength ? (c.comment.slice(0, maxCommentLength) + '...') : c.comment));

        return head + `
        <p dir="auto" class="text-theme-auto my-1 mx-0 p-0" style="white-space: pre-wrap !important; font-size: 0.95rem;" data-comment="${util.base64Encode(c.comment)}" id="content-${c.uuid}">${data}</p>
        ${moreMaxLength ? `<p class="d-block mb-2 mt-0 mx-0 p-0"><a class="text-theme-auto" role="button" style="font-size: 0.85rem;" data-show="false" onclick="undangan.comment.showMore(this, '${c.uuid}')">Selengkapnya</a></p>` : ''}`;
    };

    /**
     * Merender seluruh komponen kartu komentar secara rekursif termasuk balasan-balasannya
     * @param {ReturnType<typeof dto.getCommentResponse>} c Objek data komentar
     * @returns {Promise<string>} HTML lengkap kartu komentar
     */
    const renderContent = async (c) => {
        const body = await renderBody(c);
        const resData = await Promise.all(c.comments.map((cmt) => renderContent(cmt)));

        return `
        <div ${renderHeader(c)} id="${c.uuid}" style="overflow-wrap: break-word !important;">
            <div id="body-content-${c.uuid}" data-tapTime="0" data-liked="false" tabindex="0">${body}</div>
            ${renderTracker(c)}
            ${renderButton(c)}
            <div id="reply-content-${c.uuid}">${resData.join('')}</div>
        </div>`;
    };

    /**
     * Merender banyak komentar sekaligus dari array komentar
     * @param {ReturnType<typeof dto.getCommentResponse>[]} cs Array objek komentar
     * @returns {Promise<string>}
     */
    const renderContentMany = (cs) => Promise.all(cs.map((i) => renderContent(i))).then((r) => r.join(''));

    /**
     * Merender satu kartu komentar tunggal
     * @param {ReturnType<typeof dto.getCommentResponse>} cs Objek komentar
     * @returns {Promise<string>}
     */
    const renderContentSingle = (cs) => renderContent(cs);

    /**
     * Merender form balasan (Reply Form) yang muncul saat pengguna mengklik tombol Reply
     * @param {string} id UUID komentar induk yang dibalas
     * @returns {HTMLDivElement} Elemen DOM form balasan
     */
    const renderReply = (id) => {
        id = util.escapeHtml(id);

        const inner = document.createElement('div');
        inner.classList.add('my-2');
        inner.id = `inner-${id}`;
        const template = `
        <p class="my-1 mx-0 p-0" style="font-size: 0.95rem;"><i class="fa-solid fa-reply me-2"></i>Reply</p>
        <div class="d-block mb-2" id="comment-form-${id}">
            <div class="position-relative">
                ${!gif.isActive() ? '' : `<button class="btn btn-secondary btn-sm rounded-4 shadow-sm me-1 my-1 position-absolute bottom-0 end-0" onclick="undangan.comment.gif.open('${id}')" aria-label="button gif" data-offline-disabled="false"><i class="fa-solid fa-photo-film"></i></button>`}
                <textarea dir="auto" class="form-control shadow-sm rounded-4 mb-2" id="form-inner-${id}" minlength="1" maxlength="1000" placeholder="Type reply comment" rows="3" data-offline-disabled="false"></textarea>
            </div>
        </div>
        <div class="d-none mb-2" id="gif-form-${id}"></div>
        <div class="d-flex justify-content-end align-items-center mb-0">
            <button style="font-size: 0.8rem;" onclick="undangan.comment.cancel(this, '${id}')" class="btn btn-sm btn-outline-auto rounded-4 py-0 me-1" data-offline-disabled="false">Cancel</button>
            <button style="font-size: 0.8rem;" onclick="undangan.comment.send(this)" data-uuid="${id}" class="btn btn-sm btn-outline-auto rounded-4 py-0" data-offline-disabled="false">Send</button>
        </div>`;

        return util.safeInnerHTML(inner, template);
    };

    /**
     * Merender form sunting (Edit Form) yang muncul saat pengguna mengklik tombol Edit
     * @param {string} id UUID komentar
     * @param {boolean} presence Status kehadiran saat ini
     * @param {boolean} is_parent Apakah komentar induk utama
     * @param {boolean} is_gif Apakah komentar berbasis sticker GIF
     * @returns {HTMLDivElement} Elemen DOM form sunting
     */
    const renderEdit = (id, presence, is_parent, is_gif) => {
        id = util.escapeHtml(id);

        const inner = document.createElement('div');
        inner.classList.add('my-2');
        inner.id = `inner-${id}`;
        const template = `
        <p class="my-1 mx-0 p-0" style="font-size: 0.95rem;"><i class="fa-solid fa-pen me-2"></i>Edit</p>
        ${!is_parent ? '' : `
        <select class="form-select shadow-sm mb-2 rounded-4" id="form-inner-presence-${id}" data-offline-disabled="false">
            <option value="1" ${presence ? 'selected' : ''}>&#9989; Datang</option>
            <option value="2" ${presence ? '' : 'selected'}>&#10060; Berhalangan</option>
        </select>`}
        ${!is_gif ? `<textarea dir="auto" class="form-control shadow-sm rounded-4 mb-2" id="form-inner-${id}" minlength="1" maxlength="1000" placeholder="Type update comment" rows="3" data-offline-disabled="false"></textarea>    
        ` : `${!gif.isActive() ? '' : `<div class="d-none mb-2" id="gif-form-${id}"></div>`}`}
        <div class="d-flex justify-content-end align-items-center mb-0">
            <button style="font-size: 0.8rem;" onclick="undangan.comment.cancel(this, '${id}')" class="btn btn-sm btn-outline-auto rounded-4 py-0 me-1" data-offline-disabled="false">Cancel</button>
            <button style="font-size: 0.8rem;" onclick="undangan.comment.update(this)" data-uuid="${id}" class="btn btn-sm btn-outline-auto rounded-4 py-0" data-offline-disabled="false">Update</button>
        </div>`;

        return util.safeInnerHTML(inner, template);
    };

    /**
     * Menginisialisasi modul kartu komentar dengan menghubungkan ke localStorage
     * @returns {void}
     */
    const init = () => {
        owns = storage('owns');
        likes = storage('likes');
        config = storage('config');
        showHide = storage('comment');
    };

    return {
        init,
        renderEdit,
        renderReply,
        renderLoading,
        renderReadMore,
        renderContentMany,
        renderContentSingle,
        maxCommentLength,
    };
})();