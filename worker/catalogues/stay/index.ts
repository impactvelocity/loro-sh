/**
 * A holiday house's guest pages. A guest books, answers a few questions
 * on the booking form (when they arrive, how long, who's coming, the
 * dog's name, the places they love at home), and the booking system
 * starts the experience by API (POST /experiences/:slug/trigger) and
 * emails them the outcome: their days at the house, planned from dinner
 * the night they arrive to coffee before check-out.
 *
 * The example has no start page or public questions, since the booking
 * form asks them. Both are designed all the same, so a copy of the
 * experience with them switched on lets anyone try it.
 *
 * The house is fixed per experience: its facts sit in the workflow prompt
 * and on the start page, and every lookup searches around its point
 * (lat, lng). The example is Low Tide House, a made-up dog-friendly
 * cottage in Carmel-by-the-Sea; the beach and town rules it relies on
 * are real. It ships three skills (host voice, where dogs can go, check-in
 * to check-out), added to the workspace's Context when it's made.
 */
import { defineCatalogue } from "@core/catalogue/define";
import { artifactComponents, artifactLayout } from "./artifact";
import { intakeComponents, intakeLayout } from "./intake";
import { unsplash } from "./shared";
import { staySkills } from "./skills";
import { startComponents, startLayout } from "./start";

const photos = {
  beach: "photo-1746130668923-bb4cf0e196d2",
  house: "photo-1742734913238-99f5df62c468",
  living: "photo-1785934451738-cc993993bb52",
  bedroom: "photo-1593194632872-3d19dab6e278",
  loft: "photo-1766430956209-72d1c28a16ec",
  deck: "photo-1604535302091-88c788c5bff7",
  door: "photo-1557434440-5af89df2cb64",
  towel: "photo-1686928124138-a69b398dd657",
  dogBed: "photo-1581888227599-779811939961",
  window: "photo-1773123504121-89660d852112",
  shower: "photo-1774815250852-0bc10206bbbe",
  bridge: "photo-1518138945951-647273bf05aa",
  bay: "photo-1724280984105-8cce1e0eee2d",
  cypress: "photo-1624935848156-cd6de9624210",
};

const point = "36.5527, -121.9252";
const brand = { brand: "Low Tide House", logo: "", accent: "#9c9a81" };
const phone = "831-555-0172";
const sms = "sms:+18315550172";
const hosts = "Nell and Tomás";

const near = (name: string, kinds: string[], radius: number, take: number) => ({
  name,
  type: "place",
  near: "place",
  place: point,
  radius,
  kinds,
  take,
});

const places = ["mornings", "tables", "drinks", "outdoors", "browsing"];

// Ids share one namespace (lookups, steps, questions, components): a repeat is dropped, so no two may match.

// The dog notes, on the start page and again on the outcome.
const dogNotes = [
  {
    title: "Off-leash on Carmel Beach",
    body: "Dogs can run off-leash on Carmel Beach, as long as they come when called. It's at the bottom of Ocean Avenue, ten minutes on foot.",
  },
  { title: "On a lead at Carmel River", body: "Carmel River State Beach, five minutes south by car, allows dogs on a lead." },
  { title: "Not at Point Lobos", body: "Dogs aren't allowed in Point Lobos. Go while they sleep off the beach at the house." },
  { title: "Rinse off at the gate", body: "The outdoor shower by the gate runs warm, and the towels in the basket next to it are for sandy dogs." },
];

export default defineCatalogue({
  id: "stay",
  name: "Stay",
  description: "A holiday house plans each guest's days from their booking answers and taste. Started by the booking system's API.",
  theme: "shore",
  parts: {
    start: { layout: startLayout, components: startComponents },
    intake: { layout: intakeLayout, components: intakeComponents },
    artifact: { layout: artifactLayout, components: artifactComponents },
  },
  skills: staySkills,
  // Emma's answers from the demo workspace's example run.
  samples: [
    {
      id: "emma",
      person: { name: "Emma Collins", email: "emma.collins@example.com" },
      answers: {
        arrive: "Friday",
        nights: "Three",
        party: "The two of us",
        dog: "Juniper",
        "dog-about": "A two-year-old lab. Swims in anything, a bit much with small dogs.",
        after: ["Beach walks with the dog", "Coffee somewhere good", "Dinner worth booking", "Wine tasting"],
        pace: 2,
        favourites: "Sightglass for coffee, Zuni Café for birthdays, Smuggler's Cove in San Francisco",
        music: "Khruangbin, Men I Trust, Fleetwood Mac",
        "plan-around": "Saturday's our anniversary.",
      },
    },
  ],
  example: {
    catalogue: "stay",
    name: "Your Stay",
    workflow: {
      prompt: [
        `Low Tide House is a dog-friendly holiday cottage in Carmel-by-the-Sea, California. The hosts are ${hosts}. Guests get this page after they book.`,
        "The house is on Casanova Street, four blocks up from Carmel Beach, about ten minutes on foot. Like most houses in Carmel it has a name, not a street number.",
        "Two bedrooms (a queen, and two twins), one bathroom, and a warm outdoor shower by the garden gate. A fenced garden, a gas fire in the living room, a full kitchen. Sleeps four. Up to two dogs, no fee; dog beds, bowls and a basket of beach towels by the gate.",
        "Check-in from 4 PM, check-out by 11 AM. One car fits in the drive.",
        "Dogs: Carmel Beach lets dogs off-leash under voice control. Carmel River State Beach allows dogs on a lead. Point Lobos doesn't allow dogs.",
        "The reader is a guest who has booked, often with their dog. Help them picture their days here, from the night they arrive to check-out.",
      ].join("\n"),
      skills: ["lowtide-voice"],
      lookups: [
        { id: "mornings", props: near("Mornings near the house", ["coffee", "brunch"], 2, 14) },
        { id: "tables", props: near("Lunch and dinner in town", ["restaurant"], 3, 16) },
        { id: "drinks", props: near("A drink before dinner", ["bar"], 3, 10) },
        { id: "outdoors", props: near("Beaches, trails and the coast", ["outdoors"], 20, 10) },
        { id: "browsing", props: near("Galleries and shops", ["culture", "shopping"], 2, 10) },
        { id: "soundtrack", props: { name: "Music for the drive", type: "artist", popularity: "any", take: 16, person: "high", segment: "low" } },
      ],
      // Sends the page's link back to the booking system once it's ready, so it can email the guest.
      steps: [{ id: "webhook", type: "webhook", props: { url: "", tests: false } }],
    },
    parts: {
      start: {
        enabled: false,
        settings: {
          ...brand,
          nav: [
            { link: { label: "The house", href: "#house" } },
            { link: { label: "The dog", href: "#dog-notes" } },
            { link: { label: "Questions", href: "#faq" } },
          ],
          cta: { label: "Plan your stay", href: "#start" },
          address: "Low Tide House\nCasanova Street\nCarmel-by-the-Sea, CA 93921",
          contact: `${phone}\nhello@lowtidehouse.example`,
          footer: "Low Tide House is an example holiday house. Photos from Unsplash.",
        },
        components: [
          {
            id: "hero",
            type: "hero",
            props: {
              headline: "Four blocks up from a beach where dogs run off-leash",
              body: "Low Tide House, Carmel-by-the-Sea",
              image: unsplash(photos.beach, 2400),
              signup: true,
              formTitle: "Plan your days before you pack",
              formBody: "Ten questions about you, your dog and the places you love at home. Then your stay, planned from the first dinner to the last coffee.",
              askName: true,
              button: "Plan my stay",
              note: "We'll only email you about your stay.",
              cta: { label: "Plan your stay", href: "#join" },
            },
          },
          {
            id: "about",
            type: "intro",
            props: {
              body: "Like most houses in Carmel, ours has a name instead of a number. It's on Casanova Street, ten minutes' walk from the sand, with a fenced garden for the dog and a warm shower by the gate for when you both come back sandy.",
              signature: hosts,
            },
          },
          {
            id: "cards",
            type: "cards",
            props: {
              items: [
                {
                  image: unsplash(photos.living, 1400, 3 / 2),
                  title: "The house",
                  body: "Two bedrooms, a gas fire and a kitchen for slow breakfasts. Sleeps four.",
                  link: { label: "What's in the house", href: "#house" },
                },
                {
                  image: unsplash(photos.towel, 1400, 3 / 2),
                  title: "The dog",
                  body: "Up to two dogs, no fee. Beds, bowls and a basket of beach towels by the gate.",
                  link: { label: "Where dogs can go", href: "#dog-notes" },
                },
              ],
            },
          },
          {
            id: "dog-notes",
            type: "notes",
            props: {
              heading: "Bring the dog",
              body: "What we tell every guest who arrives with one.",
              image: unsplash(photos.dogBed, 1200, 4 / 5),
              items: dogNotes,
            },
          },
          {
            id: "house",
            type: "details",
            props: {
              heading: "The house",
              body: "",
              items: [
                { label: "Sleeps", value: "Four, in two bedrooms" },
                { label: "Beds", value: "A queen, and two twins" },
                { label: "Bathroom", value: "One, plus the outdoor shower" },
                { label: "Dogs", value: "Up to two, no fee" },
                { label: "Check-in", value: "From 4 PM" },
                { label: "Check-out", value: "By 11 AM" },
                { label: "Parking", value: "One car in the drive" },
                { label: "To the beach", value: "Ten minutes on foot" },
              ],
              link: { label: "", href: "" },
            },
          },
          {
            id: "taste",
            type: "example",
            props: {
              heading: "Same taste, new town",
              body: "Tell us the cafés and restaurants you go back to at home. We'll find the ones in Carmel you'd go back to for the same reasons.",
              // From a real run: a guest from San Francisco, triggered by API on 2026-10-20.
              items: [
                {
                  yours: "Sightglass, San Francisco",
                  near: "Café Carmel",
                  detail: "7 min walk · pastries",
                  image: "https://images.qloo.com/i/12EF21D4-CAA7-4AD5-94A9-93E0AA9056FA-44zeFW-420x-outside.jpg",
                },
                {
                  yours: "Tartine, San Francisco",
                  near: "Rise + Roam Bakery and Pizzeria",
                  detail: "6 min walk · almond croissant",
                  image: "https://images.qloo.com/i/5F4B3672-80B0-43C6-9A4B-3BBD8AA841CD-3p709U-420x-outside.jpg",
                },
                {
                  yours: "Smuggler's Cove, San Francisco",
                  near: "Barmel",
                  detail: "6 min walk · classic cocktails",
                  image: "https://images.qloo.com/i/7A1B8169-2901-4265-9CD7-EF565A568737-1M4pds-420x-outside.jpg",
                },
              ],
              note: "From a page we made for a guest coming down from San Francisco.",
              cta: { label: "Find yours", href: "#join" },
            },
          },
          {
            id: "join",
            type: "optin",
            props: {
              headline: "Plan your stay",
              body: "Dinner the night you arrive, the beach before breakfast, and where the dog can come.",
              image: unsplash(photos.bridge, 2400),
              formTitle: "Ten questions, then your days",
              formBody: "We'll email you the link, so you can send it to whoever's coming with you.",
              askName: true,
              button: "Plan my stay",
              note: "We'll only email you about your stay.",
            },
          },
          {
            id: "faq",
            type: "faq",
            props: {
              heading: "Questions",
              items: [
                {
                  question: "How do you pick the places?",
                  answer: "From the places and music you tell us you love at home. We look for places in Carmel that share something with them: the coffee, the room, the menu. No one pays to be on your page.",
                },
                {
                  question: "Will it say where the dog can come?",
                  answer: "It says what we know for sure: the beach rules above, and our garden. For cafés and restaurants, your page says when people mention dogs there. Otherwise, ask at the door.",
                },
                {
                  question: "Is it the same page for everyone?",
                  answer: "No. Two guests who drink coffee in different places at home get different cafés here, for different reasons.",
                },
                {
                  question: "What happens to my answers?",
                  answer: `They make your page and stay with us, so we know what you're after if you text with a question. We're on ${phone}.`,
                },
              ],
            },
          },
        ],
      },
      intake: {
        enabled: false,
        settings: {
          ...brand,
          photos: [
            { image: unsplash(photos.door, 1200), caption: "The front door" },
            { image: unsplash(photos.living, 1200), caption: "The living room" },
            { image: unsplash(photos.bedroom, 1200), caption: "The queen room" },
            { image: unsplash(photos.dogBed, 1200), caption: "One of the dog beds" },
            { image: unsplash(photos.window, 1200), caption: "The window seat" },
            { image: unsplash(photos.bay, 1200), caption: "Carmel Bay" },
            { image: unsplash(photos.deck, 1200), caption: "Evening on the deck" },
            { image: unsplash(photos.cypress, 1200), caption: "Cypress on the beach" },
            { image: unsplash(photos.loft, 1200), caption: "Upstairs" },
            { image: unsplash(photos.shower, 1200), caption: "The outdoor shower" },
            { image: unsplash(photos.bridge, 1200), caption: "Highway 1, south of town" },
          ],
          next: "Next",
          submit: "Plan my stay",
        },
        components: [
          {
            id: "arrive",
            type: "choice",
            props: {
              question: "Which day do you arrive?",
              help: "Check-in is from 4 PM, so your first day starts with dinner.",
              required: true,
              multiple: false,
              options: [
                { label: "Monday" },
                { label: "Tuesday" },
                { label: "Wednesday" },
                { label: "Thursday" },
                { label: "Friday" },
                { label: "Saturday" },
                { label: "Sunday" },
              ],
            },
          },
          {
            id: "nights",
            type: "choice",
            props: {
              question: "How many nights?",
              help: "So we know how many days to plan.",
              required: true,
              multiple: false,
              options: [{ label: "Two" }, { label: "Three" }, { label: "Four" }, { label: "Five or more" }],
            },
          },
          {
            id: "party",
            type: "choice",
            props: {
              question: "Who's coming?",
              help: "So we know whether to plan a quiet table for two or somewhere kids can be loud.",
              required: true,
              multiple: false,
              options: [{ label: "Just me" }, { label: "The two of us" }, { label: "Family, with kids" }, { label: "A few friends" }],
            },
          },
          {
            id: "dog",
            type: "text",
            props: {
              question: "What's your dog called?",
              help: "We'll plan where they can come too.",
              required: true,
              size: "short",
              placeholder: "Juniper",
            },
          },
          {
            id: "dog-about",
            type: "text",
            props: {
              question: "And what are they like?",
              help: "Size, age, how they are with other dogs. It decides which beach, and what time.",
              required: false,
              size: "long",
              placeholder: "A two-year-old lab. Swims in anything, a bit much with small dogs.",
            },
          },
          {
            id: "after",
            type: "choice",
            props: {
              question: "What are you here for?",
              help: "The parts of a weekend away you'd miss if we left them out.",
              required: true,
              multiple: true,
              options: [
                { label: "Beach walks with the dog" },
                { label: "Coffee somewhere good" },
                { label: "A long lunch" },
                { label: "Dinner worth booking" },
                { label: "Wine tasting" },
                { label: "Galleries and shops" },
                { label: "Trails and the coast road" },
              ],
            },
          },
          {
            id: "pace",
            type: "scale",
            props: {
              question: "How full should the days be?",
              help: "Some guests want a plan for every hour. Some want the beach and a book.",
              required: true,
              max: 5,
              low: "The beach and a book",
              high: "Out all day",
            },
          },
          {
            id: "taste-intro",
            type: "statement",
            props: {
              title: "Now, the places you love at home",
              body: "Wherever home is. Name a few and we'll find the ones in Carmel you'd go back to for the same reasons.",
              media: { type: "image", url: "" },
            },
          },
          {
            id: "favourites",
            type: "text",
            props: {
              question: "Which cafés, restaurants and bars do you go back to?",
              help: "Name a few, with the city. This is what we match on.",
              required: true,
              size: "long",
              placeholder: "Sightglass for coffee, Zuni Café for birthdays, Smuggler's Cove in San Francisco",
            },
          },
          {
            id: "music",
            type: "text",
            props: {
              question: "What's playing in the car on the way?",
              help: "A few artists. We'll pick music for the drive.",
              required: false,
              size: "short",
              placeholder: "Khruangbin, Men I Trust, Fleetwood Mac",
            },
          },
          {
            id: "plan-around",
            type: "text",
            props: {
              question: "Anything we should plan around?",
              help: "A birthday, a bad knee, a dog who hates crowds.",
              required: false,
              size: "long",
              placeholder: "Saturday's our anniversary. Juniper gets nervous in busy places.",
            },
          },
        ],
      },
      artifact: {
        enabled: true,
        settings: {
          ...brand,
          cta: { label: "Text your hosts", href: sms },
          footer: "Low Tide House is an example holiday house. Places and music come from Qloo, matched to your answers.",
        },
        components: [
          {
            id: "cover",
            type: "cover",
            props: {
              title: "Your days in Carmel, {{first_name}}",
              details: "Arriving {{answers.arrive}} · {{answers.nights}} nights · with {{answers.dog}}",
              intro: "Everything below is a walk or a short drive from the house, picked from the places you love at home.",
              image: unsplash(photos.deck, 2400),
              link: { label: "Text your hosts", href: sms },
              making: "Planning your days in Carmel",
            },
          },
          { id: "note", type: "welcome", props: { heading: "A note from your hosts", signature: hosts, prompt: "", skills: [] } },
          {
            id: "days",
            type: "days",
            props: {
              lookups: places,
              heading: "Your days",
              perDay: 4,
              maxDays: 4,
              from: point,
              spots: [
                { name: "Carmel Beach", detail: "10 min walk · dogs off-leash", image: unsplash(photos.beach, 600, 4 / 3) },
                { name: "Carmel River State Beach", detail: "5 min drive · dogs on a lead", image: unsplash(photos.cypress, 600, 4 / 3) },
              ],
              prompt: "",
              skills: ["lowtide-dogs", "lowtide-stay"],
            },
          },
          {
            id: "locals",
            type: "locals",
            props: { lookups: ["mornings", "tables", "drinks"], heading: "Your locals", count: 4, from: point, prompt: "", skills: [] },
          },
          { id: "drive", type: "drive", props: { lookups: ["soundtrack"], heading: "For the drive", count: 6, prompt: "", skills: [] } },
          {
            id: "dog-rules",
            type: "notes",
            props: {
              heading: "For {{answers.dog}}",
              body: "What we know for sure about where dogs can go.",
              image: unsplash(photos.towel, 1200, 4 / 5),
              items: dogNotes,
            },
          },
          {
            id: "arrival",
            type: "details",
            props: {
              heading: "Before you arrive",
              body: "",
              items: [
                { label: "Check-in", value: "From 4 PM" },
                { label: "The door code", value: "By text, the morning you arrive" },
                { label: "Parking", value: "One car in the drive" },
                { label: "Check-out", value: "By 11 AM" },
              ],
              link: { label: "Text your hosts", href: sms },
            },
          },
          {
            id: "made",
            type: "made",
            props: {
              label: "For the Loro demo",
              heading: "How this page was made",
              body: "The guest's answers, from their booking or the questions. Qloo's taste graph, searched around the house. And a model that could only pick from the places and artists Qloo returned.",
            },
          },
        ],
      },
    },
  },
});
