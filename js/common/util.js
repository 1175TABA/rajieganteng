/**
 * Modul Utilitas Umum (Helper Functions).
 * Menyediakan berbagai fungsi bantuan seperti: sanitasi HTML, animasi opacity/fade,
 * manipulasi tombol/checkbox loading, penyalinan teks ke clipboard, enkripsi/dekripsi Base64,
 * pemrosesan User-Agent, kalkulasi GMT offset, dan konversi sintaks Markdown ke HTML.
 */
export const util = (() => {

    // HTML Spinner Loader Bootstrap
    const loader = '<span class="spinner-border spinner-border-sm my-0 ms-0 me-1 p-0" style="height: 0.8rem; width: 0.8rem;"></span>';

    // Daftar simbol markdown beserta tag pengganti HTML
    const listsMarkDown = [
        ['*', `<strong class="text-theme-auto">$1</strong>`],
        ['_', `<em class="text-theme-auto">$1</em>`],
        ['~', `<del class="text-theme-auto">$1</del>`],
        ['```', `<code class="font-monospace text-theme-auto">$1</code>`]
    ];

    // Daftar pola regex tipe perangkat
    const deviceTypes = [
        { type: 'Mobile', regex: /Android.*Mobile|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i },
        { type: 'Tablet', regex: /iPad|Android(?!.*Mobile)|Tablet/i },
        { type: 'Desktop', regex: /Windows NT|Macintosh|Linux/i },
    ];

    // Daftar pola regex browser
    const browsers = [
        { name: 'Chrome', regex: /Chrome|CriOS/i },
        { name: 'Safari', regex: /Safari/i },
        { name: 'Edge', regex: /Edg|Edge/i },
        { name: 'Firefox', regex: /Firefox|FxiOS/i },
        { name: 'Opera', regex: /Opera|OPR/i },
        { name: 'Internet Explorer', regex: /MSIE|Trident/i },
        { name: 'Samsung Browser', regex: /SamsungBrowser/i },
    ];

    // Daftar pola regex Sistem Operasi (OS)
    const operatingSystems = [
        { name: 'Windows', regex: /Windows NT ([\d.]+)/i },
        { name: 'MacOS', regex: /Mac OS X ([\d_.]+)/i },
        { name: 'Android', regex: /Android ([\d.]+)/i },
        { name: 'iOS', regex: /OS ([\d_]+) like Mac OS X/i },
        { name: 'Linux', regex: /Linux/i },
        { name: 'Ubuntu', regex: /Ubuntu/i },
        { name: 'Chrome OS', regex: /CrOS/i },
    ];

    /**
     * Mencegah XSS Injection dengan melakukan escape pada karakter berbahaya HTML
     * @param {string} unsafe Teks yang berpotensi mengandung tag HTML
     * @returns {string} Teks aman yang telah di-escape
     */
    const escapeHtml = (unsafe) => {
        return String(unsafe)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    };

    /**
     * Menampilkan notifikasi popup (window.alert) dengan emotikon sesuai kategori
     * @param {string} message Pesan yang ditampilkan
     * @returns {{ success: function, error: function, warning: function, info: function, custom: function }}
     */
    const notify = (message) => {
        const exec = (emoji) => {
            window.alert(`${emoji} ${message}`);
        };

        return {
            success: () => exec('🟩'),
            error: () => exec('🟥'),
            warning: () => exec('🟨'),
            info: () => exec('🟦'),
            custom: (emoji) => exec(emoji),
        };
    };

    /**
     * Menampilkan dialog konfirmasi (window.confirm)
     * @param {string} message Pertanyaan konfirmasi
     * @returns {boolean} True jika disetujui oleh pengguna
     */
    const ask = (message) => window.confirm(`🟦 ${message}`);

    /**
     * Memasukkan string HTML ke dalam elemen DOM secara aman dengan Range Contextual Fragment
     * @param {HTMLElement} el Elemen target
     * @param {string} html String HTML yang akan dimuat
     * @returns {HTMLElement} Elemen target yang telah diperbarui
     */
    const safeInnerHTML = (el, html) => {
        el.replaceChildren(document.createRange().createContextualFragment(html));
        return el;
    };

    /**
     * Melakukan animasi perubahan transparansi (opacity) pada elemen HTML (fade in/fade out)
     * @param {HTMLElement} el Elemen yang dianimasikan
     * @param {boolean} isUp True untuk fade in (opacity ke 1), False untuk fade out (opacity ke 0)
     * @param {number} step Kecepatan transisi opacity per frame
     * @returns {Promise<HTMLElement>} Promise selesai saat animasi selesai
     */
    const changeOpacity = (el, isUp, step = 0.05) => new Promise((res) => {
        let op = parseFloat(el.style.opacity);
        const target = isUp ? 1 : 0;

        const animate = () => {
            op += isUp ? step : -step;
            op = Math.max(0, Math.min(1, op));
            el.style.opacity = op.toFixed(2);

            if ((isUp && op >= target) || (!isUp && op <= target)) {
                el.style.opacity = target.toString();
                res(el);
            } else {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    });

    /**
     * Pembungkus setTimeout dengan pembersihan timer otomatis
     * @param {function} callback Fungsi yang dijalankan
     * @param {number} [delay=0] Waktu tunda dalam milidetik
     * @returns {void}
     */
    const timeOut = (callback, delay = 0) => {
        let clear = null;
        const c = () => {
            callback();
            clearTimeout(clear);
            clear = null;
        };

        clear = setTimeout(c, delay);
    };

    /**
     * Menunda eksekusi fungsi hingga tidak ada pemanggilan baru selama rentang waktu delay tertentu (Debounce)
     * @param {function} callback Fungsi utama
     * @param {number} [delay=100] Waktu tunggu milidetik
     * @returns {function} Fungsi debounced
     */
    const debounce = (callback, delay = 100) => {
        let timeout = null;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => callback(...args), delay);
        };
    };

    /**
     * Menonaktifkan tombol dan menampilkan animasi loading spinner
     * @param {HTMLElement} button Tombol target
     * @param {string} [message='Loading'] Teks indikator loading
     * @param {boolean} [replace=false] Jika true, mengganti seluruh konten tombol tanpa spinner default
     * @returns {object} Objek dengan metode `restore()` untuk mengembalikan tombol ke keadaan semula
     */
    const disableButton = (button, message = 'Loading', replace = false) => {
        button.disabled = true;

        const tmp = button.innerHTML;
        safeInnerHTML(button, replace ? message : loader + message);

        return {
            restore: (disabled = false) => {
                button.innerHTML = tmp;
                button.disabled = disabled;
            },
        };
    };

    /**
     * Menonaktifkan checkbox dan menampilkan spinner loading pada label terkait
     * @param {HTMLElement} checkbox Elemen checkbox
     * @returns {object} Objek dengan metode `restore()`
     */
    const disableCheckbox = (checkbox) => {
        checkbox.disabled = true;

        const label = document.querySelector(`label[for="${checkbox.id}"]`);
        const tmp = label.innerHTML;
        safeInnerHTML(label, loader + tmp);

        return {
            restore: () => {
                label.innerHTML = tmp;
                checkbox.disabled = false;
            },
        };
    };

    /**
     * Menyalin teks atribut `data-copy` elemen tombol ke clipboard perangkat
     * @param {HTMLElement} button Tombol yang diklik
     * @param {string} [message=null] Pesan sukses opsional
     * @param {number} [timeout=1500] Durasi indikator sukses
     * @returns {Promise<void>}
     */
    const copy = async (button, message = null, timeout = 1500) => {
        const data = button.getAttribute('data-copy');

        if (!data || data.length === 0) {
            notify('Nothing to copy').warning();
            return;
        }

        button.disabled = true;

        try {
            await navigator.clipboard.writeText(data);
        } catch {
            button.disabled = false;
            notify('Failed to copy').error();
            return;
        }

        const tmp = button.innerHTML;
        safeInnerHTML(button, message ? message : '<i class="fa-solid fa-check"></i>');

        timeOut(() => {
            button.disabled = false;
            button.innerHTML = tmp;
        }, timeout);
    };

    /**
     * Mengenkripsi string teks menjadi format Base64 (mendukung UTF-8)
     * @param {string} str Teks asli
     * @returns {string} String terenkripsi Base64
     */
    const base64Encode = (str) => {
        const encoder = new TextEncoder();
        const encodedBytes = encoder.encode(str);
        return window.btoa(String.fromCharCode(...encodedBytes));
    };

    /**
     * Mendekripsi string Base64 kembali menjadi string teks semula (mendukung UTF-8)
     * @param {string} str String Base64
     * @returns {string} Teks terdekripsi
     */
    const base64Decode = (str) => {
        const decoder = new TextDecoder();
        const decodedBytes = Uint8Array.from(window.atob(str), (c) => c.charCodeAt(0));
        return decoder.decode(decodedBytes);
    };

    /**
     * Membaca string User-Agent browser untuk mengidentifikasi Nama Browser, Perangkat, dan OS
     * @param {string} userAgent String user-agent browser
     * @returns {string} Informasi ringkas perangkat (misal: "Chrome Mobile Android 12")
     */
    const parseUserAgent = (userAgent) => {
        if (!userAgent || typeof userAgent !== 'string') {
            return 'Unknown';
        }

        const deviceType = deviceTypes.find((i) => i.regex.test(userAgent))?.type ?? 'Unknown';
        const browser = browsers.find((i) => i.regex.test(userAgent))?.name ?? 'Unknown';
        const osMatch = operatingSystems.find((i) => i.regex.test(userAgent));

        const osName = osMatch ? osMatch.name : 'Unknown';
        const osVersion = osMatch ? (userAgent.match(osMatch.regex)?.[1]?.replace(/_/g, '.') ?? null) : null;

        return `${browser} ${deviceType} ${osVersion ? `${osName} ${osVersion}` : osName}`;
    };

    /**
     * Menghitung offset zona waktu GMT dari suatu nama timezone (misal: "Asia/Jakarta" -> "GMT+7")
     * @param {string} tz Nama zona waktu IANA
     * @returns {string} String offset GMT
     */
    const getGMTOffset = (tz) => {
        const now = new Date();
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: tz,
            hourCycle: 'h23',
            hour: 'numeric',
        });

        let offset = (parseInt(formatter.format(now)) - now.getUTCHours() + 24) % 24;
        if (offset > 12) {
            offset -= 24;
        }

        return `GMT${offset >= 0 ? '+' : ''}${offset}`;
    };

    /**
     * Mengonversi format markdown sederhana (*bold*, _italic_, ~strikethrough~, ```code```) menjadi tag HTML
     * @param {string} str Teks berkode markdown
     * @returns {string} String HTML hasil konversi
     */
    const convertMarkdownToHTML = (str) => {
        listsMarkDown.forEach(([k, v]) => {
            str = str.replace(new RegExp(`\\${k}(\\S(?:[\\s\\S]*?\\S)?)\\${k}`, 'g'), v);
        });

        return str;
    };

    return {
        loader,
        ask,
        copy,
        notify,
        timeOut,
        debounce,
        escapeHtml,
        base64Encode,
        base64Decode,
        disableButton,
        disableCheckbox,
        safeInnerHTML,
        parseUserAgent,
        changeOpacity,
        getGMTOffset,
        convertMarkdownToHTML,
    };
})();