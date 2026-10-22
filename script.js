
/* ==========================================
   KoNoku - Mahasiswa 1
   Modul Genre dan Data Koleksi
   Penyimpanan menggunakan localStorage
========================================== */

const STORAGE = {
    genres: "konoku_genres_v1",
    collections: "konoku_collections_v1",
    profile: "konoku_profile_v1"
};

const $ = id => document.getElementById(id);

const colors = [
    "#4263eb",
    "#7c55d9",
    "#159a75",
    "#d28a22",
    "#db5c75",
    "#2798ad"
];

function readData(key, fallback) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : fallback;
    } catch (error) {
        return fallback;
    }
}

function saveData() {
    localStorage.setItem(STORAGE.genres, JSON.stringify(genres));
    localStorage.setItem(STORAGE.collections, JSON.stringify(collections));
}

function createId() {
    return crypto.randomUUID
        ? crypto.randomUUID()
        : Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function escapeHTML(value = "") {
    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

let genres = readData(STORAGE.genres, [
    {
        id: createId(),
        name: "Fantasi",
        description: "Dunia imajinatif dan petualangan"
    },
    {
        id: createId(),
        name: "Aksi",
        description: "Cerita penuh aksi dan tantangan"
    },
    {
        id: createId(),
        name: "Romansa",
        description: "Kisah hubungan dan perasaan"
    },
    {
        id: createId(),
        name: "Misteri",
        description: "Teka-teki dan rahasia"
    }
]);

let collections = readData(STORAGE.collections, []);
let profileName = readData(STORAGE.profile, "Administrator");

/* NOTIFIKASI */

let toastTimer;

function showToast(message) {
    const toast = $("toast");

    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
        toast.classList.remove("show");
    }, 2600);
}

/* MODAL */

function openModal(id) {
    $(id).hidden = false;

    const input = $(id).querySelector(
        "input:not([type=hidden]), textarea, select"
    );

    if (input) input.focus();
}

function closeModal(id) {
    $(id).hidden = true;
}

document.querySelectorAll("[data-close]").forEach(button => {
    button.addEventListener("click", () => {
        closeModal(button.dataset.close);
    });
});

document.querySelectorAll(".modal-backdrop").forEach(modal => {
    modal.addEventListener("click", event => {
        if (event.target === modal) {
            closeModal(modal.id);
        }
    });
});

document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
        document.querySelectorAll(".modal-backdrop:not([hidden])")
            .forEach(modal => closeModal(modal.id));
    }

    if ((event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "k") {
        event.preventDefault();
        $("globalSearch").focus();
    }
});

/* FUNGSI GENRE */

function getGenreName(id) {
    const genre = genres.find(item => item.id === id);
    return genre ? genre.name : "Genre tidak ditemukan";
}

function countByGenre(id) {
    return collections.filter(item => item.genreId === id).length;
}

function renderGenreOptions() {
    const filter = $("genreFilter");
    const oldFilter = filter.value;

    filter.innerHTML =
        '<option value="">Semua genre</option>' +
        genres.map(genre => `
            <option value="${escapeHTML(genre.id)}">
                ${escapeHTML(genre.name)}
            </option>
        `).join("");

    if (genres.some(item => item.id === oldFilter)) {
        filter.value = oldFilter;
    }

    const select = $("collectionGenre");
    const oldGenre = select.value;

    select.innerHTML = genres.map(genre => `
        <option value="${escapeHTML(genre.id)}">
            ${escapeHTML(genre.name)}
        </option>
    `).join("");

    if (genres.some(item => item.id === oldGenre)) {
        select.value = oldGenre;
    }
}

function renderGenres() {
    const container = $("genreList");

    if (genres.length === 0) {
        container.innerHTML = `
            <div class="empty-message">
                Belum ada genre. Tambahkan genre terlebih dahulu.
            </div>
        `;
        return;
    }

    container.innerHTML = genres.map((genre, index) => {
        const count = countByGenre(genre.id);

        return `
            <article class="genre-chip"
                style="--chip-color:${colors[index % colors.length]}">

                <span class="genre-dot"></span>

                <div class="genre-copy">
                    <strong>${escapeHTML(genre.name)}</strong>
                    <small>
                        ${count} koleksi
                        ${genre.description
                            ? " · " + escapeHTML(genre.description)
                            : ""}
                    </small>
                </div>

                <div class="genre-actions">
                    <button class="mini-btn"
                        type="button"
                        data-edit-genre="${escapeHTML(genre.id)}"
                        title="Ubah genre">✎</button>

                    <button class="mini-btn delete"
                        type="button"
                        data-delete-genre="${escapeHTML(genre.id)}"
                        title="Hapus genre">×</button>
                </div>
            </article>
        `;
    }).join("");

    container.querySelectorAll("[data-edit-genre]").forEach(button => {
        button.addEventListener("click", () => {
            editGenre(button.dataset.editGenre);
        });
    });

    container.querySelectorAll("[data-delete-genre]").forEach(button => {
        button.addEventListener("click", () => {
            deleteGenre(button.dataset.deleteGenre);
        });
    });
}

/* TAMBAH DAN UBAH GENRE */

function resetGenreForm() {
    $("genreForm").reset();
    $("genreId").value = "";
    $("genreModalTitle").textContent = "Tambah Genre";
}

$("addGenreBtn").addEventListener("click", () => {
    resetGenreForm();
    openModal("genreModal");
});

function editGenre(id) {
    const genre = genres.find(item => item.id === id);

    if (!genre) return;

    $("genreId").value = genre.id;
    $("genreName").value = genre.name;
    $("genreDescription").value = genre.description || "";
    $("genreModalTitle").textContent = "Ubah Genre";

    openModal("genreModal");
}

$("genreForm").addEventListener("submit", event => {
    event.preventDefault();

    const id = $("genreId").value;
    const name = $("genreName").value.trim();
    const description = $("genreDescription").value.trim();

    if (!name) {
        showToast("Nama genre wajib diisi.");
        return;
    }

    const duplicate = genres.some(genre =>
        genre.name.toLowerCase() === name.toLowerCase() &&
        genre.id !== id
    );

    if (duplicate) {
        showToast("Nama genre sudah digunakan.");
        return;
    }

    if (id) {
        const genre = genres.find(item => item.id === id);

        if (genre) {
            genre.name = name;
            genre.description = description;
        }

        showToast("Genre berhasil diperbarui.");
    } else {
        genres.push({
            id: createId(),
            name,
            description
        });

        showToast("Genre berhasil ditambahkan.");
    }

    saveData();
    renderAll();
    closeModal("genreModal");
    resetGenreForm();
});

/* HAPUS GENRE */

function deleteGenre(id) {
    const genre = genres.find(item => item.id === id);

    if (!genre) return;

    if (countByGenre(id) > 0) {
        showToast(
            "Genre masih digunakan. Ubah genre koleksi terlebih dahulu."
        );
        return;
    }

    if (!confirm(`Hapus genre "${genre.name}"?`)) return;

    genres = genres.filter(item => item.id !== id);

    saveData();
    renderAll();

    showToast("Genre berhasil dihapus.");
}

/* PENGELOLAAN KOLEKSI */

function resetCollectionForm() {
    $("collectionForm").reset();
    $("collectionId").value = "";
    $("collectionModalTitle").textContent = "Tambah Koleksi";
    $("collectionStatus").value = "Tersedia";

    renderGenreOptions();
}

function openCollectionForm() {
    resetCollectionForm();

    if (genres.length === 0) {
        showToast("Tambahkan genre terlebih dahulu.");
        resetGenreForm();
        openModal("genreModal");
        return;
    }

    openModal("collectionModal");
}

$("addCollectionBtn").addEventListener("click", openCollectionForm);
$("emptyAddBtn").addEventListener("click", openCollectionForm);

function editCollection(id) {
    const item = collections.find(collection => collection.id === id);

    if (!item) return;

    $("collectionId").value = item.id;
    $("collectionTitle").value = item.title;
    $("collectionType").value = item.type;
    $("collectionGenre").value = item.genreId;
    $("collectionAuthor").value = item.author;
    $("collectionYear").value = item.year || "";
    $("collectionVolume").value = item.volume || "";
    $("collectionStatus").value = item.status;
    $("collectionNotes").value = item.notes || "";

    $("collectionModalTitle").textContent = "Ubah Koleksi";

    openModal("collectionModal");
}

function deleteCollection(id) {
    const item = collections.find(collection => collection.id === id);

    if (!item) return;

    if (!confirm(`Hapus koleksi "${item.title}"?`)) return;

    collections = collections.filter(collection => collection.id !== id);

    saveData();
    renderAll();

    showToast("Koleksi berhasil dihapus.");
}

$("collectionForm").addEventListener("submit", event => {
    event.preventDefault();

    const id = $("collectionId").value;
    const title = $("collectionTitle").value.trim();
    const type = $("collectionType").value;
    const genreId = $("collectionGenre").value;
    const author = $("collectionAuthor").value.trim();
    const yearInput = $("collectionYear").value.trim();
    const year = yearInput ? Number(yearInput) : "";
    const volume = $("collectionVolume").value.trim();
    const status = $("collectionStatus").value;
    const notes = $("collectionNotes").value.trim();

    if (!title || !author) {
        showToast("Judul dan penulis wajib diisi.");
        return;
    }

    if (!genres.some(genre => genre.id === genreId)) {
        showToast("Pilih genre yang valid terlebih dahulu.");
        return;
    }

    if (year && (year < 1000 || year > 2100)) {
        showToast("Tahun harus di antara 1000 sampai 2100.");
        return;
    }

    const data = {
        title,
        type,
        genreId,
        author,
        year,
        volume,
        status,
        notes,
        updatedAt: Date.now()
    };

    if (id) {
        const existing = collections.find(item => item.id === id);

        if (existing) {
            Object.assign(existing, data);
        }

        showToast("Koleksi berhasil diperbarui.");
    } else {
        collections.push({
            id: createId(),
            ...data,
            createdAt: Date.now()
        });

        showToast("Koleksi berhasil ditambahkan.");
    }

    saveData();
    renderAll();
    closeModal("collectionModal");
    resetCollectionForm();
});

/* PENCARIAN DAN FILTER */

function getFilteredCollections() {
    const term = (
        $("globalSearch").value + " " +
        $("collectionSearch").value
    ).trim().toLocaleLowerCase("id");

    const genreId = $("genreFilter").value;
    const type = $("typeFilter").value;
    const status = $("statusFilter").value;

    return collections.filter(item => {
        const searchable = [
            item.title,
            item.author,
            item.type,
            getGenreName(item.genreId),
            item.volume,
            item.notes
        ].join(" ").toLocaleLowerCase("id");

        return (
            (!term || searchable.includes(term)) &&
            (!genreId || item.genreId === genreId) &&
            (!type || item.type === type) &&
            (!status || item.status === status)
        );
    });
}

function renderCollections() {
    const tbody = $("collectionTableBody");
    const data = getFilteredCollections();

    $("emptyState").hidden = data.length > 0;

    tbody.innerHTML = data.map((item, index) => {
        const initials = item.title
            .trim()
            .split(/\s+/)
            .slice(0, 2)
            .map(word => word[0])
            .join("")
            .toUpperCase();

        return `
            <tr>
                <td>
                    <div class="book-cell">
                        <span class="book-cover"
                            style="background:${colors[index % colors.length]}">
                            ${escapeHTML(initials)}
                        </span>

                        <span>
                            <strong class="book-title">
                                ${escapeHTML(item.title)}
                            </strong>
                            <small class="book-subtitle">
                                ${escapeHTML(item.volume || "Tanpa volume")}
                            </small>
                        </span>
                    </div>
                </td>

                <td><span class="type-pill">
                    ${escapeHTML(item.type)}
                </span></td>

                <td>${escapeHTML(getGenreName(item.genreId))}</td>
                <td>${escapeHTML(item.author)}</td>
                <td>${escapeHTML(item.year || "—")}</td>

                <td>
                    <span class="status-pill ${
                        item.status === "Tersedia"
                            ? "status-tersedia"
                            : "status-dipinjam"
                    }">
                        ${escapeHTML(item.status)}
                    </span>
                </td>

                <td>
                    <div class="row-actions">
                        <button class="mini-btn"
                            data-edit-collection="${escapeHTML(item.id)}"
                            title="Ubah">✎</button>

                        <button class="mini-btn delete"
                            data-delete-collection="${escapeHTML(item.id)}"
                            title="Hapus">×</button>
                    </div>
                </td>
            </tr>
        `;
    }).join("");

    $("tableCount").textContent =
        `Menampilkan ${data.length} dari ${collections.length} koleksi`;

    tbody.querySelectorAll("[data-edit-collection]").forEach(button => {
        button.addEventListener("click", () => {
            editCollection(button.dataset.editCollection);
        });
    });

    tbody.querySelectorAll("[data-delete-collection]").forEach(button => {
        button.addEventListener("click", () => {
            deleteCollection(button.dataset.deleteCollection);
        });
    });
}

[
    "globalSearch",
    "collectionSearch",
    "genreFilter",
    "typeFilter",
    "statusFilter"
].forEach(id => {
    $(id).addEventListener("input", renderCollections);
    $(id).addEventListener("change", renderCollections);
});

/* STATISTIK DASHBOARD */

function renderStats() {
    $("totalCollections").textContent = collections.length;
    $("totalGenres").textContent = genres.length;

    $("availableCollections").textContent =
        collections.filter(item => item.status === "Tersedia").length;

    const sorted = genres.map(genre => ({
        name: genre.name,
        count: countByGenre(genre.id)
    })).sort((a, b) => b.count - a.count);

    if (sorted.length > 0 && sorted[0].count > 0) {
        $("popularGenre").textContent = sorted[0].name;
        $("popularGenreFoot").textContent =
            `${sorted[0].count} koleksi dalam genre ini`;
    } else {
        $("popularGenre").textContent = "—";
        $("popularGenreFoot").textContent = "Belum ada data koleksi";
    }
}

/* REKAP PER GENRE */

function renderRecap() {
    const container = $("genreRecap");

    if (genres.length === 0) {
        container.innerHTML = `
            <div class="empty-message">
                Belum ada genre untuk direkap.
            </div>
        `;
        return;
    }

    const values = genres.map((genre, index) => ({
        name: genre.name,
        count: countByGenre(genre.id),
        color: colors[index % colors.length]
    }));

    const max = Math.max(1, ...values.map(item => item.count));

    container.innerHTML = values.map(item => {
        const width = item.count === 0
            ? 0
            : Math.max(4, item.count / max * 100);

        return `
            <div class="recap-row">
                <span class="recap-label">
                    ${escapeHTML(item.name)}
                </span>

                <div class="recap-track">
                    <div class="recap-bar"
                        style="width:${width}%;background:${item.color}">
                    </div>
                </div>

                <span class="recap-count">${item.count}</span>
            </div>
        `;
    }).join("");
}

/* PROFIL PENGGUNA */

function renderProfile() {
    $("profileName").textContent = profileName;

    $("avatarInitial").textContent =
        (profileName.trim()[0] || "A").toLocaleUpperCase("id");
}

$("profileButton").addEventListener("click", () => {
    $("profileNameInput").value = profileName;
    openModal("profileModal");
});

$("profileForm").addEventListener("submit", event => {
    event.preventDefault();

    const name = $("profileNameInput").value.trim();

    if (!name) {
        showToast("Nama pengguna wajib diisi.");
        return;
    }

    profileName = name;

    localStorage.setItem(STORAGE.profile, profileName);

    renderProfile();
    closeModal("profileModal");

    showToast("Profil berhasil diperbarui.");
});

/* NAVIGASI */

document.querySelectorAll(".nav-link").forEach(link => {
    link.addEventListener("click", event => {
        const target = link.getAttribute("href");

        if (target !== "#dashboard" &&
            target !== "#koleksi" &&
            target !== "#genre") {
            event.preventDefault();
            showToast(
                "Bagian ini berada di luar modul Mahasiswa 1."
            );
            return;
        }

        document.querySelectorAll(".nav-link").forEach(item => {
            item.classList.remove("active");
        });

        link.classList.add("active");
    });
});

/* JALANKAN APLIKASI */

function renderAll() {
    renderGenreOptions();
    renderGenres();
    renderCollections();
    renderStats();
    renderRecap();
    renderProfile();
}

saveData();
renderAll();
