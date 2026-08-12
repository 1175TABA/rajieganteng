/**
 * Modul Pemutar Musik Latar Belakang (Background Audio Player).
 * Mengunduh, melakukan caching, serta memutar musik pengiring secara otomatis (looping)
 * ketika undangan dibuka oleh tamu, beserta tombol kontrol Play/Pause.
 *
 * Fitur tambahan: Membatasi rentang waktu pemutaran (start & end).
 */
import { progress } from "./progress.js";
import { util } from "../../common/util.js";
import { cache } from "../../connection/cache.js";

export const audio = (() => {
  // Ikon status tombol pemutar musik
  const statePlay = '<i class="fa-solid fa-circle-pause spin-button"></i>';
  const statePause = '<i class="fa-solid fa-circle-play"></i>';

  /**
   * Memuat dan menginisialisasi pemutaran musik dari URL yang ditentukan
   * @param {boolean} [playOnOpen=true] Apakah musik langsung diputar otomatis saat undangan dibuka
   * @returns {Promise<void>}
   */
  const load = async (playOnOpen = true) => {
    const url = document.body.getAttribute("data-audio");
    if (!url) {
      progress.complete("audio", true);
      return;
    }

    /**
     * Elemen Audio HTML5
     * @type {HTMLAudioElement|null}
     */
    let audioEl = null;

    try {
      audioEl = new Audio(
        await cache("audio").withForceCache().get(url, progress.getAbort())
      );
      audioEl.loop = true;
      audioEl.muted = false;
      audioEl.autoplay = false;
      audioEl.controls = false;

      // ==========================================
      // PENGATURAN RENTANG WAKTU MUSIK
      // Mulai: 00:05 (5 detik)
      // Akhir: 02:06 (126 detik)
      // ==========================================
      const startTime =
        parseFloat(document.body.getAttribute("data-audio-start")) || 3;
      const endTime =
        parseFloat(document.body.getAttribute("data-audio-end")) || 126;

      // Set posisi awal saat metadata sudah siap
      audioEl.addEventListener("loadedmetadata", () => {
        audioEl.currentTime = startTime;
      });

      // Batasi pemutaran hanya di antara startTime dan endTime
      audioEl.addEventListener("timeupdate", () => {
        if (audioEl.currentTime >= endTime) {
          audioEl.currentTime = startTime; // kembali ke awal potongan
        }
      });

      // Pastikan setiap kali play, posisi tetap di dalam rentang
      audioEl.addEventListener("play", () => {
        if (audioEl.currentTime < startTime || audioEl.currentTime >= endTime) {
          audioEl.currentTime = startTime;
        }
      });
      // ==========================================

      progress.complete("audio");
    } catch {
      progress.invalid("audio");
      return;
    }

    let isPlay = false;
    const music = document.getElementById("button-music");

    /**
     * Memutar musik pengiring
     * @returns {Promise<void>}
     */
    const play = async () => {
      if (!navigator.onLine || !music) {
        return;
      }

      music.disabled = true;
      try {
        await audioEl.play();
        isPlay = true;
        music.disabled = false;
        music.innerHTML = statePlay;
      } catch (err) {
        isPlay = false;
        util.notify(err).error();
      }
    };

    /**
     * Menghentikan sementara pemutaran musik (Pause)
     * @returns {void}
     */
    const pause = () => {
      isPlay = false;
      audioEl.pause();
      music.innerHTML = statePause;
    };

    document.addEventListener("undangan.open", () => {
      music.classList.remove("d-none");

      if (playOnOpen) {
        play();
      }
    });

    music.addEventListener("offline", pause);
    music.addEventListener("click", () => (isPlay ? pause() : play()));
  };

  /**
   * Menginisialisasi modul audio
   * @returns {object}
   */
  const init = () => {
    progress.add();

    return {
      load,
    };
  };

  return {
    init,
  };
})();
