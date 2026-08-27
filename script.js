// ============================================
// IMPORT FIREBASE
// ============================================

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";


import {
    getFirestore,
    collection,
    addDoc,
    getDocs,
    deleteDoc,
    updateDoc,
    doc
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";


// ============================================
// FIREBASE CONFIG
// ============================================

const firebaseConfig = {

    apiKey: "AIzaSyC6FfH3PQ5UvtJiSCWUlQ6by_BgpWo0Cd8",

    authDomain:
        "event-registration-workshop1.firebaseapp.com",

    projectId:
        "event-registration-workshop1",

    storageBucket:
        "event-registration-workshop1.firebasestorage.app",

    messagingSenderId:
        "1002469070708",

    appId:
        "1:1002469070708:web:44a53de54ebeb8d5127e21"
};


// ============================================
// INISIALISASI FIREBASE
// ============================================

const app = initializeApp(firebaseConfig);


// ============================================
// INISIALISASI FIRESTORE
// ============================================

const db = getFirestore(app);


console.log("Firebase berhasil terhubung!");


// ============================================
// AMBIL ELEMENT FORM
// ============================================

const registrationForm =
    document.getElementById("registrationForm");


// ============================================
// AMBIL TABEL PESERTA
// ============================================

const participantList =
    document.getElementById("participantList");


// ============================================
// CREATE
// MENAMBAHKAN PESERTA
// ============================================

registrationForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        // Ambil data dari form

        const name =
            document.getElementById("name").value;

        const email =
            document.getElementById("email").value;

        const phone =
            document.getElementById("phone").value;

        const selectedEvent =
            document.getElementById("event").value;


        try {

            // Simpan ke Firestore

            await addDoc(
                collection(db, "participants"),
                {

                    name: name,

                    email: email,

                    phone: phone,

                    event: selectedEvent,

                    createdAt: new Date()

                }
            );


            alert(
                "Pendaftaran berhasil!"
            );


            // Kosongkan form

            registrationForm.reset();


            // Refresh tabel

            loadParticipants();


        } catch (error) {

            console.error(
                "Gagal menyimpan data:",
                error
            );

            alert(
                "Terjadi kesalahan saat menyimpan data."
            );

        }

    }
);


// ============================================
// READ
// MENAMPILKAN DATA PESERTA
// ============================================

async function loadParticipants() {

    try {

        const querySnapshot =
            await getDocs(
                collection(db, "participants")
            );


        participantList.innerHTML = "";


        let no = 1;


        querySnapshot.forEach(
            function (documentSnapshot) {

                const data =
                    documentSnapshot.data();


                const id =
                    documentSnapshot.id;


                participantList.innerHTML += `

                    <tr>

                        <td>
                            ${no}
                        </td>

                        <td>
                            ${data.name}
                        </td>

                        <td>
                            ${data.email}
                        </td>

                        <td>
                            ${data.phone}
                        </td>

                        <td>
                            ${data.event}
                        </td>

                        <td>

                            <button
                                class="edit-btn"
                                onclick="editParticipant(
                                    '${id}',
                                    '${data.name}',
                                    '${data.email}',
                                    '${data.phone}',
                                    '${data.event}'
                                )"
                            >
                                Edit
                            </button>


                            <button
                                class="delete-btn"
                                onclick="deleteParticipant(
                                    '${id}'
                                )"
                            >
                                Hapus
                            </button>

                        </td>

                    </tr>

                `;


                no++;

            }
        );


    } catch (error) {

        console.error(
            "Gagal mengambil data:",
            error
        );

    }

}


// ============================================
// DELETE
// MENGHAPUS PESERTA
// ============================================

window.deleteParticipant =
    async function (id) {

        const confirmation =
            confirm(
                "Apakah kamu yakin ingin menghapus peserta ini?"
            );


        if (!confirmation) {

            return;

        }


        try {

            await deleteDoc(
                doc(
                    db,
                    "participants",
                    id
                )
            );


            alert(
                "Data berhasil dihapus!"
            );


            loadParticipants();


        } catch (error) {

            console.error(
                "Gagal menghapus data:",
                error
            );


            alert(
                "Gagal menghapus data."
            );

        }

    };


// ============================================
// UPDATE
// MENGEDIT PESERTA
// ============================================

window.editParticipant =
    async function (
        id,
        oldName,
        oldEmail,
        oldPhone,
        oldEvent
    ) {


        const name =
            prompt(
                "Nama lengkap:",
                oldName
            );


        if (name === null) {

            return;

        }


        const email =
            prompt(
                "Email:",
                oldEmail
            );


        if (email === null) {

            return;

        }


        const phone =
            prompt(
                "Nomor HP:",
                oldPhone
            );


        if (phone === null) {

            return;

        }


        const selectedEvent =
            prompt(
                "Event:",
                oldEvent
            );


        if (selectedEvent === null) {

            return;

        }


        try {

            await updateDoc(

                doc(
                    db,
                    "participants",
                    id
                ),

                {

                    name: name,

                    email: email,

                    phone: phone,

                    event: selectedEvent

                }

            );


            alert(
                "Data berhasil diperbarui!"
            );


            loadParticipants();


        } catch (error) {

            console.error(
                "Gagal memperbarui data:",
                error
            );


            alert(
                "Gagal memperbarui data."
            );

        }

    };


// ============================================
// JALANKAN SAAT WEBSITE DIBUKA
// ============================================

loadParticipants();