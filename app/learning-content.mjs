// Original, editorial learning activities. Not official HSK exam material or operating procedures.
// Terminology cross-checked against the repository vocabulary and vocabulary-notes corpus.
export const stories=[
 {id:'morning-briefing',title:'Tugas pagi bersama foreman',zh:'早上的工作安排',level:1,theme:'Komunikasi kerja',icon:'班',note:'Mandarin dasar + istilah pekerjaan; level adalah rekomendasi belajar, bukan klasifikasi teks HSK resmi.',sentences:[
 ['今天早上，安迪去上班。','Pagi ini, Andi berangkat bekerja.'],
 ['班长说：“大家好！我们先看今天的工作安排。”','Foreman berkata, “Selamat pagi semuanya! Kita lihat dahulu pembagian tugas hari ini.”'],
 ['安迪问：“我今天做什么？”','Andi bertanya, “Apa tugas saya hari ini?”'],
 ['班长说：“你和同事一起检查设备。有问题就告诉我。”','Foreman menjawab, “Kamu memeriksa peralatan bersama rekan kerja. Beri tahu saya jika ada masalah.”'],
 ['安迪说：“好的，我明白了。”','Andi berkata, “Baik, saya mengerti.”']],questions:[
 {prompt:'Kapan Andi berangkat bekerja?',options:['Pagi hari','Malam hari','Hari Minggu'],answer:0,explanation:'今天早上 berarti pagi ini.'},
 {prompt:'Dengan siapa Andi memeriksa peralatan?',options:['Sendirian','Bersama rekan kerja','Bersama pelanggan'],answer:1,explanation:'和同事一起 berarti bersama rekan kerja.'}]},
 {id:'conveyor-report',title:'Melaporkan suara tidak biasa pada konveyor',zh:'及时报告问题',level:3,theme:'Produksi & pelaporan',icon:'工',note:'Cerita original untuk latihan bahasa, memakai 输送带 dari sumber pekerjaan DBB1. Istilah teknis dapat melampaui level HSK yang direkomendasikan.',sentences:[
 ['安迪和同事在工作现场。','Andi dan rekan kerjanya berada di lokasi kerja.'],
 ['他们发现输送带发出不正常的声音。','Mereka mendapati konveyor mengeluarkan suara yang tidak normal.'],
 ['安迪立即向班长报告：“这里有异常声音，请安排人员处理。”','Andi segera melapor kepada foreman, “Ada suara tidak biasa di sini. Mohon tugaskan petugas untuk menanganinya.”'],
 ['班长通知了维修人员，并按照现场规定安排工作。','Foreman memberi tahu petugas perawatan dan mengatur pekerjaan sesuai ketentuan lokasi.'],
 ['安迪把发现问题的时间和情况写在记录里。','Andi mencatat waktu dan keadaan saat masalah ditemukan.']],questions:[
 {prompt:'Apa yang ditemukan Andi dan rekannya?',options:['Pintu terkunci','Suara konveyor tidak normal','Jadwal rapat berubah'],answer:1,explanation:'不正常的声音 berarti suara yang tidak normal.'},
 {prompt:'Informasi apa yang dicatat Andi?',options:['Waktu dan kondisi masalah','Harga peralatan','Nama pelanggan'],answer:0,explanation:'时间和情况 berarti waktu dan keadaan.'}]},
 {id:'safety-handover',title:'Serah terima informasi keselamatan',zh:'交接班时说清楚',level:4,theme:'Keselamatan & serah terima',icon:'安',note:'Materi bahasa original. Bukan SOP keselamatan atau pengganti ketentuan lokasi kerja.',sentences:[
 ['交接班前，丽娜认真整理工作记录。','Sebelum serah terima shift, Lina menyusun catatan kerja dengan teliti.'],
 ['她向下一班同事说明设备的情况，以及需要注意的问题。','Ia menjelaskan keadaan peralatan dan hal yang perlu diperhatikan kepada rekan shift berikutnya.'],
 ['同事问：“这个问题已经解决了吗？”','Rekannya bertanya, “Apakah masalah ini sudah ditangani?”'],
 ['丽娜回答：“还没有。我们已经报告了，请按照现场规定继续跟进。”','Lina menjawab, “Belum. Kami sudah melaporkannya. Mohon tindak lanjuti sesuai ketentuan lokasi.”'],
 ['双方确认信息无误后，在交接记录上签字。','Setelah memastikan informasi benar, kedua pihak menandatangani catatan serah terima.']],questions:[
 {prompt:'Apakah masalah dalam cerita sudah ditangani?',options:['Sudah','Belum','Tidak ada masalah'],answer:1,explanation:'还没有 berarti belum.'},
 {prompt:'Apa yang dilakukan sebelum menandatangani catatan?',options:['Membeli peralatan','Memastikan informasi benar','Mengganti jadwal libur'],answer:1,explanation:'确认信息无误 berarti memastikan informasi tidak keliru.'}]}
];
export const contrasts=[
 {id:'sunday',kind:'synonym',title:'星期日 · 星期天',level:1,words:[['星期日','hari Minggu'],['星期天','hari Minggu']],context:'Keduanya menyebut hari Minggu. 星期日 cenderung digunakan pada tulisan atau jadwal resmi; 星期天 lebih lazim dalam percakapan. Ini kecenderungan ragam, bukan aturan mutlak.',examples:[['星期日休息。','Libur pada hari Minggu.'],['星期天见。','Sampai jumpa hari Minggu.']],question:'Mana yang cenderung lebih formal untuk jadwal tertulis?',options:['星期日','星期天'],answer:0,source:'HSK 1 vocabulary_notes: 星期日/星期天, dengan contoh sumber.'},
 {id:'size',kind:'antonym',title:'大 · 小',level:1,words:[['大','besar'],['小','kecil']],context:'大 dan 小 berlawanan untuk ukuran dalam konteks yang sama. Keduanya juga memiliki penggunaan lain; jangan selalu menggantinya secara mekanis.',examples:[['这个房间很大。','Ruangan ini besar.'],['那个房间很小。','Ruangan itu kecil.']],question:'Antonim 大 untuk ukuran ruangan adalah ...',options:['小','热'],answer:0,source:'HSK 1 vocabulary 大/小; contoh pedagogis original.'},
 {id:'temperature',kind:'antonym',title:'冷 · 热',level:1,words:[['冷','dingin'],['热','panas']],context:'冷 dan 热 berlawanan saat membicarakan suhu atau cuaca. Pada penggunaan kiasan, arti harus mengikuti konteks.',examples:[['今天很冷。','Hari ini dingin.'],['昨天很热。','Kemarin panas.']],question:'Isi bagian kosong untuk menyatakan cuaca panas: 今天很___。',options:['冷','热'],answer:1,source:'HSK 1 vocabulary 冷/热; contoh pedagogis original.'},
 {id:'work-shift',kind:'confusable',title:'工作 · 上班',level:1,words:[['工作','bekerja; pekerjaan'],['上班','masuk kerja; menjalani jam kerja']],context:'工作 dapat berupa kata kerja maupun nomina. 上班 menyatakan masuk kerja atau berada pada waktu kerja, dan tidak menggantikan 工作 sebagai nomina pekerjaan.',examples:[['我喜欢这份工作。','Saya menyukai pekerjaan ini.'],['我八点上班。','Saya masuk kerja pukul delapan.']],question:'Pilih kata yang sesuai: 我八点___。',options:['上班','一个工作'],answer:0,source:'HSK 1 vocabulary_notes 工作/上班; perbedaan kelas kata dan contoh pedagogis original.'},
 {id:'again',kind:'confusable',title:'再 · 又',level:3,words:[['再','lagi; pengulangan yang direncanakan'],['又','lagi; pengulangan yang sudah terjadi dalam contoh ini']],context:'Dalam pola dasar berikut, 再 mengarah ke pengulangan yang belum dilakukan, sedangkan 又 menyatakan sesuatu terjadi lagi. Keduanya mempunyai penggunaan tambahan; perhatikan keseluruhan kalimat.',examples:[['请再说一遍。','Tolong katakan sekali lagi.'],['他今天又迟到了。','Hari ini dia terlambat lagi.']],question:'Isi permintaan mengulang yang belum dilakukan: 请___说一遍。',options:['再','又'],answer:0,source:'Kosakata HSK 1 再 dan HSK 3 又; contoh pedagogis original, bukan pasangan otomatis.'}
];
