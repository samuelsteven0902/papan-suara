(() => {
  "use strict";

  const STORAGE_KEY = "papan-suara:v1";
  const MAX_CANDIDATES = 1000;
  const MAX_VOTES_PER_CANDIDATE = 1_000_000_000;
  const numberFormat = new Intl.NumberFormat("id-ID");

  const form = document.querySelector("#vote-form");
  const nameInput = document.querySelector("#candidate-name");
  const nameList = document.querySelector("#candidate-list");
  const inputError = document.querySelector("#input-error");
  const results = document.querySelector("#candidate-results");
  const totalVotes = document.querySelector("#total-votes");
  const leaderStatus = document.querySelector("#leader-status");
  const rankingCount = document.querySelector("#ranking-count");
  const updatedLabel = document.querySelector("#updated-label");
  const showWinnerButton = document.querySelector("#show-winner-button");
  const winnerDialog = document.querySelector("#winner-dialog");
  const winnerTitle = document.querySelector("#winner-title");
  const winnerName = document.querySelector("#winner-name");
  const winnerDetail = document.querySelector("#winner-detail");
  const undoButton = document.querySelector("#undo-button");
  const exportButton = document.querySelector("#export-button");
  const importButton = document.querySelector("#import-button");
  const importFile = document.querySelector("#import-file");
  const resetButton = document.querySelector("#reset-button");
  const resetDialog = document.querySelector("#reset-dialog");
  const toast = document.querySelector("#toast");

  let toastTimer;
  let state = loadState();

  function emptyState() {
    return { version: 1, candidates: [], lastVoteId: null, updatedAt: null };
  }

  function cleanName(value) {
    return value.normalize("NFKC").trim().replace(/\s+/g, " ");
  }

  function nameKey(value) {
    return cleanName(value).toLocaleLowerCase("id-ID");
  }

  function newId() {
    return typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `calon-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  function validStoredState(value) {
    if (!value || value.version !== 1 || !Array.isArray(value.candidates) || value.candidates.length > MAX_CANDIDATES) return false;
    const names = new Set();
    const ids = new Set();
    for (const candidate of value.candidates) {
      if (!candidate || typeof candidate.id !== "string" || !candidate.id || ids.has(candidate.id)) return false;
      if (typeof candidate.name !== "string" || !cleanName(candidate.name) || cleanName(candidate.name).length > 60) return false;
      if (!Number.isSafeInteger(candidate.votes) || candidate.votes < 1 || candidate.votes > MAX_VOTES_PER_CANDIDATE) return false;
      const key = nameKey(candidate.name);
      if (names.has(key)) return false;
      names.add(key);
      ids.add(candidate.id);
    }
    return value.lastVoteId == null || ids.has(value.lastVoteId);
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return emptyState();
      const parsed = JSON.parse(raw);
      return validStoredState(parsed) ? parsed : emptyState();
    } catch {
      return emptyState();
    }
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      return true;
    } catch {
      return false;
    }
  }

  function showToast(message, isError = false) {
    toast.textContent = message;
    toast.classList.toggle("is-error", isError);
    toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toast.hidden = true; }, 4200);
  }

  function showInputError(message) {
    inputError.textContent = message;
    inputError.hidden = !message;
    nameInput.setAttribute("aria-invalid", message ? "true" : "false");
  }

  function render() {
    const sorted = [...state.candidates].sort((a, b) => b.votes - a.votes || a.name.localeCompare(b.name, "id"));
    const total = sorted.reduce((sum, candidate) => sum + candidate.votes, 0);
    const highest = sorted[0]?.votes ?? 0;
    const leaders = sorted.filter((candidate) => candidate.votes === highest);

    totalVotes.textContent = numberFormat.format(total);
    rankingCount.textContent = `${numberFormat.format(sorted.length)} CALON`;
    undoButton.disabled = !state.lastVoteId;
    showWinnerButton.disabled = total === 0;

    if (leaders.length === 0) {
      leaderStatus.textContent = "Menunggu suara pertama.";
    } else if (leaders.length === 1) {
      leaderStatus.textContent = `${leaders[0].name} memimpin dengan ${numberFormat.format(highest)} suara.`;
    } else {
      leaderStatus.textContent = `Seri: ${leaders.length} calon masing-masing mendapat ${numberFormat.format(highest)} suara.`;
    }

    updatedLabel.textContent = state.updatedAt && !Number.isNaN(Date.parse(state.updatedAt))
      ? `Diperbarui ${new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit" }).format(new Date(state.updatedAt))}`
      : "Belum ada suara";

    nameList.replaceChildren(...sorted.map((candidate) => {
      const option = document.createElement("option");
      option.value = candidate.name;
      return option;
    }));

    if (sorted.length === 0) {
      const empty = document.createElement("div");
      empty.className = "empty-state";
      empty.innerHTML = '<span class="empty-icon" aria-hidden="true">◌</span><h3>Belum ada suara</h3><p>Ketik nama calon di atas untuk mulai mencatat.</p>';
      results.replaceChildren(empty);
      return;
    }

    results.replaceChildren(...sorted.map((candidate, index) => {
      const row = document.createElement("button");
      row.type = "button";
      row.className = `candidate-row${candidate.votes === highest ? " is-leader" : ""}`;
      row.dataset.candidateId = candidate.id;
      row.setAttribute("aria-label", `Tambah 1 suara untuk ${candidate.name}. Saat ini ${numberFormat.format(candidate.votes)} suara.`);
      const rank = document.createElement("span");
      rank.className = "candidate-rank";
      rank.textContent = String(index + 1).padStart(2, "0");
      rank.setAttribute("aria-label", `Peringkat ${index + 1}`);
      const name = document.createElement("span");
      name.className = "candidate-name";
      name.textContent = candidate.name;
      const votes = document.createElement("span");
      votes.className = "candidate-votes";
      const count = document.createElement("strong");
      count.textContent = numberFormat.format(candidate.votes);
      const unit = document.createElement("span");
      unit.textContent = "suara";
      votes.append(count, unit);
      const track = document.createElement("span");
      track.className = "progress-track";
      track.setAttribute("role", "progressbar");
      track.setAttribute("aria-label", `Persentase suara ${candidate.name}`);
      track.setAttribute("aria-valuemin", "0");
      track.setAttribute("aria-valuemax", String(total));
      track.setAttribute("aria-valuenow", String(candidate.votes));
      const fill = document.createElement("span");
      fill.className = "progress-fill";
      fill.style.width = `${(candidate.votes / total) * 100}%`;
      track.append(fill);
      const percent = document.createElement("span");
      percent.className = "candidate-percent";
      percent.textContent = `${Math.round((candidate.votes / total) * 100)}%`;
      row.append(rank, name, track, percent, votes);
      row.addEventListener("click", (event) => {
        const current = state.candidates.find((item) => item.id === candidate.id);
        if (!current || !recordVote(current.name, current)) return;
        const updatedRow = Array.from(results.querySelectorAll(".candidate-row"))
          .find((item) => item.dataset.candidateId === current.id);
        if (!updatedRow) return;
        const feedback = document.createElement("span");
        feedback.className = "vote-feedback";
        feedback.setAttribute("aria-hidden", "true");
        feedback.textContent = "+1";
        updatedRow.append(feedback);
        updatedRow.classList.add("just-voted");
        if (event.detail === 0) updatedRow.focus({ preventScroll: true });
        setTimeout(() => {
          feedback.remove();
          updatedRow.classList.remove("just-voted");
        }, 1200);
      });
      return row;
    }));
  }

  function recordVote(name, candidate = state.candidates.find((item) => nameKey(item.name) === nameKey(name))) {
    if (candidate && candidate.votes >= MAX_VOTES_PER_CANDIDATE) {
      showToast("Batas suara untuk calon ini telah tercapai.", true);
      return false;
    }
    if (!candidate && state.candidates.length >= MAX_CANDIDATES) {
      showToast("Batas jumlah calon telah tercapai.", true);
      return false;
    }
    if (candidate) {
      candidate.votes += 1;
    } else {
      candidate = { id: newId(), name, votes: 1 };
      state.candidates.push(candidate);
    }
    state.lastVoteId = candidate.id;
    state.updatedAt = new Date().toISOString();
    const saved = saveState();
    render();
    showToast(saved ? `1 suara untuk ${candidate.name} berhasil dicatat.` : "Browser gagal menyimpan data. Unduh cadangan sebelum menutup halaman.", !saved);
    return true;
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = cleanName(nameInput.value);
    if (!name) {
      showInputError("Masukkan nama calon terlebih dahulu.");
      nameInput.focus();
      return;
    }
    if (name.length > 60) {
      showInputError("Nama calon maksimal 60 karakter.");
      nameInput.focus();
      return;
    }
    showInputError("");
    if (!recordVote(name)) return;
    nameInput.value = "";
    nameInput.focus();
  });

  nameInput.addEventListener("input", () => showInputError(""));

  showWinnerButton.addEventListener("click", () => {
    if (state.candidates.length === 0) return;
    const highest = Math.max(...state.candidates.map((candidate) => candidate.votes));
    const leaders = state.candidates.filter((candidate) => candidate.votes === highest);
    const total = state.candidates.reduce((sum, candidate) => sum + candidate.votes, 0);
    const isTie = leaders.length > 1;

    winnerDialog.classList.toggle("is-tie", isTie);
    winnerTitle.textContent = isTie ? "Belum Ada Ketua Terpilih" : "Ketua Terpilih";
    winnerName.textContent = isTie ? "Hasil seri" : leaders[0].name;
    winnerDetail.textContent = isTie
      ? `${leaders.map((candidate) => candidate.name).join(", ")} sama-sama mendapat ${numberFormat.format(highest)} suara. Lanjutkan pemilihan atau tentukan aturan pemecah seri.`
      : `${numberFormat.format(highest)} dari ${numberFormat.format(total)} suara (${Math.round((highest / total) * 100)}%).`;
    winnerDialog.showModal();
  });

  undoButton.addEventListener("click", () => {
    if (!state.lastVoteId) return;
    const index = state.candidates.findIndex((candidate) => candidate.id === state.lastVoteId);
    if (index < 0) return;
    const candidate = state.candidates[index];
    candidate.votes -= 1;
    if (candidate.votes === 0) state.candidates.splice(index, 1);
    state.lastVoteId = null;
    state.updatedAt = new Date().toISOString();
    const saved = saveState();
    render();
    showToast(saved ? `Suara terakhir untuk ${candidate.name} dibatalkan.` : "Browser gagal menyimpan data. Unduh cadangan sebelum menutup halaman.", !saved);
  });

  exportButton.addEventListener("click", () => {
    const backup = {
      version: 1,
      exportedAt: new Date().toISOString(),
      candidates: state.candidates.map(({ name, votes }) => ({ name, votes }))
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `papan-suara-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast("Cadangan berhasil diunduh.");
  });

  function validBackup(value) {
    if (!value || value.version !== 1 || !Array.isArray(value.candidates) || value.candidates.length > MAX_CANDIDATES) return false;
    const seen = new Set();
    for (const candidate of value.candidates) {
      if (!candidate || typeof candidate.name !== "string") return false;
      const name = cleanName(candidate.name);
      if (!name || name.length > 60 || seen.has(nameKey(name))) return false;
      if (!Number.isSafeInteger(candidate.votes) || candidate.votes < 1 || candidate.votes > MAX_VOTES_PER_CANDIDATE) return false;
      seen.add(nameKey(name));
    }
    return true;
  }

  importButton.addEventListener("click", () => importFile.click());
  importFile.addEventListener("change", async () => {
    const file = importFile.files?.[0];
    if (!file) return;
    try {
      if (file.size > 2_000_000) throw new Error("Berkas terlalu besar.");
      const backup = JSON.parse(await file.text());
      if (!validBackup(backup)) throw new Error("Format cadangan tidak valid.");
      if (state.candidates.length && !window.confirm("Pulihkan cadangan ini? Hasil yang saat ini tersimpan akan diganti.")) return;
      state = {
        version: 1,
        candidates: backup.candidates.map((candidate) => ({ id: newId(), name: cleanName(candidate.name), votes: candidate.votes })),
        lastVoteId: null,
        updatedAt: new Date().toISOString()
      };
      const saved = saveState();
      render();
      showToast(saved ? "Cadangan berhasil dipulihkan." : "Cadangan dimuat, tetapi browser gagal menyimpannya. Unduh cadangan sebelum menutup halaman.", !saved);
    } catch (error) {
      showToast(error.message || "Cadangan tidak dapat dibuka.", true);
    } finally {
      importFile.value = "";
    }
  });

  resetButton.addEventListener("click", () => {
    resetDialog.returnValue = "cancel";
    resetDialog.showModal();
  });
  resetDialog.addEventListener("close", () => {
    if (resetDialog.returnValue !== "confirm") return;
    state = emptyState();
    const saved = saveState();
    render();
    nameInput.focus();
    showToast(saved ? "Semua hasil telah dihapus." : "Hasil terhapus dari layar, tetapi browser gagal menyimpan perubahan.", !saved);
  });

  window.addEventListener("storage", (event) => {
    if (event.key === STORAGE_KEY) {
      state = loadState();
      render();
    }
  });

  render();
})();
