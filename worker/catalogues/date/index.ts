/**
 * A first date, planned for someone who just matched, around what the
 * person they're taking out loves. For dating apps.
 *
 * API first: when two people match, the app starts the experience for the
 * one planning (POST …/experiences/:slug/trigger) with the match's name,
 * where and when, and both people's favourites from their profiles. The
 * start page and questions are for people who come on their own, and for
 * the demo.
 *
 * The Date Plan step (steps/date.ts) finds the neighbourhood, splits the
 * hours into stops and asks Qloo for places a walk apart for each, with
 * the match's favourites counting three times the planner's. The outcome
 * picks one place per stop, writes why, and ends with the text to send.
 *
 * The catalogue ships four skills (voice, their taste first, good company,
 * a walk apart), added to the workspace's Context when an experience is
 * made from it.
 */
import { defineCatalogue } from "@core/catalogue/define";
import { artifactComponents, artifactLayout } from "./artifact";
import { intakeComponents, intakeLayout } from "./intake";
import { unsplash } from "./shared";
import { startComponents, startLayout } from "./start";

const photos = {
  ferris: unsplash("photo-1717777525115-cc97d886add9"),
  bunting: unsplash("photo-1464047736614-af63643285bf"),
  lights: unsplash("photo-1562875222-497b652680d4"),
  records: unsplash("photo-1587731556938-38755b4803a6", 1400),
  street: unsplash("photo-1679089391720-dab2bca0ffc5", 1400),
  cones: unsplash("photo-1502174832274-bc176e52765a", 1400),
  cone: unsplash("photo-1497034825429-c343d7c6a68f", 1400),
  arcade: unsplash("photo-1511882150382-421056c89033", 1400),
  bowling: unsplash("photo-1608751613440-8880d1a0a1a0", 1400),
  neon: unsplash("photo-1549147133-8450b6fe7ef3", 1400),
};

const brand = { brand: "Overlap", logo: "" };

const skills = [
  {
    id: "overlap-voice",
    title: "Overlap Voice",
    description: [
      "Write as Overlap to the person planning the date, like a friend who knows the neighbourhood and wants it to go well. Specific and calm. The facts do the work: the place, the street, the thing to order.",
      "Call the person they're taking out by their first name from the answers. Never he, she, him or her unless the answers say; use their name or they.",
      "Use you for the planner and we for Overlap. Short sentences, with contractions. British spelling, local units and place names. Times read 6 PM, 7:45 PM, noon. No exclamation marks, no em dashes, no emoji.",
      "Point at things, not moods. Never write: romantic, chemistry, spark, magic, sparks fly, impress, wow, swoon, cosy up, the one, vibe, vibes, perfect date, unforgettable, hidden gem, curated, elevate, a night to remember, cinematic, side of things, side of the night, someone's side, lane, energy, leans, settled, hushed, a good fit, fits well, clean.",
    ].join("\n\n"),
  },
  {
    id: "overlap-their-taste",
    title: "Their Taste First",
    description: [
      "The date is for the person being taken out. Every reason points at one of their favourites first, by name, as they wrote it. Bring in the planner's favourites only where the two lists meet.",
      "Never say the match likes something they didn't list, and never guess what they like from their name, age or gender.",
      "Say what links a place to a favourite in terms you could check on the night: the music playing, the room, the dish, the crowd. Don't state facts about an artist, film or book unless you're sure.",
    ].join("\n\n"),
  },
  {
    id: "overlap-good-company",
    title: "Good Company",
    description: [
      "Plan around everything they asked to steer around. If either of them doesn't drink, no stop is about drinking, and never suggest 'just one'.",
      "First dates end in public. The last stop is somewhere easy to leave from. Never suggest going back to someone's place, a hotel bar for that reason, or anything about how the night should end.",
      "No pressure in the copy: no 'make a move', 'close', 'seal the deal' or advice on what to wear or pay.",
    ].join("\n\n"),
  },
  {
    id: "overlap-a-walk-apart",
    title: "A Walk Apart",
    description: [
      "Each stop should be a short walk from the last. Order them so the route doesn't double back, and end near where it started or near transport.",
      "Never invent opening hours, prices, menu items or reservations policies. For dinner on a Friday or Saturday, say it's worth booking ahead.",
      "Say what to get or look at from what people mention about the place. If nothing is mentioned, say what kind of place it is and leave the order out.",
    ].join("\n\n"),
  },
];

export default defineCatalogue({
  id: "date",
  name: "Date",
  description: "A first date planned around what the other person loves: a few hours, a walk apart, with the text to send. Started by a dating app's API.",
  theme: "velvet",
  parts: {
    start: { layout: startLayout, components: startComponents },
    intake: { layout: intakeLayout, components: intakeComponents },
    artifact: { layout: artifactLayout, components: artifactComponents },
  },
  skills,
  example: {
    catalogue: "date",
    name: "First Date",
    workflow: {
      prompt: [
        "Overlap is a dating app. Once two people match, one of them plans a first date here: a few hours in one neighbourhood, built on what the person they're taking out loves.",
        "The reader is the planner. Their match's first name is the answer to 'Who are you taking out?'. Both people's favourites are in the answers: the match's count more. Keep straight whose favourite is whose.",
        "Never call the match he, she, him or her, whatever their name: use their first name or they.",
        "Every place comes from the Date Plan step: real places a short walk apart, open on the day, within the budget they gave.",
      ].join("\n"),
      skills: ["overlap-voice", "overlap-their-taste", "overlap-good-company"],
      lookups: [],
      steps: [
        {
          id: "date",
          type: "date",
          props: {
            where: "where",
            when: "when",
            theirs: "their_taste",
            yours: "your_taste",
            pace: "pace",
            budget: "budget",
            avoid: "avoid",
            hours: 4,
            radius: 1,
            take: 5,
          },
        },
      ],
    },
    parts: {
      start: {
        enabled: true,
        settings: {
          ...brand,
          nav: [
            { link: { label: "How it works", href: "#taste" } },
            { link: { label: "Where", href: "#areas" } },
            { link: { label: "Questions", href: "#faq" } },
          ],
          cta: { label: "Plan a date", href: "#start" },
          footer: "Overlap is an example dating app, made for the Loro demo.",
        },
        components: [
          {
            id: "hero",
            type: "hero",
            props: {
              title: "Four hours, planned around what they love",
              body: "Name a few things they love from their profile. We'll plan a first drink, dinner and somewhere after in one neighbourhood, each a short walk from the last.",
              image: photos.ferris,
              signup: true,
              askName: true,
              button: "Plan the date",
              note: "We'll only email you your plan.",
              cta: { label: "Plan a date", href: "#join" },
            },
          },
          {
            id: "taste",
            type: "feature",
            props: {
              heading: "Built from their favourites",
              body:
                "Their favourite band, a film they rate, the restaurant they keep going back to. Qloo, a taste engine, matches each one and ranks every bar and table near you against them.\n\n" +
                "Their favourites count three times yours, so the places lean their way and land where your two lists meet.",
              image: photos.records,
              side: "left",
            },
          },
          {
            id: "walk",
            type: "feature",
            props: {
              heading: "A short walk apart",
              body:
                "Every stop is about a kilometre or less from where you meet, open on the day you pick and within what you said you'd spend.\n\n" +
                "The plan gives the walk to each stop and directions for the whole route.",
              image: photos.street,
              side: "right",
            },
          },
          {
            id: "text",
            type: "feature",
            props: {
              heading: "Then, the text to send",
              body: "The plan ends with a message for them: the day, the time and where to meet. Send it, and keep the rest a surprise.",
              image: photos.cones,
              side: "left",
            },
          },
          {
            id: "example",
            type: "example",
            props: {
              label: "An example",
              heading: "Saturday in the West Village",
              body: "A plan we made for someone taking out a Phoebe Bridgers fan who loves Wong Kar-wai films.",
              rows: [
                {
                  time: "6 PM",
                  place: "142 Sullivan Bar",
                  detail: "A drink to start · SoHo · 7 min walk to dinner",
                  because: "Maya likes Phoebe Bridgers",
                  image: "https://images.qloo.com/i/6C5C699A-8316-4A66-9ABA-B662C3AA4FDE-4kz5Cg-420x-outside.jpg",
                },
                {
                  time: "6:45 PM",
                  place: "Palma",
                  detail: "Dinner on Cornelia Street · 6 min walk on",
                  because: "you like Lost in Translation",
                  image: "https://images.qloo.com/i/3042DF2F-9052-4C18-B219-BC76A42361B5-3DAieS-420x-outside.jpg",
                },
                {
                  time: "8:30 PM",
                  place: "Mezzrow",
                  detail: "Live jazz on West 10th · 9 min walk on",
                  because: "Maya likes Phoebe Bridgers",
                  image: "https://images.qloo.com/i/D0955A40-020C-4CB4-B6CB-D9088A0A77DD-1qeTVL-420x-outside.jpg",
                },
                {
                  time: "9:15 PM",
                  place: "Little Branch",
                  detail: "One more, in the basement on 7th Avenue",
                  because: "you like Big Thief",
                  image: "https://images.qloo.com/i/4C72C065-0694-47FC-971C-F434EC44826A-1o8dnr-420x-outside.jpg",
                },
              ],
              note: "From a test run. Places and reasons come from Qloo.",
              cta: { label: "Plan yours", href: "#join" },
            },
          },
          {
            id: "areas",
            type: "areas",
            props: {
              label: "Where",
              items: [
                { city: "New York", areas: "West Village, Lower East Side, Williamsburg" },
                { city: "Vancouver", areas: "Gastown, Mount Pleasant, Kitsilano" },
              ],
              note: "Somewhere else? Type any neighbourhood when we ask, and we'll find it on the map.",
            },
          },
          {
            id: "join",
            type: "optin",
            props: {
              headline: "Plan the date",
              body: "Eight questions, then a plan you can send them tonight.",
              image: photos.bunting,
              askName: true,
              button: "Start",
              note: "We'll only email you your plan.",
            },
          },
          {
            id: "faq",
            type: "faq",
            props: {
              heading: "Questions",
              items: [
                {
                  question: "Can I do this from a match?",
                  answer: "Yes. In the Overlap app, Plan a date on any match fills in their favourites from their profile and opens your plan.",
                },
                {
                  question: "How are the places picked?",
                  answer: "From the favourites you name. Qloo ranks places near where you're meeting by how well they fit both lists, with theirs counting more. No one pays to be on a plan.",
                },
                {
                  question: "Do they see my answers?",
                  answer: "No. The plan is yours. They only see the text, if you send it.",
                },
                {
                  question: "What if they don't drink?",
                  answer: "Say so when we ask what to steer around. We'll plan with coffee, food and somewhere to look round instead of bars.",
                },
                {
                  question: "Do I need to book?",
                  answer: "For dinner on a Friday or Saturday, usually. The plan tells you when it's worth booking ahead.",
                },
              ],
            },
          },
        ],
      },
      intake: {
        enabled: true,
        settings: {
          ...brand,
          photos: [
            { image: photos.ferris },
            { image: photos.street },
            { image: photos.neon },
            { image: photos.records },
            { image: photos.cone },
            { image: photos.arcade },
            { image: photos.bowling },
            { image: photos.lights },
          ],
          next: "Next",
          submit: "Plan the date",
        },
        components: [
          {
            id: "match",
            type: "text",
            props: {
              question: "Who are you taking out?",
              help: "Their first name. The plan's written around them.",
              required: true,
              size: "short",
              placeholder: "Maya",
            },
          },
          {
            id: "where",
            type: "area",
            props: {
              question: "Where are you meeting?",
              help: "Somewhere you can both get to. Every stop is a short walk from here.",
              required: true,
              other: true,
              options: [
                { name: "West Village, New York", point: "40.7347, -74.0036", note: "Bleecker, Perry and the side streets" },
                { name: "Lower East Side, New York", point: "40.7194, -73.9877", note: "Orchard, Ludlow and Essex" },
                { name: "Williamsburg, New York", point: "40.7163, -73.9606", note: "Around Bedford Avenue" },
                { name: "Gastown, Vancouver", point: "49.2836, -123.1055", note: "Water Street to Main" },
                { name: "Mount Pleasant, Vancouver", point: "49.2625, -123.1008", note: "Main Street, from Broadway up" },
                { name: "Kitsilano, Vancouver", point: "49.2685, -123.1665", note: "West 4th, down to the beach" },
              ],
            },
          },
          {
            id: "when",
            type: "when",
            props: {
              question: "When?",
              help: "We plan four hours from when you start.",
              required: true,
              other: true,
              options: [{ label: "Friday, from 7 PM" }, { label: "Saturday, from 1 PM" }, { label: "Saturday, from 6 PM" }, { label: "Sunday, from 11 AM" }],
            },
          },
          {
            id: "their_taste",
            type: "taste",
            props: {
              question: "What does {{answers.match}} love?",
              label: "What their match loves",
              help: "Copy a few from their profile: bands, films, books, restaurants. The date's built on these.",
              required: true,
              placeholder: "Phoebe Bridgers, In the Mood for Love, Sally Rooney, Lucali",
            },
          },
          {
            id: "your_taste",
            type: "taste",
            props: {
              question: "And you?",
              label: "What the planner loves",
              help: "A few of yours. We look for places where the two lists meet.",
              required: false,
              placeholder: "Big Thief, Lost in Translation, Ottolenghi",
            },
          },
          {
            id: "pace",
            type: "choice",
            props: {
              question: "How do you want to spend it?",
              help: "So we know whether to find you a table or something to look at.",
              required: true,
              multiple: false,
              options: [{ label: "Talking, mostly" }, { label: "Doing something side by side" }, { label: "A bit of both" }],
            },
          },
          {
            id: "budget",
            type: "choice",
            props: {
              question: "What are you happy to spend?",
              help: "For the two of you, across the whole date.",
              required: true,
              multiple: false,
              options: [{ label: "$ · Keep it casual" }, { label: "$$ · A proper dinner" }, { label: "$$$ · Make a night of it" }],
            },
          },
          {
            id: "avoid",
            type: "text",
            props: {
              question: "Anything to steer around?",
              help: "Allergies, not drinking, nowhere too loud. We plan around it.",
              required: false,
              size: "short",
              placeholder: "Vegetarian, nothing too loud",
            },
          },
        ],
      },
      artifact: {
        enabled: true,
        settings: {
          ...brand,
          cta: { label: "Send the invite", href: "#invite" },
          footer: "Overlap is an example dating app. Places come from Qloo, matched to both of your answers.",
        },
        components: [
          {
            id: "cover",
            type: "cover",
            props: {
              title: "{{day}} with {{answers.match}}",
              intro: "Four hours in {{area}}, built on what {{answers.match}} loves. Every stop is a short walk from the last.",
              image: photos.lights,
              link: { label: "See the plan", href: "#plan" },
              making: "Planning the date with {{answers.match}}",
            },
          },
          { id: "overlap", type: "overlap", props: { heading: "Where you overlap", count: 3, prompt: "", skills: [] } },
          {
            id: "itinerary",
            type: "plan",
            props: { lookups: ["date"], heading: "The plan", prompt: "", skills: ["overlap-a-walk-apart"] },
          },
          { id: "later", type: "later", props: { lookups: ["date"], heading: "If it's going well", prompt: "", skills: ["overlap-a-walk-apart"] } },
          {
            id: "invite",
            type: "invite",
            props: {
              heading: "Send {{answers.match}} this",
              body: "When, and where to meet. The rest can be a surprise.",
              prompt: "",
              skills: [],
            },
          },
          {
            id: "made",
            type: "made",
            props: {
              heading: "How this page was made",
              body: "Everything above came from this run: your answers, Qloo's taste graph searched around where you're meeting, and a model that could only write about the places Qloo returned.",
            },
          },
        ],
      },
    },
  },
});
