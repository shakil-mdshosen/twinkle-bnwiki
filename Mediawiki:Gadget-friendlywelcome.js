// <nowiki>


(function($) {


/*
 ****************************************
 *** friendlywelcome.js: Welcome module
 ****************************************
 * Mode of invocation:     Tab ("Wel"), or from links on diff pages
 * Active on:              Any page with relevant user name (userspace,
 *                         contribs, etc.) and diff pages
 */

Twinkle.welcome = function friendlywelcome() {
	if (mw.util.getParamValue('friendlywelcome')) {
		if (mw.util.getParamValue('friendlywelcome') === 'auto') {
			Twinkle.welcome.auto();
		} else {
			Twinkle.welcome.semiauto();
		}
	} else {
		Twinkle.welcome.normal();
	}
};

Twinkle.welcome.auto = function() {
	if (mw.util.getParamValue('action') !== 'edit') {
		// userpage not empty, aborting auto-welcome
		return;
	}

	Twinkle.welcome.welcomeUser();
};

Twinkle.welcome.semiauto = function() {
	Twinkle.welcome.callback(mw.config.get('wgRelevantUserName'));
};

Twinkle.welcome.normal = function() {
	if (mw.util.getParamValue('diff')) {
		// check whether the contributors' talk pages exist yet
		var $oList = $('#mw-diff-otitle2').find('span.mw-usertoollinks a.new:contains(talk)').first();
		var $nList = $('#mw-diff-ntitle2').find('span.mw-usertoollinks a.new:contains(talk)').first();

		if ($oList.length > 0 || $nList.length > 0) {
			var spanTag = function(color, content) {
				var span = document.createElement('span');
				span.style.color = color;
				span.appendChild(document.createTextNode(content));
				return span;
			};

			var welcomeNode = document.createElement('strong');
			var welcomeLink = document.createElement('a');
			welcomeLink.appendChild(spanTag('Black', '['));
			welcomeLink.appendChild(spanTag('Goldenrod', 'welcome'));
			welcomeLink.appendChild(spanTag('Black', ']'));
			welcomeNode.appendChild(welcomeLink);

			if ($oList.length > 0) {
				var oHref = $oList.attr('href');

				var oWelcomeNode = welcomeNode.cloneNode(true);
				oWelcomeNode.firstChild.setAttribute('href', oHref + '&' + $.param({
					friendlywelcome: Twinkle.getPref('quickWelcomeMode') === 'auto' ? 'auto' : 'norm',
					vanarticle: Morebits.pageNameNorm
				}));
				$oList[0].parentNode.parentNode.appendChild(document.createTextNode(' '));
				$oList[0].parentNode.parentNode.appendChild(oWelcomeNode);
			}

			if ($nList.length > 0) {
				var nHref = $nList.attr('href');

				var nWelcomeNode = welcomeNode.cloneNode(true);
				nWelcomeNode.firstChild.setAttribute('href', nHref + '&' + $.param({
					friendlywelcome: Twinkle.getPref('quickWelcomeMode') === 'auto' ? 'auto' : 'norm',
					vanarticle: Morebits.pageNameNorm
				}));
				$nList[0].parentNode.parentNode.appendChild(document.createTextNode(' '));
				$nList[0].parentNode.parentNode.appendChild(nWelcomeNode);
			}
		}
	}
	// Users and IPs but not IP ranges
	if (mw.config.exists('wgRelevantUserName') && !Morebits.ip.isRange(mw.config.get('wgRelevantUserName'))) {
		Twinkle.addPortletLink(function() {
			Twinkle.welcome.callback(mw.config.get('wgRelevantUserName'));
		}, 'স্বাগত', 'friendly-welcome', 'স্বাগত ব্যবহারকারী');
	}
};

Twinkle.welcome.welcomeUser = function welcomeUser() {
	Morebits.status.init(document.getElementById('mw-content-text'));
	$('#catlinks').remove();

	var params = {
		template: Twinkle.getPref('quickWelcomeTemplate'),
		article: mw.util.getParamValue('vanarticle') || '',
		mode: 'auto'
	};

	var userTalkPage = mw.config.get('wgFormattedNamespaces')[3] + ':' + mw.config.get('wgRelevantUserName');
	Morebits.wiki.actionCompleted.redirect = userTalkPage;
	Morebits.wiki.actionCompleted.notice = 'স্বাগত জানানো সম্পূর্ণ, কয়েক সেকেন্ডের মধ্যে আলাপ পাতা পুনঃলোড করা হচ্ছে';

	var wikipedia_page = new Morebits.wiki.page(userTalkPage, 'User talk page modification');
	wikipedia_page.setFollowRedirect(true);
	wikipedia_page.setCallbackParameters(params);
	wikipedia_page.load(Twinkle.welcome.callbacks.main);
};

Twinkle.welcome.callback = function friendlywelcomeCallback(uid) {
	if (uid === mw.config.get('wgUserName') && !confirm('আপনি কি সত্যিই নিশ্চিত যে আপনি নিজেকে স্বাগত জানাতে চান?...')) {
		return;
	}

	var Window = new Morebits.simpleWindow(600, 420);
	Window.setTitle('ব্যবহারকারী স্বাগত');
	Window.setScriptName('টুইংকল');
	Window.addFooterLink('অভ্যর্থনা কমিটি', 'WP:WC');
	Window.addFooterLink('স্বাগতের পছন্দ', 'WP:TW/PREF#welcome');
	Window.addFooterLink('টুইংকল সাহায্য', 'WP:TW/DOC#welcome');
	Window.addFooterLink('প্রতিক্রিয়া জানান', 'WT:TW');

	var form = new Morebits.quickForm(Twinkle.welcome.callback.evaluate);

	form.append({
		type: 'select',
		name: 'type',
		label: 'স্বাগত জানানোর ধরন:',
		event: Twinkle.welcome.populateWelcomeList,
		list: [
			{ type: 'option', value: 'standard', label: 'প্রমিত স্বাগত', selected: !mw.util.isIPAddress(mw.config.get('wgRelevantUserName')) },
			{ type: 'option', value: 'anonymous', label: 'আইপি ব্যবহারকারীকে স্বাগত', selected: mw.util.isIPAddress(mw.config.get('wgRelevantUserName')) },
			{ type: 'option', value: 'wikiProject', label: 'উইকিপ্রকল্প স্বাগত' },
			{ type: 'option', value: 'nonEnglish', label: 'অ-বাংলা স্বাগত' }
		]
	});

	form.append({
		type: 'div',
		id: 'welcomeWorkArea',
		className: 'morebits-scrollbox'
	});

	form.append({
		type: 'input',
		name: 'article',
		label: '* সংযুক্ত নিবন্ধ (টেমপ্লেট দ্বারা সমর্থিত হলে):',
		value: mw.util.getParamValue('vanarticle') || '',
		tooltip: 'An article might be linked from within the welcome if the template supports it. Leave empty for no article to be linked.  Templates that support a linked article are marked with an asterisk.'
	});

	var previewlink = document.createElement('a');
	$(previewlink).click(function() {
		Twinkle.welcome.callbacks.preview(result);  // |result| is defined below
	});
	previewlink.style.cursor = 'pointer';
	previewlink.textContent = 'প্রাকদর্শন';
	form.append({ type: 'div', name: 'welcomepreview', label: [ previewlink ] });

	form.append({ type: 'submit' });

	var result = form.render();
	Window.setContent(result);
	Window.display();

	// initialize the welcome list
	var evt = document.createEvent('Event');
	evt.initEvent('change', true, true);
	result.type.dispatchEvent(evt);
};

Twinkle.welcome.populateWelcomeList = function(e) {
	var type = e.target.value;

	var container = new Morebits.quickForm.element({ type: 'fragment' });

	if ((type === 'standard' || type === 'anonymous') && Twinkle.getPref('customWelcomeList').length) {
		container.append({ type: 'header', label: 'Custom welcome templates' });
		container.append({
			type: 'radio',
			name: 'template',
			list: Twinkle.getPref('customWelcomeList'),
			event: function() {
				e.target.form.article.disabled = false;
			}
		});
	}

	var sets = Twinkle.welcome.templates[type];
	$.each(sets, function(label, templates) {
		container.append({ type: 'header', label: label });
		container.append({
			type: 'radio',
			name: 'template',
			list: $.map(templates, function(properties, template) {
				return {
					value: template,
					label: '{{' + template + '}}: ' + properties.description + (properties.linkedArticle ? '\u00A0*' : ''),  // U+00A0 NO-BREAK SPACE
					tooltip: properties.tooltip  // may be undefined
				};
			}),
			event: function(ev) {
				ev.target.form.article.disabled = !templates[ev.target.value].linkedArticle;
			}
		});
	});

	var rendered = container.render();
	$(e.target.form).find('div#welcomeWorkArea').empty().append(rendered);

	var firstRadio = e.target.form.template[0];
	firstRadio.checked = true;
	var vals = sets[Object.keys(sets)[0]];
	e.target.form.article.disabled = vals[firstRadio.value] ? !vals[firstRadio.value].linkedArticle : true;
};

// A list of welcome templates and their properties and syntax

// The four fields that are available are "description", "linkedArticle", "syntax", and "tooltip".
// The three magic words that can be used in the "syntax" field are:
//   - $USERNAME$  - replaced by the welcomer's username, depending on user's preferences
//   - $ARTICLE$   - replaced by an article name, if "linkedArticle" is true
//   - $HEADER$    - adds a level 2 header (most templates already include this)

Twinkle.welcome.templates = {
	standard: {
		'সাধারণ স্বাগত টেমপ্লেট': {
			'স্বাগত': {
				description: 'প্রমিত স্বাগত',
				linkedArticle: true,
				syntax: '{{subst:স্বাগত|$USERNAME$|art=$ARTICLE$}} ~~~~'
			},
			'welcome-retro': {
				description: 'সহায়ক লিঙ্কগুলির ছোট একটি তালিকাসহ স্বাগত বার্তা',
				linkedArticle: true,
				syntax: '{{subst:welcome-retro|$USERNAME$|art=$ARTICLE$}} ~~~~'
			},
			'welcome-short': {
				description: 'একটি সংক্ষিপ্ত স্বাগতবার্তা',
				syntax: '{{subst:w-short|heading=true|$EXTRA$}}'
			},
			'welcome-cookie': {
				description: 'কিছু সহায়ক লিঙ্ক এবং বিস্কুটের থালাসহ একটি স্বাগত বার্তা',
				syntax: '{{subst:welcome cookie}} ~~~~'
			},
			'welcoming': {
				description: 'টিউটোরিয়াল লিঙ্ক এবং মৌলিক সম্পাদনা পরামর্শ সহ স্বাগত বার্তা',
				syntax: '{{subst:Welcoming}}'
			}
		},

		'Specific welcome templates': {
			'welcome-belated': {
				description: 'welcome for users with more substantial contributions',
				syntax: '{{subst:welcome-belated|$USERNAME$}}'
			},
			'স্বাগত শিক্ষার্থী': {
				description: 'welcome for students editing as part of an educational class project',
				syntax: '$HEADER$ {{subst:welcome student|$USERNAME$}} ~~~~'
			},
			'স্বাগত শিক্ষক': {
				description: 'welcome for course instructors involved in an educational class project',
				syntax: '$HEADER$ {{subst:welcome teacher|$USERNAME$}} ~~~~'
			},
			'স্বাগত অ-বাংলা': {
				description: 'অ-বাংলা অক্ষর যুক্ত ব্যবহারকারী নামের ব্যবহারকারীদের জন্য স্বাগত',
				syntax: '{{subst:স্বাগত অ-বাংলা|$USERNAME$}} ~~~~'
			}
		},

		'সমস্যাযুক্ত ব্যবহারকারীর স্বাগত টেমপ্লেট': {
			'welcomelaws': {
				description: 'welcome with information about copyrights, NPOV, the sandbox, and vandalism',
				syntax: '{{subst:welcomelaws|$USERNAME$}} ~~~~'
			},
			'first article': {
				description: 'প্রথমবার লেখা নিবন্ধ উল্লেখযোগ্যতার নীতিমালা পূরণ করেনি এমন ব্যবহারকারীকে স্বাগত',
				linkedArticle: true,
				syntax: '{{subst:প্রথম নিবন্ধ|$ARTICLE$|$USERNAME$}}'
			},
			'welcometest': {
				description: 'প্রাথমিক সম্পাদনা পরীক্ষামূলক বলে মনে হচ্ছে এমন ব্যবহারকারীকে স্বাগত',
				linkedArticle: true,
				syntax: '{{subst:স্বাগত-পরীক্ষামূলক|$ARTICLE$|$USERNAME$}} ~~~~'
			},
			'welcomevandal': {
				description: 'প্রাথমিক সম্পাদনা ধ্বংসপ্রবণতা বলে মনে হচ্ছে এমন ব্যবহারকারীকে স্বাগত',
				linkedArticle: true,
				syntax: '{{subst:স্বাগত-ধ্বংসপ্রবণ|$ARTICLE$|$USERNAME$}}'
			},
			'welcomenpov': {
				description: 'প্রাথমিক সম্পাদনা নিরপেক্ষ দৃষ্টিভঙ্গি নীতি মেনে চলে না এমন ব্যবহারকারীকে স্বাগত',
				linkedArticle: true,
				syntax: '{{subst:স্বাগত-অনিরপেক্ষ|$ARTICLE$|$USERNAME$}} ~~~~'
			},
			'welcomespam': {
				description: 'স্প্যামিং বিরোধী নীতিমালার অতিরিক্ত আলোচনাসহ স্বাগত',
				linkedArticle: true,
				syntax: '{{subst:স্বাগত-স্প্যাম|$ARTICLE$|$USERNAME$}} ~~~~'
			},
			'welcomeunsourced': {
				description: 'প্রাথমিক সম্পাদনা উৎসহীন এমন ব্যবহারকারীকে স্বাগত ',
				linkedArticle: true,
				syntax: '{{subst:স্বাগত-উৎসহীন|$ARTICLE$|$USERNAME$}} ~~~~'
			},
			'welcomeauto': {
				description: 'আত্মজীবনীমূলক নিবন্ধ তৈরি করেছেন এমন ব্যবহারকারীকে স্বাগত',
				linkedArticle: true,
				syntax: '{{subst:স্বাগত-আত্মজীবনী|$USERNAME$|art=$ARTICLE$}} ~~~~'
			},
			'welcome-COI': {
				description: 'স্বার্থের সংঘাত থাকতে পারে এরকম একটি বিষয় সম্পাদনা করেছেন এমন ব্যবহারকারীকে স্বাগত',
				linkedArticle: true,
				syntax: '{{subst:স্বাগত-স্বার্থ|$USERNAME$|art=$ARTICLE$}} ~~~~'
			},
			'welcome-delete': {
				description: 'কোন নিবন্ধ থেকে তথ্য মুছে ফেলেছে এমন ব্যবহারকারীকে স্বাগত',
				linkedArticle: true,
				syntax: '{{subst:স্বাগত-অপসারণ|$ARTICLE$|$USERNAME$}} ~~~~'
			},
			'welcome-image': {
				description: 'চিত্র সম্পর্কে অতিরিক্ত তথ্যসহ (নীতিমালা ও পদ্ধতি) স্বাগত',
				linkedArticle: true,
				syntax: '{{subst:স্বাগত-চিত্র|$USERNAME$|art=$ARTICLE$}}'
			}
		}
	},

	anonymous: {
		'বেনামী ব্যবহারকারীদের স্বাগত জানানোর টেমপ্লেট': {
			'স্বাগত-বেনামী': {
				description: 'একটি অ্যাকাউন্ট তৈরিতে উৎসাহিত করে বেনামী ব্যবহারকারীকে স্বাগত',
				linkedArticle: true,
				syntax: '{{subst:স্বাগত-বেনামী|art=$ARTICLE$}} ~~~~'
			},
			'thanks': {
				description: 'বেনামী ব্যবহারকারীদের জন্য; সংক্ষিপ্ত; একটি অ্যাকাউন্ট তৈরি করতে উত্সাহিত করে',
				linkedArticle: true,
				syntax: '== Welcome! ==\n{{subst:ধন্যবাদ|page=$ARTICLE$}} ~~~~'
			},
			'স্বাগত-বেনামী-পরীক্ষামূলক': {
				description: 'পরীক্ষামূলক সম্পাদনা করেছেন এমন বেনামী ব্যবহারকারীকে স্বাগত',
				linkedArticle: true,
				syntax: '{{subst:স্বাগত-বেনামী-পরীক্ষামূলক|$ARTICLE$|$USERNAME$}} ~~~~'
			},
			'স্বাগত-বেনামী-অগঠনমূলক': {
				description: 'ধ্বংসপ্রবণতা বা অগঠনমূলক সম্পাদনা করেছেন এমন বেনামী ব্যবহারকারীকে স্বাগত',
				linkedArticle: true,
				syntax: '{{subst:স্বাগত-বেনামী-অগঠনমূলক|$ARTICLE$|$USERNAME$}}'
			},
			'স্বাগত-বেনামী-গঠনমূলক': {
				description: 'ধ্বংসপ্রবণতার বিরুদ্ধে বা গঠনমূলক সম্পাদনা করেছেন এমন বেনামী ব্যবহারকারীকে স্বাগত',
				linkedArticle: true,
				syntax: '{{subst:স্বাগত-বেনামী-গঠনমূলক|art=$ARTICLE$}}'
			},
			'স্বাগত-বেনামী-অপসারণ': {
				description: 'পাতা থেকে তথ্য মুছে ফেলেছেন এমন বেনামী ব্যবহারকারীকে স্বাগত',
				linkedArticle: true,
				syntax: '{{subst:স্বাগত-বেনামী-অপসারণ|$ARTICLE$|$USERNAME$}} ~~~~'
			}
		}
	},

	wikiProject: {
		'উইকিপ্রকল্পভিত্তিক স্বাগত টেমপ্লেট': {
			'স্বাগত-বাংলাদেশ': {
				description: 'বাংলাদেশ বিষয়ে আপাত আগ্রহী এমন ব্যবহারকারীকে স্বাগত',
				syntax: '{{subst:স্বাগত-বাংলাদেশ}} ~~~~'
			},
			'স্বাগত-বিজ্ঞান': {
				description: 'বিজ্ঞান বিষয়ে আপাত আগ্রহী এমন ব্যবহারকারীকে স্বাগত',
				syntax: '{{subst:স্বাগত-বিজ্ঞান}}'
			},
			'এডিটাথন': {
				description: 'এডিটাথন বা প্রতিযোগিতায় আমন্ত্রণ জানিয়ে স্বাগত',
				linkedArticle: true,
				syntax: '{{subst:স্বাগত-এডিটাথন|এডিটাথন=$ARTICLE$}}'
			},
			'TWA invite': {
				description: 'ব্যবহারকারীকে উইকিপিডিয়া অভিযানে আমন্ত্রণ জানান (স্বাগত টেমপ্লেট নয়)',
				syntax: '{{subst:WP:TWA/InviteTW|signature=~~~~}}'
			}
		}
	},

	nonEnglish: {
		'বাংলা ব্যতীত অন্যান্য ভাষায় স্বাগত': {
			'welcomebn': {
				description: 'যে সকল ব্যবহারকারীর প্রথম ভাষা এখানে তালিকাভুক্ত নয় তাদের জন্য স্বাগত',
				syntax: '{{subst:welcomebn}}'
			},
			'welcomebn-ar': {
				description: 'যে সকল ব্যবহারকারীর প্রথম ভাষা আরবি বলে মনে হয় তাদের জন্য স্বাগত',
				syntax: '{{subst:welcomebn-ar}}'
			},
			'welcomebn-sq': {
				description: 'যে সকল ব্যবহারকারীর প্রথম ভাষা আলবেনীয় বলে মনে হয় তাদের জন্য স্বাগত',
				syntax: '{{subst:welcomebn-sq}}'
			},
			'welcomebn-uk': {
				description: 'যে সকল ব্যবহারকারীর প্রথম ভাষা ইউক্রেনীয় বলে মনে হয় তাদের জন্য স্বাগত',
				syntax: '{{subst:welcomebn-uk}}'
			},
			'welcomebn-en': {
				description: 'যে সকল ব্যবহারকারীর প্রথম ভাষা ইংরেজি বলে মনে হয় তাদের জন্য স্বাগত',
				syntax: '{{subst:welcomebn-en}}'
			},
			'welcomebn-nl': {
				description: 'যে সকল ব্যবহারকারীর প্রথম ভাষা ওলন্দাজ বলে মনে হয় তাদের জন্য স্বাগত',
				syntax: '{{subst:welcomebn-nl}}'
			},
			'welcomebn-or': {
				description: 'যে সকল ব্যবহারকারীর প্রথম ভাষা ওড়িয়া বলে মনে হয় তাদের জন্য স্বাগত',
				syntax: '{{subst:welcomebn-or}}'
			},
			'welcomebn-ko': {
				description: 'যে সকল ব্যবহারকারীর প্রথম ভাষা কোরীয় বলে মনে হয় তাদের জন্য স্বাগত',
				syntax: '{{subst:welcomebn-ko}}'
			},
			'welcomebn-zh': {
				description: 'যে সকল ব্যবহারকারীর প্রথম ভাষা চীনা বলে মনে হয় তাদের জন্য স্বাগত',
				syntax: '{{subst:welcomebn-zh}}'
			},
			'welcomebn-ja': {
				description: 'যে সকল ব্যবহারকারীর প্রথম ভাষা জাপানি বলে মনে হয় তাদের জন্য স্বাগত',
				syntax: '{{subst:welcomebn-ja}}'
			},
			'welcomebn-de': {
				description: 'যে সকল ব্যবহারকারীর প্রথম ভাষা জার্মান বলে মনে হয় তাদের জন্য স্বাগত',
				syntax: '{{subst:welcomebn-de}}'
			},
			'welcomebn-pt': {
				description: 'যে সকল ব্যবহারকারীর প্রথম ভাষা পর্তুগিজ বলে মনে হয় তাদের জন্য স্বাগত',
				syntax: '{{subst:welcomebn-pt}}'
			},
			'welcomebn-fr': {
				description: 'যে সকল ব্যবহারকারীর প্রথম ভাষা ফরাসি বলে মনে হয় তাদের জন্য স্বাগত',
				syntax: '{{subst:welcomebn-fr}}'
			},
			'welcomebn-fi': {
				description: 'যে সকল ব্যবহারকারীর প্রথম ভাষা ফিনিশ বলে মনে হয় তাদের জন্য স্বাগত',
				syntax: '{{subst:welcomebn-fi}}'
			},
			'welcomebn-mr': {
				description: 'যে সকল ব্যবহারকারীর প্রথম ভাষা মারাঠি বলে মনে হয় তাদের জন্য স্বাগত',
				syntax: '{{subst:welcomebn-mr}}'
			},
			'welcomebn-ml': {
				description: 'যে সকল ব্যবহারকারীর প্রথম ভাষা মালয়ালম বলে মনে হয় তাদের জন্য স্বাগত',
				syntax: '{{subst:welcomebn-ml}}'
			},
			'welcomebn-ru': {
				description: 'যে সকল ব্যবহারকারীর প্রথম ভাষা রুশ বলে মনে হয় তাদের জন্য স্বাগত',
				syntax: '{{subst:welcomebn-ru}}'
			},
			'welcomebn-ro': {
				description: 'যে সকল ব্যবহারকারীর প্রথম ভাষা রোমানীয় বলে মনে হয় তাদের জন্য স্বাগত',
				syntax: '{{subst:welcomebn-ro}}'
			},

			'welcomebn-es': {
				description: 'যে সকল ব্যবহারকারীর প্রথম ভাষা স্প্যানিশ বলে মনে হয় তাদের জন্য স্বাগত',
				syntax: '{{subst:welcomebn-es}}'
			},
			'welcomebn-sv': {
				description: 'যে সকল ব্যবহারকারীর প্রথম ভাষা সুইডিশ বলে মনে হয় তাদের জন্য স্বাগত',
				syntax: '{{subst:welcomebn-sv}}'
			},
			'welcomebn-he': {
				description: 'যে সকল ব্যবহারকারীর প্রথম ভাষা হিব্রু বলে মনে হয় তাদের জন্য স্বাগত',
				syntax: '{{subst:welcomebn-he}}'
			}
		}
	}

};
Twinkle.welcome.getTemplateWikitext = function(type, template, article) {
	// the iteration is required as the type=standard has two groups
	var properties;
	$.each(Twinkle.welcome.templates[type], function(label, templates) {
		properties = templates[template];
		if (properties) {
			return false; // break
		}
	});
	if (properties) {
		return properties.syntax.
			replace('$USERNAME$', Twinkle.getPref('insertUsername') ? mw.config.get('wgUserName') : '').
			replace('$ARTICLE$', article ? article : '').
			replace(/\$HEADER\$\s*/, '== স্বাগত ==\n\n').
			replace('$EXTRA$', '');  // EXTRA is not implemented yet
	}
	return '{{subst:' + template + (article ? '|art=' + article : '') + '}}' +
			(Twinkle.getPref('customWelcomeSignature') ? ' ~~~~' : '');
};

Twinkle.welcome.callbacks = {
	preview: function(form) {
		var previewDialog = new Morebits.simpleWindow(750, 400);
		previewDialog.setTitle('স্বাগত টেমপ্লেটের প্রাকদর্শন');
		previewDialog.setScriptName('Welcome user');
		previewDialog.setModality(true);

		var previewdiv = document.createElement('div');
		previewdiv.style.marginLeft = previewdiv.style.marginRight = '0.5em';
		previewdiv.style.fontSize = 'small';
		previewDialog.setContent(previewdiv);

		var previewer = new Morebits.wiki.preview(previewdiv);
		var input = Morebits.quickForm.getInputData(form);
		previewer.beginRender(Twinkle.welcome.getTemplateWikitext(input.type, input.template, input.article), 'User talk:' + mw.config.get('wgRelevantUserName')); // Force wikitext/correct username

		var submit = document.createElement('input');
		submit.setAttribute('type', 'submit');
		submit.setAttribute('value', 'Close');
		previewDialog.addContent(submit);

		previewDialog.display();

		$(submit).click(function() {
			previewDialog.close();
		});
	},
	main: function(pageobj) {
		var params = pageobj.getCallbackParameters();
		var text = pageobj.getPageText();

		// abort if mode is auto and form is not empty
		if (pageobj.exists() && params.mode === 'auto') {
			Morebits.status.info('সতর্কীকরণ', 'ব্যবহারকারীর আলাপ পাতা খালি নয়; স্বয়ংক্রিয় স্বাগত বাতিল করা হচ্ছে');
			Morebits.wiki.actionCompleted.event();
			return;
		}

		var welcomeText = Twinkle.welcome.getTemplateWikitext(params.type, params.template, params.article);

		if (Twinkle.getPref('topWelcomes')) {
			var hasTalkHeader = /^\{\{আলাপ ?পাতা\}\}/i.test(text);
			if (hasTalkHeader) {
				text = text.replace(/^\{\{আলাপ ?পাতা\}\}\n{0,2}/i, '');
				text = '{{আলাপ পাতা}}\n\n' + welcomeText + '\n\n' + text;
				text = text.trim();
			} else {
				text = welcomeText + '\n\n' + text;
			}
		} else {
			text += '\n' + welcomeText;
		}

		var summaryText = 'উইকিপিডিয়ায় স্বাগত!';
		pageobj.setPageText(text);
		pageobj.setEditSummary(summaryText);
		pageobj.setChangeTags(Twinkle.changeTags);
		pageobj.setWatchlist(Twinkle.getPref('watchWelcomes'));
		pageobj.setCreateOption('recreate');
		pageobj.save();
	}
};

Twinkle.welcome.callback.evaluate = function friendlywelcomeCallbackEvaluate(e) {
	var form = e.target;

	var params = Morebits.quickForm.getInputData(form); // : type, template, article
	params.mode = 'manual';

	Morebits.simpleWindow.setButtonsEnabled(false);
	Morebits.status.init(form);

	var userTalkPage = mw.config.get('wgFormattedNamespaces')[3] + ':' + mw.config.get('wgRelevantUserName');
	Morebits.wiki.actionCompleted.redirect = userTalkPage;
	Morebits.wiki.actionCompleted.notice = 'স্বাগত বার্তা প্রদান সম্পন্ন হয়েছে, কয়েক সেকেন্ডের মধ্যে আলাপ পাতা পুনঃলোড করা হবে';

	var wikipedia_page = new Morebits.wiki.page(userTalkPage, 'ব্যবহারকারী আলাপ পাতা পরিবর্তন');
	wikipedia_page.setFollowRedirect(true);
	wikipedia_page.setCallbackParameters(params);
	wikipedia_page.load(Twinkle.welcome.callbacks.main);
};

Twinkle.addInitCallback(Twinkle.welcome, 'welcome');
})(jQuery);


// </nowiki>
