// ---- Edit these for your event ----

export const COMPANY_NAME = "DynamicNext";
export const COMPANY_SHORT = "DN";
export const EVENT_NAME = "Level 14: Onam Edition";

// Site stops accepting new scores after this local datetime.
export const EVENT_END = "2026-08-17T23:59:00";

// Known attendees, shown as a dropdown on the login screen instead of a
// free-text field (avoids typos/casing creating duplicate players). Anyone
// not on this list can still pick "Other" and type their name.
export const PLAYERS = [
  "Abraham Joseph",
  "Ajeesh Kumar R",
  "Alex Vincent",
  "Althaf Raja",
  "Amay Krishna",
  "Anna Antony",
  "Arjun M",
  "Arun V K",
  "Avanthika Cinesh",
  "Basil Paul",
  "Bhushan Baburao Patil",
  "Bibin Jose Paul",
  "Bristo Johnson",
  "Debashish D",
  "Deon Johny",
  "Dinesh K",
  "Divyang Krupeshchandra Pandya",
  "Ebi Thankachan",
  "Fahim Abdulla M V",
  "Farooq A",
  "Ganga B Ajith",
  "Geethu N G",
  "Geo Babu",
  "Ian Johny",
  "Jifin Francis",
  "Jim Jose",
  "Joel Jais",
  "Joice George",
  "Joyce Mathews",
  "Kevin Binu",
  "Kevin Thomas",
  "Kishan Dev",
  "Lingeeswaran A J",
  "Liyose Eldhose",
  "Manukrishnan R",
  "Martin O J",
  "Minnu Baby",
  "Mohammed Muhsin V V",
  "Nikhil Jain",
  "Nikhil Jaiswal",
  "Nithin M.S",
  "Prasanth P M",
  "Prashant Sisodia",
  "Prateek Mishra",
  "Priyanka Das Mahapatra",
  "Rahul Das P M",
  "Ratnesh Tripathi",
  "Rinesh S",
  "Rushikesh Mote",
  "Sangalp Jose",
  "Sethu Raj",
  "Shaine Thomas",
  "Shyam Hrishikesan",
  "Sneha P N Nambiar",
  "Soham Nettime",
  "Sreeraj R",
  "Subin V P",
  "Tutesy A S",
  "Vaishakh Marar",
  "Varsha Prasanthan",
  "Varun Sumesh P V",
  "Vinayak Chillal",
  "Vinayak Razdan",
  "Vinod Sreedharan Pillai",
  "Vishnu Jayaraj",
  "Vishnuprasad T M",
];

export const GAMES = [
  {
    id: "boat",
    name: "Vallam Kali Dash",
    tagline: "Paddle the snake boat, dodge the obstacles.",
    accent: "#F59E51",
  },
  {
    id: "pookalam",
    name: "Pookalam Rush",
    tagline: "Recreate the flower rangoli before time runs out.",
    accent: "#F8D299",
  },
  {
    id: "anniversary",
    name: "14 Candles",
    tagline: "Collect one candle per year. Fourteen years running.",
    accent: "#C77DFF",
  },
  {
    id: "sadya",
    name: "Sadya Sort",
    tagline: "Flip tiles, find every dish pair before time's up.",
    accent: "#804A8A",
  },
  {
    id: "lootswipe",
    name: "Loot Swipe",
    tagline: "Swipe right for power-ups, left for glitches. Fourteen years of leveling up.",
    accent: "#FF6F91",
  },
  {
    id: "pookalamecho",
    name: "Pookalam Echo",
    tagline: "Watch the rings light up, then repeat the sequence back.",
    accent: "#FFD166",
  },
  {
    id: "bugsquash",
    name: "Bug Squash",
    tagline: "Squash the bugs, dodge the power-ups. Fast hands, faster brain.",
    accent: "#4ECDC4",
  },
];

export function isEventOver() {
  return Date.now() > new Date(EVENT_END).getTime();
}
