// <nowiki>
/**
অনুবাদ কৃতিত্ব-
-MdsShakil
-ZI Jony
**/

(function($) {


/*
 ****************************************
 *** twinkleconfig.js: পছন্দ মডিউল
 ****************************************
 * আহ্বানের মোড:     Wikipedia:Twinkle/Preferences-এ কনফিগারেশন ফর্ম যোগ করে,
                           এবং এর অন্তর্গত ব্যবহারকারী উপপাতাগুলির শীর্ষে একটি প্রদর্শনী বাক্স যুক্ত করে৷
                           বর্তমানে লগ ইন করা ব্যবহারকারী যার শেষ '.js'
 * চালু আছে:              আমি এখন যা বললাম, হ্যাঁ।

 I, [[User:This, that and the other]], originally wrote this.  If the code is misbehaving, or you have any
 questions, don't hesitate to ask me.  (This doesn't at all imply [[WP:OWN]]ership - it's just meant to
 point you in the right direction.)  -- TTO
 */


Twinkle.config = {};

Twinkle.config.watchlistEnums = {
	'yes': 'নজর তালিকায় যোগ করুন (স্থায়ীভাবে)',
	'no': "নজর তালিকায় যোগ করবেন না",
	'default': 'আপনার সাইট পছন্দ অনুসরণ করুন',
	'1 week': '১ সপ্তাহের জন্য যোগ করুন',
	'1 month': '১ মাসের জন্য যোগ করুন',
	'3 months': '৩ মাসের জন্য যোগ করুন',
	'6 months': '৬ মাসের জন্য যোগ করুন'
};

Twinkle.config.commonSets = {
	csdCriteria: {
		db: 'Custom rationale ({{db}})',
		g1: 'G1', g2: 'G2', g3: 'G3', g4: 'G4', g5: 'G5', g6: 'G6', g7: 'G7', g8: 'G8', g10: 'G10', g11: 'G11', g12: 'G12', g13: 'G13', g14: 'G14',
		a1: 'A1', a2: 'A2', a3: 'A3', a5: 'A5', a7: 'A7', a9: 'A9', a10: 'A10', a11: 'A11',
		u1: 'U1', u2: 'U2', u5: 'U5',
		f1: 'F1', f2: 'F2', f3: 'F3', f7: 'F7', f8: 'F8', f9: 'F9', f10: 'F10',
		c1: 'C1',
		r2: 'R2', r3: 'R3', r4: 'R4',
		p1: 'P1', p2: 'P2'
	},
	csdCriteriaDisplayOrder: [
		'db',
		'g1', 'g2', 'g3', 'g4', 'g5', 'g6', 'g7', 'g8', 'g10', 'g11', 'g12', 'g13', 'g14',
		'a1', 'a2', 'a3', 'a5', 'a7', 'a9', 'a10', 'a11',
		'u1', 'u2', 'u5',
		'f1', 'f2', 'f3', 'f7', 'f8', 'f9', 'f10',
		'c1',
		'r2', 'r3', 'r4',
		'p1', 'p2'
	],
	csdCriteriaNotification: {
		db: 'Custom rationale ({{db}})',
		g1: 'G1', g2: 'G2', g3: 'G3', g4: 'G4', g6: 'G6 ("copy-paste move" only)',
		g10: 'G10', g11: 'G11', g12: 'G12', g13: 'G13', g14: 'G14',
		a1: 'A1', a2: 'A2', a3: 'A3', a5: 'A5', a7: 'A7', a9: 'A9', a10: 'A10', a11: 'A11',
		u5: 'U5',
		f1: 'F1', f2: 'F2', f3: 'F3', f7: 'F7', f9: 'F9', f10: 'F10',
		c1: 'C1',
		r2: 'R2', r3: 'R3', r4: 'R4',
		p1: 'P1', p2: 'P2'
	},
	csdCriteriaNotificationDisplayOrder: [
		'db',
		'g1', 'g2', 'g3', 'g4', 'g6', 'g10', 'g11', 'g12', 'g13', 'g14',
		'a1', 'a2', 'a3', 'a5', 'a7', 'a9', 'a10', 'a11',
		'u5',
		'f1', 'f2', 'f3', 'f7', 'f9', 'f10',
		'c1',
		'r2', 'r3', 'r4',
		'p1', 'p2'
	],
	csdAndDICriteria: {
		db: 'Custom rationale ({{db}})',
		g1: 'G1', g2: 'G2', g3: 'G3', g4: 'G4', g5: 'G5', g6: 'G6', g7: 'G7', g8: 'G8', g10: 'G10', g11: 'G11', g12: 'G12', g13: 'G13', g14: 'G14',
		a1: 'A1', a2: 'A2', a3: 'A3', a5: 'A5', a7: 'A7', a9: 'A9', a10: 'A10', a11: 'A11',
		u1: 'U1', u2: 'U2', u5: 'U5',
		f1: 'F1', f2: 'F2', f3: 'F3', f4: 'F4', f5: 'F5', f6: 'F6', f7: 'F7', f8: 'F8', f9: 'F9', f10: 'F10', f11: 'F11',
		c1: 'C1',
		r2: 'R2', r3: 'R3', r4: 'R4',
		p1: 'P1', p2: 'P2'
	},
	csdAndDICriteriaDisplayOrder: [
		'db',
		'g1', 'g2', 'g3', 'g4', 'g5', 'g6', 'g7', 'g8', 'g10', 'g11', 'g12', 'g13', 'g14',
		'a1', 'a2', 'a3', 'a5', 'a7', 'a9', 'a10', 'a11',
		'u1', 'u2', 'u5',
		'f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7', 'f8', 'f9', 'f10', 'f11',
		'c1',
		'r2', 'r3', 'r4',
		'p1', 'p2'
	],
	namespacesNoSpecial: {
		0: 'Article',
		1: 'Talk (article)',
		2: 'User',
		3: 'User talk',
		4: 'Wikipedia',
		5: 'Wikipedia talk',
		6: 'File',
		7: 'File talk',
		8: 'MediaWiki',
		9: 'MediaWiki talk',
		10: 'Template',
		11: 'Template talk',
		12: 'Help',
		13: 'Help talk',
		14: 'Category',
		15: 'Category talk',
		100: 'Portal',
		101: 'Portal talk',
		108: 'Book',
		109: 'Book talk',
		118: 'Draft',
		119: 'Draft talk',
		710: 'TimedText',
		711: 'TimedText talk',
		828: 'Module',
		829: 'Module talk'
	}
};

/**
 * অনুচ্ছেদ প্রবেশ বিন্যাস:
 *
 * {
 *   title: <human-readable section title>,
 *   module: <name of the associated module, used to link to sections>,
 *   adminOnly: <true for admin-only sections>,
 *   hidden: <true for advanced preferences that rarely need to be changed - they can still be modified by manually editing twinkleoptions.js>,
 *   preferences: [
 *     {
 *       name: <TwinkleConfig property name>,
 *       label: <human-readable short description - used as a form label>,
 *       helptip: <(optional) human-readable text (using valid HTML) that complements the description, like limits, warnings, etc.>
 *       adminOnly: <true for admin-only preferences>,
 *       type: <string|boolean|integer|enum|set|customList> (customList stores an array of JSON objects { value, label }),
 *       enumValues: <for type = "enum": a JSON object where the keys are the internal names and the values are human-readable strings>,
 *       setValues: <for type = "set": a JSON object where the keys are the internal names and the values are human-readable strings>,
 *       setDisplayOrder: <(optional) for type = "set": an array containing the keys of setValues (as strings) in the order that they are displayed>,
 *       customListValueTitle: <for type = "customList": the heading for the left "value" column in the custom list editor>,
 *       customListLabelTitle: <for type = "customList": the heading for the right "label" column in the custom list editor>
 *     },
 *     . . .
 *   ]
 * },
 * . . .
 *
 */

Twinkle.config.sections = [
	{
		title: 'সাধারণ',
		module: 'general',
		preferences: [
			// TwinkleConfig.userTalkPageMode may take arguments:
			// 'window': একটি নতুন উইন্ডো খুলুন, খোলা উইন্ডোটি মনে রাখবেন।
			// 'tab': সম্ভব হলে একটি নতুন ট্যাবে খুলুন।
			// 'blank': একটি নতুন উইন্ডোতে জোর করে খুলুন, এমনকি যদি এমন একটি উইন্ডো বিদ্যমান থাকে
			{
				name: 'userTalkPageMode',
				label: 'ব্যবহারকারীর আলাপ পাতা খোলার সময়, এটি খুলুন',
				type: 'enum',
				enumValues: { window: 'একটি উইন্ডোতে, অন্যান্য ব্যবহারকারীর আলোচনা প্রতিস্থাপন', tab: 'একটি নতুন ট্যাবে', blank: 'সম্পূর্ণ নতুন উইন্ডোতে' }
			},

			// TwinkleConfig.dialogLargeFont (boolean)
			{
				name: 'dialogLargeFont',
				label: 'টুইঙ্কল ডায়ালগে বড় লেখা ব্যবহার করুন',
				type: 'boolean'
			},

			// Twinkle.config.disabledModules (array)
			{
				name: 'disabledModules',
				label: 'নির্বাচিত টুইঙ্কল মডিউলগুলি বন্ধ করুন',
				helptip: 'আপনি এখানে যা কিছু নির্বাচন করেন তা ব্যবহারের জন্য উপলব্ধ হবে না, তাই যত্ন সহকারে কাজ করুন। পুনরায় সক্রিয় করতে আনচেক করুন।',
				type: 'set',
				setValues: { arv: 'ARV', warn: 'Warn', welcome: 'Welcome', shared: 'Shared IP', talkback: 'Talkback', speedy: 'CSD', prod: 'PROD', xfd: 'XfD', image: 'Image (DI)', protect: 'Protect (RPP)', tag: 'Tag', diff: 'Diff', unlink: 'Unlink', fluff: 'Revert and rollback' }
			},

			// Twinkle.config.disabledSysopModules (array)
			{
				name: 'disabledSysopModules',
				label: 'শুধুমাত্র নির্বাচিত প্রশাসক মডিউলগুলি বন্ধ করুন',
				helptip: 'আপনি এখানে যা কিছু নির্বাচন করেন তা ব্যবহারের জন্য উপলব্ধ হবে না, তাই যত্ন সহকারে কাজ করুন। পুনরায় সক্রিয় করতে আনচেক করুন।',
				adminOnly: true,
				type: 'set',
				setValues: { block: 'Block', deprod: 'DePROD', batchdelete: 'D-batch', batchprotect: 'P-batch', batchundelete: 'Und-batch' }
			}
		]
	},

	{
		title: 'ARV',
		module: 'arv',
		preferences: [
			{
				name: 'spiWatchReport',
				label: 'সকপাপেট তদন্ত প্রতিবেদন পাতা নজর তালিকায় যোগ করুন।',
				type: 'enum',
				enumValues: Twinkle.config.watchlistEnums
			}
		]
	},

	{
		title: 'ব্যবহারকারীকে বাধাদান',
		module: 'block',
		adminOnly: true,
		preferences: [
			// TwinkleConfig.defaultToBlock64 (boolean)
			// Whether to default to just blocking the /64 on or off
			{
				name: 'defaultToBlock64',
				label: 'IPv6 ঠিকানাগুলির জন্য, ডিফল্টরূপে /64 পরিসর ব্লক করার বিকল্পটি নির্বাচন করুন',
				type: 'boolean'
			},

			// TwinkleConfig.defaultToPartialBlocks (boolean)
			// Whether to default partial blocks on or off
			{
				name: 'defaultToPartialBlocks',
				label: 'অবরুদ্ধ মেনু খোলার সময় ডিফল্টরূপে আংশিক ব্লক নির্বাচন করুন',
				helptip: 'যদি ব্যবহারকারী ইতিমধ্যেই অবরুদ্ধ থাকে, তাহলে বর্তমান ব্লকের ধরণে ডিফল্ট করার পক্ষে এটি ওভাররাইড করা হবে',
				type: 'boolean'
			},

			// TwinkleConfig.blankTalkpageOnIndefBlock (boolean)
			// if true, blank the talk page when issuing an indef block notice (per [[WP:UWUL#Indefinitely blocked users]])
			{
				name: 'blankTalkpageOnIndefBlock',
				label: 'অনির্দিষ্টকালের জন্য ব্যবহারকারীদের ব্লক করার সময় আলাপ পাতা খালি করুন',
				helptip: 'আরও তথ্যের জন্য <a href="' + mw.util.getUrl('উইকিপিডিয়া:উইকিপ্রকল্প_ব্যবহারকারী_সতর্কীকরণ/ব্যবহার_ও_বিন্যাস') + '">WP:UWUL</a> দেখুন।',
				type: 'boolean'
			}
		]
	},

	{
		title: 'চিত্র অপসারণ',
		module: 'image',
		preferences: [
			// TwinkleConfig.notifyUserOnDeli (boolean)
			// যদি ব্যবহারকারী একটি ফাইল মুছে ফেলার ট্যাগ স্থাপন করার পরে অবহিত করা উচিত
			{
				name: 'notifyUserOnDeli',
				label: 'ডিফল্ট রূপে "প্রাথমিক আপলোডারকে অবহিত করুন" বক্সটি নির্বাচন করুন৷',
				type: 'boolean'
			},

			// TwinkleConfig.deliWatchPage (string)
			// মুছে ফেলার জন্য ট্যাগ করা পাতা নজর তালিকায় যোগ করার বিন্যাস।
			{
				name: 'deliWatchPage',
				label: 'ট্যাগ করার সময় চিত্র নজর তালিকায় যোগ করুন',
				type: 'enum',
				enumValues: Twinkle.config.watchlistEnums
			},

			// TwinkleConfig.deliWatchUser (string)
			// ব্যবহারকারীর আলাপ পাতার নজর তালিকা বিন্যাস যদি কোনো বিজ্ঞপ্তি দেওয়া হয়।
			{
				name: 'deliWatchUser',
				label: 'বিজ্ঞপ্তি দেওয়ার সময় প্রাথমিক আপলোডকারী ব্যবহারকারীর আলাপ  পাতা নজর তালিকায় যোগ করুন',
				type: 'enum',
				enumValues: Twinkle.config.watchlistEnums
			}
		]
	},

	{
		title: 'পাতা সুরক্ষা ' + (Morebits.userIsSysop ? '(PP)' : '(RPP)'),
		module: 'protect',
		preferences: [
			{
				name: 'watchRequestedPages',
				label: 'সুরক্ষার অনুরোধ করার সময় পাতা নজর তালিকায় যোগ করুন',
				type: 'enum',
				enumValues: Twinkle.config.watchlistEnums
			},
			{
				name: 'watchPPTaggedPages',
				label: 'সুরক্ষা টেমপ্লেট দিয়ে ট্যাগ করার সময় পাতা নজর তালিকায় যোগ করুন',
				type: 'enum',
				enumValues: Twinkle.config.watchlistEnums
			},
			{
				name: 'watchProtectedPages',
				label: 'সুরক্ষিত করার সময় চিত্র নজর তালিকায় যোগ করুন',
				helptip: 'If also tagging the page after protection, that preference will be favored.',
				adminOnly: true,
				type: 'enum',
				enumValues: Twinkle.config.watchlistEnums
			}
		]
	},

	{
		title: 'প্রস্তাবিত অপসারণ',
		module: 'prod',
		preferences: [
			// TwinkleConfig.watchProdPages (string)
			// পাতায় প্রস্তাবিত অপসারণের টেমপ্লেট প্রয়োগ করার সময় নজর তালিকার বিন্যাস।
			{
				name: 'watchProdPages',
				label: 'ট্যাগ করার সময় নিবন্ধ নজর তালিকায় যোগ করুন',
				type: 'enum',
				enumValues: Twinkle.config.watchlistEnums
			},

			// TwinkleConfig.markProdPagesAsPatrolled (boolean)
			// যদি, পাতায় প্রস্তাবিত অপসারণের টেমপ্লেট প্রয়োগ করার সময় , পাতাটিকে তত্ত্বাবধান/টহল হিসাবে চিহ্নিত করুন (যদি পাতাটিতে বিশেষ:নতুন_পাতা থেকে যাওয়া হয়ে থাকে)
			{
				name: 'markProdPagesAsPatrolled',
				label: 'ট্যাগ করার সময় পাতাটিকে টহল/পর্যালোচিত হিসাবে চিহ্নিত করুন (যদি সম্ভব হয়)',
				helptip: 'This should probably not be checked as doing so is against best practice consensus',
				type: 'boolean'
			},

			// TwinkleConfig.prodReasonDefault (string)
			// প্রস্তাবিত অপসারণ পূরণের কারণ।
			{
				name: 'prodReasonDefault',
				label: 'প্রস্তাবিত অপসারণ পূরণের কারণ',
				type: 'string'
			},

			{
				name: 'logProdPages',
				label: 'আপনি প্রস্তাবিত অপসারণ-এর জন্য ট্যাগ করেছেন এমন সমস্ত পাতাগুলি আপনার ব্যবহারকারীর একটি লগ রাখুন',
				helptip: 'Since non-admins do not have access to their deleted contributions, the userspace log offers a good way to keep track of all pages you tag for PROD using Twinkle.',
				type: 'boolean'
			},
			{
				name: 'prodLogPageName',
				label: 'প্রস্তাবিত অপসারণ-এর ব্যবহারকারী লগ উপপাতায় রাখুন',
				helptip: 'Enter a subpage name in this box. You will find your PROD log at User:<i>username</i>/<i>subpage name</i>. Only works if you turn on the PROD userspace log.',
				type: 'string'
			}
		]
	},

	{
		title: 'পূর্বাস্থায় ফেরত ও রোলব্যাক',  // twinklefluff module
		module: 'fluff',
		preferences: [
			// TwinkleConfig.autoMenuAfterRollback (bool)
			// ব্যবহারকারীর আলাপ পাতা খোলা থাকলে স্বয়ংক্রিয়ভাবে সতর্কতা মেনু খোলার বিকল্প প্রত্যাবর্তন
			{
				name: 'autoMenuAfterRollback',
				label: 'টুইংকল রোলব্যাকের পরে ব্যবহারকারীর আলাপ পাতায় স্বয়ংক্রিয়ভাবে টুইংকল সতর্কতা মেনু খুলুন',
				helptip: 'প্রাসঙ্গিক বাক্স নীচে টিক চিহ্ন দেওয়া থাকলে শুধুমাত্র কাজ করে।',
				type: 'boolean'
			},

			// TwinkleConfig.openTalkPage (array)
			// কোন ধরনের ক্রিয়ার ফলে আলাপ পাতা খোলা উচিত।
			{
				name: 'openTalkPage',
				label: 'এই ধরনের প্রত্যাবর্তনের পরে ব্যবহারকারীর আলাপ পাতা খুলুন',
				type: 'set',
				setValues: { agf: 'AGF rollback', norm: 'Normal rollback', vand: 'Vandalism rollback' }
			},

			// TwinkleConfig.openTalkPageOnAutoRevert (bool)
			// অবদান বা সাম্প্রতিক পরিবর্তনের পাতাগুলি থেকে প্রত্যাবর্তন করার সময় আলাপ পাতা খোলা উচিত কিনা তা নির্ধারণ করে। যদি openTalkPage সত্যে নির্ধারণ করা হয়, তাহলে আলাপ পাতা খোলা হবে।
			{
				name: 'openTalkPageOnAutoRevert',
				label: 'ব্যবহারকারীর অবদান বা সাম্প্রতিক পরিবর্তন গুলি থেকে প্রত্যাবর্তন করার সময় ব্যবহারকারীর আলাপ পাতা খুলুন',
				helptip: 'যখন এটি চালু থাকে, এটি কাজ করার জন্য পূর্ববর্তী বিন্যাসের পছন্দসই বিকল্পগুলি সক্রিয় করা আবশ্যক৷',
				type: 'boolean'
			},

			// TwinkleConfig.rollbackInPlace (bool)
			//
			{
				name: 'rollbackInPlace',
				label: "অবদান বা সাম্প্রতিক পরিবর্তন গুলি থেকে প্রত্যাবর্তন করার সময় পাতাটি পুনরায় লোড করবেন না",
				helptip: "যখন এটি চালু থাকে, টুইংকল প্রত্যাবর্তনের পরে অবদান বা সাম্প্রতিক পরিবর্তন পাতা পুনরায় লোড করবে না, আপনাকে একবারে একাধিক সম্পাদনা প্রত্যাবর্তন করার অনুমতি দিবে।",
				type: 'boolean'
			},

			// TwinkleConfig.markRevertedPagesAsMinor (array)
			// কোন ধরনের ক্রিয়ার ফলে সম্পাদনাকে অনুল্লেখ্য হিসাবে চিহ্নিত করা উচিত
			{
				name: 'markRevertedPagesAsMinor',
				label: 'এই ধরনের প্রত্যাবর্তনের সময় অনুল্লেখ্য সম্পাদনা হিসেবে চিহ্নিত করুন',
				type: 'set',
				setValues: { agf: 'পুনর্বহাল (আস্থা রাখুন)', norm: 'পুনর্বহাল', vand: 'পুনর্বহাল (ধ্বংসপ্রবণতা)', torev: '"এই সংস্করণটি ফিরিয়ে আনুন"' }
			},

			// TwinkleConfig.watchRevertedPages (array)
			// কোন ধরনের ক্রিয়াকলাপের ফলে নজর তালিকায় জোর করে যোগ করা উচিত
			{
				name: 'watchRevertedPages',
				label: 'এই ধরনের প্রত্যাবর্তনের সময় পাতা নজর তালিকায় যোগ করুন',
				type: 'set',
				setValues: { agf: 'পুনর্বহাল (আস্থা রাখুন)', norm: 'পুনর্বহাল', vand: 'পুনর্বহাল (ধ্বংসপ্রবণতা)', torev: '"এই সংস্করণটি ফিরিয়ে আনুন"' }
			},
			// TwinkleConfig.watchRevertedExpiry
			// If any of the above items are selected, whether to expire the watch
			{
				name: 'watchRevertedExpiry',
				label: 'পাতা প্রত্যাবর্তন করার সময় কতক্ষণ দেখতে হবে',
				type: 'enum',
				enumValues: Twinkle.config.watchlistEnums
			},

			// TwinkleConfig.offerReasonOnNormalRevert (boolean)
			// If to offer a prompt for extra summary reason for normal reverts, default to true
			{
				name: 'offerReasonOnNormalRevert',
				label: 'স্বাভাবিক রোলব্যাক এর জন্য',
				helptip: '"স্বাভাবিক" রোলব্যাকার মধ্য [পুনর্বহাল] লিঙ্ক থেকে যেগুলিকে আহ্বান করবেন।',
				type: 'boolean'
			},

			{
				name: 'confirmOnFluff',
				label: 'প্রত্যাবর্তনের আগে নিশ্চিতকরণ প্রয়োজন (সমস্ত ডিভাইস)',
				helptip: 'কলম বা স্পর্শ ডিভাইস ব্যবহারকারীদের জন্য এবং দীর্ঘস্থায়ীভাবে সিদ্ধান্তহীন ব্যক্তিদের জন্য।',
				type: 'boolean'
			},

			{
				name: 'confirmOnMobileFluff',
				label: 'প্রত্যাবর্তনের আগে নিশ্চিতকরণ প্রয়োজন (শুধুমাত্র মোবাইল ডিভাইস)',
				helptip: 'মোবাইল ডিভাইসে থাকা কালীন সময়ে দুর্ঘটনাজনিত পুনর্বহাল এড়িয়ে চলতে।',
				type: 'boolean'
			},

			// TwinkleConfig.showRollbackLinks (array)
			// Where Twinkle should show rollback links:
			// diff, others, mine, contribs, history, recent
			// Note from TTO: |contribs| seems to be equal to |others| + |mine|, i.e. redundant, so I left it out heres
			{
				name: 'showRollbackLinks',
				label: 'এই পাতা গুলিতে রোলব্যাক লিঙ্কগুলি দেখান৷',
				type: 'set',
				setValues: { diff: 'পার্থক্য পাতায়', others: 'অন্যান্য ব্যবহারকারীদের অবদান পাতায়', mine: 'আমার অবদান পাতায়', recent: 'সাম্প্রতিক পরিবর্তন এবং সম্পর্কিত পরিবর্তন বিশেষ পাতা', history: 'ইতিহাস পাতায়' }
			}
		]
	},

	{
		title: 'শেয়ারকৃত আইপি ট্যাগ',
		module: 'shared',
		preferences: [
			{
				name: 'markSharedIPAsMinor',
				label: 'Mark শেয়ারকৃত আইপি ট্যাগ as a minor edit',
				type: 'boolean'
			}
		]
	},

	{
		title: 'দ্রুত অপসারণ',
		module: 'speedy',
		preferences: [
			{
				name: 'speedySelectionStyle',
				label: 'When to go ahead and tag/delete the page',
				type: 'enum',
				enumValues: { buttonClick: 'যখন আমি "জমাদান" বোতামে ক্লিক করবো', radioClick: 'As soon as I click an option' }
			},

			// TwinkleConfig.watchSpeedyPages (array)
			// Whether to add speedy tagged or deleted pages to watchlist
			{
				name: 'watchSpeedyPages',
				label: 'Add page to watchlist when using these criteria',
				type: 'set',
				setValues: Twinkle.config.commonSets.csdCriteria,
				setDisplayOrder: Twinkle.config.commonSets.csdCriteriaDisplayOrder
			},
			// TwinkleConfig.watchSpeedyExpiry
			// If any of the above items are selected, whether to expire the watch
			{
				name: 'watchSpeedyExpiry',
				label: 'When tagging a page, how long to watch it for',
				type: 'enum',
				enumValues: Twinkle.config.watchlistEnums
			},

			// TwinkleConfig.markSpeedyPagesAsPatrolled (boolean)
			// If, when applying speedy template to page, to mark the page as triaged/patrolled (if the page was reached from NewPages)
			{
				name: 'markSpeedyPagesAsPatrolled',
				label: 'Mark page as patrolled/reviewed when tagging (if possible)',
				helptip: 'This should probably not be checked as doing so is against best practice consensus',
				type: 'boolean'
			},

			// TwinkleConfig.watchSpeedyUser (string)
			// The watchlist setting of the user talk page if they receive a notification.
			{
				name: 'watchSpeedyUser',
				label: 'Add user talk page of initial contributor to watchlist (when notifying)',
				type: 'enum',
				enumValues: Twinkle.config.watchlistEnums
			},

			// TwinkleConfig.welcomeUserOnSpeedyDeletionNotification (array of strings)
			// On what types of speedy deletion notifications shall the user be welcomed
			// with a "firstarticle" notice if their talk page has not yet been created.
			{
				name: 'welcomeUserOnSpeedyDeletionNotification',
				label: 'Welcome page creator when notifying with these criteria',
				helptip: 'The welcome is issued only if the user is notified about the deletion, and only if their talk page does not already exist. The template used is {{firstarticle}}.',
				type: 'set',
				setValues: Twinkle.config.commonSets.csdCriteriaNotification,
				setDisplayOrder: Twinkle.config.commonSets.csdCriteriaNotificationDisplayOrder
			},

			// TwinkleConfig.notifyUserOnSpeedyDeletionNomination (array)
			// What types of actions should result in the author of the page being notified of nomination
			{
				name: 'notifyUserOnSpeedyDeletionNomination',
				label: 'Notify page creator when tagging with these criteria',
				helptip: 'Even if you choose to notify from the CSD screen, the notification will only take place for those criteria selected here.',
				type: 'set',
				setValues: Twinkle.config.commonSets.csdCriteriaNotification,
				setDisplayOrder: Twinkle.config.commonSets.csdCriteriaNotificationDisplayOrder
			},

			// TwinkleConfig.warnUserOnSpeedyDelete (array)
			// What types of actions should result in the author of the page being notified of speedy deletion (admin only)
			{
				name: 'warnUserOnSpeedyDelete',
				label: 'Notify page creator when deleting under these criteria',
				helptip: 'Even if you choose to notify from the CSD screen, the notification will only take place for those criteria selected here.',
				adminOnly: true,
				type: 'set',
				setValues: Twinkle.config.commonSets.csdCriteriaNotification,
				setDisplayOrder: Twinkle.config.commonSets.csdCriteriaNotificationDisplayOrder
			},

			// TwinkleConfig.promptForSpeedyDeletionSummary (array of strings)
			{
				name: 'promptForSpeedyDeletionSummary',
				label: 'Allow editing of deletion summary when deleting under these criteria',
				adminOnly: true,
				type: 'set',
				setValues: Twinkle.config.commonSets.csdAndDICriteria,
				setDisplayOrder: Twinkle.config.commonSets.csdAndDICriteriaDisplayOrder
			},

			// TwinkleConfig.deleteTalkPageOnDelete (boolean)
			// If talk page if exists should also be deleted (CSD G8) when spedying a page (admin only)
			{
				name: 'deleteTalkPageOnDelete',
				label: 'Check the "also delete talk page" box by default',
				adminOnly: true,
				type: 'boolean'
			},

			{
				name: 'deleteRedirectsOnDelete',
				label: 'Check the "also delete redirects" box by default',
				adminOnly: true,
				type: 'boolean'
			},

			// TwinkleConfig.deleteSysopDefaultToDelete (boolean)
			// Make the CSD screen default to "delete" instead of "tag" (admin only)
			{
				name: 'deleteSysopDefaultToDelete',
				label: 'Default to outright deletion instead of speedy tagging',
				helptip: 'If there is a CSD tag already present, Twinkle will always default to "delete" mode',
				adminOnly: true,
				type: 'boolean'
			},

			// TwinkleConfig.speedyWindowWidth (integer)
			// Defines the width of the Twinkle SD window in pixels
			{
				name: 'speedyWindowWidth',
				label: 'Width of speedy deletion window (pixels)',
				type: 'integer'
			},

			// TwinkleConfig.speedyWindowWidth (integer)
			// Defines the width of the Twinkle SD window in pixels
			{
				name: 'speedyWindowHeight',
				label: 'Height of speedy deletion window (pixels)',
				helptip: 'If you have a big monitor, you might like to increase this.',
				type: 'integer'
			},

			{
				name: 'logSpeedyNominations',
				label: 'Keep a log in userspace of all CSD nominations',
				helptip: 'Since non-admins do not have access to their deleted contributions, the userspace log offers a good way to keep track of all pages you nominate for CSD using Twinkle. Files tagged using DI are also added to this log.',
				type: 'boolean'
			},
			{
				name: 'speedyLogPageName',
				label: 'Keep the CSD userspace log at this user subpage',
				helptip: 'Enter a subpage name in this box. You will find your CSD log at User:<i>username</i>/<i>subpage name</i>. Only works if you turn on the CSD userspace log.',
				type: 'string'
			},
			{
				name: 'noLogOnSpeedyNomination',
				label: 'Do not create a userspace log entry when tagging with these criteria',
				type: 'set',
				setValues: Twinkle.config.commonSets.csdAndDICriteria,
				setDisplayOrder: Twinkle.config.commonSets.csdAndDICriteriaDisplayOrder
			}
		]
	},

	{
		title: 'ট্যাগ',
		module: 'tag',
		preferences: [
			{
				name: 'watchTaggedVenues',
				label: 'Add page to watchlist when tagging these type of pages',
				type: 'set',
				setValues: { articles: 'Articles', drafts: 'Drafts', redirects: 'Redirects', files: 'Files' }
			},
			{
				name: 'watchTaggedPages',
				label: 'When tagging a page, how long to watch it for',
				type: 'enum',
				enumValues: Twinkle.config.watchlistEnums
			},
			{
				name: 'watchMergeDiscussions',
				label: 'Add talk pages to watchlist when starting merge discussions',
				type: 'enum',
				enumValues: Twinkle.config.watchlistEnums
			},
			{
				name: 'markTaggedPagesAsMinor',
				label: 'Mark addition of tags as a minor edit',
				type: 'boolean'
			},
			{
				name: 'markTaggedPagesAsPatrolled',
				label: 'Check the "mark page as patrolled/reviewed" box by default',
				type: 'boolean'
			},
			{
				name: 'groupByDefault',
				label: 'Check the "group into {{multiple issues}}" box by default',
				type: 'boolean'
			},
			{
				name: 'tagArticleSortOrder',
				label: 'Default view order for article tags',
				type: 'enum',
				enumValues: { cat: 'By categories', alpha: 'In alphabetical order' }
			},
			{
				name: 'customTagList',
				label: 'Custom article/draft maintenance tags to display',
				helptip: "These appear as additional options at the bottom of the list of tags. For example, you could add new maintenance tags which have not yet been added to Twinkle's defaults.",
				type: 'customList',
				customListValueTitle: 'Template name (no curly brackets)',
				customListLabelTitle: 'Text to show in Tag dialog'
			},
			{
				name: 'customFileTagList',
				label: 'Custom file maintenance tags to display',
				helptip: 'Additional tags that you wish to add for files.',
				type: 'customList',
				customListValueTitle: 'Template name (no curly brackets)',
				customListLabelTitle: 'Text to show in Tag dialog'
			},
			{
				name: 'customRedirectTagList',
				label: 'Custom redirect category tags to display',
				helptip: 'Additional tags that you wish to add for redirects.',
				type: 'customList',
				customListValueTitle: 'Template name (no curly brackets)',
				customListLabelTitle: 'Text to show in Tag dialog'
			}
		]
	},

	{
		title: 'ফিরতি বার্তা',
		module: 'talkback',
		preferences: [
			{
				name: 'markTalkbackAsMinor',
				label: 'Mark talkbacks as minor edits',
				type: 'boolean'
			},
			{
				name: 'insertTalkbackSignature',
				label: 'Insert signature within talkbacks',
				type: 'boolean'
			},
			{
				name: 'talkbackHeading',
				label: 'Section heading to use for talkback and please see',
				tooltip: 'Should NOT include the equals signs ("==") used for wikitext formatting',
				type: 'string'
			},
			{
				name: 'mailHeading',
				label: "Section heading to use for \"you've got mail\" notices",
				tooltip: 'Should NOT include the equals signs ("==") used for wikitext formatting',
				type: 'string'
			}
		]
	},

	{
		title: 'আনলিংক',
		module: 'unlink',
		preferences: [
			// TwinkleConfig.unlinkNamespaces (array)
			// In what namespaces unlink should happen, default in 0 (article), 10 (template), 100 (portal), and 118 (draft)
			{
				name: 'unlinkNamespaces',
				label: 'Remove links from pages in these namespaces',
				helptip: 'Avoid selecting any talk namespaces, as Twinkle might end up unlinking on talk archives (a big no-no).',
				type: 'set',
				setValues: Twinkle.config.commonSets.namespacesNoSpecial
			}
		]
	},

	{
		title: 'ব্যবহারকারীকে সতর্কীকরণ',
		module: 'warn',
		preferences: [
			// TwinkleConfig.defaultWarningGroup (int)
			// Which level warning should be the default selected group, default is 1
			{
				name: 'defaultWarningGroup',
				label: 'Default warning level',
				type: 'enum',
				enumValues: {
					1: 'Level 1',
					2: 'Level 2',
					3: 'Level 3',
					4: 'Level 4',
					5: 'Level 4im',
					6: 'Single-issue notices',
					7: 'Single-issue warnings',
					// 8 was used for block templates before #260
					9: 'Custom warnings',
					10: 'All warning templates',
					11: 'Auto-select level (1-4)'
				}
			},

			// TwinkleConfig.combinedSingletMenus (boolean)
			// if true, show one menu with both single-issue notices and warnings instead of two separately
			{
				name: 'combinedSingletMenus',
				label: 'Replace the two separate single-issue menus into one combined menu',
				helptip: 'Selecting either single-issue notices or single-issue warnings as your default will make this your default if enabled.',
				type: 'boolean'
			},

			// TwinkleConfig.showSharedIPNotice may take arguments:
			// true: to show shared ip notice if an IP address
			// false: to not print the notice
			{
				name: 'showSharedIPNotice',
				label: 'Add extra notice on shared IP talk pages',
				helptip: 'Notice used is {{Shared IP advice}}',
				type: 'boolean'
			},

			// TwinkleConfig.watchWarnings (string)
			// Watchlist setting for the page which has been dispatched an warning or notice
			{
				name: 'watchWarnings',
				label: 'Add user talk page to watchlist when notifying',
				type: 'enum',
				enumValues: Twinkle.config.watchlistEnums
			},

			// TwinkleConfig.oldSelect (boolean)
			// if true, use the native select menu rather the select2-based one
			{
				name: 'oldSelect',
				label: 'Use the non-searchable classic select menu',
				type: 'boolean'
			},

			{
				name: 'customWarningList',
				label: 'Custom warning templates to display',
				helptip: 'You can add individual templates or user subpages. Custom warnings appear in the "Custom warnings" category within the warning dialog box.',
				type: 'customList',
				customListValueTitle: 'Template name (no curly brackets)',
				customListLabelTitle: 'Text to show in warning list (also used as edit summary)'
			}
		]
	},

	{
		title: 'ব্যবহারকারীকে স্বাগত জানানো',
		module: 'welcome',
		preferences: [
			{
				name: 'topWelcomes',
				label: 'Place welcomes above existing content on user talk pages',
				type: 'boolean'
			},
			{
				name: 'watchWelcomes',
				label: 'Add user talk pages to watchlist when welcoming',
				helptip: 'Doing so adds to the personal element of welcoming a user - you will be able to see how they are coping as a newbie, and possibly help them.',
				type: 'enum',
				enumValues: Twinkle.config.watchlistEnums
			},
			{
				name: 'insertUsername',
				label: 'টেমপ্লেটে আপনার ব্যবহারকারী নাম যোগ করুন (যখন প্রযোজ্য)',
				helptip: "Some welcome templates have an opening sentence like \"Hi, I'm &lt;username&gt;. Welcome\" etc. If you turn off this option, these templates will not display your username in that way.",
				type: 'boolean'
			},
			{
				name: 'quickWelcomeMode',
				label: 'Clicking the "welcome" link on a diff page will',
				helptip: 'If you choose to welcome automatically, the template you specify below will be used.',
				type: 'enum',
				enumValues: { auto: 'welcome automatically', norm: 'prompt you to select a template' }
			},
			{
				name: 'quickWelcomeTemplate',
				label: 'Template to use when welcoming automatically',
				helptip: 'Enter the name of a welcome template, without the curly brackets. A link to the given article will be added.',
				type: 'string'
			},
			{
				name: 'customWelcomeList',
				label: 'Custom welcome templates to display',
				helptip: "You can add other welcome templates, or user subpages that are welcome templates (prefixed with \"User:\"). Don't forget that these templates are substituted onto user talk pages.",
				type: 'customList',
				customListValueTitle: 'Template name (no curly brackets)',
				customListLabelTitle: 'Text to show in Welcome dialog'
			},
			{
				name: 'customWelcomeSignature',
				label: 'পছন্দসই স্বাগত টেমপ্লেট ব্যবহার করার সময় স্বয়ংক্রিয়ভাবে স্বাক্ষর যুক্ত হবে',
				helptip: 'If your custom welcome templates contain a built-in signature within the template, turn off this option.',
				type: 'boolean'
			}
		]
	},

	{
		title: 'অপসারণ প্রস্তাবনা',
		module: 'xfd',
		preferences: [
			{
				name: 'logXfdNominations',
				label: 'Keep a log in userspace of all pages you nominate for a deletion discussion (XfD)',
				helptip: 'The userspace log offers a good way to keep track of all pages you nominate for XfD using Twinkle.',
				type: 'boolean'
			},
			{
				name: 'xfdLogPageName',
				label: 'Keep the deletion discussion userspace log at this user subpage',
				helptip: 'Enter a subpage name in this box. You will find your XfD log at User:<i>username</i>/<i>subpage name</i>. Only works if you turn on the XfD userspace log.',
				type: 'string'
			},
			{
				name: 'noLogOnXfdNomination',
				label: 'Do not create a userspace log entry when nominating at this venue',
				type: 'set',
				setValues: { afd: 'AfD', tfd: 'TfD', ffd: 'FfD', cfd: 'CfD', cfds: 'CfD/S', mfd: 'MfD', rfd: 'RfD', rm: 'RM' }
			},

			// TwinkleConfig.xfdWatchPage (string)
			// The watchlist setting of the page being nominated for XfD.
			{
				name: 'xfdWatchPage',
				label: 'Add the nominated page to watchlist',
				type: 'enum',
				enumValues: Twinkle.config.watchlistEnums
			},

			// TwinkleConfig.xfdWatchDiscussion (string)
			// The watchlist setting of the newly created XfD page (for those processes that create discussion pages for each nomination),
			// or the list page for the other processes.
			{
				name: 'xfdWatchDiscussion',
				label: 'Add the deletion discussion page to watchlist',
				helptip: 'This refers to the discussion subpage (for AfD and MfD) or the daily log page (for TfD, CfD, RfD and FfD)',
				type: 'enum',
				enumValues: Twinkle.config.watchlistEnums
			},

			// TwinkleConfig.xfdWatchList (string)
			// The watchlist setting of the XfD list page, *if* the discussion is on a separate page.
			{
				name: 'xfdWatchList',
				label: 'Add the daily log/list page to the watchlist (AfD and MfD)',
				helptip: 'This only applies for AfD and MfD, where the discussions are transcluded onto a daily log page (for AfD) or the main MfD page (for MfD).',
				type: 'enum',
				enumValues: Twinkle.config.watchlistEnums
			},

			// TwinkleConfig.xfdWatchUser (string)
			// The watchlist setting of the user talk page if they receive a notification.
			{
				name: 'xfdWatchUser',
				label: 'Add user talk page of initial contributor to watchlist (when notifying)',
				type: 'enum',
				enumValues: Twinkle.config.watchlistEnums
			},

			// TwinkleConfig.xfdWatchRelated (string)
			// The watchlist setting of the target of a redirect being nominated for RfD.
			{
				name: 'xfdWatchRelated',
				label: "Add the redirect's target page to watchlist (when notifying)",
				helptip: 'This only applies for RfD, when leaving a notification on the talk page of the target of the redirect',
				type: 'enum',
				enumValues: Twinkle.config.watchlistEnums
			},

			{
				name: 'markXfdPagesAsPatrolled',
				label: 'যদি সম্ভব হয় তবে অপসারণ প্রস্তাবনা দেওয়ার সময় পাতাটি পরীক্ষিত হিসেবে চিহ্নিত করুন',
				type: 'boolean'
			}
		]
	},

	{
		title: 'Hidden',
		hidden: true,
		preferences: [
			// twinkle.js: portlet setup
			{
				name: 'portletArea',
				type: 'string'
			},
			{
				name: 'portletId',
				type: 'string'
			},
			{
				name: 'portletName',
				type: 'string'
			},
			{
				name: 'portletType',
				type: 'string'
			},
			{
				name: 'portletNext',
				type: 'string'
			},
			// twinklefluff.js: defines how many revision to query maximum, maximum possible is 50, default is 50
			{
				name: 'revertMaxRevisions',
				type: 'integer'
			},
			// twinklewarn.js: When using the autolevel select option, how many days makes a prior warning stale
			// Huggle is three days ([[Special:Diff/918980316]] and [[Special:Diff/919417999]]) while ClueBotNG is two:
			// https://github.com/DamianZaremba/cluebotng/blob/4958e25d6874cba01c75f11debd2e511fd5a2ce5/bot/action_functions.php#L62
			{
				name: 'autolevelStaleDays',
				type: 'integer'
			},
			// How many pages should be queried by deprod and batchdelete/protect/undelete
			{
				name: 'batchMax',
				type: 'integer',
				adminOnly: true
			},
			// How many pages should be processed at a time by deprod and batchdelete/protect/undelete
			{
				name: 'batchChunks',
				type: 'integer',
				adminOnly: true
			}
		]
	}

]; // end of Twinkle.config.sections


Twinkle.config.init = function twinkleconfigInit() {

	// create the config page at Wikipedia:Twinkle/Preferences
	if ((mw.config.get('wgNamespaceNumber') === mw.config.get('wgNamespaceIds').project && mw.config.get('wgTitle') === 'টুইংকল/পছন্দসমূহ') &&
			mw.config.get('wgAction') === 'view') {

		if (!document.getElementById('twinkle-config')) {
			return;  // maybe the page is misconfigured, or something - but any attempt to modify it will be pointless
		}

		// set style (the url() CSS function doesn't seem to work from wikicode - ?!)
		document.getElementById('twinkle-config-titlebar').style.backgroundImage = 'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAkCAMAAAB%2FqqA%2BAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAEhQTFRFr73ZobTPusjdsMHZp7nVwtDhzNbnwM3fu8jdq7vUt8nbxtDkw9DhpbfSvMrfssPZqLvVztbno7bRrr7W1d%2Fs1N7qydXk0NjpkW7Q%2BgAAADVJREFUeNoMwgESQCAAAMGLkEIi%2FP%2BnbnbpdB59app5Vdg0sXAoMZCpGoFbK6ciuy6FX4ABAEyoAef0BXOXAAAAAElFTkSuQmCC)';

		var contentdiv = document.getElementById('twinkle-config-content');
		contentdiv.textContent = '';  // clear children

		// let user know about possible conflict with skin js/common.js file
		// (settings in that file will still work, but they will be overwritten by twinkleoptions.js settings)
		if (window.TwinkleConfig || window.FriendlyConfig) {
			var contentnotice = document.createElement('p');
			contentnotice.innerHTML = '<table class="plainlinks ombox ombox-content"><tr><td class="mbox-image">' +
				'<img alt="" src="https://upload.wikimedia.org/wikipedia/commons/3/38/Imbox_content.png" /></td>' +
				'<td class="mbox-text"><p><big><b>Before modifying your settings here,</b> you must remove your old Twinkle and Friendly settings from your personal skin JavaScript.</big></p>' +
				'<p>To do this, you can <a href="' + mw.util.getUrl('User:' + mw.config.get('wgUserName') + '/' + mw.config.get('skin') +
				'.js', { action: 'edit' }) + '" target="_blank"><b>edit your personal skin javascript file</b></a> or <a href="' +
				mw.util.getUrl('User:' + mw.config.get('wgUserName') + '/common.js', { action: 'edit'}) + '" target="_blank"><b>your common.js file</b></a>, removing all lines of code that refer to <code>TwinkleConfig</code> and <code>FriendlyConfig</code>.</p>' +
				'</td></tr></table>';
			contentdiv.appendChild(contentnotice);
		}

		// start a table of contents
		var toctable = document.createElement('div');
		toctable.className = 'toc';
		toctable.style.marginLeft = '0.4em';
		// create TOC title
		var toctitle = document.createElement('div');
		toctitle.id = 'toctitle';
		var toch2 = document.createElement('h2');
		toch2.textContent = 'বিষয়বস্তু ';
		toctitle.appendChild(toch2);
		// add TOC show/hide link
		var toctoggle = document.createElement('span');
		toctoggle.className = 'toctoggle';
		toctoggle.appendChild(document.createTextNode('['));
		var toctogglelink = document.createElement('a');
		toctogglelink.className = 'internal';
		toctogglelink.setAttribute('href', '#tw-tocshowhide');
		toctogglelink.textContent = 'hide';
		toctoggle.appendChild(toctogglelink);
		toctoggle.appendChild(document.createTextNode(']'));
		toctitle.appendChild(toctoggle);
		toctable.appendChild(toctitle);
		// create item container: this is what we add stuff to
		var tocul = document.createElement('ul');
		toctogglelink.addEventListener('click', function twinkleconfigTocToggle() {
			var $tocul = $(tocul);
			$tocul.toggle();
			if ($tocul.find(':visible').length) {
				toctogglelink.textContent = 'hide';
			} else {
				toctogglelink.textContent = 'show';
			}
		}, false);
		toctable.appendChild(tocul);
		contentdiv.appendChild(toctable);

		var contentform = document.createElement('form');
		contentform.setAttribute('action', 'javascript:void(0)');  // was #tw-save - changed to void(0) to work around Chrome issue
		contentform.addEventListener('submit', Twinkle.config.save, true);
		contentdiv.appendChild(contentform);

		var container = document.createElement('table');
		container.style.width = '100%';
		contentform.appendChild(container);

		$(Twinkle.config.sections).each(function(sectionkey, section) {
			if (section.hidden || (section.adminOnly && !Morebits.userIsSysop)) {
				return true;  // i.e. "continue" in this context
			}

			// add to TOC
			var tocli = document.createElement('li');
			tocli.className = 'toclevel-1';
			var toca = document.createElement('a');
			toca.setAttribute('href', '#' + section.module);
			toca.appendChild(document.createTextNode(section.title));
			tocli.appendChild(toca);
			tocul.appendChild(tocli);

			var row = document.createElement('tr');
			var cell = document.createElement('td');
			cell.setAttribute('colspan', '3');
			var heading = document.createElement('h4');
			heading.style.borderBottom = '1px solid gray';
			heading.style.marginTop = '0.2em';
			heading.id = section.module;
			heading.appendChild(document.createTextNode(section.title));
			cell.appendChild(heading);
			row.appendChild(cell);
			container.appendChild(row);

			var rowcount = 1;  // for row banding

			// add each of the preferences to the form
			$(section.preferences).each(function(prefkey, pref) {
				if (pref.adminOnly && !Morebits.userIsSysop) {
					return true;  // i.e. "continue" in this context
				}

				row = document.createElement('tr');
				row.style.marginBottom = '0.2em';
				// create odd row banding
				if (rowcount++ % 2 === 0) {
					row.style.backgroundColor = 'rgba(128, 128, 128, 0.1)';
				}
				cell = document.createElement('td');

				var label, input, gotPref = Twinkle.getPref(pref.name);
				switch (pref.type) {

					case 'boolean':  // create a checkbox
						cell.setAttribute('colspan', '2');

						label = document.createElement('label');
						input = document.createElement('input');
						input.setAttribute('type', 'checkbox');
						input.setAttribute('id', pref.name);
						input.setAttribute('name', pref.name);
						if (gotPref === true) {
							input.setAttribute('checked', 'checked');
						}
						label.appendChild(input);
						label.appendChild(document.createTextNode(pref.label));
						cell.appendChild(label);
						break;

					case 'string':  // create an input box
					case 'integer':
						// add label to first column
						cell.style.textAlign = 'right';
						cell.style.paddingRight = '0.5em';
						label = document.createElement('label');
						label.setAttribute('for', pref.name);
						label.appendChild(document.createTextNode(pref.label + ':'));
						cell.appendChild(label);
						row.appendChild(cell);

						// add input box to second column
						cell = document.createElement('td');
						cell.style.paddingRight = '1em';
						input = document.createElement('input');
						input.setAttribute('type', 'text');
						input.setAttribute('id', pref.name);
						input.setAttribute('name', pref.name);
						if (pref.type === 'integer') {
							input.setAttribute('size', 6);
							input.setAttribute('type', 'number');
							input.setAttribute('step', '1');  // integers only
						}
						if (gotPref) {
							input.setAttribute('value', gotPref);
						}
						cell.appendChild(input);
						break;

					case 'enum':  // create a combo box
						// add label to first column
						// note: duplicates the code above, under string/integer
						cell.style.textAlign = 'right';
						cell.style.paddingRight = '0.5em';
						label = document.createElement('label');
						label.setAttribute('for', pref.name);
						label.appendChild(document.createTextNode(pref.label + ':'));
						cell.appendChild(label);
						row.appendChild(cell);

						// add input box to second column
						cell = document.createElement('td');
						cell.style.paddingRight = '1em';
						input = document.createElement('select');
						input.setAttribute('id', pref.name);
						input.setAttribute('name', pref.name);
						$.each(pref.enumValues, function(enumvalue, enumdisplay) {
							var option = document.createElement('option');
							option.setAttribute('value', enumvalue);
							if ((gotPref === enumvalue) ||
								// Hack to convert old boolean watchlist prefs
								// to corresponding enums (added in v2.1)
								(typeof gotPref === 'boolean' &&
								((gotPref && enumvalue === 'yes') ||
								(!gotPref && enumvalue === 'no')))) {
								option.setAttribute('selected', 'selected');
							}
							option.appendChild(document.createTextNode(enumdisplay));
							input.appendChild(option);
						});
						cell.appendChild(input);
						break;

					case 'set':  // create a set of check boxes
						// add label first of all
						cell.setAttribute('colspan', '2');
						label = document.createElement('label');  // not really necessary to use a label element here, but we do it for consistency of styling
						label.appendChild(document.createTextNode(pref.label + ':'));
						cell.appendChild(label);

						var checkdiv = document.createElement('div');
						checkdiv.style.paddingLeft = '1em';
						var worker = function(itemkey, itemvalue) {
							var checklabel = document.createElement('label');
							checklabel.style.marginRight = '0.7em';
							checklabel.style.display = 'inline-block';
							var check = document.createElement('input');
							check.setAttribute('type', 'checkbox');
							check.setAttribute('id', pref.name + '_' + itemkey);
							check.setAttribute('name', pref.name + '_' + itemkey);
							if (gotPref && gotPref.indexOf(itemkey) !== -1) {
								check.setAttribute('checked', 'checked');
							}
							// cater for legacy integer array values for unlinkNamespaces (this can be removed a few years down the track...)
							if (pref.name === 'unlinkNamespaces') {
								if (gotPref && gotPref.indexOf(parseInt(itemkey, 10)) !== -1) {
									check.setAttribute('checked', 'checked');
								}
							}
							checklabel.appendChild(check);
							checklabel.appendChild(document.createTextNode(itemvalue));
							checkdiv.appendChild(checklabel);
						};
						if (pref.setDisplayOrder) {
							// add check boxes according to the given display order
							$.each(pref.setDisplayOrder, function(itemkey, item) {
								worker(item, pref.setValues[item]);
							});
						} else {
							// add check boxes according to the order it gets fed to us (probably strict alphabetical)
							$.each(pref.setValues, worker);
						}
						cell.appendChild(checkdiv);
						break;

					case 'customList':
						// add label to first column
						cell.style.textAlign = 'right';
						cell.style.paddingRight = '0.5em';
						label = document.createElement('label');
						label.setAttribute('for', pref.name);
						label.appendChild(document.createTextNode(pref.label + ':'));
						cell.appendChild(label);
						row.appendChild(cell);

						// add button to second column
						cell = document.createElement('td');
						cell.style.paddingRight = '1em';
						var button = document.createElement('button');
						button.setAttribute('id', pref.name);
						button.setAttribute('name', pref.name);
						button.setAttribute('type', 'button');
						button.addEventListener('click', Twinkle.config.listDialog.display, false);
						// use jQuery data on the button to store the current config value
						$(button).data({
							value: gotPref,
							pref: pref
						});
						button.appendChild(document.createTextNode('Edit items'));
						cell.appendChild(button);
						break;

					default:
						alert('twinkleconfig: unknown data type for preference ' + pref.name);
						break;
				}
				row.appendChild(cell);

				// add help tip
				cell = document.createElement('td');
				cell.style.fontSize = '90%';

				cell.style.color = 'gray';
				if (pref.helptip) {
					// convert mentions of templates in the helptip to clickable links
					cell.innerHTML = pref.helptip.replace(/{{(.+?)}}/g,
						'{{<a href="' + mw.util.getUrl('Template:') + '$1" target="_blank">$1</a>}}');
				}
				// add reset link (custom lists don't need this, as their config value isn't displayed on the form)
				if (pref.type !== 'customList') {
					var resetlink = document.createElement('a');
					resetlink.setAttribute('href', '#tw-reset');
					resetlink.setAttribute('id', 'twinkle-config-reset-' + pref.name);
					resetlink.addEventListener('click', Twinkle.config.resetPrefLink, false);
					resetlink.style.cssFloat = 'right';
					resetlink.style.margin = '0 0.6em';
					resetlink.appendChild(document.createTextNode('পুনঃস্থাপন'));
					cell.appendChild(resetlink);
				}
				row.appendChild(cell);

				container.appendChild(row);
				return true;
			});
			return true;
		});

		var footerbox = document.createElement('div');
		footerbox.setAttribute('id', 'twinkle-config-buttonpane');
		footerbox.style.backgroundColor = '#BCCADF';
		footerbox.style.padding = '0.5em';
		var button = document.createElement('button');
		button.setAttribute('id', 'twinkle-config-submit');
		button.setAttribute('type', 'submit');
		button.appendChild(document.createTextNode('পরিবর্তন সংরক্ষণ করুন'));
		footerbox.appendChild(button);
		var footerspan = document.createElement('span');
		footerspan.className = 'plainlinks';
		footerspan.style.marginLeft = '2.4em';
		footerspan.style.fontSize = '90%';
		var footera = document.createElement('a');
		footera.setAttribute('href', '#tw-reset-all');
		footera.setAttribute('id', 'twinkle-config-resetall');
		footera.addEventListener('click', Twinkle.config.resetAllPrefs, false);
		footera.appendChild(document.createTextNode('পূর্বনির্ধিরিত সেটিংস পুনরুদ্ধার করুন'));
		footerspan.appendChild(footera);
		footerbox.appendChild(footerspan);
		contentform.appendChild(footerbox);

		// since all the section headers exist now, we can try going to the requested anchor
		if (window.location.hash) {
			var loc = window.location.hash;
			window.location.hash = '';
			window.location.hash = loc;
		}

	} else if (mw.config.get('wgNamespaceNumber') === mw.config.get('wgNamespaceIds').user &&
			mw.config.get('wgTitle').indexOf(mw.config.get('wgUserName')) === 0 &&
			mw.config.get('wgPageName').slice(-3) === '.js') {

		var box = document.createElement('div');
		// Styled in twinkle.css
		box.setAttribute('id', 'twinkle-config-headerbox');

		var link,
			scriptPageName = mw.config.get('wgPageName').slice(mw.config.get('wgPageName').lastIndexOf('/') + 1,
				mw.config.get('wgPageName').lastIndexOf('.js'));

		if (scriptPageName === 'twinkleoptions') {
			// place "why not try the preference panel" notice
			box.setAttribute('class', 'config-twopt-box');

			if (mw.config.get('wgArticleId') > 0) {  // page exists
				box.appendChild(document.createTextNode('এই পাতায় আপনার টুইংকল পছন্দসমূহ সংরক্ষিত রয়েছে। আপনি যদি পছন্দ পরিবর্তন করতে চান তবে '));
			} else {  // page does not exist
				box.appendChild(document.createTextNode('আপনি আপনার পছন্দ অনুযায়ী টুইংকল পরিবর্তন করতে পারবেন। এটি করার জন্য '));
			}
			link = document.createElement('a');
			link.setAttribute('href', mw.util.getUrl(mw.config.get('wgFormattedNamespaces')[mw.config.get('wgNamespaceIds').project] + ':টুইংকল/পছন্দসমূহ'));
			link.appendChild(document.createTextNode('টুইংকল পছন্দসমূহ প্যানেল ব্যবহার করতে পারেন'));
			box.appendChild(link);
			box.appendChild(document.createTextNode(', বা এই পাতা সম্পাদনা করেও করতে পারেন।'));
			$(box).insertAfter($('#contentSub'));

		} else if (['monobook', 'vector', 'vector-2022', 'cologneblue', 'modern', 'timeless', 'minerva', 'common'].indexOf(scriptPageName) !== -1) {
			// place "Looking for Twinkle options?" notice
			box.setAttribute('class', 'config-userskin-box');

			box.appendChild(document.createTextNode('আপনি যদি টুইংকলের পছন্দ নির্ধারণ করতে চান, তবে আপনি '));
			link = document.createElement('a');
			link.setAttribute('href', mw.util.getUrl(mw.config.get('wgFormattedNamespaces')[mw.config.get('wgNamespaceIds').project] + ':টুইংকল/পছন্দসমূহ'));
			link.appendChild(document.createTextNode('টুইংকল পছন্দসমূহ প্যানেল ব্যবহার করতে পারেন'));
			box.appendChild(link);
			box.appendChild(document.createTextNode('।'));
			$(box).insertAfter($('#contentSub'));
		}
	}
};

// custom list-related stuff

Twinkle.config.listDialog = {};

Twinkle.config.listDialog.addRow = function twinkleconfigListDialogAddRow($dlgtable, value, label) {
	var $contenttr, $valueInput, $labelInput;

	$dlgtable.append(
		$contenttr = $('<tr>').append(
			$('<td>').append(
				$('<button>')
					.attr('type', 'button')
					.on('click', function () {
						$contenttr.remove();
					})
					.text('Remove')
			),
			$('<td>').append(
				$valueInput = $('<input>')
					.attr('type', 'text')
					.addClass('twinkle-config-customlist-value')
					.css('width', '97%')
			),
			$('<td>').append(
				$labelInput = $('<input>')
					.attr('type', 'text')
					.addClass('twinkle-config-customlist-label')
					.css('width', '98%')
			)
		)
	);

	if (value) {
		$valueInput.val(value);
	}
	if (label) {
		$labelInput.val(label);
	}

};

Twinkle.config.listDialog.display = function twinkleconfigListDialogDisplay(e) {
	var $prefbutton = $(e.target);
	var curvalue = $prefbutton.data('value');
	var curpref = $prefbutton.data('pref');

	var dialog = new Morebits.simpleWindow(720, 400);
	dialog.setTitle(curpref.label);
	dialog.setScriptName('Twinkle preferences');

	var $dlgtbody;

	dialog.setContent(
		$('<div>').append(
			$('<table>')
				.addClass('wikitable')
				.css({
					margin: '1.4em 1em',
					width: 'auto'
				})
				.append(
					$dlgtbody = $('<tbody>').append(
						// header row
						$('<tr>').append(
							$('<th>') // top-left cell
								.css('width', '5%'),
							$('<th>') // value column header
								.css('width', '35%')
								.text(curpref.customListValueTitle ? curpref.customListValueTitle : 'Value'),
							$('<th>') // label column header
								.css('width', '60%')
								.text(curpref.customListLabelTitle ? curpref.customListLabelTitle : 'Label')
						)
					),
					$('<tfoot>').append(
						$('<tr>').append(
							$('<td>')
								.attr('colspan', '3')
								.append(
									$('<button>')
										.text('Add')
										.css('min-width', '8em')
										.attr('type', 'button')
										.on('click', function () {
											Twinkle.config.listDialog.addRow($dlgtbody);
										})
								)
						)
					)
				),
			$('<button>')
				.text('Save changes')
				.attr('type', 'submit') // so Morebits.simpleWindow puts the button in the button pane
				.on('click', function () {
					Twinkle.config.listDialog.save($prefbutton, $dlgtbody);
					dialog.close();
				}),
			$('<button>')
				.text('Reset')
				.attr('type', 'submit')
				.on('click', function () {
					Twinkle.config.listDialog.reset($prefbutton, $dlgtbody);
				}),
			$('<button>')
				.text('Cancel')
				.attr('type', 'submit')
				.on('click', function () {
					dialog.close();
				})
		)[0]
	);

	// content rows
	var gotRow = false;
	$.each(curvalue, function(k, v) {
		gotRow = true;
		Twinkle.config.listDialog.addRow($dlgtbody, v.value, v.label);
	});
	// if there are no values present, add a blank row to start the user off
	if (!gotRow) {
		Twinkle.config.listDialog.addRow($dlgtbody);
	}

	dialog.display();
};

// Resets the data value, re-populates based on the new (default) value, then saves the
// old data value again (less surprising behaviour)
Twinkle.config.listDialog.reset = function twinkleconfigListDialogReset($button, $tbody) {
	// reset value on button
	var curpref = $button.data('pref');
	var oldvalue = $button.data('value');
	Twinkle.config.resetPref(curpref);

	// reset form
	$tbody.find('tr').slice(1).remove();  // all rows except the first (header) row
	// add the new values
	var curvalue = $button.data('value');
	$.each(curvalue, function(k, v) {
		Twinkle.config.listDialog.addRow($tbody, v.value, v.label);
	});

	// save the old value
	$button.data('value', oldvalue);
};

Twinkle.config.listDialog.save = function twinkleconfigListDialogSave($button, $tbody) {
	var result = [];
	var current = {};
	$tbody.find('input[type="text"]').each(function(inputkey, input) {
		if ($(input).hasClass('twinkle-config-customlist-value')) {
			current = { value: input.value };
		} else {
			current.label = input.value;
			// exclude totally empty rows
			if (current.value || current.label) {
				result.push(current);
			}
		}
	});
	$button.data('value', result);
};

// reset/restore defaults

Twinkle.config.resetPrefLink = function twinkleconfigResetPrefLink(e) {
	var wantedpref = e.target.id.substring(21); // "twinkle-config-reset-" prefix is stripped

	// search tactics
	$(Twinkle.config.sections).each(function(sectionkey, section) {
		if (section.hidden || (section.adminOnly && !Morebits.userIsSysop)) {
			return true;  // continue: skip impossibilities
		}

		var foundit = false;

		$(section.preferences).each(function(prefkey, pref) {
			if (pref.name !== wantedpref) {
				return true;  // continue
			}
			Twinkle.config.resetPref(pref);
			foundit = true;
			return false;  // break
		});

		if (foundit) {
			return false;  // break
		}
	});
	return false;  // stop link from scrolling page
};

Twinkle.config.resetPref = function twinkleconfigResetPref(pref) {
	switch (pref.type) {

		case 'boolean':
			document.getElementById(pref.name).checked = Twinkle.defaultConfig[pref.name];
			break;

		case 'string':
		case 'integer':
		case 'enum':
			document.getElementById(pref.name).value = Twinkle.defaultConfig[pref.name];
			break;

		case 'set':
			$.each(pref.setValues, function(itemkey) {
				if (document.getElementById(pref.name + '_' + itemkey)) {
					document.getElementById(pref.name + '_' + itemkey).checked = Twinkle.defaultConfig[pref.name].indexOf(itemkey) !== -1;
				}
			});
			break;

		case 'customList':
			$(document.getElementById(pref.name)).data('value', Twinkle.defaultConfig[pref.name]);
			break;

		default:
			alert('twinkleconfig: unknown data type for preference ' + pref.name);
			break;
	}
};

Twinkle.config.resetAllPrefs = function twinkleconfigResetAllPrefs() {
	// no confirmation message - the user can just refresh/close the page to abort
	$(Twinkle.config.sections).each(function(sectionkey, section) {
		if (section.hidden || (section.adminOnly && !Morebits.userIsSysop)) {
			return true;  // continue: skip impossibilities
		}
		$(section.preferences).each(function(prefkey, pref) {
			if (!pref.adminOnly || Morebits.userIsSysop) {
				Twinkle.config.resetPref(pref);
			}
		});
		return true;
	});
	return false;  // stop link from scrolling page
};

Twinkle.config.save = function twinkleconfigSave(e) {
	Morebits.status.init(document.getElementById('twinkle-config-content'));

	var userjs = mw.config.get('wgFormattedNamespaces')[mw.config.get('wgNamespaceIds').user] + ':' + mw.config.get('wgUserName') + '/twinkleoptions.js';
	var wikipedia_page = new Morebits.wiki.page(userjs, 'পছন্দসমূহ সংরক্ষিত হচ্ছে ' + userjs);
	wikipedia_page.setCallbackParameters(e.target);
	wikipedia_page.load(Twinkle.config.writePrefs);

	return false;
};

Twinkle.config.writePrefs = function twinkleconfigWritePrefs(pageobj) {
	var form = pageobj.getCallbackParameters();

	// this is the object which gets serialized into JSON; only
	// preferences that this script knows about are kept
	var newConfig = {optionsVersion: 2.1};

	// a comparison function is needed later on
	// it is just enough for our purposes (i.e. comparing strings, numbers, booleans,
	// arrays of strings, and arrays of { value, label })
	// and it is not very robust: e.g. compare([2], ["2"]) === true, and
	// compare({}, {}) === false, but it's good enough for our purposes here
	var compare = function(a, b) {
		if (Array.isArray(a)) {
			if (a.length !== b.length) {
				return false;
			}
			var asort = a.sort(), bsort = b.sort();
			for (var i = 0; asort[i]; ++i) {
				// comparison of the two properties of custom lists
				if ((typeof asort[i] === 'object') && (asort[i].label !== bsort[i].label ||
					asort[i].value !== bsort[i].value)) {
					return false;
				} else if (asort[i].toString() !== bsort[i].toString()) {
					return false;
				}
			}
			return true;
		}
		return a === b;

	};

	$(Twinkle.config.sections).each(function(sectionkey, section) {
		if (section.adminOnly && !Morebits.userIsSysop) {
			return;  // i.e. "continue" in this context
		}

		// reach each of the preferences from the form
		$(section.preferences).each(function(prefkey, pref) {
			var userValue;  // = undefined

			// only read form values for those prefs that have them
			if (!pref.adminOnly || Morebits.userIsSysop) {
				if (!section.hidden) {
					switch (pref.type) {
						case 'boolean':  // read from the checkbox
							userValue = form[pref.name].checked;
							break;

						case 'string':  // read from the input box or combo box
						case 'enum':
							userValue = form[pref.name].value;
							break;

						case 'integer':  // read from the input box
							userValue = parseInt(form[pref.name].value, 10);
							if (isNaN(userValue)) {
								Morebits.status.warn('Saving', 'The value you specified for ' + pref.name + ' (' + pref.value + ') was invalid.  The save will continue, but the invalid data value will be skipped.');
								userValue = null;
							}
							break;

						case 'set':  // read from the set of check boxes
							userValue = [];
							if (pref.setDisplayOrder) {
							// read only those keys specified in the display order
								$.each(pref.setDisplayOrder, function(itemkey, item) {
									if (form[pref.name + '_' + item].checked) {
										userValue.push(item);
									}
								});
							} else {
							// read all the keys in the list of values
								$.each(pref.setValues, function(itemkey) {
									if (form[pref.name + '_' + itemkey].checked) {
										userValue.push(itemkey);
									}
								});
							}
							break;

						case 'customList':  // read from the jQuery data stored on the button object
							userValue = $(form[pref.name]).data('value');
							break;

						default:
							alert('twinkleconfig: unknown data type for preference ' + pref.name);
							break;
					}
				} else if (Twinkle.prefs) {
					// Retain the hidden preferences that may have customised by the user from twinkleoptions.js
					// undefined if not set
					userValue = Twinkle.prefs[pref.name];
				}
			}

			// only save those preferences that are *different* from the default
			if (userValue !== undefined && !compare(userValue, Twinkle.defaultConfig[pref.name])) {
				newConfig[pref.name] = userValue;
			}
		});
	});

	var text =
		'// twinkleoptions.js: ব্যক্তিগত টুইংকল পছন্দ ফাইল\n' +
		'//\n' +
		'// খেয়াল করুন: টুইংকলের পছন্দসমূহ পরিবর্তনের সব থেকে সহজ পদ্ধতি হল\n' +
		'// [[' + Morebits.pageNameNorm + ']] প্যানেল ব্যবহার করা।\n' +
		'//\n' +
		'// এই ফাইলটি স্বয়ংক্রিয়ভাবে তৈরী করা হয়েছে। আপনি এখানে কোন পরিবর্তন\n' +
		'// করলে পরবর্তী সময়ে যখন আপনি টুইংকলের পছন্দসমূহ প্যানেলের "পরিবর্তন সংরক্ষণ করুন"\n' +
		'// বোতাম ক্লিক করবেন তখন এই পরিবর্তন মুছে ফেলা হবে। যদি এই ফাইল\n' +
		'// সম্পাদনা করেন, এটি নিশ্চিত হোন যে আপনি সঠিক জাভাস্ক্রিপ্ট ব্যবহার করছেন।\n' +
		'// <no' + 'wiki>\n' +
		'\n' +
		'window.Twinkle.prefs = ';
	text += JSON.stringify(newConfig, null, 2);
	text +=
		';\n' +
		'\n' +
		'// </no' + 'wiki>\n' +
		'// twinkleoptions.js-এর শেষ\n';

	pageobj.setPageText(text);
	pageobj.setEditSummary('টুইংকল পছন্দসমূহ সংরক্ষণ: [[:' + Morebits.pageNameNorm + ']]-থেকে স্বয়ংক্রিয় সম্পাদনা');
	pageobj.setChangeTags(Twinkle.changeTags);
	pageobj.setCreateOption('recreate');
	pageobj.save(Twinkle.config.saveSuccess);
};

Twinkle.config.saveSuccess = function twinkleconfigSaveSuccess(pageobj) {
	pageobj.getStatusElement().info('সফল');

	var noticebox = document.createElement('div');
	noticebox.className = 'successbox';
	noticebox.style.fontSize = '100%';
	noticebox.style.marginTop = '2em';
	noticebox.innerHTML = '<p><b>আপনার টুইংকল পছন্দসমূহ সংরক্ষিত হয়েছে।</b></p><p>এই পরিবর্তন দেখার জন্য, আপনাকে <b>আপনার ব্রাউজারের ক্যাশ পরিষ্কার করতে হবে</b> (নির্দেশনার জন্য <a href="' + mw.util.getUrl('WP:BYPASS') + '" title="WP:BYPASS">WP:BYPASS</a> দেখুন)।</p>';
	Morebits.status.root.appendChild(noticebox);
	var noticeclear = document.createElement('br');
	noticeclear.style.clear = 'both';
	Morebits.status.root.appendChild(noticeclear);
};

Twinkle.addInitCallback(Twinkle.config.init);
})(jQuery);


// </nowiki>
