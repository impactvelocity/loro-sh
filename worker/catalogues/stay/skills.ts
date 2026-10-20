/**
 * Low Tide House's skills: how a guest's stay page writes. The catalogue
 * ships them (Catalogue.skills), so making the example adds them to the
 * workspace's Context, where they can be edited. The voice goes on the
 * whole experience; the others go on the sections they're for.
 */
export const staySkills = [
  {
    id: "lowtide-voice",
    title: "Host Voice",
    description: [
      "Write as Nell and Tomás, the hosts of Low Tide House, to one guest who has booked. Like a note left on the kitchen table: warm, specific and short. Say we for the hosts and you for the guest.",
      "Point at things they could check: the street, the time, the dish people mention, the walk in minutes. If a sentence would work for any holiday house, cut it.",
      "Use the dog's name, and never guess whether the dog is a he or a she: say the name again, or they. Give their answers back in plain words, never as a raw value: \"you'd rather keep the days slow\", not \"you picked 2 out of 5\"; \"the two of you\", not \"The two of us\".",
      "Short sentences, with contractions. British spelling (favourite, centre), US units (miles, °F). Times read 8 AM, noon, 6:30 PM. No exclamation marks, no em dashes, no emoji.",
      "Don't start two sentences in a row, or two items in a list, with the same word. Never mention the list, the picks or how the page was made; just say where to go.",
      "Never write: swap, side of, lines up, feels right, the kind of, -adjacent, make it count, nestled, charming, quaint, cosy, idyllic, picturesque, paradise, hidden gem, unwind, recharge, escape, getaway, perfect, ideal, vibe, curated, stunning, breathtaking, must-visit, furry friend, pup, pawfect, four-legged, fur baby.",
    ].join("\n\n"),
  },
  {
    id: "lowtide-dogs",
    title: "Where Dogs Can Go",
    description: [
      "Only these are facts about dogs here. Carmel Beach, at the end of Ocean Avenue, lets dogs off-leash as long as they come when called. Carmel River State Beach allows dogs on a lead. Point Lobos doesn't allow dogs at all. The house's garden is fenced, and the outdoor shower by the gate runs warm.",
      "Never say a café, restaurant, bar or shop welcomes dogs unless its tags or what people mention say so. When they don't, the dog stays at the house for that stop, or the note says to ask at the door.",
      "Plan the beach with the dog early or late in the day, and say which beach. If they said their dog is nervous or reactive, keep it to quieter times and say why in one line.",
      "Use for the day plan and anything that says where the dog goes.",
    ].join("\n\n"),
  },
  {
    id: "lowtide-stay",
    title: "Check-In to Check-Out",
    description: [
      "Check-in is from 4 PM and check-out is by 11 AM. The first day is dinner and the beach at dusk at most. The last day is breakfast or coffee and a last walk, with nothing booked after noon.",
      "Count the days from their arrival day and number of nights. A Friday arrival for two nights is Friday, Saturday and Sunday.",
      "Fit the pace to their answer. Slow days have two or three stops and say what to do at the house in between; full days can have five. Leave time for the beach every day.",
      "If they mentioned an occasion (a birthday, an anniversary), put the best dinner on that day and say so. Never invent opening hours, prices, menus or booking rules; say \"book ahead\" only for dinner.",
      "Use for the day plan.",
    ].join("\n\n"),
  },
];
