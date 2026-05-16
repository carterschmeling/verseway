export interface LessonRef {
  book: string;
  chapter: number;
}

export interface Lesson {
  id: string;
  /** Short theme hook */
  title: string;
  /** Book/chapter + what to notice in this unit */
  subtitle: string;
  ref: LessonRef;
}

/**
 * Full-Bible journey: Genesis → Revelation, roughly chronological.
 * Each step is one chapter (deep memory unit): read, then quiz on details.
 */
export const LEARNING_PATH: Lesson[] = [
  // —— Primeval history (Genesis 1–11) ——
  {
    id: "gen-1",
    title: "God speaks creation into being",
    subtitle: "Genesis 1 · order, goodness, humanity as image-bearers",
    ref: { book: "GEN", chapter: 1 },
  },
  {
    id: "gen-2",
    title: "Sabbath rhythm and human partnership",
    subtitle: "Genesis 2 · garden vocation, “bone of my bones”",
    ref: { book: "GEN", chapter: 2 },
  },
  {
    id: "gen-3",
    title: "The serpent, the fall, and the first gospel promise",
    subtitle: "Genesis 3 · shame, coverings, and the seed who will crush evil",
    ref: { book: "GEN", chapter: 3 },
  },
  {
    id: "gen-4",
    title: "Cain, Abel, and sin “crouching at the door”",
    subtitle: "Genesis 4 · worship, jealousy, and God’s patient warning",
    ref: { book: "GEN", chapter: 4 },
  },
  {
    id: "gen-6",
    title: "Violence, grief, and Noah finds favor",
    subtitle: "Genesis 6 · why the flood; one righteous family in a broken world",
    ref: { book: "GEN", chapter: 6 },
  },
  {
    id: "gen-9",
    title: "Rainbow covenant with the earth",
    subtitle: "Genesis 9 · never again by water; human dignity and restraint",
    ref: { book: "GEN", chapter: 9 },
  },
  {
    id: "gen-11",
    title: "Babel and the scattering of languages",
    subtitle: "Genesis 11 · pride, empire-building, and God’s decisive mercy",
    ref: { book: "GEN", chapter: 11 },
  },
  // —— Patriarchs ——
  {
    id: "gen-12",
    title: "Leave Ur: blessing for every family on earth",
    subtitle: "Genesis 12 · Abram’s call, risk, and God’s sweeping promise",
    ref: { book: "GEN", chapter: 12 },
  },
  {
    id: "gen-15",
    title: "Cutting the covenant — stars like dust",
    subtitle: "Genesis 15 · deep sleep, fire-pot, and “count the stars”",
    ref: { book: "GEN", chapter: 15 },
  },
  {
    id: "gen-22",
    title: "The binding: “God himself will provide the lamb”",
    subtitle: "Genesis 22 · tested faith, substitution, and Yahweh-yireh",
    ref: { book: "GEN", chapter: 22 },
  },
  {
    id: "gen-28",
    title: "Jacob’s ladder — “Surely the Lord is in this place”",
    subtitle: "Genesis 28 · stone pillow, angels, and covenant renewed",
    ref: { book: "GEN", chapter: 28 },
  },
  {
    id: "gen-45",
    title: "Joseph reveals: “You meant evil; God meant good”",
    subtitle: "Genesis 45 · forgiveness, famine rescue, and family restored",
    ref: { book: "GEN", chapter: 45 },
  },
  {
    id: "gen-50",
    title: "Death of Joseph — bones carried up with Israel",
    subtitle: "Genesis 50 · burial in Canaan hoped for; God will surely visit you",
    ref: { book: "GEN", chapter: 50 },
  },
  // —— Exodus ——
  {
    id: "exo-1",
    title: "Groaning under Pharaoh — midwives who fear God",
    subtitle: "Exodus 1 · oppression, courage, and God hearing Israel’s cry",
    ref: { book: "EXO", chapter: 1 },
  },
  {
    id: "exo-3",
    title: "The burning bush: “I AM WHO I AM”",
    subtitle: "Exodus 3 · holy ground, name, and mission to Pharaoh",
    ref: { book: "EXO", chapter: 3 },
  },
  {
    id: "exo-12",
    title: "Passover night — blood of the lamb on the door",
    subtitle: "Exodus 12 · last plague, unleavened bread, and “remember this day”",
    ref: { book: "EXO", chapter: 12 },
  },
  {
    id: "exo-14",
    title: "Red Sea: “Stand firm and see the salvation of the Lord”",
    subtitle: "Exodus 14 · terror turned to praise; Egypt drowned, Israel walks dry",
    ref: { book: "EXO", chapter: 14 },
  },
  {
    id: "exo-20",
    title: "Ten words from the mountain",
    subtitle: "Exodus 20 · covenant law as gift; God’s voice and Israel’s fear",
    ref: { book: "EXO", chapter: 20 },
  },
  // —— Holiness & wilderness ——
  {
    id: "lev-19",
    title: "“Be holy, for I am holy” — love your neighbor as yourself",
    subtitle: "Leviticus 19 · ethics woven into worship and community life",
    ref: { book: "LEV", chapter: 19 },
  },
  {
    id: "num-14",
    title: "After the spies: faithlessness and forty years",
    subtitle: "Numbers 14 · grasshoppers vs giants; Joshua and Caleb’s minority report",
    ref: { book: "NUM", chapter: 14 },
  },
  {
    id: "deu-6",
    title: "The Shema — heart, soul, and strength",
    subtitle: "Deuteronomy 6 · one Lord, teach your children, remember Egypt",
    ref: { book: "DEU", chapter: 6 },
  },
  // —— Conquest & judges ——
  {
    id: "jos-1",
    title: "“Be strong and courageous” — meditate on this book",
    subtitle: "Joshua 1 · Moses is gone; promises rest on courage and Torah",
    ref: { book: "JOS", chapter: 1 },
  },
  {
    id: "jos-24",
    title: "“Choose this day whom you will serve”",
    subtitle: "Joshua 24 · stone of witness; idols put away; covenant renewed",
    ref: { book: "JOS", chapter: 24 },
  },
  {
    id: "jdg-7",
    title: "Gideon’s jars — strength made perfect in weakness",
    subtitle: "Judges 7 · lapped water, torches, and “not by might”",
    ref: { book: "JDG", chapter: 7 },
  },
  {
    id: "rut-1",
    title: "Ruth clings: “Your people will be my people”",
    subtitle: "Ruth 1 · famine, Naomi’s bitterness, loyal love in the fields",
    ref: { book: "RUT", chapter: 1 },
  },
  // —— Monarchy & prophets ——
  {
    id: "1sa-17",
    title: "David and Goliath — “The battle is the Lord’s”",
    subtitle: "1 Samuel 17 · shepherd’s faith vs armor; stone and sling",
    ref: { book: "1SA", chapter: 17 },
  },
  {
    id: "2sa-7",
    title: "Davidic covenant — a house and a throne forever",
    subtitle: "2 Samuel 7 · Nathan’s oracle; rest, son, and kingdom promise",
    ref: { book: "2SA", chapter: 7 },
  },
  {
    id: "1ki-8",
    title: "Solomon’s temple prayer — “heaven cannot contain you”",
    subtitle: "1 Kings 8 · dedication, foreigners praying, and mercy pleaded",
    ref: { book: "1KI", chapter: 8 },
  },
  {
    id: "1ki-19",
    title: "Still small voice — God feeds a burned-out prophet",
    subtitle: "1 Kings 19 · Horeb, gentle whisper, and the next generation called",
    ref: { book: "1KI", chapter: 19 },
  },
  {
    id: "2ki-25",
    title: "Jerusalem falls — exile and the line of David interrupted",
    subtitle: "2 Kings 25 · siege, temple burned, Jehoiachin lifted in Babylon",
    ref: { book: "2KI", chapter: 25 },
  },
  // —— Return & wisdom ——
  {
    id: "ezr-1",
    title: "Cyrus’s decree — vessels and exiles return",
    subtitle: "Ezra 1 · stirred spirit, rebuilding, and God moving kings",
    ref: { book: "EZR", chapter: 1 },
  },
  {
    id: "neh-8",
    title: "Law read aloud — weeping, then festival joy",
    subtitle: "Nehemiah 8 · understanding, holy day, and strength in the Word",
    ref: { book: "NEH", chapter: 8 },
  },
  {
    id: "est-4",
    title: "Esther: “If I perish, I perish”",
    subtitle: "Esther 4 · Mordecai’s challenge; courage for such a time",
    ref: { book: "EST", chapter: 4 },
  },
  {
    id: "job-38",
    title: "God answers from the whirlwind",
    subtitle: "Job 38 · creation’s mysteries; human limits and divine wisdom",
    ref: { book: "JOB", chapter: 38 },
  },
  {
    id: "psa-1",
    title: "Two ways — delight in the Lord’s instruction",
    subtitle: "Psalm 1 · tree by streams vs chaff; blessing on the meditative life",
    ref: { book: "PSA", chapter: 1 },
  },
  {
    id: "psa-23",
    title: "The Lord is my shepherd",
    subtitle: "Psalm 23 · valley, table, goodness; fear removed by presence",
    ref: { book: "PSA", chapter: 23 },
  },
  {
    id: "psa-51",
    title: "“Create in me a clean heart, O God”",
    subtitle: "Psalm 51 · confession after Bathsheba; broken spirit God won’t despise",
    ref: { book: "PSA", chapter: 51 },
  },
  {
    id: "psa-119",
    title: "Long love letter to Scripture (acrostic)",
    subtitle: "Psalm 119 · affliction, delight, precepts, and steadfast love",
    ref: { book: "PSA", chapter: 119 },
  },
  {
    id: "pro-3",
    title: "Trust the Lord with all your heart",
    subtitle: "Proverbs 3 · lean not on understanding; wisdom as tree of life",
    ref: { book: "PRO", chapter: 3 },
  },
  {
    id: "ecc-3",
    title: "A time for every purpose under heaven",
    subtitle: "Ecclesiastes 3 · seasons, breath, and God’s enduring work",
    ref: { book: "ECC", chapter: 3 },
  },
  {
    id: "sng-2",
    title: "Love strong as death — spring and the beloved",
    subtitle: "Song of Songs 2 · covenant poetry; desire ordered toward joy",
    ref: { book: "SNG", chapter: 2 },
  },
  // —— Major & minor prophets ——
  {
    id: "isa-6",
    title: "“Here am I — send me” — coal on the lips",
    subtitle: "Isaiah 6 · throne vision, holiness, and hard hearts healed",
    ref: { book: "ISA", chapter: 6 },
  },
  {
    id: "isa-53",
    title: "The suffering servant — by his wounds we are healed",
    subtitle: "Isaiah 53 · despised, stricken, silent lamb, and vindication",
    ref: { book: "ISA", chapter: 53 },
  },
  {
    id: "jer-31",
    title: "New covenant — law written on the heart",
    subtitle: "Jeremiah 31 · Rachel’s weeping, return, and God’s everlasting love",
    ref: { book: "JER", chapter: 31 },
  },
  {
    id: "lam-3",
    title: "Great is your faithfulness — hope in the pit",
    subtitle: "Lamentations 3 · man of affliction, yet mercies new every morning",
    ref: { book: "LAM", chapter: 3 },
  },
  {
    id: "ezk-37",
    title: "Valley of dry bones — breath and a reunited people",
    subtitle: "Ezekiel 37 · Spirit, sinews, king David, covenant of peace",
    ref: { book: "EZK", chapter: 37 },
  },
  {
    id: "dan-3",
    title: "Fiery furnace — “a fourth like a son of the gods”",
    subtitle: "Daniel 3 · idolatry resisted; Nebuchadnezzar astonished",
    ref: { book: "DAN", chapter: 3 },
  },
  {
    id: "dan-7",
    title: "Ancient of Days — Son of Man receives dominion",
    subtitle: "Daniel 7 · beasts, judgment, and an everlasting kingdom",
    ref: { book: "DAN", chapter: 7 },
  },
  {
    id: "jon-2",
    title: "Prayer from the deep — “Salvation belongs to the Lord”",
    subtitle: "Jonah 2 · seaweed, temple vow, and mercy after rebellion",
    ref: { book: "JON", chapter: 2 },
  },
  {
    id: "mic-6",
    title: "“What does the Lord require of you?”",
    subtitle: "Micah 6 · courts of the Lord; justice, kindness, humble walk",
    ref: { book: "MIC", chapter: 6 },
  },
  {
    id: "zec-9",
    title: "Rejoice — your king comes humble, riding a donkey",
    subtitle: "Zechariah 9 · judgment on nations; peace to the ends of earth",
    ref: { book: "ZEC", chapter: 9 },
  },
  {
    id: "mal-3",
    title: "Refiner’s fire and the messenger of the covenant",
    subtitle: "Malachi 3 · tithe test, scroll of remembrance, day of the Lord",
    ref: { book: "MAL", chapter: 3 },
  },
  // —— Gospels ——
  {
    id: "mat-5",
    title: "Blessed are the poor in spirit — kingdom ethics",
    subtitle: "Matthew 5 · Beatitudes, salt, light, and heart-level righteousness",
    ref: { book: "MAT", chapter: 5 },
  },
  {
    id: "mat-6",
    title: "Prayer and trust — Father sees in secret",
    subtitle: "Matthew 6 · Lord’s Prayer, fasting, treasure, anxiety",
    ref: { book: "MAT", chapter: 6 },
  },
  {
    id: "mat-28",
    title: "Resurrection commission — “All authority… I am with you”",
    subtitle: "Matthew 28 · empty tomb, doubt and worship, make disciples",
    ref: { book: "MAT", chapter: 28 },
  },
  {
    id: "mrk-1",
    title: "The kingdom bursts in — “Repent and believe”",
    subtitle: "Mark 1 · baptism, wilderness, calling fishers of people",
    ref: { book: "MRK", chapter: 1 },
  },
  {
    id: "luk-2",
    title: "Glory to God in the highest — peace on earth",
    subtitle: "Luke 2 · census, manger, shepherds, Simeon’s song",
    ref: { book: "LUK", chapter: 2 },
  },
  {
    id: "luk-15",
    title: "Lost sheep, coin, and son — joy in heaven",
    subtitle: "Luke 15 · Pharisees, party, and the Father who runs",
    ref: { book: "LUK", chapter: 15 },
  },
  {
    id: "joh-1",
    title: "In the beginning was the Word — grace upon grace",
    subtitle: "John 1 · creation echoes, Lamb of God, Nathanael’s fig tree",
    ref: { book: "JOH", chapter: 1 },
  },
  {
    id: "joh-3",
    title: "You must be born from above — God so loved the world",
    subtitle: "John 3 · Nicodemus, wind, Spirit, and lifted-up Son",
    ref: { book: "JOH", chapter: 3 },
  },
  {
    id: "joh-14",
    title: "“I am the way, the truth, and the life”",
    subtitle: "John 14 · many rooms, Paraclete promised, peace not as world gives",
    ref: { book: "JOH", chapter: 14 },
  },
  // —— Acts & Epistles ——
  {
    id: "act-2",
    title: "Pentecost — poured-out Spirit, all nations hear",
    subtitle: "Acts 2 · wind, fire, Peter’s sermon, church born",
    ref: { book: "ACT", chapter: 2 },
  },
  {
    id: "act-9",
    title: "Damascus road — scales fall from Saul’s eyes",
    subtitle: "Acts 9 · persecutor becomes preacher; Ananias’s risky obedience",
    ref: { book: "ACT", chapter: 9 },
  },
  {
    id: "act-17",
    title: "Unknown God — the risen man appointed judge",
    subtitle: "Acts 17 · Areopagus, creation, repentance, resurrection hope",
    ref: { book: "ACT", chapter: 17 },
  },
  {
    id: "rom-5",
    title: "Peace with God — Adam vs Christ",
    subtitle: "Romans 5 · justified by faith, suffering produces hope, grace abounds",
    ref: { book: "ROM", chapter: 5 },
  },
  {
    id: "rom-8",
    title: "No condemnation — Spirit, adoption, creation groaning",
    subtitle: "Romans 8 · heirs with Christ, nothing shall separate",
    ref: { book: "ROM", chapter: 8 },
  },
  {
    id: "rom-12",
    title: "Living sacrifices — transformed minds",
    subtitle: "Romans 12 · one body many gifts; overcome evil with good",
    ref: { book: "ROM", chapter: 12 },
  },
  {
    id: "1co-13",
    title: "The way of love — love never ends",
    subtitle: "1 Corinthians 13 · tongues without love; prophecy partial, love eternal",
    ref: { book: "1CO", chapter: 13 },
  },
  {
    id: "2co-5",
    title: "New creation — ministry of reconciliation",
    subtitle: "2 Corinthians 5 · ambassadors; Christ’s love compels us",
    ref: { book: "2CO", chapter: 5 },
  },
  {
    id: "gal-3",
    title: "Abraham’s children — faith, not ethnicity alone",
    subtitle: "Galatians 3 · curse reversed, law as tutor, one in Christ Jesus",
    ref: { book: "GAL", chapter: 3 },
  },
  {
    id: "eph-2",
    title: "Saved by grace — one new humanity in Christ",
    subtitle: "Ephesians 2 · dead to alive, hostility broken, temple growing",
    ref: { book: "EPH", chapter: 2 },
  },
  {
    id: "php-4",
    title: "Rejoice in the Lord always — peace that guards hearts",
    subtitle: "Philippians 4 · thanksgiving, contentment, partnership in gospel",
    ref: { book: "PHP", chapter: 4 },
  },
  {
    id: "col-1",
    title: "Christ firstborn over all creation — supremacy",
    subtitle: "Colossians 1 · hymn, reconciliation, Christ in you hope of glory",
    ref: { book: "COL", chapter: 1 },
  },
  {
    id: "1th-5",
    title: "Day of the Lord — sober, hopeful, encircled by peace",
    subtitle: "1 Thessalonians 5 · sons of light, encourage, God faithful",
    ref: { book: "1TH", chapter: 5 },
  },
  {
    id: "1ti-1",
    title: "Mercy to the worst — “Christ came to save sinners”",
    subtitle: "1 Timothy 1 · law’s use, trustworthy saying, shipwrecked faith",
    ref: { book: "1TI", chapter: 1 },
  },
  {
    id: "heb-11",
    title: "Faith’s hall — seeking a better country",
    subtitle: "Hebrews 11 · Abel to Rahab; conviction of things not seen",
    ref: { book: "HEB", chapter: 11 },
  },
  {
    id: "heb-12",
    title: "Cloud of witnesses — kingdom that cannot be shaken",
    subtitle: "Hebrews 12 · discipline as love; Sinai vs Zion; consuming fire",
    ref: { book: "HEB", chapter: 12 },
  },
  {
    id: "jas-1",
    title: "Trials produce steadfastness — pure religion",
    subtitle: "James 1 · ask wisdom, quick hear slow speak, doers not hearers only",
    ref: { book: "JAS", chapter: 1 },
  },
  {
    id: "1pe-2",
    title: "Living stones — chosen people, royal priesthood",
    subtitle: "1 Peter 2 · rejected cornerstone; honor everyone, fear God",
    ref: { book: "1PE", chapter: 2 },
  },
  {
    id: "1jn-4",
    title: "God is love — perfect love casts out fear",
    subtitle: "1 John 4 · incarnation tested; we love because he loved first",
    ref: { book: "1JN", chapter: 4 },
  },
  // —— Apocalypse ——
  {
    id: "rev-5",
    title: "The Lamb who was slain — worthy to open the scroll",
    subtitle: "Revelation 5 · throne, elders, new song, kingdom and priests",
    ref: { book: "REV", chapter: 5 },
  },
  {
    id: "rev-21",
    title: "New heaven and new earth — tabernacle with humanity",
    subtitle: "Revelation 21 · tears wiped, river of life, no temple but God-all",
    ref: { book: "REV", chapter: 21 },
  },
];
