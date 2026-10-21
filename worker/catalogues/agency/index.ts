/**
 * A real estate agency's buyer pages. The agent finds a home for a buyer,
 * adds the buyer under Profiles (with a segment, like Young Family), then
 * starts the experience for them: from the person's page in the admin or
 * with the API, with the listing's link and a few answers about the buyer.
 * The outcome is a page about that home and the life around it, and the
 * agent sends the buyer its link.
 *
 * No start page and no public intake: the questions are the agent's form.
 * The Listing step (steps/listing.ts) reads the home from the link before
 * Taste, puts its facts in the profile and saves its point as
 * `listing_location`, which every place lookup searches around.
 *
 * The catalogue ships three skills (voice, fair housing, listing facts),
 * added to the workspace's Context when an experience is made from it.
 */
import { defineCatalogue } from "@core/catalogue/define";
import { intakeComponents, intakeLayout } from "../basic/intake";
import { startComponents, startLayout } from "../basic/start";
import { artifactComponents, artifactLayout } from "./artifact";

const brand = { brand: "Fieldhouse Realty", logo: "", accent: "#34465a" };

const near = (name: string, kinds: string[], radius: number, take: number) => ({
  name,
  type: "place",
  near: "answer",
  answer: "listing_location",
  radius,
  kinds,
  take,
});

const places = ["mornings-nearby", "evenings-nearby", "weekends-nearby"];

const skills = [
  {
    id: "agency-voice",
    title: "Fieldhouse voice",
    description: [
      "Write as Fieldhouse Realty to one buyer, the way their agent would talk across a kitchen table. Plain words, short sentences, no exclamation marks. The page says we; only the agent's own note says I.",
      "Point, don't praise. Name the room, the walk in minutes, the dish people mention, the time of day. If a sentence would work for any house, cut it.",
      "Use what the buyer told us in their own words (Herkimer, the 8 AM drop-off) and say why it matters to them.",
      "Start with the fact, not with how well things fit. Don't reuse a phrase an earlier section used.",
      "Give a number from the listing once on the page. After that it's the deck, the yard, the third bedroom.",
      "These words give the page away as machine-written. Never use them: side of, dream home, stunning, nestled, boasts, charming, vibrant, hidden gem, must-see, won't last, lines up, the kind of, energy, vibe, rhythm, reset, swap, perfect, ideal.",
    ].join("\n\n"),
  },
  {
    id: "agency-fair-housing",
    title: "Fair housing",
    description: [
      "Describe the home and the places near it, never the people who live there. Don't say an area suits a kind of person (families, young professionals, retirees), and don't describe neighbours, safety, crime or who a street is right for.",
      "Schools: name only the ones the listing names, with the distance it gives. Never rate them.",
      "Talk about the buyer's own needs (a room for work, a yard for their kids) because they told us. That's their brief, not a judgement about the area.",
    ].join("\n\n"),
  },
  {
    id: "agency-listing-facts",
    title: "Listing facts only",
    description: [
      "Everything about the house comes from the listing as published: rooms, sizes, features, price. Use its words and numbers, never round them up.",
      "If something the buyer cares about isn't in the listing (a commute, a fence, noise), say it's worth checking on a viewing rather than guessing.",
      "Never mention value, price per square foot, investment or how fast it will sell.",
    ].join("\n\n"),
  },
];

export default defineCatalogue({
  id: "agency",
  name: "Agency",
  description: "An agent sends a buyer the home they found for them, and the life around it. Started from the admin or the API.",
  theme: "slate",
  parts: {
    start: { layout: startLayout, components: startComponents },
    intake: { layout: intakeLayout, components: intakeComponents },
    artifact: { layout: artifactLayout, components: artifactComponents },
  },
  skills,
  // What the agent would fill in, so the demo can start a page without the
  // admin. The link is a live rew.ca listing in Point Grey: when it sells and
  // comes down, swap in another one that steps/listing.ts can read.
  samples: [
    {
      id: "lena",
      person: { name: "Lena Park", email: "lena.park@example.com" },
      answers: {
        link: "https://www.rew.ca/properties/4333-locarno-crescent-vancouver-bc",
        note: "This one fits the list: five bedrooms up, a suite downstairs Tom could work from, and Locarno Beach close by.",
        week: "Moving up from Seattle. Lena starts at BC Children's Hospital in January, mostly day shifts. Tom works from home and is on calls most mornings. Two kids, 8 and 11, both swim. Weekends are bikes, the beach and a bookshop.",
        favourites: "Milstead & Co., breakfast at Café Presse, Sundays at Discovery Park, Elliott Bay Book Company, Brandi Carlile, Death Cab for Cutie",
        priorities: ["Good coffee", "Parks and playgrounds", "Museums and galleries"],
        "must-haves": "Under 30 minutes to BC Children's Hospital at rush hour. A room for Tom with a door that shuts.",
      },
    },
  ],
  example: {
    catalogue: "agency",
    name: "Buyer Match",
    workflow: {
      prompt: [
        "Fieldhouse Realty is a buyer's agency in Seattle. An agent found one home for one buyer and is sending them this page.",
        "The home's facts come from its listing, in the profile. The buyer's week and the places they love come from the agent's answers and their segment.",
        "Help them picture an ordinary week there: where the coffee is, where work happens, where Saturday goes. Honest about the house, never a sales pitch.",
      ].join("\n"),
      skills: skills.map((skill) => skill.id),
      lookups: [
        // Coffee is lesser known: the chain on every corner can't stand in for anyone's favourite.
        { id: "mornings-nearby", props: { ...near("Mornings near the home", ["coffee", "brunch"], 2.5, 16), popularity: "lesser" } },
        { id: "evenings-nearby", props: near("Evenings near the home", ["restaurant", "bar"], 2.5, 16) },
        { id: "weekends-nearby", props: near("Weekends near the home", ["outdoors", "shopping", "culture"], 4, 14) },
      ],
      steps: [
        { id: "listing", type: "listing", props: { answer: "link", saveAs: "listing_location", photos: 10 } },
        { id: "webhook", type: "webhook", props: { url: "", tests: false } },
      ],
    },
    parts: {
      start: { enabled: false, settings: { ...brand }, components: [] },
      intake: {
        enabled: false,
        settings: { ...brand, background: "", progress: "bar", next: "Next", submit: "Make their page" },
        components: [
          {
            id: "link",
            type: "text",
            props: {
              question: "Listing link",
              help: "The home you found them, on any listing site. We read the photos, price and rooms from it.",
              required: true,
              size: "short",
              placeholder: "https://www.coldwellbankerhomes.com/wa/seattle/6710-3rd-ave-nw/pid_74327012/",
            },
          },
          {
            id: "note",
            type: "text",
            props: {
              question: "Your note to them",
              help: "Why you picked this one, in a sentence or two. It sits next to the listing, signed by you.",
              required: false,
              size: "long",
              placeholder: "This came up this morning and I thought of you both: the fenced yard, and Green Lake a walk away.",
            },
          },
          {
            id: "week",
            type: "text",
            props: {
              question: "What does their week look like?",
              help: "Work, kids, the school run, weekends. It decides which rooms and places we write about.",
              required: true,
              size: "long",
              placeholder:
                "Priya works from home three days a week, Sam commutes to SeaTac. Two kids, 2 and 4, daycare drop-off at 8. Saturdays are the farmers market and a long playground stop.",
            },
          },
          {
            id: "favourites",
            type: "text",
            props: {
              question: "Places and music they love now",
              help: "Cafés, restaurants, parks and artists, by name, wherever they live now. We find the ones near this home they'd pick for the same reasons.",
              required: false,
              size: "long",
              placeholder: "Herkimer Coffee, brunch at Portage Bay Cafe, Sundays at Green Lake, Khruangbin, Bon Iver",
            },
          },
          {
            id: "priorities",
            type: "choice",
            props: {
              question: "What matters most close to home?",
              help: "",
              required: false,
              multiple: true,
              options: [
                { label: "Parks and playgrounds" },
                { label: "Good coffee" },
                { label: "Places to eat out" },
                { label: "Quiet streets" },
                { label: "Bars and nights out" },
                { label: "Shops" },
                { label: "Museums and galleries" },
              ],
            },
          },
          {
            id: "must-haves",
            type: "text",
            props: {
              question: "Anything that would make or break it?",
              help: "We check the listing against it and say what it doesn't settle.",
              required: false,
              size: "long",
              placeholder: "A room Priya can work in with the door shut. Under 25 minutes to SeaTac.",
            },
          },
        ],
      },
      artifact: {
        enabled: true,
        settings: {
          ...brand,
          contact: { label: "Book a viewing", href: "#contact" },
          step: "listing",
          reveal: true,
          revealTitle: "How this page was made",
          footer: "A buyer's agency in Seattle. Places come from Qloo, matched to what you told us.",
        },
        components: [
          {
            id: "home",
            type: "listing",
            props: {
              step: "listing",
              note: "{{answers.note}}",
              signature: "Jordan Ellis, Fieldhouse Realty",
              link: "See the full listing",
            },
          },
          { id: "fit", type: "fit", props: { heading: "How it fits", tradeoffs: true, prompt: "", skills: [] } },
          {
            id: "regulars",
            type: "regulars",
            props: { lookups: places, heading: "Your regulars, from this front door", count: 5, step: "listing", prompt: "", skills: [] },
          },
          { id: "rooms", type: "rooms", props: { heading: "Your week, room by room", count: 4, prompt: "", skills: [] } },
          {
            id: "saturday",
            type: "day",
            props: {
              lookups: places,
              heading: "A Saturday from the front door",
              stops: 4,
              step: "listing",
              prompt: "Start and end at the house. Work around naps, the market and early nights if they mentioned them.",
              skills: [],
            },
          },
          { id: "where", type: "map", props: { step: "listing", heading: "Where it is", zoom: "street" } },
          {
            id: "contact",
            type: "agent",
            props: {
              step: "listing",
              heading: "Want to walk through it, {{first_name}}?",
              message: "Reply to this email or book a time, and I'll get you in this week. Bring the questions this page didn't answer.",
              photo: "",
              name: "Jordan Ellis",
              role: "Buyer's agent, Fieldhouse Realty",
              email: "jordan@fieldhouse.example",
              phone: "+1 206 555 0134",
              button: "Book a viewing",
            },
          },
        ],
      },
    },
  },
});
