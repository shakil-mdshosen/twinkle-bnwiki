// <nowiki>


(function($) {


/*
 ****************************************
 *** twinkleprotect.js: Protect/RPP module
 ****************************************
 * Mode of invocation:     Tab ("সুরক্ষা"/"সুরক্ষিত করার অনুরোধ")
 * Active on:              Non-special, non-MediaWiki pages
 */

// Note: a lot of code in this module is re-used/called by batchprotect.

Twinkle.protect = function twinkleprotect() {
	if (mw.config.get('wgNamespaceNumber') < 0 || mw.config.get('wgNamespaceNumber') === 8) {
		return;
	}

	Twinkle.addPortletLink(Twinkle.protect.callback, Morebits.userIsSysop ? 'সুরক্ষা' : 'RPP', 'tw-rpp',
		Morebits.userIsSysop ? 'সুরক্ষিত করুন' : 'সুরক্ষিত করার অনুরোধ করুন');
};

Twinkle.protect.callback = function twinkleprotectCallback() {
	var Window = new Morebits.simpleWindow(620, 530);
	Window.setTitle(Morebits.userIsSysop ? 'সুরক্ষা প্রয়োগ, অনুরোধ বা ট্যাগ যোগ করুন' : 'Request or tag page protection');
	Window.setScriptName('টুইংকল');
	Window.addFooterLink('সুরক্ষা টেমপ্লেট', 'Template:Protection templates');
	Window.addFooterLink('সুরক্ষা নীতি', 'WP:PROT');
	Window.addFooterLink('টুইংকল সাহায্য', 'WP:TW/DOC#protect');
	Window.addFooterLink('প্রতিক্রিয়া জানান', 'WT:TW');

	var form = new Morebits.quickForm(Twinkle.protect.callback.evaluate);
	var actionfield = form.append({
		type: 'field',
		label: 'কার্যের ধরন'
	});
	if (Morebits.userIsSysop) {
		actionfield.append({
			type: 'radio',
			name: 'actiontype',
			event: Twinkle.protect.callback.changeAction,
			list: [
				{
					label: 'পাতার সুরক্ষা',
					value: 'protect',
					tooltip: 'পৃষ্ঠাটিতে প্রকৃত সুরক্ষা প্রয়োগ করুন।',
					checked: true
				}
			]
		});
	}
	actionfield.append({
		type: 'radio',
		name: 'actiontype',
		event: Twinkle.protect.callback.changeAction,
		list: [
			{
				label: 'পাতা সুরক্ষার অনুরোধ',
				value: 'request',
				tooltip: 'আপনি কি সুরক্ষার অনুরোধ পাতায় সুরক্ষিত করার অনুরোধ যোগ করতে চান' + (Morebits.userIsSysop ? ' চাইলে আপনি নিজেই সুরক্ষিত করতে পারেন।' : '।'),
				checked: !Morebits.userIsSysop
			},
			{
				label: 'সুরক্ষা টেমপ্লেটসহ পাতা ট্যাগ করুন',
				value: 'tag',
				tooltip: 'যদি সুরক্ষা প্রদানকারী প্রশাসক সুরক্ষা ট্যাগ যোগ করতে ভুলে যান তবে আপনি ট্যাগ যোগ করতে পারেন',
				disabled: mw.config.get('wgArticleId') === 0 || mw.config.get('wgPageContentModel') === 'Scribunto'
			}
		]
	});

	form.append({ type: 'field', label: 'কারণ', name: 'field_preset' });
	form.append({ type: 'field', label: '১', name: 'field1' });
	form.append({ type: 'field', label: '২', name: 'field2' });

	form.append({ type: 'submit' });

	var result = form.render();
	Window.setContent(result);
	Window.display();

	// We must init the controls
	var evt = document.createEvent('Event');
	evt.initEvent('change', true, true);
	result.actiontype[0].dispatchEvent(evt);

	// get current protection level asynchronously
	Twinkle.protect.fetchProtectionLevel();
};


// A list of bots who may be the protecting sysop, for whom we shouldn't
// remind the user contact before requesting unprotection (evaluate)
Twinkle.protect.trustedBots = ['MusikBot II', 'TFA Protector Bot'];

// Customizable namespace and FlaggedRevs settings
// In theory it'd be nice to have restrictionlevels defined here,
// but those are only available via a siteinfo query

// mw.loader.getState('ext.flaggedRevs.review') returns null if the
// FlaggedRevs extension is not registered.  Previously, this was done with
// wgFlaggedRevsParams, but after 1.34-wmf4 it is no longer exported if empty
// (https://gerrit.wikimedia.org/r/c/mediawiki/extensions/FlaggedRevs/+/508427)
var hasFlaggedRevs = mw.loader.getState('ext.flaggedRevs.review') &&
// FlaggedRevs only valid in some namespaces, hardcoded until [[phab:T218479]]
(mw.config.get('wgNamespaceNumber') === 0 || mw.config.get('wgNamespaceNumber') === 4);
// Limit template editor; a Twinkle restriction, not a site setting
var isTemplate = mw.config.get('wgNamespaceNumber') === 10 || mw.config.get('wgNamespaceNumber') === 828;


// Contains the current protection level in an object
// Once filled, it will look something like:
// { edit: { level: "sysop", expiry: <some date>, cascade: true }, ... }
Twinkle.protect.currentProtectionLevels = {};

// returns a jQuery Deferred object, usage:
//   Twinkle.protect.fetchProtectingAdmin(apiObject, pageName, protect/stable).done(function(admin_username) { ...code... });
Twinkle.protect.fetchProtectingAdmin = function twinkleprotectFetchProtectingAdmin(api, pageName, protType, logIds) {
	logIds = logIds || [];

	return api.get({
		format: 'json',
		action: 'query',
		list: 'logevents',
		letitle: pageName,
		letype: protType
	}).then(function(data) {
		// don't check log entries that have already been checked (e.g. don't go into an infinite loop!)
		var event = data.query ? $.grep(data.query.logevents, function(le) {
			return $.inArray(le.logid, logIds);
		})[0] : null;
		if (!event) {
			// fail gracefully
			return null;
		} else if (event.action === 'move_prot' || event.action === 'move_stable') {
			return twinkleprotectFetchProtectingAdmin(api, protType === 'protect' ? event.params.oldtitle_title : event.params.oldtitle, protType, logIds.concat(event.logid));
		}
		return event.user;
	});
};

Twinkle.protect.fetchProtectionLevel = function twinkleprotectFetchProtectionLevel() {

	var api = new mw.Api();
	var protectDeferred = api.get({
		format: 'json',
		indexpageids: true,
		action: 'query',
		list: 'logevents',
		letype: 'protect',
		letitle: mw.config.get('wgPageName'),
		prop: hasFlaggedRevs ? 'info|flagged' : 'info',
		inprop: 'protection|watched',
		titles: mw.config.get('wgPageName')
	});
	var stableDeferred = api.get({
		format: 'json',
		action: 'query',
		list: 'logevents',
		letype: 'stable',
		letitle: mw.config.get('wgPageName')
	});

	var earlyDecision = [protectDeferred];
	if (hasFlaggedRevs) {
		earlyDecision.push(stableDeferred);
	}

	$.when.apply($, earlyDecision).done(function(protectData, stableData) {
		// $.when.apply is supposed to take an unknown number of promises
		// via an array, which it does, but the type of data returned varies.
		// If there are two or more deferreds, it returns an array (of objects),
		// but if there's just one deferred, it retuns a simple object.
		// This is annoying.
		protectData = $(protectData).toArray();

		var pageid = protectData[0].query.pageids[0];
		var page = protectData[0].query.pages[pageid];
		var current = {}, adminEditDeferred;

		// Save requested page's watched status for later in case needed when filing request
		Twinkle.protect.watched = page.watchlistexpiry || page.watched === '';

		$.each(page.protection, function(index, protection) {
			// Don't overwrite actual page protection with cascading protection
			if (!protection.source) {
				current[protection.type] = {
					level: protection.level,
					expiry: protection.expiry,
					cascade: protection.cascade === ''
				};
				// logs report last admin who made changes to either edit/move/create protection, regardless if they only modified one of them
				if (!adminEditDeferred) {
					adminEditDeferred = Twinkle.protect.fetchProtectingAdmin(api, mw.config.get('wgPageName'), 'protect');
				}
			} else {
				// Account for the page being covered by cascading protection
				current.cascading = {
					expiry: protection.expiry,
					source: protection.source,
					level: protection.level // should always be sysop, unused
				};
			}
		});

		if (page.flagged) {
			current.stabilize = {
				level: page.flagged.protection_level,
				expiry: page.flagged.protection_expiry
			};
			adminEditDeferred = Twinkle.protect.fetchProtectingAdmin(api, mw.config.get('wgPageName'), 'stable');
		}

		// show the protection level and log info
		Twinkle.protect.hasProtectLog = !!protectData[0].query.logevents.length;
		Twinkle.protect.protectLog = Twinkle.protect.hasProtectLog && protectData[0].query.logevents;
		Twinkle.protect.hasStableLog = hasFlaggedRevs ? !!stableData[0].query.logevents.length : false;
		Twinkle.protect.stableLog = Twinkle.protect.hasStableLog && stableData[0].query.logevents;
		Twinkle.protect.currentProtectionLevels = current;

		if (adminEditDeferred) {
			adminEditDeferred.done(function(admin) {
				if (admin) {
					$.each(['edit', 'move', 'create', 'stabilize', 'cascading'], function(i, type) {
						if (Twinkle.protect.currentProtectionLevels[type]) {
							Twinkle.protect.currentProtectionLevels[type].admin = admin;
						}
					});
				}
				Twinkle.protect.callback.showLogAndCurrentProtectInfo();
			});
		} else {
			Twinkle.protect.callback.showLogAndCurrentProtectInfo();
		}
	});
};

Twinkle.protect.callback.showLogAndCurrentProtectInfo = function twinkleprotectCallbackShowLogAndCurrentProtectInfo() {
	var currentlyProtected = !$.isEmptyObject(Twinkle.protect.currentProtectionLevels);

	if (Twinkle.protect.hasProtectLog || Twinkle.protect.hasStableLog) {
		var $linkMarkup = $('<span>');

		if (Twinkle.protect.hasProtectLog) {
			$linkMarkup.append(
				$('<a target="_blank" href="' + mw.util.getUrl('Special:Log', {action: 'view', page: mw.config.get('wgPageName'), type: 'protect'}) + '">সুরক্ষা লগ</a>'));
			if (!currentlyProtected || (!Twinkle.protect.currentProtectionLevels.edit && !Twinkle.protect.currentProtectionLevels.move)) {
				var lastProtectAction = Twinkle.protect.protectLog[0];
				if (lastProtectAction.action === 'unprotect') {
					$linkMarkup.append(' (unprotected ' + new Morebits.date(lastProtectAction.timestamp).calendar('utc') + ')');
				} else { // protect or modify
					$linkMarkup.append(' (expired ' + new Morebits.date(lastProtectAction.params.details[0].expiry).calendar('utc') + ')');
				}
			}
			$linkMarkup.append(Twinkle.protect.hasStableLog ? $('<span> &bull; </span>') : null);
		}

		if (Twinkle.protect.hasStableLog) {
			$linkMarkup.append($('<a target="_blank" href="' + mw.util.getUrl('Special:Log', {action: 'view', page: mw.config.get('wgPageName'), type: 'stable'}) + '">pending changes log</a>)'));
			if (!currentlyProtected || !Twinkle.protect.currentProtectionLevels.stabilize) {
				var lastStabilizeAction = Twinkle.protect.stableLog[0];
				if (lastStabilizeAction.action === 'reset') {
					$linkMarkup.append(' (reset ' + new Morebits.date(lastStabilizeAction.timestamp).calendar('utc') + ')');
				} else { // config or modify
					$linkMarkup.append(' (expired ' + new Morebits.date(lastStabilizeAction.params.expiry).calendar('utc') + ')');
				}
			}
		}

		Morebits.status.init($('div[name="hasprotectlog"] span')[0]);
		Morebits.status.warn(
			currentlyProtected ? 'পূর্ববর্তী সুরক্ষা' : 'এই পাতাটি পূর্বে সুরক্ষিত ছিলো।',
			$linkMarkup[0]
		);
	}

	Morebits.status.init($('div[name="currentprot"] span')[0]);
	var protectionNode = [], statusLevel = 'info';

	if (currentlyProtected) {
		$.each(Twinkle.protect.currentProtectionLevels, function(type, settings) {
			var label = type === 'stabilize' ? 'Pending Changes' : Morebits.string.toUpperCaseFirstChar(type);

			if (type === 'cascading') { // Covered by another page
				label = 'Cascading protection ';
				protectionNode.push($('<b>' + label + '</b>')[0]);
				if (settings.source) { // Should by definition exist
					var sourceLink = '<a target="_blank" href="' + mw.util.getUrl(settings.source) + '">' + settings.source + '</a>';
					protectionNode.push($('<span>from ' + sourceLink + '</span>')[0]);
				}
			} else {
				var level = settings.level;
				// Make cascading protection more prominent
				if (settings.cascade) {
					level += ' (cascading)';
				}
				protectionNode.push($('<b>' + label + ': ' + level + '</b>')[0]);
			}

			if (settings.expiry === 'infinity') {
				protectionNode.push(' (indefinite) ');
			} else {
				protectionNode.push(' (মেয়াদোত্তীর্ণ ' + new Morebits.date(settings.expiry).calendar('utc') + ') ');
			}
			if (settings.admin) {
				var adminLink = '<a target="_blank" href="' + mw.util.getUrl('User talk:' + settings.admin) + '">' + settings.admin + '</a>';
				protectionNode.push($('<span>by ' + adminLink + '</span>')[0]);
			}
			protectionNode.push($('<span> \u2022 </span>')[0]);
		});
		protectionNode = protectionNode.slice(0, -1); // remove the trailing bullet
		statusLevel = 'warn';
	} else {
		protectionNode.push($('<b>কোন সুরক্ষা নেই</b>')[0]);
	}

	Morebits.status[statusLevel]('বর্তমান সুরক্ষার সীমা', protectionNode);
};

Twinkle.protect.callback.changeAction = function twinkleprotectCallbackChangeAction(e) {
	var field_preset;
	var field1;
	var field2;

	switch (e.target.values) {
		case 'protect':
			field_preset = new Morebits.quickForm.element({ type: 'field', label: 'সুরক্ষা সেট', name: 'field_preset' });
			field_preset.append({
				type: 'select',
				name: 'category',
				label: 'কারণ নির্বাচন করুন:',
				event: Twinkle.protect.callback.changePreset,
				list: mw.config.get('wgArticleId') ? Twinkle.protect.protectionTypes : Twinkle.protect.protectionTypesCreate
			});

			field2 = new Morebits.quickForm.element({ type: 'field', label: 'সুরক্ষা অপশন', name: 'field2' });
			field2.append({ type: 'div', name: 'currentprot', label: ' ' });  // holds the current protection level, as filled out by the async callback
			field2.append({ type: 'div', name: 'hasprotectlog', label: ' ' });
			// for existing pages
			if (mw.config.get('wgArticleId')) {
				field2.append({
					type: 'checkbox',
					event: Twinkle.protect.formevents.editmodify,
					list: [
						{
							label: 'সম্পাদনা সুরক্ষা পরিবর্তন',
							name: 'editmodify',
							tooltip: 'If this is turned off, the edit protection level, and expiry time, will be left as is.',
							checked: true
						}
					]
				});
				field2.append({
					type: 'select',
					name: 'editlevel',
					label: 'সম্পাদনা সুরক্ষা:',
					event: Twinkle.protect.formevents.editlevel,
					list: Twinkle.protect.protectionLevels.filter(function(level) {
						// Filter TE outside of templates and modules
						return isTemplate || level.value !== 'templateeditor';
					})
				});
				field2.append({
					type: 'select',
					name: 'editexpiry',
					label: 'মেয়াদোত্তীর্ণ:',
					event: function(e) {
						if (e.target.value === 'custom') {
							Twinkle.protect.doCustomExpiry(e.target);
						}
					},
					// default expiry selection (2 days) is conditionally set in Twinkle.protect.callback.changePreset
					list: Twinkle.protect.protectionLengths
				});
				field2.append({
					type: 'checkbox',
					event: Twinkle.protect.formevents.movemodify,
					list: [
						{
							label: 'স্থানান্তর সুরক্ষা পরিবর্তন',
							name: 'movemodify',
							tooltip: 'If this is turned off, the move protection level, and expiry time, will be left as is.',
							checked: true
						}
					]
				});
				field2.append({
					type: 'select',
					name: 'movelevel',
					label: 'স্থানান্তর সুরক্ষা:',
					event: Twinkle.protect.formevents.movelevel,
					list: Twinkle.protect.protectionLevels.filter(function(level) {
						// Autoconfirmed is required for a move, redundant
						return level.value !== 'autoconfirmed' && (isTemplate || level.value !== 'templateeditor');
					})
				});
				field2.append({
					type: 'select',
					name: 'moveexpiry',
					label: 'মেয়াদোত্তীর্ণ:',
					event: function(e) {
						if (e.target.value === 'custom') {
							Twinkle.protect.doCustomExpiry(e.target);
						}
					},
					// default expiry selection (2 days) is conditionally set in Twinkle.protect.callback.changePreset
					list: Twinkle.protect.protectionLengths
				});
				if (hasFlaggedRevs) {
					field2.append({
						type: 'checkbox',
						event: Twinkle.protect.formevents.pcmodify,
						list: [
							{
								label: 'অমীমাংসিত পরিবর্তন সুরক্ষা পরিবর্তন',
								name: 'pcmodify',
								tooltip: 'If this is turned off, the pending changes level, and expiry time, will be left as is.',
								checked: true
							}
						]
					});
					field2.append({
						type: 'select',
						name: 'pclevel',
						label: 'অমীমাংসিত পরিবর্তন:',
						event: Twinkle.protect.formevents.pclevel,
						list: [
							{ label: 'None', value: 'none' },
							{ label: 'Pending change', value: 'autoconfirmed', selected: true }
						]
					});
					field2.append({
						type: 'select',
						name: 'pcexpiry',
						label: 'মেয়াদোত্তীর্ণ:',
						event: function(e) {
							if (e.target.value === 'custom') {
								Twinkle.protect.doCustomExpiry(e.target);
							}
						},
						// default expiry selection (1 month) is conditionally set in Twinkle.protect.callback.changePreset
						list: Twinkle.protect.protectionLengths
					});
				}
			} else {  // for non-existing pages
				field2.append({
					type: 'select',
					name: 'createlevel',
					label: 'সুরক্ষা তৈরি:',
					event: Twinkle.protect.formevents.createlevel,
					list: Twinkle.protect.protectionLevels.filter(function(level) {
						// Filter TE always, and autoconfirmed in mainspace, redundant since WP:ACPERM
						return level.value !== 'templateeditor' && (mw.config.get('wgNamespaceNumber') !== 0 || level.value !== 'autoconfirmed');
					})
				});
				field2.append({
					type: 'select',
					name: 'createexpiry',
					label: 'মেয়াদোত্তীর্ণ:',
					event: function(e) {
						if (e.target.value === 'custom') {
							Twinkle.protect.doCustomExpiry(e.target);
						}
					},
					// default expiry selection (indefinite) is conditionally set in Twinkle.protect.callback.changePreset
					list: Twinkle.protect.protectionLengths
				});
			}
			field2.append({
				type: 'textarea',
				name: 'protectReason',
				label: 'কারণ (সুরক্ষা লগের জন্য):'
			});
			field2.append({
				type: 'div',
				name: 'protectReason_notes',
				label: 'টীকা:',
				style: 'display:inline-block; margin-top:4px;',
				tooltip: 'পাতা সুরক্ষার আবেদন-পাতায় অনুরোধ করা হয়েছিল, সুরক্ষা লগে একটি কারণ যোগ করুন।'
			});
			field2.append({
				type: 'checkbox',
				event: Twinkle.protect.callback.annotateProtectReason,
				style: 'display:inline-block; margin-top:4px;',
				list: [
					{
						label: 'পাতা সুরক্ষার আবেদন-পাতায় অনুরোধ',
						name: 'protectReason_notes_rfpp',
						checked: false,
						value: '[[উইকিপিডিয়া:পাতা সুরক্ষার আবেদন]]-পাতার অনুরোধ অনুসারে'
					}
				]
			});
			field2.append({
				type: 'input',
				event: Twinkle.protect.callback.annotateProtectReason,
				label: 'পাতা সুরক্ষার আবেদন পাতার সংস্করণের আইডি',
				name: 'protectReason_notes_rfppRevid',
				value: '',
				tooltip: 'Optional revision ID of the RfPP page where protection was requested.'
			});
			if (!mw.config.get('wgArticleId') || mw.config.get('wgPageContentModel') === 'Scribunto') {  // tagging isn't relevant for non-existing or module pages
				break;
			}
			/* falls through */
		case 'tag':
			field1 = new Morebits.quickForm.element({ type: 'field', label: 'ট্যাগ করার বিকল্প', name: 'field1' });
			field1.append({ type: 'div', name: 'currentprot', label: ' ' });  // holds the current protection level, as filled out by the async callback
			field1.append({ type: 'div', name: 'hasprotectlog', label: ' ' });
			field1.append({
				type: 'select',
				name: 'tagtype',
				label: 'সুরক্ষা টেমপ্লেট পছন্দ করুন:',
				list: Twinkle.protect.protectionTags,
				event: Twinkle.protect.formevents.tagtype
			});
			field1.append({
				type: 'checkbox',
				list: [
					{
						name: 'small',
						label: 'Iconify (small=yes)',
						tooltip: 'Will use the |small=yes feature of the template, and only render it as a keylock',
						checked: true
					},
					{
						name: 'noinclude',
						label: 'noinclude-সহ টেমপ্লেট যোগ করুন <noinclude>',
						tooltip: 'Will wrap the protection template in &lt;noinclude&gt; tags, so that it won\'t transclude',
						checked: mw.config.get('wgNamespaceNumber') === 10 || (mw.config.get('wgNamespaceNumber') === mw.config.get('wgNamespaceIds').project && mw.config.get('wgTitle').indexOf('Articles for deletion/') === 0)
					}
				]
			});
			break;

		case 'request':
			field_preset = new Morebits.quickForm.element({ type: 'field', label: 'সুরক্ষার ধরণ', name: 'field_preset' });
			field_preset.append({
				type: 'select',
				name: 'category',
				label: 'ধরন ও কারণ:',
				event: Twinkle.protect.callback.changePreset,
				list: mw.config.get('wgArticleId') ? Twinkle.protect.protectionTypes : Twinkle.protect.protectionTypesCreate
			});

			field1 = new Morebits.quickForm.element({ type: 'field', label: 'বিকল্প', name: 'field1' });
			field1.append({ type: 'div', name: 'currentprot', label: ' ' });  // holds the current protection level, as filled out by the async callback
			field1.append({ type: 'div', name: 'hasprotectlog', label: ' ' });
			field1.append({
				type: 'select',
				name: 'expiry',
				label: 'সীমা:',
				list: [
					{ label: '', selected: true, value: '' },
					{ label: 'সাময়িক', value: 'temporary' },
					{ label: 'অসীম', value: 'infinity' }
				]
			});
			field1.append({
				type: 'textarea',
				name: 'reason',
				label: 'কারণ:'
			});
			break;
		default:
			alert("Something's afoot in twinkleprotect");
			break;
	}

	var oldfield;

	if (field_preset) {
		oldfield = $(e.target.form).find('fieldset[name="field_preset"]')[0];
		oldfield.parentNode.replaceChild(field_preset.render(), oldfield);
	} else {
		$(e.target.form).find('fieldset[name="field_preset"]').css('display', 'none');
	}
	if (field1) {
		oldfield = $(e.target.form).find('fieldset[name="field1"]')[0];
		oldfield.parentNode.replaceChild(field1.render(), oldfield);
	} else {
		$(e.target.form).find('fieldset[name="field1"]').css('display', 'none');
	}
	if (field2) {
		oldfield = $(e.target.form).find('fieldset[name="field2"]')[0];
		oldfield.parentNode.replaceChild(field2.render(), oldfield);
	} else {
		$(e.target.form).find('fieldset[name="field2"]').css('display', 'none');
	}

	if (e.target.values === 'protect') {
		// fake a change event on the preset dropdown
		var evt = document.createEvent('Event');
		evt.initEvent('change', true, true);
		e.target.form.category.dispatchEvent(evt);

		// reduce vertical height of dialog
		$(e.target.form).find('fieldset[name="field2"] select').parent().css({ display: 'inline-block', marginRight: '0.5em' });
		$(e.target.form).find('fieldset[name="field2"] input[name="protectReason_notes_rfppRevid"]').parent().css({display: 'inline-block', marginLeft: '15px'}).hide();
	}

	// re-add protection level and log info, if it's available
	Twinkle.protect.callback.showLogAndCurrentProtectInfo();
};

// NOTE: This function is used by batchprotect as well
Twinkle.protect.formevents = {
	editmodify: function twinkleprotectFormEditmodifyEvent(e) {
		e.target.form.editlevel.disabled = !e.target.checked;
		e.target.form.editexpiry.disabled = !e.target.checked || (e.target.form.editlevel.value === 'all');
		e.target.form.editlevel.style.color = e.target.form.editexpiry.style.color = e.target.checked ? '' : 'transparent';
	},
	editlevel: function twinkleprotectFormEditlevelEvent(e) {
		e.target.form.editexpiry.disabled = e.target.value === 'all';
	},
	movemodify: function twinkleprotectFormMovemodifyEvent(e) {
		// sync move settings with edit settings if applicable
		if (e.target.form.movelevel.disabled && !e.target.form.editlevel.disabled) {
			e.target.form.movelevel.value = e.target.form.editlevel.value;
			e.target.form.moveexpiry.value = e.target.form.editexpiry.value;
		} else if (e.target.form.editlevel.disabled) {
			e.target.form.movelevel.value = 'sysop';
			e.target.form.moveexpiry.value = 'infinity';
		}
		e.target.form.movelevel.disabled = !e.target.checked;
		e.target.form.moveexpiry.disabled = !e.target.checked || (e.target.form.movelevel.value === 'all');
		e.target.form.movelevel.style.color = e.target.form.moveexpiry.style.color = e.target.checked ? '' : 'transparent';
	},
	movelevel: function twinkleprotectFormMovelevelEvent(e) {
		e.target.form.moveexpiry.disabled = e.target.value === 'all';
	},
	pcmodify: function twinkleprotectFormPcmodifyEvent(e) {
		e.target.form.pclevel.disabled = !e.target.checked;
		e.target.form.pcexpiry.disabled = !e.target.checked || (e.target.form.pclevel.value === 'none');
		e.target.form.pclevel.style.color = e.target.form.pcexpiry.style.color = e.target.checked ? '' : 'transparent';
	},
	pclevel: function twinkleprotectFormPclevelEvent(e) {
		e.target.form.pcexpiry.disabled = e.target.value === 'none';
	},
	createlevel: function twinkleprotectFormCreatelevelEvent(e) {
		e.target.form.createexpiry.disabled = e.target.value === 'all';
	},
	tagtype: function twinkleprotectFormTagtypeEvent(e) {
		e.target.form.small.disabled = e.target.form.noinclude.disabled = (e.target.value === 'none') || (e.target.value === 'noop');
	}
};

Twinkle.protect.doCustomExpiry = function twinkleprotectDoCustomExpiry(target) {
	var custom = prompt('Enter a custom expiry time.  \nYou can use relative times, like "1 minute" or "19 days", or absolute timestamps, "yyyymmddhhmm" (e.g. "200602011405" is Feb 1, 2006, at 14:05 UTC).', '');
	if (custom) {
		var option = document.createElement('option');
		option.setAttribute('value', custom);
		option.textContent = custom;
		target.appendChild(option);
		target.value = custom;
	} else {
		target.selectedIndex = 0;
	}
};

// NOTE: This list is used by batchprotect as well
Twinkle.protect.protectionLevels = [
	{ label: 'All', value: 'all' },
	{ label: 'স্বয়ংনিশ্চিতকৃত', value: 'autoconfirmed' },
//	{ label: 'Extended confirmed', value: 'extendedconfirmed' },
//	{ label: 'Template editor', value: 'templateeditor' },
	{ label: 'প্রশাসক', value: 'sysop', selected: true }
];

// default expiry selection is conditionally set in Twinkle.protect.callback.changePreset
// NOTE: This list is used by batchprotect as well
Twinkle.protect.protectionLengths = [
	{ label: '১ ঘন্টা', value: '1 hour' },
	{ label: '২ ঘন্টা', value: '2 hours' },
	{ label: '৩ ঘন্টা', value: '3 hours' },
	{ label: '৬ ঘন্টা', value: '6 hours' },
	{ label: '১২ ঘন্টা', value: '12 hours' },
	{ label: '১ দিন', value: '1 day' },
	{ label: '২ দিন', value: '2 days' },
	{ label: '৩ দিন', value: '3 days' },
	{ label: '৪ দিন', value: '4 days' },
	{ label: '১ সপ্তাহ', value: '1 week' },
	{ label: '২ সপ্তাহ', value: '2 weeks' },
	{ label: '১ মাস', value: '1 month' },
	{ label: '২ মাস', value: '2 months' },
	{ label: '৩ মাস', value: '3 months' },
	{ label: '১ বছর', value: '1 year' },
	{ label: 'অসীম', value: 'infinity' },
	{ label: 'অন্য...', value: 'custom' }
];

Twinkle.protect.protectionTypes = [
	{ label: 'অরক্ষিত', value: 'unprotect' },
	{
		label: 'সম্পূর্ণ সুরক্ষা',
		list: [
			{ label: 'সাধারণ (পূর্ণ)', value: 'pp-protected' },
			{ label: 'বির্তক/সম্পাদনা যুদ্ধ (সম্পূর্ণ)', value: 'pp-dispute' },
			{ label: 'চলমান ধ্বংসপ্রবণতা (সম্পূর্ণ)', value: 'pp-vandalism' },
			{ label: 'বাধাপ্রাপ্ত ব্যবহারকারী আলাপ পাতা (সম্পূর্ণ)', value: 'pp-usertalk' }
		]
	},
	{
		label: 'টেমপ্লেট সুরক্ষা',
		list: [
			{ label: 'উচ্চমাত্রায় প্রদর্শনকৃত টেমপ্লেট', value: 'pp-template' }
		]
	}, 

/**
এই অধিকার বাংলা উইকিতে নেই।

	{
		label: 'সম্প্রসারিত নিশ্চিতকৃত সুরক্ষা',
		list: [
			{ label: 'Arbitration enforcement (ECP)', selected: true, value: 'pp-30-500-arb' },
			{ label: 'চলমান ধ্বংসপ্রবণতা (ECP)', value: 'pp-30-500-vandalism' },
			{ label: 'অগঠনমূলক সম্পাদনা (ECP)', value: 'pp-30-500-disruptive' },
			{ label: 'BLP policy violations (ECP)', value: 'pp-30-500-blp' },
			{ label: 'Sockpuppetry (ECP)', value: 'pp-30-500-sock' }
		]
	},
**/

	{
		label: 'অর্ধ-সুরক্ষা',
		list: [
			{ label: 'সাধারণ (অর্ধ)', value: 'pp-semi-protected' },
			{ label: 'চলমান ধ্বংসপ্রবণতা (অর্ধ)', selected: true, value: 'pp-semi-vandalism' },
			{ label: 'অগঠনমূলক সম্পাদনা (অর্ধ)', value: 'pp-semi-disruptive' },
			{ label: 'উৎসবিহীন তথ্য সংযোজন (অর্ধ)', value: 'pp-semi-unsourced' },
			{ label: 'জীবজী নীতি লঙ্ঘন (অর্ধ)', value: 'pp-semi-blp' },
			{ label: 'সকপাপেট্রি (অর্ধ)', value: 'pp-semi-sock' },
			{ label: 'বাধাপ্রাপ্ত ব্যবহারকারীর আলাপ পাতা (অর্ধ)', value: 'pp-semi-usertalk' }
		]
	},
	{
		label: 'অমীমাংসিত পরিবর্তন',
		list: [
			{ label: 'সাধারণ (অমীমাংসিত পরিবর্তন)', value: 'pp-pc-protected' },
			{ label: 'চলমান ধ্বংসপ্রবণতা (অমীমাংসিত পরিবর্তন)', value: 'pp-pc-vandalism' },
			{ label: 'অগঠনমূলক সম্পাদনা (অমীমাংসিত পরিবর্তন)', value: 'pp-pc-disruptive' },
			{ label: 'উৎসবিহীন তথ্য সংযোজন (অমীমাংসিত পরিবর্তন)', value: 'pp-pc-unsourced' },
			{ label: 'জীবজী নীতিমালা লঙ্ঘন (অমীমাংসিত পরিবর্তন)', value: 'pp-pc-blp' }
		]
	},
	{
		label: 'স্থানান্তর সুরক্ষা',
		list: [
			{ label: 'সাধারণ (স্থানান্তর)', value: 'pp-move' },
			{ label: 'স্থানান্তর যুদ্ধ (স্থানান্তর)', value: 'pp-move-dispute' },
			{ label: 'পাতা স্থানান্তর ধ্বংসপ্রবণতা (স্থানান্তর)', value: 'pp-move-vandalism' },
			{ label: 'উচ্চমাত্রায় প্রদর্শনকৃত পাতা (স্থানান্তর)', value: 'pp-move-indef' }
		]
	}
].filter(function(type) {
	// Filter for templates and flaggedrevs
	return (isTemplate || type.label !== 'Template protection') && (hasFlaggedRevs || type.label !== 'Pending changes');
});

Twinkle.protect.protectionTypesCreate = [
	{ label: 'অরক্ষিত', value: 'unprotect' },
	{
		label: 'তৈরি সুরক্ষা',
		list: [
			{ label: 'সাধারণ ({{pp-create}})', value: 'pp-create' },
			{ label: 'অগ্রহণযোগ্য নাম', value: 'pp-create-offensive' },
			{ label: 'বারবার পুনঃতৈরি', selected: true, value: 'pp-create-salt' },
			{ label: 'সম্প্রতি অপসারিত জীবিত ব্যক্তির নিবন্ধ', value: 'pp-create-blp' }
		]
	}
];

// A page with both regular and PC protection will be assigned its regular
// protection weight plus 2
Twinkle.protect.protectionWeight = {
	sysop: 40,
//	templateeditor: 30,
//	extendedconfirmed: 20,
	autoconfirmed: 10,
	flaggedrevs_autoconfirmed: 5,  // Pending Changes protection alone
	all: 0,
	flaggedrevs_none: 0  // just in case
};

// NOTICE: keep this synched with [[MediaWiki:Protect-dropdown]]
// Also note: stabilize = Pending Changes level
// expiry will override any defaults
Twinkle.protect.protectionPresetsInfo = {
	'pp-protected': {
		edit: 'sysop',
		move: 'sysop',
		reason: null
	},
	'pp-dispute': {
		edit: 'sysop',
		move: 'sysop',
		reason: '[[WP:PP#Content disputes|Edit warring / content dispute]]'
	},
	'pp-vandalism': {
		edit: 'sysop',
		move: 'sysop',
		reason: 'চলমান [[WP:Vandalism|ধ্বংসপ্রবণতা]]'
	},
	'pp-usertalk': {
		edit: 'sysop',
		move: 'sysop',
		expiry: 'infinity',
		reason: '[[WP:PP#Talk-page protection|অবরুদ্ধ থাকাকালীন ব্যবহারকারী আলাপ পাতার অনুপযুক্ত ব্যবহার]]'
	},
	'pp-template': {
		edit: 'sysop',
		move: 'sysop',
		expiry: 'infinity',
		reason: '[[WP:High-risk templates|Highly visible template]]'
//উচ্চ ঝুঁকির টেমপ্লেটে প্রশাসক সুরক্ষা
	},

/**
বাংলা উইকির জন্য অপ্রয়োজনীয়

	'pp-30-500-arb': {
		edit: 'extendedconfirmed',
		move: 'extendedconfirmed',
		expiry: 'infinity',
		reason: '[[WP:30/500|Arbitration enforcement]]',
		template: 'pp-30-500'
	},
	'pp-30-500-vandalism': {
		edit: 'extendedconfirmed',
		move: 'extendedconfirmed',
		reason: 'চলমান [[WP:Vandalism|vandalism]] from (auto)confirmed accounts',
		template: 'pp-30-500'
	},
	'pp-30-500-disruptive': {
		edit: 'extendedconfirmed',
		move: 'extendedconfirmed',
		reason: 'চলমান [[WP:অগঠনমূলক সম্পাদনা|অগঠনমূলক সম্পাদনা]] from (auto)confirmed accounts',
		template: 'pp-30-500'
	},
	'pp-30-500-blp': {
		edit: 'extendedconfirmed',
		move: 'extendedconfirmed',
		reason: 'চলমান violations of the [[WP:BLP|biographies of living persons policy]] from (auto)confirmed accounts',
		template: 'pp-30-500'
	},
	'pp-30-500-sock': {
		edit: 'extendedconfirmed',
		move: 'extendedconfirmed',
		reason: 'চলমান [[WP:Sock puppetry|সক পাপেট্রি]]',
		template: 'pp-30-500'
	},
**/

	'pp-semi-vandalism': {
		edit: 'autoconfirmed',
		reason: 'চলমান [[WP:Vandalism|ধ্বংসপ্রবণতা]]',
		template: 'pp-vandalism'
	},
	'pp-semi-disruptive': {
		edit: 'autoconfirmed',
		reason: 'চলমান [[WP:অগঠনমূলক সম্পাদনা|অগঠনমূলক সম্পাদনা]]',
		template: 'pp-protected'
	},
	'pp-semi-unsourced': {
		edit: 'autoconfirmed',
		reason: '[[WP:INTREF|উৎসহীন বা দুর্বল তথ্যসূত্রসহ]] বিষয়বস্তু সংযোজন',
		template: 'pp-protected'
	},
	'pp-semi-blp': {
		edit: 'autoconfirmed',
		reason: '[[WP:BLP|জীবিত ব্যক্তির জীবনী]] নীতিমালা লঙ্ঘন',
		template: 'pp-blp'
	},
	'pp-semi-usertalk': {
		edit: 'autoconfirmed',
		move: 'autoconfirmed',
		expiry: 'infinity',
		reason: '[[WP:PP#Talk-page protection|অবরুদ্ধ থাকাকালীন ব্যবহারকারী আলাপ পাতার অনুপযুক্ত ব্যবহার]]',
		template: 'pp-usertalk'
	},
	'pp-semi-template': {  // removed for now
		edit: 'autoconfirmed',
		move: 'autoconfirmed',
		expiry: 'infinity',
		reason: '[[WP:High-risk templates|Highly visible template]]',
		template: 'pp-template'
	},
	'pp-semi-sock': {
		edit: 'autoconfirmed',
		reason: 'চলমান [[WP:Sock puppetry|সক পাপেট্রি]]',
		template: 'pp-sock'
	},
	'pp-semi-protected': {
		edit: 'autoconfirmed',
		reason: null,
		template: 'pp-protected'
	},
	'pp-pc-vandalism': {
		stabilize: 'autoconfirmed',  // stabilize = Pending Changes
		reason: 'চলমান [[WP:Vandalism|ধ্বংসপ্রবণতা]]',
		template: 'pp-pc'
	},
	'pp-pc-disruptive': {
		stabilize: 'autoconfirmed',
		reason: 'চলমান [[WP:অগঠনমূলক সম্পাদনা|অগঠনমূলক সম্পাদনা]]',
		template: 'pp-pc'
	},
	'pp-pc-unsourced': {
		stabilize: 'autoconfirmed',
		reason: '[[WP:INTREF|উৎসহীন বা দুর্বল তথ্যসূত্রসহ]] বিষয়বস্তু সংযোজন',
		template: 'pp-pc'
	},
	'pp-pc-blp': {
		stabilize: 'autoconfirmed',
		reason: '[[WP:BLP|জীবিত ব্যক্তির জীবনী]] নীতিমালা লঙ্ঘন',
		template: 'pp-pc'
	},
	'pp-pc-protected': {
		stabilize: 'autoconfirmed',
		reason: null,
		template: 'pp-pc'
	},
	'pp-move': {
		move: 'sysop',
		reason: null
	},
	'pp-move-dispute': {
		move: 'sysop',
		reason: '[[WP:MOVP|স্থানান্তর যুদ্ধ]]'
	},
	'pp-move-vandalism': {
		move: 'sysop',
		reason: '[[WP:MOVP|পাতা-স্থানান্তর ধ্বংসপ্রবণতা]]'
	},
	'pp-move-indef': {
		move: 'sysop',
		expiry: 'infinity',
		reason: '[[WP:MOVP|উচ্চমাত্রায় প্রদর্শনকৃত পাতা]]'
	},
	'unprotect': {
		edit: 'all',
		move: 'all',
		stabilize: 'none',
		create: 'all',
		reason: null,
		template: 'none'
	},
	'pp-create-offensive': {
		create: 'sysop',
		reason: '[[WP:SALT|অনপুযুক্ত নাম]]'
	} //এখানে কমা হবে না, নতুন অপশন যুক্ত করলে কমা হবে

/**
	'pp-create-salt': {
		create: 'extendedconfirmed',
		reason: '[[WP:SALT|Repeatedly recreated]]'
	},
	'pp-create-blp': {
		create: 'extendedconfirmed',
		reason: '[[WP:BLPDEL|Recently deleted BLP]]'
	},
	'pp-create': {
		create: 'extendedconfirmed',
		reason: '{{pp-create}}'
	}
**/
};

Twinkle.protect.protectionTags = [
	{
		label: 'কিছুই না (বিদ্যমান সুরক্ষা টেমপ্লেট অপসারণ করবে)',
		value: 'none'
	},
	{
		label: 'কিছুই না (বিদ্যমান সুরক্ষা টেমপ্লেট রেখে দিবে)',
		value: 'noop'
	},
	{
		label: 'সুরক্ষা টেমপ্লেট',
		list: [
			{ label: '{{pp-vandalism}}: ধ্বংসপ্রবণতা', value: 'pp-vandalism' },
			{ label: '{{pp-dispute}}: dispute/edit war', value: 'pp-dispute' },
			{ label: '{{pp-blp}}: BLP violations', value: 'pp-blp' },
			{ label: '{{pp-sock}}: সকপাপেট্রি', value: 'pp-sock' },
			{ label: '{{pp-template}}: উচ্চ-ঝুঁকির টেমপ্লেট', value: 'pp-template' },
			{ label: '{{pp-usertalk}}: বাধাপ্রাপ্ত ব্যবহারকারী আলাপ', value: 'pp-usertalk' },
			{ label: '{{pp-protected}}: সাধারণ সুরক্ষা', value: 'pp-protected' },
			{ label: '{{pp-semi-indef}}: সাধারণ দীর্ঘমেয়াদি অর্ধ-সুরক্ষা', value: 'pp-semi-indef' }
		/**	{ label: '{{pp-30-500}}: extended confirmed protection', value: 'pp-30-500' } **/
		]
	},
	{
		label: 'অমীমাংসিত পরিবর্তন টেমপ্লেট',
		list: [
			{ label: '{{pp-pc}}: অমীমাংসিত পরিবর্তন', value: 'pp-pc' }
		]
	},
	{
		label: 'স্থানান্তর সুরক্ষা টেমপ্লেট',
		list: [
			{ label: '{{pp-move-dispute}}: dispute/move war', value: 'pp-move-dispute' },
			{ label: '{{pp-move-vandalism}}: পাতা-স্থানান্তর ধ্বংসপ্রবণতা', value: 'pp-move-vandalism' },
			{ label: '{{pp-move-indef}}: general long-term', value: 'pp-move-indef' },
			{ label: '{{pp-move}}: other', value: 'pp-move' }
		]
	}
].filter(function(type) {
	// Filter FlaggedRevs
	return hasFlaggedRevs || type.label !== 'স্থানান্তর সুরক্ষা টেমপ্লেট';
});

Twinkle.protect.callback.changePreset = function twinkleprotectCallbackChangePreset(e) {
	var form = e.target.form;

	var actiontypes = form.actiontype;
	var actiontype;
	for (var i = 0; i < actiontypes.length; i++) {
		if (!actiontypes[i].checked) {
			continue;
		}
		actiontype = actiontypes[i].values;
		break;
	}

	if (actiontype === 'protect') {  // actually protecting the page
		var item = Twinkle.protect.protectionPresetsInfo[form.category.value];

		if (mw.config.get('wgArticleId')) {
			if (item.edit) {
				form.editmodify.checked = true;
				Twinkle.protect.formevents.editmodify({ target: form.editmodify });
				form.editlevel.value = item.edit;
				Twinkle.protect.formevents.editlevel({ target: form.editlevel });
			} else {
				form.editmodify.checked = false;
				Twinkle.protect.formevents.editmodify({ target: form.editmodify });
			}

			if (item.move) {
				form.movemodify.checked = true;
				Twinkle.protect.formevents.movemodify({ target: form.movemodify });
				form.movelevel.value = item.move;
				Twinkle.protect.formevents.movelevel({ target: form.movelevel });
			} else {
				form.movemodify.checked = false;
				Twinkle.protect.formevents.movemodify({ target: form.movemodify });
			}

			form.editexpiry.value = form.moveexpiry.value = item.expiry || '2 days';


			if (form.pcmodify) {
				if (item.stabilize) {
					form.pcmodify.checked = true;
					Twinkle.protect.formevents.pcmodify({ target: form.pcmodify });
					form.pclevel.value = item.stabilize;
					Twinkle.protect.formevents.pclevel({ target: form.pclevel });
				} else {
					form.pcmodify.checked = false;
					Twinkle.protect.formevents.pcmodify({ target: form.pcmodify });
				}
				form.pcexpiry.value = item.expiry || '1 month';
			}
		} else {
			if (item.create) {
				form.createlevel.value = item.create;
				Twinkle.protect.formevents.createlevel({ target: form.createlevel });
			}
			form.createexpiry.value = item.expiry || 'infinity';
		}

		var reasonField = actiontype === 'protect' ? form.protectReason : form.reason;
		if (item.reason) {
			reasonField.value = item.reason;
		} else {
			reasonField.value = '';
		}
		// Add any annotations
		Twinkle.protect.callback.annotateProtectReason(e);

		// sort out tagging options, disabled if nonexistent or lua
		if (mw.config.get('wgArticleId') && mw.config.get('wgPageContentModel') !== 'Scribunto') {
			if (form.category.value === 'unprotect') {
				form.tagtype.value = 'none';
			} else {
				form.tagtype.value = item.template ? item.template : form.category.value;
			}
			Twinkle.protect.formevents.tagtype({ target: form.tagtype });

			// We only have one TE template at the moment, so this
			// should be expanded if more are added (e.g. pp-semi-template)
			if (form.category.value === 'pp-template') {
				form.noinclude.checked = true;
			} else if (mw.config.get('wgNamespaceNumber') !== 10) {
				form.noinclude.checked = false;
			}
		}

	} else {  // RPP request
		if (form.category.value === 'unprotect') {
			form.expiry.value = '';
			form.expiry.disabled = true;
		} else {
			form.expiry.value = '';
			form.expiry.disabled = false;
		}
	}
};

Twinkle.protect.callback.evaluate = function twinkleprotectCallbackEvaluate(e) {
	var form = e.target;
	var input = Morebits.quickForm.getInputData(form);

	var tagparams;
	if (input.actiontype === 'tag' || (input.actiontype === 'protect' && mw.config.get('wgArticleId') && mw.config.get('wgPageContentModel') !== 'Scribunto')) {
		tagparams = {
			tag: input.tagtype,
			reason: (input.tagtype === 'pp-protected' || input.tagtype === 'pp-semi-protected' || input.tagtype === 'pp-move') && input.protectReason,
			small: input.small,
			noinclude: input.noinclude
		};
	}

	switch (input.actiontype) {
		case 'protect':
			// protect the page
			Morebits.wiki.actionCompleted.redirect = mw.config.get('wgPageName');
			Morebits.wiki.actionCompleted.notice = 'সুরক্ষিত করা সম্পন্ন';

			var statusInited = false;
			var thispage;

			var allDone = function twinkleprotectCallbackAllDone() {
				if (thispage) {
					thispage.getStatusElement().info('করা হয়েছে');
				}
				if (tagparams) {
					Twinkle.protect.callbacks.taggingPageInitial(tagparams);
				}
			};

			var protectIt = function twinkleprotectCallbackProtectIt(next) {
				thispage = new Morebits.wiki.page(mw.config.get('wgPageName'), 'সুরক্ষিত করা হচ্ছে');
				if (mw.config.get('wgArticleId')) {
					if (input.editmodify) {
						thispage.setEditProtection(input.editlevel, input.editexpiry);
					}
					if (input.movemodify) {
						// Ensure a level has actually been chosen
						if (input.movelevel) {
							thispage.setMoveProtection(input.movelevel, input.moveexpiry);
						} else {
							alert('আপনাকে অবশ্যই স্থানান্তর সুরক্ষার স্তর বাছাই করতে হবে!');
							return;
						}
					}
					thispage.setWatchlist(Twinkle.getPref('watchProtectedPages'));
				} else {
					thispage.setCreateProtection(input.createlevel, input.createexpiry);
					thispage.setWatchlist(false);
				}

				if (input.protectReason) {
					thispage.setEditSummary(input.protectReason);
				} else {
					alert('You must enter a protect reason, which will be inscribed into the protection log.');
					return;
				}

				if (input.protectReason_notes_rfppRevid && !/^\d+$/.test(input.protectReason_notes_rfppRevid)) {
					alert('The provided revision ID is malformed. Please see https://en.wikipedia.org/wiki/Help:Permanent_link for information on how to find the correct ID (also called "oldid").');
					return;
				}

				if (!statusInited) {
					Morebits.simpleWindow.setButtonsEnabled(false);
					Morebits.status.init(form);
					statusInited = true;
				}

				thispage.setChangeTags(Twinkle.changeTags);
				thispage.protect(next);
			};

			var stabilizeIt = function twinkleprotectCallbackStabilizeIt() {
				if (thispage) {
					thispage.getStatusElement().info('done');
				}

				thispage = new Morebits.wiki.page(mw.config.get('wgPageName'), 'Applying pending changes protection');
				thispage.setFlaggedRevs(input.pclevel, input.pcexpiry);

				if (input.protectReason) {
					thispage.setEditSummary(input.protectReason + Twinkle.summaryAd); // flaggedrevs tag support: [[phab:T247721]]
				} else {
					alert('You must enter a protect reason, which will be inscribed into the protection log.');
					return;
				}

				if (!statusInited) {
					Morebits.simpleWindow.setButtonsEnabled(false);
					Morebits.status.init(form);
					statusInited = true;
				}

				thispage.setWatchlist(Twinkle.getPref('watchProtectedPages'));
				thispage.stabilize(allDone, function(error) {
					if (error.errorCode === 'stabilize_denied') { // [[phab:T234743]]
						thispage.getStatusElement().error('Failed trying to modify pending changes settings, likely due to a mediawiki bug. Other actions (tagging or regular protection) may have taken place. Please reload the page and try again.');
					}
				});
			};

			if (input.editmodify || input.movemodify || !mw.config.get('wgArticleId')) {
				if (input.pcmodify) {
					protectIt(stabilizeIt);
				} else {
					protectIt(allDone);
				}
			} else if (input.pcmodify) {
				stabilizeIt();
			} else {
				alert("Please give Twinkle something to do! \nIf you just want to tag the page, you can choose the 'Tag page with protection template' option at the top.");
			}

			break;

		case 'tag':
			// apply a protection template

			Morebits.simpleWindow.setButtonsEnabled(false);
			Morebits.status.init(form);

			Morebits.wiki.actionCompleted.redirect = mw.config.get('wgPageName');
			Morebits.wiki.actionCompleted.followRedirect = false;
			Morebits.wiki.actionCompleted.notice = 'Tagging complete';

			Twinkle.protect.callbacks.taggingPageInitial(tagparams);
			break;

		case 'request':
			// file request at RFPP
			var typename, typereason;
			switch (input.category) {
				case 'pp-dispute':
				case 'pp-vandalism':
				case 'pp-usertalk':
				case 'pp-protected':
					typename = 'full protection';
					break;
				case 'pp-template':
					typename = 'template protection';
					break;
/**				case 'pp-30-500-arb':
				case 'pp-30-500-vandalism':
				case 'pp-30-500-disruptive':
				case 'pp-30-500-blp':
				case 'pp-30-500-sock':
					typename = 'extended confirmed protection'; 	**/
					break;
				case 'pp-semi-vandalism':
				case 'pp-semi-disruptive':
				case 'pp-semi-unsourced':
				case 'pp-semi-usertalk':
				case 'pp-semi-sock':
				case 'pp-semi-blp':
				case 'pp-semi-protected':
					typename = 'অর্ধ সুরক্ষিত';
					break;
				case 'pp-pc-vandalism':
				case 'pp-pc-blp':
				case 'pp-pc-protected':
				case 'pp-pc-unsourced':
				case 'pp-pc-disruptive':
					typename = 'অমীমাংসিত পরিবর্তন';
					break;
				case 'pp-move':
				case 'pp-move-dispute':
				case 'pp-move-indef':
				case 'pp-move-vandalism':
					typename = 'স্থানান্তর সুরক্ষা';
					break;
				case 'pp-create':
				case 'pp-create-offensive':
				case 'pp-create-blp':
				case 'pp-create-salt':
					typename = 'তৈরি সুরক্ষা';
					break;
				case 'unprotect':
					var admins = $.map(Twinkle.protect.currentProtectionLevels, function(pl) {
						if (!pl.admin || Twinkle.protect.trustedBots.indexOf(pl.admin) !== -1) {
							return null;
						}
						return 'User:' + pl.admin;
					});
					if (admins.length && !confirm('Have you attempted to contact the protecting admins (' + Morebits.array.uniq(admins).join(', ') + ') first?')) {
						return false;
					}
					// otherwise falls through
				default:
					typename = 'unprotection';
					break;
			}
			switch (input.category) {
				case 'pp-dispute':
					typereason = 'বির্তক/সম্পাদনা যুদ্ধ';
					break;
				case 'pp-vandalism':
				case 'pp-semi-vandalism':
				case 'pp-pc-vandalism':
				case 'pp-30-500-vandalism':
					typereason = 'চলমান [[WP:VAND|ধ্বংসপ্রবণতা]]';
					break;
				case 'pp-semi-disruptive':
				case 'pp-pc-disruptive':
				case 'pp-30-500-disruptive':
					typereason = 'চলমান [[Wikipedia:অগঠনমূলক সম্পাদনা|অগঠনমূলক সম্পাদনা]]';
					break;
				case 'pp-semi-unsourced':
				case 'pp-pc-unsourced':
					typereason = '[[WP:INTREF|উৎসহীন বা দুর্বল তথ্যসূত্রসহ]] বিষয়বস্তু সংযোজন';
					break;
				case 'pp-template':
					typereason = '[[WP:HIGHRISK|উচ্চ-ঝুঁকিপূর্ণ টেমপ্লেট]]';
					break;
				case 'pp-30-500-arb':
					typereason = '[[WP:30/500|Arbitration enforcement]]';
					break;
				case 'pp-usertalk':
				case 'pp-semi-usertalk':
					typereason = 'বাধাপ্রাপ্ত অবস্থায় ব্যবহারকারী আলাপ পাতার অপব্যবহার';
					break;
				case 'pp-semi-sock':
				case 'pp-30-500-sock':
					typereason = 'চলমান [[WP:SOCK|সক পাপেট্রি]]';
					break;
				case 'pp-semi-blp':
				case 'pp-pc-blp':
				case 'pp-30-500-blp':
					typereason = '[[WP:BLP|জীবজী]] নীতিমালা লঙ্ঘন';
					break;
				case 'pp-move-dispute':
					typereason = 'শিরোনাম নিয়ে স্থানান্তর যুদ্ধ';
					break;
				case 'pp-move-vandalism':
					typereason = 'পাতা-স্থানান্তর ধ্বংসপ্রবণতা';
					break;
				case 'pp-move-indef':
					typereason = 'উচ্চমাত্রায় প্রদর্শনকৃত পাতা';
					break;
				case 'pp-create-offensive':
					typereason = 'অগ্ৰহণযোগ্য নাম';
					break;
				case 'pp-create-blp':
					typereason = 'সাম্প্রতিক কালে অপসারিত [[WP:BLP|জীবিত ব্যক্তির জীবনী]]';
					break;
				case 'pp-create-salt':
					typereason = 'বারবার তৈরি';
					break;
				default:
					typereason = '';
					break;
			}

			var reason = typereason;
			if (input.reason !== '') {
				if (typereason !== '') {
					reason += '\u00A0\u2013 ';  // U+00A0 NO-BREAK SPACE; U+2013 EN RULE
				}
				reason += input.reason;
			}
			if (reason !== '' && reason.charAt(reason.length - 1) !== '।') {
				reason += '।';
			}

			var rppparams = {
				reason: reason,
				typename: typename,
				category: input.category,
				expiry: input.expiry
			};

			Morebits.simpleWindow.setButtonsEnabled(false);
			Morebits.status.init(form);

			var rppName = 'উইকিপিডিয়া:পাতা সুরক্ষার আবেদন/সুরক্ষা';

			// Updating data for the action completed event
			Morebits.wiki.actionCompleted.redirect = 'উইকিপিডিয়া:পাতা সুরক্ষার আবেদন';
			Morebits.wiki.actionCompleted.notice = 'মনোনয়ন সম্পন্ন, আলোচনা পাতায় পুনঃনির্দেশিত করা হচ্ছে';

			var rppPage = new Morebits.wiki.page(rppName, 'পাতা সুরক্ষিত করার অনুরোধ করা হচ্ছে');
			rppPage.setFollowRedirect(true);
			rppPage.setCallbackParameters(rppparams);
			rppPage.load(Twinkle.protect.callbacks.fileRequest);
			break;
		default:
			alert('twinkleprotect: unknown kind of action');
			break;
	}
};

Twinkle.protect.protectReasonAnnotations = [];
Twinkle.protect.callback.annotateProtectReason = function twinkleprotectCallbackAnnotateProtectReason(e) {
	var form = e.target.form;
	var protectReason = form.protectReason.value.replace(new RegExp('(?:; )?' + mw.util.escapeRegExp(Twinkle.protect.protectReasonAnnotations.join(': '))), '');

	if (this.name === 'protectReason_notes_rfpp') {
		if (this.checked) {
			Twinkle.protect.protectReasonAnnotations.push(this.value);
			$(form.protectReason_notes_rfppRevid).parent().show();
		} else {
			Twinkle.protect.protectReasonAnnotations = [];
			form.protectReason_notes_rfppRevid.value = '';
			$(form.protectReason_notes_rfppRevid).parent().hide();
		}
	} else if (this.name === 'protectReason_notes_rfppRevid') {
		Twinkle.protect.protectReasonAnnotations = Twinkle.protect.protectReasonAnnotations.filter(function(el) {
			return el.indexOf('[[Special:Permalink') === -1;
		});
		if (e.target.value.length) {
			var permalink = '[[বিশেষ:স্থায়ী সংযোগ/' + e.target.value + '#' + Morebits.pageNameNorm + ']]';
			Twinkle.protect.protectReasonAnnotations.push(permalink);
		}
	}

	if (!Twinkle.protect.protectReasonAnnotations.length) {
		form.protectReason.value = protectReason;
	} else {
		form.protectReason.value = (protectReason ? protectReason + '; ' : '') + Twinkle.protect.protectReasonAnnotations.join(': ');
	}
};

Twinkle.protect.callbacks = {
	taggingPageInitial: function(tagparams) {
		if (tagparams.tag === 'noop') {
			Morebits.status.info('সুরক্ষা টেমপ্লেট যোগ করা হচ্ছে', 'কিছু করার নেই');
			return;
		}

		var protectedPage = new Morebits.wiki.page(mw.config.get('wgPageName'), 'পাতায় ট্যাগ যোগ করা হচ্ছে');
		protectedPage.setCallbackParameters(tagparams);
		protectedPage.load(Twinkle.protect.callbacks.taggingPage);
	},
	taggingPage: function(protectedPage) {
		var params = protectedPage.getCallbackParameters();
		var text = protectedPage.getPageText();
		var tag, summary;

		var oldtag_re = /\s*(?:<noinclude>)?\s*\{\{\s*(pp-[^{}]*?|protected|(?:t|v|s|p-|usertalk-v|usertalk-s|sb|move)protected(?:2)?|protected template|privacy protection)\s*?\}\}\s*(?:<\/noinclude>)?\s*/gi;
		var re_result = oldtag_re.exec(text);
		if (re_result) {
			if (params.tag === 'none' || confirm('{{' + re_result[1] + '}} was found on the page. \nClick OK to remove it, or click Cancel to leave it there.')) {
				text = text.replace(oldtag_re, '');
			}
		}

		if (params.tag === 'none') {
			summary = 'সুরক্ষা টেমপ্লেট সরানো হচ্ছে';
		} else {
			tag = params.tag;
			if (params.reason) {
				tag += '|reason=' + params.reason;
			}
			if (params.small) {
				tag += '|small=yes';
			}

			if (/^\s*#redirect/i.test(text)) { // redirect page
				// Only tag if no {{rcat shell}} is found
				if (!text.match(/{{(?:redr|this is a redirect|r(?:edirect)?(?:.?cat.*)?[ _]?sh)/i)) {
					text = text.replace(/#REDIRECT ?(\[\[.*?\]\])(.*)/i, '#REDIRECT $1$2\n\n{{' + tag + '}}');
				} else {
					Morebits.status.info('Redirect category shell present', 'কিছু করার নেই');
					return;
				}
			} else {
				if (params.noinclude) {
					tag = '<noinclude>{{' + tag + '}}</noinclude>';
				} else {
					tag = '{{' + tag + '}}\n';
				}

				// Insert tag after short description or any hatnotes
				var wikipage = new Morebits.wikitext.page(text);
				text = wikipage.insertAfterTemplates(tag, Twinkle.hatnoteRegex).getText();
			}
			summary = '{{' + params.tag + '}} যোগ করা হয়েছে';
		}

		protectedPage.setEditSummary(summary);
		protectedPage.setChangeTags(Twinkle.changeTags);
		protectedPage.setWatchlist(Twinkle.getPref('watchPPTaggedPages'));
		protectedPage.setPageText(text);
		protectedPage.setCreateOption('nocreate');
		protectedPage.suppressProtectWarning(); // no need to let admins know they are editing through protection
		protectedPage.save();
	},

	fileRequest: function(rppPage) {

		var rppPage2 = new Morebits.wiki.page('উইকিপিডিয়া:পাতা সুরক্ষার আবেদন', 'পাতা লোড হচ্ছে');
		rppPage2.load(function() {
			var params = rppPage.getCallbackParameters();
			var text = rppPage.getPageText();
			var statusElement = rppPage.getStatusElement();
			var text2 = rppPage2.getPageText();

			var rppRe = new RegExp('===\\s*(\\[\\[)?\\s*:?\\s*' + Morebits.string.escapeRegExp(Morebits.pageNameNorm) + '\\s*(\\]\\])?\\s*===', 'm');
			var tag = rppRe.exec(text) || rppRe.exec(text2);

			var rppLink = document.createElement('a');
			rppLink.setAttribute('href', mw.util.getUrl('উইকিপিডিয়া:পাতা সুরক্ষার আবেদন'));
			rppLink.appendChild(document.createTextNode('উইকিপিডিয়া:পাতা সুরক্ষার আবেদন'));

			if (tag) {
				statusElement.error([ 'এখানে ইতিমধ্যে একটি সুরক্ষার অনুরোধ উপস্থিত রয়েছে', rppLink, ', এড়িয়ে যাওয়া হচ্ছে' ]);
				return;
			}

			var newtag = '=== [[:' + Morebits.pageNameNorm + ']] ===\n';
			if (new RegExp('^' + mw.util.escapeRegExp(newtag).replace(/\s+/g, '\\s*'), 'm').test(text) || new RegExp('^' + mw.util.escapeRegExp(newtag).replace(/\s+/g, '\\s*'), 'm').test(text2)) {
				statusElement.error([ 'এখানে ইতিমধ্যে একটি সুরক্ষার অনুরোধ উপস্থিত রয়েছে', rppLink, ', এড়িয়ে যাওয়া হচ্ছে' ]);
				return;
			}
			newtag += '* {{pagelinks|1=' + Morebits.pageNameNorm + '}}\n\n';

			var words;
			switch (params.expiry) {
				case 'temporary':
					words = 'সাময়িক ';
					break;
				case 'infinity':
					words = 'অসীম ';
					break;
				default:
					words = '';
					break;
			}

			words += params.typename;

			newtag += "'''" + Morebits.string.toUpperCaseFirstChar(words) + (params.reason !== '' ? ":''' " +
				Morebits.string.formatReasonText(params.reason) : ".'''") + ' ~~~~';

			// If either protection type results in a increased status, then post it under increase
			// else we post it under decrease
			var increase = false;
			var protInfo = Twinkle.protect.protectionPresetsInfo[params.category];

			// function to compute protection weights (see comment at Twinkle.protect.protectionWeight)
			var computeWeight = function(mainLevel, stabilizeLevel) {
				var result = Twinkle.protect.protectionWeight[mainLevel || 'all'];
				if (stabilizeLevel) {
					if (result) {
						if (stabilizeLevel.level === 'autoconfirmed') {
							result += 2;
						}
					} else {
						result = Twinkle.protect.protectionWeight['flaggedrevs_' + stabilizeLevel];
					}
				}
				return result;
			};

			// compare the page's current protection weights with the protection we are requesting
			var editWeight = computeWeight(Twinkle.protect.currentProtectionLevels.edit &&
				Twinkle.protect.currentProtectionLevels.edit.level,
			Twinkle.protect.currentProtectionLevels.stabilize &&
				Twinkle.protect.currentProtectionLevels.stabilize.level);
			if (computeWeight(protInfo.edit, protInfo.stabilize) > editWeight ||
				computeWeight(protInfo.move) > computeWeight(Twinkle.protect.currentProtectionLevels.move &&
				Twinkle.protect.currentProtectionLevels.move.level) ||
				computeWeight(protInfo.create) > computeWeight(Twinkle.protect.currentProtectionLevels.create &&
				Twinkle.protect.currentProtectionLevels.create.level)) {
				increase = true;
			}

			if (increase) {
				var originalTextLength = text.length;
				text += '\n' + newtag;
				if (text.length === originalTextLength) {
					var linknode = document.createElement('a');
					linknode.setAttribute('href', mw.util.getUrl('Wikipedia:Twinkle/Fixing RPP'));
					linknode.appendChild(document.createTextNode('How to fix RPP'));
					statusElement.error([ 'Could not find relevant heading on WP:RPP. To fix this problem, please see ', linknode, '।' ]);
					return;
				}
				statusElement.status('নতুন অনুরোধ যুক্ত করা হচ্ছে...');
rppPage.setEditSummary('/* ' + Morebits.pageNameNorm + ' */ [[' + Morebits.pageNameNorm + ']] পাতাটিকে ' + params.typename + ' করার অনুরোধ করা হয়েছে।');
				rppPage.setChangeTags(Twinkle.changeTags);
				rppPage.setPageText(text);
				rppPage.setCreateOption('recreate');
				rppPage.save(function() {
					// Watch the page being requested
					var watchPref = Twinkle.getPref('watchRequestedPages');
					// action=watch has no way to rely on user preferences (T262912), so we do it manually.
					// The watchdefault pref appears to reliably return '1' (string),
					// but that's not consistent among prefs so might as well be "correct"
					var watch = watchPref !== 'no' && (watchPref !== 'default' || !!parseInt(mw.user.options.get('watchdefault'), 10));
					if (watch) {
						var watch_query = {
							action: 'watch',
							titles: mw.config.get('wgPageName'),
							token: mw.user.tokens.get('watchToken')
						};
						// Only add the expiry if page is unwatched or already temporarily watched
						if (Twinkle.protect.watched !== true && watchPref !== 'default' && watchPref !== 'yes') {
							watch_query.expiry = watchPref;
						}
						new Morebits.wiki.api('অনুরোধ কৃত পাতা নজরতালিকায় যুক্ত করা হচ্ছে', watch_query).post();
					}
				});
			} else {
				var originalTextLength2 = text2.length;
				text2 += '\n' + newtag;
				if (text2.length === originalTextLength2) {
					var linknode2 = document.createElement('a');
					linknode2.setAttribute('href', mw.util.getUrl('Wikipedia:Twinkle/Fixing RPP'));
					linknode2.appendChild(document.createTextNode('How to fix RPP'));
					statusElement.error([ 'Could not find relevant heading on WP:RPP. To fix this problem, please see ', linknode2, '।' ]);
					return;
				}
				statusElement.status('নতুন অনুরোধ যুক্ত করা হচ্ছে...');
				rppPage2.setEditSummary('/* ' + Morebits.pageNameNorm + ' */ [[' + Morebits.pageNameNorm + ']] পাতাটিকে ' + params.typename + ' করার অনুরোধ করা হয়েছে।');
				rppPage2.setChangeTags(Twinkle.changeTags);
				rppPage2.setPageText(text2);
				rppPage2.setCreateOption('recreate');
				rppPage2.save(function() {
					// Watch the page being requested
					var watchPref = Twinkle.getPref('watchRequestedPages');
					// action=watch has no way to rely on user preferences (T262912), so we do it manually.
					// The watchdefault pref appears to reliably return '1' (string),
					// but that's not consistent among prefs so might as well be "correct"
					var watch = watchPref !== 'no' && (watchPref !== 'default' || !!parseInt(mw.user.options.get('watchdefault'), 10));
					if (watch) {
						var watch_query = {
							action: 'watch',
							titles: mw.config.get('wgPageName'),
							token: mw.user.tokens.get('watchToken')
						};
						// Only add the expiry if page is unwatched or already temporarily watched
						if (Twinkle.protect.watched !== true && watchPref !== 'default' && watchPref !== 'yes') {
							watch_query.expiry = watchPref;
						}
						new Morebits.wiki.api('অনুরোধ কৃত পাতা নজরতালিকায় যুক্ত করা হচ্ছে', watch_query).post();
					}
				});
			}
		});
	}
};

Twinkle.addInitCallback(Twinkle.protect, 'protect');
})(jQuery);


// </nowiki>
