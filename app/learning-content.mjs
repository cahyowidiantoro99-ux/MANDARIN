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
 {prompt:'Apa yang dilakukan sebelum menandatangani catatan?',options:['Membeli peralatan','Memastikan informasi benar','Mengganti jadwal libur'],answer:1,explanation:'确认信息无误 berarti memastikan informasi tidak keliru.'}]},
  {
    id: "office-greeting",
    title: "Hari pertama di kantor",
    zh: "第一天上班",
    level: 1,
    theme: "Komunikasi kerja",
    icon: "工",
    note: "Cerita latihan Mandarin untuk tempat kerja. Level HSK menunjukkan rekomendasi belajar.",
    sentences: [
      ["今天是我第一天上班。","Hari ini hari pertama saya bekerja."],
      ["我叫安迪，在办公室工作。","Nama saya Andi. Saya bekerja di kantor."],
      ["小林说：“你好！这是你的桌子。”","Xiaolin berkata, “Halo! Ini meja kamu.”"],
      ["安迪说：“谢谢！”","Andi berkata, “Terima kasih!”"],
      ["他坐下来，开始工作。","Ia duduk dan mulai bekerja."]
    ],
    questions: [{"prompt":"Di mana Andi bekerja?","options":["Di gudang","Di kantor","Di rumah"],"answer":1,"explanation":"在办公室工作 berarti bekerja di kantor."}]
  },
  {
    id: "lunch-break",
    title: "Janji makan siang",
    zh: "一起吃午饭",
    level: 1,
    theme: "Komunikasi kerja",
    icon: "工",
    note: "Cerita latihan Mandarin untuk tempat kerja. Level HSK menunjukkan rekomendasi belajar.",
    sentences: [
      ["现在十二点了。","Sekarang sudah pukul dua belas."],
      ["丽娜问：“你要一起吃饭吗？”","Lina bertanya, “Mau makan bersama?”"],
      ["安迪说：“好，我们现在去。”","Andi berkata, “Baik, ayo pergi sekarang.”"],
      ["他们走到楼下。","Mereka berjalan ke lantai bawah."],
      ["今天他们吃米饭。","Hari ini mereka makan nasi."]
    ],
    questions: [{"prompt":"Pukul berapa mereka pergi makan?","options":["Pukul sembilan","Pukul dua belas","Pukul tiga"],"answer":1,"explanation":"十二点 berarti pukul dua belas."}]
  },
  {
    id: "meeting-room",
    title: "Mencari ruang rapat",
    zh: "找会议室",
    level: 2,
    theme: "Komunikasi kerja",
    icon: "工",
    note: "Cerita latihan Mandarin untuk tempat kerja. Level HSK menunjukkan rekomendasi belajar.",
    sentences: [
      ["下午两点有一个会。","Pukul dua siang ada rapat."],
      ["小林不知道会议室在哪儿，就问同事。","Xiaolin tidak tahu letak ruang rapat, jadi ia bertanya kepada rekannya."],
      ["同事说：“在二楼，电梯旁边。”","Rekannya menjawab, “Di lantai dua, di samping lift.”"],
      ["小林谢过同事，就上了二楼。","Xiaolin berterima kasih lalu naik ke lantai dua."],
      ["他在开会前找到了会议室。","Ia menemukan ruang rapat sebelum rapat dimulai."]
    ],
    questions: [{"prompt":"Di mana ruang rapat?","options":["Di lantai tiga","Di dekat pintu depan","Di lantai dua"],"answer":2,"explanation":"二楼 berarti lantai dua."}]
  },
  {
    id: "borrow-pen",
    title: "Meminjam pena",
    zh: "借一支笔",
    level: 2,
    theme: "Komunikasi kerja",
    icon: "工",
    note: "Cerita latihan Mandarin untuk tempat kerja. Level HSK menunjukkan rekomendasi belajar.",
    sentences: [
      ["开会前，安迪找不到自己的笔。","Sebelum rapat, Andi tidak menemukan penanya."],
      ["他问丽娜：“你有笔吗？可以借我一支吗？”","Ia bertanya kepada Lina, “Punya pena? Boleh pinjam satu?”"],
      ["丽娜给了他一支蓝色的笔。","Lina memberinya pena biru."],
      ["安迪用这支笔写下了会议时间。","Andi memakai pena itu untuk mencatat waktu rapat."],
      ["会后，他把笔还给了丽娜。","Setelah rapat, ia mengembalikan pena kepada Lina."]
    ],
    questions: [{"prompt":"Apa warna pena yang dipinjam?","options":["Hitam","Merah","Biru"],"answer":2,"explanation":"蓝色 berarti biru."}]
  },
  {
    id: "visitor-call",
    title: "Menelepon resepsionis",
    zh: "给前台打电话",
    level: 2,
    theme: "Komunikasi kerja",
    icon: "工",
    note: "Cerita latihan Mandarin untuk tempat kerja. Level HSK menunjukkan rekomendasi belajar.",
    sentences: [
      ["有一位客人在楼下等丽娜。","Ada seorang tamu yang menunggu Lina di lantai bawah."],
      ["前台给丽娜打电话。","Resepsionis menelepon Lina."],
      ["丽娜说：“请他等五分钟，我马上下来。”","Lina berkata, “Tolong minta dia menunggu lima menit, saya segera turun.”"],
      ["前台请客人先坐下。","Resepsionis mempersilakan tamu duduk."],
      ["几分钟后，丽娜到了前台。","Beberapa menit kemudian, Lina tiba di meja resepsionis."]
    ],
    questions: [{"prompt":"Berapa lama tamu diminta menunggu?","options":["Sepuluh menit","Lima belas menit","Lima menit"],"answer":2,"explanation":"五分钟 berarti lima menit."}]
  },
  {
    id: "document-check",
    title: "Memeriksa berkas sebelum dikirim",
    zh: "发送前检查文件",
    level: 3,
    theme: "Komunikasi kerja",
    icon: "工",
    note: "Cerita latihan Mandarin untuk tempat kerja. Level HSK menunjukkan rekomendasi belajar.",
    sentences: [
      ["安迪准备把文件发给客户。","Andi bersiap mengirim berkas kepada klien."],
      ["他发现最后一页的日期写错了。","Ia mendapati tanggal di halaman terakhir salah."],
      ["他改好日期，请同事再看一遍，然后才发送。","Ia memperbaiki tanggal dan meminta rekannya memeriksa lagi sebelum mengirimnya."],
      ["客户收到文件后回了邮件。","Setelah menerima berkas, klien membalas email."],
      ["安迪把回信和文件放在同一个文件夹里。","Andi menyimpan balasan dan berkas di folder yang sama."]
    ],
    questions: [{"prompt":"Apa yang salah pada berkas?","options":["Tanggal","Nama pelanggan","Nomor telepon"],"answer":0,"explanation":"日期写错了 berarti tanggalnya salah ditulis."}]
  },
  {
    id: "shift-exchange",
    title: "Bertukar jadwal kerja",
    zh: "商量换班",
    level: 3,
    theme: "Komunikasi kerja",
    icon: "工",
    note: "Cerita latihan Mandarin untuk tempat kerja. Level HSK menunjukkan rekomendasi belajar.",
    sentences: [
      ["丽娜星期五下午有事，想和同事换班。","Lina punya urusan Jumat siang dan ingin bertukar shift dengan rekannya."],
      ["小林星期五有空，不过星期六不能来。","Xiaolin luang pada Jumat, tetapi tidak bisa datang pada Sabtu."],
      ["两人说好以后，一起去找班长确认。","Setelah sepakat, keduanya menemui foreman untuk meminta konfirmasi."],
      ["班长看了两人的工作安排，同意了这次换班。","Foreman melihat jadwal keduanya dan menyetujui pertukaran shift."],
      ["丽娜把新的时间记在手机上。","Lina mencatat jadwal baru di ponselnya."]
    ],
    questions: [{"prompt":"Siapa yang dimintai konfirmasi?","options":["Foreman","Pelanggan","Resepsionis"],"answer":0,"explanation":"找班长确认 berarti meminta konfirmasi kepada foreman."}]
  },
  {
    id: "delivery-delay",
    title: "Memberi kabar tentang keterlambatan",
    zh: "通知送货延迟",
    level: 4,
    theme: "Komunikasi kerja",
    icon: "工",
    note: "Cerita latihan Mandarin untuk tempat kerja. Level HSK menunjukkan rekomendasi belajar.",
    sentences: [
      ["由于下雨，送货车没能按时到达。","Karena hujan, truk pengiriman tidak tiba tepat waktu."],
      ["丽娜先联系司机，了解车辆的位置。","Lina menghubungi sopir terlebih dahulu untuk mengetahui posisi kendaraan."],
      ["确认预计到达时间后，她立刻通知了收货部门。","Setelah memastikan perkiraan waktu tiba, ia langsung memberi tahu bagian penerimaan."],
      ["收货部门根据新的时间调整了人员安排。","Bagian penerimaan menyesuaikan penugasan berdasarkan waktu yang baru."],
      ["车辆到达后，丽娜更新了送货记录。","Setelah kendaraan tiba, Lina memperbarui catatan pengiriman."]
    ],
    questions: [{"prompt":"Siapa yang dihubungi Lina terlebih dahulu?","options":["Bagian penerimaan","Sopir","Pelanggan"],"answer":1,"explanation":"先联系司机 berarti menghubungi sopir terlebih dahulu."}]
  },
  {
    id: "train-new-colleague",
    title: "Mendampingi rekan baru",
    zh: "带新同事熟悉工作",
    level: 4,
    theme: "Komunikasi kerja",
    icon: "工",
    note: "Cerita latihan Mandarin untuk tempat kerja. Level HSK menunjukkan rekomendasi belajar.",
    sentences: [
      ["小林负责带新同事熟悉部门的日常工作。","Xiaolin bertugas membantu rekan baru mengenal pekerjaan harian departemen."],
      ["他先介绍了工作流程，再请对方试着填写一份记录。","Ia menjelaskan alur kerja terlebih dahulu, lalu meminta rekan itu mencoba mengisi satu catatan."],
      ["看到对方有些紧张，他鼓励对方随时提问。","Melihat rekannya agak gugup, ia mendorongnya bertanya kapan saja."],
      ["新同事遇到不懂的地方，就主动向小林请教。","Saat menemui hal yang belum dipahami, rekan baru bertanya kepada Xiaolin."],
      ["下班前，两人一起检查了当天的记录。","Sebelum pulang, keduanya memeriksa catatan hari itu bersama."]
    ],
    questions: [{"prompt":"Apa yang dicoba rekan baru?","options":["Menyusun jadwal shift","Mengisi catatan","Menjawab telepon"],"answer":1,"explanation":"填写一份记录 berarti mengisi satu catatan."}]
  },
  {
    id: "inventory-difference",
    title: "Menelusuri selisih persediaan",
    zh: "核对库存差异",
    level: 5,
    theme: "Komunikasi kerja",
    icon: "工",
    note: "Cerita latihan Mandarin untuk tempat kerja. Level HSK menunjukkan rekomendasi belajar.",
    sentences: [
      ["月底盘点时，丽娜发现系统数量与实物不一致。","Saat inventarisasi akhir bulan, Lina melihat jumlah di sistem berbeda dari stok fisik."],
      ["她没有直接修改数字，而是请仓库同事一起核对出入库记录。","Ia meminta rekan gudang memeriksa riwayat barang masuk dan keluar sebelum mengubah angka."],
      ["原来有一笔退货还没有录入系统，双方确认后补上了记录。","Ternyata ada satu transaksi retur yang belum dimasukkan. Setelah kedua pihak memastikan, catatannya dilengkapi."],
      ["丽娜把差异原因写进盘点报告。","Lina mencantumkan penyebab selisih dalam laporan inventarisasi."],
      ["仓库随后明确了退货记录的负责人员。","Gudang kemudian menetapkan siapa yang bertanggung jawab atas pencatatan retur."]
    ],
    questions: [{"prompt":"Apa penyebab selisih stok?","options":["Barang rusak","Kode produk ganda","Retur belum dicatat"],"answer":2,"explanation":"退货还没有录入系统 berarti retur belum dimasukkan ke sistem."}]
  },
  {
    id: "quality-sample",
    title: "Menindaklanjuti sampel mutu",
    zh: "跟进样品检验",
    level: 5,
    theme: "Komunikasi kerja",
    icon: "工",
    note: "Cerita latihan Mandarin untuk tempat kerja. Level HSK menunjukkan rekomendasi belajar.",
    sentences: [
      ["抽检时，小林发现两件样品的尺寸超出了允许范围。","Saat pemeriksaan sampel, Xiaolin menemukan dua sampel dengan ukuran di luar toleransi."],
      ["他把测量结果连同批次号发给质量部门，请他们复核。","Ia mengirim hasil pengukuran beserta nomor batch kepada bagian mutu untuk diperiksa kembali."],
      ["复核结果出来后，双方约定在下午的会议上讨论下一步。","Sesudah hasil pemeriksaan ulang keluar, kedua pihak sepakat membahas langkah berikutnya dalam rapat siang."],
      ["质量部门把复核意见写进检验记录。","Bagian mutu memasukkan hasil pemeriksaan ulang ke catatan inspeksi."],
      ["小林整理了相关资料，供会上讨论。","Xiaolin menyiapkan dokumen terkait untuk dibahas dalam rapat."]
    ],
    questions: [{"prompt":"Data apa yang disertakan bersama hasil pengukuran?","options":["Nama pembeli","Harga satuan","Nomor batch"],"answer":2,"explanation":"连同批次号 berarti beserta nomor batch."}]
  },
  {
    id: "weekly-report",
    title: "Merangkum laporan mingguan",
    zh: "整理周报",
    level: 5,
    theme: "Komunikasi kerja",
    icon: "工",
    note: "Cerita latihan Mandarin untuk tempat kerja. Level HSK menunjukkan rekomendasi belajar.",
    sentences: [
      ["为了让经理快速了解进度，安迪把周报分成成果、问题和计划三个部分。","Agar manajer cepat memahami kemajuan, Andi membagi laporan menjadi hasil, masalah, dan rencana."],
      ["对于尚未完成的任务，他注明了原因和预计完成日期。","Untuk tugas yang masih terbuka, ia mencantumkan alasan dan perkiraan tanggal selesai."],
      ["同事看完后建议他把最重要的问题放在开头。","Setelah membaca, rekannya menyarankan agar masalah terpenting ditempatkan di awal."],
      ["安迪按建议调整了顺序，并删掉了重复的信息。","Andi mengikuti saran itu dan menghapus informasi berulang."],
      ["经理看完周报后，请他在下次会议上说明其中一个问题。","Setelah membaca laporan, manajer memintanya menjelaskan salah satu masalah pada rapat berikutnya."]
    ],
    questions: [{"prompt":"Apa yang disarankan untuk diletakkan di awal?","options":["Daftar absensi","Anggaran tahunan","Masalah terpenting"],"answer":2,"explanation":"最重要的问题 berarti masalah terpenting."}]
  },
  {
    id: "process-pilot",
    title: "Menguji usulan perbaikan proses",
    zh: "试行流程改进",
    level: 6,
    theme: "Komunikasi kerja",
    icon: "工",
    note: "Cerita latihan Mandarin untuk tempat kerja. Level HSK menunjukkan rekomendasi belajar.",
    sentences: [
      ["会上，丽娜指出，重复录入不仅耗费时间，还容易造成数据不一致。","Dalam rapat, Lina menunjukkan bahwa input berulang membuang waktu dan mudah menimbulkan ketidaksesuaian data."],
      ["考虑到各部门的需求不同，她建议先在一个班组试行新流程。","Mengingat kebutuhan tiap departemen berbeda, ia mengusulkan uji coba alur baru di satu tim shift."],
      ["试行期间，团队同时记录处理时间和返工次数，作为后续评估的依据。","Selama uji coba, tim mencatat waktu pemrosesan dan jumlah pengerjaan ulang sebagai dasar evaluasi."],
      ["试行结束后，团队将新旧流程的记录逐项比较。","Setelah uji coba berakhir, tim membandingkan catatan alur lama dan baru satu per satu."],
      ["他们还请使用者提出意见，以免忽略数据以外的问题。","Mereka juga meminta masukan pengguna agar persoalan yang tidak tercermin dalam data tetap diperhatikan."]
    ],
    questions: [{"prompt":"Di mana alur baru diuji terlebih dahulu?","options":["Di satu tim shift","Di semua departemen","Di kantor pelanggan"],"answer":0,"explanation":"在一个班组试行 berarti diuji coba di satu tim shift."}]
  },
  {
    id: "supplier-decision",
    title: "Membandingkan penawaran pemasok",
    zh: "比较供应商方案",
    level: 6,
    theme: "Komunikasi kerja",
    icon: "工",
    note: "Cerita latihan Mandarin untuk tempat kerja. Level HSK menunjukkan rekomendasi belajar.",
    sentences: [
      ["采购小组收到三份报价，其中最低报价的交货时间却最长。","Tim pengadaan menerima tiga penawaran. Penawaran termurah memiliki waktu pengiriman terlama."],
      ["鉴于生产计划已经确定，小组把交货可靠性和售后支持也纳入评估。","Karena rencana produksi sudah ditetapkan, tim turut menilai keandalan pengiriman dan dukungan purnajual."],
      ["他们把各方案的利弊列成表格，提交给负责人作决定。","Mereka menabelkan kelebihan dan kekurangan tiap opsi dan menyerahkannya kepada penanggung jawab untuk diputuskan."],
      ["负责人要求小组补充两家供应商以往的履约记录。","Penanggung jawab meminta tim melengkapi riwayat pemenuhan kontrak dari dua pemasok."],
      ["资料补齐后，小组才对各方案作出最终推荐。","Setelah datanya lengkap, tim menyampaikan rekomendasi akhir."]
    ],
    questions: [{"prompt":"Selain harga, apa yang dinilai tim?","options":["Keandalan pengiriman dan dukungan purnajual","Lokasi kantor dan warna kemasan","Jumlah pegawai dan luas gudang"],"answer":0,"explanation":"交货可靠性和售后支持 berarti keandalan pengiriman dan dukungan purnajual."}]
  },
  {
    id: "incident-review",
    title: "Membahas penyebab keterlambatan",
    zh: "复盘任务延期",
    level: 6,
    theme: "Komunikasi kerja",
    icon: "工",
    note: "Cerita latihan Mandarin untuk tempat kerja. Level HSK menunjukkan rekomendasi belajar.",
    sentences: [
      ["项目延期后，负责人召集相关人员复盘，要求大家区分直接原因和长期积累的问题。","Setelah proyek tertunda, penanggung jawab mengajak pihak terkait meninjau kejadian dan membedakan penyebab langsung dari masalah yang lama menumpuk."],
      ["讨论发现，除了临时缺料，信息更新滞后也让两个部门依据不同版本安排工作。","Pembahasan menemukan bahwa selain kekurangan bahan sementara, pembaruan informasi yang terlambat membuat dua departemen bekerja dengan versi berbeda."],
      ["双方决定统一记录入口，并约定每周核对未解决事项。","Kedua pihak sepakat memakai satu tempat pencatatan dan meninjau masalah yang masih terbuka setiap minggu."],
      ["负责人为每项改进指定了跟进人员和期限。","Penanggung jawab menetapkan petugas tindak lanjut dan tenggat untuk setiap perbaikan."],
      ["下一次例会将检查这些措施是否减少了信息误差。","Rapat rutin berikutnya akan menilai apakah langkah ini mengurangi kesalahan informasi."]
    ],
    questions: [{"prompt":"Apa yang disepakati kedua pihak?","options":["Satu tempat pencatatan dan tinjauan mingguan","Dua jadwal terpisah","Menghapus laporan lama"],"answer":0,"explanation":"统一记录入口 berarti memakai satu tempat pencatatan."}]
  }
];
export const contrasts=[
 {id:'sunday',kind:'synonym',title:'星期日 · 星期天',level:1,words:[['星期日','hari Minggu'],['星期天','hari Minggu']],context:'Keduanya menyebut hari Minggu. 星期日 cenderung digunakan pada tulisan atau jadwal resmi; 星期天 lebih lazim dalam percakapan. Ini kecenderungan ragam, bukan aturan mutlak.',examples:[['星期日休息。','Libur pada hari Minggu.'],['星期天见。','Sampai jumpa hari Minggu.']],question:'Mana yang cenderung lebih formal untuk jadwal tertulis?',options:['星期日','星期天'],answer:0,source:'HSK 1 vocabulary_notes: 星期日/星期天, dengan contoh sumber.'},
 {id:'size',kind:'antonym',title:'大 · 小',level:1,words:[['大','besar'],['小','kecil']],context:'大 dan 小 berlawanan untuk ukuran dalam konteks yang sama. Keduanya juga memiliki penggunaan lain; jangan selalu menggantinya secara mekanis.',examples:[['这个房间很大。','Ruangan ini besar.'],['那个房间很小。','Ruangan itu kecil.']],question:'Antonim 大 untuk ukuran ruangan adalah ...',options:['小','热'],answer:0,source:'HSK 1 vocabulary 大/小; contoh pedagogis original.'},
 {id:'temperature',kind:'antonym',title:'冷 · 热',level:1,words:[['冷','dingin'],['热','panas']],context:'冷 dan 热 berlawanan saat membicarakan suhu atau cuaca. Pada penggunaan kiasan, arti harus mengikuti konteks.',examples:[['今天很冷。','Hari ini dingin.'],['昨天很热。','Kemarin panas.']],question:'Isi bagian kosong untuk menyatakan cuaca panas: 今天很___。',options:['冷','热'],answer:1,source:'HSK 1 vocabulary 冷/热; contoh pedagogis original.'},
 {id:'work-shift',kind:'confusable',title:'工作 · 上班',level:1,words:[['工作','bekerja; pekerjaan'],['上班','masuk kerja; menjalani jam kerja']],context:'工作 dapat berupa kata kerja maupun nomina. 上班 menyatakan masuk kerja atau berada pada waktu kerja, dan tidak menggantikan 工作 sebagai nomina pekerjaan.',examples:[['我喜欢这份工作。','Saya menyukai pekerjaan ini.'],['我八点上班。','Saya masuk kerja pukul delapan.']],question:'Pilih kata yang sesuai: 我八点___。',options:['上班','一个工作'],answer:0,source:'HSK 1 vocabulary_notes 工作/上班; perbedaan kelas kata dan contoh pedagogis original.'},
 {id:'again',kind:'confusable',title:'再 · 又',level:3,words:[['再','lagi; pengulangan yang direncanakan'],['又','lagi; pengulangan yang sudah terjadi dalam contoh ini']],context:'Dalam pola dasar berikut, 再 mengarah ke pengulangan yang belum dilakukan, sedangkan 又 menyatakan sesuatu terjadi lagi. Keduanya mempunyai penggunaan tambahan; perhatikan keseluruhan kalimat.',examples:[['请再说一遍。','Tolong katakan sekali lagi.'],['他今天又迟到了。','Hari ini dia terlambat lagi.']],question:'Isi permintaan mengulang yang belum dilakukan: 请___说一遍。',options:['再','又'],answer:0,source:'Kosakata HSK 1 再 dan HSK 3 又; contoh pedagogis original, bukan pasangan otomatis.'}
];
