/**
 * One home for sale, matched to one buyer's life. The start page is the
 * listing, set like a single-home site; the questions ask how they live
 * (mornings, work, weekends, the places they love now) beside photos of
 * the house; the outcome says how the home fits and finds their new
 * regulars near it, each standing in for a place they named.
 *
 * The home is fixed per experience: its facts sit in the start page's
 * props and in the workflow prompt, and every lookup searches around its
 * point (lat, lng), since Qloo doesn't know a house for sale by address.
 *
 * The example's skills (agency voice, honesty about the house, pointing
 * at real places, Canadian English) are the Harbour & Grey workspace's;
 * in another workspace, ids it doesn't have are left out of the run.
 */
import { defineCatalogue } from "@core/catalogue/define";
import { artifactComponents, artifactLayout } from "./artifact";
import { intakeComponents, intakeLayout } from "./intake";
import { startComponents, startLayout } from "./start";

// The example listing: 2-3768 W 2nd Avenue, Vancouver, as listed on REW.
const photo = (id: string, w = 1600) =>
  `https://assets-listings.rew.ca/listing/brc_idx_rew/263183799/00_${id}.jpeg?auto=format&fit=crop&w=${w}&h=${Math.round(w * 0.667)}`;
const tall = (id: string, w = 1200) =>
  `https://assets-listings.rew.ca/listing/brc_idx_rew/263183799/00_${id}.jpeg?auto=format&fit=crop&w=${w}&h=${Math.round(w * 1.25)}`;
const photos = {
  front: photo("02ea1450a0e7bb93792e01d29b8e81c3", 2400),
  door: photo("2f64aa2d8098f92eeae29b44497e0ecf", 1200),
  patio: photo("018d605185c4541d635d34e4e9bb476b", 1200),
  dining: photo("74d6f01cb3c45cb50a27feb78d606109", 1200),
  kitchen: photo("8bb2d6ace7f18988ff55b30f9fc7898c", 1200),
  island: photo("3e4c8545b86b86eea072603bedf1fa1c", 1200),
  living: photo("276b3321a4f30d01e6ed7dd51ed378ba", 1200),
  family: photo("3ac13f9e1d29fdc8e4160f99fec0f9ac", 1200),
  primary: photo("5b0217fa1eb568f99e45bb4ec054e1de", 1200),
  ensuite: photo("600963b878a29b8b299822f866049d1f", 1200),
  bedroom: photo("35ff93ffd1fab90a69ef4e430d0ae7d9", 1200),
  rec: photo("2ecc4b6850c68a4a5f81b167c8d6d217", 1200),
  deck: photo("164e472a6d8da4535f2f0800cf62e20a", 2400),
  deckView: photo("a23da68256565f370ccf5147cf37e170", 1200),
  yard: photo("79e18ffc7dcc38745c98b04c7cbd222a", 1200),
  view: photo("7a9ed0213a09f76f4b8fe4ac3402f3bf", 2400),
  back: photo("b0f5f1ca6c12c5e9d2b57139c90de6af", 1200),
};
const portrait = {
  door: tall("2f64aa2d8098f92eeae29b44497e0ecf"),
  island: tall("3e4c8545b86b86eea072603bedf1fa1c"),
  ensuite: tall("600963b878a29b8b299822f866049d1f"),
  front: tall("02ea1450a0e7bb93792e01d29b8e81c3"),
  kitchen: tall("8bb2d6ace7f18988ff55b30f9fc7898c"),
  living: tall("276b3321a4f30d01e6ed7dd51ed378ba"),
  family: tall("3ac13f9e1d29fdc8e4160f99fec0f9ac"),
  yard: tall("79e18ffc7dcc38745c98b04c7cbd222a"),
  dining: tall("74d6f01cb3c45cb50a27feb78d606109"),
  view: tall("7a9ed0213a09f76f4b8fe4ac3402f3bf"),
  rec: tall("2ecc4b6850c68a4a5f81b167c8d6d217"),
  deck: tall("164e472a6d8da4535f2f0800cf62e20a"),
  primary: tall("5b0217fa1eb568f99e45bb4ec054e1de"),
};

const point = "49.27042, -123.18690";
const address = "2-3768 West 2nd Avenue";
const brand = { brand: "Harbour & Grey", logo: "", accent: "#111111" };
const phone = "604-555-0148";

// Skills in the Harbour & Grey workspace (Context > Skills).
const skills = { voice: "hg-voice", honest: "hg-honest", places: "hg-places", canadian: "hg-canadian" };

const near = (name: string, kinds: string[], radius: number, take: number) => ({
  name,
  type: "place",
  near: "place",
  place: point,
  radius,
  kinds,
  take,
});

export default defineCatalogue({
  id: "property",
  name: "Property",
  description: "One listing, matched to how a buyer lives, with their new regulars nearby.",
  theme: "mono",
  parts: {
    start: { layout: startLayout, components: startComponents },
    intake: { layout: intakeLayout, components: intakeComponents },
    artifact: { layout: artifactLayout, components: artifactComponents },
  },
  // Sam's answers from the demo workspace's example run.
  samples: [
    {
      id: "sam",
      person: { name: "Sam Okoro", email: "sam.okoro@example.com" },
      answers: {
        household: "The two of us",
        work: "UBC",
        mornings: ["A run or a swim", "Walking the dog"],
        weekends: ["Trails and forest", "Beach and the seawall"],
        evenings: "Our local, same table",
        favourites: "In Seattle: Victrola Coffee, Canlis for anniversaries, Canon for cocktails",
        music: "Fleet Foxes, Bon Iver",
        hosting: 3,
        "must-haves": "A beach the dog is allowed on",
      },
    },
  ],
  example: {
    catalogue: "property",
    name: address,
    workflow: {
      prompt: [
        `A home for sale: ${address}, Point Grey, Vancouver, BC V6R 1J9. Listed at $3,968,000 by Harbour & Grey; the agent is Maren Holt.`,
        "A new-build (2026) side-by-side half duplex by Coastline Projects, freehold strata, on a 50 x 120 ft lot. 2,353 sq ft over three storeys plus a crawl space.",
        "3 bedrooms, 5 bathrooms (4 full, 1 powder). Every bedroom has its own ensuite; the primary has a spa-style ensuite and custom millwork.",
        "Main floor: 10 ft ceilings, a Miele kitchen with white oak cabinets and leathered quartzite, living and dining with hand-laid brick and 8 ft Eclipse doors out to the patio and yard. A family room.",
        "Top floor: a rec room with a wet bar and wine cooler, and two decks with mountain and partial water views. Four outdoor spaces in all.",
        "Heat pump, radiant heat and central air. In-suite laundry, security system, storage. Two parking spots off the lane, one in a single garage.",
        "Schools: Bayview Community Elementary (catchment, 0.55 km), Kitsilano Secondary (catchment, 1.9 km), Pacific Spirit School (0.7 km), West Point Grey Academy (1.1 km).",
        "The street is a few blocks up from Jericho, Locarno and Spanish Banks beaches, near West 4th and West 10th for shops and restaurants.",
        "The reader is a possible buyer. Help them picture their own week here.",
      ].join("\n"),
      skills: [skills.voice, skills.honest, skills.canadian],
      lookups: [
        { id: "mornings-nearby", props: near("Mornings near the home", ["coffee", "brunch"], 1.5, 12) },
        { id: "evenings-nearby", props: near("Evenings near the home", ["restaurant", "bar"], 2, 14) },
        { id: "weekends-nearby", props: near("Weekends near the home", ["outdoors", "shopping", "culture"], 2.5, 12) },
      ],
      steps: [],
    },
    parts: {
      start: {
        enabled: true,
        settings: {
          ...brand,
          nav: [
            { link: { label: "The home", href: "#home" } },
            { link: { label: "The street", href: "#area" } },
            { link: { label: "Questions", href: "#faq" } },
          ],
          cta: { label: "See your week here", href: "#start" },
          footer: "Listing details as published on the MLS®. Measurements are approximate. Harbour & Grey is an example agency.",
        },
        components: [
          {
            id: "listing",
            type: "listing",
            props: {
              status: "New build",
              address,
              area: "Point Grey, Vancouver",
              price: "$3,968,000",
              beds: "3",
              baths: "5",
              size: "2,353 sq ft",
              body:
                "A new half duplex a few blocks up from Jericho Beach. Before you book a viewing, see where your coffee, your Friday table and your Sunday walk would be.",
              photos: [
                { image: photos.front, caption: "From the street" },
                { image: photos.kitchen, caption: "Kitchen, white oak and quartzite" },
                { image: photos.living, caption: "Living room, doors open to the patio" },
                { image: photos.deckView, caption: "Top-floor deck" },
                { image: photos.view, caption: "Looking north over Point Grey" },
              ],
              signup: true,
              formTitle: "See your week here",
              formBody: "Nine questions about how you live. Then a page with how the house fits, and the places you'd walk to.",
              askName: true,
              button: "Start",
              note: "We'll only email you about this home.",
              cta: { label: "See your week here", href: "#join" },
            },
          },
          {
            id: "home",
            type: "story",
            props: {
              heading: "Three floors, four outdoor spaces",
              body:
                "A side-by-side half duplex by Coastline Projects, finished in 2026, a few blocks up from Jericho, Locarno and Spanish Banks.\n\n" +
                "The main floor has 10-foot ceilings, a Miele kitchen in white oak and leathered quartzite, and hand-laid brick. Eight-foot Eclipse doors open it to the patio.\n\n" +
                "Every bedroom has its own ensuite. Up top, a rec room with a wet bar opens onto two decks with mountain and partial water views.",
              highlights: [
                { text: "Miele kitchen, white oak cabinets, leathered quartzite" },
                { text: "An ensuite for every bedroom" },
                { text: "Rec room with a wet bar and wine cooler" },
                { text: "Two top-floor decks with mountain views" },
                { text: "Heat pump, radiant heat and central air" },
              ],
              image: photos.deck,
            },
          },
          {
            id: "gallery",
            type: "gallery",
            props: {
              heading: "",
              photos: [
                { image: portrait.door, caption: "The front door" },
                { image: photos.island, caption: "The island" },
                { image: portrait.ensuite, caption: "Primary ensuite" },
                { image: photos.primary, caption: "Primary bedroom" },
                { image: portrait.rec, caption: "Rec room, top floor" },
                { image: photos.yard, caption: "Back garden" },
              ],
            },
          },
          {
            id: "details",
            type: "facts",
            props: {
              heading: "The details",
              items: [
                { label: "Type", value: "Half duplex, 3 storeys" },
                { label: "Built", value: "2026, by Coastline Projects" },
                { label: "Title", value: "Freehold strata" },
                { label: "Lot", value: "50 × 120 ft" },
                { label: "Bedrooms", value: "3, each with an ensuite" },
                { label: "Bathrooms", value: "4 full, 1 powder" },
                { label: "Parking", value: "2 off the lane, 1 in a garage" },
                { label: "Heating and cooling", value: "Heat pump, radiant, A/C" },
              ],
            },
          },
          {
            id: "area",
            type: "area",
            props: {
              heading: "Point Grey",
              body: "Leafy streets running down to Jericho, Locarno and Spanish Banks. West 4th and West 10th are close for shops and restaurants.",
              point,
              items: [
                { name: "Bayview Community Elementary", detail: "Public, K–7, in catchment", distance: "0.55 km" },
                { name: "Pacific Spirit School", detail: "Independent, K–6", distance: "0.7 km" },
                { name: "West Point Grey Academy", detail: "Independent, K–12", distance: "1.06 km" },
                { name: "Kitsilano Secondary", detail: "Public, 8–12, in catchment", distance: "1.88 km" },
              ],
              note: "School distances as listed. Check catchments with the Vancouver School Board.",
            },
          },
          {
            id: "taste",
            type: "match",
            props: {
              heading: "Same taste, new street",
              body: "Tell us where you go now. We'll find the places near this house you'd go to for the same reasons.",
              items: [
                {
                  yours: "Monmouth Coffee, London",
                  near: "Corner Cup Coffee House",
                  detail: "11 min walk · Kitsilano",
                  image: "https://images.qloo.com/i/AF7F3DE3-0A91-40DE-8D5E-89945520C546-0kQlNS-420x-outside.jpg",
                },
                {
                  yours: "Pilot Coffee, Toronto",
                  near: "Storm City Coffee",
                  detail: "13 min walk · Kitsilano",
                  image: "https://images.qloo.com/i/069CEC2D-DA03-469D-A670-CB461939B037-420x-auto.jpg",
                },
                {
                  yours: "The Marksman, London",
                  near: "Aphrodite's Organic Cafe",
                  detail: "4 min walk · Kitsilano",
                  image: "https://images.qloo.com/i/22D6B32A-D803-4836-9986-43C8B4E4053A-2yVj1n-420x-outside.jpg",
                },
              ],
              note: "From pages we made for buyers moving from London and Toronto.",
              cta: { label: "Find yours", href: "#join" },
            },
          },
          {
            id: "agent",
            type: "agent",
            props: {
              heading: "Questions about the house?",
              name: "Maren Holt",
              role: "Harbour & Grey",
              photo: "",
              phone,
              email: "maren@harbourgrey.example",
              body: "Floor plans, strata documents or a second look. Ask Maren.",
            },
          },
          {
            id: "join",
            type: "optin",
            props: {
              headline: "See how you'd live here",
              body: "Your mornings, your Friday table, your Sunday walk, found near this front door before you book a viewing.",
              image: photos.deck,
              home: address,
              homeDetail: "Point Grey · $3,968,000",
              thumb: photo("02ea1450a0e7bb93792e01d29b8e81c3", 300),
              formTitle: "Nine questions, then your week here",
              formBody: "We'll email you the link, so you can send it to whoever you'd be moving with.",
              askName: true,
              button: "Start",
              note: "We'll only email you about this home.",
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
                  answer: "From the places and music you tell us you love. We look for spots near the house that share something with them: the coffee, the room, the crowd. No one pays to be on your page.",
                },
                {
                  question: "Is it the same page for everyone?",
                  answer: "No. Two buyers who drink coffee in different places get different cafés, for different reasons.",
                },
                {
                  question: "Can I see the house?",
                  answer: `Yes. Book a private viewing from your page, or call Maren on ${phone}.`,
                },
                {
                  question: "What happens to my answers?",
                  answer: "They make your page and stay with Harbour & Grey, so Maren knows what matters to you if you book a viewing.",
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
            { image: portrait.front, caption: "From the street" },
            { image: portrait.family, caption: "Family room" },
            { image: portrait.kitchen, caption: "Kitchen" },
            { image: portrait.yard, caption: "Back garden" },
            { image: portrait.dining, caption: "Dining" },
            { image: portrait.view, caption: "Looking north over Point Grey" },
            { image: portrait.living, caption: "Living room" },
            { image: portrait.rec, caption: "Rec room" },
            { image: portrait.deck, caption: "Top-floor deck" },
            { image: portrait.primary, caption: "Primary bedroom" },
          ],
          next: "Next",
          submit: "See your week here",
        },
        components: [
          {
            id: "household",
            type: "choice",
            props: {
              question: "Who would be living here?",
              help: "So we know how many bedrooms and bathrooms need to work.",
              required: true,
              multiple: false,
              options: [
                { label: "Just me" },
                { label: "The two of us" },
                { label: "A family with kids" },
                { label: "Family, with parents or guests often staying" },
              ],
            },
          },
          {
            id: "work",
            type: "choice",
            props: {
              question: "Where does your workday happen?",
              help: "So we know whether the house needs a quiet room or a short commute.",
              required: true,
              multiple: false,
              options: [
                { label: "At home, most days" },
                { label: "Downtown" },
                { label: "UBC" },
                { label: "Somewhere I drive to" },
                { label: "A mix of home and office" },
              ],
            },
          },
          {
            id: "mornings",
            type: "choice",
            props: {
              question: "What does a good morning look like?",
              help: "So we can find where you'd go before nine.",
              required: true,
              multiple: true,
              options: [
                { label: "Coffee somewhere I'm a regular" },
                { label: "A run or a swim" },
                { label: "Yoga or the gym" },
                { label: "Walking the dog" },
                { label: "School drop-off" },
                { label: "Slow breakfast at home" },
              ],
            },
          },
          {
            id: "weekends",
            type: "choice",
            props: {
              question: "And a good weekend?",
              help: "So we can plan a Saturday from the front door.",
              required: true,
              multiple: true,
              options: [
                { label: "Beach and the seawall" },
                { label: "Trails and forest" },
                { label: "A long brunch" },
                { label: "Friends over at ours" },
                { label: "Markets and shops" },
                { label: "Galleries and shows" },
                { label: "Kids' sports and lessons" },
              ],
            },
          },
          {
            id: "evenings",
            type: "choice",
            props: {
              question: "Friday night, ideally?",
              help: "So we know whether to find you a table or leave you the deck.",
              required: true,
              multiple: false,
              options: [
                { label: "Dinner somewhere new" },
                { label: "Our local, same table" },
                { label: "Cocktails, then see where it goes" },
                { label: "At home, on the deck" },
              ],
            },
          },
          {
            id: "taste-intro",
            type: "statement",
            props: {
              title: "Now, the places you love",
              body: "Wherever you live now. Name a few and we'll find the places near this house you'd go to for the same reasons.",
              media: { type: "image", url: "" },
            },
          },
          {
            id: "favourites",
            type: "text",
            props: {
              question: "Which cafés, restaurants or bars are your regulars?",
              help: "Name a few, and the city if it isn't Vancouver. This is what we match on.",
              required: true,
              size: "long",
              placeholder: "Revolver for coffee, Kissa Tanto for birthdays, Bar Raval when I'm in Toronto",
            },
          },
          {
            id: "music",
            type: "text",
            props: {
              question: "What's playing at home?",
              help: "A few artists. It helps us find places with the same feel.",
              required: false,
              size: "short",
              placeholder: "Khruangbin, Men I Trust, Caribou",
            },
          },
          {
            id: "hosting",
            type: "scale",
            props: {
              question: "How often do you have people over?",
              help: "The top floor has a rec room, a wet bar and two decks. We want to know if you'd use them.",
              required: true,
              max: 5,
              low: "Rarely",
              high: "Every weekend",
            },
          },
          {
            id: "must-haves",
            type: "text",
            props: {
              question: "Anything that would make or break it?",
              help: "A room, a walk, a school. We'll say plainly if this house has it.",
              required: false,
              size: "long",
              placeholder: "Two places to take calls, a quiet street, a dog-friendly beach",
            },
          },
        ],
      },
      artifact: {
        enabled: true,
        settings: {
          ...brand,
          cta: { label: "Book a private viewing", href: "#viewing" },
          footer: "Harbour & Grey is an example agency. Places come from Qloo, matched to your answers. Listing details as published on the MLS®.",
        },
        components: [
          {
            id: "cover",
            type: "cover",
            props: {
              title: "Your week at West 2nd, {{first_name}}",
              details: `${address} · Point Grey · $3,968,000`,
              intro: "Everything below is close to the front door, picked for the places you love now.",
              image: photos.front,
              link: { label: "Book a private viewing", href: "#viewing" },
              making: "Finding your week at West 2nd",
            },
          },
          { id: "fit", type: "fit", props: { heading: "How it fits", tradeoffs: true, prompt: "", skills: [] } },
          {
            id: "regulars",
            type: "regulars",
            props: {
              lookups: ["mornings-nearby", "evenings-nearby", "weekends-nearby"],
              heading: "Your new regulars",
              count: 5,
              from: point,
              prompt: "",
              skills: [skills.places],
            },
          },
          { id: "rooms", type: "rooms", props: { heading: "Your week, room by room", count: 4, prompt: "", skills: [] } },
          {
            id: "saturday",
            type: "day-plan",
            props: {
              lookups: ["mornings-nearby", "evenings-nearby", "weekends-nearby"],
              heading: "A Saturday from the front door",
              span: "day",
              stops: 4,
              prompt: "Start and end at the house. Keep it walkable, and work in the beach if they like it. Don't repeat places from Your new regulars.",
              skills: [skills.places],
            },
          },
          {
            id: "recap",
            type: "recap",
            props: {
              image: photos.living,
              address,
              details: "3 bed · 5 bath · 2,353 sq ft · Point Grey",
              price: "$3,968,000",
              body: "Every room on this page is in the listing. Book a viewing and stand in them, {{first_name}}.",
              link: { label: "Book a private viewing", href: `mailto:maren@harbourgrey.example?subject=${encodeURIComponent(`Viewing: ${address}`)}` },
              phone,
            },
          },
          {
            id: "how",
            type: "explainer",
            props: {
              label: "For the Loro demo",
              heading: "How this page was made",
              body: "Everything above came from this run: the buyer's answers, Qloo's taste graph searched around the house, and a model that could only write about the places Qloo returned.",
            },
          },
        ],
      },
    },
  },
});
