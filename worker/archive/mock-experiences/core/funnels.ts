/**
 * A funnel is one live experience: a type from experiences/ plus the brand's
 * own start page, intake questions and generation workflow, built around one
 * anchor. The admin calls them experiences.
 *
 * - Start page: the public page at /f/:slug that someone lands on.
 * - Intake: what we ask before generating. Answers can become Qloo signals.
 * - Workflow: the steps that turn a profile and its signals into an artifact.
 *
 * Fixtures until D1 is wired up. Generations come from the profile fixtures,
 * matched on the anchor, so the numbers line up across the admin.
 */
import { type ExperienceStatus, experiencesFor, listIndividuals, type SignalType, type Status } from "./profiles";

export type FunnelStatus = "live" | "draft" | "paused";

export const funnelStatusLabels: Record<FunnelStatus, string> = {
  live: "Live",
  draft: "Draft",
  paused: "Paused",
};

/**
 * Start page sections. Each type lists the ones it supports in a fixed
 * order. `fixed` sections are always shown; the rest can be turned off.
 * Editable sections have fields; the others are filled in from data.
 */
export const sectionKinds = {
  hero: { title: "Hero", description: "Headline, intro and photo.", editable: true },
  details: { title: "Event Details", description: "Date, venue and getting there, from the anchor.", editable: false },
  how: { title: "How It Works", description: "Three short steps, so people know what they'll get.", editable: true },
  sample: { title: "Sample Plan", description: "A recent plan, with the person's details removed.", editable: false },
  products: { title: "Featured Picks", description: "A few products, to show the kind of edit they'll get.", editable: false },
  faq: { title: "Questions", description: "What people ask before they sign up.", editable: true },
  signup: { title: "Sign-Up", description: "The button and what we ask for.", editable: true },
  footer: { title: "Footer", description: "Brand name and small print.", editable: true },
} as const;
export type SectionId = keyof typeof sectionKinds;

type SectionSpec = { id: SectionId; fixed?: true };

/**
 * Experience types a funnel can be built on. Only Itinerary has a folder so far.
 *
 * Public types have a start page and intake, so people sign themselves up.
 * Internal types have neither: your team (or the API) creates one for a
 * person from their profile, and the result goes to them as a private link.
 */
export const funnelTypes: Record<
  "itinerary" | "concierge" | "guide" | "edit",
  { name: string; description: string; example: string; internal?: true; sections: SectionSpec[] }
> = {
  itinerary: {
    name: "Itinerary",
    description: "A day-by-day plan built around one event, with places to eat, shop and go after.",
    example: "Saturday · 11:00 Migas tacos · 13:30 Waterloo Records",
    sections: [
      { id: "hero", fixed: true },
      { id: "details" },
      { id: "how" },
      { id: "sample" },
      { id: "faq" },
      { id: "signup", fixed: true },
      { id: "footer", fixed: true },
    ],
  },
  concierge: {
    name: "Concierge Plan",
    description: "Made by your team for one guest, from their profile, and sent as a private link.",
    example: "Dinner at Suerte, then up to the suite",
    internal: true,
    sections: [],
  },
  guide: {
    name: "Neighbourhood Guide",
    description: "The streets, spots and routines around one address, made by an agent for one buyer.",
    example: "Your coffee, your park, your Friday dinner",
    internal: true,
    sections: [],
  },
  edit: {
    name: "Gift Edit",
    description: "A short list of products picked for one person, with why each one fits.",
    example: "Six picks for someone who loves Khruangbin",
    sections: [
      { id: "hero", fixed: true },
      { id: "products" },
      { id: "how" },
      { id: "faq" },
      { id: "signup", fixed: true },
      { id: "footer", fixed: true },
    ],
  },
};
export type FunnelType = keyof typeof funnelTypes;

/** No start page or intake: created for someone, not signed up for. */
export function isInternal(type: FunnelType) {
  return Boolean(funnelTypes[type].internal);
}

export const questionKinds = {
  short_text: "Short answer",
  long_text: "Paragraph",
  single: "One choice",
  multi: "Multiple choice",
  taste: "Taste picker",
  date: "Date",
} as const;
export type QuestionKind = keyof typeof questionKinds;

export type Question = {
  id: string;
  kind: QuestionKind;
  prompt: string;
  help: string;
  options: string[];
  required: boolean;
  /** Answers are looked up on Qloo and added to the person's signals. */
  signal: SignalType | null;
};

export type StepKind =
  | "trigger"
  | "profile"
  | "taste"
  | "recommend"
  | "skills"
  | "write"
  | "review"
  | "deliver";

export const stepKinds: Record<StepKind, { title: string; description: string }> = {
  trigger: { title: "Start", description: "When a person enters the workflow." },
  profile: { title: "Read Profile", description: "Merge intake answers with their segment." },
  taste: { title: "Taste Profile", description: "Ask Qloo what their signals say about them." },
  recommend: { title: "Find Places", description: "Qloo recommendations near the anchor." },
  skills: { title: "Apply Skills", description: "Pick the Context skills that fit." },
  write: { title: "Write", description: "Draft the artifact from everything above." },
  review: { title: "Owner Review", description: "Hold for approval before sending." },
  deliver: { title: "Deliver", description: "Send the link to the person." },
};

export type Step = {
  id: string;
  kind: StepKind;
  enabled: boolean;
  /** One line shown under the title, summarising the settings. */
  summary: string;
  settings: Record<string, string | number | boolean>;
};

export type StartPage = {
  /** On or off for each optional section. Fixed sections ignore it. */
  sections: Partial<Record<SectionId, boolean>>;
  // Hero
  eyebrow: string;
  headline: string;
  body: string;
  image: string;
  showAnchor: boolean;
  // Event details, from the anchor
  doors: string;
  address: string;
  // How it works
  how: string[];
  // Sample plan, from a recent generation
  sample: { title: string; stops: { time: string; name: string; note: string }[] };
  faq: { question: string; answer: string }[];
  // Sign-up
  button: string;
  askEmail: boolean;
  askPhone: boolean;
  // Footer
  brand: string;
  smallPrint: string;
};

export type Funnel = {
  slug: string;
  name: string;
  type: FunnelType;
  status: FunnelStatus;
  anchor: { name: string; date: string; place: string };
  segmentId: string | null;
  updated: string;
  /** For internal types, only the image and headline are used, as the card cover. */
  start: StartPage;
  intakeMode: "form" | "chat";
  intake: Question[];
  steps: Step[];
  /** Page loads for the last 30 days. Generations are counted from profiles. */
  views: number;
  intakeStarted: number;
  /** Internal types: how many your team created in the last 30 days. */
  created?: number;
  /** Internal types: their own generations, since they don't share an anchor's. */
  generations?: (NonNullable<FunnelPerson["generation"]> & { personId: string })[];
  /** Bumped each time the workflow is saved. */
  version: number;
};

/** Seeded placeholder photos until R2 holds real ones. */
const photo = (seed: string, width = 1600, height = 1067) =>
  `https://picsum.photos/seed/loro-${seed}/${width}/${height}`;

const austinQuestions: Question[] = [
  {
    id: "why",
    kind: "long_text",
    prompt: "What's bringing you to Austin?",
    help: "The show, a birthday, a long weekend. Anything helps.",
    options: [],
    required: true,
    signal: null,
  },
  {
    id: "who",
    kind: "single",
    prompt: "Who's coming with you?",
    help: "",
    options: ["Just me", "My partner", "Friends", "Family"],
    required: true,
    signal: null,
  },
  {
    id: "love",
    kind: "taste",
    prompt: "Name a few artists, places or films you love",
    help: "We use these to find spots that match your taste, not just what's popular.",
    options: [],
    required: false,
    signal: "artist",
  },
  {
    id: "night",
    kind: "long_text",
    prompt: "What does a perfect night out look like?",
    help: "",
    options: [],
    required: false,
    signal: null,
  },
  {
    id: "avoid",
    kind: "short_text",
    prompt: "Anything we should steer you away from?",
    help: "Crowds, cover charges, dietary needs.",
    options: [],
    required: false,
    signal: null,
  },
];

function itinerarySteps(anchorPlace: string, review: boolean): Step[] {
  return [
    {
      id: "trigger",
      kind: "trigger",
      enabled: true,
      summary: "Intake finished, or a ticket order arrives by API",
      settings: { onIntake: true, onApi: true, onOwner: true },
    },
    {
      id: "profile",
      kind: "profile",
      enabled: true,
      summary: "Answers layered on top of their segment",
      settings: { includeSegment: true, includeNotes: true },
    },
    {
      id: "taste",
      kind: "taste",
      enabled: true,
      summary: "Insights across music, food and places",
      settings: { domains: "music, dining, places", take: 20 },
    },
    {
      id: "recommend",
      kind: "recommend",
      enabled: true,
      summary: `Restaurants, bars and shops within 3 mi of ${anchorPlace}`,
      settings: { categories: "restaurant, bar, record store, coffee", radius: 3, take: 30, minPopularity: 0.2 },
    },
    {
      id: "skills",
      kind: "skills",
      enabled: true,
      summary: "Brand Voice, Getting There and 3 more",
      settings: { auto: true },
    },
    {
      id: "write",
      kind: "write",
      enabled: true,
      summary: "Claude Sonnet 5.5, two days, 4–6 stops a day",
      settings: {
        model: "claude-sonnet-5-5",
        days: 2,
        stops: "4–6",
        brief: "Plan the weekend around the show. Every stop should come from the Qloo results, and say why it fits this person in one sentence.",
      },
    },
    {
      id: "review",
      kind: "review",
      enabled: review,
      summary: review ? "Every generation waits for you" : "Off, sends straight away",
      settings: { notify: "team@moodycenter.com" },
    },
    {
      id: "deliver",
      kind: "deliver",
      enabled: true,
      summary: "Email with a private link",
      settings: { channel: "email", from: "Moody Center", subject: "Your weekend, planned" },
    },
  ];
}

/** Shared start page copy for the Austin shows. */
function austinStart(
  page: Pick<StartPage, "eyebrow" | "headline" | "body" | "button" | "image" | "doors" | "address"> &
    Partial<StartPage>,
): StartPage {
  return {
    sections: { details: true, how: true, sample: true, faq: false },
    showAnchor: true,
    how: [
      "Answer a few questions about how you like to spend a night out.",
      "We match your answers against places across Austin, near the venue.",
      "Your plan arrives by email within a few minutes. It's yours to keep.",
    ],
    sample: {
      title: "Vinyl, mezcal and Khruangbin",
      stops: [
        { time: "13:30", name: "Waterloo Records", note: "Start in the used vinyl, back left." },
        { time: "17:45", name: "Suerte", note: "Early table on East 6th. Order the suadero." },
        { time: "22:40", name: "Nickel City", note: "Ten minutes away, and the band's usually there." },
      ],
    },
    faq: [
      { question: "Is it free?", answer: "Yes, for anyone with a ticket to the show." },
      { question: "What do you do with my answers?", answer: "We use them to write your plan, then keep them so you can ask for a new one. Nothing is sold." },
    ],
    askEmail: true,
    askPhone: false,
    brand: "Moody Center",
    smallPrint: "Recommendations are independent. Some venues are Moody Center partners.",
    ...page,
  };
}

const funnels: Funnel[] = [
  {
    slug: "khruangbin-weekend",
    name: "Khruangbin Weekend",
    type: "itinerary",
    status: "live",
    anchor: { name: "Khruangbin", date: "Sat 14 Nov", place: "Moody Center" },
    segmentId: "live-music-weekenders",
    updated: "Oct 14",
    start: austinStart({
      eyebrow: "Khruangbin · Sat 14 Nov · Moody Center",
      headline: "Your weekend in Austin, built around the show",
      body: "Answer five quick questions and we'll plan where to eat, what to do before doors and where to go after. Free for ticket holders.",
      button: "Plan My Weekend",
      image: photo("moody-center"),
      doors: "Doors 7pm · Show 8:30pm",
      address: "2001 Robert Dedman Dr, Austin",
    }),
    intakeMode: "form",
    intake: austinQuestions,
    steps: itinerarySteps("Moody Center", true),
    views: 4_812,
    intakeStarted: 612,
    version: 12,
  },
  {
    slug: "suite-guests",
    name: "Suite Guests",
    type: "concierge",
    status: "live",
    anchor: { name: "Khruangbin", date: "Sat 14 Nov", place: "Moody Center" },
    segmentId: null,
    updated: "Oct 13",
    start: austinStart({
      eyebrow: "Made for your suite · Sat 14 Nov",
      headline: "Dinner at Suerte, then up to the suite",
      body: "",
      button: "",
      image: photo("suite"),
      doors: "Doors 7pm · Show 8:30pm",
      address: "2001 Robert Dedman Dr, Austin",
    }),
    intakeMode: "form",
    intake: [],
    steps: itinerarySteps("Moody Center", true).map((step) =>
      step.kind === "trigger"
        ? { ...step, summary: "Your team picks a profile, or a suite booking arrives by API", settings: { onIntake: false, onApi: true, onOwner: true } }
        : step,
    ),
    views: 212,
    intakeStarted: 0,
    created: 46,
    generations: [
      { personId: "ines-moreau", id: "exp-2006", title: "A chef's table before the show", status: "review", createdMinutesAgo: 40, opens: 0 },
      { personId: "priya-raman", id: "exp-2005", title: "Three courses and a late set", status: "delivered", createdMinutesAgo: 600, opens: 0 },
      { personId: "jonah-feld", id: "exp-2004", title: "East side dinner, then your suite", status: "opened", createdMinutesAgo: 1300, opens: 3 },
    ],
    version: 3,
  },
  {
    slug: "black-pumas-night-out",
    name: "Black Pumas Night Out",
    type: "itinerary",
    status: "live",
    anchor: { name: "Black Pumas", date: "Fri 4 Dec", place: "Stubb's" },
    segmentId: "locals-night-out",
    updated: "Oct 11",
    start: austinStart({
      eyebrow: "Black Pumas · Fri 4 Dec · Stubb's",
      headline: "Make a night of it on Red River",
      body: "Tell us how you like your Fridays and we'll line up dinner, the show and a late one after.",
      button: "Plan My Night",
      image: photo("south-congress"),
      doors: "Doors 6:30pm · Show 8pm",
      address: "801 Red River St, Austin",
      askPhone: true,
    }),
    intakeMode: "chat",
    intake: austinQuestions.filter((q) => q.id !== "who"),
    steps: itinerarySteps("Stubb's", false),
    views: 1_204,
    intakeStarted: 148,
    version: 7,
  },
  {
    slug: "leon-bridges-sunday",
    name: "Leon Bridges Sunday",
    type: "itinerary",
    status: "paused",
    anchor: { name: "Leon Bridges", date: "Sun 6 Dec", place: "ACL Live" },
    segmentId: "food-first",
    updated: "Oct 6",
    start: austinStart({
      eyebrow: "Leon Bridges · Sun 6 Dec · ACL Live",
      headline: "A long lunch, then Leon Bridges",
      body: "Sunday in Austin, planned around the people you're with and what you like to eat.",
      button: "Plan My Sunday",
      image: photo("san-jose"),
      doors: "Doors 6pm · Show 7:30pm",
      address: "310 W Willie Nelson Blvd, Austin",
    }),
    intakeMode: "form",
    intake: austinQuestions,
    steps: itinerarySteps("ACL Live", true),
    views: 640,
    intakeStarted: 71,
    version: 4,
  },
  {
    slug: "hermanos-gutierrez",
    name: "Hermanos Gutiérrez",
    type: "itinerary",
    status: "draft",
    anchor: { name: "Hermanos Gutiérrez", date: "Sat 9 Jan", place: "Paramount Theatre" },
    segmentId: null,
    updated: "Today",
    start: austinStart({
      eyebrow: "Hermanos Gutiérrez · Sat 9 Jan · Paramount Theatre",
      headline: "Congress Avenue, the slow way",
      body: "A quiet evening downtown before the show. Three questions and we'll do the rest.",
      button: "Get Started",
      image: photo("barton-springs"),
      doors: "Doors 7pm · Show 8pm",
      address: "713 Congress Ave, Austin",
    }),
    intakeMode: "form",
    intake: austinQuestions.slice(0, 3),
    steps: itinerarySteps("Paramount Theatre", true),
    views: 0,
    intakeStarted: 0,
    version: 1,
  },
];

/** A person in a funnel, with their latest generation if there is one. */
export type FunnelPerson = {
  id: string;
  name: string;
  email: string;
  status: Status;
  lastActiveMinutes: number;
  generation: {
    id: string;
    title: string;
    status: ExperienceStatus;
    createdMinutesAgo: number;
    opens: number;
  } | null;
};

export function peopleIn(funnel: Funnel): FunnelPerson[] {
  if (funnel.generations) {
    return funnel.generations.flatMap(({ personId, ...generation }) => {
      const person = listIndividuals().find((p) => p.id === personId);
      if (!person) return [];
      return [{
        id: person.id,
        name: person.name,
        email: person.email,
        status: person.status,
        lastActiveMinutes: generation.createdMinutesAgo,
        generation,
      }];
    });
  }
  return listIndividuals()
    .map((person): FunnelPerson | null => {
      const generation = experiencesFor(person.id).find((g) => g.anchor.name === funnel.anchor.name);
      // People still in intake belong to the main funnel; they have no anchor yet.
      const inIntake = !generation && funnel.slug === funnels[0].slug;
      if (!generation && !inIntake) return null;
      return {
        id: person.id,
        name: person.name,
        email: person.email,
        status: person.status,
        lastActiveMinutes: generation ? generation.createdMinutesAgo : person.lastActiveMinutes,
        generation: generation
          ? {
              id: generation.id,
              title: generation.title,
              status: generation.status,
              createdMinutesAgo: generation.createdMinutesAgo,
              opens: generation.opens,
            }
          : null,
      };
    })
    .filter((person): person is FunnelPerson => person !== null)
    .sort((a, b) => a.lastActiveMinutes - b.lastActiveMinutes);
}

/** Thirty days of generations, ending today, scaled so the total matches. */
export function dailyGenerations(funnel: Funnel, now: Date) {
  const total = funnelStats(funnel).generated;
  const weights = Array.from({ length: 30 }, (_, i) => {
    // Ramps towards the show, with a weekend bump.
    const day = new Date(now.getTime() - (29 - i) * 86_400_000);
    const weekend = day.getUTCDay() === 0 || day.getUTCDay() === 6 ? 1.6 : 1;
    return (0.4 + i / 29) * weekend * (1 + Math.sin(i * 2.3) * 0.25);
  });
  const sum = weights.reduce((a, b) => a + b, 0);
  return weights.map((weight, i) => ({
    date: new Date(now.getTime() - (29 - i) * 86_400_000).toISOString().slice(0, 10),
    generated: total ? Math.round((weight / sum) * total) : 0,
  }));
}

export function funnelStats(funnel: Funnel) {
  const generated = isInternal(funnel.type) ? (funnel.created ?? 0) : Math.round(funnel.intakeStarted * 0.78);
  const finished = Math.round(funnel.intakeStarted * 0.84);
  // Internal ones can wait for review, so not every one is sent yet.
  const sent = isInternal(funnel.type) ? Math.round(generated * 0.91) : generated;
  const opened = Math.round(sent * 0.71);
  return {
    views: funnel.views,
    sent,
    started: funnel.intakeStarted,
    finished,
    generated,
    opened,
    openRate: sent ? opened / sent : 0,
  };
}

export function listFunnels() {
  return funnels.map((funnel) => ({ ...funnel, stats: funnelStats(funnel) }));
}

export function getFunnel(slug: string) {
  return funnels.find((funnel) => funnel.slug === slug);
}

/**
 * Survey responses, collected by email the morning after the event.
 * Fixtures: some respondents have profiles in the fixtures, others are
 * guests further down the list, so they have no profile link.
 */
export const surveyQuestions = [
  "How was the night, out of five?",
  "Which stops did you make it to?",
  "Anything we got wrong?",
];

export type FeedbackResponse = {
  id: string;
  /** Set when the person has a profile in the fixtures. */
  personId: string | null;
  name: string;
  email: string;
  plan: string;
  rating: 1 | 2 | 3 | 4 | 5;
  went: string[];
  comment: string;
  daysAgo: number;
};

const feedback: Record<string, FeedbackResponse[]> = {
  "khruangbin-weekend": [
    { id: "fb-1", personId: "priya-raman", name: "Priya Raman", email: "priya.raman@gmail.com", plan: "Three dinners and a show", rating: 5, went: ["Suerte", "Waterloo Records", "Nickel City"], comment: "Suerte was the best meal of the trip. We'd never have found it on our own.", daysAgo: 1 },
    { id: "fb-2", personId: "marcus-bell", name: "Marcus Bell", email: "mbell@fastmail.com", plan: "A drummer's weekend in Austin", rating: 5, went: ["Waterloo Records", "Continental Club"], comment: "The Continental Club tip made the weekend. Band on at 10:30 exactly like it said.", daysAgo: 1 },
    { id: "fb-3", personId: "ines-moreau", name: "Ines Moreau", email: "ines.moreau@gmail.com", plan: "Where Austin chefs eat on a show night", rating: 4, went: ["Suerte", "Nixta Taqueria"], comment: "Great picks. Nixta had a 40 minute wait though, worth flagging.", daysAgo: 2 },
    { id: "fb-4", personId: null, name: "Dana Whitfield", email: "dana.w@icloud.com", plan: "Records, ramen and a late set", rating: 5, went: ["Ramen Tatsu-Ya", "Waterloo Records", "Hotel Vegas"], comment: "", daysAgo: 2 },
    { id: "fb-5", personId: null, name: "Rafael Ortiz", email: "rafa.ortiz@outlook.com", plan: "Mezcal before doors", rating: 3, went: ["Las Perlas"], comment: "Las Perlas was lovely but closed at 8 on a Sunday, so we missed the second stop.", daysAgo: 3 },
    { id: "fb-6", personId: null, name: "Hannah Cole", email: "hcole@proton.me", plan: "Barton Springs and Khruangbin", rating: 4, went: ["Barton Springs Pool", "Cosmic Coffee"], comment: "Loved the pool. Would've liked a dinner option closer to the venue.", daysAgo: 4 },
    { id: "fb-7", personId: null, name: "Owen Park", email: "owen.park@gmail.com", plan: "First time in Austin, no car", rating: 2, went: ["Veracruz All Natural"], comment: "Two of the stops were a 30 minute walk apart. Said no car needed but we needed one.", daysAgo: 5 },
    { id: "fb-8", personId: null, name: "Sofia Lindgren", email: "sofia@lindgren.co", plan: "A slow Saturday on the east side", rating: 5, went: ["Cosmic Coffee", "Suerte", "Nickel City"], comment: "Felt like a friend planned it.", daysAgo: 6 },
    { id: "fb-9", personId: null, name: "Tom Achebe", email: "tom.achebe@hey.com", plan: "Vinyl and a long lunch", rating: 4, went: ["Waterloo Records", "Joe's Bakery"], comment: "", daysAgo: 8 },
  ],
  "black-pumas-night-out": [
    { id: "fb-20", personId: null, name: "Leah Grant", email: "leah.grant@gmail.com", plan: "Red River, start to finish", rating: 4, went: ["Stubb's BBQ", "Mohawk"], comment: "Mohawk after was perfect.", daysAgo: 3 },
  ],
};

export function feedbackFor(funnel: Funnel) {
  const responses = feedback[funnel.slug] ?? [];
  const stats = funnelStats(funnel);
  // The list is the latest few; totals scale with the funnel's opens.
  const total = Math.max(responses.length, Math.round(stats.opened * 0.21));
  const average = responses.length
    ? responses.reduce((sum, r) => sum + r.rating, 0) / responses.length
    : 0;
  const ratings = ([5, 4, 3, 2, 1] as const).map((rating) => ({
    rating,
    count: responses.filter((r) => r.rating === rating).length,
  }));
  const visits = new Map<string, number>();
  responses.forEach((r) => r.went.forEach((stop) => visits.set(stop, (visits.get(stop) ?? 0) + 1)));
  return {
    responses,
    total,
    rate: stats.opened ? total / stats.opened : 0,
    average,
    fiveStar: responses.length ? responses.filter((r) => r.rating === 5).length / responses.length : 0,
    ratings,
    topStops: [...visits.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5),
  };
}

/** What each step reports when the workflow runs. Mocked until it's connected. */
export const sampleRun: Record<StepKind, { output: string; seconds: number }> = {
  trigger: { output: "Profile picked by your team", seconds: 0.1 },
  profile: { output: "4 answers, segment Live music weekenders, 8 signals", seconds: 0.2 },
  taste: { output: "Hermanos Gutiérrez, Del Maguey, Waterloo Records and 17 more", seconds: 1.4 },
  recommend: { output: "30 places, led by Suerte, Nickel City and Hotel Vegas", seconds: 2.1 },
  skills: { output: "Brand Voice, Pre-Show Dinner, Getting There, Steer Clear", seconds: 0.3 },
  write: { output: "“Vinyl, mezcal and Khruangbin”, 2 days, 11 stops", seconds: 8.6 },
  review: { output: "Held for review", seconds: 0.1 },
  deliver: { output: "Saved to their profile", seconds: 0.1 },
};

/**
 * Tests run the whole workflow for a real profile without sending. Notes
 * left on a test are read by the agent, which turns patterns across notes
 * and survey feedback into suggested workflow changes.
 */
export type Verdict = "good" | "needs_work";

export type TestRun = {
  id: string;
  personId: string;
  person: string;
  version: number;
  minutesAgo: number;
  seconds: number;
  title: string;
  verdict: Verdict | null;
  note: string;
};

export type SuggestionStatus = "open" | "applied" | "dismissed";

export type Suggestion = {
  id: string;
  title: string;
  step: StepKind;
  /** The change, as it would read in the step's settings. */
  change: string;
  /** What the agent read to come up with it. */
  sources: string[];
  status: SuggestionStatus;
  appliedIn?: number;
};

const tests: Record<string, TestRun[]> = {
  "khruangbin-weekend": [
    { id: "t-6", personId: "maya-okafor", person: "Maya Okafor", version: 12, minutesAgo: 25, seconds: 11.8, title: "Vinyl, mezcal and Khruangbin", verdict: "good", note: "Spot on. The mezcal bar is exactly her." },
    { id: "t-5", personId: "theo-lindqvist", person: "Theo Lindqvist", version: 12, minutesAgo: 190, seconds: 12.4, title: "Your first Austin weekend, no car needed", verdict: "needs_work", note: "Barton Springs to Moody Center is a 40 minute walk, and he said no car." },
    { id: "t-4", personId: "kofi-mensah", person: "Kofi Mensah", version: 11, minutesAgo: 1500, seconds: 10.9, title: "Ramen, Khruangbin, home by one", verdict: "good", note: "" },
    { id: "t-3", personId: "lena-brandt", person: "Lena Brandt", version: 11, minutesAgo: 2900, seconds: 13.1, title: "Beer gardens, Barton Springs and Khruangbin", verdict: "needs_work", note: "Las Perlas closes at 8 on Sundays. The plan sends her there at 9." },
    { id: "t-2", personId: "marcus-bell", person: "Marcus Bell", version: 10, minutesAgo: 5800, seconds: 12.0, title: "A drummer's weekend in Austin", verdict: "needs_work", note: "Three record shops on Saturday. One is plenty." },
    { id: "t-1", personId: "priya-raman", person: "Priya Raman", version: 10, minutesAgo: 7300, seconds: 11.2, title: "Three dinners and a show", verdict: "good", note: "" },
  ],
};

const suggestions: Record<string, Suggestion[]> = {
  "khruangbin-weekend": [
    {
      id: "s-3",
      title: "Keep stops walkable when there's no car",
      step: "recommend",
      change: "Radius 3 mi → 1.5 mi when intake says no car",
      sources: ["Note on Theo's test", "Survey from Owen Park, 2 stars"],
      status: "open",
    },
    {
      id: "s-2",
      title: "Check opening hours for the time of the stop",
      step: "recommend",
      change: "Only places open at the planned time",
      sources: ["Note on Lena's test", "Survey from Rafael Ortiz, 3 stars"],
      status: "open",
    },
    {
      id: "s-1",
      title: "One stop of each kind per day",
      step: "write",
      change: "Brief adds: no more than one record shop a day",
      sources: ["Note on Marcus's test"],
      status: "applied",
      appliedIn: 11,
    },
  ],
};

export function testsFor(funnel: Funnel) {
  return { runs: tests[funnel.slug] ?? [], suggestions: suggestions[funnel.slug] ?? [] };
}
