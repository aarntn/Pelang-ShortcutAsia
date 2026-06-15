const en = {
  // Header
  appName: "Pelang",
  langToggle: "BM",

  // Hero
  thisWeek: "This week",
  socsoCredited: (rm) => `RM${rm} SOCSO contributed`,
  shiftCount: (n) => `${n} shift${n !== 1 ? "s" : ""}`,

  // Errors
  couldntLoad: "Couldn't load your shifts. Pull to refresh or try again shortly.",
  retryLabel: "Retry",
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
  insightWowAbs: (arrow, diff, prev) => `${arrow} ${diff} vs last week (${prev}).`,
  insightBestPlatform: (best, ratio, second) => `${best} is paying you ${ratio}× more per shift than ${second} this month.`,
  insightPlatformSuggestion: (a, aRm, pct, b, bRm) => `${a} (${aRm}/shift avg) is ${pct}% above ${b} (${bRm}/shift) this month. That's just the data.`,
  insightBestDay: (day, avg) => `${day} are your best day — ${avg} average.`,
  insightBestTime: (day, bucket, avg) => `Tomorrow is ${day} — your ${day} ${bucket} shifts average ${avg}. Just the data.`,
  insightISaraan: "RM50/month into i-Saraan captures the full RM600 government match.",
  weekdaysLong: ["Sundays", "Mondays", "Tuesdays", "Wednesdays", "Thursdays", "Fridays", "Saturdays"],
  weekdaysShort: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  timeBuckets: { morning: "morning", afternoon: "afternoon", evening: "evening" },

  // Protection tab
  ledgerTitle: "Your PERKESO contributions",
  ledgerLast: (date) => `Last contribution: ${date}`,
  ledgerEmpty: "No contributions yet — log your first shift and 1.25% goes toward your coverage.",
  benefitsTitle: "What you're covered for",
  benefits: [
    {
      title: "Medical treatment",
      sub: "Care at PERKESO panel clinics and government hospitals after a work injury.",
    },
    {
      title: "Disablement benefit",
      sub: "Income replacement while you can't work, or for a lasting disability.",
    },
    {
      title: "Dependants' benefit",
      sub: "Ongoing payments to your family if a work injury takes your life.",
    },
    {
      title: "Funeral benefit",
      sub: "A contribution toward funeral costs, paid to your next of kin.",
    },
  ],
  benefitsFootnote:
    "Benefits under the Self-Employment Social Security Scheme (Act 789). Exact terms and amounts: perkeso.gov.my.",
  accidentTitle: "If you have an accident",
  accidentSteps: [
    {
      title: "Get medical treatment first",
      sub: "Go to the nearest clinic or government hospital. Paperwork comes after you're safe.",
    },
    {
      title: "Report it in your platform app",
      sub: "File the in-app incident or safety report so the accident is on record.",
    },
    {
      title: "File your PERKESO claim",
      sub: "Working and commuting injuries are claimable under your self-employment coverage.",
    },
    {
      title: "Follow up on perkeso.gov.my",
      sub: "Claim forms, panel clinics, and office locations are listed on the official portal.",
    },
  ],
  accidentLink: "Open perkeso.gov.my →",
  epfCalcLabel: (rm) => `If you set aside RM${rm}/month`,
  epfCalcSlider: "Monthly i-Saraan contribution",
  epfCalcResult: (saved, match, total) =>
    `RM${saved} saved + RM${match} government match = RM${total}/year toward retirement.`,
  epfCalcCapNote: "The i-Saraan Plus match is capped at RM600 per year.",
  eisNote: "EIS unemployment insurance covers salaried employees only — gig workers are exempt under Act 872.",
  linksTitle: "Official resources",

  // Repeat-last-shift chip
  logAgainLabel: "Log again",

  // Expenses & net earnings
  modeShift: "Shift",
  modeExpense: "Expense",
  logExpense: "Log Expense",
  logExpenseAmount: (rm) => `Log RM${rm} expense`,
  expenseCategories: { fuel: "Fuel", data: "Data", maintenance: "Repairs", other: "Other" },
  expensesTitle: "Expenses",
  netLine: (exp, net) => `− RM${exp} expenses · RM${net} net`,
  deleteExpenseLabel: "Delete expense",
  expenseRatioLine: (pct) => `${pct}% of this period's earnings`,
  fuelFlag: (pct, fuelRm, grossRm) =>
    `Fuel ate ${pct}% of your earnings (RM${fuelRm} of RM${grossRm}) — above the 25% line worth watching.`,

  // Weekly digest
  digestTitle: "Last week",
  digestVsPrev: "vs week before",
  digestBestDay: (day, amt) => `Best day: ${day} (${amt})`,
  digestExpenses: (amt, pct) => `Expenses: ${amt} (${pct}% of earnings)`,
  digestSocso: (amt, count) => `PERKESO contributed: ${amt} · ${count} shifts`,
  digestShare: "Share my week",
  digestCopied: "Copied!",
  digestShareText: (total, count, day, dayRm, socso) =>
    `My week on Pelang: ${total} across ${count} shifts. Best day: ${day} (${dayRm}). PERKESO contributed: ${socso}.`,

  // Activity see-all + anomaly nudges + reminders
  seeAll: (n) => `See all (${n} more)`,
  seeLess: "Show less",
  insightGap: (days) => `Nothing logged in ${days} days — forget some shifts? Import a statement from the + menu.`,
  insightDip: (p, cur, usual) => `This week's ${p} average (${cur}) is below your usual ${usual}.`,
  reminderSection: "Reminders",
  reminderToggle: "Evening check-in if nothing logged (7pm)",
  reminderTitle: "Worked today?",
  reminderBody: "Log it in 2 taps before you forget.",

  // Income records
  recordsTitle: "Income records",
  recordsHint:
    "Your full earnings history as proof of income — for LHDN filing, i-Saraan applications, or loan documentation.",
  recordsExport: "Download my records (CSV)",
  consistencyNote: (pct) => `Monthly income varies by ±${pct}%`,
  consistencyLabel: "Monthly income, last 3 months",

  // Statement import
  importLink: "Import an earnings statement (CSV) →",
  importTitle: "Import statement",
  importHint:
    "Upload a CSV export of your weekly earnings statement. It needs a date column and an amount column — platform is optional and falls back to your default.",
  importPickFile: "Choose CSV file",
  importPickAnother: "Choose a different file",
  importParseError: "Couldn't read any rows. Check the file has date and amount columns.",
  importPreview: (n, total) => `${n} shift${n !== 1 ? "s" : ""} · RM${total}`,
  importSkipped: (n) => `${n} row${n !== 1 ? "s" : ""} skipped (bad date or amount).`,
  importMore: (n) => `+ ${n} more…`,
  importConfirm: (n) => `Import ${n} shift${n !== 1 ? "s" : ""}`,
  importConfirmEmpty: "Import",
  importedToast: (n) => `${n} shift${n !== 1 ? "s" : ""} imported`,
};

const bm = {
  // Header
  appName: "Pelang",
  langToggle: "EN",

  // Hero
  thisWeek: "Minggu ini",
  socsoCredited: (rm) => `RM${rm} caruman PERKESO`,
  shiftCount: (n) => `${n} syif`,

  // Errors
  couldntLoad: "Syif tidak dapat dimuatkan. Tarik untuk muat semula atau cuba sebentar lagi.",
  retryLabel: "Cuba semula",
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
  insightWowAbs: (arrow, diff, prev) => `${arrow} ${diff} berbanding minggu lepas (${prev}).`,
  insightBestPlatform: (best, ratio, second) => `${best} membayar anda ${ratio}× lebih setiap syif berbanding ${second} bulan ini.`,
  insightPlatformSuggestion: (a, aRm, pct, b, bRm) => `${a} (purata ${aRm}/syif) ${pct}% lebih tinggi daripada ${b} (${bRm}/syif) bulan ini. Ini sekadar data.`,
  insightBestDay: (day, avg) => `${day} ialah hari terbaik anda — purata ${avg}.`,
  insightBestTime: (day, bucket, avg) => `Esok ${day} — syif ${bucket} anda pada hari ${day} berpurata ${avg}. Ini sekadar data.`,
  insightISaraan: "RM50/bulan ke dalam i-Saraan meraih padanan kerajaan penuh RM600.",
  weekdaysLong: ["Ahad", "Isnin", "Selasa", "Rabu", "Khamis", "Jumaat", "Sabtu"],
  weekdaysShort: ["Ahd", "Isn", "Sel", "Rab", "Kha", "Jum", "Sab"],
  timeBuckets: { morning: "pagi", afternoon: "petang", evening: "malam" },

  // Protection tab
  ledgerTitle: "Caruman PERKESO anda",
  ledgerLast: (date) => `Caruman terakhir: ${date}`,
  ledgerEmpty: "Tiada caruman lagi — log syif pertama anda dan 1.25% terus ke perlindungan anda.",
  benefitsTitle: "Perlindungan anda merangkumi",
  benefits: [
    {
      title: "Rawatan perubatan",
      sub: "Rawatan di klinik panel PERKESO dan hospital kerajaan selepas kecederaan kerja.",
    },
    {
      title: "Faedah hilang upaya",
      sub: "Gantian pendapatan semasa anda tidak boleh bekerja, atau untuk hilang upaya kekal.",
    },
    {
      title: "Faedah orang tanggungan",
      sub: "Bayaran berterusan kepada keluarga anda jika kecederaan kerja meragut nyawa anda.",
    },
    {
      title: "Faedah pengurusan mayat",
      sub: "Sumbangan kos pengebumian, dibayar kepada waris terdekat anda.",
    },
  ],
  benefitsFootnote:
    "Faedah di bawah Skim Keselamatan Sosial Pekerjaan Sendiri (Akta 789). Terma dan jumlah sebenar: perkeso.gov.my.",
  accidentTitle: "Jika anda kemalangan",
  accidentSteps: [
    {
      title: "Dapatkan rawatan dahulu",
      sub: "Pergi ke klinik atau hospital kerajaan terdekat. Urusan dokumen selepas anda selamat.",
    },
    {
      title: "Lapor dalam aplikasi platform",
      sub: "Failkan laporan insiden dalam aplikasi supaya kemalangan itu direkodkan.",
    },
    {
      title: "Failkan tuntutan PERKESO",
      sub: "Kecederaan semasa bekerja dan dalam perjalanan boleh dituntut di bawah perlindungan anda.",
    },
    {
      title: "Susuli di perkeso.gov.my",
      sub: "Borang tuntutan, klinik panel, dan lokasi pejabat tersenarai di portal rasmi.",
    },
  ],
  accidentLink: "Buka perkeso.gov.my →",
  epfCalcLabel: (rm) => `Jika anda ketepikan RM${rm}/bulan`,
  epfCalcSlider: "Caruman i-Saraan bulanan",
  epfCalcResult: (saved, match, total) =>
    `RM${saved} simpanan + RM${match} padanan kerajaan = RM${total}/tahun untuk persaraan.`,
  epfCalcCapNote: "Padanan i-Saraan Plus terhad kepada RM600 setahun.",
  eisNote: "Insurans pengangguran EIS untuk pekerja bergaji sahaja — pekerja gig dikecualikan di bawah Akta 872.",
  linksTitle: "Sumber rasmi",

  // Repeat-last-shift chip
  logAgainLabel: "Log semula",

  // Expenses & net earnings
  modeShift: "Syif",
  modeExpense: "Perbelanjaan",
  logExpense: "Log Perbelanjaan",
  logExpenseAmount: (rm) => `Log perbelanjaan RM${rm}`,
  expenseCategories: { fuel: "Minyak", data: "Data", maintenance: "Baiki", other: "Lain" },
  expensesTitle: "Perbelanjaan",
  netLine: (exp, net) => `− RM${exp} perbelanjaan · RM${net} bersih`,
  deleteExpenseLabel: "Padam perbelanjaan",
  expenseRatioLine: (pct) => `${pct}% daripada pendapatan tempoh ini`,
  fuelFlag: (pct, fuelRm, grossRm) =>
    `Minyak menelan ${pct}% pendapatan anda (RM${fuelRm} daripada RM${grossRm}) — melebihi paras 25% yang patut diperhatikan.`,

  // Weekly digest
  digestTitle: "Minggu lepas",
  digestVsPrev: "berbanding minggu sebelumnya",
  digestBestDay: (day, amt) => `Hari terbaik: ${day} (${amt})`,
  digestExpenses: (amt, pct) => `Perbelanjaan: ${amt} (${pct}% daripada pendapatan)`,
  digestSocso: (amt, count) => `Caruman PERKESO: ${amt} · ${count} syif`,
  digestShare: "Kongsi minggu saya",
  digestCopied: "Disalin!",
  digestShareText: (total, count, day, dayRm, socso) =>
    `Minggu saya di Pelang: ${total} daripada ${count} syif. Hari terbaik: ${day} (${dayRm}). Caruman PERKESO: ${socso}.`,

  // Activity see-all + anomaly nudges + reminders
  seeAll: (n) => `Lihat semua (${n} lagi)`,
  seeLess: "Tunjuk kurang",
  insightGap: (days) => `Tiada log selama ${days} hari — terlupa syif? Import penyata dari menu +.`,
  insightDip: (p, cur, usual) => `Purata ${p} minggu ini (${cur}) lebih rendah daripada kebiasaan anda ${usual}.`,
  reminderSection: "Peringatan",
  reminderToggle: "Semakan petang jika tiada log (7 malam)",
  reminderTitle: "Bekerja hari ini?",
  reminderBody: "Log dalam 2 ketukan sebelum terlupa.",

  // Income records
  recordsTitle: "Rekod pendapatan",
  recordsHint:
    "Sejarah pendapatan penuh anda sebagai bukti pendapatan — untuk pemfailan LHDN, permohonan i-Saraan, atau dokumentasi pinjaman.",
  recordsExport: "Muat turun rekod saya (CSV)",
  consistencyNote: (pct) => `Pendapatan bulanan anda berubah ±${pct}%`,
  consistencyLabel: "Pendapatan bulanan, 3 bulan lepas",

  // Statement import
  importLink: "Import penyata pendapatan (CSV) →",
  importTitle: "Import penyata",
  importHint:
    "Muat naik eksport CSV penyata pendapatan mingguan anda. Perlu lajur tarikh dan jumlah — platform adalah pilihan dan menggunakan platform lalai anda.",
  importPickFile: "Pilih fail CSV",
  importPickAnother: "Pilih fail lain",
  importParseError: "Tiada baris dapat dibaca. Pastikan fail ada lajur tarikh dan jumlah.",
  importPreview: (n, total) => `${n} syif · RM${total}`,
  importSkipped: (n) => `${n} baris dilangkau (tarikh atau jumlah tidak sah).`,
  importMore: (n) => `+ ${n} lagi…`,
  importConfirm: (n) => `Import ${n} syif`,
  importConfirmEmpty: "Import",
  importedToast: (n) => `${n} syif diimport`,
};

export const translations = { en, bm };
