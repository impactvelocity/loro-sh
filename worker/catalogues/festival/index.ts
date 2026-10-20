/**
 * A festival guide. The start page is the festival: a poster, the lineup
 * and the practical bits. The intake asks who they're there for and how
 * they do a festival. The outcome is their weekend, planned: must-sees,
 * acts new to them that Qloo says they'd love, the hard calls between
 * clashing sets, and somewhere for breakfast before the gates open.
 *
 * The lineup lives once, in the start page's Lineup component. The
 * Lineup code step (steps/lineup.ts, id "ranking") reads it, ranks every
 * act for the person in Qloo, and hands the guide's sections the
 * timetable. Ids are shared by components, lookups and steps, so each
 * must be unique.
 */
import { defineCatalogue } from "@core/catalogue/define";
import { unsplash } from "./shared";
import { artifactComponents, artifactLayout } from "./artifact";
import { intakeComponents, intakeLayout } from "./intake";
import { exampleLineup, qlooImage } from "./lineup";
import { mirageSkills } from "./skills";
import { startComponents, startLayout } from "./start";

const brand = { brand: "Mirage Valley", logo: "", accent: "#e0603a" };
const dates = "April 16–18, 2027";

// The picker lists the bill headliners first, like the poster.
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
  "Afternoons run 90°F and over, nights drop to the 60s: shade and water matter before 6 PM.";

export default defineCatalogue({
  id: "festival",
  name: "Festival",
  description: "A multi-day festival and its lineup, with a guide that plans each person's days.",
  theme: "desert",
  parts: {
    start: { layout: startLayout, components: startComponents },
    intake: { layout: intakeLayout, components: intakeComponents },
    artifact: { layout: artifactLayout, components: artifactComponents },
  },
  skills: mirageSkills,
  example: {
    catalogue: "festival",
    name: "Mirage Valley Guide",
    workflow: {
      prompt: [
        `Mirage Valley Music & Arts Festival: three days in the desert outside Indio, California, ${dates} (Friday to Sunday).`,
        "Four stages: Sundial Stage (the main stage), Palm Court (an open-air amphitheatre on the grass), The Dune (the dance tent, open latest) and Oasis Tent (the smallest, for discoveries).",
        gettingAround,
        "The reader has a ticket. Plan their weekend around the acts they're there for, find them a few they don't know yet, and make the call when two of them clash.",
      ].join("\n"),
      skills: ["mirage-voice"],
      lookups: [
        {
          id: "mornings",
          props: {
            name: "Mornings before the gates",
            type: "place",
            near: "city",
            place: "Palm Springs, CA",
            kinds: ["coffee", "brunch"],
            take: 12,
          },
        },
      ],
      steps: [{ id: "ranking", type: "lineup", props: { lineup: "lineup", picks: "excited", notes: gettingAround } }],
    },
    parts: {
      start: {
        enabled: true,
        settings: {
          ...brand,
          nav: [
            { link: { label: "Lineup", href: "#lineup" } },
            { link: { label: "Know before you go", href: "#info" } },
            { link: { label: "Questions", href: "#faq" } },
          ],
          cta: { label: "Plan my weekend", href: "#start" },
          footer: `Mirage Valley Music & Arts Festival · Indio, California · ${dates}`,
        },
        components: [
          {
            id: "poster",
            type: "poster",
            props: {
              name: "Mirage Valley",
              subtitle: "Music & Arts Festival",
              dates,
              place: "Indio, California",
              // Photos from Unsplash (free licence), faded into the sky.
              image: unsplash("photo-1758636090037-aa17948d1954"),
              headliners,
              body: "Forty-one acts on four stages, and some of the ones you love play at the same time. Tell us who you're there for and we'll plan your three days set by set.",
              signup: true,
              formTitle: "Plan your weekend",
              formBody: "Eight questions about who you're there for and how you do a festival. The link lands in your inbox.",
              askName: true,
              button: "Plan my weekend",
              note: "We'll email you the link, and only ever about Mirage Valley.",
              cta: { label: "Plan my weekend", href: "#join" },
            },
          },
          {
            id: "strip",
            type: "marquee",
            props: { text: "April 16–18 ✶ Four stages ✶ Forty-one acts ✶ Gates at noon ✶ Last set around 1 AM" },
          },
          {
            id: "how",
            type: "features",
            props: {
              heading: "Your weekend, planned",
              columns: "3",
              numbered: false,
              items: [
                { title: "Tap who you're there for", body: "Pick from the bill, then tell us what else you've had on repeat." },
                { title: "We score all forty-one acts", body: "Qloo, a taste engine, matches every act on the bill to the artists you love. That's how we find the ones you haven't heard yet." },
                { title: "Get your three days, set by set", body: "With the clashes decided, a break from the heat each afternoon, and breakfast near where you're staying." },
              ],
            },
          },
          { id: "lineup", type: "lineup", props: { heading: "The lineup", view: "poster", ...exampleLineup } },
          {
            id: "info",
            type: "info",
            props: {
              heading: "Know before you go",
              items: [
                { label: "Gates", title: "Noon to 1 AM", body: "Gates open at noon each day. The Dune plays latest." },
                { label: "Getting there", title: "Shuttles from Palm Springs", body: "Every 20 minutes from 11 AM, and back until 2 AM." },
                { label: "Heat", title: "90°F by 2 PM", body: "Free water at every stage. Shade under the Palm Court trees." },
                { label: "Camping", title: "Opens Thursday at noon", body: "Car and tent camping, a short walk from the main gate." },
              ],
            },
          },
          {
            id: "signup",
            type: "optin",
            props: {
              formTitle: "Plan your weekend",
              formBody: "Eight questions, then your three days set by set.",
              image: unsplash("photo-1614666893546-b8334e9f924b"),
              headline: "Who are you there for?",
              body: "Tell us, and we'll plan the rest of the weekend around them. The link comes to your inbox, so it's on your phone in the desert.",
              askName: true,
              button: "Plan my weekend",
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
                  question: "How do you know who I'd like?",
                  answer: "We give your picks to Qloo, a taste engine, and it scores every act on the bill against them. Each new act we suggest is there because of artists you already play.",
                },
                {
                  question: "Do I have to pick everyone I want to see?",
                  answer: "No. Pick the ones you'd be gutted to miss, and we'll fill the gaps with acts you'll probably like.",
                },
                {
                  question: "What if set times change?",
                  answer: "Your plan uses the times published when you make it. Check the festival app on the day, and make a new plan if a lot has moved.",
                },
                { question: "Can I share it with my friends?", answer: "Yes. Send them the link, or have each of them make their own and compare." },
              ],
            },
          },
        ],
      },
      intake: {
        enabled: true,
        settings: { ...brand, next: "Next", submit: "Plan my weekend" },
        components: [
          {
            id: "excited",
            type: "acts",
            props: {
              question: "Who are you most excited to see?",
              help: "Tap everyone you'd be gutted to miss. We plan around them first.",
              required: true,
              max: 0,
              options: acts,
            },
          },
          {
            id: "also",
            type: "text",
            props: {
              question: "What else have you had on repeat?",
              help: "A few artists, on the bill or not. It's how we find acts you haven't heard yet.",
              required: false,
              size: "short",
              placeholder: "Parcels, Little Dragon, Sade",
            },
          },
          {
            id: "days",
            type: "choice",
            props: {
              question: "Which days are you coming?",
              help: "We'll only plan the days you're there.",
              required: true,
              multiple: true,
              options: [{ label: "Friday" }, { label: "Saturday" }, { label: "Sunday" }],
            },
          },
          {
            id: "crew",
            type: "choice",
            props: {
              question: "Who are you going with?",
              help: "Groups cross between stages slower, so we leave more time.",
              required: true,
              multiple: false,
              options: [
                { label: "Just me" },
                { label: "My partner" },
                { label: "A group of friends" },
                { label: "Friends who all like different things" },
              ],
            },
          },
          {
            id: "style",
            type: "choice",
            props: {
              question: "How do you do a festival?",
              help: "It decides the hard calls when two acts clash.",
              required: true,
              multiple: false,
              options: [
                { label: "Front and centre for the ones I love" },
                { label: "See as much as I can" },
                { label: "Wander and find new things" },
                { label: "Pace myself. It's three days." },
              ],
            },
          },
          {
            id: "late",
            type: "choice",
            props: {
              question: "When does your night end?",
              help: "So the plan stops when you do.",
              required: true,
              multiple: false,
              options: [
                { label: "After the headliner" },
                { label: "In the dance tent at close" },
                { label: "Depends how the day went" },
                { label: "Early. I'm there for the sunset sets." },
              ],
            },
          },
          {
            id: "discover",
            type: "scale",
            props: {
              question: "How much do you want to discover?",
              help: "Low keeps the plan to acts you know. High fills the gaps with new ones.",
              required: true,
              max: 5,
              low: "Just my favourites",
              high: "Surprise me",
            },
          },
          {
            id: "stay",
            type: "choice",
            props: {
              question: "Where are you staying?",
              help: "So we can find you breakfast before the gates open.",
              required: true,
              multiple: false,
              options: [
                { label: "Camping on site" },
                { label: "Palm Springs" },
                { label: "Indio or La Quinta" },
                { label: "Driving in each day" },
              ],
            },
          },
        ],
      },
      artifact: {
        enabled: true,
        settings: { ...brand, footer: "Acts matched to your taste by Qloo, a taste engine. Set times as published; check the festival app on the day." },
        components: [
          {
            id: "pass",
            type: "ticket",
            props: {
              image: unsplash("photo-1679951702238-84d69eca4857"),
              title: "{{first_name}}'s weekend",
              intro: "Planned from who you're there for and what you've had on repeat. Every act below is on the bill, and every time is from the timetable.",
              pass: "3-Day Pass",
              dates,
              stub: "{{answers.days}}",
              share: true,
              shareLine: "Going with friends? Send them your weekend so you can plan it together.",
              shareLabel: "Share my weekend",
              shareText: "My weekend at Mirage Valley, planned set by set.",
              making: "Planning your weekend",
            },
          },
          {
            id: "read",
            type: "note",
            props: {
              lookups: [],
              heading: "How we planned it",
              length: "short",
              prompt: "Say how their answers shaped the weekend: how they do a festival, when their night ends, how much room we left for new acts, the people they're with. Point at what they told us. Don't name acts or places; the sections below do.",
              skills: [],
            },
          },
          {
            id: "plan",
            type: "schedule",
            props: { lookups: ["ranking"], heading: "Your days", perDay: 6, prompt: "", skills: ["clash-calls", "desert-days"] },
          },
          {
            id: "detours",
            type: "spotlight",
            props: { lookups: ["ranking"], heading: "Worth a detour", count: 3, prompt: "", skills: ["new-to-you"] },
          },
          {
            id: "breakfast",
            type: "picks",
            props: {
              lookups: ["mornings"],
              heading: "Before the gates open",
              count: 3,
              prompt: "Breakfast or coffee for slow festival mornings, given where they're staying. If they're camping, pick places worth the drive into Palm Springs one morning. Say what to order, from what people mention.",
              skills: [],
            },
          },
          {
            id: "app",
            type: "callout",
            props: {
              tone: "accent",
              title: "Screenshot your days",
              body: "Signal drops near the stages once the crowds arrive. Save this page to your phone before you go, and check the festival app on the day in case a set moves.",
              link: { label: "", href: "" },
            },
          },
          {
            id: "made",
            type: "made",
            props: {
              label: "For the Loro demo",
              heading: "How this page was made",
              body: "What we read, what Qloo matched, and why each act and place made the cut.",
            },
          },
        ],
      },
    },
  },
});
