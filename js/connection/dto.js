/**
 * Modul Data Transfer Object (DTO) & Transformer Respon API.
 * Bertanggung jawab untuk menyelaraskan, memvalidasi, dan me-format struktur objek
 * data yang diterima dari atau dikirim ke API backend server.
 */
export const dto = (() => {

    /**
     * Memetakan item komentar tunggal dari respon API menjadi struktur objek yang konsisten
     * @param {object} data Objek data komentar mentah
     * @returns {object} Objek komentar terstandarisasi
     */
    const getCommentResponse = ({ uuid, own, name, presence, comment, created_at, is_admin, is_parent, gif_url, ip, user_agent, comments, like_count }) => {
        return {
            uuid,
            own,
            name,
            presence,
            comment,
            created_at,
            is_admin: is_admin ?? false,
            is_parent,
            gif_url,
            ip,
            user_agent,
            comments: comments?.map(getCommentResponse) ?? [],
            like_count: like_count ?? 0,
        };
    };

    /**
     * Memetakan array komentar dari API
     * @param {object[]} data Array data komentar mentah
     * @returns {object[]} Array komentar terstandarisasi
     */
    const getCommentsResponse = (data) => data.map(getCommentResponse);

    /**
     * Memetakan respon daftar komentar V2 (yang mencakup jumlah total count dan array lists)
     * @param {object} data Objek data V2 mentah { count, lists }
     * @returns {object} Objek data V2 terstandarisasi
     */
    const getCommentsResponseV2 = (data) => {
        return {
            count: data.count,
            lists: getCommentsResponse(data.lists),
        };
    };

    /**
     * Memetakan respon status sederhana { status: boolean }
     * @param {{status: boolean}} status
     * @returns {{status: boolean}}
     */
    const statusResponse = ({ status }) => {
        return {
            status,
        };
    };

    /**
     * Memetakan respon token autentikasi { token: string }
     * @param {{token: string}} token
     * @returns {{token: string}}
     */
    const tokenResponse = ({ token }) => {
        return {
            token,
        };
    };

    /**
     * Memetakan respon UUID { uuid: string }
     * @param {{uuid: string}} uuid
     * @returns {{uuid: string}}
     */
    const uuidResponse = ({ uuid }) => {
        return {
            uuid,
        };
    };

    /**
     * Membuat objek status perlihatkan/sembunyikan balasan komentar (show/hide state)
     * @param {string} uuid UUID komentar
     * @param {boolean} show Status tampil
     * @returns {{uuid: string, show: boolean}}
     */
    const commentShowMore = (uuid, show = false) => {
        return {
            uuid,
            show,
        };
    };

    /**
     * Memformat objek payload request saat mengirimkan komentar baru (POST /api/comment)
     * @param {string} id UUID komentar induk (jika balasan), atau null
     * @param {string} name Nama pengirim komentar
     * @param {boolean} presence Kehadiran (true=Datang, false=Berhalangan)
     * @param {string|null} comment Teks komentar
     * @param {string|null} gif_id ID sticker GIF dari Tenor
     * @returns {object} Objek payload JSON
     */
    const postCommentRequest = (id, name, presence, comment, gif_id) => {
        return {
            id,
            name,
            presence,
            comment,
            gif_id,
        };
    };

    /**
     * Memformat objek payload request login admin (POST /api/session)
     * @param {string} email Email admin
     * @param {string} password Password admin
     * @returns {{email: string, password: string}}
     */
    const postSessionRequest = (email, password) => {
        return {
            email: email,
            password: password,
        };
    };

    /**
     * Memformat objek payload request perbarui komentar (PUT /api/comment/{id})
     * @param {boolean|null} presence Kehadiran baru
     * @param {string|null} comment Teks komentar baru
     * @param {string|null} gif_id ID sticker GIF baru
     * @returns {object}
     */
    const updateCommentRequest = (presence, comment, gif_id) => {
        return {
            presence: presence,
            comment: comment,
            gif_id: gif_id,
        };
    };

    return {
        uuidResponse,
        tokenResponse,
        statusResponse,
        getCommentResponse,
        getCommentsResponse,
        getCommentsResponseV2,
        commentShowMore,
        postCommentRequest,
        postSessionRequest,
        updateCommentRequest,
    };
})();