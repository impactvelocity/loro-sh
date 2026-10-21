/**
 * A road trip to a festival. The start page is the festival, what the
 * plan holds and the days left until the gates open. The intake
 * asks where they start, who they're going to see, what they play in the
 * car and how they like to travel. The outcome plans the drive (the real
 * route split into days, coffee, lunch and a bed in good towns on the
 * way, a road mix), then their weekend at the festival.
 *
 * Two code steps do the work after Taste: Route (steps/route.ts, id
 * "route") routes the drive and finds Qloo places near each stop; Lineup
 * (steps/lineup.ts, id "ranking") ranks the bill for the weekend. Ids are
 * shared by components, lookups and steps, so each must be unique.
 */
import { defineCatalogue } from "@core/catalogue/define";
import { unsplash } from "../festival/shared";
import { exampleLineup, qlooImage } from "../festival/lineup";
import { mirageSkills } from "../festival/skills";
import { artifactComponents, artifactLayout } from "./artifact";
import { intakeComponents, intakeLayout } from "./intake";
import { startComponents } from "./start";
import { startLayout } from "../festival/start";
import { exampleOrigins, festivalGrounds } from "./trip";

const brand = { brand: "Mirage Valley", logo: "", accent: "#e0603a" };
const dates = "April 16–18, 2027";

const billingOrder = { top: 0, mid: 1, low: 2 } as const;
const acts = exampleLineup.sets
  .toSorted((a, b) => billingOrder[a.billing] - billingOrder[b.billing])
  .map((set) => ({ label: set.artist, image: qlooImage(set.qloo, 120) }));

// The poster's headliners, with their photos and their night.
const headliners = exampleLineup.sets
  .filter((set) => set.billing === "top")
  .map((set) => ({ name: set.artist, image: qlooImage(set.qloo, 640), when: `${set.day} night` }));

const gettingAround =
  "Gates open at noon and the last set ends around 1 AM. Sundial Stage and Palm Court are five minutes apart on foot; " +
  "Oasis Tent is ten minutes from both; The Dune is the far end of the field, fifteen minutes from Sundial. " +
  "Afternoons run 90°F and over, nights drop to the 60s.";

export default defineCatalogue({
  id: "roadtrip",
  name: "Road Trip",
  description: "A drive to a multi-day festival, planned for each person: the route, the stops, a road mix, then the weekend.",
  theme: "desert",
  parts: {
    start: { layout: startLayout, components: startComponents },
    intake: { layout: intakeLayout, components: intakeComponents },
    artifact: { layout: artifactLayout, components: artifactComponents },
  },
  skills: mirageSkills,
  // Theo's answers from the demo workspace's example run.
  samples: [
    {
      id: "theo",
      person: { name: "Theo Lindqvist", email: "theo.lindqvist@example.com" },
      answers: {
        origin: "Portland, OR",
        excited: ["Bon Iver", "Fleet Foxes", "Khruangbin", "The National"],
        also: "Big Thief, Fleetwood Mac, Neil Young",
        crew: "Me and my partner",
        hours: "Up to 6 hours",
        stops: ["Good coffee", "A view or a short hike", "Record stores and vintage shops"],
        sleep: "Somewhere with a bit of character",
        arrive: "Thursday, when camping opens",
      },
    },
  ],
  example: {
    catalogue: "roadtrip",
    name: "Mirage Valley Road Trip",
    workflow: {
      prompt: [
        `Mirage Valley Music & Arts Festival: three days in the desert outside Indio, California, ${dates} (Friday to Sunday). Four stages: Sundial Stage (main), Palm Court, The Dune (dance tent) and Oasis Tent.`,
        "The reader has a 3-day pass and is driving there. This page plans the road trip: the real route split into days, where to stop for coffee, lunch and the night in towns on the way, and music for the car. Then their weekend at the festival.",
        "Camping and car parking open Thursday at noon; gates open Friday at noon. " + gettingAround,
        "Facts about roads and towns only when you're sure of them.",
      ].join("\n"),
      skills: ["mirage-voice"],
      lookups: [
        {
          id: "soundtrack",
          props: { name: "Music for the drive", type: "artist", popularity: "any", take: 20, person: "high", segment: "low" },
        },
      ],
      steps: [
        {
          id: "route",
          type: "route",
          props: {
            origin: "origin",
            hours: "hours",
            stops: "stops",
            arrive: "arrive",
            destination: festivalGrounds.name,
            point: festivalGrounds.point,
            firstDay: "2027-04-16",
            perDay: 7,
            take: 3,
          },
        },
        { id: "ranking", type: "lineup", props: { lineup: "lineup", picks: "excited", notes: gettingAround } },
      ],
    },
    parts: {
      start: {
        enabled: true,
        settings: {
          ...brand,
          nav: [
            { link: { label: "Lineup", href: "#lineup" } },
            { link: { label: "Before you set off", href: "#info" } },
            { link: { label: "Questions", href: "#faq" } },
          ],
          cta: { label: "Plan my drive", href: "#start" },
          footer: `Mirage Valley Music & Arts Festival · Indio, California · ${dates}`,
        },
        components: [
          {
            id: "poster",
            type: "poster",
            props: {
              name: "Mirage Valley",
              subtitle: "Three days of music at the end of the road",
              dates,
              place: "Indio, California",
              // Photos from Unsplash (free licence), faded into the sky.
              image: unsplash("photo-1650511503717-113b2459fd13"),
              headliners,
              body: "You've got the pass. Tell us where you're starting and who you're driving to see, and we'll plan the road down: coffee, lunch and a bed on the way, music for the car, then your three days set by set.",
              signup: true,
              formTitle: "Plan your drive",
              formBody: "Eight questions about where you're starting and how you like to travel. Your route, stops and road mix come back in one link.",
              askName: true,
              button: "Plan my drive",
              note: "We'll email you the link, and only ever about Mirage Valley.",
              cta: { label: "Plan my drive", href: "#join" },
            },
          },
          {
            id: "strip",
            type: "marquee",
            props: { text: "April 16–18 ✶ Indio, California ✶ Camping opens Thursday ✶ Gates Friday at noon ✶ Forty-one acts" },
          },
          {
            id: "how",
            type: "features",
            props: {
              heading: "What's in your plan",
              columns: "2",
              numbered: false,
              items: [
                {
                  title: "The road, in days you can drive",
                  body: "Your real route from where you start, split around how long you like to drive. Nights land in towns, not at truck stops.",
                },
                {
                  title: "Coffee, lunch and a bed",
                  body: "Places near each stop that fit what you like, found by Qloo, a taste engine. Every one is a real place you can look up.",
                },
                {
                  title: "A road mix",
                  body: "Three artists for each stretch of the drive, matched to what you already play in the car.",
                },
                {
                  title: "Then the weekend",
                  body: "Your three days at Mirage Valley, set by set, with the clashes decided before you get there.",
                },
              ],
            },
          },
          { id: "lineup", type: "lineup", props: { heading: "Who's at the end of the road", view: "poster", ...exampleLineup } },
          {
            id: "countdown",
            type: "countdown",
            props: {
              opens: "2027-04-16T12:00-07:00",
              heading: "days until the gates open",
              body: "Camping and car parks open Thursday, April 15 at noon. Plan the road now, and all that's left is packing the car.",
              open: "The gates are open",
            },
          },
          {
            id: "info",
            type: "info",
            props: {
              heading: "Before you set off",
              items: [
                { label: "Parking", title: "Opens Thursday at noon", body: "Car camping and day parking a short walk from the main gate." },
                { label: "Gates", title: "Friday at noon", body: "Roll in Thursday to camp, or Friday morning to walk straight in." },
                { label: "The last stretch", title: "90°F by afternoon", body: "Fill the tank and carry water before you drop into the valley." },
                { label: "Signal", title: "Save your plan", body: "Signal drops on the open road and near the stages. Save the page to your phone before you set off." },
              ],
            },
          },
          {
            id: "signup",
            type: "optin",
            props: {
              formTitle: "Plan your drive",
              formBody: "Eight questions. The link lands in your inbox.",
              image: unsplash("photo-1594056939424-d793d83ffcef"),
              headline: "Where are you driving from?",
              body: "Tell us, and who you're going to see. We'll email you the link, so the plan's on your phone for the road.",
              askName: true,
              button: "Plan my drive",
              note: "We'll only email you about Mirage Valley.",
            },
          },
          {
            id: "faq",
            type: "faq",
            props: {
              heading: "Questions",
              items: [
                {
                  question: "Where do the stops come from?",
                  answer: "We route your real drive, split it into days around how long you like to drive, and ask Qloo, a taste engine, for places near each town that fit what you like. Every stop is a real place. Check opening hours before you go.",
                },
                { question: "Can I start anywhere?", answer: "Yes. Pick a city or type your own town, and we'll plan from there." },
                { question: "Does it plan the drive home?", answer: "Not yet. It plans the way down and your three days at the festival." },
                {
                  question: "Can I share it with whoever's in the car?",
                  answer: "Yes. Send them the link: the route, the stops and the road mix are all on it.",
                },
              ],
            },
          },
        ],
      },
      intake: {
        enabled: true,
        settings: { ...brand, next: "Next", submit: "Plan my drive" },
        components: [
          {
            id: "origin",
            type: "origin",
            props: {
              question: "Where are you driving from?",
              help: "Pick a city or type your own. We plan the route from there.",
              required: true,
              other: true,
              options: exampleOrigins,
            },
          },
          {
            id: "excited",
            type: "acts",
            props: {
              question: "Who are you driving all that way to see?",
              help: "Tap everyone you'd be gutted to miss. We plan the weekend around them.",
              required: true,
              max: 0,
              options: acts,
            },
          },
          {
            id: "also",
            type: "text",
            props: {
              question: "What do you play in the car?",
              help: "A few artists. Your road mix starts from them.",
              required: false,
              size: "short",
              placeholder: "Fleetwood Mac, Kendrick Lamar, Khruangbin",
            },
          },
          {
            id: "crew",
            type: "choice",
            props: {
              question: "Who's in the car?",
              help: "So the stops suit everyone on board.",
              required: true,
              multiple: false,
              options: [
                { label: "Just me" },
                { label: "Me and my partner" },
                { label: "A car full of friends" },
                { label: "Friends who all like different music" },
              ],
            },
          },
          {
            id: "hours",
            type: "choice",
            props: {
              question: "How long can you drive in a day?",
              help: "We split the road into days around it.",
              required: true,
              multiple: false,
              options: [{ label: "Up to 4 hours" }, { label: "Up to 6 hours" }, { label: "Up to 8 hours" }, { label: "10 hours or more" }],
            },
          },
          {
            id: "stops",
            type: "choice",
            props: {
              question: "What do you stop for?",
              help: "Pick as many as you like. We look for them near each town on the way.",
              required: true,
              multiple: true,
              options: [
                { label: "Good coffee" },
                { label: "A proper lunch" },
                { label: "Record stores and vintage shops" },
                { label: "A view or a short hike" },
                { label: "A drink and live music at night" },
              ],
            },
          },
          {
            id: "sleep",
            type: "choice",
            props: {
              question: "Where do you sleep on the way?",
              help: "So we find the right kind of town for the night.",
              required: true,
              multiple: false,
              options: [
                { label: "A cheap motel. It's just a bed." },
                { label: "Somewhere with a bit of character" },
                { label: "We'll camp" },
                { label: "Friends' couches" },
              ],
            },
          },
          {
            id: "arrive",
            type: "choice",
            props: {
              question: "When do you want to roll in?",
              help: "We count the drive back from here.",
              required: true,
              multiple: false,
              options: [{ label: "Thursday, when camping opens" }, { label: "Friday, before the gates open" }],
            },
          },
        ],
      },
      artifact: {
        enabled: true,
        settings: { ...brand, footer: "Routes from OpenStreetMap. Stops and music matched to your taste by Qloo. Check opening hours before you go." },
        components: [
          {
            id: "pass",
            type: "ticket",
            props: {
              image: unsplash("photo-1511173855943-aeec034188a9"),
              title: "{{first_name}}'s road to the desert",
              intro: "Planned from where you're starting, who you're going to see and what you play in the car. The road is the real road, and every stop is a real place.",
              pass: "Road Trip",
              dates,
              stub: "From {{answers.origin}}",
              share: true,
              shareLine: "Riding with friends? Send them the road trip: the route, the stops and the music for the car.",
              shareLabel: "Share the road trip",
              shareText: "My road trip to Mirage Valley: the route, the stops and the music for the car.",
              making: "Planning your road trip",
            },
          },
          { id: "road", type: "road", props: { heading: "The road", body: "" } },
          {
            id: "read",
            type: "note",
            props: {
              lookups: [],
              heading: "How we planned it",
              length: "short",
              prompt: "Say how their answers shaped the trip: how far they drive a day and why the nights land where they do, who's in the car, what they stop for, when they roll in. Don't name places or acts; the sections below do.",
              skills: [],
            },
          },
          { id: "drive", type: "drive", props: { lookups: ["route"], heading: "The drive", perDay: 4, prompt: "", skills: ["road-stops"] } },
          { id: "mix", type: "mixtape", props: { lookups: ["soundtrack"], heading: "Road mix", perSide: 3, prompt: "", skills: ["new-to-you"] } },
          {
            id: "plan",
            type: "schedule",
            props: {
              lookups: ["ranking"],
              heading: "Once you're there",
              perDay: 5,
              prompt: "They're there all three days.",
              skills: ["clash-calls", "desert-days"],
            },
          },
          {
            id: "made",
            type: "made",
            props: {
              label: "For the Loro demo",
              heading: "How this page was made",
              body: "What we read, what Qloo matched, and why each stop, song and act made the cut.",
            },
          },
        ],
      },
    },
  },
});
