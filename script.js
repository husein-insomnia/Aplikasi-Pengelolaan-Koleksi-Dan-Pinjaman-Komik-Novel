
// =============================================
// KONOKU - JAVASCRIPT
// Login, registrasi, koleksi, peminjam, transaksi
// =============================================

const $ = (id) => document.getElementById(id);

const readData = (key, fallback = []) => {
    try {
        return JSON.parse(localStorage.getItem(key)) ?? fallback;
    } catch {
        return fallback;
    }
};

const saveData = (key, value) => {
    localStorage.setItem(key, JSON.stringify(value));
};

let users = readData("konoku_users");
let collections = readData("konoku_collections");
let friends = readData("konoku_friends");
let loans = readData("konoku_loans");
let currentUser = readData("konoku_current_user", null);

// =============================================
// FUNGSI UMUM
// =============================================

function showMessage(id, message, isError = false) {
    const element = $(id);
    element.textContent = message;
    element.classList.toggle("error", isError);
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

function today() {
    const date = new Date();
    const offset = date.getTimezoneOffset();
    return new Date(date.getTime() - offset * 60000)
        .toISOString().slice(0, 10);
}

function getLoanStatus(loan) {
    if (loan.returned) return "Kembali";
    if (loan.dueDate < today()) return "Terlambat";
    return "Dipinjam";
}

function showAuth(page) {
    $("loginPage").classList.toggle("hidden", page !== "login");
    $("registerPage").classList.toggle("hidden", page !== "register");
    $("appPage").classList.add("hidden");
}

function showApp() {
    $("loginPage").classList.add("hidden");
    $("registerPage").classList.add("hidden");
    $("appPage").classList.remove("hidden");

    updateProfile();
    renderAll();
    showPage("dashboard");
}

function updateProfile() {
    if (!currentUser) return;

    const name = currentUser.name || "Pengguna";
    const initial = name.trim().charAt(0).toUpperCase() || "U";

    $("profileName").textContent = name;
    $("avatarInitial").textContent = initial;
    $("largeAvatar").textContent = initial;
    $("profilePageName").textContent = name;
    $("profilePageEmail").textContent = currentUser.email;
    $("editName").value = name;
}

// =============================================
// NAVIGASI HALAMAN
// =============================================

function showPage(pageName) {
    document.querySelectorAll(".page").forEach(page => {
        page.classList.add("hidden");
    });

    const target = $("page-" + pageName);
    if (target) target.classList.remove("hidden");

    document.querySelectorAll(".nav-link").forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.page === pageName
        );
    });

    if (pageName === "peminjaman") {
        renderLoanOptions();
    }
}

document.querySelectorAll("[data-page]").forEach(button => {
    button.addEventListener("click", event => {
        event.preventDefault();
        showPage(button.dataset.page);
    });
});

// =============================================
// LOGIN DAN REGISTRASI
// Catatan: autentikasi ini hanya demonstrasi frontend.
// =============================================

$("showRegister").addEventListener("click", event => {
    event.preventDefault();
    showAuth("register");
});

$("showLogin").addEventListener("click", event => {
    event.preventDefault();
    showAuth("login");
});

$("registerForm").addEventListener("submit", event => {
    event.preventDefault();

    const name = $("registerName").value.trim();
    const email = $("registerEmail").value.trim().toLowerCase();
    const password = $("registerPassword").value;

    if (users.some(user => user.email === email)) {
        showMessage("registerMessage", "Email sudah terdaftar.", true);
        return;
    }

    users.push({
        id: Date.now(),
        name,
        email,
        password
    });

    saveData("konoku_users", users);

    showMessage(
        "registerMessage",
        "Registrasi berhasil. Silakan login."
    );

    $("registerForm").reset();
    $("loginEmail").value = email;

    setTimeout(() => showAuth("login"), 800);
});

$("loginForm").addEventListener("submit", event => {
    event.preventDefault();

    const email = $("loginEmail").value.trim().toLowerCase();
    const password = $("loginPassword").value;

    const user = users.find(item =>
        item.email === email && item.password === password
    );

    if (!user) {
        showMessage(
            "loginMessage",
            "Email atau password salah. Silakan periksa kembali.",
            true
        );
        return;
    }

    currentUser = {
        id: user.id,
        name: user.name,
        email: user.email
    };

    saveData("konoku_current_user", currentUser);
    showApp();
});

$("logoutButton").addEventListener("click", () => {
    currentUser = null;
    localStorage.removeItem("konoku_current_user");
    $("loginForm").reset();
    showAuth("login");
});

// =============================================
// MAHASISWA 1: CRUD DATA KOLEKSI DAN FILTER
// =============================================

$("collectionForm").addEventListener("submit", event => {
    event.preventDefault();

    collections.push({
        id: Date.now(),
        ownerId: currentUser.id,
        title: $("bookTitle").value.trim(),
        author: $("bookAuthor").value.trim(),
        genre: $("bookGenre").value.trim(),
        type: $("bookType").value,
        year: $("bookYear").value,
        condition: $("bookCondition").value,
        stock: Number($("bookStock").value)
    });

    saveData("konoku_collections", collections);
    $("collectionForm").reset();
    $("bookStock").value = 1;

    renderAll();
    showMessage("appMessage", "Koleksi berhasil ditambahkan.");
});

function renderCollections() {
    const keyword = $("globalSearch").value.trim().toLowerCase();
    const genre = $("genreFilter").value.trim().toLowerCase();
    const type = $("typeFilter").value;

    const data = collections.filter(book =>
        book.ownerId === currentUser.id &&
        (!keyword ||
            `${book.title} ${book.author} ${book.genre}`
                .toLowerCase().includes(keyword)) &&
        (!genre || book.genre.toLowerCase().includes(genre)) &&
        (!type || book.type === type)
    );

    $("collectionTable").innerHTML = data.length
        ? data.map(book => `
            <tr>
                <td>${escapeHTML(book.title)}</td>
                <td>${escapeHTML(book.author)}</td>
                <td>${escapeHTML(book.genre)}</td>
                <td>${escapeHTML(book.type)}</td>
                <td>${book.stock}</td>
                <td>${escapeHTML(book.condition)}</td>
                <td>
                    <button class="small-btn delete-btn"
                        data-delete-book="${book.id}">
                        Hapus
                    </button>
                </td>
            </tr>
        `).join("")
        : `<tr><td colspan="7" class="empty">
            Belum ada koleksi. Silakan tambahkan data.
           </td></tr>`;
}

$("collectionTable").addEventListener("click", event => {
    const button = event.target.closest("[data-delete-book]");
    if (!button) return;

    const id = Number(button.dataset.deleteBook);

    if (loans.some(loan =>
        loan.ownerId === currentUser.id &&
        loan.bookId === id && !loan.returned
    )) {
        alert("Koleksi masih dipinjam. Catat pengembaliannya dahulu.");
        return;
    }

    if (!confirm("Hapus koleksi ini?")) return;

    collections = collections.filter(book => book.id !== id);
    saveData("konoku_collections", collections);
    renderAll();
});

$("globalSearch").addEventListener("input", renderCollections);
$("genreFilter").addEventListener("input", renderCollections);
$("typeFilter").addEventListener("change", renderCollections);

// =============================================
// MAHASISWA 2: DATA TEMAN / PEMINJAM
// =============================================

$("friendForm").addEventListener("submit", event => {
    event.preventDefault();

    friends.push({
        id: Date.now(),
        ownerId: currentUser.id,
        name: $("friendName").value.trim(),
        phone: $("friendPhone").value.trim()
    });

    saveData("konoku_friends", friends);
    $("friendForm").reset();

    renderAll();
    showMessage("appMessage", "Data teman berhasil ditambahkan.");
});

function renderFriends() {
    const data = friends.filter(
        friend => friend.ownerId === currentUser.id
    );

    $("friendTable").innerHTML = data.length
        ? data.map(friend => `
            <tr>
                <td>${escapeHTML(friend.name)}</td>
                <td>${escapeHTML(friend.phone || "-")}</td>
                <td>
                    <button class="small-btn delete-btn"
                        data-delete-friend="${friend.id}">
                        Hapus
                    </button>
                </td>
            </tr>
        `).join("")
        : `<tr><td colspan="3" class="empty">
            Belum ada teman terdaftar.
           </td></tr>`;
}

$("friendTable").addEventListener("click", event => {
    const button = event.target.closest("[data-delete-friend]");
    if (!button) return;

    const id = Number(button.dataset.deleteFriend);

    if (loans.some(loan =>
        loan.ownerId === currentUser.id &&
        loan.friendId === id && !loan.returned
    )) {
        alert("Teman masih memiliki pinjaman aktif.");
        return;
    }

    if (!confirm("Hapus data teman ini?")) return;

    friends = friends.filter(friend => friend.id !== id);
    saveData("konoku_friends", friends);
    renderAll();
});

// =============================================
// MAHASISWA 2: TRANSAKSI PEMINJAMAN
// =============================================

function renderLoanOptions() {
    const availableFriends = friends.filter(
        friend => friend.ownerId === currentUser.id
    );

    const availableBooks = collections.filter(
        book => book.ownerId === currentUser.id
    );

    $("loanFriend").innerHTML = availableFriends.map(friend => `
        <option value="${friend.id}">
            ${escapeHTML(friend.name)}
        </option>
    `).join("");

    $("loanBook").innerHTML = availableBooks.map(book => {
        const activeCount = loans.filter(loan =>
            loan.ownerId === currentUser.id &&
            loan.bookId === book.id &&
            !loan.returned
        ).length;

        const available = book.stock - activeCount;

        return `
            <option value="${book.id}" ${available <= 0 ? "disabled" : ""}>
                ${escapeHTML(book.title)} (tersedia: ${available})
            </option>
        `;
    }).join("");

    if (!availableFriends.length) {
        $("loanFriend").innerHTML =
            '<option value="">Tambahkan teman terlebih dahulu</option>';
    }

    if (!availableBooks.length) {
        $("loanBook").innerHTML =
            '<option value="">Tambahkan koleksi terlebih dahulu</option>';
    }
}

$("loanDate").value = today();

$("loanForm").addEventListener("submit", event => {
    event.preventDefault();

    const friendId = Number($("loanFriend").value);
    const bookId = Number($("loanBook").value);
    const loanDate = $("loanDate").value;
    const dueDate = $("loanDue").value;

    const friend = friends.find(item =>
        item.id === friendId && item.ownerId === currentUser.id
    );

    const book = collections.find(item =>
        item.id === bookId && item.ownerId === currentUser.id
    );

    if (!friend || !book) {
        alert("Pilih teman dan koleksi yang valid.");
        return;
    }

    if (dueDate < loanDate) {
        alert("Tanggal pengembalian tidak boleh sebelum tanggal pinjam.");
        return;
    }

    const activeCount = loans.filter(loan =>
        loan.ownerId === currentUser.id &&
        loan.bookId === bookId &&
        !loan.returned
    ).length;

    if (activeCount >= book.stock) {
        alert("Stok koleksi tidak tersedia.");
        return;
    }

    loans.push({
        id: Date.now(),
        ownerId: currentUser.id,
        friendId,
        bookId,
        loanDate,
        dueDate,
        returned: false
    });

    saveData("konoku_loans", loans);
    renderAll();
    renderLoanOptions();
    showMessage("appMessage", "Transaksi peminjaman berhasil dicatat.");
});

function renderLoans() {
    const data = loans.filter(
        loan => loan.ownerId === currentUser.id
    );

    $("loanTable").innerHTML = data.length
        ? data.map(loan => {
            const friend = friends.find(item =>
                item.id === loan.friendId
            );
            const book = collections.find(item =>
                item.id === loan.bookId
            );
            const status = getLoanStatus(loan);

            return `
                <tr>
                    <td>${escapeHTML(friend?.name || "Data tidak ditemukan")}</td>
                    <td>${escapeHTML(book?.title || "Koleksi dihapus")}</td>
                    <td>${escapeHTML(loan.loanDate)}</td>
                    <td>${escapeHTML(loan.dueDate)}</td>
                    <td><span class="status ${
                        status === "Terlambat" ? "late" :
                        status === "Kembali" ? "returned" : ""
                    }">${status}</span></td>
                    <td>
                        ${!loan.returned ? `
                            <button class="small-btn"
                                data-return-loan="${loan.id}">
                                Kembalikan
                            </button>` : "-"}
                    </td>
                </tr>
            `;
        }).join("")
        : `<tr><td colspan="6" class="empty">
            Belum ada transaksi peminjaman.
           </td></tr>`;
}

$("loanTable").addEventListener("click", event => {
    const button = event.target.closest("[data-return-loan]");
    if (!button) return;

    const id = Number(button.dataset.returnLoan);
    const loan = loans.find(item =>
        item.id === id && item.ownerId === currentUser.id
    );

    if (!loan || loan.returned) return;

    loan.returned = true;
    saveData("konoku_loans", loans);
    renderAll();
    renderLoanOptions();
});

// =============================================
// DASHBOARD: ANGKA DIHITUNG DARI DATA ASLI
// =============================================

function renderDashboard() {
    const myBooks = collections.filter(
        book => book.ownerId === currentUser.id
    );

    const myFriends = friends.filter(
        friend => friend.ownerId === currentUser.id
    );

    const myLoans = loans.filter(
        loan => loan.ownerId === currentUser.id
    );

    const active = myLoans.filter(loan => !loan.returned);
    const late = active.filter(loan => getLoanStatus(loan) === "Terlambat");

    $("totalKoleksi").textContent =
        myBooks.reduce((sum, book) => sum + book.stock, 0) + " item";

    $("totalDipinjam").textContent = active.length + " item";
    $("totalTerlambat").textContent = late.length + " transaksi";
    $("totalTeman").textContent = myFriends.length + " orang";

    const recent = [...myLoans].sort(
        (a, b) => b.id - a.id
    ).slice(0, 5);

    $("recentLoans").innerHTML = recent.length
        ? recent.map(loan => {
            const friend = friends.find(item => item.id === loan.friendId);
            const book = collections.find(item => item.id === loan.bookId);
            const status = getLoanStatus(loan);

            return `
                <tr>
                    <td>${escapeHTML(friend?.name || "-")}</td>
                    <td>${escapeHTML(book?.title || "Koleksi dihapus")}</td>
                    <td>${escapeHTML(loan.loanDate)}</td>
                    <td>${escapeHTML(status)}</td>
                </tr>
            `;
        }).join("")
        : `<tr><td colspan="4" class="empty">
            Belum ada transaksi peminjaman.
           </td></tr>`;

    const attention = [];

    if (late.length) {
        attention.push(`<p>• ${late.length} transaksi melewati tanggal kembali.</p>`);
    }

    if (!myBooks.length) {
        attention.push("<p>• Tambahkan koleksi pertama melalui menu Data Koleksi.</p>");
    }

    if (!myFriends.length) {
        attention.push("<p>• Tambahkan teman melalui menu Teman/Peminjam.</p>");
    }

    if (!attention.length) {
        attention.push("<p>• Tidak ada hal yang perlu diperhatikan saat ini.</p>");
    }

    $("attentionList").innerHTML = attention.join("");
}

// =============================================
// PROFIL PENGGUNA
// =============================================

$("profileButton").addEventListener("click", () => {
    showPage("profil");
});

$("profileForm").addEventListener("submit", event => {
    event.preventDefault();

    const name = $("editName").value.trim();
    if (!name) return;

    const user = users.find(item => item.id === currentUser.id);

    if (user) {
        user.name = name;
        saveData("konoku_users", users);
    }

    currentUser.name = name;
    saveData("konoku_current_user", currentUser);

    updateProfile();
    showMessage("appMessage", "Profil berhasil diperbarui.");
});

// =============================================
// LAPORAN CSV
// =============================================

$("exportButton").addEventListener("click", () => {
    const myLoans = loans.filter(
        loan => loan.ownerId === currentUser.id
    );

    const rows = [
        ["Peminjam", "Judul", "Tanggal Pinjam", "Batas Kembali", "Status"]
    ];

    myLoans.forEach(loan => {
        const friend = friends.find(item => item.id === loan.friendId);
        const book = collections.find(item => item.id === loan.bookId);

        rows.push([
            friend?.name || "-",
            book?.title || "-",
            loan.loanDate,
            loan.dueDate,
            getLoanStatus(loan)
        ]);
    });

    const csv = rows.map(row =>
        row.map(value =>
            '"' + String(value).replace(/"/g, '""') + '"'
        ).join(",")
    ).join("\r\n");

    const blob = new Blob(["\uFEFF" + csv], {
        type: "text/csv;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "laporan-konoku.csv";
    link.click();
    URL.revokeObjectURL(url);
});

// =============================================
// RENDER SEMUA KOMPONEN
// =============================================

function renderAll() {
    if (!currentUser) return;

    renderCollections();
    renderFriends();
    renderLoanOptions();
    renderLoans();
    renderDashboard();

    const myBooks = collections.filter(
        book => book.ownerId === currentUser.id
    );
    const myFriends = friends.filter(
        friend => friend.ownerId === currentUser.id
    );
    const myLoans = loans.filter(
        loan => loan.ownerId === currentUser.id
    );

    $("reportBooks").textContent = myBooks.length;
    $("reportFriends").textContent = myFriends.length;
    $("reportLoans").textContent = myLoans.length;
}

// =============================================
// MULAI APLIKASI
// =============================================

if (currentUser &&
    users.some(user => user.id === currentUser.id)) {
    showApp();
} else {
    currentUser = null;
    localStorage.removeItem("konoku_current_user");
    showAuth("login");
}
