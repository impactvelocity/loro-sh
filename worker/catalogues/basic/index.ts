/**
 * A plain catalogue to build and test the flow with: a landing page with
 * a sign-up, four kinds of intake screen, and an outcome page with static
 * and generated sections (generated.tsx). A real catalogue keeps the same
 * shape and swaps the components.
 */
import { defineCatalogue } from "@core/catalogue/define";
import { artifactComponents, artifactLayout } from "./artifact";
import { intakeComponents, intakeLayout } from "./intake";
import { startComponents, startLayout } from "./start";

const photo = (seed: string) => `https://picsum.photos/seed/loro-${seed}/1600/1200`;

const brand = { brand: "Weekender", logo: "", accent: "#28463a" };

export default defineCatalogue({
  id: "basic",
  name: "Basic",
  description: "Landing page, sign-up, questions and an outcome written from Qloo.",
  theme: "paper",
  parts: {
    start: { layout: startLayout, components: startComponents },
    intake: { layout: intakeLayout, components: intakeComponents },
    artifact: { layout: artifactLayout, components: artifactComponents },
  },
  example: {
    catalogue: "basic",
    name: "Weekend Plan",
    workflow: {
      prompt:
        "A plan for this coming weekend in Austin, TX, for people who live here and people visiting. Saturday and Sunday, with room to slow down.",
      skills: [],
      lookups: [
        {
          id: "places",
          props: { name: "Places in Austin", type: "place", near: "city", place: "Austin, TX", take: 16 },
        },
        { id: "music", props: { name: "Music they'd like", type: "artist", popularity: "lesser" } },
      ],
      steps: [
        { id: "weather", type: "weather", props: { units: "auto" } },
        { id: "webhook", type: "webhook", props: { url: "", tests: false } },
      ],
    },
    parts: {
      start: {
        enabled: true,
        settings: {
          ...brand,
          nav: [{ link: { label: "How It Works", href: "#how" } }, { link: { label: "Questions", href: "#faq" } }],
          footer: "An example experience, built from the Basic catalogue.",
        },
        components: [
          {
            id: "hero",
            type: "hero",
            props: {
              eyebrow: "Free · Takes two minutes",
              headline: "A weekend plan made from what you actually like",
              body: "Tell us how you like to spend your time and we'll put together a plan you can use this weekend.",
              image: photo("weekend"),
              style: "split",
              cta: { label: "Get My Plan", href: "#start" },
            },
          },
          {
            id: "how",
            type: "features",
            props: {
              heading: "How it works",
              columns: "3",
              numbered: true,
              items: [
                {
                  title: "Answer six questions",
                  body: "What the weekend's for, how full you want it, and what you're into.",
                },
                { title: "We plan it", body: "Each stop is picked for the answers you gave, not for what's popular." },
                { title: "Keep the link", body: "Your plan stays at its own address, so you can open it on the day." },
              ],
            },
          },
          {
            id: "quotes",
            type: "testimonials",
            props: {
              heading: "",
              items: [
                {
                  quote: "It sent us to a bakery we'd walked past a hundred times. Best Saturday in ages.",
                  name: "Maya",
                  detail: "Used it in October",
                },
                {
                  quote: "I said slow and it meant it. Two stops and a long lunch.",
                  name: "Theo",
                  detail: "Used it in September",
                },
              ],
            },
          },
          {
            id: "faq",
            type: "faq",
            props: {
              heading: "Questions",
              items: [
                { question: "Is it free?", answer: "Yes. You only need an email address so we can send you the link." },
                {
                  question: "What do you do with my answers?",
                  answer:
                    "We use them to make your plan and keep them on your profile, so the next one starts from what we already know.",
                },
              ],
            },
          },
          {
            id: "signup",
            type: "optin",
            props: {
              headline: "Start with your name",
              body: "We'll email you the link to your plan as well.",
              askName: true,
              button: "Start",
              note: "We'll only email you about your plan.",
            },
          },
        ],
      },
      intake: {
        enabled: true,
        settings: { ...brand, background: "", progress: "bar", next: "Next", submit: "Make My Plan" },
        components: [
          {
            id: "occasion",
            type: "text",
            props: {
              question: "What's the weekend for?",
              help: "A birthday, a friend in town, a reset. Anything helps.",
              required: true,
              size: "short",
              placeholder: "My sister's visiting",
            },
          },
          {
            id: "pace",
            type: "choice",
            props: {
              question: "How full should it be?",
              help: "",
              required: true,
              multiple: false,
              options: [
                { label: "Slow, one or two things" },
                { label: "A good mix" },
                { label: "Out the door all day" },
              ],
            },
          },
          {
            id: "taste-intro",
            type: "statement",
            props: {
              title: "Now the good part",
              body: "Two questions about what you're into, then we'll get planning.",
              media: { type: "image", url: "" },
            },
          },
          {
            id: "interests",
            type: "choice",
            props: {
              question: "What are you into?",
              help: "",
              required: true,
              multiple: true,
              options: [
                { label: "Food" },
                { label: "Live music" },
                { label: "Art" },
                { label: "Outdoors" },
                { label: "Shopping" },
                { label: "Late nights" },
              ],
            },
          },
          {
            id: "budget",
            type: "scale",
            props: {
              question: "How much do you want to spend?",
              help: "",
              required: false,
              max: 5,
              low: "As little as possible",
              high: "Treat ourselves",
            },
          },
          {
            id: "avoid",
            type: "text",
            props: {
              question: "Anything we should steer clear of?",
              help: "",
              required: false,
              size: "long",
              placeholder: "Crowds, early starts, anything spicy",
            },
          },
        ],
      },
      artifact: {
        enabled: true,
        settings: { ...brand, width: "narrow", footer: "Made with the Basic catalogue. Every pick comes from Qloo." },
        components: [
          {
            id: "header",
            type: "header",
            props: {
              eyebrow: "Made for {{first_name}}",
              title: "Your weekend in Austin, {{first_name}}",
              intro: "Planned around one thing you told us: {{answers.occasion}}.",
              image: photo("saturday"),
            },
          },
          { id: "before", type: "note", props: { heading: "Before you go", length: "short", prompt: "", skills: [] } },
          {
            id: "plan",
            type: "day-plan",
            props: { lookups: ["places"], heading: "The plan", span: "weekend", stops: 3, prompt: "", skills: [] },
          },
          {
            id: "soundtrack",
            type: "picks",
            props: {
              lookups: ["music"],
              heading: "For the drive",
              count: 3,
              prompt: "Bands they probably haven't heard yet, close to what they already like.",
              skills: [],
            },
          },
          {
            id: "extra",
            type: "picks",
            props: { lookups: ["places"], heading: "If you've got time", count: 3, prompt: "", skills: [] },
          },
          { id: "summary", type: "answers", props: { heading: "What you told us", style: "list" } },
          {
            id: "again",
            type: "callout",
            props: {
              tone: "accent",
              title: "Want one for next weekend?",
              body: "We'll start from what you told us today.",
              link: { label: "Plan Another", href: "#" },
            },
          },
        ],
      },
    },
  },
});
