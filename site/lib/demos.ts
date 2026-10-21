/**
 * The six example experiences on the home page. Every fact comes from a
 * real run in the demo-experiences workspace on demo.loro.sh: the answers,
 * each run step's message, Qloo's matches (an outcome's stand-ins,
 * or a pick and the favourites it came from) and the outcome's own copy.
 * Screenshots in public/demos are captures of those pages.
 *
 * Prefilled links (?profile=) send that example person's sign-up and
 * answers, from the worker catalogue's `samples`, and open the outcome as
 * it's made (&skip=1). Each visit makes a new run. Without &skip=1 the
 * start page and questions show filled in, to click through. Experiences
 * started by API skip too, standing in for the box office or the CRM.
 */
/** One step of an experience, drawn as a small preview with a line about what happened. */
export type FunnelStep = { title: string; detail: string } & (
  | { kind: "landing"; src: string }
  | { kind: "intake"; count: string; question: string; answer: string }
  | { kind: "personalise"; log: { label: string; message: string }[] }
  | { kind: "outcome"; headline: string; stats: string[] }
  | { kind: "trigger"; source: string; endpoint: string; body: [key: string, value: string][] }
  | { kind: "email"; from: string; subject: string; body: string; cta: string }
);

export type Demo = {
  id: string;
  industry: string;
  /** Where it sits in the customer's relationship with the brand. */
  moment: string;
  useCase: string;
  brand: string;
  brandNote: string;
  summary: string;
  /** What the person's page gives them, each true of the run shown. */
  features: string[];
  why: string;
  qloo: string;
  /** What the person named, and what Qloo found near the brand because of it. */
  matches: { from: string; to: string; where?: string }[];
  /** A sign-up on the brand's own page, or another system calling the API. */
  start: "signup" | "api";
  steps: FunnelStep[];
  /** A line under the steps, when the experience can also start another way. */
  note?: string;
  /** The brand's colour, from its theme. */
  swatch: string;
  /** Text on the swatch, when white doesn't read on it. */
  swatchInk?: string;
  /** The outcome card's colours, when a gradient of the swatch doesn't look like the page. */
  outcomeLook?: { bar: string; barInk: string; hero: string; heroInk: string; pop?: boolean };
  outcome: { src: string; url: string; alt: string };
  /** The public start page, or null when another system starts every run. */
  tryUrl: string | null;
  tryNote?: string;
  /** A new outcome for an example person, made live as it opens, or null with no sample. */
  prefillUrl: string | null;
  /** Who the prefilled run is for, when it isn't the first example person. */
  prefillName?: string;
  examples: { name: string; context: string; taste: string[]; href: string }[];
};

const ws = "https://demo.loro.sh/f/demo-experiences";
const run = (slug: string, id: string) => `${ws}/${slug}/g/${id}`;
// What the browser frame shows: the host and the experience, without the workspace and run id.
const bare = (url: string) => url.replace(/^https:\/\/([^/]+)\/f\/[^/]+\/([^/]+).*$/, "$1/$2");

const roadtrip = run("mirage-valley-road-trip", "gen-9f3e43e4-19f");
const stay = run("your-stay", "gen-b49ae69d-ac2");
const agency = run("buyer-match", "gen-14539aa6-d8a");
const listing = run("2-3768-west-2nd-avenue", "gen-200a5491-c6f");
const date = run("first-date", "gen-979710a6-454");
const month = run("your-month", "gen-239fac31-461");

export const demos: Demo[] = [
  {
    id: "mirage-valley",
    industry: "Music Festival",
    moment: "After the Ticket Sale",
    useCase: "The Road Trip to the Festival",
    brand: "Mirage Valley",
    brandNote: "a made-up three-day festival in Indio, California",
    summary:
      "Ticket holders say where they’re driving from, who they’re coming to see and what they stop for. Their page plans the road down and the weekend after it.",
    features: [
      "The drive split into days, with a stop for every meal",
      "A road mix built from what they play in the car",
      "The festival’s bill ranked against their favourites, with four must-sees",
    ],
    why: "A festival sells the ticket, then goes quiet until the gates open. Theo still has 1,091 miles to drive from Portland.",
    qloo: "Qloo matches the acts each person names to cafés, galleries and bars near the route, then ranks the festival’s bill against them.",
    matches: [
      { from: "Neil Young, Fleetwood Mac, Bon Iver", to: "Seven Suns Coffee & Cafe", where: "Mount Shasta, CA" },
      { from: "Bon Iver, Khruangbin, The National", to: "John Natsoulas Gallery", where: "Davis, CA" },
      { from: "Big Thief, Neil Young, Khruangbin", to: "Neil’s Lounge", where: "Indio, CA" },
    ],
    start: "signup",
    steps: [
      {
        kind: "landing",
        title: "Landing Page",
        detail: "The festival’s page: a first name and an email to plan the drive",
        src: "/demos/roadtrip-start.jpg",
      },
      {
        kind: "intake",
        title: "Intake Form",
        detail: "Where they start, who they’re coming to see and what they stop for",
        count: "Eight questions",
        question: "Where are you driving from?",
        answer: "Portland, OR",
      },
      {
        kind: "personalise",
        title: "Personalise",
        detail: "Taste first, then the route and the bill",
        log: [
          { label: "Reading your taste", message: "Matched 7, found 20 picks" },
          { label: "Route", message: "1,091 mi · 39 places" },
          { label: "Lineup", message: "36 acts · 4 must-sees" },
        ],
      },
      {
        kind: "outcome",
        title: "Branded Outcome",
        detail: "The route, a stop for each meal, a road mix, then the weekend set by set",
        headline: "Theo’s road to the desert",
        stats: ["1,091 mi", "3 days", "9 stops"],
      },
    ],
    swatch: "#e0603a",
    // Desert: the plum bar and the dusk sky, plum into magenta.
    outcomeLook: {
      bar: "#3a1c40",
      barInk: "#f6ecdf",
      hero: "linear-gradient(175deg, #3f1f4b 0%, #6d2a64 55%, #a23f72 100%)",
      heroInk: "#fdf6ec",
    },
    outcome: { src: "/demos/roadtrip-outcome.jpg", url: bare(roadtrip), alt: "Theo’s road trip page from Mirage Valley" },
    tryUrl: `${ws}/mirage-valley-road-trip`,
    prefillUrl: `${ws}/mirage-valley-road-trip?profile=theo&skip=1`,
    examples: [
      { name: "Theo Lindqvist", context: "Driving from Portland, OR", taste: ["Bon Iver", "Fleet Foxes", "Khruangbin"], href: roadtrip },
      {
        name: "Nadia Okafor",
        context: "Driving from San Francisco",
        taste: ["Kaytranada", "Channel Tres", "Little Simz"],
        href: run("mirage-valley-road-trip", "gen-3155c800-f1f"),
      },
    ],
  },
  {
    id: "harbour-grey",
    industry: "Real Estate",
    moment: "On the Listing Page",
    useCase: "A Buyer’s Week in the Home",
    brand: "Harbour & Grey",
    brandNote: "a made-up agency selling 2-3768 West 2nd Avenue in Vancouver",
    summary:
      "Buyers sign up on the listing and answer nine questions about how they live. Their page shows the week they’d have from its front door.",
    features: [
      "How the house fits their week, room by room",
      "New regulars near the house, in place of their old ones",
      "Their must-have, checked against the listing",
    ],
    why: "A listing shows the rooms. A buyer wants to know where they’d get coffee on a Tuesday.",
    qloo: "Qloo matches the places a buyer goes to now, wherever they live, to places near the house.",
    matches: [
      { from: "Victrola Coffee", to: "Storm City Coffee", where: "Kitsilano" },
      { from: "Canlis", to: "The Galley Patio & Grill", where: "West Point Grey" },
      { from: "Canon", to: "The Fringe Café", where: "Kitsilano" },
    ],
    start: "signup",
    steps: [
      {
        kind: "landing",
        title: "Landing Page",
        detail: "The listing itself: “See your week here”",
        src: "/demos/property-start.jpg",
      },
      {
        kind: "intake",
        title: "Intake Form",
        detail: "Who’d live there, their mornings and weekends, and their regulars",
        count: "Nine questions",
        question: "Which cafés, restaurants or bars are your regulars?",
        answer: "In Seattle: Victrola Coffee, Canlis for anniversaries, Canon for cocktails",
      },
      {
        kind: "personalise",
        title: "Personalise",
        detail: "Every pick searched around the house",
        log: [
          { label: "Reading your taste", message: "Matched 4, found 32 picks" },
          { label: "How it fits", message: "Three storeys, two decks" },
          { label: "Your new regulars", message: "Five places from the door" },
        ],
      },
      {
        kind: "outcome",
        title: "Branded Outcome",
        detail: "How the house fits, their new regulars, and a Saturday from the front door",
        headline: "Your week at West 2nd, Sam",
        stats: ["$3,968,000", "3 bed", "5 bath"],
      },
    ],
    swatch: "#111111",
    outcome: { src: "/demos/property-outcome.jpg", url: bare(listing), alt: "Sam’s page from Harbour & Grey for 2-3768 West 2nd Avenue" },
    tryUrl: `${ws}/2-3768-west-2nd-avenue`,
    prefillUrl: `${ws}/2-3768-west-2nd-avenue?profile=sam&skip=1`,
    examples: [
      {
        name: "Sam Okoro",
        context: "Two of them and a dog, from Seattle",
        taste: ["Victrola Coffee", "Canlis", "Fleet Foxes"],
        href: listing,
      },
      {
        name: "Hannah Whitlock",
        context: "A family with kids, from London",
        taste: ["Monmouth Coffee", "Barrafina", "Nick Drake"],
        href: run("2-3768-west-2nd-avenue", "gen-b9e41750-56c"),
      },
    ],
  },
  {
    id: "low-tide-house",
    industry: "Holiday Rental",
    moment: "After the Booking",
    useCase: "The Stay, Planned Before Check-In",
    brand: "Low Tide House",
    brandNote: "a made-up dog-friendly cottage in Carmel-by-the-Sea",
    summary:
      "Guests answer ten questions about the trip, their dog and the places they love at home. Their page plans each day, from the first dinner to the last coffee.",
    features: [
      "A note from the hosts that knows the dog by name",
      "Beaches and tables where the dog can come too",
      "Local stand-ins for the cafés and bars they love at home",
    ],
    why: "A booking confirmation has the address and the check-in time. The guest still has to work out a town they don’t know, with a dog.",
    qloo: "Qloo swaps each guest’s regulars at home for places a walk or a short drive from the house.",
    matches: [
      { from: "Sightglass", to: "Carmel Valley Coffee Roasting Co" },
      { from: "Zuni Café", to: "Mission Bistro" },
      { from: "Smuggler’s Cove", to: "Albatross Ridge Tasting Room" },
    ],
    start: "signup",
    steps: [
      {
        kind: "landing",
        title: "Landing Page",
        detail: "The house’s page: “Plan your days before you pack”",
        src: "/demos/stay-start.jpg",
      },
      {
        kind: "intake",
        title: "Intake Form",
        detail: "The trip, the dog, and the cafés and bars they go back to",
        count: "Ten questions",
        question: "Which cafés, restaurants and bars do you go back to?",
        answer: "Sightglass for coffee, Zuni Café for birthdays, Smuggler’s Cove",
      },
      {
        kind: "personalise",
        title: "Personalise",
        detail: "Every pick searched around the house",
        log: [
          { label: "Reading your taste", message: "Matched 5, found 53 picks" },
          { label: "Your days", message: "Friday to Monday" },
          { label: "Your locals", message: "Four places near the house" },
        ],
      },
      {
        kind: "outcome",
        title: "Branded Outcome",
        detail: "A note from the hosts, each day planned, and music for the drive",
        headline: "Your days in Carmel, Emma",
        stats: ["Friday", "3 nights", "4 locals"],
      },
    ],
    note: "The booking system can skip the form: after a booking it sends the same answers by API, as it did for Emma.",
    swatch: "#9c9a81",
    outcome: { src: "/demos/stay-outcome.jpg", url: bare(stay), alt: "Emma’s stay page from Low Tide House" },
    tryUrl: `${ws}/plan-your-stay`,
    prefillUrl: `${ws}/plan-your-stay?profile=emma&skip=1`,
    examples: [
      { name: "Emma Collins", context: "Three nights with Juniper, a lab", taste: ["Sightglass", "Zuni Café", "Khruangbin"], href: stay },
      {
        name: "Raj Mehta",
        context: "Four nights, two kids and Biscuit",
        taste: ["Blue Bottle", "Tartine", "Paul Simon"],
        href: run("your-stay", "gen-17267e85-479"),
      },
    ],
  },
  {
    id: "fieldhouse-realty",
    industry: "Buyer’s Agency",
    moment: "When the Agent Finds a Home",
    useCase: "The Home, and the Life Around It",
    brand: "Fieldhouse Realty",
    brandNote: "a made-up buyer’s agency in Seattle",
    summary:
      "An agent finds a home for a buyer and starts the page from the CRM, with the listing link and a few lines about the buyer’s week.",
    features: [
      "The home read from its link: price, rooms and photos",
      "The agent’s own note, signed, next to the home",
      "What the listing doesn’t settle, flagged for the viewing",
    ],
    why: "The agent knows the family: two kids, daycare drop-off at 8, a commute to SeaTac. A listing link shows none of that.",
    qloo: "Qloo finds places near the house that stand in for the ones the buyer goes to now.",
    matches: [
      { from: "Brunch at Portage Bay Cafe", to: "Seattle Biscuit Company" },
      { from: "Sundays at Green Lake", to: "Sunset Hill Park" },
    ],
    start: "api",
    steps: [
      {
        kind: "trigger",
        title: "API Trigger",
        detail: "The listing link, the agent’s note and the buyer’s week",
        source: "The agent’s CRM",
        endpoint: "POST …/buyer-match/trigger",
        body: [
          ["link", "coldwellbankerhomes.com/wa/seattle/6710-3rd-ave-nw/…"],
          ["week", "Priya works from home three days a week…"],
          ["favourites", "Herkimer Coffee, brunch at Portage Bay Cafe…"],
        ],
      },
      {
        kind: "personalise",
        title: "Personalise",
        detail: "The listing first, so Qloo searches around the house",
        log: [
          { label: "Listing", message: "$929,000 · 8 photos" },
          { label: "Reading your taste", message: "Matched 3, found 41 picks" },
          { label: "Your regulars", message: "Five from the front door" },
        ],
      },
      {
        kind: "outcome",
        title: "Branded Outcome",
        detail: "How the house fits their week, their regulars from the front door, and a Saturday",
        headline: "6710 3rd Ave NW",
        stats: ["$929,000", "3 bed", "2 bath"],
      },
      {
        kind: "email",
        title: "Sent by the Agent",
        detail: "A webhook hands the page back to the CRM, and the agent emails it",
        from: "Jordan Ellis, Fieldhouse Realty",
        subject: "6710 3rd Ave NW",
        body: "This came up this morning and I thought of you both: the fenced yard, and Green Lake a walk away.",
        cta: "See the home",
      },
    ],
    swatch: "#34465a",
    outcome: { src: "/demos/agency-outcome.jpg", url: bare(agency), alt: "Priya’s page from Fieldhouse Realty for 6710 3rd Ave NW" },
    tryUrl: null,
    tryNote:
      "No public form: the agent starts each page from the CRM. Run as Lena sends what the CRM would for a family moving from Seattle, with a live listing in Point Grey, Vancouver.",
    prefillUrl: `${ws}/buyer-match?profile=lena&skip=1`,
    prefillName: "Lena",
    examples: [
      {
        name: "Priya Shah",
        context: "A young family, 6710 3rd Ave NW",
        taste: ["Herkimer Coffee", "Portage Bay Cafe", "Khruangbin"],
        href: agency,
      },
      {
        name: "Daniel Cho",
        context: "A nurse on nights, 12038 N Park Ave N",
        taste: ["Elm Coffee Roasters", "Paseo", "Fleet Foxes"],
        href: run("buyer-match", "gen-c8805cd5-a4a"),
      },
    ],
  },
  {
    id: "the-wren",
    industry: "Live Venue",
    moment: "Between Shows",
    useCase: "Every Show This Month, Ranked for One Regular",
    brand: "The Wren",
    brandNote: "a made-up 1931 picture house on Main Street in Vancouver",
    summary:
      "After a ticket sale, the box office sends Loro what the person plays and what they’ve seen here. Their page ranks the next four weeks of shows against it and picks their nights.",
    features: [
      "Four nights picked from 24 shows, with a calendar file",
      "One show they wouldn’t pick, a step from what they love",
      "Dinner before doors, a minute’s walk down Main Street",
    ],
    why: "A venue’s newsletter sends everyone the same 24 shows. Imogen only goes out on weeknights and Sundays, for films and podcasts.",
    qloo: "Qloo scores the band, film or podcast behind every show against what each person names, then finds dinner a walk from the doors.",
    matches: [
      { from: "Stop Making Sense, Cocteau Twins", to: "Once in a Lifetime: a Talking Heads night", where: "Dance night, October 24" },
      { from: "Song Exploder, Stop Making Sense", to: "Tig Notaro", where: "Comedy, November 3" },
      { from: "In the Mood for Love, Past Lives", to: "Zakkushi Dining on Main", where: "Riley Park, 3 min walk" },
    ],
    start: "api",
    steps: [
      {
        kind: "trigger",
        title: "API Trigger",
        detail: "What they play, the films they love and what they’ve seen here",
        source: "The box office, on a ticket sale",
        endpoint: "POST …/your-month/trigger",
        body: [
          ["taste", "Arooj Aftab, Nils Frahm, Cocteau Twins…"],
          ["films", "In the Mood for Love, Paris, Texas…"],
          ["seen", "Stop Making Sense"],
        ],
      },
      {
        kind: "personalise",
        title: "Personalise",
        detail: "Every show on the calendar ranked in Qloo",
        log: [
          { label: "Reading your taste", message: "Matched 8, found 13 picks" },
          { label: "What’s On", message: "24 shows · 19 ranked for you" },
          { label: "Your nights", message: "Four of the 24 shows" },
        ],
      },
      {
        kind: "outcome",
        title: "Branded Outcome",
        detail: "Their nights, the whole month on a calendar, and dinner before doors",
        headline: "Your month at The Wren",
        stats: ["24 shows", "4 for you", "4 weeks"],
      },
      {
        kind: "email",
        title: "Sent by the Box Office",
        detail: "The trigger’s response has the page link, so the box office sends it on",
        from: "The Wren",
        subject: "Your month at The Wren",
        body: "Every show on in the next four weeks, ranked against what you love. Yours first.",
        cta: "See your nights",
      },
    ],
    note: "People who find The Wren on their own answer the same six questions on its page, as Tess did.",
    swatch: "#ff3e8a",
    swatchInk: "#151215",
    outcome: { src: "/demos/venue-outcome.jpg", url: bare(month), alt: "Imogen’s month at The Wren" },
    tryUrl: `${ws}/find-my-nights`,
    prefillUrl: `${ws}/your-month?profile=imogen&skip=1`,
    examples: [
      {
        name: "Imogen Hart",
        context: "Films and podcasts, weeknights and Sundays",
        taste: ["In the Mood for Love", "Song Exploder", "Arooj Aftab"],
        href: month,
      },
      {
        name: "Kofi Mensah",
        context: "Gigs and dance nights, Fridays and Saturdays",
        taste: ["Ezra Collective", "Erykah Badu", "Do the Right Thing"],
        href: run("your-month", "gen-09e3298e-e5e"),
      },
      {
        name: "Tess Moreau",
        context: "Signed up on The Wren’s page, for gigs and comedy",
        taste: ["Destroyer", "Alvvays", "Big Thief"],
        href: run("find-my-nights", "gen-f0d78e10-d0c"),
      },
    ],
  },
  {
    id: "overlap",
    industry: "Dating App",
    moment: "When Two People Match",
    useCase: "The First Date, Built on Their Favourites",
    brand: "Overlap",
    brandNote: "a made-up dating app",
    summary:
      "When two people match, the app sends Loro where and when they’re meeting and both people’s favourites. The page plans four hours around the match’s favourites.",
    features: [
      "Where their favourites overlap, in one line",
      "Four stops a short walk apart, with a map",
      "A text to send them, written from the plan",
    ],
    why: "Most dating apps stop at the match. The date is the part they never see.",
    qloo: "Qloo weighs Ben’s favourites three times as heavily as Priyanka’s, so every stop starts from what he loves.",
    matches: [
      { from: "Rain or Shine Ice Cream, Kinfolk, Japanese Breakfast", to: "Coffee Roastery Modus", where: "Mount Pleasant" },
      { from: "Rain or Shine Ice Cream, Mac DeMarco, Japanese Breakfast", to: "Neptoon Records", where: "Main Street" },
    ],
    start: "api",
    steps: [
      {
        kind: "trigger",
        title: "API Trigger",
        detail: "Where and when, and both people’s favourites from their profiles",
        source: "Overlap, on a match",
        endpoint: "POST …/first-date/trigger",
        body: [
          ["match", "Ben"],
          ["where", "Mount Pleasant, Vancouver"],
          ["their_taste", "Mac DeMarco, Kinfolk, Rain or Shine…"],
        ],
      },
      {
        kind: "personalise",
        title: "Personalise",
        detail: "Places a walk apart, weighted towards Ben",
        log: [
          { label: "Reading your taste", message: "Matched 4 favourites" },
          { label: "Date Plan", message: "2 to 6 PM · 16 places" },
          { label: "The plan", message: "Four stops a walk apart" },
        ],
      },
      {
        kind: "outcome",
        title: "Branded Outcome",
        detail: "Where their taste overlaps, the plan stop by stop, and the text to send",
        headline: "Saturday with Ben",
        stats: ["4 stops", "2–6 PM", "On foot"],
      },
      {
        kind: "email",
        title: "Sent in the App",
        detail: "The trigger’s response has the page link, so the app sends it on",
        from: "Overlap",
        subject: "Saturday with Ben",
        body: "Four hours in Mount Pleasant built on what Ben loves. Every stop is a short walk from the last.",
        cta: "See the plan",
      },
    ],
    swatch: "#d10f3f",
    // Pop: the pink hero field, black ink and black rules on cream.
    outcomeLook: { bar: "#fcf7ee", barInk: "#151215", hero: "#fba7d0", heroInk: "#151215", pop: true },
    outcome: { src: "/demos/date-outcome.jpg", url: bare(date), alt: "Priyanka’s first date plan from Overlap" },
    tryUrl: `${ws}/first-date`,
    prefillUrl: `${ws}/first-date?profile=priyanka&skip=1`,
    examples: [
      {
        name: "Priyanka Rao",
        context: "Taking Ben out in Mount Pleasant",
        taste: ["Mac DeMarco", "Kinfolk", "Rain or Shine"],
        href: date,
      },
      {
        name: "Alex Moreno",
        context: "Taking Maya out in the West Village",
        taste: ["Phoebe Bridgers", "In the Mood for Love", "Lucali"],
        href: run("first-date", "gen-b30da67e-488"),
      },
    ],
  },
];
