// Reading Plan day-by-day content.
//
// FAITH_30_DAYS is hand-written devotional content (theme, scripture, devotional
// paragraph, prayer, and reflection questions per day).
//
// BIBLE_OVERVIEW_90_DAYS and BIBLE_YEAR_365_DAYS are generated at import time from
// the canonical 66-book chapter list already defined in ./bible (BIBLE_BOOKS), by
// distributing every chapter of Scripture evenly across the plan length. This keeps
// the reading pace realistic (~13 chapters/day for the 90-day overview, ~3 for the
// year-long plan) and means the day list never has to be maintained by hand.
//
// Every day exposes: day, week, title, scripture, bookId + chapter (for deep-linking
// into the Bible reader via BibleReader), and readingTime. The 30-day plan additionally
// exposes description, devotional, prayer, and reflectionQuestions for the expandable
// day card.

import { BIBLE_BOOKS } from './bible';

export const FAITH_30_DAYS = [
  {
    day: 1, week: 1,
    title: "In the Beginning",
    scripture: "Genesis 1:1-3",
    bookId: "gn", chapter: 1,
    description: "God speaks, and light breaks over the darkness.",
    devotional: "Every good work — including the work God wants to do in your life this month — starts with Him simply speaking. You don't need to have your whole story figured out today; you just need to show up and let God speak into the parts that still feel formless.",
    prayer: "Father, thank You for calling light into dark places. Speak into the areas of my life that still feel unformed, and give me the courage to begin this journey with You.",
    reflectionQuestions: ["What 'formless' area of your life do you want God to speak into this month?", "What would it look like to trust God with a fresh start today?"],
    readingTime: "8 min",
  },
  {
    day: 2, week: 1,
    title: "Made in His Image",
    scripture: "Genesis 2:7",
    bookId: "gn", chapter: 2,
    description: "God forms humanity with His own hands and breathes life into us.",
    devotional: "You are not an accident or an afterthought — you were formed with intention and filled with the very breath of God. Faith begins with knowing whose you are before you worry about what you'll do.",
    prayer: "Lord, remind me today that my worth comes from You, not from my performance. Help me walk as someone who carries Your breath and Your image.",
    reflectionQuestions: ["How does knowing you're made in God's image change how you see yourself?", "Where do you need to release the pressure to earn your worth?"],
    readingTime: "8 min",
  },
  {
    day: 3, week: 1,
    title: "Faith Over Fear",
    scripture: "Joshua 1:9",
    bookId: "js", chapter: 1,
    description: "God commands Joshua to be strong and courageous, for He goes with him.",
    devotional: "Fear rarely leaves quietly — it has to be replaced by a bigger truth. Joshua's courage wasn't self-generated; it was rooted in God's promised presence. Whatever you're facing today, you don't face it alone.",
    prayer: "God, when fear rises, remind me that You go before me and stand beside me. Give me courage rooted in Your presence, not my own strength.",
    reflectionQuestions: ["What fear is God inviting you to release to Him today?", "How have you seen God's presence carry you through hard seasons before?"],
    readingTime: "8 min",
  },
  {
    day: 4, week: 1,
    title: "The Lord Is My Shepherd",
    scripture: "Psalm 23:1-3",
    bookId: "ps", chapter: 23,
    description: "David paints a picture of God as a shepherd who provides rest and restoration.",
    devotional: "A shepherd doesn't just feed the sheep — he leads them somewhere quiet enough to actually rest. If life feels noisy right now, this is an invitation to let God lead you to stillness before He leads you anywhere else.",
    prayer: "Shepherd of my soul, lead me beside quiet waters today. Restore what has grown weary in me.",
    reflectionQuestions: ["Where in your life do you need God's rest right now?", "What would it mean to let God 'lead' rather than trying to lead yourself?"],
    readingTime: "8 min",
  },
  {
    day: 5, week: 1,
    title: "Trust With All Your Heart",
    scripture: "Proverbs 3:5-6",
    bookId: "prv", chapter: 3,
    description: "Trusting God fully means releasing our own limited understanding.",
    devotional: "Leaning on your own understanding feels safe because it's familiar — but it's also limited. Trusting God with 'all' your heart means bringing Him the parts you'd rather manage yourself.",
    prayer: "Father, I release the plans I've been gripping tightly. Straighten my path as I trust You over my own understanding.",
    reflectionQuestions: ["What decision are you currently trying to figure out on your own?", "What would 'leaning not on your own understanding' look like this week?"],
    readingTime: "8 min",
  },
  {
    day: 6, week: 1,
    title: "Perfect Love Casts Out Fear",
    scripture: "1 John 4:18",
    bookId: "1jo", chapter: 4,
    description: "God's love is not a love that condemns — it's a love that secures us.",
    devotional: "A lot of our fear is actually a fear of not being enough. But perfect love doesn't ask you to perform — it simply holds you. The more you receive that love, the less power fear has over you.",
    prayer: "Lord, let Your perfect love settle the anxious places in my heart. Teach me to receive love instead of earning it.",
    reflectionQuestions: ["Where does fear show up as a fear of 'not being enough'?", "How have you experienced God's love as something that secures rather than condemns?"],
    readingTime: "8 min",
  },
  {
    day: 7, week: 1,
    title: "A Day of Rest",
    scripture: "Exodus 20:8-10",
    bookId: "ex", chapter: 20,
    description: "God builds rest into the rhythm of life as a holy gift, not an afterthought.",
    devotional: "Rest isn't a reward for finishing everything — it's a command that trusts God to hold what you can't. Closing week one with rest is a reminder that this journey isn't about hustle; it's about relationship.",
    prayer: "God, teach me to rest without guilt. Help me trust that You are still working even when I stop.",
    reflectionQuestions: ["What keeps you from truly resting?", "How can you make space for Sabbath rest this week?"],
    readingTime: "8 min",
  },
  {
    day: 8, week: 2,
    title: "New Every Morning",
    scripture: "Lamentations 3:22-23",
    bookId: "lm", chapter: 3,
    description: "Even in grief, Jeremiah finds mercy that is renewed with every sunrise.",
    devotional: "Yesterday's failures don't get to define today. God's mercy doesn't run low overnight — it's fresh again the moment you wake up, no matter how the day before ended.",
    prayer: "Lord, thank You that Your mercies are new this morning. Help me start today free from yesterday's weight.",
    reflectionQuestions: ["What from yesterday do you need to let go of today?", "How does 'new mercy every morning' change how you see failure?"],
    readingTime: "8 min",
  },
  {
    day: 9, week: 2,
    title: "Prayer Without Ceasing",
    scripture: "Philippians 4:6-7",
    bookId: "php", chapter: 4,
    description: "Paul invites us to trade anxiety for prayer, and receive peace that guards our hearts.",
    devotional: "Anxiety asks you to carry it alone; prayer invites you to hand it over. The peace Paul describes doesn't always make sense given the circumstances — that's exactly the point.",
    prayer: "Father, I bring my anxious thoughts to You today instead of carrying them alone. Guard my heart and mind with Your peace.",
    reflectionQuestions: ["What is one worry you can turn into a prayer right now?", "What does 'peace that surpasses understanding' feel like for you?"],
    readingTime: "8 min",
  },
  {
    day: 10, week: 2,
    title: "Forgiven and Forgiving",
    scripture: "Ephesians 4:32",
    bookId: "eph", chapter: 4,
    description: "We're called to forgive others the way God has already forgiven us.",
    devotional: "Forgiveness isn't pretending something didn't hurt — it's releasing someone from the debt they owe you, the same way God released you from yours. It's costly, but it's also freeing.",
    prayer: "Lord, help me forgive as I have been forgiven. Soften my heart toward anyone I've been holding a grudge against.",
    reflectionQuestions: ["Is there someone you're being invited to forgive today?", "How has receiving God's forgiveness changed the way you see your own mistakes?"],
    readingTime: "8 min",
  },
  {
    day: 11, week: 2,
    title: "Plans to Prosper You",
    scripture: "Jeremiah 29:11",
    bookId: "jr", chapter: 29,
    description: "Even in exile, God tells His people He has good plans for their future.",
    devotional: "This promise was written to people in a hard season, not an easy one. Whatever season you're in, God's plans for hope and a future haven't changed direction.",
    prayer: "God, when the future feels uncertain, remind me that You already hold it. Help me trust Your plans over my own timeline.",
    reflectionQuestions: ["Where do you need hope for your future today?", "How does it change things to know God's plans are for your good, even in hard seasons?"],
    readingTime: "8 min",
  },
  {
    day: 12, week: 2,
    title: "Peace I Leave With You",
    scripture: "John 14:27",
    bookId: "jo", chapter: 14,
    description: "Jesus offers a peace that the world cannot manufacture or take away.",
    devotional: "The peace Jesus gives isn't the absence of a storm — it's stability in the middle of one. That's a peace worth asking for today.",
    prayer: "Jesus, give me Your peace — not the world's version, but the kind that holds steady no matter what's happening around me.",
    reflectionQuestions: ["What's currently stealing your peace?", "How is Jesus' peace different from the peace the world offers?"],
    readingTime: "8 min",
  },
  {
    day: 13, week: 2,
    title: "Created for Good Works",
    scripture: "Ephesians 2:10",
    bookId: "eph", chapter: 2,
    description: "You are God's handiwork, prepared in advance for meaningful purpose.",
    devotional: "Purpose isn't something you have to invent from nothing — it's something God already prepared for you before you even asked the question. Today is an invitation to walk into it, one step at a time.",
    prayer: "Father, show me the good works You've prepared for me. Help me walk in purpose rather than wander looking for it.",
    reflectionQuestions: ["What has God clearly gifted or positioned you to do?", "What's one small step you can take today toward that purpose?"],
    readingTime: "8 min",
  },
  {
    day: 14, week: 2,
    title: "Grace Is Sufficient",
    scripture: "2 Corinthians 12:9",
    bookId: "2co", chapter: 12,
    description: "Paul learns that God's power is made perfect in his weakness, not despite it.",
    devotional: "We tend to hide our weaknesses; God tends to work through them. Grace doesn't wait for you to get strong enough — it meets you exactly where you're weak.",
    prayer: "Lord, Your grace is enough for me. Let Your strength be made perfect in the places I feel weakest.",
    reflectionQuestions: ["What weakness have you been trying to hide instead of surrender?", "How might God want to work through that weakness rather than around it?"],
    readingTime: "8 min",
  },
  {
    day: 15, week: 3,
    title: "Worship in Spirit and Truth",
    scripture: "John 4:23-24",
    bookId: "jo", chapter: 4,
    description: "Jesus describes true worship as something that comes from the heart, not a location.",
    devotional: "Worship was never meant to be confined to a building or a song — it's a posture of the heart, offered honestly. Halfway through this journey, take a moment to simply be honest with God about where you are.",
    prayer: "God, receive my worship today — not a performance, but an honest offering of who I really am.",
    reflectionQuestions: ["What does worshiping God 'in truth' look like for you personally?", "Is there anything keeping your worship more performance than heart?"],
    readingTime: "8 min",
  },
  {
    day: 16, week: 3,
    title: "Love Is Patient",
    scripture: "1 Corinthians 13:4-7",
    bookId: "1co", chapter: 13,
    description: "Paul's famous description of love as patient, kind, and enduring.",
    devotional: "This chapter isn't just for weddings — it's a mirror. Read it slowly and let it show you where your love for others (and yourself) still has room to grow.",
    prayer: "Lord, teach me to love the way You describe here — patient, kind, and slow to keep a record of wrongs.",
    reflectionQuestions: ["Which quality of love in this passage do you find hardest to live out?", "Who in your life needs this kind of patient love from you right now?"],
    readingTime: "8 min",
  },
  {
    day: 17, week: 3,
    title: "Be Still and Know",
    scripture: "Psalm 46:10",
    bookId: "ps", chapter: 46,
    description: "In the middle of upheaval, God simply says: be still, and know that I am God.",
    devotional: "Stillness feels counterproductive when everything is moving fast — but it's often the only way to actually hear God clearly. He doesn't need your striving; He wants your attention.",
    prayer: "Father, help me be still today. Quiet the noise long enough for me to remember who You are.",
    reflectionQuestions: ["What makes stillness hard for you?", "What might God want to show you in the quiet today?"],
    readingTime: "8 min",
  },
  {
    day: 18, week: 3,
    title: "Fix Your Eyes on Jesus",
    scripture: "Hebrews 12:1-2",
    bookId: "hb", chapter: 12,
    description: "We're called to run our race with endurance, fixing our eyes on Jesus.",
    devotional: "Endurance isn't about ignoring the weight — it's about knowing what to lay aside and where to keep looking. Fixing your eyes on Jesus keeps you from getting lost in the distractions along the way.",
    prayer: "Jesus, help me lay aside what's weighing me down and keep my eyes fixed on You through this race.",
    reflectionQuestions: ["What 'weight' do you need to lay aside right now?", "What does it practically look like to 'fix your eyes' on Jesus this week?"],
    readingTime: "8 min",
  },
  {
    day: 19, week: 3,
    title: "The Fruit of the Spirit",
    scripture: "Galatians 5:22-23",
    bookId: "gl", chapter: 5,
    description: "Paul lists the character that grows naturally from a life led by the Spirit.",
    devotional: "Fruit isn't manufactured by effort — it grows from being rooted in something. If you want more love, joy, or patience in your life, the invitation is to stay close to the Spirit, not to try harder alone.",
    prayer: "Holy Spirit, grow Your fruit in me. Root me deeply in You so that love, joy, and peace come naturally.",
    reflectionQuestions: ["Which fruit of the Spirit do you most want to grow in right now?", "What would staying 'rooted' in the Spirit look like for you this week?"],
    readingTime: "8 min",
  },
  {
    day: 20, week: 3,
    title: "Cast Your Cares",
    scripture: "1 Peter 5:6-7",
    bookId: "1pe", chapter: 5,
    description: "Peter invites believers to humble themselves and cast every anxiety on God.",
    devotional: "Casting your cares isn't a one-time act — it's a daily choice to hand things back to God rather than carrying them alone. He cares about the details, not just the big picture.",
    prayer: "Lord, I cast my cares on You today because I know You care for me. Help me not to pick them back up.",
    reflectionQuestions: ["What care do you keep picking back up after giving it to God?", "How does knowing 'He cares for you' change how you pray about it?"],
    readingTime: "8 min",
  },
  {
    day: 21, week: 3,
    title: "A New Heart",
    scripture: "Ezekiel 36:26",
    bookId: "ez", chapter: 36,
    description: "God promises to replace a heart of stone with a heart that can truly feel.",
    devotional: "Three weeks in, it's worth asking: is your heart softening? Growth in faith often looks less like new information and more like a heart that responds differently than it used to.",
    prayer: "God, soften whatever has grown hard in me. Give me a heart that responds to You freely.",
    reflectionQuestions: ["Where have you noticed your heart softening over these past three weeks?", "What area still feels resistant to God's work?"],
    readingTime: "8 min",
  },
  {
    day: 22, week: 4,
    title: "Do Not Be Anxious",
    scripture: "Matthew 6:25-27",
    bookId: "mt", chapter: 6,
    description: "Jesus points to the birds and the flowers as evidence of the Father's care.",
    devotional: "Worry adds nothing to your life but weight. Jesus isn't dismissing real concerns — He's redirecting your attention to a Father who already knows what you need.",
    prayer: "Father, You know what I need before I ask. Help me trade worry for trust today.",
    reflectionQuestions: ["What are you most anxious about this week?", "How does creation's care from God speak to your own situation?"],
    readingTime: "8 min",
  },
  {
    day: 23, week: 4,
    title: "Strength in Weakness",
    scripture: "Philippians 4:12-13",
    bookId: "php", chapter: 4,
    description: "Paul writes that he has learned contentment in every circumstance through Christ.",
    devotional: "Contentment isn't pretending everything is fine — it's a learned trust that Christ's strength meets you in both plenty and want. That kind of peace is built, not born.",
    prayer: "Lord, teach me contentment in every circumstance. Let Your strength carry me through what I can't carry alone.",
    reflectionQuestions: ["In what circumstance is contentment hardest for you right now?", "What would it look like to lean on Christ's strength instead of your own?"],
    readingTime: "8 min",
  },
  {
    day: 24, week: 4,
    title: "Love One Another",
    scripture: "John 13:34-35",
    bookId: "jo", chapter: 13,
    description: "Jesus gives a new command: love one another as He has loved us.",
    devotional: "This is the mark Jesus said would identify His followers — not perfect theology, but visible love. It's a high bar, and also a daily, practical one.",
    prayer: "Jesus, help me love others the way You've loved me — sacrificially, patiently, without condition.",
    reflectionQuestions: ["Who is God asking you to love more intentionally right now?", "What does 'loving as Jesus loved' look like in a specific relationship this week?"],
    readingTime: "8 min",
  },
  {
    day: 25, week: 4,
    title: "Renewed Strength",
    scripture: "Isaiah 40:29-31",
    bookId: "is", chapter: 40,
    description: "Those who hope in the Lord will renew their strength and rise on wings like eagles.",
    devotional: "Weariness isn't a sign of failure — it's a signal to hope in the right place. Renewal doesn't come from pushing harder; it comes from waiting on the Lord.",
    prayer: "Lord, renew my strength as I wait on You. Lift me up when I feel weary from carrying too much.",
    reflectionQuestions: ["Where do you feel most weary right now?", "What does 'waiting on the Lord' look like practically for you this week?"],
    readingTime: "8 min",
  },
  {
    day: 26, week: 4,
    title: "Set Your Mind Above",
    scripture: "Colossians 3:1-2",
    bookId: "cl", chapter: 3,
    description: "Paul urges believers to set their minds on things above, not earthly things.",
    devotional: "What you fix your attention on shapes what you become. Setting your mind on things above isn't escapism — it's a daily recalibration toward what actually lasts.",
    prayer: "God, help me set my mind on what is eternal rather than what is merely urgent today.",
    reflectionQuestions: ["What has been occupying most of your mental energy lately?", "How can you intentionally set your mind on 'things above' this week?"],
    readingTime: "8 min",
  },
  {
    day: 27, week: 4,
    title: "Faithful in Little",
    scripture: "Luke 16:10",
    bookId: "lk", chapter: 16,
    description: "Jesus teaches that faithfulness in small things reveals readiness for greater trust.",
    devotional: "Faithfulness rarely announces itself in big, dramatic moments — it's built in ordinary, unseen faithfulness day after day. God notices what no one else does.",
    prayer: "Lord, help me be faithful in the small, unseen things of today. Build in me a character You can trust with more.",
    reflectionQuestions: ["What 'small thing' is God asking you to be faithful in right now?", "How does faithfulness in little things prepare you for what's ahead?"],
    readingTime: "8 min",
  },
  {
    day: 28, week: 4,
    title: "The Joy of the Lord",
    scripture: "Nehemiah 8:10",
    bookId: "ne", chapter: 8,
    description: "Nehemiah tells a grieving people that the joy of the Lord is their strength.",
    devotional: "Joy in Scripture isn't the absence of hardship — it's a strength that carries you through it. As this journey nears its end, let joy in who God is anchor you, not just your circumstances.",
    prayer: "Father, let Your joy be my strength today, regardless of what I'm facing.",
    reflectionQuestions: ["Where do you need the joy of the Lord to be your strength this week?", "How is 'joy' different from 'happiness' in your own life right now?"],
    readingTime: "8 min",
  },
  {
    day: 29, week: 5,
    title: "Press On Toward the Goal",
    scripture: "Philippians 3:13-14",
    bookId: "php", chapter: 3,
    description: "Paul forgets what is behind and presses on toward the goal set before him.",
    devotional: "Almost at the finish line — this is a good moment to let go of what's behind, whether failure or comfort, and press toward what God has next. Growth requires forward motion, not just good intentions.",
    prayer: "Lord, help me release what's behind me and press forward into what You have next.",
    reflectionQuestions: ["What from your past do you need to let go of to move forward?", "What's one goal God is inviting you to press toward?"],
    readingTime: "8 min",
  },
  {
    day: 30, week: 5,
    title: "Well Done",
    scripture: "Matthew 25:21",
    bookId: "mt", chapter: 25,
    description: "Jesus commends the faithful servant: well done, good and faithful servant.",
    devotional: "Thirty days ago, this journey began with God simply speaking light into the dark. Today, look back at what's changed — not perfection, but faithfulness. That's what God celebrates.",
    prayer: "Father, thank You for walking this month with me. Help the habits of faith I've built here become a lasting rhythm of my life.",
    reflectionQuestions: ["Looking back over these 30 days, where have you seen God move?", "What one habit from this journey do you want to carry forward?"],
    readingTime: "8 min",
  },
];

// ─── Generated plans (90-day overview, 365-day year) ──────────────────────────
// Distributes every chapter in BIBLE_BOOKS evenly across the plan length, grouping
// consecutive chapters within the same book into a single "Book 1-3" style range.

function buildChapterList() {
  const chapters = [];
  BIBLE_BOOKS.forEach(({ id, name, chapters: n }) => {
    for (let c = 1; c <= n; c++) chapters.push({ bookId: id, bookName: name, chapter: c });
  });
  return chapters;
}

function distributeDays(numDays) {
  const chapters = buildChapterList();
  const total = chapters.length;
  const days = [];
  let cur = [];
  let acc = 0;
  let dayNo = 1;
  let threshold = total / numDays;

  for (let i = 0; i < total; i++) {
    cur.push(chapters[i]);
    acc += 1;
    const remainingChapters = total - (i + 1);
    const remainingDays = numDays - dayNo;
    if (remainingDays <= 0) continue;
    if (acc >= threshold && remainingChapters >= remainingDays) {
      days.push(cur);
      cur = [];
      acc = 0;
      dayNo += 1;
      const denom = numDays - dayNo + 1;
      threshold = denom > 0 ? (total - (i + 1)) / denom : total / numDays;
    }
  }
  if (cur.length) {
    if (days.length < numDays) days.push(cur);
    else if (days.length) days[days.length - 1].push(...cur);
    else days.push(cur);
  }
  return days;
}

function summarizePlan(numDays, minutesPerChapter) {
  const dayGroups = distributeDays(numDays);
  return dayGroups.map((chs, idx) => {
    const day = idx + 1;
    const week = Math.floor((day - 1) / 7) + 1;
    const segments = [];
    chs.forEach(({ bookId, bookName, chapter }) => {
      const last = segments[segments.length - 1];
      if (last && last.bookId === bookId && chapter === last.end + 1) {
        last.end = chapter;
      } else {
        segments.push({ bookId, bookName, start: chapter, end: chapter });
      }
    });
    const title = segments
      .map((s) => (s.start === s.end ? `${s.bookName} ${s.start}` : `${s.bookName} ${s.start}-${s.end}`))
      .join(' · ');
    const mins = Math.max(4, Math.round(chs.length * minutesPerChapter));
    return {
      day,
      week,
      title,
      scripture: title,
      bookId: segments[0].bookId,
      chapter: segments[0].start,
      readingTime: `${mins} min`,
    };
  });
}

export const BIBLE_OVERVIEW_90_DAYS = summarizePlan(90, 2.2);
export const BIBLE_YEAR_365_DAYS = summarizePlan(365, 3);

export const READING_PLAN_DAYS = {
  '30_faith': FAITH_30_DAYS,
  '90_bible': BIBLE_OVERVIEW_90_DAYS,
  '365_bible': BIBLE_YEAR_365_DAYS,
};

export const getPlanDays = (planId) => READING_PLAN_DAYS[planId] || [];

export const getPlanWeeks = (planId) => {
  const days = getPlanDays(planId);
  const weeks = new Map();
  days.forEach((d) => {
    if (!weeks.has(d.week)) weeks.set(d.week, []);
    weeks.get(d.week).push(d);
  });
  return Array.from(weeks.entries()).map(([week, weekDays]) => ({ week, days: weekDays }));
};

export const PLAN_META = {
  '30_faith': {
    difficulty: 'Beginner',
    dailyTime: 'Daily · 8 min',
    tagline: "Strengthen your faith through daily scripture, prayer and reflection.",
    icon: 'weather-sunset-up',
    gradientLight: ['#F4E8C4', '#F7F3EA'],
    gradientDark: ['#2A261C', '#1C1C1E'],
  },
  '90_bible': {
    difficulty: 'Intermediate',
    dailyTime: 'Daily · ~25 min',
    tagline: 'Journey from Genesis to Revelation and see the whole story of Scripture in 90 days.',
    icon: 'book-open-page-variant',
    gradientLight: ['#F4E8C4', '#F7F3EA'],
    gradientDark: ['#2A261C', '#1C1C1E'],
  },
  '365_bible': {
    difficulty: 'Committed',
    dailyTime: 'Daily · ~10 min',
    tagline: 'Read through the entire Bible at a steady, sustainable pace over one year.',
    icon: 'calendar-heart',
    gradientLight: ['#F4E8C4', '#F7F3EA'],
    gradientDark: ['#2A261C', '#1C1C1E'],
  },
};
