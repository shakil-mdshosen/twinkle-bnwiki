// <nowiki>


(function($) {


/*
 ****************************************
 *** twinklespeedy.js: CSD module
 ****************************************
 * Mode of invocation:     Tab ("দ্রুত অপসারণ প্রস্তাবনা")
 * Active on:              Non-special, existing pages
 *
 * NOTE FOR DEVELOPERS:
 *   If adding a new criterion, add it to the appropriate places at the top of
 *   twinkleconfig.js.  Also check out the default values of the CSD preferences
 *   in twinkle.js, and add your new criterion to those if you think it would be
 *   good.
 */

Twinkle.speedy = function twinklespeedy() {
	// Disable on:
	// * special pages
	// * non-existent pages
	if (mw.config.get('wgNamespaceNumber') < 0 || !mw.config.get('wgArticleId')) {
		return;
	}

	Twinkle.addPortletLink(Twinkle.speedy.callback, 'দ্রুত অপসারণ প্রস্তাবনা', 'tw-csd', Morebits.userIsSysop ? 'পাতা অপসারণ according to WP:CSD' : 'WP:CSD অনুযায়ী দ্রুত অপসারণের জন্য অনুরোধ');
};

// This function is run when the CSD tab/header link is clicked
Twinkle.speedy.callback = function twinklespeedyCallback() {
	Twinkle.speedy.initDialog(Morebits.userIsSysop ? Twinkle.speedy.callback.evaluateSysop : Twinkle.speedy.callback.evaluateUser, true);
};

// Used by unlink feature
Twinkle.speedy.dialog = null;
// Used throughout
Twinkle.speedy.hasCSD = !!$('#delete-reason').length;

// Prepares the speedy deletion dialog and displays it
Twinkle.speedy.initDialog = function twinklespeedyInitDialog(callbackfunc) {
	var dialog;
	Twinkle.speedy.dialog = new Morebits.simpleWindow(Twinkle.getPref('speedyWindowWidth'), Twinkle.getPref('speedyWindowHeight'));
	dialog = Twinkle.speedy.dialog;
	dialog.setTitle('দ্রুত অপসারণের বিচারধারা নির্বাচন করুন');
	dialog.setScriptName('টুইংকল');
	dialog.addFooterLink('দ্রুত অপসারণ নীতিমালা', 'WP:CSD');
	dialog.addFooterLink('পছন্দ', 'WP:TW/PREF#দ্রুত');
	dialog.addFooterLink('টুইংকল সাহায্য', 'WP:TW/DOC#দ্রুত');
	dialog.addFooterLink('প্রতিক্রিয়া জানান', 'WT:TW');

	var form = new Morebits.quickForm(callbackfunc, Twinkle.getPref('speedySelectionStyle') === 'radioClick' ? 'change' : null);
	if (Morebits.userIsSysop) {
		form.append({
			type: 'checkbox',
			list: [
				{
					label: 'শুধুমাত্র ট্যাগ করা হবে, অপসারিত হবে না',
					value: 'tag_only',
					name: 'tag_only',
					tooltip: 'If you just want to tag the page, instead of deleting it now',
					checked: !(Twinkle.speedy.hasCSD || Twinkle.getPref('deleteSysopDefaultToDelete')),
					event: function(event) {
						var cForm = event.target.form;
						var cChecked = event.target.checked;
						// enable talk page checkbox
						if (cForm.talkpage) {
							cForm.talkpage.checked = !cChecked && Twinkle.getPref('deleteTalkPageOnDelete');
						}
						// enable redirects checkbox
						cForm.redirects.checked = !cChecked;
						// enable delete multiple
						cForm.delmultiple.checked = false;
						// enable notify checkbox
						cForm.notify.checked = cChecked;
						// enable deletion notification checkbox
						cForm.warnusertalk.checked = !cChecked && !Twinkle.speedy.hasCSD;
						// enable multiple
						cForm.multiple.checked = false;
						// enable requesting creation protection
						cForm.salting.checked = false;

						Twinkle.speedy.callback.modeChanged(cForm);

						event.stopPropagation();
					}
				}
			]
		});

		var deleteOptions = form.append({
			type: 'div',
			name: 'delete_options'
		});
		deleteOptions.append({
			type: 'header',
			label: 'অপসারণ-সম্পর্কিত বিকল্প'
		});
		if (mw.config.get('wgNamespaceNumber') % 2 === 0 && (mw.config.get('wgNamespaceNumber') !== 2 || (/\//).test(mw.config.get('wgTitle')))) {  // hide option for user pages, to avoid accidentally deleting user talk page
			deleteOptions.append({
				type: 'checkbox',
				list: [
					{
						label: 'আলাপ পাতাও অপসারণ করুন',
						value: 'talkpage',
						name: 'talkpage',
						tooltip: "This option deletes the page's talk page in addition. If you choose the F8 (moved to Commons) criterion, this option is ignored and the talk page is *not* deleted.",
						checked: Twinkle.getPref('deleteTalkPageOnDelete'),
						event: function(event) {
							event.stopPropagation();
						}
					}
				]
			});
		}
		deleteOptions.append({
			type: 'checkbox',
			list: [
				{
					label: 'সকল পুনর্নির্দেশও অপসারণ করুন',
					value: 'redirects',
					name: 'redirects',
					tooltip: 'This option deletes all incoming redirects in addition. Avoid this option for procedural (e.g. move/merge) deletions.',
					checked: Twinkle.getPref('deleteRedirectsOnDelete'),
					event: function (event) {
						event.stopPropagation();
					}
				},
				{
					label: 'একাধিক বিচারধারায় অপসারণ করুন',
					value: 'delmultiple',
					name: 'delmultiple',
					tooltip: 'এটা নির্বাচন করলে আপনি পাতায় যোগ করার জন্য একাধিক বিচারধারা বাছাই করতে পারবেন।',
					event: function(event) {
						Twinkle.speedy.callback.modeChanged(event.target.form);
						event.stopPropagation();
					}
				},
				{
					label: 'পাতা তৈরিকারীকে অপসারণের বিজ্ঞপ্তি পাঠান',
					value: 'warnusertalk',
					name: 'warnusertalk',
					tooltip: 'যদি আপনার টুইংকল পছন্দে বিজ্ঞপ্তি পাঠানো সক্রিয় করা থাকে তবে প্রণেতার আলাপ পাতায় একটি বিজ্ঞপ্তি পাঠানো হবে। ' +
						'আপনি যে মানদণ্ডটি চয়ন করেন তার জন্য এবং এই বাক্সটি মার্ক করা হয়েছে। প্রণেতাকে স্বাগত জানানোও যেতে পারে।',
					checked: !Twinkle.speedy.hasCSD,
					event: function(event) {
						event.stopPropagation();
					}
				}
			]
		});
	}

	var tagOptions = form.append({
		type: 'div',
		name: 'tag_options'
	});

	if (Morebits.userIsSysop) {
		tagOptions.append({
			type: 'header',
			label: 'ট্যাগ-সম্পর্কিত বিকল্প'
		});
	}

	tagOptions.append({
		type: 'checkbox',
		list: [
			{
				label: 'যদি সম্ভব হয় তবে পাতা তৈরিকারীকে বিজ্ঞপ্তি পাঠান',
				value: 'notify',
				name: 'notify',
				tooltip: 'যদি আপনার টুইংকল পছন্দে বিজ্ঞপ্তি পাঠানো সক্রিয় করা থাকে তবে প্রণেতার আলাপ পাতায় একটি বিজ্ঞপ্তি পাঠানো হবে। ' +
						'আপনি যে মানদণ্ডটি চয়ন করেন তার জন্য এবং এই বাক্সটি মার্ক করা হয়েছে। প্রণেতাকে স্বাগত জানানোও যেতে পারে।',
				checked: !Morebits.userIsSysop || !(Twinkle.speedy.hasCSD || Twinkle.getPref('deleteSysopDefaultToDelete')),
				event: function(event) {
					event.stopPropagation();
				}
			},
			{
				label: 'একইসাথে পাতা তৈরি সুরক্ষার জন্যও ট্যাগ করুন',
				value: 'salting',
				name: 'salting',
				tooltip: 'এটা নির্বাচন করলে অপসারণ ট্যাগের সাথে পাতা তৈরি থেকে সুরক্ষিত করার অনুরোধের জন্য {{salt}} ট্যাগও যুক্ত হবে',
				event: function(event) {
					event.stopPropagation();
				}
			},
			{
				label: 'একাধিক বিচারধারায় ট্যাগ করুন',
				value: 'multiple',
				name: 'multiple',
				tooltip: 'এটা নির্বাচন করলে আপনি পাতায় যোগ করার জন্য একাধিক বিচারধারা বাছাই করতে পারবেন।',
				event: function(event) {
					Twinkle.speedy.callback.modeChanged(event.target.form);
					event.stopPropagation();
				}
			}
		]
	});

	form.append({
		type: 'div',
		id: 'prior-deletion-count',
		style: 'font-style: italic'
	});

	form.append({
		type: 'div',
		name: 'work_area',
		label: 'Failed to initialize the CSD module. Please try again, or tell the Twinkle developers about the issue.'
	});

	if (Twinkle.getPref('speedySelectionStyle') !== 'radioClick') {
		form.append({ type: 'submit', className: 'tw-speedy-submit' }); // Renamed in modeChanged
	}

	var result = form.render();
	dialog.setContent(result);
	dialog.display();

	Twinkle.speedy.callback.modeChanged(result);

	// Check for prior deletions.  Just once, upon init
	Twinkle.speedy.callback.priorDeletionCount();
};

Twinkle.speedy.callback.modeChanged = function twinklespeedyCallbackModeChanged(form) {
	var namespace = mw.config.get('wgNamespaceNumber');

	// first figure out what mode we're in
	var mode = {
		isSysop: !!form.tag_only && !form.tag_only.checked,
		isMultiple: form.tag_only && !form.tag_only.checked ? form.delmultiple.checked : form.multiple.checked,
		isRadioClick: Twinkle.getPref('speedySelectionStyle') === 'radioClick'
	};

	if (mode.isSysop) {
		$('[name=delete_options]').show();
		$('[name=tag_options]').hide();
		$('button.tw-speedy-submit').text('পাতা অপসারণ');
	} else {
		$('[name=delete_options]').hide();
		$('[name=tag_options]').show();
		$('button.tw-speedy-submit').text('জমা দিন');
	}

	var work_area = new Morebits.quickForm.element({
		type: 'div',
		name: 'work_area'
	});

	if (mode.isMultiple && mode.isRadioClick) {
		var evaluateType = mode.isSysop ? 'evaluateSysop' : 'evaluateUser';

		work_area.append({
			type: 'div',
			label: 'When finished choosing criteria, click:'
		});
		work_area.append({
			type: 'button',
			name: 'submit-multiple',
			label: mode.isSysop ? 'পাতা অপসারণ' : 'Tag page',
			event: function(event) {
				Twinkle.speedy.callback[evaluateType](event);
				event.stopPropagation();
			}
		});
	}

	var appendList = function(headerLabel, csdList) {
		work_area.append({ type: 'header', label: headerLabel });
		work_area.append({ type: mode.isMultiple ? 'checkbox' : 'radio', name: 'csd', list: Twinkle.speedy.generateCsdList(csdList, mode) });
	};

	if (mode.isSysop && !mode.isMultiple) {
		appendList('নিজস্ব যৌক্তিকতা', Twinkle.speedy.customRationale);
	}

	if (namespace % 2 === 1 && namespace !== 3) {
		// show db-talk on talk pages, but not user talk pages
		appendList('আলাপ পাতা', Twinkle.speedy.talkList);
	}

	if (!Morebits.isPageRedirect()) {
		switch (namespace) {
			case 0:  // article
			case 1:  // talk
				appendList('নিবন্ধ', Twinkle.speedy.articleList);
				break;

			case 2:  // user
			case 3:  // user talk
				appendList('ব্যবহারকারী পাতা', Twinkle.speedy.userList);
				break;

			case 6:  // file
			case 7:  // file talk
				appendList('ফাইল', Twinkle.speedy.fileList);
				if (!mode.isSysop) {
					work_area.append({ type: 'div', label: 'দ্রুত ফ৪ (কোনও লাইসেন্স নেই), ফ৫ (অনাথ ন্যায্য ব্যবহার), ফ৬ (কোনও ন্যায্য ব্যবহারের যৌক্তিকতা নেই) এবং ফ১১ (কোনও অনুমতি নেই) ট্যাগ করার জন্য টুইংকলের "চিত্র অপসারণ প্রস্তাবনা" ট্যাব ব্যবহার করুন।' });
				}
				break;

			case 14:  // category
			case 15:  // category talk
				appendList('বিষয়শ্রেণী', Twinkle.speedy.categoryList);
				break;

			case 100:  // portal
			case 101:  // portal talk
				appendList('প্রবেশদ্বার', Twinkle.speedy.portalList);
				break;

			default:
				break;
		}
	} else {
		if (namespace === 2 || namespace === 3) {
			appendList('ব্যবহারকারী পাতা', Twinkle.speedy.userList);
		}
		appendList('পুনর্নির্দেশ', Twinkle.speedy.redirectList);
	}

	var generalCriteria = Twinkle.speedy.generalList;

	// custom rationale lives under general criteria when tagging
	if (!mode.isSysop) {
		generalCriteria = Twinkle.speedy.customRationale.concat(generalCriteria);
	}
	appendList('সাধারণ বিচারধারা', generalCriteria);

	var old_area = Morebits.quickForm.getElements(form, 'work_area')[0];
	form.replaceChild(work_area.render(), old_area);

	// if sysop, check if CSD is already on the page and fill in custom rationale
	if (mode.isSysop && Twinkle.speedy.hasCSD) {
		var customOption = $('input[name=csd][value=reason]')[0];
		if (customOption) {
			if (Twinkle.getPref('speedySelectionStyle') !== 'radioClick') {
				// force listeners to re-init
				customOption.click();
				customOption.parentNode.appendChild(customOption.subgroup);
			}
			customOption.subgroup.querySelector('input').value = decodeURIComponent($('#delete-reason').text()).replace(/\+/g, ' ');
		}
	}
};

Twinkle.speedy.callback.priorDeletionCount = function () {
	var query = {
		action: 'query',
		format: 'json',
		list: 'logevents',
		letype: 'delete',
		leaction: 'delete/delete', // Just pure page deletion, no redirect overwrites or revdel
		letitle: mw.config.get('wgPageName'),
		leprop: '', // We're just counting we don't actually care about the entries
		lelimit: 5  // A little bit goes a long way
	};

	new Morebits.wiki.api('Checking for past deletions', query, function(apiobj) {
		var response = apiobj.getResponse();
		var delCount = response.query.logevents.length;
		if (delCount) {
			var message = delCount + ' বার অপসারণ করা হয়েছে';
			if (delCount > 1) {
				message += '।'; // বাংলায় s এর অনুবাদ প্রয়োজন নেই, দাঁড়ি চিহ্ন ব্যবহার করা হলো
				if (response.continue) {
					message = 'More than ' + message;
				}

				// 3+ seems problematic
				if (delCount >= 3) {
					$('#prior-deletion-count').css('color', 'red');
				}
			}

			// Provide a link to page logs (CSD templates have one for sysops)
			var link = Morebits.htmlNode('a', '(লগ)');
			link.setAttribute('href', mw.util.getUrl('Special:Log', {page: mw.config.get('wgPageName')}));
			link.setAttribute('target', '_blank');

			$('#prior-deletion-count').text(message + ' '); // Space before log link
			$('#prior-deletion-count').append(link);
		}
	}).post();
};


Twinkle.speedy.generateCsdList = function twinklespeedyGenerateCsdList(list, mode) {

	var pageNamespace = mw.config.get('wgNamespaceNumber');

	var openSubgroupHandler = function(e) {
		$(e.target.form).find('input').prop('disabled', true);
		$(e.target.form).children().css('color', 'gray');
		$(e.target).parent().css('color', 'black').find('input').prop('disabled', false);
		$(e.target).parent().find('input:text')[0].focus();
		e.stopPropagation();
	};
	var submitSubgroupHandler = function(e) {
		var evaluateType = mode.isSysop ? 'evaluateSysop' : 'evaluateUser';
		Twinkle.speedy.callback[evaluateType](e);
		e.stopPropagation();
	};

	return $.map(list, function(critElement) {
		var criterion = $.extend({}, critElement);

		if (mode.isMultiple) {
			if (criterion.hideWhenMultiple) {
				return null;
			}
			if (criterion.hideSubgroupWhenMultiple) {
				criterion.subgroup = null;
			}
		} else {
			if (criterion.hideWhenSingle) {
				return null;
			}
			if (criterion.hideSubgroupWhenSingle) {
				criterion.subgroup = null;
			}
		}

		if (mode.isSysop) {
			if (criterion.hideWhenSysop) {
				return null;
			}
			if (criterion.hideSubgroupWhenSysop) {
				criterion.subgroup = null;
			}
		} else {
			if (criterion.hideWhenUser) {
				return null;
			}
			if (criterion.hideSubgroupWhenUser) {
				criterion.subgroup = null;
			}
		}

		if (Morebits.isPageRedirect() && criterion.hideWhenRedirect) {
			return null;
		}

		if (criterion.showInNamespaces && criterion.showInNamespaces.indexOf(pageNamespace) < 0) {
			return null;
		}
		if (criterion.hideInNamespaces && criterion.hideInNamespaces.indexOf(pageNamespace) > -1) {
			return null;
		}

		if (criterion.subgroup && !mode.isMultiple && mode.isRadioClick) {
			if (Array.isArray(criterion.subgroup)) {
				criterion.subgroup = criterion.subgroup.concat({
					type: 'button',
					name: 'submit',
					label: mode.isSysop ? 'পাতা অপসারণ' : 'Tag page',
					event: submitSubgroupHandler
				});
			} else {
				criterion.subgroup = [
					criterion.subgroup,
					{
						type: 'button',
						name: 'submit',  // ends up being called "csd.submit" so this is OK
						label: mode.isSysop ? 'পাতা অপসারণ' : 'Tag page',
						event: submitSubgroupHandler
					}
				];
			}
			// FIXME: does this do anything?
			criterion.event = openSubgroupHandler;
		}

		return criterion;
	});
};

Twinkle.speedy.customRationale = [
	{
		label: 'নিজস্ব যৌক্তিকতা' + (Morebits.userIsSysop ? ' (পছন্দসই মুছে ফেলার কারণ)' : ' {{db}} টেমপ্লেট ব্যবহার করে'),
		value: 'reason',
		tooltip: '{{db}} is short for "delete because". At least one of the other deletion criteria must still apply to the page, and you must make mention of this in your rationale. This is not a "catch-all" for when you can\'t find any criteria that fit.',
		subgroup: {
			name: 'reason_1',
			type: 'input',
			label: 'কারণ:',
			size: 60
		},
		hideWhenMultiple: true
	}
];

Twinkle.speedy.talkList = [
	{
		label: 'স৮: ইতিমধ্যেই অপসারিত বা অস্তিত্বহীন পাতার ওপর নির্ভরশীল পাতা বা আলাপ পাতা',
		value: 'talk',
		tooltip: 'পরবর্তীতে প্রয়োজন হতে পারে এমন পাতাগুলো এটির আওতাভুক্ত নয়, যেমন ব্যবহারকারী আলাপ পাতা, আলাপ পাতার আর্কাইভ, কমন্সে রয়েছে এমন ফাইলের আলাপ পাতা ইত্যাদি।'
	}
];

Twinkle.speedy.fileList = [
	{
		label: 'ফ১: অনাবশ্যক ফাইল',
		value: 'redundantimage',
		tooltip: 'এমন কোনো ফাইল যার একাধিক কপি রয়েছে, হয়তে এটি একই ফরম্যটের ফাইল, অথবা অন্য ফাইলের কম রেজ্যুলেশনের কপি, অথবা অন্যান্য। কিন্তু এটি যদি কমন্সে রয়েছে এমন কোনো ফাইলের প্রতিলিপি হয় তাহলে ট্যাগ সংযোজনের পূর্বে লাইসেন্সটি যাচাই করুন, প্রয়োজনে  {{subst:ncd|Image:newname.ext}} অথবা {{subst:ncd}} ট্যাগ সংযোজন করুন।',
		subgroup: {
			name: 'redundantimage_filename',
			type: 'input',
			label: 'এই ফাইলের অনুলিপি:',
			tooltip: 'The "File:" prefix can be left off.'
		}
	},
	{
		label: 'ফ২: বিকৃত বা  চিত্রহীন ফাইল',
		value: 'noimage',
		tooltip: 'অপসারণের পূর্বে নিশ্চিত হয়ে নিন যে মিডিয়াউইকি ইঞ্জিন এই ফাইলটি খুলতে পারছে না। কমন্সে রয়েছে এমন ফাইলের বর্ণনা পাতাও এখানে অন্তর্ভুক্ত করা যেতে পারে'
	},
	{
		label: 'ফ২: কমন্সে থাকা ফাইলের অপ্রয়োজনীয় বর্ননামূলক ফাইল',
		value: 'fpcfail',
		tooltip: 'কমন্সে থাকা ফাইলের অপ্রয়োজনীয় বর্ননামূলক ফাইল।',
		hideWhenMultiple: true
	},
	{
		label: 'ফ৩: লাইসেন্সের তথ্য সঠিক নয়',
		value: 'noncom',
		tooltip: 'Files licensed as "for non-commercial use only", "non-derivative use" or "used with permission" that were uploaded on or after 2005-05-19, except where they have been shown to comply with the limited standards for the use of non-free content. This includes files licensed under a "Non-commercial Creative Commons License". Such files uploaded before 2005-05-19 may also be speedily deleted if they are not used in any articles'
	},
	{
		label: 'ফ৪: লাইসেন্সের তথ্য নেই',
		value: 'unksource',
		tooltip: 'Files in category "Files with unknown source", "Files with unknown copyright status", or "Files with no copyright tag" that have been tagged with a template that places them in the category for more than seven days, regardless of when uploaded. Note, users sometimes specify their source in the upload summary, so be sure to check the circumstances of the file.',
		hideWhenUser: true
	},
	{
		label: 'ফ৫: অব্যবহৃত অ-মুক্ত কপিরাইটকৃত ফাইল',
		value: 'f5',
		tooltip: 'Files that are not under a free license or in the public domain that are not used in any article, whose only use is in a deleted article, and that are very unlikely to be used on any other article. Reasonable exceptions may be made for files uploaded for an upcoming article. For other unused non-free files, use the "Orphaned fair use" option in Twinkle\'s DI tab.',
		hideWhenUser: true
	},
	{
		label: 'ফ৬: সৌজন্যমূলক ব্যবহারের যৌক্তিকতা নেই',
		value: 'norat',
		tooltip: 'Any file without a fair use rationale may be deleted seven days after it is uploaded.  Boilerplate fair use templates do not constitute a fair use rationale.  Files uploaded before 2006-05-04 should not be deleted immediately; instead, the uploader should be notified that a fair-use rationale is needed.  Files uploaded after 2006-05-04 can be tagged using the "No fair use rationale" option in Twinkle\'s DI module. Such files can be found in the dated subcategories of Category:Files with no fair use rationale.',
		hideWhenUser: true
	},
	{
		label: 'ফ৭: সৌজন্যমূলক ব্যবহার যার বানিজ্যিক ব্যবহার নেই',
		value: 'badfairuse',
		tooltip: 'Non-free images or media from a commercial source (e.g., Associated Press, Getty), where the file itself is not the subject of sourced commentary, are considered an invalid claim of fair use and fail the strict requirements of WP:NFCC. For cases that require a waiting period (invalid or otherwise disputed rationales or replaceable images), use the options on Twinkle\'s DI tab.',
		subgroup: {
			name: 'badfairuse_rationale',
			type: 'input',
			label: 'ঐচ্ছিক ব্যাখা:',
			size: 60
		},
		hideWhenMultiple: true
	},
	{
		label: 'ফ৮: একইরকম বা এই ফাইলের এর চেয়ে ভালো বা অধিক স্পষ্ট  ছবি উইকিমিডিয়া কমন্সে আছে',
		value: 'commons',
		tooltip: 'Provided the following conditions are met: 1: The file format of both images is the same. 2: The file\'s license and source status is beyond reasonable doubt, and the license is undoubtedly accepted at Commons. 3: All information on the file description page is present on the Commons file description page. That includes the complete upload history with links to the uploader\'s local user pages. 4: The file is not protected, and the file description page does not contain a request not to move it to Commons. 5: If the file is available on Commons under a different name than locally, all local references to the file must be updated to point to the title used at Commons. 6: For {{c-uploaded}} files: They may be speedily deleted as soon as they are off the Main Page',
		subgroup: {
			name: 'commons_filename',
			type: 'input',
			label: 'কমন্সের ফাইলের নাম:',
			value: Morebits.pageNameNorm,
			tooltip: 'This can be left blank if the file has the same name on Commons as here. The "File:" prefix is optional.'
		},
		hideWhenMultiple: true
	},
	{
		label: 'ফ৯: দ্ব্যর্থহীন [[উইকিপিডিয়া:কপিরাইট|কপিরাইট লঙ্ঘন]]',
		value: 'imgcopyvio',
		tooltip: 'The file was copied from a website or other source that does not have a license compatible with Wikipedia, and the uploader neither claims fair use nor makes a credible assertion of permission of free use. Sources that do not have a license compatible with Wikipedia include stock photo libraries such as Getty Images or Corbis. Non-blatant copyright infringements should be discussed at Wikipedia:Files for deletion',
		subgroup: [
			{
				name: 'imgcopyvio_url',
				type: 'input',
				label: 'URL of the copyvio, including the "http://".  If the copyvio is of a non-internet source and you cannot provide a URL, you must use the deletion rationale box.',
				size: 60
			},
			{
				name: 'imgcopyvio_rationale',
				type: 'input',
				label: 'Deletion rationale for non-internet copyvios:',
				size: 60
			}
		]
	},
	{
		label: 'ফ১০: অপ্রয়োজনীয় মিডিয়া ফাইল',
		value: 'badfiletype',
		tooltip: 'Files uploaded that are neither image, sound, nor video files (e.g. .doc, .pdf, or .xls files) which are not used in any article and have no foreseeable encyclopedic use'
	},
	{
		label: 'ফ১১: অনুমতির কোনো প্রমাণ নেই',
		value: 'nopermission',
		tooltip: 'If an uploader has specified a license and has named a third party as the source/copyright holder without providing evidence that this third party has in fact agreed, the item may be deleted seven days after notification of the uploader',
		hideWhenUser: true
	},
	{
		label: 'স৮: ইতিমধ্যেই অপসারিত বা অস্তিত্বহীন পাতার ওপর নির্ভরশীল ফাইলের বর্ণনা পাতা',
		value: 'imagepage',
		tooltip: 'This is only for use when the file doesn\'t exist at all. Corrupt files, and local description pages for files on Commons, should use F2; implausible redirects should use R3; and broken Commons redirects should use R4.'
	}
];

Twinkle.speedy.articleList = [
	{
		label: 'নি১: নিবন্ধের বিষয়বস্তু যাচাই করার মতো যথেষ্ট পরিমাণ লেখা নেই।',
		value: 'nocontext',
		tooltip: 'Example: "He is a funny man with a red car. He makes people laugh." This applies only to very short articles. Context is different from content, treated in A3, below.'
	},
	{
		label: 'নি২: বিদেশি ভাষার নিবন্ধ যা অন্য একটি উইকিমিডিয়া প্রকল্পে রয়েছে',
		value: 'foreign',
		tooltip: 'নিবন্ধটি বাংলা ভাষায় লিখিত নয়',
		subgroup: {
			name: 'foreign_source',
			type: 'input',
			label: 'Interwiki link to the article on the foreign-language wiki:',
			tooltip: 'For example, fr:Bonjour'
		}
	},
	{
		label: 'নি৩: খালি নিবন্ধ বা কোনো তথ্য নেই',
		value: 'nocontent',
		tooltip: 'Any article consisting only of links elsewhere (including hyperlinks, category tags and "see also" sections), a rephrasing of the title, and/or attempts to correspond with the person or group named by its title. This does not include disambiguation pages'
	},
	{
		label: 'নি৫: নিবন্ধ যা অন্য কোনো প্রকল্পের জন্য প্রযোজ্য বা স্থানান্তরিত',
		value: 'transwiki',
		tooltip: 'Any article that has been discussed at Articles for Deletion (et al), where the outcome was to transwiki, and where the transwikification has been properly performed and the author information recorded. Alternately, any article that consists of only a dictionary definition, where the transwikification has been properly performed and the author information recorded',
		subgroup: {
			name: 'transwiki_location',
			type: 'input',
			label: 'Link to where the page has been transwikied:',
			tooltip: 'For example, https://en.wiktionary.org/wiki/twinkle or [[wikt:twinkle]]'
		}
	},
	{
		label: 'নি৭: বিষয়বস্তুর গুরুত্ব বা উল্লেখযোগ্যতা সম্মন্ধে কোনো ব্যাখ্যা নেই (জীবিত ব্যক্তি, প্রতিষ্ঠান বা ওয়েব কন্টেন্টের ওপর নিবন্ধ)',
		value: 'a7',
		tooltip: 'An article about a real person, group of people, band, club, company, web content, individual animal, tour, or party that does not assert the importance or significance of its subject. If controversial, or if a previous AfD has resulted in the article being kept, the article should be nominated for AfD instead',
		hideWhenSingle: true
	},
	{
		label: 'নি৭: উল্লেখযোগ্য ব্যক্তি নয়',
		value: 'person',
		tooltip: 'An article about a real person that does not assert the importance or significance of its subject. If controversial, or if there has been a previous AfD that resulted in the article being kept, the article should be nominated for AfD instead',
		hideWhenMultiple: true
	},
	{
		label: 'নি৭: উল্লেখযোগ্য সঙ্গিত নয় বা  সঙ্গিতজ্ঞ নন',
		value: 'band',
		tooltip: 'Article about a band, singer, musician, or musical ensemble that does not assert the importance or significance of the subject',
		hideWhenMultiple: true
	},
	{
		label: 'নি৭: উল্লেখযোগ্য ক্লাব নয়',
		value: 'club',
		tooltip: 'Article about a club, society or group that does not assert the importance or significance of the subject',
		hideWhenMultiple: true
	},
	{
		label: 'নি৭: উল্লেখযোগ্য কোম্পানি বা সংস্থা নয়',
		value: 'corp',
		tooltip: 'Article about a company or organization that does not assert the importance or significance of the subject',
		hideWhenMultiple: true
	},
	{
		label: 'নি৭: উল্লেখযোগ্য ওয়েব সাইট নয়',
		value: 'web',
		tooltip: 'Article about a web site, blog, online forum, webcomic, podcast, or similar web content that does not assert the importance or significance of its subject',
		hideWhenMultiple: true
	},
	{
		label: 'নি৭: উল্লেখযোগ্য প্রাণী নয়',
		value: 'animal',
		tooltip: 'Article about an individual animal (e.g. pet) that does not assert the importance or significance of its subject',
		hideWhenMultiple: true
	},
	{
		label: 'নি৭: বিষয়বস্তুর গুরুত্ব বা উল্লেখযোগ্যতা সম্মন্ধে কোনো ব্যাখ্যা নেই (সংগঠিত ঘটনা)',
		value: 'event',
		tooltip: 'Article about an organized event (tour, function, meeting, party, etc.) that does not assert the importance or significance of its subject',
		hideWhenMultiple: true
	},
	{
		label: 'নি৯: উল্লেখযোগ্য  গান বা অ্যালবাম নয়',
		value: 'a9',
		tooltip: 'An article about a musical recording which does not indicate why its subject is important or significant, and where the artist\'s article has never existed or has been deleted'
	},
	{
		label: 'নি১০: সাম্প্রতিকালে প্রণীত নিবন্ধ যা বর্তমানে রয়েছে এমন বিষয়বস্তুর প্রতিলিপি',
		value: 'a10',
		tooltip: 'A recently created article with no relevant page history that does not aim to expand upon, detail or improve information within any existing article(s) on the subject, and where the title is not a plausible redirect. This does not include content forks, split pages or any article that aims at expanding or detailing an existing one.',
		subgroup: {
			name: 'a10_article',
			type: 'input',
			label: 'Article that is duplicated:'
		}
	},
	{
		label: 'নি১১: স্পষ্টতই প্রণেতার দ্বারা তৈরি, এবং তাৎপর্যপূর্ণ প্রচারের কোনও প্রমাণ নেই',
		value: 'madeup',
		tooltip: 'An article which plainly indicates that the subject was invented/coined/discovered by the article\'s creator or someone they know personally, and does not credibly indicate why its subject is important or significant'
	}
];

Twinkle.speedy.categoryList = [
	{
		label: 'বি১: খালি বিষয়শ্রেণী',
		value: 'catempty',
		tooltip: 'Categories that have been unpopulated for at least seven days. This does not apply to categories being discussed at WP:CFD, disambiguation categories, and certain other exceptions. If the category isn\'t relatively new, it possibly contained articles earlier, and deeper investigation is needed'
	},
	{
		label: 'স৮: অপসারিত বা নামান্তরিত টেমপ্লেট দ্বারা পপুলেটেড বিষয়শ্রেণী',
		value: 'templatecat',
		tooltip: 'This is for situations where a category is effectively empty, because the template(s) that formerly placed pages in that category are now deleted. This excludes categories that are still in use.',
		subgroup: {
			name: 'templatecat_rationale',
			type: 'input',
			label: 'ঐচ্ছিক ব্যাখা:',
			size: 60
		}
	},
	{
		label: 'স৮: অস্তিত্ব নেই এমন লক্ষ্যে পুনর্নির্দেশিত',
		value: 'redirnone',
		tooltip: 'This excludes any page that is useful to the project, and in particular: deletion discussions that are not logged elsewhere, user and user talk pages, talk page archives, plausible redirects that can be changed to valid targets, and file pages or talk pages for files that exist on Wikimedia Commons.',
		hideWhenMultiple: true
	}
];

Twinkle.speedy.userList = [
	{
		label: 'ব্য১: ব্যবহারকারীর অনুরোধে',
		value: 'userreq',
		tooltip: 'Personal subpages, upon request by their user. In some rare cases there may be administrative need to retain the page. Also, sometimes, main user pages may be deleted as well. See Wikipedia:User page for full instructions and guidelines',
		subgroup: mw.config.get('wgNamespaceNumber') === 3 && mw.config.get('wgTitle').indexOf('/') === -1 ? {
			name: 'userreq_rationale',
			type: 'input',
			label: 'কেন আলাপ পাতাটি অপসারিত হবে তার যৌক্তিক কারণ লিখুন (এটি বাধ্যতামূলক):',
			tooltip: 'User talk pages are deleted only in highly exceptional circumstances. See WP:DELTALK.',
			size: 60
		} : null,
		hideSubgroupWhenMultiple: true
	},
	{
		label: 'ব্য২: অস্তিত্বহীন ব্যবহারকারী',
		value: 'nouser',
		tooltip: 'User pages of users that do not exist (Check Special:Listusers)'
	},
	{
		label: 'ব্য৩: অ-মুক্ত চিত্রশালা',
		value: 'gallery',
		tooltip: 'Galleries in the userspace which consist mostly of "fair use" or non-free files. Wikipedia\'s non-free content policy forbids users from displaying non-free files, even ones they have uploaded themselves, in userspace. It is acceptable to have free files, GFDL-files, Creative Commons and similar licenses along with public domain material, but not "fair use" files',
		hideWhenRedirect: true
	},
	{
		label: 'ব্য৫: WP:NOTWEBHOST হিসেবে ব্যবহারকারী পাতার অনুপযুক্ত ব্যবহার',
		value: 'notwebhost',
		tooltip: 'এখানে উইকিপিডিয়ার লক্ষ্যগুলির সাথে ঘনিষ্ঠভাবে সম্পর্কিত নয় এমন রচনা, তথ্য, আলোচনা, ও/বা ক্রিয়াকলাপগুলি রয়েছে। ব্যবহারকারী, ব্যবহারকারী নামস্থানের বাইরে খুব কম বা কোনও সম্পাদনা করেনি।',
		hideWhenRedirect: true
	},
	{
		label: 'স১১: প্রচারমূলক ব্যবহারকারী নামের অধীনে প্রচারমূলক ব্যবহারকারী পাতা',
		value: 'spamuser',
		tooltip: 'প্রচারমূলক ব্যবহারকারীর পৃষ্ঠা, ব্যবহারকারীর নাম দেখে মনে হচ্ছে ব্যবহারকারী কোন সত্তার সাথে সম্পর্কিত ও তা প্রচার করছে।',
		hideWhenMultiple: true,
		hideWhenRedirect: true
	},
	/*{
		label: 'G13: AfC draft submission or a blank draft, stale by over 6 months',
		value: 'afc',
		tooltip: 'Any rejected or unsubmitted AfC draft submission or a blank draft, that has not been edited in over 6 months (excluding bot edits).',
		hideWhenMultiple: true,
		hideWhenRedirect: true
	}*/
];

Twinkle.speedy.portalList = [
	{
		label: 'প্র১: প্রবেশদ্বার পাতা যা নিবন্ধ হিসেবে দ্রুত অপসারণের জন্য বিবেচ্য',
		value: 'p1',
		tooltip: 'You must specify a single article criterion that applies in this case (A1, A3, A7, or A10).',
		subgroup: {
			name: 'p1_criterion',
			type: 'input',
			label: 'Article criterion that would apply:'
		}
	},
	{
		label: 'প্র২: পর্যাপ্ত নিবন্ধ বা বিষয়বস্তু নেই এমন বিষয়ের ওপর প্রণীত প্রবেশদ্বার পাতা',
		value: 'emptyportal',
		tooltip: 'Any Portal based on a topic for which there is not a non-stub header article, and at least three non-stub articles detailing subject matter that would be appropriate to discuss under the title of that Portal'
	}
];

Twinkle.speedy.generalList = [
	{
		label: 'স১: অসংলগ্ন,অর্থহীন,অ-উল্লেখযোগ্য  বা অবোধগম্য পাতা',
		value: 'nonsense',
		tooltip: 'This does not include poor writing, partisan screeds, obscene remarks, vandalism, fictional material, material not in English, poorly translated material, implausible theories, or hoaxes. In short, if you can understand it, G1 does not apply.',
		hideInNamespaces: [ 2 ] // Not applicable in userspace
	},
	{
		label: 'স২: পরীক্ষামূলক পাতা',
		value: 'test',
		tooltip: 'A page created to test editing or other Wikipedia functions. Pages in the User namespace are not included, nor are valid but unused or duplicate templates.',
		hideInNamespaces: [ 2 ] // Not applicable in userspace
	},
	{
		label: 'স৩: স্পষ্টত ধ্বংসপ্রবণতা',
		value: 'vandalism',
		tooltip: 'Plain pure vandalism (including redirects left behind from pagemove vandalism)'
	},
	{
		label: 'স৩: ধোঁকাবাজি, চালাকি বা তামাসা',
		value: 'hoax',
		tooltip: 'Blatant and obvious hoax, to the point of vandalism',
		hideWhenMultiple: true
	},
	{
		label: 'স৪: আলোচনার মাধ্যমে অপসারিত পাতা পুনঃতৈরি',
		value: 'repost',
		tooltip: 'A copy, by any title, of a page that was deleted via an XfD process or Deletion review, provided that the copy is substantially identical to the deleted version. This clause does not apply to content that has been "userfied", to content undeleted as a result of Deletion review, or if the prior deletions were proposed or speedy deletions, although in this last case, other speedy deletion criteria may still apply',
		subgroup: {
			name: 'repost_xfd',
			type: 'input',
			label: 'যে পাতায় অপসারণ আলোচনা সংঘটিত হয়েছে:',
			tooltip: 'Must start with "Wikipedia:"',
			size: 60
		}
	},
	{
		label: 'স৫: নিষিদ্ধ বা বাধাপ্রাপ্ত ব্যবহারকারীর তৈরি পাতা',
		value: 'banned',
		tooltip: 'Pages created by banned or blocked users in violation of their ban or block, and which have no substantial edits by others',
		subgroup: {
			name: 'banned_user',
			type: 'input',
			label: 'নিষিদ্ধ ব্যবহারকারী ব্যবহারকারী না (যদি পাওয়া যায়):',
			tooltip: 'Should not start with "User:"'
		}
	},
	{
		label: 'স৬: স্থানান্তর',
		value: 'move',
		tooltip: 'Making way for an uncontroversial move like reversing a redirect',
		subgroup: [
			{
				name: 'move_page',
				type: 'input',
				label: 'যে পাতা এখানে স্থানান্তর করা হবে:'
			},
			{
				name: 'move_reason',
				type: 'input',
				label: 'Reason:',
				size: 60
			}
		],
		hideWhenMultiple: true
	},
	{
		label: 'স৬: অপসারণ প্রস্তাবনা (এক্সএফডি)',
		value: 'xfd',
		tooltip: 'A deletion discussion (at AfD, FfD, RfD, TfD, CfD, or MfD) was closed as "delete", but the page wasn\'t actually deleted.',
		subgroup: {
			name: 'xfd_fullvotepage',
			type: 'input',
			label: 'যে পাতায় অপসারণ আলোচনা সংঘটিত হয়েছে:',
			tooltip: 'Must start with "Wikipedia:"',
			size: 40
		},
		hideWhenMultiple: true
	},
	{
		label: 'স৬: অনুলিপি-প্রতিলিপি করে পাতা স্থানান্তর',
		value: 'copypaste',
		tooltip: 'This only applies for a copy-and-paste page move of another page that needs to be temporarily deleted to make room for a clean page move.',
		subgroup: {
			name: 'copypaste_sourcepage',
			type: 'input',
			label: 'যে পাতাটি থেকে এখানে অনুলিপি-প্রতিলিপি করা হয়েছে তার নাম:'
		},
		hideWhenMultiple: true
	},
	{
		label: 'স৬: গৃহস্থালি ও নিয়মমাফিক (অবিতর্কিত) পরিষ্করণ',
		value: 'g6',
		tooltip: 'Other routine maintenance tasks',
		subgroup: {
			name: 'g6_rationale',
			type: 'input',
			label: 'Rationale:',
			size: 60
		}
	},
	{
		label: 'স৭: প্রণেতার অপসারণ অনুরোধ, অথবা প্রণেতা পাতাটি খালি করেছেন',
		value: 'author',
		tooltip: 'Any page for which deletion is requested by the original author in good faith, provided the page\'s only substantial content was added by its author. If the author blanks the page, this can also be taken as a deletion request.',
		subgroup: {
			name: 'author_rationale',
			type: 'input',
			label: 'ঐচ্ছিক ব্যাখ্যা:',
			tooltip: 'Perhaps linking to where the author requested this deletion.',
			size: 60
		},
		hideSubgroupWhenSysop: true
	},
	{
		label: 'স৮: অপসারিত পাতার উপর নির্ভরশীল পাতা',
		value: 'g8',
		tooltip: 'such as talk pages with no corresponding subject page; subpages with no parent page; file pages without a corresponding file; redirects to non-existent targets; or categories populated by deleted or retargeted templates. This excludes any page that is useful to the project, and in particular: deletion discussions that are not logged elsewhere, user and user talk pages, talk page archives, plausible redirects that can be changed to valid targets, and file pages or talk pages for files that exist on Wikimedia Commons.',
		subgroup: {
			name: 'g8_rationale',
			type: 'input',
			label: 'ঐচ্ছিক ব্যাখা:',
			size: 60
		},
		hideSubgroupWhenSysop: true
	},
	{
		label: 'স৮: অপসারিত পাতার উপপাতা',
		value: 'subpage',
		tooltip: 'This excludes any page that is useful to the project, and in particular: deletion discussions that are not logged elsewhere, user and user talk pages, talk page archives, plausible redirects that can be changed to valid targets, and file pages or talk pages for files that exist on Wikimedia Commons.',
		hideWhenMultiple: true,
		hideInNamespaces: [ 0, 6, 8 ]  // hide in main, file, and mediawiki-spaces
	},
	{
		label: 'স১০: আক্রমণাত্মক পাতা',
		value: 'attack',
		tooltip: 'Pages that serve no purpose but to disparage or threaten their subject or some other entity (e.g., "John Q. Doe is an imbecile"). This includes a biography of a living person that is negative in tone and unsourced, where there is no NPOV version in the history to revert to. Administrators deleting such pages should not quote the content of the page in the deletion summary!'
	},
	{
		label: 'স১০: আক্রমনাত্বক, তথ্যসূত্র বিহীন জীবনী',
		value: 'negublp',
		tooltip: 'A biography of a living person that is entirely negative in tone and unsourced, where there is no neutral version in the history to revert to.',
		hideWhenMultiple: true
	},
	{
		label: 'স১১: দ্ব্যর্থহীন বিজ্ঞাপন',
		value: 'spam',
		tooltip: 'Pages which exclusively promote a company, product, group, service, or person and which would need to be fundamentally rewritten in order to become encyclopedic. Note that an article about a company or a product which describes its subject from a neutral point of view does not qualify for this criterion; an article that is blatant advertising should have inappropriate content as well'
	},
	{
		label: 'স১২: দ্ব্যর্থহীন কপিরাইট লঙ্ঘন',
		value: 'copyvio',
		tooltip: 'Either: (1) Material was copied from another website that does not have a license compatible with Wikipedia, or is photography from a stock photo seller (such as Getty Images or Corbis) or other commercial content provider; (2) There is no non-infringing content in the page history worth saving; or (3) The infringement was introduced at once by a single person rather than created organically on wiki and then copied by another website such as one of the many Wikipedia mirrors',
		subgroup: [
			{
				name: 'copyvio_url',
				type: 'input',
				label: 'ইউআরএল (যদি থাকে):',
				tooltip: 'If the material was copied from an online source, put the URL here, including the "http://" or "https://" protocol.',
				size: 60
			},
			{
				name: 'copyvio_url2',
				type: 'input',
				label: 'অতিরিক্ত ইউআরএল:',
				tooltip: 'Optional. Should begin with "http://" or "https://"',
				size: 60
			},
			{
				name: 'copyvio_url3',
				type: 'input',
				label: 'অতিরিক্ত ইউআরএল:',
				tooltip: 'Optional. Should begin with "http://" or "https://"',
				size: 60
			}
		]
	},
	{
		label: 'স১৩: Page in draft namespace or userspace AfC submission, stale by over 6 months',
		value: 'afc',
		tooltip: 'Any rejected or unsubmitted AfC submission in userspace or any non-redirect page in draft namespace, that has not been edited for more than 6 months. Blank drafts in either namespace are also included.',
		hideWhenRedirect: true,
		showInNamespaces: [2, 118]  // user, draft namespaces only
	},
	{
		label: 'স১৪: অপ্রয়োজনীয় দ্ব্যর্থতা নিরসন পাতা',
		value: 'disambig',
		tooltip: 'This only applies for orphaned disambiguation pages which either: (1) disambiguate only one existing Wikipedia page and whose title ends in "(disambiguation)" (i.e., there is a primary topic); or (2) disambiguate no (zero) existing Wikipedia pages, regardless of its title.  It also applies to orphan "Foo (disambiguation)" redirects that target pages that are not disambiguation or similar disambiguation-like pages (such as set index articles or lists)'
	}
];

Twinkle.speedy.redirectList = [
	{
		label: 'প২: বিষয়শ্রেণী:, টেমপ্লেট:, উইকিপিডিয়া:, সাহায্য: এবং প্রবেশদ্বার নামস্থান ব্যতীত প্রধান নামস্থান থেকে অন্য নামস্থান পুনঃনির্দেশ',
		value: 'rediruser',
		tooltip: 'This does not include the pseudo-namespace shortcuts. If this was the result of a page move, consider waiting a day or two before deleting the redirect',
		showInNamespaces: [ 0 ]
	},
	{
		label: 'প৩: এমন একটি অভাবনীয় টাইপোর ফলে তৈরি পুনঃনির্দেশ যা সম্প্রতি তৈরি করা হয়েছিল',
		value: 'redirtypo',
		tooltip: 'However, redirects from common misspellings or misnomers are generally useful, as are redirects in other languages'
	},
	{
		label: 'প৪: কমন্স পাতার সাথে মিলে যায় এমন একটি নামে ফাইল নামস্থান থেকে পুনঃনির্দেশ',
		value: 'redircom',
		tooltip: 'The redirect should have no incoming links (unless the links are cleary intended for the file or redirect at Commons).',
		showInNamespaces: [ 6 ]
	},
	{
		label: 'স৬: দ্ব্যর্থতা নিরসন পাতায় করা ত্রুটিপূর্ণ পুনর্নির্দেশ',
		value: 'movedab',
		tooltip: 'This only applies for redirects to disambiguation pages ending in (disambiguation) where a primary topic does not exist.',
		hideWhenMultiple: true
	},
	{
		label: 'স৮: বিদ্যমান নেই এমন লক্ষ্যে পুনর্নির্দেশ',
		value: 'redirnone',
		tooltip: 'This excludes any page that is useful to the project, and in particular: deletion discussions that are not logged elsewhere, user and user talk pages, talk page archives, plausible redirects that can be changed to valid targets, and file pages or talk pages for files that exist on Wikimedia Commons.',
		hideWhenMultiple: true
	}
];

Twinkle.speedy.normalizeHash = {
	reason: 'db',
	nonsense: 'g1',
	test: 'g2',
	vandalism: 'g3',
	hoax: 'g3',
	repost: 'g4',
	banned: 'g5',
	move: 'g6',
	xfd: 'g6',
	movedab: 'g6',
	copypaste: 'g6',
	g6: 'g6',
	author: 'g7',
	g8: 'g8',
	talk: 'g8',
	subpage: 'g8',
	redirnone: 'g8',
	templatecat: 'g8',
	imagepage: 'g8',
	attack: 'g10',
	negublp: 'g10',
	spam: 'g11',
	spamuser: 'g11',
	copyvio: 'g12',
	afc: 'g13',
	disambig: 'g14',
	nocontext: 'a1',
	foreign: 'a2',
	nocontent: 'a3',
	transwiki: 'a5',
	a7: 'a7',
	person: 'a7',
	corp: 'a7',
	web: 'a7',
	band: 'a7',
	club: 'a7',
	animal: 'a7',
	event: 'a7',
	a9: 'a9',
	a10: 'a10',
	madeup: 'a11',
	rediruser: 'r2',
	redirtypo: 'r3',
	redircom: 'r4',
	redundantimage: 'f1',
	noimage: 'f2',
	fpcfail: 'f2',
	noncom: 'f3',
	unksource: 'f4',
	unfree: 'f5',
	f5: 'f5',
	norat: 'f6',
	badfairuse: 'f7',
	commons: 'f8',
	imgcopyvio: 'f9',
	badfiletype: 'f10',
	nopermission: 'f11',
	catempty: 'c1',
	userreq: 'u1',
	nouser: 'u2',
	notwebhost: 'u5',
	p1: 'p1',
	emptyportal: 'p2'

};

Twinkle.speedy.callbacks = {
	getTemplateCodeAndParams: function(params) {
		var code, parameters, i;
		if (params.normalizeds.length > 1) {
			code = '{{db-multiple';
			params.utparams = {};
			$.each(params.normalizeds, function(index, norm) {
				code += '|' + norm.toUpperCase();
				parameters = params.templateParams[index] || [];
				for (var i in parameters) {
					if (typeof parameters[i] === 'string' && !parseInt(i, 10)) {  // skip numeric parameters - {{db-multiple}} doesn't understand them
						code += '|' + i + '=' + parameters[i];
					}
				}
				$.extend(params.utparams, Twinkle.speedy.getUserTalkParameters(norm, parameters));
			});
			code += '}}';
		} else {
			parameters = params.templateParams[0] || [];
			code = '{{db-' + params.values[0];
			for (i in parameters) {
				if (typeof parameters[i] === 'string') {
					code += '|' + i + '=' + parameters[i];
				}
			}
			if (params.usertalk) {
				code += '|help=off';
			}
			code += '}}';
			params.utparams = Twinkle.speedy.getUserTalkParameters(params.normalizeds[0], parameters);
		}

		return [code, params.utparams];
	},

	parseWikitext: function(wikitext, callback) {
		var query = {
			action: 'parse',
			prop: 'text',
			pst: 'true',
			text: wikitext,
			contentmodel: 'wikitext',
			title: mw.config.get('wgPageName'),
			disablelimitreport: true,
			format: 'json'
		};

		var statusIndicator = new Morebits.status('অপসারণ সারাংশ তৈরি করা হচ্ছে');
		var api = new Morebits.wiki.api('অপসারণ সম্পর্কিত টেমপ্লেট খোঁজা হচ্ছে', query, function(apiobj) {
			var reason = decodeURIComponent($(apiobj.getResponse().parse.text).find('#delete-reason').text()).replace(/\+/g, ' ');
			if (!reason) {
				statusIndicator.warn('অপসারণ টেমপ্লেট থেকে সারাংশ তৈরি করা যায়নি');
			} else {
				statusIndicator.info('সম্পন্ন');
			}
			callback(reason);
		}, statusIndicator);
		api.post();
	},

	noteToCreator: function(pageobj) {
		var params = pageobj.getCallbackParameters();
		var initialContrib = pageobj.getCreator();

		// disallow notifying yourself
		if (initialContrib === mw.config.get('wgUserName')) {
			Morebits.status.warn('আপনি (' + initialContrib + ') এই পাতাটি তৈরি করেছেন তাই বিজ্ঞপ্তি পাঠানো হচ্ছে না');
			initialContrib = null;

		// don't notify users when their user talk page is nominated/deleted
		} else if (initialContrib === mw.config.get('wgTitle') && mw.config.get('wgNamespaceNumber') === 3) {
			Morebits.status.warn('প্রাথমিক অবদানকারীকে অবহিতকরণ: এই ব্যবহারকারী তার নিজস্ব ব্যবহারকারী আলাপ পাতা তৈরি করেছেন, তাই বিজ্ঞপ্তি এড়িয়ে যাওয়া হচ্ছে');
			initialContrib = null;

		// quick hack to prevent excessive unwanted notifications, per request. Should actually be configurable on recipient page...
		} else if ((initialContrib === 'RagibBot') && params.normalizeds[0] === 'f2') {
			Morebits.status.warn('মূল অবদানকারীকে জানানো হচ্ছে: পাতাটি বট তৈরি করেছে; বিজ্ঞপ্তি দেওয়া এড়িয়ে যাওয়া হচ্ছে');
			initialContrib = null;

		// Check for already existing tags
		} else if (Twinkle.speedy.hasCSD && params.warnUser && !confirm('পাতাটিতে একটি অপসারণ সম্পর্কিত ট্যাগ রয়েছে এবং প্রণেতাকে সম্ভবত অবহিত করা হয়েছে৷ আপনি কি এই মুছে ফেলার জন্য তাকে জানাতে চান?')) {
			Morebits.status.info('মূল অবদানকারীকে জানানো হচ্ছে', 'বিজ্ঞপ্তি দেওয়া ব্যবহারকারী কর্তৃক বাতিল করা হয়েছে, এড়িয়ে যাওয়া হচ্ছে');
			initialContrib = null;
		}

		if (initialContrib) {
			var usertalkpage = new Morebits.wiki.page('User talk:' + initialContrib, 'মূল অবদানকারীকে জানানো হচ্ছে (' + initialContrib + ')'),
				notifytext, i, editsummary;

			// special cases: "db" and "db-multiple"
			if (params.normalizeds.length > 1) {
				notifytext = '\n{{subst:db-' + (params.warnUser ? 'deleted' : 'notice') + '-multiple|1=' + Morebits.pageNameNorm;
				var count = 2;
				$.each(params.normalizeds, function(index, norm) {
					notifytext += '|' + count++ + '=' + norm.toUpperCase();
				});
			} else if (params.normalizeds[0] === 'db') {
				notifytext = '\n{{subst:db-reason-' + (params.warnUser ? 'deleted' : 'notice') + '|1=' + Morebits.pageNameNorm;
			} else {
				notifytext = '\n{{subst:db-csd-' + (params.warnUser ? 'deleted' : 'notice') + '-custom|1=';
				if (params.values[0] === 'copypaste') {
					notifytext += params.templateParams[0].sourcepage;
				} else {
					notifytext += Morebits.pageNameNorm;
				}
				notifytext += '|2=' + params.values[0];
			}

			for (i in params.utparams) {
				if (typeof params.utparams[i] === 'string') {
					notifytext += '|' + i + '=' + params.utparams[i];
				}
			}
			notifytext += (params.welcomeuser ? '' : '|nowelcome=yes') + '}} ~~~~';

			editsummary = 'বিজ্ঞপ্তি:' + (params.warnUser ? '' : ' দ্রুত অপসারণ প্রস্তাবনা,');
			if (params.normalizeds.indexOf('g10') === -1) {  // no article name in summary for G10 taggings
				editsummary += ' [[:' + Morebits.pageNameNorm + ']]-এর';
			} else {
				editsummary += ' একটি আক্রমণাত্বক পাতার';
			}

			usertalkpage.setAppendText(notifytext);
			usertalkpage.setEditSummary(editsummary);
			usertalkpage.setChangeTags(Twinkle.changeTags);
			usertalkpage.setCreateOption('recreate');
			usertalkpage.setWatchlist(Twinkle.getPref('watchSpeedyUser'));
			usertalkpage.setFollowRedirect(true, false);
			usertalkpage.append(function onNotifySuccess() {
				// add this nomination to the user's userspace log, if the user has enabled it
				if (params.lognomination) {
					Twinkle.speedy.callbacks.user.addToLog(params, initialContrib);
				}
			}, function onNotifyError() {
				// if user could not be notified, log nomination without mentioning that notification was sent
				if (params.lognomination) {
					Twinkle.speedy.callbacks.user.addToLog(params, null);
				}
			});
		} else if (params.lognomination) {
			// log nomination even if the user notification wasn't sent
			Twinkle.speedy.callbacks.user.addToLog(params, null);
		}
	},

	sysop: {
		main: function(params) {
			var reason;
			if (!params.normalizeds.length && params.normalizeds[0] === 'db') {
				reason = prompt('Enter the deletion summary to use, which will be entered into the deletion log:', '');
				Twinkle.speedy.callbacks.sysop.deletePage(reason, params);
			} else {
				var code = Twinkle.speedy.callbacks.getTemplateCodeAndParams(params)[0];
				Twinkle.speedy.callbacks.parseWikitext(code, function(reason) {
					if (params.promptForSummary) {
						reason = prompt('Enter the deletion summary to use, or press OK to accept the automatically generated one.', reason);
					}
					Twinkle.speedy.callbacks.sysop.deletePage(reason, params);
				});
			}
		},
		deletePage: function(reason, params) {
			var thispage = new Morebits.wiki.page(mw.config.get('wgPageName'), 'পাতা অপসারণ করা হচ্ছে');

			if (reason === null) {
				return Morebits.status.error('Asking for reason', 'User cancelled');
			} else if (!reason || !reason.replace(/^\s*/, '').replace(/\s*$/, '')) {
				return Morebits.status.error('Asking for reason', "you didn't give one.  I don't know... what with admins and their apathetic antics... I give up...");
			}

			var deleteMain = function(callback) {
				thispage.setEditSummary(reason);
				thispage.setChangeTags(Twinkle.changeTags);
				thispage.setWatchlist(params.watch);
				thispage.deletePage(function() {
					thispage.getStatusElement().info('সম্পন্ন');
					typeof callback === 'function' && callback();
					Twinkle.speedy.callbacks.sysop.deleteTalk(params);
				});
			};

			// look up initial contributor. If prompting user for deletion reason, just display a link.
			// Otherwise open the talk page directly
			if (params.warnUser) {
				thispage.setCallbackParameters(params);
				thispage.lookupCreation(function(pageobj) {
					deleteMain(function() {
						Twinkle.speedy.callbacks.noteToCreator(pageobj);
					});
				});
			} else {
				deleteMain();
			}
		},
		deleteTalk: function(params) {
			// delete talk page
			if (params.deleteTalkPage &&
					params.normalized !== 'f8' &&
					!document.getElementById('ca-talk').classList.contains('new')) {
				var talkpage = new Morebits.wiki.page(mw.config.get('wgFormattedNamespaces')[mw.config.get('wgNamespaceNumber') + 1] + ':' + mw.config.get('wgTitle'), 'আলাপ পাতা অপসারণ করা হচ্ছে');
				talkpage.setEditSummary('[[WP:দ্রুত#স৮|স৮]]: অপসারিত পাতা "' + Morebits.pageNameNorm + '"-এর আলাপ পাতা');
				talkpage.setChangeTags(Twinkle.changeTags);
				talkpage.deletePage();
				// this is ugly, but because of the architecture of wiki.api, it is needed
				// (otherwise success/failure messages for the previous action would be suppressed)
				window.setTimeout(function() {
					Twinkle.speedy.callbacks.sysop.deleteRedirects(params);
				}, 1800);
			} else {
				Twinkle.speedy.callbacks.sysop.deleteRedirects(params);
			}
		},
		deleteRedirects: function(params) {
			// delete redirects
			if (params.deleteRedirects) {
				var query = {
					action: 'query',
					titles: mw.config.get('wgPageName'),
					prop: 'redirects',
					rdlimit: 'max', // 500 is max for normal users, 5000 for bots and sysops
					format: 'json'
				};
				var wikipedia_api = new Morebits.wiki.api('getting list of redirects...', query, Twinkle.speedy.callbacks.sysop.deleteRedirectsMain,
					new Morebits.status('পুনর্নির্দেশ অপসারণ করা হচ্ছে'));
				wikipedia_api.params = params;
				wikipedia_api.post();
			}

			// promote Unlink tool
			var $link, $bigtext;
			if (mw.config.get('wgNamespaceNumber') === 6 && params.normalized !== 'f8') {
				$link = $('<a/>', {
					href: '#',
					text: 'পাতার সংযোগ অপসারণ সরঞ্জামে যাওয়ার জন্য এখানে ক্লিক করুন',
					css: { fontSize: '130%', fontWeight: 'bold' },
					click: function() {
						Morebits.wiki.actionCompleted.redirect = null;
						Twinkle.speedy.dialog.close();
						Twinkle.unlink.callback('Removing usages of and/or links to deleted file ' + Morebits.pageNameNorm);
					}
				});
				$bigtext = $('<span/>', {
					text: 'পাতার সংযোগ অপসারণ ও ফাইলের ব্যবহার অপসারণ করার জন্য',
					css: { fontSize: '130%', fontWeight: 'bold' }
				});
				Morebits.status.info($bigtext[0], $link[0]);
			} else if (params.normalized !== 'f8') {
				$link = $('<a/>', {
					href: '#',
					text: 'পাতার সংযোগ অপসারণ সরঞ্জামে যাওয়ার জন্য এখানে ক্লিক করুন',
					css: { fontSize: '130%', fontWeight: 'bold' },
					click: function() {
						Morebits.wiki.actionCompleted.redirect = null;
						Twinkle.speedy.dialog.close();
						Twinkle.unlink.callback('Removing links to deleted page ' + Morebits.pageNameNorm);
					}
				});
				$bigtext = $('<span/>', {
					text: 'পাতার সংযোগ অপসারণ',
					css: { fontSize: '130%', fontWeight: 'bold' }
				});
				Morebits.status.info($bigtext[0], $link[0]);
			}
		},
		deleteRedirectsMain: function(apiobj) {
			var response = apiobj.getResponse();
			var snapshot = response.query.pages[0].redirects || [];
			var total = snapshot.length;
			var statusIndicator = apiobj.statelem;

			if (!total) {
				statusIndicator.status('কোন পুননির্দেশ পাওয়া যায়নি');
				return;
			}

			statusIndicator.status('0%');

			var current = 0;
			var onsuccess = function(apiobjInner) {
				var now = parseInt(100 * ++current / total, 10) + '%';
				statusIndicator.update(now);
				apiobjInner.statelem.unlink();
				if (current >= total) {
					statusIndicator.info(now + ' (সম্পন্ন)');
					Morebits.wiki.removeCheckpoint();
				}
			};

			Morebits.wiki.addCheckpoint();

			snapshot.forEach(function(value) {
				var title = value.title;
				var page = new Morebits.wiki.page(title, '"' + title + '" পুনর্নির্দেশ অপসারণ করা হচ্ছে');
				page.setEditSummary('[[WP:দ্রুত#স৮|স৮]]: অপসারিত পাতা "' + Morebits.pageNameNorm + '"-এর পুনর্নির্দেশ');
				page.setChangeTags(Twinkle.changeTags);
				page.deletePage(onsuccess);
			});
		}
	},

	user: {
		main: function(pageobj) {
			var statelem = pageobj.getStatusElement();

			if (!pageobj.exists()) {
				statelem.error("It seems that the page doesn't exist; perhaps it has already been deleted");
				return;
			}

			var params = pageobj.getCallbackParameters();

			// given the params, builds the template and also adds the user talk page parameters to the params that were passed in
			// returns => [<string> wikitext, <object> utparams]
			var buildData = Twinkle.speedy.callbacks.getTemplateCodeAndParams(params),
				code = buildData[0];
			params.utparams = buildData[1];

			// Set the correct value for |ts= parameter in {{db-g13}}
			if (params.normalizeds.indexOf('g13') !== -1) {
				code = code.replace('$TIMESTAMP', pageobj.getLastEditTime());
			}

			// Tag if possible, post on talk if not
			if (pageobj.canEdit() && ['wikitext', 'Scribunto', 'javascript', 'css', 'sanitized-css'].indexOf(pageobj.getContentModel()) !== -1) {
				var text = pageobj.getPageText();

				statelem.status('পাতায় ট্যাগের জন্য পরীক্ষা করা হচ্ছে...');

				// check for existing deletion tags
				var tag = /(?:\{\{\s*(db|delete|db-.*?|speedy deletion-.*?)(?:\s*\||\s*\}\}))/.exec(text);
				// This won't make use of the db-multiple template but it probably should
				if (tag && !confirm('এই পাতায় দ্রুত অপসারণ সম্পর্কিত টেমপ্লেট {{' + tag[1] + '}} পাওয়া গেছে। আপনি কি আরেকটি দ্রুত অপসারণের টেমপ্লেট যোগ করতে চান?')) {
					return;
				}

				var xfd = /\{\{((?:article for deletion|proposed deletion|prod blp|template for discussion)\/dated|[cfm]fd\b)/i.exec(text) || /#invoke:(RfD)/.exec(text);
				if (xfd && !confirm('এই পাতায় অপসারণ সম্পর্কিত টেমপ্লেট {{' + xfd[1] + '}} পাওয়া গেছে। আপনি কি এখনো দ্রুত অপসারণের টেমপ্লেট যোগ করতে চান?')) {
					return;
				}

				// curate/patrol the page
				if (Twinkle.getPref('markSpeedyPagesAsPatrolled')) {
					pageobj.triage();
				}

				// Wrap SD template in noinclude tags if we are in template space.
				// Won't work with userboxes in userspace, or any other transcluded page outside template space
				if (mw.config.get('wgNamespaceNumber') === 10) {  // Template:
					code = '<noinclude>' + code + '</noinclude>';
				}

				// Remove tags that become superfluous with this action
				text = text.replace(/\{\{\s*([Uu]serspace draft)\s*(\|(?:\{\{[^{}]*\}\}|[^{}])*)?\}\}\s*/g, '');
				if (mw.config.get('wgNamespaceNumber') === 6) {
					// remove "move to Commons" tag - deletion-tagged files cannot be moved to Commons
					text = text.replace(/\{\{(mtc|(copy |move )?to ?commons|move to wikimedia commons|copy to wikimedia commons)[^}]*\}\}/gi, '');
				}

				if (params.requestsalt) {
					if (params.normalizeds.indexOf('g10') === -1) {
						code += '\n{{salt}}';
					} else {
						code = '{{salt}}\n' + code;
					}
				}

				if (mw.config.get('wgPageContentModel') === 'Scribunto') {
					// Scribunto isn't parsed like wikitext, so CSD templates on modules need special handling to work
					var equals = '';
					while (code.indexOf(']' + equals + ']') !== -1) {
						equals += '=';
					}
					code = "require('Module:Module wikitext')._addText([" + equals + '[' + code + ']' + equals + ']);';
				} else if (['javascript', 'css', 'sanitized-css'].indexOf(mw.config.get('wgPageContentModel')) !== -1) {
					// Likewise for JS/CSS pages
					code = '/* ' + code + ' */';
				}

				// Generate edit summary for edit
				var editsummary;
				if (params.normalizeds.length > 1) {
					editsummary = 'দ্রুত অপসারণের প্রস্তাবনা (';
					$.each(params.normalizeds, function(index, norm) {
						editsummary += '[[WP:দ্রুত#' + norm.toUpperCase() + '|দ্রুত ' + norm.toUpperCase() + ']], ';
					});
					editsummary = editsummary.substr(0, editsummary.length - 2); // remove trailing comma
					editsummary += ')।';
				} else if (params.normalizeds[0] === 'db') {
					editsummary = '"' + params.templateParams[0]['1'] + '" কারণ দেখিয়ে [[WP:দ্রুত|দ্রুত অপসারণের]] অনুরোধ করা হয়েছে।';
				} else {
					editsummary = 'দ্রুত অপসারণের প্রস্তাবনা ([[WP:দ্রুত#' + params.normalizeds[0].toUpperCase() + '|দ্রুত ' + params.normalizeds[0].toUpperCase() + ']])।';
				}

				// Blank attack pages
				if (params.normalizeds.indexOf('g10') !== -1) {
					text = code;
				} else {
					// Insert tag after short description or any hatnotes
					var wikipage = new Morebits.wikitext.page(text);
					text = wikipage.insertAfterTemplates(code + '\n', Twinkle.hatnoteRegex).getText();
				}


				pageobj.setPageText(text);
				pageobj.setEditSummary(editsummary);
				pageobj.setWatchlist(params.watch);
				pageobj.save(Twinkle.speedy.callbacks.user.tagComplete);
			} else { // Attempt to place on talk page
				var talkName = new mw.Title(pageobj.getPageName()).getTalkPage().toText();
				if (talkName !== pageobj.getPageName()) {
					if (params.requestsalt) {
						code += '\n{{salt}}';
					}

					pageobj.getStatusElement().warn('Unable to edit page, placing tag on talk page');

					var talk_page = new Morebits.wiki.page(talkName, 'স্বয়ংক্রিয়ভাবে আলাপ পাতায় ট্যাগ যোগ করা হচ্ছে');
					talk_page.setNewSectionTitle(pageobj.getPageName() + ' দ্রুত অপসারণের জন্য মনোনীত করা হয়েছে');
					talk_page.setNewSectionText(code + '\n\nআমি ' + pageobj.getPageName() + ' পাতাটি ট্যাগ করতে পারছি না, অনুগ্ৰহ করে এটি অপসারণ করুন। ~~~~');
					talk_page.setCreateOption('recreate');
					talk_page.setFollowRedirect(true);
					talk_page.setWatchlist(params.watch);
					talk_page.setChangeTags(Twinkle.changeTags);
					talk_page.setCallbackParameters(params);
					talk_page.newSection(Twinkle.speedy.callbacks.user.tagComplete);
				} else {
					pageobj.getStatusElement().error('Page protected and nowhere to add an edit request, aborting');
				}
			}
		},

		tagComplete: function(pageobj) {
			var params = pageobj.getCallbackParameters();

			// Notification to first contributor, will also log nomination to the user's userspace log
			if (params.usertalk) {
				var thispage = new Morebits.wiki.page(Morebits.pageNameNorm);
				thispage.setCallbackParameters(params);
				thispage.lookupCreation(Twinkle.speedy.callbacks.noteToCreator);
			// or, if not notifying, add this nomination to the user's userspace log without the initial contributor's name
			} else if (params.lognomination) {
				Twinkle.speedy.callbacks.user.addToLog(params, null);
			}
		},

		addToLog: function(params, initialContrib) {
			var usl = new Morebits.userspaceLogger(Twinkle.getPref('speedyLogPageName'));
			usl.initialText =
				"এই সব [[WP:দ্রুত|দ্রুত অপসারণের]] মনোনয়নের লগ যা [[WP:TW|টুইংকলের]] দ্রুত মডিউল ব্যবহার করে এই ব্যবহারকারী তৈরি করেছেন।\n\n" +
				'আপনি যদি আর এই লগ রাখতে না চান, তাহলে আপনি  [[উইকিপিডিয়া:টুইংকল/পছন্দসমূহ|পছন্দসমূহ প্যানেল]] ব্যবহার করে এটি বন্ধ করতে পারেন, এবং ' +
				'[[WP:দ্রুত#U1|দ্রুত ব১]]-এর অধীনে এই পাতাটি দ্রুত অপসারণের জন্য মনোনয়ন করতে পারেন।' +
				(Morebits.userIsSysop ? '\n\nThis log does not track outright speedy deletions made using Twinkle.' : '');

			var formatParamLog = function(normalize, csdparam, input) {
				if ((normalize === 'G4' && csdparam === 'xfd') ||
					(normalize === 'G6' && csdparam === 'page') ||
					(normalize === 'G6' && csdparam === 'fullvotepage') ||
					(normalize === 'G6' && csdparam === 'sourcepage') ||
					(normalize === 'A2' && csdparam === 'source') ||
					(normalize === 'A10' && csdparam === 'article') ||
					(normalize === 'F1' && csdparam === 'filename')) {
					input = '[[:' + input + ']]';
				} else if (normalize === 'G5' && csdparam === 'user') {
					input = '[[:User:' + input + ']]';
				} else if (normalize === 'G12' && csdparam.lastIndexOf('url', 0) === 0 && input.lastIndexOf('http', 0) === 0) {
					input = '[' + input + ' ' + input + ']';
				} else if (normalize === 'F8' && csdparam === 'filename') {
					input = '[[commons:' + input + ']]';
				} else if (normalize === 'P1' && csdparam === 'criterion') {
					input = '[[WP:দ্রুত#' + input + ']]';
				}
				return ' {' + normalize + ' ' + csdparam + ': ' + input + '}';
			};

			var extraInfo = '';

			// If a logged file is deleted but exists on commons, the wikilink will be blue, so provide a link to the log
			var fileLogLink = mw.config.get('wgNamespaceNumber') === 6 ? ' ([{{fullurl:Special:Log|page=' + mw.util.wikiUrlencode(mw.config.get('wgPageName')) + '}} লগ])' : '';

			var editsummary = 'দ্রুত অপসারণের মনোনয়ন তালিকাভুক্ত করা হচ্ছে,';
			var appendText = '# [[:' + Morebits.pageNameNorm;

			if (params.normalizeds.indexOf('g10') === -1) {  // no article name in log for G10 taggings
				appendText += ']]' + fileLogLink + ': ';
				editsummary += ' [[:' + Morebits.pageNameNorm + ']]।';
			} else {
				appendText += '|এটা]] attack page' + fileLogLink + ': ';
				editsummary += ' of an attack page.';
			}
			if (params.normalizeds.length > 1) {
				appendText += 'একাধিক বিচারধারা (';
				$.each(params.normalizeds, function(index, norm) {
					appendText += '[[WP:দ্রুত#' + norm.toUpperCase() + '|' + norm.toUpperCase() + ']], ';
				});
				appendText = appendText.substr(0, appendText.length - 2);  // remove trailing comma
				appendText += ')';
			} else if (params.normalizeds[0] === 'db') {
				appendText += '{{tl|db-reason}}';
			} else {
				appendText += '[[WP:দ্রুত#' + params.normalizeds[0].toUpperCase() + '|দ্রুত ' + params.normalizeds[0].toUpperCase() + ']] ({{tl|db-' + params.values[0] + '}})';
			}

			// If params is "empty" it will still be full of empty arrays, but ask anyway
			if (params.templateParams) {
				// Treat custom rationale individually
				if (params.normalizeds[0] && params.normalizeds[0] === 'db') {
					extraInfo += formatParamLog('Custom', 'rationale', params.templateParams[0]['1']);
				} else {
					params.templateParams.forEach(function(item, index) {
						var keys = Object.keys(item);
						if (keys[0] !== undefined && keys[0].length > 0) {
							// Second loop required since some items (G12, F9) may have multiple keys
							keys.forEach(function(key, keyIndex) {
								if (keys[keyIndex] === 'blanked' || keys[keyIndex] === 'ts') {
									return true; // Not worth logging
								}
								extraInfo += formatParamLog(params.normalizeds[index].toUpperCase(), keys[keyIndex], item[key]);
							});
						}
					});
				}
			}

			if (params.requestsalt) {
				appendText += '; সৃষ্টি থেকে সুরক্ষার অনুরোধ করা হয়েছে ([[WP:SALT|সৃষ্টি থেকে সুরক্ষা]])';
			}
			if (extraInfo) {
				appendText += '; অতিরিক্ত তথ্য:' + extraInfo;
			}
			if (initialContrib) {
				appendText += '; {{user|1=' + initialContrib + '}} কে জানানো হয়েছে';
			}
			appendText += ' ~~~~~\n';

			usl.changeTags = Twinkle.changeTags;
			usl.log(appendText, editsummary);
		}
	}
};

// validate subgroups in the form passed into the speedy deletion tag
Twinkle.speedy.getParameters = function twinklespeedyGetParameters(form, values) {
	var parameters = [];

	$.each(values, function(index, value) {
		var currentParams = [];
		switch (value) {
			case 'reason':
				if (form['csd.reason_1']) {
					var dbrationale = form['csd.reason_1'].value;
					if (!dbrationale || !dbrationale.trim()) {
						alert('Custom rationale:  Please specify a rationale.');
						parameters = null;
						return false;
					}
					currentParams['1'] = dbrationale;
				}
				break;

			case 'userreq':  // U1
				if (form['csd.userreq_rationale']) {
					var u1rationale = form['csd.userreq_rationale'].value;
					if (mw.config.get('wgNamespaceNumber') === 3 && !(/\//).test(mw.config.get('wgTitle')) &&
							(!u1rationale || !u1rationale.trim())) {
						alert('CSD U1:  Please specify a rationale when nominating user talk pages.');
						parameters = null;
						return false;
					}
					currentParams.rationale = u1rationale;
				}
				break;

			case 'repost':  // G4
				if (form['csd.repost_xfd']) {
					var deldisc = form['csd.repost_xfd'].value;
					if (deldisc) {
						if (!new RegExp('^:?' + Morebits.namespaceRegex(4) + ':', 'i').test(deldisc)) {
							alert('CSD G4:  The deletion discussion page name, if provided, must start with "Wikipedia:".');
							parameters = null;
							return false;
						}
						currentParams.xfd = deldisc;
					}
				}
				break;

			case 'banned':  // G5
				if (form['csd.banned_user'] && form['csd.banned_user'].value) {
					currentParams.user = form['csd.banned_user'].value.replace(/^\s*User:/i, '');
				}
				break;

			case 'move':  // G6
				if (form['csd.move_page'] && form['csd.move_reason']) {
					var movepage = form['csd.move_page'].value,
						movereason = form['csd.move_reason'].value;
					if (!movepage || !movepage.trim()) {
						alert('CSD G6 (move):  Please specify the page to be moved here.');
						parameters = null;
						return false;
					}
					if (!movereason || !movereason.trim()) {
						alert('CSD G6 (move):  Please specify the reason for the move.');
						parameters = null;
						return false;
					}
					currentParams.page = movepage;
					currentParams.reason = movereason;
				}
				break;

			case 'xfd':  // G6
				if (form['csd.xfd_fullvotepage']) {
					var xfd = form['csd.xfd_fullvotepage'].value;
					if (xfd) {
						if (!new RegExp('^:?' + Morebits.namespaceRegex(4) + ':', 'i').test(xfd)) {
							alert('CSD G6 (XFD):  The deletion discussion page name, if provided, must start with "Wikipedia:".');
							parameters = null;
							return false;
						}
						currentParams.fullvotepage = xfd;
					}
				}
				break;

			case 'copypaste':  // G6
				if (form['csd.copypaste_sourcepage']) {
					var copypaste = form['csd.copypaste_sourcepage'].value;
					if (!copypaste || !copypaste.trim()) {
						alert('CSD G6 (copypaste):  Please specify the source page name.');
						parameters = null;
						return false;
					}
					currentParams.sourcepage = copypaste;
				}
				break;

			case 'g6':  // G6
				if (form['csd.g6_rationale'] && form['csd.g6_rationale'].value) {
					currentParams.rationale = form['csd.g6_rationale'].value;
				}
				break;

			case 'author':  // G7
				if (form['csd.author_rationale'] && form['csd.author_rationale'].value) {
					currentParams.rationale = form['csd.author_rationale'].value;
				}
				break;

			case 'g8':  // G8
				if (form['csd.g8_rationale'] && form['csd.g8_rationale'].value) {
					currentParams.rationale = form['csd.g8_rationale'].value;
				}
				break;

			case 'templatecat':  // G8
				if (form['csd.templatecat_rationale'] && form['csd.templatecat_rationale'].value) {
					currentParams.rationale = form['csd.templatecat_rationale'].value;
				}
				break;

			case 'attack':  // G10
				currentParams.blanked = 'yes';
				// it is actually blanked elsewhere in code, but setting the flag here
				break;

			case 'copyvio':  // G12
				if (form['csd.copyvio_url'] && form['csd.copyvio_url'].value) {
					currentParams.url = form['csd.copyvio_url'].value;
				}
				if (form['csd.copyvio_url2'] && form['csd.copyvio_url2'].value) {
					currentParams.url2 = form['csd.copyvio_url2'].value;
				}
				if (form['csd.copyvio_url3'] && form['csd.copyvio_url3'].value) {
					currentParams.url3 = form['csd.copyvio_url3'].value;
				}
				break;

			case 'afc':  // G13
				currentParams.ts = '$TIMESTAMP'; // to be replaced by the last revision timestamp when page is saved
				break;

			case 'redundantimage':  // F1
				if (form['csd.redundantimage_filename']) {
					var redimage = form['csd.redundantimage_filename'].value;
					if (!redimage || !redimage.trim()) {
						alert('CSD F1:  Please specify the filename of the other file.');
						parameters = null;
						return false;
					}
					currentParams.filename = new RegExp('^\\s*' + Morebits.namespaceRegex(6) + ':', 'i').test(redimage) ? redimage : 'File:' + redimage;
				}
				break;

			case 'badfairuse':  // F7
				if (form['csd.badfairuse_rationale'] && form['csd.badfairuse_rationale'].value) {
					currentParams.rationale = form['csd.badfairuse_rationale'].value;
				}
				break;

			case 'commons':  // F8
				if (form['csd.commons_filename']) {
					var filename = form['csd.commons_filename'].value;
					if (filename && filename.trim() && filename !== Morebits.pageNameNorm) {
						currentParams.filename = new RegExp('^\\s*' + Morebits.namespaceRegex(6) + ':', 'i').test(filename) ? filename : 'File:' + filename;
					}
				}
				break;

			case 'imgcopyvio':  // F9
				if (form['csd.imgcopyvio_url'] && form['csd.imgcopyvio_rationale']) {
					var f9url = form['csd.imgcopyvio_url'].value;
					var f9rationale = form['csd.imgcopyvio_rationale'].value;
					if ((!f9url || !f9url.trim()) && (!f9rationale || !f9rationale.trim())) {
						alert('CSD F9: You must enter a url or reason (or both) when nominating a file under F9.');
						parameters = null;
						return false;
					}
					if (form['csd.imgcopyvio_url'].value) {
						currentParams.url = f9url;
					}
					if (form['csd.imgcopyvio_rationale'].value) {
						currentParams.rationale = f9rationale;
					}
				}
				break;

			case 'foreign':  // A2
				if (form['csd.foreign_source']) {
					var foreignlink = form['csd.foreign_source'].value;
					if (!foreignlink || !foreignlink.trim()) {
						alert('CSD A2:  Please specify an interwiki link to the article of which this is a copy.');
						parameters = null;
						return false;
					}
					currentParams.source = foreignlink;
				}
				break;

			case 'transwiki':  // A5
				if (form['csd.transwiki_location'] && form['csd.transwiki_location'].value) {
					currentParams.location = form['csd.transwiki_location'].value;
				}
				break;

			case 'a10':  // A10
				if (form['csd.a10_article']) {
					var duptitle = form['csd.a10_article'].value;
					if (!duptitle || !duptitle.trim()) {
						alert('CSD A10:  Please specify the name of the article which is duplicated.');
						parameters = null;
						return false;
					}
					currentParams.article = duptitle;
				}
				break;

			case 'p1':  // P1
				if (form['csd.p1_criterion']) {
					var criterion = form['csd.p1_criterion'].value;
					if (!criterion || !criterion.trim()) {
						alert('CSD P1:  Please specify a single criterion.');
						parameters = null;
						return false;
					}
					currentParams.criterion = criterion;
				}
				break;

			default:
				break;
		}
		parameters.push(currentParams);
	});
	return parameters;
};

// Function for processing talk page notification template parameters
// key1/value1: for {{db-criterion-[notice|deleted]}} (via {{db-csd-[notice|deleted]-custom}})
// utparams.param: for {{db-[notice|deleted]-multiple}}
Twinkle.speedy.getUserTalkParameters = function twinklespeedyGetUserTalkParameters(normalized, parameters) {
	var utparams = [];

	// Special cases
	if (normalized === 'db') {
		utparams['2'] = parameters['1'];
	} else if (normalized === 'g6') {
		utparams.key1 = 'to';
		utparams.value1 = Morebits.pageNameNorm;
	} else if (normalized === 'g12') {
		['url', 'url2', 'url3'].forEach(function(item, idx) {
			if (parameters[item]) {
				idx++;
				utparams['key' + idx] = item;
				utparams['value' + idx] = utparams[item] = parameters[item];
			}
		});
	} else {
		// Handle the rest
		var param;
		switch (normalized) {
			case 'g4':
				param = 'xfd';
				break;
			case 'a2':
				param = 'source';
				break;
			case 'a5':
				param = 'location';
				break;
			case 'a10':
				param = 'article';
				break;
			case 'f9':
				param = 'url';
				break;
			case 'p1':
				param = 'criterion';
				break;
			default:
				break;
		}
		// No harm in providing a usertalk template with the others' parameters
		if (param && parameters[param]) {
			utparams.key1 = param;
			utparams.value1 = utparams[param] = parameters[param];
		}
	}
	return utparams;
};

/**
 * @param {Event} e
 * @returns {Array}
 */
Twinkle.speedy.resolveCsdValues = function twinklespeedyResolveCsdValues(e) {
	var values = (e.target.form ? e.target.form : e.target).getChecked('csd');
	if (values.length === 0) {
		alert('দয়া করে একটি বিচারধারা বাছুন!');
		return null;
	}
	return values;
};

Twinkle.speedy.callback.evaluateSysop = function twinklespeedyCallbackEvaluateSysop(e) {
	var form = e.target.form ? e.target.form : e.target;

	if (e.target.type === 'checkbox' || e.target.type === 'text' ||
			e.target.type === 'select') {
		return;
	}

	var tag_only = form.tag_only;
	if (tag_only && tag_only.checked) {
		Twinkle.speedy.callback.evaluateUser(e);
		return;
	}

	var values = Twinkle.speedy.resolveCsdValues(e);
	if (!values) {
		return;
	}
	var templateParams = Twinkle.speedy.getParameters(form, values);
	if (!templateParams) {
		return;
	}

	var normalizeds = values.map(function(value) {
		return Twinkle.speedy.normalizeHash[value];
	});

	// analyse each criterion to determine whether to watch the page, prompt for summary, or notify the creator
	var watchPage, promptForSummary;
	normalizeds.forEach(function(norm) {
		if (Twinkle.getPref('watchSpeedyPages').indexOf(norm) !== -1) {
			watchPage = Twinkle.getPref('watchSpeedyExpiry');
		}
		if (Twinkle.getPref('promptForSpeedyDeletionSummary').indexOf(norm) !== -1) {
			promptForSummary = true;
		}
	});

	var warnusertalk = form.warnusertalk.checked && normalizeds.some(function (norm, index) {
		return Twinkle.getPref('warnUserOnSpeedyDelete').indexOf(norm) !== -1 &&
			!(norm === 'g6' && values[index] !== 'copypaste');
	});

	var welcomeuser = warnusertalk && normalizeds.some(function (norm) {
		return Twinkle.getPref('welcomeUserOnSpeedyDeletionNotification').indexOf(norm) !== -1;
	});

	var params = {
		values: values,
		normalizeds: normalizeds,
		watch: watchPage,
		deleteTalkPage: form.talkpage && form.talkpage.checked,
		deleteRedirects: form.redirects.checked,
		warnUser: warnusertalk,
		welcomeuser: welcomeuser,
		promptForSummary: promptForSummary,
		templateParams: templateParams
	};

	Morebits.simpleWindow.setButtonsEnabled(false);
	Morebits.status.init(form);

	Twinkle.speedy.callbacks.sysop.main(params);
};

Twinkle.speedy.callback.evaluateUser = function twinklespeedyCallbackEvaluateUser(e) {
	var form = e.target.form ? e.target.form : e.target;

	if (e.target.type === 'checkbox' || e.target.type === 'text' ||
			e.target.type === 'select') {
		return;
	}

	var values = Twinkle.speedy.resolveCsdValues(e);
	if (!values) {
		return;
	}
	var templateParams = Twinkle.speedy.getParameters(form, values);
	if (!templateParams) {
		return;
	}

	// var multiple = form.multiple.checked;

	var normalizeds = values.map(function(value) {
		return Twinkle.speedy.normalizeHash[value];
	});

	// analyse each criterion to determine whether to watch the page/notify the creator
	var watchPage = normalizeds.some(function(csdCriteria) {
		return Twinkle.getPref('watchSpeedyPages').indexOf(csdCriteria) !== -1;
	}) && Twinkle.getPref('watchSpeedyExpiry');
	var notifyuser = form.notify.checked && normalizeds.some(function(norm, index) {
		return Twinkle.getPref('notifyUserOnSpeedyDeletionNomination').indexOf(norm) !== -1 &&
			!(norm === 'g6' && values[index] !== 'copypaste');
	});
	var welcomeuser = notifyuser && normalizeds.some(function(norm) {
		return Twinkle.getPref('welcomeUserOnSpeedyDeletionNotification').indexOf(norm) !== -1;
	});
	var csdlog = Twinkle.getPref('logSpeedyNominations') && normalizeds.some(function(norm) {
		return Twinkle.getPref('noLogOnSpeedyNomination').indexOf(norm) === -1;
	});

	var params = {
		values: values,
		normalizeds: normalizeds,
		watch: watchPage,
		usertalk: notifyuser,
		welcomeuser: welcomeuser,
		lognomination: csdlog,
		requestsalt: form.salting.checked,
		templateParams: templateParams
	};

	Morebits.simpleWindow.setButtonsEnabled(false);
	Morebits.status.init(form);

	Morebits.wiki.actionCompleted.redirect = mw.config.get('wgPageName');
	Morebits.wiki.actionCompleted.notice = 'ট্যাগিং সম্পন্ন';

	var wikipedia_page = new Morebits.wiki.page(mw.config.get('wgPageName'), 'পাতায় ট্যাগ যোগ করা হচ্ছে');
	wikipedia_page.setChangeTags(Twinkle.changeTags); // Here to apply to triage
	wikipedia_page.setCallbackParameters(params);
	wikipedia_page.load(Twinkle.speedy.callbacks.user.main);
};

Twinkle.addInitCallback(Twinkle.speedy, 'speedy');
})(jQuery);


// </nowiki>
