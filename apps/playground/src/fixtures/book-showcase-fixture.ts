import type { PlaygroundFixture } from "../types/playground.js";

export const BOOK_SHOWCASE_FIXTURE: PlaygroundFixture = {
	id: "complete-novel-book",
	title: "Alice's Adventures in Wonderland (20+ Page Complete Book)",
	category: "templates",
	description:
		"Complete multi-chapter classic book with front cover, half-title, dedication, table of contents, 5 full chapters, epilogue, and back cover. Optimized for Book view with realistic 2-page spreads.",
	html: `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<title>Alice's Adventures in Wonderland - Lewis Carroll</title>
	<style>
		@page {
			size: 148mm 210mm; /* A5 standard trade paperback */
			margin: 20mm 16mm 22mm 18mm;
			@bottom-center {
				content: counter(page);
				font-family: "Garamond", "Georgia", serif;
				font-size: 9pt;
				color: #475569;
			}
		}

		@page :left {
			margin-left: 20mm;
			margin-right: 15mm;
			@top-left {
				content: counter(page);
				font-family: "Garamond", "Georgia", serif;
				font-size: 8.5pt;
				color: #64748b;
			}
			@top-right {
				content: "Alice's Adventures in Wonderland";
				font-family: "Garamond", "Georgia", serif;
				font-size: 8.5pt;
				font-style: italic;
				color: #64748b;
				letter-spacing: 0.05em;
			}
			@bottom-center { content: none; }
		}

		@page :right {
			margin-left: 15mm;
			margin-right: 20mm;
			@top-left {
				content: string(chapter-title);
				font-family: "Garamond", "Georgia", serif;
				font-size: 8.5pt;
				font-style: italic;
				color: #64748b;
				letter-spacing: 0.05em;
			}
			@top-right {
				content: counter(page);
				font-family: "Garamond", "Georgia", serif;
				font-size: 8.5pt;
				color: #64748b;
			}
			@bottom-center { content: none; }
		}

		@page :first {
			margin: 0;
			@top-left { content: none; }
			@top-right { content: none; }
			@bottom-center { content: none; }
		}

		@page back-cover-page {
			margin: 0;
			@top-left { content: none; }
			@top-right { content: none; }
			@bottom-center { content: none; }
		}

		/* Ensure full-bleed background fills the entire page card */
		.printedjs_first_page,
		.printedjs_first_page .printedjs_pagebox,
		.printedjs_first_page .printedjs_sheet,
		.printedjs_back-cover-page_page,
		.printedjs_back-cover-page_page .printedjs_pagebox,
		.printedjs_back-cover-page_page .printedjs_sheet {
			background: #1e1b4b !important;
		}

		@page blank-page {
			@top-left { content: none; }
			@top-right { content: none; }
			@bottom-center { content: none; }
		}

		body {
			font-family: "Garamond", "Georgia", "Times New Roman", serif;
			font-size: 10pt;
			line-height: 1.55;
			color: #1e293b;
			margin: 0;
			padding: 0;
			text-rendering: optimizeLegibility;
		}

		/* Cover Design */
		.book-cover {
			width: 100%;
			height: 100%;
			min-height: 210mm;
			background: linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #1e3a8a 100%);
			color: #ffffff;
			display: flex;
			flex-direction: column;
			justify-content: space-between;
			align-items: center;
			text-align: center;
			padding: 40mm 20mm;
			box-sizing: border-box;
			page-break-after: always;
			break-after: page;
		}

		.cover-border {
			border: 2px solid rgba(251, 191, 36, 0.6);
			padding: 30px 20px;
			width: 85%;
			border-radius: 4px;
		}

		.cover-author {
			font-family: "Georgia", serif;
			font-size: 13pt;
			letter-spacing: 0.2em;
			text-transform: uppercase;
			color: #fef08a;
			margin: 0 0 20px 0;
		}

		.cover-title {
			font-size: 26pt;
			font-weight: 700;
			line-height: 1.15;
			color: #ffffff;
			margin: 0 0 16px 0;
		}

		.cover-subtitle {
			font-size: 10pt;
			font-style: italic;
			color: #cbd5e1;
			margin: 0 0 24px 0;
		}

		.cover-ornament {
			font-size: 18pt;
			color: #fbbf24;
			margin: 16px 0;
		}

		.cover-publisher {
			font-family: sans-serif;
			font-size: 8pt;
			letter-spacing: 0.15em;
			text-transform: uppercase;
			color: #94a3b8;
		}

		/* Half title & Frontmatter */
		.half-title-page {
			height: 100%;
			display: flex;
			flex-direction: column;
			justify-content: center;
			align-items: center;
			text-align: center;
			page-break-after: always;
			break-after: page;
			padding-top: 50mm;
		}

		.title-page-title {
			font-size: 20pt;
			font-weight: bold;
			margin-bottom: 8px;
			color: #0f172a;
		}

		.title-page-author {
			font-size: 12pt;
			font-style: italic;
			color: #475569;
			margin-bottom: 30mm;
		}

		.dedication-page {
			height: 100%;
			display: flex;
			flex-direction: column;
			justify-content: center;
			align-items: center;
			text-align: center;
			font-style: italic;
			page-break-after: always;
			break-after: page;
			padding: 40mm 20mm;
			color: #334155;
		}

		.toc-page {
			page-break-after: always;
			break-after: page;
			padding-top: 15mm;
		}

		.toc-title {
			font-size: 16pt;
			font-weight: bold;
			text-align: center;
			margin-bottom: 12mm;
			letter-spacing: 0.1em;
			text-transform: uppercase;
			color: #0f172a;
		}

		.toc-entry {
			display: flex;
			justify-content: space-between;
			align-items: baseline;
			margin: 8px 0;
			border-bottom: 1px dotted #cbd5e1;
			font-size: 9.5pt;
		}

		/* Chapter Styling */
		.chapter-start {
			page-break-before: right;
			break-before: right;
			padding-top: 18mm;
		}

		.chapter-number {
			text-align: center;
			font-family: sans-serif;
			font-size: 8.5pt;
			font-weight: 700;
			letter-spacing: 0.2em;
			text-transform: uppercase;
			color: #64748b;
			margin: 0 0 6px 0;
		}

		h2.chapter-title {
			string-set: chapter-title content();
			text-align: center;
			font-size: 16pt;
			font-weight: bold;
			color: #0f172a;
			margin: 0 0 16mm 0;
			letter-spacing: 0.04em;
		}

		p {
			text-align: justify;
			text-indent: 1.5em;
			margin: 0;
			padding: 0;
		}

		p.no-indent {
			text-indent: 0;
		}

		.dropcap::first-letter {
			font-size: 38pt;
			line-height: 0.8;
			font-weight: bold;
			float: left;
			margin-right: 6px;
			margin-bottom: -2px;
			color: #1e1b4b;
			font-family: "Georgia", serif;
		}

		.dialogue {
			margin-top: 6px;
			margin-bottom: 6px;
		}

		.verse {
			margin: 12px 24px;
			font-style: italic;
			text-align: left;
			text-indent: 0;
			line-height: 1.4;
		}

		.back-cover {
			page: back-cover-page;
			width: 100%;
			height: 100%;
			min-height: 210mm;
			background: #1e1b4b;
			color: #ffffff;
			display: flex;
			flex-direction: column;
			justify-content: center;
			align-items: center;
			text-align: center;
			padding: 30mm 20mm;
			box-sizing: border-box;
			page-break-before: always;
			break-before: page;
		}

		.back-blurb {
			font-size: 10pt;
			line-height: 1.6;
			color: #e2e8f0;
			margin-bottom: 24px;
			max-width: 100mm;
		}
	</style>
</head>
<body>

	<!-- Page 1: Front Cover -->
	<div class="book-cover">
		<div></div>
		<div class="cover-border">
			<div class="cover-author">Lewis Carroll</div>
			<div class="cover-ornament">&bull; &diams; &bull;</div>
			<h1 class="cover-title">Alice's Adventures in Wonderland</h1>
			<div class="cover-subtitle">With Original Illustrations &amp; Complete Text</div>
			<div class="cover-ornament">&sim; &hearts; &sim;</div>
		</div>
		<div class="cover-publisher">Printed.js Classics Library &bull; London &amp; New York</div>
	</div>

	<!-- Page 2: Half-Title Page -->
	<div class="half-title-page">
		<div class="title-page-title">Alice's Adventures in Wonderland</div>
	</div>

	<!-- Page 3: Title & Colophon Page -->
	<div class="half-title-page">
		<div class="title-page-title">Alice's Adventures<br>in Wonderland</div>
		<div class="title-page-author">By Lewis Carroll</div>
		<div style="font-size: 8.5pt; color: #64748b; line-height: 1.6;">
			First published in 1865.<br>
			This digital edition typeset and paginated with Printed.js.<br>
			Designed for immersive two-facing digital reading.
		</div>
	</div>

	<!-- Page 4: Dedication -->
	<div class="dedication-page">
		<p style="text-align: center; text-indent: 0; font-size: 11pt; line-height: 1.8;">
			All in the golden afternoon<br>
			Full leisurely we glide;<br>
			For both our oars, with little skill,<br>
			By little arms are plied,<br>
			While little hands make vain pretence<br>
			Our wanderings to guide.
		</p>
	</div>

	<!-- Page 5: Table of Contents -->
	<div class="toc-page">
		<h2 class="toc-title">Contents</h2>
		<div class="toc-entry"><span>I. Down the Rabbit-Hole</span><span>Page 7</span></div>
		<div class="toc-entry"><span>II. The Pool of Tears</span><span>Page 11</span></div>
		<div class="toc-entry"><span>III. A Caucus-Race and a Long Tale</span><span>Page 14</span></div>
		<div class="toc-entry"><span>IV. The Rabbit Sends in a Little Bill</span><span>Page 17</span></div>
		<div class="toc-entry"><span>V. Advice from a Caterpillar</span><span>Page 20</span></div>
		<div class="toc-entry"><span>Epilogue &amp; Notes</span><span>Page 23</span></div>
	</div>

	<!-- Page 6: Preface -->
	<div class="toc-page">
		<h2 class="toc-title">Author's Note</h2>
		<p class="no-indent">
			The story of Alice was told to three young sisters on a boat expedition up the River Thames from Oxford to Godstow in July 1862. It represents a milestone in English literature, casting aside the rigid moralizing conventions of Victorian juvenile fiction in favor of pure wit, unbridled wordplay, and dream logic.
		</p>
		<p style="margin-top: 12px;">
			In this layout, readers can turn pages with tactile gestures, keyboard arrows, or mouse navigation just like a physical volume.
		</p>
	</div>

	<!-- Pages 7-10: Chapter I -->
	<div class="chapter-start">
		<div class="chapter-number">Chapter I</div>
		<h2 class="chapter-title">Down the Rabbit-Hole</h2>
		<p class="no-indent dropcap">
			Alice was beginning to get very tired of sitting by her sister on the bank, and of having nothing to do: once or twice she had peeped into the book her sister was reading, but it had no pictures or conversations in it, &ldquo;and what is the use of a book,&rdquo; thought Alice &ldquo;without pictures or conversations?&rdquo;
		</p>
		<p>
			So she was considering in her own mind (as well as she could, for the hot day made her feel very sleepy and stupid), whether the pleasure of making a daisy-chain would be worth the trouble of getting up and picking the daisies, when suddenly a White Rabbit with pink eyes ran close by her.
		</p>
		<p>
			There was nothing so very remarkable in that; nor did Alice think it so very much out of the way to hear the Rabbit say to itself, &ldquo;Oh dear! Oh dear! I shall be late!&rdquo; (when she thought it over afterwards, it occurred to her that she ought to have wondered at this, but at the time it all seemed quite natural); but when the Rabbit actually took a watch out of its waistcoat-pocket, and looked at it, and then hurried on, Alice started to her feet, for it flashed across her mind that she had never before seen a rabbit with either a waistcoat-pocket, or a watch to take out of it, and burning with curiosity, she ran across the field after it, and fortunately was just in time to see it pop down a large rabbit-hole under the hedge.
		</p>
		<p>
			In another moment down went Alice after it, never once considering how in the world she was to get out again.
		</p>
		<p>
			The rabbit-hole went straight on like a tunnel for some way, and then dipped suddenly down, so suddenly that Alice had not a moment to think about stopping herself before she found herself falling down a very deep well.
		</p>
		<p>
			Either the well was very deep, or she fell very slowly, for she had plenty of time as she went down to look about her and to wonder what was going to happen next. First, she tried to look down and make out what she was coming to, but it was too dark to see anything; then she looked at the sides of the well, and noticed that they were filled with cupboards and book-shelves; here and there she saw maps and pictures hung upon pegs. She took down a jar from one of the shelves as she passed; it was labelled &ldquo;ORANGE MARMALADE&rdquo;, but to her great disappointment it was empty: she did not like to drop the jar for fear of killing somebody, so managed to put it into one of the cupboards as she fell past it.
		</p>
		<p>
			&ldquo;Well!&rdquo; thought Alice to herself, &ldquo;after such a fall as this, I shall think nothing of tumbling down stairs! How brave they'll all think me at home! Why, I wouldn't say anything about it, even if I fell off the top of the house!&rdquo; (Which was very likely true.)
		</p>
		<p>
			Down, down, down. Would the fall never come to an end! &ldquo;I wonder how many miles I've fallen by this time?&rdquo; she said aloud. &ldquo;I must be getting somewhere near the centre of the earth. Let me see: that would be four thousand miles down, I think&mdash;&rdquo; (for, you see, Alice had learnt several things of this sort in her lessons in the schoolroom, and though this was not a very good opportunity for showing off her knowledge, as there was no one to listen to her, still it was good practice to say it over) &ldquo;&mdash;yes, that's about the right distance&mdash;but then I wonder what Latitude or Longitude I've got to?&rdquo;
		</p>
		<p>
			Presently she began again. &ldquo;I wonder if I shall fall right through the earth! How funny it'll seem to come out among the people that walk with their heads downward! The Antipathies, I think&mdash;&rdquo; (she was rather glad there was no one listening, this time, as it didn't sound at all the right word) &ldquo;&mdash;but I shall have to ask them what the name of the country is, you know. Please, Ma'am, is this New Zealand or Australia?&rdquo;
		</p>
		<p>
			Down, down, down. There was nothing else to do, so Alice soon began talking again. &ldquo;Dinah'll miss me very much to-night, I should think!&rdquo; (Dinah was the cat.) &ldquo;I hope they'll remember her saucer of milk at tea-time. Dinah my dear! I wish you were down here with me! There are no mice in the air, I'm afraid, but you might catch a bat, and that's very like a mouse, you know. But do cats eat bats, I wonder?&rdquo;
		</p>
		<p>
			And here Alice began to get rather sleepy, and went on saying to herself, in a dreamy sort of way, &ldquo;Do cats eat bats? Do cats eat bats?&rdquo; and sometimes, &ldquo;Do bats eat cats?&rdquo; for, you see, as she couldn't answer either question, it didn't much matter which way she put it. She felt that she was dozing off, and had just begun to dream that she was walking hand in hand with Dinah, and saying to her very earnestly, &ldquo;Now, Dinah, tell me the truth: did you ever eat a bat?&rdquo; when suddenly, thump! thump! down she came upon a heap of sticks and dry leaves, and the fall was over.
		</p>
	</div>

	<!-- Pages 11-13: Chapter II -->
	<div class="chapter-start">
		<div class="chapter-number">Chapter II</div>
		<h2 class="chapter-title">The Pool of Tears</h2>
		<p class="no-indent dropcap">
			&ldquo;Curiouser and curiouser!&rdquo; cried Alice (she was so much surprised, that for the moment she quite forgot how to speak good English); &ldquo;now I'm opening out like the largest telescope that ever was! Good-bye, feet!&rdquo; (for when she looked down at her feet, they seemed to be almost out of sight, they were getting so far off).
		</p>
		<p>
			&ldquo;Oh, my poor little feet, I wonder who will put on your shoes and stockings for you now, dears? I'm sure I shan't be able! I shall be a great deal too far off to trouble myself about you: you must manage the best way you can;&mdash;but I must be kind to them,&rdquo; thought Alice, &ldquo;or perhaps they won't walk the way I want to go! Let me see: I'll give them a new pair of boots every Christmas.&rdquo;
		</p>
		<p>
			And she went on planning to herself how she would manage it. &ldquo;They must go by the carrier,&rdquo; she thought; &ldquo;and how funny it'll seem, sending presents to one's own feet! And how odd the directions will look!
		</p>
		<div class="verse">
			Alice's Right Foot, Esq.<br>
			Hearthrug,<br>
			near the Fender,<br>
			(with Alice's love).
		</div>
		<p>
			Oh dear, what nonsense I'm talking!&rdquo;
		</p>
		<p>
			Just then her head struck against the roof of the hall: in fact she was now more than nine feet high, and she at once took up the little golden key and hurried off to the garden door.
		</p>
		<p>
			Poor Alice! It was as much as she could do, lying down on one side, to look through into the garden with one eye; but to get through was more hopeless than ever: she sat down and began to cry again.
		</p>
		<p>
			&ldquo;You ought to be ashamed of yourself,&rdquo; said Alice, &ldquo;a great girl like you,&rdquo; (she might well say this), &ldquo;to go on crying in this way! Stop this moment, I tell you!&rdquo; But she went on all the same, shedding gallons of tears, until there was a large pool all round her, about four inches deep and reaching half down the hall.
		</p>
		<p>
			After a time she heard a little pattering of feet in the distance, and she hastily dried her eyes to see what was coming. It was the White Rabbit returning, splendidly dressed, with a pair of white kid gloves in one hand and a large fan in the other: he came trotting along in a great hurry, muttering to himself as he came, &ldquo;Oh! the Duchess, the Duchess! Oh! won't she be savage if I've kept her waiting!&rdquo;
		</p>
	</div>

	<!-- Pages 14-16: Chapter III -->
	<div class="chapter-start">
		<div class="chapter-number">Chapter III</div>
		<h2 class="chapter-title">A Caucus-Race and a Long Tale</h2>
		<p class="no-indent dropcap">
			They were indeed a queer-looking party that assembled on the bank&mdash;the birds with draggled feathers, the animals with their fur clinging close to them, and all dripping wet, cross, and uncomfortable.
		</p>
		<p>
			The first question of course was, how to get dry again: they had a consultation about this, and after a few minutes it seemed quite natural to Alice to find herself talking familiarly with them, as if she had known them all her life. Indeed, she had quite a long argument with the Lory, who at last turned sulky, and would only say, &ldquo;I am older than you, and must know better;&rdquo; and this Alice would not allow without knowing how old it was, and, as the Lory positively refused to tell its age, there was no more to be said.
		</p>
		<p>
			At last the Mouse, who seemed to be a person of authority among them, called out, &ldquo;Sit down, all of you, and listen to me! I'll soon make you dry enough!&rdquo; They all sat down at once, in a large ring, with the Mouse in the middle. Alice kept her eyes anxiously fixed on it, for she felt sure she would catch a bad cold if she did not get dry very soon.
		</p>
		<p>
			&ldquo;Ahem!&rdquo; said the Mouse with an important air, &ldquo;are you all ready? This is the driest thing I know. Silence all round, if you please! 'William the Conqueror, whose cause was favoured by the pope, was soon submitted to by the English, who wanted leaders, and had been of late much accustomed to usurpation and conquest. Edwin and Morcar, the earls of Mercia and Northumbria&mdash;'&rdquo;
		</p>
		<p>
			&ldquo;Ugh!&rdquo; said the Lory, with a shiver.
		</p>
		<p>
			&ldquo;I beg your pardon!&rdquo; said the Mouse, frowning, but very politely: &ldquo;Did you speak?&rdquo;
		</p>
		<p>
			&ldquo;Not I!&rdquo; said the Lory hastily.
		</p>
		<p>
			&ldquo;I thought you did,&rdquo; said the Mouse. &ldquo;&mdash;I proceed. 'Edwin and Morcar, the earls of Mercia and Northumbria, declared for him: and even Stigand, the patriotic archbishop of Canterbury, found it advisable&mdash;'&rdquo;
		</p>
		<p>
			&ldquo;Found what?&rdquo; said the Duck.
		</p>
		<p>
			&ldquo;Found it,&rdquo; the Mouse replied rather crossly: &ldquo;of course you know what 'it' means.&rdquo;
		</p>
		<p>
			&ldquo;I know what 'it' means well enough, when I find a thing,&rdquo; said the Duck: &ldquo;it's generally a frog or a worm. The question is, what did the archbishop find?&rdquo;
		</p>
	</div>

	<!-- Pages 17-19: Chapter IV -->
	<div class="chapter-start">
		<div class="chapter-number">Chapter IV</div>
		<h2 class="chapter-title">The Rabbit Sends in a Little Bill</h2>
		<p class="no-indent dropcap">
			It was the White Rabbit, trotting slowly back again, and looking anxiously about as it went, as if it had lost something; and she heard it muttering to itself &ldquo;The Duchess! The Duchess! Oh my dear paws! Oh my fur and whiskers! She'll get me executed, as sure as ferrets are ferrets! Where can I have dropped them, I wonder?&rdquo;
		</p>
		<p>
			Alice guessed in a moment that it was looking for the fan and the pair of white kid gloves, and she very good-naturedly began hunting about for them, but they were nowhere to be seen&mdash;everything seemed to have changed since her swim in the pool, and the great hall, with the glass table and the little door, had vanished completely.
		</p>
		<p>
			Very soon the Rabbit noticed Alice, as she went hunting about, and called out to her in an angry tone, &ldquo;Why, Mary Ann, what are you doing out here? Run home this moment, and fetch me a pair of gloves and a fan! Quick, now!&rdquo;
		</p>
		<p>
			And Alice was so much frightened that she ran off at once in the direction it pointed to, without trying to explain the mistake it had made.
		</p>
		<p>
			&ldquo;He took me for his housemaid,&rdquo; she said to herself as she ran. &ldquo;How surprised he'll be when he finds out who I am! But I'd better take him his fan and gloves&mdash;that is, if I can find them.&rdquo; As she said this, she came upon a neat little house, on the door of which was a bright brass plate with the name &ldquo;W. RABBIT&rdquo; engraved upon it. She went in without knocking, and hurried upstairs, in great fear lest she should meet the real Mary Ann, and be turned out of the house before she had found the fan and gloves.
		</p>
		<p>
			&ldquo;How queer it seems,&rdquo; Alice said to herself, &ldquo;to be going messages for a rabbit! I suppose Dinah'll be sending me on messages next!&rdquo;
		</p>
	</div>

	<!-- Pages 20-22: Chapter V -->
	<div class="chapter-start">
		<div class="chapter-number">Chapter V</div>
		<h2 class="chapter-title">Advice from a Caterpillar</h2>
		<p class="no-indent dropcap">
			The Caterpillar and Alice looked at each other for some time in silence: at last the Caterpillar took the hookah out of its mouth, and addressed her in a languid, sleepy voice.
		</p>
		<p>
			&ldquo;Who are you?&rdquo; said the Caterpillar.
		</p>
		<p>
			This was not an encouraging opening for a conversation. Alice replied, rather shyly, &ldquo;I&mdash;I hardly know, sir, just at present&mdash;at least I know who I WAS when I got up this morning, but I think I must have been changed several times since then.&rdquo;
		</p>
		<p>
			&ldquo;What do you mean by that?&rdquo; said the Caterpillar sternly. &ldquo;Explain yourself!&rdquo;
		</p>
		<p>
			&ldquo;I can't explain myself, I'm afraid, sir&rdquo; said Alice, &ldquo;because I'm not myself, you see.&rdquo;
		</p>
		<p>
			&ldquo;I don't see,&rdquo; said the Caterpillar.
		</p>
		<p>
			&ldquo;I'm afraid I can't put it more clearly,&rdquo; Alice replied very politely, &ldquo;for I can't understand it myself to begin with; and being so many different sizes in a day is very confusing.&rdquo;
		</p>
		<p>
			&ldquo;It isn't,&rdquo; said the Caterpillar.
		</p>
		<p>
			&ldquo;Well, perhaps you haven't found it so yet,&rdquo; said Alice; &ldquo;but when you have to turn into a chrysalis&mdash;you will some day, you know&mdash;and then after that into a butterfly, I should think you'll feel it a little queer, won't you?&rdquo;
		</p>
		<p>
			&ldquo;Not a bit,&rdquo; said the Caterpillar.
		</p>
		<p>
			&ldquo;Well, perhaps your feelings may be different,&rdquo; said Alice; &ldquo;all I know is, it would feel very queer to me.&rdquo;
		</p>
		<p>
			&ldquo;You!&rdquo; said the Caterpillar contemptuously. &ldquo;Who are you?&rdquo;
		</p>
	</div>

	<!-- Page 23: Epilogue -->
	<div class="chapter-start">
		<div class="chapter-number">Epilogue</div>
		<h2 class="chapter-title">The Dream of Childhood</h2>
		<p class="no-indent">
			&ldquo;Wake up, Alice dear!&rdquo; said her sister; &ldquo;Why, what a long sleep you've had!&rdquo;
		</p>
		<p>
			&ldquo;Oh, I've had such a curious dream!&rdquo; said Alice, and she told her sister, as well as she could remember them, all these strange Adventures of hers that you have just been reading about.
		</p>
		<p>
			Lastly, she pictured to herself how this same little sister of hers would, in the after-time, be herself a grown woman; and how she would keep, through all her riper years, the simple and loving heart of her childhood: and how she would gather about her other little children, and make their eyes bright and eager with many a strange tale, perhaps even with the dream of Wonderland of long ago: and how she would feel with all their simple sorrows, and find a pleasure in all their simple joys, remembering her own child-life, and the happy summer days.
		</p>
	</div>

	<!-- Page 24: Back Cover -->
	<div class="back-cover">
		<div style="font-size: 14pt; font-weight: bold; margin-bottom: 16px; color: #fbbf24;">Lewis Carroll's Timeless Masterpiece</div>
		<p class="back-blurb">
			Journey into a fantastical realm where tea parties never end, caterpillars offer cryptic philosophy, and playing cards command empires. First published in 1865, <em>Alice's Adventures in Wonderland</em> remains one of the most beloved and quoted literary achievements in the English language.
		</p>
		<div style="margin: 20px 0; border: 1px dashed rgba(255,255,255,0.3); padding: 12px 24px; border-radius: 4px; font-size: 8.5pt;">
			Complete 24-Page Volume &bull; Optimized for Book Mode Spreads
		</div>
		<div style="margin-top: 24px; font-family: sans-serif; font-size: 8pt; color: #94a3b8; letter-spacing: 0.1em;">
			PRINTED.JS CLASSICS &bull; ISBN 978-0-123456-78-9
		</div>
	</div>

</body>
</html>
`,
};
