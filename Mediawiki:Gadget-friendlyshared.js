// <nowiki>


(function($) {


/*
 ****************************************
 *** friendlyshared.js: শেয়ারকৃত আইপির ট্যাগিং মডিউল
 ****************************************
 * Mode of invocation:     Tab ("শেয়ারকৃত")
 * Active on:              IP user talk pages
 */

Twinkle.shared = function friendlyshared() {
	if (mw.config.get('wgNamespaceNumber') === 3 && mw.util.isIPAddress(mw.config.get('wgTitle'))) {
		var username = mw.config.get('wgRelevantUserName');
		Twinkle.addPortletLink(function() {
			Twinkle.shared.callback(username);
		}, 'শেয়ারকৃত আইপি', 'friendly-shared', 'শেয়ারকৃত আইপি ট্যাগ করা');
	}
};

Twinkle.shared.callback = function friendlysharedCallback() {
	var Window = new Morebits.simpleWindow(600, 450);
	Window.setTitle('শেয়ারকৃত আইপি ট্যাগ করা');
	Window.setScriptName('টুইংকল');
	Window.addFooterLink('পছন্দসমূহ', 'WP:TW/PREF#shared');
	Window.addFooterLink('টুইংকল সাহায্য', 'WP:TW/DOC#shared');
	Window.addFooterLink('পরামর্শ দিন', 'WT:TW');

	var form = new Morebits.quickForm(Twinkle.shared.callback.evaluate);

	var div = form.append({
		type: 'div',
		id: 'sharedip-templatelist',
		className: 'morebits-scrollbox'
	}
	);
	div.append({ type: 'header', label: 'শেয়ারকৃত আইপি ঠিকানা টেমপ্লেট' });
	div.append({ type: 'radio', name: 'template', list: Twinkle.shared.standardList,
		event: function(e) {
			Twinkle.shared.callback.change_shared(e);
			e.stopPropagation();
		}
	});

	var org = form.append({ type: 'field', label: 'অন্যান্য বিবরণ পূরণ করুন (ঐচ্ছিক) এবং "সাবমিট" লেখায় ক্লিক করুন।' });
	org.append({
		type: 'input',
		name: 'organization',
		label: 'আইপি ঠিকানার মালিক/পরিচালক',
		disabled: true,
		tooltip: 'এই আইপি ঠিকানার মালিক/পরিচালক যে সংস্থা, আপনি তার নাম লিখতে পারেন। প্রয়োজন হলে উইকিমার্কআপও ব্যবহার করতে পারেন।'
	}
	);
	org.append({
		type: 'input',
		name: 'host',
		label: 'হোস্ট নাম (ঐচ্ছিক)',
		disabled: true,
		tooltip: 'ঐচ্ছিকভাবে এখানে হোস্টের নাম (উদাহরণস্বরূপ, proxy.example.com) লিখতে পারেন  এবং এটি টেমপ্লেটে সংযুক্ত হবে।'
	}
	);
	org.append({
		type: 'input',
		name: 'contact',
		label: 'যোগাযোগের ঠিকানা (শুধুমাত্র যদি অনুরোধ করা হয়)',
		disabled: true,
		tooltip: 'ঐচ্ছিকভাবে আপনি সংস্থাটির কিছু যোগাযোগের ঠিকানা যোগ করতে পারেন। যদি সংস্থাটি নির্দিষ্টভাবে এটি যুক্ত করার অনুরোধ করে তবেই এই পরামিতিটি ব্যবহার করুন। প্রয়োজনীয় ক্ষেত্রে আপনি উইকিমার্কআপও ব্যবহার করতে পারেন।'
	}
	);

	var previewlink = document.createElement('a');
	$(previewlink).click(function() {
		Twinkle.shared.preview(result);
	});
	previewlink.style.cursor = 'pointer';
	previewlink.textContent = 'প্রাকদর্শন';
	form.append({ type: 'div', id: 'sharedpreview', label: [ previewlink ] });
	form.append({ type: 'submit' });

	var result = form.render();
	Window.setContent(result);
	Window.display();
};

Twinkle.shared.standardList = [
	{
		label: '{{Shared IP}}: স্ট্যান্ডার্ড শেয়ারকৃত আইপি ঠিকানা টেমপ্লেট',
		value: 'শেয়ারকৃত আইপি',
		tooltip: 'IP user talk page template that shows helpful information to IP users and those wishing to warn, block or ban them'
	},
	{
		label: '{{Shared IP edu}}: শিক্ষাপ্রতিষ্ঠানের জন্য প্রবর্তিত শেয়ারকৃত আইপি ঠিকানা টেমপ্লেট',
		value: 'Shared IP edu'
	},
	{
		label: '{{Shared IP corp}}: ব্যবসায়ের জন্য প্রবর্তিত শেয়ারকৃত আইপি ঠিকানা টেমপ্লেট',
		value: 'Shared IP corp'
	},
	{
		label: '{{Shared IP public}}: পাবলিক টার্মিনালের জন্য প্রবর্তিত শেয়ারকৃত আইপি ঠিকানা টেমপ্লেট',
		value: 'Shared IP public'
	},
	{
		label: '{{Shared IP gov}}: সরকারি সংস্থা ও সুবিধাদির জন্য প্রবর্তিত শেয়ারকৃত আইপি ঠিকানা টেমপ্লেট',
		value: 'Shared IP gov'
	},
	{
		label: '{{Dynamic IP}}: পরিবর্তনশীল ঠিকানার সংস্থার জন্য প্রবর্তিত শেয়ারকৃত আইপি ঠিকানা টেমপ্লেট',
		value: 'Dynamic IP'
	},
	{
		label: '{{Static IP}}: স্থির আইপি ঠিকানার জন্য প্রবর্তিত শেয়ারকৃত আইপি ঠিকানা টেমপ্লেট',
		value: 'Static IP'
	},
	{
		label: '{{ISP}}: আইএসপি সংস্থার (বিশেষ করে প্রক্সি সমূহ) জন্য প্রবর্তিত শেয়ারকৃত আইপি ঠিকানা টেমপ্লেট',
		value: 'ISP'
	},
	{
		label: '{{Mobile IP}}: মোবাইল ফোন কোম্পানি ও এর গ্রাহকদের জন্য প্রবর্তিত শেয়ারকৃত আইপি ঠিকানা টেমপ্লেট',
		value: 'Mobile IP'
	},
	{
		label: '{{Whois}}: সেসব আইপি ঠিকানার টেমপ্লেট যেগুলোর মনিটরিং প্রয়োজন, কিন্তু এটি শেয়ারকৃত, পরিবর্তনশীল নাকি স্থির তা অজানা',
		value: 'Whois'
	}
];

Twinkle.shared.callback.change_shared = function friendlysharedCallbackChangeShared(e) {
	e.target.form.contact.disabled = e.target.value !== 'Shared IP edu';  // only supported by {{Shared IP edu}}
	e.target.form.organization.disabled = false;
	e.target.form.host.disabled = e.target.value === 'Whois';  // host= not supported by {{Whois}}
};

Twinkle.shared.callbacks = {
	main: function(pageobj) {
		var params = pageobj.getCallbackParameters();
		var pageText = pageobj.getPageText();
		var found = false;

		for (var i = 0; i < Twinkle.shared.standardList.length; i++) {
			var tagRe = new RegExp('(\\{\\{' + Twinkle.shared.standardList[i].value + '(\\||\\}\\}))', 'im');
			if (tagRe.exec(pageText)) {
				Morebits.status.warn('তথ্য', '{{' + Twinkle.shared.standardList[i].value + '}} ইতোমধ্যে ব্যবহারকারীর আলাপ পাতায় পাওয়া গেছে....বাতিল করা হচ্ছে!');
				found = true;
			}
		}

		if (found) {
			return;
		}

		Morebits.status.info('তথ্য', 'শেয়ারকৃত আইপি ঠিকানা টেমপ্লেট ব্যবহারকারীর আলাপ পাতার শীর্ষে যুক্ত হবে।');
		var text = Twinkle.shared.getTemplateWikitext(params);

		var summaryText = '{{[[Template:' + params.template + '|' + params.template + ']]}} টেমপ্লেট যুক্ত করা হয়েছে।';
		pageobj.setPageText(text + pageText);
		pageobj.setEditSummary(summaryText);
		pageobj.setChangeTags(Twinkle.changeTags);
		pageobj.setMinorEdit(Twinkle.getPref('markSharedIPAsMinor'));
		pageobj.setCreateOption('recreate');
		pageobj.save();
	}
};

Twinkle.shared.preview = function(form) {
	var input = Morebits.quickForm.getInputData(form);
	if (input.template) {
		var previewDialog = new Morebits.simpleWindow(700, 500);
		previewDialog.setTitle('শেয়ারকৃত আইপি টেমপ্লেটের প্রাকদর্শন');
		previewDialog.setScriptName('শেয়ারকৃত আইপি টেমপ্লেট যুক্ত করুন');
		previewDialog.setModality(true);

		var previewdiv = document.createElement('div');
		previewdiv.style.marginLeft = previewdiv.style.marginRight = '0.5em';
		previewdiv.style.fontSize = 'small';
		previewDialog.setContent(previewdiv);

		var previewer = new Morebits.wiki.preview(previewdiv);
		previewer.beginRender(Twinkle.shared.getTemplateWikitext(input), mw.config.get('wgPageName'));

		var submit = document.createElement('input');
		submit.setAttribute('type', 'submit');
		submit.setAttribute('value', 'বন্ধ করুন');
		previewDialog.addContent(submit);

		previewDialog.display();

		$(submit).click(function() {
			previewDialog.close();
		});
	}
};

Twinkle.shared.getTemplateWikitext = function(input) {
	var text = '{{' + input.template + '|' + input.organization;
	if (input.contact) {
		text += '|' + input.contact;
	}
	if (input.host) {
		text += '|host=' + input.host;
	}
	text += '}}\n\n';
	return text;
};

Twinkle.shared.callback.evaluate = function friendlysharedCallbackEvaluate(e) {
	var params = Morebits.quickForm.getInputData(e.target);
	if (!params.template) {
		alert('আপনাকে অবশ্যই একটি শেয়ারকৃত আইপি টেমপ্লেট নির্বাচন করতে হবে!');
		return;
	}
	if (!params.organization) {
		alert('{{' + params.template + '}} টেমপ্লটের জন্য আপনাকে অবশ্যই একটি সংস্থার নাম প্রবেশ করাতে হবে!');
		return;
	}

	Morebits.simpleWindow.setButtonsEnabled(false);
	Morebits.status.init(e.target);

	Morebits.wiki.actionCompleted.redirect = mw.config.get('wgPageName');
	Morebits.wiki.actionCompleted.notice = 'ট্যাগিং সম্পন্ন, কয়েক সেকেন্ডে আলাপ পাতা আবার লোড হবে';

	var wikipedia_page = new Morebits.wiki.page(mw.config.get('wgPageName'), 'ব্যবহারকারী আলাপ পাতা পরিবর্তন');
	wikipedia_page.setFollowRedirect(true);
	wikipedia_page.setCallbackParameters(params);
	wikipedia_page.load(Twinkle.shared.callbacks.main);
};

Twinkle.addInitCallback(Twinkle.shared, 'shared');
})(jQuery);


// </nowiki>
