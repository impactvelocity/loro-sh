/**
 * A month at a venue, for one person: the shows that are really on in
 * the next four weeks, ranked against what they love. For concert halls,
 * old picture houses and clubs that host a lot of nights but aren't the
 * ticket seller everyone thinks of.
 *
 * API first: the box office starts the experience for someone (POST
 * …/experiences/:slug/trigger) after they buy a ticket or join the
 * mailing list, with what they've seen here before and, if it knows, what
 * they play. The start page and questions are for people who come on
 * their own, and for the demo.
 *
 * The What's On step (steps/programme.ts) reads the month from the
 * venue's events API, or a demo programme without one, and ranks every
 * show in Qloo by the band, film or podcast it's about. A lookup finds
 * dinner a walk from the doors.
 *
 * The catalogue ships three skills (voice, only what's on, the room),
 * added to the workspace's Context when an experience is made from it.
 */
import { defineCatalogue } from "@core/catalogue/define";
import { artifactComponents, artifactLayout } from "./artifact";
import { intakeComponents, intakeLayout } from "./intake";
import { qlooImage } from "./programme";
import { unsplash } from "./shared";
import { startComponents, startLayout } from "./start";

const photos = {
  house: unsplash("photo-1485095329183-d0797cdc5676"),
  crowd: unsplash("photo-1540039155733-5bb30b53aa14", 1400),
  beam: unsplash("photo-1762541693135-fb989de961e1", 1400),
  reels: unsplash("photo-1440404653325-ab127d49abc1", 1400),
  disco: unsplash("photo-1559424452-eeb3a13ffe2b", 1400),
  seats: unsplash("photo-1458053688450-eef5d21d43b3", 1400),
  aisle: unsplash("photo-1489599849927-2ee91cede3ba"),
  stage: unsplash("photo-1715322608224-a9efaeeffaf7"),
  hands: unsplash("photo-1524368535928-5b5e00ddc76b", 1400),
};

const brand = { brand: "The Wren", logo: "" };

/** Main Street at 22nd, Vancouver: where walking times start. */
const point = "49.2509, -123.1010";

const skills = [
  {
    id: "wren-voice",
    title: "The Wren Voice",
    description: [
      "Write as The Wren to one regular, like the person in the box office who has heard every band through the wall. Specific and calm. The facts do the work: the night, the room, the band, the film.",
      "Use you for the reader and we for The Wren. Short sentences, with contractions. Canadian setting, British spelling. Times read 7:30 PM, 8 PM. Prices in dollars. No exclamation marks, no em dashes, no emoji.",
      "Point at things, not moods: the instruments, the language it's sung in, the print, the room. Say what links a show to a favourite once, plainly, and stop.",
      "Never write: vibe, vibes, unforgettable, magical, iconic, legendary, must-see, hidden gem, curated, elevate, immersive, a night to remember, don't miss, journey, energy, lane, side of, corner, textural, hushed, anchor, leans, settle in, sits right, lines up, clean pick, cleanest, easy pick, suits, a good fit, perfect for, the way you listen, without going, seem to, probably, pull, land, hit.",
      "Never guess what they like beyond what they told us. Say \"you named\" or \"you play\", never \"you seem to\".",
    ].join("\n\n"),
  },
  {
    id: "wren-whats-on",
    title: "Only What's On",
    description: [
      "Every show you mention is on the month's calendar, with the date, time, price and status the box office gave. Never move a show, change a price, or say tickets are available when it's sold out.",
      "Never invent a support act, a setlist, a guest, a Q&A, a print's history or a dress code. Say what the box office says (seated, standing, 35mm, 19+) and nothing more.",
      "Don't state facts about an artist, film or podcast unless you're sure, and never claim a song is in a film or one artist influenced another. What links a show to someone's favourite should be something you'd hear or see in the room.",
      "Seated or standing comes only from the show's format. A show they saw here before is one they've been to, not one they named.",
    ].join("\n\n"),
  },
  {
    id: "wren-the-room",
    title: "The Room",
    description: [
      "The Wren is a 1931 picture house on Main Street in Vancouver with 650 seats. Gigs are seated or standing on the floor with seats upstairs; films play on the original screen; dance nights clear the floor until 2 AM.",
      "Say doors when the show has them. For a standing gig, getting there at doors means the front; for a seated one, there's no rush.",
      "Places for before and after are a walk up or down Main Street. Never invent opening hours or say a place takes bookings.",
    ].join("\n\n"),
  },
];

export default defineCatalogue({
  id: "venue",
  name: "Venue",
  description: "A month at a venue for one person: every show that's on, ranked against what they love, with dinner before doors. Started by the box office's API.",
  theme: "gig",
  parts: {
    start: { layout: startLayout, components: startComponents },
    intake: { layout: intakeLayout, components: intakeComponents },
    artifact: { layout: artifactLayout, components: artifactComponents },
  },
  skills,
  // Imogen's answers from the demo workspace's example run, which the box office started by API.
  samples: [
    {
      id: "imogen",
      person: { name: "Imogen Hart", email: "imogen.hart@example.com" },
      answers: {
        taste: "Arooj Aftab, Nils Frahm, Cocteau Twins, Song Exploder",
        films: "In the Mood for Love, Paris, Texas, Past Lives",
        seen: "Stop Making Sense",
        nights: ["Film nights", "Gigs", "Live podcasts"],
        when: ["Weeknights", "Sundays"],
        budget: "Up to $25",
      },
    },
  ],
  example: {
    catalogue: "venue",
    name: "Your Month",
    workflow: {
      prompt: [
        "The Wren is a 1931 picture house on Main Street, Vancouver: 650 seats of gigs, film nights, comedy, live podcasts and dance nights. It sells its own tickets.",
        "The reader is one person, sent here by the box office after buying a ticket or joining the list, or who came to the page on their own. The page is their next four weeks at The Wren.",
        "Every show comes from the What's On step: the box office's month, ranked for them in Qloo. Places come from the lookup around the venue.",
      ].join("\n"),
      skills: ["wren-voice", "wren-whats-on"],
      lookups: [
        {
          id: "main-street",
          props: {
            name: "Dinner and drinks on Main Street",
            type: "place",
            near: "place",
            place: point,
            radius: 1,
            kinds: ["restaurant", "bar"],
            popularity: "any",
            price: "any",
            day: "any",
            take: 14,
            person: "high",
            segment: "low",
            steer: "",
            steerWeight: "medium",
          },
        },
      ],
      steps: [
        {
          id: "programme",
          type: "programme",
          props: {
            url: "",
            venue: "The Wren",
            tickets: "https://tickets.example.com/the-wren/{{id}}",
            timeZone: "America/Vancouver",
            days: 30,
            seen: "seen",
            kinds: "nights",
            nights: "when",
            budget: "budget",
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
            { link: { label: "What's on", href: "#whats-on" } },
            { link: { label: "How it works", href: "#ranked" } },
            { link: { label: "Questions", href: "#faq" } },
          ],
          cta: { label: "Find my nights", href: "#start" },
          address: "The Wren\nMain Street at 22nd Avenue\nVancouver, BC",
          footer: "The Wren is an example venue, made for the Loro demo. The artists, films and podcasts are real; the month isn't.",
        },
        components: [
          {
            id: "hero",
            type: "hero",
            props: {
              title: "Your month at The Wren",
              body: "Twenty-four shows in the next four weeks. Tell us who you play and we'll put the nights you'd pick first, with dinner up the street.",
              image: photos.house,
              signup: true,
              askName: true,
              button: "Find my nights",
              note: "We'll only email you about shows at The Wren.",
              cta: { label: "Find my nights", href: "#join" },
            },
          },
          {
            id: "whats-on",
            type: "whatson",
            props: {
              label: "What's on",
              heading: "The next four weeks",
              body: "Gigs, film nights on the original screen, live podcasts and dance nights until 2 AM.",
              count: 8,
              timeZone: "America/Vancouver",
              cta: { label: "Put mine first", href: "#join" },
            },
          },
          {
            id: "ranked",
            type: "feature",
            props: {
              heading: "Ranked by what you play",
              body:
                "Name a few bands, films or podcasts. Qloo, a taste engine, matches each one and scores every show this month against them: the band on stage, the film on screen, the podcast recording live.\n\n" +
                "The ones you'd pick come first, with the favourite that put them there.",
              image: photos.crowd,
              side: "left",
            },
          },
          {
            id: "screen",
            type: "feature",
            props: {
              heading: "Not only gigs",
              body: "If you play Talking Heads, you'll see the Stop Making Sense dance-along. If you rate Wong Kar-wai, the 35mm Chungking Express. One show you wouldn't pick, one step from what you love.",
              image: photos.beam,
              side: "right",
            },
          },
          {
            id: "dinner",
            type: "feature",
            props: {
              heading: "Then dinner before doors",
              body: "For your first night, somewhere to eat a short walk up Main Street, and somewhere for after. Picked the same way.",
              image: photos.seats,
              side: "left",
            },
          },
          {
            id: "example",
            type: "example",
            props: {
              label: "An example",
              heading: "Picked for a Khruangbin fan",
              body: "From a test run for someone who plays Khruangbin, Arooj Aftab and Talking Heads, rates In the Mood for Love, and has seen Hermanos Gutiérrez here.",
              rows: [
                {
                  night: "Wednesday",
                  title: "In the Mood for Love",
                  detail: "Film · 35mm print · $16",
                  because: "you named it",
                  image: qlooImage("900B6C69-9D86-4153-B8FD-4D6CD726FCF8", 240),
                },
                {
                  night: "Thursday",
                  title: "Hermanos Gutiérrez",
                  detail: "Gig · seated · $45",
                  because: "it's on your past tickets",
                  image: qlooImage("7E51F8BC-FA1E-4E93-B465-39663E16E7C1", 240),
                },
                {
                  night: "Thursday",
                  title: "Jessica Pratt",
                  detail: "Gig · seated · $38",
                  because: "you play Arooj Aftab and Khruangbin",
                  image: qlooImage("1BFF4538-93DB-45F0-BF46-65FDA34F154D", 240),
                },
                {
                  night: "Sunday",
                  title: "Song Exploder, live",
                  detail: "Live podcast · seated · $35 · the one they wouldn't pick",
                  because: "you play Talking Heads",
                  image: qlooImage("D95B20A8-0CEA-4BDC-8074-60A303FA1980", 240),
                },
              ],
              note: "From a test run. Matches come from Qloo.",
              cta: { label: "Find yours", href: "#join" },
            },
          },
          {
            id: "house",
            type: "facts",
            props: {
              label: "The house",
              items: [
                { value: "1931", label: "Built as a picture house" },
                { value: "650", label: "Seats, or a cleared floor for dance nights" },
                { value: "Main St", label: "At 22nd Avenue, Vancouver" },
              ],
              note: "Box office opens an hour before doors. Shows are 19+ unless they say all ages.",
            },
          },
          {
            id: "join",
            type: "optin",
            props: {
              headline: "Find my nights",
              body: "Six questions, then your four weeks at The Wren, best first.",
              image: photos.stage,
              askName: true,
              button: "Start",
              note: "We'll only email you about shows at The Wren.",
            },
          },
          {
            id: "faq",
            type: "faq",
            props: {
              heading: "Questions",
              items: [
                {
                  question: "I got a link after buying a ticket. Do I need to do this?",
                  answer: "No. When you buy, the box office sends us what you've seen here and we make your month from that. This page is for anyone else.",
                },
                {
                  question: "How are the shows picked?",
                  answer: "From the favourites you name. Qloo scores the band, film or podcast behind every show this month against them. No one pays to be on your page.",
                },
                {
                  question: "Are these real shows?",
                  answer: "The Wren is an example venue. The artists, films and podcasts are real; the month is made up and starts from today.",
                },
                {
                  question: "Will you email me every week?",
                  answer: "Once, with your month. Again only if you ask.",
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
            { image: photos.house },
            { image: photos.reels },
            { image: photos.aisle },
            { image: photos.crowd },
            { image: photos.disco },
            { image: photos.hands },
          ],
          next: "Next",
          submit: "Find my nights",
        },
        components: [
          {
            id: "taste",
            type: "taste",
            props: {
              question: "Who's on repeat?",
              label: "What they play",
              help: "A few bands or artists, playing here or not. It's how we rank every gig on the calendar.",
              required: true,
              placeholder: "Khruangbin, Arooj Aftab, Talking Heads",
            },
          },
          {
            id: "films",
            type: "taste",
            props: {
              question: "A film you'd see on a big screen again?",
              label: "Films they love",
              help: "Or a podcast you never skip. Film nights and live recordings are ranked on these.",
              required: false,
              placeholder: "In the Mood for Love, Paris, Texas, Song Exploder",
            },
          },
          {
            id: "seen",
            type: "taste",
            props: {
              question: "Seen anything at The Wren?",
              label: "Seen here before",
              help: "Skip it if not. When you buy a ticket, the box office fills this in for you.",
              required: false,
              placeholder: "Destroyer, Stop Making Sense",
            },
          },
          {
            id: "nights",
            type: "choice",
            props: {
              question: "What gets you out?",
              help: "We put these first. One show from outside them still makes the page.",
              required: true,
              multiple: true,
              options: [{ label: "Gigs" }, { label: "Film nights" }, { label: "Comedy" }, { label: "Dance nights" }, { label: "Live podcasts" }],
            },
          },
          {
            id: "when",
            type: "choice",
            props: {
              question: "Which nights can you do?",
              help: "So your picks land on nights you're free.",
              required: true,
              multiple: true,
              options: [{ label: "Weeknights" }, { label: "Fridays" }, { label: "Saturdays" }, { label: "Sundays" }],
            },
          },
          {
            id: "budget",
            type: "choice",
            props: {
              question: "What do you spend on a ticket?",
              help: "Per ticket. A show over it can still make the page if it's a strong match, and we'll say so.",
              required: true,
              multiple: false,
              options: [{ label: "Up to $25" }, { label: "Up to $45" }, { label: "Whatever it costs" }],
            },
          },
        ],
      },
      artifact: {
        enabled: true,
        settings: {
          ...brand,
          cta: { label: "Your nights", href: "#picks" },
          footer: "The Wren is an example venue. Shows come from its calendar, ranked for you by Qloo.",
        },
        components: [
          {
            id: "cover",
            type: "cover",
            props: {
              title: "Your month at {{venue}}",
              intro: "Every show on in the next four weeks, ranked against what you love. Yours first.",
              image: photos.house,
              link: { label: "See your nights", href: "#picks" },
              making: "Going through the month",
            },
          },
          { id: "picks", type: "picks", props: { lookups: ["programme"], heading: "Your nights", count: 4, prompt: "", skills: ["wren-the-room"] } },
          {
            id: "month",
            type: "month",
            props: { heading: "Everything that's on", body: "Your picks in pink. The rest are here too, with the ones closest to your taste filled in." },
          },
          { id: "stretch", type: "stretch", props: { lookups: ["programme"], heading: "One you wouldn't pick", count: 2, prompt: "", skills: [] } },
          { id: "before", type: "before", props: { lookups: ["main-street"], heading: "Before doors", from: point, count: 3, prompt: "", skills: ["wren-the-room"] } },
          {
            id: "bring",
            type: "bring",
            props: { heading: "Bring someone", body: "For your first night. Send it to whoever's coming.", prompt: "", skills: [] },
          },
          {
            id: "made",
            type: "made",
            props: {
              heading: "How this page was made",
              body: "Everything above came from this run: The Wren's calendar from its events API, your answers, Qloo's taste graph, and a model that could only pick from what's on and what Qloo returned.",
            },
          },
        ],
      },
    },
  },
});
