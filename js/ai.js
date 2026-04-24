import { State } from './state.js';
import { Config } from './config.js';

export const AI = {
  async generateLog() {
    const panel = document.getElementById('ai-panel');
    const content = document.getElementById('ai-content');
    panel.classList.add('active');
    content.innerHTML = '<span class="ai-loading">Menganalisis telemetri dan menghubungi satelit AI Gemini...</span>';

    const apiKey = ""; // Disuntikkan oleh environment
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
    
    const td = Math.abs(State.ship.rz * 180 / Math.PI).toFixed(1);
    const pd = Math.abs(State.ship.rx * 180 / Math.PI).toFixed(1);
    const wc = Config.wind[State.windLevel].name;
    const wv = Config.wave[State.waveLevel].name;
    const tod = State.timeOfDay === 'day' ? 'Siang' : (State.timeOfDay === 'night' ? 'Malam' : 'Senja');
    const speed = Config.wind[State.windLevel].knots;

    const prompt = `Kamu adalah Mualim Satu (First Mate) kapal kargo. Buat satu entri logbook kapal (sekitar 3 kalimat).
Kondisi saat ini:
- Waktu: ${tod}
- Angin: ${wc}
- Ombak: ${wv}
- Kemiringan Roll: ${td} derajat
- Kemiringan Pitch: ${pd} derajat
- Kecepatan: ${speed} Knots
Tulis dengan gaya bahasa pelaut/maritim profesional dalam Bahasa Indonesia. Jika kondisi badai (angin kuat/ombak besar), tunjukkan kewaspadaan tinggi dan beri saran darurat. Jika aman, laporkan status pelayaran lancar.`;

    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      systemInstruction: { parts: [{ text: "Anda adalah AI First Mate pada sistem simulasi kapal." }] }
    };

    const fetchWithBackoff = async (retries = 5, delay = 1000) => {
      for (let i = 0; i < retries; i++) {
        try {
          const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
          if (!response.ok) throw new Error('API Error');
          return await response.json();
        } catch (err) {
          if (i === retries - 1) throw err;
          await new Promise(res => setTimeout(res, delay));
          delay *= 2;
        }
      }
    };

    try {
      const result = await fetchWithBackoff();
      const text = result.candidates?.[0]?.content?.parts?.[0]?.text || "Gagal membaca log.";
      content.innerHTML = text.replace(/\n/g, '<br>');
    } catch (error) {
      content.innerHTML = "<span style='color:var(--red)'>Gagal menghubungi satelit. Koneksi Gemini API terputus.</span>";
    }
  }
};