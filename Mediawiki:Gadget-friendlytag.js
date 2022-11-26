// <nowiki>

(function($) {


/*
 ****************************************
 *** friendlytag.js: Tag module
 ****************************************
 * Mode of invocation:     Tab ("Tag")
 * Active on:              Existing articles and drafts; file pages with a corresponding file
 *                         which is local (not on Commons); all redirects
 */

Twinkle.tag = function friendlytag() {
	// redirect tagging
	if (Morebits.isPageRedirect()) {
		Twinkle.tag.mode = 'redirect';
		Twinkle.addPortletLink(Twinkle.tag.callback, 'Tag', 'friendly-tag', 'Tag redirect');
	// file tagging
	} else if (mw.config.get('wgNamespaceNumber') === 6 && !document.getElementById('mw-sharedupload') && document.getElementById('mw-imagepage-section-filehistory')) {
		Twinkle.tag.mode = 'file';
		Twinkle.addPortletLink(Twinkle.tag.callback, 'ট্যাগ', 'friendly-tag', 'ফাইলে রক্ষণাবেক্ষণ ট্যাগ যুক্ত করুন');
	// article/draft article tagging
	} else if ([0, 118].indexOf(mw.config.get('wgNamespaceNumber')) !== -1 && mw.config.get('wgCurRevisionId')) {
		Twinkle.tag.mode = 'article';
		// Can't remove tags when not viewing current version
		Twinkle.tag.canRemove = (mw.config.get('wgCurRevisionId') === mw.config.get('wgRevisionId')) &&
			// Disabled on latest diff because the diff slider could be used to slide
			// away from the latest diff without causing the script to reload
			!mw.config.get('wgDiffNewId');
		Twinkle.addPortletLink(Twinkle.tag.callback, 'ট্যাগ', 'friendly-tag', 'নিবন্ধে রক্ষণাবেক্ষণ ট্যাগ যুক্ত করুন');
	}
};

Twinkle.tag.checkedTags = [];

Twinkle.tag.callback = function friendlytagCallback() {
	var Window = new Morebits.simpleWindow(630, Twinkle.tag.mode === 'article' ? 500 : 400);
	Window.setScriptName('টুইংকল');
	// anyone got a good policy/guideline/info page/instructional page link??
	Window.addFooterLink('পছন্দ', 'WP:TW/PREF#ট্যাগ');
	Window.addFooterLink('টুইংকল সাহায্য', 'WP:TW/DOC#tag');
	Window.addFooterLink('প্রতিক্রিয়া জানান', 'WT:TW');

	var form = new Morebits.quickForm(Twinkle.tag.callback.evaluate);

	if (document.getElementsByClassName('patrollink').length) {
            form.append({
                type: 'checkbox',
                list: [
                    {
                        label: 'Mark the page as patrolled/reviewed',
                        value: 'patrol',
                        name: 'patrol',
                        checked: Twinkle.getPref('markTaggedPagesAsPatrolled')
                    }
                ]
            });
        }

	form.append({
		type: 'input',
		label: 'ট্যাগ তালিকা ছাঁকনি:',
		name: 'quickfilter',
		size: '30px',
		event: function twinkletagquickfilter() {
			// flush the DOM of all existing underline spans
			$allCheckboxDivs.find('.search-hit').each(function(i, e) {
				var label_element = e.parentElement;
				// This would convert <label>Hello <span class=search-hit>wo</span>rld</label>
				// to <label>Hello world</label>
				label_element.innerHTML = label_element.textContent;
			});

			if (this.value) {
				$allCheckboxDivs.hide();
				$allHeaders.hide();
				var searchString = this.value;
				var searchRegex = new RegExp(mw.util.escapeRegExp(searchString), 'i');

				$allCheckboxDivs.find('label').each(function () {
					var label_text = this.textContent;
					var searchHit = searchRegex.exec(label_text);
					if (searchHit) {
						var range = document.createRange();
						var textnode = this.childNodes[0];
						range.selectNodeContents(textnode);
						range.setStart(textnode, searchHit.index);
						range.setEnd(textnode, searchHit.index + searchString.length);
						var underline_span = $('<span>').addClass('search-hit').css('text-decoration', 'underline')[0];
						range.surroundContents(underline_span);
						this.parentElement.style.display = 'block'; // show
					}
				});
			} else {
				$allCheckboxDivs.show();
				$allHeaders.show();
			}
		}
	});

	switch (Twinkle.tag.mode) {
		case 'article':
			Window.setTitle('নিবন্ধ রক্ষণাবেক্ষণ ট্যাগ');

			// Object.values is unavailable in IE 11
			var obj_values = Object.values || function (obj) {
				return Object.keys(obj).map(function (key) {
					return obj[key];
				});
			};

			// Build sorting and lookup object flatObject, which is always
			// needed but also used to generate the alphabetical list
			Twinkle.tag.article.flatObject = {};
			obj_values(Twinkle.tag.article.tagList).forEach(function (group) {
				obj_values(group).forEach(function (subgroup) {
					if (Array.isArray(subgroup)) {
						subgroup.forEach(function (item) {
							Twinkle.tag.article.flatObject[item.tag] = item;
						});
					} else {
						Twinkle.tag.article.flatObject[subgroup.tag] = subgroup;
					}
				});
			});


			form.append({
				type: 'select',
				name: 'sortorder',
				label: 'এই তালিকাটি দেখুন:',
				tooltip: 'আপনি যদি আপনার ডিফল্ট ট্যাগের ক্রম পরিবর্তন করতে চান, আপনি তা আপনার টুইংকল পছন্দে (WP:TWPREFS) গিয়ে ঠিক করতে পারেন।',
				event: Twinkle.tag.updateSortOrder,
				list: [
					{ type: 'option', value: 'cat', label: 'বিষয়শ্রেণী বিন্যাস অনুসারে', selected: Twinkle.getPref('tagArticleSortOrder') === 'cat' },
					{ type: 'option', value: 'alpha', label: 'বর্ণানুক্রমিক বিন্যাস', selected: Twinkle.getPref('tagArticleSortOrder') === 'alpha' }
				]
			});


			if (!Twinkle.tag.canRemove) {
				var divElement = document.createElement('div');
				divElement.innerHTML = 'For removal of existing tags, please open Tag menu from the current version of article';
				form.append({
					type: 'div',
					name: 'untagnotice',
					label: divElement
				});
			}

			form.append({
				type: 'div',
				id: 'tagWorkArea',
				className: 'morebits-scrollbox',
				style: 'max-height: 28em'
			});

			form.append({
				type: 'checkbox',
				list: [
					{
						label: 'সম্ভব হলে {{একাধিক সমস্যা}} ট্যাগে সবগুলো যুক্ত করুন',
						value: 'group',
						name: 'group',
						tooltip: 'যদি {{একাধিক সমস্যা}} দ্বারা সমর্থিত দুই বা ততোধিক টেমপ্লেট প্রয়োগ করা হয় এবং এই বাক্সটিতে টিকচিহ্ন দেওয়া হয়, তাহলে সমস্ত সমর্থিত টেমপ্লেটগুলিকে একটি {{একাধিক সমস্যা}} টেমপ্লেটের মধ্যে গ্রুপ করা হবে।',
						checked: Twinkle.getPref('groupByDefault')
					}
				]
			});

			form.append({
				type: 'input',
				label: 'কারণ',
				name: 'reason',
				tooltip: 'সম্পাদনার সারাংশে যুক্ত করার ঐচ্ছিক কারণ।',
				size: '60px'
			});

			break;

		case 'file':
			Window.setTitle('File maintenance tagging');

			$.each(Twinkle.tag.fileList, function(groupName, group) {
				form.append({ type: 'header', label: groupName });
				form.append({ type: 'checkbox', name: 'tags', list: group });
			});

			if (Twinkle.getPref('customFileTagList').length) {
				form.append({ type: 'header', label: 'Custom tags' });
				form.append({ type: 'checkbox', name: 'tags', list: Twinkle.getPref('customFileTagList') });
			}
			break;

		case 'redirect':
			Window.setTitle('Redirect tagging');

			var i = 1;
			$.each(Twinkle.tag.redirectList, function(groupName, group) {
				form.append({ type: 'header', id: 'tagHeader' + i, label: groupName });
				var subdiv = form.append({ type: 'div', id: 'tagSubdiv' + i++ });
				$.each(group, function(subgroupName, subgroup) {
					subdiv.append({ type: 'div', label: [ Morebits.htmlNode('b', subgroupName) ] });
					subdiv.append({
						type: 'checkbox',
						name: 'tags',
						list: subgroup.map(function (item) {
							return { value: item.tag, label: '{{' + item.tag + '}}: ' + item.description, subgroup: item.subgroup };
						})
					});
				});
			});

			if (Twinkle.getPref('customRedirectTagList').length) {
				form.append({ type: 'header', label: 'Custom tags' });
				form.append({ type: 'checkbox', name: 'tags', list: Twinkle.getPref('customRedirectTagList') });
			}
			break;

		default:
			alert('Twinkle.tag: unknown mode ' + Twinkle.tag.mode);
			break;
	}

	form.append({ type: 'submit', className: 'tw-tag-submit' });

	var result = form.render();
	Window.setContent(result);
	Window.display();

	// for quick filter:
	$allCheckboxDivs = $(result).find('[name$=tags]').parent();
	$allHeaders = $(result).find('h5, .quickformDescription');
	result.quickfilter.focus();  // place cursor in the quick filter field as soon as window is opened
	result.quickfilter.autocomplete = 'off'; // disable browser suggestions
	result.quickfilter.addEventListener('keypress', function(e) {
		if (e.keyCode === 13) { // prevent enter key from accidentally submitting the form
			e.preventDefault();
			return false;
		}
	});

	if (Twinkle.tag.mode === 'article') {

		Twinkle.tag.alreadyPresentTags = [];

		if (Twinkle.tag.canRemove) {
			// Look for existing maintenance tags in the lead section and put them in array

			// All tags are HTML table elements that are direct children of .mw-parser-output,
			// except when they are within {{multiple issues}}
			$('.mw-parser-output').children().each(function parsehtml(i, e) {

				// break out on encountering the first heading, which means we are no
				// longer in the lead section
				if (e.tagName === 'H2') {
					return false;
				}

				// The ability to remove tags depends on the template's {{ambox}} |name=
				// parameter bearing the template's correct name (preferably) or a name that at
				// least redirects to the actual name

				// All tags have their first class name as "box-" + template name
				if (e.className.indexOf('box-') === 0) {
					if (e.classList[0] === 'box-Multiple_issues') {
						$(e).find('.ambox').each(function(idx, e) {
							if (e.classList[0].indexOf('box-') === 0) {
								var tag = e.classList[0].slice('box-'.length).replace(/_/g, ' ');
								Twinkle.tag.alreadyPresentTags.push(tag);
							}
						});
						return true; // continue
					}

					var tag = e.classList[0].slice('box-'.length).replace(/_/g, ' ');
					Twinkle.tag.alreadyPresentTags.push(tag);
				}
			});

			// {{বিষয়শ্রেণীহীন}} and {{বিষয়শ্রেণী উন্নয়ন}} are usually placed at the end
			if ($('.box-বিষয়শ্রেণীহীন').length) {
				Twinkle.tag.alreadyPresentTags.push('বিষয়শ্রেণীহীন');
			}
			if ($('.box-Improve_categories').length) {
				Twinkle.tag.alreadyPresentTags.push('বিষয়শ্রেণী উন্নয়ন');
			}

		}

		// Add status text node after Submit button
		var statusNode = document.createElement('small');
		statusNode.id = 'tw-tag-status';
		Twinkle.tag.status = {
			// initial state; defined like this because these need to be available for reference
			// in the click event handler
			numAdded: 0,
			numRemoved: 0
		};
		$('button.tw-tag-submit').after(statusNode);

		// fake a change event on the sort dropdown, to initialize the tag list
		var evt = document.createEvent('Event');
		evt.initEvent('change', true, true);
		result.sortorder.dispatchEvent(evt);

	} else {
		// Redirects and files: Add a link to each template's description page
		Morebits.quickForm.getElements(result, 'tags').forEach(generateLinks);
	}
};


// $allCheckboxDivs and $allHeaders are defined globally, rather than in the
// quickfilter event function, to avoid having to recompute them on every keydown
var $allCheckboxDivs, $allHeaders;

Twinkle.tag.updateSortOrder = function(e) {
	var form = e.target.form;
	var sortorder = e.target.value;
	Twinkle.tag.checkedTags = form.getChecked('tags');

	var container = new Morebits.quickForm.element({ type: 'fragment' });

	// function to generate a checkbox, with appropriate subgroup if needed
	var makeCheckbox = function (item) {
		var tag = item.tag, description = item.description;
		var checkbox = { value: tag, label: '{{' + tag + '}}: ' + description };
		if (Twinkle.tag.checkedTags.indexOf(tag) !== -1) {
			checkbox.checked = true;
		}
		checkbox.subgroup = item.subgroup;
		return checkbox;
	};

	var makeCheckboxesForAlreadyPresentTags = function() {
		container.append({ type: 'header', id: 'tagHeader0', label: 'ইতিমধ্যে বিদ্যমান ট্যাগ' });
		var subdiv = container.append({ type: 'div', id: 'tagSubdiv0' });
		var checkboxes = [];
		var unCheckedTags = e.target.form.getUnchecked('existingTags');
		Twinkle.tag.alreadyPresentTags.forEach(function(tag) {
			var checkbox =
				{
					value: tag,
					label: '{{' + tag + '}}' + (Twinkle.tag.article.flatObject[tag] ? ': ' + Twinkle.tag.article.flatObject[tag].description : ''),
					checked: unCheckedTags.indexOf(tag) === -1,
					style: 'font-style: italic'
				};

			checkboxes.push(checkbox);
		});
		subdiv.append({
			type: 'checkbox',
			name: 'existingTags',
			list: checkboxes
		});
	};


	if (sortorder === 'cat') { // categorical sort order
		// function to iterate through the tags and create a checkbox for each one
		var doCategoryCheckboxes = function(subdiv, subgroup) {
			var checkboxes = [];
			$.each(subgroup, function(k, item) {
				if (Twinkle.tag.alreadyPresentTags.indexOf(item.tag) === -1) {
					checkboxes.push(makeCheckbox(item));
				}
			});
			subdiv.append({
				type: 'checkbox',
				name: 'tags',
				list: checkboxes
			});
		};

		if (Twinkle.tag.alreadyPresentTags.length > 0) {
			makeCheckboxesForAlreadyPresentTags();
		}
		var i = 1;
		// go through each category and sub-category and append lists of checkboxes
		$.each(Twinkle.tag.article.tagList, function(groupName, group) {
			container.append({ type: 'header', id: 'tagHeader' + i, label: groupName });
			var subdiv = container.append({ type: 'div', id: 'tagSubdiv' + i++ });
			if (Array.isArray(group)) {
				doCategoryCheckboxes(subdiv, group);
			} else {
				$.each(group, function(subgroupName, subgroup) {
					subdiv.append({ type: 'div', label: [ Morebits.htmlNode('b', subgroupName) ] });
					doCategoryCheckboxes(subdiv, subgroup);
				});
			}
		});
	} else { // alphabetical sort order
		if (Twinkle.tag.alreadyPresentTags.length > 0) {
			makeCheckboxesForAlreadyPresentTags();
			container.append({ type: 'header', id: 'tagHeader1', label: 'Available tags' });
		}

		// Avoid repeatedly resorting
		Twinkle.tag.article.alphabeticalList = Twinkle.tag.article.alphabeticalList || Object.keys(Twinkle.tag.article.flatObject).sort();
		var checkboxes = [];
		Twinkle.tag.article.alphabeticalList.forEach(function(tag) {
			if (Twinkle.tag.alreadyPresentTags.indexOf(tag) === -1) {
				checkboxes.push(makeCheckbox(Twinkle.tag.article.flatObject[tag]));
			}
		});
		container.append({
			type: 'checkbox',
			name: 'tags',
			list: checkboxes
		});
	}

	// append any custom tags
	if (Twinkle.getPref('customTagList').length) {
		container.append({ type: 'header', label: 'Custom tags' });
		container.append({ type: 'checkbox', name: 'tags',
			list: Twinkle.getPref('customTagList').map(function(el) {
				el.checked = Twinkle.tag.checkedTags.indexOf(el.value) !== -1;
				return el;
			})
		});
	}

	var $workarea = $(form).find('#tagWorkArea');
	var rendered = container.render();
	$workarea.empty().append(rendered);

	// for quick filter:
	$allCheckboxDivs = $workarea.find('[name=tags], [name=existingTags]').parent();
	$allHeaders = $workarea.find('h5, .quickformDescription');
	form.quickfilter.value = ''; // clear search, because the search results are not preserved over mode change
	form.quickfilter.focus();

	// style adjustments
	$workarea.find('h5').css({ 'font-size': '110%' });
	$workarea.find('h5:not(:first-child)').css({ 'margin-top': '1em' });
	$workarea.find('div').filter(':has(span.quickformDescription)').css({ 'margin-top': '0.4em' });

	Morebits.quickForm.getElements(form, 'existingTags').forEach(generateLinks);
	Morebits.quickForm.getElements(form, 'tags').forEach(generateLinks);

	// tally tags added/removed, update statusNode text
	var statusNode = document.getElementById('tw-tag-status');
	$('[name=tags], [name=existingTags]').click(function() {
		if (this.name === 'tags') {
			Twinkle.tag.status.numAdded += this.checked ? 1 : -1;
		} else if (this.name === 'existingTags') {
			Twinkle.tag.status.numRemoved += this.checked ? -1 : 1;
		}

		var firstPart = '' + Twinkle.tag.status.numAdded + 'টি ট্যাগ যুক্ত করা হচ্ছে' + (Twinkle.tag.status.numAdded > 1 ? '' : '');
		var secondPart = '' + Twinkle.tag.status.numRemoved + 'টি ট্যাগ সরানো হচ্ছে' + (Twinkle.tag.status.numRemoved > 1 ? '' : '');
		statusNode.textContent =
			(Twinkle.tag.status.numAdded ? '  ' + firstPart : '') +
			(Twinkle.tag.status.numRemoved ? (Twinkle.tag.status.numAdded ? '; ' : '  ') + secondPart : '');
	});
};

/**
 * Adds a link to each template's description page
 * @param {Morebits.quickForm.element} checkbox  associated with the template
 */
var generateLinks = function(checkbox) {
	var link = Morebits.htmlNode('a', '>');
	link.setAttribute('class', 'tag-template-link');
	var tagname = checkbox.values;
	link.setAttribute('href', mw.util.getUrl(
		(tagname.indexOf(':') === -1 ? 'টেমপ্লেট:' : '') +
		(tagname.indexOf('|') === -1 ? tagname : tagname.slice(0, tagname.indexOf('|')))
	));
	link.setAttribute('target', '_blank');
	$(checkbox).parent().append(['\u00A0', link]);
};


// Tags for ARTICLES start here
Twinkle.tag.article = {};

// Shared across {{Rough translation}} and {{Not English}}
var translationSubgroups = [
	{
		name: 'translationLanguage',
		parameter: '1',
		type: 'input',
		label: 'নিবন্ধটির ভাষার নাম (যদি জানা থাকে):',
		tooltip: 'নিবন্ধটি যে ভাষায় লেখা হয়েছে বলে মনে করেন দয়া করে তার নাম লিখুন। যদি আপনি সম্পূর্ণ নিশ্চিত না হন, দয়া করে এই বাক্সটি ফাঁকা রাখুন।'
	}
].concat(mw.config.get('wgNamespaceNumber') === 0 ? [
	{
		type: 'checkbox',
		list: [ {
			name: 'translationPostAtPNT',
			label: 'List this article at Wikipedia:Pages needing translation into English (PNT)',
			checked: true
		} ]
	},
	{
		name: 'translationComments',
		type: 'textarea',
		label: 'Additional comments to post at PNT',
		tooltip: 'Optional, and only relevant if "List this article ..." above is checked.'
	}
] : []);

// Subgroups for {{merge}}, {{merge-to}} and {{merge-from}}
var getMergeSubgroups = function(tag) {
	var otherTagName = 'Merge';
	switch (tag) {
		case 'Merge from':
			otherTagName = 'Merge to';
			break;
		case 'Merge to':
			otherTagName = 'Merge from';
			break;
		// no default
	}
	return [
		{
			name: 'mergeTarget',
			type: 'input',
			label: 'অন্য নিবন্ধ(সমূহ)-এর নাম:',
			tooltip: 'দয়া করে একত্রীকরণের সাথে জড়িত অন্য নিবন্ধের(সমূহ) নাম লিখুন। একাধিক নিবন্ধের নাম উল্লেখ করতে, একটি উল্লম্ব পাইপ (|) অক্ষর দিয়ে তাদের আলাদা করুন।',
			required: true
		},
		{
			type: 'checkbox',
			list: [
				{
					name: 'mergeTagOther',
					label: 'অন্য নিবন্ধে {{' + otherTagName + '}} ট্যাগ যুক্ত করুন',
					checked: true,
					tooltip: 'শুধুমাত্র একটি নিবন্ধের নাম লিখলে দেখা যাবে।'
				}
			]
		}
	].concat(mw.config.get('wgNamespaceNumber') === 0 ? {
		name: 'mergeReason',
		type: 'textarea',
		label: 'একত্রীকরণ করার যুক্তি (' +
			(tag === 'Merge to' ? 'অন্য নিবন্ধে' : 'এই নিবন্ধটির') + ' আলাপ পাতায় পোস্ট করা হবে):',
		tooltip: 'ঐচ্ছিক, কিন্তু দৃঢ়ভাবে প্রস্তাবিত। না চাইলে ফাঁকা রাখুন। শুধুমাত্র একটি নিবন্ধের নাম লিখলে দেখা যাবে।'
	} : []);
};

// Tags arranged by category; will be used to generate the alphabetical list,
// but tags should be in alphabetical order within the categories
// excludeMI: true indicate a tag that *does not* work inside {{multiple issues}}
// Add new categories with discretion - the list is long enough as is!
Twinkle.tag.article.tagList = {
	'পরিষ্করণ এবং রক্ষণাবেক্ষণ ট্যাগ': {
		'সাধারণ পরিষ্করণ': [
			{
				tag: 'পরিষ্করণ', description: 'নিবন্ধটিকে পরিষ্কার করা প্রয়োজন।',
				subgroup: {
					name: 'cleanup',
					parameter: 'reason',
					type: 'input',
					label: 'নিবন্ধটি কেন পরিষ্করণ প্রয়োজন তার সুনির্দিষ্ট কারণ দয়া করে লিখুন:',
					tooltip: 'Required.',
					size: 35,
					required: true
				}
			},  // has a subgroup with text input
			{
				tag: 'অনুলিপি সম্পাদনা',
				description: "উইকিপিডিয়ার মানদণ্ড উত্তীর্ণের জন্য অনুলিপি সম্পাদনা করা প্রয়োজন।"
			},
			{
				tag: 'রচনা সংশোধন',
				description: 'ব্যাকরণ, রচনাশৈলী, বানান বা বর্ণনাভঙ্গিগতর জন্য রচনা সংশোধনের প্রয়োজন।',
				subgroup: {
					name: 'copyEdit',
					parameter: 'for',
					type: 'input',
					label: '"নিবন্ধটিতে এর জন্য রচনা সংশোধনের প্রয়োজন হতে পারে..."',
					tooltip: 'e.g. "consistent spelling". Optional.',
					size: 35
				}
			}  // has a subgroup with text input
		],
		'সম্ভাব্য অবাঞ্ছিত বিষয়বস্তু': [
			{
				tag: 'Close paraphrasing',
				description: 'নিবন্ধটিতে অনেক কপিরাইট যুক্ত উক্তি দ্বারা লেখা হয়েছে।',
				subgroup: {
					name: 'closeParaphrasing',
					parameter: 'source',
					type: 'input',
					label: 'উৎস:',
					tooltip: 'উৎস যা ঘনিষ্ঠভাবে ব্যাখ্যা করা হয়েছে'
				}
			},
			{
				tag: 'অনুলিপি প্রতিলেপন',
				description: 'নিবন্ধটির উপাদান বা উপাত্ত কোনো উৎস থেকে প্রতিলিপি করে এখানে আনা হয়েছে।',
				excludeMI: true,
				subgroup: {
					name: 'copypaste',
					parameter: 'url',
					type: 'input',
					label: 'উৎস:',
					tooltip: 'যদি জানা থাকে।',
					size: 50
				}
			},  // has a subgroup with text input
			{ tag: 'বহিঃসংযোগসমূহ', description: 'নিবন্ধটিতে অনেক বহিঃসংযোগ আছে যা উইকিপিডিয়ার রচনাশৈলী অনুযায়ী নয়।' },
			{ tag: 'অ-উন্মুক্ত', description: 'নিবন্ধে কপিরাইটকৃত উপাদানের অত্যাধিক অথবা অনুপযুক্ত ব্যবহার রয়েছে।' }
		],
		'গঠন, বিন্যাস, এবং শীর্ষ অনুচ্ছেদ': [
			{ tag: 'পরিষ্করণ-পুনঃসংগঠন', description: "নিবন্ধটিকে পরিষ্কার করে উইকিপিডিয়ার রচনাশৈলী অনুযায়ী পুনঃবিন্যাস করা প্রয়োজন।" },
			{ tag: 'ভূমিকাংশ অনুপস্থিত', description: 'নিবন্ধটিতে ভূমিকাংশ অনুপস্থিত' },
			{ tag: 'ভূমিকাংশ পুনর্লিখন', description: 'নীতিমালার সাথে মিল রেখে নিবন্ধের ভূমিকাংশটি পূণঃলিখন করা প্রয়োজন।' },
			{ tag: 'ভূমিকাংশ অতি দীর্ঘ', description: 'নিবন্ধটিতে ভূমিকা অনুচ্ছেদটি অনেক বড় যা সংক্ষিপ্ত করা প্রয়োজন।' },
			{ tag: 'ভূমিকাংশ খুবই সংক্ষিপ্ত', description: 'নিবন্ধটিতে ভূমিকা অনুচ্ছেদটি খুব ছোট যা সম্প্রসারণ করা প্রয়োজন।' },
			{ tag: 'অনুচ্ছেদসমূহ', description: 'প্রসঙ্গ অনুযায়ী নিবন্ধটিকে অনুচ্ছেদে ভাগ করা উচিত।' },
			{ tag: 'অতিরিক্ত অনুচ্ছেদসমূহ', description: 'নিবন্ধটিতে অতিরিক্ত অনুচ্ছেদসমূহ রয়েছে, এর মধ্যে কিছু অপসারণ করা উচিত।' },
			{ tag: 'খুব দীর্ঘ', description: 'নিবন্ধটি আকারে অনেক বড়।' },
            { tag: 'ছোট নিবন্ধ', description: 'নিবন্ধটি আকারে অনেক ছোট।' }
		],
		'অলীক কাহিনী সংক্রান্ত পরিষ্করণ': [
			{ tag: 'পুরোটাই দৃশ্যপট', description: 'নিবন্ধটি প্রায় পুরোটাই একটা দৃশ্যপট।' },
			{ tag: 'কাল্পনিক', description: 'নিবন্ধটি তথ্যপূর্ণ না হয়ে একটি উপন্যাসের মত লেখা হয়েছে।' },
			{ tag: 'In-universe', description: 'নিবন্ধের বিষয় কাল্পনিক এবং একটি অ-কাল্পনিক দৃষ্টিকোণ থেকে পূণঃলিখন প্রয়োজন।' },
			{ tag: 'Plot', description: 'নিবন্ধের প্লট সারসংক্ষেপ অত্যন্ত দীর্ঘ।' }
		]
	},
	'সাধারণ বিষয়বস্তু সমস্যা': {
		'গুরুত্ব এবং উল্লেখযোগ্যতা': [
			{ tag: 'উল্লেখযোগ্যতা', description: 'নিবন্ধের বিষয়বস্তু উল্লেখযোগ্যতার সাধারণ নির্দেশাবলী অনুসরণ করেনি',
				subgroup: {
					name: 'notability',
					parameter: '1',
					type: 'select',
					list: [
						{ label: "{{উল্লেখযোগ্যতা}}: নিবন্ধের বিষয়বস্তু উল্লেখযোগ্যতার সাধারণ নির্দেশাবলী অনুসরণ করে নাই", value: '' },
						{ label: '{{উল্লেখযোগ্যতা|একাডেমি}}: নিবন্ধের বিষয়বস্তু উল্লেখযোগ্যতার সাধারণ নির্দেশাবলী অনুসরণ করে নাই', value: 'Academics' },
						{ label: '{{উল্লেখযোগ্যতা|জীবনী}}: নিবন্ধের বিষয়বস্তু উল্লেখযোগ্যতার সাধারণ নির্দেশাবলী অনুসরণ করে নাই', value: 'Biographies' },
						{ label: '{{উল্লেখযোগ্যতা|বই}}: নিবন্ধের বিষয়বস্তু উল্লেখযোগ্যতার সাধারণ নির্দেশাবলী অনুসরণ করে নাই', value: 'Books' },
						{ label: '{{উল্লেখযোগ্যতা|কোম্পানি}}: নিবন্ধের বিষয়বস্তু উল্লেখযোগ্যতার সাধারণ নির্দেশাবলী অনুসরণ করে নাই', value: 'Companies' },
						{ label: '{{উল্লেখযোগ্যতা|ঘটনা}}: নিবন্ধের বিষয়বস্তু উল্লেখযোগ্যতার সাধারণ নির্দেশাবলী অনুসরণ করে নাই', value: 'Events' },
						{ label: '{{উল্লেখযোগ্যতা|চলচ্চিত্র}}: নিবন্ধের বিষয়বস্তু উল্লেখযোগ্যতার সাধারণ নির্দেশাবলী অনুসরণ করে নাই', value: 'Films' },
						{ label: '{{উল্লেখযোগ্যতা|সঙ্গীত}}: নিবন্ধের বিষয়বস্তু উল্লেখযোগ্যতার সাধারণ নির্দেশাবলী অনুসরণ করে নাই', value: 'Music' },
						{ label: '{{উল্লেখযোগ্যতা|নবশব্দ}}: নিবন্ধের বিষয়বস্তু উল্লেখযোগ্যতার সাধারণ নির্দেশাবলী অনুসরণ করে নাই', value: 'Neologisms' },
						{ label: '{{উল্লেখযোগ্যতা|সংখ্যা}}: নিবন্ধের বিষয়বস্তু উল্লেখযোগ্যতার সাধারণ নির্দেশাবলী অনুসরণ করে নাই', value: 'Numbers' },
						{ label: '{{উল্লেখযোগ্যতা|পণ্য}}: নিবন্ধের বিষয়বস্তু উল্লেখযোগ্যতার সাধারণ নির্দেশাবলী অনুসরণ করে নাই', value: 'Products' },
						{ label: '{{উল্লেখযোগ্যতা|খেলা}}: নিবন্ধের বিষয়বস্তু উল্লেখযোগ্যতার সাধারণ নির্দেশাবলী অনুসরণ করে নাই', value: 'Sports' },
						{ label: '{{উল্লেখযোগ্যতা|ওয়েব}}: নিবন্ধের বিষয়বস্তু উল্লেখযোগ্যতার সাধারণ নির্দেশাবলী অনুসরণ করে নাই', value: 'Web' }
					]
				}
			}
		],
		'রচনাশৈলী': [
			{ tag: 'বিজ্ঞাপন', description: 'নিবন্ধটি বিজ্ঞাপনের মতো করে লেখা।' },
			{ tag: 'রচনানুগ', description: 'নিবন্ধটি অনেকটা প্রবন্ধের মত করে লেখা হয়েছে।' },
			{ tag: 'fansite', description: "নিবন্ধটি অনুরাগীসাইটের সঙ্গে মিলে যাচ্ছে।" },
			{ tag: 'গদ্য', description: 'নিবন্ধটি একটি তালিকা বিন্যাসে আছে যা গদ্য ব্যবহার করে উপস্থাপন করলে ভালো হতে পারে।' },
			{ tag: 'কারিগরি পরিভাষার আধিক্য', description: 'নিবন্ধটি অদীক্ষিত পাঠকের জন্য খুব প্রযুক্তিমূলক হতে পারে।' },
			{ tag: 'tense', description: 'নিবন্ধটি ভুল ক্রিয়ার কালে লিখিত।' },
			{ tag: 'বর্ণনা ভঙ্গি', description: 'নিবন্ধের সুর/ধ্বনি উপযুক্ত নয়।' }
		],
		'জ্ঞান (বা তার অভাব)': [
			{ tag: 'বিভ্রান্তিকর', description: 'নিবন্ধটিতে কিছু বিভ্রান্তি আছে বা বিষয় পরিষ্কার নয়।' },
			{ tag: 'অসংলগ্ন', description: 'নিবন্ধটি অসংলগ্ন বা বুঝতে কষ্ট হচ্ছে।' }
		],
		'তথ্য এবং বিস্তারিত': [
			{ tag: 'context', description: 'নিবন্ধটিতে প্রসঙ্গ যাচাই করার জন্য যথেষ্ট পরিমান তথ্য নেই।' },
			{ tag: 'expert-subject', description: 'নিবন্ধটিতে এই বিষয় সম্পর্কে একজন বিশেষজ্ঞ ব্যক্তির মনোনিবেশ প্রয়োজন।' }
		],
		'সময়োপযোগিতা': [
			{ tag: 'মেয়াদউত্তীর্ণ', description: 'নিবন্ধের অপ্রচলিত তথ্য সরানো অথবা হালনাগাদ করা প্রয়োজন।', excludeMI: true },
			{ tag: 'হালনাগাদ', description: 'নিবন্ধটিতে হালনাগাদকৃত অতিরিক্ত তথ্য যোগ করা প্রয়োজন।' }
		],
		'নিরপেক্ষতা, পক্ষপাত, এবং প্রকৃত সঠিকতা': [
			{ tag: 'আত্মজীবনী', description: 'নিবন্ধটি একটি আত্মজীবনীমূলক এবং সম্ভবত নিরপেক্ষভাবে লিখিত নয়।' },
			{ tag: 'COI', description: 'নিবন্ধটির সৃষ্টিকারী বা প্রধান অবদানকারীর ব্যক্তিগত স্বার্থের সহিত নিবন্ধের বিষয়বস্তু জড়িত।' },
			{ tag: 'বিতর্কিত', description: 'নিবন্ধটিতে বিতর্কিত বিষয়বস্তু আছে।' },
			{ tag: 'Hoax', description: 'নিবন্ধটি সম্পূর্ণ ধোঁকাবাজি হতে পারে।' },
			{ tag: 'বৈশ্বিক দৃষ্টিভঙ্গি', description: 'নিবন্ধটির বিষয়বস্তু ও উদাহরণ বিশ্বব্যাপী ধারণকে উপস্থাপিত করেনি।' },
			{ tag: 'Peacock', description: 'নিবন্ধে আত্মশ্লাঘাকারী পদ থাকতে পারে যা তথ্য যোগ ছাড়া বিষয়কে প্রচার করছে।' },
			{ tag: 'নিরপেক্ষতা', description: 'নিবন্ধটি নিরপেক্ষ দৃষ্টিভঙ্গি বজায় রাখে নি।' },
			{ tag: 'Recentism', description: 'নিবন্ধটিতে সাম্প্রতিক ঘটনা দিকে তির্যকভাবে উপস্থাপিত।' },
			{ tag: 'Too few opinions', description: 'নিবন্ধ সব গুরুত্বপূর্ণ দৃষ্টিভঙ্গি নাও অন্তর্ভুক্ত করতে পারে।' },
			{ tag: 'Weasel', description: 'নিবন্ধটিতে কিছু অগ্রহনযোগ্য শব্দ আছে যা উইকিপিডিয়ার রচনাশৈলী মতে ঠিক নয়।' }
		],
		'যাচাইযোগ্যতা এবং উত্স': [
			{ tag: 'জী-ব্য-জী তথ্যসূত্র', description: 'জীবিত ব্যক্তির জীবনী যেখানে যাচাই করার জন্য অতিরিক্ত তথ্যসূত্র প্রয়োজন।' },
			{ tag: 'জী-ব্য-জী উৎসহীন', description: 'জীবিত ব্যক্তির জীবনী যেখানে কোনো তথ্যসূত্র উল্লেখিত হয়নি।' },
			{ tag: 'একটি উৎস', description: 'নিবন্ধটির একটা বড়সড় অংশ কিংবা সম্পূর্ণ অংশই একটিমাত্র সূত্রের উপর নির্ভরশীল।' },
			{ tag: 'মৌলিক গবেষণা', description: 'নিবন্ধে মৌলিক গবেষণাযুক্ত বা যাচাইবিহীনভাবে দাবিকৃত উপাদান রয়েছে।' },
			{ tag: 'প্রাথমিক উৎস', description: 'নিবন্ধটি প্রাথমিক সূত্রের উপর খুব বেশী নির্ভরশীল, এবং তৃতীয় পক্ষের সূত্র প্রয়োজন।' },
			{ tag: 'সূত্র উন্নতি', description: 'নিবন্ধের যাচাইযোগ্যতার জন্য অতিরিক্ত তথ্যসূত্র প্রয়‌োজন।' },
			{ tag: 'স্বপ্রকাশিত', description: 'নিবন্ধে স্বপ্রকাশিত উত্স থেকে ভ্রান্ত তথ্যসূত্র থাকতে পারে।' },
			{ tag: 'উৎসহীন', description: 'নিবন্ধে কোন তথ্যসূত্র নেই।' },
			{ tag: 'অনির্ভরযোগ্য তথ্যসূত্র', description: 'নিবন্ধের তথ্যসূত্র নির্ভরযোগ্য সূত্রের নাও হতে পারে।' }
		]
	},
	'নির্দিষ্ট বিষয়বস্তু সমস্যা': {
		'ভাষা': [
			{ tag: 'বাংলা নয়', description: 'নিবন্ধটি বাংলা ভাষায় লিখিত নয় এবং অনুবাদ করা প্রয়োজন',
				excludeMI: true,
				subgroup: translationSubgroups.slice(0, 1).concat([{
					type: 'checkbox',
					list: [
						{
							name: 'translationNotify',
							label: 'নিবন্ধটির রচয়িতাকে অবহিত করুন',
							checked: true,
							tooltip: "রচয়িতার আলাপ পাতায় {{Uw-notbangla}} প্রদান করুন।"
						}
					]
				}]).concat(translationSubgroups.slice(1))
			},
			{ tag: 'যান্ত্রিক অনুবাদ', description: 'নিবন্ধটি একটি খসড়া অনুবাদ যাকে পরিষ্কার করা প্রয়োজন', excludeMI: true,
				subgroup: translationSubgroups
			},
			{ tag: 'ভাষা সম্প্রসারণ', description: 'নিবন্ধটি একটি বিদেশী ভাষার উইকিপিডিয়া থেকে উপাদান দিয়ে প্রসারিত করা যায়',
				excludeMI: true,
				subgroup: [{
					type: 'hidden',
					name: 'expandLangTopic',
					parameter: 'topic',
					value: '',
					required: true // force empty topic param in output
				}, {
					name: 'expandLanguageLangCode',
					parameter: 'langcode',
					type: 'input',
					label: 'দয়া করে অন্য উইকির ভাষা কোডটি লিখুন (উদা. "en", "it")।:',
					tooltip: 'যে নিবন্ধ থেকে সম্প্রসারিত করা হবে তার ভাষার কোড',
					required: true
				}, {
					name: 'expandLanguageArticle',
					parameter: 'otherarticle',
					type: 'input',
					label: 'নিবন্ধের নাম:',
					tooltip: 'যে নিবন্ধ থেকে সম্প্রসারিত করা সে নিবন্ধের নাম'
				}]
			}
		],
		'লিংক': [
			{ tag: 'সংযোগহীন', description: 'নিবন্ধটিতে অন্য নিবন্ধের সাথে কোনো সংযোগ নেই বা খুব কম আছে।' },
			{ tag: 'অসংযুক্ত', description: 'নিবন্ধটি অন্য কোন নিবন্ধের সাথে সংযুক্ত নেই' },
			{ tag: 'অতিরিক্ত সংযোগ', description: 'নিবন্ধে অনেক সদৃশ এবং/অথবা অপ্রাসঙ্গিক লিঙ্ক থাকতে পারে' },
			{ tag: 'কমসংযুক্ত', description: 'নিবন্ধে আরও উইকিসংযোগ প্রয়োজন' }
		],
		'তথ্যসূত্রের কৌশল': [
			{ tag: 'উদ্ধৃতিদান শৈলী', description: 'নিবন্ধে তথ্যসূত্র উদ্ধৃতিদান শৈলী ঠিক নেই' },
			{ tag: 'খালি ইউআরএল পরিষ্কারকরণ', description: 'তথ্যসূত্রের জন্য খালি ইউআরএল ব্যবহার করা হয়েছে, যা মূল লিংকের সাথে সঙ্গতিপূর্ণ' },
			{ tag: 'আরও পাদটীকা', description: 'নিবন্ধে কিছু তথ্যসূত্র রয়েছে কিন্তু অপর্যাপ্ত ইন-টেক্সট উদ্ধৃতি রয়েছে' },
			{ tag: 'পাদটীকা নেই', description: 'নিবন্ধে তথ্যসূত্র রয়েছে কিন্তু কোন পদটীকা নেই' }
		],
		'বিষয়শ্রেণী': [
			{ tag: 'বিষয়শ্রেণী উন্নয়ন', description: 'নিবন্ধে আরও বিষয়শ্রেণী যোগ করা প্রয়োজন', excludeMI: true },
			{ tag: 'বিষয়শ্রেণীহীন', description: 'বিষয়শ্রেণীবিহীন নিবন্ধ', excludeMI: true }
		]
	},
	'Merge': [
		{
			tag: 'ইতিহাস একীকরণ',
			description: 'নিবন্ধটি অন্য একটি নিবন্ধের সাথে ইতিহাস একত্র করা প্রয়োজন',
			excludeMI: true,
			subgroup: [
				{
					name: 'histmergeOriginalPage',
					parameter: 'originalpage',
					type: 'input',
					label: 'অন্য নিবন্ধটির নাম:',
					tooltip: 'যে পাতাটির ইতিহাস এই পাতায় একত্র করা হবে (আবশ্যিক).',
					required: true
				},
				{
					name: 'histmergeReason',
					parameter: 'reason',
					type: 'input',
					label: 'কারণ:',
					tooltip: 'ইতিহাস একত্র করার কারণ বর্ণনা করে সংক্ষিপ্ত ব্যাখ্যা দিন। ব্যাখ্যাটি "কারণ" দিয়ে শুরু এবং দাঁড়ি দিয়ে শেষ করা উচিত।'
				},
				{
					name: 'histmergeSysopDetails',
					parameter: 'details',
					type: 'input',
					label: 'অতিরিক্ত তথ্য:',
					tooltip: 'জটিল ক্ষেত্রে, পর্যালোচনা প্রশাসকের জন্য অতিরিক্ত নির্দেশাবলী প্রদান করুন।'
				}
			]
		},
		{ tag: 'Merge', description: 'নিবন্ধটি অন্য একটি নিবন্ধের সাথে একত্রীকরণ করা প্রয়োজন', excludeMI: true,
			subgroup: getMergeSubgroups('Merge') },
		{ tag: 'Merge from', description: 'অন্য একটি নিবন্ধকে এই নিবন্ধের সাথে একত্রীকরণ করা প্রয়োজন', excludeMI: true,
			subgroup: getMergeSubgroups('Merge from') },
		{ tag: 'Merge to', description: 'নিবন্ধটি অন্য একটি নিবন্ধের সাথে একত্রীকরণ করা প্রয়োজন', excludeMI: true,
			subgroup: getMergeSubgroups('Merge to') }
	],
	'বিজ্ঞপ্তি সংক্রান্ত': [
		{ tag: 'রসনিমা কাজ চলছে', description: 'নিবন্ধটিতে বর্তমানে পুনঃলিখন সম্পাদকদের নির্দেশনায় একটি বড় ধরনের পুনঃলিখন চলছে', excludeMI: true },
		{ tag: 'ব্যবহৃত হচ্ছে', description: 'নিবন্ধটিতে কিছু সময়ের জন্য বড় ধরণের সম্পাদনা চলছে', excludeMI: true },
		{ tag: 'কাজ চলছে', description: 'নিবন্ধটি বর্তমানে সম্প্রসারণ বা বড় ধরনের পুনর্গঠনের মধ্যে রয়েছে', excludeMI: true },
        { tag: 'নতুন অপর্যালোচিত নিবন্ধ', description: 'এই পৃষ্ঠাটি একটি নতুন অপর্যালোচিত নিবন্ধ', excludeMI: true }
	]
};

// Tags for REDIRECTS start here
// Not by policy, but the list roughly approximates items with >500
// transclusions from Template:R template index
Twinkle.tag.redirectList = {
	'Grammar, punctuation, and spelling': {
		'Abbreviation': [
			{ tag: 'R from acronym', description: 'redirect from an acronym (e.g. POTUS) to its expanded form' },
			{ tag: 'R from initialism', description: 'redirect from an initialism (e.g. AGF) to its expanded form' },
			{ tag: 'R from MathSciNet abbreviation', description: 'redirect from MathSciNet publication title abbreviation to the unabbreviated title' },
			{ tag: 'R from NLM abbreviation', description: 'redirect from a NLM publication title abbreviation to the unabbreviated title' }
		],
		'Capitalisation': [
			{ tag: 'R from CamelCase', description: 'redirect from a CamelCase title' },
			{ tag: 'R from other capitalisation', description: 'redirect from a title with another method of capitalisation' },
			{ tag: 'R from miscapitalisation', description: 'redirect from a capitalisation error' }
		],
		'Grammar & punctuation': [
			{ tag: 'R from modification', description: 'redirect from a modification of the target\'s title, such as with words rearranged' },
			{ tag: 'R from plural', description: 'redirect from a plural word to the singular equivalent' },
			{ tag: 'R to plural', description: 'redirect from a singular noun to its plural form' }
		],
		'Parts of speech': [
			{ tag: 'R from verb', description: 'redirect from an English-language verb or verb phrase' },
			{ tag: 'R from adjective', description: 'redirect from an adjective (word or phrase that describes a noun)' }
		],
		'Spelling': [
			{ tag: 'R from alternative spelling', description: 'redirect from a title with a different spelling' },
			{ tag: 'R from ASCII-only', description: 'redirect from a title in only basic ASCII to the formal title, with differences that are not diacritical marks or ligatures' },
			{ tag: 'R from diacritic', description: 'redirect from a page name that has diacritical marks (accents, umlauts, etc.)' },
			{ tag: 'R to diacritic', description: 'redirect to the article title with diacritical marks (accents, umlauts, etc.)' },
			{ tag: 'R from misspelling', description: 'redirect from a misspelling or typographical error' }
		]
	},
	'Alternative names': {
		General: [
			{
				tag: 'R from alternative language',
				description: 'redirect from or to a title in another language',
				subgroup: [
					{
						name: 'altLangFrom',
						type: 'input',
						label: 'From language (two-letter code):',
						tooltip: 'Enter the two-letter code of the language the redirect name is in; such as en for English, de for German'
					},
					{
						name: 'altLangTo',
						type: 'input',
						label: 'To language (two-letter code):',
						tooltip: 'Enter the two-letter code of the language the target name is in; such as en for English, de for German'
					},
					{
						name: 'altLangInfo',
						type: 'div',
						label: $.parseHTML('<p>For a list of language codes, see <a href="/wiki/Wp:Template_messages/Redirect_language_codes">Wikipedia:Template messages/Redirect language codes</a></p>')
					}
				]
			},
			{ tag: 'R from alternative name', description: 'redirect from a title that is another name, a pseudonym, a nickname, or a synonym' },
			{ tag: 'R from ambiguous sort name', description: 'redirect from an ambiguous sort name to a page or list that disambiguates it' },
			{ tag: 'R from former name', description: 'redirect from a former name or working title' },
			{ tag: 'R from historic name', description: 'redirect from a name with a significant historic past as a region, city, etc. no longer known by that name' },
			{ tag: 'R from incomplete name', description: 'R from incomplete name' },
			{ tag: 'R from incorrect name', description: 'redirect from an erroneus name that is unsuitable as a title' },
			{ tag: 'R from less specific name', description: 'redirect from a less specific title to a more specific, less general one' },
			{ tag: 'R from long name', description: 'redirect from a more complete title' },
			{ tag: 'R from more specific name', description: 'redirect from a more specific title to a less specific, more general one' },
			{ tag: 'R from short name', description: 'redirect from a title that is a shortened form of a person\'s full name, a book title, or other more complete title' },
			{ tag: 'R from sort name', description: 'redirect from the target\'s sort name, such as beginning with their surname rather than given name' },
			{ tag: 'R from synonym', description: 'redirect from a semantic synonym of the target page title' }
		],
		People: [
			{ tag: 'R from birth name', description: 'redirect from a person\'s birth name to a more common name' },
			{ tag: 'R from given name', description: 'redirect from a person\'s given name' },
			{ tag: 'R from name with title', description: 'redirect from a person\'s name preceded or followed by a title to the name with no title or with the title in parentheses' },
			{ tag: 'R from person', description: 'redirect from a person or persons to a related article' },
			{ tag: 'R from personal name', description: 'redirect from an individual\'s personal name to an article titled with their professional or other better known moniker' },
			{ tag: 'R from pseudonym', description: 'redirect from a pseudonym' },
			{ tag: 'R from surname', description: 'redirect from a title that is a surname' }
		],
		Technical: [
			{ tag: 'R from drug trade name', description: 'redirect from (or to) the trade name of a drug to (or from) the international nonproprietary name (INN)' },
			{ tag: 'R from filename', description: 'redirect from a title that is a filename of the target' },
			{ tag: 'R from molecular formula', description: 'redirect from a molecular/chemical formula to its technical or trivial name' },

			{ tag: 'R from gene symbol', description: 'redirect from a Human Genome Organisation (HUGO) symbol for a gene to an article about the gene' }
		],
		Organisms: [
			{ tag: 'R to scientific name', description: 'redirect from the common name to the scientific name' },
			{ tag: 'R from scientific name', description: 'redirect from the scientific name to the common name' },
			{ tag: 'R from alternative scientific name', description: 'redirect from an alternative scientific name to the accepted scientific name' },
			{ tag: 'R from scientific abbreviation', description: 'redirect from a scientific abbreviation' },
			{ tag: 'R to monotypic taxon', description: 'redirect from the only lower-ranking member of a monotypic taxon to its monotypic taxon' },
			{ tag: 'R from monotypic taxon', description: 'redirect from a monotypic taxon to its only lower-ranking member' },
			{ tag: 'R taxon with possibilities', description: 'redirect from a title related to a living organism that potentially could be expanded into an article' }
		],
		Geography: [
			{ tag: 'R from name and country', description: 'redirect from the specific name to the briefer name' },
			{ tag: 'R from more specific geographic name', description: 'redirect from a geographic location that includes extraneous identifiers such as the county or region of a city' }
		]
	},
	'Navigation aids': {
		'Navigation': [
			{ tag: 'R to anchor', description: 'redirect from a topic that does not have its own page to an anchored part of a page on the subject' },
			{
				tag: 'R avoided double redirect',
				description: 'redirect from an alternative title for another redirect',
				subgroup: {
					name: 'doubleRedirectTarget',
					type: 'input',
					label: 'Redirect target name',
					tooltip: 'Enter the page this redirect would target if the page wasn\'t also a redirect'
				}
			},
			{ tag: 'R from file metadata link', description: 'redirect of a wikilink created from EXIF, XMP, or other information (i.e. the "metadata" section on some image description pages)' },
			{ tag: 'R to list entry', description: 'redirect to a list which contains brief descriptions of subjects not notable enough to have separate articles' },

			{ tag: 'R mentioned in hatnote', description: 'redirect from a title that is mentioned in a hatnote at the redirect target' },
			{ tag: 'R to section', description: 'similar to {{R to list entry}}, but when list is organized in sections, such as list of characters in a fictional universe' },
			{ tag: 'R from shortcut', description: 'redirect from a Wikipedia shortcut' },
			{ tag: 'R to subpage', description: 'redirect to a subpage' }
		],
		'Disambiguation': [
			{ tag: 'R from ambiguous term', description: 'redirect from an ambiguous page name to a page that disambiguates it. This template should never appear on a page that has "(disambiguation)" in its title, use R to disambiguation page instead' },
			{ tag: 'R to disambiguation page', description: 'redirect to a disambiguation page' },
			{ tag: 'R from incomplete disambiguation', description: 'redirect from a page name that is too ambiguous to be the title of an article and should redirect to an appropriate disambiguation page' },
			{ tag: 'R from incorrect disambiguation', description: 'redirect from a page name with incorrect disambiguation due to an error or previous editorial misconception' },
			{ tag: 'R from other disambiguation', description: 'redirect from a page name with an alternative disambiguation qualifier' },
			{ tag: 'R from unnecessary disambiguation', description: 'redirect from a page name that has an unneeded disambiguation qualifier' }
		],
		'Merge, duplicate & move': [
			{ tag: 'R from duplicated article', description: 'redirect to a similar article in order to preserve its edit history' },
			{ tag: 'R with history', description: 'redirect from a page containing substantive page history, kept to preserve content and attributions' },
			{ tag: 'R from move', description: 'redirect from a page that has been moved/renamed' },
			{ tag: 'R from merge', description: 'redirect from a merged page in order to preserve its edit history' }
		],
		'Namespace': [
			{ tag: 'R from remote talk page', description: 'redirect from a talk page in any talk namespace to a corresponding page that is more heavily watched' },
			{ tag: 'R to category namespace', description: 'redirect from a page outside the category namespace to a category page' },
			{ tag: 'R to help namespace', description: 'redirect from any page inside or outside of help namespace to a page in that namespace' },
			{ tag: 'R to main namespace', description: 'redirect from a page outside the main-article namespace to an article in mainspace' },
			{ tag: 'R to portal namespace', description: 'redirect from any page inside or outside of portal space to a page in that namespace' },
			{ tag: 'R to project namespace', description: 'redirect from any page inside or outside of project (Wikipedia: or WP:) space to any page in the project namespace' },
			{ tag: 'R to user namespace', description: 'redirect from a page outside the user namespace to a user page (not to a user talk page)' }
		]
	},
	'Media': {
		General: [
			{ tag: 'R from book', description: 'redirect from a book title to a more general, relevant article' },
			{ tag: 'R from album', description: 'redirect from an album to a related topic such as the recording artist or a list of albums' },
			{ tag: 'R from song', description: 'redirect from a song title to a more general, relevant article' },
			{ tag: 'R from television episode', description: 'redirect from a television episode title to a related work or lists of episodes' }
		],
		Fiction: [
			{ tag: 'R from fictional character', description: 'redirect from a fictional character to a related fictional work or list of characters' },
			{ tag: 'R from fictional element', description: 'redirect from a fictional element (such as an object or concept) to a related fictional work or list of similar elements' },
			{ tag: 'R from fictional location', description: 'redirect from a fictional location or setting to a related fictional work or list of places' }

		]
	},
	'Miscellaneous': {
		'Related information': [
			{ tag: 'R to article without mention', description: 'redirect to an article without any mention of the redirected word or phrase' },
			{ tag: 'R to decade', description: 'redirect from a year to the decade article' },
			{ tag: 'R from domain name', description: 'redirect from a domain name to an article about a website' },
			{ tag: 'R from phrase', description: 'redirect from a phrase to a more general relevant article covering the topic' },
			{ tag: 'R from list topic', description: 'redirect from the topic of a list to the equivalent list' },
			{ tag: 'R from member', description: 'redirect from a member of a group to a related topic such as the group or organization' },
			{ tag: 'R to related topic', description: 'redirect to an article about a similar topic' },
			{ tag: 'R from related word', description: 'redirect from a related word' },
			{ tag: 'R from school', description: 'redirect from a school article that had very little information' },
			{ tag: 'R from subtopic', description: 'redirect from a title that is a subtopic of the target article' },
			{ tag: 'R to subtopic', description: 'redirect to a subtopic of the redirect\'s title' },
			{ tag: 'R from Unicode character', description: 'redirect from a single Unicode character to an article or Wikipedia project page that infers meaning for the symbol' },
			{ tag: 'R from Unicode code', description: 'redirect from a Unicode code point to an article about the character it represents' }
		],
		'With possibilities': [
			{ tag: 'R with possibilities', description: 'redirect from a specific title to a more general, less detailed article (something which can and should be expanded)' }
		],
		'ISO codes': [
			{ tag: 'R from ISO 4 abbreviation', description: 'redirect from an ISO 4 publication title abbreviation to the unabbreviated title' },
			{ tag: 'R from ISO 639 code', description: 'redirect from a title that is an ISO 639 language code to an article about the language' }
		],
		'Printworthiness': [
			{ tag: 'R printworthy', description: 'redirect from a title that would be helpful in a printed or CD/DVD version of Wikipedia' },
			{ tag: 'R unprintworthy', description: 'redirect from a title that would NOT be helpful in a printed or CD/DVD version of Wikipedia' }
		]
	}
};

// maintenance tags for FILES start here

Twinkle.tag.fileList = {
	'লাইসেন্স ও উৎসের সমস্যার ট্যাগ': [
		{ label: '{{Bsr}}: উৎসের তথ্যাদি রয়েছে, কিন্তু তা সরাসরি ছবিটির/জেনেরিক মূল ইউআরএল লিংক নয়', value: 'Bsr' },
		{ label: '{{অ-মুক্ত হ্রাস করুন}}: অ নিম্ন-রেজোলিউশনের মুক্ত নয় ওমন চিত্র (বা খুব দীর্ঘ অডিও ক্লিপ, ইত্যাদি)', value: 'অ-মুক্ত হ্রাস করুন' },
		{ label: '{{অ-মুক্ত হ্রাসকৃত}}: মুক্ত নয় এমন চিত্র যা নামিয়ে আনা হয়েছে (পুরোনো সংস্করণ মুছে উচিত)', value: 'অ-মুক্ত হ্রাসকৃত' },
		{ label: '{{অব্যবহৃত অ-মুক্ত ফাইল}}: পুরনো সংস্করণসহ মুক্ত নয় এমন মিডিয়া যা মুছে ফেলা দরকার', value: 'অব্যবহৃত অ-মুক্ত ফাইল' }
	],
	'উইকিমিডিয়া-কমন্স সম্পর্কিত ট্যাগ': [
		{ label: '{{কমন্সে অনুলিপি করুন}}: মুক্ত মিডিয়া যা কমন্সে অনুলিপি করা উচিত', value: 'কমন্সে অনুলিপি করুন' },
		{
			label: '{{কমন্সে স্থানান্তর করবেন না}}: ফাইল কমন্সে স্থানন্তরের জন্য উপযুক্ত নয়',
			value: 'কমন্সে স্থানান্তর করবেন না',
			subgroup: [
				{
					type: 'input',
					name: 'DoNotMoveToCommons_reason',
					label: 'কারণ:',
					tooltip: 'কেন এই ছবিটি কমন্সে স্থানান্তরিত করা হবে না তার কারণ লিখুন (প্রয়োজন)।',
					required: true
				},
				{
					type: 'number',
					name: 'DoNotMoveToCommons_expiry',
					label: 'মেয়াদ শেষ হওয়ার বছর:',
					min: new Morebits.date().getFullYear(),
					tooltip: 'যদি এই ফাইলটি একটি নির্দিষ্ট বছরের শুরুতে কমন্সে স্থানান্তরিত করা যায়, তাহলে আপনি এটি এখানে প্রবেশ করাতে পারেন (ঐচ্ছিক)।'
				}
			]
		},
		{
			label: '{{Keep local}}: একটি কমন্স ফাইলের স্থানীয় অনুলিপি রাখার অনুরোধ করুন।',
			value: 'Keep local',
			subgroup: {
				type: 'input',
				name: 'keeplocalName',
				label: 'কমন্সে ছবির নাম ভিন্ন হলে:',
				tooltip: 'কমন্সে ছবির নাম (যদি স্থানীয় নাম থেকে ভিন্ন হয়), ফাইল: prefix বাদে:'
			}
		},
		{
			label: '{{এখন কমন্সে}}: ফাইলটি কমন্সে অনুলিপি করা হয়েছে',
			value: 'এখন কমন্সে',
			subgroup: {
				type: 'input',
				name: 'nowcommonsName',
				label: 'কমন্সে ছবির নাম ভিন্ন হলে:',
				tooltip: 'কমন্সে ছবির নাম (যদি স্থানীয় নাম থেকে ভিন্ন হয়), ফাইল: প্রিফিক্স বাদে:'
			}
		}
	],
	'পরিস্করণ ট্যাগ': [
		{ label: '{{নিদর্শন}}: পিএনজিটিতে অবশিষ্ট সংকোচনের নিদর্শন রয়েছে', value: 'নিদর্শন' },
		{ label: '{{ত্রুটিপূর্ণ ফন্ট}}: এসভিজিটি থাম্বনেইল সার্ভারে উপলব্ধ ফন্ট ব্যবহার করে না', value: 'ত্রুটিপূর্ণ ফন্ট' },
		{ label: '{{ত্রুটিপূর্ণ বিন্যাস}}: পিডিএফ/ডিওসি/... ফাইলটি আরও দরকারী বিন্যাসে রূপান্তরিত করা উচিত', value: 'ত্রুটিপূর্ণ বিন্যাস' },
		{ label: '{{ত্রুটিপূর্ণ জিআইএফ}}: জিআইএফ যা পিএনজি, জেপিইজি, বা এসভিজি-তে হওয়া উচিত', value: 'ত্রুটিপূর্ণ জিআইএফ' },
		{ label: '{{ত্রুটিপূর্ণ জেপিইজি}}: JPEG that should be PNG or SVG', value: 'ত্রুটিপূর্ণ জেপিইজি' },
		{ label: '{{ত্রুটিপূর্ণ এসভিজি}}: এসভিজিটিতে র‌্যাস্টার গ্রাফিক্স রয়েছে', value: 'ত্রুটিপূর্ণ এসভিজি' },
		{ label: '{{ত্রুটিপূর্ণ চিহ্ন}}: স্বয়ংক্রিয়ভাবে চিহ্নিত এসভিজিটির ত্রুটি দূরীকরণ প্রয়োজন', value: 'ত্রুটিপূর্ণ চিহ্ন' },
		{
			label: '{{Cleanup image}}: general cleanup', value: 'Cleanup image',
			subgroup: {
				type: 'input',
				name: 'cleanupimageReason',
				label: 'কারণ:',
				tooltip: 'ত্রুটি দূরীকরণের কারণ লিখুন (প্রয়োজন)',
				required: true
			}
		},
		{ label: '{{ClearType}}: image (not screenshot) with ClearType anti-aliasing', value: 'ClearType' },
		{ label: '{{Imagewatermark}}: image contains visible or invisible watermarking', value: 'Imagewatermark' },
		{ label: '{{NoCoins}}: image using coins to indicate scale', value: 'NoCoins' },
		{ label: '{{Overcompressed JPEG}}: JPEG with high levels of artifacts', value: 'Overcompressed JPEG' },
		{ label: '{{Opaque}}: opaque background should be transparent', value: 'Opaque' },
		{ label: '{{Remove border}}: unneeded border, white space, etc.', value: 'Remove border' },
		{
			label: '{{Rename media}}: file should be renamed according to the criteria at [[WP:FMV]]',
			value: 'Rename media',
			subgroup: [
				{
					type: 'input',
					name: 'renamemediaNewname',
					label: 'New name:',
					tooltip: 'Enter the new name for the image (optional)'
				},
				{
					type: 'input',
					name: 'renamemediaReason',
					label: 'Reason:',
					tooltip: 'Enter the reason for the rename (optional)'
				}
			]
		},
		{ label: '{{Should be PNG}}: GIF or JPEG should be lossless', value: 'Should be PNG' },
		{
			label: '{{Should be SVG}}: PNG, GIF or JPEG should be vector graphics', value: 'Should be SVG',
			subgroup: {
				name: 'svgCategory',
				type: 'select',
				list: [
					{ label: '{{Should be SVG|other}}', value: 'other' },
					{ label: '{{Should be SVG|alphabet}}: character images, font examples, etc.', value: 'alphabet' },
					{ label: '{{Should be SVG|chemical}}: chemical diagrams, etc.', value: 'chemical' },
					{ label: '{{Should be SVG|circuit}}: electronic circuit diagrams, etc.', value: 'circuit' },
					{ label: '{{Should be SVG|coat of arms}}: coats of arms', value: 'coat of arms' },
					{ label: '{{Should be SVG|diagram}}: diagrams that do not fit any other subcategory', value: 'diagram' },
					{ label: '{{Should be SVG|emblem}}: emblems, free/libre logos, insignias, etc.', value: 'emblem' },
					{ label: '{{Should be SVG|fair use}}: fair-use images, fair-use logos', value: 'fair use' },
					{ label: '{{Should be SVG|flag}}: flags', value: 'flag' },
					{ label: '{{Should be SVG|graph}}: visual plots of data', value: 'graph' },
					{ label: '{{Should be SVG|logo}}: logos', value: 'logo' },
					{ label: '{{Should be SVG|map}}: maps', value: 'map' },
					{ label: '{{Should be SVG|music}}: musical scales, notes, etc.', value: 'music' },
					{ label: '{{Should be SVG|physical}}: "realistic" images of physical objects, people, etc.', value: 'physical' },
					{ label: '{{Should be SVG|symbol}}: miscellaneous symbols, icons, etc.', value: 'symbol' }
				]
			}
		},
		{ label: '{{Should be text}}: image should be represented as text, tables, or math markup', value: 'Should be text' }
	],
	'চিত্রের গুনাগুন বিচারের ট্যাগ': [
		{ label: '{{Image hoax}}: Image may be manipulated or constitute a hoax', value: 'Image hoax' },
		{ label: '{{Image-blownout}}', value: 'Image-blownout' },
		{ label: '{{Image-out-of-focus}}', value: 'Image-out-of-focus' },
		{
			label: '{{Image-Poor-Quality}}', value: 'Image-Poor-Quality',
			subgroup: {
				type: 'input',
				name: 'ImagePoorQualityReason',
				label: 'Reason:',
				tooltip: 'Enter the reason why this image is so bad (required)',
				required: true
			}
		},
		{ label: '{{Image-underexposure}}', value: 'Image-underexposure' },
		{
			label: '{{Low quality chem}}: disputed chemical structures', value: 'Low quality chem',
			subgroup: {
				type: 'input',
				name: 'lowQualityChemReason',
				label: 'কারণ:',
				tooltip: 'Enter the reason why the diagram is disputed (required)',
				required: true
			}
		}
	],
	'প্রতিস্থাপন ট্যাগ': [
		{ label: '{{Obsolete}}: উন্নত সংস্করণ উপলব্ধ', value: 'Obsolete' },
		{ label: '{{পিএনজি সংস্করণ উপলব্ধ}}', value: 'পিএনজি সংস্করণ উপলব্ধ' },
		{ label: '{{ভেক্টর সংস্করণ উপলব্ধ}}', value: 'ভেক্টর সংস্করণ উপলব্ধ' }
	]
};
Twinkle.tag.fileList['প্রতিস্থাপন ট্যাগ'].forEach(function(el) {
	el.subgroup = {
		type: 'input',
		label: 'প্রতিস্থাপন ফাইল:',
		tooltip: 'সেই ফাইলটির নাম লিখুন যা এটিকে প্রতিস্থাপন করে (প্রয়োজনীয়)',
		name: el.value.replace(/ /g, '_') + 'File',
		required: true
	};
});


Twinkle.tag.callbacks = {
	article: function articleCallback(pageobj) {

		// Remove tags that become superfluous with this action
		var pageText = pageobj.getPageText().replace(/\{\{\s*([Uu]serspace draft)\s*(\|(?:\{\{[^{}]*\}\}|[^{}])*)?\}\}\s*/g, '');
		var params = pageobj.getCallbackParameters();

		/**
		 * Saves the page following the removal of tags if any. The last step.
		 * Called from removeTags()
		 */
		var postRemoval = function() {
			if (params.tagsToRemove.length) {
				// Remove empty {{multiple issues}} if found
				pageText = pageText.replace(/\{\{(multiple ?issues|article ?issues|mi)\s*\|\s*\}\}\n?/im, '');
				// Remove single-element {{multiple issues}} if found
				pageText = pageText.replace(/\{\{(?:multiple ?issues|article ?issues|mi)\s*\|\s*(\{\{[^}]+\}\})\s*\}\}/im, '$1');
			}

			// Build edit summary
			var makeSentence = function(array) {
				if (array.length < 3) {
					return array.join(' ও ');
				}
				var last = array.pop();
				return array.join(', ') + ', ও ' + last;
			};
			var makeTemplateLink = function(tag) {
				var text = '{{[[';
				// if it is a custom tag with a parameter
				if (tag.indexOf('|') !== -1) {
					tag = tag.slice(0, tag.indexOf('|'));
				}
				text += tag.indexOf(':') !== -1 ? tag : 'টেমপ্লেট:' + tag + '|' + tag;
				return text + ']]}}';
			};

			var summaryText;
			var addedTags = params.tags.map(makeTemplateLink);
			var removedTags = params.tagsToRemove.map(makeTemplateLink);
			if (addedTags.length) {
				summaryText = makeSentence(addedTags) + ' ট্যাগ যোগ করা হয়েছে';
				summaryText += removedTags.length ? '; ও সরানো হয়েছে ' + makeSentence(removedTags) : '';
			} else {
				summaryText = makeSentence(removedTags) + ' ট্যাগ সরানো হয়েছে';
			}
			summaryText += ' ' + (addedTags.length + removedTags.length > 1 ? '' : '');
			if (params.reason) {
				summaryText += ': ' + params.reason;
			}

			// avoid truncated summaries
			if (summaryText.length > 499) {
				summaryText = summaryText.replace(/\[\[[^|]+\|([^\]]+)\]\]/g, '$1');
			}

			pageobj.setPageText(pageText);
			pageobj.setEditSummary(summaryText);
			if ((mw.config.get('wgNamespaceNumber') === 0 && Twinkle.getPref('watchTaggedVenues').indexOf('articles') !== -1) || (mw.config.get('wgNamespaceNumber') === 118 && Twinkle.getPref('watchTaggedVenues').indexOf('drafts') !== -1)) {
				pageobj.setWatchlist(Twinkle.getPref('watchTaggedPages'));
			}
			pageobj.setMinorEdit(Twinkle.getPref('markTaggedPagesAsMinor'));
			pageobj.setCreateOption('nocreate');
			pageobj.save(function() {
				// COI: Start the discussion on the talk page (mainspace only)
				if (params.coiReason) {
					var coiTalkPage = new Morebits.wiki.page('Talk:' + Morebits.pageNameNorm, 'Starting discussion on talk page');
					coiTalkPage.setNewSectionText(params.coiReason + ' ~~~~');
					coiTalkPage.setNewSectionTitle('COI tag (' + new Morebits.date(pageobj.getLoadTime()).format('MMMM Y', 'utc') + ')');
					coiTalkPage.setChangeTags(Twinkle.changeTags);
					coiTalkPage.setCreateOption('recreate');
					coiTalkPage.newSection();
				}

				// Special functions for merge tags
				// Post a rationale on the talk page (mainspace only)
				if (params.mergeReason) {
					var mergeTalkPage = new Morebits.wiki.page('Talk:' + params.discussArticle, 'আলাপ পাতায় ব্যাখা যোগ করা হচ্ছে');
					mergeTalkPage.setNewSectionText(params.mergeReason.trim() + ' ~~~~');
					mergeTalkPage.setNewSectionTitle(params.talkDiscussionTitleLinked);
					mergeTalkPage.setChangeTags(Twinkle.changeTags);
					mergeTalkPage.setWatchlist(Twinkle.getPref('watchMergeDiscussions'));
					mergeTalkPage.setCreateOption('recreate');
					mergeTalkPage.newSection();
				}
				// Tag the target page (if requested)
				if (params.mergeTagOther) {
					var otherTagName = 'Merge';
					if (params.mergeTag === 'Merge from') {
						otherTagName = 'Merge to';
					} else if (params.mergeTag === 'Merge to') {
						otherTagName = 'Merge from';
					}
					var newParams = {
						tags: [otherTagName],
						tagsToRemove: [],
						tagsToRemain: [],
						mergeTarget: Morebits.pageNameNorm,
						discussArticle: params.discussArticle,
						talkDiscussionTitle: params.talkDiscussionTitle,
						talkDiscussionTitleLinked: params.talkDiscussionTitleLinked
					};
					var otherpage = new Morebits.wiki.page(params.mergeTarget, 'অন্য পাতায় ট্যাগ যোগ করা হচ্ছে (' +
						params.mergeTarget + ')');
					otherpage.setChangeTags(Twinkle.changeTags);
					otherpage.setCallbackParameters(newParams);
					otherpage.load(Twinkle.tag.callbacks.article);
				}

				// Special functions for {{not English}} and {{rough translation}}
				// Post at WP:PNT (mainspace only)
				if (params.translationPostAtPNT) {
					var pntPage = new Morebits.wiki.page('Wikipedia:Pages needing translation into English',
						'Listing article at Wikipedia:Pages needing translation into English');
					pntPage.setFollowRedirect(true);
					pntPage.load(function friendlytagCallbacksTranslationListPage(pageobj) {
						var old_text = pageobj.getPageText();

						var lang = params.translationLanguage;
						var reason = params.translationComments;

						var templateText = '{{subst:needtrans|pg=' + Morebits.pageNameNorm + '|Language=' +
							(lang || 'uncertain') + '|Comments=' + reason.trim() + '}} ~~~~';

						var text, summary;
						if (params.tags.indexOf('Rough translation') !== -1) {
							text = old_text + '\n\n' + templateText;
							summary = 'Translation cleanup requested on ';
						} else {
							text = old_text.replace(/\n+(==\s?Translated pages that could still use some cleanup\s?==)/,
								'\n\n' + templateText + '\n\n$1');
							summary = 'Translation' + (lang ? ' from ' + lang : '') + ' requested on ';
						}

						if (text === old_text) {
							pageobj.getStatusElement().error('failed to find target spot for the discussion');
							return;
						}
						pageobj.setPageText(text);
						pageobj.setEditSummary(summary + ' [[:' + Morebits.pageNameNorm + ']]');
						pageobj.setChangeTags(Twinkle.changeTags);
						pageobj.setCreateOption('recreate');
						pageobj.save();
					});
				}
				// Notify the user ({{Not English}} only)
				if (params.translationNotify) {
					new Morebits.wiki.page(Morebits.pageNameNorm).lookupCreation(function(innerPageobj) {
						var initialContrib = innerPageobj.getCreator();

						// Disallow warning yourself
						if (initialContrib === mw.config.get('wgUserName')) {
							innerPageobj.getStatusElement().warn('আপনি (' + initialContrib + ') এই পাতাটি তৈরি করেছেন; ব্যবহারকারী বিজ্ঞপ্তি এড়িয়ে যাওয়া হচ্ছে');
							return;
						}

						var userTalkPage = new Morebits.wiki.page('User talk:' + initialContrib,
							'প্রথম অবদানকারী (' + initialContrib + ') কে জানানো হচ্ছে');
						userTalkPage.setNewSectionTitle('আপনার নিবন্ধ [[' + Morebits.pageNameNorm + ']]');
						userTalkPage.setNewSectionText('{{subst:Uw-notbangla|1=' + Morebits.pageNameNorm +
							(params.translationPostAtPNT ? '' : '|nopnt=yes') + '}} ~~~~');
						userTalkPage.setEditSummary('বিজ্ঞপ্তি: অনুগ্রহ করে বাংলা উইকিপিডিয়ায় অবদান রাখার সময় বাংলা ব্যবহার করুন।');
						userTalkPage.setChangeTags(Twinkle.changeTags);
						userTalkPage.setCreateOption('recreate');
						userTalkPage.setFollowRedirect(true, false);
						userTalkPage.newSection();
					});
				}
			});

			if (params.patrol) {
				pageobj.triage();
			}
		};

		/**
		 * Removes the existing tags that were deselected (if any)
		 * Calls postRemoval() when done
		 */
		var removeTags = function removeTags() {

			if (params.tagsToRemove.length === 0) {
				postRemoval();
				return;
			}

			Morebits.status.info('তথ্য', 'Removing deselected tags that were already present');

			var getRedirectsFor = [];

			// Remove the tags from the page text, if found in its proper name,
			// otherwise moves it to `getRedirectsFor` array earmarking it for
			// later removal
			params.tagsToRemove.forEach(function removeTag(tag) {
				var tag_re = new RegExp('\\{\\{' + Morebits.pageNameRegex(tag) + '\\s*(\\|[^}]+)?\\}\\}\\n?');

				if (tag_re.test(pageText)) {
					pageText = pageText.replace(tag_re, '');
				} else {
					getRedirectsFor.push('টেমপ্লেট:' + tag);
				}
			});

			if (!getRedirectsFor.length) {
				postRemoval();
				return;
			}

			// Remove tags which appear in page text as redirects
			var api = new Morebits.wiki.api('Getting template redirects', {
				action: 'query',
				prop: 'linkshere',
				titles: getRedirectsFor.join('|'),
				redirects: 1,  // follow redirect if the class name turns out to be a redirect page
				lhnamespace: '10',  // template namespace only
				lhshow: 'redirect',
				lhlimit: 'max', // 500 is max for normal users, 5000 for bots and sysops
				format: 'json'
			}, function removeRedirectTag(apiobj) {
				var pages = apiobj.getResponse().query.pages.filter(function(p) {
					return !p.missing && !!p.linkshere;
				});
				pages.forEach(function(page) {
					var removed = false;
					page.linkshere.forEach(function(el) {
						var tag = el.title.slice(9);
						var tag_re = new RegExp('\\{\\{' + Morebits.pageNameRegex(tag) + '\\s*(\\|[^}]*)?\\}\\}\\n?');
						if (tag_re.test(pageText)) {
							pageText = pageText.replace(tag_re, '');
							removed = true;
							return false;   // break out of $.each
						}
					});
					if (!removed) {
						Morebits.status.warn('তথ্য', 'Failed to find {{' +
						page.title.slice(9) + '}} on the page... excluding');
					}

				});

				postRemoval();

			});
			api.post();

		};

		if (!params.tags.length) {
			removeTags();
			return;
		}

		var tagRe, tagText = '', tags = [], groupableTags = [], groupableExistingTags = [];
		// Executes first: addition of selected tags

		/**
		 * Updates `tagText` with the syntax of `tagName` template with its parameters
		 * @param {number} tagIndex
		 * @param {string} tagName
		 */
		var addTag = function articleAddTag(tagIndex, tagName) {
			var currentTag = '';
			if (tagName === 'বিষয়শ্রেণীহীন' || tagName === 'বিষয়শ্রেণী উন্নয়ন') {
				pageText += '\n\n{{' + tagName + '|date={{subst:CURRENTMONTHNAME}} {{subst:CURRENTYEAR}}}}';
			} else {
				currentTag += '{{' + tagName;
				// fill in other parameters, based on the tag

				var subgroupObj = Twinkle.tag.article.flatObject[tagName] &&
					Twinkle.tag.article.flatObject[tagName].subgroup;
				if (subgroupObj) {
					var subgroups = Array.isArray(subgroupObj) ? subgroupObj : [ subgroupObj ];
					subgroups.forEach(function(gr) {
						if (gr.parameter && (params[gr.name] || gr.required)) {
							currentTag += '|' + gr.parameter + '=' + (params[gr.name] || '');
						}
					});
				}

				switch (tagName) {
					case 'Not English':
					case 'Rough translation':
						if (params.translationPostAtPNT) {
							currentTag += '|listed=yes';
						}
						break;
					case 'Merge':
					case 'Merge to':
					case 'Merge from':
						params.mergeTag = tagName;
						// normalize the merge target for now and later
						params.mergeTarget = Morebits.string.toUpperCaseFirstChar(params.mergeTarget.replace(/_/g, ' '));

						currentTag += '|' + params.mergeTarget;

						// link to the correct section on the talk page, for article space only
						if (mw.config.get('wgNamespaceNumber') === 0 && (params.mergeReason || params.discussArticle)) {
							if (!params.discussArticle) {
								// discussArticle is the article whose talk page will contain the discussion
								params.discussArticle = tagName === 'Merge to' ? params.mergeTarget : mw.config.get('wgTitle');
								// nonDiscussArticle is the article which won't have the discussion
								params.nonDiscussArticle = tagName === 'Merge to' ? mw.config.get('wgTitle') : params.mergeTarget;
								var direction = '[[' + params.nonDiscussArticle + ']]' + (params.mergeTag === 'Merge' ? '-এর সাথে ' : ' থেকে ') + '[[' + params.discussArticle + ']]';
								params.talkDiscussionTitleLinked = direction + ' একত্রীকরণের প্রস্তাব';
								params.talkDiscussionTitle = params.talkDiscussionTitleLinked.replace(/\[\[(.*?)\]\]/g, '$1');
							}
							currentTag += '|discuss=Talk:' + params.discussArticle + '#' + params.talkDiscussionTitle;
						}
						break;
					default:
						break;
				}

				currentTag += '|date={{subst:CURRENTMONTHNAME}} {{subst:CURRENTYEAR}}}}\n';
				tagText += currentTag;
			}
		};

		/**
		 * Adds the tags which go outside {{multiple issues}}, either because
		 * these tags aren't supported in {{multiple issues}} or because
		 * {{multiple issues}} is not being added to the page at all
		 */
		var addUngroupedTags = function() {
			$.each(tags, addTag);

			// Insert tag after short description or any hatnotes,
			// as well as deletion/protection-related templates
			var wikipage = new Morebits.wikitext.page(pageText);
			var templatesAfter = Twinkle.hatnoteRegex +
				// Protection templates
				'pp|pp-.*?|' +
				// CSD
				'db|delete|db-.*?|speedy deletion-.*?|' +
				// PROD
				'(?:proposed deletion|prod blp)\\/dated(?:\\s*\\|(?:concern|user|timestamp|help).*)+|' +
				// not a hatnote, but sometimes under a CSD or AfD
				'salt|proposed deletion endorsed';
			// AfD is special, as the tag includes html comments before and after the actual template
			// trailing whitespace/newline needed since this subst's a newline
			var afdRegex = '(?:<!--.*AfD.*\\n\\{\\{(?:Article for deletion\\/dated|AfDM).*\\}\\}\\n<!--.*(?:\\n<!--.*)?AfD.*(?:\\s*\\n))?';
			pageText = wikipage.insertAfterTemplates(tagText, templatesAfter, null, afdRegex).getText();

			removeTags();
		};

		// Separate tags into groupable ones (`groupableTags`) and non-groupable ones (`tags`)
		params.tags.forEach(function(tag) {
			tagRe = new RegExp('\\{\\{' + tag + '(\\||\\}\\})', 'im');
			// regex check for preexistence of tag can be skipped if in canRemove mode
			if (Twinkle.tag.canRemove || !tagRe.exec(pageText)) {
				// condition Twinkle.tag.article.tags[tag] to ensure that its not a custom tag
				// Custom tags are assumed non-groupable, since we don't know whether MI template supports them
				if (Twinkle.tag.article.flatObject[tag] && !Twinkle.tag.article.flatObject[tag].excludeMI) {
					groupableTags.push(tag);
				} else {
					tags.push(tag);
				}
			} else {
				if (tag === 'Merge from' || tag === 'History merge') {
					tags.push(tag);
				} else {
					Morebits.status.warn('তথ্য', 'Found {{' + tag +
						'}} on the article already...excluding');
					// don't do anything else with merge tags
					if (['Merge', 'Merge to'].indexOf(tag) !== -1) {
						params.mergeTarget = params.mergeReason = params.mergeTagOther = null;
					}
				}
			}
		});

		// To-be-retained existing tags that are groupable
		params.tagsToRemain.forEach(function(tag) {
			// If the tag is unknown to us, we consider it non-groupable
			if (Twinkle.tag.article.flatObject[tag] && !Twinkle.tag.article.flatObject[tag].excludeMI) {
				groupableExistingTags.push(tag);
			}
		});

		var miTest = /\{\{(multiple ?issues|article ?issues|mi)(?!\s*\|\s*section\s*=)[^}]+\{/im.exec(pageText);

		if (miTest && groupableTags.length > 0) {
			Morebits.status.info('তথ্য', 'বিদ্যমান {{একাধিক সমস্যা}} টেমপ্লেটের ভিতরে সমর্থিত ট্যাগগুলো যোগ করা হচ্ছে');

			tagText = '';
			$.each(groupableTags, addTag);

			var miRegex = new RegExp('(\\{\\{\\s*' + miTest[1] + '\\s*(?:\\|(?:\\{\\{[^{}]*\\}\\}|[^{}])*)?)\\}\\}\\s*', 'im');
			pageText = pageText.replace(miRegex, '$1' + tagText + '}}\n');
			tagText = '';

			addUngroupedTags();

		} else if (params.group && !miTest && (groupableExistingTags.length + groupableTags.length) >= 2) {
			Morebits.status.info('তথ্য', '{{একাধিক সমস্যা}} টেমপ্লেটের মাধ্যমে ট্যাগগুলো দলবদ্ধ করা হচ্ছে');

			tagText += '{{Multiple issues|\n';

			/**
			 * Adds newly added tags to MI
			 */
			var addNewTagsToMI = function() {
				$.each(groupableTags, addTag);
				tagText += '}}\n';

				addUngroupedTags();
			};


			var getRedirectsFor = [];

			// Reposition the tags on the page into {{multiple issues}}, if found with its
			// proper name, else moves it to `getRedirectsFor` array to be handled later
			groupableExistingTags.forEach(function repositionTagIntoMI(tag) {
				var tag_re = new RegExp('(\\{\\{' + Morebits.pageNameRegex(tag) + '\\s*(\\|[^}]+)?\\}\\}\\n?)');
				if (tag_re.test(pageText)) {
					tagText += tag_re.exec(pageText)[1];
					pageText = pageText.replace(tag_re, '');
				} else {
					getRedirectsFor.push('টেমপ্লেট:' + tag);
				}
			});

			if (!getRedirectsFor.length) {
				addNewTagsToMI();
				return;
			}

			var api = new Morebits.wiki.api('Getting template redirects', {
				action: 'query',
				prop: 'linkshere',
				titles: getRedirectsFor.join('|'),
				redirects: 1,
				lhnamespace: '10', // template namespace only
				lhshow: 'redirect',
				lhlimit: 'max', // 500 is max for normal users, 5000 for bots and sysops
				format: 'json'
			}, function replaceRedirectTag(apiobj) {
				var pages = apiobj.getResponse().query.pages.filter(function(p) {
					return !p.missing && !!p.linkshere;
				});
				pages.forEach(function(page) {
					var found = false;
					page.linkshere.forEach(function(el) {
						var tag = el.title.slice(9);
						var tag_re = new RegExp('(\\{\\{' + Morebits.pageNameRegex(tag) + '\\s*(\\|[^}]*)?\\}\\}\\n?)');
						if (tag_re.test(pageText)) {
							tagText += tag_re.exec(pageText)[1];
							pageText = pageText.replace(tag_re, '');
							found = true;
							return false;   // break out of $.each
						}
					});
					if (!found) {
						Morebits.status.warn('তথ্য', 'Failed to find the existing {{' +
						page.title.slice(9) + '}} on the page... skip repositioning');
					}
				});
				addNewTagsToMI();
			});
			api.post();

		} else {
			tags = tags.concat(groupableTags);
			addUngroupedTags();
		}
	},

	redirect: function redirect(pageobj) {
		var params = pageobj.getCallbackParameters(),
			pageText = pageobj.getPageText(),
			tagRe, tagText = '', summaryText = 'Added',
			tags = [], i;

		for (i = 0; i < params.tags.length; i++) {
			tagRe = new RegExp('(\\{\\{' + params.tags[i] + '(\\||\\}\\}))', 'im');
			if (!tagRe.exec(pageText)) {
				tags.push(params.tags[i]);
			} else {
				Morebits.status.warn('তথ্য', 'Found {{' + params.tags[i] +
					'}} on the redirect already...excluding');
			}
		}

		var addTag = function redirectAddTag(tagIndex, tagName) {
			tagText += '\n{{' + tagName;
			if (tagName === 'R from alternative language') {
				if (params.altLangFrom) {
					tagText += '|from=' + params.altLangFrom;
				}
				if (params.altLangTo) {
					tagText += '|to=' + params.altLangTo;
				}
			} else if (tagName === 'R avoided double redirect' && params.doubleRedirectTarget) {
				tagText += '|1=' + params.doubleRedirectTarget;
			}
			tagText += '}}';

			if (tagIndex > 0) {
				if (tagIndex === (tags.length - 1)) {
					summaryText += ' and';
				} else if (tagIndex < (tags.length - 1)) {
					summaryText += ',';
				}
			}

			summaryText += ' {{[[:' + (tagName.indexOf(':') !== -1 ? tagName : 'টেমপ্লেট:' + tagName + '|' + tagName) + ']]}}';
		};

		if (!tags.length) {
			Morebits.status.warn('তথ্য', 'No tags remaining to apply');
		}

		tags.sort();
		$.each(tags, addTag);

		// Check for all Rcat shell redirects (from #433)
		if (pageText.match(/{{(?:redr|this is a redirect|r(?:edirect)?(?:.?cat.*)?[ _]?sh)/i)) {
			// Regex inspired by [[User:Kephir/gadgets/sagittarius.js]] ([[Special:PermaLink/831402893]])
			var oldTags = pageText.match(/(\s*{{[A-Za-z\s]+\|(?:\s*1=)?)((?:[^|{}]|{{[^}]+}})+)(}})\s*/i);
			pageText = pageText.replace(oldTags[0], oldTags[1] + tagText + oldTags[2] + oldTags[3]);
		} else {
			// Fold any pre-existing Rcats into taglist and under Rcatshell
			var pageTags = pageText.match(/\s*{{R(?:edirect)? .*?}}/img);
			var oldPageTags = '';
			if (pageTags) {
				pageTags.forEach(function(pageTag) {
					var pageRe = new RegExp(Morebits.string.escapeRegExp(pageTag), 'img');
					pageText = pageText.replace(pageRe, '');
					pageTag = pageTag.trim();
					oldPageTags += '\n' + pageTag;
				});
			}
			pageText += '\n{{Redirect category shell|' + tagText + oldPageTags + '\n}}';
		}

		summaryText += (tags.length > 0 ? ' tag' + (tags.length > 1 ? 's' : ' ') : 'rcat shell') + ' to redirect';

		// avoid truncated summaries
		if (summaryText.length > 499) {
			summaryText = summaryText.replace(/\[\[[^|]+\|([^\]]+)\]\]/g, '$1');
		}

		pageobj.setPageText(pageText);
		pageobj.setEditSummary(summaryText);
		if (Twinkle.getPref('watchTaggedVenues').indexOf('redirects') !== -1) {
			pageobj.setWatchlist(Twinkle.getPref('watchTaggedPages'));
		}
		pageobj.setMinorEdit(Twinkle.getPref('markTaggedPagesAsMinor'));
		pageobj.setCreateOption('nocreate');
		pageobj.save();

		if (params.patrol) {
			pageobj.triage();
		}

	},

	file: function friendlytagCallbacksFile(pageobj) {
		var text = pageobj.getPageText();
		var params = pageobj.getCallbackParameters();
		var summary = 'যোগ করা হয়েছে ';

		// Add maintenance tags
		if (params.tags.length) {

			var tagtext = '', currentTag;
			$.each(params.tags, function(k, tag) {
				// when other commons-related tags are placed, remove "move to Commons" tag
				if (['Keep local', 'Now Commons', 'Do not move to Commons'].indexOf(tag) !== -1) {
					text = text.replace(/\{\{(mtc|(copy |move )?to ?commons|move to wikimedia commons|copy to wikimedia commons)[^}]*\}\}/gi, '');
				}

				currentTag = tag;

				switch (tag) {
					case 'Now Commons':
						currentTag = 'subst:' + currentTag; // subst
						if (params.nowcommonsName !== '') {
							currentTag += '|1=' + params.nowcommonsName;
						}
						break;
					case 'Keep local':
						if (params.keeplocalName !== '') {
							currentTag += '|1=' + params.keeplocalName;
						}
						break;
					case 'Rename media':
						if (params.renamemediaNewname !== '') {
							currentTag += '|1=' + params.renamemediaNewname;
						}
						if (params.renamemediaReason !== '') {
							currentTag += '|2=' + params.renamemediaReason;
						}
						break;
					case 'Cleanup image':
						currentTag += '|1=' + params.cleanupimageReason;
						break;
					case 'Image-Poor-Quality':
						currentTag += '|1=' + params.ImagePoorQualityReason;
						break;
					case 'Image hoax':
						currentTag += '|date={{subst:CURRENTMONTHNAME}} {{subst:CURRENTYEAR}}';
						break;
					case 'Low quality chem':
						currentTag += '|1=' + params.lowQualityChemReason;
						break;
					case 'Vector version available':
						text = text.replace(/\{\{((convert to |convertto|should be |shouldbe|to)?svg|badpng|vectorize)[^}]*\}\}/gi, '');
						/* falls through */
					case 'PNG version available':
						/* falls through */
					case 'Obsolete':
						currentTag += '|1=' + params[tag.replace(/ /g, '_') + 'File'];
						break;
					case 'Do not move to Commons':
						currentTag += '|reason=' + params.DoNotMoveToCommons_reason;
						if (params.DoNotMoveToCommons_expiry) {
							currentTag += '|expiry=' + params.DoNotMoveToCommons_expiry;
						}
						break;
					case 'Orphaned non-free revisions':
						currentTag = 'subst:' + currentTag; // subst
						// remove {{non-free reduce}} and redirects
						text = text.replace(/\{\{\s*(Template\s*:\s*)?(Non-free reduce|FairUseReduce|Fairusereduce|Fair Use Reduce|Fair use reduce|Reduce size|Reduce|Fair-use reduce|Image-toobig|Comic-ovrsize-img|Non-free-reduce|Nfr|Smaller image|Nonfree reduce)\s*(\|(?:\{\{[^{}]*\}\}|[^{}])*)?\}\}\s*/ig, '');
						currentTag += '|date={{subst:date}}';
						break;
					case 'Copy to Commons':
						currentTag += '|human=' + mw.config.get('wgUserName');
						break;
					case 'Should be SVG':
						currentTag += '|' + params.svgCategory;
						break;
					default:
						break;  // don't care
				}

				currentTag = '{{' + currentTag + '}}\n';

				tagtext += currentTag;
				summary += '{{' + tag + '}}, ';
			});

			if (!tagtext) {
				pageobj.getStatusElement().warn('User canceled operation; nothing to do');
				return;
			}

			text = tagtext + text;
		}

		pageobj.setPageText(text);
		pageobj.setEditSummary(summary.substring(0, summary.length - 2));
		pageobj.setChangeTags(Twinkle.changeTags);
		if (Twinkle.getPref('watchTaggedVenues').indexOf('files') !== -1) {
			pageobj.setWatchlist(Twinkle.getPref('watchTaggedPages'));
		}
		pageobj.setMinorEdit(Twinkle.getPref('markTaggedPagesAsMinor'));
		pageobj.setCreateOption('nocreate');
		pageobj.save();

		if (params.patrol) {
			pageobj.triage();
		}
	}
};

Twinkle.tag.callback.evaluate = function friendlytagCallbackEvaluate(e) {
	var form = e.target;
	var params = Morebits.quickForm.getInputData(form);


	// Validation

	// Given an array of incompatible tags, check if we have two or more selected
	var checkIncompatible = function(conflicts, extra) {
		var count = conflicts.reduce(function(sum, tag) {
			return sum += params.tags.indexOf(tag) !== -1;
		}, 0);
		if (count > 1) {
			var message = 'Please select only one of: {{' + conflicts.join('}}, {{') + '}}.';
			message += extra ? ' ' + extra : '';
			alert(message);
			return true;
		}
	};

	// We could theoretically put them all checkIncompatible calls in a
	// forEach loop, but it's probably clearer not to have [[array one],
	// [array two]] devoid of context.
	switch (Twinkle.tag.mode) {
		case 'article':
			params.tagsToRemove = form.getUnchecked('existingTags'); // not in `input`
			params.tagsToRemain = params.existingTags || []; // container not created if none present

			if ((params.tags.indexOf('Merge') !== -1) || (params.tags.indexOf('Merge from') !== -1) ||
				(params.tags.indexOf('Merge to') !== -1)) {
				if (checkIncompatible(['Merge', 'Merge from', 'Merge to'], 'If several merges are required, use {{Merge}} and separate the article names with pipes (although in this case Twinkle cannot tag the other articles automatically).')) {
					return;
				}
				if ((params.mergeTagOther || params.mergeReason) && params.mergeTarget.indexOf('|') !== -1) {
					alert('Tagging multiple articles in a merge, and starting a discussion for multiple articles, is not supported at the moment. Please turn off "tag other article", and/or clear out the "reason" box, and try again.');
					return;
				}
			}

			if (checkIncompatible(['Not English', 'Rough translation'])) {
				return;
			}
			break;

		case 'file':
			if (checkIncompatible(['Bad GIF', 'Bad JPEG', 'Bad SVG', 'Bad format'])) {
				return;
			}
			if (checkIncompatible(['Should be PNG', 'Should be SVG', 'Should be text'])) {
				return;
			}
			if (checkIncompatible(['Bad SVG', 'Vector version available'])) {
				return;
			}
			if (checkIncompatible(['Bad JPEG', 'Overcompressed JPEG'])) {
				return;
			}
			if (checkIncompatible(['PNG version available', 'Vector version available'])) {
				return;
			}

			// Get extension from either mime-type or title, if not present (e.g., SVGs)
			var extension = ((extension = $('.mime-type').text()) && extension.split(/\//)[1]) || mw.Title.newFromText(Morebits.pageNameNorm).getExtension();
			if (extension) {
				var extensionUpper = extension.toUpperCase();
				// What self-respecting file format has *two* extensions?!
				if (extensionUpper === 'JPG') {
					extension = 'JPEG';
				}

				// Check that selected templates make sense given the file's extension.

				// Bad GIF|JPEG|SVG
				var badIndex; // Keep track of where the offending template is so we can reference it below
				if ((extensionUpper !== 'GIF' && ((badIndex = params.tags.indexOf('Bad GIF')) !== -1)) ||
					(extensionUpper !== 'JPEG' && ((badIndex = params.tags.indexOf('Bad JPEG')) !== -1)) ||
					(extensionUpper !== 'SVG' && ((badIndex = params.tags.indexOf('Bad SVG')) !== -1))) {
					var suggestion = 'This appears to be a ' + extension + ' file, ';
					if (['GIF', 'JPEG', 'SVG'].indexOf(extensionUpper) !== -1) {
						suggestion += 'please use {{Bad ' + extensionUpper + '}} instead.';
					} else {
						suggestion += 'so {{' + params.tags[badIndex] + '}} is inappropriate.';
					}
					alert(suggestion);
					return;
				}
				// Should be PNG|SVG
				if ((params.tags.toString().indexOf('Should be ') !== -1) && (params.tags.indexOf('Should be ' + extensionUpper) !== -1)) {
					alert('This is already a ' + extension + ' file, so {{Should be ' + extensionUpper + '}} is inappropriate.');
					return;
				}

				// Overcompressed JPEG
				if (params.tags.indexOf('Overcompressed JPEG') !== -1 && extensionUpper !== 'JPEG') {
					alert('This appears to be a ' + extension + ' file, so {{Overcompressed JPEG}} probably doesn\'t apply.');
					return;
				}
				// Bad trace and Bad font
				if (extensionUpper !== 'SVG') {
					if (params.tags.indexOf('Bad trace') !== -1) {
						alert('This appears to be a ' + extension + ' file, so {{Bad trace}} probably doesn\'t apply.');
						return;
					} else if (params.tags.indexOf('Bad font') !== -1) {
						alert('This appears to be a ' + extension + ' file, so {{Bad font}} probably doesn\'t apply.');
						return;
					}
				}
			}

			if (params.tags.indexOf('Do not move to Commons') !== -1 && params.DoNotMoveToCommons_expiry &&
				(!/^2\d{3}$/.test(params.DoNotMoveToCommons_expiry) || parseInt(params.DoNotMoveToCommons_expiry, 10) <= new Date().getFullYear())) {
				alert('Must be a valid future year.');
				return;
			}
			break;

		case 'redirect':
			if (checkIncompatible(['R printworthy', 'R unprintworthy'])) {
				return;
			}
			if (checkIncompatible(['R from subtopic', 'R to subtopic'])) {
				return;
			}
			if (checkIncompatible([
				'R to category namespace',
				'R to help namespace',
				'R to main namespace',
				'R to portal namespace',
				'R to project namespace',
				'R to user namespace'
			])) {
				return;
			}
			break;

		default:
			alert('Twinkle.tag: unknown mode ' + Twinkle.tag.mode);
			break;
	}

	// File/redirect: return if no tags selected
	// Article: return if no tag is selected and no already present tag is deselected
	if (params.tags.length === 0 && (Twinkle.tag.mode !== 'article' || params.tagsToRemove.length === 0)) {
		alert('আপনাকে অন্তত একটি ট্যাগ নির্বাচন করতে হবে!');
		return;
	}

	Morebits.simpleWindow.setButtonsEnabled(false);
	Morebits.status.init(form);

	Morebits.wiki.actionCompleted.redirect = Morebits.pageNameNorm;
	Morebits.wiki.actionCompleted.notice = 'ট্যাগিং সম্পন্ন হয়েছে, কিছুক্ষণের মধ্যেই পাতাটি পুনঃলোড করা হবে';
	if (Twinkle.tag.mode === 'redirect') {
		Morebits.wiki.actionCompleted.followRedirect = false;
	}

	var wikipedia_page = new Morebits.wiki.page(Morebits.pageNameNorm, 'পাতায় ট্যাগ যোগ করা হচ্ছে'); /* বার্তা থেকে নামস্থান বাদ */ 
 wikipedia_page.setCallbackParameters(params);
	wikipedia_page.setChangeTags(Twinkle.changeTags); // Here to apply to triage
	wikipedia_page.load(Twinkle.tag.callbacks[Twinkle.tag.mode]);

};

Twinkle.addInitCallback(Twinkle.tag, 'tag');
})(jQuery);
// </nowiki>
