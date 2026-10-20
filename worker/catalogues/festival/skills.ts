/**
 * Mirage Valley's skills: how the festival guide and the road trip write.
 * Both catalogues ship them (Catalogue.skills), so making either example
 * adds them to the workspace's Context, where they can be edited. The
 * outcome page names each one while a section follows it.
 *
 * The voice goes on the whole experience; the rest go on the sections
 * they're for, by these ids.
 */
export const mirageSkills = [
  {
    id: "mirage-voice",
    title: "Mirage Valley Voice",
    description: [
      "Write as Mirage Valley to one person with a ticket, like a friend who has been every year and is glad they're coming. Specific and calm, never hype: the facts carry the excitement.",
      "Point at things they could check: the act, the time, the town, the thing to order. Say what they'll do (\"get there for the first song\"), not how the plan was put together.",
      "Use \"we\" for Mirage Valley and \"you\" for them, never \"I\". Give their answers back in plain words, never as a raw value: \"you wanted room for a few new names\", not \"you asked for 4 on discovery\"; \"on your own\", not \"just me\".",
      "Short sentences, with contractions. British spelling (favourite, centre), US units (miles, 90°F). Times read noon, 1 AM, 11 AM. No exclamation marks, no em dashes, no emoji.",
      "Never write: lane, side of, anchor, filler, tight, clean run, epic, iconic, magical, unforgettable, legendary, vibes, banger, must-see, the ultimate, get ready, buckle up, soak up, immerse.",
      "Use for everything a guest reads.",
    ].join("\n\n"),
  },
  {
    id: "clash-calls",
    title: "Clash Calls",
    description: [
      "When two acts they'd want overlap, make the call. Don't list both and leave it to them.",
      "Work out the overlap from the timetable. An act they picked beats one they didn't. Between two of their picks, go by how they said they do a festival: \"front and centre\" stays for the whole set; \"see as much as I can\" takes the first half of one, then crosses over.",
      "Give a reason they'd say themselves (they picked it, it sounds like an artist they named) and what the other costs in minutes or songs: \"The second starts 20 minutes before the first ends. Stay to the end, then walk five minutes over.\" Never \"a stronger match\" or \"keeps the plan tighter\".",
      "Walks: Sundial Stage and Palm Court are five minutes apart, Oasis Tent is ten minutes from both, The Dune is fifteen minutes from Sundial. Add five minutes if they're with a group. A call may name stages and times.",
      "One or two sentences per call. Use for the schedule.",
    ].join("\n\n"),
  },
  {
    id: "desert-days",
    title: "Desert Days",
    description: [
      "Plan each day around the heat. Afternoons run 90°F and over until about 6 PM; nights drop to the 60s.",
      "Before 6 PM, prefer sets in the shade (under the trees at Palm Court, inside Oasis Tent) and say so in that set's note without naming the stage: \"There's shade under the trees, so take this one sitting down.\"",
      "Leave at least an hour clear each afternoon, more if they said they pace themselves, and say in the note before it what to do: \"Nothing now until 6 PM. Refill your water and find shade.\"",
      "End each day when their night ends: \"after the headliner\" ends with the headliner, \"in the dance tent at close\" ends at The Dune, \"early, for the sunset sets\" ends by about 9 PM.",
      "A day's headline names the act it builds to, or the hour it ends. Use for the schedule.",
    ].join("\n\n"),
  },
  {
    id: "new-to-you",
    title: "New to You",
    description: [
      "Introduce an act they didn't name through one they did: \"If you've had Parcels on repeat…\". One comparison they'd recognise, then one thing you can hear: the guitar tone, the tempo, the language they sing in.",
      "No stacks of genre words (\"dreamy psych-soul-pop\"), and no \"your taste\" or \"your side\". Never say they already like it. Don't state facts about an artist's records, members or history unless you're sure.",
      "Use for acts they haven't heard yet and for the road mix.",
    ].join("\n\n"),
  },
  {
    id: "road-stops",
    title: "Road Stops",
    description: [
      "For each stop, say what to get or do there, from what people mention about the place: the dish, the drink, the shelf to look through. Then why it fits them, from what they told us they stop for and who's in the car.",
      "Never invent opening hours, prices or menu items. A morning stop is coffee before the road; an evening stop is near where they sleep.",
      "On the last day, tell them to fill the tank and carry water before the last stretch into the valley, where afternoons run 90°F. Use for the drive.",
    ].join("\n\n"),
  },
];
