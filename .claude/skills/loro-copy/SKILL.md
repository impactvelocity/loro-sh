---
name: loro-copy
description: Loro's copy guide for every word a person reads, on the sales page, in the admin and docs, and in the example experiences (start pages, questions, outcome prompts). Use when writing, editing or reviewing any user-facing Loro text, including the prompts that make models write outcome copy. Write with Harry Dry's three questions, then edit with the human-writing skill.
---

# Loro copy guide

This guide covers three kinds of copy:

- **Sales page**: the pitch for the hackathon and the video script.
- **Admin and docs**: labels, hints, empty states and the articles in `worker/core/docs.ts`.
- **Example experiences**: the demo brands' start pages, questions and outcomes, including the prompts that write outcome copy.

Write with Harry Dry's method (below), edit with the `human-writing` skill, then check against the house rules here. When the two skills disagree, this file decides.

## What we know is true

Copy starts from facts. These are the ones the user has signed off on.

- **The line:** "Loro turns your customer's taste into an experience only your brand could send."
- **The subhead:** "Loro turns what your customers love into branded experiences around the thing you sell: road trips to your festival, weekends at your hotel, a life at your listing."
- **The buyer** is the organisation (a promoter, an agency, a hotel), not the individual agent or guest.
- **The belief:** brand plus person plus taste makes the outcome. Without taste, the page is generic.
- **The framework:** open source, self-hosted, one Cloudflare Worker, deployed to your own account. Experiences have a start page, questions and an outcome. Taste comes from Qloo. Sign-ups land in Profiles. An agent, a REST API and an MCP server can run a workspace.
- **The demo brands** are fictional: Mirage Valley (festival and road trip), Harbour & Grey (property) and the agency buyer pages. Their facts live in the catalogue fixtures (`worker/catalogues/*/index.ts`). Reuse those facts; never contradict them.

Never write:

- "anchor" in sales copy or the video. It's fine in developer docs.
- Claims about Qloo's business, sales cycle or who is "too small" for it. Why Qloo cares stays unspoken.
- Stats, customers, results or quotes that don't exist. The demo is the proof.

## Harry Dry's three questions

Ask these of every line. Three no's and you're writing rubbish. Three yes's and you're onto something.

### 1. Can I visualise it?

You remember what you can see. "Charging pitbull" sticks; "seamless transition" doesn't. Abstract words are things you can't drop on your foot.

To get from abstract to concrete, zoom in. Write the vague phrase at the top of a page and keep asking "what do I actually mean?" until you reach an object, a place, a person or a number. "Regain fitness" becomes "off the couch to a 5K run", which becomes *Couch to 5K*.

For Loro:

| Abstract | Zoomed in |
| --- | --- |
| personalised experiences | your three days at Mirage Valley, planned set by set around the acts you love |
| engage your audience | a buyer opens a page about the home you found them, and the café two streets away they'd pick |
| powerful integrations | `POST /trigger` starts an experience from your CRM with the person's answers filled in |

### 2. Can I falsify it?

A sentence that could be proved true or false puts your head on the block, and readers sit up. "Gates open at noon" can be checked. "An unforgettable weekend" can't.

Point, don't talk. Instead of saying something is good, point at the thing that makes it good: the bill, the timetable, the listing, the number. Adjectives are talking; facts are pointing.

- Talking: "Smart recommendations your fans will love."
- Pointing: "Every act we suggest is on the bill, picked because of artists you already play."

If in doubt, give a fact. Then work with it until it's interesting.

### 3. Can nobody else say it?

Never write a line a competitor could sign. Swap in another product's name (a form builder, an email tool, a website builder). If the line still works, rewrite it.

What only Loro can say comes from the combination of the brand's own thing (a bill, a listing, a hotel) with one person's taste from Qloo. Copy that drops either half becomes copy anyone could write.

## Before you write: A to B

Write two sentences before any copy: what the reader thinks now (A) and what they should think after (B). Copy is the wire between those two poles. Then answer Harry's three pieces: who you're talking to, what you have to say, and how to say it well.

| Surface | Who, and where they are | A | B |
| --- | --- | --- | --- |
| Sales page and video | A judge or an organisation's lead, skimming one entry among hundreds | "Another AI page generator." | "That page could only come from that brand, for that person. And I could run it myself." |
| Admin | Someone setting up an experience, mid-task | "What does this field do?" | "Done, and I know what the guest will see." |
| Docs | A developer or operator with a job to do | "How does this piece work?" | "It works, and I didn't have to guess." |
| Experience start page | A ticket holder or buyer on their phone, half paying attention | "Another festival email." | "Eight questions and my weekend is planned. Worth it." |
| Outcome page | The same person, now invested | "Will this actually know me?" | "It knows. I'm sending this to my friends." |

The coffee-shop lesson applies to start pages: a tourist walking past reads "Coffee and pastry, £5", not a 17-item menu. Say the one thing this reader needs right now.

## Saying it well

### Pass the one-Mississippi test

Show the line, count "one Mississippi, two Mississippi". If the reader doesn't get it by then, rewrite. Judge copy where it lives: edit the fixture or component and look at the real page at phone width, among everything else on screen. A headline that wraps to three lines on a phone is a different headline.

### Find the conflict

People remember things relative to something else. Pickle juice makes orange juice taste sweeter. Look for a before and after, two ways of doing the same job, or a belief someone else doesn't share.

Loro's natural conflict is the approach: the same email sent to everyone versus a page built from one person's taste. Use it; don't name or mock competitors.

The two-choices layout (Harry's "Throw money and pray" ad, after Volkswagen's winter checklist) suits the sales page: a long list of the costly way against one short line for the Loro way.

### Compare to what people know

New products make sense next to familiar ones ("Tougher than an F-150. Faster than a 911."). If a reader won't know what an experience is, compare it to something they've used: a festival app's schedule, an estate agent's listing email.

### Make the claim small and sincere

"Increase conversions from 1% to 2%" beats "become a millionaire" because people believe it. Claim what the demo shows, nothing more.

### Make the first line earn the second

The first line's only job is to get the second one read ("It takes 3.1 seconds to read this ad" → "the same time it takes a Model S to go from 0 to 60").

### Cut until nothing else comes out

- **Kaplan's law of words:** words that aren't working for you are working against you. It applies to ideas too: the strength of an idea is inversely proportional to its scope. An "and" in a headline is a warning sign.
- **The paragraph test:** pull a sentence out. If the paragraph still works, the sentence shouldn't have been there.
- **Two-line paragraphs** on the sales page and experience pages. Short paragraphs are monkey bars; readers swing between them.
- **Done** is when you can't add a word or take one away and make it better.

### Write versions, then choose

Nobody writes simply on the first try; you rewrite simply. For any headline, hero or key line, write three to five versions side by side and pick, or show the user the versions rather than one. Getting feedback on options is easier than getting feedback on a single draft.

### Taste, conviction, experience

Harry's case against predictive writing is that it glues together words someone else already set in order. The defence is the same as Loro's pitch: specific facts from the real thing. Every generated outcome and every line of demo copy should contain something only this brand, this place or this person could produce.

## Where Harry Dry and human-writing meet

Harry likes punchy contrasts, fragments and parallel lines. `human-writing` flags binary contrasts, dramatic fragments and forced groups of three. Both are right, and the test that separates them is concreteness:

- **Keep** a contrast, fragment or parallel when every side is a falsifiable fact. "Forty-one acts, four stages, one weekend." "Tougher than an F-150. Faster than a 911."
- **Cut** it when the sides are abstract. "Not a tool. A movement." "It's not marketing. It's connection."
- **Keep** a list of three when there are three real things. Cut the third item if it's there for rhythm.

## House rules

### Case

- **Admin:** Title Case for page titles, section headings, card and dialog titles, stat labels and buttons ("New Segment", "Save Changes"). Sentence case for body copy, field labels, hints and menu items.
- **Docs:** Title Case article titles and headings, as in `core/docs.ts`. Sentence case everywhere else.
- **Experiences and the sales page:** sentence case everywhere, including headings and buttons.

### Spelling, numbers and punctuation

- British spelling, as in the existing copy: favourite, personalised, organisation, amphitheatre. Keep US units and place names for US settings (90°F, Palm Springs).
- In display copy, spell small counts out when it reads better ("Eight quick questions"). Use numerals in the admin, docs, times and prices. Times read "noon", "1 AM", "11 AM".
- Prefer commas, colons and full stops. Leave em dashes out of public copy; they read as a machine tell.
- No exclamation marks except in a person's own quoted words.

### Layout copy

- No eyebrow labels: no uppercase or tracked pre-titles above headings.
- No numbered steps or 1-2-3 lists on experience pages, no shouty caps badges, no emoji.
- In the admin, drop the subtitle when the title says enough. Keep a short hint under form fields.

### Words

Use these terms the same way every time. Repeat the clearest word rather than cycling synonyms.

| Say | Not (in user-facing copy) |
| --- | --- |
| experience | funnel (the code name) |
| start page, questions, outcome | intake (fine in the admin and docs), artifact, generation |
| profile, person, segment | lead, contact, user (for the brand's customers) |
| taste | preferences, interests (when you mean Qloo's taste signals) |
| Qloo, a taste engine (on first mention to the public) | AI recommendations |

Words that fail the three questions almost every time: seamless, unlock, elevate, curated, tailored, journey, effortless, magic, AI-powered, next-level, game-changing, hidden gem, vibrant, dream home, unforgettable, one-of-a-kind. In docs, also leave out easy, simple and quick when describing the reader's task.

## Surfaces

### Sales page and video

- Follow the pitch order: examples first (the road trip to Mirage Valley, then a hotel stay and a listing), then how and why (brand plus person plus taste; without taste it's generic), then the framework (open source, self-hosted, one-click Cloudflare deploy, any experience you can build with your agent).
- Every claim points at something on screen. If the video can't show it, the copy can't say it.
- The narrator is neutral and explains what Loro does for the brand and its customer. No hype, no "imagine if".
- Calls to action name the action: "Open the demo", "Deploy to Cloudflare", "Read the code".

### Admin and docs

- Follow the technical documentation rules in `human-writing`, with this file's case and spelling rules on top.
- Verify every behaviour against the code before writing it down. Docs examples use the Itinerary experience (a Khruangbin show at Moody Center, Austin) unless an article is about another catalogue.
- Field hints say what the field is for, in the brand's terms. Placeholders are realistic, specific examples, like the agency catalogue's "Both hybrid, downtown Tuesdays and Thursdays. Two kids under five, daycare drop-off at 8."
- Empty states say what to do next and give the button that does it.
- Errors say what happened and how to fix it, in one sentence.

### Example experiences

- Write as the brand, to one person. Each brand has one voice:
  - **Mirage Valley:** a friend who has been every year. Specific and calm, never hype.
  - **Harbour & Grey and the agency pages:** the agent who found the home. Honest about the house, never "your dream home", never invented facts about the street or the schools.
- The hero says what the person gets, using the brand's facts: "Forty-one acts, four stages, one weekend. Tell us who you're there for and we'll plan your three days around them."
- The form says how long it takes and what happens next: "Eight quick questions, then your three days planned set by set."
- Each question's hint says why you're asking, in one line: "So we can find you breakfast before the gates open."
- Privacy notes are one plain promise: "We'll only email you about Mirage Valley."
- Everything on a demo page must be true inside the demo. Acts are on the bill, times are from the timetable, places come from Qloo. Footers say where the facts come from.

### Prompts that write outcome copy

Models write most of the outcome. The prompt carries the voice, so it gets the same care as the page.

- Say who is writing, to whom, and why: "Write to the buyer as the agency."
- Give the facts as data and say what must not be invented: "Don't invent anything about the house, the street or the schools."
- Ask for pointing: name places, times, distances and the person's own picks.
- Don't let the prose repeat what a structured section already shows: "Don't name acts; the plan below does."
- Name the tone in plain words ("specific and calm, never hype") rather than adjectives like "engaging" or "exciting".
- Review generated copy as copy. Run the experience from its Tests tab with a few different profiles, read the outcomes side by side, and run `human-writing` in Detect mode on them. If two people get interchangeable paragraphs, the prompt isn't using their taste.

## Worked examples

**Sales hero**

- Before: "Loro is an AI-powered platform that delivers seamless, personalised experiences to elevate your customer journey."
- Visualise? No. Falsify? No. Only Loro? No.
- After: the line and subhead above. You can see the road trip, the hotel weekend and the listing; each one is true in the demo; and nobody without a brand's own thing plus the person's taste can say it.

**Docs**

- Before: "Loro makes it easy to seamlessly integrate with your existing tools."
- After: "`POST /trigger` starts an experience for someone from another system, such as your CRM, with their answers already filled in. It needs an API key."

**Experience help text**

- Before: "Tell us about your musical preferences so we can curate your perfect festival experience!"
- After: "A few artists, playing or not. It's how we find acts on the bill you haven't heard yet."

## Checklist

1. Write A, B and the reader in one line each.
2. Collect the facts: catalogue fixtures, step data, the real page.
3. Write three to five versions of the key lines, in place.
4. Ask the three questions of every line.
5. Run `human-writing` (Edit for drafts, Detect for generated outcomes).
6. Read it on the real page at phone width. One Mississippi, two Mississippi.
7. Pull each sentence out. Put back only the ones the paragraph needs.

Source: Harry Dry with David Perell, "Learn Copywriting in 76 Minutes" (https://www.youtube.com/watch?v=TUMjnmfsPeM), and the `human-writing` skill from vercel/eve.
