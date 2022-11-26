// <nowiki>


(function($) {


/*
 ****************************************
 *** friendlytalkback.js: ফিরতি বার্তা মডিউল
 ****************************************
 * Mode of invocation:     ট্যাব ("ফিরতি বার্তা")
 * Active on:              Any page with relevant user name (userspace, contribs, etc.) except IP ranges
 * Config directives in:   FriendlyConfig
 */

Twinkle.talkback = function() {
	if (!mw.config.exists('wgRelevantUserName') || Morebits.ip.isRange(mw.config.get('wgRelevantUserName'))) {
		return;
	}
	Twinkle.addPortletLink(Twinkle.talkback.callback, 'ফিরতি বার্তা', 'friendly-talkback', 'সহজ ফিরতি বার্তা');
};

Twinkle.talkback.callback = function() {
	if (mw.config.get('wgRelevantUserName') === mw.config.get('wgUserName') && !confirm("নিজের সাথে নিজেই কথা বলা ভালো লক্ষণ নয় ;)")) {
		return;
	}

	var Window = new Morebits.simpleWindow(600, 350);
	Window.setTitle('ফিরতি বার্তা');
	Window.setScriptName('টুইংকল');
	Window.addFooterLink('ফিরতি বার্তা পছন্দসমূহ', 'WP:TW/PREF#talkback');
	Window.addFooterLink('টুইংকল সাহায্য', 'WP:TW/DOC#talkback');
	Window.addFooterLink('পরামর্শ দিন', 'WT:TW');

	var form = new Morebits.quickForm(Twinkle.talkback.evaluate);

	form.append({ type: 'radio', name: 'tbtarget',
		list: [
			{
				label: 'ফিরতি বার্তা',
				value: 'talkback',
				checked: 'true'
			},
			{
				label: 'দয়া করে দেখুন',
				value: 'see'
			},
			{
				label: 'আলোচনাসভার বিজ্ঞপ্তি',
				value: 'notice'
			},
			{
				label: "আপনি একটি মেইল পেয়েছেন!",
				value: 'mail'
			}
		],
		event: Twinkle.talkback.changeTarget
	});

	form.append({
		type: 'field',
		label: 'Work area',
		name: 'work_area'
	});

	var previewlink = document.createElement('a');
	$(previewlink).click(function() {
		Twinkle.talkback.callbacks.preview(result);  // |result| is defined below
	});
	previewlink.style.cursor = 'pointer';
	previewlink.textContent = 'প্রাকদর্শন';
	form.append({ type: 'div', id: 'talkbackpreview', label: [ previewlink ] });
	form.append({ type: 'div', id: 'friendlytalkback-previewbox', style: 'display: none' });

	form.append({ type: 'submit' });

	var result = form.render();
	Window.setContent(result);
	Window.display();
	result.previewer = new Morebits.wiki.preview($(result).find('div#friendlytalkback-previewbox').last()[0]);

	// We must init the
	var evt = document.createEvent('Event');
	evt.initEvent('change', true, true);
	result.tbtarget[0].dispatchEvent(evt);

	// Check whether the user has opted out from talkback
	var query = {
		action: 'query',
		prop: 'extlinks',
		titles: 'ব্যবহারকারী আলাপ:' + mw.config.get('wgRelevantUserName'),
		elquery: 'userjs.invalid/noTalkback',
		ellimit: '1',
		format: 'json'
	};
	var wpapi = new Morebits.wiki.api('ফিরতি বার্তা  opt-out অবস্থা আনা হচ্ছে', query, Twinkle.talkback.callback.optoutStatus);
	wpapi.post();
};

Twinkle.talkback.optout = '';

Twinkle.talkback.callback.optoutStatus = function(apiobj) {
	var el = apiobj.getResponse().query.pages[0].extlinks;
	if (el && el.length) {
		Twinkle.talkback.optout = mw.config.get('wgRelevantUserName') + ' ফিরতি বার্তা গ্রহণ করতে ইচ্ছুক নন';
		var url = el[0].url;
		var reason = mw.util.getParamValue('reason', url);
		Twinkle.talkback.optout += reason ? ': ' + reason : '।';
	}
	$('#twinkle-talkback-optout-message').text(Twinkle.talkback.optout);
};

var prev_page = '';
var prev_section = '';
var prev_message = '';

Twinkle.talkback.changeTarget = function(e) {
	var value = e.target.values;
	var root = e.target.form;

	var old_area = Morebits.quickForm.getElements(root, 'work_area')[0];

	if (root.section) {
		prev_section = root.section.value;
	}
	if (root.message) {
		prev_message = root.message.value;
	}
	if (root.page) {
		prev_page = root.page.value;
	}

	var work_area = new Morebits.quickForm.element({
		type: 'field',
		label: 'ফিরতি বার্তার তথ্য',
		name: 'work_area'
	});

	root.previewer.closePreview();

	switch (value) {
		case 'talkback':
			/* falls through */
		default:
			work_area.append({
				type: 'div',
				label: '',
				style: 'color: red',
				id: 'twinkle-talkback-optout-message'
			});

			work_area.append({
				type: 'input',
				name: 'page',
				label: 'আলোচনা পাতার নাম',
				tooltip: "যে পাতায় আলোচনাটি হচ্ছে তার নাম। যেমন, ‘ব্যবহারকারী আলাপ:Yahya’ অথবা ‘উইকিপিডিয়া আলোচনা:টুইংকল’। সব আলাপ পাতা, উইকিপিডিয়া নামস্থান ও টেমপ্লেট নামস্থানে সীমাবদ্ধ।",
				value: prev_page || 'User talk:' + mw.config.get('wgUserName')
			});
			work_area.append({
				type: 'input',
				name: 'section',
				label: 'সংযুক্ত অনুচ্ছেদ (ঐচ্ছিক)',
				tooltip: "যে অনুচ্ছেদে আলোচনাটি হচ্ছে তার শিরোনাম। উদাহরণস্বরূপ, ‘একত্রীকরণের প্রস্তাব’।",
				value: prev_section
			});
			break;
		case 'notice':
			var noticeboard = work_area.append({
				type: 'select',
				name: 'noticeboard',
				label: 'আলোচনাসভা:',
				event: function(e) {
					if (e.target.value === 'afchd') {
						Morebits.quickForm.overrideElementLabel(root.section, 'Title of draft (excluding the prefix): ');
						Morebits.quickForm.setElementTooltipVisibility(root.section, false);
					} else {
						Morebits.quickForm.resetElementLabel(root.section);
						Morebits.quickForm.setElementTooltipVisibility(root.section, true);
					}
				}
			});

			$.each(Twinkle.talkback.noticeboards, function(value, data) {
				noticeboard.append({
					type: 'option',
					label: data.label,
					value: value,
					selected: !!data.defaultSelected
				});
			});

			work_area.append({
				type: 'input',
				name: 'section',
				label: 'সংযুক্ত থ্রেড',
				tooltip: 'আলোচনা পাতার প্রাসঙ্গিক থ্রেডের শিরোনাম',
				value: prev_section
			});
			break;
		case 'mail':
			work_area.append({
				type: 'input',
				name: 'section',
				label: 'ইমেইলের বিষয় (ঐচ্ছিক)',
				tooltip: 'আপনি যে মেইলটি পাঠিয়েছেন তার বিষয়।'
			});
			break;
	}

	if (value !== 'notice') {
		work_area.append({ type: 'textarea', label: 'অতিরিক্ত বার্তা (ঐচ্ছিক):', name: 'message', tooltip: 'একটি অতিরিক্ত বার্তা যা আপনি ফিরতি বার্তা টেমপ্লেটের নিচে যুক্ত করতে চান। যদি আপনি কোনো অতিরিক্ত বার্তা লিখেন তবে আপনার স্বাক্ষর বার্তার শেষে যুক্ত হবে।' });
	}

	work_area = work_area.render();
	root.replaceChild(work_area, old_area);
	if (root.message) {
		root.message.value = prev_message;
	}

	$('#twinkle-talkback-optout-message').text(Twinkle.talkback.optout);
};

Twinkle.talkback.noticeboards = {
	an: {
		label: "প্রশাসকদের আলোচনাসভা",
		text: '{{subst:AN-notice|$SECTION}} ~~~~',
		editSummary: '[[WP:AN|প্রশাসকদের আলোচনাসভায়]] আলোচনা সম্পর্কে বিজ্ঞপ্তি'
	},

	vp: {
		label: "আলোচনাসভা",
		text: '{{subst:VP-notice|$SECTION}} ~~~~',
		editSummary: "[[WP:VP|আলোচনাসভা]]র আলোচনা সম্পর্কে বিজ্ঞপ্তি"
	}
};


Twinkle.talkback.evaluate = function(e) {
	var input = Morebits.quickForm.getInputData(e.target);

	var fullUserTalkPageName = new mw.Title(mw.config.get('wgRelevantUserName'), 3).toText();
	var talkpage = new Morebits.wiki.page(fullUserTalkPageName, 'ফিরতি বার্তা যোগ করা হচ্ছে');

	Morebits.simpleWindow.setButtonsEnabled(false);
	Morebits.status.init(e.target);

	Morebits.wiki.actionCompleted.redirect = fullUserTalkPageName;
	Morebits.wiki.actionCompleted.notice = 'ফিরতি বার্তা পাঠানো সম্পন্ন; আলাপ কয়েক সেকেন্ডের মধ্যে পূনরায় লোড হবে';

	switch (input.tbtarget) {
		case 'notice':
			talkpage.setEditSummary(Twinkle.talkback.noticeboards[input.noticeboard].editSummary);
			break;
		case 'mail':
			talkpage.setEditSummary("বিজ্ঞপ্তি: আপনি মেইল পেয়েছেন");
			break;
		case 'see':
			input.page = Twinkle.talkback.callbacks.normalizeTalkbackPage(input.page);
			talkpage.setEditSummary('দয়া করে [[:' + input.page +
			(input.section ? '#' + input.section : '') + ']] -এ চলমান আলোচনাটি দেখুন');
			break;
		default:  // talkback
			input.page = Twinkle.talkback.callbacks.normalizeTalkbackPage(input.page);
			talkpage.setEditSummary('ফিরতি বার্তা ([[:' + input.page +
			(input.section ? '#' + input.section : '') + ']])');
			break;
	}

	talkpage.setAppendText('\n\n' + Twinkle.talkback.callbacks.getNoticeWikitext(input));
	talkpage.setChangeTags(Twinkle.changeTags);
	talkpage.setCreateOption('recreate');
	talkpage.setMinorEdit(Twinkle.getPref('markTalkbackAsMinor'));
	talkpage.setFollowRedirect(true);
	talkpage.append();
};

Twinkle.talkback.callbacks = {
	// Not used for notice or mail, default to user page
	normalizeTalkbackPage: function(page) {
		page = page || mw.config.get('wgUserName');

		// Assume no prefix is a username, convert to user talk space
		var normal = mw.Title.newFromText(page, 3);
		// Normalize erroneous or likely mis-entered items
		if (normal) {
			// Only allow talks and WPspace, as well as Template-space for DYK
			if (normal.namespace !== 4 && normal.namespace !== 10) {
				normal = normal.getTalkPage();
			}
			page = normal.getPrefixedText();
		}
		return page;
	},

	preview: function(form) {
		var input = Morebits.quickForm.getInputData(form);

		if (input.tbtarget === 'talkback' || input.tbtarget === 'see') {
			input.page = Twinkle.talkback.callbacks.normalizeTalkbackPage(input.page);
		}

		var noticetext = Twinkle.talkback.callbacks.getNoticeWikitext(input);
		form.previewer.beginRender(noticetext, 'User talk:' + mw.config.get('wgRelevantUserName')); // Force wikitext/correct username
	},

	getNoticeWikitext: function(input) {
		var text;

		switch (input.tbtarget) {
			case 'notice':
				text = Morebits.string.safeReplace(Twinkle.talkback.noticeboards[input.noticeboard].text, '$SECTION', input.section);
				break;
			case 'mail':
				text = '==' + Twinkle.getPref('mailHeading') + '==\n' +
					"{{You've got mail|subject=" + input.section + '|ts=~~~~~}}';

				if (input.message) {
					text += '\n' + input.message + '  ~~~~';
				} else if (Twinkle.getPref('insertTalkbackSignature')) {
					text += '\n~~~~';
				}
				break;
			case 'see':
				var heading = Twinkle.getPref('talkbackHeading');
				text = '{{subst:Please see|location=' + input.page + (input.section ? '#' + input.section : '') +
				'|more=' + input.message + '|heading=' + heading + '}}';
				break;
			default:  // talkback
				text = '==' + Twinkle.getPref('talkbackHeading') + '==\n' +
					'{{talkback|' + input.page + (input.section ? '|' + input.section : '') + '|ts=~~~~~}}';

				if (input.message) {
					text += '\n' + input.message + ' ~~~~';
				} else if (Twinkle.getPref('insertTalkbackSignature')) {
					text += '\n~~~~';
				}
		}
		return text;
	}
};
Twinkle.addInitCallback(Twinkle.talkback, 'talkback');
})(jQuery);


// </nowiki>
