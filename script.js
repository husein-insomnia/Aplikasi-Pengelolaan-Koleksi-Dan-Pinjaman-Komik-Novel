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

let collections = readData("konoku_collections", [
    { id: 101, ownerId: 1, title: "One Piece Vol. 1", stock: 3 },
    { id: 102, ownerId: 1, title: "Detektif Conan", stock: 2 }
]);
let friends = readData("konoku_friends", []);
let loans = readData("konoku_loans", []);
const currentUser = { id: 1 };

function showMessage(id, message, isError = false) {
    const element = $(id);
    if (!element) return;
    element.textContent = message;
    element.classList.toggle("error", isError);
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[char]);
}

function today() {
    const date = new Date();
    const offset = date.getTimezoneOffset();
    return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 10);
}

function getLoanStatus(loan) {
    if (loan.returned) return "Kembali";
    if (loan.dueDate < today()) return "Terlambat";
    return "Dipinjam";
}

// TEMAN / PEMINJAM
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
    const data = friends.filter(friend => friend.ownerId === currentUser.id);

    $("friendTable").innerHTML = data.length
        ? data.map(friend => `
            <tr>
                <td>${escapeHTML(friend.name)}</td>
                <td>${escapeHTML(friend.phone || "-")}</td>
                <td>
                    <button class="small-btn delete-btn" data-delete-friend="${friend.id}">Hapus</button>
                </td>
            </tr>
        `).join("")
        : `<tr><td colspan="3" class="empty">Belum ada teman terdaftar.</td></tr>`;
}

$("friendTable").addEventListener("click", event => {
    const button = event.target.closest("[data-delete-friend]");
    if (!button) return;

    const id = Number(button.dataset.deleteFriend);

    if (loans.some(loan => loan.ownerId === currentUser.id && loan.friendId === id && !loan.returned)) {
        alert("Teman masih memiliki pinjaman aktif.");
        return;
    }

    if (!confirm("Hapus data teman ini?")) return;

    friends = friends.filter(friend => friend.id !== id);
    saveData("konoku_friends", friends);
    renderAll();
});

// TRANSAKSI PEMINJAMAN
function renderLoanOptions() {
    const availableFriends = friends.filter(friend => friend.ownerId === currentUser.id);

    $("loanFriend").innerHTML = availableFriends.length ? availableFriends.map(friend => `
        <option value="${friend.id}">${escapeHTML(friend.name)}</option>
    `).join("") : '<option value="">Tambahkan teman terlebih dahulu</option>';

    $("loanBook").innerHTML = collections.map(book => {
        const activeCount = loans.filter(loan =>
            loan.ownerId === currentUser.id && loan.bookId === book.id && !loan.returned
        ).length;

        const available = book.stock - activeCount;

        return `
            <option value="${book.id}" ${available <= 0 ? "disabled" : ""}>
                ${escapeHTML(book.title)} (tersedia: ${available})
            </option>
        `;
    }).join("");
}

$("loanDate").value = today();

$("loanForm").addEventListener("submit", event => {
    event.preventDefault();

    const friendId = Number($("loanFriend").value);
    const bookId = Number($("loanBook").value);
    const loanDate = $("loanDate").value;
    const dueDate = $("loanDue").value;

    if (dueDate < loanDate) {
        alert("Tanggal pengembalian tidak boleh sebelum tanggal pinjam.");
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
    const data = loans.filter(loan => loan.ownerId === currentUser.id);

    $("loanTable").innerHTML = data.length
        ? data.map(loan => {
            const friend = friends.find(item => item.id === loan.friendId);
            const book = collections.find(item => item.id === loan.bookId);
            const status = getLoanStatus(loan);

            return `
                <tr>
                    <td>${escapeHTML(friend?.name || "Data tidak ditemukan")}</td>
                    <td>${escapeHTML(book?.title || "Koleksi dihapus")}</td>
                    <td>${escapeHTML(loan.loanDate)}</td>
                    <td>${escapeHTML(loan.dueDate)}</td>
                    <td><span class="status ${status === "Terlambat" ? "late" : status === "Kembali" ? "returned" : ""}">${status}</span></td>
                    <td>
                        ${!loan.returned ? `<button class="small-btn" data-return-loan="${loan.id}">Kembalikan</button>` : "-"}
                    </td>
                </tr>
            `;
        }).join("")
        : `<tr><td colspan="6" class="empty">Belum ada transaksi peminjaman.</td></tr>`;
}

$("loanTable").addEventListener("click", event => {
    const button = event.target.closest("[data-return-loan]");
    if (!button) return;

    const id = Number(button.dataset.returnLoan);
    const loan = loans.find(item => item.id === id && item.ownerId === currentUser.id);

    if (!loan || loan.returned) return;

    loan.returned = true;
    saveData("konoku_loans", loans);
    renderAll();
    renderLoanOptions();
});

// LAPORAN & EKSPOR CSV
$("exportButton").addEventListener("click", () => {
    const myLoans = loans.filter(loan => loan.ownerId === currentUser.id);

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
        row.map(value => '"' + String(value).replace(/"/g, '""') + '"').join(",")
    ).join("\r\n");

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "laporan-mahasiswa2.csv";
    link.click();
    URL.revokeObjectURL(url);
});

function renderAll() {
    renderFriends();
    renderLoanOptions();
    renderLoans();
    $("reportBooks").textContent = collections.length;
    $("reportFriends").textContent = friends.filter(f => f.ownerId === currentUser.id).length;
    $("reportLoans").textContent = loans.filter(l => l.ownerId === currentUser.id).length;
}

renderAll();
