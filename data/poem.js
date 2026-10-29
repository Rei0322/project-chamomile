// "Annabel Lee" by Edgar Allan Poe (1849). Public domain.
// The player calls Annabel Lee back by remembering the poem, one stanza at a time.
// The ghost is only allowed to quote lines from this file, so she never invents "Poe" lines.

const TITLE = "Annabel Lee";
const AUTHOR = "Edgar Allan Poe";

const STANZAS = [
  [
    "It was many and many a year ago,",
    "In a kingdom by the sea,",
    "That a maiden there lived whom you may know",
    "By the name of Annabel Lee;",
    "And this maiden she lived with no other thought",
    "Than to love and be loved by me."
  ],
  [
    "I was a child and she was a child,",
    "In this kingdom by the sea,",
    "But we loved with a love that was more than love—",
    "I and my Annabel Lee—",
    "With a love that the wingèd seraphs of Heaven",
    "Coveted her and me."
  ],
  [
    "And this was the reason that, long ago,",
    "In this kingdom by the sea,",
    "A wind blew out of a cloud, chilling",
    "My beautiful Annabel Lee;",
    "So that her highborn kinsmen came",
    "And bore her away from me,",
    "To shut her up in a sepulchre",
    "In this kingdom by the sea."
  ],
  [
    "The angels, not half so happy in Heaven,",
    "Went envying her and me—",
    "Yes!—that was the reason (as all men know,",
    "In this kingdom by the sea)",
    "That the wind came out of the cloud by night,",
    "Chilling and killing my Annabel Lee."
  ],
  [
    "But our love it was stronger by far than the love",
    "Of those who were older than we—",
    "Of many far wiser than we—",
    "And neither the angels in Heaven above",
    "Nor the demons down under the sea",
    "Can ever dissever my soul from the soul",
    "Of the beautiful Annabel Lee;"
  ],
  [
    "For the moon never beams, without bringing me dreams",
    "Of the beautiful Annabel Lee;",
    "And the stars never rise, but I feel the bright eyes",
    "Of the beautiful Annabel Lee;",
    "And so, all the night-tide, I lie down by the side",
    "Of my darling—my darling—my life and my bride,",
    "In her sepulchre there by the sea—",
    "In her tomb by the sounding sea."
  ]
];

// Call and response: her love recites a stanza, she answers. Each answer is a little more *her*.
// Lost, then finding her way back by following his voice. Never wailing, never screaming.
const ARC = [
  "You are just waking, confused and faint. You hear a voice across the water but do not yet know who calls you.",
  "The first memories return, soft and unsure. You half-remember being children here together.",
  "You are fragile and afraid of losing the thread. You remember the cold wind. Beg him gently not to stop.",
  "You are gaining strength. You can feel yourself becoming solid again. You recognize him now.",
  "His grief is taking hold of him; he is defiant, almost breaking. You feel him slipping away into it. Reach for him tenderly and ask him to stay with you.",
  "You are fully present, clear and warm. He has remembered all of it, and you are here."
];

// What she whispers aloud after each stanza (her recorded lines, part B). On screen, her words
// always begin with exactly these, so what you read matches what you hear.
const SPOKEN = [
  "…someone is calling me…",
  "…we were children here…",
  "…is it you?",
  "…I'm still here, my love.",
  "…stay with me, please.",
  "You remembered me."
];

// What the ghost says if no model is reachable: her spoken line, then a few words of her own.
// These are her own words, not Poe's, so they never pass as quotes.
const FALLBACK = {
  restored: [
    "Across the water… is that my name?",
    "I remember the salt in the air.",
    "Don't let the wind take me again.",
    "I can feel my hands again.",
    "Nothing could part us. Not the angels, not the deep.",
    "All of it. I'm here."
  ].map((more, i) => `${SPOKEN[i]} ${more}`),
  stumble: [
    "…the words are slipping…",
    "…I'm fading… try again, my love…",
    "…remember me…"
  ],
  returned:
    "You called, and I followed your voice all the way back. While someone remembers us, we are never truly gone. " +
    "Light a candle with me for someone you remember."
};

module.exports = { TITLE, AUTHOR, STANZAS, ARC, SPOKEN, FALLBACK };
