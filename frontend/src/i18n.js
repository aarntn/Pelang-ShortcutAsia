const en = {
  // Header
  appName: "GigShield MY",
  langToggle: "BM",

  // Hero
  thisWeek: "This week",
  socsoCredited: (rm) => `RM${rm} SOCSO contributed`,
  shiftCount: (n) => `${n} shift${n !== 1 ? "s" : ""}`,

  // Errors
  couldntLoad: "Couldn't load your shifts. Pull to refresh or try again shortly.",
  signInFailed: (msg) => `Sign-in failed: ${msg}. Check the Firebase config in .env.`,

  // Activity card
  activity: "Activity",
  noShiftsYet: "No shifts logged yet.",
  today: "Today",
  yesterday: "Yesterday",
  weekdays: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],

  // Shift logger
  logShift: "Log Shift",
  logAmount: (rm) => `Log RM${rm}`,
  cancel: "Cancel",
  saving: "Saving...",
  amountError: "Enter an amount above RM0.",
  networkError: "Couldn't save that shift. Check your connection.",

  // Projection card
  atCurrentPace: "At your current pace this week",
  projectedMonthly: "Projected monthly",
  estSocso: "Est. SOCSO (PERKESO) contribution",
  estTax: "Est. income tax set-aside (8%)",
  zakatToggle: "Show zakat on income estimate",
  estZakat: "Est. zakat on income (2.5%)",
  projectionNote: (days) =>
    `Projection based on ${days} day${days > 1 ? "s" : ""} of data this week. Tax estimate is approximate — consult LHDN for your actual bracket.`,

  // Compliance card
  protectedStatus: "Protected · PERKESO active",
  noCoverage: "No coverage this week — log a shift",
  workAccidentLabel: (active) =>
    `Work accident & disability — ${active ? "Active" : "No shifts this week"}`,
  workAccidentSub: "1.25% per shift under Act 872 & Act 789 (Self-Employment Social Security)",
  epfLabel: "EPF (KWSP) retirement savings",
  epfSub: "Government matches up to RM600/year via i-Saraan Plus — tap to check",
  unemploymentLabel: "Unemployment insurance — Not applicable",
  unemploymentSub: "EIS covers salaried employees only. Gig workers are exempt under Act 872.",
  epfSheetTitle: "You may be leaving RM600/year on the table",
  epfSheetBody:
    "Under Budget 2026, the government matches your voluntary EPF (KWSP) contributions up to RM600 per year (RM6,000 lifetime) through i-Saraan Plus. As a registered gig worker under Act 872, you qualify — most haven't activated this yet.\n\nNote: EPF contributions are not part of Act 872's first phase. Mandatory EPF savings will be considered in later phases. The i-Saraan Plus voluntary match is the relevant incentive available to you today.\n\nSeparately, Budget 2026 offers a 70% SOCSO subsidy for first-time registrants in non-mandatory sectors (50% in year two). This does not apply to platform riders — your PERKESO is already mandatory and deducted per shift under Act 872.",
  registerKWSP: "Register at KWSP →",
  dismiss: "Dismiss",

  // Edit sheet
  saveChanges: "Save changes",
  deleteShift: "Delete shift",
  shiftDeleted: "Shift deleted",
  undoLabel: "Undo",

  // Filters
  thisMonth: "This month",
  allTime: "All time",
  filterAll: "All",
  noShiftsFiltered: (platform) => `No ${platform} shifts in this period.`,
  clearFilters: "Clear filters",

  // Rights card
  rightsCardSummary: "Know Your Rights · Act 872",
  rights: [
    {
      title: "Written service agreement",
      sub: "Platforms must disclose rates, payment terms, and performance criteria in writing before you start.",
    },
    {
      title: "Timely payment",
      sub: "Earnings cannot be withheld or delayed beyond the agreed payment cycle without cause.",
    },
    {
      title: "Due process before deactivation",
      sub: "Platforms must give advance notice and a right of response before suspending or removing your account.",
    },
    {
      title: "Notice before rate changes",
      sub: "Pay rates and terms cannot be changed unilaterally without written advance notice to you.",
    },
    {
      title: "Gig Workers Tribunal",
      sub: "Disputes can be escalated to the Gig Workers Tribunal under the Industrial Relations Department (JKSM).",
    },
  ],
  rightsFootnote:
    "Rights under Gig Workers Act 2025 (Act 872), in force from 31 March 2026. Coordinated by SEGIM — Malaysian Gig Economy Commission.",

  // Footer
  footer:
    "Data stored privately by device. Clear browser data to reset. Know your shifts. Know your rights.",

  // Tabs & settings
  tabHome: "Home",
  tabProtection: "Protection",
  settingsTitle: "Settings",
  settingsLanguage: "Language",
  settingsDefaultPlatform: "Default platform",
  settingsClearData: "Clear my data",
  settingsClearConfirm: "Tap again to confirm",
  settingsDataNote: "Your data is stored under an anonymous ID on this device. Clearing it starts fresh and cannot be undone.",

  // Period navigation & dates
  weekOf: (range) => `Week of ${range}`,
  todayChip: "Today",
  shiftDateLabel: "Shift date",
  // Weekly goal
  settingsWeeklyGoal: "Weekly goal",
  settingsWeeklyGoalHint: "Used for goal pacing on the dashboard. Leave empty to turn it off.",
  // Insights
  insightsLabel: "Insights",
  insightGoalPace: (togo, perday, days, goal) => `${togo} to go — ${perday}/day across your ${days} remaining day${days === 1 ? "" : "s"} hits ${goal}.`,
  insightGoalHit: (goal) => `Weekly goal hit — ${goal} and counting. Nice.`,
  insightWow: (arrow, pct, prev) => `${arrow} ${pct}% vs last week (${prev}).`,
  insightBestPlatform: (best, ratio, second) => `${best} is paying you ${ratio}× more per shift than ${second} this month.`,
  insightBestDay: (day, avg) => `${day} are your best day — ${avg} average.`,
  insightISaraan: "RM50/month into i-Saraan captures the full RM600 government match.",
  weekdaysLong: ["Mondays", "Tuesdays", "Wednesdays", "Thursdays", "Fridays", "Saturdays", "Sundays"],
};

const bm = {
  // Header
  appName: "GigShield MY",
  langToggle: "EN",

  // Hero
  thisWeek: "Minggu ini",
  socsoCredited: (rm) => `RM${rm} caruman PERKESO`,
  shiftCount: (n) => `${n} syif`,

  // Errors
  couldntLoad: "Syif tidak dapat dimuatkan. Tarik untuk muat semula atau cuba sebentar lagi.",
  signInFailed: (msg) => `Log masuk gagal: ${msg}. Semak konfigurasi Firebase dalam .env.`,

  // Activity card
  activity: "Aktiviti",
  noShiftsYet: "Tiada syif dilog lagi.",
  today: "Hari ini",
  yesterday: "Semalam",
  weekdays: ["Ahad", "Isnin", "Selasa", "Rabu", "Khamis", "Jumaat", "Sabtu"],

  // Shift logger
  logShift: "Log Syif",
  logAmount: (rm) => `Log RM${rm}`,
  cancel: "Batal",
  saving: "Menyimpan...",
  amountError: "Masukkan jumlah melebihi RM0.",
  networkError: "Syif tidak dapat disimpan. Semak sambungan anda.",

  // Projection card
  atCurrentPace: "Pada kadar semasa minggu ini",
  projectedMonthly: "Anggaran bulanan",
  estSocso: "Anggaran caruman PERKESO",
  estTax: "Anggaran simpanan cukai pendapatan (8%)",
  zakatToggle: "Tunjuk anggaran zakat pendapatan",
  estZakat: "Anggaran zakat pendapatan (2.5%)",
  projectionNote: (days) =>
    `Anggaran berdasarkan ${days} hari data minggu ini. Cukai adalah anggaran sahaja — rujuk LHDN untuk kadar sebenar anda.`,

  // Compliance card
  protectedStatus: "Dilindungi · PERKESO aktif",
  noCoverage: "Tiada perlindungan minggu ini — log syif",
  workAccidentLabel: (active) =>
    `Kemalangan kerja & kecacatan — ${active ? "Aktif" : "Tiada syif minggu ini"}`,
  workAccidentSub:
    "1.25% setiap syif di bawah Akta 872 & Akta 789 (Keselamatan Sosial Pekerjaan Sendiri)",
  epfLabel: "Simpanan persaraan KWSP",
  epfSub: "Kerajaan padankan sehingga RM600/tahun melalui i-Saraan Plus — ketuk untuk semak",
  unemploymentLabel: "Insurans pengangguran — Tidak berkenaan",
  unemploymentSub: "EIS meliputi pekerja bergaji sahaja. Pekerja gig dikecualikan di bawah Akta 872.",
  epfSheetTitle: "Anda mungkin kehilangan RM600 setahun",
  epfSheetBody:
    "Di bawah Belanjawan 2026, kerajaan akan memadankan caruman KWSP sukarela anda sehingga RM600 setahun (RM6,000 seumur hidup) melalui i-Saraan Plus. Sebagai pekerja gig berdaftar di bawah Akta 872, anda layak — kebanyakan belum mengaktifkannya lagi.\n\nNota: Caruman KWSP tidak termasuk dalam fasa pertama Akta 872. Simpanan KWSP mandatori akan dipertimbangkan dalam fasa kemudian. Padanan sukarela i-Saraan Plus adalah insentif yang relevan untuk anda hari ini.\n\nBerasingan, Belanjawan 2026 menawarkan subsidi PERKESO 70% untuk pendaftar baharu dalam sektor bukan mandatori (50% pada tahun kedua). Ini tidak terpakai kepada penunggang platform — PERKESO anda sudah mandatori dan ditolak setiap syif di bawah Akta 872.",
  registerKWSP: "Daftar di KWSP →",
  dismiss: "Tutup",

  // Edit sheet
  saveChanges: "Simpan perubahan",
  deleteShift: "Padam syif",
  shiftDeleted: "Syif dipadam",
  undoLabel: "Batal",

  // Filters
  thisMonth: "Bulan ini",
  allTime: "Semua masa",
  filterAll: "Semua",
  noShiftsFiltered: (platform) => `Tiada syif ${platform} dalam tempoh ini.`,
  clearFilters: "Padam penapis",

  // Rights card
  rightsCardSummary: "Hak Anda · Akta 872",
  rights: [
    {
      title: "Perjanjian perkhidmatan bertulis",
      sub: "Platform mesti mendedahkan kadar, terma pembayaran, dan kriteria prestasi secara bertulis sebelum anda memulakan.",
    },
    {
      title: "Pembayaran tepat masa",
      sub: "Pendapatan tidak boleh ditahan atau ditangguh melebihi kitaran pembayaran yang dipersetujui tanpa sebab.",
    },
    {
      title: "Proses adil sebelum penyahaktifan",
      sub: "Platform mesti memberi notis awal dan hak untuk anda menjawab sebelum menggantung atau memadam akaun anda.",
    },
    {
      title: "Notis sebelum perubahan kadar",
      sub: "Kadar bayaran dan terma tidak boleh diubah secara sepihak tanpa notis bertulis terlebih dahulu kepada anda.",
    },
    {
      title: "Tribunal Pekerja Gig",
      sub: "Pertikaian boleh dibawa ke Tribunal Pekerja Gig di bawah Jabatan Hubungan Perusahaan (JKSM).",
    },
  ],
  rightsFootnote:
    "Hak di bawah Akta Pekerja Gig 2025 (Akta 872), berkuat kuasa mulai 31 Mac 2026. Diselaraskan oleh SEGIM — Suruhanjaya Ekonomi Gig Malaysia.",

  // Footer
  footer:
    "Data disimpan secara peribadi mengikut peranti. Padam data pelayar untuk tetapkan semula. Kenali syif anda. Kenali hak anda.",

  // Tabs & settings
  tabHome: "Utama",
  tabProtection: "Perlindungan",
  settingsTitle: "Tetapan",
  settingsLanguage: "Bahasa",
  settingsDefaultPlatform: "Platform lalai",
  settingsClearData: "Padam data saya",
  settingsClearConfirm: "Tekan sekali lagi untuk sahkan",
  settingsDataNote: "Data anda disimpan di bawah ID tanpa nama pada peranti ini. Memadamnya akan bermula semula dan tidak boleh dibatalkan.",

  // Period navigation & dates
  weekOf: (range) => `Minggu ${range}`,
  todayChip: "Hari ini",
  shiftDateLabel: "Tarikh syif",
  // Weekly goal
  settingsWeeklyGoal: "Sasaran mingguan",
  settingsWeeklyGoalHint: "Digunakan untuk kadar sasaran di papan pemuka. Biarkan kosong untuk matikan.",
  // Insights
  insightsLabel: "Cerapan",
  insightGoalPace: (togo, perday, days, goal) => `${togo} lagi — ${perday}/hari untuk ${days} hari berbaki mencapai ${goal}.`,
  insightGoalHit: (goal) => `Sasaran mingguan tercapai — ${goal} dan terus bertambah. Syabas.`,
  insightWow: (arrow, pct, prev) => `${arrow} ${pct}% berbanding minggu lepas (${prev}).`,
  insightBestPlatform: (best, ratio, second) => `${best} membayar anda ${ratio}× lebih setiap syif berbanding ${second} bulan ini.`,
  insightBestDay: (day, avg) => `${day} ialah hari terbaik anda — purata ${avg}.`,
  insightISaraan: "RM50/bulan ke dalam i-Saraan meraih padanan kerajaan penuh RM600.",
  weekdaysLong: ["Isnin", "Selasa", "Rabu", "Khamis", "Jumaat", "Sabtu", "Ahad"],
};

export const translations = { en, bm };
