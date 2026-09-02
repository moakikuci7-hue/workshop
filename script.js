import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { getFirestore, collection, addDoc, onSnapshot, query, where, doc, setDoc, getDoc, updateDoc, increment, getDocs, deleteDoc } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyB81v9_WEA5ROouGXhpDAaedurUkp5MA88",
    authDomain: "workshop-pendaftaran-event.firebaseapp.com",
    projectId: "workshop-pendaftaran-event",
    storageBucket: "workshop-pendaftaran-event.firebasestorage.app",
    messagingSenderId: "31982803636",
    appId: "1:31982803636:web:54c4fa0d565b5a72bbd5e1"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let isLoginMode = true;

// INIT LOAD
listenAllEvents();

// --- NAVIGATION ---
window.goToAuth = (role) => {
    localStorage.setItem('pintuRole', role);
    document.getElementById('modal-auth').classList.remove('hidden');
    isLoginMode = true;
    updateAuthUI();
};

window.closeModal = (id) => document.getElementById(id).classList.add('hidden');

function updateAuthUI() {
    const role = localStorage.getItem('pintuRole');
    const title = document.getElementById('auth-title');
    const toggle = document.getElementById('toggle-auth');
    if(role === 'admin') {
        title.innerText = "Login Admin"; toggle.classList.add('hidden');
    } else {
        title.innerText = isLoginMode ? "Login Peserta" : "Daftar Akun Baru";
        toggle.classList.remove('hidden');
        toggle.innerText = isLoginMode ? "Belum punya akun? Daftar di sini" : "Sudah punya akun? Login";
    }
}

document.getElementById('toggle-auth').onclick = () => { isLoginMode = !isLoginMode; updateAuthUI(); };

document.getElementById('btn-action-auth').onclick = async () => {
    const email = document.getElementById('email').value, pass = document.getElementById('password').value;
    try {
        if(localStorage.getItem('pintuRole') === 'admin' && email !== "fauzan12@gmail.com") throw new Error("Akses Ditolak!");
        if(isLoginMode || localStorage.getItem('pintuRole') === 'admin') await signInWithEmailAndPassword(auth, email, pass);
        else await createUserWithEmailAndPassword(auth, email, pass);
    } catch (e) {
        alert(e.code === 'auth/invalid-credential' ? "Akun tidak ditemukan, silakan daftar." : e.message);
    }
};

onAuthStateChanged(auth, (user) => {
    if (user) {
        document.getElementById('section-landing').classList.add('hidden');
        document.getElementById('modal-auth').classList.add('hidden');
        document.getElementById('main-sidebar').classList.remove('hidden');
        document.getElementById('main-content-area').classList.remove('hidden');
        const role = localStorage.getItem('pintuRole');
        document.getElementById('sidebar-title').innerText = "WELCOME " + role.toUpperCase();
        if(role === 'admin') {
            showSection('section-admin-panel'); listenAdminData(); listenAdminEventList();
            document.getElementById('menu-admin-only').classList.remove('hidden');
            document.getElementById('menu-user-only').classList.add('hidden');
        } else {
            showSection('section-pilih-event'); loadUserProfile(user.uid); listenMyRegistration(user.uid);
            document.getElementById('menu-admin-only').classList.add('hidden');
            document.getElementById('menu-user-only').classList.remove('hidden');
        }
    }
});

// --- WORKSHOP LOGIC ---
function listenAllEvents() {
    onSnapshot(collection(db, "events"), (snap) => {
        const containers = [document.getElementById('container-spoiler-event'), document.getElementById('container-event-peserta')];
        let html = "";
        snap.forEach(d => {
            const ev = d.data(); const isH = ev.currentQuota <= 0 || ev.status === 'selesai';
            html += `
                <div class="event-card" style="opacity:${ev.status === 'selesai' ? '0.6' : '1'}">
                    <img src="${ev.thumb}" class="event-img">
                    <div class="event-body">
                        <span class="badge badge-blue">${ev.status}</span>
                        <h3 style="margin:10px 0;">${ev.title}</h3>
                        <p style="font-size:12px; color:#64748b;">📍 ${ev.loc} | 📅 ${ev.time}</p>
                        <div style="display:flex; justify-content:space-between; margin-top:10px;">
                            <strong>Rp ${Number(ev.price).toLocaleString()}</strong>
                            <small>Sisa: ${ev.currentQuota}/${ev.maxQuota}</small>
                        </div>
                        <div style="display:flex; gap:5px; margin-top:15px;">
                            <button class="btn-ghost" style="flex:1; padding:10px;" onclick="openDetailModal('${d.id}')">Info</button>
                            <button class="btn-primary" style="flex:1; padding:10px; background:${isH?'#ccc':''}" 
                            ${isH?'disabled':''} onclick="handleDaftarClick('${ev.title}')">Daftar</button>
                        </div>
                    </div>
                </div>`;
        });
        containers.forEach(c => { if(c) c.innerHTML = html; });
    });
}

window.openDetailModal = async (id) => {
    const d = await getDoc(doc(db, "events", id));
    if(d.exists()) {
        const ev = d.data();
        document.getElementById('det-img').src = ev.thumb;
        document.getElementById('det-title').innerText = ev.title;
        document.getElementById('det-loc').innerText = ev.loc;
        document.getElementById('det-time').innerText = ev.time;
        document.getElementById('det-price').innerText = "Rp " + Number(ev.price).toLocaleString();
        document.getElementById('det-desc').innerText = ev.desc || "Tidak ada deskripsi.";
        document.getElementById('det-status').innerText = ev.status.toUpperCase();
        document.getElementById('modal-event-detail').classList.remove('hidden');
        document.getElementById('det-btn-daftar').onclick = () => { closeModal('modal-event-detail'); handleDaftarClick(ev.title); };
    }
};

window.handleDaftarClick = (title) => {
    if(!auth.currentUser) { alert("Silakan login!"); goToAuth('user'); }
    else { document.getElementById('selected-event').value = title; showSection('section-form-daftar'); }
};

// --- SIMPAN EVENT (ADMIN) ---
window.simpanEventBaru = async () => {
    const editId = document.getElementById('edit-event-id').value, q = parseInt(document.getElementById('ev-quota').value);
    const data = {
        title: document.getElementById('ev-title').value, maxQuota: q, desc: document.getElementById('ev-desc').value,
        thumb: document.getElementById('ev-thumb').value || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
        loc: document.getElementById('ev-loc').value, time: document.getElementById('ev-time').value, price: document.getElementById('ev-price').value || 0
    };
    if(editId) await updateDoc(doc(db, "events", editId), data);
    else { data.currentQuota = q; data.status = 'aktif'; data.createdAt = new Date(); await addDoc(collection(db, "events"), data); }
    alert("Berhasil!"); showSection('section-list-event-admin');
};

// --- LAIN-LAIN (Sama seperti logika sebelumnya) ---
window.showSection = (id) => { document.querySelectorAll('.content-section').forEach(s => s.classList.add('hidden')); document.getElementById(id).classList.remove('hidden'); };
window.changeMenu = (el, id) => { document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active')); el.classList.add('active'); showSection(id); };
window.logout = () => signOut(auth).then(() => { localStorage.removeItem('pintuRole'); location.reload(); });

window.simpanPendaftaran = async () => {
    const t = document.getElementById('selected-event').value;
    const qEv = query(collection(db, "events"), where("title", "==", t));
    const evS = await getDocs(qEv); const evD = evS.docs[0];
    await addDoc(collection(db, "pendaftaran"), {
        uid: auth.currentUser.uid, email: auth.currentUser.email,
        nama: document.getElementById('reg-nama').value, nohp: document.getElementById('reg-nohp').value,
        instansi: document.getElementById('reg-instansi').value,
        namaEvent: t, eventId: evD.id, harga: evD.data().price,
        statusPembayaran: evD.data().price > 0 ? "Pending" : "Gratis", tglDaftar: new Date()
    });
    await updateDoc(doc(db, "events", evD.id), { currentQuota: increment(-1) });
    alert("Terdaftar!"); showSection('section-pendaftaran-saya');
};

function listenMyRegistration(uid) {
    const q = query(collection(db, "pendaftaran"), where("uid", "==", uid));
    onSnapshot(q, (snap) => {
        const c = document.getElementById('list-pendaftaran-saya'); c.innerHTML = "";
        snap.forEach(d => {
            const r = d.data();
            c.innerHTML += `<div class="content-card" style="display:flex; justify-content:space-between; align-items:center;">
                <div><strong>${r.namaEvent}</strong><br><small>${r.statusPembayaran}</small></div>
                <div>${r.statusPembayaran==='Pending'?`<button class="btn-pay" onclick="openPaymentModal('${d.id}')">Pay</button>`:''}</div></div>`;
        });
    });
}
window.openPaymentModal = (id) => { document.getElementById('pay-reg-id').value = id; document.getElementById('modal-payment').classList.remove('hidden'); };
window.konfirmasiPembayaran = async () => {
    await updateDoc(doc(db, "pendaftaran", document.getElementById('pay-reg-id').value), { statusPembayaran: "Menunggu Verifikasi", pengirim: document.getElementById('pay-sender-name').value });
    alert("Terkirim!"); closeModal('modal-payment');
};

function listenAdminData() {
    onSnapshot(collection(db, "pendaftaran"), (s) => {
        const t = document.getElementById('admin-table-body'); t.innerHTML = "";
        s.forEach(d => {
            const i = d.data(); const isW = i.statusPembayaran === "Menunggu Verifikasi";
            t.innerHTML += `<tr><td>${i.nama}</td><td>${i.statusPembayaran}</td><td>${i.pengirim||'-'}</td><td>${i.namaEvent}</td>
            <td>${isW?`<button class="btn-pay" onclick="verif('${d.id}')">Verif</button>`:'-'}</td></tr>`;
        });
    });
}
window.verif = async (id) => { if(confirm("Verifikasi Lunas?")) await updateDoc(doc(db, "pendaftaran", id), { statusPembayaran: "Lunas" }); };

function listenAdminEventList() {
    onSnapshot(collection(db, "events"), (snap) => {
        const c = document.getElementById('admin-event-list-container'); c.innerHTML = "";
        snap.forEach(d => {
            const ev = d.data(); const clr = ev.status === 'aktif' ? '#10b981' : '#ef4444';
            c.innerHTML += `<div class="content-card" style="display:flex; justify-content:space-between; border-left:5px solid ${clr}">
                <div><strong>${ev.title}</strong><br><small>Sisa: ${ev.currentQuota}/${ev.maxQuota}</small></div>
                <div><button class="btn-ghost" onclick="prepareEditEvent('${d.id}')">Edit</button></div></div>`;
        });
    });
}
window.prepareEditEvent = async (id) => {
    const d = await getDoc(doc(db, "events", id)); const ev = d.data();
    document.getElementById('edit-event-id').value = id; document.getElementById('ev-title').value = ev.title;
    document.getElementById('ev-quota').value = ev.maxQuota; document.getElementById('ev-desc').value = ev.desc;
    document.getElementById('ev-loc').value = ev.loc; document.getElementById('ev-time').value = ev.time;
    document.getElementById('ev-price').value = ev.price; showSection('section-tambah-event');
};
async function loadUserProfile(u) {
    const d = await getDoc(doc(db, "users", u));
    if(d.exists()) { document.getElementById('prof-nama').value = d.data().nama; document.getElementById('prof-nohp').value = d.data().nohp; document.getElementById('prof-instansi').value = d.data().instansi; }
}
window.simpanProfil = async () => { await setDoc(doc(db, "users", auth.currentUser.uid), { nama: document.getElementById('prof-nama').value, nohp: document.getElementById('prof-nohp').value, instansi: document.getElementById('prof-instansi').value }, { merge: true }); alert("Updated!"); };
