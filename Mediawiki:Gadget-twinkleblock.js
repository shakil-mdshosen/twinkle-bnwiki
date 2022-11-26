// <nowiki>
/****

অনুবাদ:
*Yahya
*Al Riaz Uddin Ripon

****/

(function($) {

var api = new mw.Api(), relevantUserName, blockedUserName;
var menuFormattedNamespaces = $.extend({}, mw.config.get('wgFormattedNamespaces'));
menuFormattedNamespaces[0] = '(Article)';

/*
 ****************************************
 *** twinkleblock.js: Block module
 ****************************************
 * Mode of invocation:     Tab ("Block")
 * Active on:              Any page with relevant user name (userspace, contribs, etc.)
 */

Twinkle.block = function twinkleblock() {
	relevantUserName = mw.config.get('wgRelevantUserName');
	// should show on Contributions or Block pages, anywhere there's a relevant user
	// Ignore ranges wider than the CIDR limit
	if (Morebits.userIsSysop && relevantUserName && (!Morebits.ip.isRange(relevantUserName) || Morebits.ip.validCIDR(relevantUserName))) {
		Twinkle.addPortletLink(Twinkle.block.callback, 'বাধাদান', 'tw-block', 'Block relevant user');
	}
};

Twinkle.block.callback = function twinkleblockCallback() {
	if (relevantUserName === mw.config.get('wgUserName') &&
			!confirm('আপনি নিজেকেই বাধাপ্রদান করতে যাচ্ছেন! আপনি কী নিশ্চিত যে আপনি এটি-ই করতে চান?')) {
		return;
	}

	Twinkle.block.currentBlockInfo = undefined;
	Twinkle.block.field_block_options = {};
	Twinkle.block.field_template_options = {};

	var Window = new Morebits.simpleWindow(650, 530);
	// need to be verbose about who we're blocking
	Window.setTitle('বাধাদান অথবা সমস্যা সম্পর্কিত বাধাদান টেমপ্লেট ' + relevantUserName);
	Window.setScriptName('টুইংকল');
	Window.addFooterLink('বাধাদান টেমপ্লেট', 'Template:Uw-block/doc/Block_templates');
	Window.addFooterLink('বাধাদান নীতি', 'WP:BLOCK');
	Window.addFooterLink('বাধাদানের পছন্দ', 'WP:TW/PREF#block');
	Window.addFooterLink('টুইংকল', 'WP:TW/DOC#block');
	Window.addFooterLink('প্রতিক্রিয়া জানান', 'WT:TW');

	// Always added, hidden later if actual user not blocked
	Window.addFooterLink('এই ব্যবহারকারীর বাধা তুলুন', 'Special:Unblock/' + relevantUserName, true);

	var form = new Morebits.quickForm(Twinkle.block.callback.evaluate);
	var actionfield = form.append({
		type: 'field',
		label: 'কার্যের ধরন'
	});
	actionfield.append({
		type: 'checkbox',
		name: 'actiontype',
		event: Twinkle.block.callback.change_action,
		list: [
			{
				label: 'ব্যবহারকারীকে বাধাদান ',
				value: 'block',
				tooltip: 'Block the relevant user with the given options. If partial block is unchecked, this will be a sitewide block.',
				checked: true
			},
			{
				label: 'আংশিক বাধাদান',
				value: 'partial',
				tooltip: 'Enable partial blocks and partial block templates.',
				checked: Twinkle.getPref('defaultToPartialBlocks') // Overridden if already blocked
			},
			{
				label: 'ব্যবহারকারীর আলাপ পাতায় বাধা প্রদানের টেমপ্লেট যোগ করুন',
				value: 'template',
				tooltip: 'If the blocking admin forgot to issue a block template, or you have just blocked the user without templating them, you can use this to issue the appropriate template. Check the partial block box for partial block templates.',
				// Disallow when viewing the block dialog on an IP range
				checked: !Morebits.ip.isRange(relevantUserName),
				disabled: Morebits.ip.isRange(relevantUserName)
			}
		]
	});

	/*
	  Add option for IPv6 ranges smaller than /64 to upgrade to the 64
	  CIDR ([[WP:/64]]).  This is one of the few places where we want
	  wgRelevantUserName since this depends entirely on the original user.
	  In theory, we shouldn't use Morebits.ip.get64 here since since we want
	  to exclude functionally-equivalent /64s.  That'd be:
	  // if (mw.util.isIPv6Address(mw.config.get('wgRelevantUserName'), true) &&
	  // (mw.util.isIPv6Address(mw.config.get('wgRelevantUserName')) || parseInt(mw.config.get('wgRelevantUserName').replace(/^(.+?)\/?(\d{1,3})?$/, '$2'), 10) > 64)) {
	  In practice, though, since functionally-equivalent ranges are
	  (mis)treated as separate by MediaWiki's logging ([[phab:T146628]]),
	  using Morebits.ip.get64 provides a modicum of relief in thise case.
	*/
	var sixtyFour = Morebits.ip.get64(mw.config.get('wgRelevantUserName'));
	if (sixtyFour && sixtyFour !== mw.config.get('wgRelevantUserName')) {
		var block64field = form.append({
			type: 'field',
			label: 'Convert to /64 rangeblock',
			name: 'field_64'
		});
		block64field.append({
			type: 'div',
			style: 'margin-bottom: 0.5em',
			label: ['It\'s usually fine, if not better, to ', $.parseHTML('<a target="_blank" href="' + mw.util.getUrl('WP:/64') + '">just block the /64</a>')[0], ' range (',
				$.parseHTML('<a target="_blank" href="' + mw.util.getUrl('Special:Contributions/' + sixtyFour) + '">' + sixtyFour + '</a>)')[0], ').']
		});
		block64field.append({
			type: 'checkbox',
			name: 'block64',
			event: Twinkle.block.callback.change_block64,
			list: [{
				checked: Twinkle.getPref('defaultToBlock64'),
				label: 'Block the /64 instead',
				value: 'block64',
				tooltip: Morebits.ip.isRange(mw.config.get('wgRelevantUserName')) ? 'Will eschew leaving a template.' : 'Any template issued will go to the original IP: ' + mw.config.get('wgRelevantUserName')
			}]
		});
	}

	form.append({ type: 'field', label: 'প্রিসেট', name: 'field_preset' });
	form.append({ type: 'field', label: 'টেমপ্লেট অপশন', name: 'field_template_options' });
	form.append({ type: 'field', label: 'বাধাদানের অপশন', name: 'field_block_options' });

	form.append({ type: 'submit' });

	var result = form.render();
	Window.setContent(result);
	Window.display();
	result.root = result;

	Twinkle.block.fetchUserInfo(function() {
		// Toggle initial partial state depending on prior block type,
		// will override the defaultToPartialBlocks pref
		if (blockedUserName === relevantUserName) {
			$(result).find('[name=actiontype][value=partial]').prop('checked', Twinkle.block.currentBlockInfo.partial === '');
		}

		// clean up preset data (defaults, etc.), done exactly once, must be before Twinkle.block.callback.change_action is called
		Twinkle.block.transformBlockPresets();

		// init the controls after user and block info have been fetched
		var evt = document.createEvent('Event');
		evt.initEvent('change', true, true);

		if (result.block64 && result.block64.checked) {
			// Calls the same change_action event once finished
			result.block64.dispatchEvent(evt);
		} else {
			result.actiontype[0].dispatchEvent(evt);
		}
	});
};

// Store fetched user data, only relevant if switching IPv6 to a /64
Twinkle.block.fetchedData = {};
// Processes the data from a a query response, separated from
// Twinkle.block.fetchUserInfo to allow reprocessing of already-fetched data
Twinkle.block.processUserInfo = function twinkleblockProcessUserInfo(data, fn) {
	var blockinfo = data.query.blocks[0],
		userinfo = data.query.users[0];
	// If an IP is blocked *and* rangeblocked, the above finds
	// whichever block is more recent, not necessarily correct.
	// Three seems... unlikely
	if (data.query.blocks.length > 1 && blockinfo.user !== relevantUserName) {
		blockinfo = data.query.blocks[1];
	}
	// Cache response, used when toggling /64 blocks
	Twinkle.block.fetchedData[userinfo.name] = data;

	Twinkle.block.isRegistered = !!userinfo.userid;
	if (Twinkle.block.isRegistered) {
		Twinkle.block.userIsBot = !!userinfo.groupmemberships && userinfo.groupmemberships.map(function(e) {
			return e.group;
		}).indexOf('bot') !== -1;
	} else {
		Twinkle.block.userIsBot = false;
	}

	if (blockinfo) {
		// handle frustrating system of inverted boolean values
		blockinfo.disabletalk = blockinfo.allowusertalk === undefined;
		blockinfo.hardblock = blockinfo.anononly === undefined;
	}
	// will undefine if no blocks present
	Twinkle.block.currentBlockInfo = blockinfo;
	blockedUserName = Twinkle.block.currentBlockInfo && Twinkle.block.currentBlockInfo.user;

	// Toggle unblock link if not the user in question; always first
	var unblockLink = document.querySelector('.morebits-dialog-footerlinks a');
	if (blockedUserName !== relevantUserName) {
		unblockLink.hidden = true, unblockLink.nextSibling.hidden = true; // link+trailing bullet
	} else {
		unblockLink.hidden = false, unblockLink.nextSibling.hidden = false; // link+trailing bullet
	}

	// Semi-busted on ranges, see [[phab:T270737]] and [[phab:T146628]].
	// Basically, logevents doesn't treat functionally-equivalent ranges
	// as equivalent, meaning any functionally-equivalent IP range is
	// misinterpreted by the log throughout.  Without logevents
	// redirecting (like Special:Block does) we would need a function to
	// parse ranges, which is a pain.  IPUtils has the code, but it'd be a
	// lot of cruft for one purpose.
	Twinkle.block.hasBlockLog = !!data.query.logevents.length;
	Twinkle.block.blockLog = Twinkle.block.hasBlockLog && data.query.logevents;
	// Used later to check if block status changed while filling out the form
	Twinkle.block.blockLogId = Twinkle.block.hasBlockLog ? data.query.logevents[0].logid : false;

	if (typeof fn === 'function') {
		return fn();
	}
};

Twinkle.block.fetchUserInfo = function twinkleblockFetchUserInfo(fn) {
	var query = {
		format: 'json',
		action: 'query',
		list: 'blocks|users|logevents',
		letype: 'block',
		lelimit: 1,
		letitle: 'User:' + relevantUserName,
		bkprop: 'expiry|reason|flags|restrictions|range|user',
		ususers: relevantUserName
	};

	// bkusers doesn't catch single IPs blocked as part of a range block
	if (mw.util.isIPAddress(relevantUserName, true)) {
		query.bkip = relevantUserName;
	} else {
		query.bkusers = relevantUserName;
		// groupmemberships only relevant for registered users
		query.usprop = 'groupmemberships';
	}

	api.get(query).then(function(data) {
		Twinkle.block.processUserInfo(data, fn);
	}, function(msg) {
		Morebits.status.init($('div[name="currentblock"] span').last()[0]);
		Morebits.status.warn('Error fetching user info', msg);
	});
};

Twinkle.block.callback.saveFieldset = function twinkleblockCallbacksaveFieldset(fieldset) {
	Twinkle.block[$(fieldset).prop('name')] = {};
	$(fieldset).serializeArray().forEach(function(el) {
		// namespaces and pages for partial blocks are overwritten
		// here, but we're handling them elsewhere so that's fine
		Twinkle.block[$(fieldset).prop('name')][el.name] = el.value;
	});
};

Twinkle.block.callback.change_block64 = function twinkleblockCallbackChangeBlock64(e) {
	var $form = $(e.target.form), $block64 = $form.find('[name=block64]');

	// Show/hide block64 button
	// Single IPv6, or IPv6 range smaller than a /64
	var priorName = relevantUserName;
	if ($block64.is(':checked')) {
		relevantUserName = Morebits.ip.get64(mw.config.get('wgRelevantUserName'));
	} else {
		relevantUserName = mw.config.get('wgRelevantUserName');
	}
	// No templates for ranges, but if the original user is a single IP, offer the option
	// (done separately in Twinkle.block.callback.issue_template)
	var originalIsRange = Morebits.ip.isRange(mw.config.get('wgRelevantUserName'));
	$form.find('[name=actiontype][value=template]').prop('disabled', originalIsRange).prop('checked', !originalIsRange);

	// Refetch/reprocess user info then regenerate the main content
	var regenerateForm = function() {
		// Tweak titlebar text.  In theory, we could save the dialog
		// at initialization and then use `.setTitle` or
		// `dialog('option', 'title')`, but in practice that swallows
		// the scriptName and requires `.display`ing, which jumps the
		// window.  It's just a line of text, so this is fine.
		var titleBar = document.querySelector('.ui-dialog-title').firstChild.nextSibling;
		titleBar.nodeValue = titleBar.nodeValue.replace(priorName, relevantUserName);
		// Tweak unblock link
		var unblockLink = document.querySelector('.morebits-dialog-footerlinks a');
		unblockLink.href = unblockLink.href.replace(priorName, relevantUserName);
		unblockLink.title = unblockLink.title.replace(priorName, relevantUserName);

		// Correct partial state
		$form.find('[name=actiontype][value=partial]').prop('checked', Twinkle.getPref('defaultToPartialBlocks'));
		if (blockedUserName === relevantUserName) {
			$form.find('[name=actiontype][value=partial]').prop('checked', Twinkle.block.currentBlockInfo.partial === '');
		}

		// Set content appropriately
		Twinkle.block.callback.change_action(e);
	};

	if (Twinkle.block.fetchedData[relevantUserName]) {
		Twinkle.block.processUserInfo(Twinkle.block.fetchedData[relevantUserName], regenerateForm);
	} else {
		Twinkle.block.fetchUserInfo(regenerateForm);
	}
};

Twinkle.block.callback.change_action = function twinkleblockCallbackChangeAction(e) {
	var field_preset, field_template_options, field_block_options, $form = $(e.target.form);
	// Make ifs shorter
	var blockBox = $form.find('[name=actiontype][value=block]').is(':checked');
	var templateBox = $form.find('[name=actiontype][value=template]').is(':checked');
	var $partial = $form.find('[name=actiontype][value=partial]');
	var partialBox = $partial.is(':checked');
	var blockGroup = partialBox ? Twinkle.block.blockGroupsPartial : Twinkle.block.blockGroups;

	$partial.prop('disabled', !blockBox && !templateBox);

	// Add current block parameters as default preset
	var prior = { label: 'পূর্ববর্তী বাধাদান' };
	if (blockedUserName === relevantUserName) {
		Twinkle.block.blockPresetsInfo.prior = Twinkle.block.currentBlockInfo;
		// value not a valid template selection, chosen below by setting templateName
		prior.list = [{ label: 'পূর্ববর্তী বাধাদান সেটিং', value: 'prior', selected: true }];

		// Arrays of objects are annoying to check
		if (!blockGroup.some(function(bg) {
			return bg.label === prior.label;
		})) {
			blockGroup.push(prior);
		}

		// Always ensure proper template exists/is selected when switching modes
		if (partialBox) {
			Twinkle.block.blockPresetsInfo.prior.templateName = Morebits.string.isInfinity(Twinkle.block.currentBlockInfo.expiry) ? 'uw-pblockindef' : 'uw-pblock';
		} else {
			if (!Twinkle.block.isRegistered) {
				Twinkle.block.blockPresetsInfo.prior.templateName = 'uw-ablock';
			} else {
				Twinkle.block.blockPresetsInfo.prior.templateName = Morebits.string.isInfinity(Twinkle.block.currentBlockInfo.expiry) ? 'uw-blockindef' : 'uw-block';
			}
		}
	} else {
		// But first remove any prior prior
		blockGroup = blockGroup.filter(function(bg) {
			return bg.label !== prior.label;
		});
	}

	// Can be in preset or template field, so the old one in the template
	// field will linger. No need to keep the old value around, so just
	// remove it; saves trouble when hiding/evaluating
	$form.find('[name=dstopic]').parent().remove();

	Twinkle.block.callback.saveFieldset($('[name=field_block_options]'));
	Twinkle.block.callback.saveFieldset($('[name=field_template_options]'));

	if (blockBox) {
		field_preset = new Morebits.quickForm.element({ type: 'field', label: 'প্রিসেট', name: 'field_preset' });
		field_preset.append({
			type: 'select',
			name: 'preset',
			label: 'প্রিসেট পছন্দ করুন:',
			event: Twinkle.block.callback.change_preset,
			list: Twinkle.block.callback.filtered_block_groups(blockGroup)
		});

		field_block_options = new Morebits.quickForm.element({ type: 'field', label: 'বাধাদানের অপশন', name: 'field_block_options' });
		field_block_options.append({ type: 'div', name: 'currentblock', label: ' ' });
		field_block_options.append({ type: 'div', name: 'hasblocklog', label: ' ' });
		field_block_options.append({
			type: 'select',
			name: 'expiry_preset',
			label: 'মেয়াদোত্তীর্ণ:',
			event: Twinkle.block.callback.change_expiry,
			list: [
				{ label: 'অন্য সময়', value: 'custom', selected: true },
				{ label: 'অসীম', value: 'infinity' },
				{ label: '৩ ঘণ্টা', value: '3 hours' },
				{ label: '১২ ঘণ্টা', value: '12 hours' },
				{ label: '২৪ ঘণ্টা', value: '24 hours' },
				{ label: '৩১ ঘণ্টা', value: '31 hours' },
				{ label: '৩৬ ঘণ্টা', value: '36 hours' },
				{ label: '৪৮ ঘণ্টা', value: '48 hours' },
				{ label: '৬০ ঘণ্টা', value: '60 hours' },
				{ label: '৭২ ঘণ্টা', value: '72 hours' },
				{ label: '১ সপ্তাহ', value: '1 week' },
				{ label: '২ সপ্তাহ', value: '2 weeks' },
				{ label: '১ মাস', value: '1 month' },
				{ label: '৩ মাস', value: '3 months' },
				{ label: '৬ মাস', value: '6 months' },
				{ label: '১ বছর', value: '1 year' },
				{ label: '২ বছর', value: '2 years' },
				{ label: '৩ বছর', value: '3 years' }
			]
		});
		field_block_options.append({
			type: 'input',
			name: 'expiry',
			label: 'মেয়াদোত্তীর্ণের অন্য সময়',
			tooltip: 'You can use relative times, like "1 minute" or "19 days", or absolute timestamps, "yyyymmddhhmm" (e.g. "200602011405" is Feb 1, 2006, at 14:05 UTC).',
			value: Twinkle.block.field_block_options.expiry || Twinkle.block.field_template_options.template_expiry
		});

		if (partialBox) { // Partial block
			field_block_options.append({
				type: 'select',
				multiple: true,
				name: 'pagerestrictions',
				label: 'নির্দিষ্ট পাতায় সম্পাদনা থেকে বাধাদান',
				value: '',
				tooltip: '10 page max.'
			});
			var ns = field_block_options.append({
				type: 'select',
				multiple: true,
				name: 'namespacerestrictions',
				label: 'নামস্থানে বাধাদান',
				value: '',
				tooltip: 'Block from editing these namespaces.'
			});
			$.each(menuFormattedNamespaces, function(number, name) {
				// Ignore -1: Special; -2: Media; and 2300-2303: Gadget (talk) and Gadget definition (talk)
				if (number >= 0 && number < 830) {
					ns.append({ type: 'option', label: name, value: number });
				}
			});
		}

		var blockoptions = [
			{
				checked: Twinkle.block.field_block_options.nocreate,
				label: 'অ্যাকাউন্ট সৃষ্টিকরণ',
				name: 'nocreate',
				value: '1'
			},
			{
				checked: Twinkle.block.field_block_options.noemail,
				label: 'ইমেইল পাঠানো',
				name: 'noemail',
				value: '1'
			},
			{
				checked: Twinkle.block.field_block_options.disabletalk,
				label: 'নিজের আলাপ পাতা সম্পাদনা',
				name: 'disabletalk',
				value: '1',
				tooltip: partialBox ? 'If issuing a partial block, this MUST remain unchecked unless you are also preventing them from editing User talk space' : ''
			}
		];

		if (Twinkle.block.isRegistered) {
			blockoptions.push({
				checked: Twinkle.block.field_block_options.autoblock,
				label: 'যেকোনো আইপি ঠিকানা ব্যবহারে স্বয়ংক্রিয়বাধাদান (কঠোর বাধাদান)',
				name: 'autoblock',
				value: '1'
			});
		} else {
			blockoptions.push({
				checked: Twinkle.block.field_block_options.hardblock,
				label: 'এই আইপি ঠিকানা দিয়ে প্রবেশকৃত  ব্যবহারকারীকে বাধাদান (কঠোর বাধাদান)',
				name: 'hardblock',
				value: '1'
			});
		}

		blockoptions.push({
			checked: Twinkle.block.field_block_options.watchuser,
			label: 'এই ব্যবহারকারীর পাতা ও আলাপের পাতা নজর তালিকায় রাখুন',
			name: 'watchuser',
			value: '1'
		});

		field_block_options.append({
			type: 'checkbox',
			name: 'blockoptions',
			list: blockoptions
		});
		field_block_options.append({
			type: 'textarea',
			label: 'কারণ (বাধাদান লগের জন্য):',
			name: 'reason',
			tooltip: 'Consider adding helpful details to the default message.',
			value: Twinkle.block.field_block_options.reason
		});

		field_block_options.append({
			type: 'div',
			name: 'filerlog_label',
			label: 'আরও দেখুন:',
			style: 'display:inline-block;font-style:normal !important',
			tooltip: 'Insert a "see also" message to indicate whether the filter log or deleted contributions played a role in the decision to block.'
		});
		field_block_options.append({
			type: 'checkbox',
			name: 'filter_see_also',
			event: Twinkle.block.callback.toggle_see_alsos,
			style: 'display:inline-block; margin-right:5px',
			list: [
				{
					label: 'ছাঁকনি লগ',
					checked: false,
					value: 'ছাঁকনি লগ'
				}
			]
		});
		field_block_options.append({
			type: 'checkbox',
			name: 'deleted_see_also',
			event: Twinkle.block.callback.toggle_see_alsos,
			style: 'display:inline-block',
			list: [
				{
					label: 'মুছে ফেলা অবদান',
					checked: false,
					value: 'মুছে ফেলা অবদান'
				}
			]
		});

		// Yet-another-logevents-doesn't-handle-ranges-well
		if (blockedUserName === relevantUserName) {
			field_block_options.append({ type: 'hidden', name: 'reblock', value: '1' });
		}
	}

	// grab discretionary sanctions list from en-wiki
	Twinkle.block.dsinfo = Morebits.wiki.getCachedJson('Template:Ds/topics.json');

	Twinkle.block.dsinfo.then(function(dsinfo) {
		var $select = $('[name="dstopic"]');
		var $options = $.map(dsinfo, function (value, key) {
			return $('<option>').val(value.code).text(key).prop('label', key);
		});
		$select.append($options);
	});
	// DS selection visible in either the template field set or preset,
	// joint settings saved here
	var dsSelectSettings = {
		type: 'select',
		name: 'dstopic',
		label: 'DS topic',
		value: '',
		tooltip: 'If selected, it will inform the template and may be added to the blocking message',
		event: Twinkle.block.callback.toggle_ds_reason
	};
	if (templateBox) {
		field_template_options = new Morebits.quickForm.element({ type: 'field', label: 'টেমপ্লেট অপশন', name: 'field_template_options' });
		field_template_options.append({
			type: 'select',
			name: 'template',
			label: 'আলাপ পাতা টেমপ্লেট পছন্দ করুন:',
			event: Twinkle.block.callback.change_template,
			list: Twinkle.block.callback.filtered_block_groups(blockGroup, true),
			value: Twinkle.block.field_template_options.template
		});

		// Only visible for aeblock and aepblock, toggled in change_template
		field_template_options.append(dsSelectSettings);

		field_template_options.append({
			type: 'input',
			name: 'article',
			label: 'সংযুক্ত পাতা',
			value: '',
			tooltip: 'A page can be linked within the notice, perhaps if it was the primary target of disruption. Leave empty for no page to be linked.'
		});

		// Only visible if partial and not blocking
		field_template_options.append({
			type: 'input',
			name: 'area',
			label: 'Area blocked from',
			value: '',
			tooltip: 'Optional explanation of the pages or namespaces the user was blocked from editing.'
		});

		if (!blockBox) {
			field_template_options.append({
				type: 'input',
				name: 'template_expiry',
				label: 'বাধাদানের সীমা:',
				value: '',
				tooltip: 'The period the blocking is due for, for example 24 hours, 2 weeks, indefinite etc...'
			});
		}
		field_template_options.append({
			type: 'input',
			name: 'block_reason',
			label: '"আপনাকে বাধাদান করা হয়েছে ..."',
			tooltip: 'An optional reason, to replace the default generic reason. Only available for the generic block templates.',
			value: Twinkle.block.field_template_options.block_reason
		});

		if (blockBox) {
			field_template_options.append({
				type: 'checkbox',
				name: 'blank_duration',
				list: [
					{
						label: 'আলাপ পাতায় মেয়াদোত্তীর্ণের সময় অন্তর্ভূক্ত করবেন না',
						checked: Twinkle.block.field_template_options.blank_duration,
						tooltip: 'Instead of including the duration, make the block template read "You have been blocked temporarily..."'
					}
				]
			});
		} else {
			field_template_options.append({
				type: 'checkbox',
				list: [
					{
						label: 'আলাপ পাতার প্রবেশাধিকার বন্ধ',
						name: 'notalk',
						checked: Twinkle.block.field_template_options.notalk,
						tooltip: 'Make the block template state that the user\'s talk page access has been removed'
					},
					{
						label: 'ইমেইল পাঠানো থেকে বাধাপ্রাপ্ত',
						name: 'noemail_template',
						checked: Twinkle.block.field_template_options.noemail_template,
						tooltip: 'If the area is not provided, make the block template state that the user\'s email access has been removed'
					},
					{
						label: 'অ্যাকাউন্ট তৈরিতে বাধাপ্রাপ্ত',
						name: 'nocreate_template',
						checked: Twinkle.block.field_template_options.nocreate_template,
						tooltip: 'If the area is not provided, make the block template state that the user\'s ability to create accounts has been removed'
					}
				]
			});
		}

		var $previewlink = $('<a id="twinkleblock-preview-link">প্রাকদর্শন</a>');
		$previewlink.off('click').on('click', function() {
			Twinkle.block.callback.preview($form[0]);
		});
		$previewlink.css({cursor: 'pointer'});
		field_template_options.append({ type: 'div', id: 'blockpreview', label: [ $previewlink[0] ] });
		field_template_options.append({ type: 'div', id: 'twinkleblock-previewbox', style: 'display: none' });
	} else if (field_preset) {
		// Only visible for arbitration enforcement, toggled in change_preset
		field_preset.append(dsSelectSettings);
	}

	var oldfield;
	if (field_preset) {
		oldfield = $form.find('fieldset[name="field_preset"]')[0];
		oldfield.parentNode.replaceChild(field_preset.render(), oldfield);
	} else {
		$form.find('fieldset[name="field_preset"]').hide();
	}
	if (field_block_options) {
		oldfield = $form.find('fieldset[name="field_block_options"]')[0];
		oldfield.parentNode.replaceChild(field_block_options.render(), oldfield);
		$form.find('fieldset[name="field_64"]').show();


		$form.find('[name=pagerestrictions]').select2({
			width: '100%',
			placeholder: 'Select pages to block user from',
			language: {
				errorLoading: function() {
					return 'Incomplete or invalid search term';
				}
			},
			maximumSelectionLength: 10, // Software limitation [[phab:T202776]]
			minimumInputLength: 1, // prevent ajax call when empty
			ajax: {
				url: mw.util.wikiScript('api'),
				dataType: 'json',
				delay: 100,
				data: function(params) {
					var title = mw.Title.newFromText(params.term);
					if (!title) {
						return;
					}
					return {
						action: 'query',
						format: 'json',
						list: 'allpages',
						apfrom: title.title,
						apnamespace: title.namespace,
						aplimit: '10'
					};
				},
				processResults: function(data) {
					return {
						results: data.query.allpages.map(function(page) {
							var title = mw.Title.newFromText(page.title, page.ns).toText();
							return {
								id: title,
								text: title
							};
						})
					};
				}
			},
			templateSelection: function(choice) {
				return $('<a>').text(choice.text).attr({
					href: mw.util.getUrl(choice.text),
					target: '_blank'
				});
			}
		});

		$form.find('[name=namespacerestrictions]').select2({
			width: '100%',
			matcher: Morebits.select2.matchers.wordBeginning,
			language: {
				searching: Morebits.select2.queryInterceptor
			},
			templateResult: Morebits.select2.highlightSearchMatches,
			placeholder: 'Select namespaces to block user from'
		});

		mw.util.addCSS(
			// Reduce padding
			'.select2-results .select2-results__option { padding-top: 1px; padding-bottom: 1px; }' +
			// Adjust font size
			'.select2-container .select2-dropdown .select2-results { font-size: 13px; }' +
			'.select2-container .selection .select2-selection__rendered { font-size: 13px; }' +
			// Remove black border
			'.select2-container--default.select2-container--focus .select2-selection--multiple { border: 1px solid #aaa; }' +
			// Make the tiny cross larger
			'.select2-selection__choice__remove { font-size: 130%; }'
		);
	} else {
		$form.find('fieldset[name="field_block_options"]').hide();
		$form.find('fieldset[name="field_64"]').hide();
		// Clear select2 options
		$form.find('[name=pagerestrictions]').val(null).trigger('change');
		$form.find('[name=namespacerestrictions]').val(null).trigger('change');
	}

	if (field_template_options) {
		oldfield = $form.find('fieldset[name="field_template_options"]')[0];
		oldfield.parentNode.replaceChild(field_template_options.render(), oldfield);
		e.target.form.root.previewer = new Morebits.wiki.preview($(e.target.form.root).find('#twinkleblock-previewbox').last()[0]);
	} else {
		$form.find('fieldset[name="field_template_options"]').hide();
	}

	// Any block, including ranges
	if (Twinkle.block.currentBlockInfo) {
		// false for an ip covered by a range or a smaller range within a larger range;
		// true for a user, single ip block, or the exact range for a range block
		var sameUser = blockedUserName === relevantUserName;

		Morebits.status.init($('div[name="currentblock"] span').last()[0]);
		var statusStr = relevantUserName + ' is ' + (Twinkle.block.currentBlockInfo.partial === '' ? 'partially blocked' : 'blocked sitewide');

		// Range blocked
		if (Twinkle.block.currentBlockInfo.rangestart !== Twinkle.block.currentBlockInfo.rangeend) {
			if (sameUser) {
				statusStr += ' as a rangeblock';
			} else {
				statusStr += ' within a' + (Morebits.ip.get64(relevantUserName) === blockedUserName ? ' /64' : '') + ' rangeblock';
				// Link to the full range
				var $rangeblockloglink = $('<span>').append($('<a target="_blank" href="' + mw.util.getUrl('Special:Log', {action: 'view', page: blockedUserName, type: 'block'}) + '">' + blockedUserName + '</a>)'));
				statusStr += ' (' + $rangeblockloglink.html() + ')';
			}
		}

		if (Twinkle.block.currentBlockInfo.expiry === 'infinity') {
			statusStr += ' (indefinite)';
		} else if (new Morebits.date(Twinkle.block.currentBlockInfo.expiry).isValid()) {
			statusStr += ' (expires ' + new Morebits.date(Twinkle.block.currentBlockInfo.expiry).calendar('utc') + ')';
		}


		var infoStr = 'This form will';
		if (sameUser) {
			infoStr += ' change that block';
			if (Twinkle.block.currentBlockInfo.partial === undefined && partialBox) {
				infoStr += ', converting it to a partial block';
			} else if (Twinkle.block.currentBlockInfo.partial === '' && !partialBox) {
				infoStr += ', converting it to a sitewide block';
			}
			infoStr += '.';
		} else {
			infoStr += ' add an additional ' + (partialBox ? 'partial ' : '') + 'block.';
		}

		Morebits.status.warn(statusStr, infoStr);

		// Default to the current block conditions on intial form generation
		Twinkle.block.callback.update_form(e, Twinkle.block.currentBlockInfo);
	}

	// This is where T146628 really comes into play: a rangeblock will
	// only return the correct block log if wgRelevantUserName is the
	// exact range, not merely a funtional equivalent
	if (Twinkle.block.hasBlockLog) {
		var $blockloglink = $('<span>').append($('<a target="_blank" href="' + mw.util.getUrl('Special:Log', {action: 'view', page: relevantUserName, type: 'block'}) + '">block log</a>)'));
		if (!Twinkle.block.currentBlockInfo) {
			var lastBlockAction = Twinkle.block.blockLog[0];
			if (lastBlockAction.action === 'unblock') {
				$blockloglink.append(' (unblocked ' + new Morebits.date(lastBlockAction.timestamp).calendar('utc') + ')');
			} else { // block or reblock
				$blockloglink.append(' (' + lastBlockAction.params.duration + ', expired ' + new Morebits.date(lastBlockAction.params.expiry).calendar('utc') + ')');
			}
		}

		Morebits.status.init($('div[name="hasblocklog"] span').last()[0]);
		Morebits.status.warn(Twinkle.block.currentBlockInfo ? 'Previous blocks' : 'This ' + (Morebits.ip.isRange(relevantUserName) ? 'range' : 'user') + ' has been blocked in the past', $blockloglink[0]);
	}

	// Make sure all the fields are correct based on initial defaults
	if (blockBox) {
		Twinkle.block.callback.change_preset(e);
	} else if (templateBox) {
		Twinkle.block.callback.change_template(e);
	}
};

/*
 * Keep alphabetized by key name, Twinkle.block.blockGroups establishes
 *    the order they will appear in the interface
 *
 * Block preset format, all keys accept only 'true' (omit for false) except where noted:
 * <title of block template> : {
 *   autoblock: <autoblock any IP addresses used (for registered users only)>
 *   disabletalk: <disable user from editing their own talk page while blocked>
 *   expiry: <string - expiry timestamp, can include relative times like "5 months", "2 weeks" etc>
 *   forAnonOnly: <show block option in the interface only if the relevant user is an IP>
 *   forRegisteredOnly: <show block option in the interface only if the relevant user is registered>
 *   label: <string - label for the option of the dropdown in the interface (keep brief)>
 *   noemail: prevent the user from sending email through Special:Emailuser
 *   pageParam: <set if the associated block template accepts a page parameter>
 *   prependReason: <string - prepends the value of 'reason' to the end of the existing reason, namely for when revoking talk page access>
 *   nocreate: <block account creation from the user's IP (for anonymous users only)>
 *   nonstandard: <template does not conform to stewardship of WikiProject User Warnings and may not accept standard parameters>
 *   reason: <string - block rationale, as would appear in the block log,
 *            and the edit summary for when adding block template, unless 'summary' is set>
 *   reasonParam: <set if the associated block template accepts a reason parameter>
 *   sig: <string - set to ~~~~ if block template does not accept "true" as the value, or set null to omit sig param altogether>
 *   summary: <string - edit summary for when adding block template to user's talk page, if not set, 'reason' is used>
 *   suppressArticleInSummary: <set to suppress showing the article name in the edit summary, as with attack pages>
 *   templateName: <string - name of template to use (instead of key name), entry will be omitted from the Templates list.
 *                  (e.g. use another template but with different block options)>
 *   useInitialOptions: <when preset is chosen, only change given block options, leave others as they were>
 *
 * WARNING: 'anononly' and 'allowusertalk' are enabled by default.
 *   To disable, set 'hardblock' and 'disabletalk', respectively
 */
Twinkle.block.blockPresetsInfo = {
	'anonblock': {
		expiry: '31 hours',
		forAnonOnly: true,
		nocreate: true,
		nonstandard: true,
		reason: '{{anonblock}}',
		sig: '~~~~'
	},
	'anonblock - school': {
		expiry: '36 hours',
		forAnonOnly: true,
		nocreate: true,
		nonstandard: true,
		reason: '{{anonblock}} <!-- Likely a school based on behavioral evidence -->',
		templateName: 'anonblock',
		sig: '~~~~'
	},
	'blocked proxy': {
		expiry: '1 year',
		forAnonOnly: true,
		nocreate: true,
		nonstandard: true,
		hardblock: true,
		reason: '{{blocked proxy}}',
		sig: null
	},
	'CheckUser block': {
		expiry: '1 week',
		forAnonOnly: true,
		nocreate: true,
		nonstandard: true,
		reason: '{{CheckUser block}}',
		sig: '~~~~'
	},
	'checkuserblock-account': {
		autoblock: true,
		expiry: 'infinity',
		forRegisteredOnly: true,
		nocreate: true,
		nonstandard: true,
		reason: '{{checkuserblock-account}}',
		sig: '~~~~'
	},
	'checkuserblock-wide': {
		forAnonOnly: true,
		nocreate: true,
		nonstandard: true,
		reason: '{{checkuserblock-wide}}',
		sig: '~~~~'
	},
	'colocationwebhost': {
		expiry: '1 year',
		forAnonOnly: true,
		nonstandard: true,
		reason: '{{colocationwebhost}}',
		sig: null
	},
	'oversightblock': {
		autoblock: true,
		expiry: 'infinity',
		nocreate: true,
		nonstandard: true,
		reason: '{{OversightBlock}}',
		sig: '~~~~'
	},
	'school block': {
		forAnonOnly: true,
		nocreate: true,
		nonstandard: true,
		reason: '{{school block}}',
		sig: '~~~~'
	},
	'spamblacklistblock': {
		forAnonOnly: true,
		expiry: '1 month',
		disabletalk: true,
		nocreate: true,
		reason: '{{spamblacklistblock}} <!-- editor only attempts to add blacklisted links, see [[Special:Log/spamblacklist]] -->'
	},
	'rangeblock': {
		reason: '{{rangeblock}}',
		nocreate: true,
		nonstandard: true,
		forAnonOnly: true,
		sig: '~~~~'
	},
	'tor': {
		expiry: '1 year',
		forAnonOnly: true,
		nonstandard: true,
		reason: '{{Tor}}',
		sig: null
	},
	'webhostblock': {
		expiry: '1 year',
		forAnonOnly: true,
		nonstandard: true,
		reason: '{{webhostblock}}',
		sig: null
	},
	// uw-prefixed
	'uw-3block': {
		autoblock: true,
		expiry: '24 hours',
		nocreate: true,
		pageParam: true,
		reason: '[[WP:Three-revert rule|three-revert rule]] লঙ্ঘন',
		summary: '[[WP:3RR|three-revert rule]] লঙ্ঘনের কারণে আপনাকে বাধা দেওয়া হয়েছে'
	},
	'uw-ablock': {
		autoblock: true,
		expiry: '31 hours',
		forAnonOnly: true,
		nocreate: true,
		pageParam: true,
		reasonParam: true,
		summary: 'সম্পাদনা করা থেকে আপনার আইপিকে বাধা দেওয়া হয়েছে',
		suppressArticleInSummary: true
	},
	'uw-adblock': {
		autoblock: true,
		nocreate: true,
		pageParam: true,
		reason: '[[WP:Spam|স্প্যাম]] অথবা [[WP:NOTADVERTISING|বিজ্ঞাপনী]] উদ্দেশ্যে উইকিপিডিয়া ব্যবহার',
		summary: '[[WP:SOAP|বিজ্ঞাপন বা আত্মপ্রচারণার]] জন্য আপনাকে সম্পাদনা করা থেকে বাধা দেওয়া হয়েছে'
	},
	'uw-aeblock': {
		autoblock: true,
		nocreate: true,
		pageParam: true,
		reason: '[[WP:Arbitration enforcement|Arbitration enforcement]]',
		reasonParam: true,
		summary: 'You have been blocked from editing for violating an [[WP:Arbitration|arbitration decision]]'
	},
	'uw-bioblock': {
		autoblock: true,
		nocreate: true,
		pageParam: true,
		reason: '[[WP:Biographies of living persons|জীবিত ব্যক্তির জীবনী]] নীতিমালা লঙ্ঘন',
		summary: '[[WP:BLP|জীবিত ব্যক্তির জীবনী]] নীতিমালা লঙ্ঘনের কারণে আপনাকে বাধা দেওয়া হয়েছে'
	},
	'uw-block': {
		autoblock: true,
		expiry: '24 hours',
		forRegisteredOnly: true,
		nocreate: true,
		pageParam: true,
		reasonParam: true,
		summary: 'আপনাকে সম্পাদনা করা থেকে বাধা দেওয়া হয়েছে',
		suppressArticleInSummary: true
	},
	'uw-blockindef': {
		autoblock: true,
		expiry: 'infinity',
		forRegisteredOnly: true,
		nocreate: true,
		pageParam: true,
		reasonParam: true,
		summary: 'আপনাকে সম্পাদনা করা থেকে অসীম মেয়াদে বাধা দেওয়া হয়েছে',
		suppressArticleInSummary: true
	},
	'uw-blocknotalk': {
		disabletalk: true,
		pageParam: true,
		reasonParam: true,
		summary: 'আপনাকে সম্পাদনা করা থেকে বাধা দেওয়া হয়েছে এবং আলাপ পাতার প্রবেশাধিকার বন্ধ',
		suppressArticleInSummary: true
	},
	'uw-botblock': {
		forRegisteredOnly: true,
		pageParam: true,
		reason: '[[WP:BRFA|অনুমোদন]] ছাড়া [[WP:BOT|বট স্ক্রিপ্ট]] ব্যবহার',
		summary: '[[WP:BRFA|অনুমোদন]] ছাড়া [[WP:BOT|বট স্ক্রিপ্ট]] ব্যবহারের কারণে আপনাকে বাধা দেওয়া হয়েছে'
	},
	'uw-botublock': {
		expiry: 'infinity',
		forRegisteredOnly: true,
		reason: '{{uw-botublock}} <!-- Username implies a bot, soft block -->',
		summary: 'আপনাকে সম্পাদনা করা থেকে অসীম মেয়াদে বাধা দেওয়া হয়েছে কারণ আপনার [[WP:U|ব্যবহারকারী নাম]] অনুমোদনহীন [[WP:BOT|বট]] অ্যাকাউন্ট নির্দেশ করছে'
	},
	'uw-botuhblock': {
		autoblock: true,
		expiry: 'infinity',
		forRegisteredOnly: true,
		nocreate: true,
		reason: '{{uw-botuhblock}} <!-- Username implies a bot, hard block -->',
		summary: 'You have been indefinitely blocked from editing because your username is a blatant violation of the [[WP:U|username policy]].'
	},
	'uw-causeblock': {
		expiry: 'infinity',
		forRegisteredOnly: true,
		reason: '{{uw-causeblock}} <!-- Username represents a non-profit, soft block -->',
		summary: 'আপনাকে অসীম মেয়াদে বাধা দেওয়া হয়েছে কারণ আপনার [[WP:U|ব্যবহারকারী নাম]] কোনো দল, সংগঠন অথবা ওয়েবসাইটের প্রতিনিধিত্ব করছে'
	},
	'uw-compblock': {
		autoblock: true,
		expiry: 'infinity',
		forRegisteredOnly: true,
		nocreate: true,
		reason: 'বিপদগ্রস্ত অ্যাকাউন্ট',
		summary: 'আপনাকে অসীম মেয়াদে বাধাদান করা হয়েছে কারণ এটি বিশ্বাস করা হচ্ছে আপনার অ্যাকাউন্টটি [[WP:SECURE|বিপদগ্রস্ত]]'
	},
	'uw-copyrightblock': {
		autoblock: true,
		expiry: 'infinity',
		nocreate: true,
		pageParam: true,
		reason: '[[WP:Copyright violations|কপিরাইট লঙ্ঘন]]',
		summary: '[[WP:COPYVIO|কপিরাইট লঙ্ঘনের]] কারণে আপনাকে বাধা দেওয়া হয়েছে'
		},
	'uw-dblock': {
		autoblock: true,
		nocreate: true,
		reason: 'Persistent removal of content',
		pageParam: true,
		summary: 'আপনাকে সম্পাদনা করা থেকে বাধাদান করা হয়েছে কারণ আপনি [[WP:VAND|তথ্য অপসারণ]] করে চলেছেন'
	},
	'uw-disruptblock': {
		autoblock: true,
		nocreate: true,
		reason: '[[WP:Disruptive editing|ঐকমত্য বিনাশকারী সম্পাদনা]]',
		summary: 'আপনাকে সম্পাদনা করা থেকে বাধাদান করা হয়েছে কারণ [[WP:DE|ঐকমত্য বিনাশকারী সম্পাদনা]]'
	},
	'uw-efblock': {
		autoblock: true,
		nocreate: true,
		reason: 'Repeatedly triggering the [[WP:Edit filter|Edit filter]]',
		summary: 'বার বার অগঠনমূলক সম্পাদনা করে [[WP:EF|সম্পাদনা ছাঁকনিতে]] আটকানোর জন্য আপনাকে সম্পাদনা থেকে বাধা প্রদান করা হয়েছে।'
	},
	'uw-ewblock': {
		autoblock: true,
		expiry: '24 hours',
		nocreate: true,
		pageParam: true,
		reason: '[[WP:Edit warring|সম্পাদনা যুদ্ধ]]',
		summary: 'আপনি [[WP:EW|সম্পাদনা যুদ্ধে]] জড়ানোয় পরবর্তীতে আরও [[WP:DE|ব্যাঘাত]] এড়াতে আপনাকে সম্পাদনা থেকে বাধা প্রদান করা হয়েছে।'
	},
	'uw-hblock': {
		autoblock: true,
		nocreate: true,
		pageParam: true,
		reason: '[[WP:No personal attacks|ব্যক্তিগত আক্রমণ]] অথবা [[WP:Harassment|হয়রানি]]',
		summary: 'আপনাকে বাধা দেওয়া হয়েছে কারণ অন্য ব্যবহারকারীকে [[WP:HARASS|হয়রানির]] চেষ্টা করছেন'
	},
	'uw-ipevadeblock': {
		forAnonOnly: true,
		nocreate: true,
		reason: '[[WP:Blocking policy#Evasion of blocks|Block evasion]]',
		summary: 'আপনার আইপি ঠিকানায় বাধাদান করা হয়েছে কারণ আপনি [[WP:EVADE|কৌশলে পূর্ববর্তী বাধা এড়িয়ে]] যাওয়ার চেষ্টা করছেন'
	},
	'uw-lblock': {
		autoblock: true,
		expiry: 'infinity',
		nocreate: true,
		reason: '[[WP:No legal threats|আইনী হুমকি]] প্রদান',
		summary: '[[WP:NLT|আইনি হুমকি বা আইনি পদক্ষেপ]] নেওয়ার হুমকি দেওয়ায় আপনাকে সম্পাদনা থেকে বাধা দেওয়া হয়েছে।'
	},
	'uw-nothereblock': {
		autoblock: true,
		expiry: 'infinity',
		nocreate: true,
		reason: 'স্পষ্টত [[WP:NOTHERE|বিশ্বকোষ তৈরীতে আগ্রহী]] নয়',
		forRegisteredOnly: true,
		summary: 'আপনাকে অসীম মেয়াদে বাধাদান করা হয়েছে কারণ বোঝা যাচ্ছে যে আপনি [[WP:NOTHERE|বিশ্বকোষ তৈরীতে আগ্রহী]] নয়'
	},
	'uw-npblock': {
		autoblock: true,
		nocreate: true,
		pageParam: true,
		reason: '[[WP:Patent nonsense|অর্থহীন]] ও অনুপযুক্ত পাতা তৈরি',
		summary: 'আপনাকে সম্পাদনা করা থেকে বাধাদান করা হয়েছে কারণ আপনি [[WP:PN|অর্থহীন পাতা]] তৈরি করছেন'
	},
	'uw-pablock': {
		autoblock: true,
		expiry: '31 hours',
		nocreate: true,
		reason: '[[WP:No personal attacks|ব্যক্তিগত আক্রমণ]] ও [[WP:Harassment|হয়রানি]]',
		summary: 'অন্য সম্পাদকদের [[WP:NPA|ব্যক্তিগত আক্রমণ]] করায় আপনাকে সম্পাদনা থেকে বাধা দেওয়া হয়েছে'
	},
	'uw-sblock': {
		autoblock: true,
		nocreate: true,
		reason: 'উইকিপিডিয়াকে [[WP:SPAM|স্প্যামিংয়ের]] উদ্দেশ্যে ব্যবহার',
		summary: 'উইকিপিডিয়াকে [[WP:SPAM|স্প্যামিংয়ের]] উদ্দেশ্যে ব্যবহার করায় আপনাকে সম্পাদনা থেকে অবরুদ্ধ করা হয়েছে'
	},
	'uw-soablock': {
		autoblock: true,
		expiry: 'infinity',
		forRegisteredOnly: true,
		nocreate: true,
		pageParam: true,
		reason: 'শুধুমাত্র [[WP:Spam|স্প্যাম]] / [[WP:NOTADVERTISING|বিজ্ঞাপনী]] শুধুমাত্র',
		summary: 'আপনি উইকিপিডিয়াকে [[WP:SPAM|স্প্যাম ও বিজ্ঞাপনী]] উদ্দেশ্যে ব্যবহার করছেন, তাই আপনাকে অসীম সময়ের জন্য বাধা দেওয়া হয়েছে'
	},
	'uw-socialmediablock': {
		autoblock: true,
		nocreate: true,
		pageParam: true,
		reason: 'উইকিপিডিয়াকে [[WP:NOTMYSPACE|ব্লগ, ওয়েবহোস্ট, সামাজিক যোগাযোগমাধ্যম বা ফোরাম]] হিসেবে ব্যবহার',
		summary: '[[WP:NOTMYSPACE|ব্লগ, ওয়েব হোস্ট, সামাজিক যোগাযোগমাধ্যম সাইট বা ফোরাম]] হিসেবে ব্যবহারকারী এবং/অথবা নিবন্ধ পাতা ব্যবহার করার জন্য আপনাকে সম্পাদনা থেকে অবরুদ্ধ করা হয়েছে।'
	},
	'uw-sockblock': {
		autoblock: true,
		forRegisteredOnly: true,
		nocreate: true,
		reason: '[[WP:Sock puppetry|একাধিক অ্যাকাউন্টের]] অপব্যবহার',
		summary: '[[WP:SOCK|একাধিক অ্যাকাউন্টের]] অপব্যবহারের জন্য আপনাকে সম্পাদনা থেকে বাধা প্রদান করা হয়েছে'
	},
	'uw-softerblock': {
		expiry: 'infinity',
		forRegisteredOnly: true,
		reason: '{{uw-softerblock}} <!-- Promotional username, soft block -->',
		summary: 'You have been indefinitely blocked from editing because your [[WP:U|username]] gives the impression that the account represents a group, organization or website'
	},
	'uw-spamublock': {
		autoblock: true,
		expiry: 'infinity',
		forRegisteredOnly: true,
		nocreate: true,
		reason: '{{uw-spamublock}} <!-- Promotional username, promotional edits -->',
		summary: 'You have been indefinitely blocked from editing because your account is being used only for [[WP:SPAM|spam or advertising]] and your username is a violation of the [[WP:U|username policy]]'
	},
	'uw-suspectsockblock': {
		autoblock: true,
		expiry: 'infinity',
		forRegisteredOnly: true,
		nocreate: true,
		reason: '[[WP:SOCK|সক পাপেট্রি]]',
		summary: 'এই অ্যাকাউন্টটি [[WP:SOCK|সকপাপেট]] হিসেবে উইকিপিডিয়ার নীতি লঙ্ঘন করার জন্য তৈরি করায় বাধা দেওয়া হয়েছে'
	},
	'uw-talkrevoked': {
		disabletalk: true,
		reason: 'Revoking talk page access: inappropriate use of user talk page while blocked',
		prependReason: true,
		summary: 'আপনার ব্যবহারকারীর আলাপ পাতায় সম্পাদনার অধিকার হরণ করা হয়েছে',
		useInitialOptions: true
	},
	'uw-ublock': {
		expiry: 'infinity',
		forRegisteredOnly: true,
		reason: '{{uw-ublock}} <!-- Username violation, soft block -->',
		reasonParam: true,
		summary: 'You have been indefinitely blocked from editing because your username is a violation of the [[WP:U|username policy]]'
	},
	'uw-ublock-double': {
		expiry: 'infinity',
		forRegisteredOnly: true,
		reason: '{{uw-ublock-double}} <!-- Username closely resembles another user, soft block -->',
		summary: 'You have been indefinitely blocked from editing because your [[WP:U|username]] is too similar to the username of another Wikipedia user'
	},
	'uw-ucblock': {
		autoblock: true,
		expiry: '31 hours',
		nocreate: true,
		pageParam: true,
		reason: 'Persistent addition of [[WP:INTREF|unsourced content]]',
		summary: 'ক্রমাগত [[WP:INTREF|তথ্যসূত্র বিহীন বিষয়বস্তু]] যোগ করার জন্য আপনাকে সম্পাদনা থেকে অবরুদ্ধ করা হয়েছে।'
	},
	'uw-uhblock': {
		autoblock: true,
		expiry: 'infinity',
		forRegisteredOnly: true,
		nocreate: true,
		reason: '{{uw-uhblock}} <!-- Username violation, hard block -->',
		reasonParam: true,
		summary: 'You have been indefinitely blocked from editing because your username is a blatant violation of the [[WP:U|username policy]]'
	},
	'uw-ublock-wellknown': {
		expiry: 'infinity',
		forRegisteredOnly: true,
		reason: '{{uw-ublock-wellknown}} <!-- Username represents a well-known person, soft block -->',
		summary: 'You have been indefinitely blocked from editing because your [[WP:U|username]] matches the name of a well-known living individual'
	},
	'uw-uhblock-double': {
		autoblock: true,
		expiry: 'infinity',
		forRegisteredOnly: true,
		nocreate: true,
		reason: '{{uw-uhblock-double}} <!-- Attempted impersonation of another user, hard block -->',
		summary: 'You have been indefinitely blocked from editing because your [[WP:U|username]] appears to impersonate another established Wikipedia user'
	},
	'uw-upeblock': {
		autoblock: true,
		expiry: 'infinity',
		forRegisteredOnly: true,
		nocreate: true,
		pageParam: true,
		reason: '[[WP:PAID|অপ্রকাশিত অর্থের বিনিময়ে]] সম্পাদনা বিষয়ে নীতিমালা লঙ্ঘন',
		summary: 'আপনাকে সম্পাদনা থেকে অনির্দিষ্টকালের জন্য অবরুদ্ধ করা হয়েছে কারণ আপনার অ্যাকাউন্ট [[WP:PAID|অপ্রকাশিত অর্থ প্রদানের বিষয়ে উইকিপিডিয়ার নীতি]] লঙ্ঘন করে ব্যবহার করা হচ্ছে।'
	},
	'uw-vaublock': {
		autoblock: true,
		expiry: 'infinity',
		forRegisteredOnly: true,
		nocreate: true,
		pageParam: true,
		reason: '{{uw-vaublock}} <!-- Username violation, vandalism-only account -->',
		summary: 'You have been indefinitely blocked from editing because your account is being [[WP:VOA|used only for vandalism]] and your username is a blatant violation of the [[WP:U|username policy]]'
	},
	'uw-vblock': {
		autoblock: true,
		expiry: '31 hours',
		nocreate: true,
		pageParam: true,
		reason: '[[WP:Vandalism|ধ্বংসপ্রবণতা]]',
		summary: 'আরও [[WP:VAND|ধ্বংসপ্রবণতা]] থেকে বিরত রাখতে আপনাকে সম্পাদনা থেকে বাধা প্রদান করা হয়েছে'
	},
	'uw-voablock': {
		autoblock: true,
		expiry: 'infinity',
		forRegisteredOnly: true,
		nocreate: true,
		pageParam: true,
		reason: '[[WP:Vandalism-only account|শুধুমাত্র ধ্বংসপ্রবণতায়]] ব্যবহৃত অ্যাকাউন্ট',
		summary: 'আপনাকে সম্পাদনা থেকে অনির্দিষ্টকালের জন্য অবরুদ্ধ করা হয়েছে কারণ আপনার অ্যাকাউন্ট [[WP:VOA|শুধুমাত্র ধ্বংসপ্রবণতার জন্য ব্যবহৃত হচ্ছে]]'
	},
	'zombie proxy': {
		expiry: '1 month',
		forAnonOnly: true,
		nocreate: true,
		nonstandard: true,
		reason: '{{zombie proxy}}',
		sig: null
	},

	// Begin partial block templates, accessed in Twinkle.block.blockGroupsPartial
	'uw-acpblock': {
		autoblock: true,
		expiry: '48 hours',
		nocreate: true,
		pageParam: false,
		reasonParam: true,
		reason: '[[WP:Sock puppetry|একাধিক অ্যাকাউন্টের]] অপব্যবহার',
		summary: 'আপনাকে [[WP:SOCK|একাধিক অ্যাকাউন্টের]] অপব্যবহারের কারণে [[WP:PB|অ্যাকাউন্ট তৈরি থেকে]] বাধা দেওয়া হয়েছে'
	},
	'uw-acpblockindef': {
		autoblock: true,
		expiry: 'infinity',
		forRegisteredOnly: true,
		nocreate: true,
		pageParam: false,
		reasonParam: true,
		reason: 'Misusing [[WP:Sock puppetry|multiple accounts]]',
		summary: 'আপনাকে [[WP:SOCK|একাধিক অ্যাকাউন্টের]] অপব্যবহারের কারণে [[WP:PB|অ্যাকাউন্ট তৈরি থেকে]] অসীম মেয়াদে বাধা দেওয়া হয়েছে'
	},
	'uw-aepblock': {
		autoblock: true,
		nocreate: false,
		pageParam: false,
		reason: '[[WP:Arbitration enforcement|Arbitration enforcement]]',
		reasonParam: true,
		summary: 'You have been [[WP:PB|partially blocked]] from editing for violating an [[WP:Arbitration|arbitration decision]]'
	},
	'uw-epblock': {
		autoblock: true,
		expiry: 'infinity',
		forRegisteredOnly: true,
		nocreate: false,
		noemail: true,
		pageParam: false,
		reasonParam: true,
		reason: 'ইমেইলে [[WP:Harassment|হয়রানি]]',
		summary: 'আপনার [[WP:PB|ইমেইলে বাধা]] দেওয়া হয়েছে কারণ অন্য ব্যবহারকারীকে [[WP:Harassment|হয়রানি]]'
	},
	'uw-ewpblock': {
		autoblock: true,
		expiry: '24 hours',
		nocreate: false,
		pageParam: false,
		reasonParam: true,
		reason: '[[WP:Edit warring|সম্পাদনা যুদ্ধ]]',
		summary: '[[WP:DE|বৈপরীত্য]] প্রতিরোধের জন্য উইকিপিডিয়ার নির্দিষ্ট ক্ষেত্রে সম্পাদনা করা থেকে আপনাকে [[WP:PB|আংশিক বাধা]] দেওয়া হয়েছে কারণ [[WP:EW|সম্পাদনা যুদ্ধ]]'
	},
	'uw-pblock': {
		autoblock: true,
		expiry: '24 hours',
		nocreate: false,
		pageParam: false,
		reasonParam: true,
		summary: 'উইকিপিডিয়ার নির্দিষ্ট ক্ষেত্রে সম্পাদনা করা থেকে আপনাকে [[WP:PB|আংশিক বাধা]] দেওয়া হয়েছে'
	},
	'uw-pblockindef': {
		autoblock: true,
		expiry: 'infinity',
		forRegisteredOnly: true,
		nocreate: false,
		pageParam: false,
		reasonParam: true,
		summary: 'উইকিপিডিয়ার নির্দিষ্ট ক্ষেত্রে সম্পাদনা করা থেকে আপনাকে অসীম মেয়াদে [[WP:PB|আংশিক বাধা]] দেওয়া হয়েছে'
	}
};

Twinkle.block.transformBlockPresets = function twinkleblockTransformBlockPresets() {
	// supply sensible defaults
	$.each(Twinkle.block.blockPresetsInfo, function(preset, settings) {
		settings.summary = settings.summary || settings.reason;
		settings.sig = settings.sig !== undefined ? settings.sig : 'yes';
		settings.indefinite = settings.indefinite || Morebits.string.isInfinity(settings.expiry);

		if (!Twinkle.block.isRegistered && settings.indefinite) {
			settings.expiry = '31 hours';
		} else {
			settings.expiry = settings.expiry || '31 hours';
		}

		Twinkle.block.blockPresetsInfo[preset] = settings;
	});
};

// These are the groups of presets and defines the order in which they appear. For each list item:
//   label: <string, the description that will be visible in the dropdown>
//   value: <string, the key of a preset in blockPresetsInfo>
Twinkle.block.blockGroups = [
	{
		label: 'বাধাদানের সাধারণ কারণ',
		list: [
			{ label: 'anonblock', value: 'anonblock' },
			{ label: 'anonblock - likely a school', value: 'anonblock - school' },
			{ label: 'school block', value: 'school block' },
			{ label: 'Generic block (অন্য কারণ)', value: 'uw-block' }, // ends up being default for registered users
			{ label: 'Generic block (অন্য কারণ) - IP', value: 'uw-ablock', selected: true }, // set only when blocking IP
			{ label: 'Generic block (অন্য কারণ) - indefinite', value: 'uw-blockindef' },
			{ label: 'ঐকমত্য বিনাশকারী সম্পাদনা', value: 'uw-disruptblock' },
			{ label: 'বাধাপ্রাপ্ত অবস্থায় ব্যবহারকারী আলাপ পাতার অপব্যবহার', value: 'uw-talkrevoked' },
			{ label: 'বিশ্বকোষ তৈরিতে আগ্রহী নয়', value: 'uw-nothereblock' },
			{ label: 'উৎসহীন তথ্য যোগ', value: 'uw-ucblock' },
			{ label: 'ধ্বংসপ্রবণতা', value: 'uw-vblock' },
			{ label: 'ধ্বংসপ্রবণতা-কেবল অ্যাকাউন্ট',value: 'uw-voablock' }
		]
	},
	{
		label: 'সম্প্রসারিত কারণ',
		list: [
			{ label: 'বিজ্ঞাপন', value: 'uw-adblock' },
			{ label: 'Arbitration enforcement', value: 'uw-aeblock' },
			{ label: 'বাধা এড়ানোর চেষ্টা - IP', value: 'uw-ipevadeblock' },
			{ label: 'জী-ব্য-জী লঙ্ঘন', value: 'uw-bioblock' },
			{ label: 'কপিরাইট লঙ্ঘন', value: 'uw-copyrightblock' },
			{ label: 'অসংলগ্ন পাতা তৈরি', value: 'uw-npblock' },
			{ label: 'সম্পাদনা ছাঁকনি সম্পর্কিত', value: 'uw-efblock' },
			{ label: 'সম্পাদনা যুদ্ধ', value: 'uw-ewblock' },
			{ label: 'Generic block with talk page access revoked', value: 'uw-blocknotalk' },
			{ label: 'হয়রানি', value: 'uw-hblock' },
			{ label: 'আইনী হুমকি', value: 'uw-lblock' },
			{ label: 'ব্যক্তিগত আক্রমণ বা হয়রানি', value: 'uw-pablock' },
			{ label: 'সম্ভাব্য বিপদগ্রস্ত অ্যাকাউন্ট', value: 'uw-compblock' },
			{ label: 'তথ্য অপসারণ', value: 'uw-dblock' },
			{ label: 'সক পাপেট্রি (মাস্টার)', value: 'uw-sockblock' },
			{ label: 'সক পাপেট্রি (পাপেট)', value: 'uw-suspectsockblock' },
			{ label: 'সামাজিক নেটওয়ার্কিং', value: 'uw-socialmediablock' },
			{ label: 'স্প্যাম', value: 'uw-sblock' },
			{ label: 'স্প্যাম/বিজ্ঞাপন - কেবল অ্যাকাউন্ট', value: 'uw-soablock' },
			{ label: 'অননুমোদিত বট', value: 'uw-botblock' },
			{ label: 'অপ্রকাশিত অর্থের বিনিময়ে সম্পাদনা', value: 'uw-upeblock' },
			{ label: 'তিনবার পুনর্বহাল নিয়ম লঙ্ঘন', value: 'uw-3block' }
		]
	},
	{
		label: 'ব্যবহারকারী নাম লঙ্ঘন',
		list: [
			{ label: 'বট ব্যবহারকারী নাম, নমনীয় বাধাদান', value: 'uw-botublock' },
			{ label:  'বট ব্যবহারকারী নাম, কঠোর বাধাদান', value: 'uw-botuhblock' },
			{ label: 'প্রচারণামূলক ব্যবহারকারী নাম, কঠোর বাধাদান', value: 'uw-spamublock' },
			{ label: 'প্রচারণামূলক ব্যবহারকারী নাম, নমনীয় বাধাদান', value: 'uw-softerblock' },
			{ label: 'সমতুল্য ব্যবহারকারী নাম, নমনীয় বাধাদান', value: 'uw-ublock-double' },
			{ label: 'ব্যবহারকারী নাম লঙ্ঘন, নমনীয় বাধাদান', value: 'uw-ublock' },
			{ label: 'ব্যবহারকারী নাম লঙ্ঘন, কঠোর বাধাদান', value: 'uw-uhblock' },
			{ label: 'Username impersonation, কঠোর বাধাদান', value: 'uw-uhblock-double' },
			{ label: 'ব্যবহারকারী নাম সুপরিচিত ব্যক্তির প্রতিনিধিত্ব করছে, নমনীয় বাধাদান', value: 'uw-ublock-wellknown' },
			{ label: 'ব্যবহারকারী নাম অলাভজনক প্রতিষ্ঠানের প্রতিনিধিত্ব করছে, নমনীয় বাধাদান', value: 'uw-causeblock' },
			{ label: 'ব্যবহারকারী নাম লঙ্ঘন, ধ্বংসপ্রবণতা-কেবল অ্যাকাউন্ট', value: 'uw-vaublock' }
		]
	},
	{
		label: 'টেমপ্লেটজনিত কারণ',
		list: [
			{ label: 'প্রক্সি বাধাদান', value: 'blocked proxy' },
			{ label: 'ব্যবহারকারী পরীক্ষণ বাধাদান', value: 'CheckUser block' },
			{ label: 'ব্যবহারকারী পরীক্ষণ বাধাদান-অ্যাকাউন্ট', value: 'checkuserblock-account' },
			{ label: 'ব্যবহারকারী পরীক্ষণ বাধাদান-ব্যাপী', value: 'checkuserblock-wide' },
			{ label: 'সহাবস্থান ওয়েবহোস্ট', value: 'colocationwebhost' },
			{ label: 'গোপণপর্যবেক্ষক বাধাদান', value: 'oversightblock' },
			{ label: 'রেঞ্জ বাধাদান', value: 'rangeblock' }, // Only for IP ranges, selected for non-/64 ranges in filtered_block_groups
			{ label: 'কালোতালিকা বাধাদান', value: 'spamblacklistblock' },
			{ label: 'টর', value: 'tor' },
			{ label: 'ওয়েবহোস্ট বাধাদান', value: 'webhostblock' },
			{ label: 'জোম্বি প্রক্সি', value: 'zombie proxy' }
		]
	}
];

Twinkle.block.blockGroupsPartial = [
	{
		label: 'আংশিক বাধাদানের সাধারণ কারণ',
		list: [
			{ label: 'Generic partial block (অন্য কারণ)', value: 'uw-pblock', selected: true },
			{ label: 'Generic partial block (অন্য কারণ) - indefinite', value: 'uw-pblockindef' },
			{ label: 'সম্পাদনা যুদ্ধ', value: 'uw-ewpblock' }
		]
	},
	{
		label: 'সম্প্রসারিত আংশিক বাধাদানের কারণ',
		list: [
			{ label: 'Arbitration enforcement', value: 'uw-aepblock' },
			{ label: 'ইমেইলে হয়রানি', value: 'uw-epblock' },
			{ label: 'একাধিক অ্যাকাউন্টের অপব্যবহার', value: 'uw-acpblock' },
			{ label: 'একাধিক অ্যাকাউন্টের অপব্যবহার - অসীম', value: 'uw-acpblockindef' }
		]
	}
];


Twinkle.block.callback.filtered_block_groups = function twinkleblockCallbackFilteredBlockGroups(group, show_template) {
	return $.map(group, function(blockGroup) {
		var list = $.map(blockGroup.list, function(blockPreset) {
			switch (blockPreset.value) {
				case 'uw-talkrevoked':
					if (blockedUserName !== relevantUserName) {
						return;
					}
					break;
				case 'rangeblock':
					if (!Morebits.ip.isRange(relevantUserName)) {
						return;
					}
					blockPreset.selected = !Morebits.ip.get64(relevantUserName);
					break;
				case 'CheckUser block':
				case 'checkuserblock-account':
				case 'checkuserblock-wide':
					if (!Morebits.userIsInGroup('checkuser')) {
						return;
					}
					break;
				case 'oversightblock':
					if (!Morebits.userIsInGroup('suppress')) {
						return;
					}
					break;
				default:
					break;
			}

			var blockSettings = Twinkle.block.blockPresetsInfo[blockPreset.value];
			var registrationRestrict = blockSettings.forRegisteredOnly ? Twinkle.block.isRegistered : blockSettings.forAnonOnly ? !Twinkle.block.isRegistered : true;
			if (!(blockSettings.templateName && show_template) && registrationRestrict) {
				var templateName = blockSettings.templateName || blockPreset.value;
				return {
					label: (show_template ? '{{' + templateName + '}}: ' : '') + blockPreset.label,
					value: blockPreset.value,
					data: [{
						name: 'template-name',
						value: templateName
					}],
					selected: !!blockPreset.selected,
					disabled: !!blockPreset.disabled
				};
			}
		});
		if (list.length) {
			return {
				label: blockGroup.label,
				list: list
			};
		}
	});
};

Twinkle.block.callback.change_preset = function twinkleblockCallbackChangePreset(e) {
	var form = e.target.form, key = form.preset.value;
	if (!key) {
		return;
	}

	Twinkle.block.callback.update_form(e, Twinkle.block.blockPresetsInfo[key]);
	if (form.template) {
		form.template.value = Twinkle.block.blockPresetsInfo[key].templateName || key;
		Twinkle.block.callback.change_template(e);
	} else {
		Morebits.quickForm.setElementVisibility(form.dstopic.parentNode, key === 'uw-aeblock' || key === 'uw-aepblock');
	}
};

Twinkle.block.callback.change_expiry = function twinkleblockCallbackChangeExpiry(e) {
	var expiry = e.target.form.expiry;
	if (e.target.value === 'custom') {
		Morebits.quickForm.setElementVisibility(expiry.parentNode, true);
	} else {
		Morebits.quickForm.setElementVisibility(expiry.parentNode, false);
		expiry.value = e.target.value;
	}
};

Twinkle.block.seeAlsos = [];
Twinkle.block.callback.toggle_see_alsos = function twinkleblockCallbackToggleSeeAlso() {
	var reason = this.form.reason.value.replace(
		new RegExp('( <!--|;) ' + 'এছাড়াও দেখুন ' + Twinkle.block.seeAlsos.join(' এবং ') + '( -->)?'), ''
	);

	Twinkle.block.seeAlsos = Twinkle.block.seeAlsos.filter(function(el) {
		return el !== this.value;
	}.bind(this));

	if (this.checked) {
		Twinkle.block.seeAlsos.push(this.value);
	}
	var seeAlsoMessage = Twinkle.block.seeAlsos.join(' এবং ');

	if (!Twinkle.block.seeAlsos.length) {
		this.form.reason.value = reason;
	} else if (reason.indexOf('{{') !== -1) {
		this.form.reason.value = reason + ' <!-- see also ' + seeAlsoMessage + ' -->';
	} else {
		this.form.reason.value = reason + '; এছাড়াও দেখুন ' + seeAlsoMessage;
	}
};

Twinkle.block.dsReason = '';
Twinkle.block.callback.toggle_ds_reason = function twinkleblockCallbackToggleDSReason() {
	var reason = this.form.reason.value.replace(
		new RegExp(' ?\\(\\[\\[' + Twinkle.block.dsReason + '\\]\\]\\)'), ''
	);

Twinkle.block.dsinfo.then(function(dsinfo) {
		var sanctionCode = this.selectedIndex;
		var sanctionName = this.options[sanctionCode].label;
		Twinkle.block.dsReason = dsinfo[sanctionName].page;
		if (!this.value) {
			this.form.reason.value = reason;
		} else {
			this.form.reason.value = reason + ' ([[' + Twinkle.block.dsReason + ']])';
		}
	}.bind(this));
};

Twinkle.block.callback.update_form = function twinkleblockCallbackUpdateForm(e, data) {
	var form = e.target.form, expiry = data.expiry;

	// don't override original expiry if useInitialOptions is set
	if (!data.useInitialOptions) {
		if (Date.parse(expiry)) {
			expiry = new Date(expiry).toGMTString();
			form.expiry_preset.value = 'custom';
		} else {
			form.expiry_preset.value = data.expiry || 'custom';
		}

		form.expiry.value = expiry;
		if (form.expiry_preset.value === 'custom') {
			Morebits.quickForm.setElementVisibility(form.expiry.parentNode, true);
		} else {
			Morebits.quickForm.setElementVisibility(form.expiry.parentNode, false);
		}
	}

	// boolean-flipped options, more at [[mw:API:Block]]
	data.disabletalk = data.disabletalk !== undefined ? data.disabletalk : false;
	data.hardblock = data.hardblock !== undefined ? data.hardblock : false;

	// disable autoblock if blocking a bot
	if (Twinkle.block.userIsBot || /bot\b/i.test(relevantUserName)) {
		data.autoblock = false;
	}

	$(form).find('[name=field_block_options]').find(':checkbox').each(function(i, el) {
		// don't override original options if useInitialOptions is set
		if (data.useInitialOptions && data[el.name] === undefined) {
			return;
		}

		var check = data[el.name] === '' || !!data[el.name];
		$(el).prop('checked', check);
	});

	if (data.prependReason && data.reason) {
		form.reason.value = data.reason + '; ' + form.reason.value;
	} else {
		form.reason.value = data.reason || '';
	}

	// Clear and/or set any partial page or namespace restrictions
	if (form.pagerestrictions) {
		var $pageSelect = $(form).find('[name=pagerestrictions]');
		var $namespaceSelect = $(form).find('[name=namespacerestrictions]');

		// Respect useInitialOptions by clearing data when switching presets
		// In practice, this will always clear, since no partial presets use it
		if (!data.useInitialOptions) {
			$pageSelect.val(null).trigger('change');
			$namespaceSelect.val(null).trigger('change');
		}

		// Add any preset options; in practice, just used for prior block settings
		if (data.restrictions) {
			if (data.restrictions.pages && !$pageSelect.val().length) {
				var pages = data.restrictions.pages.map(function(pr) {
					return pr.title;
				});
				// since page restrictions use an ajax source, we
				// short-circuit that and just add a new option
				pages.forEach(function(page) {
					if (!$pageSelect.find("option[value='" + $.escapeSelector(page) + "']").length) {
						var newOption = new Option(page, page, true, true);
						$pageSelect.append(newOption);
					}
				});
				$pageSelect.val($pageSelect.val().concat(pages)).trigger('change');
			}
			if (data.restrictions.namespaces) {
				$namespaceSelect.val($namespaceSelect.val().concat(data.restrictions.namespaces)).trigger('change');
			}
		}
	}
};

Twinkle.block.callback.change_template = function twinkleblockcallbackChangeTemplate(e) {
	var form = e.target.form, value = form.template.value, settings = Twinkle.block.blockPresetsInfo[value];

	var blockBox = $(form).find('[name=actiontype][value=block]').is(':checked');
	var partialBox = $(form).find('[name=actiontype][value=partial]').is(':checked');
	var templateBox = $(form).find('[name=actiontype][value=template]').is(':checked');

	// Block form is not present
	if (!blockBox) {
		if (settings.indefinite || settings.nonstandard) {
			if (Twinkle.block.prev_template_expiry === null) {
				Twinkle.block.prev_template_expiry = form.template_expiry.value || '';
			}
			form.template_expiry.parentNode.style.display = 'none';
			form.template_expiry.value = 'infinity';
		} else if (form.template_expiry.parentNode.style.display === 'none') {
			if (Twinkle.block.prev_template_expiry !== null) {
				form.template_expiry.value = Twinkle.block.prev_template_expiry;
				Twinkle.block.prev_template_expiry = null;
			}
			form.template_expiry.parentNode.style.display = 'block';
		}
		if (Twinkle.block.prev_template_expiry) {
			form.expiry.value = Twinkle.block.prev_template_expiry;
		}
		Morebits.quickForm.setElementVisibility(form.notalk.parentNode, !settings.nonstandard);
		// Partial
		Morebits.quickForm.setElementVisibility(form.noemail_template.parentNode, partialBox);
		Morebits.quickForm.setElementVisibility(form.nocreate_template.parentNode, partialBox);
	} else if (templateBox) { // Only present if block && template forms both visible
		Morebits.quickForm.setElementVisibility(
			form.blank_duration.parentNode,
			!settings.indefinite && !settings.nonstandard
		);
	}

	Morebits.quickForm.setElementVisibility(form.dstopic.parentNode, value === 'uw-aeblock' || value === 'uw-aepblock');

	// Only particularly relevant if template form is present
	Morebits.quickForm.setElementVisibility(form.article.parentNode, settings && !!settings.pageParam);
	Morebits.quickForm.setElementVisibility(form.block_reason.parentNode, settings && !!settings.reasonParam);

	// Partial block
	Morebits.quickForm.setElementVisibility(form.area.parentNode, partialBox && !blockBox);

	form.root.previewer.closePreview();
};
Twinkle.block.prev_template_expiry = null;

Twinkle.block.callback.preview = function twinkleblockcallbackPreview(form) {
	var params = {
		article: form.article.value,
		blank_duration: form.blank_duration ? form.blank_duration.checked : false,
		disabletalk: form.disabletalk.checked || (form.notalk ? form.notalk.checked : false),
		expiry: form.template_expiry ? form.template_expiry.value : form.expiry.value,
		hardblock: Twinkle.block.isRegistered ? form.autoblock.checked : form.hardblock.checked,
		indefinite: Morebits.string.isInfinity(form.template_expiry ? form.template_expiry.value : form.expiry.value),
		reason: form.block_reason.value,
		template: form.template.value,
		dstopic: form.dstopic.value,
		partial: $(form).find('[name=actiontype][value=partial]').is(':checked'),
		pagerestrictions: $(form.pagerestrictions).val() || [],
		namespacerestrictions: $(form.namespacerestrictions).val() || [],
		noemail: form.noemail.checked || (form.noemail_template ? form.noemail_template.checked : false),
		nocreate: form.nocreate.checked || (form.nocreate_template ? form.nocreate_template.checked : false),
		area: form.area.value
	};

	var templateText = Twinkle.block.callback.getBlockNoticeWikitext(params);

	form.previewer.beginRender(templateText, 'User_talk:' + relevantUserName); // Force wikitext/correct username
};

Twinkle.block.callback.evaluate = function twinkleblockCallbackEvaluate(e) {
	var $form = $(e.target),
		toBlock = $form.find('[name=actiontype][value=block]').is(':checked'),
		toWarn = $form.find('[name=actiontype][value=template]').is(':checked'),
		toPartial = $form.find('[name=actiontype][value=partial]').is(':checked'),
		blockoptions = {}, templateoptions = {};

	Twinkle.block.callback.saveFieldset($form.find('[name=field_block_options]'));
	Twinkle.block.callback.saveFieldset($form.find('[name=field_template_options]'));

	blockoptions = Twinkle.block.field_block_options;

	templateoptions = Twinkle.block.field_template_options;

	templateoptions.disabletalk = !!(templateoptions.disabletalk || blockoptions.disabletalk);
	templateoptions.hardblock = !!blockoptions.hardblock;

	delete blockoptions.expiry_preset; // remove extraneous

	// Partial API requires this to be gone, not false or 0
	if (toPartial) {
		blockoptions.partial = templateoptions.partial = true;
	}
	templateoptions.pagerestrictions = $form.find('[name=pagerestrictions]').val() || [];
	templateoptions.namespacerestrictions = $form.find('[name=namespacerestrictions]').val() || [];
	// Format for API here rather than in saveFieldset
	blockoptions.pagerestrictions = templateoptions.pagerestrictions.join('|');
	blockoptions.namespacerestrictions = templateoptions.namespacerestrictions.join('|');

	// use block settings as warn options where not supplied
	templateoptions.summary = templateoptions.summary || blockoptions.reason;
	templateoptions.expiry = templateoptions.template_expiry || blockoptions.expiry;

	if (toBlock) {
		if (blockoptions.partial) {
			if (blockoptions.disabletalk && blockoptions.namespacerestrictions.indexOf('3') === -1) {
				return alert('Partial blocks cannot prevent talk page access unless also restricting them from editing User talk space!');
			}
			if (!blockoptions.namespacerestrictions && !blockoptions.pagerestrictions) {
				if (!blockoptions.noemail && !blockoptions.nocreate) { // Blank entries technically allowed [[phab:T208645]]
					return alert('No pages or namespaces were selected, nor were email or account creation restrictions applied; please select at least one option to apply a partial block!');
				} else if ((templateoptions.template !== 'uw-epblock' || $form.find('select[name="preset"]').val() !== 'uw-epblock') &&
					// Don't require confirmation if email harassment defaults are set
					!confirm('You are about to block with no restrictions on page or namespace editing, are you sure you want to proceed?')) {
					return;
				}
			}
		}
		if (!blockoptions.expiry) {
			return alert('Please provide an expiry!');
		} else if (Morebits.string.isInfinity(blockoptions.expiry) && !Twinkle.block.isRegistered) {
			return alert("Can't indefinitely block an IP address!");
		}
		if (!blockoptions.reason) {
			return alert('Please provide a reason for the block!');
		}

		Morebits.simpleWindow.setButtonsEnabled(false);
		Morebits.status.init(e.target);
		var statusElement = new Morebits.status('Executing block');
		blockoptions.action = 'block';

		blockoptions.user = relevantUserName;

		// boolean-flipped options
		blockoptions.anononly = blockoptions.hardblock ? undefined : true;
		blockoptions.allowusertalk = blockoptions.disabletalk ? undefined : true;

		/*
		  Check if block status changed while processing the form.

		  There's a lot to consider here. list=blocks provides the
		  current block status, but there are at least two issues with
		  relying on it. First, the id doesn't update on a reblock,
		  meaning the individual parameters need to be compared. This
		  can be done roughly with JSON.stringify - we can thankfully
		  rely on order from the server, although sorting would be
		  fine if not - but falsey values are problematic and is
		  non-ideal. More importantly, list=blocks won't indicate if a
		  non-blocked user is blocked then unblocked. This should be
		  exceedingy rare, but regardless, we thus need to check
		  list=logevents, which has a nicely updating logid
		  parameter. We can't rely just on that, though, since it
		  doesn't account for blocks that have expired on their own.

		  As such, we use both. Using some ternaries, the logid
		  variables are false if there's no logevents, so if they
		  aren't equal we defintely have a changed entry (send
		  confirmation). If they are equal, then either the user was
		  never blocked (the block statuses will be equal, no
		  confirmation) or there's no new block, in which case either
		  a block expired (different statuses, confirmation) or the
		  same block is still active (same status, no confirmation).
		*/
		var query = {
			format: 'json',
			action: 'query',
			list: 'blocks|logevents',
			letype: 'block',
			lelimit: 1,
			letitle: 'User:' + blockoptions.user
		};
		// bkusers doesn't catch single IPs blocked as part of a range block
		if (mw.util.isIPAddress(blockoptions.user, true)) {
			query.bkip = blockoptions.user;
		} else {
			query.bkusers = blockoptions.user;
		}
		api.get(query).then(function(data) {
			var block = data.query.blocks[0];
			// As with the initial data fetch, if an IP is blocked
			// *and* rangeblocked, this would only grab whichever
			// block is more recent, which would likely mean a
			// mismatch.  However, if the rangeblock is updated
			// while filling out the form, this won't detect that,
			// but that's probably fine.
			if (data.query.blocks.length > 1 && block.user !== relevantUserName) {
				block = data.query.blocks[1];
			}
			var logevents = data.query.logevents[0];
			var logid = data.query.logevents.length ? logevents.logid : false;

			if (logid !== Twinkle.block.blockLogId || !!block !== !!Twinkle.block.currentBlockInfo) {
				var message = 'The block status of ' + blockoptions.user + ' has changed. ';
				if (block) {
					message += 'New status: ';
				} else {
					message += 'Last entry: ';
				}

				var logExpiry = '';
				if (logevents.params.duration) {
					if (logevents.params.duration === 'infinity') {
						logExpiry = 'indefinitely';
					} else {
						var expiryDate = new Morebits.date(logevents.params.expiry);
						logExpiry += (expiryDate.isBefore(new Date()) ? ', expired ' : ' until ') + expiryDate.calendar();
					}
				} else { // no duration, action=unblock, just show timestamp
					logExpiry = ' ' + new Morebits.date(logevents.timestamp).calendar();
				}
				message += Morebits.string.toUpperCaseFirstChar(logevents.action) + 'ed by ' + logevents.user + logExpiry +
					' for "' + logevents.comment + '". Do you want to override with your settings?';

				if (!confirm(message)) {
					Morebits.status.info('Executing block', 'Canceled by user');
					return;
				}
				blockoptions.reblock = 1; // Writing over a block will fail otherwise
			}

			// execute block
			blockoptions.tags = Twinkle.changeTags;
			blockoptions.token = mw.user.tokens.get('csrfToken');
			var mbApi = new Morebits.wiki.api('Executing block', blockoptions, function() {
				statusElement.info('Completed');
				if (toWarn) {
					Twinkle.block.callback.issue_template(templateoptions);
				}
			});
			mbApi.post();
		});
	} else if (toWarn) {
		Morebits.simpleWindow.setButtonsEnabled(false);

		Morebits.status.init(e.target);
		Twinkle.block.callback.issue_template(templateoptions);
	} else {
		return alert('Please give Twinkle something to do!');
	}
};

Twinkle.block.callback.issue_template = function twinkleblockCallbackIssueTemplate(formData) {
	// Use wgRelevantUserName to ensure the block template goes to a single IP and not to the
	// "talk page" of an IP range (which does not exist)
	var userTalkPage = 'User_talk:' + mw.config.get('wgRelevantUserName');

	var params = $.extend(formData, {
		messageData: Twinkle.block.blockPresetsInfo[formData.template],
		reason: Twinkle.block.field_template_options.block_reason,
		disabletalk: Twinkle.block.field_template_options.notalk,
		noemail: Twinkle.block.field_template_options.noemail_template,
		nocreate: Twinkle.block.field_template_options.nocreate_template
	});

	Morebits.wiki.actionCompleted.redirect = userTalkPage;
	Morebits.wiki.actionCompleted.notice = 'অ্যাকশন সম্পূর্ণ, ব্যবহারকারীর আলাপ পাতা কয়েক সেকেন্ডের মধ্যে লোড করা হচ্ছে...';

	var wikipedia_page = new Morebits.wiki.page(userTalkPage, 'User talk page modification');
	wikipedia_page.setCallbackParameters(params);
	wikipedia_page.load(Twinkle.block.callback.main);
};

Twinkle.block.callback.getBlockNoticeWikitext = function(params) {
	var text = '{{', settings = Twinkle.block.blockPresetsInfo[params.template];
	if (!settings.nonstandard) {
		text += 'subst:' + params.template;
		if (params.article && settings.pageParam) {
			text += '|page=' + params.article;
		}
		if (params.dstopic) {
			text += '|topic=' + params.dstopic;
		}

		if (!/te?mp|^\s*$|min/.exec(params.expiry)) {
			if (params.indefinite) {
				text += '|indef=yes';
			} else if (!params.blank_duration && !new Morebits.date(params.expiry).isValid()) {
				// Block template wants a duration, not date
				text += '|time=' + params.expiry;
			}
		}

		if (!Twinkle.block.isRegistered && !params.hardblock) {
			text += '|anon=yes';
		}

		if (params.reason) {
			text += '|reason=' + params.reason;
		}
		if (params.disabletalk) {
			text += '|notalk=yes';
		}

		// Currently, all partial block templates are "standard"
		// Building the template, however, takes a fair bit of logic
		if (params.partial) {
			if (params.pagerestrictions.length || params.namespacerestrictions.length) {
				var makeSentence = function (array) {
					if (array.length < 3) {
						return array.join(' and ');
					}
					var last = array.pop();
					return array.join(', ') + ', and ' + last;

				};
				text += '|area=' + (params.indefinite ? 'certain ' : 'from certain ');
				if (params.pagerestrictions.length) {
					text += 'pages (' + makeSentence(params.pagerestrictions.map(function(p) {
						return '[[:' + p + ']]';
					}));
					text += params.namespacerestrictions.length ? ') and certain ' : ')';
				}
				if (params.namespacerestrictions.length) {
					// 1 => Talk, 2 => User, etc.
					var namespaceNames = params.namespacerestrictions.map(function(id) {
						return menuFormattedNamespaces[id];
					});
					text += '[[Wikipedia:Namespace|namespaces]] (' + makeSentence(namespaceNames) + ')';
				}
			} else if (params.area) {
				text += '|area=' + params.area;
			} else {
				if (params.noemail) {
					text += '|email=yes';
				}
				if (params.nocreate) {
					text += '|accountcreate=yes';
				}
			}
		}
	} else {
		text += params.template;
	}

	if (settings.sig) {
		text += '|sig=' + settings.sig;
	}
	return text + '}}';
};

Twinkle.block.callback.main = function twinkleblockcallbackMain(pageobj) {
	var params = pageobj.getCallbackParameters(),
		date = new Morebits.date(pageobj.getLoadTime()),
		messageData = params.messageData,
		text;

	params.indefinite = Morebits.string.isInfinity(params.expiry);

	if (Twinkle.getPref('blankTalkpageOnIndefBlock') && params.template !== 'uw-lblock' && params.indefinite) {
		Morebits.status.info('Info', 'Blanking talk page per preferences and creating a new talk page section for this month');
		text = date.monthHeader() + '\n';
	} else {
		text = pageobj.getPageText();

		var dateHeaderRegex = date.monthHeaderRegex(), dateHeaderRegexLast, dateHeaderRegexResult;
		while ((dateHeaderRegexLast = dateHeaderRegex.exec(text)) !== null) {
			dateHeaderRegexResult = dateHeaderRegexLast;
		}
		// If dateHeaderRegexResult is null then lastHeaderIndex is never checked. If it is not null but
		// \n== is not found, then the date header must be at the very start of the page. lastIndexOf
		// returns -1 in this case, so lastHeaderIndex gets set to 0 as desired.
		var lastHeaderIndex = text.lastIndexOf('\n==') + 1;

		if (text.length > 0) {
			text += '\n\n';
		}

		if (!dateHeaderRegexResult || dateHeaderRegexResult.index !== lastHeaderIndex) {
			Morebits.status.info('Info', 'Will create a new talk page section for this month, as none was found');
			text += date.monthHeader() + '\n';
		}
	}

	params.expiry = typeof params.template_expiry !== 'undefined' ? params.template_expiry : params.expiry;

	text += Twinkle.block.callback.getBlockNoticeWikitext(params);

	// build the edit summary
	var summary = messageData.summary;
	if (messageData.suppressArticleInSummary !== true && params.article) {
		summary += ' [[:' + params.article + ']] পাতায়';
	}
	summary += '।';

	pageobj.setPageText(text);
	pageobj.setEditSummary(summary);
	pageobj.setChangeTags(Twinkle.changeTags);
	pageobj.setWatchlist(Twinkle.getPref('watchWarnings'));
	pageobj.save();
};

Twinkle.addInitCallback(Twinkle.block, 'block');
})(jQuery);


// </nowiki>
