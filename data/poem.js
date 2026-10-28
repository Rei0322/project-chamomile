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

// What the ghost says if no model is reachable (and the hosted fallback).
// These are her own words, not Poe's, so they never pass as quotes.
const FALLBACK = {
  restored: [
    "…a voice? Someone is saying my name across the water.",
    "Yes… we were children here. I remember the salt in the air.",
    "The wind… I remember the cold of it. Keep speaking. Don't let it take me again.",
    "The angels envied us. I can feel my hands again, love.",
    "Nothing could part us. Not the angels, not the deep. Say the rest. Please.",
    "The moon. The stars. You remembered all of it."
  ],
  stumble: [
    "That isn't how it goes… the words are slipping…",
    "No… I'm fading… try again, my love.",
    "The fog is closing in. Remember it truly."
  ],
  returned:
    "You remembered every word, so I could come back to you, if only for tonight. " +
    "While someone remembers us, we are never truly gone. Light a candle with me for someone you remember."
};

module.exports = { TITLE, AUTHOR, STANZAS, FALLBACK };
