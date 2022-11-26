// <nowiki>


(function($) {


/*
 ****************************************
 *** twinkleimage.js: Image CSD module
 ****************************************
 * Mode of invocation:     Tab ("চিত্র অপসারণ প্রস্তাবনা")
 * Active on:              Local nonredirect file pages (not on Commons)
* DI কে চিত্র অপসারণ প্রস্তাবনা হিসাবে অনুবাদ করা হয়েছে। --MdsShakil
* কোডের সীমাবদ্ধতার কারণে সম্পাদনা সারাংশ পুরোপুরি বাংলা করা সম্ভব নয়, তাই কাস্টমাইজ করা হয়েছে। --MdsShakil
 */

Twinkle.image = function twinkleimage() {
	if (mw.config.get('wgNamespaceNumber') === 6 && mw.config.get('wgArticleId') && !document.getElementById('mw-sharedupload') && !Morebits.isPageRedirect()) {
		Twinkle.addPortletLink(Twinkle.image.callback, 'চিত্র অপসারণ প্রস্তাবনা', 'tw-di', 'Nominate file for delayed speedy deletion');
	}
};

Twinkle.image.callback = function twinkleimageCallback() {
	var Window = new Morebits.simpleWindow(600, 330);
	Window.setTitle('দ্রুত অপসারণযোগ্য ফাইল');
	Window.setScriptName('টুইংকল');
	Window.addFooterLink('দ্রুত অপসারণ নীতিমালা', 'WP:CSD#চিত্র');
	Window.addFooterLink('চিত্রের পছন্দ', 'WP:TW/PREF#চিত্র');
	Window.addFooterLink('টুইংকল সাহায্য', 'WP:TW/DOC#চিত্র');
	Window.addFooterLink('প্রতিক্রিয়া জানান', 'WT:TW');

	var form = new Morebits.quickForm(Twinkle.image.callback.evaluate);
	form.append({
		type: 'checkbox',
		list: [
			{
				label: 'মূল আপলোডকারীকে অবহিত করুন',
				value: 'notify',
				name: 'notify',
				tooltip: "আপনি যদি একই ব্যবহারকারীর আপলোড করা একাধিক ফাইল মনোনয়ন করার পরিকল্পনা করেন, এবং খুব বেশি বিজ্ঞপ্তি দিয়ে আলাপ পাতায় জঞ্জাল সৃষ্টি করতে না চান তবে এটি চিহ্নিত করবেন না।",
				checked: Twinkle.getPref('notifyUserOnDeli')
			}
		]
	}
	);
	var field = form.append({
		type: 'field',
		label: 'দ্রুত অপসারণযোগ্য কারণ'
	});
	field.append({
		type: 'radio',
		name: 'type',
		event: Twinkle.image.callback.choice,
		list: [
			{
				label: 'কোন উৎস নেই (সিএসডি ফ৪)',
				value: 'no source',
				checked: true,
				tooltip: 'ছবি বা মিডিয়া‌ যার কোনও উৎসের তথ্য নেই'
			},
			{
				label: 'কোন লাইসেন্স নেই (সিএসডি ফ৪)',
				value: 'no license',
				tooltip: 'চিত্র বা মিডিয়ার কপিরাইট অবস্থা সম্পর্কে তথ্য নেই'
			},
			{
				label: 'কোন উৎস এবং লাইসেন্স নেই (সিএসডি ফ৪)',
				value: 'no source no license',
				tooltip: 'চিত্র বা মিডিয়ার উৎস বা কপিরাইট অবস্থা সম্পর্কে কোনও তথ্য নেই'
			},
			{
				label: 'অব্যবহৃত  অ-মুক্ত উপাদান (সিএসডি ফ৫)',
				value: 'orphaned fair use',
				tooltip: 'চিত্র বা মিডিয়া উইকিপিডিয়ায় ব্যবহারের জন্য লাইসেন্সবিহীন এবং শুধুমাত্র উইকিপিডিয়ায় ন্যায্য ব্যবহারের দাবির অধীনে অনুমোদিত:অ-মুক্ত বিষয়বস্তু, তবে এটি কোনও নিবন্ধে ব্যবহার করা হয় নি'
			},
			{
				label: 'কোনও ন্যায্য ব্যবহারের যৌক্তিকতা নেই (সিএসডি ফ৬)',
				value: 'no fair use rationale',
				tooltip: 'উইকিপিডিয়ার ন্যায্য ব্যবহার নীতির অধীনে চিত্র বা মিডিয়া ব্যবহার করা হয়েছে বলে দাবি করা হচ্ছে, তবে কেন এটি নীতির অধীনে অনুমোদিত তার কোনও ব্যাখ্যা নেই'
			},
			{
				label: 'বিতর্কিত ন্যায্য ব্যবহারের যৌক্তিকতা (সিএসডি ফ৭)',
				value: 'disputed fair use rationale',
				tooltip: 'চিত্র বা মিডিয়ার একটি ন্যায্য ব্যবহারের যৌক্তিকতা রয়েছে যা বিতর্কিত বা অবৈধ, যেমন একটি পুতুলের ছবিতে {{অ-মুক্ত লোগো}} ট্যাগ'
			},
			{
				label: 'প্রতিস্থাপনযোগ্য ন্যায্য ব্যবহার (সিএসডি ফ৭)',
				value: 'replaceable fair use',
				tooltip: 'চিত্র বা মিডিয়া উইকিপিডিয়া\'র প্রথম অ-মুক্ত বিষয়বস্তুর ব্যবহারের মানদণ্ডে ([[WP:NFCC#১]]) ব্যর্থ হতে পারে যাতে বলা হয়েছে এটি এমন একটি বিষয়কে ব্যাখ্যা করে যার জন্য একটি বিনামূল্যে চিত্র যুক্তিসঙ্গতভাবে খুঁজে পাওয়া যেতে পারে বা তৈরি করা যেতে পারে যা পর্যাপ্তভাবে একই তথ্য সরবরাহ করে'
			},
			{
				label: 'অনুমতির কোন প্রমাণ নেই (সিএসডি ফ১১)',
				value: 'no permission',
				tooltip: 'চিত্র বা মিডিয়ার কোন প্রমাণ নেই যে লেখক ফাইলটি উল্লেখিত লাইসেন্সে প্রকাশ করতে সম্মত হয়েছেন'
			}
		]
	});
	form.append({
		type: 'div',
		label: 'Work area',
		name: 'work_area'
	});
	form.append({ type: 'submit' });

	var result = form.render();
	Window.setContent(result);
	Window.display();

	// We must init the parameters
	var evt = document.createEvent('Event');
	evt.initEvent('change', true, true);
	result.type[0].dispatchEvent(evt);
};

Twinkle.image.callback.choice = function twinkleimageCallbackChoose(event) {
	var value = event.target.values;
	var root = event.target.form;
	var work_area = new Morebits.quickForm.element({
		type: 'div',
		name: 'work_area'
	});

	switch (value) {
		case 'no source no license':
		case 'no source':
			work_area.append({
				type: 'checkbox',
				list: [
					{
						label: 'অ-মুক্ত',
						name: 'non_free',
						tooltip: 'ফাইলটি ন্যায্য ব্যবহারের দাবির অধীনে লাইসেন্সকৃত'
					}
				]
			});
		/* falls through */
		case 'no license':
			work_area.append({
				type: 'checkbox',
				list: [
					{
						name: 'derivative',
						label: 'উৎসহীন অ-মৌলিক কাজ',
						tooltip: 'ফাইলটি অ-মৌলিক কাজ কিন্তু কোন উৎসের উল্লেখ নেই'
					}
				]
			});
			break;
		case 'no permission':
			work_area.append({
				type: 'input',
				name: 'source',
				label: 'উৎস:'
			});
			break;
		case 'disputed fair use rationale':
			work_area.append({
				type: 'textarea',
				name: 'reason',
				label: 'কারণ:'
			});
			break;
		case 'orphaned fair use':
			work_area.append({
				type: 'input',
				name: 'replacement',
				label: 'প্রতিস্থাপন:',
				tooltip: 'ঐচ্ছিক ফাইল যা এটিকে প্রতিস্থাপন করে। "File:" উপসর্গটি ঐচ্ছিক।'
			});
			break;
		case 'replaceable fair use':
			work_area.append({
				type: 'textarea',
				name: 'reason',
				label: 'কারণ:'
			});
			break;
		default:
			break;
	}

	root.replaceChild(work_area.render(), $(root).find('div[name="work_area"]')[0]);
};

Twinkle.image.callback.evaluate = function twinkleimageCallbackEvaluate(event) {

	var input = Morebits.quickForm.getInputData(event.target);
	if (input.replacement) {
		input.replacement = (new RegExp('^' + Morebits.namespaceRegex(6) + ':', 'i').test(input.replacement) ? '' : 'File:') + input.replacement;
	}

	var csdcrit;
	switch (input.type) {
		case 'no source no license':
		case 'no source':
		case 'no license':
			csdcrit = 'F4';
			break;
		case 'orphaned fair use':
			csdcrit = 'F5';
			break;
		case 'no fair use rationale':
			csdcrit = 'F6';
			break;
		case 'disputed fair use rationale':
		case 'replaceable fair use':
			csdcrit = 'F7';
			break;
		case 'no permission':
			csdcrit = 'F11';
			break;
		default:
			throw new Error('Twinkle.image.callback.evaluate: unknown criterion');
	}

	var lognomination = Twinkle.getPref('logSpeedyNominations') && Twinkle.getPref('noLogOnSpeedyNomination').indexOf(csdcrit.toLowerCase()) === -1;
	var templatename = input.derivative ? 'dw ' + input.type : input.type;

	var params = $.extend({
		templatename: templatename,
		normalized: csdcrit,
		lognomination: lognomination
	}, input);

	Morebits.simpleWindow.setButtonsEnabled(false);
	Morebits.status.init(event.target);

	Morebits.wiki.actionCompleted.redirect = mw.config.get('wgPageName');
	Morebits.wiki.actionCompleted.notice = 'ট্যাগিং সম্পন্ন হয়েছে';

	// Tagging image
	var wikipedia_page = new Morebits.wiki.page(mw.config.get('wgPageName'), 'ফাইলে দ্রুত অপসারণের ট্যাগ যোগ করা হচ্ছে');
	wikipedia_page.setCallbackParameters(params);
	wikipedia_page.load(Twinkle.image.callbacks.taggingImage);

	// Notifying uploader
	if (input.notify) {
		wikipedia_page.lookupCreation(Twinkle.image.callbacks.userNotification);
	} else {
		// add to CSD log if desired
		if (lognomination) {
			Twinkle.image.callbacks.addToLog(params, null);
		}
		// No auto-notification, display what was going to be added.
		var noteData = document.createElement('pre');
		noteData.appendChild(document.createTextNode('{{subst:di-' + templatename + '-notice|1=' + mw.config.get('wgTitle') + '}} ~~~~'));
		Morebits.status.info('Notification', [ 'Following/similar data should be posted to the original uploader:', document.createElement('br'), noteData ]);
	}
};

Twinkle.image.callbacks = {
	taggingImage: function(pageobj) {
		var text = pageobj.getPageText();
		var params = pageobj.getCallbackParameters();

		// remove "move to Commons" tag - deletion-tagged files cannot be moved to Commons
		text = text.replace(/\{\{(mtc|(copy |move )?to ?commons|move to wikimedia commons|copy to wikimedia commons)[^}]*\}\}/gi, '');

		var tag = '{{di-' + params.templatename + '|date={{subst:#time:j F Y}}';
		switch (params.type) {
			case 'no source no license':
			case 'no source':
				tag += params.non_free ? '|non-free=yes' : '';
				break;
			case 'no permission':
				tag += params.source ? '|source=' + params.source : '';
				break;
			case 'disputed fair use rationale':
				tag += params.reason ? '|concern=' + params.reason : '';
				break;
			case 'orphaned fair use':
				tag += params.replacement ? '|replacement=' + params.replacement : '';
				break;
			case 'replaceable fair use':
				tag += params.reason ? '|1=' + params.reason : '';
				break;
			default:
				break;  // doesn't matter
		}
		tag += '|help=off}}\n';

		pageobj.setPageText(tag + text);
		pageobj.setEditSummary('[[WP:FCSD|দ্রুত অপসারণ]] প্রস্তাবনা।');
		pageobj.setChangeTags(Twinkle.changeTags);
		pageobj.setWatchlist(Twinkle.getPref('deliWatchPage'));
		pageobj.setCreateOption('nocreate');
		pageobj.save();
	},
	userNotification: function(pageobj) {
		var params = pageobj.getCallbackParameters();
		var initialContrib = pageobj.getCreator();

		// disallow warning yourself
		if (initialContrib === mw.config.get('wgUserName')) {
			pageobj.getStatusElement().warn('You (' + initialContrib + ') created this page; skipping user notification');
		} else {
			var usertalkpage = new Morebits.wiki.page('User talk:' + initialContrib, 'মূল অবদানকারীকে জানানো হচ্ছে (' + initialContrib + ')');
			var notifytext = '\n{{subst:di-' + params.templatename + '-notice|1=' + mw.config.get('wgTitle');
			if (params.type === 'no permission') {
				notifytext += params.source ? '|source=' + params.source : '';
			}
			notifytext += '}} ~~~~';
			usertalkpage.setAppendText(notifytext);
			usertalkpage.setEditSummary('বিজ্ঞপ্তি: [[:' + Morebits.pageNameNorm + ']] দ্রুত অপসারণ করার জন্য ট্যাগ করা হয়েছে');
			usertalkpage.setChangeTags(Twinkle.changeTags);
			usertalkpage.setCreateOption('recreate');
			usertalkpage.setWatchlist(Twinkle.getPref('deliWatchUser'));
			usertalkpage.setFollowRedirect(true, false);
			usertalkpage.append();
		}

		// add this nomination to the user's userspace log, if the user has enabled it
		if (params.lognomination) {
			Twinkle.image.callbacks.addToLog(params, initialContrib);
		}
	},
	addToLog: function(params, initialContrib) {
		var usl = new Morebits.userspaceLogger(Twinkle.getPref('speedyLogPageName'));
		usl.initialText =
			"এই সব [[WP:CSD|দ্রুত অপসারণের]] মনোনয়নের লগ যা [[WP:TW|টুইংকলের]] CSD মডিউল ব্যবহার করে এই ব্যবহারকারী তৈরি করেছেন।\n\n" +
			'আপনি যদি আর এই লগ রাখতে না চান, তাহলে আপনি  [[উইকিপিডিয়া:টুইংকল/পছন্দসমূহ|পছন্দসমূহ প্যানেল]] ব্যবহার করে এটি বন্ধ করতে পারেন, এবং ' +
			'[[WP:CSD#U1|সিএসডি ব১]]-এর অধীনে এই পাতাটি দ্রুত অপসারণের জন্য মনোনয়ন করতে পারেন।' +
			(Morebits.userIsSysop ? '\n\nএই লগ টুইংকল ব্যবহার করে মুছে ফেলা পাতা তালিকাভুক্ত করে না।' : '');

		var formatParamLog = function(normalize, csdparam, input) {
			if (normalize === 'F5' && csdparam === 'replacement') {
				input = '[[:' + input + ']]';
			}
			return ' {' + normalize + ' ' + csdparam + ': ' + input + '}';
		};

		var extraInfo = '';

		// If a logged file is deleted but exists on commons, the wikilink will be blue, so provide a link to the log
		var fileLogLink = ' ([{{fullurl:Special:Log|page=' + mw.util.wikiUrlencode(mw.config.get('wgPageName')) + '}} লগ])';

		var appendText = '# [[:' + Morebits.pageNameNorm + ']]' + fileLogLink + ': DI [[WP:CSD#' + params.normalized.toUpperCase() + '|সিএসডি ' + params.normalized.toUpperCase() + ']] ({{tl|di-' + params.templatename + '}})';

		['reason', 'replacement', 'source'].forEach(function(item) {
			if (params[item]) {
				extraInfo += formatParamLog(params.normalized.toUpperCase(), item, params[item]);
				return false;
			}
		});

		if (extraInfo) {
			appendText += '; অতিরিক্ত তথ্য:' + extraInfo;
		}
		if (initialContrib) {
			appendText += '; {{user|1=' + initialContrib + '}} কে জানানো হয়েছে';
		}
		appendText += ' ~~~~~\n';

		var editsummary = '[[:' + Morebits.pageNameNorm + ']] দ্রুত অপসারণের মনোনয়ন তালিকাভুক্ত করা হচ্ছে।';

		usl.changeTags = Twinkle.changeTags;
		usl.log(appendText, editsummary);
	}
};

Twinkle.addInitCallback(Twinkle.image, 'image');
})(jQuery);


// </nowiki>
